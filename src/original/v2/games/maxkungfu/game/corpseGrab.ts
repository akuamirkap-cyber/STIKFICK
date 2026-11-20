import { clamp, rnd } from './rng';
import { solidAt } from './level';
import { pcircle, pfontO, pline, pring, type Ctx } from './pixel';

/**
 * TARIK & LEMPAR MAYAT (ala Kung Fu Hustle).
 *  G (dekat bot yang sudah mati) : tarik anggota badan yang ditunjuk kursor —
 *                                  1 tangan / 1 kaki, atau KEDUA tangan / KEDUA kaki bila kursor ada di antaranya.
 *  G lagi        : lepas.
 *  LMB           : LEMPAR secepat peluru ke arah kursor (menghantam bot lain seperti bola bowling).
 *  RMB           : PUSARAN singkat (±0.8 detik, 1.5x putaran) — tubuh jadi senjata kibas, otomatis terlempar di akhir.
 * Titik anggota badan ragdoll dipaku ke genggaman (bobot besar), sisa tubuh terseret/terayun oleh fisika bawaan.
 */
type G = any;
const HEAD = 0, HIP = 2, HAND_F = 3, HAND_B = 4, FOOT_F = 5, FOOT_B = 6;
const NAMES: Record<number, string> = { [HAND_F]: 'TANGAN', [HAND_B]: 'TANGAN', [FOOT_F]: 'KAKI', [FOOT_B]: 'KAKI' };
const REACH = 64;
const SPIN_DUR = 0.8;
const SPIN_TURNS = 1.5;

interface Held {
  c: any; limbs: number[];
  mode: 'hold' | 'spin';
  t: number; spinT: number; th0: number; dir: number;
  from: { x: number; y: number; z: number }[];
  w0: number[];
  hitCd: Map<number, number>;
  gx: number; gy: number; gz: number;
}
interface Flying { c: any; t: number; hitCd: Map<number, number> }
interface Cand { c: any; limbs: number[]; score: number }

export class CorpseGrab {
  held: Held | null = null;
  flying: Flying[] = [];
  throwT = 0;
  time = 0;
  hint = 0;

  get holding() { return this.held !== null; }
  get moveMul() { return !this.held ? 1 : this.held.mode === 'spin' ? 0.35 : 0.8; }
  isHeld(c: any) { return !!this.held && this.held.c === c; }
  keeps(c: any) { return this.isHeld(c) || this.flying.some((f) => f.c === c); }
  poseOverride(): { pose: string; t: number } | null {
    if (this.held) return this.held.mode === 'spin' ? { pose: 'spin', t: clamp(this.held.spinT / SPIN_DUR, 0, 1) * 0.5 } : { pose: 'grab', t: 0.5 };
    if (this.throwT > 0) return { pose: 'throw', t: 1 - this.throwT / 0.22 };
    return null;
  }
  reset() {
    this.release(null);
    this.flying = []; this.throwT = 0;
  }

  /** posisi layar sebuah titik ragdoll */
  private sp(c: any, i: number) { const q = c.rd.pts[i]; return { x: q.x, y: q.y - q.z }; }

  private candidates(g: G): Cand | null {
    const p = g.player;
    const mw = g.mouseWorld();
    let best: Cand | null = null;
    for (const c of g.corpses) {
      const rd = c.rd;
      if (!rd || this.isHeld(c)) continue;
      const singles = [HAND_F, HAND_B, FOOT_F, FOOT_B];
      const opts: { limbs: number[]; x: number; y: number; bias: number }[] = [];
      for (const i of singles) { const s = this.sp(c, i); opts.push({ limbs: [i], x: s.x, y: s.y, bias: 0 }); }
      for (const pair of [[HAND_F, HAND_B], [FOOT_F, FOOT_B]]) {
        const a = this.sp(c, pair[0]), b = this.sp(c, pair[1]);
        opts.push({ limbs: pair, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, bias: 2.2 });
      }
      for (const o of opts) {
        const dPl = Math.hypot(o.x - p.x, o.y + 3 - p.y);
        if (dPl > REACH) continue;
        const dc = Math.hypot(o.x - mw.x, o.y - mw.y);
        if (dc > 20) continue;
        const score = dc + o.bias + dPl * 0.05;
        if (!best || score < best.score) best = { c, limbs: o.limbs, score };
      }
    }
    return best;
  }

