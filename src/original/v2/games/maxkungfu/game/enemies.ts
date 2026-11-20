import { aiJack, jackPre } from './jack5';
import { aiWielder, wielderPre } from './enemyWield';
import { aiSmart, smartPre } from './smartBoss';
import { aiTeam, teamPre } from './teamBattle';
import { tickReact } from './hitReact';
import { flowDir, lineOfSight } from './level';
import { angleDiff, clamp, rnd, type Rng } from './rng';
import { gaitCadence } from './stick';
import {
  OT_AIR, OT_ELEV, OT_FLOOR, OT_GLASS, OT_STAIRS, OT_WALL,
  officeFindNearbyStairX, officeFloorSupportY, officeOnElev, officeOnStairs,
  officeStairCenterX, officeStairSpan, officeStairZigZagX, officeTileAt, sideTableSupportY,
} from './office';
import { TILE } from './constants';
import type { BossKind, Enemy, EnemyKind, Pose, Vec } from './types';
import type { Game } from './game';

export interface EnemyDef {
  hp: number; speed: number; r: number; dmg: number; structure: number; color: string; color2: string; scale: number;
  acc: string; weapon: string; minLevel: number; weight: number; value: number; kbRes: number; armor: boolean;
  canParry: boolean; range: number; cd: number; windup: number; recover: number; role: 'melee' | 'ranged';
  minD: number; maxD: number; mag: number; reload: number;
}

