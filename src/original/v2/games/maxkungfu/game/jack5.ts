import { pcircle, pfontO, pline, prect, pring, px, type Ctx } from './pixel';
import { solvePose, type StickOpts } from './stick';
import { clamp, rnd } from './rng';
import { makeEnemy } from './enemies';
import type { Enemy, Pose } from './types';

/**
 * JACK-5 — robot raksasa ala Tekken.
 *  Masuk   : jatuh dari langit seperti METEOR (bola api + penanda mendarat), menghujam tanah (kawah, gelombang kejut,
 *            melukai yang di bawahnya), berlutut, lalu BANGUN dan pamer.
 *  Serang  : MACHINE-GUN ARM (tangan kanannya senapan: laser pembidik lalu rentetan peluru), JAB-JAB-STRAIGHT
 *            (pukulan beruntun), DOUBLE HAMMER (hantaman dua tangan, area), SHOULDER CHARGE (menyeruduk — kalau
 *            menabrak dinding dia pusing), dan di bawah 50% nyawa masuk OVERDRIVE: SWEEP FIRE (rentetan menyapu).
 */
type G = any;
type Act = { kind: 'burst' | 'sweep' | 'jabs' | 'hammer' | 'charge' | 'leap' | 'spin' | 'rockets' | 'clap' | 'boulder' | 'quake'; t: number; shots: number; hit: boolean; hits: number; dir: number; lock: number; px: number; py: number; walled: number; tx: number; ty: number; sx: number; sy: number; aux: number };
export interface JackState {
  phase: 'meteor' | 'land' | 'rise' | 'fight';
  t: number; tx: number; ty: number;
  act: Act | null; cd: number; last: string; rage: boolean; stunSelf: number;
  laser: number; ring: { x: number; y: number; r: number; t: number } | null; tellDir: number | null;
  muzzle: number; trailT: number; lift: number; stepT: number; heat: number; chain: number;
  guardT: number; parryCd: number; riposte: number; counter: boolean; strafe: number; strafeT: number; farT: number; flashT: number;
}
interface Mark { x: number; y: number; t: number; max: number; r: number }
const marks: Mark[] = [];
interface Crater { x: number; y: number; t: number; r: number; cracks: [number, number, number, number][] }
const craters: Crater[] = [];
let jackCount = 0;
export function resetJackFx() { craters.length = 0; marks.length = 0; rocks.length = 0; rain.length = 0; jackCount = 0; }
export const jackLift = (e: Enemy) => (J(e)?.lift ?? 0);

/** Jack-5 DIMATIKAN sementara (semua kode & data tetap ada). Nyalakan lagi: ubah ke true, atau buka game dengan ?jack=1 */
export const JACK_ENABLED: boolean = (() => { try { return new URLSearchParams(window.location.search).get('jack') === '1'; } catch { return false; } })();

const MET_DUR = 0.95, LAND_DUR = 0.95, RISE_DUR = 0.85;

function setPose(e: Enemy, pose: Pose, dur: number) { e.pose = pose; e.poseT = 0; e.poseDur = Math.max(0.01, dur); }
function lerpAng(a: number, b: number, k: number) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; }
const J = (e: Enemy) => (e as unknown as { jack?: JackState }).jack;
export const isJack = (e: Enemy) => !!J(e);

export function spawnJack(g: G, wave: number) {
  const p = g.player;
  const pos = g.randomFloorNear(p.x, p.y, 95, 165) ?? g.randomFloorNear(p.x, p.y, 60, 9999) ?? { x: p.x + 90, y: p.y };
  const e = makeEnemy('brute', undefined, pos.x, pos.y, g.levelN, false);
  const hp = 260 + 60 * jackCount + Math.max(0, wave - 1) * 12;
  jackCount++;
  Object.assign(e, {
    name: 'JACK-5', hp, maxHp: hp, maxStructure: hp * 0.9, structure: 0, scale: 3.2, r: 12, speed: 62, dmg: 2, kbRes: 0.88, armor: true,
    color: '#6f7a8c', color2: '#c8281e', accessory: 'helmet', eyeStyle: 'white', spawnT: 999, value: 400,
  });
  (e as unknown as { jack: JackState }).jack = { phase: 'meteor', t: 0, tx: pos.x, ty: pos.y, act: null, cd: 0.8, last: '', rage: false, stunSelf: 0, laser: 0, ring: null, tellDir: null, muzzle: 0, trailT: 0, lift: 0, stepT: 0, heat: 0, chain: 0, guardT: 0, parryCd: 1.2, riposte: 0, counter: false, strafe: 1, strafeT: 1, farT: 0, flashT: 0 };
  g.enemies.push(e);
  g.say?.('PERINGATAN: JACK-5 TURUN DARI LANGIT!', '#ff4b3b', 2, 1.9);
  g.shake?.(0.4);
  g.sfx?.announce?.(); g.sfx?.whoosh?.();
  g.flash?.('#ff4b3b', 0.12);
  return e;
}

/** fase masuk (meteor, mendarat, bangun). true = frame ini sudah diurus */
export function jackPre(g: G, e: Enemy, dt: number): boolean {
  const j = J(e);
  if (!j) return false;
  const p = g.player;
  if (j.phase === 'fight') {
    if (e.stagger > 0 || ((e.down > 0 || e.stun > 0) && !j.act)) { if (j.act) { j.act = null; j.cd = 0.9; j.laser = 0; j.ring = null; j.tellDir = null; j.lift = 0; } }
    else if (j.act) { e.stun = 0; e.down = 0; }   // armor super: serangan tidak bisa dipotong kecuali strukturnya hancur
    j.heat = Math.max(0, j.heat - dt * 0.8);
    if (Math.random() < (j.rage ? 0.5 : 0.18)) g.particles?.smoke?.(e.x - e.facing * 7, e.y - 20 * e.scale * 0.5, 1, j.rage ? '#c8281e' : '#9a9a9a', 22, 0.5);
    if (j.muzzle > 0) j.muzzle -= dt;
    return false;
  }
  e.vx = 0; e.vy = 0; e.x = j.tx; e.y = j.ty; e.z = 0; e.moving = false;
  e.spawnT = 999;
  j.t += dt;
  e.aim = Math.atan2(p.y - e.y, p.x - e.x); e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;
  if (j.phase === 'meteor') {
    const k = clamp(j.t / MET_DUR, 0, 1);
    const sx = j.tx + (1 - k) * 70, sy = j.ty - 20 - Math.pow(1 - k, 1.5) * 560;
    j.trailT -= dt;
    if (j.trailT <= 0) {
      j.trailT = 0.02;
      g.particles?.burst?.(sx + rnd(-4, 4), sy + rnd(-4, 4), 3, Math.random() < 0.5 ? '#ff9a3a' : '#ffd86a', 90, 0.45, 2, 3);
      g.particles?.smoke?.(sx + 8, sy - 6, 1, '#6b6b6b', 30, 0.5);
    }
    if (Math.floor((j.t - dt) * 9) !== Math.floor(j.t * 9)) g.sfx?.whoosh?.();
    g.shake?.(0.05 + k * 0.22);
    if (j.t >= MET_DUR) {
      j.phase = 'land'; j.t = 0;
      setPose(e, 'crouch', LAND_DUR);
      impact(g, e);
      g.slow?.(0.55, 0.3);
    }
    return true;
  }
  if (j.phase === 'land') {
    if (j.t > 0.3 && Math.random() < 0.35) g.particles?.smoke?.(e.x + rnd(-10, 10), e.y + 1, 1, '#8a8a8a', 24, 0.5);
    if (j.t >= LAND_DUR) { j.phase = 'rise'; j.t = 0; setPose(e, 'getup', RISE_DUR); g.sfx?.leverClack?.(); }
    return true;
  }
  if (j.phase === 'rise') {
    if (j.t > RISE_DUR * 0.55 && e.pose !== 'flex') { setPose(e, 'flex', 0.5); roar(g, e, 1.0); g.say?.('JACK-5', '#ff4b3b', 3, 1.5); }
    if (j.t >= RISE_DUR) { j.phase = 'fight'; j.t = 0; e.spawnT = 0; j.cd = 0.5; setPose(e, 'idle', 1); }
    return true;
  }
  return false;
}

