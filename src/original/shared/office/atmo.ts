// SUASANA MENARA KANTOR: subuh, pagi, siang, sore, malam, hujan deras.
// Semua parameter numerik -> bisa dicampur halus (transisi waktu). Langit kota punya dua palet (siang / malam) yang dicampur.
/** cukup bagian Sfx yang dipakai (V1 & V2 punya kelas Sfx kembar) */
export interface SfxLike { ctx: AudioContext | null; muted: boolean }
type Sfx = SfxLike;

export type AtmoId = 'subuh' | 'pagi' | 'siang' | 'sore' | 'malam' | 'hujan';
type RGB = [number, number, number];
export interface AtmoDef {
  sky: [RGB, RGB, RGB, RGB]; stars: number;
  sunX: number; sunY: number; sunR: number; sun: RGB; sunGlow: number; moon: number;
  clouds: number; cloud: RGB; night: number; haze: RGB; hazeA: number;
  /** interior: warna multiply (gelap/hangat), angkat cahaya siang, intensitas lampu */
  ambient: RGB; lift: number; lamp: number;
  /** berkas sinar matahari menembus jendela */
  beam: number; beamColor: RGB; beamDir: number;
  rain: number; grade: RGB; gradeA: number; lightning: number;
}
const h = (s: string): RGB => { const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export const ATMOS: Record<AtmoId, AtmoDef> = {
  subuh: { sky: [h('#0b1030'), h('#2a2a5a'), h('#6a4a7a'), h('#e08a7a')], stars: 0.5, sunX: 0.2, sunY: -0.03, sunR: 10, sun: h('#ffb090'), sunGlow: 0.7, moon: 0, clouds: 0.35, cloud: h('#9a7a9a'), night: 0.7, haze: h('#c89aaa'), hazeA: 0.35, ambient: h('#8e8eb4'), lift: 0, lamp: 0.8, beam: 0, beamColor: h('#ffb090'), beamDir: 1, rain: 0, grade: h('#b8a8d8'), gradeA: 0.22, lightning: 0 },
  pagi: { sky: [h('#3a78c8'), h('#6aa8e0'), h('#a8d0ee'), h('#ffe0b0')], stars: 0, sunX: 0.2, sunY: 0.32, sunR: 9, sun: h('#fff2c8'), sunGlow: 0.85, moon: 0, clouds: 0.5, cloud: h('#ffffff'), night: 0, haze: h('#ffe8c8'), hazeA: 0.3, ambient: h('#fff2e4'), lift: 0.15, lamp: 0.18, beam: 0.55, beamColor: h('#ffe2a8'), beamDir: 1, rain: 0, grade: h('#fff0d8'), gradeA: 0.25, lightning: 0 },
  siang: { sky: [h('#2a6ad8'), h('#4a92e8'), h('#8ac0f2'), h('#d8ecff')], stars: 0, sunX: 0.55, sunY: 0.95, sunR: 10, sun: h('#ffffff'), sunGlow: 0.6, moon: 0, clouds: 0.6, cloud: h('#ffffff'), night: 0, haze: h('#e8f4ff'), hazeA: 0.25, ambient: h('#ffffff'), lift: 0.22, lamp: 0.08, beam: 0.35, beamColor: h('#fffaf0'), beamDir: 0.25, rain: 0, grade: h('#ffffff'), gradeA: 0, lightning: 0 },
  sore: { sky: [h('#2a2050'), h('#7a3a6a'), h('#e0704a'), h('#ffc070')], stars: 0.1, sunX: 0.8, sunY: 0.1, sunR: 13, sun: h('#ffb050'), sunGlow: 1, moon: 0, clouds: 0.55, cloud: h('#ff9a6a'), night: 0.35, haze: h('#ff9a5a'), hazeA: 0.42, ambient: h('#ffd0a8'), lift: 0.06, lamp: 0.5, beam: 0.75, beamColor: h('#ff9a40'), beamDir: -1, rain: 0, grade: h('#ffc49a'), gradeA: 0.35, lightning: 0 },
  malam: { sky: [h('#04050f'), h('#0f1230'), h('#2a1a4a'), h('#6a2a52')], stars: 1, sunX: 0.78, sunY: 0.75, sunR: 8, sun: h('#fff4dc'), sunGlow: 0.35, moon: 1, clouds: 0.15, cloud: h('#2a2a4a'), night: 1, haze: h('#3a2050'), hazeA: 0.25, ambient: h('#7c84ac'), lift: 0, lamp: 1, beam: 0, beamColor: h('#9fb8ff'), beamDir: 0, rain: 0, grade: h('#aab2e0'), gradeA: 0.22, lightning: 0 },
  hujan: { sky: [h('#161a24'), h('#262c3a'), h('#363e4e'), h('#556070')], stars: 0, sunX: 0.5, sunY: 0.6, sunR: 0, sun: h('#ffffff'), sunGlow: 0, moon: 0, clouds: 1, cloud: h('#3a3e4a'), night: 0.72, haze: h('#6a7280'), hazeA: 0.5, ambient: h('#8890a4'), lift: 0, lamp: 0.85, beam: 0, beamColor: h('#ffffff'), beamDir: 0, rain: 1, grade: h('#a8b4c8'), gradeA: 0.32, lightning: 1 },
};
export const ATMO_LIST: { id: AtmoId; name: string }[] = [
  { id: 'subuh', name: 'SUBUH' }, { id: 'pagi', name: 'PAGI' }, { id: 'siang', name: 'SIANG' }, { id: 'sore', name: 'SORE' }, { id: 'malam', name: 'MALAM' }, { id: 'hujan', name: 'HUJAN DERAS' },
];

const lr = (a: number, b: number, t: number) => a + (b - a) * t;
const lc = (a: RGB, b: RGB, t: number): RGB => [lr(a[0], b[0], t), lr(a[1], b[1], t), lr(a[2], b[2], t)];
export function mixAtmo(a: AtmoDef, b: AtmoDef, t: number): AtmoDef {
  const o = {} as AtmoDef;
  for (const k of Object.keys(a) as (keyof AtmoDef)[]) {
    const va = a[k] as unknown, vb = b[k] as unknown;
    if (typeof va === 'number') (o as unknown as Record<string, number>)[k] = lr(va, vb as number, t);
    else if (k === 'sky') o.sky = [0, 1, 2, 3].map((i) => lc(a.sky[i], b.sky[i], t)) as AtmoDef['sky'];
    else (o as unknown as Record<string, RGB>)[k] = lc(va as RGB, vb as RGB, t);
  }
  return o;
}
export const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function hh(a: number, b: number, s = 0) {
  let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  x = Math.imul(x ^ (x >>> 13), 1274126177); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// ================================ LANGIT KOTA ================================
export interface SkyLayer { day: HTMLCanvasElement; night: HTMLCanvasElement; f: number; dayBase: string; nightBase: string }
export interface Sky2 { layers: SkyLayer[]; stars: { x: number; y: number; p: number }[]; clouds: { x: number; y: number; w: number; s: number }[] }

function mkLayer(w: number, H: number, seed: number, nightCol: string, dayCol: string, dayWin: string, lit: number, maxH: number, minH: number, neon: boolean): { day: HTMLCanvasElement; night: HTMLCanvasElement } {
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = H; return c; };
  const day = mk(), night = mk();
  const gd = day.getContext('2d')!, gn = night.getContext('2d')!;
  const R = (g: CanvasRenderingContext2D, x: number, y: number, ww: number, hh2: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh2)); };
  let x = 0, i = 0;
  while (x < w) {
    const bw = 14 + Math.floor(hh(i, seed, 1) * 40), bh = minH + Math.floor(hh(seed, i, 2) * (maxH - minH));
    const bx = x, by = H - bh;
    const draw = (ox: number) => {
      R(gn, bx + ox, by, bw, bh, nightCol); R(gd, bx + ox, by, bw, bh, dayCol);
      R(gd, bx + ox, by, 2, bh, 'rgba(255,255,255,0.12)');
      if (hh(i, seed, 3) > 0.6) { for (const [g, c] of [[gn, nightCol], [gd, dayCol]] as const) R(g, bx + ox + Math.floor(bw / 2), by - 8, 1, 8, c); R(gn, bx + ox + Math.floor(bw / 2), by - 9, 1, 1, '#ff3030'); R(gd, bx + ox + Math.floor(bw / 2), by - 9, 1, 1, '#ff6060'); }
      if (hh(i, seed, 4) > 0.75) { R(gn, bx + ox + 2, by - 3, bw - 4, 3, nightCol); R(gd, bx + ox + 2, by - 3, bw - 4, 3, dayCol); }
      for (let yy = by + 4; yy < H - 2; yy += 4) for (let xx = bx + 2; xx < bx + bw - 2; xx += 3) {
        const v = hh(xx, yy, seed);
        if (v < lit) R(gn, xx + ox, yy, 1, 2, v < lit * 0.25 ? '#9fd6ff' : v < lit * 0.5 ? '#ffe2a0' : '#ffbe5c');
        R(gd, xx + ox, yy, 1, 2, v < 0.06 ? 'rgba(255,255,255,0.55)' : dayWin);
      }
      if (neon && hh(i, seed, 5) > 0.7) { const nc = ['#ff3df2', '#35f0ff', '#ffd166'][i % 3]; R(gn, bx + ox + 2, by + 6, Math.max(4, bw - 4), 2, nc); R(gd, bx + ox + 2, by + 6, Math.max(4, bw - 4), 2, 'rgba(255,255,255,0.25)'); }
    };
    draw(0); if (bx + bw > w) draw(-w);
    x += bw + Math.floor(hh(i, seed, 6) * 6); i++;
  }
  return { day, night };
}

