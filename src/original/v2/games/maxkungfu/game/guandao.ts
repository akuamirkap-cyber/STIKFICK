import { pline, pcircle, prect, pfontO, type Ctx } from './pixel';
import { crescent } from './buster';
import { zoneFromTech } from './hitReact';
import { clamp, rnd } from './rng';
import { solidAt } from './level';
import { buildGuanDaoGrid, GD_PAL, GD_LEN, GD_W, GD_HALF, GD_GRIP, GD_TASSEL } from './guandaoSprite';

/**
 * GUAN DAO — Green Dragon Crescent Blade.
 *
 * Senjata digerakkan oleh orientasi 3D (azimut + elevasi + putaran sumbu) yang dibaca dari KEYFRAME
 * berkurva halus (Hermite), bukan sekadar muter. Setiap teknik punya ancang-ancang, ayunan cepat,
 * follow-through dan pemulihan. Jejak tebasan direkam dari pergerakan bilah yang SEBENARNYA
 * (sub-step 1/150 detik) sehingga selalu pas dengan senjatanya, dan tumbukan dihitung dari
 * segmen bilah yang terlihat di layar (apa yang terlihat = apa yang kena).
 *
 *  LMB            : kombo menyamping SAPU > NAIK BALIK > SABIT MENYILANG > BALING-BALING >
 *                   KOMBO PUTARAN, ditutup bergantian LONCAT SERGAP NAGA (melompat menuju
 *                   musuh) / TAI SHAN (smash dari atas + retakan tanah). Arah ayunan jurus
 *                   menyamping berganti-ganti sisi tiap serangan (aliran kata samurai), dan
 *                   kombo kadang dibuka dengan lompatan sergap bila musuh agak jauh.
 *                   KOMBO PUTARAN memutar senjata cepat
 *                   mengelilingi tubuh: memperpanjang kombo + damage area (AoE) ke segala arah.
 *                   MURNI animasi ayunan senjata — tanpa partikel angin / visual tornado.
 *  LARI/DASH+LMB  : TUSUK NAGA (menyerbu, menembus banyak musuh)
 *  LMB DI UDARA   : KOMBO UDARA (Diagonal-to-Aerial Spin Slash): tebasan miring, lalu karakter
 *                   melompat/terangkat sambil berputar di udara, ditutup tebasan miring ke bawah.
 *  RMB TAP (<0,2 dtk)   : BASIC HEAVY ATTACK (tebasan berat standar)
 *  RMB TAHAN (>=0,2 dtk): CHARGED HEAVY — isi tenaga, lepas = TEBASAN PEMBELAH, tebasan super
 *                   kuat yang MEMBELAH tubuh stickman musuh menjadi dua bagian (dismemberment).
 *  Diam lama      : atraksi memutar tombak
 */
type G = any;
type Key = [number, number, number, number]; // t, offset azimut (x facing), elevasi, jangkauan tangan
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const sstep = (k: number) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

export interface Tech {
  id: string; name: string; dur: number; keys: Key[]; hit: [number, number]; edge: 1 | -1;
  dmg: number; st: number; kb: number; launch?: number; rehit?: number;
  pose: string; poseMap: [number, number]; lunge?: [number, number, number];
  hitstop: number; shake: number; heavy: boolean; col: string; dmgless?: boolean;
  /** ayunan menyamping yang arahnya berganti-ganti sisi tiap serangan (aliran kata samurai) */
  side?: boolean;
  /** teknik melompat menyerang: karakter melompat menuju musuh terdekat saat jurus dimulai */
  leap?: boolean;
}

const T_SWEEP: Tech = {
  // sapuan MENYAMPING lebar: bilah melintasi depan tubuh dari satu sisi ke sisi lain setinggi dada
  id: 'sweep', name: 'SAPU NAGA', dur: 0.62, edge: 1, hit: [0.2, 0.42], dmg: 7, st: 30, kb: 340, hitstop: 0.028, shake: 0.14, heavy: false, col: '#7dffb0', side: true,
  pose: 'a_swing1', poseMap: [0, 0.92], lunge: [0.12, 0.3, 90],
  keys: [[0, 0.5, 0.5, 4], [0.1, 2.6, 0.45, 3], [0.18, 2.4, 0.35, 5], [0.26, 0.9, 0.3, 7], [0.33, -0.9, 0.3, 8], [0.4, -2.4, 0.4, 8], [0.48, -2.7, 0.5, 6], [0.62, -1.2, 0.55, 4]],
};
const T_REVERSE: Tech = {
  // sapuan balik MENYAMPING ke arah berlawanan, sedikit menanjak di ujungnya
  id: 'reverse', name: 'NAIK BALIK', dur: 0.6, edge: -1, hit: [0.2, 0.42], dmg: 7, st: 30, kb: 360, launch: 55, hitstop: 0.03, shake: 0.15, heavy: false, col: '#a6fff0', side: true,
  pose: 'a_swing2', poseMap: [0, 0.92], lunge: [0.12, 0.3, 80],
  keys: [[0, -1.2, 0.55, 4], [0.1, -2.6, 0.35, 3], [0.18, -2.3, 0.3, 5], [0.26, -0.7, 0.35, 7], [0.33, 0.9, 0.45, 8], [0.4, 2.4, 0.6, 8], [0.48, 2.7, 0.75, 6], [0.6, 1.2, 0.6, 4]],
};
/** SABIT MENYILANG: tebasan menyamping menyilang tubuh ala samurai — bilah menyeberang jauh
 *  dari sisi kiri mentok ke sisi kanan (atau sebaliknya, bergantian tiap kombo). */
const T_CROSS: Tech = {
  id: 'cross', name: 'SABIT MENYILANG', dur: 0.58, edge: -1, hit: [0.18, 0.4], dmg: 8, st: 32, kb: 360, hitstop: 0.03, shake: 0.16, heavy: false, col: '#a6fff0', side: true,
  pose: 'a_swing2', poseMap: [0, 0.92], lunge: [0.12, 0.3, 85],
  keys: [[0, -2.4, 0.55, 4], [0.12, -2.55, 0.4, 5], [0.22, -1.0, 0.3, 7], [0.3, 0.6, 0.25, 8], [0.38, 2.1, 0.3, 8], [0.46, 2.6, 0.45, 6], [0.58, 1.2, 0.55, 4]],
};
/** LONCAT SERGAP NAGA: karakter MELOMPAT menuju musuh terdekat sambil menebas menyamping
 *  di udara — dipakai bergantian dengan Tai Shan sebagai penutup kombo, dan kadang membuka
 *  kombo saat musuh agak jauh (lihat startAttack & start). */
const T_LEAP: Tech = {
  id: 'leap', name: 'LONCAT SERGAP NAGA', dur: 0.55, edge: 1, hit: [0.16, 0.42], dmg: 10, st: 36, kb: 430, launch: 55, hitstop: 0.045, shake: 0.24, heavy: false, col: '#9dffd8', side: true, leap: true,
  pose: 'a_swing1', poseMap: [0, 0.92],
  keys: [[0, 2.3, 0.7, 4], [0.14, 2.2, 0.5, 6], [0.24, 0.7, 0.25, 8], [0.34, -1.2, 0.15, 8], [0.44, -2.3, 0.3, 7], [0.55, -1.4, 0.5, 4]],
};
const T_TAISHAN: Tech = {
  id: 'taishan', name: 'TAI SHAN', dur: 0.95, edge: -1, hit: [0.43, 0.56], dmg: 16, st: 70, kb: 600, launch: 70, hitstop: 0.06, shake: 0.5, heavy: true, col: '#d4ff9a',
  pose: 'a_overhead', poseMap: [0, 1], lunge: [0.4, 0.5, 70],
  keys: [[0, 0, 0.6, 4], [0.16, 0, 1.6, 3], [0.3, 0, 2.55, 2], [0.38, 0, 2.7, 2], [0.43, 0, 1.55, 6], [0.47, 0, 0.5, 8], [0.5, 0, -0.1, 8], [0.58, 0, -0.14, 8], [0.85, 0, 0.5, 5]],
};
const T_THRUST: Tech = {
  id: 'thrust', name: 'TUSUK NAGA', dur: 0.5, edge: 1, hit: [0.15, 0.31], dmg: 9, st: 34, kb: 430, hitstop: 0.05, shake: 0.22, heavy: false, col: '#9dffd8',
  pose: 'k_thrust', poseMap: [0, 1], lunge: [0.1, 0.27, 230], rehit: undefined,
  keys: [[0, 0.1, 0.12, 5], [0.1, 0, 0.1, 1], [0.15, 0, 0.04, 8], [0.28, 0, 0.04, 8], [0.5, 0.3, 0.4, 4]],
};
const T_WHIRL: Tech = {
  id: 'whirl', name: 'PUSARAN NAGA HIJAU', dur: 1.0, edge: 1, hit: [0.2, 0.78], dmg: 4, st: 16, kb: 230, hitstop: 0.02, shake: 0.12, heavy: false, col: '#5dffa0', rehit: 0.17,
  pose: 'a_spin', poseMap: [0, 0.5], lunge: [0.1, 0.7, 55],
  keys: [[0, 0.5, 0.4, 4], [0.14, 2.2, 0.3, 3], [0.26, 1.4, 0.1, 7], [0.4, -1.5, 0.28, 8], [0.54, -4.0, 0.55, 8], [0.66, -5.5, 0.25, 8], [0.74, -6.3, 0.04, 8], [0.8, -5.95, 0.2, 7], [1.0, -5.78, 0.45, 4]],
};
/** KOMBO PUTARAN: senjata diputar cepat 2+ putaran penuh mengelilingi tubuh (azimut berputar
 *  melewati semua arah), memperpanjang rantai kombo LMB dan menghantam area sekeliling (AoE).
 *  Sesuai spesifikasi: MURNI animasi ayunan senjata — teknik ini TIDAK memancarkan partikel
 *  angin, garis pusaran, asap, atau efek tornado apa pun (lihat techStep: tanpa trail/ghost). */