  private grabNow(g: G, cand: Cand) {
    const p = g.player, rd = cand.c.rd;
    this.held = {
      c: cand.c, limbs: cand.limbs, mode: 'hold', t: 0, spinT: 0, th0: 0, dir: 1,
      from: cand.limbs.map((i) => ({ x: rd.pts[i].x, y: rd.pts[i].y, z: rd.pts[i].z })),
      w0: cand.limbs.map((i) => rd.pts[i].w), hitCd: new Map(),
      gx: p.x, gy: p.y, gz: 6,
    };
    cand.c.t = 0;
    const pair = cand.limbs.length === 2;
    const nm = NAMES[cand.limbs[0]];
    g.say?.(pair ? `KEDUA ${nm}!` : `TARIK ${nm}`, '#ffd27f', 2, 0.7);
    g.sfx?.pickup?.(); g.sfx?.whoosh?.();
    g.particles?.ring?.(p.x, p.y - 8, 2, 14, '#ffd27f', 0.2, 1);
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    
    g.input.pressed?.delete?.('g');
  }

  private pinTargets(g: G, h: Held, i: number) {
    const p = g.player;
    const n = h.limbs.length;
    const k = n === 1 ? 0 : (i === 0 ? -1 : 1);
    if (g.level?.sideView) {
      if (h.mode === 'spin') {
        const u = clamp(h.spinT / SPIN_DUR, 0, 1);
        const th = h.th0 + h.dir * Math.PI * 2 * SPIN_TURNS * Math.pow(u, 1.7) + k * 0.1;
        const R = 11 + 16 * Math.min(1, u * 4);
        return { x: p.x + Math.cos(th) * R, y: p.y - 6 + Math.sin(th) * R * 0.75, z: 0 };
      }
      const a = p.aim;
      return { x: p.x + Math.cos(a) * 10, y: p.y - 6 + Math.sin(a) * 6 + k * 2.2, z: 0 };
    }
    if (h.mode === 'spin') {
      const u = clamp(h.spinT / SPIN_DUR, 0, 1);
      const th = h.th0 + h.dir * Math.PI * 2 * SPIN_TURNS * Math.pow(u, 1.7) + k * 0.1;
      const R = 11 + 17 * Math.min(1, u * 4);
      return { x: p.x + Math.cos(th) * R, y: p.y + Math.sin(th) * R * 0.75, z: 8 + 5 * Math.sin(u * Math.PI) + k * 1.2 };
    }
    const a = p.aim;
    return { x: p.x + Math.cos(a) * 11 - Math.sin(a) * k * 2.2, y: p.y + Math.sin(a) * 7 + Math.cos(a) * k * 2.2, z: 6 };
  }

  private pin(g: G, c: any, apply: boolean) {
    const h = this.held;
    if (!h || h.c !== c) return;
    const rd = c.rd;
    const b = clamp(h.t / 0.16, 0, 1), e = b * b * (3 - 2 * b);
    const p = g.player;
    h.limbs.forEach((li, i) => {
      const pt = rd.pts[li];
      const tg = this.pinTargets(g, h, i);
      const f = h.from[i];
      let x = f.x + (tg.x - f.x) * e, y = f.y + (tg.y - f.y) * e;
      const z = f.z + (tg.z - f.z) * e;
      // Jika titik genggaman/putaran menabrak tembok, tarik mendekat ke badan pemain agar tidak menancap di tembok
      if (g.level && solidAt(g.level, x, y - 1.5)) {
        for (let k = 0.25; k <= 1.0; k += 0.25) {
          const nx = x + (p.x - x) * k;
          const ny = y + ((p.y - 6) - y) * k;
          if (!solidAt(g.level, nx, ny - 1.5)) { x = nx; y = ny; break; }
        }
      }
      pt.x = x; pt.y = y; pt.z = z; pt.ox = x; pt.oy = y; pt.oz = z;
      pt.vx = 0; pt.vy = 0; pt.vz = 0;
      if (apply) pt.w = 0.0004;
      h.gx = x; h.gy = y; h.gz = z;
    });
    rd.settled = false; rd.restT = 0;
    c.t = 0; c.cd = 0.2;
  }
  pre(g: G, c: any) { this.pin(g, c, true); }
  post(g: G, c: any) { this.pin(g, c, false); }

  private release(g: G | null) {
    const h = this.held;
    if (!h) return;
    h.limbs.forEach((li, i) => { if (h.c.rd) h.c.rd.pts[li].w = h.w0[i]; });
    this.held = null;
    void g;
  }

