import { drawAxe, AXE_LEN } from './weapons';
import { pcircle, pline, pring, px, type Ctx } from './pixel';
import type { Enemy, Pose, Vec } from './types';
import type { Move } from './moves';
import type { Game } from './game';

/**
 * LEVIATHAN — Kratos / viking axe.
 *
 *  LMB              the existing brutal melee chain (swing / backhand / home run).
 *  RMB  idle/walk   THROW: the axe flies spinning at the cursor (aim-assist), punches through enemies,
 *                   then RETURNS on a curved path and SNAPS back into the hand.
 *                   RMB again while it's out = recall early. The return also hits.
 *  SHIFT + RMB      LEAP SMASH: cancel the dash, jump, then bring the axe down from above.
 *                   Shockwave, freeze-frame, frost burst. If the axe was already flying it races
 *                   back so you catch it in the air and slam with it.
 */
const mk = (o: Partial<Move> & { id: string; name: string; dmg: number }): Move => ({
  pose: 'idle', structure: o.dmg * 5, range: 40, arc: 2, windup: 0, active: 0, recover: 0, kb: 420, knockdown: true, lunge: 0,
  hitstop: 0.08, shake: 0.5, sfx: 'axe', limb: 'blade', hitR: 6, bleed: true, ...o,
});
const M_THROW = mk({ id: 'a_throw', name: 'LEVIATHAN', dmg: 11, kb: 480, hitstop: 0.07, shake: 0.45 });
const M_RETURN = mk({ id: 'a_return', name: 'RECALL', dmg: 7, kb: 320, hitstop: 0.04, shake: 0.3 });
const M_SMASH = mk({ id: 'a_leapsmash', name: 'LEAP SMASH', dmg: 18, kb: 520, launch: 80, hitstop: 0.14, shake: 1.1, finisher: true });

const angDiff = (a: number, b: number) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function segDist(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l > 0 ? cl(((cx - ax) * dx + (cy - ay) * dy) / l) : 0;
  return Math.hypot(ax + dx * t - cx, ay + dy * t - cy);
}

type Mode = 'held' | 'windup' | 'fly' | 'return' | 'leap';

export class Leviathan {
  mode: Mode = 'held';
  x = 0; y = 0; vx = 0; vy = 0;
  spin = 0;
  lift = 0;
  ang = 0;
  /** true when the axe is in the player's hands (so the regular drawAxe path can run) */
  held = true;
  bodyPose: Pose | null = null;
  bodyT = 0;
  private t = 0;
  private windT = 0;
  private flyT = 0;
  private maxFly = 0.42;
  private hit = new Set<number>();
  private trail: { x: number; y: number; a: number; t: number }[] = [];
  private catchFlash = 0;
  private leaping = false;
  private smashed = false;
  private aim = 0;

  reset() {
    this.mode = 'held'; this.held = true; this.bodyPose = null; this.leaping = false; this.smashed = false;
    this.trail.length = 0; this.hit.clear(); this.catchFlash = 0;
  }

