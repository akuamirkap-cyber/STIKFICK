import { pcircle, pfontO, pline, type Ctx } from './pixel';
import { clamp, rnd } from './rng';
import { GuanDao, TECHS, sampleKeys, segDist, makeTintPal, type Tech, type Geo } from './guandao';
import type { Enemy } from './types';

/**
 * MUSUH PEMAKAI SENJATA — memakai mesin gerak yang SAMA dengan Guan Dao pemain: keyframe halus,
 * jejak tebasan nyata, bayangan senjata, kombo, atraksi putar tongkat, parry dan menghindar.
 */
type G = any;
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const sstep = (k: number) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
function lerpAng(a: number, b: number, k: number) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * k; }
export type TechId = keyof typeof TECHS;

const renderer = new GuanDao();
const palCache = new Map<string, Uint32Array>();
const palOf = (hex: string) => { let p = palCache.get(hex); if (!p) { p = makeTintPal(hex); palCache.set(hex, p); } return p; };
const BASE_SPD = 1.12;
const STR = 9;

interface TrailS { xs: number[]; ys: number[]; t: number }
interface Ghost { x: number; y: number; ux: number; uy: number; roll: number; t: number }

export class Wield {
  tech: Tech | null = null;
  tt = 0; az = 0; fc = 1; speed = 1;
  st = { off: 0.55, ph: 0.55, r: 4 };
  from = { off: 0.55, ph: 0.55, r: 4 };
  roll = 1; rollT = 1;
  trail: TrailS[] = []; ghosts: Ghost[] = []; ghostCd = 0;
  hitDone = false; hitAt = -9; moonDone = false; swoosh = false; time = Math.random() * 10;
  hits = 0;
  boost = false;
  /** mode tim: daftar korban + penanganan damage sendiri (bukan hanya pemain) */
  victims: ((g: G, e: Enemy) => any[]) | null = null;
  hurtFn: ((g: G, e: Enemy, v: any, T: Tech, a: number) => void) | null = null;
  private vhit = new Map<any, number>();
  lite = false;
  rage = false;
  constructor(public tint: string, public kind: string = 'guandao') {}

  get active() { return !!this.tech; }
  cancel() { this.tech = null; }
  start(e: Enemy, T: Tech, aim: number, speed = 1) {
    this.tech = T; this.tt = 0; this.az = aim; this.fc = e.facing || 1; this.speed = speed;
    this.hitDone = false; this.hitAt = -9; this.moonDone = false; this.swoosh = false; this.vhit.clear();
    this.from = { ...this.st };
    const k0 = T.keys[0];
    this.from.off += TAU * Math.round((k0[1] - this.from.off) / TAU);
    this.from.ph += TAU * Math.round((k0[2] - this.from.ph) / TAU);
    this.rollT = T.edge * this.fc;
  }
  geo(e: Enemy): Geo {
    const idle = !this.tech;
    const az = idle ? e.aim : this.az, fc = idle ? (e.facing || 1) : this.fc;
    const th = az + fc * this.st.off, ph = this.st.ph, sc = Math.min(e.scale, 1.5);
    const r = clamp(this.st.r, 0, 8) * sc;
    const sx = e.x, sy = e.y - e.z - 9 * sc;
    const gx = sx + r * Math.cos(th), gy = sy + r * 0.55 * Math.sin(th) + 0.8;
    let ux = Math.cos(th) * Math.cos(ph), uy = 0.7 * Math.sin(th) * Math.cos(ph) - Math.sin(ph);
    const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    const clampTo = (x: number, y: number, m: number) => { const d = Math.hypot(x - sx, y - sy); return d > m ? { x: sx + ((x - sx) * m) / d, y: sy + ((y - sy) * m) / d } : { x, y }; };
    return { G: clampTo(gx, gy, 9.5 * sc), B: clampTo(gx - ux * 5.5, gy - uy * 5.5, 9.5 * sc), ux, uy };
  }
  grips(e: Enemy) { const q = this.geo(e); return { front: q.G, back: q.B }; }

