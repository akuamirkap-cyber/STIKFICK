import { pcircle, pellipse, pline, pring, px, type Ctx } from './pixel';
import type { Pose, Vec } from './types';
import type { Move } from './moves';
import type { Game } from './game';

/**
 * YOYO — the freestyle / breakdance weapon.
 *
 *  LMB tap   B-BOY COMBO   every tap is the next breakdance move, the body AND the yoyo both hit:
 *                          TOP ROCK (yoyo whip) -> SIX-STEP (leg sweep, trips) -> WINDMILL (travels) -> HEADSPIN (rotor, launches)
 *                          -> AIR FLARE + FREEZE (finisher: pops up, locks a one-hand freeze, yoyo slams down).
 *                          Tap again while a move is finishing to cancel straight into the next one.
 *  LMB hold  FREESTYLE     after a move the yoyo follows your cursor on a springy string while the body grooves.
 *  RMB       TRICK         Around The World / Loop The Loop / Infinity 8 / Corkscrew Rocket / Guillotine Drop,
 *                          tap RMB mid-trick to CHAIN (+damage). Works as a cancel out of a break move too.
 *
 * Everything is hit-tested along the segment the yoyo / feet swept since last frame, so it hits exactly where you see it.
 */
export const YO_LEN = 60;

interface TrickDef { id: 'atw' | 'loop' | 'fig8' | 'rocket' | 'guillotine'; name: string; col: string; dur: number }
export const TRICKS: TrickDef[] = [
  { id: 'atw', name: 'AROUND THE WORLD', col: '#35f0ff', dur: 0.78 },
  { id: 'loop', name: 'LOOP THE LOOP', col: '#ffd700', dur: 0.8 },
  { id: 'fig8', name: 'INFINITY 8', col: '#ff6bd6', dur: 0.95 },
  { id: 'rocket', name: 'CORKSCREW ROCKET', col: '#ff8c3a', dur: 0.72 },
  { id: 'guillotine', name: 'GUILLOTINE DROP', col: '#ff4d4d', dur: 0.62 },
];

interface BreakDef { id: 'toprock' | 'sixstep' | 'windmill' | 'headspin' | 'flare'; name: string; pose: Pose; col: string; dur: number; cancelAt: number }
export const BREAKS: BreakDef[] = [
  { id: 'toprock', name: 'TOP ROCK', pose: 'y_toprock', col: '#35f0ff', dur: 0.44, cancelAt: 0.62 },
  { id: 'sixstep', name: 'SIX-STEP', pose: 'y_sixstep', col: '#ffd700', dur: 0.62, cancelAt: 0.7 },
  { id: 'windmill', name: 'WINDMILL', pose: 'y_windmill', col: '#ff6bd6', dur: 0.78, cancelAt: 0.74 },
  { id: 'headspin', name: 'HEADSPIN', pose: 'y_headspin', col: '#08d9d6', dur: 0.88, cancelAt: 0.78 },
  { id: 'flare', name: 'AIR FLARE + FREEZE', pose: 'y_flare', col: '#ff4d4d', dur: 0.95, cancelAt: 0.97 },
];

const mk = (o: Partial<Move> & { id: string; name: string; dmg: number }): Move => ({
  pose: 'idle', structure: 8, range: 30, arc: Math.PI, windup: 0, active: 0, recover: 0, kb: 140, knockdown: false, lunge: 0,
  hitstop: 0.02, shake: 0.1, sfx: 'nunchaku', limb: 'fhand', hitR: 4, ...o,
});
const Y_FREE = mk({ id: 'y_free', name: 'FREESTYLE', dmg: 1.2, structure: 8, kb: 150, hitstop: 0.02, shake: 0.12 });
const Y_ZIP = mk({ id: 'y_zip', name: 'ZIPPER', dmg: 2.8, structure: 15, kb: 300, hitstop: 0.035, shake: 0.2 });
const Y_RET = mk({ id: 'y_ret', name: 'RECALL', dmg: 1.5, structure: 8, kb: 150, hitstop: 0.02, shake: 0.1 });
const Y_TRICK = mk({ id: 'y_trick', name: 'TRICK', dmg: 2.1, structure: 12, kb: 210, hitstop: 0.03, shake: 0.18 });
const Y_ORBIT = mk({ id: 'y_orbit', name: 'ORBIT', dmg: 1.9, structure: 11, kb: 200, hitstop: 0.025, shake: 0.15 });
const mkLeg = (dmg: number, knockdown: boolean, launch = 0) => mk({ id: 'y_leg', name: 'LEG', dmg, structure: 14, kb: 260, knockdown, launch, sfx: 'kick', hitstop: 0.035, shake: 0.2 });
const LEG_SIX = mkLeg(1.7, true);
const LEG_WIND = mkLeg(2.1, false);
const LEG_SPIN = mkLeg(1.3, false);
const LEG_SPIN_END = mkLeg(2.0, true, 80);
const LEG_FLARE = mkLeg(2.2, true);

