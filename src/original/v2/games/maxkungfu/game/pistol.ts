import { drawPistol } from './guns';
import type { Pose } from './types';

/**
 * PISTOL — TEMPO, MOMENTUM & ATRAKSI (Mode V2 Kantor).
 *
 * Menggantikan tembakan semprotan & freestyle lama khusus pistol (rifle tidak berubah):
 *  - Tembakan BERIRAMA: burst 2-3 tembakan berjeda 0,08-0,15 dtk, lalu jeda mikro. Easing di
 *    mana-mana: windup singkat, melambat saat berganti arah, cepat tepat di titik tembak.
 *  - Recoil RINGAN: lengan & badan ikut terlempar halus (recoil 0,55 + dorongan kecil), pulih cepat.
 *  - ATRAKSI (flourish) 4 gaya berganti-ganti sebagai pembuka / pengisi jeda kombo, bisa di-cancel:
 *    (a) pistol spin di jari, (b) toss & catch, (c) pindah tangan lewat belakang punggung,
 *    (d) putar badan sambil menarik pistol.
 *  - KLIK KANAN: sengaja TIDAK diubah — tetap sistem freestyle lama (startGunFreestyle):
 *    salto / combat roll / slip fire / slide fire / aerial burst / last stand / fan fire
 *    sesuai situasi. Sistem baru di sini hanya mengatur klik kiri, atraksi & kombo udara.
 *  - KOMBO UDARA (LMB di udara): pistol-whip uppercut mengangkat musuh -> melompat berputar
 *    sambil menembak 2-3x -> hantaman pistol miring ke bawah membanting musuh ke lantai.
 *  - TRANSISI: flourish -> tembak -> pistol-whip -> putar badan -> tembakan finisher (mundur /
 *    sasaran melayang / putaran 360). Tiap hit memberi hit-stagger ringan; efek visual hanya
 *    muzzle flash singkat; tembakan finisher yang kena memicu slow-motion mikro 0,1 detik.
 */
type G = any;
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeInOut = (u: number) => u * u * (3 - 2 * u);
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

export type FlourishKind = 'spin' | 'toss' | 'back' | 'draw' | 'rev' | 'under';
const FLOURISH_ORDER: FlourishKind[] = ['spin', 'toss', 'back', 'draw', 'rev', 'under'];

interface Act {
  kind: 'burst' | 'whip' | 'spinburst' | 'finisher' | 'orbit' | 'aerial' | 'crossback' | 'slideshot' | 'tossup' | 'airburst' | 'gunfu' | 'crossneck';
  t: number; dur: number;
  shots: number[]; fired: number;
  hitDone: boolean;
  targetId: number;
  phase: number;
  label: string;
}

export class PistolStyle {
  flourish: { kind: FlourishKind; t: number; dur: number } | null = null;
  private flourishIdx = 0;
  private flourishCd = 0;
  private idleT = 0;
  private act: Act | null = null;
  private flowStep = 0;
  private flowResetT = 0;
  private bufferedFlow = false;
  private pendingBurst = false;
  private burstReadyAt = 0;
  private lastActEnd = -9;
  private finWatch: { e: any; hp: number; t: number } | null = null;
  private time = 0;
  /** SALTO KE BELAKANG: melompat berlawanan arah hadap -> badan berputar 360 ke belakang */
  private flip: { t: number; dur: number; dir: number } | null = null;
  private wasAir = false;
  private slideSide = 1;
  /** jejak waktu klik kiri untuk mendeteksi SPAM -> memicu kombinasi Gun-Fu / Cross-Body */
  private clickStamps: number[] = [];
  private fuAlt = true;

  reset() {
    this.flourish = null; this.act = null; this.flowStep = 0; this.bufferedFlow = false;
    this.pendingBurst = false; this.finWatch = null; this.idleT = 0;
  }
  get busy() { return !!this.act; }

  /** atraksi pembuka / pengisi jeda — berganti-ganti berurutan supaya tidak monoton */
  startFlourish() {
    const kind = FLOURISH_ORDER[this.flourishIdx++ % FLOURISH_ORDER.length];
    this.flourish = { kind, t: 0, dur: kind === 'toss' ? 0.62 : kind === 'draw' ? 0.58 : 0.72 };
    this.flourishCd = 2.1;
  }