  /** return jumlah pukulan yang kena frame ini */
  update(g: G, e: Enemy, dt: number) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].t -= dt; if (this.trail[i].t <= 0) this.trail.splice(i, 1); }
    for (let i = this.ghosts.length - 1; i >= 0; i--) { this.ghosts[i].t -= dt; if (this.ghosts[i].t <= 0) this.ghosts.splice(i, 1); }
    this.roll += (this.rollT - this.roll) * Math.min(1, dt * 16);
    const T = this.tech;
    if (!T) {
      const run = e.moving;
      const b = Math.sin(this.time * 3.1);
      const tgt = run ? { off: 2.65, ph: 0.82 + 0.06 * Math.sin(this.time * 14), r: 3 } : { off: 0.55, ph: 0.55 + 0.04 * b, r: 4 + 0.3 * b };
      this.st.off += TAU * Math.round((tgt.off - this.st.off) / TAU);
      this.st.ph += TAU * Math.round((tgt.ph - this.st.ph) / TAU);
      const k = Math.min(1, dt * 10);
      this.st.off = lerp(this.st.off, tgt.off, k); this.st.ph = lerp(this.st.ph, tgt.ph, k); this.st.r = lerp(this.st.r, tgt.r, k);
      this.rollT = this.roll >= 0 ? 1 : -1;
      return 0;
    }
    const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
    let hits = 0;
    for (let i = 0; i < n && this.tech; i++) {
      this.tt += h * BASE_SPD * this.speed;
      const [off, ph, r] = sampleKeys(T.keys, this.tt);
      const bl = sstep(this.tt / 0.07);
      this.st.off = lerp(this.from.off, off, bl); this.st.ph = lerp(this.from.ph, ph, bl); this.st.r = lerp(this.from.r, r, bl);
      if (this.tt < T.hit[0] * 0.8 && !T.dmgless) this.az = lerpAng(this.az, e.aim, Math.min(1, h * 6));
      const q = this.geo(e);
      if (T.lunge && this.tt >= T.lunge[0] && this.tt <= T.lunge[1]) { const sp = T.lunge[2] * BASE_SPD * this.speed * 0.8; e.kx = Math.cos(this.az) * sp; e.ky = Math.sin(this.az) * sp * 0.8; }
      const strike = this.tt >= T.hit[0] - 0.04 && this.tt <= T.hit[1] + 0.06;
      if (strike || T.dmgless) {
        const xs: number[] = [], ys: number[] = [];
        for (let k = 0; k < STR; k++) { const d = 9 + (k / (STR - 1)) * 20; xs.push(q.G.x + q.ux * d); ys.push(q.G.y + q.uy * d); }
        this.trail.push({ xs, ys, t: 0.22 });
        if (this.trail.length > 70) this.trail.shift();
        this.ghostCd -= h;
        if (this.ghostCd <= 0 && !this.lite) { this.ghostCd = 0.02; this.ghosts.push({ x: q.G.x, y: q.G.y, ux: q.ux, uy: q.uy, roll: this.roll, t: 0.13 }); }
      }
      if (!this.swoosh && this.tt >= T.hit[0] - 0.05 && !T.dmgless) { this.swoosh = true; g.sfx?.slash?.(T.heavy ? 0.7 : 1.0); g.sfx?.whoosh?.(); }
      if (!T.dmgless && this.tt >= T.hit[0] && this.tt <= T.hit[1] && g.state === 'playing') hits += this.tryHit(g, e, T, q);
      if (T.id === 'moon' && !this.moonDone && this.tt >= 0.2) {
        this.moonDone = true;
        g.fireEnemyBullet?.(e, this.az, 240, 1, 'orb', this.tint);
        g.fireEnemyBullet?.(e, this.az + 0.18, 220, 1, 'orb', this.tint);
        g.fireEnemyBullet?.(e, this.az - 0.18, 220, 1, 'orb', this.tint);
        g.sfx?.axeSwing?.();
      }
      if (this.tt >= T.dur) {
        this.tech = null;
        const gt = { off: 0.55, ph: 0.55 };
        this.st.off += TAU * Math.round((gt.off - this.st.off) / TAU);
        this.st.ph += TAU * Math.round((gt.ph - this.st.ph) / TAU);
      }
    }
    return hits;
  }

  private tryHit(g: G, e: Enemy, T: Tech, q: Geo): number {
    if (this.victims) {
      const X0 = q.G.x + q.ux * 8, Y0 = q.G.y + q.uy * 8, X1 = q.G.x + q.ux * 33, Y1 = q.G.y + q.uy * 33;
      let n = 0;
      for (const v of this.victims(g, e)) {
        if (v.dead) continue;
        const last = this.vhit.get(v);
        if (last !== undefined && (!T.rehit || this.tt - last < T.rehit)) continue;
        let dd = 999;
        for (const oy of [-1, -5, -10]) dd = Math.min(dd, segDist(v.x, v.y - (v.z ?? 0) + oy, X0, Y0, X1, Y1));
        if (dd > (v.r ?? 4) * 0.8 + 3.6) continue;
        this.vhit.set(v, this.tt); n++;
        const ang = Math.atan2(v.y - e.y, v.x - e.x);
        this.hurtFn?.(g, e, v, T, ang);
        g.particles?.spark?.(v.x, v.y - 7, 5, '#ffffff', ang, 1.1, 200);
        g.particles?.spark?.(v.x, v.y - 7, 3, this.tint, ang, 1.3, 150);
      }
      return n;
    }
    if (this.hitDone && !T.rehit) return 0;
    if (T.rehit && this.tt - this.hitAt < T.rehit) return 0;
    const p = g.player;
    const x0 = q.G.x + q.ux * 8, y0 = q.G.y + q.uy * 8, x1 = q.G.x + q.ux * 33, y1 = q.G.y + q.uy * 33;
    let d = 999;
    for (const oy of [-1, -5, -10]) d = Math.min(d, segDist(p.x, p.y - (p.z ?? 0) + oy, x0, y0, x1, y1));
    if (d > (p.r ?? 4) * 0.8 + 3.6) return 0;
    this.hitDone = true; this.hitAt = this.tt; this.hits++;
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    g.damagePlayer?.(T.heavy || this.boost ? 2 : 1, a, !!(T.heavy || T.launch || T.id === 'taishan' || this.boost));
    g.particles?.spark?.(p.x, p.y - 7, 6, '#ffffff', a, 1.1, 200);
    g.particles?.spark?.(p.x, p.y - 7, 4, this.tint, a, 1.4, 150);
    return 1;
  }

  draw(g: G, ctx: Ctx, e: Enemy) {
    // jejak
    const tr = this.trail;
    for (let i = 1; i < tr.length; i++) {
      const a = tr[i - 1], b = tr[i];
      if (Math.abs(a.t - b.t) > 0.05) continue;
      const age = 1 - clamp(b.t / 0.22, 0, 1), al = Math.pow(1 - age, 1.4);
      if (al < 0.05) continue;
      for (let k = 0; k < STR; k++) {
        const f = k / (STR - 1);
        if (f < age * 0.5) continue;
        ctx.globalAlpha = al * (f > 0.3 ? 0.9 : 0.5);
        pline(ctx, a.xs[k], a.ys[k], b.xs[k], b.ys[k], k >= STR - 1 ? '#ffffff' : k >= STR - 3 ? '#ffe9e0' : this.rage ? '#ff4a3a' : this.tint, k >= STR - 2 || k % 2 === 0 ? 2 : 1);
      }
    }
    ctx.globalAlpha = 1;
    if (this.rage) {
      for (let i = 0; i < 5; i++) pcircle(ctx, e.x + rnd(-8, 8), e.y - e.z - rnd(0, 20), 0.5, Math.random() < 0.5 ? '#ff3b2b' : '#ff9a3a');
    }
    const pal = palOf(this.tint);
    for (const gh of this.ghosts) renderer.drawSprite(ctx, gh.x, gh.y, gh.ux, gh.uy, gh.roll, clamp(gh.t / 0.13, 0, 1) * 0.28, null, pal);
    const q = this.geo(e);
    if (this.kind !== 'guandao') { drawKindWeapon(ctx, this.kind, q, this.roll, this.tint, e); pcircle(ctx, q.G.x, q.G.y, 1, '#ffffff'); this.drawTell(g, ctx, e); return; }
    renderer.drawSprite(ctx, q.G.x, q.G.y, q.ux, q.uy, this.roll, 1, this.tech && this.tech.heavy && this.tt > this.tech.hit[0] - 0.05 && this.tt < this.tech.hit[1] + 0.05 ? this.tint : null, pal);
    pcircle(ctx, q.G.x, q.G.y, 1, '#ffffff');
    this.drawTell(g, ctx, e);
  }
  private drawTell(g: G, ctx: Ctx, e: Enemy) {
    if (this.tech && !this.tech.dmgless && this.tt < this.tech.hit[0] && g.state === 'playing') pfontO(ctx, '!', e.x, e.y - e.z - 24 * Math.min(e.scale, 1.5), Math.floor(g.time * 20) % 2 ? '#ff3b3b' : '#ffffff', '#000', 1, 'center');
  }
}