function impact(g: G, e: Enemy) {
  const j = J(e)!, p = g.player;
  g.sfx?.explosion?.(); g.sfx?.slam?.();
  g.shake?.(1); g.flash?.('#ffffff', 0.55); g.zoomKick = Math.max(g.zoomKick ?? 0, 0.08);
  g.hitstop = Math.max(g.hitstop ?? 0, 0.09);
  g.particles?.shockwave?.(e.x, e.y, 70, '#ffd86a', 0.55);
  g.particles?.shockwave?.(e.x, e.y, 46, '#ffffff', 0.4);
  g.particles?.ring?.(e.x, e.y - 2, 3, 40, '#ff9a3a', 0.4, 2);
  g.particles?.burst?.(e.x, e.y - 3, 40, '#8a7a5a', 300, 0.8, 2, 3);
  g.particles?.burst?.(e.x, e.y - 3, 24, '#ff9a3a', 260, 0.6, 2, 3);
  g.particles?.smoke?.(e.x, e.y, 14, '#8a8a8a', 70, 0.9);
  g.splat?.(e.x, e.y, 10, '#2a2a2a', true);
  const cracks: [number, number, number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd(-0.15, 0.15); let cx = 0, cy = 0;
    const n = 3 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) { const na = a + rnd(-0.45, 0.45), l = rnd(5, 10); cracks.push([cx, cy, cx + Math.cos(na) * l, cy + Math.sin(na) * l * 0.62]); cx += Math.cos(na) * l; cy += Math.sin(na) * l * 0.62; }
  }
  craters.push({ x: e.x, y: e.y, t: 16, r: 15, cracks });
  if (craters.length > 4) craters.shift();
  const dp = Math.hypot(p.x - e.x, p.y - e.y);
  if (dp < 42) g.damagePlayer?.(2, Math.atan2(p.y - e.y, p.x - e.x), true);
  for (const o of g.enemies) {
    if (o === e || o.dead) continue;
    const d = Math.hypot(o.x - e.x, o.y - e.y);
    if (d < 60) { const a = Math.atan2(o.y - e.y, o.x - e.x); o.kx += Math.cos(a) * 420; o.ky += Math.sin(a) * 420; o.hp -= 6; o.flash = 0.2; if (o.hp <= 0) g.killEnemy?.(o, a, 400, false, false); }
  }
  void j;
}

/** raungan: gelombang kejut yang mendorong pemain, layar bergetar */
function roar(g: G, e: Enemy, power: number) {
  const p = g.player;
  g.sfx?.explosion?.(); g.sfx?.slam?.(); g.shake?.(0.9 * power); g.flash?.('#ffffff', 0.2 * power);
  g.zoomKick = Math.max(g.zoomKick ?? 0, 0.06 * power);
  for (let i = 0; i < 3; i++) g.particles?.shockwave?.(e.x, e.y, 50 + i * 28, i % 2 ? '#ff7a3a' : '#ffffff', 0.4 + i * 0.12);
  g.particles?.ring?.(e.x, e.y - 14, 4, 50, '#ffffff', 0.35, 2);
  g.particles?.burst?.(e.x, e.y - 2, 26, '#8a7a5a', 260, 0.7, 2, 3);
  g.particles?.smoke?.(e.x, e.y, 10, '#8a8a8a', 60, 0.8);
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (d < 110) { const a = Math.atan2(p.y - e.y, p.x - e.x); p.kx += Math.cos(a) * 260 * power; p.ky += Math.sin(a) * 260 * power; }
}

/** dipanggil dari damageEnemy: true = serangan DIPARRY (tidak ada damage) */
export function jackOnHit(g: G, e: Enemy, dir: number, dmg: number): boolean {
  const j = J(e);
  if (!j || j.phase !== 'fight') return false;
  if (j.flashT > 0 && dmg < 12) return true;   // sedang membalas: masih menahan
  if (j.guardT <= 0) return false;
  const p = g.player;
  const front = Math.abs(Math.atan2(Math.sin(dir + Math.PI - e.aim), Math.cos(dir + Math.PI - e.aim))) < 1.45;
  if (!front) return false;
  if (dmg >= 12) {
    // serangan berat menghancurkan guard-nya
    j.guardT = 0; j.stunSelf = 0.9; j.cd = 0.6; setPose(e, 'stagger', 0.9);
    g.say?.('GUARD BREAK!', '#ffd447', 2, 1.0); g.sfx?.slam?.(); g.flash?.('#ffd447', 0.2);
    g.particles?.burst?.(e.x, e.y - 14, 20, '#ffd447', 240, 0.5, 2, 2);
    return false;
  }
  j.guardT = 0; j.flashT = 0.3; j.riposte = 0.2; j.parryCd = j.rage ? 0.8 : 1.3;
  p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
  p.stunT = Math.max(p.stunT ?? 0, 0.18); p.fireCd = Math.max(p.fireCd ?? 0, 0.3);
  p.kx = -Math.cos(dir) * 300; p.ky = -Math.sin(dir) * 300;
  g.sfx?.parry?.(); g.sfx?.slam?.(); g.flash?.('#ffd27f', 0.2); g.shake?.(0.55); g.hitstop = Math.max(g.hitstop ?? 0, 0.08);
  g.particles?.ring?.(e.x, e.y - 14, 3, 30, '#ffd27f', 0.25, 2);
  g.particles?.spark?.(e.x - Math.cos(dir) * 8, e.y - 14, 16, '#ffffff', dir + Math.PI, 1.2, 260);
  g.say?.('JACK-5 PARRY!', '#ffd27f', 2, 0.8);
  return true;
}

interface Rock { x: number; y: number; z: number; vx: number; vy: number; vz: number; g: number; t: number; max: number; r: number; big: boolean }
const rocks: Rock[] = [];
const rain: { delay: number; x: number; y: number }[] = [];
function lobRock(_g: G, sx: number, sy: number, z0: number, tx: number, ty: number, T: number, big = false) {
  const G0 = 620;
  rocks.push({ x: sx, y: sy, z: z0, vx: (tx - sx) / T, vy: (ty - sy) / T, vz: (0.5 * G0 * T * T - z0) / T, g: G0, t: 0, max: T, r: big ? 6 : 4.5, big });
  marks.push({ x: tx, y: ty, t: T, max: T, r: big ? 26 : 20 });
}
/** dipanggil tiap frame dari game: batu yang dilempar / hujan batu */
export function stepJackFx(g: G, dt: number) {
  for (let i = rain.length - 1; i >= 0; i--) {
    const q = rain[i]; q.delay -= dt;
    if (q.delay <= 0) {
      const T = 0.85, z0 = 330;
      rocks.push({ x: q.x, y: q.y, z: z0, vx: 0, vy: 0, vz: 0, g: (2 * z0) / (T * T), t: 0, max: T, r: 5, big: false });
      marks.push({ x: q.x, y: q.y, t: T, max: T, r: 22 });
      rain.splice(i, 1);
    }
  }
  for (let i = rocks.length - 1; i >= 0; i--) {
    const r = rocks[i];
    r.t += dt; r.x += r.vx * dt; r.y += r.vy * dt; r.vz -= r.g * dt; r.z += r.vz * dt;
    if (Math.random() < 0.5) g.particles?.smoke?.(r.x, r.y - r.z, 1, '#6a6a6a', 20, 0.3);
    if (r.z <= 0 || r.t > r.max + 0.2) {
      rocks.splice(i, 1);
      blast(g, r.x, r.y, r.big ? 34 : 28, 2, false);
      g.particles?.burst?.(r.x, r.y - 2, 12, '#7a7a82', 200, 0.5, 2, 3);
    }
  }
}
export function drawJackAir(ctx: Ctx) {
  for (const r of rocks) {
    ctx.globalAlpha = 0.35; pcircle(ctx, r.x, r.y + 1, r.r * (1 - Math.min(0.5, r.z / 400)), '#000000'); ctx.globalAlpha = 1;
    const y = r.y - r.z;
    pcircle(ctx, r.x, y, r.r + 1, '#0b0c10'); pcircle(ctx, r.x, y, r.r, '#4a4f5c'); pcircle(ctx, r.x - 1, y - 1, r.r * 0.6, '#7d8496');
    px(ctx, r.x - 2, y - 2, '#c4cadb'); px(ctx, r.x + 2, y + 1, '#2a2d36');
  }
}

