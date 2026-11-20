// Seni MENARA KANTOR: gedung pra-render (dinding, jendela berlubang, pelat lantai 3/4), langit kota malam, perabot, pintu & lift.
import { T, STORY, type OfficeMap, type Theme, themeOf, storiesOf } from './map';
import { pfont, type Ctx } from '../../v2/games/maxkungfu/game/pixel';

export function hh(a: number, b: number, s = 0) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const R = (g: Ctx, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
const at = (m: OfficeMap, c: number, r: number) => (r < 0 || r >= m.h || c < 0 || c >= m.w ? '.' : m.rows[r][c]);
const solidCh = (ch: string) => ch === '#';

/** rentang dinding bangunan per lantai (kolom dinding terluar kiri..kanan) */
export function storySpan(m: OfficeMap, s: number): [number, number] {
  let a = -1, b = -1;
  for (let r = s * STORY; r < s * STORY + STORY - 1; r++) for (let c = 0; c < m.w; c++) { const ch = m.rows[r][c]; if (ch === '#' || ch === 'G') { if (a < 0 || c < a) a = c; if (c > b) b = c; } }
  if (a < 0 || b - a < 3) return [0, m.w - 1];
  return [a, b];
}

export interface Lamp { x: number; y: number; floorY: number; story: number; color: string }

export function buildBuilding(m: OfficeMap): { cv: HTMLCanvasElement; lamps: Lamp[]; windows: Win[]; decor: WallDecor[] } {
  const cv = document.createElement('canvas');
  cv.width = m.w * T; cv.height = m.h * T;
  const g = cv.getContext('2d')!;
  const lamps: Lamp[] = [];
  const windows: Win[] = [];
  const liveDecor: WallDecor[] = [];
  const n = storiesOf(m);
  for (let s = 0; s < n; s++) {
    const th = themeOf(m, s);
    const r0 = s * STORY, y0 = r0 * T, yF = (r0 + STORY - 1) * T, H = yF - y0;
    const [ca, cb] = storySpan(m, s);
    const x0 = ca * T, x1 = (cb + 1) * T;
    if (th.outdoor) { drawRoofBack(g, m, s, x0, x1, y0, yF); continue; }
    // dinding belakang bergradasi
    const gr = g.createLinearGradient(0, y0, 0, yF);
    gr.addColorStop(0, shade(th.wall, -0.25)); gr.addColorStop(0.12, th.wall); gr.addColorStop(1, th.wall2);
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, H);
    wallPattern(g, th, x0, x1, y0, yF, s);
    drawCeiling(g, th, x0, x1, y0, s);
    // jendela besar menembus ke langit kota
    if (th.id !== 'server') {
      for (let c = ca + 4; c + 3 < cb - 1; c += 7) {
        let blocked = false;
        for (let k = -1; k <= 3; k++) for (let r = r0; r <= r0 + 3; r++) { const ch = at(m, c + k, r); if ('SEHt'.includes(ch)) blocked = true; }
        if (blocked) continue;
        drawWindowHole(g, th, c * T + 4, y0 + 13, 40, H - 37, hh(c, s, 7));
        windows.push({ x: c * T + 4, y: y0 + 13, w: 40, h: H - 37, story: s });
      }
    }
    // bayangan langit-langit
    const sg = g.createLinearGradient(0, y0, 0, y0 + 8);
    sg.addColorStop(0, 'rgba(0,0,0,0.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.fillRect(x0, y0, x1 - x0, 8);
    // lis bawah (baseboard)
    R(g, x0, yF - 3, x1 - x0, 3, shade(th.trim, -0.45)); R(g, x0, yF - 3, x1 - x0, 1, shade(th.trim, -0.1));
    // lampu langit-langit + kerucut cahaya
    for (let x = x0 + 40; x < x1 - 24; x += 80) {
      const lx = x + (hh(x, s, 3) > 0.5 ? 0 : 0);
      lamps.push({ x: lx, y: y0 + 3, floorY: yF, story: s, color: th.light });
      R(g, lx - 7, y0, 14, 2, '#23252c'); R(g, lx - 6, y0 + 2, 12, 2, th.light); R(g, lx - 6, y0 + 2, 12, 1, '#ffffff');
    }
  }
  // petak struktur
  for (let r = 0; r < m.h; r++) for (let c = 0; c < m.w; c++) {
    const ch = m.rows[r][c];
    const x = c * T, y = r * T, s = Math.floor(r / STORY), th = themeOf(m, s);
    if (ch === '#') drawConcrete(g, m, c, r, th);
    else if (ch === '=') drawPlatform(g, x, y, at(m, c - 1, r) === '=', at(m, c + 1, r) === '=');
    else if (ch === 'H') drawLadder(g, m, c, r);
    else if (ch === 't') drawDeco(g, th, x, y, hh(c, r, 9));
    else if (ch === 'S') drawDoorFrame(g, x, y + T);
    else if (ch === 'E') drawElevatorFrame(g, x, y + T, th);
    else if (ch === 'X') drawVent(g, m, c, r);
  }
  // hiasan dinding otomatis per tema (jam, lukisan, AC, APAR, papan, CCTV, ...)
  for (let s = 0; s < n; s++) {
    const th = themeOf(m, s);
    if (th.outdoor) continue;
    const [ca, cb] = storySpan(m, s);
    decorateStory(g, m, s, th, ca, cb, s * STORY * T, (s * STORY + STORY - 1) * T, windows, liveDecor);
  }
  return { cv, lamps, windows, decor: liveDecor };
}


function wallPattern(g: Ctx, th: Theme, x0: number, x1: number, y0: number, yF: number, s: number) {
  const W = x1 - x0;
  switch (th.id) {
    case 'lobby': {
      for (let x = x0; x < x1; x += 32) { R(g, x, y0, 1, yF - y0, shade(th.wall, -0.3)); for (let i = 0; i < 9; i++) { const vx = x + hh(x, i, s) * 30, vy = y0 + hh(i, x, s) * (yF - y0 - 20); R(g, vx, vy, 3, 1, shade(th.wall, 0.12)); R(g, vx + 2, vy + 1, 2, 1, shade(th.wall, 0.08)); } }
      R(g, x0, yF - 18, W, 15, th.panel); R(g, x0, yF - 18, W, 1, th.trim); R(g, x0, y0 + 6, W, 1, th.trim);
      const cx = Math.round((x0 + x1) / 2);
      R(g, cx - 34, y0 + 14, 68, 13, '#1c1f2c'); R(g, cx - 34, y0 + 14, 68, 1, th.trim); R(g, cx - 34, y0 + 26, 68, 1, th.trim);
      pfont(g, 'NAGA CORP', cx, y0 + 18, th.trim, 1, 'center');
      break;
    }
    case 'cubicle': {
      R(g, x0, y0 + 10, W, 2, shade(th.wall, 0.1));
      R(g, x0, yF - 24, W, 21, th.panel);
      for (let x = x0; x < x1; x += 24) { R(g, x, yF - 24, 1, 21, shade(th.panel, -0.35)); R(g, x + 1, yF - 24, 1, 21, shade(th.panel, 0.15)); }
      for (let x = x0 + 2; x < x1; x += 3) for (let y = yF - 22; y < yF - 4; y += 3) if (hh(x, y, s) > 0.6) R(g, x, y, 1, 1, shade(th.panel, 0.08));
      R(g, x0, yF - 25, W, 1, '#9fb7b0');
      break;
    }
    case 'server': {
      for (let x = x0; x < x1; x += 24) { R(g, x, y0, 1, yF - y0, shade(th.wall, -0.4)); }
      R(g, x0, y0 + 5, W, 4, '#2a3142'); R(g, x0, y0 + 9, W, 1, '#3d465c');
      for (let x = x0; x < x1; x += 7) R(g, x, y0 + 9, 1, 2 + Math.floor(hh(x, 1, s) * 4), ['#c94040', '#3a8bff', '#d6b23a'][Math.floor(hh(x, 2, s) * 3)]);
      R(g, x0, y0 + 20, W, 1, th.trim);
      g.save(); g.globalCompositeOperation = 'lighter'; R(g, x0, y0 + 19, W, 3, 'rgba(47,143,255,0.18)'); g.restore();
      break;
    }
    case 'meeting': {
      for (let x = x0; x < x1; x += 6) { R(g, x, y0, 1, yF - y0, shade(th.wall, -0.25)); if (hh(x, 3, s) > 0.5) R(g, x + 1, y0, 5, yF - y0, shade(th.wall, 0.04)); }
      R(g, x0, yF - 16, W, 2, th.trim); R(g, x0, y0 + 4, W, 2, shade(th.trim, -0.2));
      break;
    }
    case 'exec': {
      for (let x = x0 + 3; x < x1; x += 8) for (let y = y0 + 8; y < yF - 20; y += 8) { const o = ((y / 8) | 0) % 2 ? 4 : 0; R(g, x + o, y, 1, 1, shade(th.wall, 0.16)); R(g, x + o - 1, y + 1, 3, 1, shade(th.wall, 0.08)); R(g, x + o, y + 2, 1, 1, shade(th.wall, 0.16)); }
      R(g, x0, y0 + 3, W, 3, th.trim); R(g, x0, y0 + 6, W, 1, shade(th.trim, -0.5));
      R(g, x0, yF - 19, W, 16, th.panel); R(g, x0, yF - 19, W, 1, th.trim);
      for (let x = x0 + 4; x < x1 - 20; x += 22) { R(g, x, yF - 16, 18, 1, shade(th.panel, 0.2)); R(g, x, yF - 6, 18, 1, shade(th.panel, -0.3)); }
      break;
    }
    case 'pantry': {
      R(g, x0, yF - 26, W, 23, th.panel);
      for (let x = x0; x < x1; x += 6) for (let y = yF - 26; y < yF - 3; y += 6) { R(g, x, y, 6, 1, shade(th.panel, -0.12)); R(g, x, y, 1, 6, shade(th.panel, -0.12)); }
      R(g, x0, yF - 27, W, 1, th.trim); R(g, x0, y0 + 8, W, 2, shade(th.wall, 0.12));
      break;
    }
    case 'gym': {
      for (let x = x0; x < x1; x += 40) { R(g, x, y0 + 20, 24, 3, th.trim); R(g, x + 26, y0 + 20, 8, 3, shade(th.trim, -0.4)); }
      R(g, x0, yF - 14, W, 11, '#1e2128'); R(g, x0, yF - 14, W, 1, '#4a4f5a');
      break;
    }
    case 'archive': {
      for (let x = x0; x < x1; x += 8) R(g, x, y0, 1, yF - y0, shade(th.wall, -0.2));
      R(g, x0, yF - 18, W, 15, th.panel); R(g, x0, yF - 18, W, 1, th.trim); R(g, x0, y0 + 7, W, 1, th.trim);
      break;
    }
    case 'lab': {
      for (let x = x0; x < x1; x += 32) R(g, x, y0, 1, yF - y0, shade(th.wall, -0.12));
      R(g, x0, yF - 22, W, 19, th.panel); R(g, x0, yF - 22, W, 1, th.trim); R(g, x0, yF - 12, W, 1, shade(th.panel, -0.15));
      g.save(); g.globalCompositeOperation = 'lighter'; R(g, x0, yF - 23, W, 2, 'rgba(58,216,168,0.25)'); g.restore();
      break;
    }
    case 'lounge': {
      for (let x = x0; x < x1; x += 28) { R(g, x + 2, y0 + 10, 3, yF - y0 - 13, shade(th.wall, 0.08)); R(g, x + 16, y0 + 10, 3, yF - y0 - 13, shade(th.trim, -0.6)); }
      R(g, x0, yF - 10, W, 7, th.panel); R(g, x0, yF - 10, W, 1, th.trim);
      break;
    }
    case 'security': {
      for (let x = x0; x < x1; x += 20) for (let y = y0 + 8; y < yF - 4; y += 10) R(g, x, y, 19, 9, shade(th.wall, hh(x, y, s) > 0.5 ? 0.04 : -0.04));
      R(g, x0, yF - 6, W, 3, '#d8b020'); for (let x = x0; x < x1; x += 6) R(g, x, yF - 6, 3, 3, '#1a1a1a');
      break;
    }
    default: break;
  }
}

function drawWindowHole(g: Ctx, th: Theme, x: number, y: number, w: number, h: number, seed: number) {
  g.clearRect(x, y, w, h);
  // kaca tipis memantulkan ruangan
  g.fillStyle = 'rgba(140,200,255,0.06)'; g.fillRect(x, y, w, h);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = 'rgba(200,230,255,0.10)';
  g.beginPath(); g.moveTo(x + 6, y + h); g.lineTo(x + 14, y + h); g.lineTo(x + 26, y); g.lineTo(x + 18, y); g.closePath(); g.fill();
  g.restore();
  // tirai venesia sebagian turun
  const blind = seed > 0.45 ? Math.floor(h * (0.2 + seed * 0.45)) : 0;
  for (let yy = y; yy < y + blind; yy += 2) { R(g, x, yy, w, 1, shade(th.wall, 0.35)); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, yy + 1, w, 1); }
  if (blind) R(g, x + w - 4, y, 1, blind + 6, '#d9d9d9');
  const fr = shade(th.trim, -0.35);
  R(g, x - 2, y - 2, w + 4, 2, fr); R(g, x - 2, y + h, w + 4, 3, shade(th.trim, -0.1)); R(g, x - 2, y, 2, h, fr); R(g, x + w, y, 2, h, fr);
  R(g, x + Math.floor(w / 2), y, 1, h, fr); R(g, x, y + Math.floor(h * 0.62), w, 1, fr);
}

