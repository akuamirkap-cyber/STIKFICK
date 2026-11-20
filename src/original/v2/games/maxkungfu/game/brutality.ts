import { pcircle, pfontO, pline, prect, pring, px, type Ctx } from './pixel';
import { drawBat } from './weapons';
import { clamp, rnd } from './rng';
import { solvePose } from './stick';
import { VIEW_H, VIEW_W } from './constants';

/**
 * BRUTALITY (tombol B) — adegan serangan TITIK LEMAH ala Mortal Kombat.
 *  1. Musuh yang goyah / sekarat dikunci: waktu melambat, kamera mendekat, reticle merah menyempit di titik lemahnya.
 *  2. Pukulan / tendangan — atau AYUNAN senjata (Guan Dao, katana, baseball) — menghantam titik itu.
 *  3. Layar X-RAY: tulang di titik lemah itu retak & patah, dengan getaran dan kilatan.
 *  4. Lepas: musuh terpental / terpenggal / tersungkur (bos hanya kehilangan sebagian nyawa).
 * Titik lemah: RAHANG, LEHER, TULANG IGA, LUTUT. Shift+B = ganti mode darah (dulu tombol B).
 */
type G = any;
type E = any;
export type Pt = 'head' | 'neck' | 'ribs' | 'knee';
type Wk = 'fist' | 'guandao' | 'katana' | 'bat';
const NAME: Record<Pt, string> = { head: 'RAHANG', neck: 'LEHER', ribs: 'TULANG IGA', knee: 'LUTUT' };
const SUB: Record<Pt, string> = { head: 'RAHANG HANCUR', neck: 'RUAS LEHER PATAH', ribs: 'IGA REMUK', knee: 'LUTUT PATAH' };
const WY: Record<Pt, number> = { head: -11, neck: -8.2, ribs: -6, knee: -2 };
const T_WIND = 0.72, T_XRAY = 1.0, T_AFTER = 0.62, T_SWING = 0.15;
const RED = '#ff3b3b';
const ease = (k: number) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const easeOut = (k: number) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);

export class Brutality {
  active = false;
  hit = false;
  released = false;
  t = 0; hitT = 0; relT = 0;
  pt: Pt = 'head';
  wk: Wk = 'fist';
  lying = false;
  id = -1;
  dir = 0;
  cd = 0;
  private lastPt: Pt | '' = '';
  hintId = -1; private hintPt: Pt = 'head';

  reset() { this.active = false; this.hit = false; this.released = false; this.hintId = -1; }

  private eligible(e: E) {
    if (e.dead || e.spawnT > 0) return false;
    if (e.stagger > 0) return true;
    if (e.boss || e.jack || e.kind === 'duelist' || e.ai2 || e.sm) return (e.vulnerableT ?? 0) > 0;
    return e.down > 0 || e.stun > 0 || e.hp <= e.maxHp * 0.4;
  }
  private weapon(g: G): Wk {
    const w = g.player.weapon;
    return w === 'guandao' ? 'guandao' : w === 'katana' || w === 'takamura' ? 'katana' : w === 'bat' ? 'bat' : 'fist';
  }
  private choose(e: E, wk: Wk): Pt {
    if (e.down > 0) return 'ribs';
    const pool: Pt[] = wk === 'fist' ? ['head', 'ribs', 'knee', 'neck'] : ['neck', 'ribs', 'knee'];
    const f = pool.filter((x) => x !== this.lastPt);
    return f[Math.floor(Math.random() * f.length)];
  }
  /** posisi titik lemah di dunia */
  private wp(e: E, lying = false, pt: Pt = this.pt) {
    const sc = e.scale ?? 1;
    return { x: e.x, y: e.y - (e.z ?? 0) + (lying ? -1.4 : WY[pt] * sc) };
  }

  /** dipanggil tiap frame di luar adegan: cooldown + petunjuk "B" pada sasaran yang bisa di-brutality */
  updateHint(g: G, dt: number) {
    if (this.cd > 0) this.cd -= dt;
    const p = g.player;
    if (g.state !== 'playing' || p.fatality || this.active) { this.hintId = -1; return; }
    const ft = g.fatalityTarget?.();
    if (!ft || ft.far || !this.eligible(ft.e)) { this.hintId = -1; return; }
    if (this.hintId !== ft.e.id) { this.hintId = ft.e.id; this.hintPt = this.choose(ft.e, this.weapon(g)); }
  }

