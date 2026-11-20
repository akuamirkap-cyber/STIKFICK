import { pcircle, pline, pring, px, type Ctx } from './pixel';
import { solvePose, type Skeleton } from './stick';
import type { Enemy, Vec } from './types';
import type { Move } from './moves';
import type { Game } from './game';

/**
 * TAKAMURA — swordplay in the spirit of Rurouni Kenshin / Samurai Champloo, with the old man's iai stance.
 *
 *  Standing still   CANE POSE: hunched, both palms stacked on the pommel of the sheathed katana.
 *                   Enemies near -> IAI STANCE: left hand on the saya, right hand on the tsuka.
 *  LMB (chain)      BATTOUJUTSU (draw cut) -> KESA X-CUT (two crossing cuts) -> CHAMPLOO SPIN (360 reverse-flow spin + backhand)
 *                   -> RYU TSUI SEN (leaping overhead cut that hits the ground). Tap again once a cut lands to flow into the next.
 *  RMB tap          RYU SHO SEN: rising cut with a hop that launches enemies.
 *  RMB hold+release AMAKAKERU RYU NO HIRAMEKI: coil in the iai stance; release for two huge cuts that scale with the charge.
 *
 *  Every hit is decided by the REAL BLADE: the segment hand -> tip is swept through the enemies frame by frame, so the
 *  sword hits exactly where the swoosh is. The only trail is the curved swoosh the blade leaves — no straight lines.
 *  Every enemy you cut is marked; when the blade clicks back into the saya (NOTO) the marks burst into the delayed cuts.
 */
export const BLADE = 21;
/** the hit segment is a bit longer than the drawn blade so the swing feels generous */
const HIT_LEN = 30;

interface Cut {
  t: number;       // time the cut LANDS (end of the sweep)
  sw?: number;     // how long the sweep takes (default 0.035)
  a0: number; a1: number;  // blade angle relative to the aim, start -> end of the sweep
  reach: number;   // auto-step toward an enemy at most this far away
  dmg: number; lunge: number; kd?: boolean; launch?: number; big?: boolean;
}
interface StepDef { id: string; name: string; col: string; dur: number; cancelAt: number; cuts: Cut[]; draw?: boolean; hop?: [number, number, number]; special?: boolean }

export const STEPS: StepDef[] = [
  { id: 'battou', name: 'BATTOUJUTSU', col: '#bfe8ff', dur: 0.42, cancelAt: 0.2, draw: true,
    cuts: [{ t: 0.08, sw: 0.045, a0: 1.1, a1: -1.0, reach: 56, dmg: 6, lunge: 70 }] },
  { id: 'kesa', name: 'KESA X-CUT', col: '#ffffff', dur: 0.42, cancelAt: 0.24,
    cuts: [
      { t: 0.07, sw: 0.05, a0: -1.2, a1: 0.9, reach: 52, dmg: 4.5, lunge: 46 },
      { t: 0.19, sw: 0.05, a0: 1.0, a1: -1.0, reach: 52, dmg: 4.5, lunge: 28 },
    ] },
  { id: 'champloo', name: 'CHAMPLOO SPIN', col: '#ffe66d', dur: 0.72, cancelAt: 0.52, hop: [0.04, 0.3, 3],
    cuts: [
      { t: 0.26, sw: 0.22, a0: -0.4, a1: -6.5, reach: 40, dmg: 5.5, lunge: 34 },
      { t: 0.45, sw: 0.07, a0: 1.3, a1: -1.0, reach: 46, dmg: 4.5, lunge: 36, kd: true },
    ] },
  { id: 'ryutsui', name: 'RYU TSUI SEN', col: '#ff6a4d', dur: 0.8, cancelAt: 99, hop: [0.06, 0.5, 9],
    cuts: [{ t: 0.34, sw: 0.12, a0: -2.7, a1: 0.25, reach: 64, dmg: 14, lunge: 92, kd: true, launch: 60, big: true }] },
];

const RISE: StepDef = { id: 'rise', name: 'RYU SHO SEN', col: '#ffe66d', dur: 0.56, cancelAt: 0.36, special: true, hop: [0.04, 0.46, 9],
  cuts: [{ t: 0.19, sw: 0.1, a0: 2.0, a1: -2.7, reach: 42, dmg: 8, lunge: 34, kd: true, launch: 95, big: true }] };

