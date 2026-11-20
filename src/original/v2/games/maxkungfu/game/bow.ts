import { pcircle, pline, prect, type Ctx } from './pixel';
import type { Pose, Vec } from './types';
import type { Ragdoll } from './ragdoll';

/**
 * BUSUR — recurve atletik ala pemanah aksi profesional.
 *  - Tahan klik kiri: tarik tali (busur melengkung, tali berderit), lepas = panah meluncur. Tarik penuh = tembakan kuat.
 *  - Klik cepat berulang: snap-shot beruntun, makin berirama makin cepat ambil panah dari tabung.
 *  - Klik kanan: atraksi KONTEKSTUAL (salto, slide, slip, roll, spiral udara, berlutut, multi-shot).
 *  - Diam beberapa detik: busur diputar di tangan sebagai atraksi idle.
 *  - Panah MENANCAP di bagian tubuh yang kena (kepala/badan/lengan/kaki), ikut ragdoll saat musuh mati,
 *    atau menancap di dinding / tanah lalu bergetar.
 */

/** Tulang dalam skema 7 titik yang sama dengan ragdoll: 0 kepala, 1 leher, 2 pinggul, 3/4 tangan, 5/6 kaki. */
export const BONES: { a: number; b: number; part: Part }[] = [
  { a: 1, b: 0, part: 'head' },
  { a: 1, b: 2, part: 'torso' },
  { a: 1, b: 3, part: 'arm' },
  { a: 1, b: 4, part: 'arm' },
  { a: 2, b: 5, part: 'leg' },
  { a: 2, b: 6, part: 'leg' },
];
export type Part = 'head' | 'torso' | 'arm' | 'leg';

export interface Arrow {
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  life: number; dmg: number; power: number; hit: number[];
  target: { id: number; bone: number; u: number } | null;
  trick: boolean;
}

export interface Stuck {
  kind: 'enemy' | 'rag' | 'wall' | 'ground';
  id: number; rd: Ragdoll | null;
  bone: number; u: number; rel: number; face: number; lastFace: number;
  x: number; y: number; ang: number;
  wob: number; t: number; seen: number; life: number; depth: number;
}

export interface SkelPts { pts: Vec[]; scale: number; face: number }

const ARROW_LEN = 10;

export class Bow {
  draw = 0;
  drawing = false;
  holdT = 0;
  nock = 0;
  nockMax = 0.2;
  streak = 0;
  lastShot = -9;
  /** getaran tali setelah dilepas */
  vib = 0;
  full = false;
  creakT = 0;
  glint = 0;
  pendingQuick = false;
  cd = 0;
  /** putaran badan saat salto / roll / tembakan di udara (radian) */
  spinA = 0;
  /** atraksi idle: memutar busur di tangan saat tidak melakukan apa-apa */
  idleT = 0;
  flourishT = 0;
  readonly FLOURISH_DUR = 0.85;
  trick: null | {
    kind: 'flip' | 'multi' | 'slide' | 'lean' | 'kneel' | 'roll' | 'air';
    label: string; t: number; total: number; times: number[];
    fired: number; targets: number[];
  } = null;
  arrows: Arrow[] = [];
  stuck: Stuck[] = [];
  time = 0;

  reset() {
    this.draw = 0; this.drawing = false; this.holdT = 0; this.nock = 0.12; this.streak = 0; this.vib = 0; this.full = false;
    this.pendingQuick = false; this.trick = null; this.spinA = 0; this.idleT = 0; this.flourishT = 0;
  }
  clearAll() { this.arrows = []; this.stuck = []; this.reset(); }

  /** tarikan tampilan (ease-out supaya tarikan awal terasa berat lalu mengunci di pipi) */
  get drawVis() {
    if (this.trick) {
      // atraksi: tarik-lepas kilat di antara tiap tembakan
      const tr = this.trick, nxt = tr.times[tr.fired];
      if (nxt === undefined) return 0;
      const prev = tr.fired > 0 ? tr.times[tr.fired - 1] : nxt - 0.12;
      return Math.max(0, Math.min(1, (tr.t - prev) / Math.max(0.03, nxt - prev)));
    }
    const d = this.draw;
    return 1 - (1 - d) * (1 - d);
  }
  get moveMul() { return this.drawing && this.nock <= 0 ? 0.62 - 0.22 * this.draw : this.flourishT > 0 ? 0.82 : 1; }
  /** pose akrobatik yang sedang dipakai, lengkap dengan progres 0..1 */
  get trickPose(): { pose: Pose; t: number } | null {
    const tr = this.trick;
    if (!tr) return null;
    const u = Math.max(0, Math.min(1, tr.t / Math.max(0.01, tr.total)));
    const table: Record<typeof tr.kind, Pose> = {
      flip: 'bow_flip', multi: 'bow_multi', slide: 'bow_slide',
      lean: 'bow_lean', kneel: 'bow_kneel', roll: 'bow_roll', air: 'bow_air',
    };
    return { pose: table[tr.kind], t: u };
  }
  get nockVis() { return this.nock > 0 ? 1 - this.nock / Math.max(0.01, this.nockMax) : 0; }

