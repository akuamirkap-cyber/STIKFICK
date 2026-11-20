import { clamp } from './rng';

/**
 * REAKSI KENA PUKUL PER BAGIAN TUBUH — musuh bereaksi sesuai bagian yang terkena:
 *  KEPALA : kepala tersentak ke belakang, tangan menutup wajah, pusing sebentar
 *  PERUT  : badan melipat ke depan (memegangi perut), sulit menyerang sejenak
 *  BAWAH  : lutut tertekuk, satu kaki tersapu, tangan terbuka menjaga keseimbangan; pukulan kuat = tersandung jatuh
 * Zona dipilih dari jurus yang dipakai, ketinggian titik kontak, ketinggian peluru, atau bagian yang kena panah.
 */
type G = any;
type E = any;
export type Zone = 'head' | 'torso' | 'legs';
export interface React { zone: Zone; side: number; t: number; dur: number; dir: number; amp: number }
export interface ReactOpts { zone: Zone; k: number; dx: number; dy: number; side: number; amp: number }

const DUR: Record<Zone, number> = { head: 0.46, torso: 0.6, legs: 0.66 };

// bobot [kepala, perut, bawah] menurut pose jurus
const ZW: Record<string, [number, number, number]> = {
  uppercut: [0.9, 0.1, 0], hook: [0.8, 0.2, 0], elbow: [0.8, 0.2, 0], tigerclaw: [0.5, 0.5, 0], mantis: [0.4, 0.6, 0],
  cross: [0.45, 0.55, 0], jab: [0.5, 0.5, 0], punch: [0.4, 0.6, 0], palm: [0.2, 0.8, 0], chainpunch: [0.3, 0.7, 0], chainfinish: [0.5, 0.5, 0],
  k_ironpalm: [0, 1, 0], k_hammerfist: [0.7, 0.3, 0], runpunch: [0.2, 0.8, 0],
  roundhouse: [0.5, 0.4, 0.1], kick: [0.3, 0.5, 0.2], sidekick: [0.2, 0.8, 0], knee: [0, 1, 0], axekick: [0.92, 0.08, 0], dragontail: [0.6, 0.3, 0.1],
  butterflyflip: [0.86, 0.14, 0], cartwheelkick: [0.82, 0.18, 0],
  monkeyflip: [0.9, 0.1, 0], cranekick: [0.8, 0.2, 0], spinback: [0.75, 0.25, 0], flying: [0.45, 0.5, 0.05], kneedrop: [0.2, 0.8, 0],
  sweep: [0, 0, 1], s_partyTable: [0, 0.1, 0.9], s_collier: [0.6, 0.4, 0], s_epaule: [0.2, 0.8, 0], s_cotelette: [0, 0.8, 0.2], s_antimanner: [0.4, 0.4, 0.2],
  s_mouton: [0.7, 0.3, 0], s_concasse: [0.7, 0.3, 0], s_diable: [0.5, 0.5, 0],
  bx_jab: [0.85, 0.15, 0], bx_cross: [0.85, 0.15, 0], bx_lhook: [0.9, 0.1, 0], bx_rhook: [0.9, 0.1, 0], bx_upper: [1, 0, 0], bx_body: [0, 1, 0], bx_shovel: [0, 1, 0],
  bx_heart: [0, 1, 0], bx_over: [1, 0, 0], bx_smash: [0.6, 0.4, 0], bx_gazelle: [0.9, 0.1, 0], bx_dempsey: [0.8, 0.2, 0],
  a_swing1: [0.25, 0.6, 0.15], a_swing2: [0.25, 0.6, 0.15], a_homerun: [0.5, 0.5, 0], a_golf: [0.1, 0.3, 0.6], a_bunt: [0, 1, 0],
  b_wild: [0.3, 0.55, 0.15], b_wildback: [0.3, 0.55, 0.15], b_smash: [0.8, 0.2, 0], b_knob: [0, 1, 0], b_upper: [0.85, 0.15, 0], b_pound: [0, 0.5, 0.5],
  a_overhead: [0.9, 0.1, 0], a_chop: [0.3, 0.6, 0.1], a_spin: [0.2, 0.6, 0.2],
  n_lowsweep: [0, 0, 1], n_overhead: [0.9, 0.1, 0], n_whipcrack: [0.4, 0.6, 0], n_lash: [0.4, 0.5, 0.1],
  k_thrust: [0, 1, 0], k_rising: [0.7, 0.3, 0], k_crescent: [0.3, 0.6, 0.1], k_heaven: [0.9, 0.1, 0],
};
const TECH_W: Record<string, [number, number, number]> = {
  sweep: [0.2, 0.6, 0.2], reverse: [0.5, 0.4, 0.1], twirl: [0.35, 0.5, 0.15], taishan: [0.95, 0.05, 0], thrust: [0, 1, 0],
  whirl: [0.3, 0.5, 0.2], moon: [0.4, 0.5, 0.1], heli: [0.3, 0.5, 0.2], fig8: [0.3, 0.5, 0.2],
};

function pick(w: [number, number, number]): Zone {
  const r = Math.random() * (w[0] + w[1] + w[2]);
  return r < w[0] ? 'head' : r < w[0] + w[1] ? 'torso' : 'legs';
}
export function randomZone(): Zone { return pick([0.28, 0.46, 0.26]); }