function pickAct(g: G, e: Enemy, d: number): Act['kind'] {
  const j = J(e)!;
  const table: [Act['kind'], number][] = d < 56
    ? [['hammer', 26], ['jabs', 22], ['clap', 18], ['spin', 14], ['leap', 10], ['quake', 10]]
    : d < 120
      ? [['charge', 24], ['boulder', 20], ['leap', 18], ['quake', 12], ['burst', 10], ['clap', 8], ['jabs', 8]]
      : [['boulder', 28], ['leap', 26], ['charge', 22], ['burst', 14], ['quake', 10]];
  const pool = table.filter(([k]) => k !== j.last);
  let total = 0; for (const [, w] of pool) total += w;
  let r = Math.random() * total, k: Act['kind'] = pool[0][0];
  for (const [kk, w] of pool) { r -= w; if (r <= 0) { k = kk; break; } }
  if (j.rage && k === 'burst' && Math.random() < 0.55) k = 'sweep';
  void g;
  return k;
}

function blast(g: G, x: number, y: number, r: number, dmg: number, big = false) {
  const p = g.player;
  g.sfx?.slam?.(); g.sfx?.explosion?.(); g.shake?.(big ? 1 : 0.8); g.hitstop = Math.max(g.hitstop ?? 0, 0.05);
  g.particles?.shockwave?.(x, y, r, '#ffffff', 0.35);
  g.particles?.shockwave?.(x, y, r * 0.65, '#ff7a3a', 0.3);
  g.particles?.ring?.(x, y, 2, r * 0.8, '#ff9a3a', 0.3, 2);
  g.particles?.burst?.(x, y - 2, big ? 34 : 22, '#8a7a5a', 260, 0.7, 2, 3);
  g.particles?.burst?.(x, y - 2, 14, '#ff7a3a', 220, 0.5, 2, 2);
  g.particles?.smoke?.(x, y, big ? 10 : 6, '#8a8a8a', 55, 0.7);
  craters.push({ x, y, t: big ? 9 : 6, r: big ? 11 : 8, cracks: [] });
  if (craters.length > 6) craters.shift();
  if (Math.hypot(p.x - x, p.y - y) < r + p.r) g.damagePlayer?.(dmg, Math.atan2(p.y - y, p.x - x), true);
  for (const o of g.enemies) {
    if (o.dead || (o as unknown as { jack?: unknown }).jack) continue;
    const dd = Math.hypot(o.x - x, o.y - y);
    if (dd < r) { const a = Math.atan2(o.y - y, o.x - x); o.kx += Math.cos(a) * 380; o.ky += Math.sin(a) * 380; }
  }
}