  try(g: G) {
    const p = g.player;
    if (g.state !== 'playing' || p.fatality || p.stunT > 0 || g.silat || g.carry?.carrying || g.grab?.holding || this.active) return;
    const ft = g.fatalityTarget?.();
    if (!ft || ft.far) { g.texts?.add?.(p.x, p.y - 22, 'DEKATI MUSUH', '#777', 1, 0.5); g.sfx?.empty?.(); return; }
    const e = ft.e;
    if (!this.eligible(e)) { g.texts?.add?.(p.x, p.y - 22, 'TITIK LEMAH TERTUTUP - BUAT GOYAH / LEMAHKAN', '#9a9a9a', 1, 0.8); g.sfx?.empty?.(); return; }
    const perfect = e.stagger > 0;
    if (!perfect && this.cd > 0) { g.texts?.add?.(p.x, p.y - 22, `BRUTALITY ${this.cd.toFixed(1)}S`, '#777', 1, 0.5); g.sfx?.empty?.(); return; }
    this.start(g, e, perfect);
  }

  private start(g: G, e: E, perfect: boolean) {
    const p = g.player;
    this.wk = this.weapon(g);
    this.lying = e.down > 0;
    this.pt = this.hintId === e.id ? this.hintPt : this.choose(e, this.wk);
    this.lastPt = this.pt;
    this.dir = Math.atan2(e.y - p.y, e.x - p.x);
    this.id = e.id; this.t = 0; this.hit = false; this.released = false; this.hitT = 0; this.relT = 0;
    if (!perfect) this.cd = 6;
    const a = this.dir;
    const gap = this.wk === 'fist' ? e.r + p.r + (this.pt === 'knee' ? 8 : 4) : e.r + p.r + 17;
    const nx = e.x - Math.cos(a) * gap, ny = e.y - Math.sin(a) * gap;
    if (g.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; }
    const F = { kind: 'brutal', id: e.id, t: 0, step: 0, stepT: 0, sx: p.x, sy: p.y, tx: e.x, ty: e.y, dir: a, hit: false, hitT: 0, perfect };
    p.fatality = F;
    p.attackPhase = 'none'; p.buffered = null; p.dashT = 0; p.parryT = 0; p.focusDash = null; p.z = 0; p.runT = 0; p.running = false;
    p.aim = a; p.attackAim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1; p.vx = p.vy = p.kx = p.ky = 0; p.moving = false;
    p.holdPose = 'crouch'; p.holdPoseT = 0; p.iframes = 8;
    this.freeze(e);
    e.stun = 0; e.fuse = -1; e.flinch = 0; e.tele = null; g.releaseToken?.(e);
    for (const o of g.enemies) if (o !== e && !o.dead) o.attackCd = Math.max(o.attackCd, 2.0);
    g.cinematic = true; g.brutCamera?.(1.6);
    g.camFocus = { x: (p.x + e.x) / 2, y: (p.y + e.y) / 2 };
    g.slowFactor = 0.32; g.slowT = 0.2;
    this.active = true; this.hintId = -1;
    g.sfx?.announce?.(); g.sfx?.leverClack?.();
    g.say?.(`TITIK LEMAH: ${NAME[this.pt]}`, RED, 2, 1.0);
  }

  private freeze(e: E) {
    e.kx = e.ky = 0; e.vx = e.vy = 0; e.z = 0; e.vz = 0;
    if (this.lying) { e.down = 10; e.state = 'down'; e.pose = 'down'; e.stagger = 0; }
    else { e.stagger = 10; e.state = 'stagger'; e.pose = 'stagger'; e.down = 0; }
    e.stun = 0;
  }