function drawRoofBack(g: Ctx, m: OfficeMap, s: number, x0: number, x1: number, y0: number, yF: number) {
  // menara air
  const wx = x0 + Math.floor((x1 - x0) * 0.22);
  R(g, wx, yF - 40, 2, 40, '#2a2d38'); R(g, wx + 20, yF - 40, 2, 40, '#2a2d38');
  for (let k = 0; k < 3; k++) { g.strokeStyle = '#2a2d38'; g.lineWidth = 1; g.beginPath(); g.moveTo(wx + 1, yF - 40 + k * 13); g.lineTo(wx + 21, yF - 27 + k * 13); g.stroke(); }
  R(g, wx - 3, yF - 60, 28, 22, '#3a3240'); R(g, wx - 3, yF - 60, 28, 2, '#5a4d60'); for (let x = wx - 1; x < wx + 24; x += 4) R(g, x, yF - 58, 1, 20, '#2e2834');
  R(g, wx - 5, yF - 64, 32, 4, '#4a3f52');
  // papan neon raksasa
  const cx = Math.round((x0 + x1) / 2) + 40;
  R(g, cx - 1, yF - 22, 2, 22, '#30333d'); R(g, cx - 40, yF - 22, 2, 22, '#30333d'); R(g, cx + 38, yF - 22, 2, 22, '#30333d');
  R(g, cx - 44, yF - 50, 88, 30, 'rgba(20,10,20,0.85)');
  g.save(); g.globalCompositeOperation = 'lighter';
  const ng = g.createRadialGradient(cx, yF - 35, 4, cx, yF - 35, 70); ng.addColorStop(0, 'rgba(255,60,90,0.35)'); ng.addColorStop(1, 'rgba(255,60,90,0)');
  g.fillStyle = ng; g.fillRect(cx - 80, yF - 90, 160, 90); g.restore();
  pfont(g, 'NAGA', cx + 1, yF - 44, '#5a0b1c', 4, 'center');
  pfont(g, 'NAGA', cx, yF - 45, '#ff3b5c', 4, 'center');
  pfont(g, 'NAGA', cx, yF - 45 + 0, 'rgba(255,220,230,0.35)', 4, 'center');
  // antena dengan lampu
  const ax = x1 - 70;
  R(g, ax, yF - 62, 2, 62, '#3a3d48'); for (let k = 0; k < 6; k++) R(g, ax - 3 + (k % 2) * 4, yF - 60 + k * 10, 4, 1, '#3a3d48');
  void m; void s; void y0;
}

function drawConcrete(g: Ctx, m: OfficeMap, c: number, r: number, th: Theme) {
  const x = c * T, y = r * T;
  const up = at(m, c, r - 1), dn = at(m, c, r + 1);
  const base = '#454a58';
  R(g, x, y, T, T, base);
  for (let i = 0; i < 6; i++) { const px = x + Math.floor(hh(c, r, i) * 15), py = y + Math.floor(hh(r, c, i + 9) * 15); R(g, px, py, 1, 1, hh(c, i, r) > 0.5 ? '#50566a' : '#3b3f4c'); }
  if (!solidCh(up)) {
    // permukaan lantai (sedikit perspektif 3/4): sorot tepi, pita lantai, garis sambungan
    const ft = th.floorTop;
    R(g, x, y, T, 5, ft);
    R(g, x, y, T, 1, shade(ft, 0.35));
    R(g, x, y + 4, T, 1, shade(ft, -0.35));
    switch (th.id) {
      case 'lobby': R(g, x + 15, y + 1, 1, 3, shade(ft, -0.18)); if (hh(c, r, 1) > 0.5) R(g, x + 4, y + 2, 5, 1, shade(ft, 0.18)); break;
      case 'server': R(g, x + 7, y + 1, 1, 3, shade(ft, -0.3)); R(g, x + 15, y + 1, 1, 3, shade(ft, -0.3)); if (hh(c, r, 2) > 0.7) R(g, x + 2, y + 2, 2, 1, '#9ad'); break;
      case 'meeting': R(g, x + ((c * 5) % 16), y + 1, 1, 3, shade(ft, -0.3)); R(g, x, y + 2, T, 1, shade(ft, 0.06)); break;
      case 'roof': for (let i = 0; i < 5; i++) R(g, x + Math.floor(hh(c, i, 4) * 15), y + 1 + Math.floor(hh(i, c, 5) * 3), 1, 1, shade(ft, hh(c, i, 6) > 0.5 ? 0.2 : -0.25)); break;
      case 'pantry': for (let k = 0; k < 4; k++) R(g, x + k * 4, y + 1, 4, 3, (c + k) % 2 ? shade(ft, 0.15) : shade(ft, -0.15)); break;
      case 'gym': R(g, x + 8, y + 1, 1, 3, shade(ft, -0.3)); for (let i = 0; i < 3; i++) R(g, x + Math.floor(hh(c, i, 9) * 15), y + 2, 1, 1, shade(ft, 0.18)); break;
      case 'archive': R(g, x + ((c * 7) % 16), y + 1, 1, 3, shade(ft, -0.35)); R(g, x, y + 3, T, 1, shade(ft, -0.12)); break;
      case 'lab': R(g, x + 7, y + 1, 1, 3, shade(ft, -0.2)); R(g, x + 15, y + 1, 1, 3, shade(ft, -0.2)); R(g, x, y + 2, T, 1, shade(ft, 0.12)); break;
      case 'lounge': for (let i = 0; i < 5; i++) R(g, x + Math.floor(hh(c, i, 3) * 15), y + 1 + Math.floor(hh(i, c, 4) * 3), 1, 1, i % 2 ? '#ff8fd0' : shade(ft, 0.2)); break;
      case 'security': R(g, x, y + 2, T, 1, shade(ft, 0.2)); R(g, x + 4, y + 1, 1, 1, '#8a9a94'); R(g, x + 12, y + 1, 1, 1, '#8a9a94'); break;
      default: for (let i = 0; i < 4; i++) R(g, x + Math.floor(hh(c, i, 7) * 15), y + 1 + Math.floor(hh(i, c, 8) * 3), 1, 1, shade(ft, 0.12)); break;
    }
    R(g, x, y + 5, T, 2, '#2c2f39');
    R(g, x, y + 7, T, 1, '#5a6070');
  }
  if (!solidCh(dn) && dn !== 'H') { R(g, x, y + T - 3, T, 3, '#2a2d36'); R(g, x, y + T - 1, T, 1, '#1d1f26'); }
  const lf = at(m, c - 1, r), rt = at(m, c + 1, r);
  if (solidCh(up) || r % STORY !== STORY - 1) {
    // pilar / dinding tepi
    if (!solidCh(lf)) R(g, x, y, 1, T, '#5d6375');
    if (!solidCh(rt)) R(g, x + T - 1, y, 1, T, '#2b2e38');
  }
  if (lf === 'H' && r % STORY === STORY - 1) R(g, x, y + 5, 1, T - 5, '#1a1c22');
  if (rt === 'H' && r % STORY === STORY - 1) R(g, x + T - 1, y + 5, 1, T - 5, '#1a1c22');
}

