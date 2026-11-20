// RAGDOLL — tubuh musuh yang terlempar, membentur, memantul, lalu terkulai.
//
// Fisika memakai position-based dynamics: kecepatan disimpan eksplisit dalam px/detik,
// posisi diprediksi, constraint jarak + lantai + dinding diselesaikan, lalu kecepatan
// dihitung ulang dari perpindahan nyata. Jadi tumbukan otomatis mengubah momentum dan
// perilakunya tidak bergantung frame rate — tidak ada lagi tubuh yang terasa melayang.
//
// Sumbu: x/y = bidang lantai (top-down), z = ketinggian. Layar = (x, y - z).
import { pcircle, pellipse, pline, prect, px, type Ctx } from './pixel';

export interface RPoint {
  x: number; y: number; z: number;
  ox: number; oy: number; oz: number;
  vx: number; vy: number; vz: number;
  /** massa relatif — titik berat lebih susah digerakkan constraint */
  w: number;
  /** seretan udara per detik (kecil = terbang jauh) */
  drag: number;
  /** pantulan pribadi: ujung anggota badan lebih memantul daripada badan */
  bounce: number;
  grounded: boolean;
  hitSpeed: number;
}

export interface RBone { a: number; b: number; len: number; stiff: number }
export interface RagdollImpact { x: number; y: number; z: number; speed: number; kind: 'ground' | 'wall' }

const HEAD = 0, NECK = 1, HIP = 2, HAND_F = 3, HAND_B = 4, FOOT_F = 5, FOOT_B = 6;

/** Gravitasi tinggi = badan jatuh BERAT, bukan mengambang. */
const GRAV = 980;
/** Seretan vertikal nyaris nol supaya lintasannya parabola sungguhan. */
const AIR_Z = 0.12;
/** Gesekan lantai per detik — cukup licin untuk menyeret, cukup cepat untuk berhenti. */
const GROUND_FRICTION = 4.6;

export interface RagdollSkin {
  color: string; color2: string; scale: number;
  accessory: string; shades: number; eyeStyle: string;
}

export class Ragdoll {
  pts: RPoint[] = [];
  bones: RBone[] = [];
  skin: RagdollSkin;
  sideView: boolean;
  /** 'top' = kepala+dada+lengan, 'bot' = pinggang+kaki — untuk tubuh yang TERBELAH dua (Charged Heavy Guan Dao) */
  part: 'full' | 'top' | 'bot' = 'full';
  /** anggota yang PATAH (Charged Heavy nunchaku): sendinya digambar bengkok ekstrem & tulangnya lemas */
  bentPart: string | null = null;
  settled = false;
  restT = 0;
  age = 0;
  impacts: RagdollImpact[] = [];
  /** denyut gepeng saat membentur lantai — mengembalikan rasa "bugh" tiap pendaratan */
  squash = 0;
  private bendF: number;
  private bendB: number;
  private bendAF: number;
  private bendAB: number;
  bounces = 0;
  /** lompatan BADAN (bukan per sendi) — dipakai untuk melemahkan pantulan bertahap */
  hipHops = 0;
  syncVX = 0; syncVY = 0; syncVZ = 0; syncX = 0; syncY = 0;