  // ------------------------------------------------------------------ adegan
  step(g: G, raw: number, F: any, e: E | null) {
    const p = g.player;
    F.t += raw; this.t = F.t;
    g.slowT = Math.max(g.slowT, 0.2);
    if (!this.hit && (!e || e.dead)) { this.finish(g); return; }
    const tgt = e ? this.wp(e, this.lying) : { x: F.tx, y: F.ty };
    if (e && !this.released) { this.freeze(e); F.tx = e.x; F.ty = e.y; }
    p.iframes = Math.max(p.iframes, 3);
    const swing = this.wk !== 'fist';

    if (!this.hit) {
      // ---- KUNCI + ANCANG-ANCANG
      g.slowFactor = 0.3;
      g.brutCamera?.(1.5 + 0.85 * easeOut(F.t / T_WIND));
      g.camFocus = { x: p.x + (tgt.x - p.x) * 0.62, y: p.y + (tgt.y - p.y) * 0.62 };
      if (swing) {
        const s = clamp((F.t - (T_WIND - T_SWING)) / T_SWING, 0, 1);
        p.holdPose = 'a_swing1'; p.holdPoseT = s > 0 ? 0.3 + 0.3 * s : 0.05 + 0.22 * ease(F.t / (T_WIND - T_SWING));
        const ang = this.swingAngle(F.t);
        p.bladeA = ang.th; p.bladePrevA = ang.th;
        if (s > 0) this.swingFx(g, p, ang);
      } else {
        p.holdPose = 'crouch'; p.holdPoseT = Math.min(1, F.t / 0.55);
      }
      if (Math.random() < 0.7) {
        const a = rnd(0, 6.3), r = rnd(10, 22);
        g.particles?.add?.({ x: tgt.x + Math.cos(a) * r, y: tgt.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * 80, vy: -Math.sin(a) * 56, life: 0.22, c: Math.random() < 0.5 ? RED : '#ffffff', k: 0, s: 1 });
      }
      if (F.t >= T_WIND) this.doHit(g, e, F, tgt);
      return;
    }
    // ---- DAMPAK + X-RAY (dunia nyaris berhenti)
    const since = F.t - this.hitT;
    if (!this.released) {
      g.slowFactor = 0.05;
      g.brutCamera?.(2.45);
      g.camFocus = { x: p.x + (tgt.x - p.x) * 0.7, y: p.y + (tgt.y - p.y) * 0.7 };
      this.poseStrike(p);
      if (since >= T_XRAY) this.release(g, e, F, tgt);
      return;
    }
    // ---- AKIBAT
    const after = F.t - this.relT;
    g.slowFactor = 0.4;
    g.brutCamera?.(1.7);
    g.camFocus = { x: (p.x + F.tx) / 2, y: (p.y + F.ty) / 2 };
    if (after > 0.2) { p.holdPose = 'flex'; p.holdPoseT = 0; }
    if (swing) { const a = this.swingAngle(T_WIND + 1); p.bladeA = a.th; }
    if (after >= T_AFTER) this.finish(g);
  }

  private finish(g: G) {
    this.active = false; this.hit = false; this.released = false;
    g.endFatality?.();
  }

  /** sudut ayunan (azimut th, elevasi ph) pada waktu t adegan */
  private swingAngle(t: number) {
    const f = Math.cos(this.dir) >= 0 ? 1 : -1;
    const u = ease(t / (T_WIND - T_SWING));
    const raise = 2.35 + 0.3 * u;
    const s = easeOut((t - (T_WIND - T_SWING)) / T_SWING);
    const low = this.pt === 'knee' ? -0.5 : this.pt === 'neck' ? -0.05 : -0.2;
    const th = this.dir + f * (raise - 3.6 * s);
    const ph = (0.95 + 0.4 * u) * (1 - s) + low * s;
    return { th, ph, s };
  }

