// ARENA OUTDOOR — "PADANG ANGIN".
// Konsep: padang rumput luas yang diterangi matahari pagi. Hutan membingkai tepi,
// rumpun pohon tersebar sampai ke tengah (jadi selalu ada pohon di layar), jalan
// setapak berkelok, kolam dangkal berumbai alang-alang, batu, semak, dan bunga.
// Tanah dibakar sekali ke kanvas statis; kanopi dipisah ke lapisan transparan agar
// bisa digambar DI ATAS pemain (kedalaman) lalu dilubangi lembut di sekitar pemain.
import { TILE } from './constants';
import type { Level } from './level';
import { pcircle, pellipse, pline, prect, pring, px, type Ctx } from './pixel';

export interface Tree { x: number; y: number; tx: number; ty: number; r: number; kind: number; seed: number }

export const MEADOW_PAL = {
  bg: '#3f7f3a',
  floor: '#6fb84e',
  floorAlt: '#83c95c',
  wall: '#4b8f3c',
  wallTop: '#9ada6a',
  accent: '#ffd447',
  accent2: '#ff8a3d',
};

// hijau berdekatan supaya bercak terbaca sebagai rumput, bukan noise kotak
const GRASS = ['#529a3e', '#5da646', '#69b34d', '#75bf56', '#82cb62', '#90d86e'];
const LEAF_DARK = ['#2f6b2c', '#377530', '#3f8035'];
const LEAF_MID = ['#4b9440', '#57a049', '#63ac52'];
const LEAF_LIGHT = ['#83c95c', '#93d768', '#a6e478'];
const PINE_DARK = ['#255239', '#2b5c40', '#316747'];
const PINE_MID = ['#3a7a51', '#43875a', '#4d9464'];
const AUTUMN = ['#9c9430', '#b0a63a', '#c6ba46'];
const CHERRY_DARK = ['#c45a86', '#cf6a94', '#d97aa2'];
const CHERRY_MID = ['#ec8db0', '#f29bbb', '#f7abc6'];
const CHERRY_LIGHT = ['#ffc4d8', '#ffd3e2', '#ffe3ec'];
const FLOWERS = ['#fff3b0', '#ffffff', '#ff8fbb', '#c9a4ff', '#ffd447', '#ff7a6b'];

function hash(x: number, y: number, s: number) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Kolam deterministik dari ukuran arena — dipakai renderer DAN fisika air. */
export function makePonds(w: number, h: number) {
  return [
    // kolam pertama sengaja dekat titik lahir: pemain langsung melihat air
    { x: w * 0.5 * TILE + 96, y: h * 0.5 * TILE + 58, rx: 60, ry: 36 },
    { x: w * 0.28 * TILE, y: h * 0.36 * TILE, rx: 50, ry: 31 },
    { x: w * 0.72 * TILE, y: h * 0.70 * TILE, rx: 42, ry: 26 },
  ];
}

/** Kedalaman 0..1 di titik dunia — maksimumnya selutut, jadi selalu bisa diarungi. */
export function pondDepth(level: Level, x: number, y: number): number {
  const ws = level.water;
  if (!ws || !ws.length) return 0;
  let best = 0;
  for (const p of ws) {
    const dx = (x - p.x) / p.rx, dy = (y - p.y) / p.ry;
    const d = dx * dx + dy * dy;
    if (d < 1) best = Math.max(best, Math.min(1, (1 - d) * 2.2));
  }
  return best;
}

export function generateMeadow(seed: number): Level {
  const w = 80, h = 54;
  const tiles = new Uint8Array(w * h).fill(0);
  const set = (x: number, y: number, v: number) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = v; };
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 1 : tiles[y * w + x]);
  const cx = w / 2, cy = h / 2;
  const S = seed | 0;

  // tepi hutan organik
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const wob = vnoise(x * 0.18, y * 0.18, S) * 3.2;
      if (edge < 2 + wob) set(x, y, 1);
    }
  }

  const treePonds = makePonds(w, h);
  // area kolam + tepinya harus tetap terbuka: tidak ada pohon tumbuh di air
  const inPond = (tx: number, ty: number, margin = 1.18) => {
    const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
    for (const pd of treePonds) {
      const dx = (x - pd.x) / (pd.rx * margin), dy = (y - pd.y) / (pd.ry * margin);
      if (dx * dx + dy * dy < 1) return true;
    }
    return false;
  };
  const trees: Tree[] = [];
  const spaced = (tx: number, ty: number) => trees.every((t) => Math.abs(t.tx - tx) + Math.abs(t.ty - ty) > 2);
  const addTree = (tx: number, ty: number, kind: number) => {
    if (tx < 2 || ty < 2 || tx >= w - 2 || ty >= h - 2) return;
    if (get(tx, ty) === 1 && !trees.some((t) => t.tx === tx && t.ty === ty)) {
      // tile sudah padat (tepi hutan) -> tetap beri kanopi
    } else if (get(tx, ty) === 1) return;
    if (Math.abs(tx - cx) < 6.5 && Math.abs(ty - cy) < 5) return;   // titik lahir + cincin dojo tetap lapang
    if (inPond(tx, ty)) return;
    if (!spaced(tx, ty)) return;
    set(tx, ty, 1);
    const sd = hash(tx, ty, S + 7);
    trees.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 3, tx, ty, r: 12 + sd * 7, kind, seed: sd });
  };

  // bingkai hutan: pohon rapat di 6 tile terluar
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (edge > 7) continue;
      if (hash(x, y, S + 3) < (edge < 5 ? 0.85 : 0.4)) addTree(x, y, hash(x, y, S + 11) < 0.35 ? 1 : 0);
    }
  }
  // rumpun di seluruh padang — ini yang membuat pohon selalu terlihat di layar
  const groves = 16;
  for (let i = 0; i < groves; i++) {
    const gx = 8 + Math.floor(hash(i, 41, S) * (w - 16));
    const gy = 7 + Math.floor(hash(i, 42, S) * (h - 14));
    const n = 2 + Math.floor(hash(i, 43, S) * 4);
    for (let k = 0; k < n; k++) {
      const tx = gx + Math.round((hash(i * 13 + k, 44, S) - 0.5) * 7);
      const ty = gy + Math.round((hash(i * 13 + k, 45, S) - 0.5) * 6);
      const r = hash(i, k + 46, S);
      addTree(tx, ty, r < 0.2 ? 1 : r < 0.28 ? 2 : r > 0.84 ? 3 : 0);
    }
  }
  // pohon tunggal peneduh
  for (let i = 0; i < 16; i++) {
    addTree(7 + Math.floor(hash(i, 51, S) * (w - 14)), 6 + Math.floor(hash(i, 52, S) * (h - 12)), hash(i, 53, S) < 0.3 ? 1 : 0);
  }
  // pohon sakura mengelilingi arena dojo
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    addTree(Math.round(cx + Math.cos(a) * 9.5), Math.round(cy + Math.sin(a) * 6.5), 3);
  }
  // singkapan batu
  for (let i = 0; i < 14; i++) {
    const rx = 8 + Math.floor(hash(i, 61, S) * (w - 16));
    const ry = 7 + Math.floor(hash(i, 62, S) * (h - 14));
    if (Math.abs(rx - cx) < 7 && Math.abs(ry - cy) < 5.5) continue;
    if (inPond(rx, ry, 1.05)) continue;
    if (get(rx, ry) === 1) continue;
    set(rx, ry, 1);
    if (hash(i, 63, S) < 0.45 && get(rx + 1, ry) === 0) set(rx + 1, ry, 1);
  }

  const floorTiles: Level['floorTiles'] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tiles[y * w + x] === 0) floorTiles.push({ x, y });

  // dekorasi cincin dojo
  const scx = cx * TILE + TILE / 2, scy = cy * TILE + TILE / 2;
  const dRx = 54, dRy = 36;
  const lanterns: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.52; lanterns.push({ x: scx + Math.cos(a) * (dRx + 9), y: scy + Math.sin(a) * (dRy + 7) }); }
  const flagC = ['#d8372f', '#e9b73a', '#d8372f', '#e9b73a'];
  const flags: { x: number; y: number; c: string; ph: number }[] = [];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; flags.push({ x: scx + Math.cos(a) * (dRx + 16), y: scy + Math.sin(a) * (dRy + 12), c: flagC[i], ph: i * 1.7 }); }
  return {
    n: 0, zone: 0, w, h, tiles,
    spawn: { x: cx * TILE + TILE / 2, y: cy * TILE + TILE / 2 },
    exit: { x: cx * TILE, y: cy * TILE },
    floorTiles, isBoss: false, style: 'meadow', seed,
    outdoor: true, trees, water: treePonds,
    deco: { cx: scx, cy: scy, rx: dRx, ry: dRy, lanterns, flags },
  };
}