function drawPlatform(g: Ctx, x: number, y: number, l: boolean, r: boolean) {
  R(g, x, y, T, 4, '#7d8494'); R(g, x, y, T, 1, '#b8c0cf'); R(g, x, y + 3, T, 1, '#3c414e');
  for (let i = 2; i < T; i += 4) R(g, x + i, y + 1, 1, 2, '#5c6272');
  R(g, x, y + 4, T, 2, 'rgba(0,0,0,0.35)');
  // pagar pengaman
  R(g, x, y - 9, T, 1, '#aab3c2');
  if (!l) R(g, x, y - 9, 1, 9, '#aab3c2');
  if (!r) R(g, x + T - 1, y - 9, 1, 9, '#aab3c2');
  R(g, x + 8, y - 9, 1, 9, '#8a93a2'); R(g, x, y - 5, T, 1, 'rgba(170,179,194,0.5)');
}

function drawLadder(g: Ctx, m: OfficeMap, c: number, r: number) {
  const x = c * T, y = r * T;
  const inSlab = r % STORY === STORY - 1;
  if (inSlab) { R(g, x, y, T, T, '#0d0e13'); R(g, x, y, T, 2, '#5a6070'); R(g, x, y + T - 2, T, 2, '#1d1f26'); }
  R(g, x + 3, y, 1, T, '#d7ab52'); R(g, x + 12, y, 1, T, '#d7ab52'); R(g, x + 4, y, 1, T, '#8a6a2c'); R(g, x + 13, y, 1, T, '#8a6a2c');
  for (let k = 2; k < T; k += 4) { R(g, x + 3, y + k, 10, 1, '#e8c070'); R(g, x + 3, y + k + 1, 10, 1, '#6e5424'); }
  if (at(m, c, r - 1) !== 'H') { R(g, x + 2, y - 4, 2, 5, '#d7ab52'); R(g, x + 12, y - 4, 2, 5, '#d7ab52'); }
}

function drawDeco(g: Ctx, th: Theme, x: number, y: number, seed: number) {
  const cx = x + 8, cy = y + 8;
  if (th.id === 'meeting' || (th.id === 'cubicle' && seed > 0.5)) {
    R(g, cx - 14, cy - 7, 28, 15, '#d9dde3'); R(g, cx - 13, cy - 6, 26, 13, '#f7f9fb');
    R(g, cx - 10, cy - 3, 8, 1, '#3a6fd8'); R(g, cx - 10, cy, 12, 1, '#3a6fd8'); R(g, cx - 10, cy + 3, 6, 1, '#d83a3a');
    for (let k = 0; k < 4; k++) R(g, cx + 4 + k * 2, cy + 4 - k * 2 - (k % 2), 2, k * 2 + 2, ['#d83a3a', '#3ad86f', '#3a6fd8', '#d8b03a'][k]);
    R(g, cx - 14, cy + 8, 28, 2, '#9aa0aa');
  } else if (th.id === 'exec' || th.id === 'lobby') {
    R(g, cx - 11, cy - 8, 22, 15, th.trim); R(g, cx - 10, cy - 7, 20, 13, shade(th.trim, -0.4));
    R(g, cx - 9, cy - 6, 18, 6, '#ff9e6b'); R(g, cx - 9, cy - 1, 18, 5, '#5a3a6b');
    g.fillStyle = '#2a1f3a'; g.beginPath(); g.moveTo(cx - 9, cy + 4); g.lineTo(cx - 3, cy - 3); g.lineTo(cx + 2, cy + 1); g.lineTo(cx + 5, cy - 2); g.lineTo(cx + 9, cy + 4); g.closePath(); g.fill();
    R(g, cx + 3, cy - 5, 2, 2, '#fff2b0');
  } else if (th.id === 'server') {
    g.fillStyle = '#ffcc33'; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 8, cy + 6); g.lineTo(cx - 8, cy + 6); g.closePath(); g.fill();
    R(g, cx - 1, cy - 3, 2, 5, '#1a1a1a'); R(g, cx - 1, cy + 3, 2, 1, '#1a1a1a');
  } else {
    R(g, cx - 10, cy - 7, 20, 14, '#8a5a32'); R(g, cx - 9, cy - 6, 18, 12, '#b07a48');
    const cols = ['#ffe066', '#ff8fab', '#8fd3ff', '#a0f0a0'];
    for (let k = 0; k < 5; k++) R(g, cx - 8 + Math.floor(hh(k, x, 1) * 13), cy - 5 + Math.floor(hh(x, k, 2) * 8), 4, 3, cols[k % 4]);
  }
}

function drawDoorFrame(g: Ctx, x: number, yF: number) {
  R(g, x, yF - 24, T, 24, '#20232c'); R(g, x + 1, yF - 23, T - 2, 23, '#0b0c10');
  R(g, x + 3, yF - 31, 10, 5, '#0c3a1e'); R(g, x + 4, yF - 30, 8, 3, '#2bd96b');
  R(g, x + 5, yF - 29, 1, 1, '#eaffef'); R(g, x + 7, yF - 29, 1, 1, '#eaffef'); R(g, x + 9, yF - 29, 1, 1, '#eaffef');
  g.save(); g.globalCompositeOperation = 'lighter';
  const rg = g.createRadialGradient(x + 8, yF - 28, 1, x + 8, yF - 28, 14); rg.addColorStop(0, 'rgba(60,255,130,0.4)'); rg.addColorStop(1, 'rgba(60,255,130,0)');
  g.fillStyle = rg; g.fillRect(x - 8, yF - 44, 32, 30); g.restore();
}

function drawElevatorFrame(g: Ctx, x: number, yF: number, th: Theme) {
  R(g, x - 2, yF - 27, T + 4, 27, '#8d96a6'); R(g, x - 2, yF - 27, T + 4, 1, '#d4dbe6'); R(g, x - 1, yF - 25, T + 2, 25, '#0b0c10');
  R(g, x + 3, yF - 33, 10, 5, '#111'); R(g, x + 5, yF - 32, 1, 3, '#ffb020'); R(g, x + 4, yF - 31, 3, 1, '#ffb020');
  R(g, x + 8, yF - 32, 3, 3, '#7a4a10');
  R(g, x + T + 3, yF - 15, 3, 6, '#5a6272'); R(g, x + T + 4, yF - 14, 1, 1, '#ffd166'); R(g, x + T + 4, yF - 11, 1, 1, '#ffd166');
  void th;
}

function drawVent(g: Ctx, m: OfficeMap, c: number, r: number) {
  let rr = r;
  while (rr > 0 && !solidCh(at(m, c, rr - 1))) rr--;
  const x = c * T, y = rr * T;
  R(g, x + 1, y, 14, 4, '#1a1c22'); for (let k = 2; k < 14; k += 2) R(g, x + k, y + 1, 1, 2, '#5a6070');
  R(g, x + 1, y + 3, 14, 1, '#7a8090');
}

// ================================ PERABOT ================================

export interface PropDraw { broken: boolean; t: number; seed: number; shake: number; nl: boolean; nr: boolean; th: Theme }

export function propHeight(ch: string) {
  switch (ch) { case 'd': return 10; case 'c': return 12; case 'p': return 16; case 'w': return 16; case 'f': return 20; case 'v': return 28; case 'x': return 13; case 'r': return 30; case 'b': return 14; case 'k': return 11; case 'q': return 14; case 'a': return 14; case 'D': return 13; case 'L': return 10; case 'K': return 14; case 'F': return 28; case 'y': return 20; case 'm': return 28; case 'j': return 26; case 'O': return 22; case 'T': return 15; case 'W': return 16; case 'Q': return 11; case 'V': return 28; case 'C': return 8; case 'I': return 14; case 'i': return 21; case 'A': return 21; case 'B': return 34; case 'h': return 26; case 's': return 14; case 'Y': return 26; case 'J': return 31; case 'l': return 25; case 'Z': return 9; case 'R': return 2; default: return 12; }
}

