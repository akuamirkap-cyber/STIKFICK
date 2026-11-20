import { pcircle, pline, prect, px, type Ctx } from './pixel';
import { crescent } from './buster';
import type { Pose, Vec } from './types';

/**
 * SENJATA API — sprite pixel baru + FREESTYLE ala busur.
 * Pistol: slide baja lebar, serrations, ejector, sight, gagang checker, hammer, kilau moncong.
 * Rifle: receiver, handguard, magasin melengkung, popor, optik, peredam moncong.
 * Freestyle: klik kanan memilih atraksi sesuai situasi; tembakan otomatis mengunci target,
 * body spin/slide/roll/lean, jejak sabit & selongsong beterbangan.
 */
export interface GunDrawOpts { scale?: number; recoil?: number; flash?: number; time?: number; alpha?: number }

/** Faktor ukuran visual: pistol dulu terlalu besar dibanding stikman */
export const PISTOL_VIS = 0.62;
export const RIFLE_VIS = 0.75;

const basis = (hand: Vec, angle: number, s: number) => {
  const dx = Math.cos(angle), dy = Math.sin(angle) * 0.6;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l, uy = dy / l;
  const nx = -uy, ny = ux;
  return {
    ux, uy, nx, ny,
    at: (k: number): Vec => ({ x: hand.x + ux * k * s, y: hand.y + uy * k * s }),
    off: (p: Vec, k: number): Vec => ({ x: p.x + nx * k * s, y: p.y + ny * k * s }),
    down: (p: Vec, k: number): Vec => ({ x: p.x - ux * k * s * 0.35, y: p.y + k * s }),
  };
};

function beam(ctx: Ctx, a: Vec, b: Vec, n: Vec, width: number, colors: string[], s: number) {
  const step = 0.75;
  const rows = Math.max(1, Math.floor((width * 2) / step));
  for (let i = 0; i < rows; i++) {
    const k = -width + (i + 0.5) * step;
    const o = { x: n.x * k * s, y: n.y * k * s };
    const c = colors[Math.min(colors.length - 1, Math.floor((i / rows) * colors.length))];
    pline(ctx, a.x + o.x, a.y + o.y, b.x + o.x, b.y + o.y, c, 1);
  }
  pline(ctx, a.x + n.x * -width * s, a.y + n.y * -width * s, b.x + n.x * -width * s, b.y + n.y * -width * s, '#11151c', 1);
  pline(ctx, a.x + n.x * width * s, a.y + n.y * width * s, b.x + n.x * width * s, b.y + n.y * width * s, '#11151c', 1);
}

function muzzleStar(ctx: Ctx, x: number, y: number, s: number, power: number, time: number) {
  if (power <= 0.02) return;
  const r = (2 + 4 * power) * s;
  ctx.globalAlpha = Math.min(1, power);
  const lw = Math.max(1, Math.round(2 * s));
  pline(ctx, x - r, y, x + r, y, '#fff3a0', lw);
  pline(ctx, x, y - r * 0.7, x, y + r * 0.7, '#ffffff', lw);
  pcircle(ctx, x, y, 1.2 * s, '#ffffff');
  if (Math.floor(time * 40) % 2) { pline(ctx, x - r * 0.6, y - r * 0.4, x + r * 0.6, y + r * 0.4, '#ff9a3c', 1); }
  ctx.globalAlpha = 1;
}