export function buildSky2(): Sky2 {
  const L = (w: number, H: number, seed: number, nc: string, dc: string, dw: string, lit: number, mx: number, mn: number, neon: boolean, f: number): SkyLayer => ({ ...mkLayer(w, H, seed, nc, dc, dw, lit, mx, mn, neon), f, dayBase: dc, nightBase: nc });
  const layers = [
    L(512, 220, 11, '#1b2045', '#9db2cc', 'rgba(70,95,130,0.35)', 0.08, 200, 90, false, 0.12),
    L(512, 240, 23, '#12152f', '#7a92b2', 'rgba(50,70,100,0.45)', 0.14, 220, 70, true, 0.28),
    L(640, 260, 37, '#090b1c', '#55698a', 'rgba(30,45,70,0.55)', 0.2, 250, 60, true, 0.5),
  ];
  const stars = Array.from({ length: 110 }, (_, k) => ({ x: hh(k, 1, 77) * 600, y: hh(k, 2, 77) * 240, p: hh(k, 3, 77) * 6.28 }));
  const clouds = Array.from({ length: 14 }, (_, k) => ({ x: hh(k, 4, 91) * 900, y: 150 + hh(k, 5, 91) * 260, w: 30 + hh(k, 6, 91) * 70, s: 0.4 + hh(k, 7, 91) }));
  return { layers, stars, clouds };
}