const AMAKAKE: StepDef = { id: 'amakake', name: 'AMAKAKERU RYU NO HIRAMEKI', col: '#ffffff', dur: 0.86, cancelAt: 99, special: true, hop: [0.28, 0.62, 5],
  cuts: [
    { t: 0.17, sw: 0.1, a0: 2.1, a1: -1.9, reach: 100, dmg: 12, lunge: 150, kd: true, launch: 40, big: true },
    { t: 0.46, sw: 0.1, a0: -2.5, a1: 0.6, reach: 70, dmg: 14, lunge: 60, kd: true, launch: 70, big: true },
  ] };

const keyCache = new Map<StepDef, { t: number; a: number }[]>();
function keysOf(def: StepDef) {
  let k = keyCache.get(def);
  if (k) return k;
  const arr: { t: number; a: number }[] = [{ t: 0, a: def.cuts[0].a0 }];
  def.cuts.forEach((c, i) => {
    const pre = c.t - (c.sw ?? 0.035);
    if (pre > arr[arr.length - 1].t) arr.push({ t: pre, a: c.a0 });
    arr.push({ t: c.t, a: c.a1 });
    if (!def.cuts[i + 1]) arr.push({ t: c.t + 0.25, a: c.a1 });
  });
  k = arr;
  keyCache.set(def, k);
  return k;
}
/** blade angle relative to the aim: a piecewise path (ease-out on each sweep so it snaps fast, then settles) */
function bladeRel(def: StepDef, t: number): number {
  const k = keysOf(def);
  if (t <= k[0].t) return k[0].a;
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i].t) {
      const u = (t - k[i - 1].t) / Math.max(1e-4, k[i].t - k[i - 1].t);
      const e = 1 - (1 - u) * (1 - u) * (1 - u * 0.4);
      return k[i - 1].a + (k[i].a - k[i - 1].a) * e;
    }
  }
  return k[k.length - 1].a;
}

const mk = (o: Partial<Move> & { id: string; name: string; dmg: number }): Move => ({
  pose: 'idle', structure: o.dmg * 4.5, range: 40, arc: 2, windup: 0, active: 0, recover: 0, kb: 170, knockdown: false, lunge: 0,
  hitstop: 0.05, shake: 0.28, sfx: 'slash', limb: 'blade', hitR: 4, bleed: true, ...o,
});

const angDiff = (a: number, b: number) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const ease = (t: number) => t * t * (3 - 2 * t);
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function segDist(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l > 0 ? cl(((cx - ax) * dx + (cy - ay) * dy) / l) : 0;
  return Math.hypot(ax + dx * t - cx, ay + dy * t - cy);
}

interface CutMark { x: number; y: number; a: number; len: number; t: number; max: number; col: string }
interface TrailPt { x: number; y: number; a: number; t: number }
interface Step { def: StepDef; t: number; tPrev: number; started: boolean[]; landed: boolean[]; hit: Set<number>[]; aim: number; facing: number; mul: number }
type Mode = 'idle' | 'step' | 'sheath' | 'charge';

export class Takamura {
  mode: Mode = 'idle';
  step: Step | null = null;
  chainIdx = 0;
  queued = false;
  marks = new Map<number, { n: number; e: Enemy }>();
  markT = 0;
  charge = 0;
  chargeReady = false;
  rHeld = false;
  private sheathT = 0;
  private clicked = true;
  private lastAim = 0;
  private lastExt = 0.6;
  ready = false;
  sinceAct = 9;
  // ---- read by game.ts for the skeleton / drawing
  bodyPose: 't_cane' | 't_iai' | 't_slash' | 't_sheath' | null = null;
  bodyT = 0;
  lockAim: number | null = null;
  moveMul = 1;
  bladeA = 0;
  bladeFrac = 0;
  ext = 0;
  hop = 0;
  chargeLevel = 0;
  cutMarks: CutMark[] = [];
  trail: TrailPt[] = [];
  trailCol = '#ffffff';
  private t = 0;