  /** sudut putaran pistol di jari (dipakai renderer lewat opts.gunSpin) */
  gunSpinAngle(g: G): number {
    const f = this.flourish, p = g.player;
    // CROSS-BODY: laras diarahkan ke musuh di samping/belakang lewat sudut relatif terhadap
    // arah hadap badan — badan pemain sendiri TIDAK ikut berputar.
    if (this.act?.kind === 'crossneck') {
      const t = this.targetOf(g, this.act.targetId);
      if (t) {
        const want = Math.atan2(t.y - t.z - 6 - (p.y - p.z - 7), t.x - p.x);
        let d = want - p.aim;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        return d;
      }
    }
    // tembakan dari belakang punggung: pistol berputar sekali di belakang sebelum menembak
    if (this.act?.kind === 'crossback') {
      const u = clamp(this.act.t / 0.3, 0, 1);
      return easeInOut(u) * TAU * (p.facing || 1);
    }
    if (!f) return 0;
    const u = clamp(f.t / f.dur, 0, 1);
    const turns = f.kind === 'spin' ? 2 : f.kind === 'toss' ? 3 : f.kind === 'back' ? 1 : f.kind === 'rev' ? -2 : f.kind === 'under' ? 2 : 0;
    return easeInOut(u) * TAU * turns * (p.facing || 1);
  }
  /** true saat pistol sedang melayang di udara (toss / tossup) — pistol di tangan disembunyikan sesaat */
  tossAirborne(): boolean {
    const f = this.flourish;
    if (f?.kind === 'toss') { const u = f.t / f.dur; return u > 0.18 && u < 0.82; }
    if (this.act?.kind === 'tossup') { const u = this.act.t / this.act.dur; return u > 0.1 && u < 0.62; }
    return false;
  }
  /** titik dunia untuk tangan: operan belakang punggung & putaran bawah lengan (underarm) */
  handPos(g: G): { x: number; y: number } | null {
    const p = g.player;
    // CROSS-BODY / BEHIND-THE-NECK: tangan menyilang ke belakang leher — badan tetap menghadap depan
    if (this.act?.kind === 'crossneck') return { x: p.x - p.facing * 5, y: p.y - 19 - p.z };
    if (this.act?.kind === 'crossback' && this.act.t < 0.3) return { x: p.x - p.facing * 7.5, y: p.y - 11 - p.z };
    const f = this.flourish;
    if (!f) return null;
    const u = f.t / f.dur;
    if (f.kind === 'back') {
      if (u < 0.2 || u > 0.85) return null;
      return { x: p.x - p.facing * 7.5, y: p.y - 11 - p.z };
    }
    if (f.kind === 'under') {
      if (u < 0.15 || u > 0.85) return null;
      return { x: p.x + p.facing * 3, y: p.y - 5 - p.z }; // berputar rendah di bawah lengan
    }
    return null;
  }