  addStuck(s: Omit<Stuck, 't' | 'seen' | 'wob' | 'lastFace'> & { wob?: number }) {
    this.stuck.push({ ...s, t: 0, seen: this.time, wob: s.wob ?? 1, lastFace: s.face });
    if (this.stuck.length > 90) this.stuck.splice(0, this.stuck.length - 90);
  }
  hasOn(id: number) { for (const s of this.stuck) if (s.kind === 'enemy' && s.id === id) return true; return false; }

  /** musuh mati -> panah pindah ke ragdoll-nya */
  toRagdoll(id: number, rd: Ragdoll) {
    for (const s of this.stuck) {
      if (s.kind !== 'enemy' || s.id !== id) continue;
      s.kind = 'rag'; s.rd = rd; s.rel = s.rel * (s.lastFace / (s.face || 1)); s.seen = this.time; s.wob = Math.max(s.wob, 0.6);
    }
  }

  update(dt: number) {
    this.time += dt;
    this.vib = Math.max(0, this.vib - dt * 3.2);
    this.glint = Math.max(0, this.glint - dt * 4);
    if (this.cd > 0) this.cd -= dt;
    for (let i = this.stuck.length - 1; i >= 0; i--) {
      const s = this.stuck[i];
      s.t += dt;
      s.wob *= Math.exp(-dt * 5.5);
      if (s.kind === 'enemy' && this.time - s.seen > 0.25) {
        // musuh hilang tanpa ragdoll: panah jatuh ke tanah
        s.kind = 'ground'; s.life = 6; s.t = 0; s.wob = 0.5;
      } else if (s.kind === 'rag' && this.time - s.seen > 0.25) {
        this.stuck.splice(i, 1); continue;
      } else if ((s.kind === 'wall' || s.kind === 'ground') && s.t > s.life) {
        this.stuck.splice(i, 1); continue;
      }
    }
  }

  // ------------------------------------------------------------------ drawing
  /** gambar panah yang menancap pada musuh hidup (skeleton frame ini) */
  drawOnEnemy(ctx: Ctx, id: number, sk: SkelPts) {
    for (const s of this.stuck) {
      if (s.kind !== 'enemy' || s.id !== id) continue;
      const B = BONES[s.bone];
      const A = sk.pts[B.a], C = sk.pts[B.b];
      const p = { x: A.x + (C.x - A.x) * s.u, y: A.y + (C.y - A.y) * s.u };
      const ba = Math.atan2(C.y - A.y, C.x - A.x);
      const ang = ba + s.rel * (sk.face / (s.face || 1));
      s.x = p.x; s.y = p.y; s.ang = ang; s.seen = this.time; s.lastFace = sk.face;
      drawStuckArrow(ctx, p.x, p.y, ang, s.depth, s.wob, s.t, 1);
    }
  }
  drawOnRagdoll(ctx: Ctx, rd: Ragdoll, alpha: number) {
    const P = rd.pts;
    for (const s of this.stuck) {
      if (s.kind !== 'rag' || s.rd !== rd) continue;
      const B = BONES[s.bone];
      const A = { x: P[B.a].x, y: P[B.a].y - P[B.a].z }, C = { x: P[B.b].x, y: P[B.b].y - P[B.b].z };
      const p = { x: A.x + (C.x - A.x) * s.u, y: A.y + (C.y - A.y) * s.u };
      const ang = Math.atan2(C.y - A.y, C.x - A.x) + s.rel;
      s.x = p.x; s.y = p.y; s.ang = ang; s.seen = this.time;
      drawStuckArrow(ctx, p.x, p.y, ang, s.depth, s.wob, s.t, alpha);
    }
  }
  /** panah di dinding & tanah (di bawah entitas) */
  drawWorld(ctx: Ctx) {
    for (const s of this.stuck) {
      if (s.kind !== 'wall' && s.kind !== 'ground') continue;
      const a = s.t > s.life - 1 ? Math.max(0, s.life - s.t) : 1;
      if (s.kind === 'wall') drawStuckArrow(ctx, s.x, s.y, s.ang, s.depth, s.wob, s.t, a);
      else {
        // menancap miring ke tanah: ekor naik ke atas
        const dx = Math.cos(s.ang), dy = Math.sin(s.ang) * 0.5;
        const tail = { x: s.x - dx * 6, y: s.y - dy * 6 - 4 };
        drawShaft(ctx, s.x, s.y, tail.x, tail.y, s.wob, s.t, a);
      }
    }
  }
  drawFlying(ctx: Ctx) {
    for (const ar of this.arrows) {
      const sp = Math.hypot(ar.vx, ar.vy) || 1;
      const dx = ar.vx / sp, dy = ar.vy / sp;
      // jejak angin: makin kuat makin panjang
      const tl = 6 + ar.power * 16;
      ctx.globalAlpha = 0.25 + 0.35 * ar.power;
      pline(ctx, ar.x - dx * ARROW_LEN, ar.y - dy * ARROW_LEN, ar.x - dx * (ARROW_LEN + tl), ar.y - dy * (ARROW_LEN + tl), ar.power > 0.9 ? '#fff3c4' : '#ffffff', 1);
      ctx.globalAlpha = 1;
      const tx = ar.x - dx * ARROW_LEN, ty = ar.y - dy * ARROW_LEN;
      pline(ctx, tx, ty, ar.x, ar.y, '#000', 3);
      pline(ctx, tx, ty, ar.x, ar.y, '#e2cfa0', 1);
      prect(ctx, Math.round(ar.x), Math.round(ar.y), 1, 1, '#ffffff');
      pline(ctx, ar.x - dx * 2, ar.y - dy * 2, ar.x, ar.y, '#c7d0da', 1);
      fletch(ctx, tx, ty, dx, dy, 1);
      if (ar.power > 0.9) { ctx.globalAlpha = 0.5; pcircle(ctx, ar.x, ar.y, 1.5, '#fff3c4'); ctx.globalAlpha = 1; }
    }
  }
}

