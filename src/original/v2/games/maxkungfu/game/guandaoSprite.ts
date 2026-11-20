/**
 * GUAN DAO (Green Dragon Crescent Blade) — sprite pixel-art yang digambar secara prosedural.
 * Bentuk mengikuti referensi: bilah sabit perak melengkung (mata di sisi cembung) dengan badan hijau
 * bersisik naga, kepala naga hijau + manik teal + jumbai merah, pelindung emas berornamen runcing,
 * gagang marun berlilit diagonal, cincin emas dan ujung tombak giok di pangkal.
 *
 * Koordinat grid: a = sepanjang senjata (0 = ujung pangkal, GD_LEN-1 = ujung bilah), b = melintang
 * (b < 0 = sisi mata perak yang cembung, b > 0 = sisi punggung dengan kepala naga).
 */
export const GD_LEN = 68;
export const GD_HALF = 15;
export const GD_W = GD_HALF * 2 + 1;
/** indeks 'a' tempat tangan depan menggenggam */
export const GD_GRIP = 27;
/** indeks 'a' pangkal bilah (pelindung) dan ujung */
export const GD_BLADE_A = 40;

export const GD_PAL: string[] = [
  '#00000000', // 0 transparan
  '#0b1410', // 1 outline
  '#f3f9fb', // 2 perak terang
  '#b7c5cf', // 3 perak tengah
  '#7b8a98', // 4 perak gelap
  '#0b4527', // 5 hijau gelap
  '#18864a', // 6 hijau tengah
  '#3fc46c', // 7 hijau terang
  '#9cf2ac', // 8 hijau kilau
  '#ffe18c', // 9 emas terang
  '#d8a232', // 10 emas tengah
  '#8d5b19', // 11 emas gelap
  '#3a2208', // 12 outline emas
  '#5c1e24', // 13 marun
  '#92403f', // 14 marun terang
  '#2c0d12', // 15 marun gelap
  '#bf6468', // 16 lilitan terang
  '#bdf7df', // 17 giok terang
  '#4fcba0', // 18 giok tengah
  '#1b7a62', // 19 giok gelap
  '#d8262e', // 20 merah
  '#4cecd6', // 21 teal
  '#ffffff', // 22 putih
];

type P = [number, number][];
const S = GD_LEN / 74;
const mapBlade = (a: number) => 40 + (a - 34) * 0.85;
const mapGuard = (a: number) => 32 + (a - 19) * (14 / 21);

const BLADE_RAW: P = [[34, 3], [41, 3.6], [47, 3.4], [53, 3.4], [59, 4.2], [65, 5.4], [70, 6.6], [74.5, 8], [73, 3.6], [70.5, -1.2], [67.5, -5.6], [63.5, -9.6], [58.5, -12.8], [52.5, -14], [46.5, -13.2], [42.5, -10.8], [39.5, -11.4], [36.5, -13.4], [33.5, -12.4], [34.5, -6.5], [35, -2]];
const DRAGON_RAW: P = [[40, 3], [42, 6.8], [45.5, 9.6], [50, 11.4], [54.5, 11], [56.5, 8.6], [54, 6.8], [57, 5.4], [52, 4], [46, 3.4]];
const GUARD_RAW: P = [[40.5, 0], [38.5, 3.2], [35, 6.2], [31, 9.4], [27, 12], [22.5, 13.2], [20.5, 10.4], [23.8, 8.8], [25, 5.6], [22, 4], [18.5, 2.6], [18.5, -2.6], [22, -4], [25, -5.8], [23.8, -9], [20.5, -10.6], [22.5, -13.4], [27, -12.2], [31, -9.8], [35, -6.6], [38.5, -3.4]];

const BLADE: P = BLADE_RAW.map(([a, b]) => [mapBlade(a), b < 0 ? b * 0.58 : b * 0.72]);
const DRAGON: P = DRAGON_RAW.map(([a, b]) => [mapBlade(a), b * 0.7 + 0.2]);
const GUARD: P = GUARD_RAW.map(([a, b]) => [mapGuard(a), b * 0.8]);

