// NUNCHAKU V3 — FIRE TRAIL.
// Jejak api pendek bergaya atraksi: pita panas mengikuti ujung tongkat, lidah api yang
// naik karena daya apung, bara yang terlempar, dan asap tipis di ujung jejak.
// Semua digambar dua lapis: cahaya aditif (bloom) + inti piksel tajam supaya tetap
// terbaca sebagai api sungguhan, bukan garis warna.
import { pcircle, prect, type Ctx } from './pixel';
import { rnd } from './rng';

const TAU = Math.PI * 2;

/** Umur jejak (detik). Sengaja pendek supaya tidak jadi garis panjang yang menutupi layar. */
const RIBBON_LIFE = 0.17;
const RIBBON_MAX = 14;
const FLAME_MAX = 190;
const EMBER_MAX = 90;
const SMOKE_MAX = 34;

interface Node { x: number; y: number; t: number; w: number }
interface Flame { x: number; y: number; vx: number; vy: number; t: number; max: number; s: number; seed: number; hot: number }
interface Ember { x: number; y: number; vx: number; vy: number; t: number; max: number; seed: number }
interface Smoke { x: number; y: number; vx: number; vy: number; t: number; max: number; s: number }

/** Tanjakan warna api: putih panas -> kuning -> jingga -> merah -> bara gelap. */
function flameColor(u: number, hot: number) {
  const k = u / Math.max(0.35, hot);
  if (k < 0.1) return '#fff3cf';
  if (k < 0.26) return '#ffd257';
  if (k < 0.46) return '#ff9c22';
  if (k < 0.68) return '#f2600f';
  if (k < 0.86) return '#c22d0a';
  return '#7a1c07';
}

export class FireTrail {
  nodes: Node[] = [];
  flames: Flame[] = [];
  embers: Ember[] = [];
  smoke: Smoke[] = [];
  /** 0..1 — seberapa menyala senjata saat ini (naik saat berputar cepat). */
  heat = 0;
  private last = { x: 0, y: 0, has: false };
  private carry = 0;
  private smokeCarry = 0;
  time = 0;

  reset() {
    this.nodes.length = 0; this.flames.length = 0; this.embers.length = 0; this.smoke.length = 0;
    this.heat = 0; this.last.has = false; this.carry = 0; this.smokeCarry = 0;
  }

  /**
   * Rekam posisi ujung tongkat. Kecepatan menentukan lebar pita, jumlah lidah api,
   * dan seberapa putih inti apinya — jadi api benar-benar bereaksi pada gerakan.
   */
  emit(x: number, y: number, speed: number, dt: number, boost = 1) {
    this.time += dt;
    const sp = Math.min(1, speed / 260);
    this.heat += (Math.min(1, sp * 1.25) * boost - this.heat) * Math.min(1, dt * 9);
    if (!this.last.has) this.last = { x, y, has: true };

    const dx = x - this.last.x, dy = y - this.last.y;
    const moved = Math.hypot(dx, dy);
    // lompatan jauh = teleport / ganti adegan: jangan tarik garis panjang melintasi layar
    if (moved > 60) { this.nodes.length = 0; this.last.x = x; this.last.y = y; return; }
    // sisipkan titik di antara frame supaya pita tetap mulus saat ayunan sangat cepat
    const steps = Math.min(4, Math.max(1, Math.round(moved / 3)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      this.nodes.unshift({ x: this.last.x + dx * t, y: this.last.y + dy * t, t: 0, w: 1.1 + sp * 2.6 });
    }
    while (this.nodes.length > RIBBON_MAX) this.nodes.pop();

    // lidah api lahir di sepanjang lintasan, bukan hanya di ujung
    const rate = (14 + sp * 210) * boost;
    this.carry += rate * dt;
    while (this.carry >= 1) {
      this.carry -= 1;
      if (this.flames.length >= FLAME_MAX) break;
      const t = Math.random();
      const fx = this.last.x + dx * t, fy = this.last.y + dy * t;
      const nx = moved > 0.01 ? -dy / moved : 0, ny = moved > 0.01 ? dx / moved : 0;
      const off = rnd(-1.6, 1.6);
      this.flames.push({
        x: fx + nx * off, y: fy + ny * off,
        vx: dx / Math.max(dt, 0.001) * 0.1 + rnd(-14, 14),
        vy: dy / Math.max(dt, 0.001) * 0.1 + rnd(-16, 4),
        t: 0, max: rnd(0.2, 0.42) + sp * 0.12,
        s: rnd(1.1, 2.4) + sp * 1.3,
        seed: rnd(0, TAU), hot: 0.7 + sp * 0.35,
      });
    }

    // bara: hanya saat ayunan kencang, biar tidak jadi hujan titik terus-menerus
    if (sp > 0.35 && Math.random() < sp * 0.85) {
      if (this.embers.length < EMBER_MAX) {
        this.embers.push({
          x, y,
          vx: dx / Math.max(dt, 0.001) * rnd(0.12, 0.3) + rnd(-26, 26),
          vy: dy / Math.max(dt, 0.001) * rnd(0.12, 0.3) + rnd(-34, 6),
          t: 0, max: rnd(0.35, 0.85), seed: rnd(0, TAU),
        });
      }
    }

    // asap tipis di belakang jejak
    this.smokeCarry += (1.5 + sp * 7) * dt;
    while (this.smokeCarry >= 1) {
      this.smokeCarry -= 1;
      if (this.smoke.length >= SMOKE_MAX) break;
      this.smoke.push({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-6, 6), vy: rnd(-16, -7), t: 0, max: rnd(0.45, 0.9), s: rnd(1.4, 2.8) });
    }
    this.last.x = x; this.last.y = y;
  }