  constructor(x: number, y: number, z: number, skin: RagdollSkin, seed = Math.random(), sideView = false) {
    this.skin = skin;
    this.sideView = sideView;
    this.bendF = seed < 0.5 ? 1 : -1;
    this.bendB = seed < 0.35 ? 1 : -1;
    this.bendAF = seed < 0.6 ? -1 : 1;
    this.bendAB = seed < 0.45 ? 1 : -1;
    const s = skin.scale;
    const mk = (dx: number, dy: number, dz: number, w: number, drag: number, bounce: number): RPoint => {
      const px0 = x + dx * s;
      const py0 = sideView ? y - dz * s : y + dy * s;
      const pz0 = sideView ? 0 : Math.max(0, z + dz * s);
      return {
        x: px0, y: py0, z: pz0,
        ox: px0, oy: py0, oz: pz0,
        vx: 0, vy: 0, vz: 0, w, drag, bounce, grounded: false, hitSpeed: 0,
      };
    };
    const spread = 0.7 + seed * 0.6;
    this.pts = [
      mk(-0.4, -0.6, 12.4, 0.85, 0.55, 0.46),  // kepala
      mk(0, 0, 8.6, 1.0, 0.34, 0.42),          // dada
      mk(0.6, 0.5, 4.4, 1.35, 0.26, 0.38),     // pinggul
      mk(4.6 * spread, 1.9, 8.2, 0.5, 0.95, 0.55),
      mk(-4.4 * spread, -1.7, 7.4, 0.5, 0.95, 0.55),
      mk(3.4 * spread, 2.4, 1.0, 0.65, 0.75, 0.48),
      mk(-3.6 * spread, -2.2, 1.0, 0.65, 0.75, 0.48),
    ];
    const B = (a: number, b: number, len: number, stiff = 1) => this.bones.push({ a, b, len: len * s, stiff });
    B(HEAD, NECK, 3.4, 1);
    B(NECK, HIP, 4.6, 1);
    B(NECK, HAND_F, 5.6, 0.9);
    B(NECK, HAND_B, 5.6, 0.9);
    B(HIP, FOOT_F, 5.8, 0.95);
    B(HIP, FOOT_B, 5.8, 0.95);
    B(HEAD, HIP, 7.8, 0.38);
    B(HAND_F, HAND_B, 10.2, 0.16);
    B(FOOT_F, FOOT_B, 8.0, 0.16);
  }

  /** Momentum awal: dorongan lurus + putaran poros melintang, jadi tubuh salto. */
  launch(vx: number, vy: number, vz: number, spin: number) {
    const hip = this.pts[HIP];
    if (this.sideView) {
      const clVx = Math.max(-460, Math.min(460, vx));
      const clUp = Math.max(40, Math.min(265, vz));
      const baseVy = Math.max(-280, Math.min(220, vy - clUp));
      for (const p of this.pts) {
        const ox = p.x - hip.x, oy = p.y - hip.y;
        const j = (Math.random() - 0.5) * 28;
        p.vx = clVx + oy * spin * 0.55 + j;
        p.vy = baseVy - ox * spin * 0.55;
        p.vz = 0;
        p.grounded = false;
      }
    } else {
      for (const p of this.pts) {
        const ox = p.x - hip.x, oz = p.z - hip.z;
        const j = (Math.random() - 0.5) * 34;
        p.vx = vx - oz * spin * 0.62 + j;
        p.vy = vy + j * 0.35;
        p.vz = vz + ox * spin * 0.62;
        p.grounded = false;
      }
    }
    this.settled = false; this.restT = 0; this.hipHops = 0;
  }

  /** Dorongan dari luar: ditendang pemain, ditabrak musuh, kena ledakan. */
  impulse(vx: number, vy: number, vz: number, spin = 0) {
    const hip = this.pts[HIP];
    if (this.sideView) {
      const dvy = Math.max(-220, Math.min(180, vy - Math.max(0, vz) * 0.75));
      for (const p of this.pts) {
        const ox = p.x - hip.x, oy = p.y - hip.y;
        p.vx = Math.max(-480, Math.min(480, p.vx + vx + oy * spin * 0.4));
        p.vy = Math.max(-300, Math.min(340, p.vy + dvy - ox * spin * 0.4));
        p.vz = 0;
      }
    } else {
      for (const p of this.pts) {
        const ox = p.x - hip.x, oz = p.z - hip.z;
        p.vx += vx - oz * spin * 0.5;
        p.vy += vy;
        p.vz += vz + ox * spin * 0.5;
      }
    }
    this.settled = false; this.restT = 0;
  }

  get x() { return this.pts[HIP].x; }
  get y() { return this.pts[HIP].y; }
  get z() { return this.pts[HIP].z; }
  get speed() { const h = this.pts[HIP]; return Math.hypot(h.vx, h.vy, h.vz); }

