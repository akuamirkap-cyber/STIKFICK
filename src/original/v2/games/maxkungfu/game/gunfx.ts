// Pixel gun FX modelled on patch-gg/pixelfx "pistol-shots" (muzzle-pistol + bullet-tracer + hit-spark):
// spiky white-cored flash, forward sparks + powder embers, a curl of smoke hooking up & back,
// a brass casing that tumbles, bounces and settles, a heat-banded tracer, and a lopsided cross hit flare.
import { pline, prect, type Ctx } from './pixel';

const F = ['#4a1712', '#8a1f17', '#c9281f', '#f2561d', '#ff8a2a', '#ffc23d', '#ffe26b', '#fff3a6', '#ffffff'];
const SMOKE = ['#26222e', '#3b3644', '#544e5e', '#6f6979', '#8c8596', '#aca5b5', '#cbc4d2'];
const BRASS = ['#4a2e10', '#8c5c1c', '#d9a441', '#ffe39a'];
const R = (a: number, b: number) => a + Math.random() * (b - a);

interface Puff { x: number; y: number; vx: number; vy: number; r0: number; r1: number; life: number; t: number; a: number; drag: number; rise: number; curl: number; warm: number; delay: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; t: number; c: string; grav: number; floor: number; bounce: boolean }
interface Casing { x: number; y: number; vx: number; vy: number; va: number; ang: number; floor: number; t: number; rest: boolean; bounces: number }
interface Flash { x: number; y: number; a: number; t: number; big: boolean; seed: number }
interface Cross { x: number; y: number; a: number; t: number; rays: { a: number; L: number; w: number }[] }
interface Light { x: number; y: number; r: number; c: string; a: number; t: number; life: number }

export class GunFX {
  puffs: Puff[] = []; sparks: Spark[] = []; casings: Casing[] = []; flashes: Flash[] = []; crosses: Cross[] = []; lights: Light[] = [];