  /** Ledakan api saat tongkat menghantam. */
  burst(x: number, y: number, dir: number, power = 1) {
    const n = Math.round(16 + power * 26);
    for (let i = 0; i < n && this.flames.length < FLAME_MAX; i++) {
      const a = dir + rnd(-1.5, 1.5);
      const sp = rnd(30, 150) * (0.6 + power);
      this.flames.push({
        x: x + rnd(-2, 2), y: y + rnd(-2, 2),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(4, 26),
        t: 0, max: rnd(0.24, 0.55), s: rnd(1.6, 3.4) * (0.8 + power * 0.5),
        seed: rnd(0, TAU), hot: 1,
      });
    }
    for (let i = 0; i < 10 + power * 14 && this.embers.length < EMBER_MAX; i++) {
      const a = dir + rnd(-2.2, 2.2), sp = rnd(60, 240) * (0.5 + power);
      this.embers.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(10, 50), t: 0, max: rnd(0.4, 1), seed: rnd(0, TAU) });
    }
    for (let i = 0; i < 5 && this.smoke.length < SMOKE_MAX; i++) {
      this.smoke.push({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-14, 14), vy: rnd(-26, -10), t: 0, max: rnd(0.6, 1.1), s: rnd(2.2, 4) });
    }
    this.heat = 1;
  }

  update(dt: number) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      this.nodes[i].t += dt;
      if (this.nodes[i].t >= RIBBON_LIFE) this.nodes.splice(i, 1);
    }
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.t += dt;
      if (f.t >= f.max) { this.flames.splice(i, 1); continue; }
      const u = f.t / f.max;
      // daya apung + turbulensi: api naik dan bergoyang, tidak lurus kaku
      f.vy -= (52 + 40 * (1 - u)) * dt;
      f.vx += Math.sin(this.time * 11 + f.seed) * 34 * dt;
      f.vx *= 1 - Math.min(1, 3.1 * dt);
      f.vy *= 1 - Math.min(1, 1.5 * dt);
      f.x += f.vx * dt; f.y += f.vy * dt;
    }
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.t += dt;
      if (e.t >= e.max) { this.embers.splice(i, 1); continue; }
      e.vy += 46 * dt;                       // bara akhirnya jatuh
      e.vx += Math.sin(this.time * 7 + e.seed) * 12 * dt;
      e.vx *= 1 - Math.min(1, 1.6 * dt);
      e.x += e.vx * dt; e.y += e.vy * dt;
    }
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.t += dt;
      if (s.t >= s.max) { this.smoke.splice(i, 1); continue; }
      s.vy -= 9 * dt; s.vx *= 1 - Math.min(1, 0.9 * dt);
      s.x += s.vx * dt; s.y += s.vy * dt;
    }
    this.heat *= 1 - Math.min(1, dt * 1.6);
  }

  /** Asap digambar di bawah senjata. */
  drawSmoke(ctx: Ctx) {
    if (!this.smoke.length) return;
    for (const s of this.smoke) {
      const u = s.t / s.max;
      ctx.globalAlpha = (1 - u) * 0.2;
      ctx.fillStyle = u < 0.4 ? '#4a3a34' : '#2a2422';
      const r = s.s * (1 + u * 2.1);
      pcircle(ctx, s.x, s.y, r, ctx.fillStyle as string);
    }
    ctx.globalAlpha = 1;
  }

  /** Pita api + lidah api + bara. Dipanggil sebelum tongkat agar senjatanya tetap tajam. */
  draw(ctx: Ctx) {
    const nodes = this.nodes;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalCompositeOperation = 'source-over';

    // 1) Pita api digambar NORMAL dulu (bukan aditif). Di atas rumput terang, lapisan
    //    aditif langsung memutih; tubuh jingga-merah pekat inilah yang membuat apinya
    //    terbaca sebagai api, bukan garis cahaya.
    if (nodes.length > 1) {
      const passes = [
        { w: 2.0, c: '#5e1405', a: 0.45 },  // tepi hangus: memisahkan api dari rumput
        { w: 1.35, c: '#c92f08', a: 0.8 },  // merah bara
        { w: 0.85, c: '#ff6a12', a: 0.92 }, // tubuh jingga
        { w: 0.42, c: '#ffb02e', a: 0.95 }, // lidah kuning
      ];
      for (const ps of passes) {
        for (let i = nodes.length - 1; i >= 1; i--) {
          const a = nodes[i], b = nodes[i - 1];
          const life = 1 - a.t / RIBBON_LIFE;
          // lebar berdenyut per titik -> tepi api bergerigi, bukan cincin pejal
          const flick = 0.72 + 0.5 * Math.abs(Math.sin(a.x * 0.7 + a.y * 0.9 + this.time * 26));
          const taper = life * life * flick;             // menipis cepat ke ekor
          ctx.globalAlpha = ps.a * Math.min(1, taper * 1.3);
          ctx.strokeStyle = ps.c;
          ctx.lineWidth = Math.max(1, a.w * ps.w * taper);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // inti putih-panas: aditif tipis saja, hanya di bagian termuda
      ctx.globalCompositeOperation = 'lighter';
      for (let i = Math.min(nodes.length - 1, 6); i >= 1; i--) {
        const a = nodes[i], b = nodes[i - 1];
        const taper = Math.pow(1 - a.t / RIBBON_LIFE, 3);
        ctx.globalAlpha = 0.4 * taper;
        ctx.strokeStyle = '#ffeec0';
        ctx.lineWidth = Math.max(1, a.w * 0.4 * taper);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // 2) bloom kecil hanya pada lidah api yang masih sangat muda
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.flames) {
      const u = f.t / f.max;
      if (u > 0.4) continue;
      const r = f.s * (1.7 - u);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(0.6, r));
      g.addColorStop(0, flameColor(u, f.hot));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = (1 - u / 0.4) * 0.2;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, Math.max(0.6, r), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // 3) inti piksel tajam: inilah yang membuat apinya tetap menyatu dengan gaya pixel art
    for (const f of this.flames) {
      const u = f.t / f.max;
      const s = Math.max(1, Math.round(f.s * (1 - u * 0.75)));
      ctx.globalAlpha = u < 0.75 ? 1 : (1 - u) / 0.25;
      prect(ctx, f.x - s / 2, f.y - s / 2, s, s, flameColor(u, f.hot));
      if (u < 0.3 && s > 1) prect(ctx, f.x - 0.5, f.y - s / 2 - 1, 1, 1, '#fffdf2');
    }

    // 4) bara berkedip
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      const u = e.t / e.max;
      const flick = 0.55 + 0.45 * Math.sin(this.time * 30 + e.seed);
      ctx.globalAlpha = (1 - u) * flick;
      prect(ctx, e.x, e.y, 1, 1, u < 0.45 ? '#ffe9a0' : '#ff8a2a');
    }

    // 5) bara utama di ujung tongkat
    const tip = nodes[0];
    if (tip && this.heat > 0.02) {
      const r = 4 + this.heat * 6;
      const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, r);
      g.addColorStop(0, 'rgba(255,226,150,0.7)');
      g.addColorStop(0.4, 'rgba(255,110,20,0.32)');
      g.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.globalAlpha = 0.2 + this.heat * 0.3;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