function fletch(ctx: Ctx, tx: number, ty: number, dx: number, dy: number, alpha: number) {
  const nx = -dy, ny = dx;
  ctx.globalAlpha = alpha;
  pline(ctx, tx, ty, tx - dx * 2 + nx * 1.6, ty - dy * 2 + ny * 1.6, '#d63a2a', 1);
  pline(ctx, tx, ty, tx - dx * 2 - nx * 1.6, ty - dy * 2 - ny * 1.6, '#d63a2a', 1);
  pline(ctx, tx + dx * 1.5, ty + dy * 1.5, tx - dx * 0.5 + nx * 1.3, ty - dy * 0.5 + ny * 1.3, '#ffffff', 1);
  ctx.globalAlpha = 1;
}

function drawShaft(ctx: Ctx, hx: number, hy: number, tx: number, ty: number, wob: number, t: number, alpha: number) {
  // getaran: ekor bergoyang tegak lurus batang, cepat lalu mereda
  const dx = hx - tx, dy = hy - ty, l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const w = Math.sin(t * 62) * wob * 1.8;
  const ex = tx + nx * w, ey = ty + ny * w;
  ctx.globalAlpha = alpha;
  pline(ctx, hx, hy, ex, ey, '#000', 3);
  pline(ctx, hx, hy, ex, ey, '#d9c393', 1);
  ctx.globalAlpha = 1;
  fletch(ctx, ex, ey, dx / l, dy / l, alpha);
}

/** ujung panah TERTANAM di titik (x,y); yang terlihat batang + bulu ke arah datangnya */
export function drawStuckArrow(ctx: Ctx, x: number, y: number, ang: number, depth: number, wob: number, t: number, alpha: number) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const vis = ARROW_LEN - depth;
  drawShaft(ctx, x, y, x - dx * vis, y - dy * vis, wob, t, alpha);
}

/**
 * Busur recurve: grip di tangan depan, dua dahan melengkung ke depan, ujung recurve menekuk balik.
 * `draw` 0..1 membuat dahan makin melengkung & ujungnya tertarik ke belakang; tali menuju tangan penarik.
 */
