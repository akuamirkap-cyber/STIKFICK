import { clamp, dist, lerp, rnd } from './rng';
import { moveWithCollision, solidAt, unstick } from './level';
import { solvePose } from './draw';
import { pcircle, pfontO, pline, prect, pring, type Ctx } from './pixel';

type G = any;
type E = any;
interface FlyingPot { x: number; y: number; vx: number; vy: number; life: number; power: number; spin: number; hitIds: number[] }
interface ThrowScene {
  phase: 'reach' | 'drag' | 'windup' | 'fly' | 'impact' | 'settle';
  t: number; bot: E; limb: 'arm' | 'leg'; dir: number; power: number;
  fx: number; fy: number; tx: number; ty: number; sx: number; sy: number;
  hitIds: number[]; scattered: boolean; clusterCount: number;
}

/** Meja & pot bunga statis, plus aksi lempar pot / lempar bot tak berdaya. */
export function drawStaticProp(ctx: Ctx, pr: any, flash: boolean, time: number, sideView = false): boolean {
  const x = pr.x, y = pr.y;
  if (pr.kind === 'table') {
    if (sideView) {
      // Side-view office desk: grounded at y, flat standable top at y - 9, 21px wide
      prect(ctx, Math.round(x - 10), Math.round(y - 9), 20, 4, flash ? '#fff' : '#24160d');
      prect(ctx, Math.round(x - 9), Math.round(y - 9), 18, 3, flash ? '#fff' : '#8a5a2b');
      pline(ctx, x - 9, y - 9, x + 8, y - 9, flash ? '#fff' : '#d8aa6a', 1);
      // Steel office legs reaching exact floor line y
      prect(ctx, Math.round(x - 8), Math.round(y - 5), 2, 5, flash ? '#fff' : '#3a4254');
      prect(ctx, Math.round(x + 6), Math.round(y - 5), 2, 5, flash ? '#fff' : '#3a4254');
      // Subtle monitor / paperwork silhouette on one corner (still flat to stand on)
      prect(ctx, Math.round(x - 6), Math.round(y - 13), 5, 4, flash ? '#fff' : '#232a3a');
      prect(ctx, Math.round(x - 5), Math.round(y - 12), 3, 2, flash ? '#fff' : '#46e2ff');
      prect(ctx, Math.round(x + 3), Math.round(y - 11), 3, 2, flash ? '#fff' : '#ff6b81');
      return true;
    }
    prect(ctx, Math.round(x - 9), Math.round(y - 5), 18, 5, flash ? '#fff' : '#24160d');
    prect(ctx, Math.round(x - 8), Math.round(y - 6), 16, 4, flash ? '#fff' : '#8a5a2b');
    pline(ctx, x - 7, y - 1, x - 7, y + 4, '#3a2410', 2);
    pline(ctx, x + 7, y - 1, x + 7, y + 4, '#3a2410', 2);
    pline(ctx, x - 6, y - 5, x + 6, y - 5, '#c79a5a', 1);
    prect(ctx, Math.round(x - 2), Math.round(y - 9), 4, 3, flash ? '#fff' : '#3d7a46');
    pcircle(ctx, x, y - 10, 2, flash ? '#fff' : '#ff6b81');
    return true;
  }
  if (pr.kind === 'pot') {
    const sway = Math.sin(time * 2.4 + x * 0.1) * 0.55;
    // Daun & tanaman hias rimbun
    pline(ctx, x - 1, y - 6, x - 4 + sway * 0.7, y - 10, flash ? '#fff' : '#2e7d32', 1.5);
    pline(ctx, x + 1, y - 6, x + 4 + sway * 0.7, y - 10, flash ? '#fff' : '#2e7d32', 1.5);
    pline(ctx, x, y - 6, x + sway, y - 13, flash ? '#fff' : '#4caf50', 1.5);
    pcircle(ctx, x + sway, y - 13.5, 2.2, flash ? '#fff' : '#ff6b81');
    pcircle(ctx, x + sway - 2.2, y - 11, 1.3, flash ? '#fff' : '#ffd166');
    pcircle(ctx, x + sway + 2.2, y - 11.5, 1.2, flash ? '#fff' : '#ff8da1');
    // Badan pot keramik terakota + bibir pot
    prect(ctx, Math.round(x - 4), Math.round(y - 7), 8, 7, flash ? '#fff' : '#4a2010');
    prect(ctx, Math.round(x - 3), Math.round(y - 6), 6, 5, flash ? '#fff' : '#c66b3d');
    prect(ctx, Math.round(x - 2), Math.round(y - 6), 2, 5, flash ? '#fff' : '#dc8252');
    // Tanah hitam di mulut pot & bibir terakota tebal
    prect(ctx, Math.round(x - 4), Math.round(y - 8), 8, 2, flash ? '#fff' : '#2b170e');
    pline(ctx, x - 5, y - 7, x + 5, y - 7, flash ? '#fff' : '#e49a63', 2);
    prect(ctx, Math.round(x - 3), Math.round(y - 1), 6, 1, '#3a1d0f');
    return true;
  }
  if (pr.kind === 'computer') {
    // Set Komputer Kantor (PC Desktop Case + Monitor Layar Lebar Menyala + Keyboard)
    const pulse = Math.floor(time * 6 + x) % 3;
    // Unit CPU desktop horizontal / dudukan bawah
    prect(ctx, Math.round(x - 7), Math.round(y - 4), 14, 4, flash ? '#fff' : '#141926');
    prect(ctx, Math.round(x - 6), Math.round(y - 3), 12, 2, flash ? '#fff' : '#2c364d');
    // Lampu LED Power hijau & indikator data
    prect(ctx, Math.round(x - 5), Math.round(y - 3), 2, 1, flash ? '#fff' : '#39ff88');
    prect(ctx, Math.round(x - 2), Math.round(y - 3), 1, 1, flash ? '#fff' : pulse === 0 ? '#ff9f43' : '#46e2ff');
    // Leher penyangga monitor
    prect(ctx, Math.round(x - 2), Math.round(y - 6), 4, 2, flash ? '#fff' : '#49587a');
    // Bingkai Monitor Widescreen
    prect(ctx, Math.round(x - 8), Math.round(y - 15), 16, 10, flash ? '#fff' : '#0d111a');
    prect(ctx, Math.round(x - 7), Math.round(y - 14), 14, 8, flash ? '#fff' : '#162840');
    // Layar LCD aktif + baris kode siber
    prect(ctx, Math.round(x - 6), Math.round(y - 13), 12, 6, flash ? '#fff' : '#1e446b');
    pline(ctx, x - 5, y - 12, x + 1 + (pulse % 2), y - 12, flash ? '#fff' : '#46e2ff', 1);
    pline(ctx, x - 5, y - 10, x + 4, y - 10, flash ? '#fff' : '#63f2c8', 1);
    pline(ctx, x - 5, y - 8, x - 1, y - 8, flash ? '#fff' : '#ffd166', 1);
    // Kilau kaca layar
    pline(ctx, x + 3, y - 13, x + 5, y - 11, flash ? '#fff' : 'rgba(255,255,255,0.55)', 1);
    // Papan keyboard di depan
    prect(ctx, Math.round(x - 6), Math.round(y - 1), 12, 1, flash ? '#fff' : '#6c7a96');
    return true;
  }
  return false;
}

