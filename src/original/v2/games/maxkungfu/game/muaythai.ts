import { dist, lerp } from './rng';
import { moveWithCollision } from './level';
export { MuayThai } from './singleClinch';

type G = any;

/* ============================================================ TAEKWONDO BACK KICK */
interface TkdScene { e: any; t: number; hitDone: boolean; dir: number }

export class TkdKick {
  active: TkdScene | null = null;
  cd = 0;
  time = 0;

  reset() { this.active = null; this.cd = 0; }

  /** dipanggil dari finisher rantai pukulan: true bila adegan mengambil alih penyelesaian kombo */
  maybeFinish(g: G, target: any): boolean {
    if (!target || target.dead || this.active || this.cd > 0) return false;
    const p = g.player;
    if (p.weapon !== 'fist' || p.airborne || p.stunT > 0 || p.fatality || g.silat ||
        g.botPunch?.active || g.muay?.active || g.propsPlay?.scene) return false;
    const sv = !!g.level?.sideView;
    if (sv && Math.abs(target.y - p.y) > 22) return false;
    if (dist(p.x, p.y, target.x, target.y) > 74) return false;
    const dir = sv ? (target.x >= p.x ? 0 : Math.PI) : Math.atan2(target.y - p.y, target.x - p.x);
    this.active = { e: target, t: 0, hitDone: false, dir };
    p.aim = dir; p.bodyAim = dir; p.facing = Math.cos(dir) >= 0 ? 1 : -1;
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    p.iframes = Math.max(p.iframes ?? 0, 0.6);
    g.sfx?.whoosh?.();
    g.say?.('TAEKWONDO BACK KICK!', '#7ce7ff', 2, 0.8);
    this.cd = 6;
    return true;
  }

  update(g: G, dt: number): boolean {
    this.time += dt;
    if (this.cd > 0) this.cd -= dt;
    const s = this.active;
    if (!s) return false;
    const p = g.player, e = s.e;
    if (g.state !== 'playing' || p.weapon !== 'fist') { this.active = null; return false; }
    s.t += dt;
    p.moving = false; p.running = false; p.runT = 0;
    p.iframes = Math.max(p.iframes ?? 0, 0.3);
    const sv = !!g.level?.sideView;

    if (s.t < 0.2) {
      // putar badan: punggung menghadap musuh, langkah kecil menutup jarak tanpa menembus tembok
      p.aim = s.dir; p.facing = Math.cos(s.dir) >= 0 ? 1 : -1;
      const tx = e.x - Math.cos(s.dir) * 19, ty = sv ? p.y : e.y - Math.sin(s.dir) * 19;
      const k = 1 - Math.exp(-12 * dt);
      moveWithCollision(g.level, p, (tx - p.x) * k, sv ? 0 : (ty - p.y) * k);
      p.squash = 0.88;
    } else if (!s.hitDone) {
      s.hitDone = true;
      // badan membelakangi sasaran, kaki menendang lurus ke belakang dengan seluruh momentum putaran
      p.aim = s.dir + Math.PI; p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
      if (!e.dead) {
        g.damageEnemy(e, 16, 72, s.dir, 780, { melee: true, knockdown: true, hitstop: 0.08, shake: 0.55, launch: 130 });
        e.rot = (e.rot ?? 0) + 2.4;
      }
      g.sfx?.heavy?.(); g.sfx?.hit?.();
      g.hitstop = Math.max(g.hitstop ?? 0, 0.07);
      g.shake?.(0.55);
      g.slow?.(0.22, 0.3);
      g.flash?.('#ffffff', 0.08);
      g.particles?.impact?.(e.x, e.y - 8, 12, '#ffffff');
      g.particles?.spark?.(e.x, e.y - 8, 14, '#7ce7ff', s.dir, 1.4, 280);
      g.say?.('BACK KICK!', '#7ce7ff', 2, 0.6);
      p.squash = 0.82;
    } else {
      p.aim = s.dir; p.facing = Math.cos(s.dir) >= 0 ? 1 : -1;
      p.squash = lerp(p.squash ?? 1, 1, Math.min(1, dt * 8));
    }
    if (s.t > 0.62) { this.active = null; p.squash = 1; }
    return true;
  }

  poseOverride(): { pose: string; t: number } | null {
    const s = this.active;
    if (!s) return null;
    if (s.t < 0.2) return { pose: 'spinback', t: (s.t / 0.2) * 0.45 };       // putaran badan
    if (s.t < 0.36) return { pose: 'sidekick', t: 0.55 };                     // kaki menendang ke belakang
    return { pose: 'spinback', t: 0.9 };                                      // kembali menghadap depan
  }
}