export function drawProp(g: Ctx, ch: string, x0: number, yF: number, o: PropDraw) {
  const x = x0 + (o.shake > 0 ? Math.round(Math.sin(o.t * 90) * 1.5 * Math.min(1, o.shake * 6)) : 0);
  const B = o.broken;
  switch (ch) {
    case 'd': {
      if (B) {
        R(g, x + 1, yF - 3, 14, 2, '#6b4f36'); g.fillStyle = '#8a6a4a'; g.beginPath(); g.moveTo(x, yF - 2); g.lineTo(x + 15, yF - 7); g.lineTo(x + 16, yF - 5); g.lineTo(x + 1, yF); g.closePath(); g.fill();
        R(g, x + 5, yF - 4, 6, 3, '#1a1d24'); R(g, x + 6, yF - 4, 2, 1, '#5ab4ff');
        break;
      }
      R(g, x, yF - 10, T, 2, '#a8865e'); R(g, x, yF - 10, T, 1, '#c9a67a'); R(g, x + (o.nl ? 0 : 1), yF - 8, T - (o.nl ? 0 : 1) - (o.nr ? 0 : 1), 5, '#6b4f36');
      if (!o.nl) R(g, x + 1, yF - 8, 1, 8, '#4a3624');
      if (!o.nr) R(g, x + T - 2, yF - 8, 1, 8, '#4a3624');
      if (o.seed > 0.4) {
        const gl = o.seed > 0.75 ? '#7cff9a' : '#5ab4ff';
        R(g, x + 7, yF - 12, 2, 2, '#2a2d35'); R(g, x + 3, yF - 19, 10, 7, '#2a2d35'); R(g, x + 4, yF - 18, 8, 5, gl);
        R(g, x + 4, yF - 18, 8, 1, '#ffffff'); if (Math.sin(o.t * 3 + o.seed * 20) > 0.3) R(g, x + 5, yF - 16, 4, 1, '#ffffff');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl === '#5ab4ff' ? 'rgba(90,180,255,0.14)' : 'rgba(124,255,154,0.14)'; g.fillRect(x + 1, yF - 22, 14, 13); g.restore();
        R(g, x + 9, yF - 11, 5, 1, '#d8d8d8');
      } else { R(g, x + 3, yF - 12, 6, 2, '#f2f2ee'); R(g, x + 4, yF - 13, 5, 1, '#e0e0da'); R(g, x + 11, yF - 13, 2, 3, '#c94040'); }
      break;
    }
    case 'c': {
      if (B) { R(g, x + 2, yF - 3, 10, 2, '#2f3542'); R(g, x + 11, yF - 6, 2, 5, '#2f3542'); R(g, x + 3, yF - 1, 2, 1, '#111'); break; }
      R(g, x + 3, yF - 13, 2, 8, '#2f3542'); R(g, x + 4, yF - 7, 8, 2, '#3a4152'); R(g, x + 4, yF - 7, 8, 1, '#4f5870');
      R(g, x + 7, yF - 5, 1, 3, '#888'); R(g, x + 4, yF - 2, 8, 1, '#666'); R(g, x + 4, yF - 1, 1, 1, '#111'); R(g, x + 11, yF - 1, 1, 1, '#111');
      break;
    }
    case 'p': {
      if (B) { R(g, x + 3, yF - 3, 10, 3, '#5a3a24'); R(g, x + 4, yF - 2, 3, 2, '#b8613a'); R(g, x + 9, yF - 3, 4, 3, '#b8613a'); R(g, x + 6, yF - 5, 4, 2, '#2f7a3a'); break; }
      R(g, x + 5, yF - 6, 6, 6, '#b8613a'); R(g, x + 4, yF - 7, 8, 2, '#d0754a');
      const sw = Math.sin(o.t * 1.4 + o.seed * 9) * 1;
      const leaf = (dx: number, dy: number, w: number, h: number, c: string) => R(g, x + dx + sw * (1 - dy / -20), yF + dy, w, h, c);
      leaf(4, -12, 3, 5, '#2f8a3f'); leaf(9, -13, 3, 6, '#2f8a3f'); leaf(6, -16, 4, 9, '#3fbf5a'); leaf(2, -10, 3, 3, '#3fbf5a'); leaf(11, -10, 3, 3, '#3fbf5a'); leaf(7, -18, 2, 3, '#6fe08a');
      break;
    }
    case 'w': {
      if (B) { R(g, x + 4, yF - 8, 8, 8, '#d8dde4'); R(g, x + 2, yF - 1, 13, 1, 'rgba(143,216,255,0.8)'); break; }
      R(g, x + 4, yF - 8, 8, 8, '#d8dde4'); R(g, x + 4, yF - 8, 8, 1, '#ffffff'); R(g, x + 6, yF - 6, 1, 1, '#3a6fd8'); R(g, x + 9, yF - 6, 1, 1, '#d83a3a');
      R(g, x + 5, yF - 16, 6, 8, 'rgba(143,216,255,0.75)'); R(g, x + 5, yF - 16, 6, 2, 'rgba(200,240,255,0.9)'); R(g, x + 6, yF - 14, 1, 5, '#ffffff');
      break;
    }
    case 'f': {
      const bc = '#8a909c';
      R(g, x + 2, yF - 20, 12, 20, bc); R(g, x + 2, yF - 20, 12, 1, '#b5bbc6');
      for (let k = 0; k < 3; k++) { R(g, x + 3, yF - 19 + k * 6, 10, 5, '#9aa0ac'); R(g, x + 6, yF - 17 + k * 6, 4, 1, '#3a3d45'); }
      if (B) { R(g, x + 3, yF - 13, 13, 5, '#7a808c'); R(g, x + 4, yF - 15, 9, 2, '#f2f2ee'); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 5, yF - 19, 4, 3); }
      break;
    }
    case 'v': {
      R(g, x + 1, yF - 28, 14, 28, B ? '#7a2424' : '#c42f3a'); R(g, x + 1, yF - 28, 14, 1, '#ff7a7a');
      R(g, x + 3, yF - 25, 8, 17, B ? '#141414' : '#1d2a3a');
      if (!B) {
        const cols = ['#ffd166', '#5ff0ff', '#ff6b6b', '#7cff9a'];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) R(g, x + 4 + c * 2 + (c > 1 ? 1 : 0), yF - 24 + r * 4, 1, 2, cols[(r + c) % 4]);
        g.save(); g.globalCompositeOperation = 'lighter'; { const rg = g.createRadialGradient(x + 8, yF - 16, 2, x + 8, yF - 16, 20); rg.addColorStop(0, 'rgba(255,90,100,0.22)'); rg.addColorStop(1, 'rgba(255,90,100,0)'); g.fillStyle = rg; g.fillRect(x - 12, yF - 36, 40, 40); } g.restore();
      } else { R(g, x + 4, yF - 22, 3, 1, '#8fd8ff'); R(g, x + 7, yF - 17, 2, 1, '#8fd8ff'); }
      R(g, x + 12, yF - 24, 2, 6, '#2a2a2a'); R(g, x + 12, yF - 17, 2, 1, '#ffd166'); R(g, x + 3, yF - 6, 8, 3, '#111');
      break;
    }
    case 'x': {
      R(g, x + 1, yF - 10, 14, 10, B ? '#9aa0aa' : '#d8dce4'); R(g, x + 1, yF - 10, 14, 1, '#ffffff'); R(g, x + 2, yF - 6, 12, 1, '#a0a5ae');
      if (!B) { R(g, x + 2, yF - 13, 12, 3, '#c0c5ce'); R(g, x + 11, yF - 9, 2, 1, Math.sin(o.t * 4) > 0 ? '#3ad86f' : '#1a5a2a'); R(g, x + 14, yF - 8, 2, 2, '#f2f2ee'); }
      else { R(g, x + 3, yF - 12, 6, 2, '#c0c5ce'); }
      break;
    }
    case 'r': {
      R(g, x + 1, yF - 30, 14, 30, '#14161c'); R(g, x + 1, yF - 30, 14, 1, '#3a3f4c'); R(g, x + 1, yF - 30, 1, 30, '#2a2e38');
      for (let k = 0; k < 7; k++) {
        R(g, x + 3, yF - 28 + k * 4, 10, 3, '#1f232c');
        if (!B) {
          const on = Math.sin(o.t * (3 + k) + o.seed * 30 + k) > -0.2;
          R(g, x + 4, yF - 27 + k * 4, 1, 1, on ? '#3aff7a' : '#0f3a1e'); R(g, x + 6, yF - 27 + k * 4, 1, 1, Math.sin(o.t * 7 + k * 2) > 0.5 ? '#3a8bff' : '#10264a');
          if (k % 3 === 0) R(g, x + 9, yF - 27 + k * 4, 3, 1, '#ffb020');
        }
      }
      if (B) { R(g, x + 4, yF - 18, 3, 1, '#ff8a3d'); }
      break;
    }
    case 'b': {
      if (B) { R(g, x + 1, yF - 3, 14, 3, '#a8733c'); R(g, x + 3, yF - 5, 6, 2, '#c08a4a'); break; }
      R(g, x + 1, yF - 8, 14, 8, '#b07a40'); R(g, x + 1, yF - 8, 14, 1, '#d09a5a'); R(g, x + 7, yF - 8, 2, 8, '#d8c08a');
      if (o.seed > 0.4) { R(g, x + 3, yF - 14, 10, 6, '#c08a4a'); R(g, x + 3, yF - 14, 10, 1, '#e0aa6a'); R(g, x + 7, yF - 14, 2, 6, '#d8c08a'); }
      break;
    }
    case 'k': {
      const c1 = '#8a3048', c2 = '#a0435a';
      R(g, x, yF - 5, T, 3, B ? '#5a2030' : c2); R(g, x, yF - 2, T, 2, '#3a1420');
      if (!B) { R(g, x, yF - 11, T, 6, c1); R(g, x, yF - 11, T, 1, '#c0607a'); if (!o.nl) R(g, x, yF - 8, 3, 6, c1); if (!o.nr) R(g, x + T - 3, yF - 8, 3, 6, c1); }
      else R(g, x + 2, yF - 8, 12, 3, c1);
      break;
    }
    case 'q': {
      R(g, x, yF - 14, T, 14, '#2a2633'); R(g, x, yF - 15, T, 2, '#e8dcc0'); R(g, x, yF - 15, T, 1, '#ffffff');
      R(g, x, yF - 9, T, 2, o.th.trim);
      if (!o.nl) R(g, x, yF - 15, 1, 15, '#1a1622');
      if (!o.nr) R(g, x + T - 1, yF - 15, 1, 15, '#1a1622');
      if (o.seed > 0.6 && !B) { R(g, x + 5, yF - 21, 7, 5, '#2a2d35'); R(g, x + 6, yF - 20, 5, 3, '#5ab4ff'); }
      if (B) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + 3, yF - 13, 8, 5); }
      break;
    }
    case 'a': {
      R(g, x + 1, yF - 14, 14, 14, '#9aa3b0'); R(g, x + 1, yF - 14, 14, 1, '#cfd6e0'); R(g, x + 1, yF - 1, 14, 1, '#5a606c');
      g.fillStyle = '#3a3f4a'; g.beginPath(); g.arc(x + 8, yF - 7, 5, 0, Math.PI * 2); g.fill();
      const a = B ? 0.3 : o.t * 14 + o.seed * 10;
      for (let k = 0; k < 3; k++) { const ang = a + k * 2.094; g.fillStyle = '#7a8090'; g.fillRect(Math.round(x + 8 + Math.cos(ang) * 3) - 1, Math.round(yF - 7 + Math.sin(ang) * 3) - 1, 2, 2); }
      break;
    }
    // ======== perabot baru (ruang kantor lengkap) ========
    case 'D': {
      if (B) { rubble(g, x, yF, ['#8a5a32', '#5a3a20', '#2a2d35']); break; }
      R(g, x, yF - 12, T, 3, '#8a5a32'); R(g, x, yF - 12, T, 1, '#b07a48');
      R(g, x, yF - 9, T, 9, '#5a3a20'); R(g, x + 2, yF - 7, 12, 5, '#4a2e18'); R(g, x + 2, yF - 7, 12, 1, '#6a4428');
      if (!o.nl) { R(g, x, yF - 12, 1, 12, '#3a2210'); R(g, x + 3, yF - 20, 1, 8, '#c9a033'); R(g, x + 1, yF - 22, 6, 2, '#2a8a4a'); R(g, x + 1, yF - 22, 6, 1, '#4aba6a'); }
      if (!o.nr) { R(g, x + T - 1, yF - 12, 1, 12, '#3a2210'); R(g, x + 6, yF - 14, 6, 2, '#e0b84a'); R(g, x + 2, yF - 14, 3, 2, '#1a1a1a'); }
      if (o.nl && o.nr) { R(g, x + 3, yF - 13, 10, 1, '#2a2d35'); R(g, x + 4, yF - 20, 8, 7, '#2a2d35'); R(g, x + 5, yF - 19, 6, 5, '#7ab8ff'); R(g, x + 5, yF - 19, 6, 1, '#d8ecff'); }
      break;
    }
    case 'L': {
      if (B) { rubble(g, x, yF, ['#7a5338', '#2a2d35']); break; }
      R(g, x + 3, yF - 16, 4, 7, '#2a2d35'); R(g, x + 10, yF - 16, 4, 7, '#2a2d35'); R(g, x + 3, yF - 16, 4, 1, '#4a4f60'); R(g, x + 10, yF - 16, 4, 1, '#4a4f60');
      R(g, x, yF - 10, T, 2, '#7a5338'); R(g, x, yF - 10, T, 1, '#a87a50'); R(g, x, yF - 8, T, 1, '#3a2418');
      if (!o.nl) R(g, x + 1, yF - 8, 2, 8, '#3a2418');
      if (!o.nr) R(g, x + T - 3, yF - 8, 2, 8, '#3a2418');
      if (o.seed > 0.5) { R(g, x + 5, yF - 12, 2, 2, 'rgba(180,230,255,0.8)'); R(g, x + 9, yF - 11, 4, 1, '#f2f2ee'); }
      break;
    }
    case 'K': {
      if (B) { rubble(g, x, yF, ['#d8d0c0', '#4a4a52', '#9aa3ad']); break; }
      R(g, x, yF - 12, T, 12, '#d8d0c0'); R(g, x + 7, yF - 11, 1, 10, '#a8a090'); R(g, x + 5, yF - 7, 1, 2, '#6a6a6a'); R(g, x + 10, yF - 7, 1, 2, '#6a6a6a');
      R(g, x, yF - 14, T, 2, '#4a4a52'); R(g, x, yF - 14, T, 1, '#7a7a84');
      const v = Math.floor(o.seed * 4);
      if (v === 0) { R(g, x + 4, yF - 15, 8, 1, '#9aa3ad'); R(g, x + 9, yF - 19, 1, 4, '#c0c8d0'); R(g, x + 7, yF - 19, 3, 1, '#c0c8d0'); }
      else if (v === 1) { R(g, x + 3, yF - 21, 10, 7, '#e8e8e8'); R(g, x + 4, yF - 20, 6, 5, '#2a2d35'); R(g, x + 11, yF - 20, 1, 1, '#3ad86f'); R(g, x + 11, yF - 18, 1, 2, '#888'); }
      else if (v === 2) { R(g, x + 4, yF - 19, 5, 5, '#c94040'); R(g, x + 9, yF - 18, 2, 2, '#c94040'); R(g, x + 11, yF - 17, 2, 3, '#f2f2ee'); }
      else { R(g, x + 3, yF - 17, 3, 3, '#f2f2ee'); R(g, x + 7, yF - 18, 3, 4, '#3a6fd8'); R(g, x + 11, yF - 16, 2, 2, '#ffd166'); }
      break;
    }
    case 'F': {
      if (B) { rubble(g, x, yF, ['#e4e8ec', '#ffd166', '#c94040']); break; }
      R(g, x + 2, yF - 28, 12, 28, '#e4e8ec'); R(g, x + 2, yF - 28, 12, 1, '#ffffff'); R(g, x + 13, yF - 28, 1, 28, '#b8bec6');
      R(g, x + 2, yF - 18, 12, 1, '#a8aeb6'); R(g, x + 11, yF - 26, 1, 6, '#8a9098'); R(g, x + 11, yF - 15, 1, 8, '#8a9098');
      R(g, x + 4, yF - 24, 2, 2, '#ff5a5a'); R(g, x + 6, yF - 22, 2, 2, '#5ab4ff'); R(g, x + 4, yF - 13, 3, 2, '#ffd166');
      break;
    }
    case 'y': {
      if (B) { rubble(g, x, yF, ['#2a2a30', '#9aa3ad', '#5a3a2a']); break; }
      R(g, x + 2, yF - 10, 12, 10, '#3a3a42'); R(g, x + 2, yF - 10, 12, 1, '#5a5a64');
      R(g, x + 3, yF - 21, 10, 11, '#2a2a30'); R(g, x + 4, yF - 20, 8, 3, '#9aa3ad'); R(g, x + 5, yF - 16, 6, 1, '#1a1a1a');
      R(g, x + 7, yF - 15, 2, 2, '#5a3a2a'); R(g, x + 6, yF - 12, 4, 2, '#f2f2ee'); R(g, x + 11, yF - 19, 1, 1, Math.sin(o.t * 3) > 0 ? '#ff3b3b' : '#5a1010');
      if (Math.sin(o.t * 1.3 + o.seed * 9) > 0.6) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x + 7, yF - 25 - Math.round((o.t * 6) % 4), 1, 2); }
      break;
    }
    case 'm': {
      if (B) { rubble(g, x, yF, ['#6a4426', '#c94040', '#3a6fd8', '#e8b860']); break; }
      R(g, x, yF - 28, T, 28, '#6a4426'); R(g, x + 1, yF - 27, T - 2, 26, '#3a2414');
      const cols = ['#c94040', '#3a6fd8', '#e8b860', '#3ab86f', '#8a5ad8', '#e8e0d0', '#d86a3a'];
      for (let sh = 0; sh < 4; sh++) {
        const by = yF - 27 + sh * 7;
        R(g, x, by + 6, T, 1, '#8a5a32');
        let bx = x + 1;
        while (bx < x + T - 2) { const bw = 1 + Math.floor(hh(bx, sh, Math.round(o.seed * 99)) * 2), bh = 4 + Math.floor(hh(sh, bx, 3) * 2); if (hh(bx, sh, 7) > 0.12) R(g, bx, by + 6 - bh, bw, bh, cols[Math.floor(hh(bx, sh, 5) * cols.length)]); bx += bw + (hh(bx, sh, 9) > 0.85 ? 1 : 0); }
      }
      if (!o.nl) R(g, x, yF - 28, 1, 28, '#8a5a32');
      if (!o.nr) R(g, x + T - 1, yF - 28, 1, 28, '#4a2e18');
      break;
    }
    case 'j': {
      if (B) { rubble(g, x, yF, ['#5a7a9a', '#3a4a5a']); break; }
      R(g, x + 1, yF - 26, 14, 26, '#5a7a9a'); R(g, x + 1, yF - 26, 14, 1, '#8aaaca'); R(g, x + 8, yF - 26, 1, 26, '#3a4a5a');
      for (let k = 0; k < 3; k++) { R(g, x + 3, yF - 23 + k * 2, 3, 1, '#3a4a5a'); R(g, x + 10, yF - 23 + k * 2, 3, 1, '#3a4a5a'); }
      R(g, x + 6, yF - 14, 1, 3, '#d8dce4'); R(g, x + 10, yF - 14, 1, 3, '#d8dce4');
      break;
    }
    case 'O': {
      if (B) { rubble(g, x, yF, ['#2a3a4a', '#3ad86f', '#111']); break; }
      R(g, x, yF - 10, T, 10, '#2a3a4a'); R(g, x, yF - 10, T, 1, '#4a5a6a');
      for (const mx of [x + 1, x + 9]) {
        R(g, mx, yF - 22, 7, 7, '#111'); R(g, mx + 1, yF - 21, 5, 5, '#1d3a2a');
        const sc = Math.floor(o.t * 2 + mx) % 3;
        R(g, mx + 1, yF - 21 + ((Math.floor(o.t * 8) + mx) % 5), 5, 1, 'rgba(120,255,160,0.5)');
        if (sc === 0) R(g, mx + 2, yF - 19, 2, 3, '#7aff9a'); else if (sc === 1) R(g, mx + 3, yF - 20, 2, 2, '#7aff9a'); else R(g, mx + 1, yF - 18, 4, 1, '#7aff9a');
        R(g, mx + 3, yF - 15, 1, 5, '#3a3f4a');
      }
      R(g, x + 5, yF - 12, 6, 1, '#d8d8d8');
      break;
    }
    case 'T': {
      if (B) { rubble(g, x, yF, ['#2a2d35', '#ff3b5c']); break; }
      R(g, x + 1, yF - 4, 14, 3, '#2a2d35'); R(g, x + 1, yF - 4, 14, 1, '#4a4f5a');
      const off = Math.floor(o.t * 20) % 3;
      for (let k = off; k < 14; k += 3) R(g, x + 1 + k, yF - 3, 1, 1, '#1a1a1e');
      R(g, x + 11, yF - 15, 2, 11, '#3a3f4a'); R(g, x + 7, yF - 15, 7, 1, '#5a5f6a'); R(g, x + 10, yF - 17, 4, 2, '#1a1a1e'); R(g, x + 11, yF - 17, 2, 1, '#ff3b5c');
      break;
    }
    case 'W': {
      if (B) { rubble(g, x, yF, ['#6a6f7a', '#2a2d35']); break; }
      R(g, x + 1, yF - 14, 1, 14, '#6a6f7a'); R(g, x + 14, yF - 14, 1, 14, '#6a6f7a'); R(g, x + 1, yF - 9, 14, 1, '#6a6f7a'); R(g, x + 1, yF - 4, 14, 1, '#6a6f7a');
      for (const [dx, dy] of [[3, -11], [8, -11], [5, -6], [10, -6]]) { R(g, x + dx, yF + dy, 3, 2, '#2a2d35'); R(g, x + dx - 1, yF + dy - 1, 1, 4, '#1a1a1e'); R(g, x + dx + 3, yF + dy - 1, 1, 4, '#1a1a1e'); }
      R(g, x, yF - 16, T, 2, '#3a3f4a'); R(g, x - 1, yF - 17, 2, 4, '#1a1a1e'); R(g, x + T - 1, yF - 17, 2, 4, '#1a1a1e');
      break;
    }
    case 'Q': {
      if (B) { rubble(g, x, yF, ['#2a7a4a', '#ffffff']); break; }
      R(g, x, yF - 10, T, 2, '#2a7a4a'); R(g, x, yF - 10, T, 1, '#ffffff'); R(g, x, yF - 8, T, 1, '#1a4a2a');
      if (!o.nl) R(g, x + 2, yF - 8, 1, 8, '#2a2d35');
      if (!o.nr) R(g, x + T - 3, yF - 8, 1, 8, '#2a2d35');
      if (o.nr) { R(g, x + T - 1, yF - 14, 1, 4, '#d8d8d8'); for (let k = 0; k < 4; k++) R(g, x + T - 1, yF - 14 + k, 1, 1, k % 2 ? '#ffffff' : '#9a9a9a'); }
      if (o.nl && Math.sin(o.t * 4 + o.seed * 7) > 0) { const bx = x + 4 + Math.round(Math.abs(Math.sin(o.t * 3)) * 8); R(g, bx, yF - 13 - Math.round(Math.abs(Math.sin(o.t * 6)) * 4), 1, 1, '#ffffff'); }
      break;
    }
    case 'V': {
      if (B) { rubble(g, x, yF, ['#3a1a6a', '#ff3df2', '#35f0ff']); break; }
      R(g, x + 2, yF - 28, 12, 28, '#3a1a6a'); R(g, x + 2, yF - 28, 12, 4, '#ff3df2'); R(g, x + 3, yF - 27, 10, 2, '#ffb0f8');
      const hue = Math.floor(o.t * 3 + o.seed * 9) % 3;
      R(g, x + 4, yF - 22, 8, 7, '#0a0a1a'); R(g, x + 5, yF - 21, 6, 5, ['#35f0ff', '#ffd166', '#7aff9a'][hue]); R(g, x + 6 + (Math.floor(o.t * 6) % 4), yF - 19, 1, 1, '#ffffff');
      R(g, x + 3, yF - 14, 10, 3, '#2a1050'); R(g, x + 5, yF - 13, 1, 1, '#ff3b3b'); R(g, x + 8, yF - 13, 1, 1, '#ffd166'); R(g, x + 10, yF - 13, 1, 1, '#35f0ff');
      R(g, x + 6, yF - 8, 4, 2, '#1a0a30');
      break;
    }
    case 'C': {
      if (B) { rubble(g, x, yF, ['#8a6a4a', '#f2f2ee']); break; }
      R(g, x + 2, yF - 7, 12, 2, '#8a6a4a'); R(g, x + 2, yF - 7, 12, 1, '#b08a64'); R(g, x + 3, yF - 5, 1, 5, '#5a4030'); R(g, x + 12, yF - 5, 1, 5, '#5a4030');
      R(g, x + 4, yF - 9, 2, 2, '#f2f2ee'); R(g, x + 8, yF - 8, 4, 1, '#c94040');
      break;
    }
    case 'I': {
      if (B) { rubble(g, x, yF, ['#c0c8d4', '#8fd8ff']); break; }
      R(g, x + 2, yF - 14, 3, 14, '#c0c8d4'); R(g, x + 11, yF - 14, 3, 14, '#c0c8d4'); R(g, x + 2, yF - 14, 3, 1, '#ffffff'); R(g, x + 11, yF - 14, 3, 1, '#ffffff');
      g.fillStyle = 'rgba(160,220,255,0.45)'; g.fillRect(x + 5, yF - 11, 6, 6);
      R(g, x + 3, yF - 12, 1, 1, Math.sin(o.t * 2 + o.seed * 5) > -0.6 ? '#3ad86f' : '#ff3b3b');
      break;
    }
    case 'i': {
      if (B) { rubble(g, x, yF, ['#111', '#3a2a20', '#8fd8ff']); break; }
      R(g, x, yF - 6, T, 6, '#3a2a20'); R(g, x, yF - 6, T, 1, '#5a4030');
      R(g, x + 7, yF - 8, 2, 2, '#1a1a1a'); R(g, x + 1, yF - 21, 14, 13, '#0e0e12');
      const ph = Math.floor(o.t * 0.7 + o.seed * 9) % 3;
      R(g, x + 2, yF - 20, 12, 11, ['#2a4a8a', '#8a2a3a', '#2a6a4a'][ph]);
      R(g, x + 3, yF - 13, 10, 2, '#f2f2ee'); R(g, x + 3, yF - 18, 4, 3, '#ffd166'); R(g, x + 2 + (Math.floor(o.t * 10) % 12), yF - 11, 1, 1, '#ffffff');
      break;
    }
    case 'A': {
      if (B) { rubble(g, x, yF, ['#3a2a20', '#8fd8ff', '#ff8a3d']); break; }
      const lab = o.th.id === 'lab';
      R(g, x + 1, yF - 8, 14, 8, '#3a2a20'); R(g, x + 1, yF - 8, 14, 1, '#5a4030');
      R(g, x + 1, yF - 21, 14, 13, '#1a1e24');
      g.fillStyle = lab ? 'rgba(90,255,160,0.55)' : 'rgba(60,170,230,0.6)'; g.fillRect(x + 2, yF - 19, 12, 10);
      R(g, x + 2, yF - 19, 12, 1, lab ? '#c8ffe0' : '#c8ecff'); R(g, x + 2, yF - 10, 12, 1, '#c9a063');
      if (lab) { R(g, x + 6, yF - 17, 4, 6, 'rgba(20,60,40,0.8)'); R(g, x + 7, yF - 18, 2, 1, 'rgba(20,60,40,0.8)'); }
      else {
        R(g, x + 3, yF - 13, 1, 3, '#2f8a3f'); R(g, x + 12, yF - 14, 1, 4, '#3fbf5a');
        for (let k = 0; k < 3; k++) { const fx = x + 3 + ((Math.floor(o.t * (6 + k * 3) + k * 5 + o.seed * 20)) % 9), fy = yF - 17 + k * 2; R(g, fx, fy, 2, 1, ['#ff8a3d', '#ffd166', '#ff5a8a'][k]); }
      }
      const bub = (o.t * 9 + o.seed * 10) % 10; R(g, x + 11, yF - 11 - Math.floor(bub), 1, 1, 'rgba(255,255,255,0.7)');
      break;
    }
    case 'B': {
      if (B) { rubble(g, x, yF, ['#6a4a3a', '#2f8a3f', '#3fbf5a']); break; }
      R(g, x + 4, yF - 7, 8, 7, '#6a4a3a'); R(g, x + 3, yF - 8, 10, 2, '#8a6a52');
      R(g, x + 7, yF - 22, 2, 15, '#5a3a24');
      const sw = Math.sin(o.t * 1.1 + o.seed * 7) * 1.2;
      const blob = (cx: number, cy: number, r: number, c: string) => { g.fillStyle = c; g.beginPath(); g.arc(x + cx + sw * (1 - cy / 34), yF - cy, r, 0, Math.PI * 2); g.fill(); };
      blob(8, 24, 6, '#2a6a34'); blob(4, 27, 5, '#2f8a3f'); blob(12, 27, 5, '#2f8a3f'); blob(8, 31, 5, '#3fbf5a'); blob(6, 21, 4, '#2f8a3f'); blob(11, 21, 4, '#3fbf5a'); blob(9, 33, 3, '#6fe08a');
      break;
    }
    case 'h': {
      if (B) { rubble(g, x, yF, ['#5a3a20', '#e0b84a', '#8fd8ff']); break; }
      R(g, x + 1, yF - 26, 14, 26, '#5a3a20'); g.fillStyle = 'rgba(160,220,255,0.18)'; g.fillRect(x + 2, yF - 25, 12, 20);
      for (let sh = 0; sh < 3; sh++) {
        const by = yF - 25 + sh * 7; R(g, x + 2, by + 6, 12, 1, '#8a5a32');
        R(g, x + 4, by + 2, 3, 2, '#e0b84a'); R(g, x + 5, by + 4, 1, 2, '#c9a033'); R(g, x + 4, by + 5, 3, 1, '#c9a033');
        if (sh !== 1) { R(g, x + 9, by + 1, 3, 3, '#d8dce4'); R(g, x + 10, by + 4, 1, 2, '#9aa3ad'); }
      }
      R(g, x + 2, yF - 25, 1, 20, 'rgba(255,255,255,0.3)');
      break;
    }
    case 's': {
      if (B) { rubble(g, x, yF, ['#4a4f5a', '#3ab86f']); break; }
      R(g, x + 2, yF - 14, 12, 14, '#4a4f5a'); R(g, x + 2, yF - 14, 12, 1, '#7a808c'); R(g, x + 3, yF - 13, 10, 12, '#3a3f4a');
      g.fillStyle = '#9aa3ad'; g.beginPath(); g.arc(x + 7, yF - 8, 2.5, 0, Math.PI * 2); g.fill(); R(g, x + 7, yF - 9, 1, 1, '#1a1a1e'); R(g, x + 11, yF - 10, 1, 5, '#c0c8d0');
      break;
    }
    case 'Y': {
      if (B) { rubble(g, x, yF, ['#d8d4c8', '#bdb8aa']); break; }
      R(g, x + 3, yF - 8, 10, 8, '#bdb8aa'); R(g, x + 3, yF - 8, 10, 1, '#e8e4d8'); R(g, x + 2, yF - 2, 12, 2, '#9a968a');
      g.fillStyle = '#d8d4c8'; g.beginPath(); g.moveTo(x + 4, yF - 8); g.quadraticCurveTo(x + 2, yF - 16, x + 7, yF - 18); g.quadraticCurveTo(x + 13, yF - 20, x + 11, yF - 26); g.lineTo(x + 13, yF - 24); g.quadraticCurveTo(x + 15, yF - 17, x + 9, yF - 15); g.quadraticCurveTo(x + 6, yF - 13, x + 9, yF - 8); g.closePath(); g.fill();
      R(g, x + 11, yF - 26, 2, 1, '#ff3b3b');
      break;
    }
    case 'J': {
      if (B) { rubble(g, x, yF, ['#6a3a1a', '#e0b84a']); break; }
      R(g, x + 4, yF - 30, 8, 30, '#6a3a1a'); R(g, x + 3, yF - 31, 10, 2, '#8a5a32'); R(g, x + 3, yF - 2, 10, 2, '#4a2a10');
      g.fillStyle = '#f2ead8'; g.beginPath(); g.arc(x + 8, yF - 25, 3, 0, Math.PI * 2); g.fill();
      R(g, x + 8, yF - 27, 1, 2, '#1a1a1a'); R(g, x + 8, yF - 25, 2, 1, '#1a1a1a');
      R(g, x + 5, yF - 20, 6, 14, '#2a1a0a');
      const pa = Math.sin(o.t * 3.2) * 0.35, pxx = x + 8 + Math.sin(pa) * 8, pyy = yF - 19 + Math.cos(pa) * 8;
      g.strokeStyle = '#c9a033'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 8, yF - 19); g.lineTo(pxx, pyy); g.stroke(); R(g, pxx - 1, pyy - 1, 3, 3, '#e0b84a');
      break;
    }
    case 'l': {
      if (B) { rubble(g, x, yF, ['#2a2d35', '#f0d8a0']); break; }
      R(g, x + 5, yF - 2, 6, 2, '#2a2d35'); R(g, x + 7, yF - 21, 2, 19, '#3a3f4a');
      g.fillStyle = '#f0d8a0'; g.beginPath(); g.moveTo(x + 4, yF - 20); g.lineTo(x + 12, yF - 20); g.lineTo(x + 10, yF - 25); g.lineTo(x + 6, yF - 25); g.closePath(); g.fill();
      R(g, x + 4, yF - 20, 8, 1, '#fff2c8');
      break;
    }
    case 'Z': {
      if (B) { rubble(g, x, yF, ['#5a6a5a', '#f2f2ee']); break; }
      R(g, x + 5, yF - 8, 6, 8, '#5a6a5a'); R(g, x + 4, yF - 9, 8, 1, '#7a8a7a'); R(g, x + 6, yF - 10, 2, 1, '#f2f2ee'); R(g, x + 8, yF - 11, 2, 2, '#e8e0d0');
      break;
    }
    case 'R': {
      R(g, x, yF - 1, T, 1, '#8a2433'); R(g, x, yF, T, 1, '#5a1420');
      for (let k = 2; k < T; k += 4) R(g, x + k, yF - 1, 1, 1, '#e0b84a');
      if (!o.nl) R(g, x, yF - 1, 2, 2, '#e0b84a');
      if (!o.nr) R(g, x + T - 2, yF - 1, 2, 2, '#e0b84a');
      break;
    }
    default: break;
  }
}

