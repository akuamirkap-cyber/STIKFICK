// SENJATA BOXING — sarung tinju + tiga gaya bertarung yang benar-benar berbeda.
//
//   ALI   : out-boxer. Mengapung di ujung kaki, tangan rendah, flicker jab, Ali Shuffle.
//   TYSON : peek-a-boo. Jongkok rendah, sarung di pipi, bob-and-weave huruf U, hook & uppercut brutal.
//   IPPO  : in-fighter. Menjorok ke depan, body blow, Dempsey Roll, Gazelle Punch, Smash.
//
// Modul ini memegang state gaya (ritme langkah, fase weave, aliran combo) dan menggambar
// sarung tinju + jejak pukulan. Pose kerangkanya ada di stick.ts (prefix bx_).
import { pcircle, pellipse, pline, prect, type Ctx } from './pixel';
import { rnd } from './rng';

export type BoxStance = 'ali' | 'tyson' | 'ippo';

export interface BoxStanceDef {
  id: BoxStance;
  name: string;
  tag: string;
  hint: string;
  /** warna sarung + aksen jejak */
  glove: string;
  gloveDark: string;
  gloveLight: string;
  accent: string;
  /** pengali kecepatan gerak & damage */
  speed: number;
  power: number;
  /** tinggi badan (peek-a-boo merunduk) */
  crouch: number;
  /** ritme langkah per detik */
  cadence: number;
  /** peluang slip otomatis saat diancam (peek-a-boo paling tinggi) */
  slip: number;
}

export const BOX_STANCES: Record<BoxStance, BoxStanceDef> = {
  ali: {
    id: 'ali', name: 'ALI SHUFFLE', tag: 'FLOAT', hint: 'Melayang, jab cepat, kaki ringan',
    glove: '#e8402f', gloveDark: '#8e1b12', gloveLight: '#ff8a72', accent: '#ffd166',
    speed: 1.22, power: 0.88, crouch: 0, cadence: 5.6, slip: 0.16,
  },
  tyson: {
    id: 'tyson', name: 'PEEK-A-BOO', tag: 'WEAVE', hint: 'Merunduk, slip, hook & uppercut mematikan',
    glove: '#33333d', gloveDark: '#15151b', gloveLight: '#8f8fa4', accent: '#ff3b3b',
    speed: 0.94, power: 1.42, crouch: 1, cadence: 3.4, slip: 0.42,
  },
  ippo: {
    id: 'ippo', name: 'DEMPSEY ROLL', tag: 'PRESS', hint: 'Menekan maju, body blow, Gazelle Punch',
    glove: '#2f6fd0', gloveDark: '#123a78', gloveLight: '#7fb4ff', accent: '#7ce7ff',
    speed: 1.06, power: 1.14, crouch: 0.45, cadence: 4.4, slip: 0.24,
  },
};

export const BOX_ORDER: BoxStance[] = ['ali', 'tyson', 'ippo'];

interface Ghost { x: number; y: number; a: number; t: number; max: number; front: boolean }
interface Arc { x: number; y: number; r: number; from: number; to: number; t: number; max: number; c: string }

/** Sarung tinju piksel: kulit membulat, ibu jari, manset putih bertali. */
export function drawGlove(ctx: Ctx, x: number, y: number, ang: number, s: number, def: BoxStanceDef, flash = false) {
  const c = Math.cos(ang), sn = Math.sin(ang) * 0.62;
  const col = flash ? '#ffffff' : def.glove;
  const dark = flash ? '#ffffff' : def.gloveDark;
  const light = flash ? '#ffffff' : def.gloveLight;
  // manset / pergelangan di belakang sarung
  const wx = x - c * 1.9 * s, wy = y - sn * 1.9 * s;
  pline(ctx, wx, wy, x - c * 1.2 * s, y - sn * 1.2 * s, '#000', 3);
  pline(ctx, wx, wy, x - c * 1.2 * s, y - sn * 1.2 * s, flash ? '#fff' : '#efe7dc', 1);
  prect(ctx, Math.round(wx - 0.5), Math.round(wy - 0.5), 1, 1, flash ? '#fff' : '#c9bfae');
  // badan sarung: sedikit lonjong searah pukulan
  pellipse(ctx, x, y, 2.0 * s, 1.85 * s, '#000');
  pellipse(ctx, x, y, 1.65 * s, 1.5 * s, dark);
  pellipse(ctx, x + c * 0.2 * s, y + sn * 0.2 * s, 1.4 * s, 1.25 * s, col);
  // ibu jari di sisi dalam
  pcircle(ctx, x - sn * 1.25 * s - c * 0.3 * s, y + c * 0.8 * s - sn * 0.3 * s, 0.75 * s, dark);
  pcircle(ctx, x - sn * 1.25 * s - c * 0.3 * s, y + c * 0.8 * s - sn * 0.3 * s, 0.5 * s, col);
  // kilau kulit + jahitan
  pellipse(ctx, x - c * 0.4 * s - 0.35 * s, y - sn * 0.4 * s - 0.55 * s, 0.7 * s, 0.5 * s, light);
  prect(ctx, Math.round(x + c * 1.5 * s), Math.round(y + sn * 1.5 * s), 1, 1, dark);
}

