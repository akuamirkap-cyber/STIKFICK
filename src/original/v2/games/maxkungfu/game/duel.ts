// DUEL 1v1 — hanya kamu melawan satu lawan sekelas dirimu.
//
// Lawan punya ukuran tubuh yang sama, memakai senjata sungguhan, menjaga jarak,
// membaca kebiasaanmu, dan membalas celah. Inti pertarungannya adalah ADU PARRY:
// satu tekanan tombol = satu交换 pukulan. Tidak ada jalan otomatis — makin cepat
// kamu menekan, makin cepat adegannya; berhenti menekan berarti dia yang menekan.
import { Wield, pickTech, techForFoe, wieldSpeed, type TechId } from './enemyWield';
import { SFNunchaku } from './sfnunchaku';
import { pcircle, prect, px, type Ctx } from './pixel';
import type { Enemy, Pose } from './types';
import type { Game } from './game';

export interface DuelFoe {
  name: string;
  title: string;
  weapon: 'nunchaku' | 'katana' | 'boxing' | 'bat' | 'dual';
  /** 0..1 — kecepatan tangan, akurasi parry, kepintaran membaca celah */
  skill: number;
  hp: number;
  color: string;
  color2: string;
  accent: string;
  reach: number;
  aggression: number;
  /** true = pakai senjata klasik (nunchaku rantai) bukan tombak */
  classic?: boolean;
}

/** Tangga lawan. Nomor 1 selalu ahli nunchaku, persis seukuran pemain. */
export const DUEL_LADDER: DuelFoe[] = [
  { name: 'RENGGA', title: 'AHLI NUNCHAKU', weapon: 'nunchaku', skill: 0.66, hp: 120, color: '#ffb347', color2: '#7a3d10', accent: '#ff8a3d', reach: 30, aggression: 0.85 },
  { name: 'SASUKE', title: 'PEDANG KEMBAR', weapon: 'dual', skill: 0.74, hp: 140, color: '#bfe8ff', color2: '#20415e', accent: '#7fd6ff', reach: 26, aggression: 0.9 },
  { name: 'BRUNO', title: 'PEMUKUL BAJA', weapon: 'bat', skill: 0.78, hp: 165, color: '#e6b877', color2: '#5a3a12', accent: '#ffd27f', reach: 32, aggression: 0.88 },
  { name: 'KAORI', title: 'IAIJUTSU', weapon: 'katana', skill: 0.84, hp: 150, color: '#e8e2d0', color2: '#3a2f4a', accent: '#c9a4ff', reach: 34, aggression: 0.94 },
  { name: 'IRON JAW', title: 'RAJA TINJU', weapon: 'boxing', skill: 0.9, hp: 185, color: '#ff6b6b', color2: '#4a1010', accent: '#ff3b3b', reach: 23, aggression: 0.96 },
  { name: 'GURU', title: 'BAYANGAN TERAKHIR', weapon: 'nunchaku', skill: 0.97, hp: 210, color: '#c7b3ff', color2: '#2a1a4a', accent: '#b24dff', reach: 32, aggression: 1.0 },
];

// ============================ ADU PARRY ============================

export type ClashKind = 'bind' | 'rhythm' | 'deflect';
export type ClashResult = 'crush_win' | 'win' | 'draw' | 'lose' | 'crush_lose';

const CLASH_POSE_P: Pose[] = ['n_lash', 'n_cross', 'n_whipcrack', 'n_overhead'];
const CLASH_POSE_B: Pose[] = ['n_cross', 'n_lash', 'n_overhead', 'n_whipcrack'];

