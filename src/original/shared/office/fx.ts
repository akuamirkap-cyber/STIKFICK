// Partikel SIDE VIEW: gravitasi ke bawah layar, menabrak pelat lantai & dinding gedung.
import { pcircle, pline, pring, type Ctx } from '../../v2/games/maxkungfu/game/pixel';
import { rnd } from '../../v2/games/maxkungfu/game/rng';

export interface Part {
  x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number;
  /** 0 debu, 1 percikan, 2 cincin, 3 asap, 4 darah, 5 gelombang kejut, 6 serpihan, 7 bara, 8 kertas, 9 bintang benturan, 10 kaca, 11 garis laju, 12 air, 13 kilat */
  k: number; g: number; fr: number; rot: number; vr: number; bounce: number; rest: boolean;
}

export class FX {
  list: Part[] = [];
  /** probe tabrakan dunia (pelat beton / dinding) */
  solid: (x: number, y: number) => boolean = () => false;
  /** darah mendarat: floor=true di permukaan lantai, false menempel dinding belakang */
  onBlood: ((x: number, y: number, c: string, s: number, floor: boolean) => void) | null = null;
  /** resolusi sub-piksel buffer (1 piksel dunia = sub piksel buffer) supaya partikel bergerak halus */
  sub = 1;
  private q(v: number) { return Math.round(v * this.sub) / this.sub; }