export class Boxing {
  stance: BoxStance = 'ali';
  /** jam ritme gaya — dipakai pose untuk bounce / weave */
  clock = 0;
  /** fase langkah Ali (0..1) */
  step = 0;
  /** offset kepala hasil bob-and-weave (px dunia) */
  weaveX = 0;
  weaveY = 0;
  /** aliran combo ringan */
  flow = 0;
  flowT = 0;
  /** hitungan Dempsey Roll */
  roll = 0;
  rollT = 0;
  /** jeda gaya spesial */
  signCd = 0;
  shuffleCd = 0;
  /** sarung yang baru memukul -> jejak */
  ghosts: Ghost[] = [];
  arcs: Arc[] = [];
  /** denyut saat pukulan mendarat (untuk getar sarung) */
  pulse = 0;

  get def() { return BOX_STANCES[this.stance]; }

  reset() {
    this.clock = 0; this.step = 0; this.flow = 0; this.flowT = 0;
    this.roll = 0; this.rollT = 0; this.signCd = 0; this.shuffleCd = 0;
    this.lightBag = []; this.lastLight = ''; this.heavyIdx = 0;
    this.ghosts.length = 0; this.arcs.length = 0; this.pulse = 0;
  }

  setStance(s: BoxStance) {
    if (this.stance === s) return;
    this.stance = s;
    this.flow = 0; this.roll = 0; this.clock = 0;
    this.lightBag = []; this.lastLight = ''; this.heavyIdx = 0;
    this.ghosts.length = 0; this.arcs.length = 0;
  }

