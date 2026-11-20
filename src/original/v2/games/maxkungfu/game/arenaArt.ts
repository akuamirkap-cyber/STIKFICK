import { TILE } from './constants';
import { tileAt, type Level } from './level';
import { pellipse, pline, prect, pring, px, type Ctx } from './pixel';
import { hash2, mulberry32 } from './rng';
import type { Palette } from './constants';

/**
 * PERIAS ARENA
 * ============
 * Lantai game dulu datar: ubin kotak-kotak + dinding bata. Modul ini menambah
 * dua lapisan supaya tempat bertarung terasa hidup:
 *
 *  1. `beautifyArena()`  — digambar SEKALI ke kanvas level (panggung cahaya,
 *     emblem dojo, retakan, noda oli, garis bahaya, debu, vignette).
 *  2. `drawArenaAmbience()` — digambar tiap frame (debu melayang, sorot lampu
 *     yang bergoyang, kelip neon di dinding, kabut tipis di tepi layar).
 */

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
};

/** Titik lantai bebas (bukan dinding) di sekitar (x,y) dalam satuan tile. */
function isFloor(level: Level, tx: number, ty: number) {
  return tx >= 0 && ty >= 0 && tx < level.w && ty < level.h && tileAt(level, tx, ty) === 0;
}

function floorSpot(level: Level, rand: () => number, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const tx = 2 + Math.floor(rand() * (level.w - 4));
    const ty = 2 + Math.floor(rand() * (level.h - 4));
    if (isFloor(level, tx, ty)) return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  }
  return null;
}