  private swingHand(g: G, pose: string, t: number) {
    const p = g.player;
    const sk = solvePose(g.playerStickOpts(pose, t));
    return { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
  }

  private swingFx(g: G, p: any, ang: { th: number; ph: number; s: number }) {
    const hand = this.swingHand(g, p.holdPose, p.holdPoseT);
    const f = Math.cos(this.dir) >= 0 ? 1 : -1;
    if (this.wk === 'guandao' && g.gd) {
      const { ux, uy } = this.vec(ang.th, ang.ph);
      const xs: number[] = [], ys: number[] = [];
      for (let k = 0; k < 11; k++) { const d = 9 + (k / 10) * 20; xs.push(hand.x + ux * d); ys.push(hand.y + uy * d); }
      g.gd.trail.push({ xs, ys, t: 0.3, col: '#ffffff', w: 1.3 });
    } else if (ang.s > 0.05 && g.katana?.addArc) {
      g.katana.addArc(hand.x, hand.y, 22, ang.th - 0.5 * f, ang.th + 0.4 * f, this.wk === 'bat' ? '#ffd27f' : '#ffffff', 0, 0.2);
    }
  }
  private vec(th: number, ph: number) {
    let ux = Math.cos(th) * Math.cos(ph), uy = 0.7 * Math.sin(th) * Math.cos(ph) - Math.sin(ph);
    const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l;
    return { ux, uy };
  }

  private poseStrike(p: any) {
    if (this.wk !== 'fist') {
      p.holdPose = 'a_swing1'; p.holdPoseT = 0.6;
      p.bladeA = this.swingAngle(T_WIND + 1).th;
      return;
    }
    const poses: Record<Pt, [string, number]> = { head: ['uppercut', 0.55], ribs: [this.lying ? 'hammer' : 'k_ironpalm', 0.5], knee: ['sidekick', 0.5], neck: ['hook', 0.5] };
    const [pose, t] = poses[this.pt];
    p.holdPose = pose; p.holdPoseT = t;
  }

  private doHit(g: G, e: E | null, F: any, tgt: { x: number; y: number }) {
    const p = g.player;
    this.hit = true; this.hitT = F.t; F.hit = true; F.hitT = F.t;
    const dir = this.dir, cd = Math.cos(dir);
    g.hitstop = Math.max(g.hitstop ?? 0, 0.22); g.flash?.('#ffffff', 0.6); g.shake?.(1); g.zoomKick = 0.14;
    g.sfx?.fatality?.(); g.sfx?.heavy?.(); g.sfx?.slam?.();
    window.setTimeout(() => { g.sfx?.kick?.(); }, 90);
    window.setTimeout(() => { g.sfx?.land?.(); g.sfx?.punch?.(); }, 190);
    g.particles?.impact?.(tgt.x, tgt.y, 14, '#ffffff');
    g.particles?.spark?.(tgt.x, tgt.y, 22, '#ffffff', dir, 1.4, 300);
    g.particles?.shockwave?.(tgt.x, tgt.y, 30, RED, 0.3);
    g.particles?.ring?.(tgt.x, tgt.y, 3, 22, '#ffffff', 0.25, 2);
    g.blood?.arterial?.(tgt.x - cd * 2, tgt.y, dir, 1.0);
    if (e) e.flash = 0.3;
    g.addAfterimage?.({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: p.holdPose, poseT: p.holdPoseT }, '#ff5a5a', p.lean);
  }

  /** akhir X-ray: efek akhir pada musuh */
  private release(g: G, e: E | null, F: any, tgt: { x: number; y: number }) {
    const p = g.player;
    this.released = true; this.relT = F.t;
    const dir = this.dir, cd = Math.cos(dir), sd = Math.sin(dir);
    g.flash?.('#ffffff', 0.5); g.shake?.(1); g.zoomKick = 0.12; g.slow?.(0.5, 0.3);
    g.sfx?.kill?.(); g.sfx?.explosion?.();
    g.say?.('BRUTALITY!', RED, 3, 1.4);
    if (!e || e.dead) return;
    const col = e.color;
    g.particles?.shockwave?.(tgt.x, tgt.y, 40, '#ffffff', 0.35);
    g.blood?.fountain?.(e.x, e.y - 6, 16); g.blood?.mist?.(tgt.x, tgt.y, dir, 8);
    switch (this.pt) {
      case 'head':
        g.particles?.head?.(e.x, e.y - 10, cd * 40 + rnd(-25, 25), sd * 40, 320, col);
        g.particles?.blood?.(tgt.x, tgt.y, 30, dir, 240);
        for (let i = 0; i < 6; i++) g.particles?.spark?.(tgt.x, tgt.y, 1, '#ffffff', dir + rnd(-1.4, 1.4), 1, 220);
        break;
      case 'neck':
        g.particles?.head?.(e.x, e.y - 10, cd * 60 + rnd(-30, 30), sd * 60 - 10, 360, col);
        g.blood?.fountain?.(e.x, e.y - 7, 24); g.blood?.arterial?.(tgt.x, tgt.y, -Math.PI / 2, 1.4);
        g.particles?.blood?.(tgt.x, tgt.y, 28, -Math.PI / 2, 220);
        break;
      case 'ribs':
        g.particles?.blood?.(tgt.x, tgt.y, 40, dir, 260);
        for (let i = 0; i < 6; i++) g.particles?.limb?.(tgt.x, tgt.y, dir + rnd(-1.2, 1.2), rnd(140, 280), i % 2 ? '#ffffff' : col, 3);
        g.blood?.spray?.(tgt.x, tgt.y, dir, 5, true);
        break;
      case 'knee':
        for (let i = 0; i < 4; i++) g.particles?.limb?.(e.x, e.y - 2, dir + rnd(-1, 1), rnd(120, 240), i % 2 ? '#ffffff' : col, 4);
        g.particles?.blood?.(e.x, e.y - 2, 24, dir, 200);
        break;
    }
    p.focus = Math.min(300, p.focus + 60 * (g.stats?.focusGain ?? 1));
    g.addOfa?.(12);
    g.heal?.(1);
    if (e.boss || e.kind === 'duelist' || e.ai2 || e.sm || e.jack) {
      const pct = F.perfect ? 0.2 : Math.max(0.05, 0.1 * Math.pow(0.72, e.fatalCount ?? 0));
      e.fatalCount = (e.fatalCount ?? 0) + 1;
      const dmg = e.maxHp * pct * (g.ageDmg?.() ?? 1);
      e.stagger = 0; e.structure = 0; e.down = 0;
      g.damageEnemy?.(e, dmg, 0, dir, 520, { knockdown: true, hitstop: 0.1, shake: 0.9, melee: false, launch: this.pt === 'head' ? 200 : 90 });
      g.texts?.add?.(e.x, e.y - 30, F.perfect ? 'DEVASTATING!' : `-${Math.round(pct * 100)}%`, '#ffd700', 1, 1.2);
      g.splat?.(e.x, e.y, 20);
    } else {
      e.stagger = 0; e.down = 0;
      g.score += 150;
      g.killEnemy?.(e, dir, this.pt === 'ribs' ? 780 : this.pt === 'head' ? 620 : this.pt === 'knee' ? 300 : 420, false, true, true);
      g.splat?.(e.x, e.y, 18);
      g.texts?.add?.(e.x, e.y - 30, SUB[this.pt], RED, 1, 1.2);
    }
  }

  // ------------------------------------------------------------------ gambar dunia
  drawWorld(ctx: Ctx, g: G) {
    const p = g.player;
    if (!this.active) {
      // petunjuk: reticle kecil di titik lemah + tombol B
      if (this.hintId < 0 || g.state !== 'playing') return;
      const e = g.enemies.find((q: E) => q.id === this.hintId);
      if (!e || e.dead) return;
      const w = this.wp(e, e.down > 0, this.hintPt);
      const pulse = 0.55 + 0.45 * Math.sin(g.time * 9);
      ctx.globalAlpha = 0.5 + 0.5 * pulse;
      pring(ctx, w.x, w.y, 3.5 + pulse, RED, 1);
      px(ctx, w.x, w.y, '#ffffff');
      ctx.globalAlpha = 1;
      const lx = Math.round(e.x + 11), ly = Math.round(e.y - 20 * (e.scale ?? 1) - (e.z ?? 0));
      prect(ctx, lx - 3, ly - 2, 7, 9, '#000000cc');
      pfontO(ctx, 'B', lx, ly, RED, '#000', 1, 'center');
      return;
    }
    const e = g.enemies.find((q: E) => q.id === this.id);
    const F = p.fatality;
    if (e && !e.dead && !this.released) {
      const w = this.wp(e, this.lying);
      const u = this.hit ? 1 : clamp(this.t / T_WIND, 0, 1);
      const r = this.hit ? 5 : 24 * (1 - easeOut(u)) + 4;
      const al = 0.6 + 0.4 * Math.sin(g.time * 28);
      ctx.globalAlpha = 0.28 * al; pcircle(ctx, w.x, w.y, 7, RED);
      ctx.globalAlpha = al; pring(ctx, w.x, w.y, r, RED, 1); pring(ctx, w.x, w.y, r + 2, '#ffffff', 1);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) pline(ctx, w.x + dx * (r + 3), w.y + dy * (r + 3), w.x + dx * (r - 1), w.y + dy * (r - 1), RED, 1);
      px(ctx, w.x, w.y, '#ffffff');
      ctx.globalAlpha = 1;
      if (!this.hit) pfontO(ctx, `TITIK LEMAH: ${NAME[this.pt]}`, e.x, e.y - 26 * (e.scale ?? 1), RED, '#000', 1, 'center');
    }
    // senjata ayun (gambar sendiri karena pemain disembunyikan saat adegan)
    if (!F || this.wk === 'fist' || this.wk === 'katana') return;
    const t = this.hit ? T_WIND + 1 : this.t;
    const ang = this.swingAngle(t);
    const hand = this.swingHand(g, p.holdPose, p.holdPoseT);
    const glow = ang.s > 0.4 || this.hit ? '#ffffff' : null;
    if (this.wk === 'guandao' && g.gd) {
      const { ux, uy } = this.vec(ang.th, ang.ph);
      g.gd.drawSprite(ctx, hand.x, hand.y, ux, uy, 1, 1, glow);
    } else if (this.wk === 'bat') {
      drawBat(ctx, hand, ang.th, Math.max(0, ang.ph) * 0.7, glow);
    }
  }