/** panel pintu darurat & lift. open 0..1 */
export function drawConnector(g: Ctx, ch: string, x: number, yF: number, open: number, t: number) {
  if (ch === 'S') {
    if (open > 0.02) {
      for (let k = 0; k < 5; k++) R(g, x + 2 + k * 2, yF - 4 - k * 4, 4, 1, '#1d2a22');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(60,255,130,${0.12 * open})`; g.fillRect(x + 1, yF - 23, 14, 23); g.restore();
    }
    const w = Math.max(2, Math.round(13 * (1 - open * 0.82)));
    R(g, x + 2, yF - 22, w, 22, '#5d6677'); R(g, x + 2, yF - 22, w, 1, '#8a94a6');
    if (w > 6) { R(g, x + 4, yF - 19, 3, 5, '#a8d8ff'); R(g, x + 3, yF - 11, w - 2, 1, '#c9ced8'); }
  } else {
    const gap = Math.round(open * 7);
    if (gap > 0) {
      R(g, x, yF - 24, T, 24, '#d9c48f'); R(g, x, yF - 24, T, 2, '#fff2c8');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,220,150,${0.25 * open})`; g.fillRect(x - 6, yF - 26, 28, 26); g.restore();
    }
    R(g, x, yF - 24, 8 - gap, 24, '#b9c2cf'); R(g, x + 8 + gap, yF - 24, 8 - gap, 24, '#aab3c0');
    if (gap < 7) { R(g, x + 7 - gap, yF - 24, 1, 24, '#6b7280'); R(g, x + 8 + gap, yF - 24, 1, 24, '#e4e9f0'); }
    if (open > 0 && open < 1 && Math.sin(t * 20) > 0) R(g, x + 5, yF - 32, 1, 3, '#fff');
  }
}