/** senjata lain (katana, kapak, pedang kembar, buster) digambar piksel mengikuti arah ayunan */
function drawKindWeapon(ctx: Ctx, kind: string, q: Geo, roll: number, tint: string, e: Enemy) {
  const { G, B, ux, uy } = q;
  const nx = -uy, ny = ux;
  const P = (d: number, s = 0) => ({ x: G.x + ux * d + nx * s, y: G.y + uy * d + ny * s });
  const line = (a: { x: number; y: number }, b: { x: number; y: number }, c: string, wd: number) => pline(ctx, a.x, a.y, b.x, b.y, c, wd);
  const r = roll >= 0 ? 1 : -1;
  if (kind === 'katana') {
    line(P(-8), P(2), '#0b0b12', 4); line(P(-8), P(2), '#3b2a6b', 2);
    for (let i = -7; i < 2; i += 2) { const a = P(i, -1), b = P(i + 1, 1); px2(ctx, a.x, a.y, '#a58cff'); px2(ctx, b.x, b.y, '#a58cff'); }
    line(P(3, -4), P(3, 4), '#0b0b12', 3); line(P(3, -3), P(3, 3), '#e0b84a', 1);
    line(P(4), P(38), '#0b0b12', 3); line(P(4), P(37), '#cfd8e2', 1); line(P(5, r), P(36, r * 0.6), '#ffffff', 1);
    line(P(37), P(40, -r), '#ffffff', 1);
  } else if (kind === 'axe') {
    line(P(-9), P(30), '#0b0b12', 4); line(P(-9), P(30), '#7b4a22', 2); line(P(-9), P(-3), '#2a1a0a', 2);
    line(P(22, 0), P(30, -9 * r), '#0b0b12', 5); line(P(30, -9 * r), P(36, 0), '#0b0b12', 5); line(P(36, 0), P(30, 6 * r), '#0b0b12', 4);
    line(P(23, -1 * r), P(30, -8 * r), '#9aa3b0', 3); line(P(30, -8 * r), P(35, 0), '#9aa3b0', 3); line(P(30, -9 * r), P(36, -1), '#ffffff', 1);
    pcircle(ctx, P(30).x, P(30).y, 1.4, '#e0b84a');
  } else if (kind === 'dual') {
    for (const [o, sg] of [[G, 1], [B, -1]] as const) {
      const dx = ux * Math.cos(0.55 * sg) - uy * Math.sin(0.55 * sg), dy = ux * Math.sin(0.55 * sg) + uy * Math.cos(0.55 * sg);
      const a = { x: o.x + dx * 2, y: o.y + dy * 2 }, b = { x: o.x + dx * 24, y: o.y + dy * 24 };
      line({ x: o.x - dx * 4, y: o.y - dy * 4 }, a, '#3b2a6b', 2);
      pline(ctx, o.x - dy * 3, o.y + dx * 3, o.x + dy * 3, o.y - dx * 3, '#e0b84a', 1);
      line(a, b, '#0b0b12', 3); line(a, b, '#e6ecf4', 1); px2(ctx, b.x, b.y, '#ffffff');
    }
  } else if (kind === 'bat') {
    line(P(-6), P(3), '#0b0b12', 3); line(P(-6), P(3), '#2b2b33', 1); pcircle(ctx, P(-6).x, P(-6).y, 1.3, '#c9a063');
    line(P(4), P(14), '#0b0b12', 4); line(P(4), P(14), '#d9a866', 2);
    line(P(14), P(28), '#0b0b12', 6); line(P(14), P(27), '#e6b877', 4); line(P(15, -1.5 * r), P(26, -1.5 * r), '#fff1cf', 1);
    line(P(28), P(30), '#e6b877', 3);
  } else if (kind === 'buster') {
    line(P(-9), P(4), '#0b0b12', 4); line(P(-9), P(4), '#a31538', 2);
    line(P(5, -6), P(5, 6), '#0b0b12', 3); line(P(5, -5), P(5, 5), '#8f98a2', 1);
    line(P(6), P(40), '#0b0b12', 8); line(P(6), P(39), '#7c858e', 6); line(P(7, -2 * r), P(38, -2 * r), '#aab4bd', 2); line(P(7, 2 * r), P(39, 2 * r), '#e8f0f6', 2);
    line(P(40), P(44, 0), '#e8f0f6', 2); pcircle(ctx, P(12, 0).x, P(12, 0).y, 1.2, tint);
  }
  void e;
}
function px2(ctx: Ctx, x: number, y: number, c: string) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }

