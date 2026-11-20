import { pcircle, pline, prect, px, type Ctx, pellipse } from './pixel';
import { drawBat } from './weapons';
import { drawPistol, drawRifle } from './guns';
import { draw3DStick, draw3DWeapon, isDepthMode } from './stick3d';
import { clamp, lerp } from './rng';
import { isFootPose, solveFootPose } from './footPoses';
import { isScythePose, solveScythePose } from './scythePoses';
import type { Pose, Vec } from './types';

export interface StickOpts {
  footLead?: 1 | -1;
  footSwitch?: boolean;
  footLink?: { pose: Pose; t: number; facing: number; aim: number; footLead?: 1 | -1; footSwitch?: boolean; weight: number };
  clinch?: { x: number; y: number; w: number; rise: number; receiver: boolean };
  x: number; y: number; c: string; c2: string; scale: number; facing: number; aim: number;
  walk: number; moving: boolean; pose: Pose; t: number; acc: string; weapon: string;
  flash: boolean; alpha: number; outline: string | null; eyes: string; time: number; lean: Vec;
  rot?: number; recoil?: number; trail?: string | null; z?: number; run?: number; squash?: number;
  /** juicy squash & stretch (game1 feel): scale the whole skeleton around the feet. 1 = neutral. */
  sqx?: number; sqy?: number;
  blink?: boolean; mood?: 'normal' | 'angry' | 'hurt' | 'happy' | 'dead' | 'closed';
  /** chain punch: which fist is out this link (+1 front, -1 back) */
  chainSide?: number;
  /** limb that is striking this frame: drawn thicker/brighter so the impact reads */
  strike?: 'fhand' | 'bhand' | 'ffoot' | 'bfoot' | 'both' | null;
  /** 0..1 impact emphasis */
  impact?: number;
  /** actual movement direction in screen space (unit vector). Drives the gait; defaults to `lean`. */
  vel?: Vec;
  /** half step length in px (how far a foot lands ahead of the hip). From the game's cadence model. */
  stride?: number;
  /** where the eyes look (defaults to aim) */
  look?: number;
  /** V2 nunchaku: weld the front palm to this WORLD point (the chain grip); the elbow re-solves by IK */
  handOverride?: Vec;
  /** guan dao: tangan belakang menempel ke titik dunia ini */
  bhandOverride?: Vec;
  /** V2 anime legs: ready-bounce idle (knee spring, weight shift, mini-hop shuffle) */
  anime?: boolean;
  /** V2 anime brake: 0..1 skid pose progress (wide braced stance, low hip, lean back) */
  brake?: number;
  /** per-entity phase seed so idle bounces don't sync across a crowd */
  seed?: number;
  /** LONG-LIMB mode: panjang badan/tangan/kaki dikali faktor ini (skala seragam dari telapak kaki). 1 = normal. */
  limbScale?: number;
  /** yoyo poses: which trick (index) / spin direction (+1/-1) the pose is performing */
  ysub?: number; ysign?: number;
  dancePhase?: number;
  /** takamura poses: blade angle (abs, world), extension 0..1 (how stretched the cut is) / charge 0..1 */
  tka?: number; tkp?: number;
  /** takamura: hop height in px (leaping slashes): the whole body lifts, legs tuck */
  tkh?: number;
  /** boxing: gaya aktif + ritme langkah/weave dari modul Boxing */
  box?: { stance: 'ali' | 'tyson' | 'ippo'; weaveX: number; weaveY: number; step: number; clock: number };
  /** kacamata hitam: 0 utuh, 1 retak, 2 sudah terlempar */
  shades?: number;
  /** 'white' = mata putih menyala tanpa pupil */
  eyeStyle?: string;
  /** 0..1 — seberapa liar anggota badan mengibas saat tubuh terlempar */
  flail?: number;
  /** reaksi kena pukul per zona (kepala / perut / bawah): k 0..1, (dx,dy) arah dorongan di layar */
  react?: { zone: 'head' | 'torso' | 'legs'; k: number; dx: number; dy: number; side: number; amp: number };
  /** 0..1 — ancang-ancang sebelum melangkah (merendah, memuat tenaga) */
  anticip?: number;
  /** 0..1 tangan penarik meraih panah dari tabung di punggung */
  bowNock?: number;
  /** 0..1 tarikan tali saat pose akrobatik busur */
  bowDraw?: number;
  /** pengali radius kepala untuk mode proporsi panjang */
  headScale?: number;
  /** putaran senjata api di tangan saat idle twirl */
  gunSpin?: number;
  /** 0..1 — pindah gigi jalan -> lari: merunduk condong ke depan sebelum melesat */
  surge?: number;
  /** 0..1: seberapa jauh transisi idle -> gerak (blend ~0.13 dtk, tanpa lompatan pose) */
  locoMix?: number;
  /** 0..1: POSTUR PETARUNG (fist & nunchaku): pinggang merendah & berputar, badan tak condong berlebihan, kepala sejajar tulang belakang */
  posture?: number;
  /** 0..1: mode DRUNKEN MASTER (Gerbang 6) — badan atas terhuyung tak beraturan, kepala terkulai, tangan lunglai */
  drunk?: number;
  /** 0..1: putar badan saat berbalik arah (windup singkat: badan menyempit & merendah, bukan flip instan) */
  turn?: number;
  /** inersia ikat kepala (spring state dari game): offset ekor dalam unit stickman */
  band?: Vec;
  /** 0..1 — putar balik arah: menancap, memutar bahu mendahului pinggul */
  pivot?: number;
  /** arah hadap balik saat pivot (unit, ruang layar) */
  pivotDir?: Vec;
  /** true when rendered in 2D side-scroller mode (office) so depth offsets never shift feet off floor Y */
  sideView?: boolean;
}

export interface Skeleton {
  hip: Vec; neck: Vec; head: Vec; ffoot: Vec; bfoot: Vec; fhand: Vec; bhand: Vec;
  fknee: Vec | null; bknee: Vec | null; felbow: Vec | null; belbow: Vec | null;
  trail: { cx: number; cy: number; rx: number; ry: number; from: number; to: number } | null;
}

let TALL_MODE = false;
export function setTallMode(v: boolean) { TALL_MODE = v; }
export function tallModeOn() { return TALL_MODE; }

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const cl01 = (t: number) => clamp(t, 0, 1);

/** Anticipation (pull back) -> snap out with overshoot -> settle -> recover. t in 0..1 */
/** Irama langkah yang menjamin telapak TIDAK meluncur.
 *  Selama satu kaki menapak, badan maju sejauh v·duty·T dan kaki menyapu 2·stride.
 *  Keduanya harus sama: dari situ kadens diturunkan, bukan ditebak. */
/** pengali kadens kaki */
export const GAIT_SLOW = 1.0;
/** pengali kadens langkah untuk petarung yang jaraknya dihitung nyata (pemain / sekutu) */
export const LEG_K = 1;
/** Duty factor: porsi siklus saat satu kaki menapak. Jalan 0.64 (ada fase dua kaki menapak), sprint 0.42 (ada fase melayang). */
export function gaitDuty(run: number) { return 0.64 - 0.22 * clamp(run, 0, 1); }
/** Kadens diturunkan dari kecepatan: makin cepat bergerak, makin cepat langkahnya DAN makin panjang langkahnya.
 *  Telapak tetap menempel di tanah karena fase maju sebanding jarak tempuh (LEG_K = 1: tanpa foot-sliding). */
export function gaitCadence(speed: number, run: number, scale = 1) {
  const r = clamp(run, 0, 1);
  const duty = gaitDuty(r);
  // Langkah dibatasi JANGKAUAN KAKI: 4.7 (jalan) -> 6.2 (sprint).
  // Kadens GESIT & PAS: 5.5 -> 7.6 langkah/detik sehingga animasi jalan & lari terasa hidup, sigap, dan nyaman dilihat.
  const cad = 5.5 + 2.1 * r;
  const lock = speed * duty / cad;                   // langkah yang membuat telapak 100% menempel pada kadens ini
  const reach = (4.7 + 1.5 * r) * scale;
  const stride = Math.max(2.4 * scale, Math.min(lock, reach));
  const phaseK = speed > 1 ? Math.min(1, cad * stride / (speed * duty)) : 1;
  const stepsPerSec = speed > 1 ? ((speed * duty) / stride) * phaseK * GAIT_SLOW : 0;
  return { duty, stride, stepsPerSec, phaseK };
}

export function strikeK(t: number) {
  // anticipation (0..0.28): tarik bahu/tangan memuat tenaga
  // snap (0.28..0.39): lecutan cepat & tajam ke ekstensi penuh
  // hold (0.39..0.60): tahan di titik kontak agar pukulan/tendangan tegas terbaca
  // recover (0.60..1.0): kembali mulus ke kuda-kuda guard
  if (t < 0.28) return -0.38 * easeInOut(t / 0.28);
  if (t < 0.39) return lerp(-0.38, 1.1, easeOut((t - 0.28) / 0.11));
  if (t < 0.60) return lerp(1.1, 1.0, easeInOut(cl01((t - 0.39) / 0.12)));
  return lerp(1, 0, easeInOut(cl01((t - 0.60) / 0.40)));
}

function parc(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, from: number, to: number, c: string, w = 1) {
  const n = Math.max(4, Math.ceil(Math.abs(to - from) * Math.max(rx, ry) * 1.2));
  ctx.fillStyle = c;
  let lx = 1e9, ly = 1e9;
  const o = w > 1 ? 1 : 0;
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
    if (x === lx && y === ly) continue;
    lx = x; ly = y;
    ctx.fillRect(x - o, y - o, w, w);
  }
}