/** kaca dinding luar. utuh = true */
export function drawGlassTile(g: Ctx, x: number, y: number, intact: boolean, topEdge: boolean, botEdge: boolean, t: number) {
  if (intact) {
    g.fillStyle = 'rgba(150,215,255,0.16)'; g.fillRect(x, y, T, T);
    g.fillStyle = 'rgba(220,245,255,0.28)';
    const o = ((y / T) * 5) % 16;
    g.beginPath(); g.moveTo(x + o, y + T); g.lineTo(x + o + 3, y + T); g.lineTo(x + Math.min(T, o + 9), y); g.lineTo(x + Math.min(T, o + 6), y); g.closePath(); g.fill();
    R(g, x + 7, y, 2, T, 'rgba(60,70,90,0.85)');
    if (topEdge) R(g, x, y, T, 2, '#6b7386');
    if (botEdge) R(g, x, y + T - 2, T, 2, '#6b7386');
    if (Math.sin(t * 0.7 + y) > 0.97) R(g, x + 3, y + 4, 1, 1, '#ffffff');
  } else {
    R(g, x + 7, y, 2, T, 'rgba(60,70,90,0.85)');
    g.fillStyle = 'rgba(170,225,255,0.55)';
    if (topEdge) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + T, y); g.lineTo(x + 11, y + 5); g.lineTo(x + 6, y + 2); g.lineTo(x + 2, y + 6); g.closePath(); g.fill(); R(g, x, y, T, 2, '#6b7386'); }
    if (botEdge) { g.beginPath(); g.moveTo(x, y + T); g.lineTo(x + T, y + T); g.lineTo(x + 12, y + T - 4); g.lineTo(x + 5, y + T - 6); g.closePath(); g.fill(); R(g, x, y + T - 2, T, 2, '#6b7386'); }
  }
}