  update(g: Game, dt: number) {
    if (dt <= 0) return;
    const p = g.player, m = g.input.mouse;
    this.t += dt;
    if (this.catchFlash > 0) this.catchFlash -= dt;
    this.bodyPose = null; this.bodyT = 0;
    while (this.trail.length && this.t - this.trail[0].t > 0.22) this.trail.shift();

    const interrupted = p.stunT > 0 || p.holdT > 0 || !!p.focusDash || p.rageDash || g.state !== 'playing' || !!p.fatality;
    if (interrupted) {
      if (this.mode !== 'held' && this.mode !== 'leap') this.startReturn(g);
      if (this.mode === 'leap' && interrupted) { this.mode = 'held'; this.held = true; this.leaping = false; }
    }

    const shifting = p.dashT > 0 || p.sinceDash < 0.22 || g.input.keys.has('shift');
    if (!interrupted && m.rpressed) {
      if (shifting && !p.airborne && (this.mode === 'held' || this.mode === 'fly' || this.mode === 'return')) this.startLeap(g);
      else if (this.mode === 'held' && !this.leaping) this.startThrow(g);
      else if (this.mode === 'fly') this.startReturn(g);
    }

    switch (this.mode) {
      case 'held': {
        break;
      }
      case 'windup': {
        this.windT += dt;
        this.bodyPose = 'throw'; this.bodyT = cl(this.windT / 0.1);
        this.held = true;
        p.aim = this.aim; p.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
        if (this.windT >= 0.1) this.release(g);
        break;
      }
      case 'fly': {
        this.flyT += dt;
        this.held = false;
        const x0 = this.x, y0 = this.y;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.spin += 18 * dt;
        this.ang = this.spin;
        this.lift = Math.max(0, this.lift - 40 * dt);
        this.hits(g, x0, y0, M_THROW, 0.18);
        this.trail.push({ x: this.x, y: this.y - this.lift, a: this.ang, t: this.t });
        this.frost(g, this.x, this.y - this.lift, 0.5);
        if (!g.isFree(this.x, this.y + 6, 2)) {
          this.x = x0; this.y = y0;
          g.particles.spark(this.x, this.y, 8, '#bfe8ff', this.ang + Math.PI, 1.2, 180);
          g.sfx.ricochet();
          this.startReturn(g);
          break;
        }
        if (this.flyT >= this.maxFly) this.startReturn(g);
        break;
      }
      case 'return': {
        this.held = false;
        const hand = this.hand(g);
        const x0 = this.x, y0 = this.y;
        const dx = hand.x - this.x, dy = hand.y - this.y, d = Math.hypot(dx, dy);
        const sp = Math.min(980, 420 + this.flyT * 1400);
        this.flyT += dt;
        if (d < 10 + sp * dt) { this.catch(g); break; }
        this.vx = (dx / d) * sp; this.vy = (dy / d) * sp;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.spin += 22 * dt;
        this.ang = this.spin;
        this.lift = Math.sin(cl(d / 80) * Math.PI) * 8;
        this.hits(g, x0, y0, M_RETURN, 0.16);
        this.trail.push({ x: this.x, y: this.y - this.lift, a: this.ang, t: this.t });
        this.frost(g, this.x, this.y - this.lift, 0.35);
        break;
      }
      case 'leap': {
        this.leaping = true;
        p.dashT = 0;
        // hop is driven by the game's jump physics; we just keep the pose and watch for landing
        const up = p.vz > 0;
        this.bodyPose = 'a_leap';
        this.bodyT = up ? cl(0.15 + 0.35 * (1 - p.vz / 340)) : (p.z > 8 ? 0.45 : 0.55 + 0.4 * (1 - p.z / 18));
        this.aim = p.aim;
        if (!p.airborne && this.t > 0.12 && !this.smashed) this.smash(g);
        break;
      }
    }

    // if leaping, keep recalling the axe into the hand
    if (this.leaping && !this.held && this.mode === 'leap') {
      // pull the flying axe in while we jump
      const hand = this.hand(g);
      const dx = hand.x - this.x, dy = hand.y - this.y, d = Math.hypot(dx, dy);
      if (d < 14) { this.held = true; this.catchFlash = 0.12; }
      else {
        const sp = 1100;
        this.x += (dx / d) * sp * dt; this.y += (dy / d) * sp * dt;
        this.spin += 24 * dt; this.ang = this.spin;
        this.trail.push({ x: this.x, y: this.y, a: this.ang, t: this.t });
      }
    }
  }

  private hand(g: Game): Vec {
    const p = g.player;
    return { x: p.x + p.facing * 6, y: p.y - 8 - p.z };
  }

