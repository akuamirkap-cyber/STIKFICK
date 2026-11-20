import { pcircle, pfontO, pline, prect, type Ctx } from './pixel';
import { BASE_ZOOM, VIEW_H as CVH, VIEW_W as CVW } from './constants';
import { crescent } from './buster';
import { drawStick } from './draw';
import { clamp, rnd } from './rng';
import { solvePose } from './stick';

/**
 * PEMBUKAAN DELAPAN GERBANG (tombol N) — gaya Rock Lee / Might Guy.
 *  Tekan N: gerbang terbuka satu per satu sampai GERBANG 6 (Kaimon, Kyumon, Seimon, Shomon, Tomon, Keimon).
 *  Tiap gerbang menaikkan aura, kecepatan lari & serangan, kekuatan pukulan dan dorongan.
 *  GERBANG 6 = mode DRUNKEN MASTER: lebih cepat, setiap serangan dasar terasa HEAVY (hitstop tebal, guncangan, benturan)
 *  TANPA membuat musuh mudah terpental (musuh tertahan di tempat & terhuyung), dan badan sempoyongan (drunkK + stick.ts applyDrunk).
 *  Dari GERBANG 3 dan tangan kosong: KLIK KANAN dekat musuh = LOTUS TERSEMBUNYI (Omote Renge) —
 *  menerjang, melontarkan musuh ke udara, berputar bersama, lalu membantingnya ke tanah.
 *  Tenaga terkuras; habis = KELELAHAN sesaat. Tekan N lagi untuk menutup gerbang lebih awal.
 */
type G = any;
type E = any;
const NAMES = ['KAIMON  GERBANG PEMBUKA', 'KYUMON  GERBANG PENYEMBUHAN', 'SEIMON  GERBANG KEHIDUPAN', 'SHOMON  GERBANG LUKA', 'TOMON  GERBANG BATAS', 'KEIMON  GERBANG PANDANG'];

