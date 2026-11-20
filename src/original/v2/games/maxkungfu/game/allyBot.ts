import { clamp, dist, rnd } from './rng';
import { moveWithCollision } from './level';
import { LEG_K, gaitDuty } from './stick';
import { zoneFromMove } from './hitReact';
import { drawStick } from './draw';
import { MOVES } from './moves';
import { pcircle, pfontO, type Ctx } from './pixel';

/**
 * BOT SEKUTU (tombol M) — petarung ahli bergaya kung fu: kombo tangan + kaki yang berganti-ganti, menghindar,
 * menerjang, dan FATALITY (F) pada musuh yang goyah atau sekarat — seperti kamu bermain.
 * Kebal dari serangan (musuh hanya mengincar pemain), tapi seluruh pukulannya nyata dan mengenai musuh.
 */
type G = any;
type E = any;
const TINT = '#7df9ff';
const RAW_COMBOS: string[][] = [
  ['L', 'LL', 'LLL', 'LLLL'],
  ['L', 'LL', 'LH', 'HL', 'HLL'],
  ['S1', 'S2', 'S3', 'S4', 'S5'],
  ['KV1', 'KV2', 'KV3', 'KV4'],
  ['H', 'LHL', 'LLH', 'HHL'],
  ['L', 'KV2', 'LL', 'KV3', 'LLLH'],
  ['S1', 'LH', 'S2', 'HL', 'S6'],
  ['KF1', 'KV2', 'KF2'],
  ['L', 'LL', 'HL', 'HLH'],
  ['S3', 'S4', 'KV3', 'S8'],
  ['LH', 'KV2', 'S2', 'LLLLH'],
];
const COMBOS = RAW_COMBOS.map((c) => c.filter((k) => MOVES[k] && !MOVES[k].travel)).filter((c) => c.length >= 2);
const FINISH = ['S8', 'LLLH', 'HHL', 'KVH', 'LLLLH', 'HLH'].filter((k) => MOVES[k]);
const SPD = 1.12;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const lerpAng = (a: number, b: number, k: number) => a + wrap(b - a) * k;

interface Fat { e: E; t: number; n: number; done: boolean; hx: number; hy: number }

export class AllyBot {
  on = false;
  x = 0; y = 0; vx = 0; vy = 0; kx = 0; ky = 0; r = 5;
  aim = 0; facing = 1; walk = 0; moving = false; runT = 0; strideHalf = 3;
  time = 0;
  private combo: string[] = []; private ci = 0; private lastCombo = -1;
  private cur: string | null = null; private t = 0; private hitT = -9; private hitDone = false; private hitsThisMove = 0;
  private restT = 0;
  private targetId = -1;
  private dashCd = 0; private dodgeCd = 0; private fatCd = 5; private dodgeT = 0;
  private fat: Fat | null = null;
  private chain = 0; private chainT = 0;
  private poseName = 'idle'; private poseT = 0; private strike: string | null = null; private impact = 0;
  private flashT = 0;

  reset() { this.on = false; this.cur = null; this.fat = null; this.targetId = -1; }

  toggle(g: G): boolean {
    const p = g.player;
    if (this.on) { this.reset(); g.say?.('BOT OFF', '#9be7ff', 2, 0.7); return false; }
    this.on = true;
    this.x = p.x - (p.facing || 1) * 26; this.y = p.y + 12; this.vx = this.vy = this.kx = this.ky = 0;
    this.aim = p.aim; this.facing = p.facing || 1; this.cur = null; this.fat = null; this.restT = 0.3; this.fatCd = 4;
    g.say?.('BOT ONLINE - AHLI KOMBO', TINT, 2, 1.1);
    g.sfx?.announce?.();
    g.particles?.ring?.(this.x, this.y - 8, 3, 26, TINT, 0.35, 2);
    g.particles?.burst?.(this.x, this.y - 8, 14, TINT, 160, 0.5, 2, 2);
    g.flash?.(TINT, 0.12);
    return true;
  }

  private alive(g: G): E[] { return g.enemies.filter((e: E) => !e.dead && e.spawnT <= 0 && !e.mirror); }