  // ------------------------------------------------------------------ gambar layar (HUD buffer 480x270)
  drawScreen(ctx: Ctx, g: G) {
    void g;
    if (!this.active) return;
    const t = this.t;
    // pewarnaan adegan: redup + tepi merah pekat
    const dark = this.hit ? 0.2 : 0.18 * clamp(t / 0.3, 0, 1);
    ctx.globalAlpha = dark; prect(ctx, 0, 0, VIEW_W, VIEW_H, '#10040a'); ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.12 * clamp(t / 0.4, 0, 1);
      prect(ctx, 0, i * 3, VIEW_W, 3, '#6a0010'); prect(ctx, 0, VIEW_H - (i + 1) * 3, VIEW_W, 3, '#6a0010');
      prect(ctx, i * 3, 0, 3, VIEW_H, '#6a0010'); prect(ctx, VIEW_W - (i + 1) * 3, 0, 3, VIEW_H, '#6a0010');
    }
    ctx.globalAlpha = 1;
    if (!this.hit || this.released) return;
    const xt = t - this.hitT - 0.03;
    if (xt < 0) return;
    const fade = clamp((T_XRAY - 0.03 - xt) / 0.14, 0, 1) * clamp(xt / 0.08, 0, 1);
    ctx.globalAlpha = 0.72 * fade; prect(ctx, 0, 0, VIEW_W, VIEW_H, '#000'); ctx.globalAlpha = 1;
    if (fade <= 0.01) return;
    drawXray(ctx, this.pt, xt, fade);
  }
}