const T_SPIN: Tech = {
  id: 'spincombo', name: 'KOMBO PUTARAN', dur: 0.85, edge: 1, hit: [0.18, 0.72], dmg: 4, st: 16, kb: 250, hitstop: 0.018, shake: 0.1, heavy: false, col: '#5dffa0', rehit: 0.15, side: true,
  pose: 'a_spin', poseMap: [0, 0.6], lunge: [0.15, 0.7, 45],
  keys: [[0, 0.5, 0.5, 4], [0.1, 2.3, 0.35, 3], [0.2, 1.2, 0.3, 6], [0.32, -1.8, 0.35, 8], [0.46, -4.9, 0.4, 8], [0.6, -8.0, 0.35, 8], [0.74, -11.1, 0.3, 7], [0.85, -12.07, 0.5, 4]],
};
/** BASIC HEAVY ATTACK — hasil TAP klik kanan (< 0,2 detik): tebasan berat standar. */
const T_HEAVY: Tech = {
  id: 'heavy', name: 'TEBASAN BERAT', dur: 0.55, edge: 1, hit: [0.22, 0.38], dmg: 15, st: 62, kb: 640, hitstop: 0.06, shake: 0.45, heavy: true, col: '#ffe9a8', side: true,
  pose: 'a_homerun', poseMap: [0.05, 0.95], lunge: [0.16, 0.34, 110],
  keys: [[0, 0.6, 0.7, 4], [0.14, 2.5, 1.05, 3], [0.22, 2.35, 0.75, 5], [0.3, 0.6, 0.15, 8], [0.38, -1.7, 0.05, 8], [0.55, -1.1, 0.45, 4]],
};
/** CHARGED HEAVY — hasil TAHAN klik kanan (>= 0,2 detik) lalu lepas: tebasan vertikal super kuat
 *  yang membelah tubuh stickman musuh menjadi dua bagian (lihat Game.bisectEnemy). */
const T_CLEAVE: Tech = {
  id: 'cleave', name: 'TEBASAN PEMBELAH', dur: 0.72, edge: -1, hit: [0.3, 0.46], dmg: 30, st: 90, kb: 700, hitstop: 0.09, shake: 0.65, heavy: true, col: '#ffc46b',
  pose: 'a_overhead', poseMap: [0, 1], lunge: [0.26, 0.4, 90],
  keys: [[0, 0.15, 1.2, 3], [0.16, 0.1, 2.5, 2.5], [0.28, 0.05, 2.65, 3], [0.36, 0.0, 1.2, 7], [0.43, -0.05, -0.4, 8], [0.5, -0.1, -1.15, 8], [0.72, 0.2, 0.4, 4]],
};
/** KOMBO UDARA fase 1: tebasan miring (diagonal slash) pembuka. */
const T_AIRDIAG: Tech = {
  id: 'airdiag', name: 'TEBAS MIRING', dur: 0.36, edge: 1, hit: [0.1, 0.26], dmg: 8, st: 30, kb: 320, hitstop: 0.035, shake: 0.2, heavy: false, col: '#a6fff0',
  pose: 'a_swing1', poseMap: [0, 0.92],
  keys: [[0, 1.9, 1.0, 4], [0.12, 1.5, 0.6, 6], [0.22, -0.6, -0.2, 8], [0.3, -1.8, -0.55, 7], [0.36, -1.2, 0.1, 5]],
};
/** KOMBO UDARA fase 2: berputar di udara (aerial spin) — azimut senjata berputar 2 putaran penuh. */
const T_AIRSPIN: Tech = {
  id: 'airspin', name: 'PUTARAN UDARA', dur: 0.62, edge: 1, hit: [0.06, 0.56], dmg: 4, st: 16, kb: 250, hitstop: 0.018, shake: 0.1, heavy: false, col: '#5dffa0', rehit: 0.14,
  pose: 'a_spin', poseMap: [0, 0.6],
  keys: [[0, -1.2, 0.5, 5], [0.1, -2.6, 0.45, 7], [0.24, -5.6, 0.4, 8], [0.38, -8.6, 0.45, 8], [0.52, -11.6, 0.4, 7], [0.62, -13.77, 0.5, 5]],
};
/** KOMBO UDARA fase 3: tebasan miring ke arah bawah (downward diagonal slash) penutup. */
const T_AIRDIVE: Tech = {
  id: 'airdive', name: 'TEBASAN TURUN', dur: 0.55, edge: -1, hit: [0.14, 0.4], dmg: 13, st: 55, kb: 560, hitstop: 0.07, shake: 0.5, heavy: true, col: '#d4ff9a',
  pose: 'a_overhead', poseMap: [0, 1],
  keys: [[0, -0.9, 1.9, 4], [0.14, -0.85, 1.5, 6], [0.26, -0.8, 0.2, 8], [0.36, -0.75, -1.0, 8], [0.44, -0.7, -1.5, 7], [0.55, -0.6, -0.7, 5]],
};
const T_MOON: Tech = {
  id: 'moon', name: 'BULAN SABIT', dur: 0.56, edge: 1, hit: [0.1, 0.32], dmg: 10, st: 44, kb: 540, launch: 40, hitstop: 0.05, shake: 0.35, heavy: true, col: '#b8ffe0',
  pose: 'a_homerun', poseMap: [0.1, 0.95], lunge: [0.1, 0.28, 120],
  keys: [[0, 2.5, 1.0, 2], [0.08, 2.4, 0.7, 3], [0.16, 1.2, 0.2, 8], [0.22, -0.3, 0.05, 8], [0.28, -1.6, 0.1, 8], [0.4, -2.2, 0.3, 6], [0.56, -1.0, 0.5, 4]],
};
const T_FLOURISH: Tech = {
  id: 'flourish', name: 'ATRAKSI', dur: 0.95, edge: -1, hit: [0.1, 0.9], dmg: 0, st: 0, kb: 0, hitstop: 0, shake: 0, heavy: false, col: '#5dffa0', dmgless: true,
  pose: 'k_idle', poseMap: [0, 0],
  keys: [[0, 0.3, 0.6, 4], [0.12, 0.3, 0.2, 5], [0.28, 0.3, -1.9, 5], [0.44, 0.3, -5.2, 5], [0.6, 0.3, -8.4, 5], [0.76, 0.3, -11.2, 5], [0.95, 0.3, -11.97, 4]],
};