/** AI tempur (dipanggil menggantikan aiBasic) */
export function aiJack(g: G, e: Enemy, dt: number, d: number, ang: number) {
  const j = J(e)!, p = g.player;
  if (!j.rage && e.hp < e.maxHp * 0.5) {
    j.rage = true; j.cd = 0.5;
    g.say?.('JACK-5 HULK OUT!!', '#ff3b3b', 3, 2.0); g.sfx?.announce?.(); g.flash?.('#ff3b3b', 0.5);
    roar(g, e, 1.6);
    e.scale = 3.65; e.speed *= 1.15;
    g.particles?.burst?.(e.x, e.y - 14, 34, '#ff3b3b', 240, 0.6, 2, 3);
    setPose(e, 'flex', 0.9);
    j.act = null; j.lift = 0;
    j.stunSelf = 1.0;
    return;
  }
  if (j.stunSelf > 0) {
    j.stunSelf -= dt;
    if (e.pose !== 'flex') setPose(e, 'hurt', 0.5);
    if (Math.random() < 0.3) g.particles?.smoke?.(e.x + rnd(-8, 8), e.y - 16, 1, '#9a9a9a', 20, 0.4);
    return;
  }
  const spd = j.rage ? 1.3 : 1;
  const A = j.act;
  j.parryCd -= dt; if (j.flashT > 0) j.flashT -= dt;
  // ---- GUARD aktif: berdiri menahan, menunggu serangan masuk untuk diparry
  if (!A && j.guardT > 0) {
    j.guardT -= dt;
    e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 10));
    e.pose = 'parry'; e.poseT = 0.5; e.vx = 0; e.vy = 0; e.moving = false;
    if (j.guardT <= 0) { j.cd = Math.min(j.cd, 0.25); setPose(e, 'idle', 1); }
    return;
  }
  if (!A) {
    // ---- BALASAN setelah parry
    if (j.riposte > 0) { j.riposte -= dt; if (j.riposte <= 0) { j.counter = true; j.cd = 0; } else { e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 10)); e.pose = 'parry'; return; } }
    e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 7));
    if (e.pose !== 'idle') setPose(e, 'idle', 1);
    // ---- MEMBACA PEMAIN: serangan masuk -> guard (parry), melenceng -> hukum, jaga jarak jauh terus -> terjang
    const gdTech = g.gd?.tech && !g.gd.tech.dmgless && g.gd.tech.id !== 'flourish';
    const pAtk = p.attackPhase === 'windup' || p.attackPhase === 'active' || !!gdTech || p.dashT > 0 && d < 40;
    const pRecover = p.attackPhase === 'recover' || (g.gd?.tech && g.gd.tt > g.gd.tech.hit[1] + 0.05);
    const front = Math.abs(lerpAng(0, ang - e.aim, 1)) < 1.2;
    if (pAtk && d < 82 && j.parryCd <= 0 && front && Math.random() < Math.min(1, dt * 7) * (j.rage ? 0.95 : 0.78)) {
      j.guardT = 0.36; j.parryCd = 0.6; e.pose = 'parry'; e.poseT = 0.5; j.cd = Math.max(j.cd, 0.2);
      g.particles?.ring?.(e.x, e.y - 14, 3, 22, '#ffd27f', 0.25, 1); g.sfx?.leverClack?.();
      return;
    }
    if (pRecover && d < 84 && j.cd > 0.15 && g.state === 'playing') j.cd = 0.1;
    if (d > 135) j.farT += dt; else j.farT = Math.max(0, j.farT - dt * 2);
    if (d > 44) {
      const sp = e.speed * (j.rage ? 1.3 : 1) * (d > 150 ? 1.6 : 1);
      e.vx = Math.cos(ang) * sp; e.vy = Math.sin(ang) * sp; e.moving = true;
      // memutar mengelilingi pemain di jarak menengah (tidak lurus seperti robot bodoh)
      j.strafeT -= dt; if (j.strafeT <= 0) { j.strafeT = rnd(0.7, 1.5); j.strafe = Math.random() < 0.5 ? 1 : -1; }
      if (d < 125) { e.vx += -Math.sin(ang) * sp * 0.55 * j.strafe; e.vy += Math.cos(ang) * sp * 0.55 * j.strafe; }
      j.stepT += dt * (sp / 58);
      if (j.stepT > 0.42) { j.stepT = 0; g.shake?.(0.26); g.sfx?.land?.(); g.sfx?.slam?.(); g.particles?.smoke?.(e.x + rnd(-8, 8), e.y + 2, 3, '#8a8a8a', 30, 0.45); g.particles?.shockwave?.(e.x, e.y + 2, 20, '#ffffff', 0.15); if (Math.random() < 0.3) craters.push({ x: e.x, y: e.y + 2, t: 4, r: 5, cracks: [] }); }
    }
    j.cd -= dt;
    if (j.cd <= 0 && g.state === 'playing') {
      let kind = pickAct(g, e, d);
      if (j.counter) { kind = d < 52 ? (Math.random() < 0.5 ? 'jabs' : 'clap') : 'charge'; j.counter = false; }
      else if (j.farT > 2.4) { kind = Math.random() < 0.5 ? 'leap' : 'charge'; j.farT = 0; }
      j.last = kind;
      j.act = { kind, t: 0, shots: 0, hit: false, hits: 0, dir: ang, lock: ang, px: e.x, py: e.y, walled: 0, tx: p.x, ty: p.y, sx: e.x, sy: e.y, aux: 0 };
      if (kind === 'burst' || kind === 'sweep') { setPose(e, 'shoot', 0.6); j.laser = 1; g.sfx?.leverClack?.(); }
      else if (kind === 'hammer') { setPose(e, 'windup', 0.7 / spd); g.sfx?.axeSwing?.(); }
      else if (kind === 'charge') { setPose(e, 'crouch', 0.5 / spd); j.tellDir = ang; g.sfx?.whoosh?.(); }
      else if (kind === 'jabs') setPose(e, 'jab', 0.28);
      else if (kind === 'leap') { setPose(e, 'crouch', 0.55 / spd); g.sfx?.whoosh?.(); }
      else if (kind === 'spin') { setPose(e, 'windup', 0.4 / spd); g.sfx?.axeSwing?.(); }
      else if (kind === 'rockets') { setPose(e, 'shoot', 0.7); g.sfx?.leverClack?.(); }
      else if (kind === 'clap') { setPose(e, 'windup', 0.55 / spd); g.sfx?.axeSwing?.(); }
      else if (kind === 'boulder') { setPose(e, 'grab', 0.7 / spd); g.sfx?.pickup?.(); g.particles?.burst?.(e.x + Math.cos(ang) * 14, e.y + 2, 14, '#8a7a5a', 150, 0.5, 2, 3); }
      else if (kind === 'quake') { setPose(e, 'windup', 0.65 / spd); g.sfx?.axeSwing?.(); }
      const nm: Record<string, string> = { burst: 'MACHINE GUN!', sweep: 'SWEEP FIRE!', hammer: 'DOUBLE HAMMER!', charge: 'SHOULDER CHARGE!', jabs: '1-1-2-UPPER!', leap: 'SKYFALL STOMP!', spin: 'TURBINE SPIN!', rockets: 'MISSILE BARRAGE!', clap: 'THUNDERCLAP!', boulder: 'HULK SMASH!', quake: 'EARTHQUAKE!' };
      g.texts?.hit?.(e.x, e.y - 34 * e.scale, nm[kind], '#ff6a4a', 1, 0.8);
    }
    return;
  }
  A.t += dt * spd;
  const endAct = (cd: number) => {
    j.act = null; j.laser = 0; j.ring = null; j.tellDir = null; j.lift = 0; setPose(e, 'idle', 1);
    // tekanan beruntun: kadang langsung menyambung serangan berikutnya
    j.cd = Math.random() < (j.rage ? 0.45 : 0.22) ? 0.05 : cd;
  };
  switch (A.kind) {
    case 'burst': case 'sweep': {
      const sweep = A.kind === 'sweep';
      const wind = 0.6, n = sweep ? 18 : j.rage ? 12 : 8, gap = sweep ? 0.06 : 0.078;
      if (A.t < wind) {
        if (A.t < wind * 0.78) e.aim = lerpAng(e.aim, Math.atan2(p.y + p.vy * 0.25 - e.y, p.x + p.vx * 0.25 - e.x), Math.min(1, dt * 10));
        if (sweep) A.lock = e.aim - 0.9; else A.lock = e.aim;
        j.laser = 1;
      } else {
        j.laser = sweep ? 1 : 0;
        const due = Math.floor((A.t - wind) / gap) + 1;
        const dToP = Math.atan2(p.y - e.y, p.x - e.x);
        if (!sweep) A.lock = lerpAng(A.lock, dToP, Math.min(1, dt * 1.5));
        while (A.shots < due && A.shots < n) {
          const volley = A.shots % 3 === 0;
          const a = sweep ? A.lock + (A.shots / (n - 1)) * 1.8 : A.lock + rnd(-0.06, 0.06);
          e.aim = a;
          g.fireEnemyBullet?.(e, a, sweep ? 280 : 340, 1, 'enemy', '#ffd86a');
          if (j.rage && !sweep && volley) { g.fireEnemyBullet?.(e, a + 0.2, 300, 1, 'enemy', '#ff9a5a'); g.fireEnemyBullet?.(e, a - 0.2, 300, 1, 'enemy', '#ff9a5a'); }
          j.muzzle = 0.06; j.heat = Math.min(1, j.heat + 0.12);
          e.kx -= Math.cos(a) * 6; e.ky -= Math.sin(a) * 4;
          if (A.shots % 2 === 0) g.shake?.(0.08);
          A.shots++;
        }
        if (A.t > wind + n * gap + 0.45) endAct(j.rage ? 0.6 : 0.9);
      }
      break;
    }
    case 'jabs': {
      const times = [0.28, 0.5, 0.72, 1.18];
      if (A.t < 0.28 && d > 38) { e.vx = Math.cos(ang) * e.speed * 3.4; e.vy = Math.sin(ang) * e.speed * 3.4; e.moving = true; }
      if (A.hits < 4 && A.t < times[A.hits]) e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 12));
      if (A.hits < 4 && A.t >= times[A.hits]) {
        const last = A.hits === 3;
        setPose(e, last ? 'uppercut' : A.hits % 2 ? 'cross' : 'jab', last ? 0.45 : 0.2);
        e.kx += Math.cos(e.aim) * (last ? 170 : 100); e.ky += Math.sin(e.aim) * (last ? 170 : 100);
        g.enemyMeleeHit?.(e, last ? 3 : 1, 38, 1.5, last);
        g.sfx?.whoosh?.(); if (last) { g.sfx?.slam?.(); g.shake?.(0.5); g.particles?.shockwave?.(e.x + Math.cos(e.aim) * 18, e.y, 28, '#ffffff', 0.25); }
        g.particles?.spark?.(e.x + Math.cos(e.aim) * 18, e.y - 10 + Math.sin(e.aim) * 8, 5, '#ffffff', e.aim, 1, 180);
        A.hits++;
      }
      if (A.t > 1.7) endAct(j.rage ? 0.55 : 0.9);
      break;
    }
    case 'hammer': {
      const wind = 0.7;
      const cx = e.x + Math.cos(e.aim) * 38, cy = e.y + Math.sin(e.aim) * 26;
      if (A.t < wind) {
        if (A.t < wind * 0.6) e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 8));
        j.ring = { x: cx, y: cy, r: 62, t: A.t / wind };
      } else if (!A.hit) {
        A.hit = true; j.ring = null;
        setPose(e, 'hammer', 0.4);
        blast(g, cx, cy, 64, 3, true);
        for (let i = 0; i < 3; i++) { const a2 = Math.random() * Math.PI * 2; lobRock(g, cx, cy, 6, cx + Math.cos(a2) * rnd(40, 90), cy + Math.sin(a2) * rnd(30, 60), 0.7); }
        if (j.rage) { for (let i = 0; i < 8; i++) g.fireEnemyBullet?.(e, (i / 8) * Math.PI * 2, 170, 1, 'enemy', '#ff6a4a'); }
      }
      if (A.t > 1.35) endAct(j.rage ? 0.6 : 1.0);
      break;
    }
    case 'spin': {
      const wind = 0.4, dur = 0.85;
      if (A.t < wind) { e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 6)); }
      else if (A.t < wind + dur) {
        if (A.t - dt * spd < wind) { setPose(e, 'spin', dur); g.sfx?.axeSwing?.(); }
        e.aim += dt * 18;
        e.vx = Math.cos(ang) * 78; e.vy = Math.sin(ang) * 78; e.moving = true;
        if (Math.floor((A.t - dt * spd - wind) * 7) !== Math.floor((A.t - wind) * 7)) {
          g.sfx?.whoosh?.(); g.shake?.(0.2);
          g.particles?.shockwave?.(e.x, e.y, 36, '#ffffff', 0.18);
          g.particles?.lines?.(e.x, e.y - 10, 4, 'rgba(255,255,255,0.7)', e.aim, 200);
          if (Math.hypot(p.x - e.x, p.y - e.y) < 38 + p.r) g.damagePlayer?.(2, Math.atan2(p.y - e.y, p.x - e.x), A.hits++ >= 1);
        }
      } else endAct(j.rage ? 0.6 : 1.0);
      break;
    }
    case 'charge': {
      const wind = 0.5, dash = 0.66;
      if (A.t < wind) {
        if (A.t < wind * 0.75) { j.tellDir = ang; A.dir = ang; e.aim = ang; }
        if (Math.random() < 0.4) g.particles?.smoke?.(e.x - Math.cos(A.dir) * 8, e.y + 1, 1, '#a0a0a0', 25, 0.3);
      } else if (A.t < wind + dash) {
        if (A.t - dt * spd < wind) { setPose(e, 'rush', dash); j.tellDir = null; g.sfx?.dash?.(); g.sfx?.whoosh?.(); A.px = e.x; A.py = e.y; g.shake?.(0.3); }
        const sp = 330 * (j.rage ? 1.15 : 1);
        e.vx = Math.cos(A.dir) * sp; e.vy = Math.sin(A.dir) * sp; e.moving = true; e.aim = A.dir;
        g.shake?.(0.1);
        if (Math.random() < 0.7) g.particles?.smoke?.(e.x, e.y + 1, 1, '#b0b0b0', 30, 0.3);
        if (Math.random() < 0.6) g.particles?.spark?.(e.x - Math.cos(A.dir) * 8, e.y + 1, 2, '#ffd86a', A.dir + Math.PI, 0.6, 140);
        if (!A.hit && Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r + 8) { A.hit = true; g.damagePlayer?.(2, A.dir, true); g.sfx?.slam?.(); g.shake?.(0.6); }
        const moved = Math.hypot(e.x - A.px, e.y - A.py); A.px = e.x; A.py = e.y;
        if (moved < sp * dt * 0.3 && A.t > wind + 0.12) A.walled++; else A.walled = 0;
        if (A.walled >= 2) {
          j.act = null; j.cd = 1.0; j.stunSelf = 1.2; j.laser = 0; setPose(e, 'hurt', 1.2);
          blast(g, e.x + Math.cos(A.dir) * 10, e.y, 30, 1);
          g.texts?.hit?.(e.x, e.y - 40, 'CRASH! SERANG DIA!', '#ffd447', 1, 1);
        }
      } else endAct(j.rage ? 0.6 : 1.0);
      break;
    }
    case 'leap': {
      const wind = 0.55, air = 0.62;
      if (A.t < wind) {
        if (A.t < wind * 0.8) { A.tx = p.x + p.vx * 0.35; A.ty = p.y + p.vy * 0.35; }
        j.ring = { x: A.tx, y: A.ty, r: 66, t: A.t / wind };
        if (Math.random() < 0.3) g.particles?.smoke?.(e.x + rnd(-6, 6), e.y + 1, 1, '#a0a0a0', 25, 0.3);
      } else if (A.t < wind + air) {
        const u = (A.t - wind) / air;
        if (A.t - dt * spd < wind) { A.sx = e.x; A.sy = e.y; g.sfx?.dash?.(); g.sfx?.whoosh?.(); g.particles?.burst?.(e.x, e.y, 14, '#8a7a5a', 160, 0.5, 2, 3); }
        j.lift = Math.sin(Math.PI * u) * 120;
        setPose(e, u < 0.55 ? 'jump' : 'kneedrop', 0.3);
        e.vx = (A.tx - A.sx) / air; e.vy = (A.ty - A.sy) / air; e.moving = true;
        if (Math.random() < 0.7) g.particles?.smoke?.(e.x, e.y - j.lift * 0.4, 1, '#ff7a3a', 30, 0.35);
      } else if (!A.hit) {
        A.hit = true; j.lift = 0; j.ring = null;
        setPose(e, 'crouch', 0.5);
        blast(g, e.x, e.y, 72, 3, true);
        roar(g, e, 0.7);
        g.slow?.(0.22, 0.4);
        for (let i = 0; i < 4; i++) { const a2 = Math.random() * Math.PI * 2; lobRock(g, e.x, e.y, 6, e.x + Math.cos(a2) * rnd(50, 110), e.y + Math.sin(a2) * rnd(30, 70), 0.75); }
        if (j.rage) for (let i = 0; i < 10; i++) g.fireEnemyBullet?.(e, (i / 10) * Math.PI * 2 + 0.2, 190, 1, 'enemy', '#ff6a4a');
      } else if (A.t > wind + air + 0.6) endAct(j.rage ? 0.6 : 1.0);
      break;
    }
    case 'clap': {
      const wind = 0.55;
      if (A.t < wind) { e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 6)); j.ring = { x: e.x, y: e.y + 2, r: 74, t: A.t / wind }; }
      else if (!A.hit) {
        A.hit = true; j.ring = null; setPose(e, 'palm', 0.4);
        roar(g, e, 1.1);
        g.particles?.shockwave?.(e.x, e.y, 80, '#ffffff', 0.4);
        if (Math.hypot(p.x - e.x, p.y - e.y) < 74 + p.r) { const a = Math.atan2(p.y - e.y, p.x - e.x); g.damagePlayer?.(2, a, true); p.kx += Math.cos(a) * 420; p.ky += Math.sin(a) * 420; }
        for (const o of g.enemies) { if (o.dead || (o as unknown as { jack?: unknown }).jack) continue; const dd = Math.hypot(o.x - e.x, o.y - e.y); if (dd < 90) { const a = Math.atan2(o.y - e.y, o.x - e.x); o.kx += Math.cos(a) * 520; o.ky += Math.sin(a) * 520; } }
      }
      if (A.t > 1.05) endAct(j.rage ? 0.55 : 0.95);
      break;
    }
    case 'boulder': {
      const wind = 0.7, n = j.rage ? 3 : 1;
      if (A.t < wind) { e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 6)); if (Math.random() < 0.4) g.particles?.burst?.(e.x + Math.cos(e.aim) * 14, e.y + 2, 2, '#8a7a5a', 90, 0.4, 2, 3); }
      else {
        const due = Math.floor((A.t - wind) / 0.28) + 1;
        while (A.shots < due && A.shots < n) {
          setPose(e, 'throw', 0.35); g.sfx?.whoosh?.(); g.sfx?.axeSwing?.(); g.shake?.(0.3);
          lobRock(g, e.x + Math.cos(e.aim) * 10, e.y - 4, 46 * (e.scale / 3.2), p.x + p.vx * 0.55 + rnd(-14, 14), p.y + p.vy * 0.55 + rnd(-10, 10), 0.85, true);
          A.shots++;
        }
        if (A.t > wind + n * 0.28 + 0.6) endAct(j.rage ? 0.55 : 0.95);
      }
      break;
    }
    case 'quake': {
      const wind = 0.65;
      if (A.t < wind) { j.ring = { x: e.x, y: e.y + 2, r: 84, t: A.t / wind }; }
      else if (!A.hit) {
        A.hit = true; j.ring = null; setPose(e, 'hammer', 0.5);
        blast(g, e.x, e.y + 4, 84, 2, true); roar(g, e, 1.2);
        const n = j.rage ? 11 : 7;
        for (let i = 0; i < n; i++) { const a2 = Math.random() * Math.PI * 2, rr = rnd(0, 150); rain.push({ delay: i * 0.1 + rnd(0, 0.12), x: clamp(p.x + Math.cos(a2) * rr * 0.6 + (i % 3 === 0 ? 0 : 0), p.x - 140, p.x + 140), y: clamp(p.y + Math.sin(a2) * rr * 0.45, p.y - 100, p.y + 100) }); }
      }
      if (A.t > 1.7) endAct(j.rage ? 0.6 : 1.0);
      break;
    }
    case 'rockets': {
      const wind = 0.7, n = j.rage ? 6 : 4, gap = 0.2;
      if (A.t < wind) { e.aim = lerpAng(e.aim, ang, Math.min(1, dt * 6)); j.heat = Math.min(1, j.heat + dt); }
      else {
        const due = Math.floor((A.t - wind) / gap) + 1;
        while (A.shots < due && A.shots < n) {
          const tx = p.x + p.vx * 0.5 + rnd(-30, 30), ty = p.y + p.vy * 0.5 + rnd(-22, 22);
          g.throwBomb?.(e, tx, ty, 2);
          marks.push({ x: tx, y: ty, t: 0.9, max: 0.9, r: 20 });
          j.muzzle = 0.08; g.sfx?.enemyShot?.(); g.shake?.(0.1);
          g.particles?.burst?.(e.x, e.y - 18, 5, '#c9d2e0', 80, 0.5, 1, 2);
          A.shots++;
        }
        if (A.t > wind + n * gap + 0.9) endAct(j.rage ? 0.6 : 1.0);
      }
      break;
    }
  }
}

