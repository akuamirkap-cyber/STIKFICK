// TAMPILAN KANTOR V1 UNTUK GAME V2 (numpang).
// Peta kantor V2 (OT_* tiles) dikonversi ke peta V1, lalu digambar dengan seni Menara Kantor V1:
// tema ruangan, jendela, lampu, hiasan dinding, perabot, langit kota, 6 suasana, hujan deras & kilat.
// Juga: efek hit V1 (kilatan kecil di depan, semburan darah & gelombang kejut di belakang tubuh).
import { T, STORY, THEMES, type OfficeMap, type ThemeId, themeOf } from './map';
import { buildBuilding, drawProp, drawConnector, drawGlassTile, drawWallDecor, propHeight, storySpan, hh, type Lamp, type Win, type WallDecor } from './art';
import { ATMOS, ATMO_LIST, mixAtmo, buildSky2, drawSky2, css, Weather, type AtmoDef, type AtmoId, type Sky2 } from './atmo';
import { FX } from './fx';
import { pline } from '../../v2/games/maxkungfu/game/pixel';
import { rnd } from '../../v2/games/maxkungfu/game/rng';
import type { SfxLike as Sfx } from './atmo';

/** kluster perabot per tema (dibaca kiri ke kanan, '.' = celah) dengan bobot */
const SETS: Record<ThemeId, [string, number][]> = {
  lobby: [['kk', 3], ['B', 3], ['p', 2], ['I.I', 2], ['Y', 2], ['v', 1], ['w', 1], ['C', 1], ['Z', 1], ['l', 1], ['RRR', 1]],
  cubicle: [['cdd', 4], ['ddc', 4], ['cddc', 3], ['p', 2], ['x', 1], ['w', 1], ['ff', 2], ['b', 1], ['Z', 1], ['dd', 2]],
  meeting: [['cLLLLc', 4], ['cLLLc', 3], ['i', 2], ['p', 2], ['f', 1], ['y', 1], ['B', 1], ['Z', 1]],
  pantry: [['KKKK', 4], ['KKK', 2], ['F', 2], ['v', 2], ['y', 2], ['cCc', 3], ['w', 1], ['Z', 1], ['p', 1]],
  server: [['rrr', 4], ['rr', 3], ['rrrr', 2], ['b', 1], ['bb', 1], ['O', 1], ['Z', 1]],
  exec: [['DDD', 3], ['mmm', 3], ['kkk', 2], ['A', 2], ['h', 2], ['s', 1], ['B', 2], ['J', 1], ['Y', 1], ['l', 2], ['RRRR', 2]],
  gym: [['TT', 3], ['TTT', 2], ['W', 2], ['WW', 2], ['jjj', 2], ['w', 1], ['p', 1], ['Z', 1]],
  archive: [['mmmm', 4], ['mmm', 3], ['ff', 2], ['bb', 2], ['l', 1], ['C', 1], ['J', 1]],
  lab: [['ddO', 3], ['A', 3], ['AA', 2], ['xr', 2], ['F', 1], ['O', 1], ['w', 1], ['Z', 1]],
  lounge: [['kkk', 3], ['QQ', 2], ['V', 2], ['VV', 1], ['i', 2], ['C', 2], ['B', 2], ['l', 2], ['RRR', 2], ['p', 1]],
  security: [['OO', 3], ['OOO', 2], ['jjj', 2], ['s', 1], ['c', 1], ['w', 1], ['Z', 1]],
  roof: [['aa', 3], ['a', 2], ['b', 2], ['bb', 1], ['p', 2], ['B', 2], ['C', 1]],
};

const OT_WALL = 1, OT_FLOOR = 2, OT_STAIRS = 3, OT_GLASS = 4, OT_ELEV = 5;
type RGB = [number, number, number];
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const R = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

/** level V2 yang dibutuhkan (subset Level) */
export interface V2Level { w: number; h: number; officeTiles?: Uint8Array; officeMap?: { theme?: string; props?: { tx: number; ty: number; kind: string }[]; leftGates?: { tx: number; ty: number }[]; rightGates?: { tx: number; ty: number }[] } }
interface View { ix: number; iy: number; bw: number; bh: number }

const FLAVOR: Record<string, ThemeId[]> = {
  cyber_night: ['cubicle', 'server', 'lounge', 'meeting', 'security', 'lab'],
  sunset_corp: ['meeting', 'pantry', 'exec', 'cubicle', 'archive', 'lounge'],
  midnight_rain: ['security', 'archive', 'server', 'cubicle', 'meeting', 'lab'],
  dojo_tower: ['gym', 'archive', 'exec', 'pantry', 'meeting', 'lounge'],
};

