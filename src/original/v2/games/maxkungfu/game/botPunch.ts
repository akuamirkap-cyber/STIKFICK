import { clamp, dist, lerp, rnd } from './rng';
import { lineOfSight, moveWithCollision, unstick } from './level';
import { pcircle, pfontO, pline, prect, pring, type Ctx } from './pixel';

/**
 * STRAIGHT PUNCH — adegan situasional FIST + RMB.
 * Dunia TETAP berjalan; hanya input pemain yang dikunci sebentar.
 * Rush melengkung, mengejar target, lalu pukulan lurus melempar bot dengan efek tabrakan.
 */
type G = any;
type B = any;
interface Target { kind: 'enemy' | 'companion'; ref: B; id: number }
interface Scene {
  phase: 'lock' | 'dash' | 'windup' | 'impact' | 'launch' | 'recover';
  t: number; launchT: number;
  sx: number; sy: number; tx: number; ty: number; ix: number; iy: number;
  target: Target; dir: number; side: number;
  hitDone: boolean; bounced: boolean; chain: number[];
}

export class BotPunch {
  active: Scene | null = null;
  cd = 0;
  time = 0;

  reset(g?: G) {
    this.active = null; this.cd = 0;
    if (g) { g.camFocus = null; for (const e of g.enemies) e.punchLock = false; }
  }
  pos(t: Target) { return { x: t.ref.x as number, y: t.ref.y as number }; }
  nearestBot(g: G, x: number, y: number, maxD: number): Target | null {
    const sv = !!g.level?.sideView;
    const list: { t: Target; d: number }[] = [];
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0 || e.punchLock) continue;
      if (sv && Math.abs(e.y - y) > 22) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < maxD && lineOfSight(g.level, x, y, e.x, e.y)) list.push({ t: { kind: 'enemy', ref: e, id: e.id }, d });
    }
    const bot = g.mirrorSystem?.bot;
    if (bot && (!sv || Math.abs(bot.y - y) <= 22)) {
      const d = dist(x, y, bot.x, bot.y);
      if (d < maxD && lineOfSight(g.level, x, y, bot.x, bot.y)) list.push({ t: { kind: 'companion', ref: bot, id: -999 }, d });
    }
    list.sort((a, b) => a.d - b.d);
    return list[0]?.t ?? null;
  }
  /** Bot yang SEDANG bisa di-straight-punch; dipakai båik untuk input maupun indikator. */
  markedTarget(g: G): Target | null {
    if (g.state !== 'playing' || this.active || this.cd > 0) return null;
    const p = g.player;
    if (p.weapon !== 'fist' || p.attackPhase !== 'none' || p.stunT > 0 || p.holdT > 0 ||
        p.airborne || p.fatality || p.dashT > 0 || p.rageDash || g.silat ||
        g.bossExchange?.phase === 'telegraph' || g.bossExchange?.phase === 'open' || g.bossExchange?.phase === 'counter') return null;
    return this.nearestBot(g, p.x, p.y, 155);
  }
  maybeStart(g: G): boolean {
    if (!g.input?.mouse?.rpressed) return false;
    // Tidak ada lagi tebak-tebakan: marker di bot = klik kanan pasti jadi straight punch.
    const target = this.markedTarget(g);
    if (!target) return false;
    this.start(g, target);
    return true;
  }
  start(g: G, target: Target) {
    const p = g.player, tp = this.pos(target);
    const sv = !!g.level?.sideView;
    const a = sv ? (tp.x >= p.x ? 0 : Math.PI) : Math.atan2(tp.y - p.y, tp.x - p.x);
    this.active = {
      phase: 'lock', t: 0, launchT: 0,
      sx: p.x, sy: p.y, tx: tp.x - Math.cos(a) * 24, ty: sv ? p.y : tp.y - Math.sin(a) * 24,
      ix: tp.x, iy: tp.y,
      target, dir: a, side: target.id % 2 === 0 ? 1 : -1,
      hitDone: false, bounced: false, chain: [],
    };
    p.aim = a; p.bodyAim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1;
    p.lean = { x: Math.cos(a), y: sv ? 0 : Math.sin(a) };
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    p.vx = p.vy = p.kx = p.ky = 0; p.z = 0; p.vz = 0; p.airborne = false;
    p.moving = false; p.running = false; p.runT = 0; p.dashT = 0; p.stunT = 0;
    p.iframes = Math.max(p.iframes ?? 0, 0.3); p.squash = 0.94;
    g.input.mouse.rpressed = false; g.input.mouse.rdown = false;
    g.sfx?.dash?.(); g.sfx?.whoosh?.();
    g.zoomKick = Math.max(g.zoomKick ?? 0, 0.018);
    g.say?.('STRAIGHT PUNCH', '#9be7ff', 2, 0.65);
    this.cd = 2.8;
  }
  setPhase(s: Scene, phase: Scene['phase']) { s.phase = phase; s.t = 0; }
  update(g: G, dt: number): boolean {
    this.time += dt;
    if (this.cd > 0) this.cd -= dt;
    const s = this.active;
    if (!s) return false;
    if (g.state !== 'playing') { this.reset(g); return false; }
    s.t += dt;
    const p = g.player, tp = this.pos(s.target);
    const sv = !!g.level?.sideView;
    if (s.phase !== 'launch' && s.phase !== 'recover') {
      s.dir = sv ? (tp.x >= p.x ? 0 : Math.PI) : Math.atan2(tp.y - p.y, tp.x - p.x);
    }
    // tujuan ikut target yang bergerak, jadi rush terasa mengejar bukan slide ke titik mati
    s.tx = tp.x - Math.cos(s.dir) * 24; s.ty = sv ? p.y : tp.y - Math.sin(s.dir) * 24;
    p.aim = s.dir; p.bodyAim = s.dir; p.facing = Math.cos(s.dir) >= 0 ? 1 : -1;
    p.lean = { x: Math.cos(s.dir), y: sv ? 0 : Math.sin(s.dir) };
    p.moving = false; p.running = false; p.runT = 0;

    if (s.phase === 'lock') {
      p.squash = 0.94 + Math.sin(this.time * 22) * 0.02;
      if (s.t > 0.1) this.setPhase(s, 'dash');
    } else if (s.phase === 'dash') {
      const u = clamp(s.t / 0.2, 0, 1), e = u * u * (3 - 2 * u);
      const curve = sv ? 0 : Math.sin(Math.PI * u) * 7 * s.side;
      const nx = lerp(s.sx, s.tx, e) - Math.sin(s.dir) * curve;
      const ny = sv ? p.y : lerp(s.sy, s.ty, e) + Math.cos(s.dir) * curve;
      const blocked = moveWithCollision(g.level, p, nx - p.x, sv ? 0 : ny - p.y);
      p.z = Math.sin(Math.PI * u) * 2.5; p.vz = 0;
      p.squash = 0.9 + 0.06 * Math.sin(u * Math.PI * 2);
      g.addAfterimage?.({ x: p.x, y: p.y - p.z, facing: p.facing, aim: s.dir, pose: 'dash', poseT: 0.35 + u * 0.3 }, '#9be7ff', p.lean);
      g.particles?.lines?.(p.x - Math.cos(s.dir) * 7, p.y - 6, 3, '#ffffff', s.dir + Math.PI + rnd(-0.25, 0.25), 240);
      g.particles?.smoke?.(p.x - Math.cos(s.dir) * 5, p.y + 1, 1, '#9a9a9a', 12, 0.22);
      if (blocked.bx || blocked.by || u >= 1) { p.z = 0; this.setPhase(s, 'windup'); }
    } else if (s.phase === 'windup') {
      p.squash = 0.84; p.recoil = 0.35;
      g.particles?.spark?.(p.x + Math.cos(s.dir) * 8, p.y - 8, 2, '#ffd27f', s.dir, 0.5, 80);
      if (s.t > 0.1) this.setPhase(s, 'impact');
    } else if (s.phase === 'impact') {
      if (!s.hitDone) { this.impact(g, s); s.hitDone = true; }
      p.squash = 0.8; p.recoil = 1;
      if (s.t > 0.06) this.setPhase(s, 'launch');
    } else if (s.phase === 'launch') {
      s.launchT += dt;
      this.launch(g, s, dt);
      p.squash = lerp(p.squash ?? 0.8, 0.94, Math.min(1, dt * 6));
      p.recoil = Math.max(0, (p.recoil ?? 0) - dt * 4);
      if (s.launchT > 0.5) this.setPhase(s, 'recover');
    } else if (s.phase === 'recover') {
      p.squash = lerp(p.squash ?? 1, 1, Math.min(1, dt * 9));
      p.recoil = Math.max(0, (p.recoil ?? 0) - dt * 6);
      if (s.t > 0.16) this.finish(g);
    }
    return true;
  }
  impact(g: G, s: Scene) {
    const p = g.player, t = s.target.ref, tp = this.pos(s.target), a = s.dir;
    const col = s.target.kind === 'companion' ? '#9be7ff' : '#ffd27f';
    s.ix = tp.x; s.iy = tp.y;
    p.kx = -Math.cos(a) * 16; p.ky = -Math.sin(a) * 16;
    g.sfx?.heavy?.(); g.sfx?.hit?.();
    g.hitstop = Math.max(g.hitstop ?? 0, 0.035); g.shake?.(0.13); g.flash?.('#ffffff', 0.07);
    g.zoomKick = Math.max(g.zoomKick ?? 0, 0.025);
    g.camKick.x -= Math.cos(a) * 2.5; g.camKick.y -= Math.sin(a) * 2.5;
    g.particles?.ring?.(tp.x, tp.y - 6, 2, 22, col, 0.22, 2, true);
    g.particles?.impact?.(tp.x, tp.y - 6, 8, '#ffffff');
    g.particles?.spark?.(tp.x, tp.y - 6, 12, col, a, 1.2, 240);
    g.particles?.shockwave?.(tp.x, tp.y - 6, 24, col, 0.22);
    if (s.target.kind === 'enemy') {
      g.damageEnemy(t, 6, 38, a, 480, { knockdown: true, hitstop: 0.04, shake: 0.12, melee: true, launch: 140 });
      g.addCombo?.();
    } else g.say?.('SPARRING HIT!', '#9be7ff', 2, 0.6);
    t.punchLock = true;
    t.stun = Math.max(t.stun ?? 0, 0.75); t.state = 'stun'; t.pose = 'hurt'; t.poseT = 0.5;
    t.down = 0; t.counterLockT = 0.75; t.rallyWindow = 0;
    t.kx = t.ky = t.vx = t.vy = t.vz = 0;
    t.z = 0; t.sqx = 1.25; t.sqy = 0.82;
    for (const other of g.enemies) {
      if (other === t || other.dead || s.chain.includes(other.id) || dist(tp.x, tp.y, other.x, other.y) > 30) continue;
      s.chain.push(other.id);
      g.damageEnemy(other, 2, 16, a, 230, { knockdown: true, hitstop: 0.02, shake: 0.08, melee: true });
      other.kx = Math.cos(a) * 210; other.ky = Math.sin(a) * 210;
      g.particles?.ring?.(other.x, other.y - 6, 1, 11, col, 0.16, 1, true);
    }
  }
  launch(g: G, s: Scene, dt: number) {
    const t = s.target.ref, u = clamp(s.launchT / 0.5, 0, 1);
    const sv = !!g.level?.sideView;
    const col = s.target.kind === 'companion' ? '#9be7ff' : '#ffd27f';
    if (s.target.kind === 'enemy' && t.dead) { this.setPhase(s, 'recover'); return; }
    const speed = 380 * (1 - u * 0.6);
    const blocked = moveWithCollision(g.level, t, Math.cos(s.dir) * speed * dt, sv ? 0 : Math.sin(s.dir) * speed * dt);
    if ((blocked.bx || (!sv && blocked.by)) && !s.bounced) {
      s.bounced = true;
      s.dir = sv ? (Math.cos(s.dir) >= 0 ? Math.PI : 0) : s.dir + Math.PI + rnd(-0.4, 0.4);
      unstick(g.level, t);
      g.particles?.smoke?.(t.x, t.y + 1, 5, '#9a9a9a', 24, 0.3);
      g.particles?.ring?.(t.x, t.y - 6, 2, 13, '#ffffff', 0.18, 1);
      g.sfx?.slam?.(); g.shake?.(0.1);
    }
    t.z = Math.sin(Math.PI * u) * 18;
    t.kx = t.ky = t.vx = t.vy = t.vz = 0; // botPunch owns the motion; physics tidak dobel
    t.stun = Math.max(t.stun ?? 0, 0.4); t.state = 'stun'; t.pose = 'hurt'; t.poseT = 0.5;
    t.moving = false; t.rot = (t.rot ?? 0) + dt * 7 * s.side;
    g.particles?.lines?.(t.x, t.y - 6 - t.z, 2, col, s.dir + Math.PI + rnd(-0.2, 0.2), 170);
    g.addAfterimage?.({ x: t.x, y: t.y - t.z, facing: t.facing ?? 1, aim: s.dir, pose: 'hurt', poseT: 0.5 }, col, { x: Math.cos(s.dir), y: Math.sin(s.dir) });
    for (const other of g.enemies) {
      if (other === t || other.dead || s.chain.includes(other.id) || dist(t.x, t.y, other.x, other.y) > 26) continue;
      s.chain.push(other.id);
      g.damageEnemy(other, 2, 14, s.dir, 190, { knockdown: true, hitstop: 0.02, shake: 0.06, melee: true });
      other.kx = Math.cos(s.dir) * 190; other.ky = sv ? 0 : Math.sin(s.dir) * 190;
      g.particles?.spark?.(other.x, other.y - 6, 5, col, s.dir, 0.9, 160);
    }
    const bot = g.mirrorSystem?.bot;
    if (bot && bot !== t && !s.chain.includes(-999) && dist(t.x, t.y, bot.x, bot.y) < 26) {
      s.chain.push(-999);
      moveWithCollision(g.level, bot, Math.cos(s.dir) * 10, sv ? 0 : Math.sin(s.dir) * 10);
      g.particles?.ring?.(bot.x, bot.y - 6, 1, 10, '#9be7ff', 0.16, 1);
    }
    if (s.launchT >= 0.5) {
      t.z = 0; t.vz = -50; t.kx = Math.cos(s.dir) * 60; t.ky = sv ? 0 : Math.sin(s.dir) * 60;
      t.sqx = 1; t.sqy = 1;
      unstick(g.level, t);
    }
  }
  finish(g: G) {
    const s = this.active;
    const p = g.player;
    if (s) {
      s.target.ref.punchLock = false;
      s.target.ref.stun = Math.max(s.target.ref.stun ?? 0, 0.35);
      unstick(g.level, s.target.ref);
    }
    this.active = null; this.cd = 2.8;
    g.camFocus = null;
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    p.squash = 1; p.recoil = 0; p.z = 0; p.vz = 0; p.airborne = false;
    p.vx = p.vy = 0; p.kx = p.ky = 0;
    p.iframes = Math.max(p.iframes ?? 0, 0.15);
    g.say?.('KNOCKBACK!', '#ffd27f', 2, 0.5);
  }
  poseOverride(): { pose: string; t: number } | null {
    const s = this.active;
    if (!s) return null;
    if (s.phase === 'lock') return { pose: 'dash', t: 0.18 };
    if (s.phase === 'dash') return { pose: 'dash', t: 0.42 + 0.2 * Math.sin(this.time * 18) };
    if (s.phase === 'windup') return { pose: 'cross', t: 0.08 };
    if (s.phase === 'impact') return { pose: 'runpunch', t: 0.46 };
    if (s.phase === 'launch') return { pose: 'runpunch', t: 0.68 };
    return { pose: 'runpunch', t: 0.86 };
  }
  label(ctx: Ctx, x: number, y: number, text: string, color: string, w = 30) {
    prect(ctx, Math.round(x - w / 2), Math.round(y), w, 7, '#000000aa');
    pfontO(ctx, text, x, y + 1, color, '#000', 1, 'center');
  }
  draw(g: G, ctx: Ctx) {
    const s = this.active, p = g.player;
    ctx.save();
    if (!s) {
      const ready = this.markedTarget(g);
      const waiting = this.cd > 0 && p.weapon === 'fist' ? this.nearestBot(g, p.x, p.y, 155) : null;
      const mark = ready ?? waiting;
      if (mark) {
        const q = this.pos(mark), col = ready ? '#ffd27f' : '#66707a';
        const pulse = 0.7 + 0.3 * Math.sin(this.time * 10);
        ctx.globalAlpha = ready ? pulse : 0.45;
        pring(ctx, q.x, q.y - 7, ready ? 12 : 9, col, 2);
        pcircle(ctx, q.x, q.y - 7, 2, col);
        pline(ctx, q.x - 4, q.y - 7, q.x + 4, q.y - 7, col, 1);
        pline(ctx, q.x, q.y - 11, q.x, q.y - 3, col, 1);
        ctx.globalAlpha = 1;
        this.label(ctx, q.x, q.y - 32, ready ? 'RMB  STRAIGHT' : `CD ${Math.ceil(this.cd)}`, col, ready ? 66 : 28);
      }
      ctx.restore();
      return;
    }
    const tp = this.pos(s.target);
    if (s.phase === 'lock' || s.phase === 'dash') {
      // panah arah yang jelas, bukan cuma ring
      const segs = 8;
      for (let i = 0; i < segs; i++) {
        const u0 = i / segs, u1 = u0 + 0.55 / segs;
        pline(ctx, lerp(p.x, tp.x, u0), lerp(p.y - 6, tp.y - 6, u0), lerp(p.x, tp.x, u1), lerp(p.y - 6, tp.y - 6, u1), '#9be7ffaa', 1);
      }
      const ah = s.dir, ax = tp.x - Math.cos(ah) * 13, ay = tp.y - 6 - Math.sin(ah) * 13;
      pline(ctx, ax, ay, ax - Math.cos(ah - 0.5) * 5, ay - Math.sin(ah - 0.5) * 5, '#ffffff', 1);
      pline(ctx, ax, ay, ax - Math.cos(ah + 0.5) * 5, ay - Math.sin(ah + 0.5) * 5, '#ffffff', 1);
      ctx.globalAlpha = 0.75 + 0.2 * Math.sin(this.time * 18);
      pring(ctx, tp.x, tp.y - 7, 12 + (s.phase === 'dash' ? 4 : 0), '#9be7ff', 2);
      ctx.globalAlpha = 1;
      this.label(ctx, tp.x, tp.y - 34, s.phase === 'lock' ? `LOCK ${Math.round(dist(p.x, p.y, tp.x, tp.y))}` : 'RUSH', '#9be7ff', 42);
      // jejak posisi awal
      pcircle(ctx, s.sx, s.sy - 6, 2, '#9be7ff88');
    } else if (s.phase === 'windup') {
      pring(ctx, p.x + Math.cos(s.dir) * 9, p.y - 8, 7, '#ffd27f', 2, s.dir - 1.2, s.dir + 1.2);
      this.label(ctx, p.x, p.y - 36, 'STRAIGHT!', '#ffd27f', 48);
    } else if (s.phase === 'impact') {
      pline(ctx, s.ix - Math.cos(s.dir) * 20, s.iy - 7 - Math.sin(s.dir) * 20, s.ix + Math.cos(s.dir) * 20, s.iy - 7 + Math.sin(s.dir) * 20, '#ffffff', 2);
      this.label(ctx, s.ix, s.iy - 34, 'HIT!', '#ffffff', 24);
    } else {
      // lintasan pentalan bertitik supaya arahnya terbaca
      for (let i = 1; i <= 6; i++) {
        const u = i / 7;
        pcircle(ctx, s.ix + Math.cos(s.dir) * 70 * u, s.iy - 7 + Math.sin(s.dir) * 70 * u - Math.sin(Math.PI * u) * 14, 1, '#ffd27faa');
      }
      pcircle(ctx, tp.x, tp.y - 7 - (s.target.ref.z ?? 0), 3, '#ffd27f');
      const fade = clamp(1 - s.launchT / 0.5, 0.15, 1);
      ctx.globalAlpha = fade;
      this.label(ctx, tp.x, tp.y - 30, s.bounced ? 'BOUNCE' : 'KB', '#ffd27f', s.bounced ? 34 : 16);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