// ----------------------------------------------------------------------------- gambar
/** meteor di udara + penanda mendarat. true = jangan gambar sosok biasa */
export function drawJackEntrance(g: G, ctx: Ctx, e: Enemy): boolean {
  const j = J(e);
  if (!j || j.phase !== 'meteor') return false;
  const k = clamp(j.t / MET_DUR, 0, 1);
  // penanda mendarat di tanah
  const pulse = 0.6 + 0.4 * Math.sin(g.time * 22);
  ctx.globalAlpha = 0.35 + 0.4 * k;
  pcircle(ctx, j.tx, j.ty, 5 + 10 * k, 'rgba(255,40,30,0.35)');
  ctx.globalAlpha = pulse;
  pring(ctx, j.tx, j.ty, 28 - 12 * k, '#ff3b2b', 1);
  pring(ctx, j.tx, j.ty, 42 * (1 - k) + 14, '#ffd86a', 1);
  pline(ctx, j.tx - 6, j.ty, j.tx + 6, j.ty, '#ff3b2b', 1); pline(ctx, j.tx, j.ty - 4, j.tx, j.ty + 4, '#ff3b2b', 1);
  ctx.globalAlpha = 1;
  // bola api
  const sx = j.tx + (1 - k) * 70, sy = j.ty - 20 - Math.pow(1 - k, 1.5) * 560;
  for (let i = 10; i >= 1; i--) {
    const t2 = i * 0.012;
    const kk = clamp(k - t2, 0, 1);
    const tx = j.tx + (1 - kk) * 70, ty = j.ty - 20 - Math.pow(1 - kk, 1.5) * 560;
    ctx.globalAlpha = 0.5 - i * 0.04;
    pcircle(ctx, tx, ty, 9 - i * 0.6, i % 2 ? '#ff7a2a' : '#ffb347');
  }
  ctx.globalAlpha = 1;
  pcircle(ctx, sx, sy, 10, '#ff5a1a');
  pcircle(ctx, sx, sy, 7.5, '#ffb347');
  pcircle(ctx, sx, sy, 5, '#ffe9a8');
  // sosok baja meringkuk di dalam api
  pcircle(ctx, sx, sy + 1, 3.5, '#aab4c4');
  pcircle(ctx, sx - 1, sy, 1.2, '#2d6bd8');
  for (let i = 0; i < 6; i++) { const a = g.time * 14 + i * 1.05; px(ctx, sx + Math.cos(a) * 13, sy + Math.sin(a) * 9, '#ffffff'); }
  return true;
}