// ------------------------------------------------------------------ PANGGUNG STATIS
export function beautifyArena(ctx: Ctx, level: Level, pal: Palette) {
  const W = level.w * TILE, H = level.h * TILE;
  const rand = mulberry32(level.seed * 7919 + 13);
  ctx.save();

  // --- 1. kolam cahaya besar: memberi kedalaman & arah pada lantai
  ctx.globalCompositeOperation = 'lighter';
  const pools = 7;
  for (let i = 0; i < pools; i++) {
    const spot = floorSpot(level, rand);
    if (!spot) continue;
    const r = TILE * (5 + rand() * 8);
    const warm = rand() < 0.55;
    const col = warm ? pal.accent2 : pal.accent;
    const g = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, r);
    g.addColorStop(0, rgba(col, 0.16 + rand() * 0.08));
    g.addColorStop(0.45, rgba(col, 0.06));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, r, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // --- 2. emblem dojo raksasa di tengah arena (cincin + jari-jari + glyph)
  {
    let cx = Math.floor(level.w / 2), cy = Math.floor(level.h / 2);
    for (let i = 0; i < 90 && !isFloor(level, cx, cy); i++) {
      cx = Math.max(2, Math.min(level.w - 3, cx + Math.round(rand() * 2 - 1)));
      cy = Math.max(2, Math.min(level.h - 3, cy + Math.round(rand() * 2 - 1)));
    }
    const mx = cx * TILE + TILE / 2, my = cy * TILE + TILE / 2;
    const R = Math.min(W, H) * 0.3;
    ctx.globalAlpha = 0.5;
    pring(ctx, mx, my, R, rgba(pal.accent, 0.22), 2);
    pring(ctx, mx, my, R * 0.94, rgba(pal.accent2, 0.14), 1);
    pring(ctx, mx, my, R * 0.42, rgba(pal.accent, 0.16), 2);
    pring(ctx, mx, my, R * 0.16, rgba('#ffffff', 0.12), 1);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r0 = R * 0.46, r1 = R * 0.9;
      pline(ctx, mx + Math.cos(a) * r0, my + Math.sin(a) * r0 * 0.68,
        mx + Math.cos(a) * r1, my + Math.sin(a) * r1 * 0.68, rgba(pal.accent2, i % 4 === 0 ? 0.2 : 0.09), 1);
    }
    // glyph tengah: blok-blok tebal seperti karakter kuas
    ctx.globalAlpha = 0.55;
    const s = TILE * 0.9;
    prect(ctx, mx - s * 1.4, my - s * 1.6, s * 2.8, s * 0.5, rgba(pal.accent, 0.2));
    prect(ctx, mx - s * 0.35, my - s * 1.6, s * 0.7, s * 3.2, rgba(pal.accent, 0.18));
    prect(ctx, mx - s * 1.6, my + s * 0.5, s * 3.2, s * 0.45, rgba(pal.accent2, 0.16));
    prect(ctx, mx - s * 1.2, my + s * 1.4, s * 2.4, s * 0.4, rgba(pal.accent, 0.14));
    ctx.globalAlpha = 1;
  }

  // --- 3. retakan lantai (random walk) + pecahan ubin
  ctx.globalAlpha = 1;
  const cracks = 26;
  for (let c = 0; c < cracks; c++) {
    const spot = floorSpot(level, rand, 12);
    if (!spot) continue;
    let x = spot.x, y = spot.y;
    let a = rand() * Math.PI * 2;
    const steps = 10 + Math.floor(rand() * 26);
    for (let i = 0; i < steps; i++) {
      const nx = x + Math.cos(a) * (2 + rand() * 4);
      const ny = y + Math.sin(a) * (2 + rand() * 4);
      if (!isFloor(level, Math.floor(nx / TILE), Math.floor(ny / TILE))) break;
      pline(ctx, x, y, nx, ny, rgba('#000000', 0.3 + rand() * 0.16), 1);
      if (rand() < 0.22) pline(ctx, nx, ny, nx + Math.cos(a + 1.2) * 5, ny + Math.sin(a + 1.2) * 5, rgba('#000000', 0.2), 1);
      if (rand() < 0.3) px(ctx, nx + 1, ny - 1, rgba('#ffffff', 0.05));
      x = nx; y = ny;
      a += (rand() - 0.5) * 1.1;
    }
  }

  // --- 4. noda oli / kotoran besar yang mengilap tipis
  for (let i = 0; i < 14; i++) {
    const spot = floorSpot(level, rand, 10);
    if (!spot) continue;
    const rx = TILE * (1 + rand() * 2.6), ry = rx * (0.45 + rand() * 0.35);
    pellipse(ctx, spot.x, spot.y, rx, ry, rgba('#000000', 0.2));
    if (rand() < 0.4) pellipse(ctx, spot.x - rx * 0.25, spot.y - ry * 0.3, rx * 0.4, ry * 0.32, rgba(pal.accent2, 0.05));
  }

  // --- 5. garis bahaya (chevron) menempel di dinding yang menghadap lantai
  for (let ty = 1; ty < level.h - 1; ty++) {
    for (let tx = 1; tx < level.w - 1; tx++) {
      if (!isFloor(level, tx, ty)) continue;
      const wallAbove = !isFloor(level, tx, ty - 1);
      const wallLeft = !isFloor(level, tx - 1, ty);
      const wallRight = !isFloor(level, tx + 1, ty);
      const X = tx * TILE, Y = ty * TILE;
      if (wallAbove && hash2(tx, ty, level.seed) % 3 === 0) {
        // pendar cahaya dari dinding + strip cat pudar
        const g = ctx.createLinearGradient(0, Y, 0, Y + TILE * 1.6);
        g.addColorStop(0, rgba(pal.accent, 0.18));
        g.addColorStop(1, rgba(pal.accent, 0));
        ctx.fillStyle = g;
        ctx.fillRect(X, Y, TILE, TILE * 1.6);
        if (hash2(tx, ty, level.seed + 5) % 4 === 0) {
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = k % 2 ? rgba('#000000', 0.22) : rgba(pal.accent2, 0.2);
            ctx.fillRect(X + k * 4, Y + 2, 4, 2);
          }
        }
      }
      if ((wallLeft || wallRight) && hash2(tx, ty + 91, level.seed) % 7 === 0) {
        ctx.fillStyle = rgba(pal.accent2, 0.12);
        ctx.fillRect(wallLeft ? X : X + TILE - 2, Y + 3, 2, TILE - 6);
      }
    }
  }

  // --- 6. taburan debu & kerikil halus
  for (let i = 0; i < W * H * 0.0016; i++) {
    const x = Math.floor(rand() * W), y = Math.floor(rand() * H);
    if (!isFloor(level, Math.floor(x / TILE), Math.floor(y / TILE))) continue;
    const v = rand();
    px(ctx, x, y, v < 0.62 ? rgba('#000000', 0.22) : v < 0.9 ? rgba('#ffffff', 0.05) : rgba(pal.accent2, 0.09));
  }

  // --- 7. vignette lantai: sudut arena lebih gelap, mata terkunci ke tengah
  {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.24, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.62, 'rgba(0,0,0,0.1)');
    vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

// ------------------------------------------------------------------ SUASANA BERGERAK
interface Mote { x: number; y: number; z: number; r: number; sp: number; ph: number; c: number }

/** Debu melayang: dibuat sekali, lalu di-wrap di sekitar kamera. */
let motes: Mote[] = [];
let moteSeed = -1;
function ensureMotes(seed: number) {
  if (motes.length && moteSeed === seed) return;
  moteSeed = seed;
  const rand = mulberry32(seed * 31 + 7);
  motes = [];
  for (let i = 0; i < 120; i++) {
    motes.push({
      x: rand() * 1600 - 800, y: rand() * 1000 - 500, z: 0.35 + rand() * 0.9,
      r: rand() < 0.75 ? 1 : 2, sp: 5 + rand() * 22, ph: rand() * Math.PI * 2, c: Math.floor(rand() * 3),
    });
  }
}

/**
 * Suasana berjalan: sorot lampu bergoyang, debu melayang, kelip neon dinding,
 * dan kabut tipis di dasar layar. Semua digambar di ruang dunia.
 */
