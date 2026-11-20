import { pcircle, pline, prect, type Ctx } from './pixel';
import type { Vec } from './types';

/** Lever-action shotgun ala Terminator 2 (Winchester 1887): tembak, kokang-putar, isi ulang dengan spin. */
export const SG_MAG = 6;
export const SG_LEN = 17;

/** Durasi */
const COCK_DUR = 0.4;      // kokang-putar otomatis tiap habis tembak
const SHELL_DUR = 0.15;    // per peluru dimasukkan
const FINAL_SPIN = 0.62;   // putaran penutup reload (2x putar)

export type SgPhase = 'ready' | 'cock' | 'load' | 'spin';

export class Shotgun {
  shells = SG_MAG;
  phase: SgPhase = 'ready';
  t = 0;
  /** sudut putaran ekstra (radian) yang ditambahkan ke sudut senapan */
  spin = 0;
  /** tendangan balik visual 0..1 */
  kick = 0;
  /** flash saat tuas mengunci */
  clackFlash = 0;
  private loadTick = 0;
  private clicked = false;

  reset() { this.phase = 'ready'; this.t = 0; this.spin = 0; this.kick = 0; this.clicked = false; }

  get busy() { return this.phase !== 'ready'; }
  get reloading() { return this.phase === 'load' || this.phase === 'spin'; }

  /** setelah tembak: kokang-putar satu tangan */
  startCock() { this.phase = 'cock'; this.t = 0; this.clicked = false; this.kick = 1; }

  /** mulai isi ulang (klik kanan) */
  startReload(): boolean {
    if (this.reloading || this.shells >= SG_MAG) return false;
    this.phase = 'load'; this.t = 0; this.loadTick = 0; this.clicked = false;
    return true;
  }

  cancel() { this.phase = 'ready'; this.t = 0; this.spin = 0; }

  /** returns events for sound/fx */
  update(dt: number, ev: { click: () => void; clack: () => void; shell: () => void; whoosh: () => void }) {
    this.kick = Math.max(0, this.kick - dt * 6);
    this.clackFlash = Math.max(0, this.clackFlash - dt * 5);
    if (this.phase === 'ready') { this.spin *= Math.max(0, 1 - dt * 20); return; }
    this.t += dt;
    if (this.phase === 'cock') {
      const u = Math.min(1, this.t / COCK_DUR);
      // tuas dilempar ke bawah: senapan berputar penuh 360 di sekitar loop tuas
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      this.spin = e * Math.PI * 2;
      if (!this.clicked && u > 0.18) { this.clicked = true; ev.click(); ev.whoosh(); }
      if (u >= 1) { this.phase = 'ready'; this.spin = 0; this.clackFlash = 1; ev.clack(); }
    } else if (this.phase === 'load') {
      // senapan dimiringkan, peluru dijejalkan satu per satu
      this.spin = -0.9 + Math.sin(this.t * 22) * 0.06;
      this.loadTick += dt;
      while (this.loadTick >= SHELL_DUR && this.shells < SG_MAG) {
        this.loadTick -= SHELL_DUR; this.shells++; ev.shell();
      }
      if (this.shells >= SG_MAG && this.loadTick >= SHELL_DUR * 0.5) { this.phase = 'spin'; this.t = 0; this.clicked = false; }
    } else if (this.phase === 'spin') {
      // PENUTUP KHAS: lempar putar 2x (720) dengan satu tangan lalu CLICK-CLACK
      const u = Math.min(1, this.t / FINAL_SPIN);
      const e = 1 - Math.pow(1 - u, 2.4);
      this.spin = -0.9 * (1 - e) + e * Math.PI * 4;
      if (!this.clicked && u > 0.12) { this.clicked = true; ev.whoosh(); }
      if (u >= 1) { this.phase = 'ready'; this.spin = 0; this.clackFlash = 1; ev.click(); window.setTimeout(ev.clack, 90); }
    }
  }
}