export function drawJackGround(ctx: Ctx) {
  for (const c of craters) c.t -= 0.016;
  for (let i = craters.length - 1; i >= 0; i--) if (craters[i].t <= 0) craters.splice(i, 1);
  for (const c of craters) {
    const a = clamp(c.t / 3, 0, 1);
    ctx.globalAlpha = a * 0.8;
    pcircle(ctx, c.x, c.y + 1, c.r, '#0a0a0c');
    pcircle(ctx, c.x, c.y, c.r - 3, '#17181c');
    ctx.globalAlpha = a * 0.5;
    pring(ctx, c.x, c.y, c.r + 1, '#3a3a40', 1);
    ctx.globalAlpha = a * 0.9;
    for (const s of c.cracks) pline(ctx, c.x + s[0], c.y + s[1], c.x + s[2], c.y + s[3], '#0a0a0c', 1);
  }
  // penanda jatuhnya rudal: lingkaran merah yang menyempit
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i]; m.t -= 0.016;
    if (m.t <= 0) { marks.splice(i, 1); continue; }
    const k = m.t / m.max;
    ctx.globalAlpha = 0.25 + 0.6 * (1 - k);
    pcircle(ctx, m.x, m.y, m.r * (1 - k) * 0.6, 'rgba(255,40,30,0.35)');
    ctx.globalAlpha = 0.95;
    pring(ctx, m.x, m.y, m.r * (0.3 + 0.7 * k), '#ff3b2b', 1);
    pline(ctx, m.x - 4, m.y, m.x + 4, m.y, '#ff3b2b', 1); pline(ctx, m.x, m.y - 3, m.x, m.y + 3, '#ff3b2b', 1);
  }
  ctx.globalAlpha = 1;
}