  poseOverride(): { pose: Pose; t: number } | null {
    // salto ke belakang: badan berputar penuh mengikuti arah lompatan
    if (this.flip && !this.act) return { pose: 'spin', t: clamp(this.flip.t / this.flip.dur, 0, 1) };
    const f = this.flourish;
    if (f) {
      const u = clamp(f.t / f.dur, 0, 1);
      if (f.kind === 'draw') return { pose: 'spinback', t: u };
      return { pose: 'gun_twirl', t: u };
    }
    const a = this.act;
    if (!a) return null;
    const u = clamp(a.t / a.dur, 0, 1);
    switch (a.kind) {
      case 'gunfu':
        // koreografi Gun-Fu: pukul popor > tembak point-blank > sapuan kaki > tembak penutup
        return a.t < 0.2 ? { pose: 'hook', t: easeOut(clamp(a.t / 0.2, 0, 1)) }
          : a.t < 0.42 ? { pose: 'shoot', t: 0.5 }
          : a.t < 0.62 ? { pose: 'sweep', t: clamp((a.t - 0.42) / 0.2, 0, 1) }
          : { pose: 'shoot', t: 0.6 };
      case 'crossneck': return { pose: 'shoot', t: 0.45 };
      case 'whip': return { pose: 'hook', t: easeOut(u) };
      case 'aerial':
        if (a.phase === 1) return { pose: 'uppercut', t: easeOut(u) };
        if (a.phase === 2) return { pose: 'spin', t: u };
        return { pose: 'hammer', t: easeOut(u) };
      default: return { pose: 'shoot', t: u };
    }
  }
  /** putaran badan 360 (dipakai renderer lewat guns.spinA) */
  private bodySpin(): number {
    // salto ke belakang mendominasi putaran badan selama berlangsung
    if (this.flip) return this.flip.dir * TAU * easeInOut(clamp(this.flip.t / this.flip.dur, 0, 1));
    const a = this.act;
    if (!a) return 0;
    const u = clamp(a.t / a.dur, 0, 1);
    if (a.kind === 'spinburst') return easeInOut(u) * TAU;
    if (a.kind === 'orbit' && a.t > 0.88) return easeInOut(clamp((a.t - 0.88) / 0.3, 0, 1)) * TAU;
    if (a.kind === 'aerial' && a.phase === 2) return easeInOut(u) * TAU;
    if (this.flourish?.kind === 'draw') return easeInOut(clamp(this.flourish.t / this.flourish.dur, 0, 1)) * TAU;
    return 0;
  }

  // ------------------------------------------------------------------ tembakan
  /** satu tembakan pistol ringan: muzzle flash singkat saja, recoil halus, tanpa efek berlebihan.
   *  `angle` = arah tembak eksplisit (Cross-Body Shot: menembak ke samping/belakang TANPA memutar badan). */
  private shot(g: G, dmgMul = 1, kbMul = 1, finisher = false, angle?: number): boolean {
    const p = g.player;
    if (p.ammoP <= 0) {
      // sama seperti sistem lama: peluru habis = kembali bertarung dengan tangan kosong
      g.sfx.empty();
      g.texts.add(p.x, p.y - 22, 'EMPTY! FISTS!', '#ff3b3b', 1, 0.7);
      g.setWeapon('fist');
      return false;
    }
    p.ammoP--;
    const a = angle !== undefined ? angle : p.aim + (Math.random() * 0.024 - 0.012);
    // moncong untuk tembakan menyilang dihitung dari posisi tangan di belakang leher
    const m = angle !== undefined
      ? (() => { const hp = this.handPos(g) ?? g.gunMuzzle(); return { x: hp.x + Math.cos(a) * 8, y: hp.y + Math.sin(a) * 5 }; })()
      : g.gunMuzzle();
    g.bullets.push({
      x: m.x, y: m.y, px: m.x, py: m.y, vx: Math.cos(a) * 1150, vy: Math.sin(a) * 1150, r: 2,
      dmg: (4 + g.stats.bulletDmg) * dmgMul, owner: 'player', life: 1.2, color: '#fff6c8',
      pierce: g.stats.pierce, bounce: g.stats.bounce, kind: 'pistol', hitIds: [], structure: 10, kb: 90 * kbMul,
    });
    p.muzzleMax = 0.06; p.muzzle = p.muzzleMax; p.muzzleX = m.x; p.muzzleY = m.y; p.muzzleA = a;
    // recoil ringan: lengan & badan terlempar halus lalu pulih (bukan hentakan berlebihan)
    p.recoil = 0.55; p.shootT = 0.1;
    p.kx -= Math.cos(a) * 13; p.ky -= Math.sin(a) * 13;
    g.camKick.x -= Math.cos(a) * 3.5; g.camKick.y -= Math.sin(a) * 3.5;
    g.sfx.shot('pistol', Math.cos(a)); g.sfx.casing();
    if (finisher) {
      const t = g.nearestEnemy?.(p.x, p.y, 320, a, 0.7);
      if (t) this.finWatch = { e: t, hp: t.hp, t: 0.25 };
    }
    return true;
  }