  reset() {
    this.mode = 'idle'; this.step = null; this.chainIdx = 0; this.queued = false; this.marks.clear(); this.charge = 0; this.rHeld = false;
    this.cutMarks.length = 0; this.trail.length = 0; this.bodyPose = null; this.lockAim = null; this.sinceAct = 9; this.ready = false; this.clicked = true; this.hop = 0;
  }

  /** the step LMB would start right now (for the HUD hint) */
  nextStep(): StepDef { return STEPS[(this.mode === 'sheath' ? 0 : this.chainIdx) % STEPS.length]; }

  // ---------------------------------------------------------------- update
  update(g: Game, dt: number) {
    if (dt <= 0) return;
    const p = g.player, m = g.input.mouse;
    this.t += dt; this.sinceAct += dt;
    this.bodyPose = null; this.lockAim = null; this.moveMul = 1; this.ext = 0; this.chargeLevel = 0; this.hop = 0;
    for (let i = this.cutMarks.length - 1; i >= 0; i--) { this.cutMarks[i].t += dt; if (this.cutMarks[i].t >= this.cutMarks[i].max) this.cutMarks.splice(i, 1); }
    while (this.trail.length && this.t - this.trail[0].t > 0.3) this.trail.shift();

    const interrupted = p.stunT > 0 || p.holdT > 0 || p.dashT > 0 || !!p.focusDash || p.rageDash || g.state !== 'playing' || !!p.fatality;
    if (interrupted && this.mode !== 'idle') { this.mode = 'idle'; this.step = null; this.queued = false; this.rHeld = false; this.charge = 0; this.clicked = true; this.trail.length = 0; }

    // the marks always pay out eventually, even if you stop attacking
    if (this.marks.size) {
      this.markT += dt;
      for (const [id, v] of this.marks) if (v.e.dead) this.marks.delete(id);
      if (this.markT > 1.7 && this.mode === 'idle') this.noto(g);
    }

    // ---- inputs
    const rdown = m.rdown && !interrupted;
    if (!interrupted && !p.airborne) {
      if (m.pressed) {
        if (this.mode === 'idle' || this.mode === 'sheath') this.startStep(g, STEPS[(this.mode === 'sheath' ? 0 : this.chainIdx) % STEPS.length]);
        else if (this.mode === 'step') this.queued = true;
      }
      if (m.rpressed) {
        const ok = this.mode === 'idle' || this.mode === 'sheath' || (this.mode === 'step' && this.step !== null && this.step.t >= Math.min(this.step.def.cancelAt, this.step.def.dur * 0.8));
        if (ok) this.startCharge(g);
      }
    }
    if (this.mode === 'charge' && !rdown && this.rHeld) this.releaseCharge(g);

    // ---- state machines
    switch (this.mode) {
      case 'idle': {
        let near = false;
        for (const e of g.enemies) { if (!e.dead && e.spawnT <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < (this.ready ? 200 : 140)) { near = true; break; } }
        this.ready = near || this.sinceAct < 2.6;
        if (!p.moving) { this.bodyPose = this.ready ? 't_iai' : 't_cane'; this.bodyT = 0; }
        if (this.chainIdx > 0 && this.sinceAct > 0.9) this.chainIdx = 0;
        break;
      }
      case 'charge': {
        this.charge += dt;
        const lv = cl((this.charge - 0.17) / 0.8);
        this.chargeLevel = lv;
        const a = this.aimAt(g).ang;
        this.lockAim = a; this.lastAim = a;
        this.bodyPose = 't_iai'; this.bodyT = lv; this.moveMul = 0.3; this.sinceAct = 0; this.ready = true;
        if (this.charge > 0.17 && Math.random() < 0.5) {
          // power gathers: little shards fly inwards
          const ang = Math.random() * Math.PI * 2, r = 26 - lv * 12;
          g.particles.add({ x: p.x + Math.cos(ang) * r, y: p.y - 6 + Math.sin(ang) * r * 0.7, vx: -Math.cos(ang) * 90, vy: -Math.sin(ang) * 63, life: 0.25, c: lv > 0.6 ? '#ffffff' : '#7fa8ff', k: 0, s: 1 });
        }
        if (lv >= 0.65 && !this.chargeReady) {
          this.chargeReady = true;
          g.sfx.select(); g.particles.ring(p.x, p.y - 4, 24, 4, '#ffffff', 0.25, 1); g.texts.add(p.x, p.y - 26, 'READY', '#ff4d4d', 1, 0.5);
        }
        break;
      }
      case 'step': {
        const S = this.step!, def = S.def;
        S.tPrev = S.t; S.t += dt;
        this.lockAim = S.aim; this.moveMul = 0.1; this.sinceAct = 0; this.ready = true;
        this.updateBlade(S);
        const sk = solvePose(g.playerStickOpts('t_slash', S.t / def.dur));
        const hand: Vec = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
        for (let i = 0; i < def.cuts.length; i++) {
          const c = def.cuts[i], start = c.t - (c.sw ?? 0.035);
          if (!S.started[i] && S.t >= start) { S.started[i] = true; this.cutStart(g, S, c); }
          if (S.t >= start && S.tPrev <= c.t + 0.03) this.sweep(g, S, c, i, hand);
          if (c.big && !S.landed[i] && S.t >= c.t) { S.landed[i] = true; this.impact(g, S, c); }
        }
        if (S.t >= def.cancelAt && this.queued && (def.special || this.chainIdx < STEPS.length)) { this.queued = false; this.startStep(g, STEPS[def.special ? 0 : this.chainIdx % STEPS.length]); break; }
        if (S.t >= def.dur) this.beginSheath();
        break;
      }
      case 'sheath': {
        this.sheathT += dt;
        const u = cl(this.sheathT / 0.26);
        this.lockAim = this.lastAim; this.moveMul = 0.2; this.sinceAct = 0;
        this.bodyPose = 't_sheath'; this.bodyT = u; this.bladeFrac = 1 - ease(cl(u / 0.8)); this.ext = this.lastExt;
        if (!this.clicked && u >= 0.62) { this.clicked = true; this.noto(g); }
        if (u >= 1) { this.mode = 'idle'; this.chainIdx = 0; this.bladeFrac = 0; this.trail.length = 0; }
        break;
      }
    }
  }