function halfCircle(ctx: Ctx, cx: number, cy: number, r: number, c: string, top: boolean) {
  cx = Math.round(cx); cy = Math.round(cy);
  ctx.fillStyle = c;
  const rr = r * r + r * 0.6;
  const ri = Math.ceil(r);
  for (let dy = -ri; dy <= ri; dy++) {
    if (top ? dy > -1 : dy < 1) continue;
    const v = rr - dy * dy;
    if (v < 0) continue;
    const dx = Math.floor(Math.sqrt(v));
    ctx.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

const mix = (a: Vec, b: Vec, t: number): Vec => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const mixN = (a: Vec | null, b: Vec | null, t: number): Vec | null => (a && b ? mix(a, b, t) : t < 0.5 ? a : b);

export function blendSkeleton(a: Skeleton, b: Skeleton, t: number): Skeleton {
  return {
    hip: mix(a.hip, b.hip, t), neck: mix(a.neck, b.neck, t), head: mix(a.head, b.head, t), ffoot: mix(a.ffoot, b.ffoot, t), bfoot: mix(a.bfoot, b.bfoot, t),
    fhand: mix(a.fhand, b.fhand, t), bhand: mix(a.bhand, b.bhand, t), fknee: mixN(a.fknee, b.fknee, t), bknee: mixN(a.bknee, b.bknee, t),
    felbow: mixN(a.felbow, b.felbow, t), belbow: mixN(a.belbow, b.belbow, t), trail: t < 0.5 ? a.trail : b.trail,
  };
}

/** Two-bone IK. `bend` = sisi tekuk (+1/-1). Bila `dir` diberikan, lutut menekuk KE ARAH ITU
 *  (bukan sekadar kiri/kanan layar) dan besarnya tekukan memendek saat arah hadap sejajar
 *  dengan tulang kaki — itulah yang membuat kaki menghadap kamera tidak melengkung nyamping. */
function bendJoint(a: Vec, b: Vec, len: number, bend: number, upBias = 0, dir?: Vec | null): Vec | null {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return null;
  const half = len / 2;
  const h = Math.sqrt(Math.max(0, half * half - (d / 2) * (d / 2)));
  if (h < 0.7) return null;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const nx = -dy / d, ny = dx / d;
  let side = bend, mag = h;
  if (dir) {
    const dl = Math.hypot(dir.x, dir.y);
    if (dl > 1e-4) {
      const dot = (nx * dir.x + ny * dir.y) / dl;
      side = dot >= 0 ? 1 : -1;
      mag = h * (0.2 + 0.8 * Math.abs(dot));
    }
  }
  return { x: mx + nx * mag * side, y: my + ny * mag * side - upBias };
}

const POSTURE_POSES = new Set<string>([
  'idle', 'jab', 'cross', 'punch', 'hook', 'elbow', 'uppercut', 'palm',
  'chainpunch', 'chainfinish', 'tigerclaw', 'mantis', 'parry',
  'k_ironpalm', 'k_hammerfist', 'runpunch', 'spinback',
  'bx_jab', 'bx_cross', 'bx_lhook', 'bx_rhook', 'bx_upper', 'bx_body',
  'bx_shovel', 'bx_over', 'bx_smash', 'bx_heart', 'bx_dempsey',
  'bx_ali', 'bx_peek', 'bx_ippo',
  'drunk_cup', 'drunk_sway', 'drunk_stumble', 'drunk_cannon',
  'roundhouse', 'kick', 'knee', 'cranekick',
  'a_idle', 'a_swing1', 'a_swing2', 'a_homerun', 'a_golf', 'a_bunt', 'a_overhead',
  'b_wild', 'b_wildback', 'b_smash', 'b_knob', 'b_upper', 'b_pound', 'b_taunt',
  'b_windmill', 'b_behind', 'b_buntspin', 'b_tosscatch', 'b_corkscrew', 'b_callshot',
]);
const NO_POSTURE_N = new Set<string>(['n_lowsweep', 'n_dragonlash', 'n_tornado']);
const postureOk = (pose: string) => POSTURE_POSES.has(pose) || (pose.startsWith('n_') && !NO_POSTURE_N.has(pose));

/** Solve a full-body pose into joint positions (relative to the feet origin). Pure function of the options. */
function solvePoseCore(o: StickOpts): Skeleton {
  const s = o.scale, f = o.facing, t = o.t;
  const sv = !!o.sideView;
  const dx = Math.cos(o.aim), dy = Math.sin(o.aim);
  const adx = dx >= 0 ? 1 : -1;
  const pxp = -dy, pyp = dx;
  const quick = Math.min(1, t * 3);
  const run = o.run ?? 0;
  const V = (x: number, y: number): Vec => ({ x, y });
  const add = (a: Vec, ...rest: Vec[]): Vec => { let x = a.x, y = a.y; for (const r of rest) { x += r.x; y += r.y; } return { x, y }; };
  const D = (len: number, up = 0): Vec => sv ? V(dx * len * s, dy * len * s * 0.72 - up * s) : V(dx * len * s, dy * len * s * 0.6 - up * s);
  const P = (len: number): Vec => sv ? V(pxp * len * s * 0.25, 0) : V(pxp * len * s, pyp * len * s * 0.6);
  const L = (len: number): Vec => sv ? V((Math.abs(o.lean.x) > 0.05 ? Math.sign(o.lean.x) : f) * len * s, 0) : V(o.lean.x * len * s, o.lean.y * len * s * 0.6);
  let hip = V(0, -4 * s), neck = V(0, -8 * s), head = V(0, -11 * s);
  let ffoot = V(2 * s * f, 0), bfoot = V(-2 * s * f, 0);
  let fhand = add(neck, D(3.5), V(0, 1.2 * s)), bhand = add(neck, D(-1.5), V(0, 2 * s));
  let trail: Skeleton['trail'] = null;
  let fkneeBend = f, bkneeBend = f;
  let kneeUp = 0;
  let fKneeUp: number | null = null;
  let bKneeUp: number | null = null;
  let loco = false;
  // hasil blok lari yang diteruskan ke pose senjata: tangan bebas berayun normal, tangan pemegang punya inersia
  let freeHand: Vec | null = null;
  let heldLag = 0;
  let kneeDir: Vec | null = null; // when set, knees bend toward this screen direction instead of the facing side
  const lean = (fw: number, up: number) => {
    const v = sv ? V(adx * fw * s, -up * s) : D(fw, up);
    neck = add(neck, v); head = add(head, V(v.x * 1.4, v.y * 1.2)); hip = add(hip, V(v.x * 0.3, v.y * 0.3));
  };
  const k = strikeK(t), kp = Math.max(0, k), kk = cl01((k + 0.4) / 1.4);
  const ch = Math.max(0, -k) / 0.4; // 0..1 wind-up (chamber) amount during the anticipation
  const bowDraw = cl01(o.bowDraw ?? 0);
  // --- fighting stance helpers ---------------------------------------------------------------
  // stance(w): feet in a staggered fighting stance along the aim (front foot ahead), weight shifted by w (-1 back .. +1 front)
  const stance = (w: number, width = 1) => {
    if (sv) {
      kneeDir = { x: adx, y: 0 };
      ffoot = V((2.3 * width + 1.0 * w) * adx * s, 0);
      bfoot = V((-2.2 * width + 1.0 * w) * adx * s, 0);
      const hsX = 0.9 * w * adx * s;
      hip = add(hip, V(hsX, 0)); neck = add(neck, V(hsX * 1.25, 0)); head = add(head, V(hsX * 1.4, 0));
      return;
    }
    kneeDir = { x: dx, y: dy * 0.6 };
    ffoot = add(D(2.2 * width + 1.2 * w), P(1.3 * f)); bfoot = add(D(-2.2 * width + 1.2 * w), P(-1.3 * f));
    const hs = D(0.9 * w); hip = add(hip, hs); neck = add(neck, V(hs.x * 1.3, hs.y * 1.3)); head = add(head, V(hs.x * 1.5, hs.y * 1.5));
  };
  // twist(r): rotate the shoulders around the hip axis (r>0 = front shoulder forward), what drives real punches
  let twAcc = 0;   // total putaran bahu pada pose ini -> pinggul berputar berlawanan (lihat POSTUR PETARUNG)
  const twist = (r: number) => { twAcc += r; neck = add(neck, D(0.7 * r), P(-0.9 * f * r)); head = add(head, D(0.9 * r), P(-0.6 * f * r)); };
  // guard: the non-striking hand protects the chin
  const guardHand = (): Vec => add(neck, D(1.2), V(0, 0.8 * s), P(-1.2 * f));
  void guardHand;
  const smooth = (v: number) => { const u = cl01(v); return u * u * (3 - 2 * u); };
  const danceEnvelope = smooth(t / 0.27) * smooth((1 - t) / 0.24);
  const bboyRig = (angle: number, weight: number, grounded = true) => {
    const cs = Math.cos(angle), sn = Math.sin(angle), kick = Math.sin(angle * 2);
    const R = (x: number, y: number): Vec => V((x * cs - y * sn) * f * s, (-5.2 + x * sn + y * cs) * s);
    const rig = {
      hip: R(0, 0), neck: R(0, -3.7), head: R(0, -6.7),
      ffoot: R(6.8 + 1.8 * kick, 3.4 - 1.8 * kick),
      bfoot: R(-6.8 + 1.8 * kick, 3.4 + 1.8 * kick),
      fhand: R(5.8, -2.1), bhand: R(-4.2, 2.4),
    };
    if (grounded) {
      const below = Math.max(0, rig.head.y + 2.8 * s, rig.ffoot.y, rig.bfoot.y, rig.fhand.y, rig.bhand.y);
      for (const point of Object.values(rig)) point.y -= below;
    }
    hip = mix(hip, rig.hip, weight); neck = mix(neck, rig.neck, weight); head = mix(head, rig.head, weight);
    ffoot = mix(ffoot, rig.ffoot, weight); bfoot = mix(bfoot, rig.bfoot, weight);
    fhand = mix(fhand, rig.fhand, weight); bhand = mix(bhand, rig.bhand, weight);
  };
  // chamber (0..1): pull a hand back to the hip/ribs before a strike
  const strikePhase = { anticip: cl01(t / 0.3), snap: cl01((t - 0.3) / 0.1), settle: cl01((t - 0.4) / 0.2), recover: cl01((t - 0.6) / 0.4) };
  void strikePhase;

  // ---------------- LOCOMOTION: jalan & lari sungguhan ----------------
  // Satu mesin langkah untuk semua tokoh. Kuncinya DUTY FACTOR: berapa bagian siklus
  // satu kaki menapak. Jalan 0.62 (ada fase kedua kaki menapak), lari 0.36 (ada fase
  // melayang). Selama menapak, offset kaki bergerak LINIER dari depan ke belakang
  // tepat secepat badan maju — inilah yang membuat telapak tidak meluncur di tanah.
  const locoPose = o.pose === 'idle' || o.pose === 'run' || o.pose === 'shoot' || o.pose === 'bow' || o.pose === 'charge' || o.pose === 'reload'
    || o.pose === 'carry_pot' || o.pose === 'carry_comp'
    || o.pose === 'n_idle' || o.pose === 'y2_idle' || o.pose === 'k_idle' || o.pose === 'a_idle' || o.pose === 'd_idle'
    || o.pose === 'bx_float' || o.pose === 'bx_weave' || o.pose === 'bx_press';
  if (o.moving && locoPose) {
    loco = true;
    const box = o.box;
    const bstance = box?.stance;
    const mv = o.vel && (Math.abs(o.vel.x) > 1e-3 || Math.abs(o.vel.y) > 1e-3) ? o.vel : o.lean;
    const ml = Math.hypot(mv.x, mv.y) || 1;
    const ux = sv ? (Math.abs(mv.x) > 0.05 ? Math.sign(mv.x) : f) : mv.x / ml;
    const uy = sv ? 0 : mv.y / ml;
    const sx = sv ? 0 : -uy, sy = sv ? 0 : ux;
    const fwd = (a: number): Vec => V(ux * a * s, uy * a * s);
    const side = (a: number): Vec => V(sx * a * s, sy * a * s);

    // gaya tinju tetap punya rasa sendiri di atas mesin langkah yang sama
    const runG = clamp(bstance === 'tyson' ? run * 0.72 : bstance === 'ali' ? Math.min(1, run * 1.15 + 0.12) : run, 0, 1);
    const duty = gaitDuty(runG);
    const stride = (o.stride ?? (2.6 + 2.6 * runG) * s) / s;
    const liftAmt = (sv ? 0.9 + 1.1 * runG : 0.8 + 0.95 * runG) * s;
    const TAU2 = Math.PI * 2;
    const smooth2 = (u: number) => u * u * (3 - 2 * u);

    // ================= KAKI: siklus 4 pose kunci =================
    //  Contact  : kaki depan menyentuh tanah, hampir lurus (jarak pinggul-telapak melebihi panjang tulang)
    //  Down     : badan turun menahan beban, lutut menyerap (menekuk)
    //  Passing  : kaki belakang melintas di bawah badan, lutut terlipat (tumit ke arah pantat)
    //  Up       : dorongan kaki, badan naik ke titik tertinggi, kaki depan memanjang bersiap menapak
    const leg = (phase: number) => {
      const ph = ((phase % TAU2) + TAU2) % TAU2 / TAU2;
      if (ph < duty) {
        // MENAPAK: linier supaya telapak DIAM di dunia (tidak meluncur). Di ujung fase tumit terangkat (toe-off).
        const u = ph / duty;
        const toeOff = runG * Math.pow(Math.max(0, (u - 0.72) / 0.28), 2) * 0.7 * s;
        return { along: stride * (1 - 2 * u), air: toeOff, stance: true, u };
      }
      // MENGAYUN: ease-in-out (melambat di ujung belakang & depan = momentum), cepat di tengah.
      // Tumit terangkat ke arah pantat LEBIH DULU (puncak di u~0.36), lalu lutut didorong maju & kaki memanjang.
      const u = (ph - duty) / (1 - duty);
      const e = smooth2(u) * (1 - runG * 0.18) + Math.pow(u, 0.75) * (runG * 0.18);
      const along = -stride + 2 * stride * e;
      const lift = Math.sin(Math.PI * Math.pow(u, 0.66));
      const heelKick = runG * Math.sin(Math.PI * Math.pow(u, 0.5)) * (sv ? 0.85 : 0.6);
      const carry = runG * 0.7 * s * Math.pow(1 - u, 2); // sambungan mulus dari toe-off
      return { along, air: lift * liftAmt + heelKick * s + carry, stance: false, u };
    };

    const fl = leg(o.walk), bl = leg(o.walk + Math.PI);
    const spread = bstance === 'tyson' ? 1.15 : 0.72;
    ffoot = add(fwd(fl.along), side(spread * f), V(0, -fl.air));
    bfoot = add(fwd(bl.along), side(-spread * f), V(0, -bl.air));
    kneeDir = { x: ux, y: uy };
    if (sv) {
      fkneeBend = ux >= 0 ? 1 : -1;
      bkneeBend = ux >= 0 ? 1 : -1;
      // lutut menekuk saat kaki terangkat, hampir lurus saat menapak
      const swingKnee = (l: { stance: boolean; u: number }) =>
        l.stance ? 0.12 * s : (1.1 + 2.3 * runG) * s * Math.sin(Math.PI * Math.pow(l.u, 0.66));
      fKneeUp = swingKnee(fl);
      bKneeUp = swingKnee(bl);
      kneeUp = Math.max(fKneeUp, bKneeUp);
    } else {
      kneeUp = (0.8 + 3.0 * runG) * s * Math.max(fl.stance ? 0 : 1 - fl.u, bl.stance ? 0 : 1 - bl.u);
    }

    // ================= BADAN: bobbing 4 pose kunci (spline periodik) =================
    // stepU 0 = Contact, 0.22 = Down (terendah), 0.5 = Passing, 0.78 = Up (tertinggi).
    // Jalan: tertinggi saat Passing. Lari: terendah saat Contact/Down, tertinggi saat Up (melayang).
    const stepU = (((o.walk / Math.PI) % 1) + 1) % 1;
    const kt = [0, 0.22, 0.5, 0.78];
    const kRun = [-0.18, -0.46, 0.02, 0.44], kWalk = [-0.34, -0.12, 0.38, 0.06];
    const kh = kRun.map((v, i) => kWalk[i] + (v - kWalk[i]) * runG);
    const tang = (j: number) => {
      const jp = (j + 1) % 4, jm = (j + 3) % 4;
      const tp = kt[jp] + (jp < j ? 1 : 0), tm = kt[jm] - (jm > j ? 1 : 0);
      return (kh[jp] - kh[jm]) / (tp - tm);
    };
    const bobAt = (u0: number) => {
      const u = ((u0 % 1) + 1) % 1;
      let i = 3;
      for (let j = 0; j < 3; j++) if (u < kt[j + 1]) { i = j; break; }
      const i1 = (i + 1) % 4;
      const t0 = kt[i], t1 = i === 3 ? 1 : kt[i1];
      const h = t1 - t0, x = (u - t0) / h, x2 = x * x, x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * kh[i] + (x3 - 2 * x2 + x) * tang(i) * h + (-2 * x3 + 3 * x2) * kh[i1] + (x3 - x2) * tang(i1) * h;
    };
    // skala dikalibrasi ke stickman 12px: rentang naik-turun ~4% tinggi (jalan) .. ~9% (sprint)
    const ampB = (0.6 + 0.55 * runG) * s;
    const hB = bobAt(stepU) * ampB;                  // badan
    const hH = bobAt(stepU + 0.94) * ampB;           // kepala: tertinggal sedikit di belakang badan
    const hHeld = bobAt(stepU + 0.9) * ampB;         // benda yang dipegang: inersia
    const crouch = bstance === 'tyson' ? 2.1 * s : bstance === 'ippo' ? 0.9 * s : 0;
    const sway = sv ? 0 : Math.sin(o.walk) * (0.5 + 0.7 * runG) * s;
    const grounded = (sv ? 0.3 : 0.6) * runG * s;
    const rise = (0.4 + 0.25 * runG) * s;             // badan sedikit lebih tegak daripada idle: lutut penopang tak jongkok
    hip = add(hip, V(0, -hB - rise + crouch + grounded), side(sway * 0.55));

    // condong ke depan 5° (jalan) .. 12° (sprint) — bukan miring ekstrem. Torso 4 unit: offset = 4·tan(sudut)
    const leanRel = (0.37 + 0.36 * runG) * s;
    const lv = fwd(leanRel / (0.58 * s));
    hip = add(hip, V(lv.x * 0.42, lv.y * 0.42 * 0.32));
    // TWIST: pinggul berputar searah kaki depan, bahu berlawanan (di sideView tampak sebagai geseran maju-mundur halus)
    const twK = (0.05 + 0.10 * runG) * s, twC = Math.cos(o.walk);
    hip = add(hip, fwd(twC * twK * 0.6));
    // torso kaku mengikuti pinggul; KEPALA STABIL: hanya ikut ±55% bobbing
    neck = add(neck, V(lv.x, lv.y * 0.32), V(0, -hB - rise + crouch * 0.85 + grounded), side(sway * 0.8), fwd(-twC * twK));
    const twistAmt = sv ? 0 : Math.sin(o.walk) * (0.25 + 0.5 * runG);
    neck = add(neck, side(-twistAmt * 0.62));
    head = add(head, V(lv.x * 1.34, lv.y * 1.34 * 0.32), V(0, -(hB * 0.35 + hH * 0.2) - rise + crouch * 0.7 + grounded), side(-twistAmt * 0.34 + sway * 0.9), fwd(-twC * twK * 0.5));

    // ================= LENGAN =================
    // Berlawanan dengan kaki sesisi. Posisi tangan dihitung dari 2 segmen (bahu->siku->pergelangan) dengan sudut tekuk
    // siku ~80-100° saat lari, sehingga siku TIDAK pernah terkunci lurus. Ayunan sinus = ease-in-out alami.
    const seg = 5.2 * 1.0 * 0.5 * s;
    const swingHand = (sgn: number) => {            // sgn +1 = tangan depan (lawan ffoot), -1 = tangan belakang
      const c = -sgn * Math.cos(o.walk);            // -1 ayun ke belakang .. +1 ayun ke depan
      const center = 0.10 + 0.14 * runG;
      const amp = (0.38 + 0.50 * runG) * (c < 0 ? 1.18 : 0.92);   // ayun belakang lebih lebar dari depan
      const alpha = center + amp * c;               // sudut lengan atas dari vertikal (rad, + = ke depan)
      const flex = 0.75 + 0.62 * runG + (0.10 + 0.34 * runG) * c; // siku ~90° saat maju, hampir terbuka saat ayun belakang
      const beta = alpha + flex;
      const wx = (Math.sin(alpha) + Math.sin(beta)) * seg, wy = (Math.cos(alpha) + Math.cos(beta)) * seg;
      return add(neck, fwd(wx / s), V(0, wy), side(sgn * (0.85 - 0.25 * runG) * f));
    };
    const oneHandHold = o.pose === 'shoot' || o.pose === 'reload' || o.pose === 'charge' || o.pose === 'n_idle' || o.pose === 'y2_idle' || o.pose === 'carry_pot';
    const twoHandHold = o.pose === 'bow' || o.pose === 'k_idle' || o.pose === 'a_idle' || o.pose === 'd_idle' || o.pose === 'carry_comp';
    if (!bstance) {
      if (!oneHandHold && !twoHandHold) {
        fhand = swingHand(1);
        bhand = swingHand(-1);
      } else {
        // ITEM DIPEGANG: tangan pemegang hampir diam, hanya tertinggal tipis dari bobbing badan (inersia);
        // tangan yang bebas berayun normal. Pose lari tetap terbaca jelas.
        const lag = (hB - hHeld) * 0.9;
        heldLag = lag;
        fhand = add(fhand, V(0, lag));
        if (twoHandHold) bhand = add(bhand, V(0, lag));
        else { bhand = swingHand(-1); freeHand = bhand; }
      }
    } else if (bstance) {
      // kuda-kuda tinju dipertahankan sambil kaki bekerja
      const bt = (box?.clock ?? o.time) * (bstance === 'tyson' ? 4.4 : bstance === 'ippo' ? 3.6 : 5.4);
      if (bstance === 'ali') {
        const sw = Math.sin(bt) * 0.45;
        fhand = add(neck, D(4.6), V(0, (3.0 + sw) * s), P(2.4 * f));
        bhand = add(neck, D(0.2), V(0, (3.4 - sw) * s), P(-2.4 * f));
      } else if (bstance === 'tyson') {
        fhand = add(head, D(1.9), V(0, 0.5 * s), P(2.7 * f));
        bhand = add(head, D(1.5), V(0, 0.8 * s), P(-2.7 * f));
      } else {
        fhand = add(head, D(2.6), V(0, 0.9 * s), P(2.5 * f));
        bhand = add(head, D(1.2), V(0, 1.3 * s), P(-2.5 * f));
      }
    }

    // ---- ANCIK: merendah & memuat tenaga SEBELUM kaki melangkah ----
    const ant = o.anticip ?? 0;
    if (ant > 0.01) {
      const pd = o.pivotDir ?? { x: ux, y: uy };
      const pl = Math.hypot(pd.x, pd.y) || 1;
      const ax = sv ? ux : pd.x / pl, ay = sv ? 0 : pd.y / pl;
      const coil = ant * ant;
      const mul = sv ? 0.5 : 1;
      hip.y += coil * 2.4 * mul * s; neck.y += coil * 2.0 * mul * s; head.y += coil * 1.7 * mul * s;
      hip = add(hip, V(-ax * coil * 1.2 * mul * s, -ay * coil * 0.9 * s));
      neck = add(neck, V(-ax * coil * 1.8 * mul * s, -ay * coil * 1.4 * s));
      head = add(head, V(-ax * coil * 1.5 * mul * s, -ay * coil * 1.2 * s));
      ffoot = add(fwd(1.8 + coil * 0.8), side(1.5 * f));
      bfoot = sv ? fwd(-2.0 - coil * 0.8) : add(fwd(-2.4 - coil * 1.6), side(-1.7 * f), V(0, -coil * 0.6 * s));
      fhand = add(neck, V(-ax * coil * 2.2 * mul * s, -ay * coil * 1.8 * s + 1.4 * s), side(1.3 * f));
      bhand = add(neck, V(-ax * coil * 2.6 * mul * s, -ay * coil * 2.1 * s + 1.7 * s), side(-1.5 * f));
      if (!sv) kneeUp = coil * 2.0 * s;
      kneeDir = { x: ax, y: ay };
    }

    // ---- PIVOT: tancap, bahu memutar mendahului pinggul, lalu tolak ke arah baru ----
    const piv = o.pivot ?? 0;
    if (piv > 0.01) {
      const pd = o.pivotDir ?? { x: ux, y: uy };
      const pl = Math.hypot(pd.x, pd.y) || 1;
      const nx2 = sv ? (Math.abs(pd.x) > 0.05 ? Math.sign(pd.x) : ux) : pd.x / pl, ny2 = sv ? 0 : pd.y / pl;
      const k2 = Math.sin(Math.min(1, piv) * Math.PI * 0.85);
      hip.y += k2 * (sv ? 1.4 : 2.6) * s; neck.y += k2 * (sv ? 1.1 : 1.9) * s; head.y += k2 * (sv ? 0.9 : 1.4) * s;
      if (sv) {
        ffoot = V(ux * 2.6 * s, 0);
        bfoot = V(-ux * 2.2 * s, 0);
      } else {
        ffoot = add(V(ux * 3.4 * s, uy * 2.0 * s), V(-uy * 1.6 * f * s, ux * 1.0 * f * s));
        bfoot = add(V(-ux * 3.0 * s, -uy * 1.8 * s), V(0, -k2 * 1.1 * s));
      }
      neck = add(neck, V(nx2 * k2 * 2.0 * s, ny2 * k2 * 1.3 * s));
      head = add(head, V(nx2 * k2 * 2.8 * s, ny2 * k2 * 1.8 * s));
      fhand = add(neck, V(nx2 * k2 * 2.6 * s - ux * k2 * 1.4 * s, ny2 * k2 * 1.6 * s + 0.8 * s), side(1.9 * f));
      bhand = add(neck, V(-nx2 * k2 * 1.2 * s - ux * k2 * 1.8 * s, -ny2 * k2 * 1.2 * s + 1.2 * s), side(-2.1 * f));
      if (!sv) kneeUp = k2 * 1.7 * s;
      kneeDir = { x: nx2, y: ny2 };
    }

    // ---- PINDAH GIGI: merunduk, dada maju, tangan ditarik ke belakang — lalu melesat jadi lari ----
    const sg = o.surge ?? 0;
    if (sg > 0.01) {
      const k4 = Math.min(1, sg);
      hip = add(hip, V(0, k4 * (sv ? 0.9 : 1.5) * s), fwd(k4 * 0.6));
      neck = add(neck, V(0, k4 * (sv ? 0.8 : 1.3) * s), fwd(k4 * 2.0));
      head = add(head, V(0, k4 * (sv ? 0.7 : 1.1) * s), fwd(k4 * 2.6));
      fhand = add(fhand, fwd(-k4 * 1.8), V(0, -k4 * 0.4 * s));
      bhand = add(bhand, fwd(-k4 * 2.2), V(0, -k4 * 0.5 * s));
      if (!sv) kneeUp += k4 * 0.9 * s;
    }

    // ---- REM: tumit menancap di depan, badan tegak seimbang ----
    const brk2 = o.brake ?? 0;
    if (brk2 > 0.01) {
      const k3 = Math.min(1, brk2);
      hip.y += k3 * (sv ? 1.2 : 1.9) * s; neck.y += k3 * (sv ? 0.9 : 1.2) * s; head.y += k3 * (sv ? 0.7 : 0.9) * s;
      hip = add(hip, V(-ux * k3 * 1.1 * s, -uy * k3 * 0.8 * s));
      neck = add(neck, V(-ux * k3 * 1.8 * s, -uy * k3 * 1.4 * s));
      head = add(head, V(-ux * k3 * 2.1 * s, -uy * k3 * 1.5 * s));
      if (sv) {
        ffoot = fwd(2.4 + 1.5 * k3);
        bfoot = fwd(-2.2 - 0.9 * k3);
      } else {
        ffoot = add(fwd(3.0 + 3.4 * k3), side(1.2 * f));
        bfoot = add(fwd(-2.6 - 1.8 * k3), side(-1.4 * f), V(0, -k3 * 1.5 * s));
        kneeUp = k3 * 1.4 * s;
      }
      fhand = add(fhand, V(-ux * k3 * 2.2 * s, -uy * k3 * 1.7 * s - k3 * 0.8 * s));
      bhand = add(bhand, V(-ux * k3 * 1.8 * s, -uy * k3 * 1.5 * s - k3 * 0.6 * s));
    }
    // penjaga: serendah apa pun ancang-ancang/rem, pinggul tetap di atas telapak
    hip.y = Math.min(hip.y, -1.9 * s);
    // penjaga panjang kaki minimum: kaki ayun yang melintas tepat di bawah pinggul tidak boleh terlipat ke jarak ~0
    // (IK membuang tulang < 0.5 dan lutut berpindah sisi = kaki berkedip). Fungsi kontinu, tanpa lompatan.
    {
      const minLeg = 1.9 * s;
      const guardFoot = (ft: Vec): Vec => {
        const gx = ft.x - hip.x, gy = ft.y - hip.y, gd = Math.hypot(gx, gy);
        if (gd >= minLeg) return ft;
        if (gd < 1e-3) return V(ft.x, hip.y + minLeg);
        return V(hip.x + gx * (minLeg / gd), hip.y + gy * (minLeg / gd));
      };
      ffoot = guardFoot(ffoot); bfoot = guardFoot(bfoot);
    }
    neck.y = Math.min(neck.y, hip.y - 2.4 * s);
    head.y = Math.min(head.y, neck.y - 2.0 * s);
  } else if (o.pose === 'idle') {
    const sd = o.seed ?? 0;
    const bt = o.time * 2.6 + sd;
    const br = o.anime ? Math.sin(bt) * 0.22 * s : 0;
    neck.y += br; head.y += br * 0.7;
    fhand = add(neck, D(3.0), V(0, 1.0 * s + br * 0.2)); bhand = add(neck, D(0.8), V(0, 1.2 * s), P(-1.2 * f));
    const look = o.look ?? o.aim;
    if (sv) {
      kneeDir = { x: f, y: 0 };
      ffoot = V(2.1 * f * s, 0);
      bfoot = V(-2.0 * f * s, 0);
    } else {
      kneeDir = { x: Math.cos(look), y: Math.sin(look) * 0.6 };
      const lx = Math.cos(look), ly = Math.sin(look) * 0.6;
      const sxv = -Math.sin(look), syv = Math.cos(look) * 0.6;
      const spread = 1.35 * f;
      ffoot = V((lx * 2.1 + sxv * spread) * s, (ly * 2.1 + syv * spread) * s);
      bfoot = V((-lx * 2.0 - sxv * spread) * s, (-ly * 2.0 - syv * spread) * s);
    }
    kneeUp = 0;
    const brk = o.brake ?? 0;
    if (brk > 0) {
      const vd = o.vel && (Math.abs(o.vel.x) + Math.abs(o.vel.y) > 0.01) ? o.vel : { x: Math.cos(o.aim), y: Math.sin(o.aim) };
      const vl = Math.hypot(vd.x, vd.y) || 1, ux = sv ? (Math.abs(vd.x) > 0.05 ? Math.sign(vd.x) : f) : vd.x / vl, uy = sv ? 0 : vd.y / vl;
      hip.y += brk * (sv ? 1.1 : 1.5) * s; neck.y += brk * (sv ? 0.8 : 1.1) * s; head.y += brk * (sv ? 0.6 : 0.9) * s;
      fhand = add(fhand, V(-ux * brk * 2.0 * s, -uy * brk * 1.6 * s - brk * 0.8 * s));
      bhand = add(bhand, V(-ux * brk * 1.6 * s, -uy * brk * 1.4 * s - brk * 0.6 * s));
      if (sv) {
        ffoot = V(ux * (2.2 + 1.8 * brk) * s, 0);
        bfoot = V(-ux * (2.0 + 1.0 * brk) * s, 0);
        fkneeBend = f; bkneeBend = f;
      } else {
        ffoot = V(ux * (2.2 + 3.6 * brk) * s, uy * (2.2 + 3.6 * brk) * s * 0.6);
        bfoot = V(-ux * (2.4 + 2.6 * brk) * s, -uy * (2.4 + 2.6 * brk) * s * 0.6 - brk * 1.3 * s);
        kneeUp = brk * 1.2 * s; fkneeBend = -f; bkneeBend = -f;
      }
    }
  }

  switch (o.pose) {
    // ================= HAND STRIKES ============================================================
    // every strike: CHAMBER (ch 0->1: coil back, weight on the rear leg) -> SNAP (kp: full extension with step-in,
    // hips/shoulders rotate, head slips) -> HOLD at contact -> RECOVER to guard
    case 'jab': {
      // wing-chun centreline jab: fist chambers at the hip/chest, snaps out crisp, rear hand guards chin
      stance(-0.6 * ch + 1.15 * kp, 1.22);
      twist(-0.55 * ch + 1.15 * kp);
      fhand = add(neck, D(0.6 - 2.8 * ch + 9.6 * kp, 0.35 + 1.0 * kp), P(-0.12 * f));
      bhand = add(neck, D(1.8 - 0.4 * kp), V(0, 0.25 * s), P(-1.55 * f));
      head = add(head, D(0.45 * kp));
      lean(-0.5 * ch + 1.65 * kp, 0.25 * kp);
      if (t >= 0.28 && t <= 0.6) trail = { cx: neck.x, cy: neck.y + 0.3 * s, rx: 8.6 * s, ry: 4.5 * s, from: o.aim + f * 0.35, to: o.aim };
      break;
    }
    case 'cross': case 'punch': {
      // reverse punch: waist turns through, strong hip drive, lead hand guards tight
      stance(-0.75 * ch + 1.25 * kp, 1.28);
      twist(-0.9 * ch + 2.15 * kk);
      bhand = add(neck, D(-2.4 - 2.2 * ch + 12.2 * kk, 0.55 + 0.8 * kk), P(0.5 * f * (1 - kk)));
      fhand = add(neck, D(1.2 - 0.5 * kk), V(0, 0.6 * s), P(-1.5 * f));
      bfoot = add(bfoot, P(1.1 * f * kk), D(0.9 * kk), V(0, (sv ? -0.25 : -1.2) * s * kk));
      head = add(head, P(0.7 * f * kk), D(0.5 * kk));
      lean(-0.65 * ch + 2.4 * kk, 0.45 * kk);
      if (t >= 0.28 && t <= 0.62) trail = { cx: neck.x, cy: neck.y + 0.2 * s, rx: 10.6 * s, ry: 5.5 * s, from: o.aim + f * 0.5, to: o.aim };
      break;
    }
    case 'hook': {
      // whipping waist-hook: bent arm whips across jaw height as torso turns through
      stance(-0.45 * ch + 0.85 * kp, 1.24);
      const a0 = o.aim + f * 2.35, a = o.aim + f * (2.35 + 0.55 * ch - 3.05 * kk);
      const r = (4.0 + 2.2 * Math.sin(Math.min(1, kk * 1.1) * Math.PI * 0.85)) * s;
      twist(-0.75 * ch + 2.1 * kk);
      bhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * (sv ? 0.5 : 0.6)), V(0, -0.1 * s));
      fhand = add(neck, D(1.6), V(0, 0.4 * s), P(-1.4 * f));
      bfoot = add(bfoot, P(1.2 * f * kk));
      head = add(head, P(-0.6 * f * kk), D(0.5 * kk));
      lean(1.25 * kk, 0.28 * kk);
      if (t >= 0.26 && t <= 0.64) trail = { cx: neck.x, cy: neck.y + 0.1 * s, rx: 8.6 * s, ry: 5.2 * s, from: a0, to: a };
      break;
    }
    case 'elbow': {
      stance(-0.5 * ch + 1.2 * kp, 1.15);
      const a0 = o.aim + f * 1.7, a = o.aim + f * (1.7 + 0.55 * ch - 2.35 * kk);
      const r = 4.6 * s;
      twist(-0.65 * ch + 2.0 * kk);
      bhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, -0.55 * s));
      fhand = add(neck, D(2.0), V(0, 1.6 * s), P(-1.1 * f));
      lean(-0.5 * ch + 1.95 * kk, 0.45 * kk);
      if (t >= 0.28 && t <= 0.62) trail = { cx: neck.x, cy: neck.y - 0.25 * s, rx: r * 1.35, ry: r * 0.82, from: a0, to: a };
      break;
    }
    case 'palm': {
      // double palm from a rooted horse stance: sink, pull both palms to the dantian, drive from the legs
      const sink = ch * 0.95 + (t >= 0.3 && t < 0.5 ? (1 - (t - 0.3) / 0.2) * 0.35 : 0);
      stance(-0.4 * ch + 1.25 * kp, 1.65);
      hip.y += 2.3 * s * sink; neck.y += 2.05 * s * sink; head.y += 1.85 * s * sink;
      const c = add(neck, D(-1.3 - 1.7 * ch + 9.6 * kp, 0.55));
      fhand = add(c, P(1.65 * f)); bhand = add(c, P(-1.65 * f));
      lean(-0.7 * ch + 2.35 * kp, 0.7 * kp);
      if (t >= 0.28 && t <= 0.58) trail = { cx: neck.x, cy: neck.y, rx: 9.2 * s, ry: 5 * s, from: o.aim + f * 0.4, to: o.aim };
      break;
    }
    case 'uppercut': {
      // dragon uppercut: drop the rear shoulder low, drive up explosively from the legs
      const dip = ch, rise = kk;
      stance(0.3 + 0.5 * rise, 1.2);
      hip.y += 2.8 * s * dip - 1.7 * s * rise; neck.y += 3.0 * s * dip - 2.5 * s * rise; head.y += 3.0 * s * dip - 2.9 * s * rise;
      twist(-0.65 * dip + 1.5 * rise);
      bhand = add(neck, D(0.6 - 1.6 * dip + 4.4 * rise), V(0, (5.2 - 14.2 * rise) * s));
      fhand = add(neck, D(1.4), V(0, 0.5 * s), P(-1.2 * f));
      bfoot = add(bfoot, V(0, (sv ? -0.35 : -3.5) * s * rise)); kneeUp = (sv ? 0.5 : 1.8) * s * rise;
      lean(-0.6 * dip + 1.1 * rise, 0.25 * rise);
      if (t >= 0.28 && t <= 0.62) trail = { cx: neck.x + 1.5 * f * s, cy: neck.y, rx: 5.5 * s, ry: 7.2 * s, from: o.aim + f * 1.2, to: o.aim - f * 0.4 };
      break;
    }
    // ================= BLACK LEG (Sanji-style) kick flow: hands in pockets, all legs ====================
    case 's_collier': case 's_epaule': case 's_cotelette': {
      // targeted kicks at neck (collier) / shoulder (epaule) / ribs (cotelette): chamber, snap out, body leans away
      const h = o.pose === 's_collier' ? 10 : o.pose === 's_epaule' ? 8 : 5.5;
      const useBack = o.pose === 's_cotelette';
      const chm = cl01(t / 0.3), ext = kk;
      const foot = add(hip, D(1.5 + 6.5 * ext), V(0, (3.5 - 3.5 * chm - (h - 3.5) * ext) * s));
      if (useBack) { bfoot = foot; ffoot = V(1.5 * s * f, 0); bkneeBend = f; } else { ffoot = foot; bfoot = V(-1.5 * s * f, 0); fkneeBend = f; }
      kneeUp = 2.4 * s * chm * (1 - ext * 0.6);
      lean(-1.2 * ext, 0.2); hip.y -= 0.4 * s * ext;
      fhand = add(hip, D(-0.6), V(0, -0.8 * s), P(1.4 * f)); bhand = add(hip, D(-0.8), V(0, -0.8 * s), P(-1.4 * f)); // hands in pockets
      head = add(head, D(-0.5 * ext));
      if (t >= 0.3 && t <= 0.6) trail = { cx: hip.x, cy: hip.y, rx: 8 * s, ry: 6 * s, from: Math.PI / 2 - f * 0.2, to: f > 0 ? -0.3 : Math.PI + 0.3 };
      break;
    }
    case 's_antimanner': {
      // anti-manner kick course: a spinning overhead heel that drops onto the shoulder
      const sp = cl01((t - 0.15) / 0.35);
      const a = -Math.PI / 2 + f * (sp * Math.PI * 1.1 - 0.6);
      const r = (6 + 3 * Math.sin(sp * Math.PI)) * s;
      ffoot = add(hip, V(Math.cos(a) * r, Math.sin(a) * r)); fkneeBend = -f;
      bfoot = V(-1.2 * s * f, 0);
      hip.y -= 1.2 * s * Math.sin(sp * Math.PI); neck.y -= 1.2 * s * Math.sin(sp * Math.PI); head.y -= 1.2 * s * Math.sin(sp * Math.PI);
      lean(-0.8 + 1.6 * sp, 0.4);
      fhand = add(hip, D(-0.6), V(0, -0.8 * s), P(1.4 * f)); bhand = add(hip, D(-0.8), V(0, -0.8 * s), P(-1.4 * f));
      if (sp > 0.1 && sp < 0.95) trail = { cx: hip.x, cy: hip.y, rx: r * 1.05, ry: r * 1.05, from: -Math.PI / 2 - f * 0.6, to: a };
      break;
    }
    case 's_mouton': {
      // mouton shot: a huge roundhouse at the end of a run-up; whole body rotates into it, kick finishes high
      const chm = cl01(t / 0.3), ext = kk, thru = cl01((t - 0.6) / 0.4);
      const a0 = o.aim + f * 2.4, a = o.aim + f * (2.4 - 3.1 * ext - 0.4 * thru);
      const len = (3.5 + 7.5 * ext) * s, h = (4 + 1.5 * ext) * s;
      ffoot = add(hip, V(Math.cos(a) * len, Math.sin(a) * len * 0.6 - h * chm)); fkneeBend = f; kneeUp = 2.5 * s * chm * (1 - ext * 0.7);
      bfoot = add(V(0, 0), D(-1.6), P(1.2 * f * ext));
      lean(-1.4 * ext, 0.2); neck = add(neck, P(f * 1.6 * ext)); head = add(head, P(f * 1.8 * ext));
      fhand = add(hip, D(-0.6), V(0, -0.8 * s), P(1.4 * f)); bhand = add(neck, P(-f * 3 * ext), D(-0.6), V(0, 1 * s));
      if (t >= 0.28 && t <= 0.65) trail = { cx: hip.x, cy: hip.y - h * 0.5, rx: len * 1.1, ry: len * 0.66, from: a0, to: a };
      break;
    }
    case 's_concasse': {
      // concasse: jump, then a crushing heel drop straight down
      const up = t < 0.3 ? easeOut(t / 0.3) : Math.max(0, 1 - (t - 0.3) / 0.12);
      const dn = t >= 0.3 ? cl01((t - 0.3) / 0.12) : 0;
      ffoot = add(hip, D(1.5 + 3.5 * dn + 1.0 * up), V(0, (-9 * up + 4 * dn) * s)); fkneeBend = -f; kneeUp = 0.6 * s * up;
      bfoot = add(hip, D(-1.5), V(0, (4 - 2 * up) * s));
      lean(-0.8 * up + 2 * dn, 0.6 * up - 0.8 * dn); hip.y += 1.4 * s * dn;
      fhand = add(hip, D(-0.6), V(0, -0.8 * s), P(1.4 * f)); bhand = add(hip, D(-0.8), V(0, -0.8 * s), P(-1.4 * f));
      if (t >= 0.28 && t <= 0.46) trail = { cx: hip.x, cy: hip.y, rx: 9.5 * s, ry: 9.5 * s, from: -Math.PI / 2 + (f > 0 ? 0.3 : -0.3), to: f > 0 ? 0.3 : Math.PI - 0.3 };
      break;
    }
    case 's_partyTable': {
      // party table kick course: handstand-free version: spinning on one leg with the other extended, 2 turns
      const a = o.aim + f * t * Math.PI * 4;
      const r = 9 * s;
      hip.y -= 1.0 * s; neck.y -= 1.0 * s; head.y -= 1.0 * s;
      ffoot = add(hip, V(Math.cos(a) * r, Math.sin(a) * r * 0.6 - 3 * s)); fkneeBend = -f;
      bfoot = V(0.4 * s * f, 0);
      fhand = add(neck, V(Math.cos(a + Math.PI) * 2.5 * s, Math.sin(a + Math.PI) * 1.5 * s), V(0, 0.5 * s)); bhand = add(neck, V(Math.cos(a) * 2 * s, Math.sin(a) * 1.2 * s), V(0, -1 * s));
      if (t > 0.15 && t < 0.85) trail = { cx: hip.x, cy: hip.y - 3 * s, rx: r * 1.1, ry: r * 0.66, from: a - 1.6 * f, to: a };
      break;
    }
    case 's_diable': {
      // diable jambe: spin to heat the leg (0-0.3), then the flaming flying kick with full extension
      const spinup = cl01(t / 0.3), ext = kk;
      const c = V(0, -2 * s * ext);
      hip = add(hip, c); neck = add(neck, c); head = add(head, c);
      const spin = o.aim + f * spinup * Math.PI * 2;
      if (t < 0.3) { ffoot = add(hip, V(Math.cos(spin) * 7 * s, Math.sin(spin) * 4 * s - 2 * s)); }
      else ffoot = add(hip, D(2 + 9 * ext), V(0, -1.5 * s));
      fkneeBend = -f;
      bfoot = add(hip, D(-1.5), V(0, (4 - 1.5 * ext) * s));
      lean(-0.5 * spinup + 2.5 * ext, 0.8 * ext);
      fhand = add(neck, D(-2.5 * ext), V(0, 1.5 * s), P(1.4 * f)); bhand = add(neck, D(-3 * ext), V(0, -1 * s), P(-1.4 * f));
      if (t >= 0.3 && t <= 0.62) trail = { cx: hip.x, cy: hip.y - 1.5 * s, rx: 10 * s, ry: 6 * s, from: o.aim + f * 1.2, to: o.aim };
      break;
    }
    // ================= KUNG FU heavy additions ======================================================
    case 'k_ironpalm': {
      // iron palm: deep sink, palm drives up-and-forward from the hip with the whole body
      const sink = ch;
      stance(-0.5 * sink + 1.2 * kp, 1.4);
      hip.y += 2.0 * s * sink; neck.y += 1.8 * s * sink; head.y += 1.6 * s * sink;
      fhand = add(neck, D(-1.0 * sink + 1.0 + 8.0 * kp, 0.6), V(0, (3.5 * sink) * s), P(0.6 * f));
      bhand = add(neck, D(-1.0), V(0, 0.6 * s), P(-1.4 * f));
      twist(-0.6 * sink + 1.6 * kp); lean(-0.4 * sink + 2.2 * kp, 0.5 * kp);
      break;
    }
    case 'k_hammerfist': {
      // hammer fist: raise the rear fist high behind the head, bring it down like a mallet
      const up = t < 0.3 ? easeOut(t / 0.3) : Math.max(0, 1 - (t - 0.3) / 0.1);
      const dn = t >= 0.3 ? cl01((t - 0.3) / 0.1) : 0;
      stance(-0.3 * up + 1.1 * dn, 1.3);
      bhand = add(neck, D(-2.0 * up + 6.0 * dn), V(0, (-7 * up + 2.5 * dn) * s));
      fhand = add(neck, D(2.0), V(0, 1.2 * s), P(-1.2 * f));
      twist(-0.8 * up + 1.6 * dn); lean(-1.0 * up + 2.4 * dn, 0.6 * up - 0.8 * dn);
      hip.y += 1.4 * s * dn;
      break;
    }
    case 'chainpunch': {
      // WING CHUN lin wan kuen: fists cycle on the centreline, elbows tucked, short square stance, little body motion.
      // o.t here encodes: fraction 0..1 of the current punch; the striking fist is 'fhand' (alternation is handled by
      // swapping which hand is 'front' in the game via chainSide -> we animate front hand out, back hand chambered at the chest)
      const out = t < 0.3 ? easeOut(t / 0.3) : 1 - cl01((t - 0.3) / 0.7) * 0.85;
      stance(0.4, 0.9); hip.y += 0.5 * s;
      const front = add(neck, D(1.5 + 6.5 * out, 0.9)); // vertical fist on the centreline
      const wait = add(neck, D(1.5 + 2.5 * (1 - out), 0.6), V(0, 0.8 * s)); // the other fist waits right behind it on the same line
      if ((o.chainSide ?? 1) < 0) { bhand = front; fhand = wait; } else { fhand = front; bhand = wait; }
      twist(0.35 * out - 0.1);
      lean(0.8 + 0.4 * out, 0.3);
      head = add(head, D(0.3 * out));
      break;
    }
    case 'chainfinish': {
      // the finishing blow: sink, then a full-body straight blast with both palms (jik chung) + step through
      const sink = ch;
      stance(-0.4 * sink + 1.2 * kp, 1.3);
      hip.y += 1.5 * s * sink; neck.y += 1.2 * s * sink; head.y += 1.0 * s * sink;
      const c = add(neck, D(0.5 - 1.6 * sink + 9.5 * kp, 0.6));
      fhand = add(c, P(1.0 * f)); bhand = add(c, P(-1.0 * f));
      twist(1.2 * kp); lean(-0.5 * sink + 2.6 * kp, 0.6 * kp);
      break;
    }
    case 'ragedash': {
      // blur dash: body horizontal, arms back
      const lv = D(4);
      neck = add(neck, lv); head = add(head, V(lv.x * 1.3, lv.y * 1.3)); hip = add(hip, D(1.4));
      ffoot = add(D(-3.5), V(-s, -1.5 * s)); bfoot = add(D(-5), V(s, -2.5 * s));
      fhand = add(neck, D(-3), V(0, 1.5 * s), P(1.5 * f)); bhand = add(neck, D(-3), V(0, 1.5 * s), P(-1.5 * f));
      break;
    }
    case 'ragekill': {
      // execution: a monstrous rear straight that drives through the target, body fully committed
      stance(-0.3 * ch + 1.4 * kp, 1.3);
      twist(-0.6 * ch + 2.0 * kk);
      bhand = add(neck, D(-2.2 * ch + 11 * kk, 0.9), P(1.0 * f * (1 - kk)));
      fhand = add(neck, D(-1.5), V(0, 1.6 * s), P(-1.6 * f));
      lean(-0.6 * ch + 3.0 * kk, 0.8 * kk); hip.y += 0.8 * s * kk;
      head = add(head, P(0.8 * f * kk), D(0.6 * kk));
      bfoot = add(bfoot, P(1.2 * f * kk), D(1.0 * kk));
      break;
    }
    case 'tigerclaw': {
      // tiger claw: deep hunch, hooked hands rake down alternately with big arm swings
      const ph = t * Math.PI * 6;
      stance(0.7, 1.2);
      lean(2.4, 1.2); hip.y += 1.0 * s;
      fhand = add(neck, D(2.5 + Math.sin(ph) * 4.0, 0.2 + Math.sin(ph) * 2.6), P(0.8 * f));
      bhand = add(neck, D(2.5 - Math.sin(ph) * 4.0, 0.2 - Math.sin(ph) * 2.6), P(-0.8 * f));
      twist(0.9 * Math.sin(ph));
      break;
    }
    case 'mantis': {
      // mantis: hooked hands coiled to the chest, sink very low, then one explosive short strike with the whole body
      const coil = ch;
      stance(-0.6 * coil + 1.3 * kp, 1.4);
      hip.y += 3.0 * s * coil; neck.y += 2.8 * s * coil; head.y += 2.8 * s * coil;
      fhand = add(neck, D(1.0 - 2.2 * coil + 7.5 * kp, 0.9), V(0, -1.4 * s * coil));
      bhand = add(neck, D(-0.5 - 1.2 * coil), V(0, 0.4 * s), P(-1 * f));
      twist(-0.5 * coil + 1.5 * kp);
      lean(-0.5 * coil + 1.8 * kp, 0.4 * kp);
      break;
    }
    // ================= DRUNKEN MASTER (Zui Quan / Jurus Mabuk — Gerbang 6) =================
    case 'drunk_cup': {
      // Wine-Cup Wrist Strike: badan miring santai ke belakang saat ancang-ancang, tangan depan menyentak seperti menyodorkan cawan arak, tangan belakang tinggi di pelipis
      stance(-0.7 * ch + 1.15 * kp, 1.28);
      hip.y += (0.65 * ch + 0.35 * kp) * s;
      twist(-0.6 * ch + 1.35 * kp);
      fhand = add(neck, D(0.5 - 2.4 * ch + 9.4 * kp, 0.55 + 0.85 * kp), V(0, (-0.8 * ch + 0.2 * kp) * s));
      bhand = add(neck, D(-1.4 - 0.8 * kp, 1.8), V(0, (-1.9 - 0.5 * kp) * s), P(-1.2 * f));
      lean(-0.95 * ch + 1.35 * kp, 0.25 * kp);
      if (t >= 0.26 && t <= 0.62) trail = { cx: neck.x, cy: neck.y, rx: 9.0 * s, ry: 4.8 * s, from: o.aim + f * 0.55, to: o.aim - f * 0.1 };
      break;
    }
    case 'drunk_sway': {
      // Swaying Backfist: pinggang merunduk mengayun mengelak pukulan, lalu tangan belakang menyabet dari sudut mengejutkan
      const dip = Math.sin(cl01(t / 0.55) * Math.PI);
      stance(-0.5 * ch + 1.05 * kp, 1.34);
      hip.y += (1.25 * dip + 0.4 * kp) * s; neck.y += 1.0 * dip * s; head.y += 0.85 * dip * s;
      const a0 = o.aim + f * 2.45, a = o.aim + f * (2.45 + 0.5 * ch - 3.15 * kk);
      const r = (4.2 + 2.4 * Math.sin(Math.min(1, kk * 1.1) * Math.PI * 0.85)) * s;
      twist(-0.85 * ch + 2.2 * kk);
      bhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * (sv ? 0.48 : 0.6)), V(0, -0.25 * s));
      fhand = add(neck, D(1.4 - 1.8 * kk), V(0, (1.6 + 0.6 * dip) * s), P(-1.4 * f));
      lean(-0.8 * ch + 1.5 * kk, 0.25 * kk);
      if (t >= 0.25 && t <= 0.64) trail = { cx: neck.x, cy: neck.y, rx: 9.2 * s, ry: 5.4 * s, from: a0, to: a };
      break;
    }
    case 'drunk_stumble': {
      // Stumble Elbow & Palm: langkah terhuyung maju seperti hampir jatuh, tiba-tiba siku & bahu menghantam keras
      stance(-0.4 * ch + 1.35 * kp, 1.32);
      hip.y += (0.8 * ch + 0.75 * kp) * s;
      twist(-0.7 * ch + 2.1 * kk);
      bhand = add(neck, D(-1.8 * ch + 8.6 * kk, 0.35 + 0.65 * kk), V(0, (-0.5 + 0.4 * kk) * s));
      fhand = add(neck, D(2.2 - 1.4 * kk), V(0, (-1.4 * ch + 1.4 * kk) * s), P(-1.3 * f));
      lean(-0.6 * ch + 2.15 * kk, 0.45 * kk);
      if (t >= 0.26 && t <= 0.62) trail = { cx: neck.x, cy: neck.y, rx: 8.6 * s, ry: 4.8 * s, from: o.aim - f * 0.5, to: o.aim + f * 0.15 };
      break;
    }
    case 'drunk_mule': {
      // Drunken Upkick: badan rebah rendah condong ke belakang dengan satu tangan menyentuh dekat lantai, kaki depan menyepak ke atas
      const chm = cl01(t / 0.28), ext = kk;
      const drop = (1.6 * chm + 1.2 * ext) * s;
      hip.y += drop; neck.y += drop * 1.1; head.y += drop * 1.15;
      bfoot = V(-1.6 * adx * s, 0);
      const a = o.aim + f * (1.25 - 1.75 * ext);
      const len = (3.8 + 6.8 * ext) * s;
      ffoot = add(hip, V(Math.cos(a) * len, Math.sin(a) * len * (sv ? 0.52 : 0.6) - (3.8 * ext) * s));
      kneeUp = 2.4 * s * chm * (1 - ext * 0.5); fkneeBend = f;
      lean(-1.55 * ext, -0.35 * ext);
      bhand = add(hip, D(-2.4 * ext), V(0, 1.8 * s * ext));
      fhand = add(neck, D(2.2), V(0, -1.2 * s));
      if (t >= 0.26 && t <= 0.65) trail = { cx: hip.x, cy: hip.y - 1.5 * s, rx: len * 1.08, ry: len * 0.68, from: o.aim + f * 1.25, to: a };
      break;
    }
    case 'drunk_cannon': {
      // DRUNKEN GOD FIST (Finisher Punch Gerbang 6): ancang-ancang condong jauh ke belakang memuat tenaga di pinggang,
      // lalu meledak maju dengan pukulan meriam dua kepalan / corkscrew yang melontarkan lawan mental jauh!
      const coil = ch;
      stance(-0.85 * coil + 1.45 * kp, 1.5);
      hip.y += (2.1 * coil + 0.65 * kp) * s; neck.y += 1.8 * coil * s; head.y += 1.5 * coil * s;
      twist(-1.1 * coil + 2.4 * kk);
      const c = add(neck, D(-2.2 - 2.4 * coil + 12.6 * kk, 0.65 + 0.55 * kk));
      fhand = add(c, P(1.2 * f), V(0, -0.35 * s));
      bhand = add(c, P(-1.2 * f), V(0, 0.35 * s));
      bfoot = add(bfoot, D(1.1 * kk), V(0, (sv ? -0.3 : -1.2) * s * kk));
      lean(-1.25 * coil + 2.55 * kk, 0.55 * kk);
      if (t >= 0.26 && t <= 0.64) trail = { cx: neck.x, cy: neck.y, rx: 11.4 * s, ry: 5.8 * s, from: o.aim + f * 0.65, to: o.aim - f * 0.15 };
      break;
    }
    case 'spinback': {
      // spinning backfist: look over the shoulder, pivot on the front foot, 360, the rear arm whips out straight
      const sp = cl01((t - 0.15) / 0.5);
      const a = o.aim + f * (Math.PI * 1.15 - 2.3 * Math.PI * sp);
      const r = (2.5 + 7 * Math.sin(Math.min(1, sp * 1.3) * Math.PI * 0.5)) * s;
      hip.y -= 0.6 * s; neck.y -= 0.6 * s; head.y -= 0.6 * s;
      bhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, 0.9 * s));
      fhand = add(neck, V(Math.cos(a + Math.PI) * 2.6 * s, Math.sin(a + Math.PI) * 1.6 * s), V(0, 1.2 * s));
      head = add(head, V(Math.cos(a) * 1.1 * s, Math.sin(a) * 0.6 * s));
      ffoot = V(1.6 * s * f, 0); bfoot = add(V(-1.6 * s * f, 0), V(Math.cos(a + Math.PI) * 1.8 * s, Math.sin(a + Math.PI) * 1.1 * s));
      if (t > 0.2 && t < 0.65) trail = { cx: neck.x, cy: neck.y + 0.9 * s, rx: r * 1.1, ry: r * 0.66, from: o.aim + f * Math.PI * 1.15, to: a };
      break;
    }
    // ================= KICKS ===================================================================
    case 'roundhouse': case 'kick': {
      // roundhouse: chamber the knee high, pivot the support foot, hips turn over, the shin whips through at rib/head height
      const chm = cl01(t / 0.28), ext = kk, sp = cl01((t - 0.62) / 0.38);
      const a0 = o.aim + f * 2.2, a = o.aim + f * (2.2 - 2.75 * ext);
      const len = (3.6 + 6.8 * ext) * s * (1 - sp * 0.5), h = (4.8 + 1.0 * ext) * s * (1 - sp);
      ffoot = add(hip, V(Math.cos(a) * len, Math.sin(a) * len * (sv ? 0.5 : 0.6) - h * chm));
      kneeUp = 2.6 * s * chm * (1 - ext * 0.55); fkneeBend = f;
      bfoot = sv ? V(-1.4 * adx * s, 0) : add(V(0, 0), D(-1.4), P(1.0 * f * ext));
      lean(-1.1 * ext, 0.12); neck = add(neck, P(f * 1.4 * ext)); head = add(head, P(f * 1.4 * ext));
      fhand = add(neck, P(f * 2.4 * ext), D(1.4), V(0, 0.4 * s)); bhand = add(neck, P(-f * 2.4 * ext), D(-0.6), V(0, 0.7 * s));
      if (t >= 0.28 && t <= 0.64) trail = { cx: hip.x, cy: hip.y - h * 0.5, rx: len * 1.12, ry: len * 0.66, from: a0, to: a };
      break;
    }
    case 'sweep': {
      // low sweep: drop onto the rear leg, the extended front leg scythes a full circle along the floor
      const cr = 3.2 * s; hip.y += cr; neck.y += cr; head.y += cr;
      const sk = cl01((t - 0.22) / 0.46);
      const a0 = o.aim + Math.PI * 0.95 * f, a = a0 - sk * Math.PI * 1.9 * f;
      ffoot = V(Math.cos(a) * 9 * s, Math.sin(a) * 9 * s * 0.6 + 0.3 * s);
      bfoot = V(-f * 0.6 * s, 0); kneeUp = 1.6 * s; bkneeBend = -f;
      bhand = V(-f * 3.8 * s, -0.5 * s); fhand = add(neck, D(2.4), V(0, 2.2 * s));
      lean(0.6, 0);
      if (sk > 0 && sk < 1) trail = { cx: 0, cy: 0.3 * s, rx: 9.5 * s, ry: 5.7 * s, from: a0, to: a };
      break;
    }
    case 'knee': {
      // muay thai knee: both hands grab the head and pull it down while the knee drives up and through
      const drive = kk;
      stance(-0.3 * ch + 0.8 * drive, 1.0);
      ffoot = add(hip, D(1.5 + 3.5 * drive), V(0, (4 - 9.5 * drive) * s));
      kneeUp = 4.0 * s * drive; fkneeBend = f;
      bfoot = add(V(0, 0), D(-2.4));
      fhand = add(neck, D(2 + 2.5 * ch - 1.5 * drive, 1.4 + 0.8 * ch - 2.6 * drive), P(1.2 * f));
      bhand = add(neck, D(1.8 + 2.5 * ch - 1.5 * drive, 1.0 + 0.8 * ch - 2.4 * drive), P(-1.2 * f));
      lean(0.4 + 1.0 * drive, -0.8 * drive); hip.y -= 1.2 * s * drive;
      break;
    }
    case 'axekick': {
      // AXE KICK (Tendangan Kapak): ancang-ancang singkat -> angkat satu kaki LURUS TINGGI melewati atas kepala
      // (split vertikal ~180°) -> hentakkan tumit LURUS KE BAWAH membelah kepala & bahu lawan hingga menghantam lantai.
      if (t < 0.09) {
        // Ancang-ancang (anticipation): badan merendah 1-2 frame memuat tenaga di kaki tumpu
        const q = easeOut(t / 0.09);
        kneeDir = { x: f, y: 0 };
        bfoot = V(-1.3 * f * s, 0);
        ffoot = V((1.4 - 3.4 * q) * f * s, -0.5 * q * s);
        hip = V(-0.3 * q * f * s, (-4 + 1.45 * q) * s);
        neck = V(1.3 * q * f * s, (-8 + 1.9 * q) * s);
        head = V(2.1 * q * f * s, (-11 + 2.2 * q) * s);
        fhand = add(neck, V(-2.2 * q * f * s, 1.2 * s));
        bhand = add(neck, V(2.0 * f * s, 0.9 * s));
      } else if (t < 0.31) {
        // Angkat satu kaki LURUS TINGGI ke atas kepala + tahan 1 frame di puncak (apex hold)
        const up = easeOut(cl01((t - 0.09) / 0.16));
        const apex = t > 0.25 ? cl01((t - 0.25) / 0.06) : 0;
        bfoot = V(-0.8 * f * s, 0);
        hip = V(0.35 * up * f * s, (-4.1 - 0.55 * up) * s);
        // Badan sedikit condong ke belakang menyeimbangkan kaki yang menjulang lurus di atas kepala
        neck = V(-1.55 * up * f * s, (-8.1 + 0.35 * up) * s);
        head = V(-2.25 * up * f * s, (-10.85 + 0.45 * up) * s);
        const ang = lerp(Math.PI * 0.38, -Math.PI * (0.44 + 0.025 * apex), up);
        const legR = lerp(6.2, 10.9 + 0.45 * apex, up) * s;
        ffoot = V(hip.x + Math.cos(ang) * legR * f, Math.min(0, hip.y + Math.sin(ang) * legR));
        fkneeBend = -f;
        fhand = add(neck, V(2.2 * f * s, (-0.4 * up + 0.9) * s));
        bhand = add(neck, V(-2.1 * f * s, (1.1 + 0.4 * up) * s));
        if (t >= 0.2) {
          const baseA = f > 0 ? ang : Math.PI - ang;
          trail = { cx: hip.x, cy: hip.y, rx: 10.2 * s, ry: 10.6 * s, from: baseA + f * 0.55, to: baseA };
        }
      } else if (t < 0.6) {
        // Hentakan kapak: kaki tetap LURUS penuh, mengayun vertikal keras dari atas kepala -> kepala/bahu lawan -> lantai
        const raw = cl01((t - 0.31) / 0.19);
        const dn = raw * raw * (2.25 - 1.25 * raw); // akselerasi tajam seperti bilah kapak jatuh
        bfoot = V((-0.8 - 1.0 * dn) * f * s, 0);
        hip = V((0.35 + 1.25 * dn) * f * s, (-4.65 + 1.45 * dn) * s);
        // Pinggul & bahu membanting maju memberi bobot penuh pada hentakan tumit ke bawah
        neck = V((-1.55 + 4.65 * dn) * f * s, (-7.75 + 1.35 * dn) * s);
        head = V((-2.25 + 6.7 * dn) * f * s, (-10.4 + 1.75 * dn) * s);
        const ang = lerp(-Math.PI * 0.465, Math.PI * 0.125, dn);
        const legR = lerp(11.3, 9.6, dn) * s;
        const rawY = hip.y + Math.sin(ang) * legR;
        ffoot = V(hip.x + Math.cos(ang) * legR * f, raw > 0.92 ? 0 : Math.min(0, rawY));
        fkneeBend = -f;
        // Tangan depan mengayun tajam ke belakang-bawah sebagai counter-torque hentakan kapak
        fhand = add(neck, V((2.2 - 5.6 * dn) * f * s, (0.5 + 1.9 * dn) * s));
        bhand = add(neck, V((-2.1 + 4.4 * dn) * f * s, (1.5 - 0.3 * dn) * s));
        if (t <= 0.55) {
          const fromA = f > 0 ? -Math.PI * 0.47 : -Math.PI * 0.53;
          const curA = f > 0 ? ang : Math.PI - ang;
          trail = { cx: hip.x + 0.8 * f * s, cy: hip.y - 0.6 * s, rx: 10.6 * s, ry: 11.2 * s, from: fromA, to: curA };
        }
      } else {
        // Pulih dari hentakan lantai kembali ke kuda-kuda tempur
        const rec = easeInOut(cl01((t - 0.6) / 0.4));
        kneeDir = { x: f, y: 0 };
        bfoot = V(lerp(-1.8, -2.1, rec) * f * s, 0);
        ffoot = V(lerp(8.2, 2.3, rec) * f * s, 0);
        hip = V(lerp(1.6, 0, rec) * f * s, lerp(-3.2, -4, rec) * s);
        neck = V(lerp(3.1, 0, rec) * f * s, lerp(-6.4, -8, rec) * s);
        head = V(lerp(4.45, 0, rec) * f * s, lerp(-8.65, -11, rec) * s);
        fhand = add(neck, V(lerp(-3.4, 3.2, rec) * f * s, lerp(2.4, 1.2, rec) * s));
        bhand = add(neck, V(lerp(2.3, -1.5, rec) * f * s, lerp(1.2, 1.9, rec) * s));
      }
      break;
    }
    case 'butterflyflip': {
      // BUTTERFLY FLIP ala Liu Kang (Wushu Xuanzi / Shaolin Butterfly Kick):
      // 1) Ancang-ancang membungkuk SANGAT rendah dengan tangan melebar seperti sayap terlipat (1-2+ frame di lantai)
      // 2) Tolakan eksplosif ke udara sambil badan melayang horizontal berputar 360°
      // 3) Kedua kaki lurus menyapu bergantian membentuk busur sabit kupu-kupu ke arah kepala/dada lawan
      // 4) Mendarat pegas merendah bergaya Shaolin
      if (t < 0.21) {
        const q = easeOut(cl01(t / 0.13));
        kneeDir = { x: f, y: 0 };
        ffoot = V(2.6 * f * s, 0);
        bfoot = V(-2.9 * f * s, 0);
        // Membungkuk rendah memuat tenaga pegas sebelum salto
        hip = V(-0.25 * q * f * s, (-4 + 2.15 * q) * s);
        neck = V(3.55 * q * f * s, (-8 + 5.45 * q) * s);
        head = V(5.45 * q * f * s, (-11 + 7.65 * q) * s);
        fhand = V(2.1 * q * f * s, (-5 + 4.3 * q) * s);
        bhand = V(-4.0 * q * f * s, (-5.2 + 1.1 * q) * s);
      } else if (t < 0.3) {
        // Tolakan meledak dari lantai: kaki belakang menyabet tinggi ke atas, sayap tangan membentang lebar
        const p0 = easeOut((t - 0.21) / 0.09);
        ffoot = V(lerp(2.6, 1.2, p0) * f * s, lerp(0, -1.8, p0) * s);
        bfoot = V(lerp(-2.9, -7.8, p0) * f * s, lerp(0, -9.8, p0) * s);
        hip = V(lerp(-0.25, 0.2, p0) * f * s, lerp(-1.85, -6.2, p0) * s);
        neck = V(lerp(3.55, 3.6, p0) * f * s, lerp(-2.55, -5.8, p0) * s);
        head = V(lerp(5.45, 5.9, p0) * f * s, lerp(-3.35, -6.3, p0) * s);
        fhand = add(neck, V(3.6 * f * s, 1.4 * s));
        bhand = add(neck, V(-4.8 * f * s, -1.8 * s));
        fkneeBend = -f; bkneeBend = -f;
      } else if (t < 0.76) {
        // Salto horizontal Butterfly Flip Liu Kang: putaran 360° miring + 2 sabetan kaki sabit lebar
        const u = (t - 0.3) / 0.46;
        const phi = u * Math.PI * 2;
        const cs = Math.cos(phi), sn = Math.sin(phi);
        hip = V(0.5 * sn * f * s, (-6.5 - 1.5 * Math.sin(u * Math.PI)) * s);
        // Badan melayang nyaris horizontal sambil memuntir 360° (ciri khas Xuanzi / Liu Kang Butterfly Kick)
        neck = add(hip, V((-3.5 * sn + 1.4 * cs) * f * s, (-1.0 + 1.45 * cs) * s));
        head = add(neck, V((-2.25 * sn + 0.95 * cs) * f * s, (-0.65 + 0.95 * cs) * s));
        // Tangan terbentang lebar seperti sayap kupu-kupu menjaga momentum putar
        fhand = add(neck, V(4.5 * Math.cos(phi + 0.65) * f * s, (2.1 * Math.sin(phi + 0.65) - 0.3) * s));
        bhand = add(neck, V(-4.5 * Math.cos(phi + 0.65) * f * s, (-2.1 * Math.sin(phi + 0.65) + 0.3) * s));
        // Kaki 1 (bfoot) & Kaki 2 (ffoot) terbuka lebar (split kupu-kupu) menyabet beruntun dari atas ke wajah/bahu lawan
        const a1 = -Math.PI * 0.8 + u * Math.PI * 1.38;
        const a2 = -Math.PI * 1.24 + u * Math.PI * 1.5;
        const r1 = 9.3 * s, r2 = 9.7 * s;
        bfoot = V(hip.x + Math.cos(a1) * r1 * f, Math.min(0, hip.y + Math.sin(a1) * r1 * 0.78));
        ffoot = V(hip.x + Math.cos(a2) * r2 * f, Math.min(0, hip.y + Math.sin(a2) * r2 * 0.8));
        fkneeBend = -f; bkneeBend = -f;
        const actA = u < 0.46 ? a1 : a2;
        const worldA = f > 0 ? actA : Math.PI - actA;
        trail = { cx: hip.x + 0.6 * f * s, cy: hip.y - 0.5 * s, rx: 10.4 * s, ry: 8.2 * s, from: worldA - f * 1.25, to: worldA };
      } else {
        // Pendaratan pegas rendah bergaya Liu Kang Shaolin (lutut mengeper menyerap tenaga lompatan)
        const w = cl01((t - 0.76) / 0.24);
        const rise = easeOut(w);
        kneeDir = { x: f, y: 0 };
        ffoot = V(lerp(3.2, 2.3, rise) * f * s, 0);
        bfoot = V(lerp(-2.9, -2.2, rise) * f * s, 0);
        hip = V(lerp(0.6, 0, rise) * f * s, lerp(-2.15, -4, rise) * s);
        neck = V(lerp(2.2, 0, rise) * f * s, lerp(-5.2, -8, rise) * s);
        head = V(lerp(3.2, 0, rise) * f * s, lerp(-7.7, -11, rise) * s);
        fhand = add(neck, V(lerp(4.0, 3.3, rise) * f * s, lerp(0.5, 1.2, rise) * s));
        bhand = add(neck, V(lerp(-3.2, -1.5, rise) * f * s, lerp(-0.4, 2.0, rise) * s));
      }
      break;
    }
    case 'cartwheelkick': {
      // CARTWHEEL KICK (Tendangan Roda):
      // 1) Ancang-ancang membungkuk rendah 1-2+ frame sebelum menukik
      // 2) Tangan menumpu lantai, tubuh berbalik tegak 360° seperti poros roda
      // 3) Kedua kaki terentang lurus seperti jari-jari roda berputar tinggi melewati kepala lalu menghantam lawan beruntun
      // 4) Tangan menolak lantai, mendarat pegas kembali ke kuda-kuda
      if (t < 0.19) {
        const q = easeOut(cl01(t / 0.12));
        kneeDir = { x: f, y: 0 };
        ffoot = V(2.4 * f * s, 0);
        bfoot = V(-3.0 * f * s, 0);
        hip = V(-0.45 * q * f * s, (-4 + 2.1 * q) * s);
        neck = V(2.95 * q * f * s, (-8 + 5.5 * q) * s);
        head = V(4.65 * q * f * s, (-11 + 8.0 * q) * s);
        fhand = V(3.9 * q * f * s, (-4.2 + 3.4 * q) * s);
        bhand = V(-3.4 * q * f * s, (-5.2 + 0.6 * q) * s);
      } else if (t < 0.78) {
        const u = (t - 0.19) / 0.59;
        const pushOff = u > 0.76 ? easeOut((u - 0.76) / 0.24) : 0;
        const tilt = (u - 0.46) * 0.85;
        // Poros tubuh terbalik (handstand wheel): tangan menapak di lantai, kepala aman di atas lantai, pinggul tinggi di atas
        hip = V(-Math.sin(tilt) * 0.9 * f * s, lerp(-8.7, -5.4, pushOff) * s);
        neck = V(Math.sin(tilt) * 1.35 * f * s, lerp(-4.7, -6.8, pushOff) * s);
        head = V(Math.sin(tilt) * 1.95 * f * s, lerp(-2.55, -9.2, pushOff) * s);
        fhand = V(lerp(1.65, 3.2, pushOff) * f * s, lerp(0, -4.6, pushOff) * s);
        bhand = V(lerp(-1.55, -2.6, pushOff) * f * s, (u < 0.1 ? lerp(-2.2, 0, u / 0.1) : lerp(0, -3.8, pushOff)) * s);
        // Dua jari-jari kaki lurus (wide V-split cartwheel) menyapu penuh dari belakang -> atas -> menghantam ke depan-bawah
        const uB = easeInOut(cl01(u / 0.8));
        const uF = easeInOut(cl01((u - 0.1) / 0.88));
        const aB = lerp(-Math.PI * 0.94, Math.PI * 0.34, uB);
        const aF = lerp(-Math.PI * 1.18, Math.PI * 0.28, uF);
        const spokeB = 8.9 * s, spokeF = 9.4 * s;
        bfoot = V(hip.x + Math.cos(aB) * spokeB * f, Math.min(0, hip.y + Math.sin(aB) * spokeB));
        ffoot = V(hip.x + Math.cos(aF) * spokeF * f, Math.min(0, hip.y + Math.sin(aF) * spokeF));
        fkneeBend = -f; bkneeBend = -f;
        const leadA = u < 0.5 ? aB : aF;
        const worldA = f > 0 ? leadA : Math.PI - leadA;
        trail = { cx: hip.x, cy: hip.y, rx: 9.6 * s, ry: 9.2 * s, from: worldA - f * 1.35, to: worldA };
      } else {
        // Mendarat pegas keluar dari putaran roda
        const w = easeOut(cl01((t - 0.78) / 0.22));
        kneeDir = { x: f, y: 0 };
        ffoot = V(lerp(3.4, 2.3, w) * f * s, 0);
        bfoot = V(lerp(-2.6, -2.2, w) * f * s, 0);
        hip = V(lerp(0.7, 0, w) * f * s, lerp(-2.25, -4, w) * s);
        neck = V(lerp(2.0, 0, w) * f * s, lerp(-5.4, -8, w) * s);
        head = V(lerp(2.9, 0, w) * f * s, lerp(-7.9, -11, w) * s);
        fhand = add(neck, V(lerp(3.6, 3.3, w) * f * s, lerp(0.4, 1.2, w) * s));
        bhand = add(neck, V(lerp(-2.8, -1.5, w) * f * s, lerp(0.8, 2.0, w) * s));
      }
      break;
    }
    case 'jump_anticip': {
      // PRINSIP ANTICIPATION (Ancang-ancang): membungkuk rendah 1-2 frame sebelum melompat/salto,
      // lutut tertekuk dalam memuat pegas di lantai, dada condong rendah, kedua tangan terayun ke belakang.
      const q = 0.78 + 0.22 * easeOut(cl01(t));
      kneeDir = { x: f, y: 0 };
      ffoot = V(2.55 * f * s, 0);
      bfoot = V(-2.65 * f * s, 0);
      hip = V(-0.2 * q * f * s, (-4 + 2.2 * q) * s);
      neck = V(2.45 * q * f * s, (-8 + 4.15 * q) * s);
      head = V(3.85 * q * f * s, (-11 + 5.0 * q) * s);
      fhand = V(-2.5 * q * f * s, (-4.2 + 1.5 * q) * s);
      bhand = V(-3.9 * q * f * s, (-4.6 + 1.2 * q) * s);
      break;
    }
    case 'dragontail': {
      // spinning back heel: look over the shoulder, pivot, rear heel sweeps a circle at chest height
      const sp = cl01((t - 0.18) / 0.5);
      const a = o.aim + f * (Math.PI * 0.95 - 2.4 * Math.PI * sp);
      const r = (3.5 + 7 * Math.sin(Math.min(1, sp * 1.25) * Math.PI * 0.5)) * s;
      hip.y -= 1.2 * s; neck.y -= 1.2 * s; head.y -= 1.2 * s;
      bfoot = add(hip, V(Math.cos(a) * r, Math.sin(a) * r * 0.6 - 2.6 * s));
      ffoot = V(1.2 * s * f, 0); kneeUp = 0.8 * s; fkneeBend = f; bkneeBend = -f;
      fhand = add(neck, V(Math.cos(a + Math.PI) * 3.2 * s, Math.sin(a + Math.PI) * 1.9 * s), V(0, 0.6 * s));
      bhand = add(neck, V(Math.cos(a) * 2.2 * s, Math.sin(a) * 1.3 * s), V(0, -1.0 * s));
      head = add(head, V(Math.cos(a) * 1.0 * s, Math.sin(a) * 0.6 * s));
      lean(-0.6, 0.3);
      if (t > 0.2 && t < 0.7) trail = { cx: hip.x, cy: hip.y - 2.6 * s, rx: r * 1.1, ry: r * 0.66, from: o.aim + f * Math.PI * 0.95, to: a };
      break;
    }
    case 'cranekick': {
      // crane: tall on one leg, knee high, arms spread like wings; then the front kick snaps straight out
      const chm = Math.min(1, t / 0.3), snap = kk, back = cl01((t - 0.6) / 0.4);
      stance(0, 0.6);
      ffoot = add(hip, D(1 + 8.5 * snap * (1 - back * 0.7)), V(0, (-3.5 * chm - 1.0 * snap + 4 * (1 - chm) + 4 * back) * s));
      kneeUp = 3.2 * s * chm * (1 - snap); fkneeBend = f;
      bfoot = V(-0.4 * s * f, 0);
      fhand = add(neck, D(5 * chm - 1.5 * snap), V(0, (-5 * chm + 1 * snap) * s)); bhand = add(neck, D(-5 * chm), V(0, (-5 * chm + 1 * snap) * s));
      neck.y -= 1.2 * s * chm; head.y -= 1.4 * s * chm;
      lean(-0.5 * chm + 1.2 * snap, 0.4 * chm);
      break;
    }
    case 'monkeyflip': {
      // BACKFLIP SALTO KICK: ancang-ancang membungkuk rendah di lantai (1-2+ frame) -> tolak keras salto belakang 360° -> mendarat pegas
      if (t < 0.2) {
        const q = easeOut(cl01(t / 0.13));
        kneeDir = { x: f, y: 0 };
        ffoot = V(2.5 * f * s, 0);
        bfoot = V(-2.7 * f * s, 0);
        hip = V(-0.3 * q * f * s, (-4 + 2.15 * q) * s);
        neck = V(2.4 * q * f * s, (-8 + 4.3 * q) * s);
        head = V(3.7 * q * f * s, (-11 + 5.2 * q) * s);
        fhand = V(-2.8 * q * f * s, (-4.2 + 1.6 * q) * s);
        bhand = V(-4.1 * q * f * s, (-4.5 + 1.3 * q) * s);
      } else if (t < 0.78) {
        const ph = cl01((t - 0.2) / 0.58);
        const rot = -f * easeInOut(ph) * Math.PI * 1.92;
        const c = V(0, (-5.4 - 7.4 * Math.sin(ph * Math.PI)) * s);
        const R = (v: Vec): Vec => V(c.x + v.x * Math.cos(rot) - v.y * Math.sin(rot), c.y + v.x * Math.sin(rot) + v.y * Math.cos(rot));
        hip = R(V(0, 1.5 * s)); neck = R(V(0, -2.9 * s)); head = R(V(0, -5.8 * s));
        const ext = Math.sin(cl01(ph / 0.7) * Math.PI);
        ffoot = R(V(f * (5.8 + 3.2 * ext) * s, (-1.8 - 1.6 * ext) * s));
        bfoot = R(V(-f * 1.4 * s, 4.4 * s));
        ffoot.y = Math.min(0, ffoot.y); bfoot.y = Math.min(0, bfoot.y);
        fhand = R(V(-f * 3.2 * s, -0.8 * s)); bhand = R(V(f * 2.6 * s, -4.0 * s));
        fkneeBend = -f;
        if (ph > 0.08 && ph < 0.82) trail = { cx: c.x, cy: c.y, rx: 9.6 * s, ry: 8.8 * s, from: -Math.PI / 2 - f * 0.4, to: -Math.PI / 2 - f * 0.4 + rot };
      } else {
        const w = easeOut(cl01((t - 0.78) / 0.22));
        kneeDir = { x: f, y: 0 };
        ffoot = V(lerp(2.9, 2.2, w) * f * s, 0); bfoot = V(lerp(-2.8, -2.1, w) * f * s, 0);
        hip = V(0, lerp(-2.2, -4, w) * s); neck = V(lerp(1.8, 0, w) * f * s, lerp(-5.2, -8, w) * s);
        head = V(lerp(2.7, 0, w) * f * s, lerp(-7.6, -11, w) * s);
        fhand = add(neck, V(3.0 * f * s, 1.2 * s)); bhand = add(neck, V(-1.8 * f * s, 1.8 * s));
      }
      break;
    }
    case 'flying': {
      if (t < 0.22) {
        // Ancang-ancang rendah sebelum melesat tendangan terbang
        const q = easeOut(cl01(t / 0.16));
        kneeDir = { x: f, y: 0 };
        ffoot = V(2.4 * f * s, 0); bfoot = V(-3.0 * f * s, 0);
        hip = V(-0.4 * q * f * s, (-4 + 2.0 * q) * s);
        neck = V(2.6 * q * f * s, (-8 + 4.1 * q) * s);
        head = V(4.0 * q * f * s, (-11 + 5.0 * q) * s);
        fhand = V(-2.2 * q * f * s, (-4.4 + 1.4 * q) * s);
        bhand = V(-3.8 * q * f * s, (-4.6 + 1.0 * q) * s);
        break;
      }
      const c = V(0, -7.4 * s);
      const wob = Math.sin(o.time * 28) * 0.25 * s;
      hip = add(c, D(-1.6), V(0, wob)); neck = add(c, D(1.2), V(0, -wob)); head = add(neck, D(2.2), V(0, -2.2 * s));
      ffoot = add(hip, D(9.2), V(0, 0.2 * s)); bfoot = add(hip, D(-1.4), V(0, 3.2 * s));
      fhand = add(neck, D(-1.6), V(0, 2.6 * s)); bhand = add(neck, D(-3.4), V(0, -1.6 * s));
      fkneeBend = -f;
      trail = { cx: hip.x, cy: hip.y, rx: 10 * s, ry: 5.5 * s, from: o.aim + f * 0.8, to: o.aim };
      break;
    }
    case 'sidekick': {
      if (t < 0.3) {
        const q = easeOut(t / 0.3);
        hip.y += 2.5 * s * q; neck.y += 3 * s * q; head.y += 3.2 * s * q;
        ffoot = add(V(2.5 * s * f, 0), D(1.5 * q)); bfoot = V(-2.5 * s * f, 0);
        fhand = add(neck, D(2), V(0, 1.5 * s)); bhand = add(neck, D(-2.5 * q), V(0, -1 * s * q));
        lean(-1.2 * q, 0);
      } else {
        const ext = cl01((t - 0.3) / 0.12);
        const c = V(0, -6.5 * s);
        hip = add(c, D(-1.5), P(0.6 * f)); neck = add(c, D(-0.5), V(0, -3.5 * s), P(-0.6 * f)); head = add(neck, D(0.6), V(0, -2.6 * s));
        ffoot = add(hip, D(2 + 7.5 * ext), V(0, -0.5 * s));
        bfoot = add(hip, D(-1.5), V(0, 2.5 * s));
        fhand = add(neck, D(2.5), V(0, 1.5 * s)); bhand = add(neck, D(-3.5), V(0, -0.5 * s));
        fkneeBend = -f; bkneeBend = -f;
        if (t >= 0.3 && t < 0.5) trail = { cx: hip.x, cy: hip.y, rx: 9 * s, ry: 5 * s, from: o.aim + f * 0.9, to: o.aim };
      }
      break;
    }
    case 'jump': {
      if (t < 0.15) {
        // Ancang-ancang membungkuk rendah sebelum menolak lantai
        const q = easeOut(t / 0.15);
        kneeDir = { x: f, y: 0 };
        hip = V(-0.2 * q * f * s, (-4 + 2.2 * q) * s);
        neck = V(2.3 * q * f * s, (-8 + 4.0 * q) * s);
        head = V(3.6 * q * f * s, (-11 + 4.8 * q) * s);
        fhand = V(-2.4 * q * f * s, (-4.2 + 1.5 * q) * s);
        bhand = V(-3.8 * q * f * s, (-4.6 + 1.2 * q) * s);
        ffoot = V(2.55 * s * f, 0); bfoot = V(-2.65 * s * f, 0);
      } else if (t < 0.3) {
        // Tolakan eksplosif: satu lutut menyentak naik, kaki tumpu lurus menolak tanah, tangan mengayun ke atas
        const push = cl01((t - 0.15) / 0.15);
        kneeDir = { x: f, y: 0 };
        hip.y -= 0.9 * s; neck = add(neck, V(0.7 * f * s, -1.2 * s)); head = add(head, V(1.0 * f * s, -1.4 * s));
        ffoot = add(hip, V(2.4 * f * s, (1.8 - 0.5 * push) * s));
        bfoot = add(hip, V(-2.1 * f * s, (5.2 - 1.0 * push) * s));
        fhand = add(neck, V(2.6 * f * s, -2.8 * s));
        bhand = add(neck, V(-2.2 * f * s, -2.1 * s));
        kneeUp = 2.0 * s;
      } else if (t < 0.85) {
        const u = cl01((t - 0.3) / 0.55);
        const tuck = Math.sin(u * Math.PI);
        kneeDir = { x: f, y: 0 };
        hip.y -= 0.6 * s; neck = add(neck, V(0.5 * tuck * f * s, -1.0 * s)); head = add(head, V(0.8 * tuck * f * s, -1.2 * s));
        ffoot = add(hip, D(1.8), V(0, (3.8 - 1.9 * tuck) * s));
        bfoot = add(hip, D(-1.6), V(0, (4.1 - 2.6 * tuck) * s));
        fhand = add(neck, D(2.3), V(0, (-2.0 + 1.4 * tuck) * s));
        bhand = add(neck, D(-2.6), V(0, (-1.5 + 1.0 * tuck) * s));
        kneeUp = 1.8 * s * tuck;
      } else {
        // Mendarat pegas: lutut merendah menyerap hentakan lalu bangkit ke kuda-kuda
        const u = cl01((t - 0.85) / 0.15);
        const dip = Math.sin(u * Math.PI);
        kneeDir = { x: f, y: 0 };
        hip.y += 2.1 * s * dip;
        neck = add(neck, V(1.9 * dip * f * s, 3.3 * s * dip));
        head = add(head, V(2.8 * dip * f * s, 4.0 * s * dip));
        ffoot = V((2.2 + 0.8 * dip) * s * f, 0); bfoot = V((-2.2 - 0.8 * dip) * s * f, 0);
        fhand = add(neck, D(2.4), V(0, (1.1 + 1.4 * dip) * s));
        bhand = add(neck, D(-2.2), V(0, (1.5 + 1.2 * dip) * s));
      }
      break;
    }
    case 'headbutt': {
      // tarik kepala ke belakang, cengkeram kerah lawan, lalu sundul keras ke depan
      stance(-0.8 * ch + 1.4 * kk, 1.3);
      lean(-1.3 * ch + 3.4 * kk, 0.6 * kk);
      head = add(head, D(-1.2 * ch + 2.8 * kk), V(0, 1.1 * s * kk));
      fhand = add(neck, D(3.4), V(0, 0.7 * s)); bhand = add(neck, D(2.8), V(0, 1.5 * s));
      break;
    }
    case 'runpunch': {
      if (t < 0.3) {
        const q = easeOut(t / 0.3);
        stance(-0.5 * q, 1.3);
        bhand = add(neck, D(-3 * q), V(0, -1.6 * s * q)); fhand = add(neck, D(2.5), V(0, 0.5 * s));
        lean(-q, 0);
      } else {
        stance(1.15 * kk, 1.45);
        lean(2.8 * kk, 0.9 * kk); hip = add(hip, D(-0.7 * kk));
        bhand = add(neck, D(1.4 + 9.4 * kk, 1.0)); fhand = add(neck, D(-2.0), V(0, 1.2 * s));
        bfoot = add(bfoot, D(-1.5 * kk), V(0, (sv ? -0.3 : -1.8) * s * kk));
        if (t >= 0.3 && t <= 0.62) trail = { cx: neck.x, cy: neck.y + 0.2 * s, rx: 10.2 * s, ry: 5 * s, from: o.aim + f * 0.4, to: o.aim };
      }
      break;
    }
    // ---------------- nunchaku stances: only the body is posed here; the chain itself is physics ----------------
    case 'n_lowsweep': {
      const cr = 2.2 * s; hip.y += cr; neck.y += cr; head.y += cr;
      const a = o.aim + f * (Math.PI * 0.9 - 2.2 * Math.PI * cl01((t - 0.2) / 0.5));
      fhand = add(hip, V(Math.cos(a) * 5 * s, Math.sin(a) * 3 * s + 1 * s));
      bhand = add(neck, D(-1.5), V(0, 1.5 * s));
      ffoot = V(3.5 * s * f, 0); bfoot = V(-2.5 * s * f, 0);
      break;
    }
    case 'n_tornado': {
      // whole body spins with the chain horizontal at chest height
      const a = o.aim + f * t * Math.PI * 6;
      fhand = add(neck, V(Math.cos(a) * 4.5 * s, Math.sin(a) * 2.7 * s), V(0, 0.5 * s));
      bhand = add(neck, V(Math.cos(a + Math.PI) * 2.5 * s, Math.sin(a + Math.PI) * 1.5 * s), V(0, 1.5 * s));
      hip.y -= 0.8 * s; neck.y -= 0.8 * s; head.y -= 0.8 * s;
      ffoot = V(3 * s * f, 0); bfoot = V(-3 * s * f, 0);
      break;
    }
    case 'n_dragonlash': {
      // leap forward with the chain wound back, then a huge overhead-to-forward smash on landing
      const wind = t < 0.3 ? easeOut(t / 0.3) : 0;
      const smash = t >= 0.3 ? cl01((t - 0.3) / 0.14) : 0;
      const c = V(0, -1.5 * s * smash);
      hip = add(hip, c); neck = add(neck, c); head = add(head, c);
      fhand = add(neck, D(-3 * wind + 6.5 * smash, 2 * wind - 1 * smash), V(0, (-4 * wind + 1 * smash) * s));
      bhand = add(neck, D(-2 + 1 * smash), V(0, 1 * s));
      lean(-1 * wind + 3 * smash, 0.6 * wind + 0.4 * smash);
      ffoot = add(ffoot, D(2.5 * smash)); bfoot = add(bfoot, D(-2 * smash), V(0, -2 * s * wind));
      break;
    }
    case 'n_garrote': {
      // both hands pull the chain tight behind the victim's neck (fatality)
      const q = Math.min(1, t * 2);
      fhand = add(neck, D(3.5, 1.8), P(2.2 * f * q)); bhand = add(neck, D(3.5, 1.6), P(-2.2 * f * q));
      lean(1 + 0.5 * Math.sin(t * 20) * q, -0.3);
      ffoot = add(ffoot, D(1.5)); bfoot = add(bfoot, D(-2.5));
      break;
    }
    case 'n_drum': {
      // rapid alternating overhead strikes
      const ph = Math.sin(t * Math.PI * 8);
      fhand = add(neck, D(2.5 + ph * 1.5, 1.5 + ph * 2.5));
      bhand = add(neck, D(-1.5), V(0, 1.5 * s));
      lean(1.2 + ph * 0.5, 0.3);
      break;
    }
    case 'n_idle': {
      // UNDERARM TUCK: the held stick is clamped under the right (rear) armpit, hand at the ribs; off hand guards
      const br = Math.sin(o.time * 4) * 0.4 * s;
      neck.y += br; head.y += br;
      stance(0.1, 1.0);
      fhand = add(neck, D(0.6), V(0, 2.6 * s), P(0.8 * f)); // rear-side rib tuck (front hand = sword hand holds the stick)
      bhand = add(neck, D(2.2), V(0, 1.0 * s), P(-1.2 * f));
      break;
    }
    // ---- BRUCE LEE TRIANGLE (the hand traces a triangle in front of the chest; the chain physics whips the far stick) ----
    case 'n_tri1': {
      // 1) from the armpit, the hand drives DIAGONALLY DOWN-LEFT across the body
      stance(-0.3 * ch + 0.9 * kp, 1.1);
      fhand = add(neck, D(0.6 - 1.0 * ch + 4.5 * kk), V(0, (2.6 - 1.0 * ch + 3.2 * kk) * s), P((0.8 - 3.6 * kk) * f));
      bhand = add(neck, D(2.0), V(0, 1.0 * s), P(-1.2 * f));
      twist(-0.4 * ch + 1.2 * kk);
      lean(1.2 * kk, 0.3 * kk);
      break;
    }
    case 'n_tri2': {
      // 2) BOUNCE: from low-left the hand whips FORWARD and UP in a rising arc through the target, then settles on the LEFT SHOULDER
      const rise = kk, settle = cl01((t - 0.5) / 0.3);
      stance(0.3 + 0.6 * kp, 1.1);
      fhand = add(neck, D(1.0 + 5.5 * Math.sin(rise * Math.PI * 0.85) - 4.5 * settle), V(0, (5.5 - 9.5 * rise) * s), P((-2.6 + 1.2 * rise - 1.0 * settle) * f));
      bhand = add(neck, D(2.4), V(0, 1.0 * s), P(-1.2 * f));
      twist(0.6 - 1.2 * rise); lean(1.0 * kp, 0.3 * kp);
      head = add(head, P(0.4 * f * rise));
      break;
    }
    case 'n_tri3': {
      // 3) HORIZONTAL SWEEP across the chest from the left shoulder back to the RIGHT
      stance(0.3 + 0.5 * kp, 1.2);
      fhand = add(neck, D(1.0 + 3.0 * Math.sin(kk * Math.PI)), V(0, (-1.4 + 1.0 * kk) * s), P((-1.8 + 4.2 * kk) * f));
      bhand = add(neck, D(2.0 - 1.0 * kk), V(0, 1.2 * s), P(-1.4 * f * (1 - kk)));
      twist(-1.2 + 2.4 * kk);
      head = add(head, P(-0.5 * f * kk));
      lean(0.8 * kp, 0.2 * kp);
      break;
    }
    case 'n_tri4': {
      // 4) CATCH & LOCK: the far stick is caught and clamped back under the right armpit with a short downward smash
      const lock = cl01((t - 0.6) / 0.4);
      stance(0.6 * kp, 1.1);
      fhand = add(neck, D(2.4 - 1.8 * lock + 2.0 * kp), V(0, (-0.4 + 3.0 * lock + 1.5 * kp) * s), P((2.4 - 1.6 * lock) * f));
      bhand = add(neck, D(1.6 + 1.0 * kp), V(0, 1.0 * s), P(-1.2 * f));
      twist(0.8 * kp);
      lean(1.0 * kp, 0.3 * kp); hip.y += 0.6 * s * kp;
      break;
    }
    case 'n_lash': case 'n_cross': {
      const back = o.pose === 'n_cross' ? -1 : 1;
      // hand swings from high-back to front-low; the far stick follows with physics lag
      const sw = -0.45 + 1.45 * kk;
      fhand = add(neck, D(1 + 4.5 * sw, 2.5 - 3.5 * sw), P(back * 1.5 * f * (1 - kk)));
      bhand = add(neck, D(-1), V(0, 1.5 * s));
      lean(1.6 * kp, 0.4 * kp);
      ffoot = add(ffoot, D(1.5 * kp)); bfoot = add(bfoot, D(-1 * kp));
      break;
    }
    case 'n_figure8': {
      // Figure-8 infinity weave: pinggang dan bahu ikut mengayun mengikuti pola ∞, tangan belakang membentuk guard telapak kung-fu
      const ph = t * Math.PI * 4;
      const sway = Math.sin(ph);
      stance(0.2 + 0.35 * sway, 1.25);
      twist(0.85 * sway);
      fhand = add(neck, D(5.4 + Math.sin(ph) * 2.2), P(Math.sin(ph * 2) * 2.4 * f), V(0, (0.4 + Math.cos(ph * 2) * 1.6) * s));
      bhand = add(neck, D(2.1 - 0.6 * sway, -0.35), V(0, (0.5 + 0.4 * Math.cos(ph)) * s), P(-1.3 * f));
      lean(0.95 + 0.3 * Math.abs(sway), 0.25);
      if (t > 0.1 && t < 0.9) trail = { cx: neck.x + 3.2 * f * s, cy: neck.y + 0.5 * s, rx: 6.2 * s, ry: 4.5 * s, from: ph - 1.4, to: ph };
      break;
    }
    case 'n_backpass': {
      // AROUND-THE-BACK WAIST PASS (Operan Belakang Punggung):
      // Badan memutar eksotis, tangan depan mengoper rantai melewati belakang pinggang ke tangan satunya, lalu menyabet maju!
      const pass = cl01(t / 0.52), snap = cl01((t - 0.48) / 0.52);
      const a = o.aim + f * (Math.PI * 1.1 - pass * Math.PI * 1.35 + snap * 0.65);
      stance(-0.4 * Math.sin(pass * Math.PI) + 0.95 * snap, 1.35);
      twist(-1.35 * Math.sin(pass * Math.PI) + 1.65 * snap);
      fhand = add(hip, V(Math.cos(a) * (3.8 + 3.4 * snap) * s, Math.sin(a) * 2.2 * s + (-1.5 - 2.2 * snap) * s));
      // Tangan belakang menyambut di pinggang belakang saat operan (t ~ 0.3..0.6), lalu membuka guard saat sabetan
      bhand = pass < 0.85
        ? add(hip, D(-2.4 * Math.sin(pass * Math.PI)), V(0, -1.2 * s), P(1.6 * f))
        : add(neck, D(1.8), V(0, 0.7 * s), P(-1.4 * f));
      lean(-0.55 * Math.sin(pass * Math.PI) + 1.45 * snap, 0.3 * snap);
      if (snap > 0.1) trail = { cx: hip.x, cy: hip.y - 2 * s, rx: 8.8 * s, ry: 4.8 * s, from: a - f * 1.3, to: a };
      break;
    }
    case 'n_sidespin': {
      // SIDE TORNADO WHEEL: putaran roda samping dengan langkah silang kung-fu & poros pinggang rendah
      const ph = t * Math.PI * 4;
      const turn = Math.sin(t * Math.PI * 2);
      stance(0.45 * turn, 1.38);
      hip.y += 0.65 * s;
      twist(1.25 * turn);
      fhand = add(neck, D(4.8 + Math.cos(ph) * 2.5), V(0, (Math.sin(ph) * 3.8 + 0.4) * s), P(turn * 1.8 * f));
      bhand = add(neck, D(-1.8 * turn + 1.2), V(0, (0.8 - 0.6 * turn) * s), P(-1.5 * f));
      lean(1.05 + 0.35 * Math.abs(turn), 0.3);
      if (t > 0.12 && t < 0.88) trail = { cx: neck.x + 2.8 * f * s, cy: neck.y + 0.4 * s, rx: 7.4 * s, ry: 6.4 * s, from: ph - 1.5, to: ph };
      break;
    }
    case 'n_toss': {
      // AERIAL TOSS & SNAP CATCH: melempar nunchaku berputar ke atas sambil kuda-kuda crane/shaolin, lalu menangkap & menyentak!
      const up = cl01(t / 0.48), catchSnap = cl01((t - 0.48) / 0.52);
      stance(-0.35 * Math.sin(up * Math.PI) + 1.05 * catchSnap, 1.28);
      if (t < 0.5) {
        const lift = Math.sin(up * Math.PI);
        fhand = add(neck, D(2.8 + 1.5 * lift, 2.2 * lift), V(0, -3.6 * lift * s));
        bhand = add(neck, D(1.8), V(0, (-1.2 * lift + 0.6) * s), P(-1.3 * f));
        lean(-0.5 * lift, 0.45 * lift);
        head = add(head, V(0, -0.7 * lift * s)); // pandangan mengikuti lemparan nunchaku ke atas
      } else {
        const e2 = easeOut(catchSnap);
        twist(1.5 * e2);
        fhand = add(neck, D(2.2 + 5.2 * e2, 0.8 * (1 - e2)), V(0, (1.8 * e2 - 1.2) * s));
        bhand = add(neck, D(1.4 - 2.0 * e2), V(0, 1.4 * s), P(-1.4 * f));
        lean(1.65 * e2, 0.35 * e2);
        if (catchSnap < 0.8) trail = { cx: neck.x, cy: neck.y, rx: 9.2 * s, ry: 5.5 * s, from: o.aim - f * 1.2, to: o.aim + f * 0.2 };
      }
      break;
    }
    case 'n_neckwrap': {
      // NECK WRAP & UNDERARM LOCK (Atraksi khas Bruce Lee):
      // Memutar rantai melingkari leher/bahu lalu menangkap dan menguncinya rapat di bawah ketiak sambil tatapan tajam!
      const wrap = cl01(t / 0.62), lock = easeOut(cl01((t - 0.58) / 0.42));
      stance(0.25 * wrap - 0.45 * lock, 1.32);
      const wa = wrap * Math.PI * 3;
      twist(Math.sin(wa) * 0.85 * (1 - lock) - 0.55 * lock);
      fhand = mix(
        add(neck, D(1.6 + Math.cos(wa) * 2.4), V(0, (-2.6 + Math.sin(wa) * 1.8) * s)),
        add(neck, D(0.5), V(0, 2.5 * s), P(0.9 * f)),
        lock,
      );
      bhand = mix(
        add(neck, D(2.2 - Math.cos(wa) * 1.8), V(0, (-1.4 - Math.sin(wa) * 1.2) * s)),
        add(neck, D(3.4, -0.45), V(0, 0.3 * s), P(-1.2 * f)), // telapak depan terangkat siaga ala Bruce Lee!
        lock,
      );
      lean(0.35 * (1 - lock) + 0.15 * lock, 0.2 * lock);
      break;
    }
    case 'n_overhead': {
      // both hands raise the grip overhead, then slam down
      const up = t < 0.3 ? easeOut(t / 0.3) : Math.max(0, 1 - (t - 0.3) / 0.12);
      const dn = t >= 0.3 ? cl01((t - 0.3) / 0.15) : 0;
      stance(-0.35 * up + 1.15 * dn, 1.35);
      fhand = add(neck, D(-1.2 * up + 5.4 * dn, 0), V(0, (-7 * up + 3 * dn) * s));
      bhand = add(fhand, P(-1.2 * f), V(0, 0.5 * s));
      twist(-0.7 * up + 1.5 * dn);
      lean(-1 * up + 2.5 * dn, 0.5 * up - 0.6 * dn);
      hip.y += 1.2 * s * dn;
      ffoot = add(ffoot, D(2 * dn)); bfoot = add(bfoot, D(-1.5 * dn));
      break;
    }
    case 'n_helicopter': {
      // HELICOPTER HALO: tangan terangkat memutar baling-baling di atas kepala, kuda-kuda kung-fu bergeser dinamis
      const ph = t * Math.PI * 6;
      const wob = Math.sin(ph) * 0.75 * s;
      stance(0.3 * Math.sin(t * Math.PI * 2), 1.34);
      twist(0.8 * Math.sin(ph));
      fhand = add(neck, V(Math.cos(ph) * 2.2 * s, -5.8 * s + Math.sin(ph) * 0.9 * s), D(1.4));
      bhand = add(neck, D(2.2, -0.2), V(0, 1.2 * s), P(-1.4 * f));
      neck.x += wob * 0.7; head.x += wob * 0.9;
      if (t > 0.1 && t < 0.9) trail = { cx: neck.x + 1.2 * f * s, cy: neck.y - 5.5 * s, rx: 7.8 * s, ry: 3.2 * s, from: ph - 1.8, to: ph };
      break;
    }
    case 'n_whipcrack': {
      // ENTER THE DRAGON WHIP CRACK: tarik dalam ke belakang bahu, lecut penuh ke depan, lalu kunci di ketiak di akhir!
      const q = t < 0.28 ? easeOut(t / 0.28) : 0;
      const lock = cl01((t - 0.74) / 0.26);
      stance(-0.55 * q + 1.25 * kk - 0.4 * lock, 1.38);
      twist(-0.9 * q + 1.95 * kk - 0.6 * lock);
      const strikeHand = t < 0.28 ? add(neck, D(-2.8 * q, 2.6 * q)) : add(neck, D(2.4 + 5.4 * kk, 0.5 + 1.0 * kk));
      const tuckHand = add(neck, D(0.6), V(0, 2.5 * s), P(0.8 * f));
      fhand = mix(strikeHand, tuckHand, lock);
      bhand = add(neck, D(1.8 - 2.6 * kk + 2.8 * lock), V(0, (1.2 - 0.4 * lock) * s), P(-1.4 * f));
      lean(-1.2 * q + 2.6 * kk * (1 - 0.6 * lock), 0.5 * kk);
      ffoot = add(ffoot, D(2.2 * kk * (1 - 0.5 * lock))); bfoot = add(bfoot, D(-1.8 * kk * (1 - 0.5 * lock)));
      hip.y += 0.85 * s * kk;
      if (t >= 0.26 && t <= 0.66) trail = { cx: neck.x, cy: neck.y - 0.4 * s, rx: 10.8 * s, ry: 5.6 * s, from: o.aim - f * 1.4, to: o.aim + f * 0.3 };
      break;
    }
    case 'n_choke': {
      // wrap the chain around the neck (0-0.3), then slam them down over the shoulder (0.3-0.6)
      const grab = cl01(t / 0.3), slam = cl01((t - 0.3) / 0.2);
      fhand = add(neck, D(4 - 2 * slam, 2 - 4 * slam), P(1.5 * f * grab));
      bhand = add(neck, D(4 - 2 * slam, 1.5 - 3.5 * slam), P(-1.5 * f * grab));
      lean(1.5 * grab - 2.5 * slam, 0.3 - 1.0 * slam);
      hip.y += 1.5 * s * slam;
      ffoot = add(ffoot, D(1.5)); bfoot = add(bfoot, D(-1.5));
      break;
    }
    // ---------------- katana stances (the blade itself is drawn from the sword hand along bladeDir) ----------------
    case 'k_idle': {
      // chudan (middle guard): both hands on the hilt, blade forward
      const br = Math.sin(o.time * 4) * 0.4 * s;
      neck.y += br; head.y += br;
      fhand = add(neck, D(3.2, -0.2), V(0, 1.5 * s)); bhand = add(fhand, D(-1.2), V(0, 0.8 * s));
      ffoot = V(2.8 * s * f, 0); bfoot = V(-2.2 * s * f, 0);
      lean(0.4, 0);
      break;
    }
    case 'k_sheathe': {
      // chiburi + noto: flick the blade, then slide it home at the hip
      const q = cl01(t);
      fhand = add(hip, D(-1 + 2 * q), V(0, (-2 + 1 * q) * s), P(-1.5 * f)); bhand = add(hip, D(-2.5), V(0, -1 * s), P(-1.8 * f));
      lean(0.2, 0); head = add(head, D(0.5));
      ffoot = V(2.6 * s * f, 0); bfoot = V(-2.4 * s * f, 0);
      break;
    }
    case 'k_draw': {
      // iai: hand at the hip on the far side, explosive horizontal draw across the body
      const sw = -0.5 + 1.5 * kk;
      fhand = add(hip, D(-1 + 5.5 * sw, 3 + 1.5 * sw), P((2.5 - 3.5 * kk) * f));
      bhand = add(hip, D(-2), V(0, -0.5 * s), P(-1.5 * f)); // off hand holds the scabbard
      lean(1.8 * kp, 0.3 * kp); hip.y += 0.6 * s * kp;
      ffoot = add(ffoot, D(2.5 * kp)); bfoot = add(bfoot, D(-1 * kp));
      break;
    }
    case 'k_return': {
      const sw = -0.4 + 1.4 * kk;
      fhand = add(neck, D(1 + 4 * sw, 0.5), P((-2.5 + 3.5 * kk) * f));
      bhand = add(fhand, D(-1.2), V(0, 0.8 * s));
      lean(1.2 * kp, 0.2 * kp);
      ffoot = add(ffoot, D(1.5 * kp));
      break;
    }
    case 'k_crescent': {
      // big two-handed horizontal arc, body pivots with it
      const a = o.aim + f * (1.9 - 3.4 * kk);
      fhand = add(neck, V(Math.cos(a) * 4.5 * s, Math.sin(a) * 2.7 * s), V(0, 1 * s));
      bhand = add(fhand, V(-Math.cos(a) * 1.3 * s, -Math.sin(a) * 0.8 * s), V(0, 0.7 * s));
      lean(1.5 * kp, 0.3 * kp);
      neck = add(neck, P(-f * 0.8 * kk)); head = add(head, P(-f * 1.0 * kk));
      ffoot = add(ffoot, P(f * 1.2 * kk), D(1 * kp)); bfoot = add(bfoot, D(-1));
      break;
    }
    case 'k_heaven': {
      // jodan: blade raised high overhead (0-0.3), then a straight vertical cut that ends at the knee
      const up = t < 0.3 ? easeOut(t / 0.3) : Math.max(0, 1 - (t - 0.3) / 0.1);
      const dn = t >= 0.3 ? cl01((t - 0.3) / 0.1) : 0;
      fhand = add(neck, D(-1.5 * up + 5.5 * dn, 0), V(0, (-6.5 * up + 2.5 * dn) * s));
      bhand = add(fhand, D(-1.2), V(0, 0.8 * s));
      lean(-1.2 * up + 2.6 * dn, 0.6 * up - 0.8 * dn);
      hip.y += 1.5 * s * dn;
      ffoot = add(ffoot, D(2.5 * dn)); bfoot = add(bfoot, D(-1.5 * dn));
      break;
    }
    case 'k_thrust': {
      // tsuki: blade drawn back along the hip then driven straight forward with a long lunge
      const sw = -0.6 + 1.6 * kk;
      fhand = add(neck, D(1 + 4.5 * sw, 0.2), V(0, 1.5 * s));
      bhand = add(fhand, D(-1.5), V(0, 0.5 * s));
      lean(3 * kp, 1.0 * kp); hip.y += 1 * s * kp;
      ffoot = add(ffoot, D(3 * kp)); bfoot = add(bfoot, D(-2.5 * kp));
      break;
    }
    case 'k_rising': {
      // kiri-age: from low-back to high-front, upward diagonal cut
      fhand = add(neck, D(-1 + 4 * kk, 0), V(0, (4 - 9 * kk) * s));
      bhand = add(fhand, D(-1.2), V(0, 1 * s));
      lean(1.2 * kk, 0.2); hip.y += 1.5 * s * (1 - kk);
      ffoot = add(ffoot, D(2 * kk)); bfoot = add(bfoot, D(-1.5));
      break;
    }
    case 'k_whirlwind': {
      // two full spins with the blade out horizontally
      const a = o.aim + f * t * Math.PI * 4;
      fhand = add(neck, V(Math.cos(a) * 4.5 * s, Math.sin(a) * 2.7 * s), V(0, 0.8 * s));
      bhand = add(fhand, V(-Math.cos(a) * 1.3 * s, -Math.sin(a) * 0.8 * s), V(0, 0.6 * s));
      hip.y -= 0.6 * s; neck.y -= 0.6 * s; head.y -= 0.6 * s;
      ffoot = V(3 * s * f, 0); bfoot = V(-3 * s * f, 0);
      break;
    }
    case 'k_thousand': {
      // flurry: short fast alternating diagonal cuts
      const ph = t * Math.PI * 10;
      fhand = add(neck, D(3 + Math.sin(ph) * 1.5, 0.4), V(0, (1 + Math.cos(ph) * 2.2) * s));
      bhand = add(fhand, D(-1.2), V(0, 0.8 * s));
      lean(1.5, 0.4);
      ffoot = add(ffoot, D(2)); bfoot = add(bfoot, D(-1.5));
      break;
    }
    case 'k_dragonfang': {
      // enormous wind-up behind the back, then a diagonal descending cut with a step-through
      const wind = t < 0.3 ? easeOut(t / 0.3) : 0;
      const cut = t >= 0.3 ? cl01((t - 0.3) / 0.12) : 0;
      fhand = add(neck, D(-3.5 * wind + 5.5 * cut, 0), V(0, (-5 * wind + 2.5 * cut) * s), P(2 * f * wind));
      bhand = add(fhand, D(-1.3), V(0, 0.8 * s));
      lean(-1.5 * wind + 3 * cut, 0.8 * wind - 0.6 * cut);
      hip.y += 1.5 * s * cut;
      ffoot = add(ffoot, D(3 * cut)); bfoot = add(bfoot, D(-2 * cut));
      break;
    }
    case 'k_iaijutsu': {
      // dash-through with the blade held low and flat; the cut happens during travel
      const c = V(0, -0.5 * s);
      hip = add(hip, c); neck = add(neck, c); head = add(head, c);
      lean(3.5, 1.2); hip = add(hip, D(-1.2));
      fhand = add(neck, D(4.5, -0.5), V(0, 2 * s)); bhand = add(hip, D(-2.5), V(0, -0.5 * s));
      ffoot = add(ffoot, D(2.5)); bfoot = add(bfoot, D(-3.5), V(0, -1.5 * s));
      break;
    }
    // ---------------- AXE: two-handed, heavy, big wind-ups ----------------
    case 'a_idle': {
      // batter's stance: knees bent, hands up by the rear shoulder, bat cocked, little waggle
      const br = Math.sin(o.time * 4) * 0.4 * s, wag = Math.sin(o.time * 2.6) * 0.5 * s;
      neck.y += br; head.y += br;
      stance(-0.2, 1.5); hip.y += 0.8 * s;
      fhand = add(neck, D(-0.6), V(0, (-0.8 + wag * 0.3) * s), P(1.8 * f)); bhand = add(fhand, D(-0.8), V(0, 1.0 * s), P(-0.6 * f));
      twist(-0.5); head = add(head, D(0.6));
      break;
    }
    // ---- BASEBALL SWINGS: batter's stance, load over the rear shoulder, stride, hips lead, contact out front, wrap-around follow-through
    case 'a_swing1': case 'a_swing2': case 'a_homerun': {
      const back = o.pose === 'a_swing2' ? -1 : 1; // swing1/homerun: forehand (from the rear shoulder), swing2: backhand (from the front shoulder)
      const big = o.pose === 'a_homerun' ? 1.25 : 1;
      const load = ch, sw = kk, thru = cl01((t - 0.6) / 0.4);
      // hands travel on an arc around the chest: loaded behind the shoulder (-), through contact in front (0), wrapped around the far side (+)
      const a = o.aim + f * back * (2.3 * (0.6 + 0.4 * load) - (2.3 + 2.6) * sw * big * 0.75 - 1.0 * thru);
      const r = (3.2 + 1.8 * Math.sin(Math.min(1, sw * 1.2) * Math.PI)) * s;
      stance(-0.6 * load + 1.1 * sw - 0.3 * thru, 1.4);
      fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (-1.4 * load + 0.6 * sw + 0.4 * thru) * s));
      bhand = add(fhand, V(-Math.cos(a) * 1.4 * s, -Math.sin(a) * 0.9 * s), V(0, 0.6 * s)); // both hands on the handle
      twist(-1.0 * back * load + 1.8 * back * sw - 0.6 * back * thru);
      head = add(head, P(0.5 * f * back * sw)); // eyes follow the ball
      lean(-0.5 * load + 1.4 * sw, 0.3 * sw);
      hip.y += 0.8 * s * load; // sit into the load
      bfoot = add(bfoot, P(0.9 * f * back * sw)); // rear heel pivots ('squish the bug')
      if (t >= 0.3 && t <= 0.62) trail = { cx: neck.x, cy: neck.y + 0.3 * s, rx: r * 2.2 * big, ry: r * 1.3 * big, from: o.aim + f * back * 2.3, to: a };
      break;
    }
    // ===== STREET BAT (brawler, not batter): wild haymakers, overhead smash, knob jab, uppercut, curb smash, taunt =====
    // ================= BOXING =====================================================================
    // Tiga gaya dengan bahasa tubuh berbeda: Ali mengapung, Tyson merunduk (peek-a-boo),
    // Ippo menekan. Ritme (bounce/weave/step) datang dari modul Boxing lewat o.box.
    case 'bx_ali': case 'bx_peek': case 'bx_ippo':
    case 'bx_float': case 'bx_weave': case 'bx_press': {
      const bi = o.box ?? { stance: 'ali' as const, weaveX: 0, weaveY: 0, step: 0, clock: o.time };
      const st = bi.stance;
      const mv = o.pose === 'bx_float' || o.pose === 'bx_weave' || o.pose === 'bx_press';
      const bt = bi.clock * (st === 'tyson' ? 4.4 : st === 'ippo' ? 3.6 : 5.4);
      const stepPh = bi.step * Math.PI * 2;
      const crouch = st === 'tyson' ? 1 : st === 'ippo' ? 0.45 : 0;
      // lutut selalu menekuk ke arah hadap / arah langkah, tidak pernah ke belakang
      kneeDir = mv && o.vel && Math.hypot(o.vel.x, o.vel.y) > 0.06
        ? { x: o.vel.x, y: o.vel.y * 0.6 }
        : { x: dx, y: dy * 0.6 };

      // ---- kaki: tiap gaya punya pola langkah sendiri ----
      if (st === 'ali') {
        // Ali Shuffle: dua ketukan cepat, kaki depan menyapu, tumit tak pernah turun
        const tapA = Math.sin(stepPh), tapB = Math.sin(stepPh + Math.PI);
        const hop = Math.abs(Math.sin(bt * 0.5)) * (mv ? 0.9 : 0.55);
        ffoot = add(D(2.6 + tapA * (mv ? 2.4 : 0.7)), P(1.5 * f), V(0, -hop * s));
        bfoot = add(D(-2.4 + tapB * (mv ? 2.0 : 0.6)), P(-1.5 * f), V(0, -hop * 0.7 * s));
        hip.y -= (0.5 + hop * 0.5) * s;
        // sedikit menyamping: mengambang, bukan berjalan lurus
        const drift = Math.sin(bt * 0.5) * (mv ? 1.1 : 0.6);
        hip = add(hip, P(drift * f)); neck = add(neck, P(drift * 1.2 * f)); head = add(head, P(drift * 1.4 * f));
        kneeUp = 0.5;
      } else if (st === 'tyson') {
        // peek-a-boo: jongkok lebar, langkah pendek menyeret, berat berpindah kiri-kanan
        const sway = Math.sin(bt);
        ffoot = add(D(2.0 + (mv ? Math.sin(stepPh) * 1.5 : 0)), P(2.3 * f));
        bfoot = add(D(-2.2 + (mv ? Math.sin(stepPh + Math.PI) * 1.5 : 0)), P(-2.3 * f));
        hip.y += 2.3 * s;
        hip = add(hip, P(sway * 1.5 * f));
        neck = add(neck, P(sway * 1.9 * f)); head = add(head, P(sway * 2.3 * f));
        kneeUp = 1.2;
      } else {
        // Ippo: kuda-kuda menekan, langkah menggaruk ke depan
        const drive = mv ? Math.sin(stepPh) : Math.sin(bt) * 0.25;
        ffoot = add(D(2.9 + drive * (mv ? 2.2 : 0.5)), P(1.7 * f));
        bfoot = add(D(-2.6 - drive * (mv ? 1.4 : 0.3)), P(-1.7 * f));
        hip.y += 1.0 * s;
        kneeUp = 0.7;
      }

      // ---- badan: merunduk + bob-and-weave ----
      const uY = st === 'tyson' ? (1 - Math.cos(bt)) * 0.55 : Math.abs(Math.sin(bt)) * 0.3;
      neck.y += (crouch * 1.5 + uY) * s;
      head.y += (crouch * 2.0 + uY * 1.2) * s;
      neck = add(neck, P(bi.weaveX * 0.35 * f)); head = add(head, P(bi.weaveX * 0.5 * f));
      lean(st === 'ippo' ? 1.5 : st === 'tyson' ? 1.0 : 0.3, st === 'ali' ? 0.4 : -0.2);
      twist(st === 'ali' ? Math.sin(bt * 0.5) * 0.5 : 0.5);

      // Kuda-kuda tinju: kaki depan menunjuk lawan, kaki belakang membuka ~45 derajat.
      // Saat melangkah, sepatu otomatis mengikuti arah gerak (ditangani di akhir solvePose).
      if (!mv) {
      }

      // ---- tangan: Ali rendah & longgar, Tyson/Ippo sarung rapat di pipi ----
      if (st === 'ali') {
        // tangan RENDAH dan terpisah jelas: sarung depan menjulur, belakang di dekat dagu
        const swing = Math.sin(bt) * 0.45;
        fhand = add(neck, D(4.8), V(0, (3.0 + swing) * s), P(2.5 * f));
        bhand = add(neck, D(0.1), V(0, (3.5 - swing) * s), P(-2.5 * f));
      } else if (st === 'tyson') {
        // peek-a-boo: kedua sarung mengapit pipi, kepala mengintip di antaranya
        fhand = add(head, D(1.9), V(0, 0.5 * s), P(2.7 * f));
        bhand = add(head, D(1.5), V(0, 0.8 * s), P(-2.7 * f));
      } else {
        // Ippo: guard tinggi rapat tapi sedikit menjorok ke depan
        fhand = add(head, D(2.6), V(0, 0.9 * s), P(2.5 * f));
        bhand = add(head, D(1.2), V(0, 1.3 * s), P(-2.5 * f));
      }
      break;
    }
    case 'bx_jab': {
      // FLICKER JAB — dilecut dari bawah, bahu depan menutup dagu, kaki depan menginjak masuk.
      const ext = smooth(kp), back = smooth(cl01((t - 0.62) / 0.38));
      const drive = ext * (1 - back * 0.75);
      stance(-0.55 * ch + 1.0 * drive, 1.2);
      twist(-0.5 * ch + 1.15 * drive);
      fhand = add(neck, D(1.2 - 2.4 * ch + 10.2 * drive, -0.5 + 1.7 * drive), P(0.5 * f * (1 - drive)));
      bhand = add(head, D(1.4), V(0, 0.6 * s), P(-2.4 * f));
      head = add(head, D(0.5 * drive), V(0, -0.2 * drive * s));
      lean(-0.45 * ch + 1.6 * drive, 0.18 * drive);
      ffoot = add(ffoot, D(1.5 * drive));
      bfoot = add(bfoot, V(0, -0.7 * drive * s));            // tumit belakang terangkat
      if (drive > 0.15) trail = { cx: neck.x, cy: neck.y + 0.4 * s, rx: 9.6 * s, ry: 3.8 * s, from: o.aim + f * 0.18, to: o.aim };
      break;
    }
    case 'bx_cross': {
      // STRAIGHT RIGHT — pinggul memutar penuh, tumit belakang berputar keluar, kepala menyipit.
      const ext = smooth(kp), back = smooth(cl01((t - 0.6) / 0.4));
      const drive = ext * (1 - back * 0.8);
      stance(-0.8 * ch + 1.35 * drive, 1.35);
      twist(-0.95 * ch + 1.85 * drive);
      bhand = add(neck, D(-1.6 - 1.8 * ch + 11.4 * drive, 0.5 + 0.6 * drive), P(-1.6 * f * (1 - drive)));
      fhand = add(head, D(1.2 - 0.5 * drive), V(0, 0.6 * s), P(2.3 * f));
      head = add(head, D(0.4 * drive), P(0.7 * f * drive));   // slip dari garis tengah
      lean(-0.5 * ch + 2.0 * drive, 0.2 * drive);
      bfoot = add(bfoot, V(0, -1.1 * drive * s), D(0.5 * drive));
      if (drive > 0.2) trail = { cx: neck.x, cy: neck.y + 0.3 * s, rx: 10.4 * s, ry: 4 * s, from: o.aim - f * 0.26, to: o.aim };
      break;
    }
    case 'bx_lhook': {
      // LEFT HOOK — siku setinggi bahu, kaki depan menggiling, badan memutar melewati sasaran.
      const sw = smooth(kk), thru = smooth(cl01((t - 0.66) / 0.34));
      const swing = sw * (1 - thru * 0.35);
      const a = o.aim + f * (1.65 * (0.35 + 0.65 * ch) - 2.75 * swing);
      const r = (4.2 + 3.6 * Math.sin(Math.min(1, swing) * Math.PI)) * s;
      stance(-0.5 * ch + 1.05 * swing, 1.4);
      fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (-1.1 - 0.2 * ch + 0.3 * swing) * s));
      bhand = add(head, D(1.3), V(0, 0.6 * s), P(-2.4 * f));
      twist(-0.85 * ch + 2.05 * swing);
      lean(-0.3 * ch + 1.25 * swing, 0.12 * swing);
      head = add(head, P(-0.5 * f * swing));
      ffoot = add(ffoot, D(0.6 * swing));
      if (swing > 0.12 && swing < 0.95) trail = { cx: neck.x, cy: neck.y - 0.2 * s, rx: 7.8 * s, ry: 4.6 * s, from: a + f * 0.8, to: a };
      break;
    }
    case 'bx_upper': {
      // UPPERCUT — turun ke lutut dulu, lalu seluruh badan mendorong ke atas.
      const ext = smooth(kp), back = smooth(cl01((t - 0.64) / 0.36));
      const drive = ext * (1 - back * 0.7);
      const dip = ch * 1.1 + Math.max(0, 0.45 - kp) * 1.3;
      stance(-0.6 * ch + 0.85 * drive, 1.3);
      hip.y += (dip * 1.8 - drive * 1.2) * s;
      neck.y += (dip * 1.4 - drive * 1.6) * s;
      head.y += (dip * 1.2 - drive * 1.8) * s;
      bhand = add(neck, D(1.0 + 5.6 * drive, -2.0 * ch + 6.0 * drive), P(-1.1 * f * (1 - drive * 0.6)));
      fhand = add(head, D(1.3), V(0, 0.5 * s), P(2.4 * f));
      twist(-0.7 * ch + 1.5 * drive);
      lean(0.55 * drive, 1.0 * drive);
      kneeUp = 1.0 * ch;
      bfoot = add(bfoot, V(0, -1.3 * drive * s));
      if (drive > 0.1) trail = { cx: neck.x + 2 * s, cy: neck.y + 0.5 * s, rx: 5.2 * s, ry: 6.8 * s, from: o.aim + f * 1.25, to: o.aim - f * 0.35 };
      break;
    }
    case 'bx_body': {
      // BODY BLOW — turun level dengan lutut (bukan membungkuk), sarung menghunjam ke rusuk.
      const ext = smooth(kp), back = smooth(cl01((t - 0.6) / 0.4));
      const drive = ext * (1 - back * 0.8);
      const dip = 0.55 + ch * 0.8;
      stance(-0.4 * ch + 1.0 * drive, 1.3);
      hip.y += dip * 2.0 * s; neck.y += dip * 1.7 * s; head.y += dip * 1.4 * s;
      fhand = add(neck, D(0.8 - 1.8 * ch + 8.6 * drive, -1.7 + 0.9 * drive), P(0.7 * f * (1 - drive)));
      bhand = add(head, D(1.3), V(0, 0.6 * s), P(-2.4 * f));
      twist(-0.6 * ch + 1.35 * drive);
      lean(0.45 + 1.2 * drive, -0.55 * drive);
      head = add(head, P(0.6 * f * drive));
      kneeUp = 1.1;
      break;
    }
    case 'bx_smash': {
      // SMASH — tangan kanan naik tinggi, berat ke belakang, lalu dihantam turun melewati sasaran.
      const rise = smooth(ch), drop = smooth(kk), thru = smooth(cl01((t - 0.7) / 0.3));
      const crash = drop * (1 - thru * 0.3);
      stance(-0.75 * rise + 1.5 * crash, 1.45);
      bhand = add(neck, D(-1.2 - 1.4 * rise + 9.0 * crash, 5.0 * rise - 2.6 * crash), P(-1.7 * f * (1 - crash)));
      fhand = add(head, D(1.2), V(0, 0.7 * s), P(2.3 * f));
      twist(-1.05 * rise + 2.0 * crash);
      lean(-0.65 * rise + 2.3 * crash, 0.9 * rise - 0.6 * crash);
      hip.y += (0.5 * crash) * s;
      bfoot = add(bfoot, V(0, -1.0 * crash * s), D(0.7 * crash));
      if (crash > 0.1) trail = { cx: neck.x, cy: neck.y - 1.6 * s, rx: 8.8 * s, ry: 6.8 * s, from: o.aim - f * 1.15, to: o.aim + f * 0.3 };
      break;
    }
    case 'bx_gazelle': {
      // GAZELLE PUNCH — muat rendah, melompat, seluruh badan terentang di udara, hook dari bawah.
      const load = smooth(cl01(t / 0.22)), air = Math.sin(cl01((t - 0.14) / 0.72) * Math.PI);
      const sw = smooth(kk);
      const a = o.aim + f * (1.35 - 2.7 * sw);
      const r = (4.4 + 5.6 * sw) * s;
      hip.y += (load * 1.6 - air * 3.0) * s;
      neck.y += (load * 1.3 - air * 3.3) * s;
      head.y += (load * 1.1 - air * 3.4) * s;
      ffoot = add(D(3.2 + 2.6 * sw), V(0, (load * 1.2 - air * 4.0) * s), P(1.5 * f));
      bfoot = add(D(-3.4 - 1.8 * sw), V(0, (load * 1.0 - air * 4.8) * s), P(-1.5 * f));
      fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (1.8 - 3.4 * sw) * s));
      bhand = add(head, D(1.1), V(0, 0.6 * s), P(-2.4 * f));
      twist(-0.7 * ch + 2.2 * sw);
      lean(0.7 + 2.1 * sw, 0.7 * air);
      kneeUp = 1.5 * air;
      if (sw > 0.1) trail = { cx: neck.x, cy: neck.y, rx: 9.8 * s, ry: 5.6 * s, from: a + f * 0.95, to: a };
      break;
    }
    case 'bx_dempsey': {
      // DEMPSEY ROLL — badan menggambar angka 8, hook kiri-kanan bergantian, kaki menggeser cepat.
      const cyc = t * Math.PI * 6;
      const fig = Math.sin(cyc), fig2 = Math.sin(cyc * 2);
      const side = fig >= 0 ? 1 : -1;
      const punch = smooth(Math.abs(fig));
      const depth = Math.abs(fig2);
      stance(0.45 + 0.55 * punch, 1.35);
      hip = add(hip, P(fig * 2.2 * f), V(0, depth * 1.2 * s));
      neck = add(neck, P(fig * 3.2 * f), V(0, (1.1 + depth * 1.5) * s));
      head = add(head, P(fig * 3.8 * f), V(0, (1.3 + depth * 1.7) * s));
      const reach = 2.6 + 7.4 * punch;
      fhand = add(neck, D(side > 0 ? reach : 1.4, 0.3 + 0.4 * punch), P((side > 0 ? 0.7 : 2.2) * f));
      bhand = add(neck, D(side < 0 ? reach : 1.2, 0.4 + 0.4 * punch), P((side < 0 ? -0.7 : -2.2) * f));
      twist(fig * 1.7);
      lean(1.5 + 0.9 * punch, -0.25);
      // kaki menggeser mengikuti putaran badan
      ffoot = add(ffoot, P(fig * 0.7 * f), D(0.5 * punch));
      bfoot = add(bfoot, P(fig * 0.5 * f), V(0, -0.5 * Math.max(0, -fig2) * s));
      trail = { cx: neck.x, cy: neck.y + 0.6 * s, rx: 8.6 * s, ry: 5 * s, from: o.aim + f * 0.95 * side, to: o.aim - f * 0.55 * side };
      break;
    }
    case 'bx_heart': {
      // HEARTBREAK SHOT — ditahan di perut dengan getaran tegang, lalu dilepas menembus badan.
      const hold = smooth(cl01(t / 0.55)), fire = smooth(cl01((t - 0.55) / 0.18));
      const back = smooth(cl01((t - 0.78) / 0.22));
      const drive = fire * (1 - back * 0.8);
      const tremble = hold * (1 - fire) * Math.sin(t * 90) * 0.18;
      stance(-0.95 * hold + 1.7 * drive, 1.4);
      hip.y += (0.7 * hold - 0.5 * drive) * s;
      bhand = add(neck, D(-2.6 * hold + 11.8 * drive + tremble, 0.3 + 0.7 * hold), P(-1.5 * f * (1 - drive)));
      fhand = add(head, D(1.3), V(0, 0.6 * s), P(2.4 * f));
      twist(-1.35 * hold + 2.3 * drive);
      lean(-0.85 * hold + 2.7 * drive, 0.35 * drive);
      head = add(head, P(0.6 * f * drive));
      bfoot = add(bfoot, V(0, -1.2 * drive * s), D(0.8 * drive));
      if (drive > 0.05) trail = { cx: neck.x, cy: neck.y + 0.3 * s, rx: 11.4 * s, ry: 4.4 * s, from: o.aim - f * 0.18, to: o.aim };
      break;
    }
    case 'bx_roll': {
      // slip murni: huruf U dalam, kaki tetap napak lebar, sarung rapat di pipi
      const u = Math.sin(t * Math.PI);
      const dir = Math.sin(t * Math.PI * 2);
      stance(0.2, 1.55);
      hip.y += u * 2.9 * s; neck.y += u * 3.3 * s; head.y += u * 3.7 * s;
      hip = add(hip, P(dir * 2.3 * f)); neck = add(neck, P(dir * 3.1 * f)); head = add(head, P(dir * 3.7 * f));
      fhand = add(head, D(1.8), V(0, 0.5 * s), P(2.6 * f));
      bhand = add(head, D(1.4), V(0, 0.8 * s), P(-2.6 * f));
      kneeUp = 1.6 * u;
      lean(0.85 * u, -0.45 * u);
      break;
    }
    case 'bx_rhook': {
      // RIGHT HOOK — cermin hook kiri: tangan belakang menyapu, tumit belakang menggiling
      const sw = smooth(kk), thru = smooth(cl01((t - 0.66) / 0.34));
      const swing = sw * (1 - thru * 0.35);
      const a = o.aim - f * (1.65 * (0.35 + 0.65 * ch) - 2.75 * swing);
      const r = (4.2 + 3.6 * Math.sin(Math.min(1, swing) * Math.PI)) * s;
      stance(-0.5 * ch + 1.05 * swing, 1.4);
      bhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (-1.1 - 0.2 * ch + 0.3 * swing) * s));
      fhand = add(head, D(1.3), V(0, 0.6 * s), P(2.4 * f));
      twist(0.85 * ch - 2.05 * swing);
      lean(-0.3 * ch + 1.25 * swing, 0.12 * swing);
      head = add(head, P(0.5 * f * swing));
      bfoot = add(bfoot, D(0.6 * swing));
      kneeDir = { x: dx, y: dy * 0.6 };
      if (swing > 0.12 && swing < 0.95) trail = { cx: neck.x, cy: neck.y - 0.2 * s, rx: 7.8 * s, ry: 4.6 * s, from: a - f * 0.8, to: a };
      break;
    }
    case 'bx_shovel': {
      // SHOVEL HOOK — setengah uppercut setengah hook, menghunjam naik ke ulu hati
      const ext = smooth(kp), back = smooth(cl01((t - 0.62) / 0.38));
      const drive = ext * (1 - back * 0.75);
      const dip = ch * 0.9 + Math.max(0, 0.4 - kp) * 1.0;
      stance(-0.55 * ch + 0.95 * drive, 1.3);
      hip.y += (dip * 1.5 - drive * 0.7) * s;
      neck.y += (dip * 1.2 - drive * 0.8) * s;
      head.y += (dip * 1.0 - drive * 0.9) * s;
      bhand = add(neck, D(0.8 - 1.4 * ch + 7.6 * drive, -1.9 * ch + 3.2 * drive), P(-1.5 * f * (1 - drive * 0.7)));
      fhand = add(head, D(1.3), V(0, 0.6 * s), P(2.4 * f));
      twist(-0.75 * ch + 1.6 * drive);
      lean(0.5 * drive, 0.45 * drive);
      kneeUp = 0.9 * ch;
      kneeDir = { x: dx, y: dy * 0.6 };
      if (drive > 0.12) trail = { cx: neck.x + 1.5 * s, cy: neck.y + 1.2 * s, rx: 6.4 * s, ry: 5.4 * s, from: o.aim + f * 1.0, to: o.aim - f * 0.2 };
      break;
    }
    case 'bx_over': {
      // OVERHAND RIGHT — melayang dari atas melewati guard, versi cepat dari Smash
      const rise = smooth(ch), drop = smooth(kk), thru = smooth(cl01((t - 0.68) / 0.32));
      const crash = drop * (1 - thru * 0.35);
      stance(-0.6 * rise + 1.25 * crash, 1.4);
      bhand = add(neck, D(-1.0 - 1.0 * rise + 8.4 * crash, 3.4 * rise - 1.4 * crash), P(-1.8 * f * (1 - crash)));
      fhand = add(head, D(1.2), V(0, 0.7 * s), P(2.3 * f));
      twist(-0.9 * rise + 1.8 * crash);
      lean(-0.5 * rise + 1.9 * crash, 0.6 * rise - 0.35 * crash);
      bfoot = add(bfoot, V(0, -0.8 * crash * s), D(0.5 * crash));
      kneeDir = { x: dx, y: dy * 0.6 };
      if (crash > 0.12) trail = { cx: neck.x, cy: neck.y - 1.2 * s, rx: 8.2 * s, ry: 6.0 * s, from: o.aim - f * 1.0, to: o.aim + f * 0.25 };
      break;
    }
    case 'b_wild': case 'b_wildback': {
      const back = o.pose === 'b_wildback' ? -1 : 1;
      const load = ch, sw = kk, thru = cl01((t - 0.6) / 0.4);
      const a = o.aim + f * back * (2.0 * (0.5 + 0.5 * load) - 3.6 * sw - 0.6 * thru);
      const r = (3.4 + 2.2 * Math.sin(Math.min(1, sw) * Math.PI)) * s;
      stance(-0.5 * load + 1.2 * sw, 1.5);
      fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (-1.8 * load + 0.8 * sw) * s));
      // forehand = two hands on the handle; backhand = one-handed, the free arm flung back for balance
      bhand = back > 0 ? add(fhand, V(-Math.cos(a) * 1.3 * s, -Math.sin(a) * 0.8 * s), V(0, 0.5 * s)) : add(neck, D(-1.4 - 1.2 * sw), V(0, (1.6 - 1.0 * sw) * s), P(-1.8 * f));
      twist(-1.2 * back * load + 2.0 * back * sw);
      lean(-0.6 * load + 1.8 * sw, 0.2 * sw);
      head = add(head, P(0.4 * f * back * sw));
      hip.y += 0.6 * s * load;
      bfoot = add(bfoot, P(0.8 * f * back * sw));
      if (t >= 0.3 && t <= 0.62) trail = { cx: neck.x, cy: neck.y + 0.3 * s, rx: r * 2.3, ry: r * 1.3, from: o.aim + f * back * 2.0, to: a };
      break;
    }
    case 'b_smash': {
      // jump-in overhead: bat raised high behind the head, body leans back, then a full-body slam into a deep crouch
      const load = ch, sm = kk, thru = cl01((t - 0.6) / 0.4);
      stance(-0.4 * load + 1.3 * sm, 1.4);
      fhand = add(neck, D(-1.2 * load + 4.8 * sm - 0.8 * thru), V(0, (-6.5 * load + 4.2 * sm + 0.8 * thru) * s));
      bhand = add(fhand, D(-1.0), V(0, 0.9 * s));
      lean(-0.8 * load + 2.0 * sm, 0.7 * load);
      hip.y += (1.8 * sm - 0.6 * load) * s; neck.y += 1.2 * sm * s; head.y += 1.2 * sm * s;
      twist(0.3 * sm);
      break;
    }
    case 'b_knob': {
      // butt-end ram: both hands choke up, drive the knob straight into the face
      stance(-0.3 * ch + 1.0 * kp, 1.2);
      fhand = add(neck, D(-0.8 * ch + 4.6 * kk), V(0, 1.4 * s));
      bhand = add(fhand, D(-1.6), V(0, 0.3 * s));
      twist(-0.6 * ch + 0.9 * kk); lean(-0.3 * ch + 1.5 * kk, 0.2);
      break;
    }
    case 'b_upper': {
      // low scoop that rises through the chin; the whole body hops up with it
      const load = ch, sw = kk, thru = cl01((t - 0.6) / 0.4);
      stance(-0.4 * load + 1.0 * sw, 1.4);
      fhand = add(neck, D(-1.8 * load + 1.0 + 3.0 * sw - 1.0 * thru), V(0, (5.0 * load + 3.0 - 10.0 * sw - 1.5 * thru) * s));
      bhand = add(fhand, D(-1.2), V(0, 0.8 * s));
      hip.y += (1.6 * load - 1.2 * sw) * s; neck.y -= 1.4 * sw * s; head.y -= 1.5 * sw * s;
      lean(-0.3 * load + 1.0 * sw, 0.4 * sw);
      twist(-0.6 * load + 1.2 * sw);
      break;
    }
    case 'b_pound': {
      // curb smash: stand over the downed guy, bat straight up, then chop it down at the floor
      const load = ch, sm = kk;
      stance(-0.2 * load + 0.9 * sm, 1.6);
      fhand = add(neck, D(-0.5 * load + 3.8 * sm), V(0, (-7 * load + 7.5 * sm) * s));
      bhand = add(fhand, D(-0.9), V(0, 0.8 * s));
      hip.y += (0.4 + 2.4 * sm) * s; neck.y += 2.2 * sm * s; head.y += 2.0 * sm * s;
      lean(-0.5 * load + 1.4 * sm, 0.5 * load);
      break;
    }
    case 'b_taunt': {
      // bat on the shoulder, free hand waves "come on"
      const tap = Math.abs(Math.sin(t * Math.PI * 4));
      stance(-0.3, 1.35);
      fhand = add(neck, D(-0.4), V(0, -0.6 * s), P(1.2 * f));
      bhand = add(neck, D(3.4), V(0, (-0.5 - 1.4 * tap) * s));
      lean(-0.5, 0.3); head = add(head, D(-0.2), V(0, -0.4 * s));
      break;
    }
    case 'b_windmill': {
      // WINDMILL WARMUP & SLUG: memutar pemukul 360° seperti kincir di samping tubuh saat ancang-ancang, lalu menyabet lurus bertenaga!
      const spinPh = cl01(t / 0.36);
      const sw = kk, thru = cl01((t - 0.65) / 0.35);
      stance(-0.45 * Math.sin(spinPh * Math.PI) + 1.15 * sw - 0.25 * thru, 1.42);
      if (t < 0.32) {
        const wa = o.aim - f * spinPh * Math.PI * 2;
        fhand = add(neck, D(1.4 + Math.cos(wa) * 2.4), V(0, (Math.sin(wa) * 2.2 - 0.4) * s));
        bhand = add(neck, D(1.8), V(0, 0.8 * s), P(-1.4 * f));
        twist(-0.8 * spinPh);
        lean(-0.45 * spinPh, 0.25);
      } else {
        const a = o.aim + f * (2.1 - 3.6 * sw - 0.5 * thru);
        const r = (3.6 + 2.0 * Math.sin(Math.min(1, sw) * Math.PI)) * s;
        fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (0.4 * sw - 0.4) * s));
        bhand = add(fhand, V(-Math.cos(a) * 1.4 * s, -Math.sin(a) * 0.85 * s), V(0, 0.5 * s));
        twist(1.95 * sw - 0.5 * thru);
        lean(1.65 * sw, 0.25 * sw);
        if (t >= 0.32 && t <= 0.68) trail = { cx: neck.x, cy: neck.y + 0.2 * s, rx: r * 2.2, ry: r * 1.25, from: o.aim + f * 2.1, to: a };
      }
      break;
    }
    case 'b_behind': {
      // BEHIND-THE-BACK WHIP: operan tongkat memutari belakang pinggang lalu menyapu lebar 270° dari sisi tak terduga!
      const load = ch, sw = kk, thru = cl01((t - 0.64) / 0.36);
      const a = o.aim + f * (-2.6 * (0.4 + 0.6 * load) + 4.2 * sw + 0.6 * thru);
      const r = (3.5 + 2.3 * Math.sin(Math.min(1, sw) * Math.PI)) * s;
      stance(-0.55 * load + 1.2 * sw, 1.46);
      fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (1.4 * load - 0.4 * sw) * s));
      bhand = t < 0.32
        ? add(hip, D(-2.2), V(0, -1.0 * s), P(1.5 * f))
        : add(neck, D(-1.8 * sw), V(0, 1.1 * s), P(-1.8 * f));
      twist(1.25 * load - 2.15 * sw);
      lean(-0.5 * load + 1.75 * sw, 0.3 * sw);
      if (t >= 0.3 && t <= 0.66) trail = { cx: neck.x, cy: neck.y + 0.3 * s, rx: r * 2.35, ry: r * 1.35, from: o.aim - f * 2.6, to: a };
      break;
    }
    case 'b_buntspin': {
      // BUNT SPIN & SNAP: memegang tengah tongkat dan memutarnya seperti baling-baling bo-staff di depan dada sambil maju menekan!
      const ph = t * Math.PI * 4;
      const push = Math.sin(cl01(t / 0.85) * Math.PI);
      stance(0.3 + 0.85 * push, 1.38);
      twist(0.95 * Math.sin(ph));
      fhand = add(neck, D(3.8 + 2.2 * push + Math.cos(ph) * 1.2), V(0, (Math.sin(ph) * 1.6 + 0.2) * s));
      bhand = add(neck, D(2.2 + 1.2 * push - Math.cos(ph) * 1.0), V(0, (-Math.sin(ph) * 1.2 + 0.8) * s));
      lean(1.25 * push, 0.25);
      if (t > 0.12 && t < 0.88) trail = { cx: fhand.x, cy: fhand.y, rx: 8.4 * s, ry: 5.8 * s, from: ph - 1.6, to: ph };
      break;
    }
    case 'b_tosscatch': {
      // BAT FLIP TOSS & OVERHEAD CRASH: melempar tongkat berputar tinggi ke udara, menangkapnya di puncak, lalu menghantamkannya keras ke bawah!
      const toss = cl01(t / 0.38);
      const smash = cl01((t - 0.38) / 0.28);
      const rec = cl01((t - 0.66) / 0.34);
      stance(-0.45 * Math.sin(toss * Math.PI) + 1.35 * smash - 0.3 * rec, 1.48);
      if (t < 0.38) {
        const arc = Math.sin(toss * Math.PI);
        fhand = add(neck, D(1.6 - 1.2 * toss), V(0, (-2.5 - 4.8 * arc) * s));
        bhand = add(neck, D(2.4), V(0, (-1.2 * arc + 0.5) * s), P(-1.3 * f));
        twist(-0.75 * toss);
        lean(-0.85 * toss, 0.55 * arc);
        head = add(head, V(0, -0.8 * arc * s));
      } else {
        const e = easeOut(smash);
        fhand = add(neck, D(-1.2 + 6.4 * e - 0.8 * rec), V(0, (-7.2 + 10.4 * e - 1.2 * rec) * s));
        bhand = add(fhand, D(-1.2), V(0, 0.75 * s));
        twist(-0.75 + 2.1 * e);
        lean(-0.85 + 3.0 * e - 0.6 * rec, 0.55 - 1.15 * e);
        hip.y += 2.1 * e * (1 - 0.4 * rec) * s;
        if (smash > 0.05 && smash < 0.95) trail = { cx: neck.x + 1.5 * f * s, cy: neck.y, rx: 10.5 * s, ry: 9.2 * s, from: -Math.PI * 0.55, to: o.aim + f * 0.4 };
      }
      break;
    }
    case 'b_corkscrew': {
      // CORKSCREW TORNADO SLUGGER: putaran badan 540° yang menyapu lawan di kiri & kanan dengan jangkauan penuh!
      const a = o.aim + f * (t * Math.PI * 3.2 - 0.8);
      const lift = Math.sin(t * Math.PI);
      fhand = add(neck, V(Math.cos(a) * 5.2 * s, Math.sin(a) * 3.1 * s), V(0, (0.6 - 1.2 * lift) * s));
      bhand = add(fhand, V(-Math.cos(a) * 1.5 * s, -Math.sin(a) * 0.9 * s), V(0, 0.5 * s));
      hip.y -= 0.7 * lift * s; neck.y -= 0.7 * lift * s; head.y -= 0.7 * lift * s;
      lean(0.55, 0.35);
      ffoot = V(3.1 * s * f, -0.4 * lift * s); bfoot = V(-3.0 * s * f, 0);
      if (t > 0.1 && t < 0.9) trail = { cx: neck.x, cy: neck.y, rx: 11.2 * s, ry: 6.4 * s, from: a - f * 1.5, to: a };
      break;
    }
    case 'b_kneeslider': {
      // KNEE SLIDE SWEEP: meluncur rendah dengan satu lutut menekuk sambil menyapu pemukul rata di atas lantai!
      const slide = Math.sin(cl01(t / 0.85) * Math.PI);
      const sw = kk;
      const drop = 2.4 * slide * s;
      hip.y += drop; neck.y += drop * 0.92; head.y += drop * 0.85;
      ffoot = V((3.6 + 1.4 * slide) * f * s, 0);
      bfoot = V((-2.8 - 1.2 * slide) * f * s, 0);
      kneeUp = 1.6 * s * slide;
      const a = o.aim + f * (1.85 - 3.3 * sw);
      fhand = add(hip, V(Math.cos(a) * 5.4 * s, Math.sin(a) * 3.0 * s + 0.5 * s));
      bhand = add(fhand, V(-Math.cos(a) * 1.3 * s, -Math.sin(a) * 0.8 * s));
      twist(-0.9 + 2.0 * sw);
      lean(1.5 * slide, -0.3 * slide);
      if (t >= 0.26 && t <= 0.68) trail = { cx: hip.x, cy: hip.y + 0.5 * s, rx: 10.6 * s, ry: 5.4 * s, from: o.aim + f * 1.85, to: a };
      break;
    }
    case 'b_callshot': {
      // BABE RUTH "CALL YOUR SHOT" HOME RUN: menunjuk jauh ke depan saat windup, lalu mengayun Home Run raksasa dengan dua tangan!
      const load = ch, sw = kk, thru = cl01((t - 0.64) / 0.36);
      stance(-0.65 * load + 1.35 * sw - 0.25 * thru, 1.52);
      if (t < 0.29) {
        // Menunjuk ke arah lawan / langit dengan tangan depan sementara tangan belakang memanggul tongkat di bahu!
        fhand = add(neck, D(-0.8), V(0, -1.2 * s), P(1.6 * f));
        bhand = add(neck, D(5.2 * easeOut(t / 0.28), 1.4), V(0, -1.2 * s));
        twist(-0.85 * load);
        lean(-0.55 * load, 0.35 * load);
        hip.y += 0.9 * s * load;
      } else {
        const a = o.aim + f * (2.45 - 4.2 * sw - 0.85 * thru);
        const r = (3.8 + 2.4 * Math.sin(Math.min(1, sw * 1.15) * Math.PI)) * s;
        fhand = add(neck, V(Math.cos(a) * r, Math.sin(a) * r * 0.6), V(0, (1.2 - 3.2 * sw - 0.8 * thru) * s));
        bhand = add(fhand, V(-Math.cos(a) * 1.5 * s, -Math.sin(a) * 0.9 * s), V(0, 0.55 * s));
        twist(-0.85 + 2.35 * sw - 0.5 * thru);
        lean(1.75 * sw, 0.55 * sw);
        bfoot = add(bfoot, P(1.1 * f * sw));
        if (t >= 0.29 && t <= 0.68) trail = { cx: neck.x, cy: neck.y, rx: r * 2.5, ry: r * 1.45, from: o.aim + f * 2.45, to: a };
      }
      break;
    }
    case 'a_golf': {
      // golf swing: hands low & behind, sweep upward through the target, finish high over the front shoulder
      const load = ch, sw = kk, thru = cl01((t - 0.6) / 0.4);
      stance(-0.5 * load + 1.0 * sw, 1.4);
      fhand = add(neck, D(-2.2 * load + 1.5 + 2.5 * sw - 1.5 * thru), V(0, (4.5 * load + 3.5 - 9 * sw - 2 * thru) * s), P((1.2 * load - 2.2 * sw) * f));
      bhand = add(fhand, D(-1.3), V(0, 0.8 * s));
      twist(-0.8 * load + 1.6 * sw);
      lean(-0.4 * load + 0.8 * sw, 0.5 * sw); hip.y += 1.4 * s * load;
      head = add(head, D(0.6 * sw), V(0, -0.5 * s * sw));
      break;
    }
    case 'a_bunt': {
      // bunt: square up, slide the top hand up the haft and poke the head straight out
      stance(0.3 + 0.5 * kp, 1.3);
      fhand = add(neck, D(2 + 4.5 * kk, 0.4)); bhand = add(neck, D(-0.5 + 2.5 * kk), V(0, 1.2 * s));
      lean(0.8 * kk, 0.2); hip.y += 1.0 * s;
      break;
    }
    case 'a_chop': {
      // diagonal chop: wind up over the rear shoulder, step in, bring it down across the body
      const wind = ch, cut = kk;
      stance(-0.5 * wind + 1.1 * cut, 1.3);
      fhand = add(neck, D(-2.0 * wind + 5.5 * cut), V(0, (-4.5 * wind + 2.5 * cut) * s), P((1.5 * wind - 1.0 * cut) * f));
      bhand = add(fhand, D(-1.6), V(0, 0.8 * s));
      twist(-0.8 * wind + 1.6 * cut);
      lean(-0.8 * wind + 2.2 * cut, 0.6 * wind - 0.6 * cut);
      hip.y += 1.2 * s * cut;
      break;
    }
    case 'a_backswing': {
      const wind = ch, cut = kk;
      stance(0.3 + 0.5 * cut, 1.3);
      fhand = add(neck, D(0.5 + 4.5 * cut), V(0, (1.5 - 0.5 * cut) * s), P((-2.6 + 4.0 * cut) * f));
      bhand = add(fhand, D(-1.6), V(0, 0.8 * s));
      twist(1.0 * wind - 1.4 * cut);
      lean(1.2 * cut, 0.2 * cut);
      break;
    }
    case 'a_overhead': {
      // raise the axe straight overhead (long), then a vertical slam that drops the body into a deep stance
      const up = t < 0.3 ? easeOut(t / 0.3) : Math.max(0, 1 - (t - 0.3) / 0.08);
      const dn = t >= 0.3 ? cl01((t - 0.3) / 0.08) : 0;
      stance(-0.3 * up + 1.0 * dn, 1.4);
      fhand = add(neck, D(-1.0 * up + 5.5 * dn), V(0, (-8 * up + 3.5 * dn) * s));
      bhand = add(fhand, D(-1.6), V(0, 0.8 * s));
      lean(-1.5 * up + 2.8 * dn, 0.8 * up - 1.0 * dn);
      hip.y += 2.2 * s * dn; neck.y += 0.8 * s * dn;
      break;
    }
    case 'a_spin': {
      // lumberjack spin: body turns twice, axe out at arm's length
      const a = o.aim + f * t * Math.PI * 4;
      fhand = add(neck, V(Math.cos(a) * 5 * s, Math.sin(a) * 3 * s), V(0, 1.0 * s));
      bhand = add(fhand, V(-Math.cos(a) * 1.6 * s, -Math.sin(a) * 1.0 * s), V(0, 0.6 * s));
      hip.y -= 0.6 * s; neck.y -= 0.6 * s; head.y -= 0.6 * s;
      lean(0.3, 0.3);
      ffoot = V(3.2 * s * f, 0); bfoot = V(-3.2 * s * f, 0);
      break;
    }
    case 'a_hook': {
      // reach out with the axe head, hook the target, yank it back toward you
      const reach = t < 0.3 ? easeOut(t / 0.3) : 1, pull = cl01((t - 0.3) / 0.15);
      stance(0.8 * reach - 1.2 * pull, 1.3);
      fhand = add(neck, D(1 + 6 * reach - 4 * pull), V(0, (1.5 - 0.5 * reach) * s));
      bhand = add(fhand, D(-1.6), V(0, 0.8 * s));
      lean(2.0 * reach - 2.4 * pull, 0.4 * reach);
      twist(0.8 * reach - 1.2 * pull);
      break;
    }
    case 'a_leap': {
      // leaping slam: axe raised behind the head in the air, slammed on landing
      const air = t < 0.6 ? 1 : 0;
      const raise = t < 0.5 ? Math.min(1, t / 0.2) : Math.max(0, 1 - (t - 0.5) / 0.1);
      const dn = t >= 0.5 ? cl01((t - 0.5) / 0.1) : 0;
      fhand = add(neck, D(-1.5 * raise + 5.5 * dn), V(0, (-7.5 * raise + 3.5 * dn) * s));
      bhand = add(fhand, D(-1.6), V(0, 0.8 * s));
      ffoot = add(hip, D(2), V(0, (4.5 - 1.5 * air) * s)); bfoot = add(hip, D(-2), V(0, (4.5 - 2.5 * air) * s));
      kneeUp = 1.5 * s * air;
      lean(-1.0 * raise + 2.5 * dn, 0.6 * raise - 1.0 * dn);
      hip.y += 2.0 * s * dn;
      break;
    }
    // ---------------- DUAL BLADES: both hands are weapons; mirrored, fast ----------------
    case 'd_idle': {
      const br = Math.sin(o.time * 4) * 0.4 * s;
      neck.y += br; head.y += br;
      stance(0.2, 1.0);
      fhand = add(neck, D(2.2), V(0, 1.6 * s), P(1.2 * f)); bhand = add(neck, D(-1.4), V(0, 1.8 * s), P(-1.2 * f)); // reverse-grip rear blade
      break;
    }
    case 'd_cross': {
      stance(-0.3 * ch + 0.9 * kp, 1.0);
      fhand = add(neck, D(0.5 - 1.5 * ch + 6 * kk, 0.5), P((1.8 - 3.2 * kk) * f));
      bhand = add(neck, D(-1.2), V(0, 1.8 * s), P(-1.2 * f));
      twist(-0.4 * ch + 1.0 * kk); lean(1.2 * kk, 0.2 * kk);
      break;
    }
    case 'd_scissor': {
      stance(0.4 + 0.6 * kp, 1.0);
      fhand = add(neck, D(2 + 3 * kk, 0.4), P((-1.6 + 2.8 * kk) * f));
      bhand = add(neck, D(-1 - 1.5 * ch + 6.5 * kk, 0.5), P((-1.8 + 3.4 * kk) * f));
      twist(0.6 * ch - 1.4 * kk); lean(1.4 * kk, 0.3 * kk);
      break;
    }
    case 'd_flurry': {
      const ph = t * Math.PI * 12;
      stance(0.6, 1.0);
      fhand = add(neck, D(3.5 + Math.sin(ph) * 2.2, 0.4), P((0.4 + Math.cos(ph) * 1.6) * f));
      bhand = add(neck, D(3.5 - Math.sin(ph) * 2.2, 0.4), P((-0.4 - Math.cos(ph) * 1.6) * f));
      twist(0.8 * Math.sin(ph)); lean(1.6, 0.5);
      break;
    }
    case 'd_xslash': {
      // both arms crossed over the chest, then flung outward simultaneously
      stance(-0.4 * ch + 1.2 * kp, 1.2);
      fhand = add(neck, D(0.5 + 5.5 * kk), V(0, (0.5 - 2.5 * kk) * s), P((-2.2 + 5.0 * kk) * f));
      bhand = add(neck, D(0.5 + 5.5 * kk), V(0, (0.5 + 2.5 * kk) * s), P((2.2 - 5.0 * kk) * f));
      lean(-0.6 * ch + 2.2 * kk, 0.5 * kk); hip.y += 0.8 * s * kk;
      break;
    }
    case 'd_dance': {
      const a = o.aim + f * t * Math.PI * 6;
      fhand = add(neck, V(Math.cos(a) * 4.5 * s, Math.sin(a) * 2.7 * s), V(0, 0.8 * s));
      bhand = add(neck, V(Math.cos(a + Math.PI) * 4.5 * s, Math.sin(a + Math.PI) * 2.7 * s), V(0, 1.2 * s));
      hip.y -= 0.6 * s; neck.y -= 0.6 * s; head.y -= 0.6 * s;
      ffoot = V(2.8 * s * f, 0); bfoot = V(-2.8 * s * f, 0);
      break;
    }
    case 'd_launch': {
      stance(0.4 + 0.4 * kk, 1.1);
      hip.y += 2.2 * s * ch - 1.2 * s * kk; neck.y += 2.2 * s * ch - 2.0 * s * kk; head.y += 2.2 * s * ch - 2.4 * s * kk;
      fhand = add(neck, D(1.5 + 2 * kk), V(0, (4 - 11 * kk) * s), P(1.0 * f)); bhand = add(neck, D(1.5 + 2 * kk), V(0, (4 - 11 * kk) * s), P(-1.0 * f));
      lean(0.8 * kk, 0);
      break;
    }
    case 'd_dash': {
      lean(3.5, 1.2); hip = add(hip, D(-1.2));
      fhand = add(neck, D(2), V(0, 1 * s), P(3.2 * f)); bhand = add(neck, D(2), V(0, 1 * s), P(-3.2 * f)); // arms out like wings
      ffoot = add(ffoot, D(2.5)); bfoot = add(bfoot, D(-3.5), V(0, -1.5 * s));
      break;
    }
    case 'k_impale': {
      // fatality: blade through the chest, lift them, flick them off
      const q = Math.min(1, t);
      fhand = add(neck, D(4 + 1 * q, 0), V(0, (1 - 4 * q) * s)); bhand = add(fhand, D(-1.5), V(0, 0.8 * s));
      lean(1.5 - 1 * q, 0.4);
      ffoot = add(ffoot, D(2)); bfoot = add(bfoot, D(-2));
      break;
    }
    case 'crouch':
      // horse stance, fists at the hips — the classic kung-fu ready
      hip.y += 2.4 * s; neck.y += 2.7 * s; head.y += 3.1 * s;
      ffoot = V(3.4 * s * f, 0); bfoot = V(-3.4 * s * f, 0);
      fhand = add(hip, D(1.6), V(0, -0.8 * s), P(1.3 * f));
      bhand = add(hip, D(-0.4), V(0, -0.8 * s), P(-1.3 * f));
      kneeUp = 0.7 * s;
      break;
    case 'launched':
      head = add(head, D(-1.5), V(0, 0.5 * s));
      fhand = add(neck, D(3), V(0, -3 * s)); bhand = add(neck, D(-3), V(0, -3 * s));
      ffoot = add(hip, D(3), V(0, 3 * s)); bfoot = add(hip, D(-3), V(0, 3 * s));
      break;
    case 'flex':
      // baoquan: fist covers the palm — kung-fu salute
      stance(0.15, 1.25);
      fhand = add(neck, D(2.2), V(0, 0.5 * s), P(1.5 * f));
      bhand = add(neck, D(1.6), V(0, 0.35 * s), P(-1.35 * f));
      head = add(head, D(0.3));
      break;
    case 'rush': case 'takedown': {
      const alt = Math.floor(t * 20) % 2 === 0;
      fhand = alt ? add(neck, D(8, 0.5)) : add(neck, D(-1), V(0, 2 * s));
      bhand = alt ? add(neck, D(-1), V(0, 2 * s)) : add(neck, D(8, -0.5));
      lean(1.5, 0);
      break;
    }
    case 'grab': {
      const q = Math.min(1, t * 2);
      stance(0.4 * q, 1.2);
      fhand = add(neck, D(3.2 + 3.2 * q, 1.6), P(1.15 * f));
      bhand = add(neck, D(3.2 + 3.2 * q, 2.0), P(-1.15 * f));
      lean(1.7 * q, 0.35);
      head = add(head, D(0.5 * q));
      break;
    }
    case 'kneedrop': {
      if (t < 0.45) {
        const q = t / 0.45;
        const c = V(0, (-6 - 4 * Math.sin(q * Math.PI)) * s);
        hip = add(c, D(-1)); neck = add(c, D(0.5), V(0, -3.5 * s)); head = add(neck, D(0.8), V(0, -2.6 * s));
        ffoot = add(hip, D(3.5), V(0, 2 * s)); bfoot = add(hip, D(-2.5), V(0, 3.5 * s));
        fhand = add(neck, D(-2), V(0, -3 * s)); bhand = add(neck, D(-3), V(0, -1 * s));
        kneeUp = 3 * s;
      } else {
        hip.y += 2.5 * s; neck.y += 2 * s; head.y += 2 * s;
        ffoot = add(hip, D(3), V(0, 2.5 * s)); bfoot = add(hip, D(-3), V(0, 2.5 * s));
        fhand = add(neck, D(2.5), V(0, -1 * s)); bhand = add(neck, D(-2), V(0, -2 * s));
      }
      break;
    }
    case 'spin': {
      const ang = o.aim + Math.PI * (1 - 2 * cl01((t - 0.15) / 0.5)) * f;
      const ex = Math.cos(ang), ey = Math.sin(ang) * 0.6;
      hip.y -= 1.5 * s; neck.y -= 1.5 * s; head.y -= 1.5 * s;
      ffoot = add(hip, V(ex * 9 * s, ey * 9 * s - 2.5 * s));
      bfoot = add(hip, V(-ex * 1.5 * s, -ey * 1.5 * s + 3.5 * s));
      fhand = add(neck, V(-ex * 3 * s, -ey * 3 * s + 0.5 * s)); bhand = add(neck, V(ex * 2 * s, ey * 2 * s - 2 * s));
      if (t > 0.15 && t < 0.65) trail = { cx: hip.x, cy: hip.y - 2.5 * s, rx: 9.5 * s, ry: 5.5 * s, from: o.aim + Math.PI * f, to: ang };
      break;
    }
    case 'stomp': {
      const up = t < 0.5 ? easeOut(t / 0.5) : Math.max(0, 1 - (t - 0.5) / 0.1);
      ffoot = add(hip, D(2.5), V(0, (-2.5 * up + 4 * (1 - up)) * s));
      kneeUp = 3 * s * up;
      bfoot = V(-1.5 * s * f, 0);
      neck.y -= 0.5 * s * up; head.y -= 0.5 * s * up;
      fhand = add(neck, D(-1.5), V(0, -2.5 * s * up + 1.5 * s)); bhand = add(neck, D(-3), V(0, 1.5 * s));
      lean(-0.6 * up + 1.5 * (1 - up) * (t > 0.5 ? 1 : 0), 0);
      break;
    }
    case 'hammer': {
      const up = t < 0.45 ? easeOut(t / 0.45) : Math.max(0, 1 - (t - 0.45) / 0.12);
      const c = add(neck, D(-1 + 7 * (1 - up), 0), V(0, (-7 * up + 3 * (1 - up)) * s));
      fhand = add(c, P(1)); bhand = add(c, P(-1));
      lean(-1 * up + 3 * (1 - up), -0.5 * up);
      hip.y += (1 - up) * 1.5 * s;
      ffoot = add(ffoot, D(2 * (1 - up))); bfoot = add(bfoot, D(-1.5 * (1 - up)));
      break;
    }
    // ---------------- POSE AKROBATIK BUSUR (kontekstual) ----------------
    // Semua pose tetap menjaga tangan busur (fhand) dan tangan penarik (bhand) agar
    // busur yang digambar mengikuti gerakan tubuh, bukan melayang sendiri.
    case 'bow_flip': {
      const u = cl01(o.t), env = Math.sin(Math.PI * u);
      hip = add(hip, V(0, -env * 1.6 * s));
      neck = add(neck, D(env * 0.7), V(0, -env * 0.8 * s));
      head = add(head, D(env * 1.0), V(0, -env * 0.5 * s));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(2.4 + env * 1.4), V(0, -env * 4.6 * s), P(1.3 * f));
      bfoot = add(D(-2.2 - env * 1.0), V(0, -env * 4.0 * s), P(-1.3 * f));
      kneeUp = env * 3.2 * s;
      fhand = add(neck, D(4.8), V(0, -2.0 * s - env * 1.3 * s), P(0.5 * f));
      bhand = mix(add(fhand, D(-1.4), V(0, 0.5 * s)), add(neck, D(-0.4, 1.1), V(0, -0.4 * s)), bowDraw);
      break;
    }
    case 'bow_slide': {
      const u = cl01(o.t), low = Math.sin(Math.PI * Math.min(1, u * 1.25));
      hip = add(hip, V(0, (2.0 + 1.1 * low) * s), D(-1.0 * low));
      neck = add(neck, V(0, 2.1 * s), D(-1.7 * low));
      head = add(head, V(0, 2.0 * s), D(-2.1 * low));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(5.4 * low + 1.5), V(0, 0.4 * s), P(1.3 * f));
      bfoot = add(D(-3.4 - low), V(0, -1.4 * s), P(-1.2 * f));
      kneeUp = 1.4 * s;
      fhand = add(neck, D(5.6), V(0, 1.5 * s), P(0.3 * f));
      bhand = mix(add(fhand, D(-1.5), V(0, 0.3 * s)), add(neck, D(-0.7, 1.4), V(0, 0.2 * s), P(-0.3 * f)), bowDraw);
      break;
    }
    case 'bow_lean': {
      const u = cl01(o.t), L = Math.sin(Math.PI * u);
      hip = add(hip, V(0, 1.5 * L * s), D(0.6 * L));
      neck = add(neck, V(0, 2.6 * L * s), D(-3.2 * L));
      head = add(head, V(0, 3.0 * L * s), D(-4.1 * L));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(4.0 + L), V(0, 0.2 * s), P(1.4 * f));
      bfoot = add(D(-3.8), V(0, -1.3 * L * s), P(-1.3 * f));
      kneeUp = 1.1 * L * s;
      fhand = add(neck, D(5.2), V(0, 0.8 * s), P(0.4 * f));
      bhand = mix(add(fhand, D(-1.4), V(0, 0.4 * s)), add(neck, D(-0.5, 1.2), V(0, 0.5 * s)), bowDraw);
      break;
    }
    case 'bow_kneel': {
      const u = cl01(o.t), settle = Math.min(1, u * 2.2);
      hip = add(hip, V(0, 2.0 * settle * s));
      neck = add(neck, V(0, 1.7 * settle * s));
      head = add(head, V(0, 1.6 * settle * s), D(0.35));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(4.1), V(0, 0.2 * s), P(1.3 * f));
      bfoot = add(D(-2.6), V(0, -1.4 * settle * s), P(-1.5 * f));
      kneeUp = 1.7 * settle * s;
      fhand = add(neck, D(4.9), V(0, 0.2 * s), P(0.4 * f));
      bhand = mix(add(fhand, D(-1.3), V(0, 0.5 * s)), add(neck, D(-0.6, 0.9), V(0, 0.1 * s)), bowDraw);
      break;
    }
    case 'bow_roll': {
      const u = cl01(o.t), env = Math.sin(Math.PI * u);
      hip = add(hip, V(0, 2.4 * s));
      neck = add(neck, V(0, 3.0 * s), D(-0.8 * env));
      head = add(head, V(0, 3.4 * s), D(-1.2 * env));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(2.0), V(0, -2.8 * s), P(1.2 * f));
      bfoot = add(D(-1.8), V(0, -2.4 * s), P(-1.2 * f));
      kneeUp = 3.0 * s;
      fhand = add(neck, D(2.8), V(0, 1.1 * s), P(0.5 * f));
      bhand = add(neck, D(0.4), V(0, 1.7 * s), P(-0.4 * f));
      break;
    }
    case 'bow_air': {
      const u = cl01(o.t), env = Math.sin(Math.PI * u);
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(4.2), V(0, -2.2 * s - env * 1.2 * s), P(1.4 * f));
      bfoot = add(D(-4.0), V(0, 1.0 * s + env * 0.7 * s), P(-1.3 * f));
      kneeUp = 2.0 * s;
      neck = add(neck, D(0.5 * env));
      head = add(head, D(0.9 * env), V(0, -0.5 * env * s));
      fhand = add(neck, D(5.4), V(0, -0.8 * s + env * 0.5 * s), P(0.4 * f));
      bhand = mix(add(fhand, D(-1.5), V(0, 0.4 * s)), add(neck, D(-0.4, 1.1), V(0, -0.2 * s)), bowDraw);
      break;
    }
    case 'bow_multi': {
      const u = cl01(o.t), sw = Math.sin(u * Math.PI * 4);
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(3.0 + 0.5 * sw), P(1.6 * f));
      bfoot = add(D(-3.0 - 0.5 * sw), P(-1.6 * f));
      hip = add(hip, V(0, 0.8 * s), D(sw * 0.5));
      twist(sw * 0.9);
      neck = add(neck, P(sw * 1.0 * f));
      head = add(head, P(sw * 1.4 * f), D(0.3));
      fhand = add(neck, D(5.0), V(0, 0.2 * s), P(sw * 0.4 * f));
      bhand = mix(add(fhand, D(-1.5), V(0, 0.4 * s)), add(neck, D(-0.5, 1.0), V(0, 0.1 * s), P(-0.3 * f)), bowDraw);
      break;
    }
    case 'bow_twirl': {
      const u = cl01(o.t), w = Math.sin(Math.PI * u);
      hip = add(hip, V(0, -w * 0.5 * s));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(2.4), P(1.2 * f), V(0, -Math.max(0, Math.sin(u * Math.PI * 2)) * 0.8 * s));
      bfoot = add(D(-2.2), P(-1.2 * f));
      neck = add(neck, D(-0.3), V(0, w * 0.4 * s));
      head = add(head, D(-0.45));
      fhand = add(neck, D(3.3 + Math.cos(u * Math.PI * 4) * 1.5), V(0, 0.4 * s + Math.sin(u * Math.PI * 4) * 1.5 * s));
      bhand = add(neck, D(-1.3), V(0, 1.7 * s), P(-1.0 * f));
      kneeUp = w * 0.8 * s;
      break;
    }
    // ---------------- FREESTYLE SENJATA API ----------------
    case 'gun_twirl': {
      // pistol diputar di jari, tangan kiri di pinggang, tumit sedikit terangkat
      const u = cl01(o.t), w = Math.sin(Math.PI * u);
      hip = add(hip, V(0, -w * 0.5 * s), D(-0.3));
      neck = add(neck, D(-0.4), V(0, w * 0.3 * s));
      head = add(head, D(-0.5), V(0, w * 0.2 * s));
      kneeDir = { x: dx, y: dy * 0.6 };
      ffoot = add(D(2.4), P(1.2 * f), V(0, -Math.max(0, Math.sin(u * Math.PI * 2)) * 1.1 * s));
      bfoot = add(D(-2.3), P(-1.2 * f));
      kneeUp = w * 1.1 * s;
      fhand = add(neck, D(3.8 + Math.cos(u * Math.PI * 4) * 1.3), V(0, 0.4 * s + Math.sin(u * Math.PI * 4) * 1.4 * s));
      bhand = add(hip, D(-0.6), V(0, 0.6 * s), P(-2 * f));
      break;
    }
    case 'gun_akimbo': {
      // dua tangan menyebar, bahu bergantian maju, kuda-kuda lebar (khusus pistol)
      const u = cl01(o.t), sw = Math.sin(u * Math.PI * 4);
      kneeDir = { x: dx, y: dy * 0.6 };
      hip = add(hip, V(0, 1.1 * s), D(sw * 0.4));
      ffoot = add(D(3.4 + 0.5 * sw), P(1.8 * f));
      bfoot = add(D(-3.4 - 0.5 * sw), P(-1.8 * f));
      twist(sw * 1.1);
      neck = add(neck, P(sw * 1.2 * f), V(0, 0.3 * s));
      head = add(head, P(sw * 1.5 * f), D(0.3));
      fhand = add(neck, D(5.2 + sw * 0.6), V(0, 0.1 * s), P(0.7 * f));
      bhand = add(neck, D(3.4 - sw * 0.6), V(0, 0.9 * s), P(-2.6 * f));
      break;
    }
    case 'bow': {
      // PEMANAH ATLETIK: badan menyamping, lengan busur lurus ke sasaran, tali ditarik sampai jangkar di pipi.
      const d = cl01(t), de = 1 - (1 - d) * (1 - d);
      const rel = o.recoil ?? 0, nk = o.bowNock ?? 0;
      const trem = d > 0.98 ? Math.sin(o.time * 47) * 0.14 * s : 0;
      hip.y += (0.4 + 0.6 * de) * s;
      lean(-0.55 * de + 0.35 * rel, 0.1 * de);
      twist(-0.35 * de);
      fhand = add(neck, D(5.3 + 0.5 * de - 0.7 * rel, 0.35 + 0.5 * rel), V(0, trem));
      const rest = add(fhand, D(-1.3));
      const anchor = add(neck, D(-0.5, 0.95), P(-0.2 * f));
      bhand = mix(rest, anchor, de);
      // lepas: tangan penarik terlempar ke belakang telinga (follow-through)
      if (rel > 0) bhand = mix(bhand, add(neck, D(-2.8, 1.8), P(-0.5 * f)), rel);
      // ambil panah: tangan meraih tabung di atas bahu belakang
      if (nk > 0) bhand = mix(bhand, add(neck, D(-1.9, 3.2), P(-0.7 * f)), Math.sin(nk * Math.PI));
      head = add(head, D(0.55 + 0.2 * de, -0.15 * de));
      if (!o.moving) {
        kneeDir = { x: dx, y: dy * 0.6 };
        ffoot = add(D(2.7 + 0.3 * de), P(0.9 * f)); bfoot = add(D(-2.6 - 0.4 * de), P(-0.9 * f));
      }
      break;
    }
    // ================= PEMBUKAAN DELAPAN GERBANG (tombol N) — 6 fase sinematik =================
    // Semua pose memakai t (0..1) = kemajuan di dalam fasenya, dikirim dari EightGates lewat holdPoseT.
    case 'g_relax': {
      // FASE 1: kuda-kuda santai, lutut sedikit menekuk, kedua tangan terbuka setinggi pinggang, dada naik-turun pelan
      const br = Math.sin(o.time * 3.0) * 0.28 * s;
      stance(0.1, 1.15);
      const dn = 0.55 * s;
      hip.y += dn; neck.y += dn + br; head.y += dn + br * 0.8;
      fhand = add(hip, D(3.1, 0.9), V(0, br * 0.6), P(1.0 * f));
      bhand = add(hip, D(1.9, 0.6), V(0, -br * 0.5), P(-1.1 * f));
      break;
    }
    case 'g_focus': {
      // FASE 2: memusatkan tenaga — tarik napas dalam (dada mengembang), kepala sedikit menunduk, tangan perlahan mengepal & naik
      const e = smooth(t);
      const breath = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.55 * s;
      stance(0.05, 1.25);
      const dn = (0.55 + 0.35 * e) * s;
      hip.y += dn; neck.y += dn - breath; head.y += dn - breath * 0.9 + 0.35 * e * s;
      fhand = add(hip, D(3.0 - 0.9 * e, 0.9 + 1.3 * e), P((1.0 - 0.3 * e) * f));
      bhand = add(hip, D(1.9 - 0.4 * e, 0.6 + 1.2 * e), P((-1.1 + 0.2 * e) * f));
      break;
    }
    case 'g_tense': {
      // FASE 3: tubuh menegang — lengan ditarik ke dada, otot menegang, bergetar makin kuat
      const e = smooth(t);
      const tr = (0.08 + 0.3 * e) * s;
      const jx = Math.sin(o.time * 61) * tr, jy = Math.cos(o.time * 53) * tr * 0.7;
      stance(0.0, 1.3 + 0.1 * e);
      const dn = (0.9 + 0.7 * e) * s;
      hip.y += dn; neck.y += dn + jy * 0.5; head.y += dn + 0.45 * s + jy * 0.4;
      neck = add(neck, V(jx * 0.5, 0)); head = add(head, V(jx * 0.7, 0));
      fhand = add(neck, D(1.5, -0.2), V(jx, jy + 1.2 * s), P(0.9 * f));
      bhand = add(neck, D(0.9, -0.5), V(-jx, -jy + 1.5 * s), P(-0.9 * f));
      break;
    }
    case 'g_cross': {
      // FASE 4: pose silang X — lengan menyilang di depan dada, tubuh mendak seperti pegas ditekan, ditahan beku
      // (garis X lengan digambar tegas oleh EightGates.drawAuraFront)
      const e = smooth(t * 3);
      const tr = 0.07 * s, jx = Math.sin(o.time * 70) * tr;
      stance(-0.1, 1.55);
      const dn = (1.5 + 0.6 * e) * s;
      hip.y += dn; neck.y += dn + 0.2 * s; head.y += dn + 0.7 * s;
      lean(0.5 * e, 0);
      neck = add(neck, V(jx * 0.4, 0));
      fhand = add(neck, D(2.3, -0.7), V(jx, 0.6 * s), P(0.4 * f));
      bhand = add(neck, D(2.3, -0.7), V(-jx, 1.5 * s), P(-0.4 * f));
      break;
    }
    case 'g_burst': {
      // FASE 5: gerbang terbuka. Ledakan sesaat (t<0.25): tubuh menegak, dada membusung, lengan terentang, berteriak.
      // Lalu menghantam ke POSE KEKUATAN: mendak lebar, badan condong ke depan, kedua kepalan terangkat di sisi tubuh, kepala maju.
      const w = Math.sin(Math.PI * cl01(t / 0.25));
      stance(0.1, 1.5 + 0.05 * w);
      const dn = (1.35 - 0.95 * w) * s;
      hip.y += dn; neck.y += dn + 0.3 * s * (1 - w); head.y += dn + 0.3 * s * (1 - w) - 1.1 * w * s;
      lean(1.1 - 1.9 * w, -0.15 + 0.5 * w);
      head = add(head, D(0.8 * (1 - w)), V(0, 0.35 * s * (1 - w)));
      fhand = add(neck, D(3.2 + 2.0 * w, -1.1 + 2.6 * w), V(0, 0.2 * s * (1 - w)));   // kepalan di sisi tubuh setinggi dada, jauh dari wajah
      bhand = add(neck, D(-2.6 - 2.0 * w, -1.3 + 2.6 * w), V(0, 0.3 * s * (1 - w)));
      break;
    }
    case 'g_stance': {
      // FASE 6: POSE KEKUATAN (aura stabil), mengikuti gambar referensi: mendak lebar, badan condong, bahu naik,
      // kedua kepalan terangkat di kedua sisi tubuh, kepala maju dengan gigi terkatup; bergetar halus oleh tenaga
      const e = smooth(t * 3);
      const pw = Math.sin(o.time * 47) * 0.1 * s, br = Math.sin(o.time * 8.5) * 0.18 * s;
      stance(0.1, 1.5);
      const dn = 1.35 * s;
      hip.y += dn; neck.y += dn + 0.3 * s + br; head.y += dn + 0.3 * s + br;
      lean(1.1 * e, -0.15 * e);
      neck = add(neck, V(pw, 0)); head = add(head, D(0.8 * e), V(pw, 0.35 * s * e));
      fhand = add(neck, D(3.2, -1.1), V(pw * 1.5, -br * 0.5));
      bhand = add(neck, D(-2.6, -1.3), V(-pw * 1.5, br * 0.5));
      kneeUp = 0.2 * s;
      break;
    }
    case 'shoot': {
      const rc = o.recoil ?? 0;
      // pixelfx AIM (rc~0): gun out, slight crouch. KICK (rc=1): muzzle snaps UP then settles.
      hip.y += (0.7 + 0.5 * rc) * s;
      fhand = add(neck, D(5.2 - 1.8 * rc, 0.2 + 2.6 * rc), V(0, loco ? heldLag : 0)); // tangan pemegang: inersia tipis
      bhand = o.weapon === 'rifle' || o.weapon === 'smg' || o.weapon === 'shotgun' ? add(neck, D(2.8 - 1.2 * rc, -0.2 + 0.8 * rc))
        : loco && freeHand ? freeHand                       // pistol 1 tangan: tangan bebas berayun normal saat lari
        : add(neck, D(0.4), V(0, 2.2 * s));
      lean(-0.5 - 1.4 * rc, 0.15 * rc);
      head = add(head, D(0.4 * rc, 0.3 * rc));
      if (!o.moving) { ffoot = add(ffoot, D(1.4)); bfoot = add(bfoot, D(-1.6)); }
      break;
    }
    case 'reload': {
      const w = Math.sin(o.time * 14) * 0.8 * s;
      fhand = add(neck, D(2.5, -1.5)); bhand = add(neck, D(1.2, -1.2), V(0, w));
      head = add(head, D(0.8, -0.6));
      break;
    }
    case 'windup':
      stance(-0.55 * quick, 1.25);
      twist(-0.7 * quick);
      bhand = add(neck, D(-2.8 * quick), V(0, -1.2 * s * quick));
      fhand = add(neck, D(2.2), V(0, 0.1 * s), P(-1.1 * f));
      lean(-1.1 * quick, 0.1 * quick);
      hip.y += 1.2 * s * quick;
      break;
    case 'charge':
      lean(3, 1);
      fhand = add(neck, D(-3), V(0, 2 * s)); bhand = add(neck, D(-2), V(0, 3 * s));
      break;
    case 'throw':
      bhand = add(neck, D(-3 + 10 * quick), V(0, -4 * s + 5 * s * quick)); fhand = add(neck, D(2));
      break;
    case 'carry_pot': {
      // POT DIBAWA 1 TANGAN: tangan depan (fhand) memegang pot di samping bahu/pinggang belakang siap melempar,
      // tangan satunya (bhand) terentang ke depan untuk membidik sasaran (atau berayun bebas saat berlari).
      const bob = Math.sin(o.time * 4.5) * 0.25 * s;
      if (!loco) {
        stance(-0.22, 1.25);
        hip.y += 0.35 * s;
        twist(-0.38);
        lean(-0.18, 0.15);
      }
      fhand = add(neck, D(-1.85, 0.9), V(0, (-0.35 + heldLag) * s + bob), P(1.25 * f));
      bhand = freeHand ?? add(neck, D(3.6, 0.35), V(0, 0.25 * s - bob * 0.5), P(-1.15 * f));
      break;
    }
    case 'throw_pot': {
      // ANIMASI LEMPAR POT 1 TANGAN (Pitcher Whip Throw):
      // 1) Windup (t < 0.34): putar bahu ke belakang, tarik 1 tangan pemegang pot jauh ke belakang, angkat kaki depan memuat tenaga, tangan satunya menunjuk target!
      // 2) Whip Snap (0.34 <= t < 0.68): pinggang & bahu melecut berputar ke depan, 1 tangan melemparkan pot secepat peluru dengan busur kecepatan!
      // 3) Follow-through (t >= 0.68): kaki belakang terangkat menyeimbangkan tolakan, tangan mengayun melintasi dada.
      if (t < 0.34) {
        const u = easeOut(cl01(t / 0.34));
        stance(-0.78 * u, 1.36);
        hip.y += 0.65 * u * s;
        twist(-1.25 * u);
        lean(-0.95 * u, 0.35 * u);
        // Kaki depan sedikit terangkat seperti pitcher bisbol mengumpulkan tenaga
        ffoot = add(ffoot, D(-0.6 * u), V(0, -1.35 * u * s));
        kneeUp = 1.4 * u * s;
        // Tangan pemegang pot (fhand) ditarik jauh ke belakang bahu, tangan pembidik (bhand) menunjuk lurus ke depan
        fhand = add(neck, D(-4.2 * u, 1.8 * u), V(0, -1.4 * u * s), P(1.5 * f * u));
        bhand = add(neck, D(4.0 * u, 0.55 * u), V(0, 0.15 * s), P(-1.2 * f));
      } else if (t < 0.68) {
        const u = easeOut(cl01((t - 0.34) / 0.34));
        stance(-0.78 + 2.15 * u, 1.44);
        hip.y += (0.65 - 0.25 * u) * s;
        twist(-1.25 + 2.85 * u);
        lean(-0.95 + 2.75 * u, 0.35 * (1 - u));
        // Kaki belakang ikut terangkat saat melecutkan lemparan 1 tangan
        bfoot = add(bfoot, D(0.9 * u), V(0, (sv ? -0.8 : -1.6) * u * s));
        // Tangan pelempar (fhand) melecut tajam melewati bahu lurus ke depan!
        fhand = add(neck, D(-4.2 + 10.6 * u, 1.8 - 1.1 * u), V(0, (-1.4 + 1.8 * u) * s), P(1.5 * f * (1 - u)));
        // Tangan pembidik (bhand) ditarik ke rusuk belakang sebagai counter-torque
        bhand = add(neck, D(4.0 - 5.8 * u), V(0, (0.15 + 1.5 * u) * s), P(-1.5 * f));
        trail = { cx: neck.x, cy: neck.y - 0.3 * s, rx: 9.8 * s, ry: 5.2 * s, from: o.aim - f * 2.1, to: o.aim + f * 0.25 };
      } else {
        const u = easeInOut(cl01((t - 0.68) / 0.32));
        stance(lerp(1.37, 0.2, u), lerp(1.44, 1.2, u));
        twist(lerp(1.6, 0, u));
        lean(lerp(1.8, 0.15, u), 0);
        fhand = add(neck, D(lerp(6.4, 3.2, u), lerp(0.7, -0.3, u)), V(0, lerp(0.4, 0.8, u) * s));
        bhand = add(neck, D(lerp(-1.8, 1.6, u)), V(0, lerp(1.65, 1.0, u) * s), P(-1.3 * f));
      }
      break;
    }
    case 'carry_comp': {
      // KOMPUTER / MEJA DIANGKAT 2 TANGAN: kedua tangan (fhand & bhand) mengangkat komputer tinggi di atas kepala,
      // lutut sedikit menekuk menahan bobot berat, punggung tegap sedikit condong ke belakang.
      const strain = Math.sin(o.time * 5.2) * 0.22 * s;
      if (!loco) {
        stance(0.1, 1.38);
        hip.y += 0.72 * s; neck.y += 0.55 * s; head.y += 0.45 * s;
        lean(-0.38, 0.25);
        kneeUp = 0.55 * s;
      } else {
        hip.y += 0.45 * s;
      }
      fhand = add(neck, D(1.45, 3.8), V(0, (-3.65 + heldLag) * s + strain), P(1.4 * f));
      bhand = add(neck, D(-0.95, 3.6), V(0, (-3.55 + heldLag) * s + strain), P(-1.4 * f));
      break;
    }
    case 'throw_comp': {
      // ANIMASI LEMPAR KOMPUTER 2 TANGAN (Two-Handed Overhead Smash Heave):
      // 1) Deep Overhead Arch (t < 0.38): kedua kaki menancap lebar, punggung melengkung jauh ke belakang, KEDUA TANGAN menarik komputer di belakang kepala!
      // 2) Explosive Two-Handed Heave (0.38 <= t < 0.70): seluruh badan membanting maju, KEDUA TANGAN menghantam serentak melontarkan komputer!
      // 3) Follow-through (t >= 0.70): kedua tangan terentang di depan setelah melepaskan beban berat.
      if (t < 0.38) {
        const u = easeOut(cl01(t / 0.38));
        stance(-0.7 * u, 1.48);
        hip.y += 1.25 * u * s; neck.y += 0.9 * u * s; head.y += 0.7 * u * s;
        lean(-1.55 * u, 0.75 * u);
        kneeUp = 1.15 * u * s;
        const c = add(neck, D(-2.8 * u, 3.9), V(0, (-4.1 - 0.85 * u) * s));
        fhand = add(c, D(0.9), P(1.45 * f));
        bhand = add(c, D(-0.9), P(-1.45 * f));
      } else if (t < 0.70) {
        const u = easeOut(cl01((t - 0.38) / 0.32));
        stance(-0.7 + 2.05 * u, 1.54);
        hip.y += (1.25 + 0.75 * u) * s; neck.y += (0.9 + 0.85 * u) * s; head.y += (0.7 + 0.8 * u) * s;
        lean(-1.55 + 3.85 * u, 0.75 - 1.25 * u);
        bfoot = add(bfoot, D(0.8 * u), V(0, (sv ? -0.5 : -1.1) * u * s));
        const c = add(neck, D(-2.8 + 8.8 * u, 3.9 - 4.3 * u), V(0, (-4.95 + 6.3 * u) * s));
        fhand = add(c, D(0.85), P(1.35 * f));
        bhand = add(c, D(-0.85), P(-1.35 * f));
        trail = { cx: neck.x + 1.2 * f * s, cy: neck.y - 1.2 * s, rx: 10.6 * s, ry: 7.4 * s, from: o.aim - f * 2.2, to: o.aim + f * 0.35 };
      } else {
        const u = easeInOut(cl01((t - 0.70) / 0.30));
        stance(lerp(1.35, 0.2, u), lerp(1.54, 1.22, u));
        hip.y += lerp(2.0, 0.4, u) * s;
        lean(lerp(2.3, 0.2, u), lerp(-0.5, 0, u));
        const c = add(neck, D(lerp(6.0, 2.8, u), lerp(-0.4, -0.3, u)), V(0, lerp(1.35, 0.9, u) * s));
        fhand = add(c, D(0.6), P(1.2 * f));
        bhand = add(c, D(-0.6), P(-1.2 * f));
      }
      break;
    }
    case 'parry':
      fhand = add(neck, D(3, 1.5), P(1.5)); bhand = add(neck, D(3, 1), P(-1.5));
      ffoot = V(3 * s * f, 0); bfoot = V(-3 * s * f, 0);
      break;
    case 'stagger': {
      const w = Math.sin(o.time * 25) * 1.5 * s;
      head.x += w; neck.x += w * 0.5;
      fhand = add(neck, V(2 * s, 4 * s)); bhand = add(neck, V(-2 * s, 4 * s));
      ffoot = V(3 * s * f, 0); bfoot = V(-3 * s * f, 0);
      break;
    }
    case 'hurt':
      lean(-2, 0);
      fhand = add(neck, V(3 * s, -2 * s)); bhand = add(neck, V(-3 * s, -2 * s));
      break;
    case 'dash': {
      const lv = L(3.5);
      neck = add(neck, lv); head = add(head, V(lv.x * 1.3, lv.y * 1.3)); hip = add(hip, L(1.2));
      ffoot = add(L(-3.5), V(-s, -1.5 * s)); bfoot = add(L(-5), V(s, -2.5 * s));
      fhand = add(neck, L(-2.5), V(s, 2 * s)); bhand = add(neck, L(-2.5), V(-s, 2 * s));
      break;
    }
    case 'broken': {
      // game1-style downed slump: half-sitting, hands propping, legs splayed, pain sway
      const w = Math.sin(o.time * 6) * 0.5 * s;
      hip = V(0, -1.6 * s); neck = V(-f * 1.2 * s + w * 0.4, -3.4 * s); head = V(-f * 1.8 * s + w, -4.6 * s);
      fhand = V(-f * 3.2 * s + w, -0.4 * s); bhand = V(f * 1.4 * s, -0.6 * s);
      ffoot = V(f * 3.4 * s, 0); bfoot = V(f * 1.6 * s + w * 0.5, -0.8 * s);
      break;
    }
    case 'curled': {
      // rebah miring, anggota badan terkulai longgar (bukan meringkuk)
      const sw = Math.sin(o.time * 4) * 0.25 * s;
      hip = V(0, -1.3 * s); neck = V(f * 2.8 * s, -1.9 * s); head = V(f * 4.5 * s, -2.3 * s);
      ffoot = V(-f * 3.2 * s, -0.2 * s); bfoot = V(-f * 1.4 * s + sw, -1.1 * s);
      fhand = V(f * 4.2 * s, -0.7 * s); bhand = V(f * 1.2 * s + sw, -2.1 * s);
      break;
    }
    case 'getup': {
      // pushing up off the floor: one knee under, hands down, head rising (game1 getup)
      hip = V(0, -2.6 * s); neck = V(f * 1.8 * s, -4.2 * s); head = V(f * 2.6 * s, -5.4 * s);
      fhand = V(f * 3.4 * s, -0.4 * s); bhand = V(f * 0.6 * s, -0.2 * s);
      ffoot = V(-f * 1.6 * s, 0); bfoot = V(-f * 3.2 * s, -1.4 * s);
      break;
    }
    case 'fly': {
      // game1-style airborne flail: arms windmill in circles, legs paddle — a tumbling
      // body reads as ragdoll instead of a spinning plank
      const w1 = o.time * 17, w2 = w1 + 2.4;
      hip = V(0, -3.2 * s); neck = V(f * 2.2 * s, -4.2 * s); head = V(f * 3.6 * s, -5.2 * s);
      fhand = V(neck.x + Math.cos(w1) * 3.4 * s, neck.y + Math.sin(w1) * 3.4 * s);
      bhand = V(neck.x + Math.cos(w2) * 3.4 * s, neck.y + Math.sin(w2) * 3.4 * s);
      const k1 = Math.sin(o.time * 15) * 1.4 * s;
      ffoot = V(-f * 3.2 * s, -1.6 * s + k1); bfoot = V(-f * 4.4 * s, -3 * s - k1);
      break;
    }
    case 'knock': {
      // game1-style knocked ragdoll: flopped backwards, limbs flailing (wobble via o.time),
      // reads as a funny crumpled body instead of a flat plank
      const tw = Math.sin(o.time * 22) * 0.8 * s;
      hip = V(-f * 1 * s, -2 * s);
      neck = V(-f * 4 * s, -3.2 * s);
      head = V(-f * 6.5 * s, -3.6 * s);
      ffoot = V(f * 3.5 * s, -2.2 * s + tw * 0.5); bfoot = V(f * 2 * s, -0.6 * s - tw * 0.5);
      fhand = V(-f * 2.5 * s, -5.2 * s + tw); bhand = V(-f * 5.5 * s, -1.2 * s - tw);
      break;
    }


    // ================= TAKAMURA (old-man iaijutsu master) ======================================
    case 't_cane': {
      // leaning on the sheathed katana like a walking stick: hunched, head bowed, both palms stacked on the pommel
      const br = Math.sin(o.time * 2.1) * 0.25 * s;
      hip = V(-0.5 * f * s, -3.8 * s);
      neck = V(1.5 * f * s, -7.0 * s + br);
      head = V(3.3 * f * s, -8.4 * s + br * 1.2);
      ffoot = V(2.6 * s * f, 0); bfoot = V(-2.2 * s * f, 0); kneeUp = 0.5 * s;
      fhand = V(3.5 * f * s, -5.4 * s + br * 0.6); bhand = V(3.3 * f * s, -5.1 * s + br * 0.6);
      break;
    }
    case 't_iai': {
      // iaijutsu ready: low wide stance, bent forward, head down in shadow, LEFT hand on the saya at the hip,
      // RIGHT hand already wrapped around the tsuka. cg (0..1) = coil while charging: sinks lower and trembles.
      const cg = cl01(o.tkp ?? 0);
      const br = Math.sin(o.time * 2.6) * 0.22 * s, sh = Math.sin(o.time * 70) * 0.3 * cg * s;
      const dn = (0.5 + 0.9 * cg) * s;
      ffoot = V((4.2 + 0.8 * cg) * s * f, 0); bfoot = V(-(3.4 + 0.6 * cg) * s * f, 0); kneeUp = (1.2 + 0.6 * cg) * s;
      hip = V(0.3 * f * s, -3.2 * s + dn * 0.6);
      neck = V((2.4 + 0.8 * cg) * f * s + sh, -6.5 * s + dn + br);
      head = V((4.4 + 0.8 * cg) * f * s + sh, -7.4 * s + dn * 1.05 + br * 1.2);
      bhand = V(hip.x + 1.8 * f * s, hip.y - 0.4 * s);
      fhand = V(bhand.x + 4.2 * f * s, bhand.y - 0.4 * s);
      break;
    }
    case 't_slash': {
      // the cut itself: the sword arm lies along the blade angle tka, hips lunge into it, the left hand drags the saya back
      const a = o.tka ?? o.aim, ext = cl01(o.tkp ?? 0);
      stance(0.3 + 0.8 * ext, 1.1);
      twist(0.9 * ext); lean(1.8 * ext, 0.1 * ext);
      const rr = (2.2 + 2.8 * ext) * s;
      fhand = add(neck, V(Math.cos(a) * rr, Math.sin(a) * rr * 0.6 + 0.4 * s));
      bhand = add(hip, D(-1.2), V(0, -0.8 * s));
      kneeUp = 0.9 * s * ext;
      const hh = (o.tkh ?? 0) * s;
      if (hh > 0) {
        // leaping slash: body lifts, the legs tuck up under the hips
        hip = add(hip, V(0, -hh)); neck = add(neck, V(0, -hh)); head = add(head, V(0, -hh)); fhand = add(fhand, V(0, -hh)); bhand = add(bhand, V(0, -hh));
        ffoot = add(ffoot, V(0, -hh * 0.92)); bfoot = add(bfoot, V(-f * 0.8 * s, -hh * 0.7)); kneeUp = Math.max(kneeUp, 1.8 * s);
      }
      break;
    }
    case 't_sheath': {
      // noto: the blade slides home along the saya while the body rises back into the hunch
      const u = easeInOut(cl01(t)), a = o.tka ?? o.aim, ext0 = cl01(o.tkp ?? 0.6) * (1 - u);
      stance(0.3 * (1 - u), 1.1);
      lean(1.2 * ext0, 0);
      neck = add(neck, V(0, 0.8 * u * s));
      const rr = (2.2 + 2.8 * ext0) * s;
      const out = add(neck, V(Math.cos(a) * rr, Math.sin(a) * rr * 0.6 + 0.4 * s));
      bhand = add(hip, V(f * 1.8 * s, -0.5 * s));
      fhand = mix(out, V(bhand.x + 4.2 * f * s, bhand.y - 0.4 * s), u);
      break;
    }

    // ================= HAYABUSA (Raiden / Ninja Gaiden katana) ================================
    case 'h_idle': {
      // ninja ready: athletic crouch, blade drawn pointing back-down, free hand guarding
      const br = Math.sin(o.time * 5.2) * 0.35 * s;
      stance(0.35, 1.15); kneeUp = 1.1 * s;
      hip = add(hip, V(0, 0.6 * s + br * 0.4));
      neck = add(neck, V(f * 0.4 * s, br));
      head = add(head, V(f * 0.5 * s, br * 1.1));
      fhand = add(neck, D(2.4), V(0, 1.6 * s), P(1.4 * f));
      bhand = add(hip, D(-1.6), V(0, -0.6 * s), P(-1.2 * f));
      break;
    }
    case 'h_slash': {
      const a = o.tka ?? o.aim, ext = cl01(o.tkp ?? 0);
      stance(0.4 + 0.7 * ext, 1.15);
      twist(1.0 * ext); lean(1.4 * ext, 0.15 * ext);
      const rr = (2.4 + 3.0 * ext) * s;
      fhand = add(neck, V(Math.cos(a) * rr, Math.sin(a) * rr * 0.6 + 0.2 * s));
      bhand = add(hip, D(-1.4), V(0, -1.0 * s));
      kneeUp = 1.0 * s * ext;
      const hh = (o.tkh ?? 0) * s;
      if (hh > 0) {
        hip = add(hip, V(0, -hh)); neck = add(neck, V(0, -hh)); head = add(head, V(0, -hh)); fhand = add(fhand, V(0, -hh)); bhand = add(bhand, V(0, -hh));
        ffoot = add(ffoot, V(0, -hh * 0.85)); bfoot = add(bfoot, V(-f * 0.6 * s, -hh * 0.65)); kneeUp = Math.max(kneeUp, 1.6 * s);
      }
      break;
    }
    case 'h_spin': {
      // aerial rave: body rotates around the hips, legs tucked, sword arm long
      const a = o.tka ?? o.aim, ext = cl01(o.tkp ?? 0);
      const hh = (o.tkh ?? 0) * s;
      const ph = (o.t ?? 0) * Math.PI * 2;
      hip = V(0, (-5.2 * s) - hh);
      neck = add(hip, V(Math.cos(ph) * 1.4 * s, -3.2 * s));
      head = add(neck, V(Math.cos(ph) * 0.6 * s, -2.8 * s));
      const rr = (3.2 + 2.2 * ext) * s;
      fhand = add(hip, V(Math.cos(a) * rr, Math.sin(a) * rr * 0.6));
      bhand = add(hip, V(-Math.cos(a) * 2.4 * s, -Math.sin(a) * 1.4 * s - 1.2 * s));
      ffoot = add(hip, V(Math.cos(ph + 0.8) * 3.6 * s, Math.sin(ph + 0.8) * 2.0 * s + 2.2 * s));
      bfoot = add(hip, V(Math.cos(ph + 3.6) * 3.6 * s, Math.sin(ph + 3.6) * 2.0 * s + 2.2 * s));
      kneeUp = 1.6 * s;
      trail = { cx: hip.x, cy: hip.y, rx: rr * 1.05, ry: rr * 0.62, from: a - 1.6, to: a };
      break;
    }
    case 'h_blade': {
      // blade mode: upright, sword pointed at the target, other hand on the hilt, a coiled spring
      const a = o.tka ?? o.aim, cg = cl01(o.tkp ?? 0);
      stance(0.2 + 0.4 * cg, 1.2); kneeUp = (1.2 + 0.4 * cg) * s;
      lean(0.6, 0.1);
      fhand = add(neck, V(Math.cos(a) * 3.6 * s, Math.sin(a) * 2.2 * s + 0.4 * s));
      bhand = add(fhand, V(-Math.cos(a) * 2.2 * s, -Math.sin(a) * 1.3 * s));
      const sh = Math.sin(o.time * 55) * 0.25 * cg * s;
      neck = add(neck, V(sh, 0)); head = add(head, V(sh, 0));
      break;
    }
    case 'h_izuna': {
      // izuna drop: inverted spin, one arm down (holding the victim), sword arm whipping
      const a = o.tka ?? o.aim, u = cl01(o.t), hh = (o.tkh ?? 0) * s;
      const ph = u * Math.PI * 4;
      hip = V(Math.sin(ph) * 1.2 * s, (-6.5 * s) - hh);
      neck = add(hip, V(Math.cos(ph) * 2.2 * s, 3.4 * s));
      head = add(neck, V(Math.cos(ph) * 1.1 * s, 2.6 * s));
      fhand = add(hip, V(Math.cos(a) * 5.4 * s, Math.sin(a) * 3.2 * s));
      bhand = add(hip, V(0, 5.5 * s)); // grabbing down
      ffoot = add(hip, V(Math.cos(ph + 1.2) * 4.2 * s, Math.sin(ph + 1.2) * 2.4 * s - 1.5 * s));
      bfoot = add(hip, V(Math.cos(ph + 4.0) * 4.2 * s, Math.sin(ph + 4.0) * 2.4 * s - 1.5 * s));
      kneeUp = 1.8 * s;
      trail = { cx: hip.x, cy: hip.y, rx: 6.2 * s, ry: 3.6 * s, from: ph - 1.8, to: ph };
      break;
    }
    // Imported V2 dance poses; V1 keeps its original animation set.
    case 'y2_idle': {
      const groove = Math.sin(o.time * 4.5), bob = Math.abs(groove) * 0.9 * s;
      stance(groove * 0.3, 1.3);
      hip.y -= bob * 0.4; neck.y -= bob; head.y -= bob;
      ffoot = add(ffoot, D(groove * 1.5), V(0, -Math.max(0, groove) * s));
      bfoot = add(bfoot, D(-groove * 1.5), V(0, Math.min(0, groove) * s));
      fhand = add(neck, D(4.5 + groove), P(1.4 * f), V(0, 1.5 * s));
      bhand = add(neck, D(-0.5 - groove), P(-1.8 * f), V(0, -1.5 * s));
      break;
    }
    case 'y2_throw': {
      stance(-0.2 * ch + 0.6 * kp, 1.2);
      fhand = add(neck, D(2 + 6 * kk, 1.4 - kk), P((1.8 - 2 * kk) * f));
      bhand = add(neck, D(-2), P(-1.3 * f), V(0, -1.5 * s));
      twist(0.8 * kk); lean(1.2 * kp, 0.2 * kp);
      break;
    }
    case 'y2_toprock': {
      const step = Math.sin(Math.PI * t), rock = Math.sin(Math.PI * 2 * t);
      stance(0.25 * rock, 1.45);
      hip = add(hip, D(1.2 * rock), V(0, -1.3 * s * step));
      neck = add(neck, D(2.2 * rock), V(0, -1.7 * s * step));
      head = add(head, D(2.7 * rock), V(0, -1.7 * s * step));
      ffoot = add(D(2.5 + 5 * step), P(2.2 * f), V(0, -2.7 * s * step));
      bfoot = add(D(-3.4 - 2 * step), P(-2 * f), V(0, -0.6 * s * (1 - step)));
      fhand = add(neck, D(2 + 6 * kk), P((3.3 - 4.5 * kk) * f), V(0, -1.8 * s * rock));
      bhand = add(neck, D(-3 - rock), P(-2.2 * f), V(0, -2.2 * s * step));
      break;
    }
    case 'y2_crossstep': {
      const step = Math.sin(Math.PI * t), swing = Math.sin(Math.PI * 2 * t);
      hip = add(hip, D(-1.5 * step), P(2.8 * f * step), V(0, 1.2 * s * step));
      neck = add(neck, D(2.5 * step), P(-2 * f * step), V(0, 0.4 * s * step));
      head = add(head, D(3.5 * step), P(-2.5 * f * step));
      ffoot = add(D(-2.2 + 8 * step), P((-2.8 + 4 * step) * f), V(0, -3.2 * s * step));
      bfoot = add(D(2.8 - 7 * step), P((2.8 - 4 * step) * f), V(0, -0.8 * s * (1 - step)));
      fhand = add(neck, D(3.5 + 5 * kk), P((2.5 * swing - 1) * f), V(0, -2 * s * step));
      bhand = add(neck, D(-3), P(-2.8 * f), V(0, -2.2 * s * step));
      break;
    }
    case 'y2_windmill': {
      const spin = easeInOut(cl01((t - 0.1) / 0.8)) * Math.PI * 2;
      bboyRig(spin, danceEnvelope);
      trail = { cx: 0, cy: -3 * s, rx: 11 * s, ry: 5 * s, from: spin - 2.4, to: spin };
      break;
    }
    case 'y2_freeze': {
      const settle = smooth((t - 0.08) / 0.3);
      const angle = 2.3 * settle + Math.sin((o.dancePhase ?? o.time * 10) * 0.7) * 0.12 * danceEnvelope;
      bboyRig(angle, danceEnvelope);
      trail = { cx: 0, cy: -4 * s, rx: 10 * s, ry: 5 * s, from: angle - 1.8, to: angle };
      break;
    }
    case 'y2_spin': {
      const angle = (o.dancePhase ?? o.time * 16) * 0.5;
      bboyRig(angle, danceEnvelope);
      trail = { cx: 0, cy: -3 * s, rx: 12 * s, ry: 5 * s, from: angle - 2.5, to: angle };
      break;
    }
    case 'y2_airflip': {
      const angle = easeInOut(cl01((t - 0.08) / 0.84)) * Math.PI * 2;
      bboyRig(angle, danceEnvelope, false);
      trail = { cx: 0, cy: -5 * s, rx: 11 * s, ry: 8 * s, from: angle - 2.2, to: angle };
      break;
    }
    // ================= YOYO / BREAKDANCE =======================================================
    // Ground moves (six-step, windmill, headspin, flare) blend from the normal stance via `up` so they drop in and out
    // of the floor smoothly. Spinning limbs ride a squashed ellipse (y * 0.5) so the rotation reads as turning on the floor.
    case 'y_idle': {
      // b-boy groove: knee-dip on the beat, shoulders rock, head bobs, toe taps, free arm flows
      const en = 0.65 + 0.35 * cl01(t);
      const bt = o.time * 7.2 + (o.seed ?? 0), half = Math.sin(bt * 0.5);
      const dip = (0.5 + 0.5 * Math.cos(bt)) * 1.3 * en;
      hip = V(half * 1.0 * s * en, (-3.6 + dip) * s);
      neck = V(half * 1.7 * s * en + f * 0.6 * s, (-7.4 + dip * 1.15) * s);
      head = V(neck.x + f * 0.5 * s + Math.sin(bt) * 0.5 * s, neck.y - 3 * s + Math.sin(bt) * 0.45 * s);
      {
        const look = o.look ?? o.aim;
        const lx = Math.cos(look), ly = Math.sin(look) * 0.6;
        const sxv = -Math.sin(look), syv = Math.cos(look) * 0.6;
        ffoot = V((lx * 2.2 + sxv * 1.8 * f) * s, (ly * 2.2 + syv * 1.8 * f) * s - Math.max(0, half) * 1.5 * s);
        bfoot = V((-lx * 2.0 + sxv * -1.6 * f) * s, (-ly * 2.0 + syv * -1.6 * f) * s - Math.max(0, -half) * 1.5 * s);
      }
      kneeUp = 0.9 * s;
      fhand = add(neck, V(f * 3.6 * s, (2.2 + dip * 0.4) * s));
      bhand = add(neck, V(-f * (2.6 + half * 1.6) * s, (1.6 - Math.cos(bt) * 1.8) * s));
      break;
    }
    case 'y_trick': {
      // show-off tricks: wide low stance, free arm thrown up, body does the trick's own groove
      const sg = o.ysign ?? 1, sub = o.ysub ?? 0, w = Math.sin(cl01(t) * Math.PI);
      const sw = Math.sin(t * Math.PI * 4);
      ffoot = V(3.6 * s * f, 0); bfoot = V(-3.4 * s * f, 0); kneeUp = 1.0 * s;
      let hx = 0, nx = 0, ln = 0, dn = (1.3 + 1.3 * w) * s;
      if (sub === 0) { const ph = t * Math.PI * 4.5 * sg; nx = Math.cos(ph) * 1.8 * s; ffoot = V(Math.cos(ph) * 3.4 * s, Math.sin(ph) * 1.6 * s); bfoot = V(-Math.cos(ph) * 3.4 * s, -Math.sin(ph) * 1.6 * s); }
      else if (sub === 1) { ln = Math.sin(t * Math.PI * 4) * 2.2; }
      else if (sub === 2) { hx = sw * 2.2 * s; nx = -sw * 1.6 * s; }
      else if (sub === 3) { ln = t < 0.5 ? 3.2 * easeOut(t / 0.5) : 3.2 - 5.2 * easeOut((t - 0.5) / 0.5); }
      else {
        ln = t < 0.4 ? -2.2 * (t / 0.4) : t < 0.66 ? lerp(-2.2, 4.2, (t - 0.4) / 0.26) : 4.2;
        dn = (t < 0.4 ? -0.8 * easeOut(t / 0.4) : t < 0.66 ? lerp(-0.8, 3.6, (t - 0.4) / 0.26) : 3.6) * s;
      }
      hip = V(hx + f * ln * 0.35 * s, -4 * s + dn);
      neck = V(nx + hx * 0.6 + f * (ln * 0.9 + 0.8) * s, -7.8 * s + dn * 1.15);
      head = V(neck.x + f * (ln * 0.3 + 0.5) * s, neck.y - 3 * s);
      bhand = add(neck, V(-f * (3.4 - ln * 0.3) * s, -(1.8 + 2.4 * w) * s));
      fhand = add(neck, V(f * 3.8 * s, 1.5 * s));
      break;
    }
    case 'y_toprock': {
      // toprock: cross-step footwork, shoulders drop into the whip, the free arm flicks up behind
      const stp = Math.sin(t * Math.PI * 3);
      ffoot = V((3.0 + 2.6 * kp) * s * f, -Math.max(0, stp) * 1.2 * s);
      bfoot = V((-3.2 + stp * 1.6) * s * f, -Math.max(0, -stp) * 1.8 * s);
      kneeUp = 0.9 * s;
      const dn = (1.0 - 0.8 * kp) * s;
      hip = V(f * (1.2 * kp - 0.8 * ch) * s, -4 * s + dn);
      neck = V(f * (1.8 * kp - 1.4 * ch + 0.5) * s, -7.8 * s + dn * 1.1);
      head = V(neck.x + f * (0.8 + 0.8 * kp) * s, neck.y - 3 * s);
      fhand = add(neck, V(f * (0.5 - 1.5 * ch + 6 * kk) * s, (1 - 0.8 * kk) * s));
      bhand = add(neck, V(-f * (2.2 + 1.2 * kk) * s, -(1.2 + 2.2 * (1 - kk)) * s));
      break;
    }
    case 'y_sixstep':
    case 'y_windmill':
    case 'y_headspin': {
      const sg = o.ysign ?? 1;
      const su = cl01(t / 0.15), sd = cl01((t - 0.85) / 0.15);
      const up = easeInOut(su) * (1 - easeInOut(sd));
      const bl = (a: Vec, b: Vec): Vec => mix(a, b, up);
      let hipW: Vec, neckW: Vec, headW: Vec, fhW: Vec, bhW: Vec, ffW: Vec, bfW: Vec;
      if (o.pose === 'y_sixstep') {
        // hands planted, torso low, both legs sweep the floor in a circle
        const ph = t * Math.PI * 2 * 1.8 * sg, bob = Math.sin(ph * 2) * 0.35 * s;
        hipW = V(0, -3.6 * s + bob); neckW = V(f * 3.4 * s, -4.8 * s + bob); headW = V(f * 6.2 * s, -5.0 * s + bob * 0.5);
        fhW = V(neckW.x + f * 1.4 * s, -Math.max(0, Math.sin(ph * 2)) * 1.4 * s);
        bhW = V(neckW.x - f * 1.2 * s, -Math.max(0, -Math.sin(ph * 2)) * 1.4 * s);
        ffW = V(Math.cos(ph) * 5.8 * s, Math.sin(ph) * 3.3 * s - 0.6 * s);
        bfW = V(Math.cos(ph + 2.7) * 5.4 * s, Math.sin(ph + 2.7) * 3.1 * s - 1.8 * s);
        trail = { cx: 0, cy: -1 * s, rx: 5.8 * s, ry: 3.3 * s, from: ph - 1.7 * sg, to: ph };
      } else if (o.pose === 'y_windmill') {
        // shoulders on the floor, hips up, legs scissor-open and whirl overhead
        const ph = t * Math.PI * 2 * 2.3 * sg, bob = Math.sin(ph * 2) * 0.5 * s;
        hipW = V(f * 2.6 * s, -6.0 * s + bob); neckW = V(-f * 1.4 * s, -2.8 * s); headW = V(-f * 4.2 * s, -2.2 * s);
        const c2 = add(hipW, V(0, -3.0 * s));
        ffW = add(c2, V(Math.cos(ph) * 5.0 * s, Math.sin(ph) * 2.6 * s));
        bfW = add(c2, V(Math.cos(ph + Math.PI) * 5.0 * s, Math.sin(ph + Math.PI) * 2.6 * s));
        fhW = V(neckW.x + f * 1.6 * s, -Math.max(0, Math.sin(ph)) * 1.2 * s);
        bhW = V(neckW.x - f * 1.6 * s, -Math.max(0, -Math.sin(ph)) * 1.2 * s);
        trail = { cx: c2.x, cy: c2.y, rx: 5.0 * s, ry: 2.6 * s, from: ph - 1.9 * sg, to: ph };
      } else {
        // headspin: inverted on the head, legs open in a V and spinning like a rotor
        const ph = t * Math.PI * 2 * 3.6 * sg;
        headW = V(0, -2.4 * s); neckW = V(0, -5.0 * s); hipW = V(Math.sin(ph * 0.5) * 0.5 * s, -9.2 * s);
        const c2 = add(hipW, V(0, -2.4 * s));
        ffW = add(c2, V(Math.cos(ph) * 5.4 * s, Math.sin(ph) * 2.7 * s));
        bfW = add(c2, V(Math.cos(ph + Math.PI) * 5.4 * s, Math.sin(ph + Math.PI) * 2.7 * s));
        fhW = V(2.8 * s, 0); bhW = V(-2.8 * s, 0);
        trail = { cx: c2.x, cy: c2.y, rx: 5.4 * s, ry: 2.7 * s, from: ph - 2.0 * sg, to: ph };
      }
      hip = bl(hip, hipW); neck = bl(neck, neckW); head = bl(head, headW);
      fhand = bl(fhand, fhW!); bhand = bl(bhand, bhW!); ffoot = bl(ffoot, ffW!); bfoot = bl(bfoot, bfW!);
      kneeUp = 1.1 * s * up;
      if (up < 0.6) trail = null;
      break;
    }
    case 'y_flare': {
      // air flare -> freeze: hands on the floor, legs circling at hip height, pop up and lock a one-hand freeze
      const sg = o.ysign ?? 1;
      const up = easeInOut(cl01(t / 0.12));
      const fz = easeInOut(cl01((t - 0.56) / 0.14));
      const ph = cl01(t / 0.58) * Math.PI * 2 * 2.0 * sg;
      const hop = Math.sin(cl01((t - 0.5) / 0.24) * Math.PI) * 5.5 * s;
      const hipA = V(-f * 0.6 * s, -6.2 * s + Math.sin(ph * 2) * 0.4 * s), neckA = V(f * 2.8 * s, -4.4 * s), headA = V(f * 5.4 * s, -3.6 * s);
      const fhA = V(neckA.x + f * 1.2 * s, -Math.max(0, Math.sin(ph * 2)) * 1.3 * s), bhA = V(neckA.x - f * 1.3 * s, -Math.max(0, -Math.sin(ph * 2)) * 1.3 * s);
      const ffA = add(hipA, V(Math.cos(ph) * 5.4 * s, Math.sin(ph) * 2.6 * s + 0.2 * s));
      const bfA = add(hipA, V(Math.cos(ph + Math.PI) * 5.4 * s, Math.sin(ph + Math.PI) * 2.6 * s + 0.2 * s));
      const hipB = V(-f * 1.4 * s, -6.8 * s), neckB = V(f * 2.0 * s, -4.8 * s), headB = V(f * 4.6 * s, -6.2 * s);
      const fhB = V(f * 5.6 * s, -10.0 * s), bhB = V(f * 0.8 * s, 0);
      const ffB = V(f * 3.6 * s, -10.5 * s), bfB = V(-f * 5.2 * s, -8.2 * s);
      const pk = (a: Vec, b: Vec): Vec => { const m = mix(a, b, fz); return V(m.x, m.y - hop); };
      const fin = (d: Vec, a: Vec, b: Vec): Vec => mix(d, pk(a, b), up);
      hip = fin(hip, hipA, hipB); neck = fin(neck, neckA, neckB); head = fin(head, headA, headB);
      fhand = fin(fhand, fhA, fhB); bhand = fin(bhand, bhA, bhB); ffoot = fin(ffoot, ffA, ffB); bfoot = fin(bfoot, bfA, bfB);
      kneeUp = 1.2 * s * up;
      if (t > 0.12 && t < 0.58) trail = { cx: hipA.x, cy: hipA.y, rx: 5.4 * s, ry: 2.6 * s, from: ph - 1.9 * sg, to: ph };
      break;
    }
    case 'down': {
      const b = -f;
      hip = V(0, -2 * s); neck = V(b * 4 * s, -2 * s); head = V(b * 7 * s, -2.5 * s);
      ffoot = V(-b * 4 * s, -s); bfoot = V(-b * 4 * s, -3 * s);
      fhand = V(b * 3 * s, -5 * s); bhand = V(b * 2 * s, s);
      break;
    }
    default:
      break;
  }

  // squash & stretch (landing / takeoff): scale vertically around the feet
  if (o.squash && o.squash !== 1) {
    const sq = o.squash, wx = 1 + (1 - sq) * 0.6;
    const S = (v: Vec): Vec => V(v.x * wx, v.y * sq);
    hip = S(hip); neck = S(neck); head = S(head); fhand = S(fhand); bhand = S(bhand); ffoot = S(ffoot); bfoot = S(bfoot);
  }
  if (o.rot) {
    const cx = 0, cy = -5 * s, cs = Math.cos(o.rot), sn = Math.sin(o.rot);
    const R = (v: Vec): Vec => V(cx + (v.x - cx) * cs - (v.y - cy) * sn, cy + (v.x - cx) * sn + (v.y - cy) * cs);
    hip = R(hip); neck = R(neck); head = R(head); ffoot = R(ffoot); bfoot = R(bfoot); fhand = R(fhand); bhand = R(bhand);
  }
  const ls = o.limbScale ?? 1;
  if (o.handOverride) { const il = 1 / ls; fhand = V((o.handOverride.x - o.x) * il, (o.handOverride.y - o.y + (o.z ?? 0)) * il); }
  if (o.bhandOverride) { const il = 1 / ls; bhand = V((o.bhandOverride.x - o.x) * il, (o.bhandOverride.y - o.y + (o.z ?? 0)) * il); }
  const legLen = (loco ? 5.2 * 1.06 : 5.2) * s, armLen = 5.2 * s;
  if (kneeDir) {
    // choose the bend side so the knee points along the movement direction
    const pick = (a: Vec, b: Vec, fallback: number) => {
      const dxl = b.x - a.x, dyl = b.y - a.y;
      const dl = Math.hypot(dxl, dyl);
      if (dl < 0.5) return fallback;
      const nx = -dyl / dl, ny = dxl / dl; // bend=+1 normal
      const dot = nx * kneeDir!.x + ny * kneeDir!.y;
      return Math.abs(dot) < 0.05 ? fallback : dot > 0 ? 1 : -1;
    };
    fkneeBend = pick(hip, ffoot, fkneeBend); bkneeBend = pick(hip, bfoot, bkneeBend);
  }
  // terlempar hidup-hidup: tangan & kaki mengibas tak terkendali, bukan pose kaku
  if (o.flail && o.flail > 0.01) {
    const w = o.time * 15, k2 = o.flail * s;
    fhand = add(fhand, V(Math.sin(w) * 1.7 * k2, Math.cos(w * 1.3) * 1.5 * k2));
    bhand = add(bhand, V(Math.sin(w + 2.1) * 1.7 * k2, Math.cos(w * 1.1 + 1) * 1.5 * k2));
    ffoot = add(ffoot, V(Math.sin(w * 0.9 + 1.2) * 2.1 * k2, Math.cos(w * 1.2) * 1.7 * k2));
    bfoot = add(bfoot, V(Math.sin(w * 1.1 + 3) * 2.1 * k2, Math.cos(w * 0.8 + 2) * 1.7 * k2));
    head = add(head, V(Math.sin(w * 0.7) * 0.8 * k2, Math.cos(w * 0.9) * 0.5 * k2));
  }
  // ---- REAKSI KENA PUKUL: tubuh bereaksi sesuai bagian yang terkena
  if (o.react && o.react.k > 0.01) {
    const R = o.react, kk = Math.min(1.25, R.k), px = R.dx, py = R.dy;
    const mixV = (a: Vec, b: Vec, w: number): Vec => V(a.x + (b.x - a.x) * w, a.y + (b.y - a.y) * w);
    const jit = Math.sin(o.time * 58) * 0.45 * s * kk * kk;
    const w = Math.min(1, kk * 1.1);
    if (R.zone === 'head') {
      // kepala tersentak ke belakang, leher menegang, kedua tangan naik menutup wajah
      head = add(head, V(px * 3.7 * s * kk + jit, py * 3.7 * s * kk - 0.7 * s * kk));
      neck = add(neck, V(px * 1.3 * s * kk, py * 1.3 * s * kk));
      hip = add(hip, V(px * 0.7 * s * kk, py * 0.7 * s * kk));
      if (!o.handOverride) fhand = mixV(fhand, add(head, V(f * 1.9 * s, 1.6 * s)), 0.85 * w);
      if (!o.bhandOverride) bhand = mixV(bhand, add(head, V(-f * 0.4 * s, 2.4 * s)), 0.75 * w);
      bfoot = add(bfoot, V(px * 1.6 * s * kk, py * 1.2 * s * kk));
      kneeUp += 0.5 * s * kk;
    } else if (R.zone === 'torso') {
      // perut terhantam: pinggul terdorong, badan melipat ke depan, tangan memegangi perut
      // terhuyung ke belakang dengan badan agak membungkuk (bukan meringkuk): satu tangan menekan perut, satu lagi terbuka menjaga keseimbangan
      hip = add(hip, V(px * 2.6 * s * kk, py * 1.8 * s * kk + 0.5 * s * kk));
      neck = add(neck, V(px * 1.3 * s * kk + jit, py * 0.9 * s * kk + 0.85 * s * kk));
      head = add(head, V(px * 1.8 * s * kk, py * 1.1 * s * kk + 1.3 * s * kk));
      if (!o.handOverride) fhand = mixV(fhand, add(hip, V(f * 1.1 * s, -1.6 * s)), 0.75 * w);
      if (!o.bhandOverride) bhand = mixV(bhand, add(neck, V(-f * 3.6 * s, 0.8 * s + jit)), 0.7 * w);
      ffoot = add(ffoot, V(px * 1.7 * s * kk, py * 1.1 * s * kk));
      bfoot = add(bfoot, V(px * 2.8 * s * kk, py * 1.7 * s * kk));
      kneeUp += 0.8 * s * kk;
    } else {
      // bagian bawah: lutut tertekuk, satu kaki tersapu, badan oleng, tangan terbuka menjaga keseimbangan
      const dropV = 2.5 * s * kk;
      hip = add(hip, V(px * 0.9 * s * kk, dropV));
      neck = add(neck, V(px * 1.9 * s * kk, dropV * 0.95));
      head = add(head, V(px * 3.0 * s * kk, dropV * 0.85));
      const swept = R.side > 0 ? 'f' : 'b';
      const kick = V(px * 3.6 * s * kk, py * 2.2 * s * kk - 1.9 * s * kk);
      if (swept === 'f') ffoot = add(ffoot, kick); else bfoot = add(bfoot, kick);
      kneeUp += 2.2 * s * kk;
      if (!o.handOverride) fhand = mixV(fhand, add(neck, V(f * 3.5 * s, -2.7 * s + jit)), 0.8 * w);
      if (!o.bhandOverride) bhand = mixV(bhand, add(neck, V(-f * 3.5 * s, -2.1 * s - jit)), 0.8 * w);
    }
  }
  // ================= POSTUR PETARUNG (Fist Mode & Nunchaku): Pinggang, Badan, Kepala =================
  // Dipasang SEBELUM IK agar lutut dan siku menyesuaikan secara anatomis, sementara ujung pukulan/tendangan tetap akurat.
  // Berlaku baik di Side-View (Kantor) maupun Top-Down (Padang Rumput).
  const pst = o.posture ?? 0;
  if (pst > 0.01 && !o.react) {
    const fw = sv ? adx : (Math.abs(dx) > 0.15 ? (dx >= 0 ? 1 : -1) : f);
    const isNun = o.pose.startsWith('n_');
    const isKickPose = o.pose === 'roundhouse' || o.pose === 'kick' || o.pose === 'knee' || o.pose === 'cranekick';
    if (loco) {
      // Saat jalan/lari di Fist Mode & Nunchaku: pinggang sedikit mengeper atletis, badan tidak membungkuk berlebihan,
      // kepala tegak fokus menatap ke depan, dan tangan bebas nunchaku menjaga dada.
      const runK = clamp(o.run ?? 0, 0, 1);
      hip.y += 0.22 * pst * s;
      const tx = neck.x - hip.x, ty = neck.y - hip.y;
      const spineLen = clamp(Math.hypot(tx, ty) || 4.0 * s, 3.85 * s, 4.15 * s);
      if (-ty > 0.3 * spineLen) {
        const th = clamp(Math.atan2(tx * fw, -ty), -0.15, 0.12 + 0.14 * runK);
        neck = V(hip.x + fw * Math.sin(th) * spineLen, hip.y - Math.cos(th) * spineLen);
        const hd = 2.95 * s;
        const hth = clamp(th * 0.42 + 0.06, -0.10, 0.18);
        head = V(neck.x + fw * Math.sin(hth) * hd, neck.y - Math.cos(hth) * hd);
      }
      if (isNun && !o.bhandOverride) {
        bhand = add(neck, D(2.1, -0.25), V(0, 0.65 * s));
      }
    } else if (postureOk(o.pose)) {
      const ready = o.pose === 'idle' || o.pose === 'n_idle';
      const br = Math.sin(o.time * 3.8 + (o.seed ?? 0)) * 0.12 * s;
      if (o.pose === 'idle' && !o.handOverride && !o.bhandOverride) {
        // KUDA-KUDA FIST SIAGA: kepalan depan setinggi bahu/dada, kepalan belakang rapat menjaga rahang;
        // lutut mengeper, kaki kuda-kuda lebar seimbang.
        fhand = add(neck, D(3.35, -0.45), V(0, br));
        bhand = add(neck, D(1.65, -0.35), V(0, -br * 0.8));
        if ((o.brake ?? 0) < 0.05) {
          if (sv) { ffoot = V(2.6 * fw * s, 0); bfoot = V(-2.4 * fw * s, 0); kneeDir = { x: fw, y: 0 }; }
          kneeUp = Math.max(kneeUp, 0.38 * s);
        }
      } else if (isNun) {
        // KUDA-KUDA & AYUNAN NUNCHAKU: pinggang, badan, kepala, dan tangan penjaga ikut mengalir mengikuti ayunan nunchaku!
        if ((o.brake ?? 0) < 0.05 && o.pose === 'n_idle') {
          if (sv) { ffoot = V(2.65 * fw * s, 0); bfoot = V(-2.45 * fw * s, 0); kneeDir = { x: fw, y: 0 }; }
          kneeUp = Math.max(kneeUp, 0.42 * s);
        }
        const hx = ((fhand.x - neck.x) * fw) / Math.max(0.5, s);
        const hy = (fhand.y - neck.y) / Math.max(0.5, s);
        // Pinggang berputar & menggeser bobot mengikuti arah lontaran nunchaku
        const wShift = clamp((hx - 2.0) * 0.14, -0.55, 0.85) * pst * s;
        hip.x += fw * wShift;
        neck.x += fw * wShift * 1.35;
        head.x += fw * wShift * 1.45;
        // Tangan bebas (bhand) membentuk penjagaan kung-fu (open-palm guard di depan dada / tarik ke rusuk saat mengayun)
        if (!o.bhandOverride) {
          const guardFwd = clamp(2.45 - Math.max(0, hx - 2.0) * 0.24, 1.0, 2.75);
          const guardUp = clamp(-0.35 + hy * 0.07, -0.7, 0.35);
          bhand = add(neck, D(guardFwd, -guardUp), V(0, (0.55 - br * 0.6) * s), P(-1.15 * f));
        }
      }
      // (1) PINGGANG (HIP): merendah atletis (center of gravity mantap) + dorongan pegas pinggul dari chamber ke impact
      const sink = (ready ? 0.52 : isKickPose ? 0.20 : 0.46 + 0.32 * kp) * pst * s;
      const hipDrive = (!ready && !isKickPose ? (-0.36 * ch + 0.48 * kp - 0.24 * twAcc) : -0.18 * twAcc) * pst;
      hip.y += sink; neck.y += sink; head.y += sink;
      hip = add(hip, D(hipDrive));
      // (2) BADAN (SPINE / TORSO): panjang tulang belakang dikunci anatomis (~4.0*s) agar tidak melar/bungkuk berlebihan
      const tx = neck.x - hip.x, ty = neck.y - hip.y;
      const rawLen = Math.hypot(tx, ty) || 4.0 * s;
      const spineLen = clamp(rawLen, 3.85 * s, 4.18 * s);
      if (-ty > 0.28 * rawLen) {
        let th = Math.atan2(tx * fw, -ty);
        const targetIdle = isNun ? 0.11 : 0.14;
        const minTh = isKickPose ? -0.36 : -0.24;
        const maxTh = isKickPose ? 0.24 : isNun ? 0.33 : 0.35;
        const want = clamp(ready ? th + (targetIdle - th) * 0.88 * pst : th, minTh, maxTh);
        th = th + (want - th) * pst;
        neck = V(hip.x + fw * Math.sin(th) * spineLen, hip.y - Math.cos(th) * spineLen + (ready ? br * 0.45 : 0));
        // (3) KEPALA (HEAD): tegak proporsional di atas bahu, dagu sedikit ditarik (chin-tuck), mata lurus mengunci lawan
        const hd = 2.95 * s;
        const hth = clamp(th * 0.40 + (ready ? 0.08 : 0.06), -0.16, 0.22);
        const wH = 0.94 * pst;
        const hx = neck.x + fw * Math.sin(hth) * hd, hy = neck.y - Math.cos(hth) * hd;
        head = V(head.x + (hx - head.x) * wH, head.y + (hy - head.y) * wH);
      }
    }
  }
  const fknee = bendJoint(hip, ffoot, legLen, fkneeBend, fKneeUp ?? kneeUp, kneeDir);
  const bknee = bendJoint(hip, bfoot, legLen, bkneeBend, bKneeUp ?? kneeUp * 0.6, kneeDir);
  const armL = loco ? armLen * 1.0 : (o.pose === 'hook' || o.pose === 'bx_lhook' || o.pose === 'bx_rhook' || o.pose === 'drunk_sway') ? armLen * 1.15 : armLen;
  const elbowPose = s >= 1.4 || loco || o.pose.startsWith('n_') || o.pose.startsWith('b_') || o.pose.startsWith('a_') || o.pose.startsWith('drunk_') || o.pose.startsWith('bx_') || o.pose === 'carry_pot' || o.pose === 'throw_pot' || o.pose === 'carry_comp' || o.pose === 'throw_comp' || o.pose === 'idle' || o.pose === 'jump_anticip' || o.pose === 'windup' || o.pose === 'parry' || o.pose === 'jab' || o.pose === 'cross' || o.pose === 'punch' || o.pose === 'hook' || o.pose === 'elbow' || o.pose === 'uppercut' || o.pose === 'palm' || o.pose === 'chainpunch' || o.pose === 'chainfinish' || o.pose === 'k_ironpalm' || o.pose === 'k_hammerfist' || o.pose === 'runpunch';
  const felbow = elbowPose ? bendJoint(neck, fhand, armL, f) : null;
  const belbow = elbowPose ? bendJoint(neck, bhand, armL, f) : null;
  const applyTall = (sk: any): any => {
    if (!TALL_MODE) return sk;
    const sy = 1.34, sx = 1.07, limb = 1.22;
    const M = (v: any) => v ? V(v.x * sx, v.y * sy) : v;
    const L = (v: any, anchor: any) => v && anchor
      ? V(anchor.x * sx + (v.x - anchor.x) * sx * limb, anchor.y * sy + (v.y - anchor.y) * sy * limb)
      : M(v);
    return {
      ...sk,
      hip: M(sk.hip), neck: M(sk.neck), head: M(sk.head),
      fhand: L(sk.fhand, sk.neck), bhand: L(sk.bhand, sk.neck),
      ffoot: L(sk.ffoot, sk.hip), bfoot: L(sk.bfoot, sk.hip),
      fknee: M(sk.fknee), bknee: M(sk.bknee), felbow: M(sk.felbow), belbow: M(sk.belbow),
      trail: sk.trail ? { ...sk.trail, cx: sk.trail.cx * sx, cy: sk.trail.cy * sy, rx: sk.trail.rx * sx, ry: sk.trail.ry * sy } : null,
    };
  };
  if (ls !== 1) {
    const M = (v: Vec): Vec => V(v.x * ls, v.y * ls);
    const MN = (v: Vec | null): Vec | null => (v ? M(v) : null);
    return applyTall({
      hip: M(hip), neck: M(neck), head: M(head), ffoot: M(ffoot), bfoot: M(bfoot), fhand: M(fhand), bhand: M(bhand),
      fknee: MN(fknee), bknee: MN(bknee), felbow: MN(felbow), belbow: MN(belbow),
      trail: trail ? { cx: trail.cx * ls, cy: trail.cy * ls, rx: trail.rx * ls, ry: trail.ry * ls, from: trail.from, to: trail.to } : null,
    });
  }
  return applyTall({ hip, neck, head, ffoot, bfoot, fhand, bhand, fknee, bknee, felbow, belbow, trail });
}