  private aimAt(g: G, e: any) {
    const p = g.player;
    if (!e || e.dead) return;
    const a = Math.atan2(e.y - e.z - 6 - (p.y - p.z - 7), e.x - p.x);
    p.aim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1;
  }
  private targetOf(g: G, id: number) {
    return id >= 0 ? g.enemies.find((e: any) => e.id === id && !e.dead) : undefined;
  }

  private startAct(kind: Act['kind']) {
    const base: Act = { kind, t: 0, dur: 0.4, shots: [], fired: 0, hitDone: false, targetId: -1, phase: 0, label: '' };
    switch (kind) {
      case 'burst': base.dur = 0.44; base.shots = [0.07, 0.18, 0.31]; break; // jeda 0,11 & 0,13 dtk
      case 'whip': base.dur = 0.36; break;
      case 'spinburst': base.dur = 0.58; base.shots = [0.2, 0.4]; break;
      case 'finisher': base.dur = 0.42; base.shots = [0.15]; break;
      case 'orbit': base.dur = 1.22; base.shots = [0.15, 0.45, 0.75, 1.04]; break;
      case 'aerial': base.dur = 0.32; base.phase = 1; break;
      case 'crossback': base.dur = 0.58; base.shots = [0.34, 0.46]; break; // pistol berputar di belakang punggung, lalu menembak
      case 'slideshot': base.dur = 0.5; base.shots = [0.08, 0.22]; break; // menembak sambil meluncur ke samping
      case 'tossup': base.dur = 0.62; base.shots = [0.44, 0.53]; break; // lempar pistol ke atas, tangkap, tembak
      case 'airburst': base.dur = 0.3; base.shots = [0.03, 0.13]; break; // menembak bebas selagi melompat / salto
      case 'gunfu': base.dur = 0.78; base.shots = [0.12, 0.3, 0.48, 0.64]; break; // pukul > tembak dekat > sapu kaki > tembak
      case 'crossneck': base.dur = 0.52; base.shots = [0.22, 0.37]; break; // dua tembakan menyilang ke samping/belakang
    }
    this.act = base;
    this.flourish = null;
  }
  /** rantai transisi kombo: burst > whip > tembak belakang punggung > putar badan > meluncur > lempar-tangkap > finisher */
  private static FLOW: Act['kind'][] = ['burst', 'whip', 'crossback', 'spinburst', 'slideshot', 'tossup', 'finisher'];
  private startFlow(g: G) {
    const kinds = PistolStyle.FLOW;
    this.startAct(kinds[this.flowStep % kinds.length]);
    if (this.act?.kind === 'finisher') {
      // variasi finisher: sasaran melayang di udara? pemain mundur? putaran sudah termasuk di spinburst
      const p = g.player;
      const t = g.nearestEnemy?.(p.x, p.y, 320, p.aim, 0.9);
      this.act.label = t && (t.z > 3 || t.state === 'air') ? 'AERIAL FINISHER!' : 'FINISHER SHOT!';
      if (this.act.label) g.say?.(this.act.label, '#ffd27f', 2, 0.6);
    }
  }

  /** catat klik kiri; spam = 3+ klik dalam 1 detik -> kombinasi Gun-Fu / Cross-Body terbuka */
  private registerClick() {
    this.clickStamps.push(this.time);
    this.clickStamps = this.clickStamps.filter((t) => this.time - t < 1.0);
  }
  private get spamming() { return this.clickStamps.length >= 3; }

  /** musuh di sektor SAMPING / BELAKANG relatif arah hadap — sasaran Cross-Body Shot */
  private findCrossTarget(g: G): any | null {
    const p = g.player;
    let best: any = null, bd = 100;
    for (const e of g.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 100) continue;
      let diff = Math.atan2(e.y - p.y, e.x - p.x) - p.aim;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 1.15) continue; // sektor depan diurus tembakan biasa
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  /** GUN-FU: koreografi bela diri + tembakan jarak dekat ala John Wick / Madness Combat */
  private startGunfu(g: G, target: any) {
    const p = g.player;
    this.startAct('gunfu');
    if (this.act) this.act.targetId = target.id;
    const a = Math.atan2(target.y - p.y, target.x - p.x);
    p.kx += Math.cos(a) * 130;
    if (!g.level?.sideView) p.ky += Math.sin(a) * 130;
    g.say?.('GUN-FU!', '#ffd27f', 2, 0.7);
    g.sfx?.whoosh?.();
  }