// ================================ PLAFON & HIASAN DINDING OTOMATIS ================================
function drawCeiling(g: Ctx, th: Theme, x0: number, x1: number, y0: number, s: number) {
  const W = x1 - x0;
  switch (th.id) {
    case 'server': case 'security':
      R(g, x0, y0, W, 3, '#1a1e26'); R(g, x0, y0 + 3, W, 1, '#3a4252');
      for (let x = x0; x < x1; x += 5) { const c = ['#c94040', '#3a8bff', '#d6b23a', '#3ad86f'][Math.floor(hh(x, s, 21) * 4)]; R(g, x, y0 + 4, 4, 1, c); }
      break;
    case 'archive': case 'meeting':
      for (let x = x0 + 6; x < x1; x += 48) { R(g, x, y0, 10, 5, '#3a2414'); R(g, x, y0 + 4, 10, 1, '#5a3a24'); }
      break;
    case 'gym':
      R(g, x0, y0 + 1, W, 4, '#8a929e'); R(g, x0, y0 + 1, W, 1, '#c0c8d4'); for (let x = x0; x < x1; x += 20) R(g, x, y0 + 1, 1, 4, '#5a626e');
      break;
    case 'lounge':
      for (let x = x0 + 2; x < x1; x += 6) { const sag = Math.sin(((x - x0) / 48) * Math.PI) * 3; const c = ['#ff8fd0', '#ffd166', '#35f0ff', '#7cff9a'][Math.floor((x / 6) % 4)]; R(g, x, y0 + 5 + Math.abs(sag), 1, 1, '#2a2030'); R(g, x, y0 + 6 + Math.abs(sag), 1, 1, c); }
      break;
    case 'lab':
      R(g, x0, y0, W, 5, '#dfe8ec'); for (let x = x0; x < x1; x += 16) R(g, x, y0, 1, 5, '#b8c4ca'); R(g, x0, y0 + 5, W, 1, '#9aa8ae');
      break;
    case 'lobby':
      R(g, x0, y0 + 5, W, 1, shade(th.trim, -0.2));
      break;
    default:
      R(g, x0, y0, W, 5, shade(th.wall, 0.18)); for (let x = x0; x < x1; x += 16) R(g, x, y0, 1, 5, shade(th.wall, -0.1)); R(g, x0, y0 + 5, W, 1, shade(th.wall, -0.25));
      for (let x = x0 + 24; x < x1; x += 64) { R(g, x, y0 + 1, 6, 3, '#4a505c'); for (let k = 0; k < 3; k++) R(g, x + 1, y0 + 1 + k, 4, 1, '#2a2e36'); }
      for (let x = x0 + 8; x < x1; x += 32) R(g, x, y0 + 5, 1, 1, '#c94040');
  }
}