export function techForFoe(name: string): TechId[] {
  switch (name) {
    case 'RENGGA': return ['sweep', 'reverse', 'thrust'];
    case 'SASUKE': return ['sweep', 'reverse', 'twirl'];
    case 'BRUNO': return ['sweep', 'taishan', 'reverse'];
    case 'KAORI': return ['thrust', 'sweep', 'moon'];
    case 'GURU': return ['sweep', 'reverse', 'twirl', 'whirl', 'moon', 'taishan'];
    default: return ['sweep', 'reverse'];
  }
}
export function pickTech(list: TechId[], chain: number, d: number, skill: number): Tech {
  let id = list[(chain - 1) % list.length];
  if (Math.random() < 0.3) id = list[Math.floor(Math.random() * list.length)];
  if (d > 62 && list.includes('thrust')) id = 'thrust';
  else if (d > 70 && list.includes('moon') && skill > 0.5) id = 'moon';
  return TECHS[id];
}
export function wieldSpeed(skill: number) { return 0.92 + skill * 0.4; }

// ============================================================ MUSUH SURVIVAL: PENDEKAR TOMBAK
export interface WielderAI {
  w: Wield; techs: TechId[]; skill: number; cd: number; chain: number; chainMax: number; windT: number;
  guardT: number; parryCd: number; dodgeT: number; dodgeCd: number; strafe: number; strafeT: number; showT: number; riposte: number; flashT: number; hurtCd: number;
  boss?: boolean;
  fe?: boolean;
}
const TINTS = ['#ff5a4a', '#4b9bff', '#b24dff', '#ffb02e', '#2ee6c8'];
const W = (e: Enemy) => (e as unknown as { ai2?: WielderAI }).ai2;
export const isWielder = (e: Enemy) => !!W(e);

