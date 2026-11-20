// NUNCHAKU V2 — 1:1 port of STICK FIST's nunchaku (verlet chain, 4-hit combo, sweep arcs, flourish, trail).
import { pline, prect, type Ctx } from './pixel';
import type { Pose } from './types';

export interface SFAttack {
  name: string; dmg: number; range: number; arc: number; dur: number; lunge: number; kb: number; posture: number; heavy?: boolean;
  /** pose tubuh stickman yang disinkronkan dengan ayunan rantai nunchaku */
  pose?: Pose;
  /** pola putaran kombo: angka 8 / putaran samping / putaran atas kepala / oper punggung / lempar-tangkap */
  spin?: 'fig8' | 'side' | 'over' | 'back' | 'toss';
  /** serangan mandiri di luar rantai kombo (heavy tap/hold, rangkaian udara) */
  solo?: boolean;
  /** Charged Heavy: mematahkan tulang bagian tubuh yang terkena (lihat Game.applyFracture) */
  fracture?: boolean;
  /** mengangkat musuh ke udara (ayunan miring ke atas pembuka Kombo Udara) */
  launch?: number;
  /** membanting musuh keras ke lantai (penutup Kombo Udara) */
  slam?: boolean;
}

// FREESTYLE & ATRAKSI NUNCHAKU (8 Jurus Berantai ala Bruce Lee):
// Setiap ayunan punya koreografi kuda-kuda tubuh penuh (pose), ancang-ancang, puncak lecutan, dan atraksi putaran/operan!
export const SF_NUNCHAKU: SFAttack[] = [
  { name: 'DRAGON LASH', dmg: 6, range: 29, arc: 3.6, dur: 0.25, lunge: 38, kb: 95, posture: 16, pose: 'n_tri1' },
  { name: 'SHOULDER BOUNCE', dmg: 6, range: 29, arc: 3.6, dur: 0.25, lunge: 36, kb: 100, posture: 16, pose: 'n_tri2' },
  { name: 'FIGURE-8 FLOW', dmg: 4.5, range: 31, arc: 6.3, dur: 0.46, lunge: 18, kb: 70, posture: 13, spin: 'fig8', pose: 'n_figure8' },
  { name: 'AROUND THE BACK', dmg: 6.5, range: 30, arc: 6.3, dur: 0.40, lunge: 28, kb: 110, posture: 20, spin: 'back', pose: 'n_backpass' },
  { name: 'SIDE TORNADO', dmg: 5, range: 31, arc: 6.3, dur: 0.44, lunge: 24, kb: 85, posture: 15, spin: 'side', pose: 'n_sidespin' },
  { name: 'HELICOPTER HALO', dmg: 5.5, range: 31, arc: 6.3, dur: 0.44, lunge: 18, kb: 90, posture: 16, spin: 'over', pose: 'n_helicopter' },
  { name: 'TOSS & SNAP', dmg: 8, range: 30, arc: 3.8, dur: 0.38, lunge: 42, kb: 145, posture: 24, spin: 'toss', pose: 'n_toss' },
  { name: 'WHIP CRACK!', dmg: 16, range: 31, arc: 2.6, dur: 0.34, lunge: 68, kb: 290, posture: 36, heavy: true, pose: 'n_whipcrack' },
];
/** BASIC HEAVY — klik kanan TAP (< 0,2 detik): hantaman cepat bermomentum maju, knockback sedang. */
export const SF_HEAVY: SFAttack = { name: 'NUN HEAVY', dmg: 11, range: 30, arc: 2.6, dur: 0.29, lunge: 115, kb: 300, posture: 28, heavy: true, solo: true, pose: 'n_overhead' };
/** CHARGED HEAVY — klik kanan TAHAN (>= 0,2 detik): hantaman super kuat yang MEMATAHKAN TULANG musuh. */
export const SF_CHARGED: SFAttack = { name: 'NUN CHARGED', dmg: 20, range: 31, arc: 2.8, dur: 0.38, lunge: 95, kb: 520, posture: 60, heavy: true, solo: true, fracture: true, pose: 'n_dragonlash' };
/** KOMBO UDARA fase 1: ayunan miring ke ATAS bermomentum berat — mengangkat musuh ke udara. */
export const SF_SKY: SFAttack = { name: 'NUN SKY LAUNCH', dmg: 9, range: 29, arc: 2.6, dur: 0.29, lunge: 40, kb: 200, posture: 24, launch: 300, solo: true, pose: 'n_tri2' };
/** KOMBO UDARA fase 2: putaran badan + nunchaku di udara (aerial spin). */
export const SF_AIRSPIN: SFAttack = { name: 'NUN AIR SPIN', dmg: 5, range: 30, arc: 6.3, dur: 0.45, lunge: 6, kb: 90, posture: 12, spin: 'side', solo: true, pose: 'n_tornado' };
/** KOMBO UDARA fase 3: bantingan miring ke BAWAH — menghantam musuh keras ke lantai. */
export const SF_METEOR: SFAttack = { name: 'NUN METEOR SMASH', dmg: 16, range: 30, arc: 2.8, dur: 0.34, lunge: 30, kb: 320, posture: 48, heavy: true, solo: true, slam: true, pose: 'n_overhead' };