function gen(dur: number, n: number, fn: (u: number) => [number, number, number]): Key[] {
  const out: Key[] = [];
  for (let i = 0; i <= n; i++) { const u = i / n; const v = fn(u); out.push([u * dur, v[0], v[1], v[2]]); }
  return out;
}
/** BALING-BALING: tongkat berputar di bidang vertikal sambil maju, 2 putaran penuh */
const T_TWIRL: Tech = {
  id: 'twirl', name: 'BALING-BALING', dur: 0.6, edge: -1, hit: [0.07, 0.5], dmg: 4, st: 18, kb: 300, rehit: 0.11, hitstop: 0.015, shake: 0.1, heavy: false, col: '#7dffd0',
  pose: 'a_idle', poseMap: [0, 0], lunge: [0.05, 0.5, 105],
  keys: [[0, 0, 0.6, 4], [0.08, 0, 1.4, 5], [0.2, 0, 3.4, 6], [0.32, 0, 6.4, 6], [0.44, 0, 9.4, 6], [0.52, 0, 11.4, 5], [0.6, 0, 0.5 + Math.PI * 4, 4]],
};
/** HELIKOPTER: tongkat berputar horizontal di atas kepala, 3 putaran */
const T_HELI: Tech = {
  id: 'heli', name: 'HELIKOPTER', dur: 1.3, edge: -1, hit: [0.12, 1.1], dmg: 3, st: 14, kb: 280, rehit: 0.15, hitstop: 0.012, shake: 0.08, heavy: false, col: '#5dffa0',
  pose: 'a_spin', poseMap: [0, 0.3],
  keys: [[0, 0.5, 0.6, 3], [0.1, -0.4, 1.0, 3], [0.5, -7, 1.0, 3], [0.9, -14, 1.0, 3], [1.15, -18.0, 0.9, 3], [1.3, 0.5 - Math.PI * 6, 0.5, 4]],
};
/** ANGKA DELAPAN: tongkat menggambar angka 8 di depan badan */
const T_FIG8: Tech = {
  id: 'fig8', name: 'ANGKA 8', dur: 1.1, edge: 1, hit: [0.1, 1.0], dmg: 3, st: 14, kb: 260, rehit: 0.14, hitstop: 0.012, shake: 0.08, heavy: false, col: '#a6fff0',
  pose: 'k_idle', poseMap: [0, 0],
  keys: gen(1.1, 22, (u) => { const env = Math.pow(Math.sin(Math.PI * u), 0.6); return [0.5 + 2.0 * Math.sin(Math.PI * 3 * u) * env, 0.55 + 0.75 * Math.sin(Math.PI * 6 * u + 0.8) * env, 4 + 2 * env]; }),
};
/** ALIRAN SAMPING: atraksi ayunan menyamping bolak-balik ala samurai — bilah mengalir
 *  kiri-kanan-kiri-kanan di depan tubuh seperti ombak, arah awal bergantian tiap atraksi. */
const T_SIDEFLOW: Tech = {
  id: 'sideflow', name: 'ALIRAN SAMPING', dur: 1.15, edge: 1, hit: [0.1, 1.05], dmg: 3, st: 14, kb: 260, rehit: 0.13, hitstop: 0.012, shake: 0.08, heavy: false, col: '#a6fff0', side: true,
  pose: 'k_idle', poseMap: [0, 0],
  keys: gen(1.15, 24, (u) => { const env = Math.pow(Math.sin(Math.PI * u), 0.6); return [2.3 * Math.sin(Math.PI * 4 * u) * env, 0.45 + 0.35 * Math.sin(Math.PI * 8 * u + 0.7) * env, 4 + 2.5 * env]; }),
};
const TRICKS = [T_FLOURISH, T_HELI, T_FIG8, T_SIDEFLOW];
const isTrick = (T: Tech | null) => !!T && (T.id === 'flourish' || T.id === 'heli' || T.id === 'fig8' || T.id === 'sideflow');

export function sampleKeys(keys: Key[], t: number): [number, number, number] {
  const n = keys.length;
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3]];
  if (t >= keys[n - 1][0]) return [keys[n - 1][1], keys[n - 1][2], keys[n - 1][3]];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const h = k1[0] - k0[0], u = (t - k0[0]) / h, u2 = u * u, u3 = u2 * u;
  const out: [number, number, number] = [0, 0, 0];
  for (let c = 1; c <= 3; c++) {
    const slope = (j: number) => {
      if (j <= 0) return (keys[1][c] - keys[0][c]) / (keys[1][0] - keys[0][0]);
      if (j >= n - 1) return (keys[n - 1][c] - keys[n - 2][c]) / (keys[n - 1][0] - keys[n - 2][0]);
      return (keys[j + 1][c] - keys[j - 1][c]) / (keys[j + 1][0] - keys[j - 1][0]);
    };
    out[c - 1] = (2 * u3 - 3 * u2 + 1) * k0[c] + (u3 - 2 * u2 + u) * h * slope(i) + (-2 * u3 + 3 * u2) * k1[c] + (u3 - u2) * h * slope(i + 1);
  }
  return out;
}

export function segDist(px: number, py: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  const t = l2 < 1e-6 ? 0 : clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1);
  return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t));
}

/** palet hijau -> warna lain (musuh memakai tombak yang sama dengan warna berbeda) */
export function makeTintPal(hex: string): Uint32Array {
  const pal = new Uint32Array(GD_PAL.length);
  GD_PAL.forEach((h, i) => { if (!i) { pal[i] = 0; return; } const r = parseInt(h.slice(1, 3), 16), gg = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); pal[i] = (255 << 24) | (b << 16) | (gg << 8) | r; });
  const br = parseInt(hex.slice(1, 3), 16), bg = parseInt(hex.slice(3, 5), 16), bb = parseInt(hex.slice(5, 7), 16);
  const mix = (k: number, w: number) => { const f = (c: number) => Math.round(w >= 0 ? c * k + 255 * (1 - k) * w : c * k); return (255 << 24) | (f(bb) << 16) | (f(bg) << 8) | f(br); };
  pal[5] = mix(0.3, 0); pal[6] = mix(0.62, 0); pal[7] = mix(1, 0); pal[8] = mix(0.55, 0.9);
  return pal;
}

export interface Geo { G: { x: number; y: number }; B: { x: number; y: number }; ux: number; uy: number; }
interface TrailSample { xs: number[]; ys: number[]; t: number; col: string; w: number }
interface Ghost { x: number; y: number; ux: number; uy: number; roll: number; t: number }
interface Wave { x: number; y: number; a: number; sp: number; life: number; max: number; r: number; dmg: number; hit: number[]; tick: number }
interface Mark { x: number; y: number; a: number; t: number; big: boolean }
interface Crack { x: number; y: number; segs: [number, number, number, number][]; t: number }

export const GD_SCALE = 0.68;
const SPD = 2.02; // kecepatan teknik Guan Dao pas & gesit
const STRANDS = 11;
const TRAIL_LIFE = 0.24;

export class GuanDao {
  tech: Tech | null = null;
  tt = 0;
  az = 0; fc = 1;
  st = { off: 0.5, ph: 0.5, r: 4 };
  from = { off: 0.5, ph: 0.5, r: 4 };
  roll = 1; rollTarget = 1;
  hitMap = new Map<number, number>();
  step = 0; lastEnd = -9;
  buffered: 'L' | 'R' | null = null;
  rHold = 0; charging = false; charge = 0;
  idleT = 0; time = 0;
  swooshed = false; slamDone = false; waveDone = false; marked = false;
  trail: TrailSample[] = [];
  ghosts: Ghost[] = [];
  ghostCd = 0;
  waves: Wave[] = [];
  marks: Mark[] = [];
  cracks: Crack[] = [];
  tassel = { x: 0, y: 0, vx: 0, vy: 0, init: false };
  hintT = 0;
  comboShown = 0;

  clearAll() {
    this.tech = null; this.buffered = null; this.rHold = 0; this.charging = false; this.charge = 0; this.trail = []; this.ghosts = []; this.waves = []; this.marks = []; this.cracks = [];
    this.tassel.init = false;
  }
  cancel() {
    this.tech = null; this.buffered = null; this.rHold = 0; this.charging = false; this.charge = 0; this.step = 0; this.airSeq = 0;
  }
  /** fase rangkaian Kombo Udara: 0 = tidak aktif, 1 = tebas miring, 2 = putaran udara, 3 = tebasan turun */
  airSeq = 0;
  /** level charge (0..1) saat Charged Heavy dilepas — menentukan jauhnya lemparan potongan tubuh */
  cleaveLvl = 0;
  /** aliran kata: sisi ayunan saat ini (+1/-1) dan sisi untuk serangan menyamping berikutnya.
   *  Berganti tiap jurus menyamping selesai, jadi kombo mengalir kiri-kanan bak tarian samurai. */
  mirror = 1;
  sideFlip: 1 | -1 = 1;
  /** penutup kombo bergantian: Loncat Sergap <-> Tai Shan; pembuka lompat juga bergantian */
  leapAlt = true;
  openerAlt = true;
  leapOpener = false;
  /** dipanggil saat senjata diganti ke guan dao */
  onEquip(g: G) {
    this.clearAll(); this.step = 0; this.idleT = 0; this.hintT = 6;
    const p = g.player;
    this.st = { off: 0.5, ph: 0.5, r: 4 };
    this.start(g, T_FLOURISH);
    g.sfx?.axeSwing?.();
    g.say?.('GUAN DAO', '#5dffa0', 3, 1.3);
    g.particles?.ring?.(p.x, p.y - 8, 3, 22, '#5dffa0', 0.3, 1);
  }