export class Clash {
  kind: ClashKind = 'bind';
  phase: 'in' | 'fight' | 'out' = 'in';
  t = 0;
  beat = 0;
  need = 12;
  pScore = 0;
  bScore = 0;
  side = 1;
  /** sisi menyala untuk varian rhythm */
  lit: 1 | -1 = 1;
  litT = 0;
  /** cincin menyusut untuk varian deflect */
  ring = 1;
  ringDir = -1;
  bTimer = 0.5;
  pLast = 0;
  pInterval = 0.42;
  exchange = 0;
  result: ClashResult = 'draw';
  outT = 0;
  cx = 0; cy = 0;
  dir = 0;
  flashP = 0; flashB = 0;
  lastJudge = 0;
  judgeGood = false;

  get lead() { return this.pScore - this.bScore; }
  get progress() { return Math.min(1, this.beat / this.need); }

  begin(kind: ClashKind, cx: number, cy: number, dir: number, skill: number, round: number) {
    this.kind = kind; this.phase = 'in'; this.t = 0; this.beat = 0;
    this.need = 10 + Math.min(8, round * 2);
    this.pScore = 0; this.bScore = 0; this.exchange = 0;
    this.cx = cx; this.cy = cy; this.dir = dir;
    this.bTimer = 0.55 - skill * 0.16;
    this.pInterval = 0.42; this.pLast = 0;
    this.lit = 1; this.litT = 0; this.ring = 1; this.ringDir = -1;
    this.flashP = 0; this.flashB = 0; this.lastJudge = 0;
  }

  /** Interval lawan mengikuti ritmemu — inilah rasa "saling membalas tekanan". */
  private bossInterval(skill: number) {
    const base = 0.5 - skill * 0.2;
    const mirrored = this.pInterval * (1.18 - skill * 0.34);
    return Math.max(0.1, Math.min(0.72, base * 0.45 + mirrored * 0.55));
  }

  update(dt: number, g: Game, foe: Enemy, skill: number) {
    this.t += dt;
    this.flashP = Math.max(0, this.flashP - dt * 4);
    this.flashB = Math.max(0, this.flashB - dt * 4);
    this.lastJudge = Math.max(0, this.lastJudge - dt);
    if (this.phase === 'in') {
      if (this.t > 0.42) { this.phase = 'fight'; this.t = 0; }
      return;
    }
    if (this.phase === 'out') { this.outT += dt; return; }

    this.pLast += dt;
    // tempo lawan
    this.bTimer -= dt;
    if (this.bTimer <= 0) {
      this.bTimer = this.bossInterval(skill);
      let gain = 1;
      if (this.kind === 'rhythm') gain = this.lit === -1 ? 2 : 0.5;
      else if (this.kind === 'deflect') {
        const acc = Math.abs(this.ring - 0.34);
        gain = acc < 0.1 + (1 - skill) * 0.16 ? 2 : 1;
      }
      // lawan kadang meleset — makin rendah skill makin sering
      if (Math.random() > 0.55 + skill * 0.42) gain *= 0.5;
      this.bScore += gain;
      this.beat++;
      this.flashB = 1;
      this.exchange++;
      this.strike(g, foe, false);
    }
    if (this.kind === 'rhythm') {
      this.litT += dt;
      const period = Math.max(0.24, this.bossInterval(skill) * 1.05);
      if (this.litT >= period) { this.litT = 0; this.lit = this.lit === 1 ? -1 : 1; }
    } else if (this.kind === 'deflect') {
      this.ring += this.ringDir * dt * 1.5;
      if (this.ring <= 0.12) { this.ring = 0.12; this.ringDir = 1; }
      if (this.ring >= 1) { this.ring = 1; this.ringDir = -1; }
    }
    if (this.beat >= this.need || Math.abs(this.lead) >= Math.ceil(this.need * 0.55)) this.finish(g, foe);
  }