export const ATMO_KEY_V2 = 'v2_office_atmo';
export const HITFX_KEY_V2 = 'v2_office_hitfx';
export function loadV2Atmo(): 'auto' | AtmoId { try { const m = localStorage.getItem(ATMO_KEY_V2); return m === 'auto' || ATMO_LIST.some((a) => a.id === m) ? (m as 'auto' | AtmoId) : 'auto'; } catch { return 'auto'; } }
export function loadV2HitFx(): 'v1' | 'v2' { try { return localStorage.getItem(HITFX_KEY_V2) === 'v2' ? 'v2' : 'v1'; } catch { return 'v1'; } }

export class V1OfficeLook {
  on = true;
  m1: OfficeMap | null = null;
  lamps: Lamp[] = []; windows: Win[] = []; decor: WallDecor[] = []; glows: { x: number; yF: number; h: number; ch: string; story: number }[] = [];
  spans: [number, number][] = []; outdoorStory: boolean[] = []; stories = 0; mapW = 0; mapH = 0;
  gates: { x: number; yF: number; ch: 'S' | 'E' }[] = [];
  sky: Sky2 = buildSky2(); weather = new Weather(); fx = new FX();
  mode: 'auto' | AtmoId = loadV2Atmo(); target: AtmoId = 'malam'; from: AtmoDef = ATMOS.malam; to: AtmoDef = ATMOS.malam; k = 1; A: AtmoDef = ATMOS.malam;
  lightning = 0; lightningT = 5; thunderT = 0; time = 0;
  private sprites = new Map<string, HTMLCanvasElement>();

  setMode(m: 'auto' | AtmoId) { this.mode = m; try { localStorage.setItem(ATMO_KEY_V2, m); } catch { /* */ } this.apply(0, true); }