  private findTarget(g: G): E | null {
    const p = g.player;
    let best: E | null = null, bs = 1e9;
    for (const e of this.alive(g)) {
      const d = dist(this.x, this.y, e.x, e.y);
      if (d > 260 || dist(p.x, p.y, e.x, e.y) > 330) continue;
      let s = d;
      if (e.stagger > 0) s -= 70;
      if (!e.boss && e.hp <= Math.max(3, e.maxHp * 0.25)) s -= 30;
      if (e.id === this.targetId) s -= 28;       // sedikit setia pada sasaran
      if (e.z > 2) s += 20;
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  }

  private canFatality(e: E) {
    if (this.fatCd > 0 || this.chain < 2) return false;
    const hard = e.boss || e.kind === 'duelist' || e.ai2 || e.sm || e.jack;
    if (hard) return e.stagger > 0;
    return e.stagger > 0 || e.hp <= Math.max(3, e.maxHp * 0.3);
  }

  private pickCombo(e: E): string[] {
    if (e.down > 0 || (e.state === 'down' && e.z <= 1)) return ['KV3', 'S6'].filter((k) => MOVES[k]);
    if (e.z > 3) return ['H', 'HL', 'HLH'].filter((k) => MOVES[k]);
    let i = Math.floor(Math.random() * COMBOS.length);
    if (i === this.lastCombo) i = (i + 1 + Math.floor(Math.random() * (COMBOS.length - 1))) % COMBOS.length;
    this.lastCombo = i;
    const c = COMBOS[i].slice();
    if (c.length >= 4 && Math.random() < 0.55 && FINISH.length) c.push(FINISH[Math.floor(Math.random() * FINISH.length)]);
    return c;
  }

  private startMove(g: G, key: string) {
    this.cur = key; this.t = 0; this.hitDone = false; this.hitT = -9; this.hitsThisMove = 0;
    g.sfx?.whoosh?.();
  }

  private hitEnemies(g: G, m: (typeof MOVES)[string], tgt: E | null) {
    let any = false;
    for (const e of this.alive(g)) {
      const d = dist(this.x, this.y, e.x, e.y);
      if (d > m.range + e.r + 5) continue;
      const a = Math.atan2(e.y - this.y, e.x - this.x);
      if (Math.abs(wrap(a - this.aim)) > Math.max(1.0, Math.min(Math.PI, m.arc))) continue;
      const hard = e.boss || e.kind === 'duelist' || e.ai2 || e.sm || e.jack;
      const dmg = m.dmg * (hard ? 0.4 : 0.85) + 0.3;
      g.damageEnemy(e, dmg, m.structure * (hard ? 0.55 : 1), a, m.kb * 0.9, { knockdown: m.knockdown, hitstop: 0.012, shake: 0.07, melee: false, launch: m.launch, zone: zoneFromMove(m, e) });
      g.particles?.spark?.(e.x - Math.cos(a) * 3, e.y - 7, 6, '#ffffff', a, 1, 210);
      g.particles?.spark?.(e.x - Math.cos(a) * 3, e.y - 7, 3, TINT, a + Math.PI, 1.2, 150);
      g.particles?.blood?.(e.x, e.y - 7, 4, a, 120);
      if (m.sfx === 'kick' || m.kick) g.sfx?.kick?.(); else g.sfx?.punch?.();
      this.hitsThisMove++; this.chain++; this.chainT = 1.5; any = true;
      void tgt;
    }
    return any;
  }

  update(g: G, dt: number) {
    if (!this.on || g.state !== 'playing') return;
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    const p = g.player;
    this.dashCd -= dt; this.dodgeCd -= dt; this.fatCd -= dt; this.restT -= dt;
    if (this.dodgeT > 0) this.dodgeT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.chainT > 0) { this.chainT -= dt; if (this.chainT <= 0) this.chain = 0; }
    this.vx = 0; this.vy = 0; this.moving = false; this.strike = null; this.impact = 0; this.poseName = 'idle'; this.poseT = 0;

    // terlalu jauh dari pemain: menyusul dengan kedipan
    if (dist(this.x, this.y, p.x, p.y) > 340) {
      g.particles?.smoke?.(this.x, this.y, 4, '#cfcfcf', 30, 0.4);
      this.x = p.x - (p.facing || 1) * 30; this.y = p.y + 14; this.cur = null; this.fat = null;
      g.particles?.ring?.(this.x, this.y - 8, 3, 18, TINT, 0.25, 1);
    }

    if (this.fat) { this.updateFat(g, dt); this.integrate(g, dt); return; }

    const tgt = this.findTarget(g);
    this.targetId = tgt ? tgt.id : -1;

    // ---- MENGHINDAR serangan yang datang (ayunan musuh dekat / peluru mendekat)
    if (this.dodgeCd <= 0 && this.dodgeT <= 0) {
      let danger = false;
      for (const e of this.alive(g)) {
        if ((e.state === 'windup' || e.state === 'attack' || e.ai2?.w?.tech || e.jack?.act) && dist(this.x, this.y, e.x, e.y) < 46) { danger = true; break; }
      }
      if (!danger) for (const b of g.bullets) {
        if (b.owner !== 'enemy') continue;
        const bd = dist(b.x, b.y, this.x, this.y);
        if (bd < 34 && (b.vx * (this.x - b.x) + b.vy * (this.y - b.y)) > 0) { danger = true; break; }
      }
      if (danger && Math.random() < dt * 9) {
        const ref = tgt ? Math.atan2(tgt.y - this.y, tgt.x - this.x) : this.aim;
        const sd = Math.random() < 0.5 ? 1 : -1;
        const a = ref + sd * Math.PI / 2;
        this.kx += Math.cos(a) * 330; this.ky += Math.sin(a) * 330;
        this.dodgeT = 0.22; this.dodgeCd = 0.9; this.cur = null; this.restT = 0.12;
        g.particles?.smoke?.(this.x, this.y, 3, '#cfcfcf', 22, 0.3);
        g.addAfterimage?.({ x: this.x, y: this.y, facing: this.facing, aim: this.aim, scale: 1, color: TINT }, TINT);
        g.sfx?.dash?.();
      }
    }

    // ---- MENYERANG
    if (this.cur) {
      const m = MOVES[this.cur];
      if (tgt) this.aim = lerpAng(this.aim, Math.atan2(tgt.y - this.y, tgt.x - this.x), Math.min(1, dt * (this.t < m.windup ? 14 : 3)));
      this.t += dt * SPD;
      const w = m.windup, a = m.active, r = m.recover * 0.5;
      // terjang ke depan selama ancang-ancang dan hantaman
      if (tgt && this.t < w + a) {
        const d = dist(this.x, this.y, tgt.x, tgt.y);
        if (d > m.range * 0.55) { const sp = Math.min(260, 110 + m.lunge * 0.9); this.vx = Math.cos(this.aim) * sp; this.vy = Math.sin(this.aim) * sp; this.moving = true; }
      }
      if (this.t >= w && this.t < w + a) {
        const first = !this.hitDone;
        const again = !!m.rehit && this.t - this.hitT >= m.rehit;
        if (first || again) { this.hitDone = true; this.hitT = this.t; this.hitEnemies(g, m, tgt); }
        this.impact = 1;
      }
      // pose
      if (this.t < w) this.poseT = 0.3 * (this.t / Math.max(0.001, w));
      else if (this.t < w + a) this.poseT = 0.3 + 0.3 * ((this.t - w) / Math.max(0.001, a));
      else this.poseT = 0.6 + 0.4 * clamp((this.t - w - a) / Math.max(0.001, r), 0, 1);
      this.poseName = m.pose;
      this.strike = m.limb === 'fhand' || m.limb === 'bhand' || m.limb === 'ffoot' || m.limb === 'bfoot' || m.limb === 'both' ? m.limb : m.limb === 'sweep' ? 'ffoot' : null;
      if (this.t >= w + a + r) {
        this.ci++;
        const alive = tgt && dist(this.x, this.y, tgt.x, tgt.y) < m.range + 28;
        if (this.ci < this.combo.length && tgt && alive && !(this.hitsThisMove === 0 && Math.random() < 0.35)) {
          if (this.canFatality(tgt)) this.startFat(g, tgt);
          else this.startMove(g, this.combo[this.ci]);
        } else { this.cur = null; this.restT = rnd(0.16, 0.42); }
      } else if (this.hitsThisMove > 0 && tgt && this.t > w + a * 0.6 && this.canFatality(tgt) && Math.random() < dt * 6) {
        this.startFat(g, tgt);
      }
      this.integrate(g, dt);
      return;
    }

    // ---- BEBAS: dekati sasaran / ikuti pemain
    if (tgt) {
      const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy) || 1;
      this.aim = lerpAng(this.aim, Math.atan2(dy, dx), Math.min(1, dt * 10));
      // menerjang cepat dari jauh
      if (d > 85 && this.dashCd <= 0) {
        this.dashCd = 1.4; this.kx += Math.cos(this.aim) * 420; this.ky += Math.sin(this.aim) * 420; this.dodgeT = 0.16;
        g.particles?.smoke?.(this.x, this.y, 3, '#cfcfcf', 24, 0.3);
        g.addAfterimage?.({ x: this.x, y: this.y, facing: this.facing, aim: this.aim, scale: 1, color: TINT }, TINT);
        g.sfx?.dash?.();
      }
      const want = 17;
      if (d > want) { const sp = d > 90 ? 190 : 138; this.vx = (dx / d) * sp; this.vy = (dy / d) * sp; this.moving = true; }
      else { const o = this.time * 2.2 + (tgt.id % 7); this.vx = -Math.sin(this.aim) * 38 * Math.sin(o); this.vy = Math.cos(this.aim) * 38 * Math.sin(o); this.moving = true; }
      if (this.restT <= 0 && d < 40) {
        if (this.canFatality(tgt)) { this.startFat(g, tgt); }
        else { this.combo = this.pickCombo(tgt); this.ci = 0; this.startMove(g, this.combo[0]); }
      }
    } else {
      const fx = p.x - (p.facing || 1) * 24, fy = p.y + 13;
      const dx = fx - this.x, dy = fy - this.y, d = Math.hypot(dx, dy);
      if (d > 8) { const sp = Math.min(190, 40 + d * 3.2); this.vx = (dx / d) * sp; this.vy = (dy / d) * sp; this.moving = true; this.aim = lerpAng(this.aim, Math.atan2(dy, dx), Math.min(1, dt * 8)); }
      else this.aim = lerpAng(this.aim, p.aim, Math.min(1, dt * 6));
    }
    this.integrate(g, dt);
  }

  private startFat(g: G, e: E) {
    this.fat = { e, t: 0, n: 0, done: false, hx: this.x, hy: this.y };
    this.cur = null; this.fatCd = 8; this.chain = 0;
    g.say?.('BOT: FATALITY!', '#ff4a4a', 2, 1.0);
    g.sfx?.announce?.();
    g.particles?.ring?.(e.x, e.y - 8, 3, 26, '#ff4a4a', 0.3, 2);
  }

  private updateFat(g: G, dt: number) {
    const F = this.fat!, e = F.e;
    if (e.dead) { this.fat = null; this.restT = 0.3; return; }
    F.t += dt;
    const a = Math.atan2(e.y - this.y, e.x - this.x);
    this.aim = lerpAng(this.aim, a, Math.min(1, dt * 16));
    // tahan korban di tempat
    e.stun = Math.max(e.stun ?? 0, 0.35); e.kx = 0; e.ky = 0; e.vx = 0; e.vy = 0;
    if (F.t < 0.14) {
      // menyelinap ke depan korban
      const tx = e.x - Math.cos(a) * 13, ty = e.y - Math.sin(a) * 13;
      const k = Math.min(1, dt / Math.max(0.02, 0.14 - F.t + dt));
      this.x += (tx - this.x) * k; this.y += (ty - this.y) * k;
      g.addAfterimage?.({ x: this.x, y: this.y, facing: this.facing, aim: this.aim, scale: 1, color: '#ff4a4a' }, '#ff4a4a');
      this.poseName = 'run'; this.moving = true;
      return;
    }
    const times = [0.16, 0.3, 0.44, 0.58];
    const poses = ['jab', 'cross', 'hook', 'uppercut'];
    const strikes = ['fhand', 'bhand', 'fhand', 'bhand'];
    if (F.n < 4 && F.t >= times[F.n]) {
      const i = F.n++;
      g.hitstop = Math.max(g.hitstop ?? 0, 0.025); g.shake?.(0.15 + i * 0.05);
      g.particles?.spark?.(e.x, e.y - 7, 7, '#ffffff', a, 1.1, 230);
      g.particles?.blood?.(e.x, e.y - 7, 6, a + rnd(-0.6, 0.6), 160);
      g.blood?.spray?.(e.x, e.y - 7, a, 3, true);
      g.sfx?.punch?.(); if (i >= 2) g.sfx?.heavy?.();
      g.damageEnemy(e, 0.6, 6, a, 20, { melee: false, hitstop: 0.01, shake: 0.05 });
      if (e.dead) { this.fat = null; this.restT = 0.3; return; }
    }
    const idx = Math.min(F.n, 4) - 1;
    if (F.n >= 1 && F.n <= 4 && !F.done) {
      const start = times[Math.max(0, idx)];
      this.poseName = poses[Math.max(0, idx)]; this.strike = strikes[Math.max(0, idx)];
      this.poseT = 0.3 + 0.3 * clamp((F.t - start) / 0.12, 0, 1); this.impact = 1;
    }
    if (F.t >= 0.74 && !F.done) {
      F.done = true;
      const hard = e.boss || e.kind === 'duelist' || e.ai2 || e.sm || e.jack;
      g.hitstop = Math.max(g.hitstop ?? 0, 0.1); g.shake?.(0.8); g.flash?.('#ffffff', 0.35); g.slow?.(0.35, 0.3);
      g.zoomKick = Math.max(g.zoomKick ?? 0, 0.05);
      g.particles?.shockwave?.(e.x, e.y - 6, 34, '#ff4a4a', 0.35);
      g.particles?.ring?.(e.x, e.y - 8, 3, 24, '#ffffff', 0.25, 2);
      g.sfx?.slam?.(); g.sfx?.kill?.();
      this.flashT = 0.4;
      if (hard) {
        e.stagger = 0; e.hp -= e.maxHp * 0.22; e.flash = 0.2; e.kx = Math.cos(a) * 600; e.ky = Math.sin(a) * 600; e.down = Math.max(e.down ?? 0, 0.8); e.state = 'down'; e.pose = 'down';
        g.texts?.hit?.(e.x, e.y - 30, 'FATALITY!', '#ff4a4a', 1, 1.0);
        if (e.hp <= 0) g.killEnemy?.(e, a, 500, false, true, true);
      } else {
        g.killEnemy?.(e, a, 520, false, true, true);
        g.texts?.hit?.(e.x, e.y - 30, 'FATALITY!', '#ff4a4a', 1, 1.0);
      }
    }
    if (F.done) { this.poseName = 'roundhouse'; this.poseT = 0.5; this.strike = 'ffoot'; this.impact = 1; }
    if (F.t >= 0.98) { this.fat = null; this.restT = 0.35; this.chain = 0; }
  }

  private integrate(g: G, dt: number) {
    const mx = (this.vx + this.kx) * dt, my = (this.vy + this.ky) * dt;
    const bx = this.x, by = this.y;
    moveWithCollision(g.level, this, mx, my);
    const f = Math.max(0, 1 - 8 * dt); this.kx *= f; this.ky *= f;
    this.x = clamp(this.x, 20, g.level.w * 16 - 20); this.y = clamp(this.y, 20, g.level.h * 16 - 20);
    const moved = Math.hypot(this.x - bx, this.y - by);
    const sp = moved / Math.max(dt, 0.001);
    this.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
    // langkah dihitung dari jarak tempuh nyata, jadi telapak menapak mantap
    const want = clamp((sp - 70) / 60, 0, 1);
    this.runT += (want - this.runT) * Math.min(1, dt * 12);
    this.strideHalf = 3 + 6.6 * this.runT;
    if (sp > 6 && !this.cur && !this.fat) this.walk += Math.PI * moved * gaitDuty(this.runT) / Math.max(1.5, this.strideHalf) * LEG_K;
    this.moving = this.moving && sp > 6;
  }

  // ------------------------------------------------------------------ gambar
  drawShadow(ctx: Ctx) {
    if (!this.on) return;
    const k = 1 + 0.3 * this.runT;
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    const rx = Math.round(4 * k), ry = Math.round(1.5 * k);
    for (let dy = -ry; dy <= ry; dy++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.5)))); ctx.fillRect(Math.round(this.x) - w, Math.round(this.y + 1) + dy, w * 2 + 1, 1); }
  }
  draw(g: G, ctx: Ctx) {
    if (!this.on) return;
    const m = this.moving && !this.cur && !this.fat;
    const opts: any = {
      x: this.x, y: this.y, c: TINT, c2: '#2a6bff', scale: 1, facing: this.facing, aim: this.aim, look: this.aim,
      walk: this.walk, moving: m, pose: this.poseName, t: this.poseT, acc: 'band', weapon: 'none',
      flash: this.flashT > 0, alpha: 0.97, outline: '#000000', eyes: '#111111', time: g.time,
      lean: { x: Math.cos(this.aim), y: Math.sin(this.aim) }, run: this.runT, stride: this.strideHalf,
      vel: m ? { x: this.vx / (Math.hypot(this.vx, this.vy) || 1), y: this.vy / (Math.hypot(this.vx, this.vy) || 1) } : undefined,
      strike: this.strike, impact: this.impact, mood: this.cur || this.fat ? 'angry' : 'normal', anime: g.v2,
    };
    drawStick(ctx, opts);
    if (this.fat) { const al = 0.5 + 0.5 * Math.sin(g.time * 30); ctx.globalAlpha = al; pcircle(ctx, this.x, this.y - 8, 12, 'rgba(255,60,60,0.25)'); ctx.globalAlpha = 1; }
    pfontO(ctx, 'BOT', this.x, this.y - 22, TINT, '#000', 1, 'center');
  }
}