  translate(dx: number, dy: number) {
    for (const p of this.pts) { p.x += dx; p.y += dy; p.ox += dx; p.oy += dy; }
  }

  /** Pastikan titik sendi ragdoll tidak pernah terkurung di dalam tembok (mencegah ragdoll menancap di tembok!). */
  private unstickPoint(p: RPoint, solid: (x: number, y: number) => boolean, yOff: number, syncOld = false) {
    if (!solid(p.x, p.y - yOff)) return;
    const hip = this.pts[HIP];
    // 1) Jika pinggul berada di ruang bebas, tarik sendi ke arah pinggul dulu
    if (p !== hip && !solid(hip.x, hip.y - yOff)) {
      for (let k = 0.25; k <= 1.0; k += 0.25) {
        const nx = p.x + (hip.x - p.x) * k;
        const ny = p.y + (hip.y - p.y) * k;
        if (!solid(nx, ny - yOff)) {
          p.x = nx; p.y = ny;
          if (syncOld) { p.ox = nx; p.oy = ny; }
          return;
        }
      }
    }
    // 2) Di mode side-view, prioritaskan dorongan horizontal (kiri/kanan keluar dari tembok/pilar)
    if (this.sideView) {
      for (let ox = 2; ox <= 36; ox += 2) {
        for (const sgn of [-1, 1]) {
          if (!solid(p.x + sgn * ox, p.y - yOff)) {
            p.x += sgn * ox;
            if (syncOld) p.ox = p.x;
            return;
          }
        }
      }
    }
    // 3) Pencarian radial ke segala arah
    for (let rad = 2; rad <= 40; rad += 2) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const nx = p.x + Math.cos(a) * rad;
        const ny = p.y + Math.sin(a) * rad;
        if (!solid(nx, ny - yOff)) {
          p.x = nx; p.y = ny;
          if (syncOld) { p.ox = nx; p.oy = ny; }
          return;
        }
      }
    }
  }

  update(
    dt: number,
    solid: (x: number, y: number) => boolean,
    sideFloor?: (x: number, oy: number, ny: number) => number | null,
    onHitSolid?: (x: number, y: number, speed: number) => boolean,
  ) {
    this.age += dt;
    this.impacts.length = 0;
    this.squash = Math.max(0, this.squash - dt * 5.5);
    if (this.settled) return;
    const yOff = sideFloor ? 1.5 : 2;
    // Pastikan tidak ada titik yang memulai frame di dalam tembok (misal baru mati menempel tembok)
    for (const p of this.pts) {
      if (solid(p.x, p.y - yOff)) this.unstickPoint(p, solid, yOff, true);
    }
    const step = Math.min(dt, 1 / 30);
    const sub = 3;
    const h = step / sub;
    for (let s = 0; s < sub; s++) {
      // 1) prediksi posisi
      for (const p of this.pts) {
        p.ox = p.x; p.oy = p.y; p.oz = p.z;
        p.hitSpeed = 0;
        const d = Math.exp(-p.drag * h);
        if (sideFloor) {
          p.vy = Math.min(430, p.vy + GRAV * 0.72 * h);
          p.vx *= d;
          p.vy *= Math.exp(-AIR_Z * h);
          p.z = 0;
          // Simpan kecepatan jatuh NYATA sebelum constraint tulang (mencegah pantulan roket!)
          if (p.vy > 0) p.hitSpeed = p.vy;
        } else {
          p.vz -= GRAV * h;
          p.vx *= d; p.vy *= d;
          p.vz *= Math.exp(-AIR_Z * h);
        }
        p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
      }
      // 2) selesaikan constraint + tumbukan
      for (let it = 0; it < 4; it++) {
        for (const b of this.bones) {
          const a = this.pts[b.a], c = this.pts[b.b];
          const dx = c.x - a.x, dy = c.y - a.y, dz = c.z - a.z;
          const d = Math.hypot(dx, dy, dz) || 0.0001;
          const diff = ((d - b.len) / d) * b.stiff;
          const wa = a.w / (a.w + c.w), wc = 1 - wa;
          a.x += dx * diff * wa; a.y += dy * diff * wa; a.z += dz * diff * wa;
          c.x -= dx * diff * wc; c.y -= dy * diff * wc; c.z -= dz * diff * wc;
        }
        for (const p of this.pts) {
          if (sideFloor) {
            p.z = 0;
            // Selesaikan tabrakan TEMBOK terlebih dahulu sebelum cek lantai!
            if (solid(p.x, p.y - 1.5)) {
              const bx = p.x - p.ox, by = p.y - p.oy;
              const sp = Math.hypot(bx, by) / h;
              const brokeThrough = onHitSolid ? onHitSolid(p.x, p.y - 1.5, sp) : false;
              if (!brokeThrough || solid(p.x, p.y - 1.5)) {
                if (it === 0 && sp > 180) this.impacts.push({ x: p.x, y: p.y, z: 0, speed: Math.min(450, sp), kind: 'wall' });
                if (!solid(p.ox, p.y - 1.5)) {
                  const rebX = p.ox - bx * 0.32;
                  p.x = !solid(rebX, p.y - 1.5) ? rebX : p.ox;
                } else if (!solid(p.x, p.oy - 1.5)) {
                  p.y = p.oy;
                } else if (!solid(p.ox, p.oy - 1.5)) {
                  const rebX = p.ox - bx * 0.32;
                  p.x = !solid(rebX, p.oy - 1.5) ? rebX : p.ox;
                  p.y = p.oy;
                } else {
                  this.unstickPoint(p, solid, 1.5, true);
                }
              }
            }
            const fy = sideFloor(p.x, p.oy, p.y);
            if (fy !== null && p.y >= fy) {
              p.y = fy;
            }
          } else {
            if (p.z < 0) {
              // simpan kecepatan jatuh SEBELUM diproyeksikan supaya pantulannya bertenaga
              const fall = (p.oz - p.z) / h;
              if (fall > p.hitSpeed) p.hitSpeed = fall;
              p.z = 0;
            }
            if (solid(p.x, p.y - 2)) {
              const bx = p.x - p.ox, by = p.y - p.oy;
              const sp = Math.hypot(bx, by) / h;
              if (sp > 150) this.impacts.push({ x: p.x, y: p.y, z: p.z, speed: sp, kind: 'wall' });
              if (!solid(p.ox, p.oy - 2)) {
                p.x = p.ox; p.y = p.oy;
                const rx = p.x - bx * 0.35, ry = p.y - by * 0.35;
                if (!solid(rx, ry - 2)) { p.x = rx; p.y = ry; }
              } else {
                this.unstickPoint(p, solid, 2, true);
              }
            }
          }
        }
      }
      // 3) kecepatan dari perpindahan nyata, lalu pantulan + gesekan
      for (const p of this.pts) {
        p.vx = (p.x - p.ox) / h;
        p.vy = (p.y - p.oy) / h;
        p.vz = (p.z - p.oz) / h;
        if (sideFloor) {
          p.vx = Math.max(-500, Math.min(500, p.vx));
          p.vy = Math.max(-340, Math.min(450, p.vy));
          p.vz = 0;
          const fy = sideFloor(p.x, p.oy, p.y + 0.6);
          if (fy !== null && p.y >= fy - 0.6) {
            p.grounded = true;
            const impact = Math.min(450, p.hitSpeed);
            if (impact > 110 && this.bounces < 18) {
              this.bounces++;
              const decay = Math.max(0.35, 1 - this.hipHops * 0.22);
              p.vy = -Math.min(200, impact * p.bounce * 0.72 * decay);
              if (p === this.pts[HIP] || p === this.pts[NECK]) this.hipHops++;
              if (impact > 175) {
                this.impacts.push({ x: p.x, y: p.y, z: 0, speed: impact, kind: 'ground' });
                this.squash = Math.min(1, this.squash + impact / 900);
              }
            } else if (p.vy > 0) p.vy = 0;
            const f = Math.exp(-GROUND_FRICTION * h);
            p.vx *= f;
          } else p.grounded = false;
        } else if (p.z <= 0.02) {
          p.grounded = true;
          const impact = p.hitSpeed;
          if (impact > 90 && this.bounces < 34) {
            this.bounces++;
            // makin sering memantul makin mati — tapi pantulan pertama benar-benar terasa
            // pelemahan mengikuti lompatan badan, jadi tubuh masih sempat memantul 2-4 kali
            const decay = Math.max(0.42, 1 - this.hipHops * 0.17);
            p.vz = impact * p.bounce * decay;
            if (p === this.pts[HIP] || p === this.pts[NECK]) this.hipHops++;
            // energi jatuh sebagian jadi luncuran mendatar: inilah rasa "mental"
            const dir = Math.hypot(p.vx, p.vy) > 12 ? Math.atan2(p.vy, p.vx) : Math.random() * Math.PI * 2;
            const skid = impact * 0.16;
            p.vx += Math.cos(dir) * skid;
            p.vy += Math.sin(dir) * skid * 0.7;
            if (impact > 170) {
              this.impacts.push({ x: p.x, y: p.y, z: 0, speed: impact, kind: 'ground' });
              this.squash = Math.min(1, this.squash + impact / 900);
            }
          } else if (p.vz < 0) p.vz = 0;
          const f = Math.exp(-GROUND_FRICTION * h);
          p.vx *= f; p.vy *= f;
        } else p.grounded = false;
      }
    }
    // tidur kalau sudah tenang DAN sudah mendarat di lantai — mencegah ragdoll membeku menggantung di tembok/udara!
    let energy = 0;
    for (const p of this.pts) energy += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vz);
    const bodyGrounded = !sideFloor || this.pts[HIP].grounded || this.pts[NECK].grounded || this.age > 3.5;
    if (energy < 26 && bodyGrounded) { this.restT += dt; if (this.restT > 0.28) this.settled = true; }
    else this.restT = 0;
  }

  private joint(a: RPoint, b: RPoint, side: number, amount: number) {
    const ax = a.x, ay = a.y - a.z, bx = b.x, by = b.y - b.z;
    const dx = bx - ax, dy = by - ay;
    const d = Math.hypot(dx, dy) || 1;
    const slack = Math.max(0, 1 - d / (5.6 * this.skin.scale));
    const off = (0.9 + slack * 2.4) * amount * this.skin.scale * side;
    return { x: (ax + bx) / 2 - (dy / d) * off, y: (ay + by) / 2 + (dx / d) * off };
  }

  draw(ctx: Ctx, alpha = 1) {
    const P = this.pts, sk = this.skin, s = sk.scale;
    // gepeng sesaat saat membentur lantai, dipusatkan di pinggul
    const sq = this.squash;
    const hipZ = P[HIP].z;
    const S = (p: RPoint) => ({ x: p.x, y: p.y - (hipZ + (p.z - hipZ) * (1 - sq * 0.45)) });
    const head = S(P[HEAD]), neck = S(P[NECK]), hip = S(P[HIP]);
    const hf = S(P[HAND_F]), hb = S(P[HAND_B]), ff = S(P[FOOT_F]), fb = S(P[FOOT_B]);
    // anggota yang patah menekuk jauh melampaui batas sendi normal (bengkok ekstrem permanen)
    const bentMul = (part: string) => (this.bentPart === part ? 3.4 : 1);
    const ef = this.joint(P[NECK], P[HAND_F], this.bendAF, 0.85 * bentMul('farm'));
    const eb = this.joint(P[NECK], P[HAND_B], this.bendAB, 0.85 * bentMul('barm'));
    const kf = this.joint(P[HIP], P[FOOT_F], this.bendF, 1 * bentMul('fleg'));
    const kb = this.joint(P[HIP], P[FOOT_B], this.bendB, 1 * bentMul('bleg'));
    const allSegs: [{ x: number; y: number }, { x: number; y: number }][] = [
      [hip, kb], [kb, fb], [hip, kf], [kf, ff],
      [hip, neck], [neck, eb], [eb, hb], [neck, ef], [ef, hf],
    ];
    // tubuh terbelah: potongan atas hanya menggambar dada/lengan, potongan bawah hanya kaki
    const segs = this.part === 'top' ? allSegs.slice(4) : this.part === 'bot' ? allSegs.slice(0, 4) : allSegs;
    const lw = s >= 1.4 ? 3 : 2;
    const hr = Math.max(2, Math.round(3 * s));
    ctx.globalAlpha = alpha;
    for (const [a, b] of segs) pline(ctx, a.x, a.y, b.x, b.y, '#000', lw + 2);
    if (this.part !== 'bot') pcircle(ctx, head.x, head.y, hr + 1, '#000');
    for (const [a, b] of segs) pline(ctx, a.x, a.y, b.x, b.y, sk.color, lw);
    if (this.part !== 'bot') pcircle(ctx, head.x, head.y, hr, sk.color);
    for (const t of this.part === 'bot' ? [] : [hf, hb]) pcircle(ctx, t.x, t.y, 1.1 * s, sk.color);
    for (const t of this.part === 'top' ? [] : [ff, fb]) pcircle(ctx, t.x, t.y, 1.1 * s, sk.color);
    if (this.part === 'bot') { ctx.globalAlpha = 1; return; }

    const ang = Math.atan2(head.y - neck.y, head.x - neck.x);
    const up = { x: Math.cos(ang), y: Math.sin(ang) };
    switch (sk.accessory) {
      case 'hood': pcircle(ctx, head.x, head.y, hr, sk.color2); px(ctx, head.x + up.x * (hr + 1), head.y + up.y * (hr + 1), sk.color2); break;
      case 'helmet': pellipse(ctx, head.x + up.x * 1.1, head.y + up.y * 1.1, hr, hr * 0.62, sk.color2); break;
      case 'mask': pellipse(ctx, head.x - up.x * 1.1, head.y - up.y * 1.1, hr * 0.9, hr * 0.55, sk.color2); break;
      case 'band': pline(ctx, head.x - hr * 0.9 + up.x, head.y - hr * 0.9 + up.y, head.x + hr * 0.9 + up.x, head.y + hr * 0.9 + up.y, sk.color2, 1); break;
      case 'horns':
        pline(ctx, head.x - hr, head.y - hr + 1, head.x - hr - 2, head.y - hr - 2, sk.color2, 1);
        pline(ctx, head.x + hr, head.y - hr + 1, head.x + hr + 2, head.y - hr - 2, sk.color2, 1);
        break;
      case 'crown':
        for (let i = -1; i <= 1; i++) prect(ctx, head.x + i * 2 - 0.5, head.y - hr - 2, 1, 2, '#ffd700');
        break;
    }
    const ex = head.x - up.x * 1.1, ey = head.y - up.y * 1.1;
    if (sk.accessory === 'shades' && sk.shades < 2) {
      const pxp = -up.y, pyp = up.x;
      for (const sg of [-1, 1]) {
        pellipse(ctx, ex + pxp * sg * 1.6 * s, ey + pyp * sg * 1.6 * s, 1.5 * s, 1.3 * s, '#000');
        pellipse(ctx, ex + pxp * sg * 1.6 * s, ey + pyp * sg * 1.6 * s, 1.1 * s, 0.95 * s, '#101017');
      }
      if (sk.shades >= 1) px(ctx, ex - 1, ey, '#dff6ff');
    } else {
      const u = Math.max(1, Math.round(s));
      const pxp = -up.y, pyp = up.x;
      const col = sk.eyeStyle === 'white' ? '#ffffff' : '#101010';
      for (const sg of [-1, 1]) {
        const cx = ex + pxp * sg * 2 * s, cy = ey + pyp * sg * 2 * s;
        for (let i = -1; i <= 1; i++) {
          prect(ctx, Math.round(cx + i * u), Math.round(cy + i * u * 0.85), u, u, col);
          prect(ctx, Math.round(cx + i * u), Math.round(cy - i * u * 0.85), u, u, col);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