  /** bangun kanvas gedung bergaya V1 dari level kantor V2 */
  build(l: V2Level): HTMLCanvasElement {
    const w = l.w, h = l.h, H1 = Math.ceil(h / STORY) * STORY;
    const ot = l.officeTiles ?? new Uint8Array(w * h);
    const at = (c: number, r: number) => (r < 0 || c < 0 || c >= w ? OT_WALL : r >= h ? OT_WALL : ot[r * w + c]);
    const rows: string[][] = Array.from({ length: H1 }, (_, r) => Array.from({ length: w }, (_, c) => {
      const v = at(c, r);
      return v === OT_WALL || v === OT_FLOOR ? '#' : v === OT_GLASS ? 'G' : v === OT_ELEV ? 'E' : '.';
    }));
    // pintu musuh V2 (gerbang kiri / kanan) = pintu darurat V1
    const gateTiles = [...(l.officeMap?.leftGates ?? []), ...(l.officeMap?.rightGates ?? [])];
    for (const gt of gateTiles) { const r = gt.ty - 1; if (r >= 0 && r < H1 && gt.tx >= 0 && gt.tx < w && rows[r][gt.tx] === '.') rows[r][gt.tx] = 'S'; }
    // tema per lantai
    const n = H1 / STORY, flavor = FLAVOR[l.officeMap?.theme ?? 'cyber_night'] ?? FLAVOR.cyber_night;
    const roomStory: boolean[] = [];
    for (let s = 0; s < n; s++) { let air = 0; for (let r = s * STORY; r < s * STORY + STORY - 1; r++) for (let c = 0; c < w; c++) if (rows[r][c] !== '#') air++; roomStory.push(air > w * 0.5); }
    let lowest = -1; for (let s = n - 1; s >= 0; s--) if (roomStory[s]) { lowest = s; break; }
    const themes: string[] = []; let k = 0;
    for (let s = 0; s < n; s++) {
      if (!roomStory[s]) { themes.push('cubicle'); continue; }
      const openTop = s === 0 || !rows[s * STORY - 1].some((ch) => ch === '#');
      if (openTop) themes.push('roof');
      else if (s === lowest) themes.push('lobby');
      else themes.push(flavor[(k++) % flavor.length]);
    }
    const m1: OfficeMap = { name: 'V2', w, h: H1, rows: rows.map((r) => r.join('')), roof: false, themes };
    // perabot V1 otomatis (dekor statis) di lantai kosong, menghindari tangga, pintu, lift & props interaktif V2
    const v2props = (l.officeMap?.props ?? []).map((p) => ({ c: p.tx, r: p.ty - 1 }));
    const glows: V1OfficeLook['glows'] = [];
    const furn: { ch: string; c: number; r: number; nl: boolean; nr: boolean }[] = [];
    for (let s = 0; s < n; s++) {
      if (!roomStory[s]) continue;
      const th = themes[s] as ThemeId, fr = s * STORY + STORY - 2, set = SETS[th] ?? SETS.cubicle;
      const free = (c: number) => {
        if (c < 3 || c >= w - 3 || rows[fr][c] !== '.' || rows[fr + 1]?.[c] !== '#') return false;
        for (let d = -1; d <= 1; d++) { for (let r = s * STORY; r <= fr + 1; r++) { const v = at(c + d, r); if (v === OT_STAIRS || v === OT_ELEV) return false; } const ch = rows[fr][c + d]; if (ch === 'S' || ch === 'E') return false; }
        return !v2props.some((p) => p.r === fr && Math.abs(p.c - c) <= 1);
      };
      let c = 4;
      while (c < w - 4) {
        if (!free(c)) { c++; continue; }
        let tot = 0; for (const [, wt] of set) tot += wt;
        let x = hh(c, s, 911) * tot, pick = set[0][0];
        for (const [kk, wt] of set) { x -= wt; if (x <= 0) { pick = kk; break; } }
        let ok = true; for (let i = 0; i < pick.length; i++) if (!free(c + i)) { ok = false; break; }
        if (!ok) { c++; continue; }
        for (let i = 0; i < pick.length; i++) if (pick[i] !== '.') furn.push({ ch: pick[i], c: c + i, r: fr, nl: pick[i - 1] === pick[i], nr: pick[i + 1] === pick[i] });
        c += pick.length + 2 + Math.floor(hh(c, s, 913) * 3);
      }
    }
    const bb = buildBuilding(m1);
    const g = bb.cv.getContext('2d')!;
    // tangga V2 (sumur tangga) bergaya V1
    this.drawStairs(g, at, w, h, H1);
    for (const f of furn) {
      const s = Math.floor(f.r / STORY);
      drawProp(g, f.ch, f.c * T, (f.r + 1) * T, { broken: false, t: 0, seed: hh(f.c, f.r, 5), shake: 0, nl: f.nl, nr: f.nr, th: themeOf(m1, s) });
      if ('liVAOvy'.includes(f.ch)) glows.push({ x: f.c * T + 8, yF: (f.r + 1) * T, h: propHeight(f.ch), ch: f.ch, story: s });
    }
    this.gates = [];
    for (let r = 0; r < H1; r++) for (let c = 0; c < w; c++) { const ch = rows[r][c]; if (ch === 'S' || ch === 'E') this.gates.push({ x: c * T, yF: (r + 1) * T, ch }); }
    this.m1 = m1; this.lamps = bb.lamps; this.windows = bb.windows; this.decor = bb.decor; this.glows = glows;
    this.stories = n; this.mapW = w; this.mapH = h;
    this.spans = Array.from({ length: n }, (_, s) => storySpan(m1, s));
    this.outdoorStory = themes.map((t) => t === 'roof');
    this.sprites.clear();
    this.fx.solid = (x, y) => { const c = Math.floor(x / T), r = Math.floor(y / T); const v = at(c, r); return v === OT_WALL || v === OT_FLOOR || v === OT_GLASS; };
    this.apply(0, true);
    return bb.cv;
  }