export function makeWielder(_g: G, e: Enemy, wave: number) {
  const skill = clamp(0.38 + wave * 0.045, 0.38, 0.95);
  const tint = TINTS[Math.floor(Math.random() * TINTS.length)];
  const techs: TechId[] = ['sweep', 'reverse'];
  if (skill > 0.45) techs.push('twirl', 'thrust');
  if (skill > 0.65) techs.push('taishan', 'moon');
  if (skill > 0.8) techs.push('whirl');
  Object.assign(e, { name: 'PENDEKAR', color: tint, color2: '#ffffff', accessory: 'band', hp: Math.round(e.hp * 0.9 + 14 + wave * 2.2), maxHp: Math.round(e.hp * 0.9 + 14 + wave * 2.2), kbRes: 0.5, speed: 82 + skill * 24, value: 60 });
  e.maxHp = e.hp;
  (e as unknown as { ai2: WielderAI }).ai2 = { w: new Wield(tint), techs, skill, cd: rnd(0.4, 1), chain: 0, chainMax: 2, windT: 0, guardT: 0, parryCd: 0.5, dodgeT: 0, dodgeCd: 0.5, strafe: 1, strafeT: 1, showT: rnd(1.5, 3.5), riposte: 0, flashT: 0, hurtCd: 0 };
}