  private doThrow(g: G, power = 1) {
    const h = this.held!;
    const p = g.player, rd = h.c.rd;
    const mw = g.mouseWorld();
    const tgt = g.nearestEnemy?.(p.x, p.y, 320, p.aim, 0.45) ?? null;
    const a = tgt ? Math.atan2(tgt.y - (p.y - 8), tgt.x - p.x) : Math.atan2(mw.y - (p.y - 8), mw.x - p.x);
    const sp = 860 * power;
    const cx = rd.pts[HIP].x, cy = rd.pts[HIP].y;
    this.release(g);
    // ujung yang dipegang tetap ikut terlempar: seluruh titik dapat momentum
    if (g.level?.sideView) {
      rd.launch(Math.cos(a) * Math.min(440, sp * 0.52), Math.sin(a) * Math.min(220, sp * 0.3), 90 + 45 * power, (Math.cos(a) >= 0 ? 1 : -1) * 7);
    } else {
      rd.launch(Math.cos(a) * sp, Math.sin(a) * sp * 0.92, 95 + 55 * power, (Math.cos(a) >= 0 ? 1 : -1) * 7);
    }
    rd.bounces = 0; rd.hipHops = 0;
    h.c.t = 0; h.c.cd = 0;
    this.flying.push({ c: h.c, t: 0, hitCd: new Map() });
    this.throwT = 0.22;
    p.attackPhase = 'none';
    g.sfx?.shot?.('rifle'); g.sfx?.whoosh?.();
    g.say?.('LEMPAR!', '#9be7ff', 2, 0.5);
    g.flash?.('#ffffff', 0.05); g.shake?.(0.15);
    g.particles?.lines?.(cx, cy - 4, 6, 'rgba(255,255,255,0.8)', a + Math.PI, 240);
    g.particles?.ring?.(p.x + Math.cos(a) * 10, p.y - 8, 2, 12, '#ffffff', 0.15, 1);
  }

  update(g: G, dt: number) {
    this.time += dt;
    if (this.throwT > 0) this.throwT -= dt;
    if (this.hint > 0) this.hint -= dt;
    const p = g.player, inp = g.input;
    this.updateFlying(g, dt);
    const h = this.held;
    if (h) {
      // batal bila mayat hilang / pemain mati / adegan khusus
      if (!g.corpses.includes(h.c) || !h.c.rd || g.state !== 'playing' || p.fatality || p.stunT > 0.15 || g.silat) { this.release(g); return; }
      h.t += dt;
      h.c.t = 0;
      if (inp.hit('g')) { inp.pressed.delete('g'); this.release(g); g.say?.('LEPAS', '#9a9a9a', 1, 0.4); return; }
      if (h.mode === 'hold') {
        if (inp.mouse.pressed) { this.doThrow(g, 1); inp.mouse.pressed = false; inp.mouse.down = false; return; }
        if (inp.mouse.rpressed) {
          h.mode = 'spin'; h.spinT = 0; h.th0 = Math.atan2(h.gy - p.y, h.gx - p.x); h.dir = p.facing >= 0 ? -1 : 1; h.hitCd.clear();
          inp.mouse.rpressed = false; inp.mouse.rdown = false;
          g.say?.('PUSARAN!', '#ffd27f', 2, 0.6); g.sfx?.axeSwing?.();
        }
      } else {
        h.spinT += dt;
        if (Math.floor((h.spinT - dt) * 14) !== Math.floor(h.spinT * 14)) { g.sfx?.whoosh?.(); g.particles?.smoke?.(p.x + rnd(-10, 10), p.y + 1, 2, '#bfc9b0', 40, 0.3); }
        this.spinHits(g, h, dt);
        if (inp.mouse.pressed || h.spinT >= SPIN_DUR) { this.doThrow(g, 1.12); inp.mouse.pressed = false; inp.mouse.down = false; inp.mouse.rpressed = false; return; }
      }
      // konsumsi klik supaya tidak memicu serangan lain
      if (inp.mouse.pressed) { inp.mouse.pressed = false; inp.mouse.down = false; }
      return;
    }
    if (g.state !== 'playing' || p.fatality || p.stunT > 0 || g.carry?.carrying || g.silat || g.botPunch?.active || g.propsPlay?.scene) return;
    if (inp.hit('g')) {
      const cand = this.candidates(g);
      if (cand) this.grabNow(g, cand);
    }
  }