  /** Satu tekanan pemain = satu exchange. Inilah pengendali durasi adegan. */
  press(g: Game, foe: Enemy) {
    if (this.phase !== 'fight') return;
    const gap = this.pLast;
    this.pInterval = this.pInterval * 0.55 + Math.max(0.08, Math.min(0.8, gap)) * 0.45;
    this.pLast = 0;
    let gain = 1;
    let good = true;
    if (this.kind === 'rhythm') { good = this.lit === 1; gain = good ? 2 : 0.5; }
    else if (this.kind === 'deflect') {
      const acc = Math.abs(this.ring - 0.34);
      good = acc < 0.13;
      gain = good ? 2 : acc < 0.28 ? 1 : 0.5;
      this.ring = 1; this.ringDir = -1;
    }
    this.pScore += gain;
    this.beat++;
    this.flashP = 1;
    this.exchange++;
    this.lastJudge = 0.35; this.judgeGood = good;
    this.strike(g, foe, true);
    if (this.beat >= this.need || Math.abs(this.lead) >= Math.ceil(this.need * 0.55)) this.finish(g, foe);
  }

  private strike(g: Game, foe: Enemy, byPlayer: boolean) {
    const p = g.player;
    const a = this.dir;
    const hx = this.cx + Math.cos(a) * 2, hy = this.cy - 7;
    const idx = this.exchange % CLASH_POSE_P.length;
    if (byPlayer) {
      p.holdPose = CLASH_POSE_P[idx]; p.holdPoseT = 0.42; p.holdT = Math.max(p.holdT, 0.16);
      foe.pose = 'parry'; foe.poseT = 0; foe.poseDur = 0.3;
    } else {
      foe.pose = CLASH_POSE_B[idx]; foe.poseT = 0; foe.poseDur = 0.3;
      p.holdPose = 'parry'; p.holdPoseT = 0.4; p.holdT = Math.max(p.holdT, 0.16);
    }
    const col = byPlayer ? '#ffe9a8' : '#ff9a8a';
    g.particles.spark(hx, hy, 9, col, a + (byPlayer ? 0 : Math.PI), 1.5, 250);
    g.particles.impact(hx, hy, 5, '#ffffff');
    g.particles.ring(hx, hy, 1, 8, col, 0.14, 1);
    g.sfx.parry();
    g.hitstop = Math.max(g.hitstop, 0.028);
    g.shake(0.14);
    g.zoomKick = Math.max(g.zoomKick, 0.03);
  }

  private finish(g: Game, foe: Enemy) {
    const l = this.lead;
    this.result = l >= 5 ? 'crush_win' : l >= 1 ? 'win' : l === 0 ? 'draw' : l <= -5 ? 'crush_lose' : 'lose';
    this.phase = 'out'; this.outT = 0;
    const p = g.player;
    const a = this.dir;
    const hx = this.cx, hy = this.cy - 7;
    g.particles.shockwave(hx, hy, 34, '#ffffff', 0.3);
    g.flash('#ffffff', 0.2);
    g.hitstop = Math.max(g.hitstop, 0.1);
    g.slow(0.4, 0.3);

    if (this.result === 'crush_win' || this.result === 'win') {
      const hard = this.result === 'crush_win';
      // kemenangan: kamu menembus guard, dia terhuyung / terlempar
      p.holdPose = hard ? 'n_dragonlash' : 'n_overhead'; p.holdPoseT = 0.6; p.holdT = 0.55;
      foe.pose = hard ? 'launched' : 'stagger'; foe.poseT = 0; foe.poseDur = 0.9;
      foe.kx += Math.cos(a) * (hard ? 430 : 190);
      foe.ky += Math.sin(a) * (hard ? 330 : 150);
      if (hard) { foe.vz = 190; foe.z = Math.max(foe.z, 0.2); foe.state = 'air'; }
      else { foe.stun = 1.1; foe.state = 'stun'; }
      foe.structure = foe.maxStructure;
      g.damageEnemy(foe, hard ? 26 : 14, 90, a, hard ? 260 : 120, { knockdown: hard, hitstop: 0.08, shake: hard ? 0.8 : 0.4, melee: true });
      g.particles.burst(hx, hy, hard ? 26 : 14, '#ffd27f', 240, 0.45, 2, 3);
      g.shake(hard ? 0.85 : 0.4);
      g.sfx.heavy();
    } else if (this.result === 'draw') {
      // seri: dua-duanya terpental sama jauh, tidak ada yang rugi
      p.holdPose = 'parry'; p.holdPoseT = 0.5; p.holdT = 0.4;
      p.kx -= Math.cos(a) * 170; p.ky -= Math.sin(a) * 130;
      foe.kx += Math.cos(a) * 170; foe.ky += Math.sin(a) * 130;
      foe.pose = 'stagger'; foe.poseT = 0; foe.poseDur = 0.5;
      foe.stun = 0.4; foe.state = 'stun';
      g.particles.ring(hx, hy, 3, 26, '#cfe9ff', 0.28, 2);
      g.sfx.parry();
    } else {
      const hard = this.result === 'crush_lose';
      // kalah: guard-mu jebol, kamu terhuyung / terlempar
      foe.pose = hard ? 'n_dragonlash' : 'n_overhead'; foe.poseT = 0; foe.poseDur = 0.8;
      p.holdPose = hard ? 'launched' : 'hurt'; p.holdPoseT = 0.6; p.holdT = 0.5;
      p.kx -= Math.cos(a) * (hard ? 400 : 180);
      p.ky -= Math.sin(a) * (hard ? 300 : 140);
      p.iframes = 0;
      g.damagePlayer(hard ? 3 : 1, a + Math.PI, hard);
      if (hard) { p.vz = Math.max(p.vz, 170); p.z = Math.max(p.z, 0.2); p.airborne = true; }
      g.particles.burst(hx, hy, hard ? 22 : 12, '#ff8a7a', 220, 0.4, 2, 3);
      g.shake(hard ? 0.8 : 0.4);
      g.sfx.heavy();
    }
  }