  add(p: Partial<Part>) {
    if (this.list.length > 1400) this.list.splice(0, 100);
    const b: Part = { x: 0, y: 0, vx: 0, vy: 0, life: 0.5, max: 0.5, c: '#fff', s: 1, k: 0, g: 0, fr: 0, rot: 0, vr: 0, bounce: 0, rest: false };
    const o = Object.assign(b, p);
    o.max = p.max ?? o.life;
    this.list.push(o);
  }
  spark(x: number, y: number, n: number, c: string, dir: number, spread = 0.9, speed = 230) {
    for (let i = 0; i < n; i++) { const a = dir + rnd(-spread, spread), sp = rnd(speed * 0.4, speed); this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(0.08, 0.24), c, k: 1, g: 260, fr: 3 }); }
  }
  burst(x: number, y: number, n: number, c: string, speed: number, life: number, size = 1) {
    for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), sp = rnd(speed * 0.3, speed); this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(life * 0.5, life), c, s: size, fr: 5, k: 0 }); }
  }
  lines(x: number, y: number, n: number, c: string, dir: number, speed = 260) {
    for (let i = 0; i < n; i++) this.add({ x: x - Math.cos(dir) * rnd(0, 8), y: y + rnd(-5, 5), vx: Math.cos(dir) * speed * rnd(0.7, 1.25), vy: Math.sin(dir) * speed * 0.3, life: rnd(0.07, 0.15), c, s: rnd(5, 11), k: 11 });
  }
  impact(x: number, y: number, size: number, c: string) { this.add({ x, y, life: 0.16, s: size, c, k: 9, rot: rnd(0, 1) }); }
  ring(x: number, y: number, r0: number, r1: number, c: string, life: number, w = 1) { this.add({ x, y, s: r0, vr: (r1 - r0) / life, life, c, k: 2, rot: w }); }
  shockwave(x: number, y: number, r1: number, c: string, life = 0.3) { this.add({ x, y, s: 2, vr: (r1 - 2) / life, life, c, k: 5 }); }
  smoke(x: number, y: number, n: number, c: string, speed = 20, life = 0.6) {
    for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), sp = rnd(speed * 0.2, speed); this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 12, life: rnd(life * 0.6, life), c, s: rnd(1.5, 3.2), fr: 2, k: 3 }); }
  }
  /** debu kaki di lantai: menyebar ke samping, naik sedikit */
  dust(x: number, y: number, n: number, dir = 0, c = '#b9b2a6') {
    for (let i = 0; i < n; i++) {
      const side = dir === 0 ? (Math.random() < 0.5 ? -1 : 1) : -dir;
      this.add({ x: x + rnd(-3, 3), y: y - rnd(0, 2), vx: side * rnd(15, 60), vy: -rnd(4, 22), life: rnd(0.3, 0.6), c, s: rnd(1.4, 2.8), fr: 4, k: 3 });
    }
  }
  /** spread kecil = semburan tembus (keluar dari punggung korban) */
  blood(x: number, y: number, n: number, dir: number, power: number, c = '#d40000', spread = 0.75) {
    for (let i = 0; i < n; i++) {
      const a = dir + rnd(-spread, spread * 0.75), sp = rnd(power * 0.25, power) * (i < 3 ? 1.25 : 1), r = Math.random();
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(30, 110), life: 2.2, c: r > 0.72 ? '#8e0000' : r > 0.64 ? '#ff2a2a' : c, s: r < 0.15 ? 3 : r < 0.55 ? 2 : 1, k: 4, g: 520 });
    }
  }
  debris(x: number, y: number, n: number, colors: string[], dir: number, power: number) {
    for (let i = 0; i < n; i++) {
      const a = (dir === 0 ? -Math.PI / 2 : dir) + rnd(-1.1, 1.1), sp = rnd(power * 0.3, power);
      this.add({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(40, 120), life: rnd(1.6, 3), c: colors[i % colors.length], s: rnd(1.5, 4), k: 6, g: 600, rot: rnd(0, 6.3), vr: rnd(-18, 18), bounce: 2 });
    }
  }
  paper(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.add({ x: x + rnd(-6, 6), y: y + rnd(-6, 2), vx: rnd(-70, 70), vy: rnd(-120, -30), life: rnd(2.2, 3.6), c: Math.random() < 0.8 ? '#f2f2ee' : '#ffe9a8', s: 1, k: 8, g: 0, rot: rnd(0, 6.3), vr: rnd(4, 9) });
  }
  glass(x: number, y: number, n: number, dir: number, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = dir + rnd(-1.2, 1.2), sp = rnd(50, 190) * (0.6 + power * 0.5);
      this.add({ x: x + rnd(-2, 2), y: y + rnd(-14, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(20, 120), life: rnd(1, 2.2), c: i % 3 === 0 ? '#e8fbff' : i % 3 === 1 ? '#8fd8ff' : '#4a7fa0', s: rnd(1, 2.4), k: 10, g: 560, rot: rnd(0, 6.3), vr: rnd(-20, 20), bounce: 2 });
    }
  }
  water(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.add({ x: x + rnd(-3, 3), y, vx: rnd(-90, 90), vy: rnd(-200, -40), life: rnd(0.6, 1.3), c: i % 2 ? '#8fd8ff' : '#d8f4ff', s: rnd(1, 2), k: 12, g: 620 });
  }
  /** kabut darah tipis di titik keluar pukulan */
  mist(x: number, y: number, n: number, dir: number) {
    for (let i = 0; i < n; i++) this.add({ x: x + rnd(-1, 1), y: y + rnd(-2, 2), vx: Math.cos(dir) * rnd(25, 70), vy: rnd(-16, 4), life: rnd(0.22, 0.42), c: i % 2 ? '#8e0000' : '#5a0000', s: rnd(1.2, 2.3), fr: 4, k: 3 });
  }
  /** kilatan kontak kecil di sisi depan: kepalan / tendangan tetap terlihat jelas */
  flash(x: number, y: number, size: number) { this.add({ x, y, life: 0.07, s: size, c: '#ffffff', k: 9, rot: rnd(0, 1) }); }
  /** riak datar di lantai (side view): elips gepeng */
  groundRing(x: number, y: number, r1: number, c: string, life = 0.35) { this.add({ x, y, s: 2, vr: (r1 - 2) / life, life, c, k: 14 }); }
  ember(x: number, y: number, n: number, c: string) {
    for (let i = 0; i < n; i++) this.add({ x: x + rnd(-6, 6), y: y + rnd(-4, 4), vx: rnd(-10, 10), vy: rnd(-50, -15), life: rnd(0.4, 0.9), c, s: 1, k: 7 });
  }
  zap(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) this.add({ x, y, vx: rnd(-40, 40), vy: rnd(-40, 20), life: rnd(0.06, 0.16), c: i % 2 ? '#bfe6ff' : '#ffffff', s: rnd(4, 9), k: 13, rot: rnd(0, 6.3) });
  }

  update(dt: number) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt;
      if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
      if (p.k === 2 || p.k === 5 || p.k === 14) { p.s += p.vr * dt; continue; }
      if (p.k === 9 || p.k === 13 || p.rest) continue;
      if (p.k === 8) {
        // kertas: melayang, bergoyang, jatuh pelan
        p.rot += p.vr * dt;
        p.vy = Math.min(p.vy + 260 * dt, 22);
        p.vx *= Math.max(0, 1 - 1.8 * dt);
        const nx = p.x + (p.vx + Math.sin(p.rot) * 18) * dt, ny = p.y + p.vy * dt;
        if (this.solid(nx, ny + 1)) { p.rest = true; p.rot = 0; continue; }
        p.x = nx; p.y = ny;
        continue;
      }
      if (p.g > 0) p.vy += p.g * dt;
      if (p.fr) { const f = Math.max(0, 1 - p.fr * dt); p.vx *= f; p.vy *= f; }
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if ((p.k === 4 || p.k === 6 || p.k === 10 || p.k === 12) && this.solid(nx, ny)) {
        const floor = this.solid(p.x, ny) && p.vy > 0;
        if (p.k === 4 || p.k === 12) {
          if (p.k === 4 && this.onBlood) this.onBlood(floor ? p.x : nx, floor ? Math.floor(ny / 16) * 16 : p.y, p.c, p.s, floor);
          L[i] = L[L.length - 1]; L.pop(); continue;
        }
        if (floor) { p.y = Math.floor(ny / 16) * 16 - 0.5; if (p.bounce > 0 && Math.abs(p.vy) > 40) { p.vy = -p.vy * 0.35; p.vx *= 0.6; p.vr *= 0.5; p.bounce--; } else { p.rest = true; p.rot = Math.round(p.rot / Math.PI) * Math.PI; } }
        else { p.vx = -p.vx * 0.4; }
        continue;
      }
      // darah melayang kadang menempel di dinding belakang (side view: noda di tembok)
      if (p.k === 4 && this.onBlood && p.vy > 40 && Math.random() < dt * 0.4) { this.onBlood(p.x, p.y, p.c, p.s, false); L[i] = L[L.length - 1]; L.pop(); continue; }
      p.x = nx; p.y = ny;
      p.rot += p.vr * dt;
      if (p.k === 3) p.s += dt * 4;
    }
  }

  draw(ctx: Ctx) {
    for (const p of this.list) {
      const u = p.life / p.max;
      const a = u < 0.3 ? u / 0.3 : 1;
      ctx.globalAlpha = a;
      switch (p.k) {
        case 0: ctx.fillStyle = p.c; ctx.fillRect(this.q(p.x), this.q(p.y), Math.ceil(p.s), Math.ceil(p.s)); break;
        case 1: pline(ctx, p.x, p.y, p.x - p.vx * 0.025, p.y - p.vy * 0.025, p.c); break;
        case 2: pring(ctx, p.x, p.y, p.s, p.c, p.rot || 1); break;
        case 3: ctx.globalAlpha = a * 0.55; pcircle(ctx, p.x, p.y, p.s, p.c); break;
        case 4: ctx.fillStyle = p.c; ctx.fillRect(this.q(p.x), this.q(p.y), p.s, p.s); break;
        case 5: ctx.globalAlpha = u * 0.9; pring(ctx, p.x, p.y, p.s, p.c, 2); break;
        case 6: { const l = p.s; pline(ctx, p.x - Math.cos(p.rot) * l / 2, p.y - Math.sin(p.rot) * l / 2, p.x + Math.cos(p.rot) * l / 2, p.y + Math.sin(p.rot) * l / 2, p.c, l > 3 ? 2 : 1); break; }
        case 7: if (Math.random() < 0.85) { ctx.fillStyle = p.c; ctx.fillRect(this.q(p.x), this.q(p.y), 1, 1); } break;
        case 8: { const wv = Math.abs(Math.cos(p.rot)) * 3 + 1; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - wv / 2), Math.round(p.y), Math.round(wv), 2); ctx.fillStyle = '#b8b8b0'; ctx.fillRect(Math.round(p.x - wv / 2), Math.round(p.y) + 1, Math.round(wv), 1); break; }
        case 9: {
          // bintang benturan: inti putih + jari-jari bergantian
          const k = 1 - u, r = p.s * (0.5 + k * 0.9);
          const n = 8;
          for (let j = 0; j < n; j++) {
            const ang = (j / n) * Math.PI * 2 + p.rot;
            const len = j % 2 === 0 ? r : r * 0.55;
            pline(ctx, p.x + Math.cos(ang) * r * 0.25, p.y + Math.sin(ang) * r * 0.25, p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len, j % 2 ? p.c : '#ffffff');
          }
          if (k < 0.5) pcircle(ctx, p.x, p.y, Math.max(1, p.s * 0.35 * (1 - k)), '#ffffff');
          break;
        }
        case 10: ctx.fillStyle = p.c; ctx.fillRect(this.q(p.x), this.q(p.y), Math.ceil(p.s), 1); if (Math.sin(p.rot * 3) > 0.7) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 1); } break;
        case 11: ctx.fillStyle = p.c; ctx.fillRect(this.q(p.vx > 0 ? p.x - p.s : p.x), this.q(p.y), Math.round(p.s), 1); break;
        case 12: ctx.fillStyle = p.c; ctx.fillRect(this.q(p.x), this.q(p.y), Math.ceil(p.s), Math.ceil(p.s)); break;
        case 14: { ctx.globalAlpha = u * 0.85; ctx.strokeStyle = p.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, Math.max(0.5, p.s), Math.max(0.5, p.s * 0.26), 0, 0, Math.PI * 2); ctx.stroke(); break; }
        case 13: {
          let x = p.x, y = p.y;
          for (let j = 0; j < 3; j++) { const ang = p.rot + rnd(-0.9, 0.9), nx = x + Math.cos(ang) * p.s * 0.4, ny = y + Math.sin(ang) * p.s * 0.4; pline(ctx, x, y, nx, ny, p.c); x = nx; y = ny; }
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