const TAU = Math.PI * 2;
type P = { x: number; y: number; px: number; py: number };

export class SFNunchaku {
  pts: P[] = [];
  anchor = { x: 0, y: 0 };
  prevEnd = { x: 0, y: 0 };
  trail: { x: number; y: number }[] = [];
  flourish = 0; flourishCd = 1; endSpeed = 0;
  // combo state (mirrors game1's player.state === 'attack' for weapon 3)
  cur: SFAttack | null = null;
  t = 0; idx = 0; comboTimer = 0; didHit = false; buffered = false;

  // ---- atraksi (flourish) ala kung fu: putaran samping, wrist roll 8, operan belakang punggung, lempar-tangkap, kunci leher/ketiak
  flourishKind: 'spin' | 'wrist' | 'back' | 'toss' | 'neck' = 'wrist';
  flourishDur = 0.65;
  private flourishSeq = 0;
  private tossed = false;
  /** mulai atraksi; tanpa argumen = berganti-ganti berurutan dari lima gaya atraksi kung fu */
  startFlourish(kind?: 'spin' | 'wrist' | 'back' | 'toss' | 'neck') {
    const kinds = ['wrist', 'back', 'toss', 'neck', 'spin'] as const;
    this.flourishKind = kind ?? kinds[this.flourishSeq++ % kinds.length];
    this.flourishDur = this.flourishKind === 'toss' ? 0.62 : this.flourishKind === 'neck' ? 0.65 : this.flourishKind === 'wrist' ? 0.54 : 0.6;
    this.flourish = this.flourishDur;
    this.flourishCd = 1.3 + Math.random() * 1.1;
    this.tossed = false;
  }

  /** Pose tubuh penuh yang menyertai serangan atau atraksi nunchaku aktif */
  bodyPose(): { pose: Pose; t: number } | null {
    if (this.cur) {
      const u = Math.min(1, Math.max(0, this.t / Math.max(0.01, this.cur.dur)));
      return { pose: this.cur.pose ?? 'n_lash', t: u };
    }
    if (this.flourish > 0) {
      const fu = Math.min(1, Math.max(0, 1 - this.flourish / Math.max(0.01, this.flourishDur)));
      const pMap: Record<typeof this.flourishKind, Pose> = {
        wrist: 'n_figure8',
        back: 'n_backpass',
        toss: 'n_toss',
        neck: 'n_neckwrap',
        spin: 'n_sidespin',
      };
      return { pose: pMap[this.flourishKind] ?? 'n_figure8', t: fu };
    }
    return null;
  }

  reset(x: number, y: number) {
    this.pts = Array.from({ length: 6 }, () => ({ x, y, px: x, py: y }));
    this.anchor = { x, y }; this.trail = []; this.cur = null; this.idx = 0;
  }
  get attacking() { return !!this.cur; }
  /** mainkan satu serangan tertentu (heavy tap/hold, fase kombo udara) tanpa mengutak-atik rantai */
  play(a: SFAttack) {
    this.cur = a; this.t = 0; this.didHit = false; this.buffered = false; this.flourish = 0;
  }
  start(heavy = false) {
    if (heavy) { this.play(SF_HEAVY); return; }
    this.cur = SF_NUNCHAKU[this.idx]; this.t = 0; this.didHit = false; this.buffered = false; this.flourish = 0;
  }
  /** advance combo; returns 'hit' on the hit frame */
  step(dt: number): 'hit' | null {
    this.comboTimer -= dt;
    if (!this.cur) { if (this.comboTimer <= 0) this.idx = 0; return null; }
    this.t += dt;
    const u = this.t / this.cur.dur;
    let ev: 'hit' | null = null;
    if (!this.didHit && u >= 0.45) { this.didHit = true; ev = 'hit'; }
    if (u >= 1) {
      const solo = !!this.cur.solo;
      this.cur = null;
      if (solo) { this.comboTimer = 0.5; this.buffered = false; }
      else {
        this.idx = (this.idx + 1) % SF_NUNCHAKU.length; this.comboTimer = 1.05;
        if (this.buffered) this.start();
      }
    }
    return ev;
  }
  lungeK() { return this.cur ? Math.max(0, 1 - (this.t / this.cur.dur) * 1.5) : 0; }