/** Pistol besar ala hand-cannon: slide tebal, moncong kotak, gagang bersisik. */
export function drawPistol(ctx: Ctx, hand: Vec, angle: number, scale = 1, o: GunDrawOpts = {}) {
  const s = scale * (o.scale ?? 1) * PISTOL_VIS;
  const w = (n: number) => Math.max(1, Math.round(n * PISTOL_VIS));
  const g = basis(hand, angle, s);
  const R = Math.max(0, Math.min(1, o.recoil ?? 0));
  const back = g.at(-2.2 - R * 1.4), front = g.at(9.5 - R * 1.4);
  const n = { x: g.nx, y: g.ny };
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  // laras tetap, slide mundur saat recoil
  const bare = g.at(10.5);
  pline(ctx, front.x, front.y, bare.x, bare.y, '#0c1016', w(2));
  pline(ctx, front.x, front.y, bare.x, bare.y, '#59636e', 1);
  beam(ctx, back, front, n, 1.9, ['#596572', '#8d99a6', '#c3cbd3', '#e3e9ef'], s);
  // rel atas + serrations belakang
  const topA = g.off(back, -2), topB = g.off(front, -2);
  pline(ctx, topA.x, topA.y, topB.x, topB.y, '#e8eef4', 1);
  for (let i = 0; i < 4; i++) {
    const q = g.at(-1.7 + i * 0.75 - R * 1.4), qt = g.off(q, -1.7);
    pline(ctx, qt.x, qt.y, q.x + g.nx * 0.5 * s, q.y + g.ny * 0.5 * s, '#3b4652', 1);
  }
  // jendela ejector + hammer + sight
  const ep = g.off(g.at(3.5 - R * 1.4), -0.5);
  prect(ctx, Math.round(ep.x), Math.round(ep.y), Math.max(1, Math.round(2 * s)), 1, '#1b2028');
  const ham = g.off(g.at(-2.6), -1.7);
  pline(ctx, ham.x, ham.y, ham.x + g.ux * 1.2 * s, ham.y + g.uy * 1.2 * s - 1 * s, '#9aa6b2', 1);
  const fs = g.off(g.at(8.8), -2.2), rs = g.off(g.at(-1.6), -2.2);
  prect(ctx, Math.round(fs.x), Math.round(fs.y), 1, 1, '#ffffff');
  prect(ctx, Math.round(rs.x), Math.round(rs.y), 1, 1, '#ffffff');
  // gagang miring ke belakang + sisik + magasin
  const g0 = g.at(1.1), g1 = g.down(g0, 5.2);
  pline(ctx, g0.x, g0.y, g1.x, g1.y, '#0b0e13', w(5));
  pline(ctx, g0.x, g0.y, g1.x, g1.y, '#333c46', w(3));
  pline(ctx, g0.x + g.nx * 0.7 * s, g0.y + g.ny * 0.7 * s, g1.x + g.nx * 0.7 * s, g1.y + g.ny * 0.7 * s, '#596775', 1);
  for (let i = 0; i < 3; i++) {
    const q = { x: g0.x + (g1.x - g0.x) * (0.3 + i * 0.2), y: g0.y + (g1.y - g0.y) * (0.3 + i * 0.2) };
    prect(ctx, Math.round(q.x), Math.round(q.y), 1, 1, '#8e9baa');
  }
  prect(ctx, Math.round(g1.x - s), Math.round(g1.y), Math.max(1, Math.round(2.4 * s)), 1, '#c9a033');
  // pelindung pemicu + pemicu
  const t0 = g.at(2.8), t1 = g.down(t0, 2.4), t2 = g.at(5.2);
  pline(ctx, t0.x, t0.y, t1.x, t1.y, '#11151b', 1);
  pline(ctx, t1.x, t1.y, t2.x, t2.y - 0.4 * s, '#11151b', 1);
  pline(ctx, t1.x, t1.y, t1.x + g.ux * 0.8 * s, t1.y + g.uy * 0.8 * s - 0.8 * s, '#d0d7de', 1);
  // kilau moncong
  const tip = g.at(10.6);
  pcircle(ctx, tip.x, tip.y, 1.1 * s, '#111820');
  px(ctx, Math.round(tip.x), Math.round(tip.y), '#dfe7ee');
  muzzleStar(ctx, g.at(12).x, g.at(12).y, s, o.flash ?? R, o.time ?? 0);
  ctx.restore();
}