/** jalan setapak: berkelok jelas, bukan garis lurus */
function pathY(tx: number, h: number) {
  return h * 0.5 + Math.sin(tx * 0.13) * h * 0.22 + Math.sin(tx * 0.045 + 1.9) * h * 0.13;
}
function onPath(px: number, py: number, h: number) {
  const c = pathY(px / TILE, h) * TILE;
  return Math.abs(py - c) < 9 + vnoise(px / 70, 2.2, 5) * 5;
}

export function buildMeadowGround(level: Level): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = level.w * TILE; cv.height = level.h * TILE;
  const ctx = cv.getContext('2d')!;
  const S = level.seed | 0;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < level.w && y < level.h && level.tiles[y * level.w + x] === 1;

  // --- 1. dasar rumput: bercak besar kontras rendah + butiran 2px ---
  for (let y = 0; y < cv.height; y += 2) {
    for (let x = 0; x < cv.width; x += 2) {
      // kontras rendah + skala besar: rumput tenang, bukan bintik statis
      const n = vnoise(x / 110, y / 110, S) * 0.7 + vnoise(x / 40, y / 40, S + 5) * 0.24 + vnoise(x / 13, y / 13, S + 9) * 0.06;
      const i = Math.max(0, Math.min(GRASS.length - 1, Math.floor(n * GRASS.length)));
      ctx.fillStyle = GRASS[i];
      ctx.fillRect(x, y, 2, 2);
    }
  }
  // sapuan angin halus
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 320; i++) {
    const y = hash(i, 71, S) * cv.height, x = hash(i, 72, S) * cv.width;
    ctx.fillStyle = hash(i, 73, S) < 0.5 ? '#a8e07a' : '#1f4a1e';
    ctx.fillRect(x, y, 24 + hash(i, 74, S) * 90, 1);
  }
  ctx.globalAlpha = 1;

  // --- 2. kolam dangkal (bisa diarungi) ---
  const ponds = level.water ?? makePonds(level.w, level.h);
  for (const pd of ponds) {
    for (let y = -pd.ry - 7; y <= pd.ry + 7; y += 2) {
      for (let x = -pd.rx - 9; x <= pd.rx + 9; x += 2) {
        const d = (x * x) / (pd.rx * pd.rx) + (y * y) / (pd.ry * pd.ry);
        if (d > 1.3) continue;
        const wx = pd.x + x, wy = pd.y + y;
        if (solid(Math.floor(wx / TILE), Math.floor(wy / TILE))) continue;
        if (d > 1) { ctx.fillStyle = d > 1.15 ? '#8fc25f' : '#c8bd85'; ctx.fillRect(wx, wy, 2, 2); continue; }
        ctx.fillStyle = d < 0.35 ? '#3f9fb8' : d < 0.7 ? '#54b6c9' : '#79cfdb';
        ctx.fillRect(wx, wy, 2, 2);
        if (hash(Math.round(wx), Math.round(wy), S) < 0.07) { ctx.fillStyle = '#d8f6fb'; ctx.fillRect(wx, wy, 3, 1); }
      }
    }
    // alang-alang di tepi + daun terapung
    for (let i = 0; i < 26; i++) {
      const a = hash(i, pd.x | 0, S) * Math.PI * 2;
      const ex = pd.x + Math.cos(a) * pd.rx * 1.02, ey = pd.y + Math.sin(a) * pd.ry * 1.02;
      ctx.fillStyle = '#4d8a34';
      ctx.fillRect(ex, ey - 5, 1, 6); ctx.fillRect(ex + 2, ey - 3, 1, 4);
      ctx.fillStyle = '#8ec95a'; ctx.fillRect(ex + 1, ey - 6, 1, 5);
    }
    for (let i = 0; i < 6; i++) {
      const a = hash(i, pd.y | 0, S) * Math.PI * 2, rr = hash(i, 88, S) * 0.7;
      const lx = pd.x + Math.cos(a) * pd.rx * rr, ly = pd.y + Math.sin(a) * pd.ry * rr;
      pellipse(ctx, lx, ly, 4, 2.6, '#4d9c46');
      pellipse(ctx, lx - 0.7, ly - 0.7, 2.4, 1.4, '#79c65e');
      if (hash(i, 91, S) < 0.4) { prect(ctx, lx + 1, ly - 2, 1, 1, '#ff9ec4'); prect(ctx, lx, ly - 3, 1, 1, '#fff3b0'); }
    }
  }

  // --- 3. jalan setapak ---
  for (let px = 0; px < cv.width; px += 2) {
    const cyc = pathY(px / TILE, level.h) * TILE;
    const half = 8 + vnoise(px / 70, 2.2, 5) * 5;
    for (let dy = -half; dy <= half; dy += 2) {
      const d = Math.abs(dy) / half;
      const tx = Math.floor(px / TILE), ty = Math.floor((cyc + dy) / TILE);
      if (solid(tx, ty)) continue;
      if (d > 0.72 && hash(px, Math.round(dy), S) < 0.55) continue;   // tepi menyatu ke rumput
      ctx.fillStyle = d < 0.4 ? '#8d7048' : d < 0.72 ? '#7c613c' : '#6b5433';
      ctx.fillRect(px, cyc + dy, 2, 2);
    }
    // dua bekas roda + kerikil
    if (hash(px, 91, S) < 0.5) { ctx.fillStyle = '#7a5f39'; ctx.fillRect(px, cyc - 3, 2, 1); ctx.fillRect(px, cyc + 3, 2, 1); }
    if (hash(px, 92, S) < 0.1) { ctx.fillStyle = '#a08a63'; ctx.fillRect(px, cyc + (hash(px, 93, S) - 0.5) * half, 1, 1); }
  }

  // --- 4. helai rumput, semak, bunga ---
  for (let ty = 0; ty < level.h; ty++) {
    for (let tx = 0; tx < level.w; tx++) {
      if (solid(tx, ty)) continue;
      const X = tx * TILE, Y = ty * TILE;
      if (onPath(X + 8, Y + 8, level.h)) continue;
      // air harus tetap bersih: tidak ada rumput, semak, atau bunga tumbuh di dalam kolam
      if (pondDepth(level, X + 8, Y + 8) > 0.02) continue;
      for (let k = 0; k < 4; k++) {
        const hx = hash(tx * 7 + k, ty * 13, S), hy = hash(tx * 11, ty * 5 + k, S + 1);
        const bx = X + Math.floor(hx * 15), by = Y + Math.floor(hy * 15);
        const tall = hash(tx + k, ty, S + 2) < 0.18;
        ctx.fillStyle = hy < 0.35 ? '#4f9440' : hy < 0.72 ? '#79c455' : '#9ada6a';
        ctx.fillRect(bx, by - (tall ? 3 : 1), 1, tall ? 4 : 2);
        if (tall) ctx.fillRect(bx + 1, by - 2, 1, 3);   // helai miring tertiup angin
      }
      const bh = hash(tx, ty, S + 30);
      if (bh < 0.028) {
        // semak kecil (dekor, tidak menghalangi)
        const bx = X + 8, by = Y + 10;
        ctx.globalAlpha = 0.22; pellipse(ctx, bx + 2, by + 3, 6, 2.6, '#173a1a'); ctx.globalAlpha = 1;
        pcircle(ctx, bx - 2, by, 3.2, '#25501f'); pcircle(ctx, bx + 2, by - 1, 3.6, '#2d6026');
        pcircle(ctx, bx, by - 2.5, 3, '#3a7730'); pcircle(ctx, bx - 1, by - 3.5, 1.8, '#4d9440');
        if (hash(tx, ty, S + 31) < 0.4) { prect(ctx, bx + 1, by - 2, 1, 1, '#e0574f'); prect(ctx, bx - 2, by, 1, 1, '#e0574f'); }
      } else if (bh < 0.075 || vnoise(tx * 0.19, ty * 0.19, S + 77) > 0.72) {
        // hamparan bunga: noise mengelompokkan bunga jadi rumpun, bukan sebaran merata
        const drift = vnoise(tx * 0.11, ty * 0.11, S + 91);
        const c = FLOWERS[Math.floor(drift * FLOWERS.length) % FLOWERS.length];
        const n = 3 + Math.floor(hash(tx, ty, S + 11) * 4);
        for (let k = 0; k < n; k++) {
          const bx = X + 2 + Math.floor(hash(tx + k, ty, S + 12) * 12);
          const by = Y + 2 + Math.floor(hash(tx, ty + k, S + 13) * 12);
          ctx.fillStyle = '#2f6329'; ctx.fillRect(bx, by + 1, 1, 2);
          ctx.fillStyle = c; ctx.fillRect(bx, by, 1, 1);
          if (hash(bx, by, S) < 0.4) ctx.fillRect(bx + 1, by, 1, 1);
        }
      }
    }
  }


  // --- 4b. ARENA DOJO: tanah pasir tersapu, bertepi batu, dengan lentera & tiang bendera ---
  if (level.deco) {
    const D = level.deco;
    const inEll = (x: number, y: number, k: number) => ((x - D.cx) / (D.rx * k)) ** 2 + ((y - D.cy) / (D.ry * k)) ** 2;
    // bayangan jatuh + lingkar rumput tipis di luar tepi
    ctx.globalAlpha = 0.18; pellipse(ctx, D.cx + 2, D.cy + 4, D.rx + 6, D.ry + 5, '#123018'); ctx.globalAlpha = 1;
    // pasir dengan butiran
    for (let y = Math.floor(D.cy - D.ry - 2); y <= D.cy + D.ry + 2; y += 2) {
      for (let x = Math.floor(D.cx - D.rx - 2); x <= D.cx + D.rx + 2; x += 2) {
        const e = inEll(x, y, 1);
        if (e > 1) continue;
        const n = vnoise(x / 6, y / 6, S + 200);
        const sand = ['#d3bd86', '#dbc78f', '#e3d19a', '#ebdba6'];
        ctx.fillStyle = sand[Math.min(3, Math.floor((n * 0.7 + (1 - e) * 0.3) * 4))];
        ctx.fillRect(x, y, 2, 2);
      }
    }
    // pola sapuan melingkar
    for (const k of [0.86, 0.7, 0.54, 0.38, 0.22]) {
      const steps = Math.floor(Math.PI * 2 * D.rx * k * 0.8);
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        ctx.fillStyle = (Math.round(k * 100) % 2) ? 'rgba(150,120,70,0.32)' : 'rgba(255,248,214,0.38)';
        ctx.fillRect(Math.round(D.cx + Math.cos(a) * D.rx * k), Math.round(D.cy + Math.sin(a) * D.ry * k), 1, 1);
      }
    }
    // medali tengah: lingkaran + tanda mata angin
    for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; ctx.fillStyle = 'rgba(122,60,40,0.55)'; ctx.fillRect(Math.round(D.cx + Math.cos(a) * 11), Math.round(D.cy + Math.sin(a) * 7.3), 1, 1); }
    for (const [dx, dy] of [[0, -14], [0, 14], [-20, 0], [20, 0]]) { pcircle(ctx, D.cx + dx * 0.6, D.cy + dy * 0.5, 1.4, '#a8533a'); px(ctx, D.cx + dx * 0.6, D.cy + dy * 0.5, '#e9b73a'); }
    pcircle(ctx, D.cx, D.cy, 2.2, '#a8533a'); pcircle(ctx, D.cx, D.cy, 1.2, '#e9b73a');
    // tepi batu: balok membulat berselang-seling
    const nStone = 54;
    for (let i = 0; i < nStone; i++) {
      const a = (i / nStone) * Math.PI * 2;
      const sx = D.cx + Math.cos(a) * (D.rx + 1.5), sy = D.cy + Math.sin(a) * (D.ry + 1.2);
      const tone = hash(i, 5, S + 210);
      ctx.globalAlpha = 0.28; pellipse(ctx, sx + 1, sy + 2, 3.6, 1.8, '#123018'); ctx.globalAlpha = 1;
      pellipse(ctx, sx, sy, 3.5, 2.5, '#4a4a44');
      pellipse(ctx, sx, sy - 0.3, 3.1, 2.1, tone < 0.5 ? '#8e8c82' : '#a19e92');
      pellipse(ctx, sx - 0.8, sy - 0.9, 1.6, 0.9, '#c4c1b4');
    }
    // rumpun bunga di luar cincin
    for (let i = 0; i < 70; i++) {
      const a = hash(i, 8, S + 220) * Math.PI * 2, rk = 1.1 + hash(i, 9, S + 220) * 0.28;
      const bx = Math.round(D.cx + Math.cos(a) * D.rx * rk), by = Math.round(D.cy + Math.sin(a) * D.ry * rk);
      if (solid(Math.floor(bx / TILE), Math.floor(by / TILE))) continue;
      ctx.fillStyle = '#2f6329'; ctx.fillRect(bx, by + 1, 1, 2);
      ctx.fillStyle = ['#ff8fbb', '#ffffff', '#ffd1e3', '#fff3b0'][Math.floor(hash(i, 10, S + 220) * 4)]; ctx.fillRect(bx, by, 1, 1);
      if (hash(i, 11, S + 220) < 0.5) ctx.fillRect(bx + 1, by, 1, 1);
    }
    // lentera batu (toro)
    for (const L of D.lanterns) {
      const x = Math.round(L.x), y = Math.round(L.y);
      ctx.globalAlpha = 0.3; pellipse(ctx, x + 2, y + 2, 5, 2, '#123018'); ctx.globalAlpha = 1;
      prect(ctx, x - 3, y - 2, 6, 3, '#55534b'); prect(ctx, x - 3, y - 2, 6, 1, '#8b887c');           // alas
      prect(ctx, x - 1, y - 8, 2, 6, '#6e6b61'); prect(ctx, x - 1, y - 8, 1, 6, '#9a978a');           // tiang
      prect(ctx, x - 3, y - 11, 6, 4, '#3d3b35'); prect(ctx, x - 2, y - 10, 4, 2, '#ffd27a');         // kepala + cahaya
      prect(ctx, x - 4, y - 13, 8, 2, '#7a776b'); prect(ctx, x - 3, y - 14, 6, 1, '#a8a597');         // atap
      px(ctx, x, y - 15, '#bdb9aa');
    }
    // tiang bendera
    for (const F of D.flags) {
      const x = Math.round(F.x), y = Math.round(F.y);
      ctx.globalAlpha = 0.28; pellipse(ctx, x + 2, y + 1, 3, 1.4, '#123018'); ctx.globalAlpha = 1;
      prect(ctx, x - 1, y - 22, 2, 23, '#4a2f1c'); prect(ctx, x - 1, y - 22, 1, 23, '#7a5230');
      pcircle(ctx, x, y - 23, 1.6, '#e9b73a');
    }
  }

  // --- 5. bayangan + batang pohon + batu ---
  const treeAt = new Map<string, Tree>();
  for (const t of level.trees ?? []) treeAt.set(`${t.tx},${t.ty}`, t);
  for (let ty = 0; ty < level.h; ty++) {
    for (let tx = 0; tx < level.w; tx++) {
      if (!solid(tx, ty)) continue;
      const X = tx * TILE, Y = ty * TILE;
      const tree = treeAt.get(`${tx},${ty}`);
      if (tree) {
        ctx.globalAlpha = 0.24;
        pellipse(ctx, tree.x + tree.r * 0.55, tree.y + 3, tree.r * 1.1, tree.r * 0.5, '#123018');
        ctx.globalAlpha = 1;
        const tw = tree.kind === 1 ? 4 : 3;
        prect(ctx, tree.x - tw / 2 - 1, tree.y - 11, tw + 2, 13, '#2a1c12');
        prect(ctx, tree.x - tw / 2, tree.y - 11, tw, 13, tree.kind === 3 ? '#5a3a3a' : '#5b3f24');
        prect(ctx, tree.x - tw / 2, tree.y - 11, 1, 13, '#7d5932');
        prect(ctx, tree.x - tw / 2 - 2, tree.y + 1, tw + 4, 2, '#3d2a18');
        // akar kecil
        prect(ctx, tree.x - tw / 2 - 3, tree.y + 1, 2, 1, '#4a3320');
        prect(ctx, tree.x + tw / 2 + 1, tree.y + 1, 2, 1, '#4a3320');
      } else {
        // bongkahan batu berlumut: siluet membulat, bukan balok beton
        const bx = X + 8 + (hash(tx, ty, S + 40) - 0.5) * 2;
        const by = Y + 10;
        const rw = 7 + hash(tx, ty, S + 41) * 1.6;
        const rh = 5.4 + hash(tx, ty, S + 42) * 1.2;
        ctx.globalAlpha = 0.26; pellipse(ctx, bx + 2.5, by + 4, rw * 1.05, rh * 0.5, '#123018'); ctx.globalAlpha = 1;
        pellipse(ctx, bx, by + 1, rw, rh, '#3b3b35');
        pellipse(ctx, bx, by, rw * 0.94, rh * 0.92, '#5a5a51');
        pellipse(ctx, bx - rw * 0.22, by - rh * 0.3, rw * 0.6, rh * 0.52, '#726f64');
        pellipse(ctx, bx - rw * 0.3, by - rh * 0.45, rw * 0.3, rh * 0.26, '#8b887b');
        // retakan
        prect(ctx, bx + 1, by - 1, 3, 1, '#43423c');
        prect(ctx, bx + 3, by, 2, 1, '#43423c');
        // lumut di sisi teduh + rumput di kaki batu
        for (let i = 0; i < 7; i++) {
          const a = hash(i, tx + ty, S + 43) * Math.PI * 2;
          const mx = bx + Math.cos(a) * rw * 0.72, my = by + Math.sin(a) * rh * 0.66;
          if (my < by - rh * 0.2) continue;
          prect(ctx, mx, my, 2, 1, i % 2 ? '#4c7a3a' : '#3d6b31');
        }
        pellipse(ctx, bx - rw * 0.35, by - rh * 0.72, rw * 0.34, rh * 0.2, '#5c8f42');
        for (let i = 0; i < 5; i++) {
          const gx2 = bx - rw + hash(i, ty, S + 44) * rw * 2;
          ctx.fillStyle = i % 2 ? '#3a7231' : '#4d8d3c';
          ctx.fillRect(gx2, by + rh * 0.5, 1, 3);
        }
      }
    }
  }

  // --- 5b. TAMAN: bedeng bunga, batu pijakan, topiari terpangkas, pagar kayu ---
  {
    const D = level.deco;
    const okSpot = (x: number, y: number) =>
      !solid(Math.floor(x / TILE), Math.floor(y / TILE)) &&
      pondDepth(level, x, y) <= 0.02 &&
      !onPath(x, y, level.h);

    // (1) bedeng bunga berbentuk elips mengelilingi arena dojo
    if (D) {
      for (let b = 0; b < 4; b++) {
        const a0 = -0.55 + b * 1.62;
        const bcx = D.cx + Math.cos(a0) * (D.rx + 30 + hash(b, 3, S) * 8);
        const bcy = D.cy + Math.sin(a0) * (D.ry + 23 + hash(b, 4, S) * 6);
        const erx = 14 + hash(b, 5, S) * 9, ery = 7.5 + hash(b, 6, S) * 4;
        if (!okSpot(bcx, bcy)) continue;
        ctx.globalAlpha = 0.2; pellipse(ctx, bcx + 2, bcy + 3, erx + 2, ery + 2, '#123018'); ctx.globalAlpha = 1;
        pellipse(ctx, bcx, bcy, erx, ery, '#6a5233');
        pellipse(ctx, bcx, bcy - 1, erx - 1.6, ery - 1.4, '#7e6440');
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const sx = bcx + Math.cos(a) * (erx + 1.2), sy = bcy + Math.sin(a) * (ery + 0.9);
          if (!okSpot(sx, sy)) continue;
          pellipse(ctx, sx, sy, 2.3, 1.5, i % 2 ? '#9d9a8f' : '#848177');
          px(ctx, sx - 0.6, sy - 0.6, '#b6b3a7');
        }
        for (let i = 0; i < 38; i++) {
          const a = hash(i, b + 20, S) * Math.PI * 2, rr = Math.sqrt(hash(i, b + 21, S));
          const fx = bcx + Math.cos(a) * erx * rr * 0.85, fy = bcy + Math.sin(a) * ery * rr * 0.85;
          if (!okSpot(fx, fy)) continue;
          ctx.fillStyle = '#2f6329'; ctx.fillRect(fx, fy + 1, 1, 2);
          ctx.fillStyle = FLOWERS[(i + b) % FLOWERS.length]; ctx.fillRect(fx, fy, 2, 2);
          ctx.fillStyle = '#fff6c0'; ctx.fillRect(fx, fy, 1, 1);
        }
      }
      // (2) batu pijakan melengkung dari jalan setapak ke gerbang dojo
      for (let i = 0; i < 13; i++) {
        const t = i / 12;
        const sx = D.cx - D.rx - 40 + t * 42, sy = D.cy + Math.sin(t * 2.4) * 9 + 4;
        if (!okSpot(sx, sy)) continue;
        ctx.globalAlpha = 0.2; pellipse(ctx, sx + 1.5, sy + 2.5, 5, 2.6, '#123018'); ctx.globalAlpha = 1;
        pellipse(ctx, sx, sy, 4.6, 2.8, '#6f6d64');
        pellipse(ctx, sx - 0.6, sy - 0.6, 3.9, 2.2, '#918e83');
        px(ctx, sx - 1.6, sy - 1.2, '#a9a69a');
      }
    }

    // (3) topiari: semak bulat terpangkas rapi, berbaris longgar di padang
    for (let i = 0; i < 22; i++) {
      const tx = 6 + Math.floor(hash(i, 300, S) * (level.w - 12));
      const ty = 5 + Math.floor(hash(i, 301, S) * (level.h - 10));
      const x = tx * TILE + 8, y = ty * TILE + 10;
      if (!okSpot(x, y)) continue;
      if (D) { const e = ((x - D.cx) / (D.rx + 16)) ** 2 + ((y - D.cy) / (D.ry + 12)) ** 2; if (e < 1) continue; }
      const r = 3.6 + hash(i, 302, S) * 2.2;
      ctx.globalAlpha = 0.24; pellipse(ctx, x + 1.5, y + 2.5, r * 1.15, r * 0.5, '#123018'); ctx.globalAlpha = 1;
      pcircle(ctx, x, y - r * 0.3, r, '#255a20');
      pcircle(ctx, x - r * 0.25, y - r * 0.6, r * 0.78, '#31702a');
      pcircle(ctx, x - r * 0.4, y - r * 0.85, r * 0.42, '#4a9440');
      prect(ctx, x - 1, y + r * 0.4, 2, 2, '#4a3320');
      if (hash(i, 303, S) < 0.45) { px(ctx, x + r * 0.3, y - r * 0.7, '#ff8fa8'); px(ctx, x - r * 0.5, y - r * 0.2, '#ffe27a'); }
    }

    // (4) pagar kayu rendah mengikuti tepi hutan, dengan celah natural
    for (let i = 0; i < 240; i++) {
      const a = hash(i, 400, S) * Math.PI * 2;
      const rr = 0.86 + hash(i, 401, S) * 0.07;
      const x = level.w * TILE * 0.5 + Math.cos(a) * level.w * TILE * 0.5 * rr;
      const y = level.h * TILE * 0.5 + Math.sin(a) * level.h * TILE * 0.5 * rr;
      if (solid(Math.floor(x / TILE), Math.floor(y / TILE))) continue;
      if (!solid(Math.floor((x + Math.cos(a) * 12) / TILE), Math.floor((y + Math.sin(a) * 12) / TILE))) continue;
      if (hash(i, 402, S) < 0.34) continue;   // celah supaya tidak jadi tembok
      ctx.globalAlpha = 0.22; pellipse(ctx, x + 1, y + 3, 3.4, 1.5, '#123018'); ctx.globalAlpha = 1;
      prect(ctx, x - 1, y - 7, 2, 8, '#5b3f24');
      prect(ctx, x - 1, y - 7, 1, 8, '#7d5932');
      prect(ctx, x - 2, y - 6, 4, 1, '#4a3320');
      if (hash(i, 403, S) < 0.4) { px(ctx, x + 2, y - 4, '#4c7a3a'); px(ctx, x - 2, y - 2, '#3d6b31'); }
    }
  }

  // --- 6. cahaya matahari baked: hangat dari kiri atas, teduh di tepi hutan ---
  const sun = ctx.createLinearGradient(0, 0, cv.width * 0.7, cv.height);
  sun.addColorStop(0, 'rgba(255,246,196,0.26)');
  sun.addColorStop(0.5, 'rgba(255,250,214,0.10)');
  sun.addColorStop(1, 'rgba(150,214,140,0.10)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, cv.width, cv.height);
  for (let ty = 0; ty < level.h; ty++) {
    for (let tx = 0; tx < level.w; tx++) {
      if (solid(tx, ty)) continue;
      const edge = Math.min(tx, ty, level.w - 1 - tx, level.h - 1 - ty);
      if (edge > 7) continue;
      ctx.fillStyle = `rgba(52,110,58,${(1 - edge / 7) * 0.2})`;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  return cv;
}

/** Kanopi: gumpalan daun berlapis, sisi kiri-atas terkena matahari. */
export function buildMeadowCanopy(level: Level): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = level.w * TILE; cv.height = level.h * TILE;
  const ctx = cv.getContext('2d')!;
  const S = level.seed | 0;
  for (const t of level.trees ?? []) {
    const cy = t.y - t.r * 1.05 - 8;
    const r = t.r;
    const dark = t.kind === 1 ? PINE_DARK : t.kind === 2 ? AUTUMN : t.kind === 3 ? CHERRY_DARK : LEAF_DARK;
    const mid = t.kind === 1 ? PINE_MID : t.kind === 2 ? ['#7a7228', '#8b8130', '#9c9038'] : t.kind === 3 ? CHERRY_MID : LEAF_MID;
    const light = t.kind === 1 ? ['#3f7a4a', '#4a8b55', '#579c60'] : t.kind === 2 ? ['#b3a342', '#c4b34c', '#d6c458'] : t.kind === 3 ? CHERRY_LIGHT : LEAF_LIGHT;

    if (t.kind === 1) {
      // cemara: tiga tingkat segitiga
      for (let tier = 0; tier < 3; tier++) {
        const ty2 = cy + tier * r * 0.42 - r * 0.3;
        const rw = r * (0.55 + tier * 0.28);
        for (let yy = 0; yy < r * 0.62; yy += 1) {
          const wdt = rw * (1 - yy / (r * 0.62));
          prect(ctx, t.x - wdt, ty2 + yy, wdt * 2, 1, yy < r * 0.18 ? mid[1] : dark[1]);
        }
        for (let yy = 0; yy < r * 0.5; yy += 1) {
          const wdt = rw * 0.55 * (1 - yy / (r * 0.5));
          prect(ctx, t.x - wdt - rw * 0.18, ty2 + yy, wdt, 1, yy < r * 0.2 ? light[1] : mid[0]);
        }
      }
      continue;
    }
    const lobes = 6 + Math.floor(t.seed * 3);
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2 + t.seed * 6;
      const rr = r * (0.5 + hash(i, t.tx, S) * 0.3);
      pcircle(ctx, t.x + Math.cos(a) * r * 0.54, cy + Math.sin(a) * r * 0.44 + 2, rr, dark[0]);
    }
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2 + t.seed * 6;
      const rr = r * (0.42 + hash(i, t.ty, S) * 0.26);
      pcircle(ctx, t.x + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.4, rr, mid[i % mid.length]);
    }
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2 + t.seed * 6;
      const lx = t.x + Math.cos(a) * r * 0.48 - r * 0.22;
      const ly = cy + Math.sin(a) * r * 0.38 - r * 0.26;
      pcircle(ctx, lx, ly, r * (0.18 + hash(i, t.tx + t.ty, S) * 0.16), light[i % light.length]);
    }
    for (let i = 0; i < 14; i++) {
      const a = hash(i, t.tx, S + 2) * Math.PI * 2, rr = hash(i, t.ty, S + 3) * r * 0.85;
      prect(ctx, t.x + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8, 1, 1, dark[0]);
    }
    // tepi daun catching light
    for (let i = 0; i < 8; i++) {
      const a = -2.5 + hash(i, t.tx, S + 4) * 1.6;
      prect(ctx, t.x + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.78, 1, 1, light[2]);
    }
  }
  return cv;
}