// ============================================================================ X-RAY
function bone(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w = 3) {
  pline(ctx, x0, y0, x1, y1, '#04101e', w + 2);
  pline(ctx, x0, y0, x1, y1, '#cfe3ff', w);
  pline(ctx, x0 - 1, y0, x1 - 1, y1, '#ffffff', 1);
}
function knob(ctx: Ctx, x: number, y: number, r: number) {
  pcircle(ctx, x, y, r + 1, '#04101e'); pcircle(ctx, x, y, r, '#cfe3ff'); px(ctx, x - 1, y - 1, '#ffffff');
}
function crack(ctx: Ctx, pts: [number, number][], prog: number, w = 1) {
  const n = Math.floor((pts.length - 1) * prog);
  for (let i = 0; i < n; i++) pline(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#04101e', w + 2);
  for (let i = 0; i < n; i++) pline(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], RED, w);
}
function rot(x: number, y: number, cx: number, cy: number, a: number): [number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

function drawXray(ctx: Ctx, pt: Pt, t: number, fade: number) {
  const imp = 0.22;
  const u = ease((t - imp) / 0.5);
  const shake = t > imp && t < imp + 0.3 ? (1 - (t - imp) / 0.3) * 3 : 0;
  const cx = Math.round(VIEW_W / 2 + rnd(-1, 1) * shake), cy = Math.round(VIEW_H / 2 + rnd(-1, 1) * shake) - 4;
  const K = 10, X = (x: number) => cx + x * K, Y = (y: number) => cy + 62 + y * K;
  const pw = 150, ph = 186, px0 = cx - pw / 2, py0 = cy - ph / 2 + 4;
  ctx.globalAlpha = fade;
  prect(ctx, px0 - 3, py0 - 3, pw + 6, ph + 6, '#02060d');
  prect(ctx, px0, py0, pw, ph, '#071a33');
  for (let y = 0; y < ph; y += 3) { ctx.globalAlpha = 0.16 * fade; prect(ctx, px0, py0 + y, pw, 1, '#2a6ab0'); }
  ctx.globalAlpha = fade;
  for (let gx = 0; gx < pw; gx += 15) for (let gy = 0; gy < ph; gy += 15) px(ctx, px0 + gx, py0 + gy, '#16406e');
  const flick = Math.floor(t * 18) % 2;
  const bc = t > imp ? (flick ? RED : '#ff9a9a') : '#4aa8ff';
  prect(ctx, px0 - 3, py0 - 3, pw + 6, 2, bc); prect(ctx, px0 - 3, py0 + ph + 1, pw + 6, 2, bc);
  prect(ctx, px0 - 3, py0 - 3, 2, ph + 6, bc); prect(ctx, px0 + pw + 1, py0 - 3, 2, ph + 6, bc);
  pfontO(ctx, 'X-RAY', px0 + 4, py0 + 4, '#7fc4ff', '#000', 1, 'left');
  const hit = pt;
  // tulang belakang & panggul
  let neckOff: [number, number] = [0, 0];
  if (hit === 'neck') neckOff = [u * 1.9, -u * 1.3];
  for (let i = 0; i < 5; i++) {
    const y = -8.1 + i * 0.85;
    const broken = hit === 'neck' && i === 0;
    knob(ctx, X(broken ? 0.3 * u : 0), Y(y + (broken ? 0.4 * u : 0)), 2);
  }
  bone(ctx, X(-1.5), Y(-4.1), X(1.5), Y(-4.1), 3);
  // bahu & lengan
  bone(ctx, X(-1.8), Y(-7.5), X(1.8), Y(-7.5), 2);
  for (const sd of [-1, 1]) {
    bone(ctx, X(sd * 1.8), Y(-7.5), X(sd * 3.3), Y(-5.6), 2); knob(ctx, X(sd * 3.3), Y(-5.6), 1.5);
    bone(ctx, X(sd * 3.3), Y(-5.6), X(sd * 3.9), Y(-3.4), 2);
  }
  // tulang rusuk
  for (let i = 0; i < 4; i++) {
    const y = -7.1 + i * 0.62;
    for (const sd of [-1, 1]) {
      const arc: [number, number][] = ([[0.15, 0], [1.0, 0.1], [1.65, 0.5], [1.75, 1.0], [1.35, 1.5]] as [number, number][]).map(([a, b]) => [sd * a, y + b * 0.8] as [number, number]);
      const smash = hit === 'ribs' && i >= 1 && i <= 2 && sd === 1;
      if (smash) {
        const shift = u * 1.2;
        bone(ctx, X(arc[0][0]), Y(arc[0][1]), X(arc[1][0]), Y(arc[1][1]), 2);
        bone(ctx, X(arc[1][0] - shift), Y(arc[1][1] + shift * 0.7), X(arc[2][0] - shift * 1.4), Y(arc[2][1] + shift * 1.1), 2);
        bone(ctx, X(arc[2][0] - shift * 1.1), Y(arc[2][1] + shift * 1.8), X(arc[3][0] - shift * 0.4), Y(arc[3][1] + shift * 2.4), 2);
      } else {
        for (let k = 0; k < arc.length - 1; k++) bone(ctx, X(arc[k][0]), Y(arc[k][1]), X(arc[k + 1][0]), Y(arc[k + 1][1]), 2);
      }
    }
  }
  // kaki
  for (const sd of [-1, 1]) {
    const hx = X(sd * 0.7), hy = Y(-4), kx = X(sd * 1.3), ky = Y(-2.0), fx = X(sd * 2.1), fy = Y(0);
    bone(ctx, hx, hy, kx, ky, 3);
    if (hit === 'knee' && sd === 1) {
      const a = u * 1.15;
      const [rx, ry] = rot(fx, fy, kx, ky, a);
      bone(ctx, kx, ky, rx, ry, 3);
      knob(ctx, kx, ky, 3);
      if (u > 0.2) pline(ctx, kx - 2, ky - 2, kx + 4, ky + 4, '#ffffff', 2);
    } else {
      knob(ctx, kx, ky, 2.5);
      bone(ctx, kx, ky, fx, fy, 3);
    }
    bone(ctx, fx - 3, fy, fx + 4, fy, 2);
  }
  // tengkorak
  const hxC = X(0) + neckOff[0] * K * 0.4, hyC = Y(-11.2) + neckOff[1] * K * 0.4;
  const tilt = hit === 'neck' ? u * 0.5 : 0;
  const R = 21;
  const jawDx = hit === 'head' ? u * 14 : 0, jawDy = hit === 'head' ? u * 9 : 0, jawA = hit === 'head' ? u * 0.55 : 0;
  pcircle(ctx, hxC, hyC, R + 1, '#04101e'); pcircle(ctx, hxC, hyC, R, '#cfe3ff');
  pcircle(ctx, hxC - 6, hyC - 7, 6, '#eef6ff');
  const eye = (sx: number) => { const [ex, ey] = rot(hxC + sx * 9, hyC - 1, hxC, hyC, tilt); pcircle(ctx, ex, ey, 6, '#04101e'); px(ctx, ex, ey, RED); };
  eye(-1); eye(1);
  const [nx0, ny0] = rot(hxC, hyC + 6, hxC, hyC, tilt);
  pline(ctx, nx0 - 2, ny0 + 4, nx0, ny0, '#04101e', 2); pline(ctx, nx0 + 2, ny0 + 4, nx0, ny0, '#04101e', 2);
  const jawPts: [number, number][] = [[-12, 13], [12, 13], [10, 24], [-10, 24]];
  const jp = jawPts.map(([x, y]) => rot(hxC + x + jawDx, hyC + y + jawDy, hxC + jawDx, hyC + 13 + jawDy, jawA));
  for (let i = 0; i < 4; i++) pline(ctx, jp[i][0], jp[i][1], jp[(i + 1) % 4][0], jp[(i + 1) % 4][1], '#04101e', 4);
  for (let i = 0; i < 4; i++) pline(ctx, jp[i][0], jp[i][1], jp[(i + 1) % 4][0], jp[(i + 1) % 4][1], '#cfe3ff', 2);
  for (let k = -3; k <= 3; k++) { const [tx, ty] = rot(hxC + k * 3.2 + jawDx, hyC + 17 + jawDy, hxC + jawDx, hyC + 13 + jawDy, jawA); prect(ctx, tx - 1, ty - 1, 2, 4, '#ffffff'); }
  // retakan + serpihan
  if (t > imp) {
    const p1 = clamp((t - imp) / 0.35, 0, 1);
    if (hit === 'head') {
      crack(ctx, [[hxC + 8, hyC + 12], [hxC + 4, hyC + 4], [hxC + 9, hyC - 3], [hxC + 3, hyC - 11], [hxC + 6, hyC - 19]], p1, 1);
      crack(ctx, [[hxC + 4, hyC + 4], [hxC - 3, hyC + 1], [hxC - 8, hyC - 6]], p1, 1);
      for (let i = 0; i < 6; i++) { const a = 0.4 + i * 0.5, d = 4 + u * (22 + i * 4); prect(ctx, hxC + 10 + Math.cos(a) * d, hyC + 14 + Math.sin(a) * d + u * u * 18, 2, 3, '#ffffff'); }
    }
    if (hit === 'neck') {
      crack(ctx, [[X(-1.2), Y(-8.2)], [X(-0.3), Y(-8.0)], [X(0.4), Y(-8.3)], [X(1.2), Y(-8.0)]], p1, 2);
      for (let i = 0; i < 5; i++) { const a = -2.8 + i * 0.7, d = 3 + u * (14 + i * 3); prect(ctx, X(0) + Math.cos(a) * d, Y(-8.2) + Math.sin(a) * d + u * u * 10, 2, 3, i % 2 ? '#ffffff' : RED); }
    }
    if (hit === 'ribs') {
      crack(ctx, [[X(0.8), Y(-6.9)], [X(1.4), Y(-6.2)], [X(0.9), Y(-5.8)], [X(1.5), Y(-5.2)]], p1, 2);
      for (let i = 0; i < 10; i++) { const a = -0.6 + i * 0.5, d = 4 + u * (12 + i * 2); prect(ctx, X(1.2) + Math.cos(a) * d, Y(-6) + Math.sin(a) * d * 0.8 + u * u * 8, 2, 2, i % 3 ? '#ffffff' : RED); }
    }
    if (hit === 'knee') {
      crack(ctx, [[X(1.0), Y(-2.2)], [X(1.4), Y(-1.9)], [X(1.2), Y(-1.6)], [X(1.7), Y(-1.4)]], p1, 2);
      for (let i = 0; i < 6; i++) { const a = -1.2 + i * 0.5, d = 3 + u * (10 + i * 3); prect(ctx, X(1.4) + Math.cos(a) * d, Y(-2) + Math.sin(a) * d + u * u * 8, 2, 3, i % 2 ? '#ffffff' : RED); }
    }
    const bx = hit === 'head' ? hxC : hit === 'neck' ? X(0) : X(hit === 'knee' ? 1.3 : 1.0);
    const by = hit === 'head' ? hyC + 12 : hit === 'neck' ? Y(-8.2) : hit === 'knee' ? Y(-2) : Y(-6);
    for (let i = 0; i < 14; i++) { const a = i * 0.9 + t * 2, d = 6 + ((i * 37) % 28) + u * 18; prect(ctx, bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.8, 1, 2, RED); }
    if (t < imp + 0.07) { ctx.globalAlpha = (1 - (t - imp) / 0.07) * fade; prect(ctx, px0, py0, pw, ph, '#ffffff'); ctx.globalAlpha = fade; }
  }
  ctx.globalAlpha = fade;
  const sh = t > imp && t < imp + 0.4 ? rnd(-1, 1) : 0;
  pfontO(ctx, 'BRUTALITY', cx + sh, py0 - 24, RED, '#000', 2, 'center');
  pfontO(ctx, `TITIK LEMAH: ${NAME[pt]}`, cx, py0 + ph + 6, '#ffffff', '#000', 1, 'center');
  if (t > imp + 0.15) pfontO(ctx, SUB[pt], cx, py0 + ph + 16, '#ffd447', '#000', 1, 'center');
  ctx.globalAlpha = 1;
}