const LOCO_POSES = new Set<string>(['idle', 'run', 'shoot', 'bow', 'charge', 'reload', 'carry_pot', 'carry_comp', 'n_idle', 'y2_idle', 'k_idle', 'a_idle', 'd_idle', 'bx_float', 'bx_weave', 'bx_press']);
const smoothMix = (m: number) => m * m * (3 - 2 * m);
/** DRUNKEN MASTER (Zui Quan / Jurus Mabuk — Gerbang 6):
 *  Saat Fist Mode, karakter mengambil kuda-kuda khas Dewa Mabuk (satu tangan memegang 'cawan arak' tinggi di depan/pelipis,
 *  tangan lain mengayun menyeimbangkan pinggang yang meliuk tak terduga), kepala miring santai, dan badan atas mengayun luwes. */
function applyDrunk(sk: Skeleton, o: StickOpts, k: number) {
  const t = o.time, s = o.scale, f = o.facing || 1;
  const sw = Math.sin(t * 1.85) * 0.52 + Math.sin(t * 2.95 + 1.3) * 0.28 + Math.sin(t * 0.95 + 2.1) * 0.32;
  const bob = Math.sin(t * 3.1 + 0.7) * 0.32;
  const loll = Math.sin(t * 2.4 + 0.6);
  const welded = !!(o.handOverride || o.bhandOverride);
  if (!welded) {
    // Pinggang ikut meliuk & naik-turun lembut ala Zui Quan
    sk.hip.x += sw * 0.38 * s * k;
    sk.hip.y += (0.28 + Math.abs(bob) * 0.45) * s * k;
    const th = sw * 0.22 * k, c = Math.cos(th), sn = Math.sin(th), cx = sk.hip.x, cy = sk.hip.y;
    const R = (v: Vec | null) => { if (!v) return; const x = v.x - cx, y = v.y - cy; v.x = cx + x * c - y * sn; v.y = cy + x * sn + y * c; };
    R(sk.neck); R(sk.head); R(sk.fhand); R(sk.bhand);
    if (o.pose === 'idle' && !o.moving && o.weapon === 'none') {
      // Kuda-kuda Drunken Master: tangan depan mengangkat 'cawan arak' setinggi wajah, tangan belakang mengayun rendah/samping
      const cupX = sk.neck.x + f * (3.1 + 0.55 * Math.sin(t * 3.1)) * s;
      const cupY = sk.neck.y + (-1.05 + 0.45 * Math.cos(t * 2.7)) * s;
      const gourdX = sk.neck.x + f * (-1.15 + 0.65 * Math.cos(t * 2.4)) * s;
      const gourdY = sk.neck.y + (0.85 + 0.55 * Math.sin(t * 3.5)) * s;
      sk.fhand.x += (cupX - sk.fhand.x) * 0.85 * k;
      sk.fhand.y += (cupY - sk.fhand.y) * 0.85 * k;
      sk.bhand.x += (gourdX - sk.bhand.x) * 0.85 * k;
      sk.bhand.y += (gourdY - sk.bhand.y) * 0.85 * k;
    } else {
      const lx = Math.sin(t * 3.4 + 0.4) * 0.75 * s * k, ly = Math.cos(t * 2.7) * 0.55 * s * k;
      sk.fhand.x += lx; sk.fhand.y += ly;
      sk.bhand.x += Math.sin(t * 3.0 + 2.0) * 0.75 * s * k;
      sk.bhand.y += Math.cos(t * 3.5 + 1.1) * 0.55 * s * k;
    }
    const armL = 5.2 * s * (o.limbScale ?? 1);
    sk.felbow = bendJoint(sk.neck, sk.fhand, armL, f);
    sk.belbow = bendJoint(sk.neck, sk.bhand, armL, f);
    if (LOCO_POSES.has(o.pose) && !o.moving) {
      const fx = sw * 0.48 * s * k, bx = -sw * 0.28 * s * k;
      sk.ffoot.x += fx; sk.bfoot.x += bx;
      const legL = 5.2 * s * (o.limbScale ?? 1);
      sk.fknee = bendJoint(sk.hip, sk.ffoot, legL, f, 0.55 * s * k, { x: f, y: 0 });
      sk.bknee = bendJoint(sk.hip, sk.bfoot, legL, f, 0.35 * s * k, { x: f, y: 0 });
    }
  }
  sk.head.x += -loll * 0.62 * s * k;
  sk.head.y += Math.abs(loll) * 0.28 * s * k;
}
/** Pintu masuk solver: menambahkan (1) blend idle<->jalan<->lari (~0.13 dtk) tanpa lompatan pose,
 *  dan (2) windup berbalik arah (badan menyempit & merendah sesaat, bukan flip instan). */