interface Trick { def: TrickDef; t: number; a: number; sign: number; ox: number; oy: number; tx: number; ty: number; fired: boolean }
interface Brk { def: BreakDef; idx: number; t: number; ang: number; dist: number; sign: number; fired: boolean; pushed: boolean; from: Vec }
type Mode = 'idle' | 'free' | 'trick' | 'recall' | 'break';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
function segDist(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l > 0 ? ((cx - ax) * dx + (cy - ay) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + dx * t - cx, ay + dy * t - cy);
}

export class Yoyo {
  x = 0; y = 0; vx = 0; vy = 0;
  lift = 0;
  spin = 0;
  speed = 0;
  mode: Mode = 'idle';
  hand: Vec = { x: 0, y: 0 };
  trickIdx = 0;
  trick: Trick | null = null;
  brk: Brk | null = null;
  queued = false;
  queuedBreak = false;
  queuedTrick = false;
  chain = 0;
  chainT = 0;
  comboIdx = 0;
  comboGap = 9;
  breakCount = 0;
  trail: { x: number; y: number; age: number; h: number }[] = [];
  /** what the BODY should be doing this frame (read by game.ts for the skeleton pose) */
  bodyPose: Pose | null = null;
  bodyT = 0;
  sub = 0;
  sign = 1;
  anchorLimb: 'fhand' | 'ffoot' = 'fhand';
  weldHand = true;
  trailCol: string | null = null;
  private rt = 0;
  private t = 0;
  private init = false;
  private cds = new Map<number, number>();
  private prevFeet: Vec[] | null = null;
  hitFlash = 0;