  private spinHits(g: G, h: Held, dt: number) {
    const rd = h.c.rd;
    for (const [id, t] of h.hitCd) h.hitCd.set(id, t - dt);
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if ((h.hitCd.get(e.id) ?? 0) > 0) continue;
      let hit = false;
      for (const pt of rd.pts) {
        if (pt.z > 16) continue;
        if (Math.hypot(pt.x - e.x, (pt.y - e.y) * 1.2) < (e.r ?? 6) + 5) { hit = true; break; }
      }
      if (!hit) continue;
      h.hitCd.set(e.id, 0.2);
      const p = g.player;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      g.damageEnemy(e, 4, 22, a, 420, { melee: true, knockdown: true, hitstop: 0.04, shake: 0.2 });
      g.particles?.spark?.(e.x, e.y - 7, 6, '#ffffff', a, 1.2, 220);
      g.particles?.blood?.(e.x, e.y - 7, 6, a, 150);
      g.sfx?.slam?.();
      g.texts?.hit?.(e.x, e.y - 20 - (e.z ?? 0), 'BODY SWING!', '#ffd27f', 1, 0.5);
    }
  }

  private updateFlying(g: G, dt: number) {
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const f = this.flying[i];
      f.t += dt;
      const rd = f.c.rd;
      if (!rd || !g.corpses.includes(f.c) || f.t > 2.4) { this.flying.splice(i, 1); continue; }
      f.c.t = Math.min(f.c.t, 1.0);
      const sp = rd.speed;
      if (sp < 90 && f.t > 0.3) { this.flying.splice(i, 1); continue; }
      for (const [id, t] of f.hitCd) f.hitCd.set(id, t - dt);
      if (sp < 170) continue;
      for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0 || (f.hitCd.get(e.id) ?? 0) > 0) continue;
        let hit = false;
        for (const pt of rd.pts) {
          if (pt.z > 18) continue;
          if (Math.hypot(pt.x - e.x, (pt.y - e.y) * 1.2) < (e.r ?? 6) + 5) { hit = true; break; }
        }
        if (!hit) continue;
        f.hitCd.set(e.id, 0.35);
        const hip = rd.pts[HIP];
        const a = Math.atan2(hip.vy, hip.vx);
        const dmg = clamp(sp / 85, 4, 14);
        g.damageEnemy(e, dmg, 40, a, Math.min(700, sp * 0.8), { melee: true, knockdown: true, hitstop: 0.06, shake: 0.35, launch: 60 });
        g.texts?.hit?.(e.x, e.y - 22 - (e.z ?? 0), sp > 520 ? 'STRIKE!' : 'BODY HIT!', '#ffffff', 1, 0.55);
        g.particles?.spark?.(e.x, e.y - 7, 10, '#ffffff', a, 1.3, 260);
        g.particles?.ring?.(e.x, e.y - 7, 2, 16, '#ffffff', 0.16, 1);
        g.blood?.spray?.(e.x, e.y - 7, a, 3, true);
        g.sfx?.slam?.(); g.sfx?.kick?.();
        // momentum berpindah: tubuh melambat setelah menabrak
        for (const pt of rd.pts) { pt.vx *= 0.55; pt.vy *= 0.55; }
        f.c.cd = 0.3;
      }
    }
  }

  draw(g: G, ctx: Ctx) {
    const p = g.player;
    ctx.save(); ctx.globalAlpha = 1;
    const h = this.held;
    if (h && h.c.rd) {
      const rd = h.c.rd;
      // lengan: dari badan pemain ke tiap genggaman
      for (const li of h.limbs) {
        const s = { x: rd.pts[li].x, y: rd.pts[li].y - rd.pts[li].z };
        pline(ctx, p.x, p.y - 8 - p.z, s.x, s.y, '#ffffffaa', 1);
        pcircle(ctx, s.x, s.y, 1.6, '#ffffff');
        pring(ctx, s.x, s.y, 4 + Math.sin(this.time * 12) * 0.6, '#ffd27f', 1);
      }
      const txt = h.mode === 'spin' ? 'PUSARAN!' : 'LMB LEMPAR   RMB PUTAR   G LEPAS';
      pfontO(ctx, txt, p.x, p.y - 32 - p.z, h.mode === 'spin' ? '#ffd27f' : '#9be7ff', '#000', 1, 'center');
    } else if (g.state === 'playing' && !p.fatality && !g.carry?.carrying) {
      const cand = this.candidates(g);
      if (cand) {
        const rd = cand.c.rd;
        for (const li of cand.limbs) {
          const s = this.sp(cand.c, li);
          pring(ctx, s.x, s.y, 5 + Math.sin(this.time * 10) * 0.8, '#ffd27f', 1);
          pcircle(ctx, s.x, s.y, 1, '#ffffff');
        }
        const hip = rd.pts[HEAD];
        const n = cand.limbs.length === 2;
        pfontO(ctx, `G: TARIK ${n ? 'KEDUA ' : ''}${NAMES[cand.limbs[0]]}`, hip.x, hip.y - hip.z - 12, '#ffd27f', '#000', 1, 'center');
      }
    }
    ctx.restore();
  }
}