function drawFlyingPot(ctx: Ctx, x: number, y: number, spin: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
  pline(ctx, 0, -2, 1, -7, '#3d7a46', 1);
  pcircle(ctx, 1, -8, 2, '#ff6b81');
  prect(ctx, -4, -3, 8, 6, '#5a2a16');
  prect(ctx, -3, -2, 6, 4, '#c66b3d');
  pline(ctx, -5, -3, 5, -3, '#e49a63', 1);
  ctx.restore();
}

export class PropsPlay {
  pots: FlyingPot[] = [];
  scene: ThrowScene | null = null;
  charging = false;
  charge = 0;
  cd = 0;
  time = 0;

  reset(g?: G) {
    this.pots = []; this.scene = null; this.charging = false; this.charge = 0;
    if (g) for (const e of g.enemies) e.throwLock = false;
  }
  spawnDecor(g: G) {
    const p = g.player;
    for (let i = 0; i < 2; i++) {
      const pos = g.randomFloorNear?.(p.x, p.y, 65, 240, g.rng);
      if (pos) g.props.push({ x: pos.x, y: pos.y, kind: 'table', hp: 5, r: 9, dead: false, flash: 0 });
    }
    for (let i = 0; i < 4; i++) {
      const pos = g.randomFloorNear?.(p.x, p.y, 40, 195, g.rng);
      if (pos) g.props.push({ x: pos.x, y: pos.y, kind: 'pot', hp: 1, r: 5, dead: false, flash: 0 });
    }
    for (let i = 0; i < 3; i++) {
      const pos = g.randomFloorNear?.(p.x, p.y, 50, 210, g.rng);
      if (pos) g.props.push({ x: pos.x, y: pos.y, kind: 'computer', hp: 2, r: 6, dead: false, flash: 0 });
    }
  }
  nearbyPot(g: G): any | null {
    const p = g.player;
    let best: any = null, bd = 40;
    for (const pr of g.props) {
      if (pr.dead || pr.kind !== 'pot') continue;
      const d = dist(p.x, p.y, pr.x, pr.y);
      if (d < bd) { bd = d; best = pr; }
    }
    return best;
  }
  downedBot(g: G): E | null {
    const p = g.player;
    let best: E | null = null, bd = 52;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0 || e.throwLock || e.punchLock) continue;
      const helpless = e.down > 0 || e.stagger > 0 || e.stun > 0 || e.hp <= e.maxHp * 0.22 || e.state === 'down';
      if (!helpless) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  /** kerumunan terdekat: skor = jumlah bot di radius - jarak, jadi benar-benar memilih cluster */
  findCluster(g: G, from: E) {
    const pool = g.enemies.filter((e: E) => e !== from && !e.dead && e.spawnT <= 0 && !e.throwLock);
    let best = { x: from.x + Math.cos(g.player.aim) * 80, y: from.y + Math.sin(g.player.aim) * 80, count: 0 };
    let score = -1e9;
    for (const c of pool) {
      let count = 0;
      for (const q of pool) if (dist(c.x, c.y, q.x, q.y) < 48) count++;
      const s = count * 100 - dist(from.x, from.y, c.x, c.y) * 0.35;
      if (s > score) { score = s; best = { x: c.x, y: c.y, count }; }
    }
    return best;
  }
  handleInput(g: G, dt: number) {
    if (g.state !== 'playing' || this.scene || g.botPunch?.active || g.carry?.carrying || g.carry?.throwing || g.carry?.nearProp?.(g)) {
      this.charging = false;
      return;
    }
    const zHit = !!g.input?.hit?.('z');
    const zHeld = !!g.input?.key?.('z');
    if (zHit && this.cd <= 0 && this.downedBot(g)) { this.charging = true; this.charge = 0; }
    if (this.charging && zHeld) this.charge = clamp(this.charge + dt / 0.55, 0, 1);
    if (this.charging && !zHeld) {
      this.charging = false;
      const power = 0.4 + 0.6 * this.charge;
      this.startBotThrow(g, power);
      this.cd = 0.45;
    }
  }
  throwPot(g: G, power: number): boolean {
    const pr = this.nearbyPot(g);
    if (!pr) return false;
    pr.dead = true; pr.hp = 0;
    const p = g.player, mw = g.mouseWorld?.() ?? { x: p.x + Math.cos(p.aim) * 100, y: p.y + Math.sin(p.aim) * 100 };
    const target = g.nearestEnemy?.(p.x, p.y, 220, p.aim, 1.6) ?? null;
    const tx = target ? target.x : mw.x, ty = target ? target.y - 5 : mw.y;
    const a = Math.atan2(ty - (pr.y - 6), tx - pr.x);
    const sp = 260 + 280 * power;
    this.pots.push({ x: pr.x, y: pr.y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1, power, spin: 0, hitIds: [] });
    g.sfx?.whoosh?.(); g.say?.('POT THROW', '#ff6b81', 2, 0.6);
    return true;
  }
  startBotThrow(g: G, power: number): boolean {
    const bot = this.downedBot(g);
    if (!bot) return false;
    const c = this.findCluster(g, bot);
    const a = Math.atan2(c.y - bot.y, c.x - bot.x);
    const limb = Math.random() < 0.5 ? 'arm' : 'leg';
    this.scene = {
      phase: 'reach', t: 0, bot, limb, dir: a, power,
      fx: bot.x, fy: bot.y, tx: c.x, ty: c.y, sx: bot.x, sy: bot.y,
      hitIds: [], scattered: false, clusterCount: c.count,
    };
    bot.throwLock = true; bot.stun = 1; bot.state = 'stun'; bot.pose = 'hurt';
    bot.kx = bot.ky = bot.vx = bot.vy = bot.vz = 0; bot.z = 0; bot.down = 0;
    g.say?.(`GRAB ${limb.toUpperCase()}`, '#ffd27f', 2, 0.7);
    g.sfx?.whoosh?.();
    return true;
  }
  shatterPot(g: G, x: number, y: number, dir: number, onBot: boolean) {
    g.sfx?.glassShatter?.(); g.sfx?.hit?.();
    g.particles?.burst?.(x, y, 18, '#e49a63', 170, 0.55, 2, 3);
    g.particles?.burst?.(x, y, 10, '#5a2a16', 120, 0.5, 1, 3);
    g.particles?.burst?.(x, y, 8, '#3a1d0f', 90, 0.45, 1, 2);
    g.particles?.burst?.(x, y, 7, '#ff6b81', 140, 0.6, 1, 2);
    g.particles?.burst?.(x, y, 4, '#ffd166', 110, 0.45, 1, 2);
    g.particles?.smoke?.(x, y + 2, 3, '#8a6a4a', 24, 0.35);
    g.particles?.ring?.(x, y, 2, onBot ? 18 : 13, '#ffffff', 0.2, 2);
    g.particles?.spark?.(x, y, 8, '#ffffff', dir + Math.PI, 0.9, 180);
    g.particles?.shockwave?.(x, y, 16, '#ffd27f', 0.18);
    g.shake?.(onBot ? 0.15 : 0.08); g.flash?.('#ffffff', onBot ? 0.08 : 0.04);
    g.hitstop = Math.max(g.hitstop ?? 0, onBot ? 0.035 : 0.015);
    if (g.stamp) g.stamp(x, y + 2, '#5a2a1655', 2);
    g.say?.(onBot ? 'SMASH!' : 'CRASH!', '#ff6b81', 2, 0.5);
  }
  update(g: G, dt: number) {
    this.time += dt;
    if (this.cd > 0) this.cd -= dt;
    this.handleInput(g, dt);
    this.updatePots(g, dt);
    if (this.scene) this.updateScene(g, dt);
  }
  updatePots(g: G, dt: number) {
    for (let i = this.pots.length - 1; i >= 0; i--) {
      const pot = this.pots[i];
      pot.life -= dt; pot.spin += dt * 14;
      pot.x += pot.vx * dt; pot.y += pot.vy * dt;
      pot.vy += 120 * dt;
      let gone = pot.life <= 0;
      if (!gone && solidAt(g.level, pot.x, pot.y)) { this.shatterPot(g, pot.x, pot.y, Math.atan2(pot.vy, pot.vx), false); gone = true; }
      if (!gone) for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0 || pot.hitIds.includes(e.id) || dist(pot.x, pot.y, e.x, e.y - 5 - e.z) > e.r + 5) continue;
        pot.hitIds.push(e.id);
        const a = Math.atan2(pot.vy, pot.vx);
        this.shatterPot(g, pot.x, pot.y, a, true);
        g.damageEnemy(e, 3 + pot.power * 3, 28, a, 180, { hitstop: 0.04, shake: 0.15, melee: false });
        e.down = Math.max(e.down ?? 0, 0.55); e.state = 'down'; e.pose = 'down'; e.stun = 0.2;
        gone = true; break;
      }
      if (gone) this.pots.splice(i, 1);
    }
  }
  updateScene(g: G, dt: number) {
    const s = this.scene!, p = g.player, bot = s.bot;
    s.t += dt;
    if (bot.dead) { this.finish(g); return; }
    bot.throwLock = true; bot.kx = bot.ky = bot.vx = bot.vy = bot.vz = 0;
    bot.stun = Math.max(bot.stun ?? 0, 0.5); bot.state = 'stun';
    p.moving = false; p.running = false; p.runT = 0;
    const sv = !!g.level?.sideView;
    if (s.phase === 'reach') {
      p.lean = { x: Math.cos(s.dir), y: sv ? 0 : Math.sin(s.dir) };
      if (s.t > 0.15) this.setPhase(s, 'drag');
    } else if (s.phase === 'drag') {
      const a = Math.atan2(p.y - bot.y, p.x - bot.x);
      moveWithCollision(g.level, bot, Math.cos(a) * 55 * dt, sv ? 0 : Math.sin(a) * 55 * dt);
      bot.z = 2; bot.pose = 'down';
      if (s.t > 0.18) this.setPhase(s, 'windup');
    } else if (s.phase === 'windup') {
      const spin = s.t * 15;
      const wx = p.x + Math.cos(s.dir + spin) * 16;
      const wy = sv ? p.y : p.y + Math.sin(s.dir + spin) * 10;
      if (g.isFree(wx, wy, bot.r)) { bot.x = wx; bot.y = wy; }
      else unstick(g.level, bot);
      bot.z = 3 + Math.sin(s.t * Math.PI * 6) * 3;
      bot.pose = 'fly';
      if (s.t > 0.16) { s.sx = bot.x; s.sy = bot.y; this.setPhase(s, 'fly'); }
    } else if (s.phase === 'fly') {
      const speed = 300 + 260 * s.power;
      const u = clamp(s.t / 0.3, 0, 1);
      const m = moveWithCollision(g.level, bot, Math.cos(s.dir) * speed * dt, sv ? 0 : Math.sin(s.dir) * speed * dt);
      bot.z = Math.sin(Math.PI * u) * 16;
      bot.pose = 'fly';
      g.addAfterimage?.({ x: bot.x, y: bot.y - bot.z, facing: bot.facing, aim: s.dir, pose: 'fly', poseT: 0.5 }, '#ffd27f', { x: Math.cos(s.dir), y: sv ? 0 : Math.sin(s.dir) });
      this.scatterAlong(g, s);
      if (s.t > 0.3 || m.bx || (!sv && m.by) || solidAt(g.level, bot.x, sv ? bot.y - 6 : bot.y)) {
        unstick(g.level, bot);
        this.setPhase(s, 'impact');
      }
    } else if (s.phase === 'impact') {
      if (!s.scattered) { this.scatter(g, s, bot.x, bot.y); s.scattered = true; }
      bot.down = 0.85; bot.state = 'down'; bot.pose = 'down'; bot.z = 0;
      unstick(g.level, bot);
      if (s.t > 0.12) this.setPhase(s, 'settle');
    } else if (s.phase === 'settle') {
      if (s.t > 0.16) this.finish(g);
    }
  }
  setPhase(s: ThrowScene, phase: ThrowScene['phase']) { s.phase = phase; s.t = 0; }
  scatterAlong(g: G, s: ThrowScene) {
    for (const e of g.enemies) {
      if (e === s.bot || e.dead || s.hitIds.includes(e.id) || dist(botX(s), botY(s), e.x, e.y) > 22) continue;
      s.hitIds.push(e.id);
      this.hitOne(g, e, s);
    }
  }
  scatter(g: G, s: ThrowScene, x: number, y: number) {
    g.particles?.shockwave?.(x, y, 34, '#ffd27f', 0.3);
    g.particles?.smoke?.(x, y + 2, 8, '#9a8f7d', 34, 0.45);
    g.particles?.ring?.(x, y, 2, 22, '#ffffff', 0.22, 2);
    g.sfx?.slam?.(); g.shake?.(0.18); g.flash?.('#ffffff', 0.07);
    for (const e of g.enemies) {
      if (e === s.bot || e.dead || dist(x, y, e.x, e.y) > 48) continue;
      if (!s.hitIds.includes(e.id)) s.hitIds.push(e.id);
      this.hitOne(g, e, s);
    }
    g.say?.(s.power > 0.75 ? 'SCATTER!' : 'DOWN!', '#ffd27f', 2, 0.7);
  }
  hitOne(g: G, e: E, s: ThrowScene) {
    const a = s.dir + rnd(-0.35, 0.35);
    const strong = s.power > 0.75;
    if (strong) {
      g.damageEnemy(e, 4, 35, a, 320, { knockdown: true, hitstop: 0.04, shake: 0.15, melee: true, launch: 110 });
      e.kx += Math.cos(a) * 240; e.ky += Math.sin(a) * 240;
      e.vz = Math.max(e.vz ?? 0, 130); e.z = Math.max(e.z ?? 0, 0.2);
      g.particles?.spark?.(e.x, e.y - 6, 8, '#ffffff', a, 1, 200);
    } else {
      g.damageEnemy(e, 2, 22, a, 150, { hitstop: 0.025, shake: 0.08, melee: true });
      e.down = 0.62; e.state = 'down'; e.pose = 'down'; e.stun = 0.2;
      e.kx += Math.cos(a) * 90; e.ky += Math.sin(a) * 90;
      g.particles?.smoke?.(e.x, e.y + 1, 3, '#9a8f7d', 20, 0.3);
    }
  }
  finish(g: G) {
    const s = this.scene;
    if (s) { s.bot.throwLock = false; s.bot.stun = Math.max(s.bot.stun ?? 0, 0.3); }
    this.scene = null; this.cd = 0.7;
    g.say?.('GET UP!', '#9be7ff', 2, 0.5);
  }
  playerHand(g: G) {
    try {
      const sk = solvePose(g.playerStickOpts('grab', 0.45));
      return { x: g.player.x + sk.fhand.x, y: g.player.y + sk.fhand.y - g.player.z };
    } catch { return { x: g.player.x, y: g.player.y - 7 }; }
  }
  draw(g: G, ctx: Ctx) {
    for (const pot of this.pots) {
      ctx.save(); ctx.globalAlpha = 0.35;
      pline(ctx, pot.x - pot.vx * 0.02, pot.y - pot.vy * 0.02, pot.x, pot.y, '#ff6b81', 2);
      ctx.globalAlpha = 1; drawFlyingPot(ctx, pot.x, pot.y, pot.spin); ctx.restore();
    }
    if (this.charging) {
      const p = g.player;
      prect(ctx, Math.round(p.x - 11), Math.round(p.y + 7), 22, 4, '#000');
      prect(ctx, Math.round(p.x - 10), Math.round(p.y + 8), Math.round(20 * this.charge), 2, this.charge >= 1 ? '#ffffff' : '#ff6b81');
      pfontO(ctx, this.charge >= 1 ? 'MAX THROW' : 'CHARGE', p.x, p.y - 30, '#ffd27f', '#000', 1, 'center');
    } else if (!this.scene && this.cd <= 0 && g.state === 'playing' && !g.carry?.carrying && !g.carry?.nearProp?.(g)) {
      const bot = this.downedBot(g);
      if (bot) pfontO(ctx, 'Z: GRAB THROW', g.player.x, g.player.y - 30, '#ffd27f', '#000', 1, 'center');
    }
    const s = this.scene;
    if (!s) return;
    const hand = this.playerHand(g), bot = s.bot;
    const limb = s.limb === 'arm'
      ? { x: bot.x + Math.cos(s.dir) * 4, y: bot.y - 7 - bot.z }
      : { x: bot.x - Math.cos(s.dir) * 3, y: bot.y + 1 - bot.z };
    ctx.save();
    if (s.phase === 'reach' || s.phase === 'drag' || s.phase === 'windup') {
      pline(ctx, hand.x, hand.y, limb.x, limb.y, '#ffd27f', 1);
      pcircle(ctx, limb.x, limb.y, 2, '#ffffff');
      pring(ctx, bot.x, bot.y - 7, 13, '#ffd27f', 2);
      pfontO(ctx, s.limb === 'arm' ? 'GRAB ARM' : 'GRAB LEG', bot.x, bot.y - 30, '#ffd27f', '#000', 1, 'center');
    } else {
      for (let i = 1; i <= 5; i++) {
        const u = i / 6;
        pcircle(ctx, lerp(s.sx, s.tx, u), lerp(s.sy, s.ty, u) - Math.sin(Math.PI * u) * 12, 1, '#ffd27faa');
      }
      pfontO(ctx, s.power > 0.75 ? 'HEAVY THROW' : 'THROW!', bot.x, bot.y - 34 - bot.z, '#ffd27f', '#000', 1, 'center');
    }
    ctx.restore();
  }
}
const botX = (s: ThrowScene) => s.bot.x;
const botY = (s: ThrowScene) => s.bot.y;
