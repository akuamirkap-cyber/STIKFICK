import { clamp, dist, rnd } from './rng';
import { moveWithCollision, solidAt } from './level';
import { LEG_K } from './stick';
import { zoneFromMove, zoneFromTech, randomZone, startReact, tickReact, reactOpts, type Zone } from './hitReact';
import { drawStick, drawShadow } from './draw';
import { MOVES, type Move } from './moves';
import { pcircle, pfontO, pline, prect, type Ctx } from './pixel';
import { Wield, pickTech, wieldSpeed, type TechId } from './enemyWield';
import { makeEnemy } from './enemies';
import { Ragdoll } from './ragdoll';

/**
 * MODE TIM 20 vs 20 — dua pasukan saling bertarung. Pembeda cukup WARNA NAMA:
 *   biru = timmu (kamu + 19 sekutu)   merah = lawan (20)   kuning = KAMU
 * Gaya tiap petarung diundi: kung fu (tangan), Black Leg (kaki), tombak Guan Dao, pistol, rifle, shotgun.
 * Sekutu = agen mandiri; lawan = objek Enemy biasa (supaya semua serangan pemain mengenai mereka).
 */
type G = any;
type U = any;
export const BLUE = '#4aa8ff';
export const RED = '#ff4a4a';
export const YOU = '#ffe14d';
type StyleId = 'kungfu' | 'leg' | 'spear' | 'pistol' | 'rifle' | 'shotgun';

const BLUE_NAMES = ['RANGGA', 'DIMAS', 'BAGAS', 'SATRIA', 'YOGA', 'ARGA', 'BIMA', 'REZA', 'FAJAR', 'WAHYU', 'ALDO', 'RAFI', 'DIKA', 'GALIH', 'HADI', 'JOKO', 'KEVIN', 'LUKI', 'NANDO'];
const RED_NAMES = ['GAROK', 'PREMAN', 'SADIS', 'MACAN', 'BRUTUS', 'NAGA', 'JAGAL', 'BISON', 'ROCKY', 'KOBRA', 'TARING', 'BADAI', 'CAKAR', 'BAJA', 'HANTU', 'RACUN', 'SERIGALA', 'DRAKO', 'GORILA', 'TITAN'];
const STYLES: StyleId[] = ['kungfu', 'kungfu', 'kungfu', 'kungfu', 'kungfu', 'leg', 'leg', 'leg', 'leg', 'spear', 'spear', 'spear', 'spear', 'pistol', 'pistol', 'pistol', 'rifle', 'rifle', 'shotgun', 'shotgun'];
const SPEAR_TECHS: TechId[] = ['sweep', 'reverse', 'twirl', 'thrust', 'taishan'];

const RAW: Record<'kungfu' | 'leg', string[][]> = {
  kungfu: [['L', 'LL', 'LLL', 'LLLL'], ['L', 'LL', 'LH', 'HL', 'HLL'], ['H', 'LHL', 'LLH', 'HHL'], ['KF1', 'KV2', 'KF2'], ['LH', 'KV2', 'LLLH'], ['L', 'LL', 'LLLLH'], ['L', 'KV2', 'LL', 'KV3']],
  leg: [['S1', 'S2', 'S3', 'S4', 'S5'], ['KV1', 'KV2', 'KV3', 'KV4'], ['S1', 'LH', 'S2', 'HL', 'S6'], ['S3', 'S4', 'KV3', 'S8'], ['KV2', 'LL', 'KV3', 'HLL'], ['S2', 'S3', 'KV2', 'S5']],
};
const COMBOS = {
  kungfu: RAW.kungfu.map((c) => c.filter((k) => MOVES[k] && !MOVES[k].travel && !MOVES[k].air)).filter((c) => c.length >= 2),
  leg: RAW.leg.map((c) => c.filter((k) => MOVES[k] && !MOVES[k].travel && !MOVES[k].air)).filter((c) => c.length >= 2),
};