/** Rifle serbu: popor, receiver, optik, handguard, magasin, rem moncong. */
export function drawRifle(ctx: Ctx, hand: Vec, angle: number, scale = 1, o: GunDrawOpts = {}) {
  const s = scale * (o.scale ?? 1) * RIFLE_VIS;
  const w = (n: number) => Math.max(1, Math.round(n * RIFLE_VIS));
  const g = basis(hand, angle, s);
  const R = Math.max(0, Math.min(1, o.recoil ?? 0));
  const n = { x: g.nx, y: g.ny };
  const stock = g.at(-6.5 - R * 0.7), rc0 = g.at(-2.5), rc1 = g.at(4.5);
  const hg0 = g.at(4.8), hg1 = g.at(13), muzzle = g.at(17);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  // popor teleskopik
  beam(ctx, stock, rc0, n, 1.5, ['#2b333c', '#414c56', '#66727e'], s);
  const butt = g.off(stock, 1.8);
  pline(ctx, g.off(stock, -1.8).x, g.off(stock, -1.8).y, butt.x, butt.y, '#171c23', w(2));
  // receiver + jendela ejector
  beam(ctx, rc0, rc1, n, 2.1, ['#39434e', '#687684', '#9dabb8', '#c8d2db'], s);
  const ep = g.off(g.at(2.5), -1.3);
  prect(ctx, Math.round(ep.x), Math.round(ep.y), Math.max(1, Math.round(2.5 * s)), 1, '#14191f');
  const rail = g.off(rc1, -2.4), rail0 = g.off(rc0, -2.4);
  pline(ctx, rail0.x, rail0.y, rail.x, rail.y, '#1b222b', 1);
  // optik: tabung + lensa biru
  const op0 = g.off(g.at(-0.5), -3.6), op1 = g.off(g.at(2.6), -3.6);
  pline(ctx, op0.x, op0.y, op1.x, op1.y, '#0d1117', w(3));
  pline(ctx, op0.x, op0.y, op1.x, op1.y, '#7e8b98', 1);
  prect(ctx, Math.round(op1.x), Math.round(op1.y), 1, 1, '#7fe7ff');
  // handguard berlubang + laras
  beam(ctx, hg0, hg1, n, 1.6, ['#2d3640', '#4d5965', '#75818d'], s);
  for (let i = 0; i < 4; i++) { const q = g.at(6 + i * 1.7); prect(ctx, Math.round(q.x), Math.round(q.y), 1, 1, '#10151b'); }
  pline(ctx, hg1.x, hg1.y, muzzle.x, muzzle.y, '#111820', w(2));
  pline(ctx, hg1.x, hg1.y, muzzle.x, muzzle.y, '#b5c0ca', 1);
  const brake = g.off(muzzle, 1.3), brake2 = g.off(g.at(15.6), 1.3);
  pline(ctx, brake2.x, brake2.y, brake.x, brake.y, '#0e1319', w(2));
  // magasin melengkung + grip
  const m0 = g.at(0.5), m1 = g.down(m0, 5.2), m2 = { x: m1.x + g.ux * 1.7 * s, y: m1.y - 0.4 * s };
  pline(ctx, m0.x, m0.y, m1.x, m1.y, '#10151b', w(4));
  pline(ctx, m1.x, m1.y, m2.x, m2.y, '#10151b', w(3));
  pline(ctx, m0.x, m0.y, m1.x, m1.y, '#4b5662', w(2));
  pline(ctx, m1.x, m1.y, m2.x, m2.y, '#5f6c79', 1);
  const gr = g.down(g.at(-1.6), 3.6);
  pline(ctx, g.at(-1.6).x, g.at(-1.6).y, gr.x, gr.y, '#222a33', w(3));
  // grip depan + laser kecil
  const fg = g.down(g.at(9.5), 2.6);
  pline(ctx, g.at(9.5).x, g.at(9.5).y, fg.x, fg.y, '#252e38', w(2));
  const laser = g.off(g.at(13.5), 1.5);
  prect(ctx, Math.round(laser.x), Math.round(laser.y), 1, 1, Math.floor((o.time ?? 0) * 8) % 2 ? '#ff3b3b' : '#661111');
  pcircle(ctx, muzzle.x, muzzle.y, 1.2 * s, '#0d1218');
  muzzleStar(ctx, g.at(19).x, g.at(19).y, s, o.flash ?? R, o.time ?? 0);
  ctx.restore();
}