  get done() { return this.phase === 'out' && this.outT > 0.75; }

  /** UI diegetik: bilah keunggulan di antara petarung + isyarat varian. Tanpa teks. */
  draw(ctx: Ctx) {
    if (this.phase === 'out') return;
    const x = this.cx, y = this.cy - 26;
    const w = 44;
    const lead = Math.max(-1, Math.min(1, this.lead / Math.max(4, this.need * 0.5)));
    // rel
    prect(ctx, x - w / 2 - 1, y - 1, w + 2, 5, '#00000099');
    prect(ctx, x - w / 2, y, w, 3, '#20202a');
    prect(ctx, x - 0.5, y - 1, 1, 5, '#ffffff55');
    if (lead !== 0) {
      const len = Math.abs(lead) * (w / 2);
      prect(ctx, lead > 0 ? x : x - len, y, len, 3, lead > 0 ? '#7cff9b' : '#ff5a5a');
    }
    //denyut tiap tekanan
    if (this.flashP > 0) { ctx.globalAlpha = this.flashP * 0.8; prect(ctx, x + w / 2, y - 2, 2, 7, '#ffffff'); ctx.globalAlpha = 1; }
    if (this.flashB > 0) { ctx.globalAlpha = this.flashB * 0.8; prect(ctx, x - w / 2 - 2, y - 2, 2, 7, '#ffffff'); ctx.globalAlpha = 1; }

    if (this.kind === 'rhythm') {
      // dua sisi bergantian menyala: tekan saat sisimu terang
      for (const s of [-1, 1] as const) {
        const on = this.lit === s;
        const gx = x + s * (w / 2 + 6);
        ctx.globalAlpha = on ? 0.95 : 0.28;
        pcircle(ctx, gx, y + 1.5, on ? 3.2 : 2, s === 1 ? '#7cff9b' : '#ff5a5a');
        ctx.globalAlpha = 1;
      }
    } else if (this.kind === 'deflect') {
      // cincin menyusut: tekan saat menyentuh lingkaran sasaran
      const ry = y + 12;
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, ry, 7, 3.2, 0, 0, Math.PI * 2); ctx.stroke();
      const r = 4 + this.ring * 15;
      const near = Math.abs(this.ring - 0.34) < 0.13;
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = near ? '#7cff9b' : '#ffd27f';
      ctx.beginPath(); ctx.ellipse(x, ry, r, r * 0.46, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // bind: percikan tekanan di kedua ujung rel
      const n = Math.min(6, Math.floor(this.progress * 6));
      for (let i = 0; i < n; i++) px(ctx, x - w / 2 + 3 + i * 7, y + 5, '#ffd27f');
    }
    if (this.lastJudge > 0 && this.kind !== 'bind') {
      ctx.globalAlpha = this.lastJudge / 0.35;
      px(ctx, x, y - 5, this.judgeGood ? '#7cff9b' : '#ff5a5a');
      px(ctx, x - 1, y - 6, this.judgeGood ? '#7cff9b' : '#ff5a5a');
      px(ctx, x + 1, y - 6, this.judgeGood ? '#7cff9b' : '#ff5a5a');
      ctx.globalAlpha = 1;
    }
  }
}