interface TB {
  team: 0 | 1; name: string; style: StyleId; skill: number; cap: boolean;
  cd: number; mv: string | null; combo: string[]; ci: number; t: number; hitDone: boolean; hitT: number;
  w: Wield | null; techs: TechId[]; chain: number; chainMax: number; windT: number;
  dodgeT: number; dodgeCd: number; strafe: number; strafeT: number; retarget: number; target: any; onPlayer: boolean;
  burst: number; burstT: number; shootCd: number; recoil: number; flash: number; lastCombo: number;
}
interface Bul { x: number; y: number; vx: number; vy: number; team: 0 | 1; dmg: number; life: number; col: string }

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const lerpAng = (a: number, b: number, k: number) => a + wrap(b - a) * k;
function shuffle<T>(a: T[]): T[] { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function foesOf(g: G, u: U): any[] {
  const T: TeamBattle = g.team;
  return u.tb.team === 0 ? T.reds : T.blueFoes;
}
function snd(g: G, u: U, fn: () => void) {
  const T: TeamBattle = g.team;
  if (T.sfxN >= 4) return;
  if (dist(u.x, u.y, g.player.x, g.player.y) > 190) return;
  T.sfxN++; fn();
}

/** satu fungsi damage untuk semua kombinasi (pemain / sekutu / musuh) */
function hurt(g: G, v: U, dmg: number, st: number, kb: number, ang: number, kd: boolean, launch = 0, zone?: Zone) {
  if (v === g.player) { g.damagePlayer?.(dmg >= 12 ? 2 : 1, ang, kd && dmg >= 10); return; }
  const k = dmg * 0.55;
  if (v.isAlly) {
    v.hp -= k; v.tb.flash = 0.12;
    startReact(v, zone ?? randomZone(), ang, 0.6 + Math.min(0.5, dmg * 0.05));
    v.kx += Math.cos(ang) * kb * 0.6; v.ky += Math.sin(ang) * kb * 0.6;
    v.stun = Math.max(v.stun ?? 0, kd ? 0.55 : 0.14);
    if (v.hp <= 0) killAlly(g, v, ang, kb + dmg * 30);
    return;
  }
  g.damageEnemy?.(v, k, st * 0.16, ang, kb * 0.8, { knockdown: kd, hitstop: 0.01, shake: 0.04, melee: false, launch: launch * 0.7, zone: zone ?? randomZone() });
}

function killAlly(g: G, u: U, dir: number, power: number) {
  if (u.dead) return;
  u.dead = true; u.hp = 0;
  const cx = Math.cos(dir), sy = Math.sin(dir);
  g.particles?.blood?.(u.x, u.y - 6, 10, dir, 140);
  g.blood?.spray?.(u.x, u.y - 6, dir, 3, true);
  g.splat?.(u.x, u.y, 6);
  const fling = Math.min(430, 110 + power * 0.85), up = 125 + Math.random() * 95;
  const spin = 11 * (cx >= 0 ? 1 : -1) * (0.7 + Math.random() * 0.6);
  const corpse: any = { x: u.x, y: u.y, rot: dir + 0.3, color: u.color, color2: u.color2, scale: u.scale, accessory: 'band', vx: cx * fling, vy: sy * fling * 0.75, spin, t: 0, z: 1, vz: up, gib: false, bounces: 0, face: cx >= 0 ? 1 : -1, sqx: 0.8, sqy: 1.3 };
  g.corpses.push(corpse);
  if (g.corpses.length > 80) g.corpses.shift();
  const live = g.corpses.filter((q: any) => q.rd && !q.rd.settled).length;
  if (live < 18) {
    const sv = !!g.level?.sideView;
    const rd = new Ragdoll(u.x, u.y, 0, { color: u.color, color2: u.color2, scale: u.scale, accessory: 'band', shades: 0, eyeStyle: 'normal' }, Math.random(), sv);
    if (sv) rd.launch(cx * fling * 0.95, 0, Math.min(220, up), spin);
    else rd.launch(cx * fling * 1.18, sy * fling * 0.88, up * 1.12 + 45, spin);
    corpse.rd = rd;
  }
  snd(g, u, () => g.sfx?.kill?.());
  g.texts?.hit?.(u.x, u.y - 24, u.tb.name, BLUE, 1, 0.8);
  if (u.tb.w) u.tb.w.cancel();
}

function pickTarget(g: G, u: U): any | null {
  const T: TeamBattle = g.team;
  let best: any = null, bs = 1e9;
  for (const v of foesOf(g, u)) {
    if (v.dead || v.spawnT > 0) continue;
    let d = dist(u.x, u.y, v.x, v.y);
    if (v === g.player) {
      if (u.tb.team === 1 && T.pAtk >= 2 && u.tb.target !== g.player) d += 220; else d *= 0.9;
    }
    if (v.stagger > 0) d -= 25;
    if (d < bs) { bs = d; best = v; }
  }
  return best;
}

function threatened(g: G, u: U): boolean {
  const T: TeamBattle = g.team;
  for (const v of foesOf(g, u)) {
    if (v.dead) continue;
    if (dist(u.x, u.y, v.x, v.y) > 46) continue;
    if (v === g.player) {
      const p = g.player;
      if (p.attackPhase === 'windup' || p.attackPhase === 'active') return true;
      if (g.gd?.tech && !g.gd.tech.dmgless) return true;
    } else if (v.tb && (v.tb.mv || v.tb.w?.tech || v.tb.windT > 0)) return true;
  }
  for (const b of T.bullets) {
    if (b.team === u.tb.team) continue;
    if (dist(b.x, b.y, u.x, u.y) < 30 && (b.vx * (u.x - b.x) + b.vy * (u.y - b.y)) > 0) return true;
  }
  return false;
}

function approach(u: U, ang: number, d: number, want: number, fast = 1) {
  const tb: TB = u.tb;
  const sp = (u.speed ?? 100) * fast * (d > want + 90 ? 1.4 : 1);
  let mx = 0, my = 0;
  if (d > want + 4) { mx = Math.cos(ang); my = Math.sin(ang); }
  else if (d < want - 8) { mx = -Math.cos(ang) * 0.8; my = -Math.sin(ang) * 0.8; }
  const orbit = d < want + 60 ? 0.5 : 0.15;
  mx += -Math.sin(ang) * tb.strafe * orbit; my += Math.cos(ang) * tb.strafe * orbit;
  const l = Math.hypot(mx, my);
  if (l > 0.05) { u.vx = (mx / l) * sp; u.vy = (my / l) * sp; u.moving = true; }
}

function meleeStrike(g: G, u: U, m: Move) {
  let any = false;
  for (const v of foesOf(g, u)) {
    if (v.dead || v.spawnT > 0) continue;
    const d = dist(u.x, u.y, v.x, v.y);
    if (d > m.range + (v.r ?? 5) + 5) continue;
    const a = Math.atan2(v.y - u.y, v.x - u.x);
    if (Math.abs(wrap(a - u.aim)) > Math.max(1.0, Math.min(Math.PI, m.arc))) continue;
    hurt(g, v, m.dmg, m.structure, m.kb * 0.85, a, m.knockdown, m.launch ?? 0, zoneFromMove(m, v));
    g.particles?.spark?.(v.x - Math.cos(a) * 3, v.y - 7, 5, '#ffffff', a, 1, 200);
    if (Math.random() < 0.5) g.particles?.blood?.(v.x, v.y - 7, 3, a, 110);
    any = true;
  }
  if (any) snd(g, u, () => { if (m.kick || m.sfx === 'kick') g.sfx?.kick?.(); else g.sfx?.punch?.(); });
}

function stepFist(g: G, u: U, dt: number, d: number, ang: number) {
  const tb: TB = u.tb;
  const R = 1.0 + tb.skill * 0.18;
  if (tb.mv) {
    const m = MOVES[tb.mv];
    tb.t += dt * R;
    u.aim = lerpAng(u.aim, ang, Math.min(1, dt * (tb.t < m.windup ? 14 : 3)));
    if (tb.t < m.windup + m.active && d > m.range * 0.55) { const sp = Math.min(230, 95 + m.lunge * 0.8); u.vx = Math.cos(u.aim) * sp; u.vy = Math.sin(u.aim) * sp; u.moving = true; }
    if (tb.t >= m.windup && tb.t < m.windup + m.active) {
      if (!tb.hitDone || (m.rehit && tb.t - tb.hitT >= m.rehit)) { tb.hitDone = true; tb.hitT = tb.t; meleeStrike(g, u, m); }
    }
    const w = m.windup, a = m.active, r = m.recover * 0.5;
    u.pose = m.pose; u.poseDur = 1e6;
    u.poseT = tb.t < w ? 0.3 * (tb.t / Math.max(0.001, w)) : tb.t < w + a ? 0.3 + 0.3 * ((tb.t - w) / Math.max(0.001, a)) : 0.6 + 0.4 * clamp((tb.t - w - a) / Math.max(0.001, r), 0, 1);
    if (tb.t >= w + a + r) {
      tb.ci++;
      if (tb.ci < tb.combo.length && d < m.range + 30 && Math.random() < 0.82) { tb.mv = tb.combo[tb.ci]; tb.t = 0; tb.hitDone = false; tb.hitT = -9; snd(g, u, () => g.sfx?.whoosh?.()); }
      else { tb.mv = null; tb.cd = rnd(0.25, 0.75) * (1.3 - tb.skill * 0.5); }
    }
    return;
  }
  u.pose = 'idle'; u.poseT = 0; u.poseDur = 1;
  u.aim = lerpAng(u.aim, ang, Math.min(1, dt * 9));
  approach(u, ang, d, 16);
  if (tb.cd <= 0 && d < 34 && g.state === 'playing') {
    const list = COMBOS[tb.style === 'leg' ? 'leg' : 'kungfu'];
    let i = Math.floor(Math.random() * list.length);
    if (i === tb.lastCombo) i = (i + 1) % list.length;
    tb.lastCombo = i; tb.combo = list[i]; tb.ci = 0; tb.mv = tb.combo[0]; tb.t = 0; tb.hitDone = false; tb.hitT = -9;
    snd(g, u, () => g.sfx?.whoosh?.());
  } else if (tb.cd <= 0 && d >= 70 && d < 150 && Math.random() < dt * 1.8) {
    u.kx += Math.cos(ang) * 380; u.ky += Math.sin(ang) * 380; tb.cd = 0.45;
    g.particles?.smoke?.(u.x, u.y, 2, '#cfcfcf', 22, 0.28);
  }
}

function stepSpear(g: G, u: U, dt: number, d: number, ang: number) {
  const tb: TB = u.tb, w = tb.w!;
  if (w.tech) {
    const T = w.tech;
    u.pose = T.pose; u.poseDur = 1e6; u.poseT = T.poseMap[0] + (T.poseMap[1] - T.poseMap[0]) * clamp(w.tt / T.dur, 0, 1);
    u.aim = lerpAng(u.aim, ang, Math.min(1, dt * 3));
    return;
  }
  if (tb.windT > 0) {
    tb.windT -= dt; u.pose = 'windup'; u.poseT = 0.5; u.poseDur = 1e6;
    u.aim = lerpAng(u.aim, ang, Math.min(1, dt * 10));
    if (tb.windT <= 0) { const T = pickTech(tb.techs, tb.chain + 1, d, tb.skill); w.start(u, T, ang, wieldSpeed(tb.skill)); tb.chain++; }
    return;
  }
  if (tb.chain > 0) {
    if (tb.chain < tb.chainMax && d < 62 && Math.random() < 0.7) { tb.windT = 0.05; return; }
    tb.chain = 0; tb.cd = rnd(0.35, 0.9) * (1.2 - tb.skill * 0.5);
    tb.chainMax = 2 + (Math.random() < tb.skill ? 1 : 0) + (Math.random() < tb.skill * 0.5 ? 1 : 0);
  }
  u.pose = 'idle'; u.poseT = 0; u.poseDur = 1;
  u.aim = lerpAng(u.aim, ang, Math.min(1, dt * 9));
  approach(u, ang, d, 30);
  if (tb.cd <= 0 && d < 100 && g.state === 'playing') { tb.windT = Math.max(0.06, 0.22 - tb.skill * 0.1); tb.chain = 0; }
}

function fire(g: G, u: U, a: number, sp: number, dmg: number, col: string) {
  const T: TeamBattle = g.team;
  const hx = u.x + Math.cos(a) * 9, hy = u.y - 7 + Math.sin(a) * 6;
  T.bullets.push({ x: hx, y: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, team: u.tb.team, dmg, life: 1.1, col });
  u.tb.recoil = 1;
  g.particles?.spark?.(hx, hy, 2, col, a, 0.4, 100);
}

function stepGun(g: G, u: U, dt: number, d: number, ang: number) {
  const tb: TB = u.tb;
  const [want, rng] = tb.style === 'pistol' ? [88, 150] : tb.style === 'rifle' ? [125, 200] : [38, 85];
  u.pose = 'shoot'; u.poseT = 0.5; u.poseDur = 1e6;
  const p = tb.target;
  const sp = tb.style === 'rifle' ? 340 : tb.style === 'pistol' ? 300 : 260;
  const t = d / sp;
  const lead = p ? Math.atan2(p.y + (p.vy ?? 0) * t * 0.6 - u.y, p.x + (p.vx ?? 0) * t * 0.6 - u.x) : ang;
  u.aim = lerpAng(u.aim, tb.burst > 0 ? lead : ang, Math.min(1, dt * 11));
  approach(u, ang, d, want, tb.burst > 0 ? 0.55 : 1);
  tb.shootCd -= dt;
  if (tb.burst > 0) {
    tb.burstT -= dt;
    if (tb.burstT <= 0) {
      const gap = tb.style === 'rifle' ? 0.085 : tb.style === 'pistol' ? 0.16 : 0.1;
      if (tb.style === 'shotgun') { for (let i = -2; i <= 2; i++) fire(g, u, u.aim + i * 0.11 + rnd(-0.03, 0.03), 240 + rnd(-25, 25), 2, '#ffcf8a'); u.kx -= Math.cos(u.aim) * 70; u.ky -= Math.sin(u.aim) * 70; snd(g, u, () => g.sfx?.sniper?.()); }
      else { fire(g, u, u.aim + rnd(-0.05, 0.05), sp, tb.style === 'rifle' ? 2.5 : 3, tb.style === 'rifle' ? '#ffe08a' : '#fff6c8'); snd(g, u, () => g.sfx?.enemyShot?.()); }
      tb.burst--; tb.burstT = gap;
    }
  } else if (tb.shootCd <= 0 && d < rng + 40 && g.state === 'playing') {
    tb.burst = tb.style === 'rifle' ? 4 + Math.floor(Math.random() * 3) : tb.style === 'pistol' ? 2 : 1;
    tb.burstT = 0.2 - tb.skill * 0.08;
    tb.shootCd = rnd(0.9, 1.7) * (1.25 - tb.skill * 0.45) + (tb.style === 'shotgun' ? 0.5 : 0);
  }
}

/** otak satu petarung (sekutu & lawan memakai fungsi yang sama) */
export function brain(g: G, u: U, dt: number) {
  const tb: TB = u.tb;
  tb.flash = Math.max(0, tb.flash - dt);
  tb.cd -= dt; tb.dodgeCd -= dt; tb.retarget -= dt; tb.strafeT -= dt;
  tb.recoil = Math.max(0, tb.recoil - dt * 5);
  if (tb.dodgeT > 0) tb.dodgeT -= dt;
  if (tb.w) tb.w.update(g, u, dt);
  const busy = !!(tb.mv || tb.windT > 0 || tb.w?.tech || tb.burst > 0);
  let tgt = tb.target;
  if (!tgt || tgt.dead || (!busy && tb.retarget <= 0) || (tgt === g.player && g.state !== 'playing')) {
    if (tgt && tgt.dead) { tb.mv = null; tb.windT = 0; tb.burst = 0; tb.chain = 0; tb.w?.cancel(); }
    tgt = pickTarget(g, u); tb.target = tgt; tb.retarget = rnd(0.8, 1.6);
  }
  tb.onPlayer = tgt === g.player;
  u.weapon = tb.style === 'pistol' || tb.style === 'rifle' || tb.style === 'shotgun' ? tb.style : 'none';
  if (!tgt) { u.pose = 'idle'; u.poseT = 0; u.poseDur = 1; return; }
  const dx = tgt.x - u.x, dy = tgt.y - u.y, d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
  if (tb.strafeT <= 0) { tb.strafeT = rnd(0.5, 1.4); tb.strafe = Math.random() < 0.5 ? 1 : -1; }
  if (tb.dodgeT > 0) { u.pose = 'dash'; u.poseT = 0.5; u.poseDur = 1e6; return; }
  if (tb.dodgeCd <= 0 && !tb.mv && !tb.w?.tech && threatened(g, u) && Math.random() < tb.skill * 0.55 * Math.min(1, dt * 10)) {
    const a = ang + tb.strafe * Math.PI / 2;
    u.kx += Math.cos(a) * 310; u.ky += Math.sin(a) * 310;
    tb.dodgeT = 0.22; tb.dodgeCd = 1.2 - tb.skill * 0.5; tb.mv = null; tb.windT = 0; tb.burst = 0; tb.cd = Math.max(tb.cd, 0.12);
    g.particles?.smoke?.(u.x, u.y, 2, '#cfcfcf', 20, 0.26);
    return;
  }
  if (tb.style === 'kungfu' || tb.style === 'leg') stepFist(g, u, dt, d, ang);
  else if (tb.style === 'spear') stepSpear(g, u, dt, d, ang);
  else stepGun(g, u, dt, d, ang);
}

export function teamPre(e: U) {
  const tb: TB | undefined = e.tb;
  if (!tb) return;
  if (e.stagger > 0 || e.stun > 0 || e.down > 0 || e.z > 0) { tb.mv = null; tb.windT = 0; tb.burst = 0; tb.chain = 0; tb.w?.cancel(); tb.cd = Math.max(tb.cd, 0.3); }
}
export function aiTeam(g: G, e: U, dt: number) { brain(g, e, dt); e.state = 'chase'; e.bodyAim = e.aim; }
export const isTeamUnit = (e: U) => !!e.tb;

function newTB(team: 0 | 1, name: string, style: StyleId, cap: boolean): TB {
  const skill = clamp(rnd(0.4, 0.92) + (cap ? 0.08 : 0), 0.4, 0.97);
  return { team, name, style, skill, cap, cd: rnd(0.4, 1.4), mv: null, combo: [], ci: 0, t: 0, hitDone: false, hitT: -9, w: null, techs: SPEAR_TECHS, chain: 0, chainMax: 2, windT: 0, dodgeT: 0, dodgeCd: rnd(0.2, 1), strafe: Math.random() < 0.5 ? 1 : -1, strafeT: rnd(0.3, 1.2), retarget: 0, target: null, onPlayer: false, burst: 0, burstT: 0, shootCd: rnd(0.4, 1.4), recoil: 0, flash: 0, lastCombo: -1 };
}
function attachWield(g: G, u: U) {
  const tb: TB = u.tb;
  const w = new Wield(tb.team === 0 ? BLUE : RED);
  w.lite = true;
  w.victims = (gg, e) => foesOf(gg, e).filter((v) => !v.dead && v.spawnT !== 999);
  w.hurtFn = (gg, e, v, T, a) => { hurt(gg, v, T.dmg, T.st, T.kb * 0.8, a, !!(T.heavy || T.launch), T.launch ?? 0, zoneFromTech(T.id)); void e; };
  tb.w = w; void g;
}

export class TeamBattle {
  on = false;
  allies: U[] = [];
  reds: U[] = [];
  blueFoes: U[] = [];   // sasaran tim merah: sekutu hidup + pemain
  bullets: Bul[] = [];
  pAtk = 0; sfxN = 0; time = 0; endT = -1; total = 20;

  reset() { this.on = false; this.allies = []; this.reds = []; this.blueFoes = []; this.bullets = []; this.pAtk = 0; this.time = 0; this.endT = -1; }
  blueAlive(g: G) { return (g.state === 'dead' ? 0 : 1) + this.allies.filter((u) => !u.dead).length; }
  redAlive(g: G) { return g.enemies.filter((e: U) => e.tb && !e.dead).length; }

  setup(g: G) {
    this.reset();
    this.on = true;
    const p = g.player;
    const bn = shuffle(BLUE_NAMES.slice()), rn = shuffle(RED_NAMES.slice());
    const bs = shuffle(STYLES.slice(1)), rs = shuffle(STYLES.slice());
    const at = (cx: number, cy: number, a: number, b: number) => g.randomFloorNear(cx, cy, a, b) ?? { x: cx + rnd(-30, 30), y: cy + rnd(-30, 30) };
    // ---- sekutu biru
    for (let i = 0; i < 19; i++) {
      const pos = at(p.x, p.y, 12, 70);
      const cap = i === 0;
      const hp = cap ? 88 : 41 + rnd(-4, 4);
      const tb = newTB(0, (cap ? 'KPT ' : '') + bn[i], cap ? 'spear' : bs[i], cap);
      const u: any = {
        isAlly: true, x: pos.x, y: pos.y, z: 0, r: 5, scale: cap ? 1.12 : 1, aim: 0, facing: 1, kx: 0, ky: 0, vx: 0, vy: 0, moving: false, hp, maxHp: hp, dead: false, stun: 0,
        walk: 0, runT: 0, strideHalf: 3, pose: 'idle', poseT: 0, poseDur: 1, color: '#f2f2f2', color2: BLUE, accessory: 'band', weapon: 'none', speed: 98 + tb.skill * 24, tb,
      };
      u.aim = rnd(-0.3, 0.3);
      if (tb.style === 'spear') attachWield(g, u);
      this.allies.push(u);
    }
    // ---- lawan merah
    const rc = at(p.x, p.y, 170, 260);
    for (let i = 0; i < 20; i++) {
      const pos = at(rc.x, rc.y, 0, 55);
      const cap = i === 0;
      const tb = newTB(1, (cap ? 'KPT ' : '') + rn[i], cap ? 'spear' : rs[i], cap);
      const hp = cap ? 62 : 29 + rnd(-3, 3);
      const e: any = makeEnemy('thug', undefined, pos.x, pos.y, g.levelN, false);
      Object.assign(e, {
        name: tb.name, color: '#f2f2f2', color2: RED, accessory: 'band', hp, maxHp: hp, maxStructure: hp * 3.2, structure: 0, scale: cap ? 1.12 : 1, kbRes: 0.3,
        speed: 98 + tb.skill * 24, value: 30, spawnT: rnd(0.2, 0.65), weapon: 'none', tb,
      });
      e.aim = Math.PI + rnd(-0.3, 0.3);
      if (tb.style === 'spear') attachWield(g, e);
      g.enemies.push(e);
    }
    g.say?.('TIM BIRU vs TIM MERAH - 20 LAWAN 20!', '#ffffff', 2, 2.0);
    g.sfx?.announce?.();
  }

  update(g: G, dt: number) {
    if (!this.on || g.state !== 'playing') return;
    dt = Math.min(dt, 1 / 20);
    this.time += dt; this.sfxN = 0;
    this.reds = g.enemies.filter((e: U) => e.tb && !e.dead);
    const blues = this.allies.filter((u) => !u.dead);
    this.blueFoes = blues.concat([g.player]);
    this.pAtk = this.reds.filter((e: U) => e.tb.onPlayer && (e.tb.mv || e.tb.windT > 0 || e.tb.w?.tech || e.tb.burst > 0)).length;
    // ---- sekutu
    for (const u of blues) {
      tickReact(u, dt);
      u.vx = 0; u.vy = 0; u.moving = false;
      if (u.stun > 0) {
        u.stun -= dt; u.pose = 'hurt'; u.poseT = 0.5; u.poseDur = 1e6;
        const tb: TB = u.tb; tb.mv = null; tb.windT = 0; tb.burst = 0; tb.chain = 0; tb.w?.cancel(); tb.cd = Math.max(tb.cd, 0.25);
      } else brain(g, u, dt);
      this.integrate(g, u, dt);
    }
    // ---- peluru
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      let dead = b.life <= 0 || solidAt(g.level, b.x, b.y);
      if (!dead) {
        const list = b.team === 0 ? this.reds : this.blueFoes;
        for (const v of list) {
          if (v.dead || v.spawnT > 0) continue;
          if (Math.hypot(v.x - b.x, (v.y - 6) - b.y) > (v.r ?? 5) + 2.5) continue;
          hurt(g, v, b.dmg, 7, 80, Math.atan2(b.vy, b.vx), false);
          g.particles?.spark?.(b.x, b.y, 3, '#ffffff', Math.atan2(b.vy, b.vx), 0.8, 130);
          dead = true; break;
        }
      }
      if (dead) this.bullets.splice(i, 1);
    }
    // ---- saling dorong supaya tidak menumpuk
    const all: U[] = blues.concat(this.reds.filter((e) => e.spawnT <= 0));
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], c = all[j];
      const dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy;
      if (d2 > 64 || d2 < 0.0001) continue;
      const d = Math.sqrt(d2), o = (8 - d) * 0.4, nx = dx / d, ny = dy / d;
      if (g.isFree(a.x - nx * o, a.y - ny * o, 4)) { a.x -= nx * o; a.y -= ny * o; }
      if (g.isFree(c.x + nx * o, c.y + ny * o, 4)) { c.x += nx * o; c.y += ny * o; }
    }
    for (const a of all) {
      const p = g.player, dx = a.x - p.x, dy = a.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 < 36 && d2 > 0.0001) { const d = Math.sqrt(d2), o = (6 - d) * 0.35; if (g.isFree(a.x + dx / d * o, a.y + dy / d * o, 4)) { a.x += dx / d * o; a.y += dy / d * o; } }
    }
    // ---- menang
    if (this.endT < 0 && this.time > 3 && this.reds.length === 0) {
      this.endT = 2.0;
      g.say?.('TIM BIRU MENANG!', BLUE, 3, 2.2);
      g.sfx?.levelClear?.(); g.flash?.('#4aa8ff', 0.3); g.slow?.(0.9, 0.35);
      g.particles?.burst?.(g.player.x, g.player.y - 10, 30, '#4aa8ff', 260, 0.8, 2, 3);
      g.score += 1000;
    }
    if (this.endT >= 0) { this.endT -= dt; if (this.endT <= 0 && g.state === 'playing') { g.state = 'victory'; g.pushUI(); } }
  }

  private integrate(g: G, u: U, dt: number) {
    const bx = u.x, by = u.y;
    moveWithCollision(g.level, u, (u.vx + u.kx) * dt, (u.vy + u.ky) * dt);
    const f = Math.max(0, 1 - 8 * dt); u.kx *= f; u.ky *= f;
    u.x = clamp(u.x, 20, g.level.w * 16 - 20); u.y = clamp(u.y, 20, g.level.h * 16 - 20);
    const moved = Math.hypot(u.x - bx, u.y - by), sp = moved / Math.max(dt, 0.001);
    u.facing = Math.cos(u.aim) >= 0 ? 1 : -1;
    const want = clamp((sp - 70) / 60, 0, 1);
    u.runT += (want - u.runT) * Math.min(1, dt * 12);
    u.strideHalf = 3 + 6.6 * u.runT;
    if (sp > 6) u.walk += Math.PI * moved * (0.66 - 0.14 * u.runT) / Math.max(1.5, u.strideHalf) * LEG_K;
    else u.walk = 0;
  }

  // ------------------------------------------------------------------ gambar
  drawShadows(ctx: Ctx) { if (!this.on) return; for (const u of this.allies) if (!u.dead) drawShadow(ctx, u.x, u.y, u.scale, 0); }

  drawUnit(g: G, ctx: Ctx, u: U) {
    const tb: TB = u.tb;
    const sp = Math.hypot(u.vx + u.kx, u.vy + u.ky);
    const loco = u.pose === 'idle' || u.pose === 'shoot';
    const ro = u.pose === 'idle' || u.pose === 'hurt' ? reactOpts(u) : undefined;
    if (ro && u.pose === 'hurt') u.pose = 'idle';
    const moving = !ro && (u.moving || sp > 24) && loco;
    const opts: any = {
      x: u.x, y: u.y, c: u.color, c2: u.color2, scale: u.scale, facing: u.facing, aim: u.aim, look: u.aim,
      walk: u.walk, moving, pose: u.pose, t: u.poseT, acc: 'band', weapon: u.weapon ?? 'none',
      flash: tb.flash > 0, alpha: 1, outline: '#000000', eyes: '#111111', time: g.time,
      lean: { x: Math.cos(u.aim), y: Math.sin(u.aim) }, run: u.runT, stride: u.strideHalf, recoil: tb.recoil,
      vel: moving ? { x: (u.vx + u.kx) / (sp || 1), y: (u.vy + u.ky) / (sp || 1) } : undefined, anime: g.v2,
      mood: tb.mv || tb.burst > 0 || tb.w?.tech ? 'angry' : 'normal', react: ro,
    };
    if (tb.w) { const gr = tb.w.grips(u); opts.handOverride = gr.front; opts.bhandOverride = gr.back; }
    drawStick(ctx, opts);
    if (tb.w) tb.w.draw(g, ctx, u);
  }

  /** nama berwarna di atas kepala + bar nyawa mini: INILAH pembeda tim */
  drawOverlay(g: G, ctx: Ctx) {
    if (!this.on) return;
    const label = (x: number, y: number, name: string, col: string, hp: number, maxHp: number, you = false) => {
      pfontO(ctx, name, x, y, col, '#000', 1, 'center');
      if (hp < maxHp - 0.01) {
        const w = 14, bx = Math.round(x - w / 2), by = Math.round(y + 8);
        prect(ctx, bx - 1, by - 1, w + 2, 4, '#000c');
        prect(ctx, bx, by, Math.round(w * clamp(hp / maxHp, 0, 1)), 2, col);
      }
      if (you) { pcircle(ctx, x, y - 6, 1.4, YOU); pline(ctx, x - 3, y - 9, x, y - 6, YOU, 1); pline(ctx, x + 3, y - 9, x, y - 6, YOU, 1); }
    };
    for (const e of g.enemies) if (e.tb && !e.dead && e.spawnT <= 0) label(e.x, e.y - 25 * e.scale - e.z, e.tb.name, RED, e.hp, e.maxHp);
    for (const u of this.allies) if (!u.dead) label(u.x, u.y - 25 * u.scale, u.tb.name, BLUE, u.hp, u.maxHp);
    if (g.state !== 'dead') { const p = g.player; label(p.x, p.y - 27 - p.z, 'KAMU', YOU, p.hp, g.maxHp(), true); }
  }

  drawBullets(ctx: Ctx) {
    for (const b of this.bullets) {
      const col = b.team === 0 ? '#bfe0ff' : '#ffc0b0';
      ctx.globalAlpha = 0.45; pline(ctx, b.x - b.vx * 0.03, b.y - b.vy * 0.03, b.x, b.y, b.team === 0 ? BLUE : RED, 1); ctx.globalAlpha = 1;
      prect(ctx, Math.round(b.x), Math.round(b.y), 1, 1, '#ffffff'); void col;
    }
  }
}