  update(dt: number, shX: number, shY: number, facing: number, time: number, mode: 'idle' | 'dash', LS = 1, hand?: { x: number; y: number }) {
    if (this.pts.length !== 6) this.reset(shX, shY);
    this.flourishCd -= dt; this.flourish = Math.max(0, this.flourish - dt);
    let tx: number, ty: number, rate = 1;
    const attacking = !!this.cur || !!hand;
    void time;
    if (hand) { tx = hand.x; ty = hand.y; rate = 1; }
    else if (attacking) {
      const a = this.cur!, u = Math.min(1, this.t / a.dur);
      // EASING MOMENTUM: fase kumpul (22% awal) ayunan mundur perlahan makin cepat, lalu
      // MELEDAK melewati titik puncak (ease-out pangkat 4), dan mereda di follow-through.
      // Hasilnya ayunan berbobot & alami — tidak kaku, tidak secepat kilat.
      const sweep = (from: number, to: number, snap = 0.5) => {
        if (u < 0.22) { const v = u / 0.22; return from - Math.sign(to - from) * 0.7 * (v * v); }
        const v = Math.min(1, (u - 0.22) / (snap * 0.78));
        const e = 1 - Math.pow(1 - v, 4);
        return from + (to - from) * e + Math.sin(v * Math.PI) * 0.1 * Math.sign(to - from);
      };
      let ang = facing, rad = 11, yOff = 0;
      switch (a.name) {
        case 'DRAGON LASH':
        case 'NUN SWING':
          ang = facing + sweep(-2.1, 1.05); rad = 8.5 + 5 * u; yOff = -2.5 + 4 * u;
          break;
        case 'SHOULDER BOUNCE':
        case 'NUN CROSS':
          ang = facing + sweep(2.05, -1.15); rad = 8.5 + 5.2 * u; yOff = 3 - 5.5 * u;
          break;
        // KOMBO PUTARAN & ATRAKSI berbasis momentum — murni lintasan fisik rantai & ujung nunchaku
        case 'FIGURE-8 FLOW':
        case 'NUN FIGURE-8':
          ang = facing + Math.sin(u * Math.PI * 4) * 1.95; rad = 10.5 + Math.sin(u * Math.PI * 8) * 2.8; yOff = Math.sin(u * Math.PI * 8) * 3.6;
          break;
        case 'AROUND THE BACK':
          // Operan melingkar dari punggung ke depan pinggang lalu menyabet keluar!
          ang = facing + Math.PI * 1.15 - u * TAU * 1.25; rad = 9.5 + 4 * Math.sin(u * Math.PI); yOff = 2.0 - 2.5 * Math.sin(u * Math.PI);
          break;
        case 'SIDE TORNADO':
        case 'NUN SIDE SPIN':
          ang = facing + u * TAU * 2; rad = 12.8; yOff = Math.cos(u * TAU * 2) * 2;
          break;
        case 'HELICOPTER HALO':
        case 'NUN OVERHEAD':
          ang = facing + u * TAU * 2.2; rad = 9.8; yOff = -9.5;
          break;
        case 'TOSS & SNAP':
          // Lempar berputar tinggi di separuh awal, lalu tangkap & lecut ke depan!
          if (u < 0.46) {
            ang = facing - Math.PI * 0.5 + u * TAU * 2.4; rad = 8.5; yOff = -10 * Math.sin((u / 0.46) * Math.PI);
          } else {
            const v2 = (u - 0.46) / 0.54;
            ang = facing + (-1.8 + 2.7 * (1 - Math.pow(1 - v2, 3))); rad = 8 + 6.5 * v2; yOff = -2 + 3 * v2;
          }
          break;
        case 'NUN AIR SPIN': ang = facing + u * TAU * 2; rad = 12; break;
        // KOMBO UDARA: ayunan miring ke atas, lalu bantingan miring ke bawah
        case 'NUN SKY LAUNCH': ang = facing + sweep(1.5, -1.9, 0.55); rad = 9 + 5 * u; break;
        case 'NUN METEOR SMASH': ang = facing + sweep(-1.9, 1.35, 0.5); rad = 10 + 4 * u; break;
        case 'NUN HEAVY': ang = facing + sweep(-2.2, 0.9, 0.4); rad = 7 + 7 * Math.min(1, Math.max(0, (u - 0.22) / 0.31)); break;
        case 'NUN CHARGED': ang = facing + sweep(-2.5, 1.0, 0.42); rad = 7 + 8 * Math.min(1, Math.max(0, (u - 0.22) / 0.33)); break;
        case 'WHIP CRACK!':
        case 'WHIP CRACK':
          ang = facing + sweep(-2.35, 0.85, 0.34); rad = 6.5 + 8.5 * Math.min(1, Math.max(0, (u - 0.22) / 0.27));
          break;
        default: ang = facing + sweep(-2.0, 1.0); rad = 8 + 5 * u;
      }
      tx = shX + Math.cos(ang) * rad * LS; ty = shY + Math.sin(ang) * rad * LS + yOff * LS;
      // jangkar tangan ikut berbobot: tertinggal saat mengumpulkan momentum, menyentak saat puncak
      rate = u < 0.22 ? 0.4 : 0.85;
    } else if (mode === 'dash') {
      tx = shX - Math.cos(facing) * 6 * LS; ty = shY + 3 * LS; rate = 0.3;
    } else {
      // ATRAKSI KUNG FU berganti-ganti: wrist roll 8 / operan belakang punggung / lempar-tangkap / kunci leher-ketiak / putaran roda
      if (this.flourishCd <= 0 && this.flourish === 0) this.startFlourish();
      if (this.flourish > 0) {
        const fu = 1 - this.flourish / this.flourishDur;
        if (this.flourishKind === 'wrist') {
          // Figure-8 wrist roll: angka 8 cepat di depan dada
          const cx = shX + Math.cos(facing) * 6.8 * LS, cy = shY + Math.sin(facing) * 2.5 * LS;
          const ga = facing + fu * TAU * 3;
          tx = cx + Math.cos(ga) * 3.8 * LS; ty = cy + Math.sin(ga * 2) * 3.2 * LS; rate = 0.82;
        } else if (this.flourishKind === 'back') {
          // Behind-the-back pass: jangkar mengitari pinggang & punggung, muncul dari sisi sebaliknya
          const cx = shX - Math.cos(facing) * 2.6 * LS;
          const ga = facing + fu * TAU * 1.5;
          tx = cx + Math.cos(ga) * 6.5 * LS; ty = shY + 1.8 * LS + Math.sin(ga) * 4.8 * LS; rate = 0.6;
        } else if (this.flourishKind === 'toss') {
          // Aerial Toss & Catch: nunchaku dilempar berputar tinggi ke atas, lalu ditangkap kembali di ketiak
          if (fu > 0.04 && !this.tossed) {
            this.tossed = true;
            for (let i = 1; i < 6; i++) { this.pts[i].py = this.pts[i].y + 3.6; this.pts[i].px = this.pts[i].x - Math.cos(facing) * 1.2; }
          }
          tx = shX + Math.cos(facing) * (fu < 0.6 ? 5.5 : 3.2) * LS; ty = shY + (fu < 0.55 ? -6.5 : 2.2) * LS;
          rate = fu < 0.55 ? 0.09 : 0.95; // lepas melayang... lalu SNAG terkunci kembali ke tangan!
        } else if (this.flourishKind === 'neck') {
          // Neck Wrap & Underarm Lock ala Bruce Lee: mengitari bahu/leher lalu dikepit di bawah ketiak
          const wrap = Math.min(1, fu / 0.65);
          const lock = Math.max(0, (fu - 0.65) / 0.35);
          const ga = facing - Math.PI * 0.6 + wrap * TAU * 1.3;
          const rx = shX + Math.cos(ga) * 5.2 * LS, ry = shY - 3.5 * LS + Math.sin(ga) * 3.6 * LS;
          const lx = shX + Math.cos(facing) * 2.4 * LS, ly = shY + 2.8 * LS;
          tx = rx + (lx - rx) * lock; ty = ry + (ly - ry) * lock; rate = 0.72;
        } else {
          const ga = facing + fu * TAU * 2;
          tx = shX + Math.cos(ga) * 7.8 * LS; ty = shY + Math.sin(ga) * 7.2 * LS; rate = 0.5;
        }
      } else { tx = shX + Math.cos(facing) * 6.5 * LS; ty = shY + (2.5 + Math.sin(facing) * 3) * LS; }
    }
    const N = this;
    if (Math.hypot(N.anchor.x - tx, N.anchor.y - ty) > 46 * LS) { N.anchor.x = tx; N.anchor.y = ty; }
    const kk = 1 - Math.pow(1 - rate, dt * 60);
    N.anchor.x += (tx - N.anchor.x) * kk; N.anchor.y += (ty - N.anchor.y) * kk;
    const rest = [2.2, 2.2, 2.2, 2.2, 7].map((r) => r * LS);
    const last = N.pts[5];
    N.prevEnd = { x: last.x, y: last.y };
    const sub = 3, sdt = dt / sub;
    for (let s = 0; s < sub; s++) {
      N.pts[0].x = N.anchor.x; N.pts[0].y = N.anchor.y; N.pts[0].px = N.anchor.x; N.pts[0].py = N.anchor.y;
      for (let i = 1; i < 6; i++) {
        const q = N.pts[i];
        const damp = attacking ? 0.994 : 0.985, grav = attacking ? 6 : 55;
        const vx = (q.x - q.px) * damp, vy = (q.y - q.py) * damp;
        q.px = q.x; q.py = q.y;
        q.x += vx; q.y += vy + grav * sdt * sdt * 60;
      }
      for (let it = 0; it < 4; it++) {
        N.pts[0].x = N.anchor.x; N.pts[0].y = N.anchor.y;
        for (let i = 0; i < 5; i++) {
          const a = N.pts[i], b = N.pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.001, diff = (d - rest[i]) / d;
          if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
          else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
        }
      }
    }
    const end = N.pts[5];
    N.endSpeed = Math.hypot(end.x - N.prevEnd.x, end.y - N.prevEnd.y) / Math.max(dt, 0.001);
    N.trail.unshift({ x: end.x, y: end.y });
    if (N.trail.length > 8) N.trail.pop();
  }

