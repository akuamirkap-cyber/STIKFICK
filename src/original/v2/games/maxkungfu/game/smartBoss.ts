import { pcircle, pfontO, pline, px, type Ctx } from './pixel';
import { clamp, rnd } from './rng';
import type { Enemy, Pose } from './types';

/**
 * OTAK BOS PENEMBAK (pistol / rifle / shotgun / panah) — bermain seperti pemain ahli:
 *  - menjaga jarak ideal sambil memutari pemain, tidak berdiri diam
 *  - menghindar: melompat menyamping saat kamu membidik / menyerang dari dekat, atau saat dipukul beruntun
 *  - COMBO tanpa celah: rangkaian tembakan yang saling menyambung (sering spam), plus tendangan saat didekati
 *  - menghukum: begitu seranganmu selesai / meleset, dia langsung membalas
 */
type G = any;
export type SmartKind = 'pistol' | 'rifle' | 'shotgun' | 'bow';
type ActKind = 'tap' | 'fan' | 'dashfire' | 'spray' | 'sweep' | 'retreat' | 'nade' | 'rush' | 'double' | 'slide' | 'volley' | 'leap' | 'pin' | 'whip';
interface Act { kind: ActKind; t: number; shots: number; dir: number; aux: number; sx: number; sy: number; done: boolean }
export interface SmartAI {
  w: SmartKind; skill: number; tint: string; act: Act | null; cd: number; dodgeCd: number; dodgeT: number;
  strafe: number; strafeT: number; hurtN: number; hurtT: number; lastHp: number; last: ActKind | ''; chainN: number;
  recoil: number; rage: boolean; counter: boolean; laser: number; tellT: number; glow: number;
}
const S = (e: Enemy) => (e as unknown as { sm?: SmartAI }).sm;
export const isSmart = (e: Enemy) => !!S(e);

const RANGE: Record<SmartKind, [number, number]> = { pistol: [62, 112], rifle: [100, 165], shotgun: [26, 58], bow: [115, 190] };

export function makeSmart(e: Enemy, w: SmartKind, skill: number, tint: string) {
  Object.assign(e, { weapon: w === 'bow' ? 'none' : w, kbRes: 0.55, armor: false, speed: 104 + skill * 30, accessory: 'shades', eyeStyle: 'white' });
  (e as unknown as { sm: SmartAI }).sm = { w, skill, tint, act: null, cd: 0.7, dodgeCd: 0.4, dodgeT: 0, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: 1, hurtN: 0, hurtT: 0, lastHp: e.hp, last: '', chainN: 0, recoil: 0, rage: false, counter: false, laser: 0, tellT: 0, glow: 0 };
}

function setPose(e: Enemy, pose: Pose, dur: number) { e.pose = pose; e.poseT = 0; e.poseDur = Math.max(0.01, dur); }
function lerpAng(a: number, b: number, k: number) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; }
function lead(g: G, e: Enemy, sp: number, k = 0.9) {
  const p = g.player; const t = Math.hypot(p.x - e.x, p.y - e.y) / sp;
  return Math.atan2(p.y + p.vy * t * k - e.y, p.x + p.vx * t * k - e.x);
}

/** dipanggil di awal updateEnemy: serangan terputus kalau terkena stagger / jatuh */
export function smartPre(e: Enemy) {
  const A = S(e);
  if (!A) return;
  if (e.stagger > 0 || e.down > 0 || e.stun > 0 || e.z > 0) { A.act = null; A.laser = 0; A.tellT = 0; A.cd = Math.max(A.cd, 0.35); }
}
/** menghindar membuat serangan jarak dekat meleset */
export function smartOnHit(g: G, e: Enemy): boolean {
  const A = S(e);
  if (!A || A.dodgeT <= 0) return false;
  g.texts?.hit?.(e.x, e.y - 26, 'MELESET!', '#cfd8ff', 1, 0.5);
  return true;
}