function pip(poly: P, x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** posisi pangkal jumbai (manik teal) di grid sprite */
export const GD_TASSEL = { a: mapBlade(55.5) * S, b: 7.6 * S };

let cache: Uint8Array | null = null;

export function buildGuanDaoGrid(): Uint8Array {
  if (cache) return cache;
  const g = new Uint8Array((GD_LEN + 2) * GD_W);
  const at = (a: number, b: number) => a * GD_W + b + GD_HALF;
  const set = (a: number, b: number, c: number) => { if (a >= 0 && a < GD_LEN + 2 && b >= -GD_HALF && b <= GD_HALF) g[at(a, b)] = c; };
  const inside = (poly: P, a: number, b: number) => pip(poly, (a + 0.5) / S, (b + 0.5) / S);

  // ---- ujung tombak giok di pangkal + cincin emas
  for (let a = 0; a <= 5; a++) {
    const hw = a < 1 ? 0 : a < 3 ? 1 : a < 5 ? 1 : 2;
    for (let b = -hw; b <= hw; b++) set(a, b, b < 0 ? 17 : b === 0 ? 18 : 19);
  }
  set(0, 0, 17);
  for (let a = 6; a <= 8; a++) for (let b = -2; b <= 2; b++) set(a, b, a === 6 || a === 8 ? 11 : b < 0 ? 9 : b > 0 ? 10 : 9);
  set(7, -1, 22);
  // ---- gagang marun berlilit
  for (let a = 9; a <= GD_BLADE_A - 6; a++) {
    for (let b = -1; b <= 1; b++) {
      let c = b < 0 ? 14 : b === 0 ? 13 : 15;
      if ((a + b + 8) % 4 === 0) c = b === 1 ? 13 : 16;
      set(a, b, c);
    }
  }
  // cincin emas kecil di dekat pelindung
  for (let b = -2; b <= 2; b++) { set(20, b, 11); set(21, b, b < 0 ? 9 : 10); }
  // ---- pelindung emas berornamen
  const gMin: number[] = [];
  for (let a = 0; a < GD_LEN + 2; a++) {
    let m = 99;
    for (let b = -GD_HALF; b <= GD_HALF; b++) if (inside(GUARD, a, b)) { m = b; break; }
    gMin[a] = m;
  }
  for (let a = 0; a < GD_LEN + 2; a++) for (let b = -GD_HALF; b <= GD_HALF; b++) {
    if (!inside(GUARD, a, b)) continue;
    const e = b - gMin[a];
    let c = e <= 0 ? 9 : e < 2 ? 10 : 10;
    if ((a * 2 + b * 3 + 40) % 7 === 0 && Math.abs(b) > 3) c = 11;
    if (Math.abs(b) <= 1) c = 11;
    if (!inside(GUARD, a, b - 1) || !inside(GUARD, a - 1, b)) c = 9;
    if (!inside(GUARD, a, b + 1) || !inside(GUARD, a + 1, b)) c = 11;
    set(a, b, c);
  }
  // permata teal di tengah pelindung
  const gem = { a: Math.round(mapGuard(31) * S), b: 0 };
  for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) if (Math.abs(da) + Math.abs(db) < 2) set(gem.a + da, gem.b + db, 21);
  set(gem.a - 1, gem.b, 22);
  // ---- bilah: perak di sisi mata, hijau bersisik di badan
  const bMin: number[] = [], bMax: number[] = [];
  for (let a = 0; a < GD_LEN + 2; a++) {
    let mn = 99, mx = -99;
    for (let b = -GD_HALF; b <= GD_HALF; b++) if (inside(BLADE, a, b)) { if (mn === 99) mn = b; mx = b; }
    bMin[a] = mn; bMax[a] = mx;
  }
  for (let a = GD_BLADE_A - 6; a < GD_LEN + 2; a++) for (let b = -GD_HALF; b <= GD_HALF; b++) {
    if (!inside(BLADE, a, b)) continue;
    const e = b - bMin[a];
    const t = Math.max(0, Math.min(1, (a - 44) / 20));
    const w = a < 46 ? 1.8 : 1.4 + 4.2 * Math.pow(t, 1.25);
    let c: number;
    if (e < w) {
      if (e === 0) c = 22; else if (e === 1) c = 2; else if (e < w - 1.5) c = 3; else c = 4;
      if (e >= 1 && e < w - 1 && (a % 8 === 5)) c = 22;
      if (a > 60 && e >= 1 && b - bMin[a] < w - 1 && ((a + e) % 5 === 0)) c = 2;
    } else if (e < w + 1) {
      c = 5;
    } else {
      const r3 = Math.floor(a / 3), cx = (((b + (r3 % 2) * 2) % 4) + 4) % 4, ry = a % 3;
      c = 6;
      if (ry === 0 && (cx === 1 || cx === 2)) c = 7;
      if (ry === 2 || cx === 0) c = 5;
      if (ry === 0 && cx === 1 && e > w + 2) c = 8;
      if (b >= bMax[a] - 1) c = 5;
      if (e === Math.round(w + 2) && a % 3 === 0) c = 8;
    }
    set(a, b, c);
  }
  // ---- kepala naga di sisi punggung
  const dMin: number[] = [], dMax: number[] = [];
  for (let a = 0; a < GD_LEN + 2; a++) {
    let mn = 99, mx = -99;
    for (let b = -GD_HALF; b <= GD_HALF; b++) if (inside(DRAGON, a, b)) { if (mn === 99) mn = b; mx = b; }
    dMin[a] = mn; dMax[a] = mx;
  }
  for (let a = 0; a < GD_LEN + 2; a++) for (let b = -GD_HALF; b <= GD_HALF; b++) {
    if (!inside(DRAGON, a, b)) continue;
    let c = 6;
    if (b >= dMax[a] - 1) c = 5;
    if (b <= dMin[a] + 0 && a % 2 === 0) c = 7;
    if (!inside(DRAGON, a + 1, b)) c = 5;
    if (!inside(DRAGON, a - 1, b)) c = 7;
    if ((a + b) % 4 === 0 && c === 6) c = 7;
    set(a, b, c);
  }
  const eye = { a: Math.round(mapBlade(51) * S), b: Math.round(6.2 * S) };
  set(eye.a, eye.b, 9); set(eye.a, eye.b + 1, 22);
  const bead = { a: Math.round(GD_TASSEL.a), b: Math.round(GD_TASSEL.b) };
  set(bead.a, bead.b, 21); set(bead.a, bead.b + 1, 21); set(bead.a - 1, bead.b, 22);
  // taring kecil di moncong
  set(Math.round(mapBlade(56) * S), Math.round(5 * S), 22);

  // ---- outline: piksel kosong yang bersebelahan dengan isi
  const out = new Uint8Array(g);
  for (let a = 0; a < GD_LEN + 2; a++) for (let b = -GD_HALF; b <= GD_HALF; b++) {
    if (g[at(a, b)] !== 0) continue;
    let n = 0;
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const aa = a + da, bb = b + db;
      if (aa < 0 || aa >= GD_LEN + 2 || bb < -GD_HALF || bb > GD_HALF) continue;
      const v = g[at(aa, bb)];
      if (v !== 0) n = v;
    }
    if (n) out[at(a, b)] = n >= 9 && n <= 11 ? 12 : 1;
  }
  cache = out;
  return out;
}