// All regular enemies share the player's proportions (scale 1). Only the brute is bulkier; bosses are big.
export const DEFS: Record<Exclude<EnemyKind, 'boss'>, EnemyDef> = {
  // AHLI FIST MODE: pendekar tangan kosong untuk adu tanding & parry. Muncul sejak awal di Kantor V2!
  fighter: { hp: 24, speed: 100, r: 5, dmg: 1, structure: 72, color: '#ff6b5b', color2: '#ffffff', scale: 1, acc: 'headband', weapon: 'none', minLevel: 1, weight: 8, value: 32, kbRes: 0.4, armor: false, canParry: true, range: 19, cd: 0.82, windup: 0.36, recover: 0.36, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  duelist: { hp: 120, speed: 84, r: 5, dmg: 1, structure: 90, color: '#ffb347', color2: '#7a3d10', scale: 1, acc: 'band', weapon: 'nunchaku', minLevel: 999, weight: 0, value: 200, kbRes: 0.42, armor: false, canParry: true, range: 30, cd: 0.6, windup: 0.24, recover: 0.3, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  thug: { hp: 10, speed: 88, r: 5, dmg: 1, structure: 41, color: '#ff9f43', color2: '#ffe66d', scale: 1, acc: 'none', weapon: 'none', minLevel: 1, weight: 10, value: 10, kbRes: 0.25, armor: false, canParry: false, range: 15, cd: 1.1, windup: 0.42, recover: 0.45, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  knife: { hp: 7, speed: 114, r: 5, dmg: 1, structure: 30, color: '#ffe66d', color2: '#ffffff', scale: 1, acc: 'none', weapon: 'knife', minLevel: 3, weight: 7, value: 15, kbRes: 0.15, armor: false, canParry: false, range: 12, cd: 1.4, windup: 0.34, recover: 0.5, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },

  batter: { hp: 14, speed: 90, r: 5, dmg: 2, structure: 58, color: '#ffe66d', color2: '#ffffff', scale: 1, acc: 'shades', weapon: 'bat', minLevel: 8, weight: 6, value: 24, kbRes: 0.3, armor: false, canParry: false, range: 27, cd: 1.55, windup: 0.44, recover: 0.44, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  gunner: { hp: 8, speed: 52, r: 5, dmg: 1, structure: 35, color: '#c56cf0', color2: '#ffffff', scale: 1, acc: 'glasses', weapon: 'pistol', minLevel: 6, weight: 6, value: 15, kbRes: 0.2, armor: false, canParry: false, range: 150, cd: 1.3, windup: 0.55, recover: 0.35, role: 'ranged', minD: 75, maxD: 135, mag: 4, reload: 1.5 },
  bomber: { hp: 5, speed: 104, r: 5, dmg: 2, structure: 20, color: '#ff4757', color2: '#5a0a12', scale: 1, acc: 'hood', weapon: 'bomb', minLevel: 12, weight: 4, value: 20, kbRes: 0, armor: false, canParry: false, range: 18, cd: 1, windup: 0.5, recover: 0.5, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  smg: { hp: 8, speed: 60, r: 5, dmg: 1, structure: 32, color: '#4dd2ff', color2: '#0b3a4a', scale: 1, acc: 'mask', weapon: 'smg', minLevel: 15, weight: 5, value: 20, kbRes: 0.2, armor: false, canParry: false, range: 140, cd: 1.0, windup: 0.5, recover: 0.4, role: 'ranged', minD: 60, maxD: 120, mag: 3, reload: 1.8 },
  rifleman: { hp: 11, speed: 46, r: 5, dmg: 1, structure: 41, color: '#7bed9f', color2: '#2d6b3f', scale: 1, acc: 'shades', weapon: 'rifle', minLevel: 18, weight: 5, value: 20, kbRes: 0.25, armor: false, canParry: false, range: 180, cd: 1.5, windup: 0.6, recover: 0.4, role: 'ranged', minD: 95, maxD: 165, mag: 3, reload: 1.9 },
  brute: { hp: 36, speed: 60, r: 5.5, dmg: 2, structure: 122, color: '#ff6b81', color2: '#6b1f2b', scale: 1.1, acc: 'horns', weapon: 'none', minLevel: 24, weight: 3, value: 40, kbRes: 0.85, armor: true, canParry: false, range: 22, cd: 1.8, windup: 0.68, recover: 0.7, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  monk: { hp: 16, speed: 98, r: 5, dmg: 1, structure: 68, color: '#70a1ff', color2: '#ff6b35', scale: 1, acc: 'band', weapon: 'none', minLevel: 30, weight: 4, value: 30, kbRes: 0.3, armor: false, canParry: true, range: 16, cd: 1.2, windup: 0.3, recover: 0.4, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  shotgun: { hp: 13, speed: 50, r: 5, dmg: 1, structure: 43, color: '#ffb8b8', color2: '#5a1e1e', scale: 1, acc: 'shades', weapon: 'shotgun', minLevel: 34, weight: 4, value: 28, kbRes: 0.3, armor: false, canParry: false, range: 90, cd: 1.8, windup: 0.6, recover: 0.6, role: 'ranged', minD: 40, maxD: 75, mag: 2, reload: 2.2 },
  shield: { hp: 15, speed: 68, r: 5.5, dmg: 1, structure: 61, color: '#eccc68', color2: '#8a6a22', scale: 1, acc: 'helmet', weapon: 'shield', minLevel: 40, weight: 3, value: 30, kbRes: 0.55, armor: false, canParry: false, range: 16, cd: 1.5, windup: 0.45, recover: 0.5, role: 'melee', minD: 0, maxD: 0, mag: 0, reload: 0 },
  sniper: { hp: 8, speed: 50, r: 5, dmg: 2, structure: 32, color: '#ff7f50', color2: '#ffffff', scale: 1, acc: 'glasses', weapon: 'rifle', minLevel: 55, weight: 2, value: 35, kbRes: 0.2, armor: false, canParry: false, range: 260, cd: 2.6, windup: 1.2, recover: 0.8, role: 'ranged', minD: 150, maxD: 240, mag: 1, reload: 2.4 },
};

/** Palet musuh: hue berani yang tetap terbaca di arena kota maupun di padang rumput. */
const SKINS: [string, string][] = [
  ['#ff4d5e', '#4d0f18'], ['#ffa726', '#4a2705'], ['#b45cff', '#2c0f4d'],
  ['#3fd8ff', '#07333f'], ['#9ee83f', '#24400c'], ['#ff4fa3', '#4a0a2b'],
  ['#2fd6a8', '#08382c'], ['#8fa3c8', '#1c2540'], ['#e8e2d0', '#39332a'],
  ['#ff7a29', '#481904'],
];

/** Campuran penampilan tiap jenis: kacamata hitam, mata putih, ikat kepala, polos. */
const LOOKS: Record<string, string[]> = {
  thug: ['shades', 'shades', 'white', 'band', 'none', 'none'],
  knife: ['shades', 'white', 'hood', 'none'],
  batter: ['shades', 'shades', 'white', 'band', 'none'],
  gunner: ['shades', 'shades', 'white', 'none'],
  sniper: ['shades', 'shades', 'white'],
  rifleman: ['shades', 'helmet', 'white', 'none'],
  shotgun: ['shades', 'helmet', 'white', 'band'],
  smg: ['mask', 'shades', 'white'],
  bomber: ['hood', 'white', 'shades'],
  brute: ['horns', 'white', 'shades'],
  monk: ['band', 'white', 'shades'],
  fighter: ['band'],
  shield: ['helmet', 'shades', 'white'],
};

function rollLook(kind: string, elite: boolean): { acc: string; eyes: string; c: string; c2: string } {
  // ahli fist mode berseragam: merah menyala (emas bila elite) dengan ikat kepala berkibar (headband) agar langsung terbaca sebagai lawan duel Fist Mode
  if (kind === 'fighter') return { acc: 'headband', eyes: 'dot', c: elite ? '#ffd166' : '#ff6b5b', c2: elite ? '#ff2a2a' : '#ffffff' };
  const pool = LOOKS[kind] ?? ['none', 'shades', 'white'];
  const token = elite ? (Math.random() < 0.55 ? 'shades' : 'white') : pool[Math.floor(Math.random() * pool.length)];
  const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
  const acc = token === 'shades' ? 'shades' : token === 'white' ? 'none' : token;
  // di balik kacamata kadang ada mata putih menyala -> momen terbuka saat kacamatanya lepas
  const eyes = token === 'white' ? 'white' : token === 'shades' ? (Math.random() < 0.45 ? 'white' : 'dot') : Math.random() < 0.15 ? 'white' : 'dot';
  return { acc, eyes, c: skin[0], c2: token === 'band' || token === 'hood' || token === 'helmet' || token === 'horns' ? skin[1] : skin[1] };
}

export interface BossDef {
  name: string; hp: number; speed: number; r: number; dmg: number; structure: number; color: string; color2: string;
  scale: number; acc: string; weapon: string; kbRes: number; armor: boolean; canParry: boolean; value: number;
}

export const BOSS_DEFS: Record<BossKind, BossDef> = {
  bull: { name: 'IRON BULL', hp: 110, speed: 42, r: 9, dmg: 2, structure: 297, color: '#ff4757', color2: '#ffd700', scale: 2, acc: 'horns', weapon: 'none', kbRes: 0.9, armor: true, canParry: false, value: 400 },
  queen: { name: 'GUN QUEEN', hp: 90, speed: 60, r: 7, dmg: 1, structure: 216, color: '#c56cf0', color2: '#ffd700', scale: 1.5, acc: 'crown', weapon: 'pistol', kbRes: 0.5, armor: false, canParry: false, value: 400 },
  shadow: { name: 'SHADOW MASTER', hp: 100, speed: 85, r: 6, dmg: 2, structure: 243, color: '#5a5a80', color2: '#ff2a2a', scale: 1.3, acc: 'mask', weapon: 'none', kbRes: 0.6, armor: false, canParry: true, value: 500 },
  priest: { name: 'BOMB PRIEST', hp: 95, speed: 45, r: 7, dmg: 2, structure: 230, color: '#ffa502', color2: '#2f1b0a', scale: 1.5, acc: 'hood', weapon: 'bomb', kbRes: 0.6, armor: false, canParry: false, value: 400 },
  dancer: { name: 'BLADE DANCER', hp: 85, speed: 100, r: 6, dmg: 1, structure: 203, color: '#ffe66d', color2: '#ff3df2', scale: 1.3, acc: 'band', weapon: 'knife', kbRes: 0.4, armor: false, canParry: false, value: 450 },
};

const BOSS_ORDER: BossKind[] = ['bull', 'queen', 'dancer', 'priest', 'shadow'];
export function bossForLevel(n: number): BossKind {
  const i = Math.floor(n / 10) - 1;
  if (n === 200) return 'shadow';
  return BOSS_ORDER[i % BOSS_ORDER.length];
}

const TIER_PREFIX = ['', 'ELDER ', 'GRAND ', 'ETERNAL '];

export function pickKind(n: number, rng: Rng): Exclude<EnemyKind, 'boss'> {
  const keys = Object.keys(DEFS) as Exclude<EnemyKind, 'boss'>[];
  const avail = keys.filter((k) => DEFS[k].minLevel <= n);
  let total = 0;
  const ws = avail.map((k) => {
    let w = DEFS[k].weight;
    if (k === 'thug') w = Math.max(3, 10 - n / 30);
    else w *= 1 + (n - DEFS[k].minLevel) / 150;
    total += w;
    return w;
  });
  let r = rng.next() * total;
  for (let i = 0; i < avail.length; i++) {
    r -= ws[i];
    if (r <= 0) return avail[i];
  }
  return avail[avail.length - 1];
}

let nextId = 1;
/** semua musuh punya nyawa 1,5x lebih tebal */
export const HP_MULT = 1.5;
export function makeEnemy(kind: EnemyKind, boss: BossKind | undefined, x: number, y: number, n: number, elite: boolean): Enemy {
  let def: BossDef | EnemyDef;
  let name = '';
  let hpMul: number;
  let speed: number;
  if (kind === 'boss' && boss) {
    const bd = BOSS_DEFS[boss];
    def = bd;
    const tier = Math.min(3, Math.floor((n - 1) / 50));
    hpMul = 1.25 + (n / 10) * 0.5;
    name = TIER_PREFIX[tier] + bd.name;
    if (n === 200) { name = 'THE MASTER'; hpMul *= 1.35; }
    speed = bd.speed * (1 + Math.min(0.3, n * 0.0015));
  } else {
    const ed = DEFS[kind as Exclude<EnemyKind, 'boss'>];
    def = ed;
    hpMul = (1 + n * 0.035) * (elite ? 2.2 : 1);
    speed = ed.speed * (1 + Math.min(0.45, n * 0.0025) + Math.max(0, n - 200) * 0.0012) * (elite ? 1.15 : 1);
    name = kind === 'fighter' ? (elite ? 'MASTER FIST' : 'AHLI FIST') : kind.toUpperCase();
  }
  const isBoss = kind === 'boss';
  // Mental hanya mengatur keberanian menyerang, BUKAN kecepatan kaki:
  // musuh tetap bisa berlari mengejar pemain.
  let dmg = def.dmg;
  if (n >= 110 && (isBoss || kind === 'fighter' || kind === 'thug' || kind === 'knife' || kind === 'monk' || kind === 'shield' || kind === 'brute')) dmg += 1;
  if (n >= 160 && (kind === 'gunner' || kind === 'rifleman' || kind === 'bomber' || kind === 'smg' || kind === 'shotgun')) dmg += 1;
  const look = isBoss ? null : rollLook(kind, elite);
  const ed = isBoss ? null : (def as EnemyDef);
  const role: 'melee' | 'ranged' = isBoss ? (boss === 'queen' || boss === 'priest' ? 'ranged' : 'melee') : ed!.role;
  return {
    id: nextId++, kind, boss: isBoss ? boss : undefined, name, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: def.r,
    hp: Math.round(def.hp * hpMul * HP_MULT), maxHp: Math.round(def.hp * hpMul * HP_MULT), dead: false, flash: 0, facing: 1, aim: 0, walk: 0, moving: false,
    speed, dmg, color: look ? look.c : def.color, color2: look ? look.c2 : def.color2, scale: def.scale,
    structure: 0, maxStructure: def.structure * (elite ? 1.5 : 1) * (isBoss ? 1 + n / 100 : 1), stagger: 0, down: 0, stun: 0,
    state: 'chase', stateT: 0, attackCd: rnd(0.25, 0.75), pose: 'idle', poseT: 0, poseDur: 1, elite, spawnT: isBoss ? 1.2 : 0.7,
    accessory: look ? look.acc : def.acc, shades: 0, faceT: 0, eyeStyle: look ? look.eyes : 'dot', weapon: def.weapon, kbRes: def.kbRes, armor: def.armor, canParry: def.canParry, burst: 0, phase: 0,
    value: def.value * (elite ? 2 : 1), hitDone: false, strafeDir: Math.random() < 0.5 ? 1 : -1, strafeT: rnd(0.5, 1.5), summonCd: 6,
    fuse: -1, chargeDir: 0, tele: null, attackRange: 'range' in def ? def.range : 16, lastDist: 9999, stuckT: 0, shockR: [],
    parryCd: 0, cdMul: Math.max(0.5, 1 - n * 0.0025), wMul: Math.max(0.65, 1 - n * 0.0018),
    z: 0, vz: 0, flinch: 0, rot: 0, fatalCount: 0,
    role, slot: -1, slotAng: 0, token: false, tokenT: 0, wantDist: ed ? (ed.minD + ed.maxD) / 2 : 0, reload: 0, ammo: ed ? ed.mag : 0, aimLine: 0,
    sepx: 0, sepy: 0, repos: null, reposT: 0, pose2: 'idle', strideHalf: 3, runT: 0, prevSpd2: 0, locoAnticip: 0, locoBrake: 0,
    evadeCd: rnd(0.4, 1.6), flank: (nextId * 2.399963) % (Math.PI * 2), waryT: 0, feint: 0, bodyAim: 0, bleed: 0, bleedT: 0, doom: 0,
  };
}

function setPose(e: Enemy, pose: Pose, dur: number) {
  e.pose = pose;
  e.poseT = 0;
  e.poseDur = Math.max(0.01, dur);
}

function lerpAngle(a: number, b: number, t: number) {
  return a + angleDiff(b, a) * Math.min(1, t);
}

// ------------------------------------------------------------------ steering helpers
function applyMove(g: Game, e: Enemy, dx: number, dy: number, speed: number) {
  if (g.level.sideView) {
    const sx = Math.abs(dx) > 0.05 ? Math.sign(dx) : 0;
    const x = clamp(sx + e.sepx * 0.55, -1, 1);
    e.vx = x * speed;
    e.vy = 0;
    e.moving = Math.abs(e.vx) > 1;
    return;
  }
  // blend desired direction with separation from allies; slide along walls
  let x = dx + e.sepx * 0.9, y = dy + e.sepy * 0.9;
  const l = Math.hypot(x, y) || 1;
  x /= l; y /= l;
  if (!g.isFree(e.x + x * 8, e.y + y * 8, e.r)) {
    // try sliding directions
    const cands = [[x, 0], [0, y], [-y, x], [y, -x]];
    let found = false;
    for (const [cx, cy] of cands) {
      const cl = Math.hypot(cx, cy) || 1;
      if (g.isFree(e.x + (cx / cl) * 8, e.y + (cy / cl) * 8, e.r)) { x = cx / cl; y = cy / cl; found = true; break; }
    }
    if (!found) { x = 0; y = 0; }
  }
  e.vx = x * speed; e.vy = y * speed; e.moving = Math.abs(x) + Math.abs(y) > 0.01;
}

function steer(g: Game, e: Enemy, tx: number, ty: number, speed: number, useFlow: boolean) {
  let dir: Vec | null = null;
  if (useFlow) dir = flowDir(g.level, g.flow, e.x, e.y);
  if (!dir) {
    const dx = tx - e.x, dy = ty - e.y;
    const d = Math.hypot(dx, dy) || 1;
    dir = { x: dx / d, y: dy / d };
  }
  applyMove(g, e, dir.x, dir.y, speed);
}

function moveTo(g: Game, e: Enemy, tx: number, ty: number, speed: number, stopD = 0) {
  const los = lineOfSight(g.level, e.x, e.y, tx, ty);
  if (los) { steer(g, e, tx, ty, speed, false); return; }
  // no straight path to the spot: approach the player through the flow field, but never closer than stopD;
  // once near, slide sideways around the obstacle instead of walking into the player's face
  const p = g.player;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (d > stopD + 12) steer(g, e, p.x, p.y, speed, true);
  else strafe(g, e, Math.atan2(p.y - e.y, p.x - e.x), 1 / 60, speed);
}

/** Find a spot at the enemy's ideal distance that has line of sight to the player AND a clear line of fire (no ally in between). */
function findFiringSpot(g: Game, e: Enemy, radius: number): Vec | null {
  const p = g.player;
  const myAng = Math.atan2(e.y - p.y, e.x - p.x);
  let best: Vec | null = null, bd = 1e9;
  for (let i = 0; i < 12; i++) {
    const a = myAng + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 6);
    for (const rr of [radius, radius * 0.72]) {
      const x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr;
      if (!g.isFree(x, y, e.r) || !lineOfSight(g.level, x, y, p.x, p.y)) continue;
      if (allyBetween(g, e, x, y, p.x, p.y)) continue;
      const d = Math.hypot(x - e.x, y - e.y);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    if (best && i >= 3) break; // prefer small angular moves
  }
  return best;
}

function allyBetween(g: Game, e: Enemy, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const cx = dx / len, cy = dy / len;
  for (const o of g.enemies) {
    if (o === e || o.dead || o.spawnT > 0 || o.z > 8 || o.down > 0) continue;
    const ox = o.x - x0, oy = o.y - y0;
    const along = ox * cx + oy * cy;
    if (along < 4 || along > len - 4) continue;
    if (Math.abs(-ox * cy + oy * cx) < o.r + 2) return true;
  }
  return false;
}

function strafe(g: Game, e: Enemy, ang: number, dt: number, speed: number) {
  if (g.level.sideView) {
    const dx = g.player.x - e.x;
    const sx = Math.abs(dx) < 26 ? -Math.sign(dx || e.facing) : 0;
    e.vx = sx * speed * 0.7;
    e.vy = 0;
    e.moving = Math.abs(e.vx) > 2;
    return;
  }
  e.strafeT -= dt;
  if (e.strafeT <= 0) { e.strafeT = rnd(0.7, 1.6); e.strafeDir *= Math.random() < 0.7 ? -1 : 1; }
  const a = ang + (Math.PI / 2) * e.strafeDir;
  if (!g.isFree(e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 10, e.r)) e.strafeDir *= -1;
  applyMove(g, e, Math.cos(a), Math.sin(a), speed);
}

/** Position on the ring around the player assigned to this enemy's slot */
function slotPos(g: Game, e: Enemy, radius: number): Vec {
  const p = g.player;
  const a = e.slotAng;
  let x = p.x + Math.cos(a) * radius, y = p.y + Math.sin(a) * radius;
  if (!g.isFree(x, y, e.r) || !lineOfSight(g.level, p.x, p.y, x, y)) {
    // find a nearby free radius/angle
    for (let i = 1; i <= 6; i++) {
      const aa = a + i * 0.35 * (i % 2 ? 1 : -1);
      const rr = radius * (1 - i * 0.08);
      const xx = p.x + Math.cos(aa) * rr, yy = p.y + Math.sin(aa) * rr;
      if (g.isFree(xx, yy, e.r) && lineOfSight(g.level, p.x, p.y, xx, yy)) { x = xx; y = yy; break; }
    }
  }
  return { x, y };
}

/** melee enemy without an attack token: circle at a respectful distance, waiting for its turn */
function holdRing(g: Game, e: Enemy, d: number, ang: number, dt: number) {
  if (g.level.sideView) {
    const p = g.player;
    if (Math.abs(p.y - e.y) > 34) return;
    const br = g.brutality();
    const want = Math.max(36, 50 - g.levelN * 0.05 - br * 6) + (e.slot % 3) * 10;
    const dx = p.x - e.x;
    const adx = Math.abs(dx);
    if (adx < want - 7) {
      e.vx = -Math.sign(dx || e.facing) * e.speed * 0.75;
      e.vy = 0;
      e.moving = true;
    } else if (adx > want + 9) {
      e.vx = Math.sign(dx || e.facing) * e.speed * 0.8;
      e.vy = 0;
      e.moving = true;
    } else {
      e.vx = 0;
      e.vy = 0;
      e.moving = false;
    }
    return;
  }
  const br = g.brutality();
  const want = Math.max(30, 46 - g.levelN * 0.07 - br * 8) + (e.slot % 2) * 12;
  // brutal AI prefers to circle toward the player's BACK (opposite the aim) so attacks come from the blind side
  if (br > 0.3 && e.slot % 2 === 1) {
    const p = g.player;
    const back = p.aim + Math.PI;
    const my = Math.atan2(e.y - p.y, e.x - p.x);
    e.slotAng = my + angleDiff(back, my) * 0.35 * br;
  }
  // too close: back away first (never crowd the player while another attacker has the token)
  if (d < want - 12) {
    if (g.isFree(e.x - Math.cos(ang) * 12, e.y - Math.sin(ang) * 12, e.r)) applyMove(g, e, -Math.cos(ang) + e.strafeDir * 0.4 * -Math.sin(ang), -Math.sin(ang) + e.strafeDir * 0.4 * Math.cos(ang), e.speed * 0.85);
    else strafe(g, e, ang, dt, e.speed * 0.8);
    return;
  }
  const s = slotPos(g, e, want);
  const ds = Math.hypot(s.x - e.x, s.y - e.y);
  if (ds > 10) moveTo(g, e, s.x, s.y, e.speed * 0.8, want - 12);
  else strafe(g, e, ang, dt, e.speed * 0.4);
}

/** ranged enemy: keep ideal distance, avoid friendly fire line, reposition when blocked */
function rangedPosition(g: Game, e: Enemy, d: number, ang: number, dt: number, los: boolean) {
  const def = DEFS[e.kind as Exclude<EnemyKind, 'boss'>] ?? { minD: 70, maxD: 140 };
  const minD = def.minD, maxD = def.maxD;
  if (e.repos) {
    e.reposT -= dt;
    const dr = Math.hypot(e.repos.x - e.x, e.repos.y - e.y);
    if (dr < 8 || e.reposT <= 0) e.repos = null;
    else { moveTo(g, e, e.repos.x, e.repos.y, e.speed, minD); return; }
  }
  if (!los) {
    // no sight line: head for a real firing position instead of blindly walking at the player
    const spot = findFiringSpot(g, e, e.wantDist);
    if (spot) { e.repos = spot; e.reposT = 1.2; moveTo(g, e, spot.x, spot.y, e.speed, minD); }
    else if (d > minD + 12) steer(g, e, g.player.x, g.player.y, e.speed, true);
    else strafe(g, e, ang, dt, e.speed);
    return;
  }
  if (d < minD) {
    // too close: back off (or sidestep if a wall is behind)
    if (g.isFree(e.x - Math.cos(ang) * 12, e.y - Math.sin(ang) * 12, e.r)) applyMove(g, e, -Math.cos(ang) + e.strafeDir * 0.35 * -Math.sin(ang), -Math.sin(ang) + e.strafeDir * 0.35 * Math.cos(ang), e.speed);
    else strafe(g, e, ang, dt, e.speed);
    return;
  }
  if (d > maxD) { steer(g, e, g.player.x, g.player.y, e.speed, false); return; }
  // in band: drift toward the assigned slot so shooters spread out around the player
  const s = slotPos(g, e, e.wantDist);
  const ds = Math.hypot(s.x - e.x, s.y - e.y);
  if (ds > 14) moveTo(g, e, s.x, s.y, e.speed * 0.75, minD);
  else strafe(g, e, ang, dt, e.speed * 0.35);
}

/** aim ahead of a moving player so bullets actually arrive where he is going (brutal shooters) */
function leadAngle(g: Game, e: Enemy, bulletSpeed: number) {
  const p = g.player;
  const br = g.brutality();
  const dx = p.x - e.x, dy = p.y - e.y;
  const t = Math.hypot(dx, dy) / bulletSpeed;
  const lead = 0.85 * br;
  return Math.atan2(dy + p.vy * t * lead, dx + p.vx * t * lead);
}

/** would this shot pass through an ally? */
export function friendlyInLine(g: Game, e: Enemy, ang: number, maxD: number) {
  const cx = Math.cos(ang), sy = Math.sin(ang);
  for (const o of g.enemies) {
    if (o === e || o.dead || o.spawnT > 0 || o.z > 8 || o.down > 0) continue; // bullets fly over knocked-down allies
    const dx = o.x - e.x, dy = o.y - e.y;
    const along = dx * cx + dy * sy;
    if (along < 4 || along > maxD) continue;
    const perp = Math.abs(-dx * sy + dy * cx);
    if (perp < o.r + 2) return true;
  }
  return false;
}

export function updateEnemy(g: Game, e: Enemy, dt: number) {
  if ((e as Enemy & { mirror?: boolean }).mirror || (e as Enemy & { punchLock?: boolean }).punchLock || (e as Enemy & { throwLock?: boolean }).throwLock) return; // AI cermin / adegan pukulan diurus modulnya
  const p = g.player;
  tickReact(e, dt);
  e.poseT += dt / e.poseDur;
  // V2 juicy squash relaxes back to neutral (game1 uses the same ~10/s easing)
  e.sqx = (e.sqx ?? 1) + (1 - (e.sqx ?? 1)) * Math.min(1, dt * 10);
  e.sqy = (e.sqy ?? 1) + (1 - (e.sqy ?? 1)) * Math.min(1, dt * 10);
  if (e.flash > 0) e.flash -= dt;
  if (e.flinch > 0) e.flinch -= dt;
  if (e.faceT > 0) e.faceT -= dt;
  if (e.parryCd > 0) e.parryCd -= dt;
  if (e.summonCd > 0) e.summonCd -= dt;
  if (e.aimLine > 0) e.aimLine -= dt;
  e.moving = false;
  e.vx = 0; e.vy = 0;
  if ((e as unknown as { jack?: unknown }).jack && jackPre(g, e, dt)) return;
  if ((e as unknown as { ai2?: unknown }).ai2) wielderPre(e);
  if ((e as unknown as { sm?: unknown }).sm) smartPre(e);
  if ((e as unknown as { tb?: unknown }).tb) teamPre(e);
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  // bleeding (katana / tiger claw): damage over time + dripping blood
  if (e.bleed > 0) {
    e.bleedT -= dt;
    if (e.bleedT <= 0) { e.bleedT = 0.35; e.bleed--; const bleedDead = g.chipEnemy(e, 1); g.particles.blood(e.x, e.y - 6 - e.z, 2, rnd(0, 6.3), 50); if (Math.random() < 0.5) g.stamp(e.x + rnd(-3, 3), e.y + rnd(0, 3), '#8a0000', 1); if (bleedDead) { g.killEnemy(e, rnd(0, 6.3), 80, false, true); return; } }
  }
  // doomed (iaijutsu): frozen for a beat, then falls apart
  if (e.doom > 0) {
    e.doom -= dt; e.pose = 'stagger'; e.vx = e.vy = 0;
    if (e.doom <= 0) { g.iaiKill(e); }
    return;
  }
  if (e.z > 0 || e.vz !== 0) {
    e.vz -= (e.state === 'air' ? 390 : 520) * dt;
    e.z += e.vz * dt;
    e.pose = 'launched';
    e.rot = Math.max(-0.9, Math.min(0.9, -e.vz / 350)) * e.facing;
    if (e.z <= 0) { const impact = -e.vz; e.z = 0; e.vz = 0; e.rot = 0; g.enemyLand(e, impact); }
    return;
  }
  if (g.level.sideView && e.state === 'air' && !e.svGrounded) {
    if (e.stun > 0) e.stun = Math.max(0, e.stun - dt);
    e.pose = 'launched';
    e.rot = clamp(-(e.svVy ?? 0) / 350, -0.9, 0.9) * e.facing;
    return;
  }
  const ddx = p.x - e.x, ddy = p.y - e.y;
  const d = Math.hypot(ddx, ddy) || 1;
  const ang = Math.atan2(ddy, ddx);

  if (e.fuse >= 0) {
    e.fuse -= dt;
    if (e.fuse <= 0) { e.fuse = -1; g.explode(e.x, e.y, 32, e.dmg, false); g.killEnemy(e, ang, 0, true); return; }
  }
  if (e.stagger > 0) {
    e.stagger -= dt; e.pose = 'stagger';
    if (e.stagger <= 0) { e.structure = 0; e.state = 'chase'; e.attackCd = 0.5; }
    return;
  }
  if (e.down > 0) {
    e.down -= dt; e.pose = 'down';
    if (e.down <= 0) {
      e.structure *= 0.6;
      // V2 (game1): bangun dari lantai sambil pusing dulu sebentar, bukan langsung mengejar
      if (g.v2) { e.stun = 0.7; e.state = 'stun'; e.pose = 'hurt'; e.attackCd = 1.0; e.getupT = 0.26; e.fall = undefined; }
      else { e.state = 'chase'; e.attackCd = 0.5; }
    }
    return;
  }
  if (e.stun > 0) {
    e.stun -= dt;
    if ((e.getupT ?? 0) > 0) { e.getupT = (e.getupT ?? 0) - dt; e.pose = 'getup'; }   // V2: bangkit bertumpu dulu, baru pusing
    else e.pose = 'hurt';
    if (e.stun <= 0) e.state = 'chase';
    return;
  }
  if (e.structure > 0) e.structure = Math.max(0, e.structure - e.maxStructure * 0.05 * dt);
  // brutality: faster wind-ups, shorter cooldowns, less structure decay time
  const br = g.brutality();
  e.wMul = Math.max(0.5, (1 - g.levelN * 0.0018) * (1 - br * 0.3));
  e.cdMul = Math.max(0.35, (1 - g.levelN * 0.0025) * (1 - br * 0.35));
  if (e.attackCd > 0) e.attackCd -= dt;
  if (e.reload > 0) {
    e.reload -= dt;
    if (e.reload <= 0) { const def = DEFS[e.kind as Exclude<EnemyKind, 'boss'>]; e.ammo = def ? def.mag : 1; }
  }
  if ((e as unknown as { jack?: unknown }).jack) aiJack(g, e, dt, d, ang);
  else if ((e as unknown as { ai2?: unknown }).ai2) aiWielder(g, e, dt, d, ang);
  else if ((e as unknown as { sm?: unknown }).sm) aiSmart(g, e, dt, d, ang);
  else if ((e as unknown as { tb?: unknown }).tb) aiTeam(g, e, dt);
  else if (e.kind === 'boss') aiBoss(g, e, dt, d, ang);
  else if (e.kind === 'fighter') aiFighter(g, e, dt, d, ang);
  else aiBasic(g, e, dt, d, ang);
  if (g.level.sideView) sideViewEnemyNav(g, e, dt);
  // feet never slide: the stride advances with the actual ground speed (62 px/s ~= the old 14 rad/s)
  const fighterAI = e.kind === 'fighter' || !!(e as unknown as { ai2?: unknown; sm?: unknown }).ai2 || !!(e as unknown as { sm?: unknown }).sm || !!(e as unknown as { tb?: unknown }).tb || e.kind === 'duelist';
  // petarung bersenjata: terjangan (kx) dihitung penuh, kalau tidak badan meluncur tanpa langkah
  const stairClimbSpd = g.level.sideView && officeOnStairs(g.level, e.x, e.y, 4) && !e.svGrounded ? Math.abs(e.svVy ?? 0) * 0.75 : 0;
  const rawGs = fighterAI ? Math.min(150, Math.hypot(e.vx + e.kx, e.vy + e.ky)) : Math.hypot(e.vx + e.kx * 0.3, e.vy + e.ky * 0.3);
  const gs = Math.max(rawGs, stairClimbSpd);
  if (((e.pose === 'idle' || e.pose === 'reload' || e.pose === 'charge') || (fighterAI && e.down <= 0 && e.stun <= 0 && e.stagger <= 0 && e.z <= 0)) && gs > 3) {
    const gc = gaitCadence(gs, e.runT, e.scale);
    const stepsPerSec = Math.min(6.5, Math.max(0.6, gc.stepsPerSec));
    e.strideHalf = gc.stride;
    e.walk += dt * stepsPerSec * Math.PI;
  } else if (!e.moving && gs <= 2) e.walk = 0;
  // jalan -> lari: di atas ~45 px/dtk kaki mulai berlari, penuh di ~120 px/dtk
  {
    const want = e.z > 1 || e.down > 0 || e.stun > 0 ? 0 : Math.max(0, Math.min(1, (gs - 42) / 40));
    e.runT += (want - e.runT) * Math.min(1, dt * 16);
    // bobot: musuh juga merendah sebelum berangkat dan mengerem saat berhenti
    const prevSpd = e.prevSpd2;
    const acc = (gs - prevSpd) / Math.max(dt, 0.001);
    e.prevSpd2 = gs;
    const wantAnt = gs > 8 && gs < 55 && acc > 90 ? 1 : 0;
    const wantBrk = prevSpd > 60 && acc < -260 ? 1 : 0;
    e.locoAnticip += (wantAnt - e.locoAnticip) * Math.min(1, dt * (wantAnt ? 16 : 8));
    e.locoBrake += (wantBrk - e.locoBrake) * Math.min(1, dt * (wantBrk ? 20 : 7));
    if (e.evadeCd > 0) e.evadeCd -= dt;
    if (e.waryT > 0) e.waryT -= dt;
  }
  // walking enemies face where they go; shooters/attackers/stunned face their aim (the player)
  const walking = (e.pose === 'idle' || e.pose === 'reload') && e.moving && gs > 16 && e.state === 'chase';
  if (g.level.sideView) {
    if (walking && Math.abs(e.vx) > 4) {
      e.facing = e.vx >= 0 ? 1 : -1;
      e.bodyAim = e.facing >= 0 ? 0 : Math.PI;
    } else {
      e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;
      e.bodyAim = e.role === 'melee' && Math.abs(p.y - e.y) <= 34 ? (e.facing >= 0 ? 0 : Math.PI) : e.aim;
    }
  } else if (walking && Math.abs(e.vx) > 6) {
    e.facing = e.vx >= 0 ? 1 : -1;
    e.bodyAim = Math.atan2(e.vy, e.vx);
  } else {
    e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;
    e.bodyAim = e.aim;
  }
}

/** Titik kepung: tiap musuh punya slot sudut sendiri supaya mereka MENGEPUNG,
 *  bukan berbaris menumpuk di satu sisi pemain. */
function flankPoint(g: Game, e: Enemy, radius: number) {
  const p = g.player;
  const cur = Math.atan2(e.y - p.y, e.x - p.x);
  let a = e.flank;
  // pilih arah putar terpendek dari posisi sekarang supaya tidak memotong lewat pemain
  let diff = a - cur;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  a = cur + diff * 0.55;
  return { x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius * 0.82 };
}

/** Kejar dengan gigi: berlari kencang saat jauh, melambat tepat di jarak pukul. */
function chaseSpeed(e: Enemy, d: number, opening: boolean) {
  const far = d > 110 ? 1.5 : d > 62 ? 1.26 : d > 34 ? 1.08 : 0.92;
  return e.speed * far * (opening ? 1.22 : 1);
}

/**
 * PETARUNG FIST (kind 'fighter') — musuh ahli tangan kosong untuk adu duel & parry.
 *  - Combo berirama 2-4 pukulan/tendangan. Tiap pukulan bertelegraf (cincin merah menyempit -> HIJAU di 0,2 dtk terakhir):
 *    tekan C saat hijau = parry sempurna (musuh pusing & posturnya runtuh). Pukulan lanjutan lebih cepat tapi tetap >= 0,2 dtk.
 *  - TIPUAN (feint): pukulan pertama dibatalkan lalu diulang lebih cepat untuk menghukum parry yang terlalu dini.
 *  - BLOK (guard): menahan serangan pemain (damage -70%) tapi posturnya tetap tergerus, lalu RIPOSTE cepat.
 *  - MENGHINDAR: mundur cepat membaca ayunan pemain, lalu langsung membalas.
 *  - Mematuhi sistem token serangan: tidak mengeroyok bersamaan.
 */
const FIGHTER_COMBOS: Pose[][] = [
  ['jab', 'cross', 'hook', 'uppercut'],
  ['jab', 'cross', 'axekick'],
  ['cross', 'hook', 'roundhouse'],
  ['jab', 'elbow', 'cartwheelkick'],
  ['hook', 'cross', 'butterflyflip'],
  ['elbow', 'palm', 'sidekick'],
  ['jab', 'jab', 'cross', 'axekick'],
];
export function aiFighter(g: Game, e: Enemy, dt: number, d: number, ang: number) {
  const p = g.player, def = DEFS.fighter;
  const sv = !!g.level.sideView;
  const sameFloor = !sv || Math.abs(p.y - e.y) <= 34;
  const aimA = sv && sameFloor ? (p.x >= e.x ? 0 : Math.PI) : ang;
  const combatD = sv && sameFloor ? Math.abs(p.x - e.x) : d;
  const reach = e.attackRange + p.r + (sv ? 6 : 4);
  const skill = Math.min(1, 0.48 + g.levelN * 0.014 + (e.elite ? 0.32 : 0));
  const los = g.hasLOS(e);
  e.guardT = Math.max(0, (e.guardT ?? 0) - dt);
  e.fPunishT = Math.max(0, (e.fPunishT ?? 0) - dt);
  const beginHit = (wu0: number, feintOk: boolean) => {
    const wu = Math.max(0.24, wu0);                 // telegraf jelas (>= 0.24 dtk): cincin merah menyempit -> hijau di 0.22 dtk terakhir untuk di-parry!
    e.state = 'windup'; e.stateT = wu; e.fWind = wu; setPose(e, 'windup', wu); e.hitDone = false; e.burst = 0;
    e.feint = feintOk && skill > 0.45 && Math.random() < 0.2 ? wu : 0;
    g.particles.ring(e.x, e.y - 8, 2, 13, e.feint > 0 ? '#ffd27f' : '#ff4d4d', 0.18, 1);   // telegraf: kilat cincin saat mulai bersiap
  };
  switch (e.state) {
    case 'chase': {
      e.aim = aimA;
      if (e.pose !== 'idle' && e.pose !== 'dash') setPose(e, 'idle', 1);
      const opening = p.attackPhase === 'recover' || p.dashT > 0 || p.stunT > 0 || p.airborne || p.parryT > 0;
      // 1) membaca pemain: ayunan masuk -> BLOK/PARRY atau MENGHINDAR mundur lalu counter!
      const incoming = sameFloor && (p.attackPhase === 'windup' || p.attackPhase === 'active') && combatD < reach + 24;
      if (incoming && !opening && e.evadeCd <= 0 && e.z <= 0 && Math.random() < 0.42 + skill * 0.38) {
        e.evadeCd = 0.8 + Math.random() * 0.75;
        if (Math.random() < 0.62) {
          e.state = 'guard'; e.stateT = 0.48; e.guardT = 0.48; setPose(e, 'parry', 0.48);
          g.particles.ring(e.x, e.y - 8, 2, 12, '#cfd8ff', 0.16, 1);
        } else {
          e.kx += -Math.cos(aimA) * 205; if (!sv) e.ky += -Math.sin(aimA) * 205;
          setPose(e, 'dash', 0.22);
          e.fPunishT = 0.75; e.attackCd = Math.min(e.attackCd, 0.08);       // celah balas setelah menghindar
          g.particles.smoke(e.x, e.y, 2, '#cfcfcf', 20, 0.26);
          if (Math.random() < 0.35) g.sfx.dash();
        }
        break;
      }
      // 2) di Mode Kantor V2, ahli Fist Mode berani maju mengajak duel tanpa harus menunggu antrean lama bila sepi di dekat pemain
      const holder = !e.token && !e.elite && (!sv || combatD > 48);
      const stop = e.attackRange + p.r - 3;
      if (sv) {
        if (sameFloor) {
          if (holder) holdRing(g, e, d, aimA, dt);
          else if (combatD > stop + 2) applyMove(g, e, Math.sign(p.x - e.x), 0, chaseSpeed(e, combatD, opening));
          else if (combatD < Math.max(8, stop - 8)) applyMove(g, e, -Math.sign(p.x - e.x || e.facing), 0, e.speed * 0.6);
        }
      } else {
        const ringR = holder ? stop + 24 : stop;
        if (d > ringR + 6) { const fp = flankPoint(g, e, ringR); steer(g, e, fp.x, fp.y, chaseSpeed(e, d, opening), !los && d > 70); }
        else if (d > stop && !holder) steer(g, e, p.x, p.y, chaseSpeed(e, d, opening), !los);
        else strafe(g, e, ang, dt, e.speed * 0.55);
      }
      if (holder) break;
      // 3) pilih combo Fist Mode & serang; celah pemain / habis menghindar dihukum lebih cepat
      if (sameFloor && combatD < reach && e.attackCd <= 0 && los) {
        const long = e.elite || skill > 0.65;
        let seq = FIGHTER_COMBOS[(Math.random() * FIGHTER_COMBOS.length) | 0];
        if (!long && seq.length > 3) seq = seq.slice(0, 3);
        e.fCombo = seq; e.fIdx = 0;
        const punish = opening || e.fPunishT > 0;
        beginHit(def.windup * e.wMul * (punish ? 0.65 : 0.88), !punish);
      }
      break;
    }
    case 'windup': {
      e.stateT -= dt;
      e.aim = sv && sameFloor ? aimA : lerpAngle(e.aim, ang, dt * 6);
      if (sv && sameFloor && combatD > e.attackRange + p.r - 3) applyMove(g, e, Math.sign(p.x - e.x), 0, e.speed * 0.45);   // melangkah masuk sambil bersiap
      if (e.stateT <= 0 && e.feint > 0) {
        // TIPUAN: batal + geser, lalu pukul sungguhan lebih cepat (menghukum parry terlalu dini)
        e.feint = 0;
        e.kx += -Math.cos(e.aim) * 105; if (!sv) e.ky += -Math.sin(e.aim) * 105;
        g.particles.smoke(e.x, e.y, 2, '#bdbdbd', 18, 0.24);
        g.texts.hit(e.x, e.y - 24, 'TIPUAN!', '#ffd27f', 1, 0.5);
        beginHit(0.24, false);
        break;
      }
      if (e.stateT <= 0) {
        const pose = (e.fCombo?.[e.fIdx ?? 0] ?? 'cross') as Pose;
        const isAcro = pose === 'butterflyflip' || pose === 'cartwheelkick' || pose === 'axekick';
        const atkDur = isAcro ? 0.30 : 0.24;
        e.state = 'attack'; e.stateT = atkDur; setPose(e, pose, atkDur / 0.72); e.poseT = 0.24;
        const lunge = pose === 'butterflyflip' || pose === 'cartwheelkick' ? 135 : pose === 'roundhouse' || pose === 'sidekick' || pose === 'axekick' ? 115 : pose === 'uppercut' || pose === 'palm' ? 95 : 82;
        e.kx += Math.cos(e.aim) * lunge; if (!sv) e.ky += Math.sin(e.aim) * lunge;
        g.sfx.whoosh();
      }
      break;
    }
    case 'attack': {
      e.stateT -= dt;
      if (!e.hitDone && e.poseT > 0.34) {
        e.hitDone = true;
        const last = (e.fIdx ?? 0) >= (e.fCombo?.length ?? 1) - 1;
        const heavy = last && (e.pose === 'uppercut' || e.pose === 'roundhouse' || e.pose === 'sidekick' || e.pose === 'axekick' || e.pose === 'butterflyflip' || e.pose === 'cartwheelkick' || e.pose === 'palm');
        const hitRange = (e.pose === 'butterflyflip' || e.pose === 'cartwheelkick' || e.pose === 'axekick') ? e.attackRange + 9 : e.attackRange + 6;
        g.enemyMeleeHit(e, e.dmg + (heavy && e.elite ? 1 : 0), hitRange, 1.15, heavy);
      }
      if (e.stateT <= 0) {
        const next = (e.fIdx ?? 0) + 1;
        if (e.fCombo && next < e.fCombo.length && sameFloor && combatD < reach + 16 && !(p.parryT > 0)) {
          e.fIdx = next;
          beginHit(Math.max(0.22, def.windup * e.wMul * 0.62), false);     // lanjutan combo lebih cepat tapi tetap terbaca untuk di-parry
        } else {
          e.fCombo = undefined; e.fIdx = 0; e.burst = 0;
          e.state = 'recover'; e.stateT = def.recover * 0.88; setPose(e, 'idle', 1);
          e.attackCd = def.cd * e.cdMul * (0.85 + Math.random() * 0.45);   // jeda setelah combo = celah menyerang balik
          g.releaseToken(e);
        }
      }
      break;
    }
    case 'guard': {
      e.stateT -= dt; e.aim = aimA;
      if (e.pose !== 'parry') setPose(e, 'parry', 0.5);
      if (e.stateT <= 0) {
        e.guardT = 0;
        if (sameFloor && combatD < reach + 10 && Math.random() < 0.65 + skill * 0.3) {
          e.fCombo = Math.random() < 0.5 ? ['cross', 'hook', 'uppercut'] : ['jab', 'cross', 'axekick'];
          e.fIdx = 0;
          g.texts.hit(e.x, e.y - 24, 'COUNTER!', '#ffd166', 1, 0.45);
          beginHit(0.22, false);   // RIPOSTE cepat setelah menahan serangan pemain
        } else { e.state = 'chase'; e.attackCd = 0.18; }
      }
      break;
    }
    default: {
      e.stateT -= dt; e.aim = aimA;
      if (e.stateT <= 0) e.state = 'chase';
    }
  }
}

function aiBasic(g: Game, e: Enemy, dt: number, d: number, ang: number) {
  const p = g.player;
  const def = DEFS[e.kind as Exclude<EnemyKind, 'boss'>];
  const los = g.hasLOS(e);
  switch (e.kind) {
    case 'duelist': { g.brain.update(g, e, dt); break; }
    case 'thug': case 'brute': case 'monk': case 'shield': case 'batter': {
      const sameFloor = !g.level.sideView || Math.abs(p.y - e.y) <= 34;
      const aimA = g.level.sideView && sameFloor ? (p.x >= e.x ? 0 : Math.PI) : ang;
      const combatD = g.level.sideView && sameFloor ? Math.abs(p.x - e.x) : d;
      switch (e.state) {
        case 'chase': {
          e.aim = aimA;
          const stop = e.attackRange + p.r - 4;
          const reach = e.attackRange + p.r + (g.level.sideView ? 4 : 3);
          const skill = Math.min(1, 0.28 + g.levelN * 0.012 + (e.elite ? 0.35 : 0) + g.brutality() * 0.3);
          const opening = p.attackPhase === 'recover' || p.dashT > 0 || p.stunT > 0 || p.airborne || p.parryT > 0;
          if (e.pose !== 'idle' && e.pose !== 'dash') setPose(e, 'idle', 1);

          // --- MENGHINDAR: membaca ayunan pemain dan melompat keluar jalur ---
          const incoming = sameFloor && (p.attackPhase === 'windup' || p.attackPhase === 'active') && combatD < reach + 20;
          if (incoming && !opening && e.evadeCd <= 0 && e.z <= 0 && Math.random() < skill * 0.45) {
            e.evadeCd = 1.2 + Math.random() * 1.3;
            const side = Math.random() < 0.5 ? 1 : -1;
            const away = aimA + Math.PI + (g.level.sideView ? 0 : side * 0.7);
            e.kx += Math.cos(away) * 195;
            if (!g.level.sideView) e.ky += Math.sin(away) * 195;
            setPose(e, 'dash', 0.22);
            e.attackCd = Math.max(e.attackCd, 0.18);
            g.particles.smoke(e.x, e.y, 2, '#cfcfcf', 20, 0.26);
            if (Math.random() < 0.25) g.sfx.dash();
            break;
          }

          // --- TERLUKA: mundur sebentar, mengitari, cari celah ---
          if (!e.elite && !e.boss && e.hp < e.maxHp * 0.25 && e.waryT <= 0 && Math.random() < dt * 0.7) e.waryT = 0.9 + Math.random() * 0.8;

          // --- MENGEPUNG / MENDEKAT ---
          const holder = !e.token && !e.elite;
          const ringR = e.waryT > 0 ? stop + 42 : holder ? stop + 24 : stop;
          if (g.level.sideView) {
            if (sameFloor) {
              if (holder || e.waryT > 0) {
                holdRing(g, e, d, aimA, dt);
              } else if (combatD > stop) {
                applyMove(g, e, Math.sign(p.x - e.x), 0, chaseSpeed(e, combatD, opening));
              } else if (combatD < Math.max(8, stop - 8)) {
                applyMove(g, e, -Math.sign(p.x - e.x || e.facing), 0, e.speed * 0.55);
              }
            }
          } else if (d > ringR + 6) {
            const fp = flankPoint(g, e, ringR);
            steer(g, e, fp.x, fp.y, chaseSpeed(e, d, opening), !los && d > 70);
          } else if (d > stop && !holder && e.waryT <= 0) {
            steer(g, e, p.x, p.y, chaseSpeed(e, d, opening), !los);
          } else {
            strafe(g, e, ang, dt, e.speed * (e.waryT > 0 ? 0.8 : 0.5));
          }
          if (holder || e.waryT > 0) break;

          // --- MENYERANG: celah pemain selalu dihukum, tanpa ragu ---
          if (sameFloor && combatD < reach && e.attackCd <= 0 && los) {
            if (!opening && !g.level.sideView) {
              if (!e.elite && !e.boss && Math.random() > g.mental + skill * 0.35) { e.attackCd = 0.18; break; }
              if (Math.random() < 0.25 * (1 - skill) && e.stateT <= 0) { e.stateT = 0.08; break; }
            }
            const wu = def.windup * e.wMul * (opening ? 0.68 : 0.82);
            e.state = 'windup'; e.stateT = wu; setPose(e, 'windup', wu); e.hitDone = false; e.burst = 0;
            e.feint = !opening && skill > 0.5 && Math.random() < skill * 0.12 ? wu : 0;
          }
          break;
        }
        case 'windup': {
          e.stateT -= dt;
          e.aim = g.level.sideView && sameFloor ? aimA : lerpAngle(e.aim, ang, dt * (e.kind === 'brute' ? 2.5 : 6));
          if (g.level.sideView && sameFloor && combatD > e.attackRange + p.r - 4) {
            applyMove(g, e, Math.sign(p.x - e.x), 0, e.speed * 0.42);
          }
          if (e.stateT <= 0 && e.feint > 0) {
            e.feint = 0;
            e.state = 'chase'; setPose(e, 'dash', 0.2);
            const side = Math.random() < 0.5 ? 1 : -1;
            if (g.level.sideView) {
              e.kx += -Math.cos(e.aim) * 160;
            } else {
              e.kx += Math.cos(ang + side * 1.5) * 190; e.ky += Math.sin(ang + side * 1.5) * 190;
            }
            e.attackCd = 0.22 + Math.random() * 0.18;
            e.flank += side * 0.9;
            g.particles.smoke(e.x, e.y, 2, '#bdbdbd', 18, 0.24);
            break;
          }
          if (e.stateT <= 0) {
            const thugSeq: Pose[] = ['jab', 'cross', 'hook', 'kick', 'uppercut'];
            const monkSeq: Pose[] = ['palm', 'roundhouse', 'hook', 'elbow', 'sidekick'];
            const atkPose: Pose = e.kind === 'brute'
              ? (e.burst % 2 ? 'hammer' : 'palm')
              : e.kind === 'shield'
                ? (e.burst % 2 ? 'punch' : 'palm')
                : e.kind === 'batter'
                  ? (e.burst % 2 ? 'b_wildback' : 'b_wild')
                  : e.kind === 'monk'
                    ? monkSeq[(e.id + e.burst) % monkSeq.length]
                    : thugSeq[(e.id + e.burst) % thugSeq.length];
            const atkDur = e.kind === 'batter' ? 0.28 : e.kind === 'brute' ? 0.3 : 0.24;
            e.state = 'attack';
            e.stateT = atkDur;
            setPose(e, atkPose, atkDur / 0.72);
            e.poseT = 0.24;
            const lunge = e.kind === 'brute' ? 40 : e.kind === 'monk' ? 110 : e.kind === 'batter' ? 120 : 85;
            e.kx += Math.cos(e.aim) * lunge;
            if (!g.level.sideView) e.ky += Math.sin(e.aim) * lunge;
            if (e.kind === 'brute') { g.sfx.slam(); g.shake(0.35); g.particles.shockwave(e.x, e.y + 2, e.attackRange + 6, '#ffffff', 0.25); g.particles.smoke(e.x + Math.cos(e.aim) * 10, e.y + (g.level.sideView ? 0 : Math.sin(e.aim) * 10), 6, '#555'); }
            else if (e.kind === 'batter') {
              g.sfx.axeSwing();
              g.katana.addArc(e.x, e.y - 7 * e.scale, 20, e.aim - e.facing * 1.5, e.aim + e.facing * 1.0, '#e6b877', 0, 0.2);
            } else g.sfx.whoosh();
          }
          break;
        }
        case 'attack': {
          e.stateT -= dt;
          if (!e.hitDone && e.poseT > 0.34) {
            e.hitDone = true;
            g.enemyMeleeHit(e, e.dmg, e.attackRange + 6, e.kind === 'brute' ? 1.4 : e.kind === 'batter' ? 1.25 : 1.05, e.kind === 'brute' || e.kind === 'shield' || e.kind === 'batter');
            if (e.kind === 'batter') { g.sfx.batCrack(); g.particles.ring(e.x + Math.cos(e.aim) * 16, e.y - 6 + (g.level.sideView ? 0 : Math.sin(e.aim) * 10), 2, 12, '#ffd27f', 0.16, 2); }
          }
          if (e.stateT <= 0) {
            const chainMonk = e.kind === 'monk' && e.burst < 2 && combatD < 40;
            const chainThug = e.kind === 'thug' && e.burst === 0 && sameFloor && combatD < e.attackRange + p.r + 8 && Math.random() < (g.level.sideView ? 0.38 : 0.22);
            if (chainMonk || chainThug) {
              e.burst++;
              const cw = chainMonk ? 0.18 : 0.22;
              e.state = 'windup'; e.stateT = cw; setPose(e, 'windup', cw); e.hitDone = false;
            } else {
              e.burst = 0; e.state = 'recover'; e.stateT = def.recover * 0.85; setPose(e, 'idle', 1); e.attackCd = def.cd * e.cdMul;
              g.releaseToken(e);
            }
          }
          break;
        }
        default: {
          e.stateT -= dt; e.aim = aimA;
          if (e.stateT <= 0) e.state = 'chase';
        }
      }
      break;
    }
    case 'knife': {
      const sameFloor = !g.level.sideView || Math.abs(p.y - e.y) <= 34;
      const aimA = g.level.sideView && sameFloor ? (p.x >= e.x ? 0 : Math.PI) : ang;
      const combatD = g.level.sideView && sameFloor ? Math.abs(p.x - e.x) : d;
      switch (e.state) {
        case 'chase': {
          e.aim = aimA;
          if (e.pose !== 'idle') setPose(e, 'idle', 1);
          if (!e.token && !e.elite) { holdRing(g, e, d, aimA, dt); break; }
          if (g.level.sideView) {
            if (sameFloor) {
              if (combatD > 38) applyMove(g, e, Math.sign(p.x - e.x), 0, e.speed);
              else strafe(g, e, aimA, dt, e.speed * 0.6);
            }
          } else {
            if (d > 40) steer(g, e, p.x, p.y, e.speed, !los); else strafe(g, e, ang, dt, e.speed * 0.6);
          }
          if (sameFloor && combatD < 62 && e.attackCd <= 0 && los) { const wu = def.windup * e.wMul; e.state = 'windup'; e.stateT = wu; setPose(e, 'windup', wu); }
          break;
        }
        case 'windup': {
          e.stateT -= dt; e.aim = g.level.sideView && sameFloor ? aimA : lerpAngle(e.aim, ang, dt * 8);
          if (e.stateT <= 0) {
            e.state = 'lunge'; e.stateT = 0.22; setPose(e, 'charge', 0.22); e.hitDone = false;
            e.chargeDir = g.level.sideView ? (Math.cos(e.aim) >= 0 ? 0 : Math.PI) : e.aim;
            g.sfx.whoosh();
          }
          break;
        }
        case 'lunge': {
          e.stateT -= dt;
          e.vx = Math.cos(e.chargeDir) * 260; e.vy = g.level.sideView ? 0 : Math.sin(e.chargeDir) * 260; e.moving = true; e.aim = e.chargeDir;
          g.addAfterimage(e);
          if (!e.hitDone && sameFloor && combatD < e.r + p.r + 7) { e.hitDone = true; g.enemyMeleeHit(e, e.dmg, 16, 3.2, false); }
          if (e.stateT <= 0) { e.state = 'recover'; e.stateT = def.recover; setPose(e, 'idle', 1); e.attackCd = def.cd * e.cdMul; g.releaseToken(e); }
          break;
        }
        default: {
          e.stateT -= dt; e.aim = aimA;
          if (e.stateT <= 0) e.state = 'chase';
        }
      }
      break;
    }
    case 'gunner': case 'rifleman': case 'sniper': case 'smg': case 'shotgun': {
      const maxD = def.maxD;
      switch (e.state) {
        case 'chase': {
          e.aim = ang;
          rangedPosition(g, e, d, ang, dt, los);
          if (e.pose !== (e.reload > 0 ? 'reload' : 'idle')) setPose(e, e.reload > 0 ? 'reload' : 'idle', 1);
          if (e.ammo <= 0 && e.reload <= 0) { e.reload = def.reload; g.texts.add(e.x, e.y - 18, 'RELOAD', '#aaaaaa', 1, 0.5); }
          if (los && d < maxD + 40 && e.attackCd <= 0 && e.ammo > 0 && e.reload <= 0) {
            e.stuckT += dt;
            if (friendlyInLine(g, e, ang, d) && e.stuckT < 1.5) {
              // an ally is in the line of fire: move to a spot with a clear shot instead of shooting through him
              if (!e.repos) {
                const spot = findFiringSpot(g, e, e.wantDist);
                if (spot) { e.repos = spot; e.reposT = 1.0; }
                else { const sa = ang + (Math.PI / 2) * e.strafeDir; e.repos = { x: e.x + Math.cos(sa) * 30, y: e.y + Math.sin(sa) * 30 }; e.reposT = 0.6; }
              }
            } else {
              const wu = def.windup * (e.kind === 'sniper' ? 1 : e.wMul);
              e.state = 'windup'; e.stateT = wu; setPose(e, 'shoot', wu); e.aimLine = wu; e.stuckT = 0;
            }
          }
          break;
        }
        case 'windup': {
          e.stateT -= dt;
          if (!(e.kind === 'sniper' && e.stateT < 0.3)) e.aim = lerpAngle(e.aim, ang, dt * 10);
          if (e.stateT <= 0) {
            e.ammo--;
            switch (e.kind) {
              case 'gunner': {
                const sp = 170 + Math.min(110, g.levelN * 0.55);
                g.fireEnemyBullet(e, leadAngle(g, e, sp) + rnd(-0.05, 0.05) * (1 - g.brutality() * 0.6), sp, e.dmg, 'enemy', '#ff5e5e');
                e.state = 'recover'; e.stateT = def.recover; e.attackCd = def.cd * e.cdMul;
                break;
              }
              case 'rifleman':
                e.state = 'burst'; e.burst = 3 + (g.levelN > 100 ? 1 : 0); e.stateT = 0; e.lastDist = 0.1;
                break;
              case 'smg':
                e.state = 'burst'; e.burst = 6 + (g.levelN > 80 ? 2 : 0); e.stateT = 0; e.lastDist = 0.06;
                break;
              case 'shotgun': {
                const n = 5;
                for (let i = 0; i < n; i++) g.fireEnemyBullet(e, e.aim + (i - 2) * 0.16 + rnd(-0.04, 0.04), 200 + rnd(-30, 30), e.dmg, 'enemy', '#ffb8b8');
                g.sfx.sniper(); g.shake(0.25);
                e.kx -= Math.cos(e.aim) * 90; e.ky -= Math.sin(e.aim) * 90;
                e.state = 'recover'; e.stateT = def.recover; e.attackCd = def.cd * e.cdMul;
                break;
              }
              case 'sniper':
                g.fireEnemyBullet(e, e.aim, 480, e.dmg, 'sniper', '#ffffff');
                g.sfx.sniper(); g.shake(0.2);
                e.state = 'recover'; e.stateT = def.recover; e.attackCd = def.cd * e.cdMul;
                break;
            }
          }
          break;
        }
        case 'burst': {
          e.stateT -= dt;
          if (e.kind === 'smg') e.aim = lerpAngle(e.aim, ang, dt * 3);
          if (e.stateT <= 0 && e.burst > 0) {
            if (e.kind === 'smg') g.fireEnemyBullet(e, e.aim + rnd(-0.28, 0.28) * (1 - g.brutality() * 0.4), 230 + Math.min(80, g.levelN * 0.4), e.dmg, 'enemy', '#7fe3ff');
            else { const sp = 210 + Math.min(90, g.levelN * 0.45); g.fireEnemyBullet(e, (g.brutality() > 0.3 ? leadAngle(g, e, sp) : e.aim) + rnd(-0.12, 0.12) * (1 - g.brutality() * 0.5), sp, e.dmg, 'enemy', '#9dffb5'); }
            e.burst--; e.stateT = e.lastDist;
          }
          if (e.burst <= 0) { e.state = 'recover'; e.stateT = def.recover; e.attackCd = def.cd * e.cdMul; }
          break;
        }
        default: {
          e.stateT -= dt; e.aim = ang;
          // after shooting: relocate so the player can't just hold an angle
          if (!e.repos && Math.random() < 0.5) {
            const sa = ang + (Math.PI / 2) * e.strafeDir;
            const rx = e.x + Math.cos(sa) * 28, ry = e.y + Math.sin(sa) * 28;
            if (g.isFree(rx, ry, e.r)) { e.repos = { x: rx, y: ry }; e.reposT = 0.7; }
          }
          if (e.repos) moveTo(g, e, e.repos.x, e.repos.y, e.speed * 0.8); else strafe(g, e, ang, dt, e.speed * 0.6);
          setPose(e, 'idle', 1);
          if (e.stateT <= 0) e.state = 'chase';
        }
      }
      break;
    }
    case 'bomber': {
      e.aim = ang;
      if (e.state !== 'fuse') {
        const brt = g.brutality();
        const lurk = brt > 0.4 && d > 60 && d < 110 && p.attackPhase === 'none' && !p.airborne && Math.sin(g.time * 2 + e.id) > 0.2;
        if (lurk) strafe(g, e, ang, dt, e.speed * 0.6); else steer(g, e, p.x, p.y, e.speed * (1 + 0.3 * brt), !los);
        if (e.pose !== 'idle') setPose(e, 'idle', 1);
        if (d < 22) { e.state = 'fuse'; e.fuse = 0.55; g.sfx.beep(); setPose(e, 'throw', 0.55); }
      } else {
        if (Math.floor(e.fuse * 20) % 2 === 0) e.flash = 0.03;
      }
      break;
    }
    default:
      break;
  }
}

function aiBoss(g: Game, e: Enemy, dt: number, d: number, ang: number) {
  const p = g.player;
  const los = g.hasLOS(e);
  const enraged = e.hp < e.maxHp * 0.5;
  const kind = e.boss!;
  const finishRecover = (t: number, cd: number) => { e.state = 'recover'; e.stateT = t; e.attackCd = cd * e.cdMul * (enraged ? 0.7 : 1); setPose(e, 'idle', 1); };
  switch (kind) {
    case 'bull': {
      switch (e.state) {
        case 'chase': {
          e.aim = ang;
          if (d > e.attackRange + 4) steer(g, e, p.x, p.y, e.speed, !los);
          if (e.pose !== 'idle') setPose(e, 'idle', 1);
          if (e.attackCd <= 0 && los) {
            e.burst++;
            if (e.burst % 3 === 0 || d < 40) { e.state = 'slamwind'; e.stateT = 0.7; setPose(e, 'windup', 0.7); }
            else { e.state = 'chargewind'; e.stateT = 0.6; setPose(e, 'windup', 0.6); }
          }
          break;
        }
        case 'chargewind': {
          e.stateT -= dt; e.aim = lerpAngle(e.aim, ang, dt * 4);
          if (e.stateT <= 0) { e.state = 'charge'; e.stateT = 1.3; e.chargeDir = e.aim; e.hitDone = false; setPose(e, 'charge', 1); g.sfx.whoosh(); g.shake(0.2); }
          break;
        }
        case 'charge': {
          e.stateT -= dt;
          const sp = enraged ? 330 : 280;
          e.vx = Math.cos(e.chargeDir) * sp; e.vy = Math.sin(e.chargeDir) * sp; e.moving = true;
          e.aim = e.chargeDir;
          g.particles.smoke(e.x - Math.cos(e.chargeDir) * 8, e.y + 2, 1, '#666', 15, 0.4);
          g.addAfterimage(e);
          if (!e.hitDone && d < e.r + p.r + 4) { e.hitDone = true; g.enemyMeleeHit(e, e.dmg, e.r + 10, 3.2, true); }
          if (e.stateT <= 0) finishRecover(0.6, 1.6);
          break;
        }
        case 'slamwind': {
          e.stateT -= dt; e.aim = lerpAngle(e.aim, ang, dt * 3);
          if (e.stateT <= 0) {
            e.state = 'slam'; e.stateT = 0.3; setPose(e, 'palm', 0.3);
            g.sfx.slam(); g.shake(0.9); g.hitstop = Math.max(g.hitstop, 0.05);
            g.particles.smoke(e.x, e.y, 14, '#777', 40, 0.7);
            g.particles.burst(e.x, e.y, 16, '#aaaaaa', 120, 0.5, 2, 3);
            for (let i = 0; i < 3; i++) g.addHazard({ x: e.x, y: e.y, r: -i * 18, maxR: 70 + (enraged ? 30 : 0), life: 0.9 + i * 0.2, max: 0.9 + i * 0.2, kind: 'ring', dmg: 1 });
            g.enemyMeleeHit(e, e.dmg, 34, 3.2, true);
          }
          break;
        }
        case 'slam': { e.stateT -= dt; if (e.stateT <= 0) finishRecover(0.8, 1.8); break; }
        default: { e.stateT -= dt; e.aim = ang; if (e.stateT <= 0) e.state = 'chase'; }
      }
      break;
    }
    case 'queen': {
      if (e.hp < e.maxHp * 0.7 && e.summonCd <= 0 && e.state === 'chase') {
        e.summonCd = 15;
        for (let i = 0; i < 2; i++) { const pos = g.randomFloorNear(e.x, e.y, 30, 70); if (pos) g.spawnEnemyAt('gunner', pos.x, pos.y, false); }
        g.texts.add(e.x, e.y - 24, 'SUMMON!', '#ff3df2', 1);
      }
      switch (e.state) {
        case 'chase': {
          e.aim = ang;
          rangedPosition(g, e, d, ang, dt, los);
          if (e.pose !== 'idle') setPose(e, 'idle', 1);
          if (e.attackCd <= 0 && los) {
            e.burst++;
            const pat = e.burst % 3;
            if (pat === 0) { e.state = 'teleport'; e.stateT = 0.35; g.particles.smoke(e.x, e.y - 6, 10, '#c56cf0', 40, 0.5); g.sfx.dash(); }
            else if (pat === 1) { e.state = 'spiral'; e.stateT = 0; e.phase = ang; setPose(e, 'shoot', 1); e.hitDone = false; e.lastDist = enraged ? 20 : 14; }
            else { e.state = 'fan'; e.stateT = 0.3; e.lastDist = 3; setPose(e, 'shoot', 1); e.aimLine = 0.3; }
          }
          break;
        }
        case 'spiral': {
          e.stateT -= dt;
          e.aim = e.phase;
          if (e.stateT <= 0 && e.lastDist > 0) {
            g.fireEnemyBullet(e, e.phase, 150, 1, 'orb', '#ff3df2');
            if (enraged) g.fireEnemyBullet(e, e.phase + Math.PI, 150, 1, 'orb', '#ff3df2');
            e.phase += 0.55; e.lastDist--; e.stateT = 0.06;
          }
          if (e.lastDist <= 0) finishRecover(0.7, 1.5);
          break;
        }
        case 'fan': {
          e.stateT -= dt; e.aim = lerpAngle(e.aim, ang, dt * 6);
          if (e.stateT <= 0 && e.lastDist > 0) {
            for (let i = -2; i <= 2; i++) g.fireEnemyBullet(e, e.aim + i * 0.18, 190, 1, 'enemy', '#ff5e5e');
            e.lastDist--; e.stateT = 0.28;
          }
          if (e.lastDist <= 0) finishRecover(0.6, 1.4);
          break;
        }
        case 'teleport': {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            const pos = g.randomFloorNear(p.x, p.y, 70, 130);
            if (pos) { e.x = pos.x; e.y = pos.y; }
            g.particles.burst(e.x, e.y - 6, 14, '#c56cf0', 90, 0.4);
            g.sfx.spawn();
            const n = enraged ? 16 : 12;
            for (let i = 0; i < n; i++) g.fireEnemyBullet(e, (i / n) * Math.PI * 2, 130, 1, 'orb', '#ff9ff3');
            finishRecover(0.8, 1.2);
          }
          break;
        }
        default: { e.stateT -= dt; e.aim = ang; strafe(g, e, ang, dt, e.speed * 0.5); if (e.stateT <= 0) e.state = 'chase'; }
      }
      break;
    }
    case 'shadow': {
      switch (e.state) {
        case 'chase': {
          e.aim = ang;
          if (d > 15) steer(g, e, p.x, p.y, e.speed, !los);
          if (e.pose !== 'idle') setPose(e, 'idle', 1);
          if (e.attackCd <= 0) {
            if (d > 80 && e.summonCd <= 0) {
              e.summonCd = enraged ? 3 : 5;
              const bx = p.x - Math.cos(p.aim) * 22, by = p.y - Math.sin(p.aim) * 22;
              g.particles.smoke(e.x, e.y - 6, 8, '#5a5a80', 40, 0.4);
              if (g.isFree(bx, by, e.r)) { e.x = bx; e.y = by; } else { const pos = g.randomFloorNear(p.x, p.y, 20, 40); if (pos) { e.x = pos.x; e.y = pos.y; } }
              g.particles.burst(e.x, e.y - 6, 10, '#ff2a2a', 80, 0.3);
              g.sfx.dash();
              g.texts.add(e.x, e.y - 22, '!', '#ff2a2a', 2, 0.4);
              e.state = 'windup'; e.stateT = 0.3; setPose(e, 'windup', 0.3); e.burst = 0;
            } else if (d < 26 && los) { e.state = 'windup'; e.stateT = 0.28; setPose(e, 'windup', 0.28); e.burst = 0; }
          }
          break;
        }
        case 'windup': {
          e.stateT -= dt; e.aim = lerpAngle(e.aim, ang, dt * 8);
          if (e.stateT <= 0) {
            e.state = 'attack'; e.stateT = 0.15; e.hitDone = false;
            setPose(e, e.burst % 2 ? 'kick' : 'punch', 0.16);
            e.kx += Math.cos(e.aim) * 140; e.ky += Math.sin(e.aim) * 140;
            g.sfx.whoosh();
          }
          break;
        }
        case 'attack': {
          e.stateT -= dt;
          if (!e.hitDone && e.poseT > 0.3) { e.hitDone = true; g.enemyMeleeHit(e, e.dmg, 20, 1.1, e.burst >= 3); }
          if (e.stateT <= 0) {
            const max = enraged ? 6 : 4;
            if (e.burst < max - 1 && d < 45) { e.burst++; e.state = 'windup'; e.stateT = 0.14; setPose(e, 'windup', 0.14); }
            else finishRecover(0.55, 1.1);
          }
          break;
        }
        default: { e.stateT -= dt; e.aim = ang; if (e.stateT <= 0) e.state = 'chase'; }
      }
      break;
    }
    case 'priest': {
      if (e.summonCd <= 0 && e.state === 'chase') {
        e.summonCd = enraged ? 8 : 11;
        for (let i = 0; i < 2; i++) { const pos = g.randomFloorNear(e.x, e.y, 24, 60); if (pos) g.spawnEnemyAt('bomber', pos.x, pos.y, false); }
        g.texts.add(e.x, e.y - 24, 'RISE!', '#ffa502', 1);
      }
      switch (e.state) {
        case 'chase': {
          e.aim = ang;
          rangedPosition(g, e, d, ang, dt, los);
          if (e.pose !== 'idle') setPose(e, 'idle', 1);
          if (e.attackCd <= 0 && los) { e.state = 'windup'; e.stateT = 0.5; setPose(e, 'throw', 0.5); e.burst++; }
          break;
        }
        case 'windup': {
          e.stateT -= dt; e.aim = lerpAngle(e.aim, ang, dt * 5);
          if (e.stateT <= 0) {
            const count = e.burst % 3 === 0 ? 3 : 1;
            for (let i = 0; i < count; i++) {
              const tx = p.x + (count > 1 ? rnd(-40, 40) : rnd(-8, 8)), ty = p.y + (count > 1 ? rnd(-40, 40) : rnd(-8, 8));
              g.throwBomb(e, tx, ty, e.dmg);
            }
            g.sfx.whoosh();
            finishRecover(0.5, 2.2);
          }
          break;
        }
        default: { e.stateT -= dt; e.aim = ang; strafe(g, e, ang, dt, e.speed * 0.5); if (e.stateT <= 0) e.state = 'chase'; }
      }
      break;
    }
    case 'dancer': {
      switch (e.state) {
        case 'chase': {
          e.aim = ang;
          if (d > 60) steer(g, e, p.x, p.y, e.speed, !los); else strafe(g, e, ang, dt, e.speed * 0.7);
          if (e.pose !== 'idle') setPose(e, 'idle', 1);
          if (e.attackCd <= 0 && d < 100 && los) { e.state = 'windup'; e.stateT = 0.3; setPose(e, 'windup', 0.3); e.burst = 0; }
          break;
        }
        case 'windup': {
          e.stateT -= dt; e.aim = lerpAngle(e.aim, ang, dt * 9);
          if (e.stateT <= 0) {
            e.state = 'lunge'; e.stateT = 0.2; setPose(e, 'charge', 0.2); e.hitDone = false;
            e.chargeDir = e.aim;
            g.sfx.whoosh();
          }
          break;
        }
        case 'lunge': {
          e.stateT -= dt;
          e.vx = Math.cos(e.chargeDir) * 400; e.vy = Math.sin(e.chargeDir) * 400; e.moving = true; e.aim = e.chargeDir;
          g.addAfterimage(e);
          if (!e.hitDone && d < e.r + p.r + 6) { e.hitDone = true; g.enemyMeleeHit(e, e.dmg, 16, 3.2, false); }
          if (e.stateT <= 0) {
            const max = enraged ? 5 : 3;
            if (e.burst < max - 1) { e.burst++; e.state = 'windup'; e.stateT = 0.16; setPose(e, 'windup', 0.16); }
            else finishRecover(0.7, 1.5);
          }
          break;
        }
        default: { e.stateT -= dt; e.aim = ang; if (e.stateT <= 0) e.state = 'chase'; }
      }
      break;
    }
  }
}

/** Side-view multi-story office navigation: zig-zag stairs, stair-leap ambushes, smart floor drops, desk traversal & obstacle avoidance. */
function sideViewEnemyNav(g: Game, e: Enemy, dt: number) {
  const l = g.level;
  const p = g.player;
  if (e.svDropT && e.svDropT > 0) e.svDropT = Math.max(0, e.svDropT - dt);
  if (e.jumpCd && e.jumpCd > 0) e.jumpCd = Math.max(0, e.jumpCd - dt);

  // Convert any top-down launch impulse into vertical upward velocity in side-view
  if (e.z > 0 || e.vz > 0) {
    e.svVy = -Math.max(e.vz * 0.9, 125);
    e.svGrounded = false;
    e.z = 0;
    e.vz = 0;
  }

  e.vy = 0;
  const dy = p.y - e.y;
  const dx = p.x - e.x;

  const onTable = sideTableSupportY(g.props, e.x, e.y) !== null;
  if (onTable && dy > 16 && e.svGrounded && (e.jumpCd ?? 0) <= 0) {
    e.svDropT = 0.28;
    e.svGrounded = false;
    e.svVy = 60;
    e.jumpCd = 0.25;
  }

  // Obstacle avoidance + parkour helper for whatever horizontal direction the enemy wants to move
  const avoidObstacles = (moveDir: number) => {
    if (!moveDir || e.stun > 0 || e.down > 0 || e.stagger > 0) return;
    // 1) Avoid / parkour over interactive props (explosive barrels, office desks, crates, pots)
    for (const pr of g.props) {
      if (pr.dead || pr.hp <= 0 || Math.abs(pr.y - e.y) > 16) continue;
      const distX = pr.x - e.x;
      const ahead = distX * moveDir;
      if (pr.kind === 'barrel') {
        // Back away fast if barrel is about to explode
        if (pr.flash > 0 && Math.abs(distX) < 42) {
          e.vx = -Math.sign(distX || moveDir) * e.speed * 1.25;
          e.moving = true;
          if (e.svGrounded && (e.jumpCd ?? 0) <= 0) {
            e.svVy = -220; e.svGrounded = false; e.jumpCd = 0.55;
          }
          return;
        }
        // Jump cleanly over explosive barrels rather than bumping into them
        if (ahead > 4 && ahead < 30 && e.svGrounded && (e.jumpCd ?? 0) <= 0) {
          e.svVy = -220;
          e.svGrounded = false;
          e.kx += moveDir * 44;
          e.jumpCd = 0.58;
          g.particles.smoke(e.x, e.y, 2, '#9a9a9a', 14, 0.25);
          return;
        }
      } else if (pr.kind === 'table' || pr.kind === 'crate' || pr.kind === 'pot') {
        if (!onTable && ahead > 4 && ahead < 24 && e.svGrounded && (e.jumpCd ?? 0) <= 0) {
          e.svVy = pr.kind === 'table' ? -190 : -198;
          e.svGrounded = false;
          e.kx += moveDir * 42;
          e.jumpCd = 0.48;
          g.particles.smoke(e.x, e.y, 2, '#9a9a9a', 12, 0.22);
          return;
        }
      }
    }

    // 2) Jump over low walls, smash/bypass glass partitions, or leap across floor gaps
    if (!e.svGrounded || (e.jumpCd ?? 0) > 0) return;
    const txAhead = Math.floor((e.x + moveDir * (e.r + 7)) / TILE);
    const tyFoot = Math.floor((e.y - 4) / TILE);
    const tAhead = officeTileAt(l, txAhead, tyFoot);
    const tUp1 = officeTileAt(l, txAhead, tyFoot - 1);
    const tUp2 = officeTileAt(l, txAhead, tyFoot - 2);
    if (tAhead === OT_WALL && (tUp1 === OT_AIR || tUp1 === OT_FLOOR || tUp2 === OT_AIR)) {
      e.svVy = -232;
      e.svGrounded = false;
      e.kx += moveDir * 34;
      e.jumpCd = 0.55;
      g.particles.smoke(e.x, e.y, 2, '#9a9a9a', 14, 0.24);
      return;
    }
    if (tAhead === OT_GLASS && e.role === 'melee' && e.state === 'chase') {
      e.kx += moveDir * 150;
      e.svVy = -75;
      e.svGrounded = false;
      e.jumpCd = 0.5;
      return;
    }

    // 3) Leap over open floor pits if player is on the same or higher floor (do NOT jump into pit if player is below!)
    if (dy <= 22) {
      const aheadFloor = officeFloorSupportY(l, e.x + moveDir * 16, e.y - 2, 3, false);
      if (aheadFloor === null || aheadFloor > e.y + 18) {
        const farFloor = officeFloorSupportY(l, e.x + moveDir * 44, e.y - 2, 3, false);
        if (farFloor !== null && farFloor <= e.y + 20) {
          e.svVy = -222;
          e.svGrounded = false;
          e.kx += moveDir * 52;
          e.jumpCd = 0.62;
          g.particles.smoke(e.x, e.y, 2, '#9a9a9a', 14, 0.24);
          return;
        }
      }
    }

    // 4) Unstick hop if trapped against an obstacle corner while chasing
    if ((e.stuckT ?? 0) > 0.35 && e.state === 'chase') {
      e.svVy = -208;
      e.svGrounded = false;
      e.kx += moveDir * 46;
      e.jumpCd = 0.6;
      e.stuckT = 0;
    }
  };

  const onStair = officeOnStairs(l, e.x, e.y, 4);

  // If currently on stairs and roughly same vertical height as the player, either step off cleanly or LEAP off stairs!
  if (Math.abs(dy) <= 26) {
    if (onStair && e.role === 'melee' && (e.jumpCd ?? 0) <= 0 && Math.abs(dx) > 16 && Math.abs(dx) < 110 && e.id % 2 === 0) {
      e.svVy = -212;
      e.kx += Math.sign(dx || e.facing) * 135;
      e.svGrounded = false;
      e.jumpCd = 0.85;
      setPose(e, 'jump', 0.36);
      g.particles.smoke(e.x, e.y, 3, '#9a9a9a', 18, 0.28);
      return;
    }
    if (e.state === 'chase' && e.role === 'melee' && (e.token || e.elite) && e.waryT <= 0 && !e.moving && Math.abs(dx) > e.attackRange + p.r - 2) {
      e.vx = Math.sign(dx) * e.speed;
      e.moving = true;
    }
    const moveDir = Math.abs(e.vx) > 4 ? Math.sign(e.vx) : Math.sign(dx);
    if (e.state === 'chase') avoidObstacles(moveDir);
    return;
  }

  // Different floor! Do not stall during windup/attack unless mid-swing
  if (e.state === 'windup' || e.state === 'lunge' || e.state === 'recover') return;

  const onElev = officeOnElev(l, e.x, e.y);

  if (onStair) {
    const sp = officeStairSpan(l, e.x, e.y);
    const agileLeaper = e.id % 3 !== 1 && e.role === 'melee';
    // Some enemies leap aggressively off the staircase toward the player when within pounce range!
    if (
      agileLeaper &&
      (e.jumpCd ?? 0) <= 0 &&
      Math.abs(dx) > 14 &&
      Math.abs(dx) < 118 &&
      dy > -42 &&
      dy < 54 &&
      e.y < (l.h - 3) * TILE
    ) {
      e.svVy = -218;
      e.kx += Math.sign(dx || e.facing) * clamp(Math.abs(dx) * 1.45, 95, 165);
      e.svGrounded = false;
      e.jumpCd = 0.9;
      if (dy > 10) e.svDropT = 0.36;
      setPose(e, 'jump', 0.4);
      g.particles.smoke(e.x, e.y, 4, '#9a9a9a', 20, 0.3);
      return;
    }

    // Clamp at very top or bottom of staircase so they step smoothly onto the target floor
    if (dy < 0 && sp && e.y <= sp.sy0 * TILE + 2) {
      e.svVy = 0;
      e.vx = Math.sign(dx || e.facing) * e.speed;
      e.moving = true;
      return;
    }

    // Follow the zig-zag treads & mid-landing!
    const zzX = officeStairZigZagX(l, e.x, e.y) ?? officeStairCenterX(l, e.x, e.y);
    e.svVy = dy < 0 ? -108 : 116;
    e.svDropT = 0.28; // never catch on one-way floor slabs while climbing/descending inside stairwell
    if (zzX !== null) {
      const cxDiff = zzX - e.x;
      e.vx = Math.abs(cxDiff) > 1.2 ? clamp(cxDiff * 7, -e.speed * 0.95, e.speed * 0.95) : 0;
    } else {
      e.vx = 0;
    }
    e.svGrounded = false;
    e.moving = true;
    return;
  }

  if (dy < -26 && onElev && e.svGrounded) {
    e.svVy = -260;
    e.svGrounded = false;
    e.moving = true;
    return;
  }

  // Above player: drop cleanly through one-way floor slabs (bold jumpers drop straight down, cautious ones can take nearby stairs)
  const txNow = Math.floor(e.x / TILE);
  const tyNow = Math.floor(e.y / TILE);
  const standingOnOneWay = officeTileAt(l, txNow, tyNow) === OT_FLOOR && officeTileAt(l, txNow, tyNow + 1) !== OT_WALL;
  const nearDownStair = officeFindNearbyStairX(l, e.x, e.y, true, 26);
  if (dy > 24 && e.svGrounded && standingOnOneWay) {
    if (nearDownStair !== null && e.id % 3 === 1) {
      const sdx = nearDownStair - e.x;
      e.vx = Math.sign(sdx || dx) * e.speed;
      e.moving = true;
      return;
    }
    if (Math.abs(dx) < 230 || (e.stuckT ?? 0) > 0.22) {
      e.svDropT = 0.38;
      e.svGrounded = false;
      e.svVy = 65;
      e.vx = clamp(dx, -e.speed * 0.85, e.speed * 0.85);
      e.moving = true;
      return;
    }
  }

  // Find nearest reachable stair, elevator (going up), or drop opening (going down) on this floor
  const myTy = Math.floor((e.y - 4) / TILE);
  let bestX: number | null = null;
  let bestDist = Infinity;
  for (let tx = 2; tx < l.w - 2; tx++) {
    const t = officeTileAt(l, tx, myTy);
    const tBelow = officeTileAt(l, tx, myTy + 1);
    const wantElev = dy < -26 && t === OT_ELEV;
    const wantStair = t === OT_STAIRS || tBelow === OT_STAIRS;
    const wantDropGap = dy > 24 && (tBelow === OT_AIR || (tBelow === OT_FLOOR && Math.abs(tx * TILE - p.x) < 130));
    if (wantStair || wantElev || wantDropGap) {
      const wx = tx * TILE + TILE / 2;
      // Check horizontal sightline (skip targets blocked by an unbroken solid wall column)
      const stepDir = Math.sign(wx - e.x);
      let blockedByTallWall = false;
      if (stepDir !== 0) {
        const curTx = Math.floor(e.x / TILE);
        for (let cx = curTx + stepDir; cx !== tx; cx += stepDir) {
          if (officeTileAt(l, cx, myTy) === OT_WALL && officeTileAt(l, cx, myTy - 1) === OT_WALL) {
            blockedByTallWall = true;
            break;
          }
        }
      }
      if (blockedByTallWall) continue;
      const distX = Math.abs(wx - e.x) + (wantStair ? 0 : wantElev ? 8 : 22);
      if (distX < bestDist) { bestDist = distX; bestX = wx; }
    }
  }

  if (bestX !== null) {
    const dtx = bestX - e.x;
    const moveDir = Math.abs(dtx) > 3 ? Math.sign(dtx) : 0;
    e.vx = moveDir * e.speed;
    if (e.vx !== 0) e.facing = e.vx >= 0 ? 1 : -1;
    e.moving = Math.abs(e.vx) > 1;
    if (moveDir) avoidObstacles(moveDir);
  } else {
    // Fallback: move horizontally toward player & parkour over obstacles
    const moveDir = Math.abs(dx) > 10 ? Math.sign(dx) : 0;
    e.vx = moveDir * e.speed;
    e.moving = Math.abs(e.vx) > 1;
    if (moveDir) avoidObstacles(moveDir);
  }
}