/** dipanggil di awal updateEnemy */
export function wielderPre(e: Enemy) {
  const A = W(e);
  if (!A) return;
  if (A.boss && (A.w.tech || A.windT > 0) && e.stagger <= 0) { e.stun = 0; e.down = 0; return; }
  if (e.stagger > 0 || e.stun > 0 || e.down > 0 || e.z > 0) { A.w.cancel(); A.windT = 0; A.guardT = 0; A.chain = 0; }
}

/** parry & hindar saat dipukul: true = serangan ditahan */
export function wielderOnHit(g: G, e: Enemy, dir: number, dmg: number): boolean {
  const A = W(e);
  if (!A) return false;
  if (A.dodgeT > 0) { g.texts?.hit?.(e.x, e.y - 24, 'MELESET!', '#cfd8ff', 1, 0.5); return true; }
  if (A.flashT > 0 && dmg < 12) return true;
  if (A.guardT <= 0) return false;
  const front = Math.abs(lerpAng(0, dir + Math.PI - e.aim, 1)) < 1.5;
  if (!front) return false;
  if (dmg >= 12) { A.guardT = 0; e.stun = 0.7; e.state = 'stun'; g.say?.('GUARD BREAK!', '#ffd447', 2, 0.8); return false; }
  const p = g.player;
  A.guardT = 0; A.flashT = 0.28; A.riposte = 0.18; A.parryCd = A.boss ? 0.5 : 1.5 - A.skill * 0.6;
  p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
  p.stunT = Math.max(p.stunT ?? 0, 0.16); p.fireCd = Math.max(p.fireCd ?? 0, 0.26);
  p.kx = -Math.cos(dir) * 190; p.ky = -Math.sin(dir) * 190;
  g.sfx?.parry?.(); g.flash?.(A.w.tint, 0.14); g.shake?.(0.4); g.hitstop = Math.max(g.hitstop ?? 0, 0.06);
  g.particles?.ring?.(e.x, e.y - 8, 3, 18, A.w.tint, 0.22, 2);
  g.particles?.spark?.(e.x, e.y - 8, 12, '#ffffff', dir + Math.PI, 1.2, 230);
  g.texts?.hit?.(e.x, e.y - 26, 'PARRY!', '#ffd27f', 1, 0.7);
  return true;
}