export function drawBow(ctx: Ctx, grip: Vec, string: Vec, aim: number, draw: number, vib: number, time: number, nocked: boolean, glint: number, extra = 0) {
  const dx = Math.cos(aim), dyr = Math.sin(aim) * 0.6;
  const dl = Math.hypot(dx, dyr) || 1;
  const ux = dx / dl, uy = dyr / dl;           // arah bidik di layar
  const nx = -uy, ny = ux;                      // dahan tegak lurus
  const L = 7.5 - 0.9 * draw;                   // dahan memendek secara visual saat ditarik
  const bend = 1.2 + 2.4 * draw;                // lengkung maju
  const pullBack = 0.6 + 2.2 * draw;            // ujung dahan tertarik ke belakang
  const pt = (side: number, k: number) => {
    // k: 0 di grip .. 1 di ujung dahan
    const along = Math.sin(k * Math.PI * 0.5) * L;
    const fwd = bend * Math.sin(k * Math.PI) * 0.8 - pullBack * k * k;
    return { x: grip.x + nx * along * side + ux * fwd, y: grip.y + ny * along * side + uy * fwd };
  };
  const limb = (side: number) => {
    const pts = [0, 0.25, 0.5, 0.75, 1].map((k) => pt(side, k));
    // recurve: ujung menekuk balik ke depan
    const tip = pts[4];
    const rc = { x: tip.x + ux * 1.6 + nx * side * 0.6, y: tip.y + uy * 1.6 + ny * side * 0.6 };
    return { pts, tip, rc };
  };
  const top = limb(1), bot = limb(-1);
  // tali (di belakang busur): ujung recurve -> tangan penarik / lurus bergetar
  let sx = string.x, sy = string.y;
  if (draw < 0.04) {
    const mid = { x: (top.rc.x + bot.rc.x) / 2, y: (top.rc.y + bot.rc.y) / 2 };
    const w = Math.sin(time * 75) * vib * 2.2;
    sx = mid.x - ux * (0.6 + w); sy = mid.y - uy * (0.6 + w);
  }
  pline(ctx, top.rc.x, top.rc.y, sx, sy, '#f4efe2', 1);
  pline(ctx, bot.rc.x, bot.rc.y, sx, sy, '#f4efe2', 1);
  // panah yang dipasang (di atas tali, melewati sandaran grip)
  if (nocked) {
    const len = 11;
    const ax = sx + ux * len, ay = sy + uy * len;
    pline(ctx, sx, sy, ax, ay, '#000', 3);
    pline(ctx, sx, sy, ax, ay, '#e2cfa0', 1);
    pline(ctx, ax - ux * 2, ay - uy * 2, ax, ay, '#d7e0ea', 1);
    prect(ctx, Math.round(ax), Math.round(ay), 1, 1, '#ffffff');
    fletch(ctx, sx + ux * 1.5, sy + uy * 1.5, ux, uy, 1);
    if (glint > 0) { ctx.globalAlpha = glint; pline(ctx, ax - 2, ay, ax + 2, ay, '#ffffff', 1); pline(ctx, ax, ay - 2, ax, ay + 2, '#ffffff', 1); ctx.globalAlpha = 1; }
  }
  // gaya Lars: panah cadangan terselip di tangan penarik saat beruntun
  for (let i = 0; i < extra; i++) {
    const off = (i + 1) * 0.55;
    const ex = string.x - ux * 1 + nx * off, ey = string.y - uy * 1 + ny * off + 1;
    pline(ctx, ex, ey, ex + ux * 7 + nx * 0.6, ey + uy * 7 + ny * 0.6, '#d9c393', 1);
    prect(ctx, Math.round(ex), Math.round(ey), 1, 1, '#d63a2a');
  }
  // dahan: outline lalu kayu
  for (const lb of [top, bot]) {
    for (let i = 0; i < 4; i++) pline(ctx, lb.pts[i].x, lb.pts[i].y, lb.pts[i + 1].x, lb.pts[i + 1].y, '#000', 3);
    pline(ctx, lb.tip.x, lb.tip.y, lb.rc.x, lb.rc.y, '#000', 3);
  }
  for (const lb of [top, bot]) {
    for (let i = 0; i < 4; i++) pline(ctx, lb.pts[i].x, lb.pts[i].y, lb.pts[i + 1].x, lb.pts[i + 1].y, i < 2 ? '#7a3b16' : '#9b5221', 1);
    pline(ctx, lb.tip.x, lb.tip.y, lb.rc.x, lb.rc.y, '#e8e2d0', 1);
  }
  // grip emas
  pline(ctx, grip.x - nx * 1.2, grip.y - ny * 1.2, grip.x + nx * 1.2, grip.y + ny * 1.2, '#e5b850', 2);
  if (draw > 0.98) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time * 30); pcircle(ctx, grip.x, grip.y, 3, '#fff3c4'); ctx.globalAlpha = 1; }
}

/** tabung panah di punggung */
export function drawQuiver(ctx: Ctx, neck: Vec, hip: Vec, facing: number) {
  const bx = neck.x - facing * 1.8, by = neck.y + 0.5;
  const ex = (neck.x + hip.x) / 2 - facing * 3.2, ey = (neck.y + hip.y) / 2 + 2;
  pline(ctx, bx, by, ex, ey, '#000', 4);
  pline(ctx, bx, by, ex, ey, '#5b3a22', 2);
  for (let i = 0; i < 3; i++) {
    const fx = bx + facing * (i - 1) * 0.8 - facing * 0.4, fy = by - 2 - (i % 2);
    pline(ctx, fx, fy + 2, fx, fy, '#d63a2a', 1);
  }
}