/** WARNA AURA: merah (bawaan), hijau, atau biru — dipilih lewat opsi AURA di bilah bawah, tersimpan di localStorage. Warna kulit TIDAK pernah berubah. */
export type AuraColor = 'red' | 'green' | 'blue';
const AURA_KEY = 'v2_aura_color';
export function loadAuraColor(): AuraColor { try { const v = localStorage.getItem(AURA_KEY); return v === 'blue' || v === 'green' ? v : 'red'; } catch { return 'red'; } }
export function saveAuraColor(c: AuraColor) { try { localStorage.setItem(AURA_KEY, c); } catch { /* penyimpanan penuh */ } }
interface Pal { mid: string; out: string; deep: string; light: string; sil0: string; sil1: string; ground: string; after: string; mist: string; glow: string; spr: [number, string][][] }
const PALS: Record<AuraColor, Pal> = {
  red: {
    mid: '#ff6a5a', out: '#e0201a', deep: '#7a0c0c', light: '#ffd9d0', sil0: '#ff9a8a', sil1: '#e03a2e', ground: '255,60,40', after: '#ff5a4a', mist: '#ffe0d8', glow: '#ff4a3a',
    spr: [
      [[0, 'rgba(255,70,50,0.9)'], [0.45, 'rgba(220,30,20,0.5)'], [1, 'rgba(180,10,10,0)']],
      [[0, 'rgba(255,210,190,0.95)'], [0.5, 'rgba(255,110,90,0.5)'], [1, 'rgba(235,60,50,0)']],
      [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,238,230,0.6)'], [1, 'rgba(255,220,210,0)']],
    ],
  },
  blue: {
    mid: '#6fd6ff', out: '#2f7bff', deep: '#1b3fb8', light: '#d8f2ff', sil0: '#8fd3ff', sil1: '#4a9bff', ground: '40,130,255', after: '#4fb2ff', mist: '#dff3ff', glow: '#3a8bff',
    spr: [
      [[0, 'rgba(60,150,255,0.9)'], [0.45, 'rgba(30,100,255,0.5)'], [1, 'rgba(20,70,255,0)']],
      [[0, 'rgba(180,235,255,0.95)'], [0.5, 'rgba(90,190,255,0.5)'], [1, 'rgba(60,160,255,0)']],
      [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(225,246,255,0.6)'], [1, 'rgba(200,240,255,0)']],
    ],
  },
  green: {
    mid: '#7dffa6', out: '#2fe060', deep: '#13803a', light: '#d6ffe2', sil0: '#9dffb8', sil1: '#4ade78', ground: '40,235,110', after: '#5aff90', mist: '#e4ffee', glow: '#3aff8b',
    spr: [
      [[0, 'rgba(60,225,110,0.9)'], [0.45, 'rgba(30,190,80,0.5)'], [1, 'rgba(20,160,70,0)']],
      [[0, 'rgba(195,255,205,0.95)'], [0.5, 'rgba(110,255,150,0.5)'], [1, 'rgba(80,235,130,0)']],
      [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(232,255,240,0.6)'], [1, 'rgba(210,255,225,0)']],
    ],
  },
};
let CUR: AuraColor = 'red';
let PAL: Pal = PALS.red;
let C_MID = PAL.mid, C_OUT = PAL.out, C_DEEP = PAL.deep;
function applyTheme(t: AuraColor) { CUR = t; PAL = PALS[t]; C_MID = PAL.mid; C_OUT = PAL.out; C_DEEP = PAL.deep; }
const MAXG = 6;
const easeOut = (k: number) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);

interface Flame { x: number; y: number; vx: number; vy: number; t: number; max: number; r: number; ph: number; k: number }
interface Pulse { x: number; y: number; t: number; max: number; r: number }
interface Bolt { pts: [number, number][]; t: number }

const SPR: Partial<Record<AuraColor, HTMLCanvasElement[]>> = {};
/** sprite gumpalan api bergradasi lembut (dibuat sekali per tema): luar gelap, tengah terang, inti putih */
function sprites(): HTMLCanvasElement[] {
  const cached = SPR[CUR];
  if (cached) return cached;
  const mk = (stops: [number, string][]) => {
    const c = document.createElement('canvas'); c.width = 48; c.height = 48;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(0, 0, 48, 48);
    return c;
  };
  return (SPR[CUR] = PAL.spr.map(mk));
}

// ---------------------------------------------------------------- SINEMATIK 6 FASE
const PH_DUR = [0.85, 1.1, 0.9, 0.95, 0.75, 1.1];   // detik NYATA per fase (dunia diperlambat, sinematik tidak)
interface Cine { i: number; pt: number; t: number; cut: boolean; eyes: boolean; burst: boolean; r1: boolean; r2: boolean; snap: boolean }
interface Seg { x0: number; y0: number; x1: number; y1: number }
const TAU = Math.PI * 2;
const smoothK = (k: number) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const lerpK = (a: number, b: number, k: number) => a + (b - a) * k;

export class EightGates {
  on = false;
  gates = 0;
  energy = 100;
  exhaust = 0;
  openT = 0;
  lotusCd = 0;
  time = 0;
  flames: Flame[] = [];
  pulses: Pulse[] = [];
  bolts: Bolt[] = [];
  private pulseT = 0;
  private glow = 0;
  // lotus
  lotus = false;
  private lt = 0;
  private lphase = 0;
  private ldir = 0;
  private lx = 0; private ly = 0;
  // warna aura + sinematik pembukaan gerbang
  theme: AuraColor = loadAuraColor();
  cine: Cine | null = null;
  private cracks: Seg[] = [];
  private crackK = 0; private craterK = 0; private craterFade = 0;
  private cx0 = 0; private cy0 = 0;
  private spawnAcc = 0;
  /** 0..1: seberapa kuat mode Drunken Master (Gerbang 6 penuh, bukan saat sinematik); halus masuk/keluar */
  drunkK = 0;
  private hitN = 0; private lastHeavyFx = -9;

  constructor() { applyTheme(this.theme); }

  /** kecepatan gerak jalan/lari: tetap sama seperti normal tanpa Gerbang 6 (1.0) agar animasi jalan & lari tetap natural */
  get speedMul() {
    if (this.exhaust > 0) return 0.72;
    return 1;
  }
  /** kecepatan serangan: gerakan jurus lebih cepat saat gerbang terbuka namun tetap nyaman terbaca mata (Gerbang 6 = ~1.33x) */
  get atkMul() { return this.exhaust > 0 ? 0.84 : this.on ? 1 + 0.055 * this.gates : 1; }
  get dmgMul() { return this.on ? 1 + 0.28 * this.gates : 1; }
  /** dorongan dasar: serangan biasa tetap 1.0 (normal); finisher punch diperkuat jauh di heavyHit() */
  get kbMul() { return 1; }
  /** aura/kawah perlu digambar (aktif, Lotus, atau kawah sedang memudar) */
  get visible() { return this.on || this.lotus || this.craterFade > 0; }
  get mid() { return C_MID; }
  glowColor() { return PAL.glow; }
  setTheme(t: AuraColor) { this.theme = t; applyTheme(t); saveAuraColor(t); }

  /** ekspresi mata selama sinematik: santai > terpejam (fokus) > terbuka melotot saat gerbang terbuka */
  look(): { mood: 'normal' | 'closed' | 'angry'; eyes: string } {
    const c = this.cine;
    if (c) {
      if (c.i === 0) return { mood: 'normal', eyes: '#111111' };
      if (c.i <= 2 || (c.i === 3 && !c.eyes)) return { mood: 'closed', eyes: '#111111' };
    }
    return { mood: 'angry', eyes: '#ffffff' };
  }

  reset() {
    this.on = false; this.gates = 0; this.lotus = false; this.cine = null;
    this.flames.length = 0; this.pulses.length = 0; this.bolts.length = 0;
    this.exhaust = 0; this.energy = 100; this.openT = 0; this.glow = 0;
    this.crackK = 0; this.craterK = 0; this.craterFade = 0; this.cracks = [];
    this.drunkK = 0; this.hitN = 0;
  }

  toggle(g: G) {
    if (g.state !== 'playing') return;
    const p = g.player;
    if (this.lotus || p.fatality) return;
    if (this.cine) { this.skipCine(g); return; }            // N saat sinematik = lewati langsung ke Gerbang 6
    if (this.on) { this.close(g, false); return; }
    if (this.exhaust > 0) { g.texts?.add?.(p.x, p.y - 24, 'MASIH KELELAHAN', '#7fa8d8', 1, 0.7); g.sfx?.empty?.(); return; }
    if (this.energy < 25) { g.texts?.add?.(p.x, p.y - 24, 'TENAGA BELUM CUKUP', '#7fa8d8', 1, 0.7); g.sfx?.empty?.(); return; }
    this.startCine(g);
  }

  close(g: G, forced: boolean) {
    const p = g.player;
    const hadHigh = this.gates >= 5;
    this.on = false; this.gates = 0; this.openT = 0; this.cine = null;
    if (this.crackK > 0) this.craterFade = 3;               // kawah memudar pelan setelah gerbang ditutup
    g.particles?.burst?.(p.x, p.y - 8, 18, C_MID, 120, 0.5, 2, 2);
    g.particles?.smoke?.(p.x, p.y - 6, 6, PAL.mist, 30, 0.6);
    if (forced || hadHigh) {
      this.exhaust = forced ? 2.6 : 1.4;
      g.say?.(forced ? 'KELELAHAN...' : 'GERBANG DITUTUP', '#9fb4d8', 2, 1.2);
    } else g.say?.('GERBANG DITUTUP', '#9fb4d8', 1, 0.9);
    g.sfx?.whoosh?.();
  }

  // ------------------------------------------------------------------ SINEMATIK PEMBUKAAN
  /**
   * GERBANG 6:
   * - BASIC ATTACK: tetap seperti basic attack biasa (kombo mengalir normal), namun FEEL-nya lebih bagus ("WOW":
   *   cincin chakra renyah, percikan aura, hitstop & kamera yang responsif).
   * - FINISHER PUNCH / HEAVY ATTACK: menghantam seperti HEAVY ATTACK dahsyat — musuh terpental JAUH (knockback & launch besar,
   *   shockwave ganda, kilatan putih, dan bunyi dentuman).
   */
  heavyHit(g: G, e: any, o: any, dir: number, isFinisher = false) {
    this.hitN++;
    const n: any = { ...o };
    const x = e.x, y = e.y - 7 * (e.scale ?? 1) - (e.z ?? 0);
    if (isFinisher) {
      n.knockdown = true;
      n.hitstop = Math.max(o.hitstop ?? 0.05, 0.115);
      n.shake = Math.max(o.shake ?? 0.25, 0.88);
      n.launch = Math.max(o.launch ?? 0, 155);
      n.kbBoost = 2.65;
      if (this.time - this.lastHeavyFx > 0.04) {
        this.lastHeavyFx = this.time;
        g.sfx?.heavy?.(); g.sfx?.slam?.();
        g.particles?.shockwave?.(e.x, e.y - 4, 38, C_MID, 0.34);
        g.particles?.ring?.(x, y, 3, 25, C_MID, 0.24, 2, true);
        g.particles?.ring?.(x, y, 2, 16, '#ffffff', 0.18, 2, true);
        g.particles?.impact?.(x, y, 12, '#ffffff');
        g.particles?.spark?.(x, y, 18, C_MID, dir, 1.0, 310);
        g.flash?.('#ffffff', 0.15);
        g.zoomKick = Math.max(g.zoomKick ?? 0, 0.065);
        if (g.camKick) { g.camKick.x += Math.cos(dir) * 4.4; g.camKick.y += Math.sin(dir) * 2.2; }
      }
      e.sqx = 1.45; e.sqy = 0.58;
      return n;
    }
    // Basic attack: tetap seperti biasa (tidak mental jauh sebelum waktunya), tapi feel pukulan lebih mantap & hidup!
    n.hitstop = Math.max(o.hitstop ?? 0.025, 0.042);
    n.shake = Math.max(o.shake ?? 0.12, 0.25);
    n.kbBoost = 1.0;
    if (this.time - this.lastHeavyFx > 0.05) {
      this.lastHeavyFx = this.time;
      g.particles?.ring?.(x, y, 2, 13, C_MID, 0.15, 1.5, true);
      g.particles?.impact?.(x, y, 7, '#ffffff');
      g.particles?.spark?.(x, y, 9, PAL.light, dir, 0.95, 220);
      g.zoomKick = Math.max(g.zoomKick ?? 0, 0.022);
      if (g.camKick) { g.camKick.x += Math.cos(dir) * 1.65; g.camKick.y += Math.sin(dir) * 0.85; }
    }
    e.sqx = 1.28; e.sqy = 0.74;
    return n;
  }

  private startCine(g: G) {
    const p = g.player;
    this.on = true; this.gates = 0; this.openT = 0;
    this.cine = { i: 0, pt: 0, t: 0, cut: false, eyes: false, burst: false, r1: false, r2: false, snap: false };
    this.cx0 = p.x; this.cy0 = p.y;
    this.cracks = this.makeCracks(); this.crackK = 0; this.craterK = 0; this.craterFade = 0;
    p.attackPhase = 'none'; p.buffered = null; p.dashT = 0; p.parryT = 0; p.runT = 0; p.running = false;
    p.vx = 0; p.vy = 0; p.kx = 0; p.ky = 0;
    p.iframes = Math.max(p.iframes ?? 0, 0.6);
    g.cinematic = true; g.camFocus = { x: p.x, y: p.y - 6 };
    g.say?.('PEMBUKAAN DELAPAN GERBANG', C_MID, 2, 1.4);
    g.sfx?.announce?.();
  }

  private cam(g: G, fx: number, fy: number, zoom: number, raw: number, rate: number, snap = false) {
    g.cinematic = true;
    g.camFocus = { x: fx, y: fy };
    g.zoomTarget = zoom;
    if (snap) { g.zoom = zoom; g.cam.x = fx - CVW / 2; g.cam.y = fy - 6 - CVH / 2; }       // CUT instan
    else g.zoom += (zoom - g.zoom) * (1 - Math.exp(-rate * raw));                        // zoom cepat/lambat sesuai rate
  }

  private handWorld(g: G, which: 'f' | 'b') {
    const p = g.player;
    const sk = solvePose(g.playerStickOpts(p.holdPose, p.holdPoseT));
    const v = which === 'f' ? sk.fhand : sk.bhand;
    return { x: p.x + v.x, y: p.y - (p.z ?? 0) + v.y };
  }

  private dust(g: G, rate: number, raw: number, mode: 'wind' | 'shiver') {
    const p = g.player;
    this.spawnAcc += rate * raw;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (mode === 'wind') g.particles?.add?.({ x: p.x - 70 + rnd(0, 50), y: p.y - rnd(0, 3), vx: rnd(35, 70), vy: -rnd(0, 5), life: rnd(1.2, 1.8), c: Math.random() < 0.5 ? '#b7ad98' : '#9d9482', k: 0, s: 1 });
      else g.particles?.add?.({ x: p.x + rnd(-16, 16), y: p.y - rnd(0, 1.5), vx: rnd(-7, 7), vy: -rnd(10, 26), life: rnd(0.25, 0.45), c: '#bdb29b', k: 0, s: 1 });
    }
  }

  /** kenaikan gerbang CEPAT: tiap tik = denyut, bunyi, dan aura makin kuat */
  private tickTo(g: G, n: number) {
    while (this.gates < Math.min(MAXG, n)) { this.gates++; this.tickFx(g, this.gates); }
  }
  private tickFx(g: G, n: number) {
    const p = g.player;
    this.glow = 1;
    g.say?.(`GERBANG ${n}: ${NAMES[n - 1]}`, n >= 5 ? PAL.light : C_MID, 1, 0.5);
    g.shake?.(0.08 + n * 0.03); g.zoomKick = Math.max(g.zoomKick ?? 0, 0.012 + n * 0.004);
    g.sfx?.focus?.(); if (n >= 4) g.sfx?.leverClack?.();
    this.pulses.push({ x: p.x, y: p.y, t: 0, max: 0.42, r: 10 + n * 4 });
    g.particles?.ring?.(p.x, p.y - 8, 2, 10 + n * 3, '#ffffff', 0.2, 1);
  }

  private stepCine(g: G, raw: number) {
    const c = this.cine!, p = g.player;
    c.pt += raw; c.t += raw;
    const dur = PH_DUR[c.i], u = clamp(c.pt / dur, 0, 1);
    const Z = (k: number) => k * BASE_ZOOM;
    const z0 = p.z ?? 0;
    const torso = { x: p.x, y: p.y - z0 - 6 }, head = { x: p.x, y: p.y - z0 - 11 };
    // pemain terkunci & kebal; musuh menahan serangan; dunia diperlambat
    p.holdT = Math.max(p.holdT ?? 0, 0.25);
    p.iframes = Math.max(p.iframes ?? 0, 0.5);
    p.attackPhase = 'none'; p.buffered = null; p.moving = false; p.running = false; p.runT = 0; p.dashT = 0;
    for (const e of g.enemies) if (!e.dead) e.attackCd = Math.max(e.attackCd ?? 0, 0.8);
    switch (c.i) {
      case 0: {
        // FASE 1 — kuda-kuda santai, dada naik-turun, angin ringan membawa debu, medium shot statis
        p.holdPose = 'g_relax'; p.holdPoseT = u;
        g.slow(0.12, 0.55);
        this.cam(g, torso.x, torso.y, Z(1.22), raw, 6);
        this.dust(g, 12, raw, 'wind');
        break;
      }
      case 1: {
        // FASE 2 — memusatkan tenaga: mata terpejam, napas dalam, kepalan mengerat, debu bergetar, push-in pelan ke wajah,
        // lalu CUT cepat ke close-up kepalan
        p.holdPose = 'g_focus'; p.holdPoseT = u;
        g.slow(0.12, 0.35);
        this.dust(g, 38, raw, 'shiver');
        if (u < 0.68) {
          const k = smoothK(u / 0.68);
          this.cam(g, lerpK(torso.x, head.x, k), lerpK(torso.y, head.y, k), Z(lerpK(1.22, 2.4, k)), raw, 7);
        } else {
          const f = this.handWorld(g, 'f');
          this.cam(g, f.x, f.y, Z(3.4), raw, 24, !c.cut);
          if (!c.cut) { c.cut = true; g.sfx?.leverClack?.(); g.shake?.(0.12); }
        }
        if (u >= 0.3) this.tickTo(g, 1);
        if (u >= 0.68) this.tickTo(g, 2);
        break;
      }
      case 2: {
        // FASE 3 — tubuh menegang: slow motion, garis kecepatan menyatu ke tubuh, retakan kecil di bawah kaki, tegangan naik
        p.holdPose = 'g_tense'; p.holdPoseT = u;
        g.slow(0.12, 0.14);
        this.cam(g, torso.x, torso.y - 1, Z(lerpK(1.9, 2.3, u)), raw, 5, c.snap);
        c.snap = false;
        this.crackK = lerpK(0.04, 0.26, u);
        this.dust(g, 22, raw, 'shiver');
        if (Math.random() < 0.25 + u * 0.5) g.shake?.(0.02 + 0.07 * u);
        if (u >= 0.15) this.tickTo(g, 3);
        if (u >= 0.6) this.tickTo(g, 4);
        break;
      }
      case 3: {
        // FASE 4 — pose silang X, mendak seperti pegas, ditahan beku: sudut rendah, lalu zoom cepat ke mata yang terbuka mendadak
        p.holdPose = 'g_cross'; p.holdPoseT = u;
        g.slow(0.12, 0.12);
        if (u < 0.62) this.cam(g, p.x, p.y + 7, Z(2.0), raw, 6);
        else this.cam(g, head.x, head.y, Z(3.3), raw, 20);
        if (u >= 0.3) this.tickTo(g, 5);
        if (u >= 0.9 && !c.eyes) { c.eyes = true; g.flash?.('#ffffff', 0.3); g.sfx?.slam?.(); g.zoomKick = Math.max(g.zoomKick ?? 0, 0.05); }
        break;
      }
      case 4: {
        // FASE 5 — gerbang terbuka: ledakan chakra, lengan terentang, teriak, tanah pecah, debu melingkar, layar bergetar, kilat putih
        if (!c.burst) { c.burst = true; this.burstFx(g); }
        p.holdPose = 'g_burst'; p.holdPoseT = u;
        g.slow(0.12, u < 0.45 ? 0.22 : 0.5);
        this.cam(g, torso.x, torso.y, Z(lerpK(3.3, 2.0, smoothK(u * 1.4))), raw, 8);
        this.crackK += (1 - this.crackK) * (1 - Math.exp(-9 * raw));
        this.craterK += (1 - this.craterK) * (1 - Math.exp(-7 * raw));
        if (!c.r1 && u >= 0.2) { c.r1 = true; this.pulses.push({ x: p.x, y: p.y, t: 0, max: 0.7, r: 62 }); g.shake?.(0.5); }
        if (!c.r2 && u >= 0.45) { c.r2 = true; this.pulses.push({ x: p.x, y: p.y, t: 0, max: 0.7, r: 78 }); g.shake?.(0.3); }
        break;
      }
      default: {
        // FASE 6 — aura stabil di dalam kawah, turun ke kuda-kuda menyerang, tatapan tajam; kamera mengitari setengah lingkaran lalu wide shot
        p.holdPose = 'g_stance'; p.holdPoseT = smoothK(u);
        g.slow(0.12, lerpK(0.6, 0.95, u));
        this.cam(g, p.x - 26 * Math.cos(Math.PI * u), torso.y - 2, Z(lerpK(2.0, 1.12, smoothK(u))), raw, 9);
        this.crackK += (1 - this.crackK) * (1 - Math.exp(-6 * raw));
        this.craterK += (1 - this.craterK) * (1 - Math.exp(-6 * raw));
      }
    }
    if (c.pt >= dur) {
      c.i++; c.pt = 0;
      if (c.i >= PH_DUR.length) { this.finishCine(g, false); return; }
      c.snap = c.i === 2;
    }
  }

  private burstFx(g: G) {
    const p = g.player;
    this.tickTo(g, MAXG);
    g.flash?.('#ffffff', 0.85); g.shake?.(1.1); g.zoomKick = Math.max(g.zoomKick ?? 0, 0.12);
    g.hitstop = Math.max(g.hitstop ?? 0, 0.12);
    g.sfx?.explosion?.(); g.sfx?.slam?.(); g.sfx?.announce?.();
    g.say?.('HAAAAAH!!', PAL.light, 3, 0.9);
    for (let i = 0; i < 4; i++) this.pulses.push({ x: p.x, y: p.y, t: -i * 0.07, max: 0.8, r: 46 + i * 14 });
    g.particles?.shockwave?.(p.x, p.y - 4, 84, C_MID, 0.6);
    g.particles?.shockwave?.(p.x, p.y - 4, 54, '#ffffff', 0.4);
    g.particles?.ring?.(p.x, p.y - 8, 3, 38, '#ffffff', 0.35, 2);
    g.particles?.burst?.(p.x, p.y - 2, 46, '#8a7a5a', 330, 0.9, 2, 3);     // pecahan tanah
    g.particles?.burst?.(p.x, p.y - 6, 30, C_MID, 300, 0.7, 2, 3);          // percikan chakra
    for (let i = 0; i < 36; i++) {                                           // ledakan debu melingkar
      const a = (i / 36) * TAU + rnd(-0.08, 0.08), sp = rnd(90, 150);
      g.particles?.add?.({ x: p.x + Math.cos(a) * 5, y: p.y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.3 - rnd(2, 14), life: rnd(0.5, 0.9), c: i % 3 ? '#a39b8a' : '#7d756a', k: 0, s: 2 });
    }
    for (const e of g.enemies) {                                             // musuh terdekat terhempas
      if (e.dead || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 80) continue;
      g.damageEnemy?.(e, 3 * this.dmgMul, 30, Math.atan2(e.y - p.y, e.x - p.x), 620, { melee: false, knockdown: true, hitstop: 0.04, shake: 0.2, launch: 70 });
    }
  }

  private finishCine(g: G, skipped: boolean) {
    const p = g.player;
    this.cine = null;
    this.gates = MAXG; this.glow = 1;
    this.crackK = 1; this.craterK = 1;
    g.cinematic = false; g.camFocus = null; g.zoomTarget = BASE_ZOOM;
    p.holdT = 0; p.holdPose = 'idle'; p.holdPoseT = 0;
    p.iframes = Math.max(p.iframes ?? 0, 0.5);
    g.slowT = 0;
    if (skipped) { g.flash?.(C_OUT, 0.35); g.shake?.(0.5); g.sfx?.slam?.(); }
    g.say?.(`GERBANG 6: ${NAMES[MAXG - 1]}`, PAL.light, 2, 1.1);
    g.say?.('GAYA DRUNKEN MASTER AKTIF - KLIK KANAN: LOTUS', '#ffffff', 1, 2.2);
  }
  private skipCine(g: G) {
    const p = g.player;
    this.cx0 = p.x; this.cy0 = p.y;
    this.tickTo(g, MAXG);
    this.finishCine(g, true);
  }
  private abortCine(g: G) {
    const p = g.player;
    this.cine = null; this.on = false; this.gates = 0;
    g.cinematic = false; g.camFocus = null; g.zoomTarget = BASE_ZOOM;
    p.holdT = 0;
  }

  private makeCracks(): Seg[] {
    const out: Seg[] = [];
    const B = 8;
    for (let b = 0; b < B; b++) {
      const a0 = (b / B) * TAU + rnd(-0.25, 0.25);
      let x = 0, y = 0, len = rnd(5, 8);
      for (let k = 0; k < 4; k++) {
        const a = a0 + rnd(-0.45, 0.45);
        const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len * 0.42;
        out.push({ x0: x, y0: y, x1: nx, y1: ny });
        if (k >= 1 && Math.random() < 0.6) {
          const ba = a + (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 0.9);
          out.push({ x0: nx, y0: ny, x1: nx + Math.cos(ba) * len * 0.7, y1: ny + Math.sin(ba) * len * 0.7 * 0.42 });
        }
        x = nx; y = ny; len *= rnd(0.85, 1.15);
      }
    }
    out.sort((m, n) => Math.hypot(m.x0, m.y0) - Math.hypot(n.x0, n.y0));   // retakan tumbuh dari tengah ke luar
    return out;
  }

  update(g: G, dt: number) {
    const raw = Math.min(g.rawDt || dt, 1 / 20);
    dt = Math.min(dt, 1 / 20);
    const vdt = this.cine ? raw : dt;                     // sinematik & efeknya berjalan di waktu nyata
    this.time += vdt;
    this.lotusCd = Math.max(0, this.lotusCd - dt);
    this.glow = Math.max(0, this.glow - vdt * 2.5);
    this.exhaust = Math.max(0, this.exhaust - dt);
    const dTarget = this.on && !this.cine && !this.lotus && this.gates >= MAXG ? 1 : 0;
    this.drunkK += (dTarget - this.drunkK) * Math.min(1, raw * 4);
    if (this.drunkK < 0.003 && dTarget === 0) this.drunkK = 0;
    if (!this.on && !this.lotus && this.craterFade > 0) this.craterFade = Math.max(0, this.craterFade - raw);
    for (let i = this.pulses.length - 1; i >= 0; i--) { this.pulses[i].t += vdt; if (this.pulses[i].t >= this.pulses[i].max) this.pulses.splice(i, 1); }
    for (let i = this.bolts.length - 1; i >= 0; i--) { this.bolts[i].t += vdt; if (this.bolts[i].t > 0.1) this.bolts.splice(i, 1); }
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.t += vdt; f.x += f.vx * vdt; f.y += f.vy * vdt; f.vx *= 1 - 1.8 * vdt; f.vy *= 1 - 0.35 * vdt;
      if (f.t >= f.max) this.flames.splice(i, 1);
    }
    if (this.flames.length > 120) this.flames.splice(0, this.flames.length - 120);
    if (g.state !== 'playing') { if (this.cine) this.abortCine(g); return; }
    if (this.cine) { this.stepCine(g, raw); return; }
    if (!this.on) { if (!this.lotus) this.energy = Math.min(100, this.energy + dt * (this.exhaust > 0 ? 2 : 6)); return; }
    if (this.lotus) return;
    this.energy -= (1.5 + this.gates * 0.75) * dt;
    if (this.energy <= 0) { this.energy = 0; this.close(g, true); return; }
    // hentakan tekanan di tanah berkala
    this.pulseT -= dt;
    if (this.pulseT <= 0 && this.gates >= 3) {
      this.pulseT = 0.9 - this.gates * 0.06;
      this.pulses.push({ x: g.player.x, y: g.player.y, t: 0, max: 0.6, r: 14 + this.gates * 3.2 });
    }
  }

  // ------------------------------------------------------------------ gambar
  private eyes(opts: any, head: { x: number; y: number }) {
    const s = opts.scale ?? 1, la = opts.look ?? opts.aim, ldx = Math.cos(la), ldy = Math.sin(la);
    const gap = Math.max(1.8, 2 * s), cx = head.x + ldx * 0.5 * s, cy = head.y + ldy * 0.3 * s - 0.3;
    return [{ x: cx - gap, y: cy, ldx }, { x: cx + gap, y: cy, ldx }];
  }
  private skel(g: G, opts: any) {
    const p = g.player, sk = solvePose(opts);
    const ox = p.x, oy = p.y - p.z;
    const J = (v: { x: number; y: number }) => ({ x: ox + v.x, y: oy + v.y });
    return { hip: J(sk.hip), neck: J(sk.neck), head: J(sk.head), fh: J(sk.fhand), bh: J(sk.bhand), ff: J(sk.ffoot), bf: J(sk.bfoot) };
  }

  /** AURA API LEMBUT di BELAKANG tubuh: selubung bercahaya + gumpalan api yang naik pelan, bergoyang, dan memudar (tanpa garis tajam). */
  drawAura(ctx: Ctx, g: G, opts: any, dt: number) {
    this.drawCine(ctx, g);                                   // retakan/kawah & garis kecepatan (lapisan tanah)
    if (!this.on && this.glow <= 0 && !this.lotus) return;
    const p = g.player;
    const n = Math.min(MAXG, this.gates + (this.lotus ? 1 : 0));
    if (n <= 0) return;                                      // fase santai: belum ada aura
    const k = Math.min(1, n / MAXG);
    const { hip, neck, head, fh, bh, ff, bf } = this.skel(g, opts);
    const cx = (hip.x + neck.x) / 2, cy = (hip.y + neck.y) / 2;
    const t = this.time;
    const SP = sprites();
    const mvx = p.vx + p.kx * 0.3, mvy = p.vy + p.ky * 0.3, spd = Math.hypot(mvx, mvy);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    // --- pendar tanah (lembut)
    const gr = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 15 + k * 14);
    gr.addColorStop(0, `rgba(${PAL.ground},${0.24 + 0.14 * k})`); gr.addColorStop(1, `rgba(${PAL.ground},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 16 + k * 16, 5.5 + k * 5, 0, 0, Math.PI * 2); ctx.fill();
    // --- siluet aura (bergetar halus)
    const copies = n >= 5 ? 3 : n >= 3 ? 2 : 1;
    for (let i = 0; i < copies; i++) {
      const sc = (opts.scale ?? 1) * (1.06 + i * 0.09 + Math.sin(t * 11 + i) * 0.015);
      const jx = Math.sin(t * 23 + i * 2) * (0.2 + k * 0.35), jy = Math.cos(t * 19 + i * 3) * 0.2;
      const o2 = { ...opts, x: opts.x + jx, y: opts.y + jy - i * 0.5, scale: sc, c: i === 0 ? PAL.sil0 : PAL.sil1, c2: C_OUT, alpha: (0.34 - i * 0.09) * (0.8 + 0.2 * Math.sin(t * 7 + i)), outline: null, flash: false, strike: null, impact: 0, trail: null, acc: 'none', handOverride: undefined, bhandOverride: undefined };
      drawStick(ctx, o2);
    }
    // --- selubung api: gumpalan besar bergradasi di belakang tubuh, berdenyut pelan
    const pul = 0.85 + 0.15 * Math.sin(t * 6.5);
    const bw = (13 + k * 11) * pul, bh2 = (24 + k * 20) * (0.92 + 0.08 * Math.sin(t * 5 + 1));
    ctx.globalAlpha = 0.34 + 0.12 * k; ctx.drawImage(SP[0], cx - bw, cy - 8 - bh2 * 0.55, bw * 2, bh2 * 1.5);
    ctx.globalAlpha = 0.30 + 0.1 * k; ctx.drawImage(SP[1], cx - bw * 0.62, cy - 6 - bh2 * 0.5, bw * 1.24, bh2 * 1.2);
    // --- sumber gumpalan api (kaki -> tangan -> badan -> kepala makin banyak seiring gerbang)
    const src: { x: number; y: number; w: number }[] = [{ x: ff.x, y: ff.y - 1, w: 0.8 }, { x: bf.x, y: bf.y - 1, w: 0.8 }];
    if (n >= 2) src.push({ x: fh.x, y: fh.y, w: 0.9 }, { x: bh.x, y: bh.y, w: 0.9 });
    if (n >= 3) src.push({ x: hip.x, y: hip.y, w: 1.15 }, { x: neck.x, y: neck.y, w: 1.15 }, { x: cx, y: cy, w: 1.3 });
    if (n >= 4) src.push({ x: head.x, y: head.y - 1, w: 1.1 });
    const rate = (0.35 + n * 0.32) * Math.min(2, dt * 60);
    for (let i = 0, c = Math.floor(rate + Math.random()); i < c; i++) {
      const s0 = src[Math.floor(Math.random() * src.length)];
      this.flames.push({ x: s0.x + rnd(-1.4, 1.4), y: s0.y + rnd(-1.2, 1.2), vx: rnd(-6, 6) - mvx * 0.12, vy: -rnd(16, 30 + n * 4) - mvy * 0.05, t: 0, max: rnd(0.55, 0.85 + k * 0.3), r: rnd(1.9, 2.8 + k * 1.2) * s0.w, ph: Math.random() * 6.28, k: 0 });
    }
    // percikan bara halus
    if (Math.random() < 0.18 + k * 0.4) this.flames.push({ x: cx + rnd(-8, 8), y: cy + rnd(-12, 8), vx: rnd(-10, 10), vy: -rnd(22, 46), t: 0, max: rnd(0.5, 1.0), r: 0.7, ph: 0, k: 2 });
    // --- gambar gumpalan api: tiga lapis (biru luar, cyan tengah, putih inti), memanjang ke atas, lalu mengecil & memudar
    for (const f of this.flames) {
      const u = f.t / f.max;
      const life = Math.pow(Math.sin(Math.PI * Math.min(1, u)), 0.7);
      const sway = Math.sin(t * 5.5 + f.ph) * f.r * 0.55 * u;
      const x = f.x + sway, y = f.y;
      if (f.k === 2) { ctx.globalAlpha = life * 0.85; ctx.drawImage(SP[2], x - 1.2, y - 1.2, 2.4, 2.4); continue; }
      const sz = f.r * (1.15 - u * 0.5);
      ctx.globalAlpha = life * 0.34; ctx.drawImage(SP[0], x - sz * 1.4, y - sz * 2.5, sz * 2.8, sz * 3.8);
      ctx.globalAlpha = life * 0.42; ctx.drawImage(SP[1], x - sz * 0.9, y - sz * 1.7, sz * 1.8, sz * 2.6);
      ctx.globalAlpha = life * 0.50; ctx.drawImage(SP[2], x - sz * 0.45, y - sz * 0.9, sz * 0.9, sz * 1.4);
    }
    // --- pusaran api lembut (separuh belakang): gerbang 6 dan saat Lotus
    if (n >= 6 || this.lotus) this.vortex(ctx, cx, cy, t, true);
    ctx.globalAlpha = 1;
    ctx.restore();
    // --- cincin tekanan di tanah (halus)
    ctx.save();
    for (const q of this.pulses) {
      if (q.t < 0) continue;
      const u = q.t / q.max, rr = q.r * easeOut(u);
      ctx.globalAlpha = (1 - u) * 0.55;
      ctx.strokeStyle = C_MID; ctx.lineWidth = Math.max(1, 2.4 * (1 - u));
      ctx.beginPath(); ctx.ellipse(q.x, q.y, rr, rr * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // --- pusaran lotus
    if (this.lotus && this.lphase >= 2) {
      const u = this.lt;
      for (let i = 0; i < 3; i++) {
        const a0 = u * 14 + i * 2.1;
        crescent(ctx, cx, cy - 2, 17 + i * 5, a0, a0 + 2.3, 4 - i, i === 0 ? '#ffffff' : C_MID, 0.8 - i * 0.2, 0, i, 0.6);
      }
    }
    ctx.restore();
    // --- efek gerak: bayangan sisa & uap lembut
    if (n >= 4 && spd > 80 && Math.random() < 0.5) g.addAfterimage?.({ x: p.x, y: p.y - p.z, facing: opts.facing, aim: opts.aim, pose: opts.pose, poseT: opts.t }, PAL.after, p.lean);
    if (n >= 4 && Math.random() < 0.4) g.particles?.add?.({ x: cx + rnd(-5, 5), y: cy + rnd(-10, 6), vx: rnd(-8, 8), vy: -rnd(14, 32), life: rnd(0.5, 0.9), c: PAL.mist, k: 0, s: 1 });
    if (n >= 6) { this.shakeT -= dt; if (this.shakeT <= 0) { this.shakeT = 0.45; g.shake?.(0.05); } }
  }
  private shakeT = 0;

  /** pusaran gumpalan api yang mengitari tubuh; back = separuh di belakang badan */
  private vortex(ctx: Ctx, cx: number, cy: number, t: number, back: boolean) {
    const SP = sprites();
    for (let i = 0; i < 8; i++) {
      const a = t * 4.2 + i * (Math.PI / 4);
      const sn = Math.sin(a);
      if ((sn < 0) !== back) continue;
      const rise = ((t * 26 + i * 9) % 30);
      const x = cx + Math.cos(a) * 13, y = cy + 8 + sn * 5 - rise;
      const life = Math.sin(Math.PI * Math.min(1, rise / 30));
      const sz = 3.2 * (1 - rise / 60);
      ctx.globalAlpha = life * 0.34; ctx.drawImage(SP[0], x - sz * 1.4, y - sz * 2.4, sz * 2.8, sz * 3.6);
      ctx.globalAlpha = life * 0.42; ctx.drawImage(SP[1], x - sz * 0.8, y - sz * 1.5, sz * 1.6, sz * 2.4);
    }
    ctx.globalAlpha = 1;
  }

  /** bagian DEPAN: api lembut dari MATA, kilau di wajah, separuh pusaran depan. Dipanggil setelah drawStick pemain. */
  drawAuraFront(ctx: Ctx, g: G, opts: any) {
    if (!this.on && !this.lotus) return;
    this.drawCineFront(ctx, g, opts);                        // kepalan, garis X lengan, gigi/mulut
    const n = Math.min(MAXG, this.gates + (this.lotus ? 1 : 0));
    if (n <= 0) return;
    const { hip, neck, head } = this.skel(g, opts);
    const cx = (hip.x + neck.x) / 2, cy = (hip.y + neck.y) / 2;
    const t = this.time, SP = sprites();
    const p = g.player;
    const mvx = p.vx + p.kx * 0.3;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (n >= 6 || this.lotus) this.vortex(ctx, cx, cy, t, false);
    if (n >= 5) this.drawVeins(ctx, g, opts);   // urat menonjol di dahi, lengan, kaki (warna kulit tidak diubah)
    // --- MATA: cahaya lembut + api tipis yang mengalir ke belakang-atas
    if (n >= 2) {
      const eyes = this.eyes(opts, head);
      const fl = 0.8 + 0.2 * Math.sin(t * 20);
      const steps = n >= 5 ? 5 : n >= 3 ? 4 : 3;
      for (let ei = 0; ei < 2; ei++) {
        const e = eyes[ei];
        const ex = e.x, ey = e.y;
        ctx.globalAlpha = 0.7 * fl; ctx.drawImage(SP[1], ex - 3.8 - n * 0.3, ey - 3.8 - n * 0.3, 7.6 + n * 0.6, 7.6 + n * 0.6);
        for (let i = 1; i <= steps; i++) {
          const u = i / steps;
          const wob = Math.sin(t * 13 + ei * 2 + i * 1.1) * (0.6 + n * 0.18) * u;
          const x = ex - e.ldx * (1.5 + u * (3.5 + n * 1.1)) - mvx * 0.01 * u + wob, y = ey - u * (4 + n * 2.1) - 0.5;
          const sz = (2.1 + n * 0.2) * (1 - u * 0.65);
          ctx.globalAlpha = (1 - u * 0.75) * 0.42; ctx.drawImage(SP[0], x - sz * 1.2, y - sz * 1.9, sz * 2.4, sz * 3.2);
          ctx.globalAlpha = (1 - u * 0.75) * 0.5; ctx.drawImage(SP[1], x - sz * 0.7, y - sz * 1.2, sz * 1.4, sz * 2);
        }
        ctx.globalAlpha = 0.95; ctx.drawImage(SP[2], ex - 1.4, ey - 1.4, 2.8, 2.8);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ------------------------------------------------------------------ gambar sinematik
  /** lapisan tanah: kawah + retakan (tumbuh bertahap) dan garis kecepatan yang menyatu ke tubuh (fase 3-4) */
  private drawCine(ctx: Ctx, g: G) {
    const p = g.player;
    const fadeA = this.on || this.lotus ? 1 : clamp(this.craterFade, 0, 1);
    if (this.crackK > 0.001 && fadeA > 0) {
      ctx.save();
      if (this.craterK > 0.02) {
        const r = this.craterK;
        const gr = ctx.createRadialGradient(this.cx0, this.cy0, 1, this.cx0, this.cy0, 25 * r);
        gr.addColorStop(0, `rgba(20,14,10,${0.55 * fadeA})`); gr.addColorStop(0.7, `rgba(40,30,22,${0.35 * fadeA})`); gr.addColorStop(1, 'rgba(40,30,22,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(this.cx0, this.cy0 + 1, 26 * r, 8.5 * r, 0, 0, TAU); ctx.fill();
      }
      const vis = Math.ceil(clamp(this.crackK, 0, 1) * this.cracks.length);
      ctx.globalAlpha = fadeA;
      for (let i = 0; i < vis; i++) { const q = this.cracks[i]; pline(ctx, this.cx0 + q.x0, this.cy0 + q.y0, this.cx0 + q.x1, this.cy0 + q.y1, '#07070b', 1); }
      if (this.craterK > 0.5) {                                    // chakra merembes dari retakan
        ctx.globalAlpha = 0.5 * fadeA * (0.7 + 0.3 * Math.sin(this.time * 6));
        for (let i = 0; i < vis; i++) { const q = this.cracks[i]; pline(ctx, this.cx0 + q.x0, this.cy0 + q.y0 - 1, this.cx0 + q.x1, this.cy0 + q.y1 - 1, C_OUT, 1); }
      }
      ctx.restore();
    }
    const c = this.cine;
    if (c && (c.i === 2 || (c.i === 3 && c.pt < PH_DUR[3] * 0.62))) {
      const k = c.i === 2 ? 0.5 + 0.5 * (c.pt / PH_DUR[2]) : 1;
      const N = Math.round(14 + 12 * k), px = p.x, py = p.y - (p.z ?? 0) - 6;
      ctx.save();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU + Math.sin(i * 12.9) * 0.2;
        const ph = (this.time * (1.6 + 0.6 * k) + i * 0.6180339) % 1;
        const r1 = 46 - ph * 38, r0 = r1 + 7 + 5 * k;
        ctx.globalAlpha = Math.min(1, ph * 2.2) * (1 - ph * 0.3) * 0.9;
        pline(ctx, px + Math.cos(a) * r0, py + Math.sin(a) * r0 * 0.78, px + Math.cos(a) * r1, py + Math.sin(a) * r1 * 0.78, i % 3 === 0 ? '#ffffff' : C_MID, 1);
      }
      ctx.restore();
    }
    if (c && c.i >= 4) {                                          // garis ledakan radial keluar dari tubuh (fase 5-6)
      const kk = c.i === 4 ? 1 : 0.55, N = 22, px = p.x, py = p.y - (p.z ?? 0) - 6;
      ctx.save();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU + Math.sin(i * 7.7) * 0.15;
        const ph = (this.time * 2.2 + i * 0.6180339) % 1;
        const r0 = 10 + ph * 44, r1 = r0 + 6 + ph * 9;
        ctx.globalAlpha = (1 - ph) * 0.8 * kk;
        pline(ctx, px + Math.cos(a) * r0, py + Math.sin(a) * r0 * 0.8, px + Math.cos(a) * r1, py + Math.sin(a) * r1 * 0.8, i % 3 === 0 ? PAL.light : C_MID, 1);
      }
      ctx.restore();
    }
  }

  /** bagian depan: kepalan mengerat, garis X lengan (fase 4), gigi terkatup / mulut berteriak */
  private drawCineFront(ctx: Ctx, g: G, opts: any) {
    const pose: string = opts.pose;
    if (typeof pose !== 'string' || !pose.startsWith('g_')) return;
    const { head, fh, bh } = this.skel(g, opts);
    const f = opts.facing || 1, dark = '#0a0a10', body = opts.c || '#ffffff', tt = opts.t ?? 0;
    const fist = (x: number, y: number) => { pcircle(ctx, x, y, 1.95, dark); pcircle(ctx, x, y, 1.4, body); };
    ctx.save();
    if (pose === 'g_cross') {
      const cx = (fh.x + bh.x) / 2, cy = (fh.y + bh.y) / 2;
      const A: [number, number, number, number] = [cx - 2.5 * f, cy + 2.0, cx + 2.5 * f, cy - 2.0], B: [number, number, number, number] = [cx - 2.5 * f, cy - 2.0, cx + 2.5 * f, cy + 2.0];
      for (const l of [A, B]) pline(ctx, l[0], l[1], l[2], l[3], dark, 4);
      for (const l of [A, B]) pline(ctx, l[0], l[1], l[2], l[3], body, 2);
      fist(A[2], A[3]); fist(B[2], B[3]);
    } else if (pose !== 'g_relax' && !(pose === 'g_focus' && tt < 0.45)) {
      fist(fh.x, fh.y); fist(bh.x, bh.y);
    }
    // gigi terkatup (fase 3, 4, 6) / mulut terbuka berteriak (fase 5)
    const mx = head.x + f * 0.9, my = head.y + 1.3;
    if (pose === 'g_burst' && tt < 0.35) pcircle(ctx, mx, my + 0.4, 1.7, dark);                 // teriak saat meledak
    else if (pose === 'g_burst' || pose === 'g_stance') {                                        // seringai gigi terkatup lebar (referensi)
      prect(ctx, Math.round(mx - 2.5), Math.round(my), 5, 2, dark); prect(ctx, Math.round(mx - 2), Math.round(my), 4, 1, '#ffffff'); prect(ctx, Math.round(mx), Math.round(my), 1, 1, dark);
    } else if (pose === 'g_tense' || pose === 'g_cross') { prect(ctx, Math.round(mx - 2), Math.round(my), 4, 2, dark); prect(ctx, Math.round(mx - 1), Math.round(my), 2, 1, '#ffffff'); }
    ctx.restore();
  }

  /** urat menonjol: dahi + lengan + kaki (semua tema; warna kulit tetap) */
  private drawVeins(ctx: Ctx, g: G, opts: any) {
    const { neck, head, hip, fh, bh, ff, bf } = this.skel(g, opts);
    const col = '#a3182a';
    const tick = (a: { x: number; y: number }, b: { x: number; y: number }, kk: number) => {
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const x = a.x + dx * kk, y = a.y + dy * kk;
      pline(ctx, x - nx * 1.0, y - ny * 1.0, x + nx * 1.0 + (dx / l) * 0.8, y + ny * 1.0 + (dy / l) * 0.8, col, 1);
    };
    ctx.save();
    for (const h of [fh, bh]) for (const kk of [0.3, 0.5, 0.7]) tick(neck, h, kk);
    for (const ft of [ff, bf]) for (const kk of [0.4, 0.65]) tick(hip, ft, kk);
    const hx = head.x, hy = head.y;
    for (const sg of [-1, 1]) { pline(ctx, hx + sg * 2.2, hy - 1.8, hx + sg * 1.0, hy - 0.6, col, 1); pline(ctx, hx + sg * 1.0, hy - 0.6, hx + sg * 1.6, hy + 0.4, col, 1); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ HUD
  drawHud(ctx: Ctx, g: G, VIEW_W: number, VIEW_H: number) {
    if (!this.on && this.energy >= 99.5 && this.exhaust <= 0) return;
    if (g.state !== 'playing' && g.state !== 'paused') return;
    const x = Math.round(VIEW_W / 2 - 40), y = VIEW_H - 22, w = 80;
    prect(ctx, x - 3, y - 12, w + 6, 24, 'rgba(4,8,18,0.7)');
    prect(ctx, x - 3, y - 12, w + 6, 1, 'rgba(255,255,255,0.28)');
    prect(ctx, x - 3, y + 11, w + 6, 1, 'rgba(0,0,0,0.85)');
    prect(ctx, x - 3, y - 12, 2, 24, this.on ? C_MID : '#44546a');
    for (let i = 0; i < MAXG; i++) {
      const open = i < this.gates;
      const bx = x + i * 13;
      prect(ctx, bx, y - 9, 11, 7, open ? C_DEEP : '#141c2c');
      if (open) { prect(ctx, bx + 1, y - 8, 9, 5, i >= 4 ? PAL.light : C_MID); prect(ctx, bx + 1, y - 8, 9, 1, '#ffffff'); }
    }
    prect(ctx, x, y + 2, w, 4, '#0d1422');
    const col = this.exhaust > 0 ? '#7a7a8a' : this.energy < 25 ? '#ff5a5a' : C_MID;
    prect(ctx, x, y + 2, Math.round(w * this.energy / 100), 4, col);
    prect(ctx, x, y + 2, Math.round(w * this.energy / 100), 1, 'rgba(255,255,255,0.5)');
    pfontO(ctx, this.exhaust > 0 ? 'KELELAHAN' : this.cine ? `GERBANG ${this.gates}/6  [N] LEWATI` : this.on ? `GERBANG ${this.gates}/6  [N] TUTUP` : 'PEMULIHAN', VIEW_W / 2, y + 8, this.exhaust > 0 ? '#9fb0c8' : PAL.light, '#000', 1, 'center');
  }

  /** petunjuk Lotus di atas musuh terdekat */
  drawHint(ctx: Ctx, g: G) {
    const p = g.player;
    if (!this.on || this.gates < 3 || this.lotus || this.cine || p.fatality || g.state !== 'playing') return;
    const e = this.pickTarget(g);
    if (!e) return;
    const pulse = 0.55 + 0.45 * Math.sin(this.time * 9);
    ctx.globalAlpha = 0.5 + 0.5 * pulse;
    pcircle(ctx, e.x, e.y - 40 * (e.scale ?? 1) - (e.z ?? 0), 1.6, C_MID);
    ctx.globalAlpha = 1;
    pfontO(ctx, this.lotusCd > 0 ? `LOTUS ${this.lotusCd.toFixed(1)}S` : p.weapon === 'fist' ? 'KLIK KANAN: LOTUS' : 'LOTUS: TANGAN KOSONG', e.x, e.y - 50 * (e.scale ?? 1) - (e.z ?? 0), this.lotusCd > 0 ? '#7fa8d8' : PAL.light, '#000', 1, 'center');
  }

  // ------------------------------------------------------------------ LOTUS TERSEMBUNYI
  private pickTarget(g: G): E | null {
    const p = g.player;
    let best: E | null = null, bd = 1e9;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0 || e.z > 1 || e.jack) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 105) continue;
      const ang = Math.atan2(e.y - p.y, e.x - p.x);
      const a = Math.abs(Math.atan2(Math.sin(ang - p.aim), Math.cos(ang - p.aim)));
      const s = d + a * 22;
      if (s < bd) { bd = s; best = e; }
    }
    return best;
  }

  tryLotus(g: G): boolean {
    const p = g.player;
    if (!this.on || this.gates < 3 || this.cine || p.weapon !== 'fist' || this.lotus || p.fatality || p.stunT > 0 || g.state !== 'playing') return false;
    if (this.lotusCd > 0 || this.energy < 14) return false;
    const e = this.pickTarget(g);
    if (!e) return false;
    this.energy = Math.max(1, this.energy - 14);
    this.lotusCd = 6;
    this.lotus = true; this.lt = 0; this.lphase = 0;
    this.ldir = Math.atan2(e.y - p.y, e.x - p.x);
    this.lx = p.x; this.ly = p.y;
    const F = { kind: 'lotus', id: e.id, t: 0, step: 0, stepT: 0, sx: p.x, sy: p.y, tx: e.x, ty: e.y, dir: this.ldir, hit: false, hitT: 0, perfect: false };
    p.fatality = F;
    p.attackPhase = 'none'; p.buffered = null; p.dashT = 0; p.parryT = 0; p.focusDash = null; p.z = 0; p.runT = 0; p.running = false;
    p.aim = this.ldir; p.attackAim = this.ldir; p.facing = Math.cos(this.ldir) >= 0 ? 1 : -1; p.vx = p.vy = p.kx = p.ky = 0; p.moving = false;
    p.holdPose = 'flying'; p.holdPoseT = 0.2; p.iframes = 8;
    e.stagger = 10; e.state = 'stagger'; e.pose = 'stagger'; e.kx = e.ky = 0; e.vx = e.vy = 0; e.stun = 0; e.fuse = -1; g.releaseToken?.(e);
    for (const o of g.enemies) if (o !== e && !o.dead) o.attackCd = Math.max(o.attackCd, 1.6);
    g.cinematic = true; g.zoomTarget = 1.5 * 1.4;
    g.say?.('LOTUS TERSEMBUNYI!', '#ffffff', 3, 1.4);
    g.sfx?.announce?.(); g.sfx?.dash?.(); g.sfx?.whoosh?.();
    g.flash?.(C_MID, 0.25);
    return true;
  }

  /** dipanggil dari updateFatality saat kind === 'lotus' */
  step(g: G, raw: number, F: any, e: E | null) {
    const p = g.player;
    F.t += raw; this.lt = F.t;
    g.slowT = Math.max(g.slowT ?? 0, 0.2);
    g.slowFactor = this.lphase >= 2 ? 0.34 : 0.5;
    p.iframes = Math.max(p.iframes, 3);
    if (!e || e.dead) { this.endLotus(g); return; }
    const dir = this.ldir, cd = Math.cos(dir), sd = Math.sin(dir);
    const t = F.t;
    const keep = () => { e.kx = e.ky = 0; e.vx = e.vy = 0; e.stagger = 10; e.stun = 0; e.state = 'stagger'; };
    const ez = (z: number) => { e.z = Math.max(0.1, z); e.vz = 0; e.pose = 'launched'; e.rot = Math.sin(t * 16) * 0.25; };
    if (this.lphase === 0) {
      // ---- menerjang
      const u = clamp(t / 0.2, 0, 1);
      const gap = e.r + p.r + 3;
      const tx = e.x - cd * gap, ty = e.y - sd * gap;
      const nx = this.lx + (tx - this.lx) * easeOut(u), ny = this.ly + (ty - this.ly) * easeOut(u);
      if (g.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; }
      p.holdPose = 'flying'; p.holdPoseT = 0.5;
      keep();
      g.addAfterimage?.({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'flying', poseT: 0.5 }, C_MID, p.lean);
      g.particles?.lines?.(p.x - cd * 6, p.y - 6, 2, PAL.light, dir + Math.PI, 240);
      g.camFocus = { x: (p.x + e.x) / 2, y: (p.y + e.y) / 2 };
      if (t >= 0.2) {
        this.lphase = 1; F.t = 0;
        g.hitstop = Math.max(g.hitstop ?? 0, 0.07); g.shake?.(0.5);
        g.sfx?.heavy?.(); g.sfx?.punch?.();
        g.particles?.impact?.(e.x, e.y - 8, 10, '#ffffff'); g.particles?.shockwave?.(e.x, e.y - 6, 26, C_MID, 0.3);
      }
      return;
    }
    if (this.lphase === 1) {
      // ---- tendangan naik: musuh terlontar ke atas, pemain menyusul
      const u = clamp(t / 0.32, 0, 1);
      const z = 58 * easeOut(u);
      ez(z); keep();
      p.z = z * 0.85; p.holdPose = 'monkeyflip'; p.holdPoseT = 0.2 + 0.4 * u;
      g.camFocus = { x: p.x, y: p.y - z * 0.45 };
      g.zoomTarget = (1.5 + 0.35 * u) * 1.4;
      if (Math.random() < 0.8) g.particles?.add?.({ x: p.x + rnd(-4, 4), y: p.y - p.z * 0.5 - 4, vx: rnd(-18, 18), vy: rnd(10, 40), life: 0.3, c: C_MID, k: 0, s: 1 });
      if (t >= 0.32) { this.lphase = 2; F.t = 0; g.sfx?.axeSwing?.(); g.sfx?.launch?.(); }
      return;
    }
    if (this.lphase === 2) {
      // ---- berputar bersama di udara
      const u = clamp(t / 0.6, 0, 1);
      const z = 58 + 8 * Math.sin(u * Math.PI);
      ez(z); keep();
      e.rot = u * Math.PI * 6 * (cd >= 0 ? 1 : -1);
      p.z = z * 0.85 + 1; p.holdPose = 'spin'; p.holdPoseT = 0.5 * u;
      const cxx = p.x, cyy = p.y - p.z - 6;
      if (Math.random() < 0.9) g.particles?.add?.({ x: cxx + rnd(-14, 14), y: cyy + rnd(-10, 10), vx: rnd(-40, 40), vy: rnd(-40, 40), life: 0.28, c: Math.random() < 0.5 ? C_MID : '#ffffff', k: 0, s: 1 });
      g.camFocus = { x: p.x, y: p.y - z * 0.5 };
      g.zoomTarget = 2.2 * 1.4;
      if (t >= 0.6) { this.lphase = 3; F.t = 0; g.sfx?.whoosh?.(); }
      return;
    }
    if (this.lphase === 3) {
      // ---- bantingan: jatuh cepat ke tanah
      const u = clamp(t / 0.18, 0, 1);
      const z = 62 * (1 - u * u);
      ez(z); keep();
      e.rot = (1 - u) * 1.2;
      p.z = z * 0.85; p.holdPose = 'kneedrop'; p.holdPoseT = 0.2 + 0.4 * u;
      g.addAfterimage?.({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'kneedrop', poseT: 0.5 }, C_MID, p.lean);
      g.particles?.lines?.(p.x, p.y - p.z - 8, 2, '#ffffff', -Math.PI / 2, 260);
      if (t >= 0.18) {
        this.lphase = 4; F.t = 0;
        p.z = 0; e.z = 0; e.vz = 0; e.rot = 0;
        this.impact(g, e, cd, sd);
      }
      return;
    }
    // ---- akibat
    g.slowFactor = 0.45;
    p.z = 0; p.holdPose = 'flex'; p.holdPoseT = 0;
    g.camFocus = { x: p.x, y: p.y - 4 };
    g.zoomTarget = 1.7 * 1.4;
    if (t >= 0.6) this.endLotus(g);
  }

  private impact(g: G, e: E, cd: number, sd: number) {
    const p = g.player;
    const hard = e.boss || e.kind === 'duelist' || e.ai2 || e.sm || e.jack || e.tb;
    g.hitstop = Math.max(g.hitstop ?? 0, 0.16); g.flash?.('#ffffff', 0.7); g.shake?.(1); g.zoomKick = 0.14;
    g.sfx?.explosion?.(); g.sfx?.slam?.(); g.sfx?.fatality?.(); g.sfx?.kill?.();
    g.particles?.shockwave?.(e.x, e.y, 70, '#ffffff', 0.5);
    g.particles?.shockwave?.(e.x, e.y, 46, C_MID, 0.4);
    g.particles?.ring?.(e.x, e.y - 2, 3, 40, C_MID, 0.4, 2);
    g.particles?.burst?.(e.x, e.y - 3, 38, '#8a7a5a', 300, 0.8, 2, 3);
    g.particles?.burst?.(e.x, e.y - 3, 24, C_MID, 260, 0.6, 2, 3);
    g.particles?.smoke?.(e.x, e.y, 12, '#9a9a9a', 70, 0.8);
    g.splat?.(e.x, e.y, 14);
    for (let i = 0; i < 4; i++) this.pulses.push({ x: e.x, y: e.y, t: -i * 0.06, max: 0.7, r: 44 + i * 10 });
    // musuh di sekitar ikut terhempas
    for (const o of g.enemies) {
      if (o === e || o.dead || o.spawnT > 0) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d > 56) continue;
      const a = Math.atan2(o.y - e.y, o.x - e.x);
      g.damageEnemy?.(o, 6 * this.dmgMul, 30, a, 520, { melee: false, knockdown: true, hitstop: 0.03, shake: 0.2, launch: 90 });
    }
    p.focus = Math.min(300, p.focus + 50 * (g.stats?.focusGain ?? 1));
    g.addOfa?.(10);
    if (hard) {
      e.stagger = 0; e.structure = 0; e.down = 0;
      const dmg = e.maxHp * 0.3 * (g.ageDmg?.() ?? 1);
      g.damageEnemy?.(e, dmg, 0, Math.atan2(sd, cd), 480, { melee: false, knockdown: true, hitstop: 0.1, shake: 0.9, launch: 40 });
      g.texts?.add?.(e.x, e.y - 30, 'LOTUS: -30%', PAL.light, 2, 1.2);
    } else {
      e.stagger = 0; e.down = 0;
      g.score += 250;
      g.killEnemy?.(e, Math.atan2(sd, cd), 960, false, true, true);
      g.texts?.add?.(e.x, e.y - 30, 'LOTUS TERSEMBUNYI!', PAL.light, 2, 1.2);
    }
    p.iframes = Math.max(p.iframes, 2);
  }

  private endLotus(g: G) {
    this.lotus = false; this.lphase = 0;
    g.player.z = 0;
    g.endFatality?.();
  }
}