export function aiWielder(g: G, e: Enemy, dt: number, d: number, ang: number) {
  const A = W(e)!, p = g.player;
  const hits = A.w.update(g, e, dt);
  void hits;
  A.cd -= dt; A.parryCd -= dt; A.dodgeCd -= dt; A.showT -= dt; A.strafeT -= dt;
  if (A.guardT > 0) A.guardT -= dt;
  if (A.dodgeT > 0) A.dodgeT -= dt;
  if (A.flashT > 0) A.flashT -= dt;
  e.aim = lerpAng(e.aim, ang, Math.min(1, dt * (A.w.tech ? 4 : 9)));
  e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;
  e.bodyAim = e.aim;
  e.state = 'chase';
  // sedang menyerang: tubuh mengikuti pose tekniknya
  if (A.w.tech) {
    const T = A.w.tech;
    e.pose = T.pose as Enemy['pose']; e.poseDur = T.dur / (BASE_SPD * A.w.speed); e.poseT = Math.min(1, A.w.tt / T.dur) ;
    e.poseT = lerp(T.poseMap[0], T.poseMap[1], clamp(A.w.tt / T.dur, 0, 1));
    e.poseDur = 1e6;
    return;
  }
  if (A.windT > 0) {
    A.windT -= dt; e.pose = 'windup'; e.poseT = 0.5; e.poseDur = 1e6;
    if (A.windT <= 0) {
      // tipuan bos: pura-pura menyerang, melipir, lalu menghukum
      if (A.boss && A.chain === 0 && !A.fe && Math.random() < 0.14 + A.skill * 0.12) {
        A.fe = true; const pa = ang + A.strafe * Math.PI / 2; e.kx += Math.cos(pa) * 260 - Math.cos(ang) * 50; e.ky += Math.sin(pa) * 260 - Math.sin(ang) * 50;
        g.particles?.smoke?.(e.x, e.y, 2, '#cfcfcf', 20, 0.25); A.windT = 0.2; e.pose = 'dash'; return;
      }
      A.fe = false;
      let T = pickTech(A.techs, A.chain + 1, d, A.skill);
      if (A.boss && d > 62) { const gap = A.techs.filter((k) => TECHS[k].lunge && TECHS[k].lunge![2] >= 110 && !TECHS[k].dmgless); if (gap.length) T = TECHS[gap[Math.floor(Math.random() * gap.length)]]; }
      A.w.start(e, T, ang, wieldSpeed(A.skill));
      A.chain++;
    }
    return;
  }
  if (A.chain > 0) {
    // sambung kombo atau selesai
    if (A.chain < A.chainMax && d < (A.boss ? 78 : 56) && Math.random() < (A.boss ? 0.88 : 0.6 + A.skill * 0.3)) { A.windT = A.boss ? 0.02 : 0.12; if (A.boss && d > 40) { e.kx += Math.cos(ang) * 120; e.ky += Math.sin(ang) * 120; } return; }
    if (A.boss && Math.random() < 0.4) { const pa = ang + A.strafe * Math.PI / 2; e.kx += Math.cos(pa) * 280; e.ky += Math.sin(pa) * 280; A.dodgeT = 0.2; A.riposte = 0.12; g.particles?.smoke?.(e.x, e.y, 3, '#cfcfcf', 22, 0.3); }
    A.chain = 0; A.cd = (A.boss ? 0.14 : 0.55) + (1 - A.skill) * (A.boss ? 0.3 : 1.0); A.chainMax = (A.boss ? 4 : 2) + (Math.random() < A.skill ? 1 : 0) + (Math.random() < A.skill * (A.boss ? 0.9 : 0.4) ? (A.boss ? 2 : 1) : 0);
  }
  if (A.guardT > 0) { e.pose = 'parry'; e.poseT = 0.5; e.poseDur = 1e6; return; }
  if (A.dodgeT > 0) { e.pose = 'dash'; return; }
  e.pose = 'idle'; e.poseT = 0; e.poseDur = 1;
  // ---- membaca pemain
  const gdTech = g.gd?.tech && !g.gd.tech.dmgless;
  const pAtk = p.attackPhase === 'windup' || p.attackPhase === 'active' || !!gdTech;
  if (A.riposte > 0) { A.riposte -= dt; if (A.riposte <= 0) { A.chain = 0; A.chainMax = 3; A.windT = 0.08; return; } }
  if (pAtk && d < 56) {
    const react = Math.min(1, dt * 8);
    if (A.parryCd <= 0 && Math.random() < (0.22 + A.skill * 0.5 + (A.boss ? 0.2 : 0)) * react) { A.guardT = 0.32; A.parryCd = A.boss ? 0.3 : 0.5; g.particles?.ring?.(e.x, e.y - 8, 3, 14, A.w.tint, 0.22, 1); g.sfx?.leverClack?.(); return; }
    if (A.dodgeCd <= 0 && Math.random() < A.skill * 0.35 * react) {
      A.dodgeT = 0.24; A.dodgeCd = 1.6 - A.skill * 0.6;
      const pa = ang + A.strafe * Math.PI / 2; e.kx += Math.cos(pa) * 300; e.ky += Math.sin(pa) * 300;
      g.particles?.smoke?.(e.x, e.y, 3, '#cfcfcf', 22, 0.3); g.sfx?.dash?.();
      return;
    }
  }
  // ---- gerak: jaga jarak ideal, memutari pemain
  const ideal = A.boss ? 30 : 34;
  let mx = 0, my = 0;
  if (A.strafeT <= 0) { A.strafeT = rnd(0.6, 1.4); A.strafe = Math.random() < 0.5 ? 1 : -1; }
  if (d > ideal + 6) { mx = Math.cos(ang); my = Math.sin(ang); } else if (d < ideal - 10) { mx = -Math.cos(ang); my = -Math.sin(ang); }
  mx += -Math.sin(ang) * A.strafe * 0.5; my += Math.cos(ang) * A.strafe * 0.5;
  const ml = Math.hypot(mx, my) || 1;
  const sp = e.speed * (d > 90 ? 1.45 : 1);
  e.vx = (mx / ml) * sp; e.vy = (my / ml) * sp; e.moving = true;
  // bos: menerjang dari jauh dengan serangan penutup jarak, atau menembakkan gelombang energi
  if (A.boss && A.cd <= 0 && d >= 62 && d < 170 && g.state === 'playing') {
    A.cd = 0.35; A.chain = 0; A.chainMax = 3 + (Math.random() < A.skill ? 2 : 0); A.windT = 0.1;
    if (A.techs.includes('moon') && d > 100 && Math.random() < 0.4) { A.w.start(e, TECHS.moon, ang, wieldSpeed(A.skill)); A.windT = 0; A.chain = 1; }
    return;
  }
  // atraksi pamer saat jauh
  if (A.showT <= 0 && d > 90) { A.showT = rnd(4, 8); A.w.start(e, TECHS[Math.random() < 0.5 ? 'flourish' : 'fig8'], ang, 1); }
  if (p.attackPhase === 'recover' && d < 60) A.cd = Math.min(A.cd, 0.1);
  if (A.cd <= 0 && d < (A.boss ? 62 : 50) && g.state === 'playing') { A.windT = (A.boss ? 0.14 : 0.32) - A.skill * (A.boss ? 0.06 : 0.14); A.chain = 0; A.chainMax = A.boss ? Math.max(A.chainMax, 4) : A.chainMax; }
  const cur = A.w.tech as Tech | null;
  if (cur && cur.dmgless && d < 60) A.w.cancel();
}