  private drawStairs(g: CanvasRenderingContext2D, at: (c: number, r: number) => number, w: number, h: number, H1: number) {
    void H1;
    const seen = new Set<number>();
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      if (at(c, r) !== OT_STAIRS || seen.has(r * w + c)) continue;
      // satu sumur tangga = blok persegi kolom berurutan
      let c1 = c; while (at(c1 + 1, r) === OT_STAIRS) c1++;
      let r1 = r; while (at(c, r1 + 1) === OT_STAIRS) r1++;
      for (let rr = r; rr <= r1; rr++) for (let cc = c; cc <= c1; cc++) if (at(cc, rr) === OT_STAIRS) seen.add(rr * w + cc);
      const x0 = c * T, x1 = (c1 + 1) * T, yT = r * T, yB = (r1 + 1) * T;
      g.fillStyle = 'rgba(8,10,16,0.55)'; g.fillRect(x0, yT, x1 - x0, yB - yT);
      R(g, x0, yT, 1, yB - yT, '#5d6375'); R(g, x1 - 1, yT, 1, yB - yT, '#2b2e38');
      // anak tangga zig-zag (satu putaran per 2 lantai tegak)
      const flights = Math.max(1, Math.round((yB - yT) / (T * 2.5)));
      const fh = (yB - yT) / flights;
      for (let f = 0; f < flights; f++) {
        const fy0 = yB - f * fh, fy1 = fy0 - fh, ltr = f % 2 === 0;
        const steps = Math.max(4, Math.round(fh / 4));
        for (let k = 0; k < steps; k++) {
          const u = k / steps, sx = ltr ? x0 + (x1 - x0) * u : x1 - (x1 - x0) * (u + 1 / steps), sy = fy0 - fh * (k + 1) / steps;
          R(g, sx, sy, (x1 - x0) / steps + 1, 3, '#7d8494'); R(g, sx, sy, (x1 - x0) / steps + 1, 1, '#b8c0cf'); R(g, sx, sy + 3, (x1 - x0) / steps + 1, 1, '#3c414e');
        }
        g.strokeStyle = '#aab3c2'; g.lineWidth = 1; g.beginPath();
        g.moveTo(ltr ? x0 : x1, fy0 - 9); g.lineTo(ltr ? x1 : x0, fy1 - 9); g.stroke();
        for (let k = 0; k <= 3; k++) { const u = k / 3, px = ltr ? x0 + (x1 - x0) * u : x1 - (x1 - x0) * u, py = fy0 - fh * u; R(g, px, py - 9, 1, 9, '#8a93a2'); }
      }
      R(g, x0 + 3, yT + 2, 10, 5, '#0c3a1e'); R(g, x0 + 4, yT + 3, 8, 3, '#2bd96b');
    }
  }

  // ---------------------------------------------------------------- suasana
  private autoId(wave: number): AtmoId {
    const order: AtmoId[] = ['pagi', 'siang', 'sore', 'malam', 'subuh'];
    const w = Math.max(1, wave);
    if (w > 2 && hh(w, 7, 3) < 0.18) return 'hujan';
    return order[Math.floor((w - 1) / 2) % order.length];
  }
  apply(wave: number, instant = false) {
    const id = this.mode === 'auto' ? this.autoId(wave) : this.mode;
    if (id === this.target && !instant) return;
    this.from = this.A; this.to = ATMOS[id]; this.target = id; this.k = instant ? 1 : 0;
    if (instant) this.A = this.to;
  }
  update(raw: number, sfx: Sfx, active: boolean, wave: number) {
    this.time += raw;
    this.apply(wave);
    if (this.k < 1) { this.k = Math.min(1, this.k + raw / 3.5); const k = this.k; this.A = mixAtmo(this.from, this.to, k * k * (3 - 2 * k)); }
    if (this.A.lightning > 0.4) { this.lightningT -= raw; if (this.lightningT <= 0) { this.lightning = 0.75; this.lightningT = 3.5 + Math.random() * 5.5; this.thunderT = 0.25 + Math.random(); } }
    if (this.thunderT > 0) { this.thunderT -= raw; if (this.thunderT <= 0) this.weather.thunder(sfx, 0.55 + Math.random() * 0.45); }
    this.lightning = Math.max(0, this.lightning - raw * 2.6);
    this.weather.update(sfx, this.A.rain, active);
    this.fx.update(raw);
  }
  stop() { this.weather.stop(); }

  // ---------------------------------------------------------------- gambar
  drawSky(g: CanvasRenderingContext2D, sw: number, sh: number, camL: number, camT: number) {
    drawSky2(g, this.sky, this.A, sw, sh, camL, camT, this.mapH * T, this.time, this.lightning);
    if (this.A.gradeA > 0.01) { g.globalCompositeOperation = 'multiply'; g.fillStyle = css(this.tint()); g.fillRect(0, 0, sw, sh); g.globalCompositeOperation = 'source-over'; }
  }
  private tint(): RGB { const gg = this.A.grade, k = this.A.gradeA; return [255 + (gg[0] - 255) * k, 255 + (gg[1] - 255) * k, 255 + (gg[2] - 255) * k]; }
  /** kaca (dari tile V2 terkini), pintu darurat & lift, hiasan dinding beranimasi */
  drawLive(g: CanvasRenderingContext2D, l: V2Level, v: View) {
    const ot = l.officeTiles; if (!ot) return;
    const c0 = Math.max(0, Math.floor(v.ix / T) - 1), c1 = Math.min(l.w - 1, Math.ceil((v.ix + v.bw) / T) + 1);
    const r0 = Math.max(0, Math.floor(v.iy / T) - 1), r1 = Math.min(l.h - 1, Math.ceil((v.iy + v.bh) / T) + 1);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (ot[r * l.w + c] === OT_GLASS) drawGlassTile(g, c * T, r * T, true, ot[(r - 1) * l.w + c] !== OT_GLASS, ot[(r + 1) * l.w + c] !== OT_GLASS, this.time);
    for (const gt of this.gates) if (gt.x > v.ix - 24 && gt.x < v.ix + v.bw + 8) drawConnector(g, gt.ch, gt.x, gt.yF, 0, this.time);
    for (const d of this.decor) if (d.x > v.ix - 30 && d.x < v.ix + v.bw + 10 && d.yF > v.iy && d.y0 < v.iy + v.bh) drawWallDecor(g, d, this.time);
  }
  /** interior digelapkan / dihangatkan sesuai suasana (dipanggil sebelum petarung digambar) */
  drawAmbient(g: CanvasRenderingContext2D, v: View) {
    const A = this.A, gt = this.tint();
    const amb: RGB = [A.ambient[0] * gt[0] / 255, A.ambient[1] * gt[1] / 255, A.ambient[2] * gt[2] / 255];
    const dark = amb[0] < 250 || amb[1] < 250 || amb[2] < 250;
    const SP = STORY * T;
    for (let s = 0; s < this.stories; s++) {
      if (this.outdoorStory[s]) continue;
      const y0 = s * SP, y1 = y0 + SP - T + 6;
      if (y1 < v.iy || y0 > v.iy + v.bh) continue;
      const [ca, cb] = this.spans[s];
      const x0 = ca * T, w = (cb + 1) * T - x0;
      if (dark) { g.globalCompositeOperation = 'multiply'; g.fillStyle = css(amb); g.fillRect(x0, y0, w, y1 - y0); }
      if (A.lift > 0.01) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,248,236,${A.lift})`; g.fillRect(x0, y0, w, y1 - y0); }
    }
    g.globalCompositeOperation = 'source-over';
  }
  private glowSprite(c: string, r: number) {
    const Rr = Math.max(4, Math.round(r / 4) * 4), key = `g${c}${Rr}`;
    let cv = this.sprites.get(key);
    if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = Rr * 2; const g = cv.getContext('2d')!, gr = g.createRadialGradient(Rr, Rr, 0, Rr, Rr, Rr); gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(0.45, rgba(c, 0.4)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, Rr * 2, Rr * 2); this.sprites.set(key, cv); }
    return cv;
  }
  private lampSprite(c: string, hgt: number) {
    const key = `l${c}${hgt}`;
    let cv = this.sprites.get(key);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = 64; cv.height = hgt + 4;
      const g = cv.getContext('2d')!;
      const cg = g.createLinearGradient(0, 2, 0, hgt); cg.addColorStop(0, rgba(c, 0.22)); cg.addColorStop(1, rgba(c, 0));
      g.fillStyle = cg; g.beginPath(); g.moveTo(26, 3); g.lineTo(38, 3); g.lineTo(64, hgt); g.lineTo(0, hgt); g.closePath(); g.fill();
      g.save(); g.translate(0, hgt + 1); g.scale(1, 0.12); const rg = g.createRadialGradient(32, 0, 1, 32, 0, 32); rg.addColorStop(0, rgba(c, 0.34)); rg.addColorStop(1, rgba(c, 0)); g.fillStyle = rg; g.fillRect(0, -32, 64, 64); g.restore();
      g.fillStyle = rgba(c, 0.5); g.fillRect(26, 0, 12, 3);
      this.sprites.set(key, cv);
    }
    return cv;
  }
  /** lampu plafon, sinar matahari menembus jendela, cahaya perabot */
  drawLights(g: CanvasRenderingContext2D, v: View) {
    const A = this.A;
    const vis = (x: number, y: number, m = 40) => x > v.ix - m && x < v.ix + v.bw + m && y > v.iy - m - 60 && y < v.iy + v.bh + m;
    g.save(); g.globalCompositeOperation = 'lighter';
    if (A.lamp > 0.03) for (const l of this.lamps) {
      if (!vis(l.x, l.y)) continue;
      let k = A.lamp;
      if (A.rain > 0.5 && hh(Math.round(l.x), l.story, 3) > 0.8) k *= 0.5 + 0.5 * Math.abs(Math.sin(this.time * 23 + l.x));
      if (this.lightning > 0.3 && hh(Math.round(l.x), l.story, 5) > 0.6) k *= 0.3;
      const lh = Math.round(l.floorY - l.y);
      g.globalAlpha = Math.min(1, k); g.drawImage(this.lampSprite(l.color, lh), l.x - 32, l.y); g.globalAlpha = 1;
    }
    if (A.beam > 0.03) for (const w of this.windows) {
      if (!vis(w.x + w.w / 2, w.y)) continue;
      const floorY = w.story * STORY * T + STORY * T - T, sh = (floorY - w.y) * A.beamDir * 0.7;
      g.fillStyle = css(A.beamColor, 0.07 * A.beam); g.beginPath(); g.moveTo(w.x, w.y); g.lineTo(w.x + w.w, w.y); g.lineTo(w.x + w.w + sh, floorY); g.lineTo(w.x + sh, floorY); g.closePath(); g.fill();
      g.fillStyle = css(A.beamColor, 0.07 * A.beam); g.beginPath(); g.moveTo(w.x + 6, w.y); g.lineTo(w.x + w.w - 6, w.y); g.lineTo(w.x + w.w - 6 + sh * 0.6, w.y + (floorY - w.y) * 0.6); g.lineTo(w.x + 6 + sh * 0.6, w.y + (floorY - w.y) * 0.6); g.closePath(); g.fill();
      g.fillStyle = css(A.beamColor, 0.12 * A.beam); g.fillRect(w.x, w.y, w.w, w.h);
      g.fillStyle = css(A.beamColor, 0.22 * A.beam); g.fillRect(Math.round(w.x + sh), floorY - 1, w.w, 2);
    }
    const dk = Math.max(A.lamp, A.night * 0.8);
    if (dk > 0.15) for (const pr of this.glows) {
      const cx = pr.x, cy = pr.yF - pr.h * 0.6;
      if (!vis(cx, cy)) continue;
      const col = pr.ch === 'l' ? '#ffd99a' : pr.ch === 'i' ? '#7ab8ff' : pr.ch === 'V' ? '#ff3df2' : pr.ch === 'A' ? '#3ab8e8' : pr.ch === 'O' ? '#7aff9a' : pr.ch === 'v' ? '#ff5a5a' : '#ffb347';
      const r = pr.ch === 'l' ? 38 : 22, a = (pr.ch === 'l' ? 0.4 : 0.22) * dk;
      g.globalAlpha = Math.min(1, a); g.drawImage(this.glowSprite(col, r), cx - r, (pr.ch === 'l' ? pr.yF - 22 : cy) - r, r * 2, r * 2); g.globalAlpha = 1;
    }
    g.restore();
  }
  private outdoor(x: number, y: number) {
    if (y >= (this.mapH - 1) * T) return true;
    const s = Math.max(0, Math.min(this.stories - 1, Math.floor(y / (STORY * T))));
    if (this.outdoorStory[s]) return true;
    const sp = this.spans[s];
    return !sp || x < sp[0] * T || x > (sp[1] + 1) * T;
  }
  /** hujan (hanya di luar ruangan), tetesan di kaca, percikan atap, kilat */
  drawWeather(g: CanvasRenderingContext2D, v: View) {
    const A = this.A;
    if (A.rain > 0.02) {
      const n = Math.round(110 * A.rain);
      g.fillStyle = `rgba(190,210,240,${0.35 + 0.25 * A.rain})`;
      for (let i = 0; i < n; i++) {
        const sp = 300 + (i % 7) * 45;
        const x = v.ix + ((i * 71.3 + this.time * 70) % (v.bw + 20) + v.bw + 20) % (v.bw + 20) - 10;
        const y = v.iy + ((i * 37.9 + this.time * sp) % (v.bh + 20) + v.bh + 20) % (v.bh + 20) - 10;
        if (!this.outdoor(x, y)) continue;
        g.fillRect(Math.round(x), Math.round(y), 1, 5); g.fillRect(Math.round(x) - 1, Math.round(y) + 5, 1, 3);
      }
      g.fillStyle = 'rgba(200,225,255,0.55)';
      for (const w of this.windows) {
        if (w.x + w.w < v.ix || w.x > v.ix + v.bw || w.y > v.iy + v.bh || w.y + w.h < v.iy) continue;
        for (let k = 0; k < 5; k++) { const dx = Math.floor(hh(w.x, k, 13) * (w.w - 2)), sp = 14 + hh(k, w.x, 5) * 20, dy = (this.time * sp + hh(w.x, k, 7) * w.h) % w.h; g.fillRect(w.x + 1 + dx, Math.round(w.y + dy), 1, 3); }
      }
      if (Math.random() < A.rain) for (let i = 0; i < 3; i++) {
        const x = v.ix + Math.random() * v.bw;
        for (let s = 0; s < this.stories; s++) if (this.outdoorStory[s]) this.fx.add({ x, y: (s * STORY + STORY - 1) * T - 0.5, vx: (Math.random() - 0.5) * 50, vy: -25 - Math.random() * 45, life: 0.3, c: '#cfe3ff', s: 1, k: 12, g: 500 });
      }
    }
    this.fx.draw(g);
    if (this.lightning > 0.02) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(200,215,255,${this.lightning * 0.4})`; g.fillRect(v.ix, v.iy, v.bw, v.bh); g.restore(); }
  }
  /** props interaktif V2 (meja / pot / peti / tong) digambar dengan seni V1 */
  drawV2Prop(g: CanvasRenderingContext2D, pr: { x: number; y: number; kind: string; hp: number; dead?: boolean; flash?: number }, flash: boolean, time: number): boolean {
    const ch = pr.kind === 'table' ? 'd' : pr.kind === 'pot' ? 'p' : pr.kind === 'crate' ? 'b' : pr.kind === 'barrel' ? 'Z' : null;
    if (!ch) return false;
    const s = Math.max(0, Math.min(this.stories - 1, Math.floor((pr.y - 1) / (STORY * T))));
    const th = this.m1 ? themeOf(this.m1, s) : THEMES.cubicle;
    if (ch === 'd') { // meja V2: 20px, permukaan pijak y-9 — gambar dua petak meja V1 sambung
      drawProp(g, 'd', pr.x - 16, pr.y, { broken: !!pr.dead, t: time, seed: 0.8, shake: 0, nl: false, nr: true, th });
      drawProp(g, 'd', pr.x, pr.y, { broken: !!pr.dead, t: time, seed: 0.2, shake: 0, nl: true, nr: false, th });
    } else drawProp(g, ch, pr.x - 8, pr.y, { broken: !!pr.dead, t: time, seed: 0.6, shake: 0, nl: false, nr: false, th });
    if (flash) { g.globalAlpha = 0.6; g.fillStyle = '#ffffff'; g.fillRect(Math.round(pr.x - 9), Math.round(pr.y - 12), 18, 12); g.globalAlpha = 1; }
    return true;
  }
}

