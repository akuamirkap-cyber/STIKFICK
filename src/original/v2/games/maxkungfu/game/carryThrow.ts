import { clamp, dist, rnd } from './rng';
import { solidAt } from './level';
import { OT_GLASS, officeFloorSupportY, officeTileAt, shatterOfficeGlassTile } from './office';
import { TILE } from './constants';
import { solvePose } from './draw';
import { drawStaticProp } from './propsPlay';
import { startReact } from './hitReact';
import { pcircle, pfontO, pline, prect, pring, type Ctx } from './pixel';

/**
 * SISTEM ANGKAT & LEMPAR OBJEK KANTOR / ARENA:
 * - POT TANAMAN ('pot')      : Diambil & dilempar dengan SATU TANGAN (Pitcher Whip Throw).
 *                              Saat kena: keramik pecah berkeping-keping memantul di lantai, tanah & kelopak bunga berhamburan!
 * - KOMPUTER ('computer')    : Diangkat di atas kepala & dilempar dengan DUA TANGAN (Overhead Two-Handed Smash Throw).
 *                              Saat kena: monitor meledak korsleting listrik (menyengat musuh), bingkai monitor, keyboard,
 *                              tombol keycaps, papan PCB hijau & kaca layar terpental dan memantul nyata di lantai!
 * - MEJA KANTOR ('table')    : Diangkat & dilempar dengan DUA TANGAN, terbelah dua saat menghantam target.
 */
type G = any;
export type CarryKind = 'pot' | 'computer' | 'table';

interface Carried {
  kind: CarryKind;
  prop: any;
  t: number;
  pickupT: number;
}

interface ThrowAnim {
  kind: CarryKind;
  prop: any;
  t: number;
  dur: number;
  releaseAt: number;
  released: boolean;
  aim: number;
  tx: number;
  ty: number;
}

interface Shot {
  kind: CarryKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grav: number;
  life: number;
  spin: number;
  spinSpd: number;
  floorY: number;
  hitIds: number[];
  trail: { x: number; y: number }[];
}

type DebrisKind =
  | 'shard'
  | 'soil'
  | 'leaf'
  | 'petal'
  | 'monitor'
  | 'keyboard'
  | 'pcb'
  | 'casing'
  | 'keycap'
  | 'glass'
  | 'wood';

interface PhysDebris {
  kind: DebrisKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  floorY: number;
  rot: number;
  spin: number;
  grav: number;
  bounce: number;
  friction: number;
  life: number;
  maxLife: number;
  c1: string;
  c2: string;
  sz: number;
  bounces: number;
  side: number;
}

interface ElectricArc {
  pts: { x: number; y: number }[];
  life: number;
  maxLife: number;
  col: string;
}

interface ShockedEnemy {
  e: any;
  t: number;
}

export class CarryThrow {
  carried: Carried | null = null;
  throwAnim: ThrowAnim | null = null;
  shots: Shot[] = [];
  debris: PhysDebris[] = [];
  arcs: ElectricArc[] = [];
  shocked: ShockedEnemy[] = [];
  time = 0;

  get carrying() { return this.carried !== null || this.throwAnim !== null; }
  get throwing() { return this.throwAnim !== null; }
  get moveMul() {
    if (this.throwAnim) return 0.35;
    if (!this.carried) return 1;
    return this.carried.kind === 'pot' ? 0.94 : this.carried.kind === 'computer' ? 0.78 : 0.7;
  }

  poseOverride(): { pose: string; t: number } | null {
    if (this.throwAnim) {
      const u = clamp(this.throwAnim.t / Math.max(0.01, this.throwAnim.dur), 0, 1);
      return {
        pose: this.throwAnim.kind === 'pot' ? 'throw_pot' : 'throw_comp',
        t: u,
      };
    }
    if (!this.carried) return null;
    return {
      pose: this.carried.kind === 'pot' ? 'carry_pot' : 'carry_comp',
      t: 0.5,
    };
  }

  reset(g?: G) {
    if (this.carried && g) {
      this.carried.prop.dead = false;
      this.carried.prop.x = g.player.x + 8;
      this.carried.prop.y = g.level?.sideView ? g.player.y : g.player.y + 4;
    }
    this.carried = null;
    this.throwAnim = null;
    this.shots = [];
    this.debris = [];
    this.arcs = [];
    this.shocked = [];
  }

  nearProp(g: G): any | null {
    const p = g.player;
    const side = !!g.level?.sideView;
    let best: any = null;
    let bestScore = 1e9;
    for (const pr of g.props) {
      if (pr.dead || (pr.kind !== 'pot' && pr.kind !== 'computer' && pr.kind !== 'table')) continue;
      if (side && Math.abs(pr.y - p.y) > 26) continue;
      const d = dist(p.x, p.y, pr.x, pr.y);
      const reach = pr.kind === 'table' ? 42 : 40;
      if (d > reach) continue;
      // Prioritaskan Pot (1 tangan) & Komputer (2 tangan) sedikit di atas meja agar mudah diambil
      const priority = pr.kind === 'pot' || pr.kind === 'computer' ? -8 : 0;
      if (d + priority < bestScore) {
        bestScore = d + priority;
        best = pr;
      }
    }
    return best;
  }

  private getFloorY(g: G, x: number, y: number): number {
    if (g.level?.sideView) {
      const sup = officeFloorSupportY(g.level, x, y, 4);
      if (sup !== null) return sup;
    }
    return y + 10;
  }

  update(g: G, dt: number) {
    this.time += dt;
    if (g.state === 'playing') this.handleInput(g);
    this.updateThrowAnim(g, dt);
    this.updateShots(g, dt);
    this.updateDebris(g, dt);
    this.updateArcs(g, dt);
  }