export function solvePose(o: StickOpts): Skeleton {
  if (isScythePose(o.pose)) return solveScythePose(o, TALL_MODE);
  if (isFootPose(o.pose)) {
    const next = solveFootPose(o, TALL_MODE), from = o.footLink;
    if (o.footSwitch) {
      const prev = solveFootPose({ ...o, footSwitch: false, footLead: o.footLead === -1 ? 1 : -1 }, TALL_MODE);
      return blendSkeleton(prev, next, smoothMix(cl01(o.t)));
    }
    return from ? blendSkeleton(solveFootPose({ ...o, ...from, footLink: undefined }, TALL_MODE), next, smoothMix(from.weight)) : next;
  }
  let sk: Skeleton;
  const m = o.locoMix;
  if (m !== undefined && LOCO_POSES.has(o.pose)) {
    if (m <= 0.015) sk = solvePoseCore(o.moving ? { ...o, moving: false } : o);
    else if (m >= 0.985) sk = solvePoseCore(o.moving ? o : { ...o, moving: true });
    else sk = blendSkeleton(solvePoseCore({ ...o, moving: false }), solvePoseCore({ ...o, moving: true }), smoothMix(m));
  } else sk = solvePoseCore(o);
  if ((o.drunk ?? 0) > 0.01) applyDrunk(sk, o, o.drunk!);
  const tn = o.turn ?? 0;
  if (tn > 0.01) {
    const c = 1 - 0.62 * Math.pow(Math.min(1, tn), 1.2), cy = 1 - 0.07 * Math.min(1, tn);
    const q = (v: Vec | null) => { if (v) { v.x *= c; v.y *= cy; } };
    q(sk.hip); q(sk.neck); q(sk.head); q(sk.ffoot); q(sk.bfoot); q(sk.fhand); q(sk.bhand); q(sk.fknee); q(sk.bknee); q(sk.felbow); q(sk.belbow);
  }
  if (o.clinch) {
    const a = o.clinch, f = o.facing;
    const target = { x: a.x - o.x, y: a.y - o.y + (o.z ?? 0) };
    if (a.receiver) {
      sk.head = mix(sk.head, target, a.w);
      sk.neck = mix(sk.neck, { x: target.x - f * 1.7, y: target.y + 1.7 }, a.w);
    } else {
      sk.bhand = mix(sk.bhand, { x: target.x + f * 1.5, y: target.y - 1.5 }, a.w);
      sk.fhand = mix(sk.fhand, { x: target.x - f * 1.0, y: target.y - 1.8 }, a.w);
      sk.felbow = bendJoint(sk.neck, sk.fhand, 5.2, f);
      sk.belbow = bendJoint(sk.neck, sk.bhand, 5.2, -f);
      sk.fknee = mix(sk.fknee ?? mix(sk.hip, sk.ffoot, 0.5), { x: target.x, y: target.y + 1.5 }, a.rise);
      sk.ffoot = mix(sk.ffoot, { x: target.x - f * 3, y: target.y + 4.7 }, a.rise);
    }
  }
  return sk;
}