  get active() { return !!this.tech || this.charging; }
  moveMul(p: any) {
    if (p.weapon !== 'guandao') return 1;
    if (this.charging) return 0.7;
    if (!this.tech) return 1;
    return this.tech.id === 'thrust' ? 0.6 : isTrick(this.tech) ? 0.95 : 0.78;
  }

  /** pose badan untuk stick figure (null = biarkan logika bawaan: lari/lompat/terluka) */
  bodyPose(g: G): { pose: string; t: number } | null {
    const p = g.player;
    // fase Kombo Udara tetap memakai pose tekniknya sendiri selagi melayang
    if (this.tech && this.tech.id.startsWith('air')) {
      const T = this.tech;
      return { pose: T.pose, t: lerp(T.poseMap[0], T.poseMap[1], clamp(this.tt / T.dur, 0, 1)) };
    }
    if (p.stunT > 0 || p.airborne || p.dashT > 0 || p.fatality) return null;
    if (this.charging) return { pose: 'k_heaven', t: 0.05 + 0.2 * this.charge };
    if (this.tech) {
      const T = this.tech;
      return { pose: T.pose, t: lerp(T.poseMap[0], T.poseMap[1], clamp(this.tt / T.dur, 0, 1)) };
    }
    if (p.moving && p.runT > 0.03) return null;
    return { pose: 'k_idle', t: 0 };
  }

  /** geometri layar dari state saat ini */
  geo(g: G): Geo {
    const p = g.player;
    const idle = !this.tech && !this.charging;
    const az = idle ? p.aim : this.az, fc = idle ? (p.facing || 1) : this.fc;
    const th = az + fc * this.st.off, ph = this.st.ph;
    const r = clamp(this.st.r, 0, 8);
    const sx = p.x, sy = p.y - p.z - 9;
    const gx = sx + r * Math.cos(th), gy = sy + r * 0.55 * Math.sin(th) + 0.8;
    let ux = Math.cos(th) * Math.cos(ph), uy = 0.7 * Math.sin(th) * Math.cos(ph) - Math.sin(ph);
    const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    const clampTo = (x: number, y: number, m: number) => { const d = Math.hypot(x - sx, y - sy); return d > m ? { x: sx + ((x - sx) * m) / d, y: sy + ((y - sy) * m) / d } : { x, y }; };
    const G0 = clampTo(gx, gy, 9.5);
    const B = clampTo(gx - ux * 5.5, gy - uy * 5.5, 9.5);
    return { G: G0, B, ux, uy };
  }
  flipOf() { return this.roll; }

  grips(g: G) { const q = this.geo(g); return { front: q.G, back: q.B }; }

  start(g: G, T: Tech) {
    const p = g.player;
    this.tech = T; this.tt = 0; this.hitMap = new Map(); this.swooshed = false; this.slamDone = false; this.waveDone = false; this.marked = false;
    this.az = p.aim; this.fc = p.facing || 1;
    if (!T.dmgless && T.id !== 'flourish') {
      const t = g.nearestEnemy?.(p.x, p.y, 78, p.aim, 0.95);
      if (t) { const a = Math.atan2(t.y - p.y, t.x - p.x); let d = a - this.az; d = Math.atan2(Math.sin(d), Math.cos(d)); this.az += d * 0.7; }
    }
    // aliran kata samurai: jurus menyamping dicerminkan bergantian sisi (kiri <-> kanan)
    this.mirror = T.side ? this.sideFlip : 1;
    this.from = { ...this.st };
    const k0 = T.keys[0];
    this.from.off += TAU * Math.round((k0[1] * this.mirror - this.from.off) / TAU);
    this.from.ph += TAU * Math.round((k0[2] - this.from.ph) / TAU);
    this.rollTarget = T.edge * this.fc * this.mirror;
    // LONCAT SERGAP: melompat menuju musuh terdekat — arahkan wajah ke sasaran lalu terjang
    if (T.leap) {
      const t = g.nearestEnemy?.(p.x, p.y, 135, this.az, 1.5);
      if (t) { const a = Math.atan2(t.y - p.y, t.x - p.x); let d = a - this.az; d = Math.atan2(Math.sin(d), Math.cos(d)); this.az += d; this.fc = Math.cos(this.az) >= 0 ? 1 : -1; }
      if (g.level?.sideView) {
        p.svGrounded = false; p.svVy = -208; p.airborne = true; p.jumpT = 0;
        p.kx += Math.cos(this.az) * 305;
      } else {
        p.vz = 208; p.airborne = true; p.jumpT = 0;
        p.kx += Math.cos(this.az) * 320; p.ky += Math.sin(this.az) * 170;
      }
      g.sfx?.whoosh?.();
    }
    this.buffered = null;
    this.idleT = 0;
  }

  private guardTarget(g: G) {
    const p = g.player;
    const run = p.moving && p.runT > 0.03;
    const b = Math.sin(this.time * 3.1);
    return run ? { off: 2.65, ph: 0.82 + 0.06 * Math.sin(this.time * 14), r: 3 } : { off: 0.55, ph: 0.55 + 0.04 * b, r: 4 + 0.3 * b };
  }

  private finish(g: G) {
    const T = this.tech!;
    this.markEnd(T);
    const gt = this.guardTarget(g);
    this.st.off += TAU * Math.round((gt.off - this.st.off) / TAU);
    this.st.ph += TAU * Math.round((gt.ph - this.st.ph) / TAU);
    this.tech = null;
    // Rangkaian KOMBO UDARA berjalan otomatis antar-fase: tebas miring -> melompat berputar -> tebasan turun
    if (this.airSeq === 1 && T.id === 'airdiag') {
      this.airSeq = 2;
      const p = g.player;
      p.vz = 215; p.airborne = true; p.jumpT = 0;
      p.kx += Math.cos(this.az) * 80; p.ky += Math.sin(this.az) * 40;
      this.start(g, T_AIRSPIN);
      return;
    }
    if (this.airSeq === 2 && T.id === 'airspin') { this.airSeq = 3; this.start(g, T_AIRDIVE); return; }
    if (T.id === 'airdive') this.airSeq = 0;
    if (isTrick(T)) return;
    const b = this.buffered; this.buffered = null;
    if (b === 'R') this.startHeavy(g);
    else if (b === 'L' || g.input.mouse.down) this.startAttack(g);
  }

  markEnd(T: Tech) {
    this.lastEnd = this.time;
    // tiap jurus menyamping selesai -> serangan berikutnya mengalir dari sisi sebaliknya
    if (T.side) this.sideFlip = this.sideFlip === 1 ? -1 : 1;
    // lompatan pembuka tidak memotong rantai: kombo lanjut ke jurus ke-2
    if (T.id === 'leap' && this.leapOpener) { this.leapOpener = false; this.step = 1; return; }
    const order = ['sweep', 'reverse', 'cross', 'twirl', 'spincombo', 'leap'];
    const i = order.indexOf(T.id);
    this.step = i >= 0 ? i + 1 : 0;
  }
  /** atraksi putar tongkat (tombol Z saat guan dao sudah dipegang) */
  trick(g: G) {
    const p = g.player;
    if (p.weapon !== 'guandao' || p.stunT > 0 || p.fatality) return;
    this.trickI = (this.trickI + 1) % TRICKS.length;
    this.cancel();
    this.start(g, TRICKS[this.trickI]);
    g.say?.(TRICKS[this.trickI].name, '#b8ffe0', 2, 0.7);
  }
  trickI = -1;
  startWhirl(g: G) {
    this.start(g, T_WHIRL);
    this.step = 0;
    g.say?.(T_WHIRL.name, '#5dffa0', 2, 0.8);
  }
  /** BASIC HEAVY ATTACK — klik kanan TAP (< 0,2 detik). */
  startHeavy(g: G) {
    this.start(g, T_HEAVY);
    this.step = 0;
    g.say?.(T_HEAVY.name, '#ffe9a8', 2, 0.7);
  }
  /** KOMBO UDARA (Diagonal-to-Aerial Spin Slash) — dipicu LMB selagi karakter di udara. */
  startAerial(g: G) {
    this.airSeq = 1;
    this.start(g, T_AIRDIAG);
    g.say?.('KOMBO UDARA!', '#a6fff0', 2, 0.9);
  }
  startAttack(g: G) {
    const p = g.player;
    const running = p.moving && Math.hypot(p.vx, p.vy) > 85 && this.time - this.lastEnd > 0.55;
    let T = T_SWEEP;
    if (p.dashT > 0 || running) T = T_THRUST;
    else {
      if (this.time - this.lastEnd >= 0.85) this.step = 0;
      // Kadang kombo DIBUKA dengan lompatan menuju musuh bila sasarannya agak jauh —
      // bergantian dengan pembuka biasa supaya alur pertarungan tidak monoton.
      const tgt = this.step === 0 && !p.airborne ? g.nearestEnemy?.(p.x, p.y, 132, p.aim, 1.4) : null;
      const tdist = tgt ? Math.hypot(tgt.x - p.x, tgt.y - p.y) : 0;
      if (tgt && tdist > 48 && tdist < 130 && this.openerAlt) {
        this.openerAlt = false; this.leapOpener = true; T = T_LEAP;
      } else {
        if (this.step === 0) this.openerAlt = true;
        // Rantai utama mengalir menyamping: SAPU > NAIK BALIK > SABIT MENYILANG > BALING-BALING > KOMBO PUTARAN
        const CHAIN = [T_SWEEP, T_REVERSE, T_CROSS, T_TWIRL, T_SPIN];
        T = CHAIN[this.step] ?? (this.leapAlt ? T_LEAP : T_TAISHAN);
        // Penutup bergantian: sekali Loncat Sergap ke musuh, sekali Tai Shan menghantam tanah
        if (!CHAIN[this.step]) this.leapAlt = !this.leapAlt;
      }
    }
    this.start(g, T);
    if (T.id !== 'sweep') g.say?.(T.name, T.id === 'taishan' ? '#d4ff9a' : '#9dffd8', 2, 0.7);
  }
  private releaseCharge(g: G) {
    // CHARGED HEAVY (tahan klik kanan >= 0,2 detik): tebasan vertikal super kuat yang
    // membelah tubuh stickman musuh menjadi dua bagian (dismemberment/bisect).
    const lvl = this.charge;
    this.charging = false; this.charge = 0;
    this.start(g, T_CLEAVE);
    this.cleaveLvl = lvl;
    g.say?.(lvl >= 0.95 ? 'TEBASAN PEMBELAH MAX!' : T_CLEAVE.name, '#ffc46b', 2, 0.9);
  }
  moonLvl = 0;