  handleInput(g: G) {
    const p = g.player, inp = g.input;
    if (p.fatality || p.stunT > 0 || p.holdT > 0 || g.botPunch?.active || g.propsPlay?.scene || this.throwAnim) return;
    const zHit = !!inp.hit?.('z');
    if (this.carried) {
      if (inp.mouse.rpressed) {
        // Klik kanan lagi = taruh objek kembali ke lantai
        const pr = this.carried.prop;
        pr.dead = false;
        pr.hp = Math.max(1, pr.hp || 1);
        pr.x = p.x + Math.cos(p.aim) * 12;
        pr.y = g.level?.sideView ? p.y : p.y + 4;
        this.carried = null;
        inp.mouse.rpressed = false;
        inp.mouse.rdown = false;
        g.sfx?.select?.();
        g.say?.('TARUH OBJEK', '#9a9a9a', 1, 0.5);
        return;
      }
      if (inp.mouse.pressed || zHit) {
        this.startThrow(g);
        inp.mouse.pressed = false;
        inp.mouse.down = false;
        return;
      }
      this.carried.t += g.rawDt;
      this.carried.pickupT = Math.min(1, this.carried.pickupT + g.rawDt * 8);
      return;
    }
    if (inp.mouse.rpressed || zHit) {
      const pr = this.nearProp(g);
      if (!pr) return;
      const kind = pr.kind as CarryKind;
      this.carried = { kind, prop: pr, t: 0, pickupT: 0 };
      pr.dead = true;
      p.attackPhase = 'none';
      p.buffered = null;
      p.comboStr = '';
      inp.mouse.rpressed = false;
      inp.mouse.rdown = false;
      g.sfx?.pickup?.();
      g.particles?.ring?.(pr.x, pr.y - 6, 2, 11, kind === 'computer' ? '#46e2ff' : '#ffd27f', 0.18, 1);
      if (kind === 'computer') {
        g.particles?.spark?.(pr.x, pr.y - 8, 6, '#46e2ff', -Math.PI / 2, 1.1, 130);
        g.say?.('ANGKAT KOMPUTER (2 TANGAN)!', '#46e2ff', 2, 0.7);
      } else if (kind === 'pot') {
        g.say?.('PEGANG POT (1 TANGAN)!', '#ff8da1', 1, 0.65);
      } else {
        g.say?.('ANGKAT MEJA (2 TANGAN)!', '#ffd27f', 1, 0.65);
      }
    }
  }

  /** Mulai rangkaian animasi lempar 1 tangan (Pot) atau 2 tangan (Komputer / Meja) */
  startThrow(g: G) {
    const c = this.carried;
    if (!c) return;
    const p = g.player;
    const mw = g.mouseWorld?.() ?? { x: p.x + Math.cos(p.aim) * 100, y: p.y + Math.sin(p.aim) * 100 };
    const side = !!g.level?.sideView;
    const target = g.nearestEnemy?.(p.x, p.y, 250, p.aim, 1.7) ?? null;
    const tx = target ? target.x : mw.x;
    const ty = target ? target.y - 7 - (target.z ?? 0) : mw.y;
    let a = Math.atan2(ty - (p.y - 9), tx - p.x);
    if (side && !target) {
      const fDir = Math.cos(a) >= 0 ? 1 : -1;
      a = Math.atan2(clamp(ty - (p.y - 9), -70, 50), fDir * Math.max(45, Math.abs(tx - p.x)));
    }
    p.aim = a;
    p.facing = Math.cos(a) >= 0 ? 1 : -1;
    p.attackPhase = 'none';
    p.buffered = null;

    const isOneHand = c.kind === 'pot';
    this.throwAnim = {
      kind: c.kind,
      prop: c.prop,
      t: 0,
      dur: isOneHand ? 0.25 : 0.30,
      releaseAt: isOneHand ? 0.095 : 0.12,
      released: false,
      aim: a,
      tx,
      ty,
    };
    this.carried = null;
    g.sfx?.whoosh?.();
  }

  private updateThrowAnim(g: G, dt: number) {
    const ta = this.throwAnim;
    if (!ta) return;
    const p = g.player;
    ta.t += dt;
    p.aim = ta.aim;
    p.facing = Math.cos(ta.aim) >= 0 ? 1 : -1;
    p.attackPhase = 'none';

    if (!ta.released && ta.t >= ta.releaseAt) {
      ta.released = true;
      this.spawnProjectile(g, ta);
    }
    if (ta.t >= ta.dur) {
      this.throwAnim = null;
    }
  }

