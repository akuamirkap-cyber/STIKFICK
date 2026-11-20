import { clamp, dist } from './rng';
import { pcircle, pfontO, prect, pring, type Ctx } from './pixel';

/**
 * BOSS EXCHANGE — parry dinamis tanpa cinematic freeze.
 * Boss memberi telegraf; klik kiri tepat di jendela hijau = parry + opening.
 * Pemain tetap bisa jalan/lari. Boss bisa memparry serangan pemain, lalu menyerang lagi.
 */
type G = any;
type E = any;
type Phase = 'idle' | 'telegraph' | 'open' | 'counter';

export class BossExchange {
  active = false;
  bossId = -1;
  phase: Phase = 'idle';
  t = 0;
  dur = 0.4;
  realStart = 0.24;
  realEnd = 0.36;
  fakeStart = 0.08;
  fakeEnd = 0.16;
  feint = false;
  parried = false;
  lmbAt: number | null = null;
  whiffT = 0;
  openT = 0;
  counterT = 0;
  bossCd = 0;
  bossParryCd = 0;
  spam = 0;
  wasAttacking = false;

  reset() {
    this.active = false; this.bossId = -1; this.phase = 'idle'; this.t = 0;
    this.parried = false; this.lmbAt = null; this.whiffT = 0; this.openT = 0;
    this.counterT = 0; this.bossCd = 0; this.bossParryCd = 0; this.spam = 0; this.wasAttacking = false;
  }
  findBoss(g: G): E | null {
    return g.enemies.find((e: E) => !e.dead && e.spawnT <= 0 && (e.boss || (e.kind as string) === 'duelist')) ?? null;
  }
  activate(g: G, e: E) {
    this.active = true; this.bossId = e.id; this.phase = 'idle';
    this.t = 0; this.bossCd = 0.35; this.bossParryCd = 0.45; this.spam = 0; this.wasAttacking = false;
    if (g.brain) g.brain.clashCd = 999;     // matikan adu parry lama
    if ('clash' in g) g.clash = null;
  }
  update(g: G, dt: number) {
    if (g.state !== 'playing') return;
    const e = this.findBoss(g);
    if (!e) { if (this.active) this.reset(); return; }
    if (!this.active || this.bossId !== e.id) this.activate(g, e);
    this.whiffT = Math.max(0, this.whiffT - dt);
    this.bossCd = Math.max(0, this.bossCd - dt);
    this.bossParryCd = Math.max(0, this.bossParryCd - dt);
    this.spam = Math.max(0, this.spam - dt * 1.7);
    if (g.brain) g.brain.clashCd = Math.max(g.brain.clashCd ?? 0, 5);
    const p = g.player;
    const lmb = !!g.input?.mouse?.pressed;
    if (lmb) this.spam += 1;
    const attacking = e.attackPhase === 'windup' || e.attackPhase === 'active' || e.pose === 'windup' || e.state === 'attack' || e.state === 'windup';

    if (this.phase === 'idle') {
      if (attacking && !this.wasAttacking) this.startTelegraph(g, e, false);
      else if (this.bossCd <= 0 && dist(p.x, p.y, e.x, e.y) < 130 && !p.fatality && e.z <= 4) this.forceBossAttack(g, e, false);
      return;
    }
    if (this.phase === 'telegraph') {
      this.t += dt;
      if (lmb) {
        this.lmbAt = this.t;
        this.suppressLmb(g);
        const real = this.t >= this.realStart && this.t <= this.realEnd;
        const fake = this.feint && this.t >= this.fakeStart && this.t <= this.fakeEnd;
        if (real && !this.parried) this.parrySuccess(g, e);
        else { this.whiffT = 0.35; this.tell(g, fake ? 'TOO EARLY!' : 'MISS!', '#ff6a4a'); }
      }
      if (this.t >= this.dur && this.phase === 'telegraph') { this.phase = 'idle'; this.bossCd = 0.35; }
      return;
    }
    if (this.phase === 'open') {
      this.openT -= dt;
      // boss masih bisa bergerak, tapi tidak boleh parry / menyerang selama opening
      e.counterLockT = Math.max(e.counterLockT ?? 0, 0.08);
      if (this.openT <= 0) { this.phase = 'idle'; this.bossCd = 0.25; }
      return;
    }
    if (this.phase === 'counter') {
      this.counterT -= dt;
      if (this.counterT <= 0) this.forceBossAttack(g, e, true);
    }
    this.wasAttacking = attacking;
  }
  startTelegraph(g: G, e: E, fast: boolean) {
    const lvl = g.levelN ?? 1;
    this.phase = 'telegraph'; this.t = 0; this.parried = false; this.lmbAt = null;
    this.dur = fast ? 0.3 : Math.max(0.26, 0.46 - Math.min(0.13, lvl * 0.005));
    this.realStart = this.dur * (0.56 + Math.random() * 0.09);
    this.realEnd = this.realStart + (fast ? 0.095 : 0.13);
    this.feint = !fast && Math.random() < 0.28;
    this.fakeStart = this.dur * 0.2; this.fakeEnd = this.fakeStart + 0.085;
    e.attackSerial = (e.attackSerial ?? 0) + 1;
    this.wasAttacking = true;
    e.counterLockT = 0; e.vulnerableT = 0;
    if (g.particles?.ring) g.particles.ring(e.x, e.y - 8, 2, 12, '#ff4d4d', 0.18, 1);
    this.tell(g, this.feint ? 'READ THE TIMING' : 'INCOMING', '#ff9d4a');
  }
  forceBossAttack(g: G, e: E, fast: boolean) {
    e.attackPhase = 'windup'; e.moveKey = 'L'; e.attackT = this.dur || 0.35;
    e.state = 'attack'; e.pose = 'windup'; e.poseT = 0;
    e.attackCd = 0.05; e.stun = 0; e.stagger = 0;
    e.counterLockT = 0; e.vulnerableT = 0;
    this.startTelegraph(g, e, fast);
  }
  suppressLmb(g: G) {
    if (g.input?.mouse) g.input.mouse.pressed = false;
    const p = g.player;
    p.fireCd = Math.max(p.fireCd ?? 0, 0.22);
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
  }
  parrySuccess(g: G, e: E) {
    const p = g.player;
    this.parried = true; this.phase = 'open'; this.openT = 0.7;
    this.bossCd = 0.6; this.bossParryCd = 0.8; this.spam = 0;
    const dir = Math.atan2(e.y - p.y, e.x - p.x);
    e.attackPhase = 'none'; e.moveKey = null; e.state = 'parried'; e.pose = 'hurt'; e.poseT = 0.5;
    e.stun = Math.max(e.stun ?? 0, 0.32); e.attackCd = 0.75;
    e.counterLockT = 0.7; e.vulnerableT = 0.7; e.parryCd = 0.7;
    e.kx = Math.cos(dir) * 70; e.ky = Math.sin(dir) * 70;
    e.structure = (e.structure ?? 0) + Math.max(60, e.maxStructure ?? 100) * 0.22;
    p.parryHit = true; p.iframes = Math.max(p.iframes ?? 0, 0.18);
    p.focus = Math.min(300, (p.focus ?? 0) + 35 * (g.stats?.focusGain ?? 1));
    p.kx = -Math.cos(dir) * 22; p.ky = -Math.sin(dir) * 22;
    g.hitstop = Math.max(g.hitstop ?? 0, 0.055); g.shake?.(0.35); g.flash?.('#9be7ff', 0.12);
    g.sfx?.parry?.(); g.addCombo?.();
    g.particles?.ring?.(p.x, p.y - 6, 3, 20, '#9be7ff', 0.22, 2);
    g.particles?.spark?.(e.x - Math.cos(dir) * 5, e.y - 7, 10, '#ffffff', dir + Math.PI, 1.1, 220);
    g.particles?.impact?.(e.x, e.y - 6, 6, '#ffffff');
    if (e.structure >= (e.maxStructure ?? 1e9) && g.staggerEnemy) g.staggerEnemy(e);
    this.tell(g, 'PERFECT PARRY! COUNTER NOW', '#9be7ff');
  }
  /** Dipanggil saat damage melee pemain kena boss. */
  onPlayerHit(g: G, e: E): 'block' | 'open' | null {
    const pl = g.player;
    if ((e.dodgeT ?? 0) > 0) {
      g.texts?.hit?.(e.x, e.y - 24, 'MELESET!', '#cfd8ff', 1, 0.5); g.sfx?.whoosh?.();
      g.particles?.spark?.(e.x, e.y - 7, 4, '#cfd8ff', Math.atan2(e.y - pl.y, e.x - pl.x), 1, 120);
      return 'block';
    }
    if ((e.duelParryT ?? 0) > 0) {
      // lawan duel memparry: serangan tertahan, kamu terpental, lalu dia membalas
      const dir = Math.atan2(e.y - pl.y, e.x - pl.x);
      e.duelParryT = 0;
      pl.attackPhase = 'none'; pl.buffered = null; pl.comboStr = '';
      pl.stunT = Math.max(pl.stunT ?? 0, 0.2); pl.fireCd = Math.max(pl.fireCd ?? 0, 0.3);
      pl.kx = -Math.cos(dir) * 170; pl.ky = -Math.sin(dir) * 170;
      e.state = 'chase'; e.pose = 'parry'; e.poseT = 0; e.poseDur = 0.3;
      g.sfx?.parry?.(); g.flash?.('#ffd27f', 0.15); g.shake?.(0.4); g.hitstop = Math.max(g.hitstop ?? 0, 0.07);
      g.particles?.ring?.(e.x, e.y - 7, 2, 18, '#ffd27f', 0.2, 2);
      g.particles?.spark?.(e.x, e.y - 7, 12, '#ffffff', dir + Math.PI, 1.1, 240);
      if (g.brain) g.brain.riposte = 0.22;
      this.tell(g, 'LAWAN MEMPARRY!', '#ffd27f');
      return 'block';
    }
    if (!this.active) return null;
    if (this.phase === 'open' || (e.vulnerableT ?? 0) > 0) {
      this.phase = 'idle'; this.openT = 0; this.bossCd = 0.55;
      e.vulnerableT = 0; e.counterLockT = 0.45; e.stun = Math.max(e.stun ?? 0, 0.25);
      g.sfx?.hit?.(); g.particles?.impact?.(e.x, e.y - 6, 7, '#ffffff');
      this.tell(g, 'COUNTER HIT!', '#9be7ff');
      return 'open';
    }
    if (this.phase === 'telegraph' || this.phase === 'counter' || (e.counterLockT ?? 0) > 0 || this.bossParryCd > 0) return null;
    const chance = 0.16 + Math.min(0.44, this.spam * 0.1) + (e.canParry ? 0.06 : 0);
    if (Math.random() > chance) return null;
    // BOSS MEMPARRY PEMAIN
    const p = g.player;
    const dir = Math.atan2(e.y - p.y, e.x - p.x);
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    p.stunT = Math.max(p.stunT ?? 0, 0.12); p.fireCd = Math.max(p.fireCd ?? 0, 0.22);
    p.kx = -Math.cos(dir) * 120; p.ky = -Math.sin(dir) * 120;
    e.parryCd = 0.8; e.counterLockT = 0; e.vulnerableT = 0; e.attackCd = 0;
    e.state = 'attack'; e.pose = 'parry'; e.poseT = 0.5;
    g.sfx?.parry?.(); g.flash?.('#ffd27f', 0.12); g.shake?.(0.3);
    g.particles?.ring?.(e.x, e.y - 7, 2, 14, '#ffd27f', 0.18, 1);
    g.particles?.spark?.(e.x, e.y - 7, 8, '#ffd27f', dir + Math.PI, 1, 180);
    this.phase = 'counter'; this.counterT = 0.22; this.bossParryCd = 0.9; this.spam = 0;
    this.tell(g, 'ENEMY PARRY!', '#ff9d4a');
    return 'block';
  }
  onEnemyContact(g: G, e: E): boolean {
    if (this.phase === 'telegraph' && !this.parried && this.lmbAt !== null &&
        this.lmbAt >= this.realStart && this.lmbAt <= this.realEnd) { this.parrySuccess(g, e); return true; }
    return false;
  }
  draw(g: G, ctx: Ctx) {
    const e = this.findBoss(g);
    if (!e || g.state !== 'playing') return;
    const x = e.x, y = e.y - 8;
    ctx.save();
    if (this.phase === 'telegraph') {
      const u = clamp(this.t / this.dur, 0, 1);
      const real = this.t >= this.realStart && this.t <= this.realEnd;
      const fake = this.feint && this.t >= this.fakeStart && this.t <= this.fakeEnd;
      const col = real ? '#7dff9a' : fake ? '#ffd27f' : '#ff4d4d';
      const pulse = 0.75 + 0.25 * Math.sin(g.time * 16);
      ctx.globalAlpha = pulse;
      pring(ctx, x, y, 18 + (1 - u) * 13, col, 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * u);
      pcircle(ctx, x, y, real ? 3 : 2, col);
      ctx.globalAlpha = 1;
      prect(ctx, Math.round(x - 15), Math.round(y - 29), 30, 4, '#000000');
      prect(ctx, Math.round(x - 15), Math.round(y - 29), Math.round(30 * (1 - u)), 2, col);
      const wx = Math.round(x - 15 + 30 * (this.realStart / this.dur));
      prect(ctx, wx, Math.round(y - 24), Math.max(2, Math.round(30 * ((this.realEnd - this.realStart) / this.dur))), 2, '#7dff9a');
      pfontO(ctx, this.whiffT > 0 ? 'TOO EARLY' : real ? 'NOW!  LMB' : fake ? 'WAIT...' : 'LMB PARRY', x, y - 38, col, '#000', 1, 'center');
    } else if (this.phase === 'open') {
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(g.time * 12);
      pring(ctx, x, y, 16 + (1 - this.openT / 0.7) * 10, '#9be7ff', 2);
      ctx.globalAlpha = 1;
      pfontO(ctx, 'COUNTER!  LMB', x, y - 34, '#9be7ff', '#000', 1, 'center');
    } else if (this.phase === 'counter') {
      pring(ctx, x, y, 20, '#ff9d4a', 2);
      pfontO(ctx, 'ENEMY PARRY', x, y - 34, '#ff9d4a', '#000', 1, 'center');
    }
    ctx.restore();
  }
  tell(g: G, text: string, color: string) {
    if (g.say) g.say(text, color, 2, 0.7);
    else if (g.texts?.add) g.texts.add(g.player.x, g.player.y - 26, text, color, 1, 0.7);
  }
}
