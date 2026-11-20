// PENGHUNI PADANG — kelinci yang melompat dan kabur, kupu-kupu di sekitar bunga,
// dan burung yang melintas tinggi lengkap dengan bayangannya di rumput.
// Semua murni hiasan: tidak menghalangi pertarungan, tapi membuat arena terasa hidup.
import { pcircle, pellipse, pline, prect, px, type Ctx } from './pixel';
import type { Level } from './level';

const FUR: [string, string, string][] = [
  ['#d3a469', '#a97c46', '#fff3e0'],
  ['#c8c2b4', '#9a9384', '#ffffff'],
  ['#f0e6d6', '#cbbfa9', '#ffffff'],
  ['#8d7259', '#6a5442', '#efe3d2'],
];

interface Rabbit {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  hop: number; wait: number; face: number;
  fur: number; alarm: number; ear: number; scale: number;
}
interface Butterfly { x: number; y: number; z: number; a: number; t: number; c: string; sp: number }
interface Bird { x: number; y: number; a: number; sp: number; t: number; size: number }

export class MeadowLife {
  rabbits: Rabbit[] = [];
  flies: Butterfly[] = [];
  birds: Bird[] = [];
  private w = 0;
  private h = 0;
  private birdT = 3;

  populate(level: Level, solid: (x: number, y: number) => boolean) {
    this.rabbits.length = 0; this.flies.length = 0; this.birds.length = 0;
    this.w = level.w * 16; this.h = level.h * 16;
    const free = level.floorTiles;
    if (!free.length) return;
    const pick = () => {
      for (let i = 0; i < 24; i++) {
        const t = free[Math.floor(Math.random() * free.length)];
        const x = t.x * 16 + 8, y = t.y * 16 + 8;
        if (!solid(x, y)) return { x, y };
      }
      return null;
    };
    // separuh kelinci ditaruh dekat titik lahir supaya langsung terlihat pemain
    const cx = level.spawn.x, cy = level.spawn.y;
    const near = () => {
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 150;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.7;
        if (x > 30 && y > 30 && x < this.w - 30 && y < this.h - 30 && !solid(x, y)) return { x, y };
      }
      return pick();
    };
    for (let i = 0; i < 16; i++) {
      const p = i < 8 ? near() : pick();
      if (!p) continue;
      this.rabbits.push({
        x: p.x, y: p.y, z: 0, vx: 0, vy: 0, vz: 0,
        hop: 0, wait: Math.random() * 2.4, face: Math.random() < 0.5 ? 1 : -1,
        fur: Math.floor(Math.random() * FUR.length), alarm: 0,
        ear: Math.random() * 6.28, scale: 1.0 + Math.random() * 0.45,
      });
    }
    const WING = ['#fff0a8', '#ffd0e6', '#cfe8ff', '#ffffff', '#ffc98a'];
    for (let i = 0; i < 20; i++) {
      const p = i < 10 ? near() : pick();
      if (!p) continue;
      this.flies.push({
        x: p.x, y: p.y, z: 6 + Math.random() * 10, a: Math.random() * 6.28,
        t: Math.random() * 6.28, c: WING[Math.floor(Math.random() * WING.length)],
        sp: 9 + Math.random() * 12,
      });
    }
  }

  /** Kagetkan kelinci di sekitar ledakan / pukulan telak. */
  alarm(x: number, y: number, radius = 130) {
    for (const r of this.rabbits) {
      const d = Math.hypot(r.x - x, r.y - y);
      if (d > radius) continue;
      r.alarm = Math.max(r.alarm, 1.5 + Math.random());
      const a = Math.atan2(r.y - y, r.x - x) + (Math.random() - 0.5) * 0.7;
      r.vx = Math.cos(a) * 96; r.vy = Math.sin(a) * 96;
      r.wait = 0;
    }
  }

  update(dt: number, px_: number, py_: number, solid: (x: number, y: number) => boolean, splash: (x: number, y: number) => void, inWater: (x: number, y: number) => number) {
    for (const r of this.rabbits) {
      r.ear += dt * (2 + r.alarm * 5);
      r.alarm = Math.max(0, r.alarm - dt);
      // pemain mendekat -> siaga lalu kabur
      const pd = Math.hypot(r.x - px_, r.y - py_);
      if (pd < (r.alarm > 0 ? 150 : 62)) {
        r.alarm = Math.max(r.alarm, 0.9);
        const a = Math.atan2(r.y - py_, r.x - px_);
        r.vx += Math.cos(a) * 240 * dt;
        r.vy += Math.sin(a) * 240 * dt;
        r.wait = 0;
      }
      if (r.z <= 0.01) {
        if (r.wait > 0) {
          r.wait -= dt;
          r.vx *= 0.82; r.vy *= 0.82;
        } else {
          // lompat: dorongan pendek lalu jeda, khas kelinci
          const sp = Math.hypot(r.vx, r.vy);
          if (sp < 12) {
            const a = r.alarm > 0 ? Math.atan2(r.vy, r.vx) + (Math.random() - 0.5) * 0.8 : Math.random() * 6.28;
            const power = r.alarm > 0 ? 108 : 46;
            r.vx = Math.cos(a) * power; r.vy = Math.sin(a) * power * 0.75;
          }
          r.vz = r.alarm > 0 ? 108 : 66;
          r.hop = 1;
          if (inWater(r.x, r.y) > 0.15) splash(r.x, r.y);
          r.wait = r.alarm > 0 ? 0.1 + Math.random() * 0.12 : 0.7 + Math.random() * 1.9;
        }
      }
      r.hop = Math.max(0, r.hop - dt * 3);
      r.vz -= 460 * dt;
      r.z += r.vz * dt;
      if (r.z <= 0) { r.z = 0; r.vz = 0; r.vx *= 0.55; r.vy *= 0.55; }
      const nx = r.x + r.vx * dt, ny = r.y + r.vy * dt;
      if (!solid(nx, r.y)) r.x = nx; else { r.vx *= -0.5; r.wait = 0.1; }
      if (!solid(r.x, ny)) r.y = ny; else { r.vy *= -0.5; r.wait = 0.1; }
      r.x = Math.max(24, Math.min(this.w - 24, r.x));
      r.y = Math.max(24, Math.min(this.h - 24, r.y));
      if (Math.abs(r.vx) > 4) r.face = r.vx >= 0 ? 1 : -1;
      const air = r.z > 0 ? 1 : 0.94;
      r.vx *= air; r.vy *= air;
    }
    for (const f of this.flies) {
      f.t += dt * 9;
      f.a += Math.sin(f.t * 0.21) * dt * 1.6;
      f.x += Math.cos(f.a) * f.sp * dt;
      f.y += Math.sin(f.a) * f.sp * dt * 0.7;
      f.z = 7 + Math.sin(f.t * 0.34) * 5;
      if (f.x < 20 || f.x > this.w - 20) f.a = Math.PI - f.a;
      if (f.y < 20 || f.y > this.h - 20) f.a = -f.a;
      const pd = Math.hypot(f.x - px_, f.y - py_);
      if (pd < 34) f.a = Math.atan2(f.y - py_, f.x - px_);
    }
    this.birdT -= dt;
    if (this.birdT <= 0 && this.birds.length < 3) {
      this.birdT = 7 + Math.random() * 9;
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.birds.push({
        x: dir > 0 ? -60 : this.w + 60, y: 60 + Math.random() * (this.h - 120),
        a: dir > 0 ? 0 : Math.PI, sp: 62 + Math.random() * 40, t: Math.random() * 6, size: 0.8 + Math.random() * 0.7,
      });
    }
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.t += dt * 7;
      b.x += Math.cos(b.a) * b.sp * dt;
      b.y += Math.sin(b.a) * b.sp * dt + Math.sin(b.t * 0.2) * 5 * dt;
      if (b.x < -90 || b.x > this.w + 90) this.birds.splice(i, 1);
    }
  }

  /** Bayangan burung di rumput — digambar sebelum makhluk lain. */
  drawBirdShadows(ctx: Ctx) {
    for (const b of this.birds) {
      ctx.globalAlpha = 0.13;
      pellipse(ctx, b.x + 26, b.y + 34, 7 * b.size, 2.6 * b.size, '#2c5a2c');
      ctx.globalAlpha = 1;
    }
  }

  /** Kelinci + kupu-kupu. Dipanggil di ruang dunia, sebelum tokoh bertarung. */
  drawGround(ctx: Ctx) {
    for (const r of this.rabbits) {
      const [fur, dark, tail] = FUR[r.fur];
      const s = r.scale;
      const bx = r.x, by = r.y - r.z;
      ctx.globalAlpha = 0.22 - Math.min(0.14, r.z * 0.012);
      pellipse(ctx, r.x, r.y + 1, 3.2 * s, 1.4 * s, '#2f5c2c');
      ctx.globalAlpha = 1;
      const stretch = 1 + r.hop * 0.22;
      // badan
      pellipse(ctx, bx, by - 2 * s, 3.1 * s * stretch, 2.2 * s / stretch, dark);
      pellipse(ctx, bx, by - 2.3 * s, 2.7 * s * stretch, 1.8 * s / stretch, fur);
      // kepala
      const hx = bx + r.face * 2.5 * s, hy = by - 3.4 * s - r.hop * 0.6;
      pcircle(ctx, hx, hy, 1.6 * s, fur);
      // telinga: tegak saat kaget, rebah saat santai
      const lift = r.alarm > 0 ? 1 : 0.55;
      const wob = Math.sin(r.ear) * 0.5;
      pline(ctx, hx - r.face * 0.4 * s, hy - 1.1 * s, hx - r.face * (1.4 + wob) * s, hy - (1.4 + 3.0 * lift) * s, dark, 1);
      pline(ctx, hx + r.face * 0.7 * s, hy - 1.1 * s, hx + r.face * (0.2 - wob) * s, hy - (1.6 + 3.2 * lift) * s, fur, 1);
      px(ctx, hx + r.face * 0.9 * s, hy - 0.2 * s, '#2a2018');
      // ekor putih menonjol saat melompat
      pcircle(ctx, bx - r.face * 3.1 * s, by - 2.4 * s, 1.15 * s, tail);
      // kaki belakang menekuk
      if (r.z < 0.6) prect(ctx, bx - r.face * 1.2 * s, by - 0.9 * s, 2 * s, 1 * s, dark);
    }
    for (const f of this.flies) {
      const flap = Math.sin(f.t) > 0 ? 1 : 0;
      const y = f.y - f.z;
      ctx.globalAlpha = 0.16;
      pellipse(ctx, f.x, f.y + 1, 1.6, 0.8, '#2f5c2c');
      ctx.globalAlpha = 1;
      prect(ctx, f.x - 2 + flap, y - 1, 2, 2, f.c);
      prect(ctx, f.x + 1 - flap, y - 1, 2, 2, f.c);
      px(ctx, f.x, y, '#4a3a2a');
    }
  }

  /** Burung di angkasa — digambar paling akhir, di atas kanopi. */
  drawSky(ctx: Ctx) {
    for (const b of this.birds) {
      const y = b.y - 46;
      const flap = Math.sin(b.t) * 3.4 * b.size;
      const d = Math.cos(b.a) >= 0 ? 1 : -1;
      ctx.globalAlpha = 0.85;
      pline(ctx, b.x - 4 * b.size * d, y - flap, b.x, y, '#3a4a3a', 1);
      pline(ctx, b.x, y, b.x + 4 * b.size * d, y - flap, '#3a4a3a', 1);
      px(ctx, b.x, y, '#2a3a2a');
      ctx.globalAlpha = 1;
    }
  }
}