  /** distance from point to the free stick segment */
  stickDist(x: number, y: number) {
    const a = this.pts[4], b = this.pts[5];
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L2));
    return Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t));
  }

  draw(ctx: Ctx, accent: string, showTrail = true) {
    const pts = this.pts;
    if (pts.length !== 6) return;
    for (let i = showTrail ? this.trail.length - 1 : 0; i >= 1; i--) {
      const t = 1 - i / this.trail.length;
      ctx.globalAlpha = t * 0.55;
      pline(ctx, this.trail[i].x, this.trail[i].y, this.trail[i - 1].x, this.trail[i - 1].y, accent, Math.max(1, Math.round(0.5 + t * 2.2)));
    }
    ctx.globalAlpha = 1;
    const end = pts[5];
    {
      const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y, d = Math.hypot(dx, dy) || 1;
      const hx = pts[0].x + dx / d * 4.5, hy = pts[0].y + dy / d * 4.5;
      pline(ctx, pts[0].x, pts[0].y, hx, hy, '#000', 4);
      pline(ctx, pts[0].x, pts[0].y, hx, hy, '#9c6a33', 2);
    }
    for (let i = 1; i < 4; i++) {
      pline(ctx, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, '#000', 3);
      pline(ctx, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, '#aeb8c6', 1);
    }
    pline(ctx, pts[4].x, pts[4].y, end.x, end.y, '#000', 4);
    // saat mode api, tongkat ikut membara (bukan batang gelap di tengah kobaran)
    pline(ctx, pts[4].x, pts[4].y, end.x, end.y, showTrail ? '#b3763a' : '#8a4a1e', 2);
    if (!showTrail) pline(ctx, pts[4].x, pts[4].y, end.x, end.y, '#ff8a2a', 1);
    prect(ctx, end.x - 1.5, end.y - 1.5, 3, 3, '#000');
    prect(ctx, end.x - 1, end.y - 1, 2, 2, accent);
  }
}