  /** Ritme & weave. Peek-a-boo menggambar huruf U: turun-samping-naik. */
  update(dt: number, moving: boolean, speed01: number) {
    const d = this.def;
    this.clock += dt * (moving ? 1.25 : 1) * (0.7 + speed01 * 0.6);
    this.step = (this.step + dt * d.cadence * (0.45 + speed01 * 0.85)) % 1;
    this.flowT -= dt;
    if (this.flowT <= 0) this.flow = 0;
    this.rollT -= dt;
    if (this.rollT <= 0) this.roll = 0;
    this.signCd = Math.max(0, this.signCd - dt);
    this.shuffleCd = Math.max(0, this.shuffleCd - dt);
    this.pulse = Math.max(0, this.pulse - dt * 4);

    // bob-and-weave: amplitudo terbesar pada peek-a-boo
    const w = this.clock * (d.id === 'tyson' ? 4.4 : d.id === 'ippo' ? 3.4 : 5.2);
    const amp = d.id === 'tyson' ? 2.6 : d.id === 'ippo' ? 1.5 : 1.0;
    this.weaveX = Math.sin(w) * amp;
    this.weaveY = d.id === 'tyson' ? (1 - Math.cos(w * 2)) * 0.9 : Math.abs(Math.sin(w)) * 0.5;

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].t += dt;
      if (this.ghosts[i].t >= this.ghosts[i].max) this.ghosts.splice(i, 1);
    }
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].t += dt;
      if (this.arcs[i].t >= this.arcs[i].max) this.arcs.splice(i, 1);
    }
  }

  /** Rekam jejak sarung saat tangan melaju kencang. */
  trail(x: number, y: number, ang: number, front: boolean, power = 1) {
    if (this.ghosts.length < 26) {
      this.ghosts.push({ x, y, a: ang, t: 0, max: 0.13 + power * 0.05, front });
    }
  }

  arc(x: number, y: number, r: number, from: number, to: number, c: string, life = 0.16) {
    if (this.arcs.length < 14) this.arcs.push({ x, y, r, from, to, t: 0, max: life, c });
  }

  /** Semua teknik tinju non-mematikan. Spam LMB menghabiskan satu kantong dulu,
   *  baru dikocok ulang — jadi tiap teknik benar-benar terpakai, tidak ada yang menganggur. */
  private lightBag: string[] = [];
  private lastLight = '';
  /** Urutan pamungkas (hanya klik kanan) — tiap gaya punya urutan sendiri, semuanya terpakai. */
  private heavyIdx = 0;

  private static readonly ALL_LIGHT = [
    'BX_JAB', 'BX_JAB2', 'BX_CROSS', 'BX_LHOOK', 'BX_RHOOK',
    'BX_UPPER', 'BX_BODY', 'BX_SHOVEL', 'BX_OVER', 'BX_CHECK',
  ];
  /** Teknik favorit tiap gaya muncul dua kali per kantong. */
  private static readonly FAVOR: Record<BoxStance, string[]> = {
    ali: ['BX_JAB', 'BX_JAB2', 'BX_CROSS', 'BX_CHECK'],
    tyson: ['BX_LHOOK', 'BX_RHOOK', 'BX_UPPER', 'BX_BODY'],
    ippo: ['BX_BODY', 'BX_SHOVEL', 'BX_OVER', 'BX_LHOOK'],
  };
  static readonly HEAVY_ORDER: Record<BoxStance, string[]> = {
    ali: ['BX_SHUFFLE', 'BX_GAZELLE', 'BX_HEART', 'BX_SMASH', 'BX_DEMPSEY', 'BX_ROLLIN'],
    tyson: ['BX_SMASH', 'BX_ROLLIN', 'BX_HEART', 'BX_GAZELLE', 'BX_DEMPSEY', 'BX_SHUFFLE'],
    ippo: ['BX_DEMPSEY', 'BX_HEART', 'BX_GAZELLE', 'BX_SMASH', 'BX_ROLLIN', 'BX_SHUFFLE'],
  };

  private refillLight() {
    const bag = [...Boxing.ALL_LIGHT, ...Boxing.FAVOR[this.stance]];
    // kocok Fisher-Yates, lalu tarik pembuka (jab) ke depan supaya rangkaian terasa alami
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    const opener = this.stance === 'tyson' ? 'BX_BODY' : 'BX_JAB';
    const k = bag.indexOf(opener);
    if (k > 0) { bag.splice(k, 1); bag.unshift(opener); }
    this.lightBag = bag;
  }

  /** Pukulan ringan berikutnya. Tidak pernah mematikan — hanya mengikis lawan. */
  nextLight(): string {
    this.flow++;
    this.flowT = 0.7;
    if (!this.lightBag.length) this.refillLight();
    let key = this.lightBag.shift()!;
    if (key === this.lastLight && this.lightBag.length) {
      const swap = this.lightBag.shift()!;
      this.lightBag.push(key);
      key = swap;
    }
    this.lastLight = key;
    return key;
  }

  /** Pamungkas berikutnya (klik kanan). Inilah satu-satunya pukulan yang bisa membunuh. */
  nextHeavy(): string {
    const order = Boxing.HEAVY_ORDER[this.stance];
    const key = order[this.heavyIdx % order.length];
    this.heavyIdx++;
    this.roll++;
    this.rollT = 3.2;
    return key;
  }

  /** Nama pamungkas yang akan keluar berikutnya (untuk petunjuk di layar). */
  peekHeavy(): string {
    const order = Boxing.HEAVY_ORDER[this.stance];
    return order[this.heavyIdx % order.length];
  }

  /** Jejak sarung (ghost) digambar sebelum kerangka agar tangan tetap di depan. */
  drawGhosts(ctx: Ctx, d: { glove: string; gloveDark: string; gloveLight: string } = this.def) {
    for (const g of this.ghosts) {
      const k = 1 - g.t / g.max;
      ctx.globalAlpha = k * 0.32;
      pellipse(ctx, g.x, g.y, 1.9 * k + 0.5, 1.7 * k + 0.4, g.front ? d.glove : d.gloveDark);
      ctx.globalAlpha = k * 0.22;
      pellipse(ctx, g.x, g.y, 1.0 * k + 0.25, 0.85 * k + 0.25, d.gloveLight);
    }
    ctx.globalAlpha = 1;
  }

  /** Busur tekanan udara dari ayunan sarung. */
  drawArcs(ctx: Ctx) {
    for (const a of this.arcs) {
      const k = 1 - a.t / a.max;
      ctx.globalAlpha = k * 0.75;
      ctx.strokeStyle = a.c;
      ctx.lineWidth = Math.max(1, 2.2 * k);
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, a.r, a.r * 0.62, 0, a.from, a.to, a.to < a.from);
      ctx.stroke();
      ctx.globalAlpha = k * 0.4;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(a.x, a.y, a.r * 0.92, a.r * 0.57, 0, a.from, a.to, a.to < a.from);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /** Debu langkah Ali Shuffle. */
  static shuffleDust(): { vx: number; vy: number; life: number; s: number } {
    return { vx: rnd(-26, 26), vy: rnd(-14, -3), life: rnd(0.22, 0.4), s: rnd(1, 2) };
  }
}

/** warna tinju Ippo TANPA sarung tangan (kulit + aksen biru muda) untuk fist mode */
export const IPPO_BARE = { glove: '#ffffff', gloveDark: '#9fb4c8', gloveLight: '#ffffff', accent: '#7ce7ff' };