/** zona dari jurus yang dipakai + (opsional) titik kontak anggota badan di dunia */
export function zoneFromMove(move: { id: string; pose: string }, e: E, at?: { x: number; y: number }): Zone {
  if (e && (e.down > 0 || e.state === 'down')) return 'torso';
  if (e && e.z > 3) return 'torso';
  const w0 = ZW[move.pose] ?? ZW[move.id] ?? [0.3, 0.5, 0.2];
  const w: [number, number, number] = [w0[0], w0[1], w0[2]];
  if (at && e) {
    const rel = (e.y - (e.z ?? 0) - at.y) / (e.scale ?? 1);
    if (rel > 8.5) w[0] *= 2.2; else if (rel < 2.5) w[2] = w[2] * 2.5 + (w[2] > 0 ? 0 : 0.04);
  }
  return pick(w);
}
export function zoneFromTech(id: string): Zone { return pick(TECH_W[id] ?? [0.3, 0.5, 0.2]); }
/** zona dari ketinggian peluru / proyektil terhadap badan */
export function zoneFromHeight(e: E, y: number): Zone {
  const rel = (e.y - (e.z ?? 0) - y) / (e.scale ?? 1);
  if (rel > 8.5) return 'head';
  if (rel < 2.2) return 'legs';
  return Math.random() < 0.28 ? 'head' : 'torso';
}

export function startReact(e: E, zone: Zone, dir: number, amp: number) {
  const prev: React | undefined = e.react;
  const active = !!prev && prev.t < prev.dur * 0.6;
  const dur = DUR[zone];
  e.react = { zone, side: Math.random() < 0.5 ? 1 : -1, t: dur * (active ? 0.12 : 0.02), dur, dir, amp: clamp(amp, 0.4, 1.3) } as React;
}
export function tickReact(e: E, dt: number) {
  const r: React | undefined = e.react;
  if (!r) return;
  r.t += dt;
  if (r.t >= r.dur) e.react = undefined;
}
/** kurva gerak: naik cepat lalu pulih perlahan */
function kOf(r: React): number {
  const u = clamp(r.t / r.dur, 0, 1);
  if (u < 0.14) return u / 0.14;
  const v = (u - 0.14) / 0.86;
  return Math.pow(1 - v, 1.5);
}
export function reactActive(e: E): boolean { return !!e.react && e.react.t < e.react.dur; }
export function reactOpts(e: E): ReactOpts | undefined {
  const r: React | undefined = e.react;
  if (!r || r.t >= r.dur) return undefined;
  let dx = Math.cos(r.dir), dy = Math.sin(r.dir) * 0.6;
  if (Math.abs(dx) < 0.4) dx = -(e.facing || 1) * 0.4;
  return { zone: r.zone, k: kOf(r) * r.amp, dx, dy, side: r.side, amp: r.amp };
}

/** efek gameplay + partikel sesuai zona. Dipanggil dari damageEnemy untuk serangan yang tidak mematikan */
export function reactFx(g: G, e: E, zone: Zone, dir: number, dmg: number, kb: number, o: { knockdown?: boolean; melee?: boolean; launch?: number }) {
  const sc = e.scale ?? 1;
  const heavy = dmg >= 5 || kb >= 300 || !!o.knockdown;
  const armored = !!e.armor || !!e.boss;
  startReact(e, zone, dir, (0.6 + Math.min(0.45, dmg * 0.045) + Math.min(0.2, kb / 2500)) * (armored ? 0.5 : 1) * (zone === 'torso' ? 0.82 : 1));
  const cx = Math.cos(dir), sy = Math.sin(dir);
  const grounded = e.z <= 0 && e.down <= 0 && e.stagger <= 0;
  const committed = (e.state === 'windup' && e.stateT < 0.12) || e.state === 'attack' || e.state === 'lunge';
  const free = grounded && !armored && !committed && !o.launch;
  switch (zone) {
    case 'head':
      g.particles?.blood?.(e.x, e.y - 11 * sc - e.z, 1 + (heavy ? 2 : 0), dir, 110);
      if (heavy) g.particles?.spark?.(e.x, e.y - 11 * sc - e.z, 2, '#ffffff', dir, 0.6, 130);
      if (free) { e.stun = Math.max(e.stun, heavy ? 0.46 : 0.3); e.state = 'stun'; e.attackCd = Math.max(e.attackCd, 0.45); }
      break;
    case 'torso':
      g.particles?.blood?.(e.x, e.y - 6 * sc - e.z, 1 + (heavy ? 2 : 0), dir, 95);
      if (heavy) g.particles?.smoke?.(e.x - cx * 3, e.y - 6 * sc - e.z, 1, '#e6e6e6', 14, 0.25);
      if (free) { e.stun = Math.max(e.stun, heavy ? 0.58 : 0.4); e.state = 'stun'; e.attackCd = Math.max(e.attackCd, 0.7); e.kx += cx * 35; e.ky += sy * 25; }
      break;
    case 'legs':
      g.particles?.smoke?.(e.x, e.y + 1, 1, '#8a8a8a', 20, 0.25);
      g.particles?.blood?.(e.x, e.y - 2, 1 + (heavy ? 1 : 0), dir, 85);
      if (free) {
        if ((heavy && Math.random() < 0.55) || o.knockdown) {
          // tersandung: melompat kecil ke depan lalu jatuh
          e.vz = Math.max(e.vz, 78); e.z = Math.max(e.z, 0.1); e.state = 'air'; e.pose = 'launched'; e.kx += cx * 70; e.ky += sy * 45; e.fuse = -1;
          e.fall = Math.random() < 0.6 ? 'knock' : 'broken'; e.fallFlip = Math.random() < 0.5 ? 1 : -1;
          g.texts?.hit?.(e.x, e.y - 20 * sc, 'TERSANDUNG!', '#ffe9a0', 1, 0.5);
        } else { e.stun = Math.max(e.stun, 0.42); e.state = 'stun'; e.attackCd = Math.max(e.attackCd, 0.6); }
      }
      break;
  }
}