  reset(x: number, y: number) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.lift = 0; this.speed = 0;
    this.mode = 'idle'; this.trick = null; this.brk = null; this.queued = false; this.queuedBreak = false; this.queuedTrick = false;
    this.trail.length = 0; this.init = true; this.prevFeet = null; this.bodyPose = null;
    this.cds.clear();
  }

  nextTrick(): TrickDef { return TRICKS[this.trickIdx % TRICKS.length]; }
  nextBreak(): BreakDef { return BREAKS[(this.comboGap > 0.75 ? 0 : this.comboIdx) % BREAKS.length]; }

  // ---------------------------------------------------------------- update
  update(g: Game, dt: number, base: Vec, feet: Vec[]) {
    if (dt <= 0) return;
    const p = g.player, m = g.input.mouse, now = g.time;
    const busy = this.mode === 'break' || this.mode === 'trick';
    if (!this.init || (!busy && Math.hypot(this.x - base.x, this.y - base.y) > YO_LEN * 2.2)) this.reset(base.x, base.y + 10);

    // the throwing hand leans toward the yoyo so the arm follows the action
    const ddx = this.x - base.x, ddy = this.y - base.y, dd = Math.hypot(ddx, ddy) || 1;
    const sh = Math.min(3.5, dd * 0.25);
    const hand: Vec = { x: base.x + (ddx / dd) * sh, y: base.y + (ddy / dd) * sh };
    this.hand = hand;
    this.t += dt;
    if (this.mode !== 'break') this.comboGap += dt;
    this.chainT -= dt; if (this.chainT <= 0) this.chain = 0;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.bodyPose = null; this.bodyT = 0; this.anchorLimb = 'fhand'; this.weldHand = true; this.trailCol = null;

    const interrupted = p.stunT > 0 || p.holdT > 0 || p.dashT > 0 || !!p.focusDash || p.rageDash;
    if (interrupted && this.mode !== 'idle' && this.mode !== 'recall') {
      this.mode = 'recall'; this.rt = 0; this.trick = null; this.brk = null; this.queued = false; this.queuedBreak = false; this.queuedTrick = false;
    }

    // ---- inputs
    if (!interrupted && g.state === 'playing') {
      if (m.rpressed) {
        if (this.mode === 'trick') this.queued = true;
        else if (this.mode === 'break') this.queuedTrick = true;
        else this.startTrick(g, hand, false);
      } else if (m.pressed && !p.airborne) {
        if (this.mode === 'break') this.queuedBreak = true;
        else if (this.mode === 'trick') {
          if (this.trick && this.trick.t / this.trick.def.dur > 0.4) { this.trick = null; this.queued = false; this.startBreak(g, hand); }
        } else this.startBreak(g, hand);
      }
    }

    const x0 = this.x, y0 = this.y;
    let hitMove: Move | null = null;
    let hitCd = 0.2;
    let outward = true;
    let legMove: Move | null = null;
    let legCd = 0.2;

    switch (this.mode) {
      case 'idle': {
        const still = !p.moving;
        const w = this.t * 9, r = still ? 5 : 1.5;
        this.spring(hand.x + p.facing * 7 + Math.cos(w) * r, hand.y + 11 + Math.sin(w) * r, 380, 22, dt, 600);
        this.constrain(hand);
        if (this.lift > 0) this.lift = Math.max(0, this.lift - dt * 60);
        if (still) { this.bodyPose = 'y_idle'; this.bodyT = 0; }
        break;
      }
      case 'free': {
        if (!m.down) { this.mode = 'recall'; this.rt = 0; break; }
        const mw = g.mouseWorld();
        let tx = mw.x - hand.x, ty = mw.y - hand.y;
        const td = Math.hypot(tx, ty);
        if (td > YO_LEN) { tx = (tx / td) * YO_LEN; ty = (ty / td) * YO_LEN; }
        this.spring(hand.x + tx, hand.y + ty, 1500, 36, dt, 1100);
        this.constrain(hand);
        if (this.lift > 0) this.lift = Math.max(0, this.lift - dt * 60);
        if (!g.isFree(this.x, this.y + 8, 1)) {
          this.x = x0; this.y = y0; this.vx *= -0.35; this.vy *= -0.35;
        }
        const sp = Math.hypot(this.vx, this.vy);
        if (sp > 90) {
          hitMove = { ...Y_FREE, dmg: 0.9 + Math.min(2.4, sp / 210), kb: 120 + sp * 0.28, knockdown: sp > 700 };
          hitCd = 0.17; outward = sp < 130;
        }
        if (!p.moving) { this.bodyPose = 'y_idle'; this.bodyT = 1; }
        break;
      }
      case 'recall': {
        this.rt += dt;
        const dx = hand.x - this.x, dy = hand.y - this.y, d = Math.hypot(dx, dy);
        const sp = Math.min(1700, 700 + this.rt * 2600), step = sp * dt;
        if (this.lift > 0) this.lift = Math.max(0, this.lift - dt * 90);
        if (d <= step + 3) {
          this.mode = 'idle'; this.vx = dx * 2; this.vy = dy * 2;
          g.particles.ring(hand.x, hand.y, 2, 9, '#ffffff', 0.14, 1);
          g.sfx.chainRattle();
        } else {
          this.x += (dx / d) * step; this.y += (dy / d) * step; this.vx = (dx / d) * sp; this.vy = (dy / d) * sp;
        }
        hitMove = Y_RET; hitCd = 0.25;
        if (!p.moving) { this.bodyPose = 'y_idle'; this.bodyT = 0.6; }
        break;
      }
      case 'trick': {
        const T = this.trick!;
        T.t += dt;
        const u = T.t / T.def.dur;
        this.bodyPose = 'y_trick'; this.bodyT = Math.min(1, u); this.sub = TRICKS.indexOf(T.def); this.sign = T.sign;
        if (u >= 1) {
          this.chainT = 1.4;
          if (this.queued) { this.queued = false; this.startTrick(g, hand, true); }
          else { this.mode = 'recall'; this.rt = 0; this.trick = null; this.lift = 0; }
          break;
        }
        const pos = this.trickPos(T, u, hand);
        const b = smooth(Math.min(1, T.t / 0.1));
        this.x = lerp(hand.x + T.ox, pos.x, b); this.y = lerp(hand.y + T.oy, pos.y, b);
        this.lift = pos.lift;
        this.vx = (this.x - x0) / dt; this.vy = (this.y - y0) / dt;
        // events
        if (T.def.id === 'rocket' && u >= 0.5 && !T.fired) { T.fired = true; this.slam(g, this.x, this.y + 8, 30, 3.5, false); }
        if (T.def.id === 'guillotine' && u >= 0.66 && !T.fired) { T.fired = true; this.slam(g, this.x, this.y + 8, 27, 6, true); }
        if (this.lift < 5 && T.def.id !== 'guillotine') {
          const mult = 1 + Math.min(0.6, (this.chain - 1) * 0.12);
          hitMove = { ...Y_TRICK, dmg: Y_TRICK.dmg * mult };
          hitCd = 0.18;
        }
        break;
      }
      case 'break': {
        const B = this.brk!;
        B.t += dt;
        const D = B.def, u = Math.min(1, B.t / D.dur);
        const cx = p.x, gy = p.y - p.z;
        const dirx = Math.cos(B.ang), diry = Math.sin(B.ang);
        this.bodyPose = D.pose; this.bodyT = u; this.sign = B.sign; this.trailCol = D.col;
        let tx = this.x, ty = this.y, lift = 0;
        hitMove = Y_ORBIT; hitCd = 0.16;
        if (D.id === 'toprock') {
          // whip the yoyo out at the target, then reel it back in with a flourish loop
          if (!B.pushed && u > 0.22) { B.pushed = true; p.kx += dirx * 80; p.ky += diry * 80; }
          const out = 0.32;
          let d: number, off = 0;
          if (u < out) d = B.dist * smooth(u / out);
          else { const w = (u - out) / (1 - out); d = B.dist * (1 - smooth(w)); off = Math.sin(w * Math.PI * 2) * 15 * (1 - w); }
          tx = hand.x + dirx * d - diry * off; ty = hand.y + diry * d + dirx * off;
          hitMove = Y_ZIP; hitCd = 0.22;
        } else if (D.id === 'sixstep') {
          // low leg sweep: the string is tied to the foot, the yoyo orbits along the floor and trips everything it touches
          this.anchorLimb = 'ffoot'; this.weldHand = false;
          const th = B.ang + B.sign * u * Math.PI * 2 * 1.8;
          tx = cx + Math.cos(th) * 27; ty = gy - 2 + Math.sin(th) * 15;
          legMove = LEG_SIX; legCd = 0.2;
        } else if (D.id === 'windmill') {
          this.anchorLimb = 'ffoot'; this.weldHand = false;
          const th = B.ang + Math.PI + B.sign * u * Math.PI * 2 * 2.3;
          tx = cx + Math.cos(th) * 40; ty = gy - 6 + Math.sin(th) * 20;
          if (u > 0.1 && u < 0.9) { p.kx = dirx * 85; p.ky = diry * 85; }
          legMove = LEG_WIND; legCd = 0.17;
        } else if (D.id === 'headspin') {
          this.anchorLimb = 'ffoot'; this.weldHand = false;
          const th = B.sign * u * Math.PI * 2 * 3.5;
          tx = cx + Math.cos(th) * 38; ty = gy - 10 + Math.sin(th) * 16;
          if (u > 0.1 && u < 0.85) { p.kx = dirx * 26; p.ky = diry * 26; }
          legMove = u > 0.82 ? LEG_SPIN_END : LEG_SPIN; legCd = 0.11;
        } else {
          // AIR FLARE: spin, then pop up -> the yoyo drops like a hammer while the body locks a one-hand FREEZE
          this.weldHand = false;
          const S = { x: cx + dirx * 26, y: gy + diry * 12 };
          const orbit = (uu: number): Vec => { const th = B.sign * uu * Math.PI * 2 * 2.0; return { x: cx + Math.cos(th) * 34, y: gy - 6 + Math.sin(th) * 17 }; };
          if (u < 0.58) {
            this.anchorLimb = 'ffoot';
            const o = orbit(u / 0.58); tx = o.x; ty = o.y;
            legMove = LEG_FLARE; legCd = 0.18;
          } else if (u < 0.7) {
            const w = smooth((u - 0.58) / 0.12), o = orbit(1);
            tx = lerp(o.x, S.x, w); ty = lerp(o.y, S.y, w); lift = Math.sin(w * Math.PI) * 14;
          } else {
            this.anchorLimb = 'fhand';
            if (!B.fired) { B.fired = true; this.slam(g, S.x, S.y, 34, 7, true); this.sub = 9; g.say(D.name, D.col, 2, 0.9); }
            const w2 = smooth((u - 0.8) / 0.15);
            tx = lerp(S.x, hand.x + 3, w2); ty = lerp(S.y, hand.y + 10 + Math.sin(g.time * 22) * 1.2, w2);
            hitMove = null;
          }
        }
        const bb = smooth(Math.min(1, B.t / 0.08));
        this.x = lerp(B.from.x, tx, bb); this.y = lerp(B.from.y, ty, bb); this.lift = lift;
        this.vx = (this.x - x0) / dt; this.vy = (this.y - y0) / dt;
        if (u >= 1 || (u >= D.cancelAt && (this.queuedBreak || this.queuedTrick))) this.endBreak(g, hand, m.down);
        break;
      }
    }

    // ---- bookkeeping
    const moved = Math.hypot(this.x - x0, this.y - y0);
    this.speed = lerp(this.speed, moved / dt, 0.5);
    this.spin += (9 + this.speed * 0.06) * dt;

    // ---- hits
    if (hitMove) this.hits(g, x0, y0, hitMove, hitCd, outward, now);
    if (legMove) this.legHits(g, feet, legMove, legCd, now);
    this.prevFeet = feet.map((f) => ({ x: f.x, y: f.y }));
    this.hitProps(g, x0, y0, now);

    // ---- juice: trail + sparkles + whoosh
    for (const t of this.trail) t.age += dt;
    while (this.trail.length && this.trail[0].age > 0.32) this.trail.shift();
    if (this.speed > 70 || this.mode === 'trick' || this.mode === 'break') {
      this.trail.push({ x: this.x, y: this.y - this.lift, age: 0, h: (g.time * 520) % 360 });
      if (this.trail.length > 36) this.trail.shift();
    }
    if (this.speed > 380 && Math.random() < 0.45) {
      const ang = Math.random() * Math.PI * 2;
      g.particles.add({ x: this.x, y: this.y - this.lift, vx: Math.cos(ang) * 30, vy: Math.sin(ang) * 30, life: 0.28, c: `hsl(${(g.time * 520) % 360},100%,65%)`, k: 0, s: 1 });
    }
    if (this.mode === 'break' && this.brk && this.brk.def.id !== 'toprock' && this.brk.t > 0.12 && Math.random() < 0.5) {
      // dust kicked up by the spinning body
      g.particles.smoke(p.x + (Math.random() - 0.5) * 14, p.y + 1, 1, '#9a9a9a', 22, 0.35);
    }
    if (this.speed > 330 && Math.random() < 0.06) g.sfx.whoosh();
  }

  // ---------------------------------------------------------------- physics helpers
  private spring(tx: number, ty: number, k: number, c: number, dt: number, maxV: number) {
    const n = Math.min(14, Math.max(1, Math.ceil(dt / 0.008))), h = dt / n;
    for (let i = 0; i < n; i++) {
      this.vx += (k * (tx - this.x) - c * this.vx) * h;
      this.vy += (k * (ty - this.y) - c * this.vy) * h;
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > maxV) { this.vx *= maxV / sp; this.vy *= maxV / sp; }
      this.x += this.vx * h; this.y += this.vy * h;
    }
  }
  /** string length: never farther than YO_LEN from the hand; kills the outward velocity (so it whips back) */
  private constrain(hand: Vec) {
    const dx = this.x - hand.x, dy = this.y - hand.y, d = Math.hypot(dx, dy);
    if (d > YO_LEN) {
      const nx = dx / d, ny = dy / d;
      this.x = hand.x + nx * YO_LEN; this.y = hand.y + ny * YO_LEN;
      const vr = this.vx * nx + this.vy * ny;
      if (vr > 0) { this.vx -= nx * vr * 1.25; this.vy -= ny * vr * 1.25; }
    }
  }

  // ---------------------------------------------------------------- actions
  /** aim at the cursor, snapping to the enemy closest to the cursor direction (generous cone) */
  private aimTarget(g: Game, hand: Vec): { ang: number; dist: number } {
    const mw = g.mouseWorld();
    let ang = Math.atan2(mw.y - hand.y, mw.x - hand.x);
    let dist = Math.min(YO_LEN, Math.max(34, Math.hypot(mw.x - hand.x, mw.y - hand.y)));
    let best: { x: number; y: number } | null = null, bs = Infinity;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const ex = e.x, ey = e.y - e.z - 6, d = Math.hypot(ex - hand.x, ey - hand.y);
      if (d > YO_LEN + e.r + 14) continue;
      let da = Math.abs(Math.atan2(ey - hand.y, ex - hand.x) - ang);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da > 0.8) continue;
      const s = da * 60 + d * 0.3;
      if (s < bs) { bs = s; best = { x: ex, y: ey }; }
    }
    if (best) { ang = Math.atan2(best.y - hand.y, best.x - hand.x); dist = Math.min(YO_LEN, Math.hypot(best.x - hand.x, best.y - hand.y) + 12); }
    return { ang, dist };
  }

  private startBreak(g: Game, hand: Vec) {
    const p = g.player;
    const idx = this.comboGap > 0.75 ? 0 : this.comboIdx % BREAKS.length;
    const def = BREAKS[idx];
    this.comboIdx = idx + 1;
    this.breakCount++;
    const a = this.aimTarget(g, hand);
    this.brk = { def, idx, t: 0, ang: a.ang, dist: a.dist, sign: this.breakCount % 2 ? 1 : -1, fired: false, pushed: false, from: { x: this.x, y: this.y } };
    this.mode = 'break'; this.trick = null; this.queued = false; this.queuedBreak = false; this.queuedTrick = false;
    this.cds.clear();
    g.sfx.whoosh(); g.sfx.swing(1.0 + idx * 0.12);
    g.texts.add(p.x, p.y - 28, def.name, def.col, 1, 0.7);
    g.particles.ring(p.x, p.y, 3, 16, def.col, 0.22, 1);
    p.kx += Math.cos(a.ang) * 30; p.ky += Math.sin(a.ang) * 30;
  }

  private endBreak(g: Game, hand: Vec, held: boolean) {
    const B = this.brk!;
    this.comboGap = 0;
    if (B.idx >= BREAKS.length - 1) this.comboIdx = 0;
    this.brk = null;
    if (this.queuedBreak) { this.startBreak(g, hand); }
    else if (this.queuedTrick) { this.queuedTrick = false; this.startTrick(g, hand, false); }
    else if (held) { this.mode = 'free'; }
    else { this.mode = 'recall'; this.rt = 0; }
  }

  private startTrick(g: Game, hand: Vec, chained: boolean) {
    const p = g.player;
    const def = this.nextTrick();
    this.trickIdx++;
    this.chain = chained ? this.chain + 1 : 1;
    this.chainT = 1.4;
    const mw = g.mouseWorld();
    let tx = mw.x, ty = mw.y;
    // guillotine: lock the nearest enemy near the cursor
    if (def.id === 'guillotine') {
      let bd = 70;
      for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        const d = Math.hypot(e.x - mw.x, e.y - 6 - mw.y);
        if (d < bd && Math.hypot(e.x - hand.x, e.y - hand.y) < YO_LEN + 20) { bd = d; tx = e.x; ty = e.y - 6; }
      }
    }
    this.trick = { def, t: 0, a: p.aim, sign: this.chain % 2 ? 1 : -1, ox: this.x - hand.x, oy: this.y - hand.y, tx, ty, fired: false };
    this.mode = 'trick'; this.brk = null; this.queuedBreak = false; this.queuedTrick = false;
    this.cds.clear();
    g.sfx.whoosh(); g.sfx.swing(1.2);
    g.texts.add(p.x, p.y - 28, def.name, def.col, 1, 0.75);
    if (this.chain >= 2) g.texts.add(p.x, p.y - 37, `CHAIN x${this.chain}`, '#ffffff', 1, 0.6);
    g.particles.ring(hand.x, hand.y, 3, 14, def.col, 0.2, 1);
  }

  private trickPos(T: Trick, u: number, hand: Vec): { x: number; y: number; lift: number } {
    const L = YO_LEN;
    let f = 0, s = 0;
    const id = T.def.id;
    if (id === 'atw') {
      const th = T.a + T.sign * Math.PI * 2 * 2.25 * u;
      return { x: hand.x + Math.cos(th) * L * 0.78, y: hand.y + Math.sin(th) * L * 0.78, lift: 0 };
    }
    if (id === 'loop') {
      const th = Math.PI + Math.PI * 4 * u;
      const cx = L * (0.46 + 0.2 * u), r = L * 0.4;
      f = cx + Math.cos(th) * r; s = Math.sin(th) * r * T.sign;
    } else if (id === 'fig8') {
      const th = Math.PI * 4 * u;
      f = L * 0.58 + Math.sin(2 * th) * L * 0.3; s = Math.sin(th) * L * 0.72 * T.sign;
    } else if (id === 'rocket') {
      if (u < 0.5) { const v = u / 0.5; f = L * (1 - (1 - v) * (1 - v)); s = Math.sin(v * Math.PI * 8) * L * 0.16 * (0.4 + 0.6 * v); }
      else { const w = (u - 0.5) / 0.5; f = L * Math.pow(1 - w, 1.4); s = Math.sin(w * Math.PI * 6) * L * 0.16 * (1 - w); }
    } else {
      // guillotine: arc up and over, then crash down on the target
      const mx = T.tx - hand.x, my = T.ty - hand.y, md = Math.hypot(mx, my) || 1;
      const k = Math.min(1, (L * 0.95) / md);
      const gx = hand.x + mx * k, gy = hand.y + my * k;
      if (u < 0.66) {
        const v = u / 0.66, e = v * v * (3 - 2 * v);
        const lift = Math.sin(Math.min(1, v * 1.04) * Math.PI * 0.5) * 20 * (1 - Math.pow(Math.max(0, v - 0.55) / 0.45, 2));
        return { x: lerp(hand.x, gx, e), y: lerp(hand.y, gy, e), lift: Math.max(0, lift) };
      }
      return { x: gx, y: gy, lift: 0 };
    }
    const ca = Math.cos(T.a), sa = Math.sin(T.a);
    return { x: hand.x + ca * f - sa * s, y: hand.y + sa * f + ca * s, lift: 0 };
  }

  /** ground-pound / shockwave at the yoyo's feet */
  private slam(g: Game, x: number, y: number, r: number, dmg: number, big: boolean) {
    const p = g.player;
    let n = 0;
    for (const e of g.enemies) if (!e.dead && e.spawnT <= 0 && Math.hypot(e.x - x, e.y - y) <= r + e.r) n++;
    g.shockwaveHit(x, y, r, dmg * g.stats.meleeDmg, -1);
    g.particles.ring(x, y - 2, 4, r + 6, big ? '#ff4d4d' : '#ff8c3a', 0.3, 2);
    g.particles.burst(x, y - 2, big ? 16 : 9, big ? '#ffd27f' : '#ffffff', 150, 0.4);
    g.particles.impact(x, y - 2, big ? 11 : 7, '#ffffff');
    g.shake(big ? 0.6 : 0.3); g.hitstop = Math.max(g.hitstop, big ? 0.07 : 0.035);
    g.sfx.slam();
    if (big) { g.flash('#ffffff', 0.12); g.slow(0.35, 0.18); }
    if (n > 0) { g.addCombo(n); p.focus = Math.min(300, p.focus + 7 * n * g.stats.focusGain); g.addOfa(dmg * 0.4 * n); }
  }

  private hits(g: Game, x0: number, y0: number, move: Move, cd: number, outward: boolean, now: number) {
    const p = g.player;
    if (this.cds.size > 80) for (const [k, v] of this.cds) if (v < now) this.cds.delete(k);
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if ((this.cds.get(e.id) ?? 0) > now) continue;
      const ey = e.y - e.z - 6;
      if (segDist(x0, y0 - this.lift, this.x, this.y - this.lift, e.x, ey) > e.r + 4.5) continue;
      this.cds.set(e.id, now + cd);
      let a = Math.atan2(e.y - p.y, e.x - p.x);
      if (!outward && this.speed > 120) a = Math.atan2(this.vy, this.vx);
      g.meleeHitEnemy(e, move, a, { x: this.x, y: this.y - this.lift });
      this.hitFlash = 0.1;
      if (p.stunT > 0.2) break;
    }
    // swat enemy bullets out of the air
    for (const b of g.bullets) {
      if (b.owner !== 'enemy' || b.kind === 'bomb') continue;
      if (segDist(x0, y0 - this.lift, this.x, this.y - this.lift, b.x, b.y) > 7) continue;
      g.deflectBullet(b, p.aim);
    }
  }

  /** the dancer's own feet are weapons during break moves: tested along the path each foot swept this frame */
  private legHits(g: Game, feet: Vec[], move: Move, cd: number, now: number) {
    const p = g.player;
    const prev = this.prevFeet && this.prevFeet.length === feet.length ? this.prevFeet : feet;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const key = 100000 + e.id;
      if ((this.cds.get(key) ?? 0) > now) continue;
      const base = e.y - e.z;
      let at: Vec | null = null;
      for (let i = 0; i < feet.length && !at; i++) {
        for (const q of [0, 6, 12]) {
          if (segDist(prev[i].x, prev[i].y, feet[i].x, feet[i].y, e.x, base - q) <= e.r + 3.5) { at = feet[i]; break; }
        }
      }
      if (!at) continue;
      this.cds.set(key, now + cd);
      g.meleeHitEnemy(e, move, Math.atan2(e.y - p.y, e.x - p.x), at);
      this.hitFlash = 0.1;
      if (p.stunT > 0.2) break;
    }
  }

  private hitProps(g: Game, x0: number, y0: number, now: number) {
    if (this.speed < 140 || this.lift > 5) return;
    const p = g.player;
    for (let i = 0; i < g.props.length; i++) {
      const pr = g.props[i];
      if (pr.dead) continue;
      const key = -1000 - i;
      if ((this.cds.get(key) ?? 0) > now) continue;
      if (segDist(x0, y0, this.x, this.y, pr.x, pr.y - 4) > 4 + pr.r) continue;
      this.cds.set(key, now + 0.3);
      g.damageProp(pr, 2, Math.atan2(pr.y - p.y, pr.x - p.x));
      g.hitstop = Math.max(g.hitstop, 0.02);
    }
  }

  // ---------------------------------------------------------------- draw
  draw(ctx: Ctx, g: Game) {
    if (!this.init) return;
    const T = this.trick;
    const trickCol = T ? T.def.col : this.brk ? this.brk.def.col : null;
    const rainbow = (i: number, h: number) => `hsl(${(h + i * 10) % 360},100%,62%)`;

    // guillotine target marker
    if (T && T.def.id === 'guillotine' && T.t / T.def.dur < 0.68) {
      ctx.globalAlpha = 0.6 + Math.sin(g.time * 30) * 0.3;
      pring(ctx, T.tx, T.ty + 6, 9 - (T.t / T.def.dur) * 6, '#ff4d4d', 1);
      ctx.globalAlpha = 1;
    }

    // rainbow ribbon trail
    const tr = this.trail;
    for (let i = 1; i < tr.length; i++) {
      const a = tr[i - 1], b = tr[i];
      const k = Math.max(0, 1 - b.age / 0.32);
      if (k <= 0) continue;
      ctx.globalAlpha = k * 0.45;
      pline(ctx, a.x, a.y, b.x, b.y, rainbow(i, b.h), 3);
      ctx.globalAlpha = k * 0.95;
      pline(ctx, a.x, a.y, b.x, b.y, i % 3 === 0 ? '#ffffff' : rainbow(i, b.h), 1);
    }
    ctx.globalAlpha = 1;

    // ground shadow when it is lifted
    if (this.lift > 1) { ctx.globalAlpha = 0.3; pellipse(ctx, this.x, this.y + 1, 3, 1.5, '#000'); ctx.globalAlpha = 1; }

    const bx = this.x, by = this.y - this.lift;
    const hx = this.hand.x, hy = this.hand.y;

    // the string (sags when slack)
    const d = Math.hypot(bx - hx, by - hy);
    const sag = Math.max(0, 1 - d / (YO_LEN * 0.85)) * 7;
    ctx.globalAlpha = 0.9;
    let lx = hx, ly = hy;
    for (let i = 1; i <= 7; i++) {
      const t = i / 7;
      const nx = lerp(hx, bx, t), ny = lerp(hy, by, t) + sag * 4 * t * (1 - t);
      pline(ctx, lx, ly, nx, ny, '#f4f4f4', 1);
      lx = nx; ly = ny;
    }
    ctx.globalAlpha = 1;
    pcircle(ctx, hx, hy, 1, '#f4f4f4'); // finger loop

    // glow when fast / mid-trick
    const glow = trickCol ?? (this.speed > 260 ? rainbow(0, (g.time * 520) % 360) : null);
    if (glow) { ctx.globalAlpha = 0.28; pcircle(ctx, bx, by, 4.7, glow); ctx.globalAlpha = 0.14; pcircle(ctx, bx, by, 6.5, glow); ctx.globalAlpha = 1; }

    // body: black outline, two-tone spinning disc, white axle
    pcircle(ctx, bx, by, 3.2, '#000');
    pcircle(ctx, bx, by, 2.4, this.hitFlash > 0 ? '#ffffff' : '#ff2e63');
    const sx = Math.cos(this.spin) * 2.1, sy = Math.sin(this.spin) * 2.1;
    pline(ctx, bx - sx, by - sy, bx + sx, by + sy, this.hitFlash > 0 ? '#ffffff' : '#08d9d6', 2);
    pcircle(ctx, bx, by, 1, '#ffffff');
    px(ctx, bx - 1.4, by - 1.4, '#ffffff');
  }
}