  /** CROSS-BODY / BEHIND-THE-NECK SHOT: lengan menyilang ke belakang kepala menembak musuh
   *  di samping/belakang — SELURUH BADAN tetap menghadap ke depan, tidak ikut berputar. */
  private startCrossneck(g: G, target: any) {
    const p = g.player;
    this.startAct('crossneck');
    if (this.act) this.act.targetId = target.id;
    let diff = Math.atan2(target.y - p.y, target.x - p.x) - p.aim;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.say?.(Math.abs(diff) > 2.3 ? 'BEHIND-THE-NECK SHOT!' : 'CROSS-BODY SHOT!', '#ffd27f', 2, 0.7);
    g.sfx?.whoosh?.();
  }

  // ------------------------------------------------------------------ update
  update(g: G, dt: number) {
    const p = g.player, inp = g.input;
    if (p.weapon !== 'pistol') { this.act = null; this.flourish = null; return; }
    this.time += dt;
    this.flourishCd = Math.max(0, this.flourishCd - dt);
    if (this.flowResetT > 0) { this.flowResetT -= dt; if (this.flowResetT <= 0) this.flowStep = 0; }

    // slow-motion mikro 0,1 dtk saat tembakan finisher benar-benar mengenai musuh
    if (this.finWatch) {
      const w = this.finWatch;
      w.t -= dt;
      if (w.e.dead || w.e.hp < w.hp) { g.slow?.(0.1, 0.35); this.finWatch = null; }
      else if (w.t <= 0) this.finWatch = null;
    }

    // FREESTYLE LAMA (klik kanan) sedang berjalan: serahkan kendali ke sistem lamanya —
    // jangan menimpa spin badan, pose, atau tembakannya.
    if (g.guns.trick) return;
    g.guns.spinA = this.bodySpin();

    const locked = g.state !== 'playing' || p.fatality || p.stunT > 0 || p.holdT > 0;
    if (locked) { this.act = null; this.flourish = null; this.flip = null; g.guns.spinA = 0; return; }

    // ---- SALTO KE BELAKANG (BACKFLIP) ----
    // Melompat ke arah yang BERLAWANAN dengan arah hadap/tembak: hadap kanan + lompat kiri =
    // salto ke belakang ke kiri; hadap kiri + lompat kanan = salto ke belakang ke kanan.
    const rising = g.level?.sideView ? (p.svVy ?? 0) < -60 : p.vz > 60;
    if (!this.wasAir && p.airborne && rising && !this.flip) {
      const ix = ((inp.key('d') || inp.key('arrowright')) ? 1 : 0) - ((inp.key('a') || inp.key('arrowleft')) ? 1 : 0);
      const jx = ix !== 0 ? ix : Math.sign(p.vx + p.kx);
      if (jx !== 0 && jx === -(p.facing || 1)) {
        this.flip = { t: 0, dur: 0.55, dir: jx };
        p.kx += jx * 55;
        g.sfx?.whoosh?.();
      }
    }
    this.wasAir = p.airborne;
    if (this.flip) { this.flip.t += dt; if (this.flip.t >= this.flip.dur) this.flip = null; }

    // ---------- input ----------
    if (inp.mouse.pressed) {
      this.registerClick();
      if (this.flourish) { // atraksi bisa di-cancel langsung ke serangan
        this.flourish = null; this.pendingBurst = false;
        if (!this.act && !p.airborne) this.startFlow(g);
        else if (!this.act && p.airborne) this.startAct(this.flip ? 'airburst' : 'aerial');
      } else if (this.act) {
        if (this.act.t > this.act.dur * 0.35) this.bufferedFlow = true;
      } else if (p.airborne) {
        if (this.flip) this.startAct('airburst'); // menembak bebas di tengah salto ke belakang
        else this.startAct('aerial'); // KOMBO UDARA
      } else if (this.spamming) {
        // SPAM KLIK -> kombinasi Gun-Fu & Cross-Body / Behind-the-Neck bergantian
        const ct = this.findCrossTarget(g);
        const near = g.nearestEnemy?.(p.x, p.y, 48, p.aim, Math.PI);
        if (ct && this.fuAlt) { this.fuAlt = false; this.startCrossneck(g, ct); }
        else if (near) { this.fuAlt = true; this.startGunfu(g, near); }
        else if (ct) { this.startCrossneck(g, ct); }
        else this.startFlow(g);
      } else if (this.time >= this.burstReadyAt) {
        // pembuka: bila baru diam agak lama, awali dengan atraksi singkat lalu tembak
        if (this.flowStep === 0 && this.idleT > 1.1 && this.flourishCd <= 0) { this.startFlourish(); this.pendingBurst = true; }
        else this.startFlow(g);
      }
    }
    if (inp.mouse.rpressed && !this.act && p.attackPhase === 'none' && p.stunT <= 0 && g.guns.cd <= 0) {
      // KLIK KANAN PISTOL = SISTEM LAMA (sesuai permintaan): freestyle situasional —
      // salto, combat roll, slip fire, slide fire, aerial burst, last stand, fan fire.
      this.flourish = null; this.pendingBurst = false;
      g.startGunFreestyle();
    }
    // menahan LMB: burst berikutnya menyusul setelah jeda mikro (berirama, bukan semprotan)
    if (!this.act && !this.flourish && inp.mouse.down && !p.airborne && this.time >= this.burstReadyAt && g.state === 'playing') {
      this.startFlow(g);
    }
    // menembak sambil MELOMPAT: tahan LMB di udara untuk tembakan bebas berirama di udara
    if (!this.act && !this.flourish && inp.mouse.down && p.airborne && this.time >= this.burstReadyAt && g.state === 'playing') {
      this.startAct('airburst');
    }

    // ---------- atraksi ----------
    if (this.flourish) {
      this.flourish.t += dt;
      if (this.flourish.t >= this.flourish.dur) {
        this.flourish = null;
        if (this.pendingBurst) { this.pendingBurst = false; this.startFlow(g); }
      }
    } else if (!this.act) {
      const sinceAct = this.time - this.lastActEnd;
      if (p.attackPhase === 'none' && !p.airborne) {
        if (!p.moving) {
          this.idleT += dt;
          if (this.flourishCd <= 0 && this.idleT > 1.6) this.startFlourish(); // atraksi diam
        } else this.idleT = 0;
        // pengisi jeda kombo: atraksi singkat walau sambil jalan — alur tak pernah kaku
        if (this.flourishCd <= 0 && sinceAct < 1.0 && sinceAct > 0.25) this.startFlourish();
      }
    }

    // ---------- aksi berjalan ----------
    const a = this.act;
    if (!a) return;
    a.t += dt;
    const fireShots = (dmgMul = 1, kbMul = 1, finisher = false) => {
      while (a.fired < a.shots.length && a.t >= a.shots[a.fired]) {
        a.fired++;
        if (!this.shot(g, dmgMul, kbMul, finisher)) { a.fired = a.shots.length; }
      }
    };
    switch (a.kind) {
      case 'burst': fireShots(1, 1); break;
      case 'whip': {
        if (!a.hitDone && a.t >= 0.15) {
          a.hitDone = true;
          const t = g.nearestEnemy?.(p.x, p.y, 30, p.aim, 1.25);
          if (t) { g.damageEnemy(t, 7, 26, p.aim, 330, { melee: true, hitstop: 0.04, shake: 0.25 }); g.sfx.hit(); }
          else g.sfx.whoosh();
        }
        break;
      }
      case 'spinburst': fireShots(1, 1); break;
      case 'finisher': fireShots(1.8, 1.6, true); break;
      case 'crossback': fireShots(1, 1); break; // dari belakang punggung langsung menembak
      case 'slideshot': {
        // meluncur ke samping (arah bergantian) sambil menembak
        if (!a.hitDone) {
          a.hitDone = true;
          this.slideSide *= -1;
          if (g.level?.sideView) p.kx += this.slideSide * 235;
          else { p.kx += -Math.sin(p.aim) * this.slideSide * 235; p.ky += Math.cos(p.aim) * this.slideSide * 235; }
        }
        fireShots(1, 1);
        break;
      }
      case 'tossup': fireShots(1.15, 1.1); break; // tangkap pistol yang dilempar, langsung menembak
      case 'airburst': fireShots(1, 1); break;
      case 'gunfu': {
        // GUN-FU jarak dekat: tubuh menempel ke musuh selama koreografi berlangsung
        const t = this.targetOf(g, a.targetId) ?? g.nearestEnemy?.(p.x, p.y, 54, p.aim, Math.PI);
        if (t) {
          a.targetId = t.id;
          const ang = Math.atan2(t.y - p.y, t.x - p.x);
          const dd = Math.hypot(t.x - p.x, t.y - p.y);
          if (dd > 24) { p.kx += Math.cos(ang) * 55; if (!g.level?.sideView) p.ky += Math.sin(ang) * 55; }
          while (a.fired < a.shots.length && a.t >= a.shots[a.fired]) {
            const step = a.fired++;
            if (step === 0) { g.damageEnemy(t, 6, 24, ang, 240, { melee: true, hitstop: 0.04, shake: 0.2 }); g.sfx.hit(); } // hantaman popor
            else if (step === 1) { this.aimAt(g, t); this.shot(g, 1.1, 0.8); g.damageEnemy(t, 3, 18, ang, 120, { melee: true, hitstop: 0.03, shake: 0.15 }); } // tembakan point-blank
            else if (step === 2) { g.damageEnemy(t, 5, 26, ang, 300, { melee: true, knockdown: true, hitstop: 0.04, shake: 0.25 }); g.sfx.kick(); } // sapuan kaki
            else { this.aimAt(g, t); this.shot(g, 1.3, 1.2); } // tembakan penutup
          }
        }
        break;
      }
      case 'crossneck': {
        // menembak ke samping/belakang dari belakang leher — aim & hadap badan TIDAK berubah
        const t = this.targetOf(g, a.targetId);
        while (a.fired < a.shots.length && a.t >= a.shots[a.fired]) {
          a.fired++;
          if (t) {
            const ang = Math.atan2(t.y - t.z - 6 - (p.y - p.z - 7), t.x - p.x);
            this.shot(g, 1.05, 1, false, ang);
          } else this.shot(g);
        }
        break;
      }
      case 'orbit': {
        const t = this.targetOf(g, a.targetId) ?? g.nearestEnemy?.(p.x, p.y, 130, p.aim, Math.PI);
        if (t) {
          a.targetId = t.id;
          this.aimAt(g, t);
          // strafe melingkar mengelilingi musuh + tembak sambil meluncur ke samping di awal
          const ang = Math.atan2(p.y - t.y, p.x - t.x);
          const tx = -Math.sin(ang), ty = Math.cos(ang);
          const side = g.level?.sideView;
          if (side) { p.vx = tx >= 0 ? 195 : -195; }
          else {
            const radial = clamp((Math.hypot(p.x - t.x, p.y - t.y) - 36) * 4, -90, 90);
            p.vx = tx * 200 + Math.cos(ang) * radial;
            p.vy = ty * 200 + Math.sin(ang) * radial;
          }
          if (a.t < 0.1 && !a.hitDone) { a.hitDone = true; p.kx += tx * (side ? 0 : 150); if (side) p.kx += (tx >= 0 ? 150 : -150); }
        }
        fireShots(1, 1);
        break;
      }
      case 'aerial': {
        if (a.phase === 1) {
          // pistol-whip uppercut miring ke atas: mengangkat musuh ke udara
          if (!a.hitDone && a.t >= 0.12) {
            a.hitDone = true;
            const t = g.nearestEnemy?.(p.x, p.y, 34, p.aim, 1.3);
            if (t) { a.targetId = t.id; g.damageEnemy(t, 8, 30, p.aim, 260, { melee: true, hitstop: 0.05, shake: 0.3, launch: 330 }); g.sfx.hit(); }
          }
          if (a.t >= a.dur) {
            a.phase = 2; a.t = 0; a.dur = 0.58; a.shots = [0.08, 0.24, 0.4]; a.fired = 0;
            if (g.level?.sideView) { p.svGrounded = false; p.svVy = -215; } else { p.vz = 215; }
            p.airborne = true; p.jumpT = 0;
          }
        } else if (a.phase === 2) {
          // berputar di udara sambil menembak musuh yang melayang
          const t = this.targetOf(g, a.targetId);
          if (t) this.aimAt(g, t);
          if (g.level?.sideView) { p.svVy = Math.min(p.svVy ?? 0, -24); } else { p.vz = Math.max(p.vz, 66); }
          fireShots(1, 1);
          if (a.t >= a.dur || (!p.airborne && a.t > 0.2)) {
            a.phase = 3; a.t = 0; a.dur = 0.5; a.hitDone = false;
            if (g.level?.sideView) { p.svGrounded = false; p.svVy = 320; } else { p.vz = -300; }
          }
        } else {
          // hantaman pistol miring ke bawah: membanting musuh ke lantai
          if (!a.hitDone && a.t >= 0.14) {
            a.hitDone = true;
            const t = g.nearestEnemy?.(p.x, p.y, 32, p.aim, 1.4);
            if (t) { g.damageEnemy(t, 11, 44, p.aim, 330, { melee: true, knockdown: true, hitstop: 0.06, shake: 0.4 }); g.slamEnemyDown?.(t); g.sfx.hit(); }
          }
          if (!p.airborne || a.t >= a.dur) {
            // hantaman pendaratan kecil di sekitar titik jatuh
            for (const e of g.enemies) {
              if (e.dead || e.spawnT > 0) continue;
              if (Math.hypot(e.x - p.x, e.y - p.y) > 30 + (e.r ?? 6)) continue;
              const ang = Math.atan2(e.y - p.y, e.x - p.x);
              g.damageEnemy(e, 7, 34, ang, 300, { melee: true, knockdown: true, hitstop: 0.04, shake: 0.25 });
            }
            g.shake?.(0.25);
            this.endAct(g);
            return;
          }
        }
        break;
      }
    }
    if (a.kind !== 'aerial' && a.t >= a.dur) this.endAct(g);
  }