/** perlengkapan Jack-5: zirah tebal, bahu berduri, inti reaktor menyala, tabung knalpot, dan LENGAN SENAPAN raksasa */
export function drawJackGear(g: G, ctx: Ctx, e: Enemy, o: StickOpts) {
  const j = J(e);
  if (!j) return;
  const sk = solvePose(o);
  const oy = o.y - e.z, sc = e.scale;
  const P = (q: { x: number; y: number }) => ({ x: e.x + q.x, y: oy + q.y });
  const neck = P(sk.neck), hip = P(sk.hip), head = P(sk.head), fh = P(sk.fhand), bh = P(sk.bhand), ff = P(sk.ffoot), bf = P(sk.bfoot);
  const f = e.facing, t = g.time;
  const rage = j.rage;
  const DARK = '#0a0c12', GUN = '#4a5366', MID = '#7d8798', LIGHT = '#c4cddc', RED = '#c8281e', HOT = rage ? '#ff5a3a' : '#e8402a';
  const K = sc / 2.3;
  const thick = Math.max(5, Math.round(2.6 * sc));
  // knalpot di punggung (mengepulkan uap / api)
  const bx0 = neck.x - f * 4.5, by0 = neck.y - 1;
  for (const sd of [-1, 1]) {
    pline(ctx, bx0 + sd * 1.5, by0, bx0 + sd * 2.5 - f * 2, by0 - 7, DARK, 4);
    pline(ctx, bx0 + sd * 1.5, by0, bx0 + sd * 2.5 - f * 2, by0 - 7, GUN, 2);
    px(ctx, bx0 + sd * 2.5 - f * 2, by0 - 8, rage ? '#ff9a3a' : '#9a9a9a');
  }
  // kaki: pelat paha & sepatu bot tebal
  for (const [ft, sd] of [[bf, -1], [ff, 1]] as const) {
    const kx = (hip.x + ft.x) / 2 + f * 2, ky = (hip.y + ft.y) / 2;
    pline(ctx, hip.x + sd * 1.5, hip.y, kx, ky, DARK, thick + 2);
    pline(ctx, hip.x + sd * 1.5, hip.y, kx, ky, GUN, thick);
    pline(ctx, kx, ky, ft.x, ft.y, DARK, thick + 1);
    pline(ctx, kx, ky, ft.x, ft.y, MID, thick - 1);
    pcircle(ctx, kx, ky, thick * 0.6 + 0.5, DARK); pcircle(ctx, kx, ky, thick * 0.6 - 0.3, LIGHT);
    prect(ctx, Math.round(ft.x - 3 + f), Math.round(ft.y - 2), 7, 3, DARK); prect(ctx, Math.round(ft.x - 2 + f), Math.round(ft.y - 2), 5, 2, RED);
  }
  // pinggang & pelindung selangkangan
  prect(ctx, Math.round(hip.x - 5), Math.round(hip.y - 2), 10, 4, DARK); prect(ctx, Math.round(hip.x - 4), Math.round(hip.y - 1), 8, 2, GUN);
  px(ctx, hip.x, hip.y - 1, RED);
  // dada: pelat trapesium lebar + inti reaktor
  const cw = Math.max(5, 2.6 * sc);
  const chest = { x: (neck.x * 2 + hip.x) / 3, y: (neck.y * 2 + hip.y) / 3 };
  pline(ctx, neck.x, neck.y + 1, hip.x, hip.y - 1, DARK, cw + 3);
  pline(ctx, neck.x, neck.y + 1, hip.x, hip.y - 1, GUN, cw + 1);
  pline(ctx, neck.x - f * 1.5, neck.y + 1, hip.x - f * 1.5, hip.y - 1, MID, cw - 2);
  pline(ctx, neck.x - f * 2.5, neck.y + 1, hip.x - f * 2.5, hip.y - 1, LIGHT, 1);
  for (const sd of [-1, 1]) { const pxx = chest.x + sd * cw * 0.45, pyy = chest.y - 3 * K; pcircle(ctx, pxx, pyy, 3.4 * K + 0.5, DARK); pcircle(ctx, pxx, pyy, 3.2 * K, sd === f ? MID : GUN); px(ctx, pxx - 1, pyy - 1, LIGHT); }
  const pulse = 0.55 + 0.45 * Math.sin(t * (rage ? 14 : 5));
  ctx.globalAlpha = 0.35 * pulse; pcircle(ctx, chest.x, chest.y, 5, HOT); ctx.globalAlpha = 1;
  pcircle(ctx, chest.x, chest.y, 3, DARK); pcircle(ctx, chest.x, chest.y, 2.2, HOT); pcircle(ctx, chest.x, chest.y, 1.1, rage ? '#ffffff' : '#ffd0a0');
  // lengan belakang: tinju baja berduri
  pline(ctx, neck.x - f * 3, neck.y + 1, bh.x, bh.y, DARK, thick + 2); pline(ctx, neck.x - f * 3, neck.y + 1, bh.x, bh.y, GUN, thick);
  { const bmx = (neck.x + bh.x) / 2, bmy = (neck.y + bh.y) / 2; pcircle(ctx, bmx, bmy, 3.6 * K + 1, DARK); pcircle(ctx, bmx, bmy, 3.6 * K, MID); px(ctx, bmx - 1, bmy - 1, LIGHT); }
  pcircle(ctx, bh.x, bh.y, 4.6 * K + 1.5, DARK); pcircle(ctx, bh.x, bh.y, 4.6 * K, MID); prect(ctx, Math.round(bh.x - 2), Math.round(bh.y - 4 * K), 5, 2, RED); px(ctx, bh.x - 2, bh.y - 1, LIGHT);
  // bahu: bantalan besar berduri
  for (const sd of [-1, 1]) {
    const sx = neck.x + sd * (cw * 0.85 + 2), sy = neck.y + 2;
    pcircle(ctx, sx, sy, 5 * K + 2, DARK); pcircle(ctx, sx, sy, 5 * K + 1, sd === f ? MID : GUN); px(ctx, sx - 1, sy - 2, LIGHT); px(ctx, sx - 2, sy - 1, LIGHT);
    pline(ctx, sx, sy - 3, sx + sd * 2, sy - 8, DARK, 3); pline(ctx, sx, sy - 3, sx + sd * 2, sy - 8, LIGHT, 1);
    prect(ctx, Math.round(sx - 1), Math.round(sy + 1), 3, 1, RED);
  }
  // kepala: helm bertanduk + visor merah menyala
  const hr = Math.max(4, 2.1 * sc * 0.72);
  pcircle(ctx, head.x, head.y, hr + 1, DARK); pcircle(ctx, head.x, head.y, hr, GUN);
  pline(ctx, head.x - hr * 0.6, head.y - hr * 0.8, head.x - hr * 0.9 - 2, head.y - hr - 4, DARK, 3); pline(ctx, head.x - hr * 0.6, head.y - hr * 0.8, head.x - hr * 0.9 - 2, head.y - hr - 4, LIGHT, 1);
  pline(ctx, head.x + hr * 0.6, head.y - hr * 0.8, head.x + hr * 0.9 + 2, head.y - hr - 4, DARK, 3); pline(ctx, head.x + hr * 0.6, head.y - hr * 0.8, head.x + hr * 0.9 + 2, head.y - hr - 4, LIGHT, 1);
  const vx = head.x + f * 1.2, vy = head.y + 0.5;
  prect(ctx, Math.round(vx - hr * 0.8), Math.round(vy - 1), Math.round(hr * 1.6), 3, DARK);
  ctx.globalAlpha = 0.5 + 0.5 * pulse;
  prect(ctx, Math.round(vx - hr * 0.6), Math.round(vy), Math.round(hr * 1.2), 1, rage ? '#ffffff' : '#ff4a3a');
  ctx.globalAlpha = 1;
  prect(ctx, Math.round(vx + f * hr * 0.3 - 1), Math.round(vy), 2, 1, '#ffffff');
  // LENGAN SENAPAN: lengan atas tebal + meriam besar dengan cincin pendingin
  let ux = fh.x - neck.x, uy = fh.y - neck.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const blen = 12 * sc * 0.75;
  const bx = fh.x + ux * blen, by = fh.y + uy * blen;
  pline(ctx, neck.x + ux * 2, neck.y + uy * 2, fh.x, fh.y, DARK, thick + 3);
  pline(ctx, neck.x + ux * 2, neck.y + uy * 2, fh.x, fh.y, GUN, thick + 1);
  pline(ctx, neck.x + ux * 2, neck.y + uy * 2, fh.x, fh.y, MID, 1);
  pline(ctx, fh.x, fh.y, bx, by, DARK, thick + 3);
  pline(ctx, fh.x, fh.y, bx, by, LIGHT, thick - 1);
  pline(ctx, fh.x + ux, fh.y + uy, bx, by, MID, 2);
  for (let i = 1; i <= 3; i++) { const rx = fh.x + ux * blen * (i / 4), ry = fh.y + uy * blen * (i / 4); pline(ctx, rx - uy * 3, ry + ux * 3, rx + uy * 3, ry - ux * 3, DARK, 2); px(ctx, rx, ry, RED); }
  { const bmx = (neck.x + fh.x) / 2, bmy = (neck.y + fh.y) / 2; pcircle(ctx, bmx, bmy, 3.6 * K + 1, DARK); pcircle(ctx, bmx, bmy, 3.6 * K, MID); px(ctx, bmx - 1, bmy - 1, LIGHT); }
  pcircle(ctx, fh.x, fh.y, 4.4 * K + 1, DARK); pcircle(ctx, fh.x, fh.y, 4.2 * K, RED);
  pcircle(ctx, bx, by, 3, DARK);
  // panas laras: bara merah setelah menembak
  if (j.heat > 0.05) { ctx.globalAlpha = Math.min(1, j.heat); pcircle(ctx, bx, by, 2, '#ff6a2a'); pline(ctx, fh.x + ux * blen * 0.5, fh.y + uy * blen * 0.5, bx, by, '#ff6a2a', 1); ctx.globalAlpha = 1; if (Math.random() < j.heat * 0.4) g.particles?.smoke?.(bx, by, 1, '#cfcfcf', 18, 0.4); }
  if (j.act && (j.act.kind === 'burst' || j.act.kind === 'sweep' || j.act.kind === 'rockets') && j.act.t < 0.7) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 40);
    pcircle(ctx, bx, by, 2 + j.act.t * 3, '#ff6a4a'); ctx.globalAlpha = 1;
  }
  if (j.muzzle > 0) { pcircle(ctx, bx + ux * 4, by + uy * 4, 4.5, '#ffd86a'); pcircle(ctx, bx + ux * 4, by + uy * 4, 2.6, '#ffffff'); pline(ctx, bx, by, bx + ux * 13, by + uy * 13, '#ffe9a8', 2); }
  // perisai guard: lengan disilang di depan + cincin emas
  if (j.guardT > 0 || j.flashT > 0) {
    const a = e.aim, gx = e.x + Math.cos(a) * 10 * K, gy = e.y - 12 * K + Math.sin(a) * 6;
    const al = j.flashT > 0 ? 1 : 0.55 + 0.35 * Math.sin(t * 30);
    ctx.globalAlpha = al * 0.5; pcircle(ctx, gx, gy, 12 * K, j.flashT > 0 ? '#fff2c0' : '#ffd27f');
    ctx.globalAlpha = al; pring(ctx, gx, gy, 12 * K, j.flashT > 0 ? '#ffffff' : '#ffd27f', 2);
    ctx.globalAlpha = 1;
    pline(ctx, gx - 6, gy - 7 * K, gx + 6, gy + 7 * K, DARK, 5); pline(ctx, gx - 6, gy - 7 * K, gx + 6, gy + 7 * K, LIGHT, 3);
    pline(ctx, gx - 6, gy + 7 * K, gx + 6, gy - 7 * K, DARK, 5); pline(ctx, gx - 6, gy + 7 * K, gx + 6, gy - 7 * K, MID, 3);
    if (j.guardT > 0) pfontO(ctx, 'GUARD', e.x, e.y - 48 * K, '#ffd27f', '#000', 1, 'center');
  }
  // aura OVERDRIVE
  if (rage) {
    for (let i = 0; i < 6; i++) px(ctx, e.x + rnd(-12, 12), oy - rnd(0, 34), Math.random() < 0.5 ? '#ff3b2b' : '#ff9a3a');
    ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 16); pring(ctx, e.x, e.y - 2, 15 + Math.sin(t * 9) * 2, '#ff3b2b', 2); ctx.globalAlpha = 1;
  }
  // petunjuk serangan
  const aimHx = e.x + Math.cos(e.aim) * 8 * sc, aimHy = e.y - 7 * sc + Math.sin(e.aim) * 6;
  if (j.laser > 0 && j.act && (j.act.kind === 'burst' || j.act.kind === 'sweep')) {
    const fl = Math.floor(t * 18) % 2;
    for (let k = 14; k < 260; k += 5) { const qx = aimHx + Math.cos(e.aim) * k, qy = aimHy + Math.sin(e.aim) * k; px(ctx, qx, qy, (k / 5 + fl) % 2 ? '#ff3b3b' : '#ffd0c0'); if (k % 15 === 0) px(ctx, qx, qy + 1, '#7a1010'); }
  }
  if (j.ring) {
    const r = j.ring, al = 0.25 + 0.5 * Math.abs(Math.sin(t * 18));
    ctx.globalAlpha = al * 0.55; pcircle(ctx, r.x, r.y, r.r * Math.min(1, r.t + 0.2), 'rgba(255,40,30,0.35)');
    ctx.globalAlpha = 0.95; pring(ctx, r.x, r.y, r.r, '#ff3b2b', 1); pring(ctx, r.x, r.y, r.r * (1 - r.t), '#ffd86a', 1); ctx.globalAlpha = 1;
  }
  if (j.tellDir !== null) {
    const fl = Math.floor(t * 16) % 2;
    for (let k = 12; k < 140; k += 4) { const tx = e.x + Math.cos(j.tellDir) * k, ty = e.y + Math.sin(j.tellDir) * k; px(ctx, tx, ty, (k / 4 + fl) % 2 ? '#ff3b3b' : '#ffd0c0'); px(ctx, tx, ty + 1, '#7a1010'); px(ctx, tx, ty - 1, '#7a1010'); }
  }
  void o;
}