type DecorFn = (g: Ctx, th: Theme, x: number, y0: number, yF: number, sd: number, t?: number) => void;
const DECOR: Record<string, DecorFn> = {
  clock: (g, _th, x, y0) => { const cx = x + 8, cy = y0 + 17; g.fillStyle = '#1a1a1e'; g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(cx, cy, 4, 0, Math.PI * 2); g.fill(); R(g, cx, cy - 3, 1, 3, '#1a1a1e'); R(g, cx, cy, 2, 1, '#c94040'); },
  frame: (g, th, x, y0, _yF, sd) => { R(g, x + 1, y0 + 12, 14, 11, th.trim); R(g, x + 2, y0 + 13, 12, 9, shade(th.trim, -0.45)); const sky = sd > 0.5 ? '#7ab8e8' : '#ff9e6b'; R(g, x + 3, y0 + 14, 10, 4, sky); R(g, x + 3, y0 + 18, 10, 3, sd > 0.5 ? '#3a8a4a' : '#5a3a6b'); R(g, x + 9, y0 + 15, 2, 2, '#fff2b0'); },
  poster: (g, _th, x, y0, _yF, sd) => { const c = ['#ff5a5a', '#3a8bff', '#ffd166', '#3ad86f'][Math.floor(sd * 4)]; R(g, x + 4, y0 + 11, 9, 13, '#f2efe6'); R(g, x + 5, y0 + 12, 7, 6, c); R(g, x + 5, y0 + 19, 7, 1, '#3a3a3a'); R(g, x + 5, y0 + 21, 5, 1, '#8a8a8a'); },
  apar: (g, _th, x, _y0, yF) => { R(g, x + 6, yF - 26, 5, 3, '#c94040'); R(g, x + 6, yF - 19, 4, 10, '#d43a3a'); R(g, x + 6, yF - 19, 1, 10, '#ff7a7a'); R(g, x + 7, yF - 21, 2, 2, '#1a1a1a'); R(g, x + 9, yF - 20, 2, 1, '#1a1a1a'); },
  ac: (g, _th, x, y0) => { R(g, x - 3, y0 + 7, 22, 7, '#e8ecf0'); R(g, x - 3, y0 + 7, 22, 1, '#ffffff'); R(g, x - 2, y0 + 12, 20, 1, '#9aa3ad'); R(g, x + 14, y0 + 9, 2, 1, '#3ad86f'); },
  shelf: (g, th, x, y0, _yF, sd) => { R(g, x - 1, y0 + 24, 18, 2, shade(th.trim, -0.3)); R(g, x + 1, y0 + 18, 2, 6, '#c94040'); R(g, x + 3, y0 + 19, 2, 5, '#3a6fd8'); R(g, x + 5, y0 + 17, 1, 7, '#e8b860'); if (sd > 0.4) { R(g, x + 10, y0 + 20, 4, 4, '#b8613a'); R(g, x + 10, y0 + 16, 4, 4, '#3fbf5a'); } },
  tv: (g, _th, x, y0, _yF, sd, t = 0) => { R(g, x - 3, y0 + 11, 22, 14, '#0e0e12'); R(g, x - 2, y0 + 12, 20, 12, sd > 0.5 ? '#1d3a6a' : '#3a1d4a'); R(g, x, y0 + 14, 9, 2, '#f2f2ee'); R(g, x, y0 + 18, 14, 1, '#7ab8ff'); R(g, x + (Math.floor(t * 8) % 16) - 1, y0 + 21, 3, 1, '#ffd166'); },
  board: (g, _th, x, y0) => { R(g, x - 2, y0 + 12, 20, 13, '#a8743c'); R(g, x - 1, y0 + 13, 18, 11, '#c89a5a'); R(g, x, y0 + 14, 4, 4, '#ffe066'); R(g, x + 6, y0 + 15, 4, 4, '#8fd3ff'); R(g, x + 11, y0 + 14, 4, 3, '#ff8fab'); R(g, x + 2, y0 + 19, 5, 4, '#ffffff'); R(g, x + 9, y0 + 19, 5, 4, '#a0f0a0'); },
  logo: (g, th, x, y0) => { g.fillStyle = th.trim; g.beginPath(); g.arc(x + 8, y0 + 18, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = shade(th.trim, -0.5); g.beginPath(); g.arc(x + 8, y0 + 18, 5, 0, Math.PI * 2); g.fill(); R(g, x + 5, y0 + 16, 6, 1, th.trim); R(g, x + 7, y0 + 14, 2, 8, th.trim); R(g, x + 5, y0 + 20, 6, 1, th.trim); },
  cctv: (g, _th, x, y0, _yF, _sd, t = 0) => { R(g, x + 5, y0 + 6, 1, 4, '#3a3f4a'); R(g, x + 3, y0 + 9, 8, 4, '#d8dce4'); R(g, x + 3, y0 + 12, 3, 2, '#2a2d35'); R(g, x + 10, y0 + 10, 1, 1, Math.sin(t * 4) > 0 ? '#ff3b3b' : '#5a1010'); },
  mirror: (g, _th, x, y0, yF) => { R(g, x - 1, y0 + 9, 18, yF - y0 - 13, '#9aa8b8'); R(g, x, y0 + 10, 16, yF - y0 - 15, '#c8d8e8'); g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(x + 2, yF - 6); g.lineTo(x + 5, yF - 6); g.lineTo(x + 12, y0 + 10); g.lineTo(x + 9, y0 + 10); g.closePath(); g.fill(); },
  chart: (g, th, x, y0) => { R(g, x - 1, y0 + 11, 18, 13, '#f4f8fa'); for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) R(g, x + j * 3, y0 + 13 + i * 3, 2, 2, [th.trim, '#ff8a3d', '#8a5ad8', '#3a8bff'][(i + j) % 4]); },
  menu: (g, _th, x, y0) => { R(g, x - 2, y0 + 11, 20, 14, '#5a3a24'); R(g, x - 1, y0 + 12, 18, 12, '#1e2a24'); R(g, x + 1, y0 + 14, 8, 1, '#f2f2ee'); R(g, x + 1, y0 + 17, 12, 1, '#c8c8c0'); R(g, x + 1, y0 + 20, 10, 1, '#c8c8c0'); R(g, x + 12, y0 + 14, 3, 1, '#ffd166'); },
  vent: (g, _th, x, y0) => { R(g, x + 3, y0 + 9, 10, 6, '#5a606c'); for (let k = 0; k < 3; k++) R(g, x + 4, y0 + 10 + k * 2, 8, 1, '#2a2e36'); },
  plug: (g, _th, x, _y0, yF) => { R(g, x + 6, yF - 8, 4, 4, '#e8e8e0'); R(g, x + 7, yF - 7, 1, 1, '#3a3a3a'); R(g, x + 8, yF - 7, 1, 1, '#3a3a3a'); R(g, x + 12, yF - 24, 3, 5, '#e8e8e0'); R(g, x + 13, yF - 23, 1, 2, '#8a8a8a'); },
  banner: (g, th, x, y0) => { R(g, x - 4, y0 + 10, 24, 6, th.accent); R(g, x - 4, y0 + 16, 24, 1, shade(th.accent, -0.5)); R(g, x - 2, y0 + 12, 2, 2, '#ffffff'); R(g, x + 2, y0 + 12, 12, 2, 'rgba(255,255,255,0.75)'); },
};
const DECOR_BY: Record<string, string[]> = {
  lobby: ['logo', 'frame', 'clock', 'cctv', 'apar', 'plug', 'banner'],
  cubicle: ['clock', 'board', 'poster', 'apar', 'ac', 'plug', 'shelf', 'banner'],
  server: ['vent', 'cctv', 'apar', 'plug', 'vent'],
  meeting: ['tv', 'frame', 'clock', 'ac', 'plug', 'board'],
  exec: ['frame', 'logo', 'shelf', 'clock', 'frame', 'ac'],
  pantry: ['menu', 'clock', 'shelf', 'poster', 'apar', 'plug'],
  gym: ['mirror', 'poster', 'clock', 'tv', 'apar', 'banner'],
  archive: ['shelf', 'clock', 'frame', 'apar', 'plug'],
  lab: ['chart', 'clock', 'vent', 'apar', 'tv', 'plug'],
  lounge: ['tv', 'poster', 'frame', 'shelf', 'banner'],
  security: ['tv', 'cctv', 'board', 'apar', 'clock'],
};
export interface Win { x: number; y: number; w: number; h: number; story: number }
export interface WallDecor { kind: string; x: number; y0: number; yF: number; story: number; th: Theme; sd: number }

function decorateStory(g: Ctx, m: OfficeMap, s: number, th: Theme, ca: number, cb: number, y0: number, yF: number, wins: Win[], live: WallDecor[]) {
  const list = DECOR_BY[th.id];
  if (!list) return;
  const r0 = s * STORY;
  const blocked = (c: number) => {
    for (let dc = -1; dc <= 1; dc++) for (let r = r0; r < r0 + 4; r++) { const ch = at(m, c + dc, r); if ('SEHtX='.includes(ch) && ch !== '.') return true; }
    const px0 = c * T - 5, px1 = c * T + 21;
    return wins.some((w) => w.story === s && px1 > w.x - 2 && px0 < w.x + w.w + 2);
  };
  let c = ca + 3;
  while (c < cb - 2) {
    const v = hh(c, s, 41);
    if (v < 0.42 && !blocked(c)) {
      const kind = list[Math.floor(hh(s, c, 43) * list.length)], sd = hh(c, s, 47);
      if (kind === 'tv' || kind === 'cctv') live.push({ kind, x: c * T, y0, yF, story: s, th, sd });
      else DECOR[kind](g, th, c * T, y0, yF, sd);
      c += 3 + Math.floor(hh(c, s, 45) * 3);
    } else c++;
  }
}
/** hiasan dinding beranimasi (TV, CCTV) digambar tiap frame */
export function drawWallDecor(g: Ctx, d: WallDecor, t: number) { DECOR[d.kind](g, d.th, d.x, d.y0, d.yF, d.sd, t); }
function rubble(g: Ctx, x: number, yF: number, cols: string[]) {
  R(g, x + 1, yF - 3, 14, 3, shade(cols[0], -0.3)); R(g, x + 3, yF - 5, 5, 3, cols[0]); R(g, x + 9, yF - 4, 4, 2, cols[1 % cols.length]);
  if (cols[2]) R(g, x + 6, yF - 6, 2, 2, cols[2]); R(g, x, yF - 1, 16, 1, 'rgba(0,0,0,0.35)');
}
