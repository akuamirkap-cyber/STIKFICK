import { moveWithCollision } from './level';
import { pfontO, prect, type Ctx } from './pixel';
import { tallModeOn, type StickOpts } from './stick';
import type { Game } from './game';
import type { Enemy, Pose } from './types';

const GAP = 8;
const CONTACT = 0.18;
const STRIKE = 0.43;
const ease = (n: number) => {
  const u = Math.min(1, Math.max(0, n));
  return u * u * (3 - 2 * u);
};
type Scene = {
  e: Enemy;
  phase: 'approach' | 'grab' | 'knee' | 'recover';
  t: number;
  dir: number;
  hitDone: boolean;
};

export class MuayThai {
  active: Scene | null = null;
  cd = 0;
  contacts = 0;

  reset() {
    if (this.active) {
      this.active.e.scenePose = undefined;
      this.active.e.sceneRot = 0;
    }
    this.active = null;
    this.cd = 0;
    this.contacts = 0;
  }

  markedTarget(g: Game): Enemy | null {
    const p = g.player;
    if (
      this.active ||
      this.cd > 0 ||
      g.state !== 'playing' ||
      p.weapon !== 'fist' ||
      p.airborne ||
      p.stunT > 0 ||
      p.holdT > 0 ||
      p.fatality ||
      p.dashT > 0 ||
      g.silat ||
      g.botPunch.active ||
      g.tkd.active ||
      g.propsPlay.scene ||
      g.carry.carrying ||
      g.grab.holding
    )
      return null;
    let target: Enemy | null = null,
      closest = 30;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0 || e.z > 2 || (g.level.sideView && Math.abs(e.y - p.y) > 5)) continue;
      if (
        !g.training &&
        !(e.stagger > 0 || e.down > 0 || e.stun > 0 || e.state === 'stagger' || e.state === 'down')
      )
        continue;
      const distance = Math.hypot(e.x - p.x, e.y - p.y);
      if (distance < closest) {
        target = e;
        closest = distance;
      }
    }
    return target;
  }

  maybeStart(g: Game) {
    if (!g.input.mouse.rpressed) return false;
    const e = this.markedTarget(g);
    if (!e) return false;
    this.start(g, e);
    return true;
  }

  start(g: Game, e: Enemy) {
    if (this.active || this.cd > 0 || e.dead || g.state !== 'playing') return;
    const p = g.player;
    const dir = g.level.sideView ? (e.x >= p.x ? 0 : Math.PI) : Math.atan2(e.y - p.y, e.x - p.x);
    this.active = { e, phase: 'approach', t: 0, dir, hitDone: false };
    p.aim = p.bodyAim = dir;
    p.facing = Math.cos(dir) >= 0 ? 1 : -1;
    p.attackPhase = 'none';
    p.buffered = null;
    p.comboStr = '';
    p.moveKey = null;
    p.vx = p.vy = p.kx = p.ky = 0;
    g.input.mouse.rpressed = false;
    this.cd = 1.55;
    g.sfx.whoosh();
    g.say('MUAY THAI CLINCH', '#d3ef55', 1, 0.55);
  }

  private release(g: Game) {
    if (this.active) {
      const e = this.active.e;
      e.scenePose = undefined;
      e.sceneRot = 0;
      e.sceneZ = 0;
      e.sqx = e.sqy = 1;
    }
    g.player.squash = 1;
    this.active = null;
  }

  update(g: Game, dt: number) {
    this.cd = Math.max(0, this.cd - dt);
    const s = this.active;
    if (!s) return false;
    const e = s.e,
      p = g.player;
    if (g.state !== 'playing' || p.weapon !== 'fist' || (e.dead && !s.hitDone)) {
      this.release(g);
      return false;
    }
    s.t += dt;
    p.moving = p.running = false;
    p.runT = 0;
    p.iframes = Math.max(p.iframes, 0.18);
    const dx = Math.cos(s.dir),
      dy = g.level.sideView ? 0 : Math.sin(s.dir);
    if (s.phase === 'recover') {
      p.squash = 0.98 + 0.02 * ease(s.t / 0.2);
      if (s.t >= 0.2) this.release(g);
      return true;
    }
    e.kx = e.ky = e.vx = e.vy = 0;
    e.moving = false;
    e.z = 0;
    e.down = 0;
    e.aim = e.bodyAim = s.dir + Math.PI;
    e.facing = -p.facing;
    e.stun = Math.max(e.stun, 0.16);
    if (s.phase === 'approach') {
      const k = 1 - Math.exp(-22 * dt);
      moveWithCollision(g.level, p, (e.x - dx * GAP - p.x) * k, (e.y - dy * GAP - p.y) * k);
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (s.t >= 0.16 && d <= GAP + 1.4) {
        s.phase = 'grab';
        s.t = 0;
      } else if (s.t > 0.38) this.release(g);
      return true;
    }
    const x = p.x + dx * GAP,
      y = p.y + dy * GAP;
    const k = 1 - Math.exp(-25 * dt);
    moveWithCollision(g.level, e, (x - e.x) * k, (y - e.y) * k);
    if (Math.hypot(e.x - x, e.y - y) > 3) {
      this.release(g);
      return false;
    }
    e.scenePose = 'crouch';
    e.sceneT = 0.6;
    e.sceneRot = 0;
    e.sqx = e.sqy = 1;
    if (s.phase === 'grab') {
      if (s.t >= 0.23) {
        s.phase = 'knee';
        s.t = 0;
      }
    } else {
      // A crossing event, not a repeating damage window: even a long frame can land only once.
      if (!s.hitDone && s.t >= CONTACT) {
        s.hitDone = true;
        this.contacts += 1;
        g.damageEnemy(e, 12, 38, s.dir, 58, {
          melee: true,
          hitstop: 0.065,
          shake: 0.16,
          knockdown: false,
          launch: 0,
        });
        g.sfx.kick();
        g.hitstop = Math.max(g.hitstop, 0.065);
        const anchor = this.anchor(g)!;
        g.particles.impact(anchor.x, anchor.y, 4, '#e5efb6');
        g.say('SINGLE KNEE', '#d3ef55', 1, 0.55);
        g.pushUI();
      }
      if (s.t >= STRIKE) {
        s.phase = 'recover';
        s.t = 0;
        e.scenePose = undefined;
        e.stun = 0.24;
        e.stagger = 0.24;
        e.kx = dx * 28;
        e.ky = dy * 28;
      }
    }
    return true;
  }

  poseOverride(): { pose: Pose; t: number } | null {
    const s = this.active;
    if (!s) return null;
    if (s.phase === 'approach') return { pose: 'dash', t: 0.35 };
    if (s.phase === 'grab') return { pose: 'grab', t: ease(s.t / 0.23) * 0.65 };
    return { pose: 'knee', t: s.phase === 'knee' ? Math.min(1, s.t / STRIKE) : 1 };
  }

  private anchor(g: Game) {
    const s = this.active;
    if (!s || s.phase === 'approach' || s.phase === 'recover') return null;
    const reach = s.phase === 'grab' ? ease(s.t / 0.16) : 1;
    const rise = s.phase === 'knee' ? ease(s.t / CONTACT) * (1 - ease((s.t - CONTACT - 0.07) / 0.18)) : 0;
    const tall = tallModeOn() ? 1.34 : 1;
    return {
      x: g.player.x + Math.cos(s.dir) * 5.2,
      y: g.player.y - (10.9 - 3.0 * rise) * tall + Math.sin(s.dir) * 2.7,
      w: reach,
      rise,
    };
  }

  bindPose(g: Game, opts: StickOpts, receiver?: Enemy) {
    const a = this.anchor(g);
    if (!a || (receiver && this.active?.e !== receiver)) return;
    opts.clinch = { ...a, receiver: !!receiver };
    opts.sqx = opts.sqy = 1;
    opts.rot = 0;
    opts.react = undefined;
  }

  draw(g: Game, ctx: Ctx) {
    const e = this.markedTarget(g);
    if (!e) return;
    const y = Math.round(e.y - 27);
    prect(ctx, Math.round(e.x) - 23, y - 2, 46, 8, '#11150de6');
    pfontO(ctx, 'K: CLINCH', e.x, y, '#d3ef55', '#11150d', 1, 'center');
  }
}