/** Daun & serbuk melayang + berkas cahaya matahari. */
export function drawMeadowAir(ctx: Ctx, camX: number, camY: number, time: number, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Berkas cahaya miring. Gradien dibuat MELINTANG berkas (bukan diagonal terhadap
  // kotak), jadi kedua tepinya benar-benar transparan — tidak ada garis sambungan.
  for (let i = 0; i < 3; i++) {
    const off = ((time * 5 + i * 150) % (w + 300)) - 150;
    const bw = 150;
    ctx.save();
    ctx.translate(camX + off, camY);
    ctx.transform(1, 0, -0.42, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, bw, 0);
    g.addColorStop(0, 'rgba(255,226,150,0)');
    g.addColorStop(0.5, 'rgba(255,244,190,0.10)');
    g.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, bw, h);
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 26; i++) {
    const s1 = hash(i, 101, 3), s2 = hash(i, 102, 3), s3 = hash(i, 103, 3);
    const x = camX + ((s2 * w + time * (7 + s3 * 10) + Math.sin(time * 0.8 + i) * 14) % (w + 40)) - 20;
    const y = camY + ((s3 * h + time * (9 + s1 * 16)) % (h + 40)) - 20;
    if (i % 3 === 0) {
      const sw = Math.sin(time * 4 + i * 1.7);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = i % 2 ? '#a8e070' : '#ffd98a';
      ctx.fillRect(x, y, 2 + (sw > 0 ? 1 : 0), 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
    } else {
      ctx.globalAlpha = 0.3 + 0.35 * Math.sin(time * 3 + i);
      ctx.fillStyle = '#fffbe0';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ============================ LAPISAN HIDUP SIANG HARI ============================

/** Bayangan awan yang hanyut pelan melintasi padang — bikin mataharinya terasa nyata. */
export function drawCloudShadows(ctx: Ctx, camX: number, camY: number, time: number, w: number, h: number) {
  ctx.save();
  for (let i = 0; i < 2; i++) {
    const sp = 7 + i * 2.5;
    const cx = camX - 200 + ((time * sp + i * 430) % (w + 620));
    const cy = camY - 90 + ((i * 197 + time * 2.2) % (h + 260));
    const rx = 96 + i * 26, ry = 40 + i * 9;
    ctx.globalAlpha = 0.055;
    pellipse(ctx, cx, cy, rx, ry, '#2c6b3a');
    pellipse(ctx, cx + rx * 0.42, cy - ry * 0.28, rx * 0.6, ry * 0.66, '#2c6b3a');
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Permukaan air beriak: garis gelombang, kilau matahari, dan buih di tepi. */
export function drawWaterSurface(ctx: Ctx, level: Level, camX: number, camY: number, time: number, w: number, h: number) {
  const ws = level.water;
  if (!ws) return;
  for (const p of ws) {
    if (p.x + p.rx < camX - 20 || p.x - p.rx > camX + w + 20 || p.y + p.ry < camY - 20 || p.y - p.ry > camY + h + 20) continue;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    // gelombang halus bergerak
    ctx.globalAlpha = 0.2;
    for (let i = -Math.ceil(p.ry / 8); i <= Math.ceil(p.ry / 8); i++) {
      const yy = p.y + i * 8 + Math.sin(time * 1.1 + i * 0.7) * 1.1;
      const off = Math.sin(time * 0.8 + i * 0.9) * 6;
      const seg = p.rx * (0.5 + hash(i, 5, 3) * 0.5);
      prect(ctx, p.x - seg + off, yy, seg * 2, 1, i % 2 ? '#bdf0f7' : '#7fd0e2');
    }
    // kilau matahari berkedip
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const a = hash(i, p.x | 0, 7) * Math.PI * 2;
      const rr = Math.sqrt(hash(i, p.y | 0, 9));
      const sx = p.x + Math.cos(a) * p.rx * rr * 0.92;
      const sy = p.y + Math.sin(a) * p.ry * rr * 0.92;
      const tw = Math.sin(time * 2.6 + i * 1.7);
      if (tw < 0.35) continue;
      ctx.globalAlpha = (tw - 0.35) * 0.75;
      prect(ctx, sx + Math.sin(time * 0.9 + i) * 2, sy, 2, 1, '#ffffff');
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    // buih tepi
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const wob = 1 + Math.sin(time * 1.6 + i * 0.8) * 0.012;
      prect(ctx, p.x + Math.cos(a) * p.rx * wob, p.y + Math.sin(a) * p.ry * wob, 1, 1, '#eafcff');
    }
    ctx.globalAlpha = 1;
  }
}

/** garis air di kaki tokoh: bikin lutunya benar-benar terlihat terendam. */
export function drawWaterLine(ctx: Ctx, x: number, y: number, r: number, depth: number, time: number, phase: number) {
  if (depth <= 0.02) return;
  const rr = r * (1.05 + depth * 0.25);
  ctx.globalAlpha = 0.5 + depth * 0.22;
  pellipse(ctx, x, y, rr, rr * 0.46, '#5cbcd2');
  ctx.globalAlpha = 0.55;
  pellipse(ctx, x, y - 0.5, rr * 0.82, rr * 0.34, '#8fdcea');
  // riak mengembang
  ctx.globalAlpha = 0.42;
  for (let i = 0; i < 2; i++) {
    const t = ((time * 1.25 + phase + i * 0.5) % 1);
    const rrr = rr * (0.7 + t * 1.5);
    ctx.globalAlpha = 0.4 * (1 - t);
    ctx.strokeStyle = '#e8fbff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, rrr, rrr * 0.44, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Rumput depan yang bergoyang tertiup angin — lapisan hidup di atas tanah statis. */
export function drawGrassWind(ctx: Ctx, level: Level, camX: number, camY: number, time: number, w: number, h: number) {
  const gust = 0.55 + 0.45 * Math.sin(time * 0.42);
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 60; i++) {
    const bx = camX - 20 + ((hash(i, 3, 11) * (w + 40) + Math.floor(camX / 40) * 0) % (w + 40));
    const by = camY - 20 + hash(i, 7, 13) * (h + 40);
    const gx = Math.floor(bx / 16) * 16 + (hash(i, 17, 19) * 14);
    const gy = Math.floor(by / 16) * 16 + (hash(i, 23, 29) * 14);
    const tx = Math.floor(gx / 16), ty = Math.floor(gy / 16);
    if (tx < 0 || ty < 0 || tx >= level.w || ty >= level.h) continue;
    if (level.tiles[ty * level.w + tx] === 1) continue;
    let wet = false;
    for (const pd of level.water ?? []) {
      const ddx = (gx - pd.x) / pd.rx, ddy = (gy - pd.y) / pd.ry;
      if (ddx * ddx + ddy * ddy < 1.05) { wet = true; break; }
    }
    if (wet) continue;
    const sway = Math.sin(time * 2.1 + gx * 0.07 + gy * 0.05) * (1.4 + gust * 2.2);
    const tall = 3 + hash(i, 31, 37) * 3;
    const col = i % 3 === 0 ? '#c6f08a' : i % 3 === 1 ? '#a2df6c' : '#8ccf5c';
    pline(ctx, gx, gy, gx + sway, gy - tall, col, 1);
    if (i % 7 === 0) px(ctx, gx + sway, gy - tall - 1, '#fff3b0');
  }
  ctx.globalAlpha = 1;
}


/** Dekorasi hidup arena: cahaya lentera, bendera berkibar, kelopak sakura berguguran, dan sapuan warna senja. */
export function drawArenaDeco(ctx: Ctx, level: Level, camX: number, camY: number, time: number, w: number, h: number) {
  const D = level.deco;
  const inView = (x: number, y: number, m = 30) => x > camX - m && x < camX + w + m && y > camY - m && y < camY + h + m;
  ctx.save();
  if (D) {
    // bendera: kain bergelombang per kolom piksel
    for (const F of D.flags) {
      if (!inView(F.x, F.y)) continue;
      const x = Math.round(F.x), y = Math.round(F.y) - 21;
      for (let c = 0; c < 11; c++) {
        const wob = Math.sin(time * 4.2 + c * 0.55 + F.ph) * (0.6 + c * 0.14);
        const cy = Math.round(y + wob);
        const len = 9 - Math.floor(c * 0.25);
        ctx.fillStyle = F.c === '#d8372f' ? (c % 4 === 0 ? '#ff5a4e' : '#d8372f') : (c % 4 === 0 ? '#ffe27a' : '#e9b73a');
        ctx.fillRect(x + 1 + c, cy, 1, len);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 1 + c, cy + len - 1, 1, 1);
      }
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(x + 4, y + 3, 4, 1); ctx.fillRect(x + 5, y + 2, 2, 3);
    }
    // cahaya hangat lentera (berkedip lembut)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < D.lanterns.length; i++) {
      const L = D.lanterns[i];
      if (!inView(L.x, L.y, 60)) continue;
      const fl = 0.8 + 0.2 * Math.sin(time * 5 + i * 2.3) + 0.06 * Math.sin(time * 17 + i);
      const g = ctx.createRadialGradient(L.x, L.y - 9, 0, L.x, L.y - 9, 38);
      g.addColorStop(0, `rgba(255,214,120,${0.30 * fl})`);
      g.addColorStop(0.45, `rgba(255,186,90,${0.10 * fl})`);
      g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g; ctx.fillRect(L.x - 40, L.y - 50, 80, 80);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // kelopak sakura: dekat tiap pohon sakura + yang hanyut di seluruh padang
  const petal = (x: number, y: number, ph: number, big: boolean) => {
    const sw = Math.sin(time * 3 + ph);
    ctx.fillStyle = ph % 2 < 1 ? '#ffc4d8' : '#ffe3ec';
    ctx.fillRect(Math.round(x), Math.round(y), big ? 2 : 1, 1);
    if (sw > 0.3) { ctx.fillStyle = '#f29bbb'; ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); }
  };
  for (const t of level.trees ?? []) {
    if (t.kind !== 3 || !inView(t.x, t.y, 50)) continue;
    for (let i = 0; i < 9; i++) {
      const sp = 10 + hash(i, t.tx, 5) * 9;
      const life = ((time * sp * 0.05 + hash(i, t.ty, 6) * 7) % 1);
      const x = t.x - t.r * 0.9 + hash(i, t.tx + 1, 7) * t.r * 1.8 + Math.sin(time * 1.6 + i * 1.3) * 5 + life * 16;
      const y = t.y - t.r * 2 + life * (t.r * 2 + 12);
      ctx.globalAlpha = Math.min(1, life * 5) * (1 - Math.max(0, life - 0.85) * 6);
      petal(x, y, i + t.tx, i % 3 === 0);
    }
  }
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 14; i++) {
    const s2 = hash(i, 301, 9), s3 = hash(i, 302, 9);
    const x = camX + ((s2 * w + time * (9 + s3 * 7) + Math.sin(time * 0.9 + i) * 12) % (w + 30)) - 15;
    const y = camY + ((s3 * h + time * (11 + s2 * 9)) % (h + 30)) - 15;
    petal(x, y, i * 1.37, i % 4 === 0);
  }
  ctx.globalAlpha = 1;
  // warna senja: hangat di kiri atas, sejuk di kanan bawah
  ctx.globalCompositeOperation = 'soft-light';
  const gr = ctx.createLinearGradient(camX, camY, camX + w, camY + h);
  gr.addColorStop(0, 'rgba(255,205,140,0.30)'); gr.addColorStop(0.55, 'rgba(255,235,200,0.05)'); gr.addColorStop(1, 'rgba(110,150,255,0.20)');
  ctx.fillStyle = gr; ctx.fillRect(camX, camY, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ============================ PENGHUNI TAMAN ============================

const BUTTERFLY = ['#fff6c8', '#ffd447', '#ff9a5c', '#a8d8ff', '#ffc4d8'];

/**
 * Lapisan hidup taman: kupu-kupu berpindah dari bunga ke bunga, capung yang
 * berpatroli di atas kolam, dan ikan koi yang berputar pelan di bawah air.
 * Digambar tiap frame di ruang dunia, hanya untuk objek yang masuk layar.
 */
export function drawMeadowLife(ctx: Ctx, level: Level, camX: number, camY: number, time: number, w: number, h: number, air = true) {
  const inView = (x: number, y: number, m = 40) => x > camX - m && x < camX + w + m && y > camY - m && y < camY + h + m;
  ctx.save();

  // --- koi: digambar di lapisan tanah (air=false) supaya tidak menutupi pemain yang mengarungi kolam
  if (!air) {
    for (const pd of level.water ?? []) {
      if (!inView(pd.x, pd.y, pd.rx + 30)) continue;
      for (let i = 0; i < 4; i++) {
        const s = hash(i, pd.y | 0, 13);
        const t = time * (0.34 + s * 0.22) + i * 1.7;
        const rr = 0.35 + s * 0.45;
        const kx = pd.x + Math.cos(t) * pd.rx * rr;
        const ky = pd.y + Math.sin(t) * pd.ry * rr;
        const surf = Math.max(0, Math.sin(t * 2.1 + i));
        ctx.globalAlpha = 0.28 + surf * 0.4;
        ctx.fillStyle = i % 3 === 0 ? '#ff8a3d' : i % 3 === 1 ? '#fff2e0' : '#ffb03a';
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(t + Math.PI / 2);
        ctx.fillRect(-3, -1, 5, 2);
        ctx.fillRect(2, -1, 2, 2);
        ctx.fillStyle = '#e05a20'; ctx.fillRect(-3, 0, 2, 1);
        ctx.restore();
        if (surf > 0.72) {
          ctx.globalAlpha = (surf - 0.72) * 2.4;
          pring(ctx, kx, ky, 3 + surf * 3, '#dff6ff', 1);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // --- kupu-kupu: melayang berombak, sayap mengepak ---
  for (let i = 0; i < 16; i++) {
    const s1 = hash(i, 501, 7), s2 = hash(i, 502, 7), s3 = hash(i, 503, 7);
    const bx = camX + ((s1 * w + time * (6 + s2 * 8) + Math.sin(time * 0.7 + i * 1.9) * 34) % (w + 60)) - 30;
    const by = camY + ((s2 * h + Math.sin(time * (0.5 + s3 * 0.5) + i) * 26 + Math.cos(time * 0.31 + i * 2.2) * 18) % (h + 40)) - 20;
    const flap = Math.sin(time * (11 + s3 * 7) + i * 2.1);
    const col = BUTTERFLY[i % BUTTERFLY.length];
    const ww = 1 + Math.abs(flap) * 2;
    ctx.globalAlpha = 0.2; px(ctx, bx + 1, by + 3, '#123018');
    ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    ctx.fillRect(bx - ww, by - 1, ww, 2);
    ctx.fillRect(bx + 1, by - 1, ww, 2);
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#ffe9a8';
    ctx.fillRect(bx - ww + 1, by - 1, 1, 1);
    ctx.fillRect(bx + ww - 1, by - 1, 1, 1);
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(bx, by - 1, 1, 3);
  }

  // --- capung: terbang cepat & berhenti mendadak di atas kolam ---
  for (const pd of level.water ?? []) {
    for (let i = 0; i < 3; i++) {
      const s = hash(i, pd.x | 0, 11);
      const t = time * (1.6 + s) + i * 2.4;
      const dart = Math.sin(t * 3.1) * 0.5 + Math.sin(t * 1.3) * 0.5;
      const dx = pd.x + Math.cos(t) * pd.rx * (0.5 + s * 0.5) + dart * 12;
      const dy = pd.y + Math.sin(t * 1.4) * pd.ry * (0.45 + s * 0.5) - 8 + Math.sin(t * 2.2) * 3;
      if (!inView(dx, dy, 20)) continue;
      ctx.globalAlpha = 0.25; pellipse(ctx, dx, pd.y + 2, 3, 1.2, '#1b5f70');
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1f6f8a'; ctx.fillRect(dx - 2, dy, 5, 1);
      ctx.fillStyle = '#63e0ff'; ctx.fillRect(dx + 3, dy, 2, 1);
      const wf = Math.abs(Math.sin(time * 26 + i));
      ctx.globalAlpha = 0.5 + wf * 0.4;
      ctx.fillStyle = '#dff6ff';
      ctx.fillRect(dx - 2, dy - 1 - wf, 4, 1);
      ctx.fillRect(dx - 2, dy + 1 + wf * 0.6, 4, 1);
      ctx.globalAlpha = 1;
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