export function drawWielder(g: G, ctx: Ctx, e: Enemy) { const A = W(e); if (A) A.w.draw(g, ctx, e); }
export function wielderGrips(e: Enemy) { const A = W(e); return A ? A.w.grips(e) : null; }

// ============================================================ BOS STORY BERSENJATA
export interface WeaponBossCfg { kind: string; techs: TechId[]; skill: number; tint: string; name: string; hp: number; scale?: number }
export function makeWeaponBoss(_g: G, e: Enemy, cfg: WeaponBossCfg) {
  Object.assign(e, { name: cfg.name, color: cfg.tint, color2: '#ffffff', accessory: 'helmet', scale: cfg.scale ?? 1.25, r: 7, hp: cfg.hp, maxHp: cfg.hp, maxStructure: cfg.hp * 1.1, structure: 0, kbRes: 0.7, armor: true, speed: 96 + cfg.skill * 26, value: 300, elite: true, eyeStyle: 'white' });
  (e as unknown as { ai2: WielderAI }).ai2 = { w: new Wield(cfg.tint, cfg.kind), techs: cfg.techs, skill: cfg.skill, cd: 0.8, chain: 0, chainMax: 3, windT: 0, guardT: 0, parryCd: 0.5, dodgeT: 0, dodgeCd: 0.5, strafe: 1, strafeT: 1, showT: 99, riposte: 0, flashT: 0, hurtCd: 0, boss: true } as WielderAI;
}