// ================================ EFEK HIT V1 ================================
/** Efek kena pukul gaya V1: sisi DEPAN cuma kilatan kecil (pukulan tetap terlihat jelas),
 *  darah, gelombang kejut, garis laju & bintang benturan keluar dari sisi BELAKANG tubuh (searah pukulan). */
export class V1HitFx {
  fx = new FX(); back = new FX();
  spurts: { x: number; y: number; t: number }[] = [];
  constructor(solid: (x: number, y: number) => boolean, stamp: (x: number, y: number, c: string, s: number, floor: boolean) => void) {
    this.fx.solid = solid; this.back.solid = solid; this.fx.onBlood = stamp; this.back.onBlood = stamp;
  }
  hit(ex: number, feet: number, scale: number, pt: { x: number; y: number }, dir: number, o: { heavy: boolean; blood: number; power: number; kill?: boolean; color?: string }) {
    const a = dir > 0 ? 0 : Math.PI, top = feet - 15 * scale;
    const by = Math.max(top + 2, Math.min(feet - 3, pt.y)), bx = ex + dir * (4.5 * scale + 1);
    this.fx.flash(pt.x, pt.y, o.heavy ? 3 : 2);
    if (o.heavy) this.fx.ring(pt.x, pt.y, 1, 4, '#ffffff', 0.09, 1);
    const B = this.back;
    B.impact(bx + dir * 2, by, o.kill ? 11 : o.heavy ? 8 : 5, o.color ?? (o.heavy ? '#ffd166' : '#ffffff'));
    B.lines(bx + dir * 3, by, o.heavy ? 5 : 3, '#ffffff', a, o.heavy ? 340 : 260);
    B.spark(bx, by, o.heavy ? 8 : 4, o.kill ? '#ff8a8a' : '#ffffff', a, 0.55, o.heavy ? 290 : 210);
    if (o.heavy || o.kill) B.shockwave(bx + dir * 3, by, o.kill ? 20 : 13, '#ffffff', o.kill ? 0.3 : 0.22);
    B.blood(bx, by, Math.round(o.blood), a, o.power, '#d40000', o.kill ? 0.55 : 0.42);
    B.mist(bx, by, o.kill ? 5 : o.heavy ? 3 : 1, a);
    if (o.kill) this.spurts.push({ x: ex, y: feet - 9 * scale, t: 0.9 });
  }
  update(dt: number) {
    for (const s of this.spurts) { s.t -= dt; if (Math.random() < 0.75) this.back.blood(s.x + (Math.random() - 0.5) * 4, s.y, 2, -Math.PI / 2 + (Math.random() - 0.5), 170, '#c80000', 0.25); }
    this.spurts = this.spurts.filter((s) => s.t > 0);
    this.fx.update(dt); this.back.update(dt);
  }
}