/** langit di buffer resolusi rendah (koordinat buffer), parallax terhadap kamera */
export function drawSky2(g: CanvasRenderingContext2D, sky: Sky2, A: AtmoDef, vw: number, vh: number, camL: number, camT: number, mapH: number, time: number, flash: number) {
  const ground = mapH - camT, horizon = ground + 10;
  const gr = g.createLinearGradient(0, ground - 700, 0, ground + 20);
  gr.addColorStop(0, css(A.sky[0])); gr.addColorStop(0.45, css(A.sky[1])); gr.addColorStop(0.75, css(A.sky[2])); gr.addColorStop(1, css(A.sky[3]));
  g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
  if (A.stars > 0.02) for (const s of sky.stars) {
    const x = ((s.x - camL * 0.03) % 600 + 600) % 600, y = s.y + (ground - 700) * 0.04 - 20;
    if (x < vw && y > 0 && y < vh) { g.globalAlpha = A.stars * (0.4 + 0.6 * Math.abs(Math.sin(time * 1.3 + s.p))); g.fillStyle = '#ffffff'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  g.globalAlpha = 1;
  // ---- matahari / bulan
  const sx = vw * A.sunX - ((camL * 0.02) % 200), sy = horizon - A.sunY * 260;
  if (A.sunGlow > 0.02 && sy < vh + 60) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const rr = Math.max(20, A.sunR * 6);
    const mg = g.createRadialGradient(sx, sy, 1, sx, sy, rr); mg.addColorStop(0, css(A.sun, 0.5 * A.sunGlow)); mg.addColorStop(1, css(A.sun, 0));
    g.fillStyle = mg; g.fillRect(sx - rr, sy - rr, rr * 2, rr * 2); g.restore();
    if (A.sunR > 1) {
      g.fillStyle = css(A.sun); g.beginPath(); g.arc(sx, sy, A.sunR, 0, Math.PI * 2); g.fill();
      if (A.moon > 0.5) { g.fillStyle = 'rgba(200,190,170,0.7)'; g.fillRect(Math.round(sx - 3), Math.round(sy - 2), 2, 2); g.fillRect(Math.round(sx + 2), Math.round(sy + 2), 3, 2); g.fillRect(Math.round(sx - 1), Math.round(sy + 3), 1, 1); }
    }
  }
  // ---- awan
  if (A.clouds > 0.02) for (const c of sky.clouds) {
    const x = ((c.x + time * 3 * c.s - camL * 0.06) % 900 + 900) % 900 - 100, y = horizon - c.y;
    if (x > vw + 80 || x < -c.w - 20 || y < -30 || y > vh + 10) continue;
    g.globalAlpha = A.clouds * 0.75; g.fillStyle = css(A.cloud);
    for (let k = 0; k < 5; k++) { const ex = x + (k / 4) * c.w, ey = y + Math.sin(k * 1.7 + c.s) * 3, r = c.w * (0.18 + 0.12 * Math.sin(k * 2.3 + c.s)); g.beginPath(); g.ellipse(ex, ey, r, r * 0.55, 0, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = A.clouds * 0.35; g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + c.w * 0.2), Math.round(y - c.w * 0.12), Math.round(c.w * 0.5), 1);
  }
  g.globalAlpha = 1;
  // ---- siluet kota (siang dicampur malam) + kabut horizon
  for (const L of sky.layers) {
    const w = L.day.width, ox = -(((camL * L.f) % w) + w) % w;
    const base = vh + (ground - vh) * L.f + 18 * (1 - L.f);
    const y = Math.round(base - L.day.height);
    if (y > vh) continue;
    for (let x = ox; x < vw; x += w) {
      if (A.night < 0.98) g.drawImage(L.day, Math.round(x), y);
      if (A.night > 0.02) { g.globalAlpha = Math.min(1, A.night); g.drawImage(L.night, Math.round(x), y); g.globalAlpha = 1; }
    }
    if (y + L.day.height < vh) { g.fillStyle = A.night > 0.5 ? L.nightBase : L.dayBase; g.fillRect(0, y + L.day.height, vw, vh - y - L.day.height); }
    const ha = A.hazeA * (1 - L.f * 1.25);
    if (ha > 0.01) { const hz = g.createLinearGradient(0, y, 0, y + L.day.height); hz.addColorStop(0, css(A.haze, 0)); hz.addColorStop(0.55, css(A.haze, ha)); hz.addColorStop(1, css(A.haze, ha * 0.6)); g.fillStyle = hz; g.fillRect(0, y, vw, L.day.height); }
  }
  // ---- hujan di belakang gedung (terlihat lewat jendela)
  if (A.rain > 0.02) {
    const n = Math.round(60 + A.rain * 200);
    g.fillStyle = `rgba(170,190,225,${0.25 + 0.25 * A.rain})`;
    for (let i = 0; i < n; i++) {
      const sp = 260 + (i % 5) * 40;
      const x = ((i * 97.3 + time * 90 * A.rain - camL * 0.6) % (vw + 30) + vw + 30) % (vw + 30) - 15;
      const y = ((i * 53.7 + time * sp) % (vh + 20) + vh + 20) % (vh + 20) - 10;
      g.fillRect(Math.round(x), Math.round(y), 1, 4); g.fillRect(Math.round(x) - 1, Math.round(y) + 4, 1, 3);
    }
  }
  if (flash > 0) { g.fillStyle = `rgba(210,220,255,${Math.min(0.6, flash)})`; g.fillRect(0, 0, vw, vh); }
}

// ================================ SUARA CUACA ================================
/** desis hujan (noise tersaring, loop) + guntur sintetis. Terhubung langsung ke AudioContext milik Sfx. */
export class Weather {
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private buf: AudioBuffer | null = null;
  update(sfx: Sfx, rain: number, active: boolean) {
    const ctx = sfx.ctx;
    if (!ctx || ctx.state === 'closed') return;
    const want = active && !sfx.muted ? rain * 0.09 : 0;
    if (want > 0.002 && !this.src) {
      if (!this.buf) {
        const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = last * 0.55 + w * 0.45; d[i] = last; }
        this.buf = b;
      }
      const s = ctx.createBufferSource(); s.buffer = this.buf; s.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      const gn = ctx.createGain(); gn.gain.value = 0;
      s.connect(hp); hp.connect(lp); lp.connect(gn); gn.connect(ctx.destination);
      s.start(); this.src = s; this.gain = gn;
    }
    if (this.gain) this.gain.gain.setTargetAtTime(want, ctx.currentTime, 0.5);
    if (want <= 0.002 && this.src && this.gain && this.gain.gain.value < 0.002) this.stop();
  }
  thunder(sfx: Sfx, power: number) {
    const ctx = sfx.ctx;
    if (!ctx || ctx.state !== 'running' || sfx.muted) return;
    const dur = 2.6, len = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * 0.08) * 0.995; d[i] = last * 4; }
    const s = ctx.createBufferSource(); s.buffer = b;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260 + power * 260;
    const gn = ctx.createGain(); const t = ctx.currentTime;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.5 * power, t + 0.06); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(lp); lp.connect(gn); gn.connect(ctx.destination); s.start(t); s.stop(t + dur);
  }
  stop() {
    try { this.src?.stop(); } catch { /* */ }
    this.src?.disconnect(); this.gain?.disconnect(); this.src = null; this.gain = null;
  }
}