// ============================ OTAK LAWAN ============================

const NUN_POSES: Pose[] = ['n_lash', 'n_cross', 'n_overhead', 'n_whipcrack', 'n_helicopter'];

import { TECHS } from './guandao';
const TECHS_FLOURISH = () => TECHS.flourish;
const TECHS_FIG8 = () => TECHS.fig8;
export class DuelBrain {
  foe: DuelFoe = DUEL_LADDER[0];
  nun = new SFNunchaku();
  private think = 0;
  private chain = 0;
  private chainT = 0;
  private strafe = 1;
  private strafeT = 0;
  private guard = 0;
  private punish = 0;
  /** kebiasaan pemain yang dipelajari: seberapa sering menyerang & menjaga jarak */
  private readAttack = 0;
  private readGap = 0;
  clashCd = 0;
  /** senjata tombak ala pemain (null = bertinju) */
  wield: Wield | null = null;
  private techs: TechId[] = [];
  private showT = 3;
  /** sisa waktu sebelum balasan setelah memparry */
  riposte = 0;
  private parryCdD = 0;
  private dodgeCd = 0;
  private feintNow = false;
  rage = false;

  reset(foe: DuelFoe, x: number, y: number) {
    this.riposte = 0; this.parryCdD = 0.6; this.dodgeCd = 0.8; this.feintNow = false; this.rage = false;
    this.wield = foe.weapon === 'boxing' || foe.classic ? null : new Wield(foe.accent);
    this.techs = techForFoe(foe.name); this.showT = 2.5;
    this.foe = foe;
    this.nun.reset(x, y - 8);
    this.think = 0.5; this.chain = 0; this.chainT = 0;
    this.guard = 0; this.punish = 0; this.clashCd = 1.2;
    this.readAttack = 0; this.readGap = 0;
  }

