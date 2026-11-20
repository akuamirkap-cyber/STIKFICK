import { pcircle, pline, prect, type Ctx } from './pixel';
import type { Vec } from './types';

/**
 * BUSTER SWORD — keindahan mekaniknya:
 *  1. BOBOT   : ancang-ancang berat, hitstop panjang, layar bergetar. Setiap pukulan TERASA.
 *  2. MOMENTUM: ayunan beruntun mewarisi inersia pedang (0..3). Makin berirama, makin cepat & makin terang trail mako-nya.
 *               Berhenti terlalu lama = momentum hilang. Inilah ritme "mengalir"-nya Cloud.
 *  3. STANCE  : OPERATOR (lincah, combo cepat) <-> PUNISHER (tombol I): jalan pelan, pedang di bahu,
 *               damage besar, dan serangan dari depan DITANGKIS + COUNTER otomatis.
 *  4. CHARGE  : tahan LMB -> pedang menyala -> lepas = BLADE BEAM (gelombang energi yang terbang & membelah).
 *  5. LIMIT   : gauge terisi dari memukul & dipukul. Penuh -> RMB = OMNISLASH (15 tebasan berpindah-pindah + tusukan meteor).
 *  6. ATRAKSI : putaran pedang saat dipakai, pedang diseret saat lari (percikan api), pose kemenangan memanggul pedang.
 */
export const BUSTER_LEN = 26;
export const MAKO = '#7dffc8';
export const MAKO2 = '#c9fff0';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface Beam { x: number; y: number; vx: number; vy: number; life: number; max: number; hit: number[]; size: number; dmg: number }

export class Buster {
  momentum = 0;
  lastSwing = -9;
  punisher = false;
  limit = 0;           // 0..100
  limitReadyFx = 0;
  charge = 0;          // 0..1
  charging = false;
  holdT = 0;
  flourish = 0;        // detik sisa putaran atraksi
  flourishMax = 0.8;
  restT = 0;           // pose memanggul pedang setelah finisher
  sparkT = 0;
  counterGlow = 0;
  beams: Beam[] = [];
  slashes: Slash[] = [];
  omni: null | { t: number; step: number; next: number; targets: number[]; phase: 'slash' | 'rise' | 'drop'; sx: number; sy: number; dropTarget: number } = null;

  reset() {
    this.momentum = 0; this.charge = 0; this.charging = false; this.holdT = 0; this.omni = null; this.restT = 0;
    this.flourish = this.flourishMax;
  }
  clearAll() { this.beams = []; this.slashes = []; this.reset(); this.flourish = 0; }
  addLimit(v: number) {
    const before = this.limit;
    this.limit = Math.min(100, this.limit + v);
    if (before < 100 && this.limit >= 100) this.limitReadyFx = 1.2;
  }
  /** kecepatan ayunan dari momentum */
  get speed() { return (1 + 0.16 * this.momentum) * (this.punisher ? 0.92 : 1); }
  get moveMul() { return this.punisher ? 0.55 : this.charging ? 0.6 : 1; }
  /** dicatat setiap ayunan baru */
  swing(now: number) {
    this.momentum = now - this.lastSwing < 0.95 ? Math.min(3, this.momentum + 1) : 0;
    this.lastSwing = now;
  }
  update(dt: number, now: number) {
    if (now - this.lastSwing > 1.3) this.momentum = 0;
    if (this.flourish > 0) this.flourish = Math.max(0, this.flourish - dt);
    if (this.restT > 0) this.restT = Math.max(0, this.restT - dt);
    if (this.limitReadyFx > 0) this.limitReadyFx = Math.max(0, this.limitReadyFx - dt);
    if (this.counterGlow > 0) this.counterGlow = Math.max(0, this.counterGlow - dt * 3);
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const sl = this.slashes[i];
      sl.t -= dt;
      if (sl.t <= 0) this.slashes.splice(i, 1);
    }
    if (this.slashes.length > 24) this.slashes.splice(0, this.slashes.length - 24);
  }
  /** sudut putaran atraksi saat pedang baru dipakai / pose akhir */
  flourishSpin() {
    if (this.flourish <= 0) return 0;
    const u = 1 - this.flourish / this.flourishMax;
    const e = 1 - Math.pow(1 - u, 3);
    return e * Math.PI * 4;
  }
  trailColor() { return this.momentum >= 3 ? MAKO2 : this.momentum >= 1 ? MAKO : '#bfe8ff'; }
  /** satu sapuan sabit (menggantikan trail garis lurus) */
  addSlash(x: number, y: number, r: number, from: number, to: number, color: string, w = 5, lift = 0, life = 0.24, squash = 0.6) {
    this.slashes.push({ x, y, r, from, to, t: life, max: life, w, color, lift, seed: Math.random() * 9, squash });
  }
  /** gambar semua sapuan: makin tua makin tipis & pudar */
  drawSlashes(ctx: Ctx) {
    for (const sl of this.slashes) {
      const k = clamp01(sl.t / sl.max);
      const grow = 1 - Math.pow(k, 1.6) * 0.12;
      crescent(ctx, sl.x, sl.y, sl.r * grow, sl.from, sl.to, sl.w * (0.55 + 0.45 * k), sl.color, Math.min(1, k * 1.5), sl.lift, sl.seed, sl.squash);
      // pinggiran cabang tipis (goresan kuas kedua), seperti contoh efek anime
      if (k > 0.4) crescent(ctx, sl.x, sl.y, sl.r * 0.88, sl.from + 0.18, sl.to - 0.1, 1.5, sl.color, k * 0.4, sl.lift, sl.seed + 2, sl.squash * 0.87);
    }
  }
}