  private updateBlade(S: Step) {
    const f = S.facing, def = S.def;
    this.bladeA = S.aim + bladeRel(def, S.t) * f;
    this.bladeFrac = def.draw ? cl(S.t / 0.05) : 1;
    let e = 0.35;
    for (const c of def.cuts) e = Math.max(e, 0.35 + 0.65 * cl(1 - Math.abs(S.t - c.t) / 0.18));
    this.ext = e; this.lastExt = e;
    if (def.hop) { const [t0, t1, peak] = def.hop; this.hop = peak * Math.sin(Math.PI * cl((S.t - t0) / (t1 - t0))); }
    this.trailCol = def.col;
    this.bodyPose = 't_slash'; this.bodyT = S.t / def.dur;
  }

  // ---------------------------------------------------------------- aiming
  /** cursor direction, snapped to the nearest enemy inside a generous cone */
  private aimAt(g: Game): { ang: number; dist: number } {
    const p = g.player, mw = g.mouseWorld();
    let ang = Math.atan2(mw.y - (p.y - 6), mw.x - p.x);
    let dist = 999;
    let best: Enemy | null = null, bs = Infinity;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 130) continue;
      const da = Math.abs(angDiff(Math.atan2(e.y - 6 - (p.y - 6), e.x - p.x), ang));
      if (da > 0.95) continue;
      const sc = da * 70 + d * 0.35;
      if (sc < bs) { bs = sc; best = e; }
    }
    if (best) { ang = Math.atan2(best.y - 6 - (p.y - 6), best.x - p.x); dist = Math.hypot(best.x - p.x, best.y - p.y); }
    return { ang, dist };
  }

  // ---------------------------------------------------------------- actions
  private startStep(g: Game, def: StepDef, mul = 1) {
    const p = g.player;
    if (this.mode === 'sheath' && !this.clicked) { this.clicked = true; this.noto(g); }
    const a = this.aimAt(g).ang;
    const f = Math.cos(a) >= 0 ? 1 : -1;
    this.step = { def, t: 0, tPrev: 0, started: def.cuts.map(() => false), landed: def.cuts.map(() => false), hit: def.cuts.map(() => new Set<number>()), aim: a, facing: f, mul };
    const idx = STEPS.indexOf(def);
    this.chainIdx = idx >= 0 ? idx + 1 : 0;
    this.mode = 'step'; this.queued = false; this.sinceAct = 0; this.lastAim = a; this.rHeld = false;
    this.bladeFrac = def.draw ? 0 : 1;
    this.trail.length = 0;
    p.facing = f;
    g.sfx.whoosh();
    g.texts.add(p.x, p.y - 28, def.name, def.col, 1, 0.7);
  }

  private beginSheath() {
    if (this.step) this.lastAim = this.step.aim;
    this.mode = 'sheath'; this.sheathT = 0; this.clicked = false; this.step = null; this.queued = false; this.chargeReady = false;
  }

  private startCharge(g: Game) {
    this.mode = 'charge'; this.charge = 0; this.rHeld = true; this.chargeReady = false; this.step = null; this.queued = false;
    g.sfx.whoosh();
  }

  private releaseCharge(g: Game) {
    this.rHeld = false;
    const held = this.charge, lv = cl((held - 0.17) / 0.8);
    this.charge = 0;
    if (held < 0.17) this.startStep(g, RISE);
    else if (lv < 0.65) this.startStep(g, STEPS[0]);
    else this.startStep(g, AMAKAKE, 1 + lv * 0.7);
  }

  // ---------------------------------------------------------------- cuts
  /** the moment a sweep begins: step into the nearest enemy (never through it), sound, afterimage */
  private cutStart(g: Game, S: Step, c: Cut) {
    const p = g.player;
    let nearest = Infinity;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d > c.reach + e.r) continue;
      if (Math.abs(angDiff(Math.atan2(dy, dx), S.aim)) > 1.25) continue;
      nearest = Math.min(nearest, d);
    }
    const lg = nearest < Infinity ? Math.min(c.lunge, Math.max(5, nearest - 15)) : c.lunge * 0.6;
    p.kx += Math.cos(S.aim) * lg * 8; p.ky += Math.sin(S.aim) * lg * 8 * 0.9;
    g.sfx.slash(c.big ? 0.65 : 0.95 + Math.random() * 0.3);
    g.addAfterimage({ x: p.x, y: p.y, facing: S.facing, aim: S.aim, scale: 1 }, S.def.col, { x: Math.cos(S.aim), y: Math.sin(S.aim) });
    if (c.big) g.shake(0.25);
  }

  /** swing the real blade through the enemies: sample the blade segment between the previous and the current frame */
  private sweep(g: Game, S: Step, c: Cut, ci: number, hand: Vec) {
    const p = g.player, f = S.facing;
    const start = c.t - (c.sw ?? 0.035);
    const t0 = Math.max(S.tPrev, start), t1 = Math.min(S.t, c.t + 0.03);
    if (t1 < t0) return;
    const n = Math.max(1, Math.ceil((t1 - t0) / 0.006));
    const mv = mk({
      id: 't_cut', name: S.def.name, dmg: c.dmg * S.mul, kb: c.big ? 330 : 190, knockdown: !!c.kd, launch: c.launch,
      hitstop: c.big ? 0.1 : 0.06, shake: c.big ? 0.6 : 0.3, finisher: !!c.big,
    });
    for (let s = 0; s <= n; s++) {
      const tt = lerp(t0, t1, s / n);
      const a = S.aim + bladeRel(S.def, tt) * f;
      const tx = hand.x + Math.cos(a) * HIT_LEN, ty = hand.y + Math.sin(a) * HIT_LEN * 0.6;
      for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0 || S.hit[ci].has(e.id)) continue;
        const ey = e.y - e.z - 5;
        if (segDist(hand.x, hand.y, tx, ty, e.x, ey) > e.r + 3) continue;
        S.hit[ci].add(e.id);
        this.hitEnemy(g, e, mv, c.big ? 2 : 1);
      }
      void p;
    }
  }

  /** the big cuts hit the ground / air with a shockwave so the finisher reads */
  private impact(g: Game, S: Step, c: Cut) {
    const p = g.player;
    const ix = p.x + Math.cos(S.aim) * 24, iy = p.y + Math.sin(S.aim) * 12;
    g.katana.addArc(p.x, p.y, 20, S.aim + c.a0 * S.facing, S.aim + c.a1 * S.facing, S.def.col, 0, 0.26);
    g.particles.shockwave(ix, iy - 2, S.def.id === 'ryutsui' ? 34 : 24, S.def.col, 0.3);
    g.particles.burst(ix, iy - 2, 10, '#ffffff', 130, 0.4);
    g.shake(S.def.id === 'ryutsui' || S.def.id === 'amakake' ? 0.55 : 0.3);
    g.hitstop = Math.max(g.hitstop, 0.04);
    if (S.def.id === 'ryutsui') { g.flash('#ffffff', 0.15); g.sfx.slam(); g.shockwaveHit(ix, iy, 30, 4 * g.stats.meleeDmg, -1); }
    if (S.def.id === 'amakake' && c === S.def.cuts[1]) { g.flash('#ffffff', 0.3); g.slow(0.25, 0.3); g.say('HIRAMEKI', '#ffffff', 2, 0.9); g.shockwaveHit(ix, iy, 40, 5 * g.stats.meleeDmg * S.mul, -1); }
  }

  private hitEnemy(g: Game, e: Enemy, mv: Move, markN: number) {
    const p = g.player;
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    g.meleeHitEnemy(e, mv, a, { x: e.x - Math.cos(a) * e.r * 0.6, y: e.y - e.z - 5 - Math.sin(a) * e.r * 0.4 });
    if (e.dead) return;
    const cur = this.marks.get(e.id);
    this.marks.set(e.id, { n: (cur?.n ?? 0) + markN, e });
    this.markT = 0;
  }

  /** NOTO: the blade clicks home and every marked enemy gets all its delayed cuts at once */
  private noto(g: Game) {
    const p = g.player;
    const list = [...this.marks.values()].filter((v) => !v.e.dead);
    this.marks.clear(); this.markT = 0;
    g.sfx.sheathe();
    g.particles.ring(p.x, p.y - 6, 3, 15, '#ffffff', 0.18, 1);
    if (!list.length) return;
    g.sfx.slash(1.5);
    let total = 0;
    const k = g.stats.meleeDmg;
    for (const v of list) {
      const e = v.e, n = Math.min(10, v.n);
      total += n;
      const ang = Math.atan2(e.y - p.y, e.x - p.x);
      const ex = e.x, ey = e.y - e.z - 5;
      for (let i = 0; i < Math.min(4, 2 + Math.floor(n / 3)); i++) {
        this.cutMarks.push({ x: ex + (Math.random() - 0.5) * 4, y: ey + (Math.random() - 0.5) * 6, a: -1.2 + (i * 2.4) / 3 + (Math.random() - 0.5) * 0.6 + (i % 2 ? Math.PI : 0), len: 9 + Math.random() * 5, t: -i * 0.035, max: 0.22, col: i % 2 ? '#ffffff' : '#bfe8ff' });
      }
      g.particles.lines(ex, ey, 3, '#ffffff', ang + Math.PI / 2, 140);
      g.blood.spray(ex, ey, ang, 2 + n, true);
      g.particles.blood(ex, ey, 6 + n, ang, 130);
      const dmg = (2.5 + n * 1.4) * k;
      g.damageEnemy(e, dmg, 30 + n * 6, ang, 230, { knockdown: true, hitstop: 0.03, shake: 0.3, melee: true, launch: n >= 5 ? 55 : 0 });
    }
    g.addCombo(list.length);
    g.addOfa(total * 0.8);
    g.hitstop = Math.max(g.hitstop, 0.07);
    g.shake(Math.min(0.7, 0.25 + total * 0.04));
    g.texts.add(p.x, p.y - 30, 'CHIN', '#ffffff', 1, 0.55);
    if (list.length >= 3) g.say('NOTO', '#ffffff', 2, 0.8);
  }

  // ---------------------------------------------------------------- draw
  draw(ctx: Ctx, g: Game, sk: Skeleton) {
    const p = g.player;
    const f = this.lockAim !== null ? (Math.cos(this.lockAim) >= 0 ? 1 : -1) : p.facing;
    const W = (v: Vec): Vec => ({ x: p.x + v.x, y: p.y + v.y - p.z });
    const hip = W(sk.hip), fh = W(sk.fhand), bh = W(sk.bhand), head = W(sk.head);
    const pose = this.bodyPose;
    const hot = this.mode === 'charge' && this.chargeLevel > 0.1;

    // record the blade for the swoosh (angle + hand, so the swoosh is a true curved fan, never a straight chord)
    if ((pose === 't_slash') && this.bladeFrac > 0.4) {
      const last = this.trail[this.trail.length - 1];
      if (!last || last.a !== this.bladeA || last.t !== this.t) this.trail.push({ x: fh.x, y: fh.y, a: this.bladeA, t: this.t });
    }

    // ---- charge aura: thin rings far outside the body (nothing is ever painted over the character)
    if (hot) {
      const lv = this.chargeLevel;
      for (let i = 0; i < 2; i++) {
        const k = ((this.t * (1.1 + lv)) + i * 0.5) % 1;
        ctx.globalAlpha = (1 - k) * (0.25 + lv * 0.4);
        pring(ctx, hip.x, hip.y - 3, 22 - k * 12 * (0.5 + lv), lv > 0.6 ? '#ff6a6a' : '#7fa8ff', 1);
      }
      ctx.globalAlpha = 1;
    }

    // ---- the swoosh: a filled curved fan swept by the blade, fading quickly
    const tr = this.trail;
    for (let i = 1; i < tr.length; i++) {
      const A = tr[i - 1], B = tr[i];
      const age = this.t - B.t;
      if (age > 0.2) continue;
      const da = B.a - A.a;
      if (Math.abs(da) < 0.015 || Math.abs(da) > 7) continue;
      const k = 1 - age / 0.2;
      const steps = Math.max(1, Math.ceil(Math.abs(da) / 0.08));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, ang = A.a + da * u, hx = lerp(A.x, B.x, u), hy = lerp(A.y, B.y, u);
        const c = Math.cos(ang), sn = Math.sin(ang) * 0.6;
        ctx.globalAlpha = k * 0.4;
        pline(ctx, hx + c * BLADE * 0.55, hy + sn * BLADE * 0.55, hx + c * BLADE * 1.02, hy + sn * BLADE * 1.02, this.trailCol, 1);
        ctx.globalAlpha = k * 0.95;
        px(ctx, hx + c * BLADE * 1.04, hy + sn * BLADE * 1.04, '#ffffff');
      }
    }
    ctx.globalAlpha = 1;

    // ---- the sword
    if (pose === 't_cane') {
      // vertical sheathed katana planted in front, both palms on the pommel
      const gx = fh.x + 0.2 * f, top = fh.y - 3.4, bot = p.y + 0.5;
      this.saya(ctx, gx, top + 3.4, gx - f * 0.3, bot, '#1a1a2c');
      pline(ctx, gx, fh.y + 0.8, gx, top, '#000', 3); pline(ctx, gx, fh.y + 0.8, gx, top, '#e8e0d0', 1);
      pcircle(ctx, gx, fh.y + 1.2, 1.4, '#c9a033');
      px(ctx, gx, top - 1, '#c9a033');
    } else if (pose === 't_slash' || pose === 't_sheath') {
      this.saya(ctx, bh.x, bh.y, bh.x - f * 14, bh.y - 3.2, '#1a1a2c');
      const a = this.bladeA, fr = this.bladeFrac;
      const len = BLADE * fr;
      if (len > 1.5) {
        const tip = { x: fh.x + Math.cos(a) * len, y: fh.y + Math.sin(a) * len * 0.6 };
        this.blade(ctx, fh, tip, this.ext, g);
      }
      this.tsuka(ctx, fh, a);
    } else {
      // sheathed at the left hip: saya pointing back, tsuka in front of the right hand
      const K = pose === 't_iai' ? bh : { x: hip.x + f * 1.4, y: hip.y - 0.6 };
      this.saya(ctx, K.x, K.y, K.x - f * 14, K.y - 3.4, '#1a1a2c');
      pline(ctx, K.x, K.y, K.x + f * 5.2, K.y - 0.6, '#000', 3);
      pline(ctx, K.x, K.y, K.x + f * 5.2, K.y - 0.6, '#e8e0d0', 1);
      for (let i = 1; i < 5; i += 2) px(ctx, K.x + f * i, K.y - 0.6, '#222');
      pcircle(ctx, K.x, K.y, 1.2, '#c9a033');
      if (hot && this.chargeLevel > 0.55 && Math.sin(this.t * 40) > 0) pline(ctx, K.x + f * 0.5, K.y - 0.4, K.x + f * 4.6, K.y - 0.6, '#ffffff', 1);
    }

    // ---- only the eyes change when the charge is ready (the face and costume are untouched)
    if ((pose === 't_cane' || pose === 't_iai') && hot && this.chargeLevel > 0.5) {
      px(ctx, head.x + f * 1, head.y, '#ff2a2a'); px(ctx, head.x + f * 3, head.y, '#ff2a2a');
    }

    // ---- NOTO: short delayed cuts bursting open on marked enemies
    for (const c of this.cutMarks) {
      if (c.t < 0) continue;
      const k = 1 - c.t / c.max;
      const dx = Math.cos(c.a) * c.len * (0.5 + (1 - k) * 0.5), dy = Math.sin(c.a) * c.len * 0.6 * (0.5 + (1 - k) * 0.5);
      ctx.globalAlpha = Math.min(1, k * 2);
      pline(ctx, c.x - dx, c.y - dy, c.x + dx, c.y + dy, '#000', 3);
      pline(ctx, c.x - dx, c.y - dy, c.x + dx, c.y + dy, c.col, 1);
    }
    ctx.globalAlpha = 1;

    // ---- pending marks: a faint red scratch above each marked enemy
    for (const v of this.marks.values()) {
      if (v.e.dead) continue;
      const bx = v.e.x, by = v.e.y - v.e.z - v.e.r - 9;
      ctx.globalAlpha = 0.55 + Math.sin(this.t * 14 + v.e.id) * 0.3;
      pline(ctx, bx - 3, by + 2, bx + 3, by - 2, '#ff3b3b', 1);
      if (v.n >= 3) pline(ctx, bx - 3, by - 2, bx + 3, by + 2, '#ff3b3b', 1);
    }
    ctx.globalAlpha = 1;
  }

  private saya(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, col: string) {
    pline(ctx, x0, y0, x1, y1, '#000', 3);
    pline(ctx, x0, y0, x1, y1, col, 1);
    px(ctx, x0 + (x1 - x0) * 0.55, y0 + (y1 - y0) * 0.55, '#c4202c'); // sageo cord knot
    px(ctx, x1, y1, '#c9a033');                                          // kojiri cap
  }

  private tsuka(ctx: Ctx, h: Vec, a: number) {
    const bx = h.x - Math.cos(a) * 4.2, by = h.y - Math.sin(a) * 4.2 * 0.6;
    pline(ctx, h.x, h.y, bx, by, '#000', 3);
    pline(ctx, h.x, h.y, bx, by, '#e8e0d0', 1);
    pcircle(ctx, bx, by, 1, '#c9a033');
  }

  private blade(ctx: Ctx, base: Vec, tip: Vec, ext: number, g: Game) {
    const dx = tip.x - base.x, dy = tip.y - base.y, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    pline(ctx, base.x, base.y, tip.x, tip.y, '#000', 3);
    pline(ctx, base.x - nx * 0.5, base.y - ny * 0.5, tip.x - nx * 0.3, tip.y - ny * 0.3, '#8a93a0', 1);
    pline(ctx, base.x, base.y, tip.x, tip.y, '#eef2f8', 1);
    pline(ctx, base.x + nx * 0.7, base.y + ny * 0.7, tip.x + nx * 0.2, tip.y + ny * 0.2, '#ffffff', 1);
    pcircle(ctx, tip.x, tip.y, 0.6, '#ffffff');
    pline(ctx, base.x + nx * 2, base.y + ny * 2, base.x - nx * 2, base.y - ny * 2, '#c9a033', 2);
    // a sliding glint (hamon sparkle)
    const gt = (g.time * 2.4) % 1;
    px(ctx, base.x + dx * gt, base.y + dy * gt, '#ffffff');
    void ext;
  }
}
