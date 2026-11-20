import { clamp, dist } from './rng';
import { moveWithCollision } from './level';

/**
 * MELEE CHASE — tiap hit senjata jarak dekat bikin bot mundur sedikit,
 * lalu pemain otomatis melangkah maju mengikuti sambil tetap bisa ngehit.
 * Tidak dipakai untuk pistol / rifle / shotgun / bow.
 */
type G = any;
type E = any;
const RANGED = new Set(['pistol', 'rifle', 'shotgun', 'bow']);
const CHAINABLE = new Set(['fist', 'nunchaku', 'katana', 'axe', 'dual', 'bat', 'boxing', 'yoyo']);

export class MeleeChase {
  t = 0;
  targetId = -1;
  dir = 0;
  weapon = '';
  nextHit = 0;

  reset() { this.t = 0; this.targetId = -1; this.nextHit = 0; }
  excluded(w: string) { return RANGED.has(w); }
  chainable(g: G) {
    const w = g.player.weapon;
    if (!CHAINABLE.has(w)) return false;
    if (w === 'yoyo' && g.yoyoVer !== 2) return false;
    return true;
  }
  onHit(g: G, e: E, dir: number, kb: number, o: any) {
    const p = g.player;
    if (this.excluded(p.weapon) || g.botPunch?.active || e.dead || e.spawnT > 0 || e.punchLock) return;
    if (g.bossExchange?.phase === 'telegraph' || g.bossExchange?.phase === 'open' || g.bossExchange?.phase === 'counter') return;
    if ((o?.launch ?? 0) > 0 || o?.knockdown || e.z > 4 || e.down > 0 || e.stagger > 0) return; // jangan tumpang tindih launch/knockdown besar
    const bossScale = e.boss ? 0.5 : e.armor ? 0.7 : 1;
    const push = clamp(72 + kb * 0.16, 80, 165) * bossScale;
    const nx = Math.cos(dir), ny = Math.sin(dir);
    // bot mundur, bukan melayang
    e.kx += nx * push; e.ky += ny * push;
    e.stun = Math.max(e.stun ?? 0, 0.08); e.state = 'stun'; e.pose = 'hurt'; e.poseT = 0.4;
    e.faceT = Math.max(e.faceT ?? 0, 0.25);
    // pemain ikut maju sedikit, tanpa teleport
    p.kx += nx * 52 * bossScale; p.ky += ny * 52 * bossScale;
    p.lean = { x: nx, y: ny };
    p.moving = true; p.running = false; p.runT = Math.max(p.runT ?? 0, 0.18); p.walk += 1.1;
    this.t = 0.3; this.targetId = e.id; this.dir = dir; this.weapon = p.weapon; this.nextHit = 0.12;
  }
  update(g: G, dt: number) {
    if (this.t <= 0) return;
    this.t -= dt; this.nextHit -= dt;
    const p = g.player;
    const e = g.enemies.find((q: E) => q.id === this.targetId && !q.dead);
    if (!e || p.weapon !== this.weapon || this.excluded(p.weapon) || g.botPunch?.active ||
        g.bossExchange?.phase === 'telegraph' || g.bossExchange?.phase === 'open' || g.bossExchange?.phase === 'counter' ||
        p.stunT > 0 || p.fatality || p.airborne || p.holdT > 0 || g.silat) { this.t = 0; return; }
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    this.dir = a;
    const d = dist(p.x, p.y, e.x, e.y);
    const want = p.weapon === 'bat' || p.weapon === 'buster' ? 23 : 18;
    if (d > want) {
      const step = Math.min(165 * dt, d - want);
      const nx = Math.cos(a), ny = Math.sin(a);
      const blocked = moveWithCollision(g.level, p, nx * step, ny * step);
      if (blocked.bx || blocked.by) this.t = Math.min(this.t, 0.06);
      p.lean = { x: nx, y: ny };
      p.moving = true; p.running = false; p.runT = Math.max(p.runT ?? 0, 0.22);
      p.walk += dt * 11;
    }
    // kalau LMB ditahan, lanjutkan combo sambil tetap menempel
    if (g.input?.mouse?.down && this.nextHit <= 0 && this.chainable(g) && p.stunT <= 0 &&
        (p.attackPhase === 'none' || p.attackPhase === 'recover')) {
      g.queueAttack?.('L');
      this.nextHit = 0.16;
    }
  }
}