  private aimAt(g: Game): number {
    const p = g.player, mw = g.mouseWorld();
    let ang = Math.atan2(mw.y - (p.y - 6), mw.x - p.x);
    let best: Enemy | null = null, bs = Infinity;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 170) continue;
      const da = Math.abs(angDiff(Math.atan2(e.y - 6 - (p.y - 6), e.x - p.x), ang));
      if (da > 0.7) continue;
      const sc = da * 80 + d * 0.25;
      if (sc < bs) { bs = sc; best = e; }
    }
    if (best) ang = Math.atan2(best.y - 6 - (p.y - 6), best.x - p.x);
    return ang;
  }

  private startThrow(g: Game) {
    const p = g.player;
    this.aim = this.aimAt(g);
    this.mode = 'windup'; this.windT = 0; this.held = true;
    p.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
    p.aim = this.aim;
    p.kx += Math.cos(this.aim) * 40; p.ky += Math.sin(this.aim) * 36;
    g.sfx.whoosh();
    g.texts.add(p.x, p.y - 26, 'THROW', '#bfe8ff', 1, 0.45);
  }

  private release(g: Game) {
    const p = g.player;
    const hand = this.hand(g);
    this.x = hand.x; this.y = hand.y; this.lift = 2;
    const sp = 620;
    this.vx = Math.cos(this.aim) * sp; this.vy = Math.sin(this.aim) * sp;
    this.mode = 'fly'; this.flyT = 0; this.maxFly = 0.38; this.held = false;
    this.hit.clear(); this.spin = this.aim;
    g.sfx.axeSwing();
    g.sfx.whoosh();
    g.particles.dirBurst(hand.x, hand.y, 8, '#bfe8ff', this.aim, 0.5, 140, 0.3);
    g.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: this.aim, scale: 1 }, '#bfe8ff', { x: Math.cos(this.aim), y: Math.sin(this.aim) });
  }

  private startReturn(g: Game) {
    if (this.mode === 'held') return;
    this.mode = 'return'; this.flyT = 0; this.hit.clear(); this.held = false;
    g.sfx.whoosh();
  }

  private catch(g: Game) {
    const p = g.player;
    this.mode = 'held'; this.held = true; this.lift = 0; this.trail.length = 0;
    this.catchFlash = 0.18;
    g.sfx.axeHit(false);
    g.sfx.batCrack();
    g.hitstop = Math.max(g.hitstop, 0.06);
    g.shake(0.25);
    g.particles.ring(p.x + p.facing * 6, p.y - 8 - p.z, 3, 14, '#bfe8ff', 0.2, 1);
    g.particles.burst(p.x + p.facing * 6, p.y - 8, 8, '#ffffff', 90, 0.3);
    g.texts.add(p.x, p.y - 24, 'CATCH', '#ffffff', 1, 0.35);
  }

  private startLeap(g: Game) {
    const p = g.player;
    // if the axe is out, yank it home so we slam WITH it
    if (!this.held) { this.mode = 'leap'; this.leaping = true; this.smashed = false; }
    else this.mode = 'leap';
    this.leaping = true; this.smashed = false; this.t = 0;
    p.dashT = 0; p.vx *= 0.3; p.vy *= 0.3;
    p.airborne = true; p.vz = 340; p.z = 0.1; p.iframes = Math.max(p.iframes, 0.45);
    p.attackPhase = 'none'; p.buffered = null;
    this.aim = this.aimAt(g);
    p.aim = this.aim; p.facing = Math.cos(this.aim) >= 0 ? 1 : -1;
    g.sfx.whoosh(); g.sfx.dash();
    g.texts.add(p.x, p.y - 28, 'LEAP SMASH', '#ffb347', 1, 0.55);
    g.particles.smoke(p.x, p.y, 8, '#9a8f7d', 40, 0.4);
    g.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: this.aim, scale: 1 }, '#ffb347', { x: Math.cos(this.aim), y: Math.sin(this.aim) });
  }

  private smash(g: Game) {
    const p = g.player;
    this.smashed = true; this.leaping = false; this.mode = 'held'; this.held = true;
    p.z = 0; p.vz = 0; p.airborne = false; p.landT = 0.16; p.squash = 0.62;
    const ix = p.x + Math.cos(this.aim) * 16, iy = p.y + Math.sin(this.aim) * 10;
    g.flash('#ffffff', 0.18); g.slow(0.28, 0.22); g.shake(0.85);
    g.hitstop = Math.max(g.hitstop, 0.1);
    g.sfx.slam(); g.sfx.axeHit(true); g.sfx.batCrack();
    g.particles.shockwave(ix, iy - 2, 36, '#ffb347', 0.35);
    g.particles.burst(ix, iy - 2, 16, '#ffffff', 160, 0.45);
    g.particles.smoke(ix, iy, 10, '#9a8f7d', 50, 0.5);
    this.frost(g, ix, iy, 8);
    g.say('CRUSH', '#ffb347', 2, 0.7);
    const mv = M_SMASH;
    let n = 0;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (Math.hypot(e.x - ix, e.y - iy) > 38 + e.r) continue;
      g.meleeHitEnemy(e, mv, Math.atan2(e.y - p.y, e.x - p.x), { x: e.x, y: e.y - e.z - 5 });
      n++;
    }
    g.shockwaveHit(ix, iy, 34, 6 * g.stats.meleeDmg, -1);
    if (n > 0) g.addCombo(n);
    p.focus = Math.min(300, p.focus + 8 * n * g.stats.focusGain);
  }

  private hits(g: Game, x0: number, y0: number, mv: Move, cd: number) {
    const p = g.player;
    const ax = this.x, ay = this.y - this.lift;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (this.hit.has(e.id)) continue;
      const ey = e.y - e.z - 6;
      if (segDist(x0, y0, ax, ay, e.x, ey) > e.r + 7) continue;
      this.hit.add(e.id);
      g.meleeHitEnemy(e, mv, Math.atan2(e.y - p.y, e.x - p.x), { x: e.x, y: ey });
      g.particles.spark(e.x, ey, 8, '#bfe8ff', this.ang, 1.1, 200);
      this.frost(g, e.x, ey, 3);
      // a tiny freeze on the victim — the Leviathan "frosted" beat
      e.stun = Math.max(e.stun, 0.12);
      void cd;
    }
    for (const pr of g.props) {
      if (pr.dead) continue;
      if (segDist(x0, y0, ax, ay, pr.x, pr.y - 4) > 7 + pr.r) continue;
      g.damageProp(pr, 3, Math.atan2(pr.y - p.y, pr.x - p.x));
    }
    for (const b of g.bullets) {
      if (b.owner !== 'enemy' || b.kind === 'bomb') continue;
      if (segDist(x0, y0, ax, ay, b.x, b.y) > 8) continue;
      g.deflectBullet(b, this.ang);
    }
  }

  private frost(g: Game, x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 18 + Math.random() * 50;
      g.particles.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 10, life: 0.28 + Math.random() * 0.2, c: Math.random() < 0.5 ? '#bfe8ff' : '#ffffff', k: 0, s: 1 });
    }
  }

  /** flying axe + recall trail. Hand-held axe is drawn by game.ts when `held`. */
  draw(ctx: Ctx, g: Game) {
    if (this.catchFlash > 0) {
      const p = g.player;
      ctx.globalAlpha = this.catchFlash / 0.18 * 0.5;
      pring(ctx, p.x + p.facing * 6, p.y - 8 - p.z, 10, '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    if (this.held) return;

    // frost ribbon
    const tr = this.trail;
    for (let i = 1; i < tr.length; i++) {
      const a = tr[i - 1], b = tr[i];
      const k = 1 - (this.t - b.t) / 0.22;
      if (k <= 0) continue;
      ctx.globalAlpha = k * 0.55;
      pline(ctx, a.x, a.y, b.x, b.y, i % 2 ? '#bfe8ff' : '#ffffff', 2);
    }
    ctx.globalAlpha = 1;

    const bx = this.x, by = this.y - this.lift;
    ctx.globalAlpha = 0.35;
    pcircle(ctx, bx, by, 7, '#bfe8ff');
    ctx.globalAlpha = 1;
    drawAxe(ctx, { x: bx, y: by }, this.ang, 0);
    // spinning glint
    const gx = bx + Math.cos(this.ang) * AXE_LEN, gy = by + Math.sin(this.ang) * AXE_LEN * 0.6;
    px(ctx, gx, gy, '#ffffff');
  }
}