  /** Dipanggil tiap frame untuk lawan duel. Mengendalikan penuh gerak & serangnya. */
  update(g: Game, e: Enemy, dt: number) {
    const p = g.player;
    const f = this.foe;
    const R = this.wield ? 38 : f.reach;
    if (this.wield) { this.wield.rage = this.rage; this.wield.update(g, e, dt); }
    // ---- BERSERK: di bawah 50% nyawa dia mengamuk — lebih cepat, lebih panjang, lebih sakit
    if (!this.rage && e.hp < e.maxHp * 0.5 && e.state !== 'windup') {
      this.rage = true; e.speed *= 1.22; this.parryCdD = 99;
      g.say?.('LAWAN MENGAMUK!', '#ff3b2b', 2, 1.4); g.sfx?.announce?.(); g.flash?.('#ff3b2b', 0.3); g.shake?.(0.6);
      g.particles.ring(e.x, e.y - 8, 3, 34, '#ff3b2b', 0.4, 2); g.particles.burst(e.x, e.y - 10, 22, '#ff3b2b', 220, 0.5, 2, 2);
      if (!this.techs.includes('whirl')) this.techs.push('whirl');
      if (!this.techs.includes('moon')) this.techs.push('moon');
    }
    const RG = this.rage ? 1 : 0;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    this.clashCd = Math.max(0, this.clashCd - dt);
    this.chainT -= dt;
    if (this.chainT <= 0) this.chain = 0;
    this.guard = Math.max(0, this.guard - dt);
    this.punish = Math.max(0, this.punish - dt);
    this.strafeT -= dt;
    if (this.strafeT <= 0) { this.strafeT = 0.6 + Math.random() * 1.1; this.strafe = Math.random() < 0.5 ? 1 : -1; }

    // membaca kebiasaan: pemain yang agresif membuat lawan lebih sering menahan
    const pAttacking = p.attackPhase === 'active' || p.attackPhase === 'windup';
    this.readAttack += ((pAttacking ? 1 : 0) - this.readAttack) * Math.min(1, dt * 1.6);
    this.readGap += (d - this.readGap) * Math.min(1, dt * 0.9);

    e.aim += Math.atan2(Math.sin(ang - e.aim), Math.cos(ang - e.aim)) * Math.min(1, dt * 9);
    e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;

    if (e.stun > 0 || e.down > 0 || e.z > 1 || e.state === 'air') { e.moving = false; this.wield?.cancel(); return; }

    // ---- REAKSI: parry aktif / menghindar / balas setelah parry ----
    const ex = e as unknown as { duelParryT?: number; dodgeT?: number };
    ex.duelParryT = Math.max(0, (ex.duelParryT ?? 0) - dt); ex.dodgeT = Math.max(0, (ex.dodgeT ?? 0) - dt);
    this.parryCdD -= dt; this.dodgeCd -= dt;
    if (this.riposte > 0) {
      this.riposte -= dt;
      if (this.riposte <= 0 && e.state !== 'attack' && e.state !== 'windup') { this.chain = 0; this.beginStrike(g, e); e.stateT = 0.09; this.feintNow = false; this.chainT = 1.4; g.texts?.hit?.(e.x, e.y - 24, 'BALASAN!', f.accent, 1, 0.6); }
    }
    if (e.state !== 'attack' && e.state !== 'windup' && pAttacking && d < R + 20 && (ex.duelParryT ?? 0) <= 0 && (ex.dodgeT ?? 0) <= 0) {
      const react = Math.min(1, dt * 9);
      if (this.parryCdD <= 0 && Math.random() < (0.3 + f.skill * 0.55) * react) {
        ex.duelParryT = 0.32; this.parryCdD = 1.15 - f.skill * 0.4;
        e.pose = 'parry'; e.poseT = 0; e.poseDur = 0.32; e.vx = 0; e.vy = 0;
        g.particles.ring(e.x, e.y - 8, 3, 16, f.accent, 0.3, 2);
        g.sfx.whoosh();
      } else if (this.dodgeCd <= 0 && Math.random() < f.skill * 0.5 * react) {
        ex.dodgeT = 0.26; this.dodgeCd = 1.5 - f.skill * 0.5;
        const sd = this.strafe, pa = ang + sd * Math.PI / 2;
        e.kx += Math.cos(pa) * 330 + Math.cos(ang) * 40; e.ky += Math.sin(pa) * 330 + Math.sin(ang) * 40;
        e.pose = 'dash'; e.poseT = 0; e.poseDur = 0.26;
        g.particles.smoke(e.x, e.y, 3, '#cfcfcf', 24, 0.3);
        g.addAfterimage?.({ x: e.x, y: e.y, facing: e.facing, aim: e.aim, scale: e.scale, color: f.accent }, f.accent);
        g.sfx.dash?.();
      }
    }
    if ((ex.duelParryT ?? 0) > 0) { e.vx = 0; e.vy = 0; e.moving = false; e.pose = 'parry'; return; }
    if ((ex.dodgeT ?? 0) > 0) { e.moving = false; return; }

    // rantai serangan berjalan
    if (e.state === 'attack') {
      e.stateT -= dt;
      if (this.wield && this.wield.tech) { const T = this.wield.tech; e.pose = T.pose as Enemy['pose']; e.poseT = T.poseMap[0] + (T.poseMap[1] - T.poseMap[0]) * Math.min(1, this.wield.tt / T.dur); e.poseDur = 1e6; }
      if (!this.wield && !e.hitDone && e.poseT > 0.34) {
        e.hitDone = true;
        g.enemyMeleeHit(e, 1, R + 6, 1.15, this.chain >= 3);
        g.sfx.nunchakuHit(this.chain >= 3);
      }
      if (e.stateT <= 0) {
        if (this.chain < 3 + Math.round(f.skill * 2) + RG * 2 && d < R + 22 && Math.random() < 0.82 + f.skill * 0.15) {
          this.beginStrike(g, e);
        } else {
          e.state = 'chase'; e.pose = 'idle'; e.poseT = 0; e.poseDur = 1;
          e.attackCd = Math.max(0.04, 0.38 - f.skill * 0.3 - RG * 0.1);
          this.chain = 0;
        }
      }
      return;
    }
    if (e.state === 'windup') {
      e.stateT -= dt;
      if (e.stateT <= 0 && this.feintNow) {
        // tipuan: pura-pura menyerang, melipir, lalu menghukum yang terpancing
        this.feintNow = false;
        const pa = ang + this.strafe * Math.PI / 2;
        e.kx += Math.cos(pa) * 230 - Math.cos(ang) * 60; e.ky += Math.sin(pa) * 230 - Math.sin(ang) * 60;
        e.state = 'chase'; e.pose = 'dash'; e.poseT = 0; e.poseDur = 0.2; e.attackCd = 0.1; this.punish = 0.9; this.chain = 0;
        g.particles.smoke(e.x, e.y, 2, '#cfcfcf', 20, 0.25);
        return;
      }
      if (e.stateT <= 0) {
        e.state = 'attack';
        if (this.wield) {
          const T = pickTech(this.techs, this.chain, d, f.skill);
          const sp = wieldSpeed(f.skill);
          this.wield.boost = this.rage || this.chain >= 3;
          this.wield.start(e, T, e.aim, sp * (this.rage ? 1.15 : 1));
          e.stateT = T.dur / (1.12 * sp) + 0.02;
          e.hitDone = true;
          this.wield.hits = 0;
        } else {
          e.stateT = 0.2;
          const pose = NUN_POSES[this.chain % NUN_POSES.length];
          e.pose = pose; e.poseT = 0; e.poseDur = 0.34;
          e.kx += Math.cos(e.aim) * 90; e.ky += Math.sin(e.aim) * 90;
          g.sfx.whoosh();
        }
      }
      return;
    }

    e.attackCd -= dt;
    // menjaga jarak seperti petarung sungguhan: mundur saat kamu menyerang, masuk saat kamu lengah
    const ideal = R * (this.guard > 0 ? 1.15 : 0.68);
    let mvx = 0, mvy = 0;
    if (d > ideal + 6) { mvx = dx / d; mvy = dy / d; }
    else if (d < ideal - 8) { mvx = -dx / d; mvy = -dy / d; }
    mvx += (-dy / d) * this.strafe * 0.55;
    mvy += (dx / d) * this.strafe * 0.55;

    // menghindar terbaca: makin tinggi skill makin sering menyingkir dari ayunanmu
    if (pAttacking && d < R + 14 && Math.random() < f.skill * dt * 7) {
      this.guard = 0.45;
      e.kx -= Math.cos(ang) * 150; e.ky -= Math.sin(ang) * 150;
      g.particles.smoke(e.x, e.y, 2, '#cfcfcf', 18, 0.24);
    }
    // menghukum celah: sehabis kamu meleset, dia masuk
    if (p.attackPhase === 'recover' && d < R + 20) this.punish = 0.5;

    // menutup jarak dengan berlari, bukan berjalan santai
    const gap = Math.max(0, d - ideal);
    const gear = gap > 70 ? 1.55 : gap > 32 ? 1.3 : 1;
    const sp = e.speed * gear * (this.punish > 0 ? 1.4 : 1) * (1 + RG * 0.1);
    const ml = Math.hypot(mvx, mvy) || 1;
    e.vx = (mvx / ml) * sp; e.vy = (mvy / ml) * sp;
    e.moving = ml > 0.1;
    if (e.pose !== 'idle' && e.pose !== 'run') { e.pose = 'idle'; e.poseT = 0; e.poseDur = 1; }

    this.showT -= dt;
    if (this.wield && !this.wield.tech && this.showT <= 0 && d > 80 && e.state === 'chase') { this.showT = 4 + Math.random() * 4; this.wield.start(e, Math.random() < 0.5 ? TECHS_FLOURISH() : TECHS_FIG8(), ang, 1); }
    if (this.wield && this.wield.tech && this.wield.tech.dmgless && d < 62) this.wield.cancel();
    this.think -= dt;
    if (this.think <= 0) {
      this.think = 0.06 + (1 - f.skill) * 0.12;
      const inRange = d < R + 16;
      const eager = Math.min(1, f.aggression + 0.25 + RG * 0.2 + this.readAttack * 0.2 + (this.punish > 0 ? 0.4 : 0));
      if (inRange && e.attackCd <= 0 && Math.random() < eager) this.beginStrike(g, e);
      else if (this.wield && !inRange && d < 170 && e.attackCd <= 0 && e.state === 'chase' && Math.random() < 0.4 + f.skill * 0.4 + RG * 0.15) {
        // MENERJANG: menutup jarak dengan tusukan, atau menembakkan bulan sabit dari jauh
        const far = d > 95 && this.techs.includes('moon') && Math.random() < 0.5;
        const T = far ? TECHS.moon : TECHS.thrust;
        const sp = wieldSpeed(f.skill) * (this.rage ? 1.15 : 1.05);
        this.chain = 1; this.chainT = 1.2; this.wield.boost = this.rage;
        this.wield.start(e, T, e.aim, sp);
        e.state = 'attack'; e.stateT = T.dur / (1.12 * sp) + 0.02; e.hitDone = true; this.wield.hits = 0;
        if (!far) { e.kx += Math.cos(e.aim) * 230; e.ky += Math.sin(e.aim) * 230; g.particles.smoke(e.x, e.y, 3, '#cfcfcf', 24, 0.3); g.sfx.dash?.(); }
      }
      // menawarkan adu parry: dia menyodong senjata lebih dulu
      else if (inRange && this.clashCd <= 0 && Math.random() < 0.16 + f.skill * 0.2) {
        g.tryClash(e, true);
      }
    }
  }

  private beginStrike(g: Game, e: Enemy) {
    this.chain++;
    this.feintNow = this.chain === 1 && Math.random() < 0.08 + this.foe.skill * 0.22;
    this.chainT = 1.1;
    e.state = 'windup';
    e.stateT = Math.max(0.07, 0.2 - this.foe.skill * 0.13 - (this.rage ? 0.03 : 0));
    e.pose = 'windup'; e.poseT = 0; e.poseDur = 0.3;
    e.hitDone = false;
    void g;
  }

  /** Nunchaku lawan: rantai verlet sungguhan, dipegang di tangan yang berpose. */
  updateWeapon(g: Game, e: Enemy, dt: number, hand: { x: number; y: number }) {
    const swinging = e.state === 'attack' || e.state === 'windup';
    this.nun.update(dt, hand.x, hand.y, e.aim, g.time, 'idle', 1, hand);
    void swinging;
  }

  drawWeapon(ctx: Ctx) {
    this.nun.draw(ctx, this.foe.accent, true);
  }
}