export function drawPistolIcon(ctx: Ctx, x: number, y: number, c: string) {
  prect(ctx, x, y + 2, 7, 2, '#151a21'); prect(ctx, x, y + 2, 7, 1, c);
  prect(ctx, x + 1, y + 4, 2, 2, '#3b4652'); prect(ctx, x + 2, y + 5, 1, 1, '#9fb0bd');
  pline(ctx, x + 4, y + 4, x + 6, y + 4, '#151a21', 1);
  prect(ctx, x + 7, y, 1, 1, '#ffffff'); prect(ctx, x + 8, y + 2, 1, 1, '#c9a033');
}
export function drawRifleIcon(ctx: Ctx, x: number, y: number, c: string) {
  pline(ctx, x, y + 3, x + 10, y + 3, '#151a21', 3); pline(ctx, x, y + 3, x + 10, y + 3, c, 1);
  prect(ctx, x + 2, y, 4, 1, '#7fe7ff'); prect(ctx, x + 1, y + 5, 2, 3, '#3b4652');
  prect(ctx, x + 5, y + 5, 2, 2, '#3b4652'); prect(ctx, x + 10, y + 2, 1, 2, '#ffffff');
}

// ------------------------------------------------------------------ FREESTYLE
export type GunTrickKind = 'flip' | 'multi' | 'slide' | 'lean' | 'kneel' | 'roll' | 'air';
export interface GunTrail { x: number; y: number; r: number; from: number; to: number; t: number; max: number; w: number; c: string; seed: number }
export interface GunTrick {
  kind: GunTrickKind; label: string; t: number; total: number; times: number[];
  fired: number; targets: number[]; color: string; weapon: 'pistol' | 'rifle';
}

export class GunStyle {
  cd = 0;
  idleT = 0;
  twirlT = 0;
  readonly TWIRL_DUR = 0.8;
  spinA = 0;
  trails: GunTrail[] = [];
  trick: GunTrick | null = null;
  reset() { this.cd = 0; this.idleT = 0; this.twirlT = 0; this.spinA = 0; this.trick = null; this.trails = []; }
  clearAll() { this.reset(); }
  get busy() { return this.trick !== null; }
  get moveMul() { return this.trick && (this.trick.kind === 'kneel' || this.trick.kind === 'lean') ? 0.55 : 1; }
  trickPose(): { pose: Pose; t: number } | null {
    const tr = this.trick;
    if (!tr) return null;
    const u = Math.max(0, Math.min(1, tr.t / Math.max(0.01, tr.total)));
    const table: Record<GunTrickKind, Pose> = {
      flip: 'bow_flip', slide: 'bow_slide', lean: 'bow_lean', kneel: 'bow_kneel',
      roll: 'bow_roll', air: 'bow_air', multi: tr.weapon === 'pistol' ? 'gun_akimbo' : 'bow_multi',
    };
    return { pose: table[tr.kind], t: u };
  }
  addTrail(x: number, y: number, r: number, from: number, to: number, c: string, w = 3, life = 0.22) {
    this.trails.push({ x, y, r, from, to, t: life, max: life, w, c, seed: Math.random() * 9 });
    if (this.trails.length > 28) this.trails.splice(0, this.trails.length - 28);
  }
  update(dt: number) {
    if (this.cd > 0) this.cd -= dt;
    if (this.twirlT > 0) this.twirlT = Math.max(0, this.twirlT - dt);
    for (let i = this.trails.length - 1; i >= 0; i--) { this.trails[i].t -= dt; if (this.trails[i].t <= 0) this.trails.splice(i, 1); }
  }
  drawTrails(ctx: Ctx) {
    for (const t of this.trails) {
      const k = Math.max(0, t.t / t.max);
      crescent(ctx, t.x, t.y, t.r * (1 + (1 - k) * 0.08), t.from, t.to, t.w * (0.5 + 0.5 * k), t.c, Math.min(1, k * 1.6), 0, t.seed, 0.55);
    }
  }
}