/**
 * Gambar Buster Sword: bilah sangat lebar dengan punggung lurus, mata tajam di satu sisi,
 * dua lubang materia dekat pangkal, crossguard tebal, dan gagang berbalut panjang.
 */
export interface Slash {
  x: number; y: number; r: number; from: number; to: number;
  t: number; max: number; w: number; color: string; lift: number; seed: number; squash: number;
}

/**
 * Sapuan bulan sabit ala kuas (bukan garis lurus): bentuknya TEBAL di tengah, menipis di dua ujung,
 * pinggir luar melengkung dan ada goresan halus di dalamnya. Dipakai untuk semua motion effect pedang.
 */
export function crescent(ctx: Ctx, x: number, y: number, r: number, from: number, to: number,
                         width: number, color: string, alpha: number, lift = 0, seed = 0, squash = 0.6) {
  const n = Math.max(10, Math.ceil(Math.abs(to - from) * r * 0.65));
  const cy = y - lift * 10;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const f0 = from + ((to - from) * i) / n, f1 = from + ((to - from) * (i + 1)) / n;
    const u = (i + 0.5) / n;
    // taper: ujung runcing, tengah paling tebal; sedikit bergelombang seperti sapuan kuas
    const taper = Math.pow(Math.sin(Math.PI * u), 0.65);
    const wob = 1 + 0.12 * Math.sin(u * 11 + seed * 3.1);
    const w = Math.max(0.5, width * taper * wob);
    const x0 = x + Math.cos(f0) * r, y0 = cy + Math.sin(f0) * r * squash;
    const x1 = x + Math.cos(f1) * r, y1 = cy + Math.sin(f1) * r * squash;
    // bayangan warna (badan sapuan)
    ctx.globalAlpha = alpha * 0.42 * taper;
    pline(ctx, x0, y0, x1, y1, color, Math.max(1, Math.round(w + 2)));
    // inti putih di pinggir luar, lebih tipis supaya tetap terbaca seperti kilatan baja
    ctx.globalAlpha = alpha * 0.95 * taper;
    pline(ctx, x0, y0, x1, y1, '#ffffff', Math.max(1, Math.round(w * 0.55)));
    // serat dalam: goresan kuas pendek mengikuti arah sapuan
    if (i % 3 === 0 && taper > 0.4) {
      const ri = r * (1 - 0.11 * taper);
      const xi = x + Math.cos(f0) * ri, yi = cy + Math.sin(f0) * ri * squash;
      ctx.globalAlpha = alpha * 0.22 * taper;
      pline(ctx, xi, yi, x1, y1, color, 1);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Buster Sword Cloud: bilah baja LEBAR berwarna terang dengan punggung abu-abu gelap (bukan hitam),
 *  mata pisau putih-perak di satu sisi, ujung potong diagonal, gagang merah berbalut,
 *  dua lubang materia (merah muda + hijau) dekat pelindung tangan. */
export function drawBusterSword(ctx: Ctx, hand: Vec, angle: number, lift = 0, glow: string | null = null, charge = 0, time = 0) {
  const dx = Math.cos(angle), dy = Math.sin(angle) * 0.6;
  const L = BUSTER_LEN;
  const tip = { x: hand.x + dx * L, y: hand.y + dy * L - lift * 12 };
  const ll = Math.hypot(tip.x - hand.x, tip.y - hand.y) || 1;
  const ux = (tip.x - hand.x) / ll, uy = (tip.y - hand.y) / ll;
  const nx = -uy, ny = ux;
  const at = (k: number) => ({ x: hand.x + (tip.x - hand.x) * k, y: hand.y + (tip.y - hand.y) * k });
  const off = (p: Vec, k: number) => ({ x: p.x + nx * k, y: p.y + ny * k });
  const pommel = at(-0.24), guard = at(0.11);
  const b0 = at(0.16), tipBase = at(0.9);
  const W = 3.3;

  // aura mako: mengikuti BILAH (bukan garis lurus), sapuan sabit tipis
  if (charge > 0.05 || glow) {
    const c = charge >= 1 ? (Math.floor(time * 20) % 2 ? MAKO2 : MAKO) : glow ?? MAKO;
    ctx.globalAlpha = Math.min(0.5, 0.16 + charge * 0.38);
    pline(ctx, off(b0, -W - 1).x, off(b0, -W - 1).y, off(tipBase, -W - 0.6).x, off(tipBase, -W - 0.6).y, c, 2);
    pline(ctx, off(b0, W + 1).x, off(b0, W + 1).y, off(tipBase, W + 0.6).x, off(tipBase, W + 0.6).y, c, 2);
    ctx.globalAlpha = 1;
  }

  // 1) OUTLINE hitam TIPIS (1px) di keliling bilah — bukan blok tebal yang bikin pedang jadi hitam
  const edgeUp0 = off(b0, -W), edgeUp1 = off(tipBase, -W * 0.92);
  const edgeLo0 = off(b0, W), edgeLo1 = off(tipBase, W * 0.92);
  pline(ctx, edgeUp0.x, edgeUp0.y, edgeUp1.x, edgeUp1.y, '#1b1d22', 1);
  pline(ctx, edgeLo0.x, edgeLo0.y, edgeLo1.x, edgeLo1.y, '#1b1d22', 1);
  pline(ctx, edgeUp1.x, edgeUp1.y, tip.x, tip.y, '#1b1d22', 1);
  pline(ctx, edgeLo1.x, edgeLo1.y, tip.x, tip.y, '#1b1d22', 1);

  // 2) ISI BILAH: baja PERAK terang (sekitar 7px). Baris-baris sejajar mata pisau.
  for (let k = -W + 0.7; k <= W - 0.4; k += 0.75) {
    const q0 = off(b0, k), q1 = off(tipBase, k * 0.92);
    // punggung atas abu-abu tua, tengah baja, bawah perak terang
    const c = k < -1.5 ? '#59616a' : k < -0.4 ? '#7c858e' : k < 1.1 ? '#aab4bd' : k < 2.1 ? '#d9e0e6' : '#f2f6f8';
    pline(ctx, q0.x, q0.y, q1.x, q1.y, c, 1);
  }
  // bayangan miring di punggung (khas Buster Sword), tetap abu-abu bukan hitam
  for (let i = 0; i < 4; i++) {
    const k = 0.25 + i * 0.19;
    const s0 = off(at(k), -W + 0.7), s1 = off(at(k + 0.075), -0.6);
    ctx.globalAlpha = 0.25;
    pline(ctx, s0.x, s0.y, s1.x, s1.y, '#3c444d', 1);
  }
  ctx.globalAlpha = 1;
  // ujung potong diagonal diisi baja terang juga (jangan sampai segitiga ujung terlihat hitam)
  for (let k = -W + 0.7; k <= W - 0.4; k += 0.7) {
    const q = off(tipBase, k * 0.92);
    pline(ctx, q.x, q.y, tip.x, tip.y, k > 1 ? '#f2f6f8' : k > 0 ? '#d9e0e6' : '#aab4bd', 1);
  }

  // 3) MATA PISAU: garis putih-perak tebal + kilau
  const m0 = off(b0, W - 0.5), m1 = off(tipBase, W * 0.92 - 0.4);
  pline(ctx, m0.x, m0.y, m1.x, m1.y, '#ffffff', 2);
  pline(ctx, m1.x, m1.y, tip.x, tip.y, '#ffffff', 2);
  const sh = (time * 0.8) % 1.5;
  if (sh < 0.85) { const q = off(at(0.2 + sh * 0.66), W - 0.5); prect(ctx, Math.round(q.x), Math.round(q.y), 1, 1, '#ffffff'); }

  // 4) PELINDUNG TANGAN tebal abu-abu, dengan lis terang
  pline(ctx, off(guard, -W - 1.1).x, off(guard, -W - 1.1).y, off(guard, W + 1.1).x, off(guard, W + 1.1).y, '#15171b', 1);
  pline(ctx, off(guard, -W).x, off(guard, -W).y, off(guard, W).x, off(guard, W).y, '#8f98a2', 3);
  pline(ctx, off(guard, -W).x, off(guard, -W).y, off(guard, -W + 0.8).x, off(guard, -W + 0.8).y, '#e0e6ec', 1);

  // 5) GAGANG MERAH berbalut pita diagonal + kepala gagang bulat
  pline(ctx, pommel.x, pommel.y, guard.x, guard.y, '#20232a', 3);
  pline(ctx, pommel.x, pommel.y, guard.x, guard.y, '#a31538', 2);
  for (let i = 0; i < 6; i++) {
    const g = at(-0.235 + i * 0.055), q = off(g, 1);
    prect(ctx, Math.round(q.x), Math.round(q.y), 1, 1, '#e8456a');
  }
  pcircle(ctx, pommel.x, pommel.y, 1.4, '#9aa3ad');
  prect(ctx, Math.round(pommel.x), Math.round(pommel.y), 1, 1, '#e3e9ee');

  // 6) DUA MATERIA (merah muda + hijau) di ricasso dekat pangkal bilah
  const h1 = off(at(0.205), -0.2), h2 = off(at(0.325), -0.2);
  for (const [h, c] of [[h1, '#ff3d7f'], [h2, '#4dff7a']] as [Vec, string][]) {
    pcircle(ctx, h.x, h.y, 1.5, '#121418');
    pcircle(ctx, h.x, h.y, 0.9, c);
    prect(ctx, Math.round(h.x), Math.round(h.y - 1), 1, 1, '#ffffff');
  }
}

/** gelombang Blade Beam: bulan sabit energi mako */
export function drawBeam(ctx: Ctx, b: Beam, time: number) {
  const a = Math.atan2(b.vy, b.vx);
  const f = Math.min(1, b.life / 0.15);
  const s = b.size;
  for (let layer = 0; layer < 3; layer++) {
    const r = s * (1 - layer * 0.18);
    ctx.globalAlpha = f * (layer === 0 ? 0.35 : layer === 1 ? 0.7 : 1);
    const col = layer === 2 ? '#ffffff' : layer === 1 ? MAKO2 : MAKO;
    let prev: Vec | null = null;
    for (let i = -6; i <= 6; i++) {
      const t = i / 6;
      const ang = a + t * 1.15;
      const pt = { x: b.x - Math.cos(a) * r * 0.55 + Math.cos(ang) * r, y: b.y - Math.sin(a) * r * 0.35 + Math.sin(ang) * r * 0.6 };
      if (prev) pline(ctx, prev.x, prev.y, pt.x, pt.y, col, layer === 0 ? 4 : layer === 1 ? 2 : 1);
      prev = pt;
    }
  }
  if (Math.floor(time * 30) % 2) { ctx.globalAlpha = f * 0.6; pcircle(ctx, b.x, b.y, 2, '#ffffff'); }
  ctx.globalAlpha = 1;
}

/** HUD: gauge LIMIT + titik momentum di bawah kaki */
export function drawLimitHud(ctx: Ctx, x: number, y: number, bu: Buster, time: number) {
  const w = 22, bx = Math.round(x - w / 2), by = Math.round(y);
  prect(ctx, bx - 1, by - 1, w + 2, 4, '#000');
  const full = bu.limit >= 100;
  const col = full ? (Math.floor(time * 10) % 2 ? '#ffffff' : MAKO) : '#3fb38a';
  prect(ctx, bx, by, Math.round(w * bu.limit / 100), 2, col);
  for (let i = 0; i < 3; i++) prect(ctx, bx + 6 + i * 4, by + 4, 2, 2, i < bu.momentum ? MAKO2 : '#2a3a34');
}