export function drawSkeleton(ctx: Ctx, o: StickOpts, sk: Skeleton) {
  if (isDepthMode()) {
    ctx.globalAlpha = o.alpha;
    draw3DStick(ctx, o, sk);
    draw3DWeapon(ctx, o, sk);
    ctx.globalAlpha = 1;
    return;
  }
  const s = o.scale, f = o.facing;
  const dx = Math.cos(o.aim), dy = Math.sin(o.aim);
  const pxp = -dy, pyp = dx;
  const run = o.run ?? 0;
  const hr = Math.max(2, Math.round((TALL_MODE ? 3.15 : 3) * s));
  const X = o.x, Y = o.y - (o.z ?? 0);
  const { hip, neck, head, ffoot, bfoot, fhand, bhand, fknee, bknee, felbow, belbow, trail } = sk;
  // squash & stretch: squeeze the skeleton around the feet so impacts read as weight
  const qsx = o.sqx ?? 1, qsy = o.sqy ?? 1;
  if (qsx !== 1 || qsy !== 1) {
    const q = (v: Vec | null) => { if (v) { v.x *= qsx; v.y *= qsy; } };
    q(hip); q(neck); q(head); q(ffoot); q(bfoot); q(fhand); q(bhand); q(fknee); q(bknee); q(felbow); q(belbow);
  }
  ctx.globalAlpha = o.alpha;
  if (trail && o.trail) {
    ctx.globalAlpha = o.alpha * 0.5;
    parc(ctx, X + trail.cx, Y + trail.cy, trail.rx, trail.ry, trail.from, trail.to, o.trail, 1);
    ctx.globalAlpha = o.alpha * 0.9;
    parc(ctx, X + trail.cx, Y + trail.cy, trail.rx * 0.82, trail.ry * 0.82, trail.from + (trail.to - trail.from) * 0.55, trail.to, '#ffffff', 1);
    ctx.globalAlpha = o.alpha;
  }
  type Seg = [Vec, Vec, string];
  const segs: Seg[] = [[hip, neck, 'torso']];
  if (fknee) segs.push([hip, fknee, 'ffoot'], [fknee, ffoot, 'ffoot']); else segs.push([hip, ffoot, 'ffoot']);
  if (bknee) segs.push([hip, bknee, 'bfoot'], [bknee, bfoot, 'bfoot']); else segs.push([hip, bfoot, 'bfoot']);
  if (felbow) segs.push([neck, felbow, 'fhand'], [felbow, fhand, 'fhand']); else segs.push([neck, fhand, 'fhand']);
  if (belbow) segs.push([neck, belbow, 'bhand'], [belbow, bhand, 'bhand']); else segs.push([neck, bhand, 'bhand']);
  // bold Downwell-style limbs: 2px at normal size (3px for big figures)
  const lw = s >= 1.4 ? 3 : 2;
  const strikeLimb = o.strike ?? null;
  const isStrike = (tag: string) => !!strikeLimb && (strikeLimb === tag || (strikeLimb === 'both' && (tag === 'fhand' || tag === 'bhand')));
  const paint = (col: string, ox: number, oy: number, outlinePass: boolean) => {
    for (const [a, b, tag] of segs) {
      const w = isStrike(tag) && (o.impact ?? 0) > 0 ? lw + 1 : lw;
      pline(ctx, X + a.x + ox, Y + a.y + oy, X + b.x + ox, Y + b.y + oy, col, w);
    }
    pcircle(ctx, X + head.x + ox, Y + head.y + oy, hr, col);
    void outlinePass;
  };
  if (o.outline && !o.flash) {
    paint(o.outline, 1, 0, true); paint(o.outline, -1, 0, true); paint(o.outline, 0, 1, true); paint(o.outline, 0, -1, true);
  }
  const col = o.flash ? '#ffffff' : o.c;
  paint(col, 0, 0, false);
  // impact: the striking limb flashes hot, gets a subtle motion streak & bright knuckle/heel dot so strikes read cleanly
  if (strikeLimb && (o.impact ?? 0) > 0 && !o.flash) {
    const tips: [Vec, Vec][] = strikeLimb === 'both'
      ? [[neck, fhand], [neck, bhand]]
      : [[
          strikeLimb === 'fhand' || strikeLimb === 'bhand' ? neck : hip,
          strikeLimb === 'fhand' ? fhand : strikeLimb === 'bhand' ? bhand : strikeLimb === 'ffoot' ? ffoot : bfoot,
        ]];
    for (const [orig, tp] of tips) {
      const mx = (orig.x + tp.x) * 0.5, my = (orig.y + tp.y) * 0.5;
      ctx.globalAlpha = o.alpha * 0.55;
      pline(ctx, X + mx, Y + my, X + tp.x, Y + tp.y, '#ffffff', 1.5);
      ctx.globalAlpha = o.alpha;
      pcircle(ctx, X + tp.x, Y + tp.y, s >= 1.4 ? 2.1 : 1.6, '#ffffff');
    }
  }
  if (!o.flash) {
    const H = { x: X + head.x, y: Y + head.y };
    const R = { x: X + fhand.x, y: Y + fhand.y };
    const es = s >= 1.6 ? 2 : 1;
    switch (o.acc) {
      case 'hood':
        pcircle(ctx, H.x, H.y, hr, o.c2);
        px(ctx, H.x, H.y - hr - 1, o.c2);
        break;
      case 'helmet':
        halfCircle(ctx, H.x, H.y, hr, o.c2, true);
        break;
      case 'mask':
        halfCircle(ctx, H.x, H.y, hr, o.c2, false);
        break;
    }
    const la = o.look ?? o.aim, ldx = Math.cos(la), ldy = Math.sin(la);
    const shadesOn = o.acc === 'shades' && (o.shades ?? 0) < 2;
    if (!shadesOn) {
      // ---- EKSPRESI MATA ----
      // silang (X X) saat kena pukul / tumbang, melotot marah saat menyerang,
      // putih menyala untuk musuh tertentu, titik biasa saat tenang.
      const mood = o.mood ?? 'normal';
      const hurt = mood === 'hurt' || mood === 'dead';
      const angry = mood === 'angry';
      const closed = mood === 'closed';
      const wide = o.eyeStyle === 'white';
      // Semua koordinat dibulatkan ke piksel supaya ekspresi tetap tajam di skala 1.
      const u = Math.max(1, Math.round(s));
      const off = hurt ? 0 : angry ? 0.3 : 1.15;
      const cx0 = Math.round(H.x + ldx * off * s);
      const cy0 = Math.round(H.y + ldy * 0.9 * s);
      const dot = (x: number, y: number, c: string, w = u, h = u) => prect(ctx, Math.round(x), Math.round(y), w, h, c);
      const gap = Math.round((hurt ? 2 : 1.5) * s);
      if (hurt) {
        // X X — dua silang tegas, tidak menyatu jadi satu garis
        for (const sgn of [-1, 1]) {
          const bx = cx0 + sgn * gap, by = cy0;
          dot(bx - u, by - u, o.eyes); dot(bx, by, o.eyes); dot(bx + u, by + u, o.eyes);
          dot(bx + u, by - u, o.eyes); dot(bx - u, by + u, o.eyes);
        }
      } else if (closed) {
        // mata terpejam: dua garis datar (fokus / tarik napas dalam)
        for (const sgn of [-1, 1]) dot(cx0 + sgn * gap - (sgn > 0 ? 0 : u), cy0, o.eyes, 2 * u, u);
      } else if (angry) {
        // alis menukik: dua piksel per sisi, ada jarak di tengah (bukan palang penuh)
        const ec = wide ? '#ffffff' : o.eyes;
        for (const sgn of [-1, 1]) {
          dot(cx0 + sgn * (gap + u), cy0 - 2 * u, o.eyes);
          dot(cx0 + sgn * gap, cy0 - u, o.eyes);
          dot(cx0 + sgn * gap, cy0, ec);
        }
      } else if (wide) {
        // dua titik putih; pendar hanya vertikal supaya tidak menyatu jadi kotak
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = o.alpha * 0.24;
        for (const sgn of [-1, 1]) {
          dot(cx0 + sgn * gap, cy0 - u, '#6fb6ff');
          dot(cx0 + sgn * gap, cy0 + u, '#6fb6ff');
        }
        ctx.restore();
        ctx.globalAlpha = o.alpha;
        for (const sgn of [-1, 1]) dot(cx0 + sgn * gap, cy0, '#ffffff');
      } else {
        for (const sgn of [-1, 1]) dot(cx0 + sgn * gap, cy0, o.eyes);
      }
    }
    switch (o.acc) {
      case 'headband': {
        pline(ctx, H.x - hr, H.y - s, H.x + hr, H.y - s, o.c2);
        const bx = H.x - f * hr, by = H.y - s;
        // SECONDARY MOTION: ekor terseret ke belakang gerakan (spring dari game, ada overshoot), terangkat lurus saat
        // sprint, menjuntai & bergoyang halus saat berhenti. Fallback tanpa spring: turunan dari kecepatan.
        const vsp = o.moving ? 1 : 0;
        const bo: Vec = o.band ?? { x: -(o.vel?.x ?? 0) * (1.6 + 2.2 * Math.min(1, run)) * vsp, y: 0 };
        const trail = Math.min(1, Math.abs(bo.x) / 3.2);
        const flut = Math.sin(o.time * (9 + 9 * run)) * (0.25 + 0.75 * trail) * s;
        const sway = Math.sin(o.time * 2.1) * 0.45 * s * (1 - trail);
        const tail = (len: number, ph: number, drop: number) => {
          let tx = -f * len * 0.7 * s + bo.x * (len / 4.2) + sway;
          let ty = drop * s * (1 - 0.8 * trail) + bo.y * (len / 4.2) + flut * Math.sin(ph) * 0.8;
          const l = Math.hypot(tx, ty), mx = len * 1.12 * s;
          if (l > mx) { tx *= mx / l; ty *= mx / l; }
          pline(ctx, bx, by, bx + tx * 0.5, by + ty * 0.5 + flut * 0.35 * Math.cos(ph), o.c2);
          pline(ctx, bx + tx * 0.5, by + ty * 0.5 + flut * 0.35 * Math.cos(ph), bx + tx, by + ty, o.c2);
        };
        tail(4.4, 0, 1.6);
        tail(3.4, 1.7, 2.6);
        break;
      }
      case 'glasses':
        pline(ctx, H.x - hr + 1, H.y, H.x + hr - 1, H.y, '#0a0a0a');
        px(ctx, H.x + f, H.y, '#9be7ff');
        break;
      case 'shades': {
        const crack = o.shades ?? 0;
        if (crack >= 2) break;                       // sudah terlempar -> mata terlihat
        const sx2 = H.x + ldx * 1.25 * s, sy2 = H.y + ldy * 0.9 * s;
        const lx = sx2 - 1.55 * s, rx2 = sx2 + 1.55 * s, ly2 = sy2 + 0.3 * s;
        const lr = 1.5 * s;
        pline(ctx, lx - lr * 0.6, ly2 - 0.3 * s, H.x - f * hr, ly2 - 0.8 * s, '#08080c', 1);
        pline(ctx, lx, ly2 - 0.5 * s, rx2, ly2 - 0.5 * s, '#08080c', 1);
        for (const cxx of [lx, rx2]) {
          pellipse(ctx, cxx, ly2, lr + 0.6 * s, lr * 0.85 + 0.6 * s, '#000000');
          pellipse(ctx, cxx, ly2, lr, lr * 0.85, '#101017');
          pellipse(ctx, cxx - 0.35 * s, ly2 - 0.45 * s, lr * 0.5, lr * 0.32, '#4d5f7a');
          px(ctx, cxx - 0.7 * s, ly2 - 0.7 * s, '#c9dcf2');
        }
        if (crack >= 1) {
          const cx0 = lx, cy0 = ly2;
          pline(ctx, cx0 - lr, cy0 - 0.2 * s, cx0 + lr * 0.9, cy0 + 0.5 * s, '#e8f4ff', 1);
          pline(ctx, cx0 - 0.2 * s, cy0 - lr * 0.8, cx0 + 0.4 * s, cy0 + lr * 0.8, '#e8f4ff', 1);
          pline(ctx, cx0 - lr * 0.5, cy0 + lr * 0.7, cx0 + lr * 0.6, cy0 - lr * 0.6, '#a8c4dd', 1);
          px(ctx, cx0 + lr * 0.8, cy0 + lr * 0.5, '#000000');
          px(ctx, cx0 - lr * 0.9, cy0 - lr * 0.4, '#000000');
        }
        break;
      }
      case 'band':
        pline(ctx, H.x - hr, H.y - s, H.x + hr, H.y - s, o.c2);
        prect(ctx, H.x, H.y - hr - 1, 1, 1, o.c2);
        break;
      case 'crown':
        for (let i = -1; i <= 1; i++) {
          prect(ctx, H.x + i * 2 * es, H.y - hr - 1, es, es, '#ffd700');
          prect(ctx, H.x + i * 2 * es, H.y - hr - 2, es, es, '#ffd700');
        }
        prect(ctx, H.x - 2 * es, H.y - hr, 5 * es, 1, '#ffd700');
        break;
      case 'horns':
        pline(ctx, H.x - hr, H.y - hr + 1, H.x - hr - 2, H.y - hr - 2, o.c2);
        pline(ctx, H.x + hr, H.y - hr + 1, H.x + hr + 2, H.y - hr - 2, o.c2);
        break;
    }
    switch (o.weapon) {
      case 'pistol':
        drawPistol(ctx, R, o.aim + (o.gunSpin ?? 0), s, { recoil: o.recoil ?? 0, time: o.time });
        break;
      case 'rifle':
        drawRifle(ctx, R, o.aim + (o.gunSpin ?? 0), s, { recoil: o.recoil ?? 0, time: o.time });
        break;
      case 'smg':
        pline(ctx, R.x - dx, R.y - dy, R.x + dx * 4, R.y + dy * 4, '#9ad6e8');
        prect(ctx, R.x, R.y + 1, 1, 2, '#333');
        break;
      case 'shotgun':
        pline(ctx, R.x - dx * 2, R.y - dy * 2, R.x + dx * 6, R.y + dy * 6, '#c9a063');
        pline(ctx, R.x, R.y - 1, R.x + dx * 6, R.y + dy * 6 - 1, '#e6e6e6');
        break;
      case 'knife':
        pline(ctx, R.x + dx, R.y + dy, R.x + dx * 4, R.y + dy * 4, '#ffffff');
        break;
      case 'shield': {
        const cx = R.x + dx * 2, cy = R.y + dy * 2;
        pline(ctx, cx + pxp * 3, cy + pyp * 3, cx - pxp * 3, cy - pyp * 3, o.c2, 2);
        break;
      }
      case 'bomb':
        pcircle(ctx, R.x, R.y, 1.5, '#1a1a1a');
        px(ctx, R.x, R.y - 2, Math.floor(o.time * 16) % 2 ? '#ffffff' : '#ff9f43');
        break;
      case 'staff':
        pline(ctx, R.x - dx * 6 - pxp * 2, R.y - dy * 6 - pyp * 2, R.x + dx * 6 + pxp * 2, R.y + dy * 6 + pyp * 2, '#c9a063');
        break;
      case 'bat': {
        // ayunan musuh: terangkat di belakang saat ancang-ancang, menyapu saat menyerang
        let ang = o.aim - f * 2.3;
        if (o.pose === 'windup' || o.pose === 'charge') ang = o.aim - f * (2.3 + 0.5 * Math.min(1, o.t));
        else if (o.pose === 'hook' || o.pose === 'hammer' || o.pose === 'spinback' || o.pose === 'palm') {
          const sw = Math.min(1, Math.max(0, (o.t - 0.18) / 0.5));
          const e2 = 1 - Math.pow(1 - sw, 3);
          ang = o.aim + f * (-2.6 + 3.5 * e2);
        }
        drawBat(ctx, R, ang, 0, o.pose === 'hook' || o.pose === 'hammer' ? '#ffd27f' : null);
        break;
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** Draw a stick figure; optionally cross-fade from a previous pose with cubic S-curve easing for smooth transitions */
export function drawStick(ctx: Ctx, o: StickOpts, prev?: { pose: Pose; t: number; blend: number }) {
  const opts = { ...o, headScale: TALL_MODE ? 1.05 : 1 };
  let sk = solvePose(opts);
  if (prev && prev.blend > 0.01 && prev.pose !== o.pose) {
    const skPrev = solvePose({ ...opts, pose: prev.pose, t: prev.t });
    sk = blendSkeleton(skPrev, sk, smoothMix(cl01(1 - prev.blend)));
  }
  drawSkeleton(ctx, opts, sk);
}