  private endAct(g: G) {
    const a = this.act;
    this.act = null;
    this.lastActEnd = this.time;
    this.flowResetT = 1.15;
    // jeda mikro sebelum gerakan berikutnya — kunci ritme tembakan yang disengaja
    this.burstReadyAt = this.time + (a?.kind === 'burst' ? 0.17 : 0.1);
    if (a && a.kind !== 'orbit' && a.kind !== 'aerial' && a.kind !== 'airburst' && a.kind !== 'gunfu' && a.kind !== 'crossneck') this.flowStep = (this.flowStep + 1) % PistolStyle.FLOW.length;
    if (this.bufferedFlow) {
      this.bufferedFlow = false;
      if (!g.player.airborne) this.startFlow(g);
    }
  }

  /** gambar pistol yang sedang dilempar (toss & catch / tossup) melayang dalam busur di atas tangan */
  draw(g: G, ctx: any) {
    const p = g.player;
    let u: number | null = null;
    if (this.flourish?.kind === 'toss' && this.tossAirborne()) u = (this.flourish.t / this.flourish.dur - 0.18) / 0.64;
    else if (this.act?.kind === 'tossup' && this.tossAirborne()) u = (this.act.t / this.act.dur - 0.1) / 0.52;
    if (u === null) return;
    const arc = Math.sin(clamp(u, 0, 1) * Math.PI);
    const x = p.x + p.facing * (6 + u * 4);
    const y = p.y - 15 - p.z - arc * 15;
    const ang = p.aim + easeInOut(clamp(u, 0, 1)) * TAU * 3 * (p.facing || 1);
    drawPistol(ctx, { x, y }, ang, 1, { recoil: 0, time: this.time });
  }
}