// ================================ GLOW V1 (bloom aditif) ================================
export const GLOW_KEY_V2 = 'v2_office_glow';
export function loadV2Glow(): boolean { try { return localStorage.getItem(GLOW_KEY_V2) !== 'off'; } catch { return true; } }

/** Cahaya dinamis gaya V1: pukulan keras & KO, moncong senjata, ledakan, plus pendar aura mode N (8 Gerbang)
 *  dan mode X (One For All). Sprite pendar radial disimpan per warna/ukuran/resolusi, digambar dengan 'lighter'. */
export class V1Glow {
  lights: { x: number; y: number; r: number; c: string; life: number; max: number }[] = [];
  private sprites = new Map<string, HTMLCanvasElement>();
  add(x: number, y: number, r: number, c: string, life: number) {
    this.lights.push({ x, y, r, c, life, max: life });
    if (this.lights.length > 48) this.lights.shift();
  }
  update(dt: number) {
    if (!this.lights.length) return;
    for (const l of this.lights) l.life -= dt;
    this.lights = this.lights.filter((l) => l.life > 0);
  }
  clear() { this.lights = []; }
  private sprite(c: string, r: number, q: number) {
    const Rr = Math.max(4, Math.round(r / 4) * 4), key = `${c}|${Rr}|${q}`;
    let cv = this.sprites.get(key);
    if (!cv) {
      if (this.sprites.size > 160) this.sprites.clear();
      cv = document.createElement('canvas'); const S = Rr * 2 * q; cv.width = cv.height = S;
      const g = cv.getContext('2d')!, gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(0.45, rgba(c, 0.4)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(0, 0, S, S); this.sprites.set(key, cv);
    }
    return cv;
  }
  /** pendar radial (q = kerapatan sprite: makin besar makin halus di layar resolusi tinggi) */
  glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string, a: number, q = 1) {
    if (a <= 0.01 || r < 2) return;
    g.globalAlpha = Math.min(1, a);
    g.drawImage(this.sprite(c, r, q), x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
  }
  drawLights(g: CanvasRenderingContext2D, q = 1) {
    for (const l of this.lights) { const k = l.life / l.max; this.glow(g, l.x, l.y, l.r * (0.7 + 0.3 * k), l.c, 0.42 * k, q); }
  }
  /** aura ONE FOR ALL di belakang tubuh: pendar cyan + petir kecil (persis drawOfaAura V1) */
  ofaAura(g: CanvasRenderingContext2D, x: number, y: number) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(x, y - 8, 2, x, y - 8, 16);
    gr.addColorStop(0, 'rgba(87,230,255,0.35)'); gr.addColorStop(1, 'rgba(87,230,255,0)');
    g.fillStyle = gr; g.fillRect(x - 16, y - 24, 32, 32);
    g.restore();
    for (let i = 0; i < 3; i++) {
      let px = x + rnd(-6, 6), py = y - rnd(0, 16);
      for (let k = 0; k < 3; k++) { const nx = px + rnd(-3, 3), ny = py + rnd(-4, 1); pline(g, px, py, nx, ny, Math.random() < 0.5 ? '#7df9ff' : '#ffffff'); px = nx; py = ny; }
    }
  }
}