  update(g: G, dt: number) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    this.updateFx(g, dt);
    const p = g.player, inp = g.input;
    if (p.weapon !== 'guandao') { if (this.tech || this.charging) this.cancel(); return; }
    const locked = g.state !== 'playing' || p.fatality || p.stunT > 0 || p.holdT > 0 || g.silat || g.botPunch?.active || g.propsPlay?.scene || g.carry?.carrying || g.grab?.holding;
    if (this.hintT > 0) this.hintT -= dt;
    if (locked) { if (this.tech && !isTrick(this.tech)) this.cancel(); this.charging = false; this.rHold = 0; this.relax(g, dt); return; }
    // ---- input
    const mouse = inp.mouse;
    // KOMBO UDARA (Diagonal-to-Aerial Spin Slash): LMB selagi karakter melayang di udara.
    // Rangkaian berjalan otomatis: tebasan miring -> melompat berputar -> tebasan miring ke bawah.
    if (mouse.pressed && p.airborne && this.airSeq === 0 && (!this.tech || isTrick(this.tech))) {
      if (this.tech) this.tech = null;
      this.charging = false; this.rHold = 0;
      this.startAerial(g);
    } else if (mouse.pressed && !p.airborne) {
      if (!this.tech || isTrick(this.tech)) { if (this.tech) this.tech = null; this.charging = false; this.rHold = 0; this.startAttack(g); }
      else if (this.tt > this.tech.hit[1] + 0.025) { this.markEnd(this.tech); this.tech = null; this.buffered = null; this.startAttack(g); }
      else if (this.tt > this.tech.dur * 0.15) this.buffered = 'L';
    }
    if (!this.tech || isTrick(this.tech)) {
      if (mouse.rdown && !p.airborne) {
        if (this.tech) this.tech = null;
        this.rHold += dt;
        // Ambang persis spesifikasi: tahan >= 0,2 detik masuk mode CHARGED; di bawah itu TAP.
        if (this.rHold >= 0.2) {
          if (!this.charging) { this.charging = true; this.az = p.aim; this.fc = p.facing || 1; this.from = { ...this.st }; g.sfx?.whoosh?.(); this.rollTarget = this.fc; }
          this.charge = Math.min(1, (this.rHold - 0.2) / 0.55);
          if (Math.floor((this.rHold - dt) * 14) !== Math.floor(this.rHold * 14)) g.particles?.burst?.(p.x + rnd(-5, 5), p.y - rnd(2, 16), 1, '#5dffa0', 35, 0.3, 1, 1);
          if (this.charge >= 1 && !this.fullFx) { this.fullFx = true; g.sfx?.leverClack?.(); g.flash?.('#5dffa0', 0.12); g.particles?.ring?.(p.x, p.y - 8, 3, 24, '#ffffff', 0.25, 1); }
          this.az = p.aim; this.fc = p.facing || this.fc;
        }
      } else if (this.rHold > 0) {
        const held = this.rHold; this.rHold = 0; this.fullFx = false;
        if (this.charging) this.releaseCharge(g); // TAHAN >= 0,2 detik -> Charged Heavy (Tebasan Pembelah)
        else if (held > 0.02 && !p.airborne) this.startHeavy(g); // TAP < 0,2 detik -> Basic Heavy Attack
      }
    } else if (mouse.rpressed && this.tt > this.tech.hit[1]) { this.markEnd(this.tech); this.tech = null; this.buffered = null; this.startHeavy(g); }
    else if (mouse.rpressed && this.tt > this.tech.dur * 0.15) this.buffered = 'R';
    if (p.dashT > 0 && this.tech && this.tech.id !== 'thrust') this.cancel();

    // ---- atraksi saat lama diam
    if (!this.tech && !this.charging) {
      this.idleT = p.moving ? 0 : this.idleT + dt;
      if (this.idleT > 2.0 && !mouse.down) { this.trickI = (this.trickI + 1) % TRICKS.length; this.start(g, TRICKS[this.trickI]); }
    }