  private spawnProjectile(g: G, ta: ThrowAnim) {
    const p = g.player;
    const a = ta.aim;
    const f = p.facing;
    const u = clamp(ta.t / ta.dur, 0, 1);
    const sk = solvePose(g.playerStickOpts(ta.kind === 'pot' ? 'throw_pot' : 'throw_comp', u));
    const fh = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
    const bh = { x: p.x + sk.bhand.x, y: p.y + sk.bhand.y - p.z };

    const launchX = ta.kind === 'pot' ? fh.x + f * 3 : (fh.x + bh.x) * 0.5 + f * 4;
    const launchY = ta.kind === 'pot' ? fh.y - 1 : (fh.y + bh.y) * 0.5 - 2;
    const sp = ta.kind === 'pot' ? 560 : ta.kind === 'computer' ? 490 : 460;
    const grav = ta.kind === 'pot' ? 175 : 220;
    // Kompensasi sudut angkat sedikit agar lintasan balistik tepat mengenai target
    const dTarget = Math.hypot(ta.tx - launchX, ta.ty - launchY);
    const flightT = clamp(dTarget / sp, 0.04, 0.55);
    const vyLift = -0.45 * grav * flightT;

    const floorY = this.getFloorY(g, p.x, p.y);
    this.shots.push({
      kind: ta.kind,
      x: launchX,
      y: launchY,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp + vyLift,
      grav,
      life: 1.15,
      spin: 0,
      spinSpd: (ta.kind === 'pot' ? 14 : 10) * f,
      floorY,
      hitIds: [],
      trail: [{ x: launchX, y: launchY }],
    });

    // Recoil & Efek Peluncuran di Tangan
    p.kx += Math.cos(a) * (ta.kind === 'pot' ? 36 : 52);
    if (!g.level?.sideView) p.ky += Math.sin(a) * (ta.kind === 'pot' ? 36 : 52);
    g.sfx?.swing?.(ta.kind === 'pot' ? 1.25 : 0.78);
    g.sfx?.whoosh?.();
    g.particles?.ring?.(launchX, launchY, 2, ta.kind === 'pot' ? 10 : 15, ta.kind === 'computer' ? '#46e2ff' : '#ffd27f', 0.16, 1, true);
    g.particles?.lines?.(launchX, launchY, ta.kind === 'pot' ? 3 : 5, '#ffffff', a, 210);
    if (ta.kind !== 'pot') {
      g.particles?.smoke?.(p.x - f * 4, p.y + 1, 4, '#9a9a9a', 22, 0.3);
    }
    if (ta.kind === 'computer') {
      g.particles?.spark?.(launchX, launchY, 6, '#46e2ff', a, 0.9, 180);
      g.say?.('2-HAND PC THROW!', '#46e2ff', 2, 0.65);
    } else if (ta.kind === 'pot') {
      g.say?.('1-HAND POT WHIP!', '#ff8da1', 2, 0.6);
    } else {
      g.say?.('HEAVY THROW!', '#ffd27f', 2, 0.65);
    }
    g.shake?.(ta.kind === 'pot' ? 0.1 : 0.16);
  }

  updateShots(g: G, dt: number) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const sh = this.shots[i];
      sh.life -= dt;
      sh.spin += sh.spinSpd * dt;
      sh.vy += sh.grav * dt;

      // Jejak partikel selama terbang di udara
      if (sh.kind === 'computer' && Math.random() < 0.65) {
        g.particles?.add?.({
          x: sh.x + rnd(-4, 4),
          y: sh.y + rnd(-4, 4),
          vx: rnd(-35, 35),
          vy: rnd(-35, 25),
          life: rnd(0.12, 0.24),
          c: Math.random() < 0.6 ? '#46e2ff' : '#ffd166',
          k: 0,
          s: 1,
        });
      } else if (sh.kind === 'pot' && Math.random() < 0.45) {
        g.particles?.add?.({
          x: sh.x + rnd(-3, 3),
          y: sh.y + rnd(-3, 3),
          vx: -sh.vx * 0.08 + rnd(-20, 20),
          vy: rnd(-15, 20),
          life: rnd(0.18, 0.32),
          c: Math.random() < 0.5 ? '#4caf50' : '#ff6b81',
          k: 0,
          s: 1,
        });
      }