/** bar nyawa Jack-5 di tengah atas */
export function drawJackHud(ctx: Ctx, g: G, VIEW_W: number) {
  const e = g.enemies.find((q: Enemy) => J(q) && !q.dead && J(q)!.phase !== 'meteor');
  if (!e) return;
  const j = J(e)!;
  const slide = j.phase === 'fight' ? 1 : j.phase === 'rise' ? clamp(j.t / RISE_DUR, 0, 1) : j.phase === 'land' ? clamp(j.t / LAND_DUR, 0, 1) * 0.5 : 0;
  const w = 150, x = Math.round(VIEW_W / 2 - w / 2), y = Math.round(24 - (1 - slide) * 20);
  ctx.globalAlpha = Math.min(1, slide * 1.5);
  prect(ctx, x - 3, y - 3, w + 6, 14, 'rgba(4,5,10,0.82)');
  prect(ctx, x - 3, y - 3, w + 6, 1, 'rgba(255,255,255,0.3)'); prect(ctx, x - 3, y + 10, w + 6, 1, 'rgba(0,0,0,0.9)');
  prect(ctx, x - 3, y - 3, 2, 14, j.rage ? '#ff3b3b' : '#c8281e'); prect(ctx, x + w + 1, y - 3, 2, 14, j.rage ? '#ff3b3b' : '#c8281e');
  prect(ctx, x, y, w, 7, '#1a1218');
  const hp = clamp(e.hp / e.maxHp, 0, 1), fw = Math.round(w * hp);
  const flash = j.rage && Math.sin(g.time * 12) > 0.4;
  prect(ctx, x, y, fw, 7, flash ? '#ffb0a0' : j.rage ? '#ff4b3b' : '#e8e8f0');
  prect(ctx, x, y, fw, 2, 'rgba(255,255,255,0.5)'); prect(ctx, x, y + 5, fw, 2, 'rgba(0,0,0,0.35)');
  for (let i = 1; i < 10; i++) prect(ctx, x + Math.round((w * i) / 10), y + 5, 1, 2, 'rgba(0,0,0,0.45)');
  prect(ctx, x + Math.round(w * 0.5), y - 2, 1, 11, 'rgba(255,60,50,0.8)');
  const st = clamp(e.structure / e.maxStructure, 0, 1);
  prect(ctx, x, y + 8, w, 1, 'rgba(255,255,255,0.12)'); prect(ctx, x, y + 8, Math.round(w * st), 1, '#ffd700');
  pfontO(ctx, j.rage ? 'JACK-5  OVERDRIVE' : 'JACK-5', VIEW_W / 2, y + 12, j.rage ? '#ff6a5a' : '#ffffff', '#000', 1, 'center');
  ctx.globalAlpha = 1;
}
