import { clamp, dist, rnd } from './rng';
import { moveWithCollision } from './level';
import { drawStick, solvePose } from './draw';
import { pcircle, pfontO, prect, type Ctx } from './pixel';
import { drawPistol, drawRifle } from './guns';
import { drawShotgun } from './shotgun';
import { drawBow } from './bow';
import { drawBusterSword } from './buster';
import { drawBat, drawShortBlade } from './weapons';

/** Bot pendamping + musuh cermin: keduanya memakai senjata yang SAMA dengan pemain, live. */
type G = any;
type E = any;
interface Agent {
  x: number; y: number; vx: number; vy: number; r: number;
  aim: number; facing: number; weapon: string; team: 'ally' | 'enemy';
  cd: number; recoil: number; walk: number; moving: boolean; name: string;
}
const MELEE = new Set(['fist', 'buster', 'bat', 'nunchaku', 'katana', 'axe', 'dual', 'yoyo', 'takamura', 'hayabusa', 'boxing']);
const DEFAULT_DRAWN = new Set(['pistol', 'rifle', 'smg', 'shotgun', 'knife', 'shield', 'bomb', 'staff', 'bat']);
const cdFor = (w: string) => w === 'rifle' ? 0.12 : w === 'pistol' ? 0.28 : w === 'shotgun' ? 0.7 : w === 'bow' ? 0.44 : MELEE.has(w) ? 0.42 : 0.5;
const rangeFor = (w: string) => MELEE.has(w) ? 36 : w === 'shotgun' ? 120 : 250;

export class MirrorSystem {
  bot: Agent | null = null;
  mirrorId = -1;
  botOn = false;
  mirrorOn = false;
  time = 0;