/** Gambar shotgun: laras baja ganda (laras + tabung magasin), loop tuas besar, popor kayu. */
export function drawShotgun(ctx: Ctx, hand: Vec, angle: number, facing: number, kick = 0, glow: string | null = null, flash = 0) {
  const dx = Math.cos(angle), dy = Math.sin(angle) * 0.6;
  const nx = -dy, ny = dx;
  // tangan memegang di loop tuas; popor ke belakang, laras ke depan
  const back = 6 + kick * 1.5, fwdL = SG_LEN - 6 - kick * 1.5;
  const bx = hand.x - dx * back, by = hand.y - dy * back;
  const tx = hand.x + dx * fwdL, ty = hand.y + dy * fwdL;
  const at = (k: number) => ({ x: bx + (tx - bx) * k, y: by + (ty - by) * k });
  const flip = facing >= 0 ? 1 : -1;
  const up = { x: nx * -flip, y: ny * -flip }; // sisi "atas" senapan relatif ke tampilan
  const rcv0 = at(0.3), rcv1 = at(0.46);
  // outline
  pline(ctx, bx, by, rcv0.x, rcv0.y, '#000', 4);
  pline(ctx, rcv0.x, rcv0.y, rcv1.x, rcv1.y, '#000', 4);
  pline(ctx, rcv1.x, rcv1.y, tx, ty, '#000', 3);
  pline(ctx, rcv1.x - up.x, rcv1.y - up.y, tx - up.x * 1.2 - dx * 2, ty - up.y * 1.2 - dy * 2, '#000', 3);
  if (glow) { ctx.globalAlpha = 0.35; pline(ctx, bx, by, tx, ty, glow, 7); ctx.globalAlpha = 1; }
  // popor kayu (agak melebar ke belakang)
  pline(ctx, bx, by, rcv0.x, rcv0.y, '#8a4e22', 2);
  pline(ctx, bx - up.x * 0.8, by - up.y * 0.8, at(0.18).x - up.x * 0.6, at(0.18).y - up.y * 0.6, '#6b3a17', 1);
  pline(ctx, bx + up.x * 0.6, by + up.y * 0.6, at(0.22).x + up.x * 0.6, at(0.22).y + up.y * 0.6, '#c7834a', 1);
  prect(ctx, Math.round(bx), Math.round(by), 1, 1, '#2a1a0a');
  // receiver baja
  pline(ctx, rcv0.x, rcv0.y, rcv1.x, rcv1.y, '#4a4f58', 2);
  pline(ctx, rcv0.x + up.x * 0.6, rcv0.y + up.y * 0.6, rcv1.x + up.x * 0.6, rcv1.y + up.y * 0.6, '#9aa3ad', 1);
  // laras atas
  pline(ctx, rcv1.x, rcv1.y, tx, ty, '#2c3038', 1);
  pline(ctx, rcv1.x + up.x * 0.5, rcv1.y + up.y * 0.5, tx + up.x * 0.5, ty + up.y * 0.5, '#b8c1cb', 1);
  // tabung magasin + forend kayu
  const m0 = { x: rcv1.x - up.x, y: rcv1.y - up.y }, m1 = { x: tx - up.x * 1.2 - dx * 2, y: ty - up.y * 1.2 - dy * 2 };
  pline(ctx, m0.x, m0.y, m1.x, m1.y, '#3a3f47', 1);
  const f0 = at(0.55), f1 = at(0.75);
  pline(ctx, f0.x - up.x, f0.y - up.y, f1.x - up.x, f1.y - up.y, '#a5612c', 2);
  // loop tuas besar (khas 1887) di sekitar tangan
  const lc = { x: hand.x - up.x * 2.2, y: hand.y - up.y * 2.2 };
  pcircle(ctx, lc.x, lc.y, 2.4, '#000');
  pline(ctx, lc.x - dx * 2, lc.y - dy * 2, lc.x + dx * 2, lc.y + dy * 2, '#6a717b', 1);
  pline(ctx, lc.x - dx * 2 - up.x, lc.y - dy * 2 - up.y, lc.x + dx * 1 - up.x * 1.6, lc.y + dy - up.y * 1.6, '#6a717b', 1);
  // moncong
  pcircle(ctx, tx, ty, 1, '#15171b');
  if (flash > 0) { ctx.globalAlpha = flash * 0.8; pcircle(ctx, rcv0.x, rcv0.y, 2.5, '#ffe9a8'); ctx.globalAlpha = 1; }
}

/** HUD: ikon peluru merah di bawah kursor/pemain */
export function drawShells(ctx: Ctx, x: number, y: number, n: number, max = SG_MAG) {
  for (let i = 0; i < max; i++) {
    const sx = x + (i - max / 2) * 4;
    prect(ctx, sx, y, 3, 5, '#000');
    if (i < n) { prect(ctx, sx + 0.5, y + 0.5, 2, 3, '#d63a2a'); prect(ctx, sx + 0.5, y + 3.5, 2, 1, '#e5b850'); }
    else prect(ctx, sx + 0.5, y + 0.5, 2, 4, '#3a3030');
  }
}