    // ---- teknik berjalan (sub-step supaya trail & tumbukan halus)
    if (this.tech) {
      const n = Math.max(1, Math.ceil(dt * 150)), h = dt / n;
      for (let i = 0; i < n && this.tech; i++) {
        this.tt += h * SPD * (g.tempo ?? 1);
        this.poseStep(g);
        this.techStep(g, h, i === n - 1);
        if (this.tech && this.tt >= this.tech.dur) this.finish(g);
      }
    } else if (this.charging) {
      this.chargePose(g, dt);
    } else this.relax(g, dt);
    // KOMBO UDARA fase 3 menghantam tanah: tebasan miring ke bawah menutup rangkaian dengan
    // hantaman area kecil di titik pendaratan, lalu teknik selesai.
    if (this.tech?.id === 'airdive' && this.airSeq === 3 && !p.airborne && this.tt > 0.1) {
      for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) > 30 + (e.r ?? 6)) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        g.damageEnemy(e, 9, 50, a, 420, { melee: true, knockdown: true, hitstop: 0.05, shake: 0.3, launch: 90 });
      }
      g.shake?.(0.35); g.sfx?.slam?.();
      g.particles?.shockwave?.(p.x, p.y, 24, '#a6fff0', 0.3);
      this.airSeq = 0;
      this.finish(g);
    }
    // putaran sumbu (roll) halus -> terlihat memutar bilah
    this.roll += (this.rollTarget - this.roll) * Math.min(1, dt * 16);
    if (!this.tech && !this.charging) this.rollTarget = this.roll >= 0 ? 1 : -1;
  }
  fullFx = false;

  private relax(g: G, dt: number) {
    const gt = this.guardTarget(g);
    this.st.off += TAU * Math.round((gt.off - this.st.off) / TAU);
    this.st.ph += TAU * Math.round((gt.ph - this.st.ph) / TAU);
    const k = Math.min(1, dt * 11);
    this.st.off = lerp(this.st.off, gt.off, k); this.st.ph = lerp(this.st.ph, gt.ph, k); this.st.r = lerp(this.st.r, gt.r, k);
  }
  private chargePose(g: G, dt: number) {
    const sh = this.charge * (Math.sin(this.time * 70) * 0.04);
    const k = Math.min(1, dt * 14);
    this.st.off = lerp(this.st.off, 2.5 + sh, k); this.st.ph = lerp(this.st.ph, 1.05 + this.charge * 0.2, k); this.st.r = lerp(this.st.r, 2.5, k);
    const q = this.geo(g);
    if (Math.random() < 0.3 + this.charge * 0.6) g.particles?.burst?.(q.G.x + q.ux * rnd(9, 28), q.G.y + q.uy * rnd(9, 28), 1, Math.random() < 0.5 ? '#5dffa0' : '#ffffff', 25, 0.35, 1, 1);
  }
  private poseStep(g: G) {
    const T = this.tech!;
    const [offR, ph, r] = sampleKeys(T.keys, this.tt);
    const off = offR * this.mirror; // cerminkan azimut untuk ayunan menyamping berganti sisi
    const bl = sstep(this.tt / 0.07);
    this.st.off = lerp(this.from.off, off, bl); this.st.ph = lerp(this.from.ph, ph, bl); this.st.r = lerp(this.from.r, r, bl);
    if (this.tt < T.hit[0] * 0.8 && T.id !== 'flourish') { const p = g.player; this.az = p.aim; this.fc = this.fc; }
  }

  private techStep(g: G, h: number, last: boolean) {
    const T = this.tech!, p = g.player;
    const q = this.geo(g);
    // lunge ke depan
    if (T.lunge && this.tt >= T.lunge[0] && this.tt <= T.lunge[1]) {
      const sp = T.lunge[2] * SPD * (g.tempo ?? 1);
      p.kx = Math.cos(this.az) * sp; p.ky = Math.sin(this.az) * sp * 0.8;
    }
    // KOMBO UDARA: fase putaran menahan ketinggian, fase penutup menukik keras ke bawah
    if (T.id === 'airspin') {
      p.airborne = true;
      if (g.level?.sideView) { p.svGrounded = false; p.svVy = Math.min(p.svVy ?? 0, -26); }
      else p.vz = Math.max(p.vz, 72);
    } else if (T.id === 'airdive') {
      if (g.level?.sideView) { p.svGrounded = false; p.svVy = Math.max(p.svVy ?? 0, 300); }
      else p.vz = Math.min(p.vz, -280);
    }
    const strike = this.tt >= T.hit[0] - 0.04 && this.tt <= T.hit[1] + 0.06;
    // jejak tebasan = rekaman gerak bilah asli.
    // CATATAN SPESIFIKASI: khusus KOMBO PUTARAN tidak digambar jejak/bayangan apa pun —
    // gerakan murni animasi ayunan senjatanya sendiri, tanpa partikel angin / tornado.
    if (T.id !== 'spincombo' && (strike || isTrick(T) || (T.id === 'whirl' && this.tt > 0.12))) {
      const xs: number[] = [], ys: number[] = [];
      for (let k = 0; k < STRANDS; k++) {
        const d = 9 + (k / (STRANDS - 1)) * 20;
        xs.push(q.G.x + q.ux * d); ys.push(q.G.y + q.uy * d);
      }
      this.trail.push({ xs, ys, t: TRAIL_LIFE, col: T.col, w: T.id === 'flourish' ? 0.55 : (T.id === 'heli' || T.id === 'fig8' || T.id === 'twirl') ? 0.7 : T.heavy ? 1.15 : 1 });
      if (this.trail.length > 90) this.trail.splice(0, this.trail.length - 90);
    }
    if (!this.swooshed && this.tt >= T.hit[0] - 0.05 && !T.dmgless) {
      this.swooshed = true;
      if (T.heavy) { g.sfx?.axeSwing?.(); g.sfx?.whoosh?.(); } else { g.sfx?.slash?.(T.id === 'thrust' ? 1.3 : 0.9 + Math.random() * 0.25); g.sfx?.whoosh?.(); }
    }
    if (isTrick(T) && !this.swooshed && this.tt > 0.1) { this.swooshed = true; g.sfx?.whoosh?.(); window.setTimeout(() => g.sfx?.whoosh?.(), 220); window.setTimeout(() => g.sfx?.whoosh?.(), 480); }
    if (T.id === 'whirl' && last && this.tt > 0.15 && this.tt < 0.8 && Math.floor((this.tt - h) * 12) !== Math.floor(this.tt * 12)) {
      g.sfx?.whoosh?.();
      g.particles?.smoke?.(p.x + rnd(-8, 8), p.y + 1, 2, '#bfc9b0', 40, 0.3);
      g.particles?.lines?.(p.x, p.y - 6, 3, 'rgba(180,255,210,0.7)', this.az + this.tt * 14, 160);
    }
    // bayangan senjata saat ayunan cepat (khusus Kombo Putaran: dimatikan demi animasi senjata murni)
    this.ghostCd -= h;
    if (T.id !== 'spincombo' && strike && this.ghostCd <= 0) { this.ghostCd = T.id === 'whirl' ? 0.02 : 0.016; this.ghosts.push({ x: q.G.x, y: q.G.y, ux: q.ux, uy: q.uy, roll: this.roll, t: T.id === 'whirl' ? 0.12 : 0.15 }); }
    // tumbukan
    if (!T.dmgless && this.tt >= T.hit[0] && this.tt <= T.hit[1]) this.testHits(g, T, q);
    // gelombang bulan sabit
    if (T.id === 'moon' && !this.waveDone && this.tt >= 0.2) {
      this.waveDone = true;
      const lvl = this.moonLvl;
      const mk = (da: number, sc: number) => this.waves.push({ x: p.x + Math.cos(this.az) * 14, y: p.y - 4 + Math.sin(this.az) * 8, a: this.az + da, sp: 340 + lvl * 80, life: 0.62 + lvl * 0.28, max: 0.62 + lvl * 0.28, r: (13 + lvl * 15) * sc, dmg: 8 + lvl * 7, hit: [], tick: 0 });
      mk(0, 1);
      if (lvl >= 0.95) { mk(0.3, 0.7); mk(-0.3, 0.7); }
      g.sfx?.slash?.(0.6); g.sfx?.axeSwing?.();
      g.shake?.(0.3 + lvl * 0.3); g.flash?.('#b8ffe0', 0.12 + lvl * 0.1);
      g.particles?.shockwave?.(p.x, p.y - 6, 26 + lvl * 20, '#5dffa0', 0.3);
    }
    // hantaman Tai Shan ke tanah
    if (T.id === 'taishan' && !this.slamDone && this.tt >= 0.485) this.slam(g, q);
  }

  private slam(g: G, q: Geo) {
    this.slamDone = true;
    const p = g.player;
    const x = p.x + Math.cos(this.az) * 36, y = p.y + Math.sin(this.az) * 22;
    g.sfx?.slam?.(); g.sfx?.explosion?.();
    g.shake?.(0.8); g.flash?.('#d4ff9a', 0.22); g.hitstop = Math.max(g.hitstop ?? 0, 0.07);
    g.zoomKick = Math.max(g.zoomKick ?? 0, 0.05);
    g.particles?.shockwave?.(x, y, 46, '#9dff9a', 0.4);
    g.particles?.ring?.(x, y, 2, 30, '#ffffff', 0.3, 2);
    g.particles?.burst?.(x, y, 26, '#8a7a5a', 230, 0.6, 2, 3);
    g.particles?.smoke?.(x, y, 8, '#9a9a8a', 50, 0.6);
    g.particles?.spark?.(x, y - 2, 18, '#d4ff9a', -Math.PI / 2, 2.4, 260);
    g.splat?.(x, y, 12);
    const segs: [number, number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + rnd(-0.2, 0.2); let cx = 0, cy = 0;
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) { const na = a + rnd(-0.5, 0.5), l = rnd(5, 9); segs.push([cx, cy, cx + Math.cos(na) * l, cy + Math.sin(na) * l * 0.6]); cx += Math.cos(na) * l; cy += Math.sin(na) * l * 0.6; }
    }
    this.cracks.push({ x, y, segs, t: 2.2 });
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d > 40 + (e.r ?? 6)) continue;
      const a = Math.atan2(e.y - y, e.x - x);
      g.damageEnemy(e, 9, 60, a, 520, { melee: true, hitstop: 0.05, shake: 0.2, launch: 120 });
      this.addMark(e.x, e.y - 8 - e.z, -Math.PI / 4, true);
    }
    void q;
  }

  private addMark(x: number, y: number, a: number, big: boolean) { this.marks.push({ x, y, a, t: big ? 0.26 : 0.18, big }); }

  private testHits(g: G, T: Tech, q: Geo) {
    const p = g.player;
    const x0 = q.G.x + q.ux * 8, y0 = q.G.y + q.uy * 8, x1 = q.G.x + q.ux * 33, y1 = q.G.y + q.uy * 33;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const base = e.y - (e.z ?? 0);
      let d = 999;
      for (const oy of [-1, -5, -10]) d = Math.min(d, segDist(e.x, base + oy, x0, y0, x1, y1));
      if (d > (e.r ?? 6) * 0.8 + 3.5) continue;
      const last = this.hitMap.get(e.id);
      if (last !== undefined && (T.rehit === undefined || this.tt - last < T.rehit)) continue;
      this.hitMap.set(e.id, this.tt);
      this.hitEnemy(g, T, e, q, p);
    }
  }

  private hitEnemy(g: G, T: Tech, e: any, q: Geo, p: any) {
    const a1 = Math.atan2(e.y - p.y, e.x - p.x);
    const vx = Math.cos(a1) * 0.7 + Math.cos(this.az) * 0.5, vy = Math.sin(a1) * 0.7 + Math.sin(this.az) * 0.5;
    const ang = Math.atan2(vy, vx);
    const final = T.id === 'whirl' && this.tt > 0.7;
    const ex = e.x, ey = e.y - 7 - (e.z ?? 0);
    // CHARGED HEAVY: tubuh stickman musuh TERBELAH menjadi dua bagian yang terpisah & jatuh
    if (T.id === 'cleave' && typeof g.bisectEnemy === 'function') {
      g.bisectEnemy(e, ang, this.cleaveLvl);
      this.addMark(ex, ey, Math.atan2(q.uy, q.ux) + Math.PI / 2, true);
      g.particles?.spark?.(ex, ey, 14, '#ffffff', ang, 1.2, 280);
      g.particles?.blood?.(ex, ey, 12, ang, 200);
      g.sfx?.axeHit?.(true);
      g.texts?.hit?.(ex, ey - 16, 'TERBELAH!', '#ffc46b', 1, 0.7);
      return;
    }
    g.damageEnemy(e, final ? 10 : T.dmg, final ? 50 : T.st, ang, final ? 560 : T.kb, { melee: true, knockdown: !!T.heavy, hitstop: final ? 0.07 : T.hitstop, shake: final ? 0.4 : T.shake, launch: final ? 70 : T.launch, zone: zoneFromTech(final ? 'whirl' : T.id) });
    // arah ayunan di layar (untuk tanda sayatan)
    const sa = Math.atan2(q.uy, q.ux) + Math.PI / 2;
    this.addMark(ex, ey, sa, T.heavy || final);
    g.particles?.spark?.(ex, ey, T.heavy ? 12 : 7, '#ffffff', ang, 1.1, 240);
    g.particles?.spark?.(ex, ey, 4, T.col, ang + Math.PI, 1.4, 160);
    g.particles?.blood?.(ex, ey, 6 + (T.heavy ? 6 : 0), ang, 160);
    g.blood?.spray?.(ex, ey, ang, T.heavy ? 4 : 2.5, true);
    if (T.id === 'thrust') g.particles?.lines?.(ex, ey, 4, '#ffffff', ang + Math.PI, 220);
    g.sfx?.axeHit?.(T.heavy || final);
    if (T.heavy) { g.flash?.('#ffffff', 0.08); g.zoomKick = Math.max(g.zoomKick ?? 0, 0.025); }
    if (e.dead) {
      g.slow?.(T.heavy ? 0.16 : 0.1, 0.35);
      if (Math.random() < 0.5) g.texts?.hit?.(ex, ey - 16, T.heavy ? 'CLEAVED!' : 'SLASH!', T.col, 1, 0.6);
      g.particles?.blood?.(ex, ey, 10, ang + Math.PI / 2, 190);
      g.particles?.blood?.(ex, ey, 10, ang - Math.PI / 2, 190);
    }
  }

  // ---------------------------------------------------------------- efek sampingan
  updateFx(g: G, dt: number) {
    for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].t -= dt; if (this.trail[i].t <= 0) this.trail.splice(i, 1); }
    for (let i = this.ghosts.length - 1; i >= 0; i--) { this.ghosts[i].t -= dt; if (this.ghosts[i].t <= 0) this.ghosts.splice(i, 1); }
    for (let i = this.marks.length - 1; i >= 0; i--) { this.marks[i].t -= dt; if (this.marks[i].t <= 0) this.marks.splice(i, 1); }
    for (let i = this.cracks.length - 1; i >= 0; i--) { this.cracks[i].t -= dt; if (this.cracks[i].t <= 0) this.cracks.splice(i, 1); }
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life -= dt;
      w.x += Math.cos(w.a) * w.sp * dt; w.y += Math.sin(w.a) * w.sp * dt;
      w.tick -= dt;
      if (w.tick <= 0) { w.tick = 0.03; g.particles?.burst?.(w.x - Math.cos(w.a) * w.r * 0.4 + rnd(-4, 4), w.y + rnd(-w.r * 0.5, w.r * 0.5) * 0.6, 1, Math.random() < 0.5 ? '#5dffa0' : '#ffffff', 30, 0.3, 1, 1); }
      let dead = w.life <= 0 || solidAt(g.level, w.x, w.y);
      if (!dead && g.state === 'playing') {
        for (const e of g.enemies) {
          if (e.dead || e.spawnT > 0 || w.hit.includes(e.id)) continue;
          if (Math.hypot(e.x - w.x, (e.y - w.y) * 1.4) > w.r * 0.9 + (e.r ?? 6)) continue;
          w.hit.push(e.id);
          const a = w.a + rnd(-0.2, 0.2);
          g.damageEnemy(e, w.dmg, 40, a, 520, { melee: true, hitstop: 0.05, shake: 0.25, launch: 45 });
          this.addMark(e.x, e.y - 8 - (e.z ?? 0), w.a + Math.PI / 2, true);
          g.particles?.blood?.(e.x, e.y - 7, 10, a, 190);
          g.particles?.spark?.(e.x, e.y - 7, 8, '#b8ffe0', a, 1.3, 240);
          g.sfx?.axeHit?.(true);
        }
      }
      if (dead) {
        g.particles?.burst?.(w.x, w.y, 10, '#5dffa0', 120, 0.4, 2, 2);
        this.waves.splice(i, 1);
      }
    }
  }

  // ---------------------------------------------------------------- gambar
  drawFx(_g: G, ctx: Ctx) {
    // retakan tanah
    for (const c of this.cracks) {
      ctx.globalAlpha = clamp(c.t / 1.2, 0, 1);
      for (const s of c.segs) pline(ctx, c.x + s[0], c.y + s[1], c.x + s[2], c.y + s[3], '#0a0a0a', 1);
    }
    ctx.globalAlpha = 1;
    // jejak tebasan
    this.drawTrail(ctx);
    // gelombang
    for (const w of this.waves) {
      const f = clamp(w.life / w.max, 0, 1), al = Math.min(1, f * 2.5);
      const cx = w.x - Math.cos(w.a) * w.r * 0.72, cy = w.y - Math.sin(w.a) * w.r * 0.72 * 0.6;
      crescent(ctx, cx - Math.cos(w.a) * 6, cy - Math.sin(w.a) * 3.6, w.r * 1.02, w.a - 1.15, w.a + 1.15, 5, '#1fd37a', al * 0.5, 0, 1, 0.62);
      crescent(ctx, cx, cy, w.r, w.a - 1.2, w.a + 1.2, 7, '#5dffa0', al, 0, 2, 0.62);
      crescent(ctx, cx + Math.cos(w.a) * 1.5, cy + Math.sin(w.a) * 0.9, w.r * 0.97, w.a - 1.0, w.a + 1.0, 3, '#ffffff', al, 0, 3, 0.62);
    }
    ctx.globalAlpha = 1;
    // tanda sayatan di musuh
    for (const m of this.marks) {
      const k = m.t / (m.big ? 0.26 : 0.18);
      const len = (m.big ? 22 : 14) * (1.2 - k * 0.4);
      const dx = Math.cos(m.a) * len * 0.5, dy = Math.sin(m.a) * len * 0.5;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      pline(ctx, m.x - dx, m.y - dy, m.x + dx, m.y + dy, '#5dffa0', m.big ? 3 : 2);
      pline(ctx, m.x - dx * 0.9, m.y - dy * 0.9, m.x + dx * 0.9, m.y + dy * 0.9, '#ffffff', 1);
      if (m.big) { pline(ctx, m.x - dy * 0.35, m.y + dx * 0.35, m.x + dy * 0.35, m.y - dx * 0.35, '#ffffff', 1); }
    }
    ctx.globalAlpha = 1;
  }

  private drawTrail(ctx: Ctx) {
    const tr = this.trail;
    for (let i = 1; i < tr.length; i++) {
      const a = tr[i - 1], b = tr[i];
      // jangan sambungkan sampel yang terlalu jauh waktunya (teknik berbeda)
      if (Math.abs(a.t - b.t) > 0.05) continue;
      const age = 1 - clamp(b.t / TRAIL_LIFE, 0, 1);
      const al = Math.pow(1 - age, 1.35);
      if (al < 0.04) continue;
      for (let k = 0; k < STRANDS; k++) {
        const f = k / (STRANDS - 1);
        // jejak menyempit ke ujung bilah seiring usia
        if (f < age * 0.55) continue;
        const col = k >= STRANDS - 1 ? '#ffffff' : k >= STRANDS - 3 ? '#d8ffe8' : f > 0.55 ? b.col : f > 0.3 ? '#2fe08a' : '#12905a';
        ctx.globalAlpha = al * (f > 0.3 ? 0.95 : 0.55) * b.w;
        pline(ctx, a.xs[k], a.ys[k], b.xs[k], b.ys[k], col, k >= STRANDS - 2 || k % 2 === 0 ? 2 : 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  private spr: { cv: HTMLCanvasElement; cx: CanvasRenderingContext2D; img: ImageData; d32: Uint32Array; pal: Uint32Array } | null = null;
  private ensureSprite() {
    if (this.spr) return this.spr;
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const cx = cv.getContext('2d')!;
    const img = cx.createImageData(128, 128);
    const d32 = new Uint32Array(img.data.buffer);
    const pal = new Uint32Array(GD_PAL.length);
    GD_PAL.forEach((h, i) => { if (!i) { pal[i] = 0; return; } const r = parseInt(h.slice(1, 3), 16), gg = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); pal[i] = (255 << 24) | (b << 16) | (gg << 8) | r; });
    this.spr = { cv, cx, img, d32, pal };
    return this.spr;
  }

  /** gambar sprite guan dao, terputar sempurna per-piksel (tanpa antialias), roll = putaran pada sumbunya */
  drawSprite(ctx: Ctx, gx: number, gy: number, ux: number, uy: number, roll: number, alpha = 1, glow: string | null = null, tintPal: Uint32Array | null = null) {
    const S = this.ensureSprite();
    const grid = buildGuanDaoGrid();
    const C = 64, SC = GD_SCALE, inv = 1 / SC, R = Math.ceil(62 * SC) + 3;
    const ox = Math.round(gx), oy = Math.round(gy);
    S.d32.fill(0);
    const nx = -uy, ny = ux;
    const rr = Math.abs(roll) < 0.12 ? (roll < 0 ? -0.12 : 0.12) : roll;
    const lo = Math.max(0, C - R), hi = Math.min(128, C + R);
    const OFF = [-0.25, 0.25];
    for (let y = lo; y < hi; y++) for (let x = lo; x < hi; x++) {
      let n = 0, solid = 0, ol = 0;
      for (const sy of OFF) for (const sx of OFF) {
        const dx = x - C + 0.5 + sx, dy = y - C + 0.5 + sy;
        const a = Math.floor((dx * ux + dy * uy) * inv + GD_GRIP);
        if (a < 0 || a >= GD_LEN + 2) continue;
        const b = Math.floor(((dx * nx + dy * ny) * inv) / rr + GD_HALF + 0.5);
        if (b < 0 || b >= GD_W) continue;
        const c = grid[a * GD_W + b];
        if (!c) continue;
        n++;
        if (c === 1 || c === 12) ol = c; else solid = c;
      }
      if (n >= 2) S.d32[y * 128 + x] = (tintPal ?? S.pal)[solid || ol];
    }
    S.cx.putImageData(S.img, 0, 0);
    const prev = ctx.globalAlpha;
    if (glow) {
      // aura: sprite digeser 1px ke empat arah dengan alpha rendah
      ctx.globalAlpha = prev * alpha * 0.28;
      for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.drawImage(S.cv, ox - C + sx, oy - C + sy);
    }
    ctx.globalAlpha = prev * alpha;
    ctx.drawImage(S.cv, ox - C, oy - C);
    ctx.globalAlpha = prev;
  }

  draw(g: G, ctx: Ctx) {
    const p = g.player;
    if (p.weapon !== 'guandao' || p.fatality || g.state === 'dead') return;
    const q = this.geo(g);
    // bayangan senjata
    for (const gh of this.ghosts) this.drawSprite(ctx, gh.x, gh.y, gh.ux, gh.uy, gh.roll, clamp(gh.t / 0.15, 0, 1) * 0.3, null);
    const glow = this.charging ? (this.charge >= 1 && Math.floor(this.time * 16) % 2 ? '#ffffff' : '#5dffa0') : this.tech && this.tech.heavy && this.tt > this.tech.hit[0] - 0.05 && this.tt < this.tech.hit[1] + 0.05 ? '#d4ff9a' : null;
    this.drawSprite(ctx, q.G.x, q.G.y, q.ux, q.uy, this.roll, 1, glow);
    // jumbai merah: fisika ringan mengikuti gerak senjata
    this.drawTassel(g, ctx, q);
    // tangan menggenggam
    pcircle(ctx, q.G.x, q.G.y, 1, '#ffffff');
    // HUD tenaga
    if (g.state === 'playing') {
      if (this.charging) {
        const w = 22, bx = Math.round(p.x - w / 2), by = Math.round(p.y + 7);
        prect(ctx, bx - 1, by - 1, w + 2, 4, '#000');
        const full = this.charge >= 1;
        prect(ctx, bx, by, Math.round(w * this.charge), 2, full ? (Math.floor(this.time * 14) % 2 ? '#ffffff' : '#5dffa0') : '#2fe08a');
        if (full) pfontO(ctx, 'LEPAS = TEBASAN PEMBELAH!', p.x, p.y - 36 - p.z, '#ffc46b', '#000', 1, 'center');
      } else if (this.hintT > 0 && !this.tech) {
        pfontO(ctx, 'LMB KOMBO>PUTARAN  RMB TAP=BERAT TAHAN=PEMBELAH  LMB DI UDARA=KOMBO UDARA', p.x, p.y + 16, '#b8ffe0', '#000', 1, 'center');
      }
    }
  }

  private drawTassel(g: G, ctx: Ctx, q: Geo) {
    const nx = -q.uy * Math.sign(this.roll || 1), ny = q.ux * Math.sign(this.roll || 1);
    const bd = (GD_TASSEL.a - GD_GRIP) * GD_SCALE, bb = GD_TASSEL.b * GD_SCALE;
    // sisi punggung (b>0) di layar, memperhitungkan roll
    const side = this.roll >= 0 ? 1 : -1;
    const ax = q.G.x + q.ux * bd + nx * bb * side * Math.min(1, Math.abs(this.roll)) * side, ay = q.G.y + q.uy * bd + ny * bb * side * Math.min(1, Math.abs(this.roll)) * side;
    const T = this.tassel;
    const dt = Math.min(0.05, g.rawDt ?? 0.016);
    if (!T.init) { T.x = ax; T.y = ay + 4; T.vx = 0; T.vy = 0; T.init = true; }
    // pegas ke posisi istirahat (jatuh ke bawah, sedikit ke sisi punggung)
    const rx = ax + nx * 1.5 * side, ry = ay + 4.5;
    T.vx += (rx - T.x) * 160 * dt; T.vy += (ry - T.y) * 160 * dt;
    T.vx *= Math.exp(-9 * dt); T.vy *= Math.exp(-9 * dt);
    T.x += T.vx * dt; T.y += T.vy * dt;
    const d = Math.hypot(T.x - ax, T.y - ay);
    if (d > 7) { T.x = ax + ((T.x - ax) / d) * 7; T.y = ay + ((T.y - ay) / d) * 7; }
    const cols = ['#8e1218', '#e0262e', '#ff6a6e'];
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * 1.2;
      const ex = T.x + o * 1.1, ey = T.y + Math.abs(o) * 0.6;
      const mx = (ax + ex) / 2 + o * 0.5, my = (ay + ey) / 2;
      pline(ctx, ax, ay, mx, my, cols[i === 1 ? 1 : 0], 1);
      pline(ctx, mx, my, ex, ey, cols[i === 1 ? 2 : 1], 1);
    }
    pcircle(ctx, ax, ay, 0.5, '#47e6d0');
  }
}

export const TECHS = { sweep: T_SWEEP, reverse: T_REVERSE, cross: T_CROSS, leap: T_LEAP, twirl: T_TWIRL, spincombo: T_SPIN, taishan: T_TAISHAN, thrust: T_THRUST, whirl: T_WHIRL, moon: T_MOON, heavy: T_HEAVY, cleave: T_CLEAVE, airdiag: T_AIRDIAG, airspin: T_AIRSPIN, airdive: T_AIRDIVE, heli: T_HELI, fig8: T_FIG8, sideflow: T_SIDEFLOW, flourish: T_FLOURISH } as const;