  reset(g?: G) {
    this.bot = null; this.mirrorId = -1; this.botOn = false; this.mirrorOn = false;
    if (g) { g.enemies = g.enemies.filter((e: E) => !e.mirror); g.pushUI?.(); }
  }
  toggleBot(g: G) {
    if (g.mode === 'team') { g.say?.('MODE TIM: 19 SEKUTU SUDAH BERSAMAMU', '#4aa8ff', 2, 1.0); return; }
    // bot sekutu cerdas (ally) menggantikan bot sederhana lama
    this.botOn = g.ally.toggle(g);
    g.sfx?.select?.(); g.pushUI?.();
  }
  spawnMirror(g: G) {
    const old = this.findMirror(g);
    if (old) {
      g.enemies = g.enemies.filter((e: E) => e !== old);
      this.mirrorId = -1; this.mirrorOn = false;
      g.say?.('MIRROR GONE', '#ff6a4a', 2, 0.6);
    } else {
      const p = g.player;
      const pos = g.randomFloorNear?.(p.x, p.y, 60, 130) ?? { x: p.x + 70, y: p.y };
      const e = g.spawnEnemyAt('gunner', pos.x, pos.y, false);
      if (!e) return;
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      Object.assign(e, {
        mirror: true, name: 'MIRROR', weapon: p.weapon,
        color: '#9be7ff', color2: '#1b3b4a', accessory: 'shades', shades: 0,
        hp: Math.max(45, p.maxHp * 5), maxHp: Math.max(45, p.maxHp * 5),
        scale: 1, r: 5, speed: 86, kbRes: 0.25, canParry: true,
        aim: a, bodyAim: a, facing: Math.cos(a) >= 0 ? 1 : -1,
        spawnT: 0.35, attackCd: 0.5, state: 'chase', pose: 'idle',
        walk: 0, moving: false, runT: 0, strideHalf: 3,
      });
      this.mirrorId = e.id; this.mirrorOn = true;
      g.say?.('MIRROR SPAWNED', '#ff9d4a', 2, 0.8);
    }
    g.sfx?.select?.(); g.pushUI?.();
  }
  findMirror(g: G): E | null { return g.enemies.find((e: E) => e.id === this.mirrorId && !e.dead) ?? null; }
  nearestEnemy(g: G, x: number, y: number): E | null {
    let best: E | null = null, d = 1e9;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const q = dist(x, y, e.x, e.y);
      if (q < d) { d = q; best = e; }
    }
    return d < 260 ? best : null;
  }
  update(g: G, dt: number) {
    this.time += dt;
    if (g.state !== 'playing') return;
    const p = g.player;
    if (this.bot) this.updateBot(g, this.bot, dt);
    const e = this.findMirror(g);
    if (!e) { if (this.mirrorOn) { this.mirrorOn = false; this.mirrorId = -1; g.pushUI?.(); } }
    else { e.weapon = p.weapon; this.updateMirrorEnemy(g, e, dt); }
  }
  updateBot(g: G, a: Agent, dt: number) {
    const p = g.player;
    a.weapon = p.weapon;
    a.recoil = Math.max(0, a.recoil - dt * 6);
    a.cd -= dt;
    const target = this.nearestEnemy(g, a.x, a.y);
    const melee = MELEE.has(a.weapon);
    const dest = target && melee
      ? { x: target.x - Math.cos(a.aim) * 24, y: target.y - Math.sin(a.aim) * 24 }
      : { x: p.x - p.facing * 20, y: p.y + 12 };
    const dx = dest.x - a.x, dy = dest.y - a.y, d = Math.hypot(dx, dy) || 1;
    const spd = Math.min(150, d * 5);
    const mx = (dx / d) * spd * dt, my = (dy / d) * spd * dt;
    a.moving = d > 5;
    if (a.moving) { moveWithCollision(g.level, a, mx, my); a.walk += dt * 8; }
    const aimAt = target ?? { x: a.x + Math.cos(p.aim) * 100, y: a.y + Math.sin(p.aim) * 100 };
    a.aim = Math.atan2(aimAt.y - a.y, aimAt.x - a.x);
    a.facing = Math.cos(a.aim) >= 0 ? 1 : -1;
    if (target && a.cd <= 0 && dist(a.x, a.y, target.x, target.y) < rangeFor(a.weapon) && g.hasLOS?.(target) !== false) {
      this.fire(g, a, target);
      a.cd = cdFor(a.weapon);
    }
  }
  updateMirrorEnemy(g: G, e: E, dt: number) {
    const p = g.player;
    if (e.flash > 0) e.flash -= dt;
    if (e.flinch > 0) e.flinch -= dt;
    if (e.faceT > 0) e.faceT -= dt;
    if (e.spawnT > 0) { e.spawnT -= dt; return; }
    if ((e.stun ?? 0) > 0 || (e.stagger ?? 0) > 0 || (e.down ?? 0) > 0) { e.moving = false; return; }
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    e.aim = a; e.bodyAim = a; e.facing = Math.cos(a) >= 0 ? 1 : -1;
    const d = dist(e.x, e.y, p.x, p.y);
    const melee = MELEE.has(e.weapon);
    const want = melee ? 26 : 80;
    const toward = d > want + 12 ? 1 : d < want - 12 ? -1 : 0;
    const strafe = Math.sin(this.time * 1.4 + e.id) * 0.45;
    const nx = Math.cos(a), ny = Math.sin(a);
    const vx = (nx * toward - ny * strafe) * 78, vy = (ny * toward + nx * strafe) * 78;
    e.moving = Math.abs(vx) + Math.abs(vy) > 4;
    if (e.moving) { moveWithCollision(g.level, e, vx * dt, vy * dt); e.walk += dt * 8; e.runT = clamp((e.runT ?? 0) + dt, 0, 1); }
    e.pose = e.moving ? 'run' : 'shoot'; e.poseT = 0.5;
    e.attackCd = (e.attackCd ?? 0) - dt;
    if (e.attackCd <= 0 && d < rangeFor(e.weapon) && g.hasLOS?.(p) !== false) {
      this.fire(g, { x: e.x, y: e.y, aim: a, weapon: e.weapon, team: 'enemy', recoil: 1 }, p);
      e.attackCd = cdFor(e.weapon);
    }
  }
  fire(g: G, a: { x: number; y: number; aim: number; weapon: string; team: 'ally' | 'enemy'; recoil?: number }, target: E) {
    const w = a.weapon, ally = a.team === 'ally';
    const ang = a.aim + rnd(-0.02, 0.02);
    const ox = a.x + Math.cos(ang) * 10, oy = a.y - 7 + Math.sin(ang) * 6;
    const owner = ally ? 'player' : 'enemy';
    const push = (spread: number, sp: number, dmg: number, color: string, kind: string, structure: number, kb: number) => {
      g.bullets.push({
        x: ox, y: oy, px: ox, py: oy, vx: Math.cos(ang + spread) * sp, vy: Math.sin(ang + spread) * sp,
        r: 2, dmg, owner, life: 1.0, color, pierce: 0, bounce: 0,
        kind: ally ? kind : 'enemy', hitIds: [], structure, kb,
      });
    };
    if (w === 'pistol') { push(0, 1050, ally ? 3 : 1, '#fff6c8', 'pistol', 8, 70); g.sfx?.shot?.('pistol'); }
    else if (w === 'rifle') { push(0, 1200, ally ? 2.5 : 1, '#ffe08a', 'rifle', 6, 45); g.sfx?.shot?.('rifle'); }
    else if (w === 'shotgun') {
      for (let i = 0; i < 6; i++) push(rnd(-0.2, 0.2), 900, ally ? 2 : 1, '#ffcf6a', 'pistol', 6, 55);
      g.sfx?.shotgunBlast?.();
    } else if (w === 'bow') {
      if (ally && g.spawnArrow) g.spawnArrow(ox, oy, ang, 0.75, null, true);
      else push(0, 850, 2, '#9ff0ff', 'pistol', 12, 90);
      g.sfx?.bowRelease?.(0.75);
    } else {
      const d = dist(a.x, a.y, target.x, target.y);
      const col = w === 'buster' ? '#7dffc8' : '#ffffff';
      g.bu?.addSlash?.(ox, oy, 16, ang - 1.1, ang + 1.1, col, 3, 0, 0.2);
      if (d < 38) {
        if (ally) g.damageEnemy(target, w === 'buster' ? 6 : 3, 20, ang, 130, { melee: true, hitstop: 0.03, shake: 0.15 });
        else g.damagePlayer(1, ang + Math.PI);
      }
      g.sfx?.swing?.(1);
    }
    g.particles?.spark?.(ox, oy, 4, ally ? '#9be7ff' : '#ff6a4a', ang, 0.7, 160);
    g.shake?.(0.08);
    if ('recoil' in a) a.recoil = 1;
  }
  draw(g: G, ctx: Ctx) {
    if (this.bot) this.drawAgent(g, ctx, this.bot, '#9be7ff', 'BOT');
    const e = this.findMirror(g);
    if (e) this.drawEnemyWeapon(g, e, ctx);
  }
  drawAgent(g: G, ctx: Ctx, a: Agent, color: string, label: string) {
    const opts: any = {
      x: a.x, y: a.y, c: color, c2: '#17384a', scale: 1, facing: a.facing,
      aim: a.aim, look: a.aim, walk: a.walk, moving: a.moving,
      pose: a.moving ? 'run' : 'shoot', t: 0.5, acc: 'band', weapon: 'none',
      flash: false, alpha: 0.96, outline: '#000000', eyes: '#111111', time: g.time,
      lean: { x: Math.cos(a.aim), y: Math.sin(a.aim) }, run: a.moving ? 0.45 : 0,
      recoil: a.recoil, stride: 3, vel: a.moving ? { x: Math.cos(a.aim), y: Math.sin(a.aim) } : undefined,
    };
    drawStick(ctx, opts);
    this.weaponSprite(g, ctx, opts, a.weapon, a.aim, a.facing, a.recoil);
    prect(ctx, Math.round(a.x - 12), Math.round(a.y - 34), 24, 7, '#000000aa');
    pfontO(ctx, label, a.x, a.y - 33, color, '#000', 1, 'center');
  }
  drawEnemyWeapon(g: G, e: E, ctx: Ctx) {
    const opts: any = {
      x: e.x, y: e.y, c: e.color, c2: e.color2, scale: e.scale, facing: e.facing,
      aim: e.aim, look: e.aim, walk: e.walk, moving: e.moving,
      pose: e.moving ? 'run' : 'shoot', t: 0.5, acc: e.accessory, weapon: 'none',
      flash: false, alpha: 1, outline: '#000000', eyes: '#111111', time: g.time,
      lean: { x: Math.cos(e.aim), y: Math.sin(e.aim) }, run: e.runT ?? 0,
      recoil: e.recoil ?? 0, stride: e.strideHalf ?? 3, z: e.z ?? 0,
    };
    pfontO(ctx, 'MIRROR', e.x, e.y - 32 - (e.z ?? 0), '#ff9d4a', '#000', 1, 'center');
    if (DEFAULT_DRAWN.has(e.weapon)) return; // drawStick sudah menggambar senjata ini
    this.weaponSprite(g, ctx, opts, e.weapon, e.aim, e.facing, e.recoil ?? 0);
  }
  weaponSprite(g: G, ctx: Ctx, opts: any, w: string, aim: number, facing: number, recoil: number) {
    const sk = solvePose(opts);
    const hand = { x: opts.x + sk.fhand.x, y: opts.y + sk.fhand.y - (opts.z ?? 0) };
    const off = { x: opts.x + sk.bhand.x, y: opts.y + sk.bhand.y - (opts.z ?? 0) };
    const a = aim - facing * recoil * 0.18;
    if (w === 'pistol') drawPistol(ctx, hand, a, 1, { recoil, time: g.time });
    else if (w === 'rifle') drawRifle(ctx, hand, a, 1, { recoil, time: g.time });
    else if (w === 'shotgun') drawShotgun(ctx, hand, a, facing, recoil, null, 0);
    else if (w === 'bow') drawBow(ctx, hand, off, aim, 0, 0, g.time, true, 0, 0);
    else if (w === 'buster') drawBusterSword(ctx, hand, a, 0, recoil > 0.3 ? '#7dffc8' : null, 0, g.time);
    else if (w === 'bat' || w === 'nunchaku') drawBat(ctx, hand, a, 0, recoil > 0.3 ? '#ffd27f' : null);
    else if (w === 'katana' || w === 'axe' || w === 'dual' || w === 'takamura' || w === 'hayabusa') drawShortBlade(ctx, hand, a, 0);
    else if (w === 'yoyo') { pcircle(ctx, hand.x + Math.cos(a) * 5, hand.y + Math.sin(a) * 3, 3, '#ff4fa3'); }
    else if (w === 'boxing') { pcircle(ctx, hand.x + Math.cos(a) * 3, hand.y, 2, '#ff4d4d'); pcircle(ctx, off.x + Math.cos(a) * 2, off.y, 2, '#ff4d4d'); }
  }
}