  /** one shot from the muzzle at (x,y) aimed `a`; floorY = the shooter's feet (where casings and embers land) */
  muzzle(x: number, y: number, a: number, pistol: boolean, floorY: number, side: number) {
    const ca = Math.cos(a), sa = Math.sin(a);
    this.flashes.push({ x, y, a, t: 0, big: pistol, seed: Math.random() * 1000 });
    this.lights.push({ x, y, r: pistol ? 34 : 24, c: F[5], a: pistol ? 0.35 : 0.22, t: 0, life: 0.06 });
    this.lights.push({ x: x + ca * 8, y: y + sa * 8, r: 16, c: F[7], a: 0.4, t: 0, life: 0.05 });
    // sparks spat forward, grains of unburnt powder that drop
    for (let i = 0; i < (pistol ? 6 : 4); i++) { const d = a + R(-0.3, 0.3), sp = R(180, 400); this.sparks.push({ x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, life: R(0.06, 0.16), t: 0, c: [F[7], F[6], F[4], F[3]][i % 4], grav: 0, floor: floorY, bounce: false }); }
    for (let i = 0; i < (pistol ? 5 : 2); i++) { const d = a + R(-0.35, 0.25), sp = R(60, 160); this.sparks.push({ x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, life: R(0.25, 0.5), t: 0, c: F[5], grav: 260, floor: floorY, bounce: false }); }
    // a puff of gas forward, then a chain of wisps that push out, slow and curl up and back over the muzzle
    const n = pistol ? 14 : 6;
    for (let i = 0; i < 3; i++) this.puffs.push({ x: x + ca * 3, y: y + sa * 3, vx: ca * R(70, 120), vy: sa * R(70, 120) + R(-12, 6), r0: 1.6, r1: R(4.5, 6) * (pistol ? 1 : 0.7), life: R(0.8, 1.05), t: 0, a: 0.55, drag: 3.5, rise: 10, curl: 0, warm: 0.9, delay: i * 0.012 });
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), sp = 115 - 75 * k + R(-12, 12);
      this.puffs.push({ x: x + ca * 2, y: y + sa * 2, vx: ca * sp, vy: sa * sp - 6 - 10 * k + R(-5, 5), r0: 1.4, r1: (3.6 + k * 2.6) * R(0.75, 1.25) * (pistol ? 1 : 0.7), life: 1.15 + k * 0.3, t: 0, a: 0.62, drag: 2.2, rise: 6, curl: (-4.4 + k * 1.8) * (ca >= 0 ? 1 : -1), warm: 0.7, delay: 0.02 + i * 0.022 });
    }
    // casing: out of the port, up and back, tumbling, a bounce or two, then it lies there and fades
    this.casings.push({ x: x - ca * 7, y: y - 1, vx: -side * R(25, 45) - ca * 10, vy: -R(95, 130), va: (Math.random() < 0.5 ? -1 : 1) * R(22, 32), ang: R(0, 6.28), floor: floorY + R(-2, 3), t: 0, rest: false, bounces: 0 });
    if (this.casings.length > 40) this.casings.shift();
  }

  /** the everyday hit: lopsided cross flare (long ray along the blow) round a white diamond + a cone of falling sparks */
  hitSpark(x: number, y: number, a: number, floorY: number, big = false) {
    const tilt = R(-0.08, 0.08), s = big ? 0.55 : 0.4;
    this.crosses.push({ x, y, a, t: 0, rays: [
      { a: a + tilt, L: R(33, 37) * s, w: 2.2 }, { a: a + Math.PI + tilt, L: R(8, 10) * s, w: 2.2 },
      { a: a - Math.PI / 2 + tilt, L: R(15, 18) * s, w: 2.6 }, { a: a + Math.PI / 2 + tilt, L: R(10, 12) * s, w: 2.3 },
      { a: a - Math.PI / 4 + tilt, L: R(5, 7) * s, w: 1 },
    ] });
    this.lights.push({ x, y, r: 20, c: F[4], a: 0.3, t: 0, life: 0.08 });
    for (let i = 0; i < (big ? 9 : 6); i++) { const d = a + R(-0.6, 0.6) - 0.15, v = R(170, 360); this.sparks.push({ x, y, vx: Math.cos(d) * v, vy: Math.sin(d) * v - 40, life: R(0.25, 0.45), t: 0, c: i < 2 ? F[8] : [F[7], F[6], F[4], F[2]][i % 4], grav: 520, floor: floorY, bounce: true }); }
  }

  update(dt: number) {
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.t += dt; if (p.t >= p.life) { this.puffs.splice(i, 1); continue; }
      const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vy *= dr;
      p.vy -= p.rise * dt;
      if (p.curl) { const c = Math.cos(p.curl * dt * 0.25), s = Math.sin(p.curl * dt * 0.25); const vx = p.vx * c - p.vy * s; p.vy = p.vx * s + p.vy * c; p.vx = vx; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]; s.t += dt; if (s.t >= s.life) { this.sparks.splice(i, 1); continue; }
      s.vy += s.grav * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.bounce && s.y > s.floor && s.vy > 0) { s.y = s.floor; s.vy *= -0.35; s.vx *= 0.6; }
    }
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i]; c.t += dt;
      if (c.t > 2.2) { this.casings.splice(i, 1); continue; }
      if (c.rest) continue;
      c.vy += 850 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.ang += c.va * dt;
      if (c.y > c.floor && c.vy > 0) { c.y = c.floor; c.bounces++; c.vy *= -0.42; c.vx *= 0.5; c.va *= 0.5; if (c.bounces >= 3 || Math.abs(c.vy) < 20) { c.rest = true; c.ang = Math.round(c.ang / Math.PI) * Math.PI; } }
    }
    for (const arr of [this.flashes, this.crosses, this.lights] as { t: number }[][]) for (let i = arr.length - 1; i >= 0; i--) { arr[i].t += dt; }
    this.flashes = this.flashes.filter((f) => f.t < 0.07);
    this.crosses = this.crosses.filter((c) => c.t < 0.16);
    this.lights = this.lights.filter((l) => l.t < l.life).slice(-12);
    if (this.puffs.length > 160) this.puffs.splice(0, this.puffs.length - 160);
    if (this.sparks.length > 200) this.sparks.splice(0, this.sparks.length - 200);
  }

  private disc(ctx: Ctx, x: number, y: number, r: number, c: string) {
    const ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy))); if (w >= 0) prect(ctx, Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1, c); }
  }

  /** drawn under the actors: smoke + lights + resting casings */
  drawBack(ctx: Ctx) {
    // soft, small light pop that fades fast (no big opaque disc)
    for (const l of this.lights) {
      const k = 1 - l.t / l.life;
      ctx.globalAlpha = l.a * k * k * 0.35; this.disc(ctx, l.x, l.y, l.r * 0.45, l.c);
      ctx.globalAlpha = l.a * k * k * 0.6; this.disc(ctx, l.x, l.y, l.r * 0.18, l.c);
    }
    ctx.globalAlpha = 1;
    for (const p of this.puffs) {
      if (p.delay > 0) continue;
      const k = p.t / p.life, r = p.r0 + (p.r1 - p.r0) * Math.pow(k, 0.6);
      // warm (lit by the flash) right after the shot, cooling to grey smoke
      const heat = Math.max(0, p.warm - k * 3);
      const ci = Math.min(SMOKE.length - 1, Math.floor((1 - k) * 4) + 2);
      const c = heat > 0.5 ? F[4] : heat > 0.2 ? F[3] : SMOKE[ci];
      ctx.globalAlpha = p.a * (1 - k) * Math.min(1, p.t * 12);
      this.disc(ctx, p.x, p.y, r, SMOKE[1]);
      this.disc(ctx, p.x - r * 0.25, p.y - r * 0.25, r * 0.7, c);
    }
    ctx.globalAlpha = 1;
    for (const c of this.casings) {
      const fade = c.t > 1.6 ? 1 - (c.t - 1.6) / 0.6 : 1;
      ctx.globalAlpha = fade;
      const dx = Math.cos(c.ang) * 1.5, dy = Math.sin(c.ang) * 1.5;
      pline(ctx, c.x - dx, c.y - dy, c.x + dx, c.y + dy, BRASS[0], 2);
      pline(ctx, c.x - dx * 0.6, c.y - dy * 0.6, c.x + dx * 0.6, c.y + dy * 0.6, BRASS[2], 1);
      if (!c.rest && Math.floor(c.t * 30) % 3 === 0) prect(ctx, Math.round(c.x), Math.round(c.y), 1, 1, BRASS[3]);
    }
    ctx.globalAlpha = 1;
  }

  /** drawn over the actors: flash, sparks, cross flares */
  drawFront(ctx: Ctx) {
    for (const f of this.flashes) {
      const pop = Math.exp(-(f.t + 0.008) / 0.035);
      const L = (f.big ? 13 : 9) * (0.6 + pop * 0.6);
      const ca = Math.cos(f.a), sa = Math.sin(f.a);
      // spiky lobes: main tongue, two side spikes, a stub back, and a white diamond core
      const lobe = (ang: number, len: number, w: number, c: string) => pline(ctx, f.x, f.y, f.x + Math.cos(ang) * len, f.y + Math.sin(ang) * len, c, w);
      const j = (Math.sin(f.seed) * 0.15);
      lobe(f.a + j, L, 4, F[3]); lobe(f.a + j, L * 0.85, 3, F[5]); lobe(f.a + j, L * 0.6, 2, F[7]);
      lobe(f.a + 0.75, L * 0.42, 2, F[4]); lobe(f.a - 0.75, L * 0.42, 2, F[4]);
      lobe(f.a + Math.PI / 2, L * 0.22, 1, F[6]); lobe(f.a - Math.PI / 2, L * 0.22, 1, F[6]);
      lobe(f.a + Math.PI, 2, 2, F[5]);
      const r = f.big ? 2 : 1;
      for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
        const m = Math.abs(dx) + Math.abs(dy);
        if (m <= r) prect(ctx, Math.round(f.x + ca * 1 + dx), Math.round(f.y + sa * 1 + dy), 1, 1, F[8]);
        else if (m === r + 1) prect(ctx, Math.round(f.x + ca + dx), Math.round(f.y + sa + dy), 1, 1, F[6]);
      }
    }
    for (const s of this.sparks) {
      const k = 1 - s.t / s.life;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      const tx = s.x - s.vx * 0.012, ty = s.y - s.vy * 0.012;
      pline(ctx, tx, ty, s.x, s.y, s.c, 1);
    }
    ctx.globalAlpha = 1;
    for (const c of this.crosses) {
      const k = c.t / 0.16, grow = Math.min(1, c.t / 0.03), fade = 1 - Math.max(0, (k - 0.4) / 0.6);
      ctx.globalAlpha = fade;
      for (const r of c.rays) {
        const L = r.L * grow, ca = Math.cos(r.a), sa = Math.sin(r.a);
        for (let d = 0; d <= L; d += 1) {
          const u = d / Math.max(1, L), hw = r.w * Math.pow(1 - u, 1.6);
          const col = u < 0.3 ? F[8] : u < 0.62 ? F[7] : u < 0.88 ? F[6] : F[5];
          prect(ctx, Math.round(c.x + ca * d), Math.round(c.y + sa * d), 1, 1, col);
          if (hw > 0.9) { prect(ctx, Math.round(c.x + ca * d - sa), Math.round(c.y + sa * d + ca), 1, 1, F[6]); prect(ctx, Math.round(c.x + ca * d + sa), Math.round(c.y + sa * d - ca), 1, 1, F[6]); }
        }
      }
      const r = c.t < 0.06 ? 2 : 1;
      for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
        const m = Math.abs(dx) + Math.abs(dy);
        if (m <= r) prect(ctx, Math.round(c.x + dx), Math.round(c.y + dy), 1, 1, F[8]);
        else if (m === r + 1) prect(ctx, Math.round(c.x + dx), Math.round(c.y + dy), 1, 1, F[6]);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** heat-banded tracer: white-hot slug, white/gold core near it, cooling gold->orange->red, broken dashes at the cold end */
  drawTracer(ctx: Ctx, x: number, y: number, vx: number, vy: number, pistol: boolean, time: number) {
    const sp = Math.hypot(vx, vy) || 1, nx = vx / sp, ny = vy / sp, L = pistol ? 40 : 32, HOT = L * 0.32;
    for (let d = HOT; d <= L; d += 1) {
      const u = d / L;
      if (u > 0.55 && ((Math.floor(d / 3) * 7919 + Math.floor(time * 30) * 104729) % 100) / 100 < (u - 0.55) * 1.6) continue;
      const h = 1 - Math.pow(u, 0.8) + 0.08 * Math.sin(d * 0.35 - time * 50);
      const c = h > 0.55 ? F[6] : h > 0.42 ? F[5] : h > 0.3 ? F[4] : h > 0.18 ? F[3] : h > 0.08 ? F[2] : F[1];
      ctx.globalAlpha = u < 0.85 ? 1 : (1 - u) / 0.15;
      prect(ctx, Math.round(x - nx * d), Math.round(y - ny * d), 1, 1, c);
    }
    ctx.globalAlpha = 0.3; pline(ctx, x, y, x - nx * L * 0.45, y - ny * L * 0.45, F[4], 3);
    ctx.globalAlpha = 1;
    pline(ctx, x, y, x - nx * HOT, y - ny * HOT, F[6], 2);
    pline(ctx, x, y, x - nx * HOT * 0.6, y - ny * HOT * 0.6, F[7], 1);
    // the slug
    prect(ctx, Math.round(x - 1), Math.round(y - 1), 3, 3, F[7]); prect(ctx, Math.round(x), Math.round(y), 1, 1, F[8]);
    prect(ctx, Math.round(x + nx), Math.round(y + ny), 1, 1, F[8]);
  }
}