export function drawArenaAmbience(
  ctx: Ctx, level: Level, pal: Palette,
  camX: number, camY: number, time: number, vw: number, vh: number,
) {
  ensureMotes(level.seed);
  const x0 = camX - vw / 2 - 12, x1 = camX + vw / 2 + 12;
  const y0 = camY - vh / 2 - 12, y1 = camY + vh / 2 + 12;
  ctx.save();

  // --- sorot lampu: tiga piringan cahaya yang bernafas pelan
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const ph = time * (0.24 + i * 0.07) + i * 2.1;
    const bx = camX + Math.cos(ph) * vw * 0.26 + Math.sin(ph * 0.6 + i) * 14;
    const by = camY + Math.sin(ph * 0.8) * vh * 0.18;
    const r = Math.min(vw, vh) * (0.42 + Math.sin(time * 0.9 + i) * 0.03);
    const col = i === 1 ? pal.accent2 : pal.accent;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, rgba(col, 0.055 + Math.sin(time * 1.6 + i * 1.7) * 0.014));
    g.addColorStop(0.5, rgba(col, 0.02));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(bx, by, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- tiang cahaya diagonal dari atas (seperti lampu sorot gudang)
  const beams = 4;
  for (let i = 0; i < beams; i++) {
    const t = time * 0.11 + i * 0.7;
    const bx = camX + ((Math.sin(t) + Math.sin(t * 0.37 + i)) * 0.5) * vw * 0.62;
    const lean = Math.sin(time * 0.3 + i * 1.3) * 16;
    const wTop = 7 + i * 3, wBot = 26 + i * 9;
    const yTop = camY - vh * 0.62, yBot = camY + vh * 0.42;
    const a = 0.05 + Math.sin(time * 1.1 + i * 2) * 0.014;
    const g = ctx.createLinearGradient(bx, yTop, bx, yBot);
    g.addColorStop(0, rgba(i % 2 ? pal.accent2 : '#ffffff', a * 1.5));
    g.addColorStop(0.65, rgba(i % 2 ? pal.accent2 : '#ffffff', a * 0.5));
    g.addColorStop(1, rgba(i % 2 ? pal.accent2 : '#ffffff', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx - wTop + lean, yTop);
    ctx.lineTo(bx + wTop + lean, yTop);
    ctx.lineTo(bx + wBot, yBot);
    ctx.lineTo(bx - wBot, yBot);
    ctx.closePath();
    ctx.fill();
  }

  // --- kelip neon di dinding sekitar pemain
  const stx = Math.floor(camX / TILE), sty = Math.floor(camY / TILE);
  const span = Math.ceil(vw / TILE / 2) + 2, spanY = Math.ceil(vh / TILE / 2) + 2;
  for (let ty = sty - spanY; ty <= sty + spanY; ty++) {
    for (let tx = stx - span; tx <= stx + span; tx++) {
      if (isFloor(level, tx, ty)) continue;
      if (!isFloor(level, tx, ty + 1)) continue;
      const h = hash2(tx, ty, level.seed);
      if (h % 23 !== 0) continue;
      const X = tx * TILE + TILE / 2, Y = (ty + 1) * TILE;
      if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
      const flick = 0.35 + 0.65 * Math.abs(Math.sin(time * (1.6 + (h % 5) * 0.4) + h));
      const col = h % 2 ? pal.accent : pal.accent2;
      ctx.globalAlpha = 0.5 * flick;
      px(ctx, X - 2, Y + 1, col); px(ctx, X + 2, Y + 1, col);
      prect(ctx, X - 1, Y + 1, 2, 1, '#ffffff');
      const g = ctx.createRadialGradient(X, Y + 1, 0, X, Y + 1, 13);
      g.addColorStop(0, rgba(col, 0.3 * flick));
      g.addColorStop(1, rgba(col, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(X, Y + 1, 13, 0, Math.PI * 2); ctx.fill();
    }
  }

  // --- debu melayang: tiap partikel punya kedalaman (z) yang mengubah laju & ukuran
  const mSpanX = Math.max(1, x1 - x0), mSpanY = Math.max(1, y1 - y0);
  for (const m of motes) {
    const drift = time * m.sp * m.z;
    const rx = m.x + Math.sin(drift * 0.06 + m.ph) * 11 + drift * 0.35;
    const ry = m.y + Math.cos(drift * 0.05 + m.ph) * 7 - drift * 0.22;
    const wx = x0 + ((rx % mSpanX) + mSpanX) % mSpanX;
    const wy = y0 + ((ry % mSpanY) + mSpanY) % mSpanY;
    const tw = 0.28 + 0.72 * Math.abs(Math.sin(drift * 0.22 + m.ph));
    ctx.globalAlpha = (0.16 + 0.2 * m.z) * tw;
    px(ctx, wx, wy, m.c === 0 ? '#ffffff' : m.c === 1 ? pal.accent2 : pal.accent);
    if (m.r === 2) { ctx.globalAlpha = 0.1 * tw; px(ctx, wx + 1, wy, '#ffffff'); }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // --- kabut tipis di dasar layar
  const fg = ctx.createLinearGradient(0, camY + vh * 0.18, 0, camY + vh * 0.56);
  fg.addColorStop(0, rgba(pal.accent, 0));
  fg.addColorStop(1, rgba('#000000', 0.2));
  ctx.fillStyle = fg;
  ctx.fillRect(camX - vw / 2, camY + vh * 0.18, vw, vh * 0.38);

  ctx.restore();
}