      const steps = Math.max(1, Math.ceil(Math.hypot(sh.vx, sh.vy) * dt / 4));
      let gone = sh.life <= 0;
      for (let s = 0; s < steps && !gone; s++) {
        sh.x += (sh.vx * dt) / steps;
        sh.y += (sh.vy * dt) / steps;
        if (g.level?.sideView) {
          sh.floorY = this.getFloorY(g, sh.x, sh.y);
          const gtx = Math.floor(sh.x / TILE), gty = Math.floor(sh.y / TILE);
          if (officeTileAt(g.level, gtx, gty) === OT_GLASS) {
            const posG = shatterOfficeGlassTile(g.level, g.levelCanvas, gtx, gty);
            if (posG) {
              g.particles?.burst?.(posG.x, posG.y, 16, '#7ce8ff', 190, 0.55, 2, 2);
              g.sfx?.glassTink?.();
              g.shake?.(0.2);
              continue; // menembus partisi kaca kantor yang pecah!
            }
          }
          // Jatuh menyentuh lantai di side-view
          if (sh.vy > 0 && sh.y >= sh.floorY - 2) {
            sh.y = sh.floorY - 2;
            this.impact(g, sh, null);
            gone = true;
            break;
          }
        }
        if (solidAt(g.level, sh.x, sh.y)) {
          this.impact(g, sh, null);
          gone = true;
          break;
        }
        const hitRad = sh.kind === 'pot' ? 7.5 : 10.5;
        for (const e of g.enemies) {
          if (e.dead || e.spawnT > 0 || sh.hitIds.includes(e.id)) continue;
          if (dist(sh.x, sh.y, e.x, e.y - 6 - e.z) > e.r + hitRad) continue;
          sh.hitIds.push(e.id);
          this.impact(g, sh, e);
          gone = true;
          break;
        }
      }
      sh.trail.unshift({ x: sh.x, y: sh.y });
      if (sh.trail.length > 7) sh.trail.pop();
      if (gone) this.shots.splice(i, 1);
    }
  }

  impact(g: G, sh: Shot, e: any) {
    const a = Math.atan2(sh.vy, sh.vx);
    const fY = e ? (g.level?.sideView ? e.y : e.y + 2) : sh.floorY;

    if (sh.kind === 'pot') {
      this.shatterPotPhysics(g, sh.x, sh.y, fY, a, !!e);
      if (e) {
        startReact(e, 'head', a, 1.15);
        e.sqx = 1.38; e.sqy = 0.64;
        g.damageEnemy(e, 6, 42, a, 280, { knockdown: true, hitstop: 0.06, shake: 0.28, melee: false, launch: 85, zone: 'head' });
        if (!e.dead) {
          e.down = Math.max(e.down ?? 0, 0.7);
          e.state = 'down';
          e.pose = 'down';
          e.stun = Math.max(e.stun ?? 0, 0.45);
        }
      }
      return;
    }

    if (sh.kind === 'computer') {
      this.shatterComputerPhysics(g, sh.x, sh.y, fY, a, !!e);
      if (e) {
        for (const q of g.enemies) {
          if (q.dead || q.spawnT > 0 || dist(sh.x, sh.y, q.x, q.y - 5) > 42) continue;
          const primary = q === e;
          const dirTo = primary ? a : Math.atan2(q.y - sh.y, q.x - sh.x);
          startReact(q, primary ? 'head' : 'torso', dirTo, primary ? 1.25 : 0.95);
          q.sqx = 1.45; q.sqy = 0.58;
          g.damageEnemy(
            q,
            primary ? 10 : 6,
            primary ? 68 : 40,
            dirTo,
            primary ? 520 : 340,
            { knockdown: true, hitstop: primary ? 0.085 : 0.04, shake: primary ? 0.48 : 0.25, melee: false, launch: primary ? 165 : 110, zone: primary ? 'head' : 'torso' },
          );
          if (!q.dead) {
            q.down = Math.max(q.down ?? 0, 0.9);
            q.state = 'down';
            q.pose = 'down';
          }
          // Efek tersetrum listrik merambat di tubuh musuh!
          this.shocked.push({ e: q, t: primary ? 0.68 : 0.45 });
        }
      }
      return;
    }

    // Meja ('table')
    this.splitTable(g, sh.x, sh.y, fY, a, !!e);
    if (e) {
      for (const q of g.enemies) {
        if (q.dead || dist(sh.x, sh.y, q.x, q.y) > 36) continue;
        g.damageEnemy(q, 8, 55, a, 420, { knockdown: true, hitstop: 0.08, shake: 0.35, melee: false, launch: 120 });
        q.down = Math.max(q.down ?? 0, 0.8); q.state = 'down'; q.pose = 'down';
      }
    }
  }

  /** FISIKA PECAHAN POT KERAMIK: kepingan terakota memantul di lantai, tanah berhamburan, daun & kelopak melayang turun */
  shatterPotPhysics(g: G, x: number, y: number, floorY: number, dir: number, onBot: boolean) {
    g.propsPlay?.shatterPot?.(g, x, y, dir, onBot);
    // 1. Pecahan Keramik Terakota (memantul 2-3 kali di lantai dengan rotasi)
    for (let i = 0; i < 10; i++) {
      const ang = dir + Math.PI + rnd(-1.35, 1.35);
      const sp = rnd(75, 220);
      this.debris.push({
        kind: 'shard',
        x: x + rnd(-3, 3),
        y: y + rnd(-3, 3),
        vx: Math.cos(ang) * sp + Math.cos(dir) * 45,
        vy: -rnd(65, 185) + Math.sin(ang) * 40,
        floorY: floorY + rnd(-2, 2),
        rot: rnd(0, 6.28),
        spin: (Math.random() < 0.5 ? -1 : 1) * rnd(9, 18),
        grav: 440,
        bounce: rnd(0.42, 0.58),
        friction: 0.74,
        life: rnd(0.85, 1.35),
        maxLife: 1.35,
        c1: i % 2 === 0 ? '#c66b3d' : '#e49a63',
        c2: '#5a2a16',
        sz: rnd(2.2, 3.8),
        bounces: 0,
        side: i % 2 === 0 ? 1 : -1,
      });
    }
    // 2. Bongkahan Tanah Subur
    for (let i = 0; i < 6; i++) {
      this.debris.push({
        kind: 'soil',
        x: x + rnd(-2, 2),
        y: y + rnd(-2, 2),
        vx: rnd(-110, 110) + Math.cos(dir) * 30,
        vy: -rnd(50, 140),
        floorY: floorY + rnd(-2, 2),
        rot: rnd(0, 6.28),
        spin: rnd(-8, 8),
        grav: 480,
        bounce: 0.25,
        friction: 0.6,
        life: rnd(0.65, 1.0),
        maxLife: 1.0,
        c1: '#3a1d0f',
        c2: '#241107',
        sz: rnd(1.8, 2.8),
        bounces: 0,
        side: 1,
      });
    }
    // 3. Daun & Kelopak Bunga (melayang turun dengan hambatan udara & ayunan)
    for (let i = 0; i < 9; i++) {
      const isPetal = i % 3 !== 0;
      this.debris.push({
        kind: isPetal ? 'petal' : 'leaf',
        x: x + rnd(-4, 4),
        y: y - rnd(1, 6),
        vx: rnd(-95, 95),
        vy: -rnd(45, 130),
        floorY: floorY + rnd(-2, 2),
        rot: rnd(0, 6.28),
        spin: rnd(-6, 6),
        grav: 145, // ringan di udara
        bounce: 0.15,
        friction: 0.5,
        life: rnd(0.95, 1.45),
        maxLife: 1.45,
        c1: isPetal ? (i % 2 === 0 ? '#ff6b81' : '#ffd166') : '#4caf50',
        c2: isPetal ? '#ff8da1' : '#2e7d32',
        sz: rnd(1.8, 2.6),
        bounces: 0,
        side: i % 2 === 0 ? 1 : -1,
      });
    }
    if (onBot) g.say?.('POT SMASH!', '#ff8da1', 2, 0.65);
  }

  /** FISIKA HANCUR & KORSLETING KOMPUTER: monitor retak, keyboard, tombol keycaps, PCB, kaca & busur petir listrik! */
  shatterComputerPhysics(g: G, x: number, y: number, floorY: number, dir: number, onBot: boolean) {
    // 1. Bingkai Monitor LCD Retak
    this.debris.push({
      kind: 'monitor',
      x,
      y: y - 2,
      vx: -Math.cos(dir) * rnd(55, 110) + rnd(-30, 30),
      vy: -rnd(130, 195),
      floorY: floorY + rnd(-1, 2),
      rot: rnd(-0.3, 0.3),
      spin: -Math.sign(Math.cos(dir) || 1) * rnd(7, 12),
      grav: 460,
      bounce: 0.45,
      friction: 0.72,
      life: 1.45,
      maxLife: 1.45,
      c1: '#162840',
      c2: '#46e2ff',
      sz: 6,
      bounces: 0,
      side: 1,
    });
    // 2. Papan Keyboard Kantor
    this.debris.push({
      kind: 'keyboard',
      x: x + rnd(-3, 3),
      y,
      vx: Math.cos(dir) * rnd(80, 165) + rnd(-40, 40),
      vy: -rnd(110, 175),
      floorY: floorY + rnd(-1, 2),
      rot: rnd(0, 3.14),
      spin: Math.sign(Math.cos(dir) || 1) * rnd(9, 15),
      grav: 440,
      bounce: 0.5,
      friction: 0.74,
      life: 1.35,
      maxLife: 1.35,
      c1: '#2c364d',
      c2: '#a0aec0',
      sz: 5,
      bounces: 0,
      side: -1,
    });
    // 3. Papan Sirkuit Motherboard Hijau (PCB) & Casing PC
    for (let i = 0; i < 4; i++) {
      const isPcb = i < 2;
      this.debris.push({
        kind: isPcb ? 'pcb' : 'casing',
        x: x + rnd(-4, 4),
        y: y + rnd(-3, 3),
        vx: rnd(-170, 170) + Math.cos(dir) * 45,
        vy: -rnd(90, 190),
        floorY: floorY + rnd(-2, 2),
        rot: rnd(0, 6.28),
        spin: (i % 2 === 0 ? 1 : -1) * rnd(10, 17),
        grav: 450,
        bounce: 0.48,
        friction: 0.72,
        life: rnd(1.0, 1.4),
        maxLife: 1.4,
        c1: isPcb ? '#15803d' : '#263044',
        c2: isPcb ? '#eab308' : '#64748b',
        sz: rnd(3.2, 4.5),
        bounces: 0,
        side: i % 2 === 0 ? 1 : -1,
      });
    }
    // 4. Hujan Tombol Keyboard (Keycaps) & Kaca Layar Monitor (memantul lincah di lantai!)
    for (let i = 0; i < 16; i++) {
      const isGlass = i >= 10;
      this.debris.push({
        kind: isGlass ? 'glass' : 'keycap',
        x: x + rnd(-5, 5),
        y: y + rnd(-4, 2),
        vx: rnd(-210, 210) + Math.cos(dir) * 55,
        vy: -rnd(75, 220),
        floorY: floorY + rnd(-2, 3),
        rot: rnd(0, 6.28),
        spin: rnd(-18, 18),
        grav: 430,
        bounce: isGlass ? 0.55 : 0.66,
        friction: 0.78,
        life: rnd(0.8, 1.3),
        maxLife: 1.3,
        c1: isGlass ? '#7ce8ff' : i % 3 === 0 ? '#e2e8f0' : '#94a3b8',
        c2: isGlass ? '#ffffff' : '#1e293b',
        sz: isGlass ? rnd(2.0, 3.2) : 2.0,
        bounces: 0,
        side: 1,
      });
    }
    // 5. Sambaran Petir Korsleting Listrik (Electric Arcs)
    for (let i = 0; i < 7; i++) {
      const a0 = (i / 7) * Math.PI * 2 + rnd(-0.3, 0.3);
      const len = rnd(14, 28);
      const pts: { x: number; y: number }[] = [{ x, y }];
      let cx = x, cy = y;
      for (let s = 1; s <= 4; s++) {
        const u = s / 4;
        cx = x + Math.cos(a0) * len * u + rnd(-3.5, 3.5);
        cy = y + Math.sin(a0) * len * u + rnd(-3.5, 3.5);
        pts.push({ x: cx, y: cy });
      }
      this.arcs.push({
        pts,
        life: rnd(0.16, 0.28),
        maxLife: 0.28,
        col: i % 2 === 0 ? '#46e2ff' : i % 3 === 0 ? '#ffd166' : '#ffffff',
      });
    }

    // Efek Partikel, Cahaya & Suara Ledakan Elektronik
    g.particles?.shockwave?.(x, y, onBot ? 38 : 26, '#46e2ff', 0.3);
    g.particles?.ring?.(x, y, 3, onBot ? 28 : 20, '#ffffff', 0.24, 2, true);
    g.particles?.spark?.(x, y, 18, '#46e2ff', dir, 1.4, 280);
    g.particles?.spark?.(x, y, 12, '#ffd166', dir + Math.PI, 1.5, 240);
    g.particles?.burst?.(x, y, 16, '#1e293b', 190, 0.55, 2, 3);
    g.particles?.smoke?.(x, y, 6, '#64748b', 34, 0.45);
    if (g.level?.sideView && g.glowOn && g.glowFx) {
      g.glowFx.add(x, y, 52, '#46e2ff', 0.22);
    }
    g.sfx?.glassShatter?.();
    g.sfx?.explosion?.();
    g.sfx?.slam?.();
    g.flash?.('#9be7ff', onBot ? 0.16 : 0.08);
    g.shake?.(onBot ? 0.35 : 0.18);
    g.hitstop = Math.max(g.hitstop ?? 0, onBot ? 0.075 : 0.03);
    if (g.stamp) g.stamp(x, floorY, '#0d111a66', 3);
    g.say?.(onBot ? 'CYBER CRASH!' : 'PC SHATTER!', '#46e2ff', 2, 0.75);
  }

  splitTable(g: G, x: number, y: number, floorY: number, a: number, onBot: boolean) {
    for (let i = 0; i < 2; i++) {
      const ang = a + (i === 0 ? -0.65 : 0.65) + rnd(-0.2, 0.2);
      this.debris.push({
        kind: 'wood',
        x,
        y,
        vx: Math.cos(ang) * rnd(150, 260),
        vy: -rnd(100, 180),
        floorY: floorY + rnd(-1, 2),
        rot: a,
        spin: (i === 0 ? -1 : 1) * rnd(6, 11),
        grav: 440,
        bounce: 0.42,
        friction: 0.72,
        life: 1.15,
        maxLife: 1.15,
        c1: '#8a5a2b',
        c2: '#24160d',
        sz: 8,
        bounces: 0,
        side: i === 0 ? -1 : 1,
      });
    }
    g.particles?.burst?.(x, y, 22, '#8a5a2b', 190, 0.6, 2, 3);
    for (let i = 0; i < 5; i++) g.particles?.limb?.(x, y, a + rnd(-1.2, 1.2), rnd(120, 260), i % 2 ? '#c79a5a' : '#3a2410', 4);
    g.particles?.spark?.(x, y, 12, '#ffffff', a, 1.2, 260);
    g.particles?.smoke?.(x, y + 2, 5, '#9a8f7d', 30, 0.4);
    g.particles?.ring?.(x, y, 2, onBot ? 26 : 18, '#ffffff', 0.24, 2);
    g.particles?.shockwave?.(x, y, onBot ? 34 : 24, '#ffd27f', 0.28);
    g.sfx?.explosion?.(); g.sfx?.slam?.(); g.sfx?.kick?.();
    g.flash?.('#ffffff', onBot ? 0.14 : 0.07); g.shake?.(onBot ? 0.25 : 0.14);
    g.hitstop = Math.max(g.hitstop ?? 0, onBot ? 0.06 : 0.025);
    g.say?.(onBot ? 'TABLE SPLIT!' : 'CRASH!', '#ffd27f', 2, 0.7);
  }

  updateDebris(g: G, dt: number) {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.debris.splice(i, 1);
        continue;
      }
      if (d.kind === 'leaf' || d.kind === 'petal') {
        // Fisika hambatan udara untuk daun & kelopak bunga: bergoyang lembut saat melayang turun
        d.vx *= Math.pow(0.25, dt);
        d.x += (d.vx + Math.sin(this.time * 9 + i * 1.7) * 24) * dt;
        d.vy = Math.min(48, d.vy + d.grav * dt);
        d.y += d.vy * dt;
        d.rot += d.spin * dt * 0.6;
        if (d.y >= d.floorY) {
          d.y = d.floorY;
          d.vy = 0;
          d.vx = 0;
          d.spin = 0;
        }
        continue;
      }

      d.vy += d.grav * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.spin * dt;

      // Pantulan fisik di lantai (bounce + gesekan + percikan kecil)
      if (d.y >= d.floorY && d.vy > 0) {
        d.y = d.floorY;
        if (Math.abs(d.vy) > 26 && d.bounces < 3) {
          d.vy = -d.vy * d.bounce;
          d.vx *= d.friction;
          d.spin *= 0.72;
          d.bounces++;
          if (d.bounces === 1 && (d.kind === 'monitor' || d.kind === 'keyboard' || d.kind === 'pcb')) {
            g.particles?.spark?.(d.x, d.y - 1, 3, '#46e2ff', -Math.PI / 2, 0.8, 90);
          } else if (d.bounces === 1 && d.kind === 'shard') {
            g.particles?.smoke?.(d.x, d.y, 1, '#c66b3d', 12, 0.2);
          }
        } else {
          d.vy = 0;
          d.vx *= 0.82;
          d.spin *= 0.5;
        }
      }
    }
  }

  private updateArcs(g: G, dt: number) {
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].life -= dt;
      if (this.arcs[i].life <= 0) this.arcs.splice(i, 1);
    }
    for (let i = this.shocked.length - 1; i >= 0; i--) {
      const s = this.shocked[i];
      s.t -= dt;
      if (s.t <= 0 || !s.e || s.e.dead) {
        this.shocked.splice(i, 1);
        continue;
      }
      if (Math.random() < 0.45) {
        g.particles?.add?.({
          x: s.e.x + rnd(-5, 5),
          y: s.e.y - rnd(2, 13) - (s.e.z ?? 0),
          vx: rnd(-30, 30),
          vy: rnd(-35, 15),
          life: 0.12,
          c: Math.random() < 0.5 ? '#46e2ff' : '#ffffff',
          k: 0,
          s: 1,
        });
      }
    }
  }

  /** Gambar kabel komputer yang menjuntai & memercikkan listrik saat diangkat 2 tangan atau saat terbang */
  private drawHangingCable(ctx: Ctx, x0: number, y0: number, sway: number, time: number) {
    const mx = x0 + sway * 3.5;
    const my = y0 + 5;
    const ex = x0 + sway * 5.5 + Math.sin(time * 14) * 1.4;
    const ey = y0 + 9.5;
    pline(ctx, x0, y0, mx, my, '#0d111a', 2);
    pline(ctx, mx, my, ex, ey, '#1e293b', 1.5);
    // Percikan ujung kabel terputus
    if (Math.floor(time * 16) % 2 === 0) {
      pcircle(ctx, ex, ey, 1.2, '#46e2ff');
      pline(ctx, ex, ey, ex + Math.cos(time * 25) * 2.5, ey + Math.sin(time * 25) * 2.5, '#ffd166', 1);
    }
  }

  draw(g: G, ctx: Ctx) {
    // 1. Gambar Proyektil yang sedang melesat di udara
    for (const sh of this.shots) {
      ctx.save();
      // Garis jejak kecepatan (motion trail)
      for (let i = 1; i < sh.trail.length; i++) {
        const a = sh.trail[i - 1], b = sh.trail[i];
        ctx.globalAlpha = (1 - i / sh.trail.length) * 0.45;
        pline(
          ctx,
          a.x,
          a.y,
          b.x,
          b.y,
          sh.kind === 'computer' ? '#46e2ff' : sh.kind === 'pot' ? '#ff8da1' : '#ffd27f',
          Math.max(1, 3 - Math.floor(i / 2)),
        );
      }
      ctx.globalAlpha = 1;
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.spin);
      if (sh.kind === 'computer') {
        this.drawHangingCable(ctx, -4, 2, Math.sin(g.time * 15), g.time);
        drawStaticProp(ctx, { kind: 'computer', x: 0, y: 6 }, false, g.time);
      } else if (sh.kind === 'pot') {
        drawStaticProp(ctx, { kind: 'pot', x: 0, y: 5 }, false, g.time);
      } else {
        drawStaticProp(ctx, { kind: 'table', x: 0, y: 3 }, false, g.time);
      }
      ctx.restore();
    }

    // 2. Gambar Pecahan Fisik (Keramik, Tanah, Daun, Monitor Retak, Keyboard, Keycaps, PCB, Kaca)
    for (const d of this.debris) {
      ctx.save();
      ctx.globalAlpha = clamp(d.life / Math.min(0.4, d.maxLife), 0, 1);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      switch (d.kind) {
        case 'shard':
          // Kepingan segitiga/poligon keramik terakota
          prect(ctx, -d.sz * 0.6, -d.sz * 0.4, d.sz * 1.2, d.sz * 0.85, d.c2);
          prect(ctx, -d.sz * 0.45, -d.sz * 0.3, d.sz * 0.9, d.sz * 0.6, d.c1);
          break;
        case 'soil':
          pcircle(ctx, 0, 0, d.sz * 0.6, d.c1);
          break;
        case 'leaf':
          pline(ctx, -d.sz, 0, d.sz, 0, d.c1, 2);
          pline(ctx, -d.sz * 0.5, -0.8, d.sz * 0.5, 0.8, d.c2, 1);
          break;
        case 'petal':
          pcircle(ctx, 0, 0, d.sz * 0.55, d.c1);
          break;
        case 'monitor':
          // Bingkai monitor pecah dengan retakan layar
          prect(ctx, -7, -5, 14, 10, '#0d111a');
          prect(ctx, -6, -4, 12, 8, d.c1);
          pline(ctx, -4, -3, 3, 2, d.c2, 1);
          pline(ctx, 2, -3, -3, 3, '#ffffff', 1);
          pline(ctx, -1, -1, 4, -2, d.c2, 1);
          break;
        case 'keyboard':
          prect(ctx, -6, -2, 12, 4, '#0f1420');
          prect(ctx, -5, -1, 10, 2, d.c1);
          pline(ctx, -4, 0, 4, 0, d.c2, 1);
          break;
        case 'pcb':
          // Papan sirkuit hijau dengan chip emas
          prect(ctx, -4, -2.5, 8, 5, d.c1);
          prect(ctx, -1.5, -1.5, 3, 3, '#0f172a');
          pline(ctx, -3, -1, 3, 1, d.c2, 1);
          break;
        case 'casing':
          prect(ctx, -4, -2.5, 8, 5, '#0f1420');
          prect(ctx, -3, -1.5, 6, 3, d.c1);
          break;
        case 'keycap':
          prect(ctx, -1.2, -1.2, 2.4, 2.4, d.c2);
          prect(ctx, -0.8, -0.8, 1.6, 1.6, d.c1);
          break;
        case 'glass':
          pline(ctx, -d.sz * 0.6, -d.sz * 0.4, d.sz * 0.6, d.sz * 0.4, d.c1, 1.5);
          pline(ctx, -d.sz * 0.3, -d.sz * 0.2, d.sz * 0.3, d.sz * 0.2, d.c2, 1);
          break;
        case 'wood':
          prect(ctx, -8, -2, 9, 4, '#24160d');
          prect(ctx, -7, -3, 8, 3, '#8a5a2b');
          pline(ctx, -6, -3, 1, -3, '#c79a5a', 1);
          pline(ctx, d.side * 5, 0, d.side * 7, 3, '#3a2410', 2);
          break;
      }
      ctx.restore();
    }

    // 3. Gambar Busur Petir Korsleting Listrik & Efek Setrum pada Musuh
    ctx.save();
    for (const arc of this.arcs) {
      ctx.globalAlpha = clamp(arc.life / arc.maxLife, 0, 1);
      for (let i = 1; i < arc.pts.length; i++) {
        pline(ctx, arc.pts[i - 1].x, arc.pts[i - 1].y, arc.pts[i].x, arc.pts[i].y, arc.col, 1.5);
      }
    }
    for (const s of this.shocked) {
      const e = s.e;
      if (!e || e.dead) continue;
      ctx.globalAlpha = 0.85;
      const ex = e.x, ey = e.y - 7 - (e.z ?? 0);
      for (let b = 0; b < 2; b++) {
        const x0 = ex + rnd(-5, 5), y0 = ey + rnd(-6, 6);
        const x1 = ex + rnd(-6, 6), y1 = ey + rnd(-6, 6);
        const x2 = ex + rnd(-5, 5), y2 = ey + rnd(-6, 6);
        pline(ctx, x0, y0, x1, y1, b === 0 ? '#46e2ff' : '#ffffff', 1);
        pline(ctx, x1, y1, x2, y2, '#ffd166', 1);
      }
    }
    ctx.restore();

    // 4. Gambar Objek yang Sedang Dipegang (1 Tangan untuk Pot, 2 Tangan untuk Komputer/Meja) atau Sedang Dalam Fase Windup Lempar
    ctx.save();
    ctx.globalAlpha = 1;
    const activeCarry = this.carried;
    const activeThrow = this.throwAnim && !this.throwAnim.released ? this.throwAnim : null;

    if (activeCarry || activeThrow) {
      const p = g.player;
      const kind = activeCarry ? activeCarry.kind : activeThrow!.kind;
      const poseName = activeThrow
        ? (kind === 'pot' ? 'throw_pot' : 'throw_comp')
        : (kind === 'pot' ? 'carry_pot' : 'carry_comp');
      const poseT = activeThrow ? clamp(activeThrow.t / Math.max(0.01, activeThrow.dur), 0, 1) : 0.5;
      const sk = solvePose(g.playerStickOpts(poseName, poseT));
      const fh = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      const bh = { x: p.x + sk.bhand.x, y: p.y + sk.bhand.y - p.z };

      if (kind === 'pot') {
        // POT DIPEGANG 1 TANGAN (menempel di tangan pelempar fhand, miring mengikuti ayunan lengan!)
        const tilt = activeThrow ? -p.facing * 0.45 : -p.facing * 0.18;
        ctx.save();
        ctx.translate(fh.x + p.facing * 1.5, fh.y + 3.5);
        ctx.rotate(tilt);
        drawStaticProp(ctx, { kind: 'pot', x: 0, y: 0 }, false, g.time);
        ctx.restore();
        // Telapak tangan 1 menggenggam bibir pot, tangan 2 membidik di depan
        pcircle(ctx, fh.x, fh.y, 1.7, '#ffffff');
        if (!activeThrow) {
          // Garis bidik tipis dari tangan pembidik (bhand)
          pline(ctx, bh.x, bh.y, bh.x + Math.cos(p.aim) * 14, bh.y + Math.sin(p.aim) * 14, 'rgba(255,141,161,0.45)', 1);
          pfontO(ctx, '1-HAND POT  [LMB/Z: LEMPAR]', p.x, p.y - 31 - p.z, '#ff8da1', '#000', 1, 'center');
        }
      } else if (kind === 'computer') {
        // KOMPUTER DIANGKAT 2 TANGAN DI ATAS KEPALA (kedua telapak fhand & bhand memegang sisi kiri & kanan monitor!)
        const cx = (fh.x + bh.x) * 0.5;
        const cy = (fh.y + bh.y) * 0.5 + 4.5;
        const sway = clamp((p.vx || 0) / 90, -1, 1);
        this.drawHangingCable(ctx, cx - p.facing * 3, cy - 2, -p.facing * 0.4 - sway * 0.5, g.time);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(activeThrow ? -p.facing * 0.35 : p.facing * 0.06);
        drawStaticProp(ctx, { kind: 'computer', x: 0, y: 0 }, false, g.time);
        ctx.restore();
        // Kedua telapak tangan menggenggam sisi kiri & kanan komputer dengan tegas
        pcircle(ctx, fh.x, fh.y, 1.8, '#ffffff');
        pcircle(ctx, bh.x, bh.y, 1.8, '#ffffff');
        if (!activeThrow) {
          pfontO(ctx, '2-HAND PC  [LMB/Z: LEMPAR]', p.x, p.y - 34 - p.z, '#46e2ff', '#000', 1, 'center');
        }
      } else {
        // MEJA DIANGKAT 2 TANGAN
        const cx = (fh.x + bh.x) * 0.5;
        const cy = (fh.y + bh.y) * 0.5 + 3;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.12, 1.12);
        drawStaticProp(ctx, { kind: 'table', x: 0, y: 0 }, false, g.time);
        ctx.restore();
        pcircle(ctx, fh.x, fh.y, 1.7, '#ffffff');
        pcircle(ctx, bh.x, bh.y, 1.7, '#ffffff');
        if (!activeThrow) {
          pfontO(ctx, '2-HAND MEJA  [LMB/Z: LEMPAR]', p.x, p.y - 34 - p.z, '#ffd27f', '#000', 1, 'center');
        }
      }
    } else if (g.state === 'playing') {
      const pr = this.nearProp(g);
      if (pr) {
        const isComp = pr.kind === 'computer';
        const isPot = pr.kind === 'pot';
        const col = isComp ? '#46e2ff' : isPot ? '#ff8da1' : '#ffd27f';
        const label = isComp ? 'RMB/Z: ANGKAT PC (2 TGN)' : isPot ? 'RMB/Z: AMBIL POT (1 TGN)' : 'RMB/Z: ANGKAT MEJA';
        pring(ctx, pr.x, pr.y - 6, 12, col, 2);
        pcircle(ctx, pr.x, pr.y - 6, 2, '#ffffff');
        pline(ctx, g.player.x, g.player.y - 6, pr.x, pr.y - 6, col + '66', 1);
        prect(ctx, Math.round(pr.x - 48), Math.round(pr.y - 31), 96, 7, '#000000bb');
        pfontO(ctx, label, pr.x, pr.y - 30, col, '#000', 1, 'center');
      }
    }
    ctx.restore();
  }
}