export function aiSmart(g: G, e: Enemy, dt: number, d: number, ang: number) {
  const A = S(e)!, p = g.player;
  const rage = e.hp < e.maxHp * 0.5;
  if (rage && !A.rage) {
    A.rage = true; A.cd = 0.1; e.speed *= 1.14;
    g.say?.(`${e.name} MENGAMUK!`, '#ff3b2b', 2, 1.4); g.sfx?.announce?.(); g.flash?.('#ff3b2b', 0.25); g.shake?.(0.5);
    g.particles?.ring?.(e.x, e.y - 8, 3, 30, '#ff3b2b', 0.35, 2);
  }
  const R = A.rage ? 1.3 : 1;
  A.cd -= dt; A.dodgeCd -= dt; A.recoil = Math.max(0, A.recoil - dt * 5); A.glow = Math.max(0, A.glow - dt * 4);
  if (A.dodgeT > 0) A.dodgeT -= dt;
  A.strafeT -= dt;
  if (A.hurtT > 0) { A.hurtT -= dt; if (A.hurtT <= 0) A.hurtN = 0; }
  if (e.hp < A.lastHp - 0.01) { A.hurtN++; A.hurtT = 0.9; }
  A.lastHp = e.hp;
  e.state = 'chase';
  e.bodyAim = e.aim; e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;

  const dash = (a: number, power: number, tell = true) => {
    e.kx += Math.cos(a) * power; e.ky += Math.sin(a) * power;
    A.dodgeT = 0.24; A.dodgeCd = (1.0 - A.skill * 0.45) / R;
    setPose(e, 'dash', 0.24);
    g.particles?.smoke?.(e.x, e.y, 3, '#cfcfcf', 24, 0.3); g.sfx?.dash?.();
    g.addAfterimage?.({ x: e.x, y: e.y, facing: e.facing, aim: e.aim, scale: e.scale, color: A.tint }, A.tint);
    void tell;
  };

  // ---------------- BACA PEMAIN: hindar ----------------
  if (A.dodgeCd <= 0 && A.dodgeT <= 0 && (!A.act || A.act.t < 0.25)) {
    const gunsOut = p.weapon === 'pistol' || p.weapon === 'rifle' || p.weapon === 'shotgun' || p.weapon === 'bow';
    const pAim = p.aim, toBoss = Math.atan2(e.y - p.y, e.x - p.x);
    const aimedAt = gunsOut && (g.input?.mouse?.down || p.attackPhase !== 'none') && Math.abs(lerpAng(0, toBoss - pAim, 1)) < 0.22 && d < 280;
    const gdT = g.gd?.tech && !g.gd.tech.dmgless;
    const melee = (p.attackPhase === 'windup' || p.attackPhase === 'active' || gdT) && d < 54;
    const swarmed = A.hurtN >= 3;
    const react = Math.min(1, dt * 9) * (0.25 + A.skill * 0.7);
    if ((melee || swarmed) && Math.random() < (swarmed ? 1 : react * 1.4)) {
      A.act = null; A.laser = 0;
      dash(ang + Math.PI + (Math.random() < 0.5 ? 0.9 : -0.9), 330);
      A.counter = true; A.cd = 0.18; A.hurtN = 0;
      return;
    }
    if (aimedAt && Math.random() < react * 0.9) {
      A.act = null; A.laser = 0;
      dash(ang + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2), 300);
      A.counter = Math.random() < 0.7; A.cd = 0.15;
      return;
    }
  }
  if (A.dodgeT > 0 && !A.act) { e.pose = 'dash'; return; }

  // ---------------- AKSI BERJALAN ----------------
  const K = A.act;
  if (K) {
    K.t += dt * R;
    const aim = (a: number) => { e.aim = a; };
    const fire = (a: number, sp: number, dmg: number, col: string, kind: 'enemy' | 'sniper' = 'enemy') => {
      e.aim = a; g.fireEnemyBullet?.(e, a, sp, dmg, kind, col); A.recoil = 1; A.glow = 1;
    };
    const end = (cdBase: number) => {
      A.act = null; A.laser = 0; setPose(e, 'idle', 1);
      A.chainN++;
      // spam: sering langsung menyambung aksi berikutnya
      const far = d > RANGE[A.w][1] + 45;
      const chain = !far && A.chainN < 3 && Math.random() < (0.3 + A.skill * 0.35 + (A.rage ? 0.15 : 0));
      if (!chain) A.chainN = 0;
      A.cd = chain ? 0.03 : cdBase / R;
    };
    const orbit = (k: number) => {   // memutar sambil beraksi
      const pa = ang + A.strafe * Math.PI / 2;
      e.vx += Math.cos(pa) * e.speed * k; e.vy += Math.sin(pa) * e.speed * k; e.moving = true;
    };
    switch (K.kind) {
      case 'tap': {      // dua tembakan cepat akurat (pistol)
        const wind = 0.16;
        if (K.t < wind) { aim(lerpAng(e.aim, lead(g, e, 300), Math.min(1, dt * 14))); setPose(e, 'shoot', 0.3); A.laser = 0.4; }
        else { A.laser = 0; const due = Math.floor((K.t - wind) / 0.11) + 1; while (K.shots < due && K.shots < 2) { fire(lead(g, e, 300) + rnd(-0.02, 0.02), 300, 1, '#ff8a6a'); g.sfx?.enemyShot?.(); K.shots++; } if (K.t > wind + 0.4) end(0.38); }
        break;
      }
      case 'fan': {      // semprotan pistol: 8 tembakan sambil mengitari
        const wind = 0.2;
        if (K.t < wind) { aim(lerpAng(e.aim, ang, Math.min(1, dt * 10))); setPose(e, 'shoot', 0.3); A.laser = 0.4; }
        else { A.laser = 0; orbit(0.7); const n = A.rage ? 11 : 8, due = Math.floor((K.t - wind) / 0.075) + 1; while (K.shots < due && K.shots < n) { const sw = (K.shots / (n - 1) - 0.5) * 0.7; fire(lead(g, e, 280, 0.6) + sw * 0.5 + rnd(-0.04, 0.04), 280, 1, '#ffb27a'); K.shots++; } if (K.t > wind + n * 0.075 + 0.3) end(0.5); }
        break;
      }
      case 'dashfire': { // melompat menyamping lalu menembak 3x
        if (K.t < 0.02 && !K.done) { K.done = true; dash(ang + K.dir * Math.PI / 2, 300); }
        if (K.t > 0.16) { aim(lerpAng(e.aim, lead(g, e, 300), Math.min(1, dt * 14))); setPose(e, 'shoot', 0.3); const due = Math.floor((K.t - 0.16) / 0.1) + 1; while (K.shots < due && K.shots < 3) { fire(lead(g, e, 300), 300, 1, '#ff8a6a'); K.shots++; } if (K.t > 0.16 + 0.34 + 0.2) end(0.4); } else e.pose = 'dash';
        break;
      }
      case 'spray': {    // rifle: semburan otomatis 14 peluru, membidik sambil memutar
        const wind = 0.34;
        if (K.t < wind) { aim(lerpAng(e.aim, lead(g, e, 330), Math.min(1, dt * 10))); setPose(e, 'shoot', 0.4); A.laser = 1; }
        else { A.laser = 0; orbit(0.45); const n = A.rage ? 20 : 14, due = Math.floor((K.t - wind) / 0.058) + 1; while (K.shots < due && K.shots < n) { K.dir = lerpAng(K.dir, lead(g, e, 330, 0.8), 0.06); fire(K.dir + rnd(-0.05, 0.05), 330, 1, '#ffe08a'); if (K.shots % 3 === 0) g.shake?.(0.06); K.shots++; } if (K.t > wind + n * 0.058 + 0.35) end(0.55); }
        break;
      }
      case 'sweep': {    // rifle: sapuan kipas 16 peluru
        const wind = 0.36;
        if (K.t < wind) { aim(lerpAng(e.aim, ang, Math.min(1, dt * 10))); K.dir = e.aim - 0.75 * K.aux; setPose(e, 'shoot', 0.4); A.laser = 1; }
        else { const n = 16, due = Math.floor((K.t - wind) / 0.05) + 1; while (K.shots < due && K.shots < n) { fire(K.dir + K.aux * (K.shots / (n - 1)) * 1.5, 320, 1, '#ffd27a'); K.shots++; } if (K.t > wind + n * 0.05 + 0.35) end(0.6); }
        break;
      }
      case 'retreat': { // mundur kencang sambil menembak
        if (!K.done) { K.done = true; K.dir = ang + Math.PI; }
        e.vx += Math.cos(K.dir) * e.speed * 1.25; e.vy += Math.sin(K.dir) * e.speed * 1.25; e.moving = true;
        aim(lerpAng(e.aim, lead(g, e, 330), Math.min(1, dt * 12))); setPose(e, 'shoot', 0.3);
        const due = Math.floor(K.t / 0.1); while (K.shots < due && K.shots < 6) { fire(lead(g, e, 330) + rnd(-0.06, 0.06), 330, 1, '#ffe08a'); K.shots++; }
        if (K.t > 0.6) end(0.4);
        break;
      }
      case 'nade': {     // lempar 2 granat ke posisi prediksimu
        if (K.t < 0.3) { setPose(e, 'throw', 0.3); aim(lerpAng(e.aim, ang, Math.min(1, dt * 10))); }
        else { const due = Math.floor((K.t - 0.3) / 0.3) + 1; while (K.shots < due && K.shots < 2) { g.throwBomb?.(e, p.x + p.vx * 0.6 + rnd(-12, 12), p.y + p.vy * 0.6 + rnd(-10, 10), 2); g.sfx?.whoosh?.(); K.shots++; } if (K.t > 0.3 + 0.6 + 0.3) end(0.5); }
        break;
      }
      case 'rush': {     // shotgun: merunduk -> terjang -> blast
        if (K.t < 0.3) { setPose(e, 'crouch', 0.3); aim(lerpAng(e.aim, ang, Math.min(1, dt * 12))); A.laser = 0.5; A.tellT = K.t; }
        else if (K.t < 0.55) { A.laser = 0; if (!K.done) { K.done = true; K.dir = ang; g.sfx?.dash?.(); g.sfx?.whoosh?.(); A.dodgeT = 0.2; } e.vx += Math.cos(K.dir) * 330; e.vy += Math.sin(K.dir) * 330; e.moving = true; e.aim = K.dir; setPose(e, 'rush', 0.3); if (Math.random() < 0.6) g.particles?.smoke?.(e.x, e.y + 1, 1, '#b0b0b0', 28, 0.3); }
        else { K.kind = 'double'; K.t = 0; K.shots = 0; K.done = false; }
        break;
      }
      case 'slide': {    // shotgun: berguling menyamping lalu blast
        if (K.t < 0.02 && !K.done) { K.done = true; dash(ang + K.dir * Math.PI / 2 * 0.8 - K.dir * 0.2, 340); }
        if (K.t > 0.18) { K.kind = 'double'; K.t = 0; K.shots = 0; K.done = false; } else e.pose = 'dash';
        break;
      }
      case 'double': {   // dua blast berturut-turut dengan pompa
        const wind = 0.16;
        if (K.t < wind) { aim(lerpAng(e.aim, ang, Math.min(1, dt * 16))); setPose(e, 'shoot', 0.3); }
        else {
          const times = [wind, wind + 0.34, wind + 0.68];
          const nBlasts = A.rage ? 3 : 2;
          while (K.shots < nBlasts && K.t >= times[K.shots]) {
            const base = lerpAng(e.aim, lead(g, e, 260, 0.5), 0.7);
            for (let i = -3; i <= 3; i++) fire(base + i * 0.1 + rnd(-0.03, 0.03), 240 + rnd(-30, 30), 1, '#ffb8b8');
            g.sfx?.sniper?.(); g.shake?.(0.35); g.particles?.burst?.(e.x + Math.cos(base) * 9, e.y - 7, 8, '#ffcf6a', 140, 0.3, 1, 2);
            e.kx -= Math.cos(base) * 110; e.ky -= Math.sin(base) * 110; K.shots++;
          }
          if (K.shots >= nBlasts && K.t > times[nBlasts - 1] + 0.3) end(0.45);
        }
        break;
      }
      case 'volley': {   // panah: 5 panah beruntun
        const wind = 0.2;
        if (K.t < wind) { aim(lerpAng(e.aim, ang, Math.min(1, dt * 12))); setPose(e, 'bow' as Pose, 0.3); }
        else { orbit(0.5); const n = A.rage ? 7 : 5, due = Math.floor((K.t - wind) / 0.12) + 1; while (K.shots < due && K.shots < n) { fire(lead(g, e, 380, 0.9) + rnd(-0.03, 0.03), 380, 1, '#9ff0ff'); g.sfx?.bowRelease?.(0.7); K.shots++; } if (K.t > wind + n * 0.12 + 0.3) end(0.5); }
        break;
      }
      case 'leap': {     // panah: lompat mundur lalu kipas 3 panah
        if (K.t < 0.02 && !K.done) { K.done = true; dash(ang + Math.PI + K.dir * 0.5, 360); }
        if (K.t > 0.2) { aim(lerpAng(e.aim, ang, Math.min(1, dt * 14))); setPose(e, 'bow' as Pose, 0.3); if (K.shots < 1) { for (let i = -1; i <= 1; i++) fire(lead(g, e, 400, 0.9) + i * 0.2, 400, 1, '#9ff0ff'); g.sfx?.bowRelease?.(0.8); K.shots = 1; } if (K.t > 0.2 + 0.45) end(0.4); } else e.pose = 'dash';
        break;
      }
      case 'pin': {      // panah: bidikan tepat dengan garis laser, lalu 2 panah susulan
        const wind = 0.5;
        if (K.t < wind) { aim(lerpAng(e.aim, lead(g, e, 560, 0.9), Math.min(1, dt * (K.t < wind * 0.7 ? 12 : 1)))); setPose(e, 'bow' as Pose, 0.5); A.laser = 1; }
        else { A.laser = 0; const times = [wind, wind + 0.16, wind + 0.32]; while (K.shots < 3 && K.t >= times[K.shots]) { fire(lead(g, e, 560, 0.95) + rnd(-0.01, 0.01), 560, K.shots === 0 ? 2 : 1, '#ffffff', 'sniper'); g.sfx?.bowRelease?.(1); g.shake?.(0.15); K.shots++; } if (K.t > wind + 0.32 + 0.35) end(0.6); }
        break;
      }
      case 'whip': {     // didekati: tendang lalu menjauh
        if (K.t < 0.1) { setPose(e, 'kick', 0.25); aim(lerpAng(e.aim, ang, Math.min(1, dt * 18))); }
        else if (!K.done) { K.done = true; e.kx += Math.cos(e.aim) * 90; e.ky += Math.sin(e.aim) * 90; g.enemyMeleeHit?.(e, 1, 26, 1.5, true); g.sfx?.kick?.(); g.particles?.spark?.(e.x + Math.cos(e.aim) * 12, e.y - 8, 5, '#ffffff', e.aim, 1, 180); }
        if (K.t > 0.32) { dash(ang + Math.PI + (Math.random() < 0.5 ? 0.7 : -0.7), 300); A.counter = true; A.act = null; A.cd = 0.12; }
        break;
      }
    }
    return;
  }

  // ---------------- GERAK: jaga jarak + memutari ----------------
  const [lo, hi] = RANGE[A.w];
  e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 8));
  if (e.pose !== 'idle') setPose(e, 'idle', 1);
  if (A.strafeT <= 0) { A.strafeT = rnd(0.5, 1.3); A.strafe = Math.random() < 0.5 ? 1 : -1; }
  let mx = 0, my = 0;
  if (d > hi) { mx = Math.cos(ang); my = Math.sin(ang); }
  else if (d < lo) { mx = -Math.cos(ang) * 0.9; my = -Math.sin(ang) * 0.9; }
  mx += -Math.sin(ang) * A.strafe * 0.7; my += Math.cos(ang) * A.strafe * 0.7;
  const ml = Math.hypot(mx, my) || 1;
  const sp = e.speed * (d > hi + 70 ? 1.5 : 1);
  e.vx = (mx / ml) * sp; e.vy = (my / ml) * sp; e.moving = true;

  // ---------------- PILIH AKSI ----------------
  if (A.cd <= 0 && g.state === 'playing' && !(d > hi + 140)) {
    let kind: ActKind;
    if (A.w === 'shotgun') {
      kind = d < 36 ? 'double' : d > 90 ? 'rush' : (Math.random() < 0.5 ? 'rush' : 'slide');
    } else if (d < 30 && Math.random() < 0.7) kind = 'whip';
    else {
      const pool: [ActKind, number][] = A.w === 'pistol' ? [['tap', 30], ['fan', 28], ['dashfire', 30]]
        : A.w === 'rifle' ? [['spray', 34], ['sweep', 22], ['retreat', d < RANGE.rifle[0] + 30 ? 34 : 0], ['nade', d > 80 ? 14 : 4]]
        : [['volley', 32], ['leap', d < RANGE.bow[0] + 25 ? 30 : 0], ['pin', 24], ['volley', 6]];
      if (A.counter) { A.counter = false; if (A.w === 'pistol') pool.push(['dashfire', 40]); if (A.w === 'rifle') pool.push(['spray', 40]); if (A.w === 'bow') pool.push(['volley', 40]); }
      const filtered = pool.filter(([k]) => k !== A.last);
      let tot = 0; for (const [, w] of filtered) tot += w;
      let r = Math.random() * tot; kind = filtered[0][0];
      for (const [k, w] of filtered) { r -= w; if (r <= 0) { kind = k; break; } }
    }
    A.last = kind;
    A.act = { kind, t: 0, shots: 0, dir: Math.random() < 0.5 ? 1 : -1, aux: Math.random() < 0.5 ? 1 : -1, sx: e.x, sy: e.y, done: false };
    if (kind === 'sweep' || kind === 'spray') A.act.dir = ang;
  }
}

export function drawSmart(g: G, ctx: Ctx, e: Enemy, eOpts: unknown) {
  const A = S(e);
  if (!A) return;
  const aimHx = e.x + Math.cos(e.aim) * 9 * e.scale, aimHy = e.y - 7 * e.scale + Math.sin(e.aim) * 6;
  if (A.w === 'bow') (g as G).mirrorSystem.weaponSprite(g, ctx, eOpts, 'bow', e.aim, e.facing, A.recoil);
  if (A.laser > 0 && A.act) {
    const fl = Math.floor(g.time * 18) % 2, far = A.w === 'rifle' || A.w === 'bow' ? 250 : 170;
    for (let k = 14; k < far; k += 5) { const qx = aimHx + Math.cos(e.aim) * k, qy = aimHy + Math.sin(e.aim) * k; px(ctx, qx, qy, (k / 5 + fl) % 2 ? '#ff3b3b' : '#ffd0c0'); if (k % 15 === 0) px(ctx, qx, qy + 1, '#7a1010'); }
  }
  if (A.glow > 0) { ctx.globalAlpha = A.glow; pcircle(ctx, aimHx + Math.cos(e.aim) * 4, aimHy + Math.sin(e.aim) * 3, 3, '#ffe9a8'); ctx.globalAlpha = 1; }
  if (A.act && (A.act.kind === 'rush') && A.act.t < 0.3) { const al = 0.5 + 0.5 * Math.sin(g.time * 40); ctx.globalAlpha = al; pfontO(ctx, '!', e.x, e.y - 30 * e.scale, '#ff3b3b', '#000', 1, 'center'); ctx.globalAlpha = 1; }
  if (A.rage) { for (let i = 0; i < 3; i++) px(ctx, e.x + rnd(-8, 8), e.y - rnd(0, 22), Math.random() < 0.5 ? '#ff3b2b' : '#ff9a3a'); }
  if (A.dodgeT > 0) { ctx.globalAlpha = 0.35; pline(ctx, e.x - 6, e.y - 6, e.x + 6, e.y - 6, A.tint, 1); ctx.globalAlpha = 1; }
  void clamp;
}
