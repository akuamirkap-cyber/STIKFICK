import type { Pose } from './types';
import { FOOT_MOVES } from './footwork';
import { SCYTHE_MOVES } from './scythe';

export type Limb = 'fhand' | 'bhand' | 'ffoot' | 'bfoot' | 'both' | 'body' | 'nunchaku' | 'sweep' | 'blade' | 'blade2' | 'yoyo';

export interface Move {
  id: string;
  name: string;
  pose: Pose;
  dmg: number;
  structure: number;
  range: number;
  arc: number;
  windup: number;
  active: number;
  recover: number;
  kb: number;
  knockdown: boolean;
  lunge: number;
  hitstop: number;
  shake: number;
  sfx: 'punch' | 'kick' | 'heavy' | 'nunchaku' | 'yoyo' | 'slash' | 'axe' | 'dual';
  /** which skeleton joint carries the hitbox (hit tests use the real animated joint position) */
  limb: Limb;
  /** hitbox radius around the striking joint, px */
  hitR: number;
  launch?: number;
  finisher?: boolean;
  showName?: boolean;
  travel?: number;
  jump?: number;
  trail?: boolean;
  air?: boolean;
  /** multi-hit: minimum seconds between hits on the same target */
  rehit?: number;
  nunchaku?: boolean;
  yoyo?: boolean;
  orbit?: boolean;
  katana?: boolean;
  axe?: boolean;
  bat?: boolean;
  /** Buster Sword: pedang raksasa — berat, berjangkauan jauh, trail mako */
  buster?: boolean;
  /** tendangan fist-mode: bisa diselingi pukulan tangan */
  kick?: boolean;
  dual?: boolean;
  /** blade arc (radians) swept during the active frames: from -> to relative to aim, times facing */
  slash?: { from: number; to: number; r: number; lift?: number };
  bleed?: boolean;
}

// ============================== KUNG FU (fists) ==============================
// Sifu-style tree. Keys are input sequences: L = light (LMB), H = heavy (RMB).
export const MOVES: Record<string, Move> = {
  L: { id: 'jab', name: 'JAB', pose: 'jab', dmg: 2, structure: 8, range: 17, arc: 1.1, windup: 0.05, active: 0.09, recover: 0.1, kb: 70, knockdown: false, lunge: 60, hitstop: 0.035, shake: 0.18, sfx: 'punch', limb: 'fhand', hitR: 3.8, trail: true },
  LL: { id: 'cross', name: 'CROSS', pose: 'cross', dmg: 2, structure: 10, range: 18, arc: 1.1, windup: 0.06, active: 0.09, recover: 0.12, kb: 100, knockdown: false, lunge: 80, hitstop: 0.04, shake: 0.2, sfx: 'punch', limb: 'bhand', hitR: 3.8, trail: true },
  LLL: { id: 'hook', name: 'HOOK', pose: 'hook', dmg: 3, structure: 14, range: 17, arc: 1.4, windup: 0.08, active: 0.1, recover: 0.14, kb: 130, knockdown: false, lunge: 70, hitstop: 0.05, shake: 0.28, sfx: 'kick', limb: 'bhand', hitR: 5, trail: true },
  LLLL: { id: 'roundhouse', name: 'ROUNDHOUSE', pose: 'roundhouse', dmg: 5, structure: 22, range: 23, arc: 1.7, windup: 0.11, active: 0.13, recover: 0.26, kb: 300, knockdown: true, lunge: 50, hitstop: 0.08, shake: 0.5, sfx: 'heavy', limb: 'ffoot', hitR: 6, launch: 50, trail: true, finisher: true, showName: true },
  LLLLL: { id: 'dragontail', name: 'DRAGON TAIL', pose: 'dragontail', dmg: 7, structure: 40, range: 26, arc: Math.PI, windup: 0.1, active: 0.2, recover: 0.3, kb: 420, knockdown: true, lunge: 30, hitstop: 0.1, shake: 0.8, sfx: 'heavy', limb: 'bfoot', hitR: 6.5, launch: 90, trail: true, finisher: true, showName: true },
  H: { id: 'palm', name: 'PALM STRIKE', pose: 'palm', dmg: 3, structure: 28, range: 19, arc: 1.0, windup: 0.13, active: 0.11, recover: 0.28, kb: 420, knockdown: false, lunge: 110, hitstop: 0.07, shake: 0.45, sfx: 'heavy', limb: 'both', hitR: 5.5, showName: true, trail: true },
  LH: { id: 'elbow', name: 'ELBOW SMASH', pose: 'elbow', dmg: 4, structure: 32, range: 17, arc: 1.2, windup: 0.08, active: 0.1, recover: 0.2, kb: 100, knockdown: false, lunge: 150, hitstop: 0.06, shake: 0.35, sfx: 'kick', limb: 'bhand', hitR: 5, trail: true, showName: true },
  LLH: { id: 'sweep', name: 'SWEEP KICK', pose: 'sweep', dmg: 3, structure: 20, range: 26, arc: Math.PI, windup: 0.11, active: 0.18, recover: 0.3, kb: 140, knockdown: true, lunge: 0, hitstop: 0.06, shake: 0.4, sfx: 'heavy', limb: 'sweep', hitR: 6, trail: true, showName: true },
  LLLH: { id: 'dragon', name: 'DRAGON UPPERCUT', pose: 'uppercut', dmg: 8, structure: 45, range: 19, arc: 1.0, windup: 0.13, active: 0.11, recover: 0.38, kb: 120, knockdown: true, lunge: 70, hitstop: 0.1, shake: 0.7, sfx: 'heavy', limb: 'bhand', hitR: 6, launch: 200, finisher: true, showName: true },
  HL: { id: 'knee', name: 'KNEE STRIKE', pose: 'knee', dmg: 4, structure: 30, range: 16, arc: 1.0, windup: 0.07, active: 0.11, recover: 0.18, kb: 160, knockdown: false, lunge: 170, hitstop: 0.06, shake: 0.35, sfx: 'kick', limb: 'ffoot', hitR: 5.5, launch: 40, showName: true },
  HLL: { id: 'axekick', name: 'AXE KICK', pose: 'axekick', dmg: 8, structure: 54, range: 25, arc: 1.2, windup: 0.15, active: 0.13, recover: 0.26, kb: 135, knockdown: true, lunge: 72, hitstop: 0.11, shake: 0.82, sfx: 'heavy', limb: 'ffoot', hitR: 7.0, kick: true, trail: true, finisher: true, showName: true },
  HLH: { id: 'monkeyflip', name: 'MONKEY FLIP KICK', pose: 'monkeyflip', dmg: 8, structure: 44, range: 24, arc: 1.2, windup: 0.12, active: 0.22, recover: 0.3, kb: 260, knockdown: true, lunge: 55, hitstop: 0.11, shake: 0.8, sfx: 'heavy', limb: 'ffoot', hitR: 6.8, launch: 240, jump: 14, kick: true, trail: true, finisher: true, showName: true },
  HH: { id: 'spinback', name: 'SPINNING BACKFIST', pose: 'spinback', dmg: 6, structure: 36, range: 22, arc: Math.PI, windup: 0.12, active: 0.26, recover: 0.26, kb: 340, knockdown: true, lunge: 40, hitstop: 0.09, shake: 0.6, sfx: 'heavy', limb: 'bhand', hitR: 7, trail: true, finisher: true, showName: true },
  HHL: { id: 'cranekick', name: 'CRANE KICK', pose: 'cranekick', dmg: 9, structure: 55, range: 24, arc: 0.9, windup: 0.22, active: 0.1, recover: 0.4, kb: 520, knockdown: true, lunge: 120, hitstop: 0.13, shake: 0.9, sfx: 'heavy', limb: 'ffoot', hitR: 7, launch: 120, finisher: true, showName: true },
  LHL: { id: 'doublepalm', name: 'TWIN PALM', pose: 'palm', dmg: 5, structure: 40, range: 19, arc: 1.0, windup: 0.1, active: 0.1, recover: 0.26, kb: 520, knockdown: true, lunge: 140, hitstop: 0.09, shake: 0.6, sfx: 'heavy', limb: 'both', hitR: 6, finisher: true, showName: true },
  LHH: { id: 'tigerclaw', name: 'TIGER CLAW', pose: 'tigerclaw', dmg: 6, structure: 34, range: 18, arc: 1.1, windup: 0.09, active: 0.14, recover: 0.26, kb: 180, knockdown: false, lunge: 110, hitstop: 0.08, shake: 0.5, sfx: 'kick', limb: 'both', hitR: 6, rehit: 0.07, bleed: true, finisher: true, showName: true },
  LLLLH: { id: 'mantis', name: 'MANTIS STRIKE', pose: 'mantis', dmg: 10, structure: 80, range: 20, arc: 0.9, windup: 0.18, active: 0.1, recover: 0.42, kb: 80, knockdown: false, lunge: 100, hitstop: 0.14, shake: 0.9, sfx: 'heavy', limb: 'fhand', hitR: 5, finisher: true, showName: true },
  DASH: { id: 'flying', name: 'FLYING KICK', pose: 'flying', dmg: 6, structure: 30, range: 20, arc: 1.0, windup: 0.05, active: 0.3, recover: 0.22, kb: 400, knockdown: true, lunge: 0, hitstop: 0.08, shake: 0.55, sfx: 'heavy', limb: 'ffoot', hitR: 6, travel: 330, jump: 10, finisher: true, showName: true },
  F_HEADBUTT: { id: 'headbutt', name: 'HEADBUTT', pose: 'headbutt', dmg: 7, structure: 50, range: 17, arc: 1.0, windup: 0.12, active: 0.1, recover: 0.3, kb: 560, knockdown: true, lunge: 110, hitstop: 0.12, shake: 0.85, sfx: 'heavy', limb: 'both', hitR: 7, finisher: true, showName: true },
  F_HSTRAIGHT: { id: 'hstraight', name: 'HEAVY STRAIGHT', pose: 'runpunch', dmg: 8, structure: 55, range: 21, arc: 0.9, windup: 0.14, active: 0.12, recover: 0.32, kb: 640, knockdown: true, lunge: 130, hitstop: 0.13, shake: 0.9, sfx: 'heavy', limb: 'bhand', hitR: 6.5, trail: true, finisher: true, showName: true },
  RUNPUNCH: { id: 'runpunch', name: 'RUNNING STRAIGHT', pose: 'runpunch', dmg: 6, structure: 30, range: 20, arc: 1.0, windup: 0.06, active: 0.22, recover: 0.26, kb: 440, knockdown: true, lunge: 0, hitstop: 0.08, shake: 0.5, sfx: 'heavy', limb: 'bhand', hitR: 6, travel: 300, finisher: true, showName: true },
  TKD: { id: 'tkd', name: 'TAEKWONDO SIDE KICK', pose: 'sidekick', dmg: 8, structure: 40, range: 24, arc: 1.0, windup: 0.08, active: 0.34, recover: 0.3, kb: 560, knockdown: true, lunge: 0, hitstop: 0.11, shake: 0.7, sfx: 'heavy', limb: 'ffoot', hitR: 6.5, travel: 360, jump: 16, finisher: true, showName: true },
  AIR: { id: 'divekick', name: 'DIVE KICK', pose: 'flying', dmg: 5, structure: 26, range: 22, arc: 1.2, windup: 0.03, active: 0.26, recover: 0.2, kb: 260, knockdown: true, lunge: 0, hitstop: 0.07, shake: 0.5, sfx: 'heavy', limb: 'ffoot', hitR: 7, launch: 85, travel: 340, finisher: true, showName: true, air: true },
  AIR1: { id: 'air_jab', name: 'AIR JAB', pose: 'jab', dmg: 3, structure: 14, range: 22, arc: 1.4, windup: 0.03, active: 0.09, recover: 0.08, kb: 45, knockdown: false, lunge: 35, hitstop: 0.035, shake: 0.2, sfx: 'punch', limb: 'fhand', hitR: 5.5, launch: 120, trail: true, air: true },
  AIR2: { id: 'air_cross', name: 'AIR CROSS', pose: 'cross', dmg: 4, structure: 18, range: 23, arc: 1.4, windup: 0.03, active: 0.09, recover: 0.08, kb: 50, knockdown: false, lunge: 40, hitstop: 0.04, shake: 0.24, sfx: 'punch', limb: 'bhand', hitR: 5.5, launch: 125, trail: true, air: true },
  AIR3: { id: 'air_roundhouse', name: 'AIR KICK', pose: 'roundhouse', dmg: 6, structure: 26, range: 26, arc: 1.6, windup: 0.04, active: 0.11, recover: 0.1, kb: 70, knockdown: false, lunge: 45, hitstop: 0.06, shake: 0.35, sfx: 'kick', limb: 'ffoot', hitR: 6.5, launch: 145, kick: true, trail: true, air: true, showName: true },
  AIR4: { id: 'air_slam', name: 'AIR AXE SLAM', pose: 'axekick', dmg: 9, structure: 45, range: 26, arc: 1.5, windup: 0.05, active: 0.12, recover: 0.18, kb: 180, knockdown: true, lunge: 40, hitstop: 0.1, shake: 0.65, sfx: 'heavy', limb: 'ffoot', hitR: 7, kick: true, trail: true, air: true, finisher: true, showName: true },
  AIR_H: { id: 'air_spike', name: 'METEOR SPIKE', pose: 'axekick', dmg: 10, structure: 55, range: 27, arc: 1.5, windup: 0.05, active: 0.14, recover: 0.2, kb: 240, knockdown: true, lunge: 45, hitstop: 0.11, shake: 0.75, sfx: 'heavy', limb: 'ffoot', hitR: 7.5, kick: true, trail: true, air: true, finisher: true, showName: true },
  // ---- BLACK LEG (Sanji): a rolling kick flow built by MEDIUM rhythm (0.3-0.6s between clicks). Each click = next kick.
  S1: { id: 's_collier', name: 'COLLIER', pose: 's_collier', dmg: 4, structure: 18, range: 24, arc: 1.2, windup: 0.06, active: 0.1, recover: 0.12, kb: 160, knockdown: false, lunge: 90, hitstop: 0.05, shake: 0.3, sfx: 'kick', limb: 'ffoot', hitR: 5.5, trail: true },
  S2: { id: 's_epaule', name: 'EPAULE', pose: 's_epaule', dmg: 4, structure: 20, range: 24, arc: 1.2, windup: 0.06, active: 0.1, recover: 0.12, kb: 180, knockdown: false, lunge: 80, hitstop: 0.05, shake: 0.3, sfx: 'kick', limb: 'ffoot', hitR: 5.5, trail: true },
  S3: { id: 's_cotelette', name: 'COTELETTE', pose: 's_cotelette', dmg: 4, structure: 20, range: 22, arc: 1.3, windup: 0.06, active: 0.1, recover: 0.12, kb: 190, knockdown: false, lunge: 80, hitstop: 0.05, shake: 0.32, sfx: 'kick', limb: 'bfoot', hitR: 5.5, trail: true },
  S4: { id: 's_antimanner', name: 'ANTI-MANNER KICK COURSE', pose: 's_antimanner', dmg: 6, structure: 32, range: 25, arc: 1.3, windup: 0.08, active: 0.12, recover: 0.16, kb: 260, knockdown: false, lunge: 110, hitstop: 0.07, shake: 0.45, sfx: 'heavy', limb: 'ffoot', hitR: 6, trail: true, showName: true },
  S5: { id: 's_mouton', name: 'MOUTON SHOT', pose: 's_mouton', dmg: 9, structure: 50, range: 26, arc: 1.2, windup: 0.1, active: 0.12, recover: 0.3, kb: 620, knockdown: true, lunge: 140, hitstop: 0.12, shake: 0.9, sfx: 'heavy', limb: 'ffoot', hitR: 6.5, launch: 60, trail: true, finisher: true, showName: true },
  S6: { id: 's_concasse', name: 'CONCASSE', pose: 's_concasse', dmg: 10, structure: 70, range: 24, arc: 1.0, windup: 0.14, active: 0.1, recover: 0.34, kb: 160, knockdown: true, lunge: 60, hitstop: 0.13, shake: 1.0, sfx: 'heavy', limb: 'ffoot', hitR: 6.5, jump: 12, trail: true, finisher: true, showName: true },
  S7: { id: 's_partytable', name: 'PARTY TABLE KICK COURSE', pose: 's_partyTable', dmg: 5, structure: 24, range: 30, arc: Math.PI, windup: 0.1, active: 0.5, recover: 0.3, kb: 300, knockdown: true, lunge: 0, hitstop: 0.05, shake: 0.5, sfx: 'kick', limb: 'ffoot', hitR: 6, trail: true, rehit: 0.14, finisher: true, showName: true },
  S8: { id: 's_diable', name: 'DIABLE JAMBE', pose: 's_diable', dmg: 16, structure: 120, range: 28, arc: 1.1, windup: 0.16, active: 0.14, recover: 0.4, kb: 760, knockdown: true, lunge: 180, hitstop: 0.16, shake: 1.2, sfx: 'heavy', limb: 'ffoot', hitR: 7.5, launch: 140, trail: true, finisher: true, showName: true },
  // ---- KUNG FU heavy flow (SLOW rhythm 0.6-1.0s): iron palm / hammer fist additions
  KF1: { id: 'k_ironpalm', name: 'IRON PALM', pose: 'k_ironpalm', dmg: 8, structure: 55, range: 20, arc: 1.0, windup: 0.16, active: 0.1, recover: 0.3, kb: 520, knockdown: true, lunge: 120, hitstop: 0.12, shake: 0.8, sfx: 'heavy', limb: 'fhand', hitR: 6, showName: true },
  KF2: { id: 'k_hammerfist', name: 'HAMMER FIST', pose: 'k_hammerfist', dmg: 9, structure: 70, range: 18, arc: 1.0, windup: 0.18, active: 0.1, recover: 0.34, kb: 140, knockdown: true, lunge: 100, hitstop: 0.13, shake: 0.9, sfx: 'heavy', limb: 'bhand', hitR: 6, showName: true },
  // ---- WING CHUN chain punch: rapid alternating vertical fists; spamming LMB in rhythm (0.1-0.4s) keeps the chain unbroken
  CHAIN: { id: 'chain', name: 'CHAIN PUNCH', pose: 'chainpunch', dmg: 1.4, structure: 7, range: 17, arc: 1.0, windup: 0.02, active: 0.06, recover: 0.05, kb: 25, knockdown: false, lunge: 50, hitstop: 0.018, shake: 0.1, sfx: 'punch', limb: 'fhand', hitR: 4.5 },
  // the chain's finishing blow: fires automatically when the target is almost dead (or on a long chain)
  CHAINEND: { id: 'chainend', name: 'WING CHUN FINISH', pose: 'chainfinish', dmg: 9, structure: 60, range: 20, arc: 1.0, windup: 0.08, active: 0.1, recover: 0.3, kb: 560, knockdown: true, lunge: 120, hitstop: 0.12, shake: 0.9, sfx: 'heavy', limb: 'both', hitR: 6, launch: 60, finisher: true, showName: true },
  // RAGE execution strike (after the rage dash): instant, lethal to normal enemies
  RAGEKILL: { id: 'ragekill', name: 'RAGE', pose: 'ragekill', dmg: 30, structure: 999, range: 22, arc: 1.4, windup: 0.03, active: 0.08, recover: 0.12, kb: 520, knockdown: true, lunge: 0, hitstop: 0.06, shake: 0.6, sfx: 'heavy', limb: 'bhand', hitR: 7, finisher: true },
  FOCUS: { id: 'focus', name: 'DRAGON PALM', pose: 'palm', dmg: 14, structure: 999, range: 24, arc: 1.4, windup: 0.06, active: 0.12, recover: 0.3, kb: 460, knockdown: true, lunge: 0, hitstop: 0.14, shake: 0.9, sfx: 'heavy', limb: 'both', hitR: 9, launch: 120, finisher: true, showName: true },

  // ============================== NUNCHAKU (Freestyle & Atraksi Kung Fu) ==============================
  // The striking end of the chain IS the hitbox (physics-driven), so these moves hit exactly where the weapon is.
  NL: { id: 'n_tri1', name: 'DRAGON LASH', pose: 'n_tri1', dmg: 4.5, structure: 18, range: 25, arc: 1.4, windup: 0.07, active: 0.14, recover: 0.11, kb: 110, knockdown: false, lunge: 70, hitstop: 0.045, shake: 0.25, sfx: 'nunchaku', limb: 'nunchaku', hitR: 4.8, nunchaku: true, trail: true },
  NLL: { id: 'n_tri2', name: 'SHOULDER BOUNCE', pose: 'n_tri2', dmg: 4, structure: 18, range: 25, arc: 1.4, windup: 0.06, active: 0.15, recover: 0.11, kb: 105, knockdown: false, lunge: 78, hitstop: 0.04, shake: 0.24, sfx: 'nunchaku', limb: 'nunchaku', hitR: 4.8, nunchaku: true, trail: true },
  NLLL: { id: 'n_figure8', name: 'FIGURE-8 FLOW', pose: 'n_figure8', dmg: 3.5, structure: 22, range: 27, arc: 1.8, windup: 0.06, active: 0.32, recover: 0.14, kb: 140, knockdown: false, lunge: 55, hitstop: 0.035, shake: 0.28, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.2, nunchaku: true, rehit: 0.11, showName: true, trail: true },
  NLLLL: { id: 'n_backpass', name: 'AROUND THE BACK', pose: 'n_backpass', dmg: 6, structure: 34, range: 27, arc: 2.0, windup: 0.07, active: 0.24, recover: 0.16, kb: 210, knockdown: false, lunge: 65, hitstop: 0.065, shake: 0.45, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.5, nunchaku: true, showName: true, trail: true },
  NLLLLL: { id: 'n_whipcrack', name: 'ENTER THE DRAGON CRACK!', pose: 'n_whipcrack', dmg: 10, structure: 60, range: 30, arc: 1.3, windup: 0.11, active: 0.15, recover: 0.28, kb: 360, knockdown: true, lunge: 75, hitstop: 0.11, shake: 0.8, sfx: 'nunchaku', limb: 'nunchaku', hitR: 6.2, nunchaku: true, finisher: true, showName: true, trail: true },
  NH: { id: 'n_helicopter', name: 'HELICOPTER HALO', pose: 'n_helicopter', dmg: 3, structure: 16, range: 29, arc: Math.PI, windup: 0.08, active: 0.48, recover: 0.2, kb: 160, knockdown: false, lunge: 30, hitstop: 0.03, shake: 0.25, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.5, nunchaku: true, rehit: 0.13, showName: true, trail: true },
  NLH: { id: 'n_toss', name: 'AERIAL TOSS & SNAP', pose: 'n_toss', dmg: 7.5, structure: 45, range: 29, arc: 1.4, windup: 0.1, active: 0.22, recover: 0.24, kb: 320, knockdown: true, lunge: 60, hitstop: 0.09, shake: 0.65, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.8, nunchaku: true, launch: 85, finisher: true, showName: true, trail: true },
  NLLH: { id: 'n_choke', name: 'CHAIN CHOKE SLAM', pose: 'n_choke', dmg: 9, structure: 70, range: 22, arc: 1.1, windup: 0.12, active: 0.16, recover: 0.32, kb: 500, knockdown: true, lunge: 90, hitstop: 0.12, shake: 0.9, sfx: 'nunchaku', limb: 'nunchaku', hitR: 6, nunchaku: true, launch: 60, finisher: true, showName: true },
  NHL: { id: 'n_lowsweep', name: 'ANKLE BREAKER', pose: 'n_lowsweep', dmg: 4.5, structure: 32, range: 27, arc: Math.PI, windup: 0.1, active: 0.22, recover: 0.24, kb: 170, knockdown: true, lunge: 30, hitstop: 0.06, shake: 0.4, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.5, nunchaku: true, rehit: 0.18, showName: true },
  NHH: { id: 'n_tornado', name: 'TORNADO SPIN', pose: 'n_tornado', dmg: 3.5, structure: 20, range: 30, arc: Math.PI, windup: 0.09, active: 0.62, recover: 0.26, kb: 230, knockdown: true, lunge: 35, hitstop: 0.04, shake: 0.35, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.8, nunchaku: true, rehit: 0.12, launch: 55, finisher: true, showName: true, trail: true },
  // RUN + LMB with the nunchaku: the lethal charging strike (replaces the taekwondo kick while the nunchaku is out)
  NRUN: { id: 'n_dragonlash', name: 'DRAGON LASH', pose: 'n_dragonlash', dmg: 12, structure: 90, range: 30, arc: 1.0, windup: 0.08, active: 0.34, recover: 0.3, kb: 620, knockdown: true, lunge: 0, hitstop: 0.13, shake: 0.9, sfx: 'nunchaku', limb: 'nunchaku', hitR: 7, nunchaku: true, launch: 140, travel: 360, jump: 8, rehit: 0.18, finisher: true, showName: true },
  NDASH: { id: 'n_flyspin', name: 'FLYING HELICOPTER', pose: 'n_helicopter', dmg: 3, structure: 16, range: 28, arc: Math.PI, windup: 0.05, active: 0.36, recover: 0.22, kb: 300, knockdown: true, lunge: 0, hitstop: 0.05, shake: 0.4, sfx: 'nunchaku', limb: 'nunchaku', hitR: 5.5, nunchaku: true, rehit: 0.12, travel: 300, jump: 10, finisher: true, showName: true },


  // YOYO V2: freestyle system transferred from MAXKUNG.
  YL: { id: 'y_snap', name: 'TOPROCK THROW', pose: 'y2_toprock', dmg: 5, structure: 18, range: 78, arc: 1.2, windup: 0.04, active: 0.34, recover: 0.1, kb: 140, knockdown: false, lunge: 0, hitstop: 0.025, shake: 0.18, sfx: 'yoyo', limb: 'yoyo', hitR: 6, yoyo: true },
  YLL: { id: 'y_loop', name: 'CROSS STEP LOOP', pose: 'y2_crossstep', dmg: 6, structure: 23, range: 82, arc: 1.5, windup: 0.04, active: 0.38, recover: 0.1, kb: 170, knockdown: false, lunge: 0, hitstop: 0.03, shake: 0.22, sfx: 'yoyo', limb: 'yoyo', hitR: 7, yoyo: true, showName: true },
  YLLL: { id: 'y_dragon', name: 'WINDMILL WHIP', pose: 'y2_windmill', dmg: 10, structure: 45, range: 90, arc: 1.7, windup: 0.06, active: 0.48, recover: 0.16, kb: 300, knockdown: true, lunge: 0, hitstop: 0.05, shake: 0.4, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, launch: 70, showName: true, trail: true },
  YLLLL: { id: 'y_trapeze', name: 'ONE HAND FREEZE', pose: 'y2_freeze', dmg: 8, structure: 35, range: 86, arc: 1.9, windup: 0.05, active: 0.4, recover: 0.12, kb: 220, knockdown: false, lunge: 0, hitstop: 0.035, shake: 0.28, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, showName: true, trail: true },
  YLLLLL: { id: 'y_flare', name: 'B-BOY FLARE', pose: 'y2_spin', dmg: 5, structure: 24, range: 64, arc: Math.PI, windup: 0.06, active: 0.56, recover: 0.16, kb: 200, knockdown: true, lunge: 0, hitstop: 0.025, shake: 0.3, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, rehit: 0.24, finisher: true, showName: true, trail: true },
  YH: { id: 'y_orbit', name: 'BREAKDANCE ORBIT', pose: 'y2_spin', dmg: 3.5, structure: 15, range: 54, arc: Math.PI, windup: 0.06, active: 0.65, recover: 0.13, kb: 105, knockdown: false, lunge: 0, hitstop: 0.015, shake: 0.12, sfx: 'yoyo', limb: 'yoyo', hitR: 7, yoyo: true, rehit: 0.28, showName: true, trail: true },
  YLH: { id: 'y_trapeze', name: 'FREEZE TRAPEZE', pose: 'y2_freeze', dmg: 8, structure: 35, range: 85, arc: 1.9, windup: 0.05, active: 0.44, recover: 0.14, kb: 240, knockdown: true, lunge: 0, hitstop: 0.04, shake: 0.3, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, launch: 80, finisher: true, showName: true, trail: true },
  YLLH: { id: 'y_trapeze', name: 'FREEZE TRAPEZE', pose: 'y2_freeze', dmg: 9, structure: 40, range: 88, arc: 1.9, windup: 0.05, active: 0.44, recover: 0.14, kb: 260, knockdown: true, lunge: 0, hitstop: 0.04, shake: 0.3, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, launch: 90, finisher: true, showName: true, trail: true },
  YHL: { id: 'y_breakaway', name: 'WINDMILL BREAK', pose: 'y2_windmill', dmg: 8, structure: 32, range: 92, arc: 1.8, windup: 0.04, active: 0.44, recover: 0.12, kb: 220, knockdown: true, lunge: 0, hitstop: 0.04, shake: 0.3, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, finisher: true, showName: true, trail: true },
  YHH: { id: 'y_storm', name: 'FLARE STORM', pose: 'y2_spin', dmg: 4, structure: 18, range: 64, arc: Math.PI, windup: 0.06, active: 0.7, recover: 0.16, kb: 140, knockdown: false, lunge: 0, hitstop: 0.02, shake: 0.2, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, rehit: 0.24, finisher: true, showName: true, trail: true },
  YRUN: { id: 'y_rocket', name: 'SLIDE THROW', pose: 'y2_crossstep', dmg: 9, structure: 35, range: 96, arc: 1.4, windup: 0.04, active: 0.39, recover: 0.12, kb: 280, knockdown: true, lunge: 0, hitstop: 0.04, shake: 0.3, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, finisher: true, showName: true },
  YAIR: { id: 'y_air', name: 'AIR FLARE', pose: 'y2_airflip', dmg: 8, structure: 30, range: 85, arc: 1.5, windup: 0.04, active: 0.38, recover: 0.12, kb: 220, knockdown: true, lunge: 0, hitstop: 0.035, shake: 0.25, sfx: 'yoyo', limb: 'yoyo', hitR: 8, yoyo: true, showName: true, trail: true },

  // ============================== BASEBALL BAT (Weighty Freestyle Swings & Showtime Atraksi) ==============================
  BL: { id: 'b_chop', name: 'SLUGGER SWING', pose: 'a_swing1', dmg: 6, structure: 24, range: 28, arc: 1.6, windup: 0.1, active: 0.12, recover: 0.15, kb: 230, knockdown: false, lunge: 68, hitstop: 0.05, shake: 0.38, sfx: 'axe', limb: 'blade', hitR: 6, bat: true, trail: true, slash: { from: -2.2, to: 1.0, r: 21 } },
  BLL: { id: 'b_back', name: 'BACKHAND DRIVE', pose: 'a_swing2', dmg: 6, structure: 26, range: 28, arc: 1.6, windup: 0.095, active: 0.12, recover: 0.15, kb: 250, knockdown: false, lunge: 64, hitstop: 0.05, shake: 0.4, sfx: 'axe', limb: 'blade', hitR: 6, bat: true, trail: true, slash: { from: 2.2, to: -1.0, r: 21 } },
  BLLL: { id: 'b_golf', name: 'POP-FLY SCOOP', pose: 'a_golf', dmg: 7.5, structure: 34, range: 29, arc: 1.4, windup: 0.11, active: 0.13, recover: 0.16, kb: 290, knockdown: true, lunge: 72, hitstop: 0.065, shake: 0.5, sfx: 'axe', limb: 'blade', hitR: 6.2, bat: true, launch: 85, trail: true, slash: { from: 1.6, to: -1.5, r: 21, lift: 0.45 } },
  BLLLL: { id: 'b_homerun', name: 'HOME RUN!', pose: 'b_callshot', dmg: 14, structure: 80, range: 33, arc: 1.7, windup: 0.15, active: 0.14, recover: 0.22, kb: 840, knockdown: true, lunge: 105, hitstop: 0.12, shake: 1.05, sfx: 'axe', limb: 'blade', hitR: 7, bat: true, launch: 180, finisher: true, showName: true, trail: true, slash: { from: -2.6, to: 1.2, r: 24 } },
  BH: { id: 'b_spin', name: 'CORKSCREW TORNADO', pose: 'b_corkscrew', dmg: 5, structure: 22, range: 31, arc: Math.PI, windup: 0.1, active: 0.36, recover: 0.18, kb: 280, knockdown: true, lunge: 35, hitstop: 0.04, shake: 0.4, sfx: 'axe', limb: 'blade', hitR: 6.5, bat: true, rehit: 0.13, showName: true, trail: true, slash: { from: 0, to: 6.3, r: 22 } },
  BRUN: { id: 'b_grandslam', name: 'GRAND SLAM!', pose: 'b_callshot', dmg: 16, structure: 95, range: 34, arc: 1.7, windup: 0.1, active: 0.22, recover: 0.22, kb: 920, knockdown: true, lunge: 0, hitstop: 0.13, shake: 1.15, sfx: 'axe', limb: 'blade', hitR: 7.5, bat: true, launch: 200, travel: 310, finisher: true, showName: true, trail: true, slash: { from: -2.5, to: 1.2, r: 24 } },
  BDASH: { id: 'b_slide', name: 'KNEE SLIDE SWEEP', pose: 'b_kneeslider', dmg: 9, structure: 45, range: 29, arc: 1.6, windup: 0.07, active: 0.20, recover: 0.18, kb: 480, knockdown: true, lunge: 0, hitstop: 0.08, shake: 0.6, sfx: 'axe', limb: 'blade', hitR: 6.5, bat: true, launch: 95, travel: 270, showName: true, trail: true, slash: { from: 2.1, to: -1.5, r: 22 } },

  // ============================== KATANA ==============================
  // The blade sweeps an arc during the active frames; the hitbox is the swept blade segment (base->tip).
  KL: { id: 'k_draw', name: 'IAI DRAW', pose: 'k_draw', dmg: 6, structure: 20, range: 30, arc: 1.3, windup: 0.08, active: 0.08, recover: 0.16, kb: 160, knockdown: false, lunge: 150, hitstop: 0.07, shake: 0.35, sfx: 'slash', limb: 'blade', hitR: 3.5, katana: true, bleed: true, slash: { from: -1.4, to: 0.9, r: 18 } },
  KLL: { id: 'k_return', name: 'RETURN CUT', pose: 'k_return', dmg: 6, structure: 22, range: 30, arc: 1.3, windup: 0.07, active: 0.08, recover: 0.16, kb: 170, knockdown: false, lunge: 120, hitstop: 0.07, shake: 0.35, sfx: 'slash', limb: 'blade', hitR: 3.5, katana: true, bleed: true, slash: { from: 1.2, to: -1.0, r: 18 } },
  KLLL: { id: 'k_crescent', name: 'CRESCENT MOON', pose: 'k_crescent', dmg: 8, structure: 30, range: 32, arc: 2.0, windup: 0.1, active: 0.12, recover: 0.2, kb: 220, knockdown: true, lunge: 110, hitstop: 0.09, shake: 0.5, sfx: 'slash', limb: 'blade', hitR: 4, katana: true, bleed: true, slash: { from: -2.2, to: 1.6, r: 20 }, finisher: false, showName: true },
  KLLLL: { id: 'k_heaven', name: 'HEAVEN SPLITTER', pose: 'k_heaven', dmg: 16, structure: 80, range: 32, arc: 0.9, windup: 0.2, active: 0.08, recover: 0.4, kb: 300, knockdown: true, lunge: 140, hitstop: 0.16, shake: 1, sfx: 'slash', limb: 'blade', hitR: 5, katana: true, bleed: true, slash: { from: 0, to: 0, r: 22, lift: 1 }, finisher: true, showName: true },
  KH: { id: 'k_thrust', name: 'LUNGING THRUST', pose: 'k_thrust', dmg: 10, structure: 40, range: 40, arc: 0.6, windup: 0.14, active: 0.16, recover: 0.3, kb: 380, knockdown: true, lunge: 220, hitstop: 0.11, shake: 0.7, sfx: 'slash', limb: 'blade', hitR: 4, katana: true, bleed: true, slash: { from: 0, to: 0, r: 24 }, finisher: true, showName: true },
  KLH: { id: 'k_rising', name: 'RISING MOON', pose: 'k_rising', dmg: 9, structure: 50, range: 28, arc: 1.0, windup: 0.11, active: 0.1, recover: 0.3, kb: 140, knockdown: true, lunge: 90, hitstop: 0.11, shake: 0.7, sfx: 'slash', limb: 'blade', hitR: 4, katana: true, bleed: true, slash: { from: 0.9, to: -1.9, r: 20, lift: 0.6 }, launch: 220, finisher: true, showName: true },
  KLLH: { id: 'k_whirlwind', name: 'WHIRLWIND', pose: 'k_whirlwind', dmg: 5, structure: 24, range: 34, arc: Math.PI, windup: 0.12, active: 0.4, recover: 0.32, kb: 260, knockdown: true, lunge: 0, hitstop: 0.06, shake: 0.5, sfx: 'slash', limb: 'blade', hitR: 4, katana: true, bleed: true, rehit: 0.16, slash: { from: 0, to: Math.PI * 4, r: 21 }, finisher: true, showName: true },
  KHL: { id: 'k_thousand', name: 'THOUSAND CUTS', pose: 'k_thousand', dmg: 2, structure: 10, range: 30, arc: 1.1, windup: 0.06, active: 0.5, recover: 0.3, kb: 40, knockdown: false, lunge: 60, hitstop: 0.025, shake: 0.15, sfx: 'slash', limb: 'blade', hitR: 4, katana: true, bleed: true, rehit: 0.07, slash: { from: -1.2, to: 1.2, r: 18 }, finisher: true, showName: true },
  KHH: { id: 'k_dragonfang', name: 'DRAGON FANG', pose: 'k_dragonfang', dmg: 14, structure: 70, range: 36, arc: 1.2, windup: 0.18, active: 0.14, recover: 0.42, kb: 480, knockdown: true, lunge: 60, hitstop: 0.15, shake: 1, sfx: 'slash', limb: 'blade', hitR: 5, katana: true, bleed: true, slash: { from: -2.4, to: 0.6, r: 24 }, launch: 80, finisher: true, showName: true },
  // RUN + LMB with the katana: the dash-through "one cut" (Iaijutsu)
  KRUN: { id: 'k_iaijutsu', name: 'IAIJUTSU', pose: 'k_iaijutsu', dmg: 18, structure: 120, range: 36, arc: 1.0, windup: 0.1, active: 0.26, recover: 0.5, kb: 120, knockdown: true, lunge: 0, hitstop: 0.0, shake: 0.3, sfx: 'slash', limb: 'blade', hitR: 6, katana: true, bleed: true, travel: 520, rehit: 0.3, slash: { from: 0, to: 0, r: 21 }, finisher: true, showName: true },
  KDASH: { id: 'k_dashcut', name: 'DASH CUT', pose: 'k_crescent', dmg: 9, structure: 36, range: 32, arc: 1.6, windup: 0.04, active: 0.24, recover: 0.24, kb: 280, knockdown: true, lunge: 0, hitstop: 0.09, shake: 0.5, sfx: 'slash', limb: 'blade', hitR: 4.5, katana: true, bleed: true, travel: 300, slash: { from: -2.0, to: 1.4, r: 20 }, finisher: true, showName: true },
  // V2 finisher: bilah melesat masuk sarung — ring putih + slow-mo sekejap ala panel manga Takamura
  KSHEATH: { id: 'k_sheatheflash', name: 'SHEATHE FLASH', pose: 'k_sheathe', dmg: 6, structure: 40, range: 26, arc: 2.6, windup: 0.05, active: 0.05, recover: 0.34, kb: 240, knockdown: true, lunge: 0, hitstop: 0.16, shake: 0.9, sfx: 'slash', limb: 'blade', hitR: 4, katana: true, bleed: true, slash: { from: -0.5, to: 0.5, r: 15 }, finisher: true, showName: true },
};

// ============================== AXE: baseball-bat swings (flat, hip-driven, follow-through) ==============================
Object.assign(MOVES, {
  // LMB chain: a slugger's combo. Every swing is a full horizontal bat swing with a load (wind-up), hip rotation, contact and follow-through.
  AL: { id: 'a_swing1', name: 'SWING', pose: 'a_swing1', dmg: 9, structure: 40, range: 28, arc: 1.5, windup: 0.14, active: 0.1, recover: 0.26, kb: 380, knockdown: true, lunge: 90, hitstop: 0.1, shake: 0.7, sfx: 'axe', limb: 'blade', hitR: 5.5, axe: true, bleed: true, slash: { from: -2.4, to: 0.9, r: 21 } },
  ALL: { id: 'a_swing2', name: 'BACKHAND', pose: 'a_swing2', dmg: 9, structure: 40, range: 28, arc: 1.5, windup: 0.12, active: 0.1, recover: 0.24, kb: 380, knockdown: true, lunge: 80, hitstop: 0.1, shake: 0.7, sfx: 'axe', limb: 'blade', hitR: 5.5, axe: true, bleed: true, slash: { from: 2.4, to: -0.9, r: 21 } },
  ALLL: { id: 'a_homerun', name: 'HOME RUN', pose: 'a_homerun', dmg: 16, structure: 90, range: 32, arc: 1.6, windup: 0.22, active: 0.1, recover: 0.4, kb: 760, knockdown: true, lunge: 120, hitstop: 0.16, shake: 1.2, sfx: 'axe', limb: 'blade', hitR: 6.5, axe: true, bleed: true, launch: 160, slash: { from: -2.8, to: 1.1, r: 24 }, finisher: true, showName: true },
  // RMB: a 720 spinning swing that keeps going
  AH: { id: 'a_spin', name: 'TORNADO SWING', pose: 'a_spin', dmg: 7, structure: 40, range: 32, arc: Math.PI, windup: 0.18, active: 0.56, recover: 0.4, kb: 420, knockdown: true, lunge: 0, hitstop: 0.08, shake: 0.7, sfx: 'axe', limb: 'blade', hitR: 6, axe: true, bleed: true, rehit: 0.22, slash: { from: 0, to: Math.PI * 4, r: 24 }, finisher: true, showName: true },
  // LMB, RMB: golf-swing upper: scoops the target off the floor into the air
  ALH: { id: 'a_golf', name: 'GOLF SWING', pose: 'a_golf', dmg: 11, structure: 60, range: 28, arc: 1.1, windup: 0.16, active: 0.1, recover: 0.36, kb: 200, knockdown: true, lunge: 70, hitstop: 0.12, shake: 0.9, sfx: 'axe', limb: 'blade', hitR: 6, axe: true, bleed: true, launch: 260, slash: { from: 1.2, to: -1.6, r: 22, lift: 0.5 }, finisher: true, showName: true },
  // LMB, LMB, RMB: the overhead chop (the only vertical one)
  ALLH: { id: 'a_overhead', name: 'SKULL SPLITTER', pose: 'a_overhead', dmg: 18, structure: 110, range: 28, arc: 0.9, windup: 0.26, active: 0.08, recover: 0.5, kb: 200, knockdown: true, lunge: 140, hitstop: 0.18, shake: 1.2, sfx: 'axe', limb: 'blade', hitR: 6.5, axe: true, bleed: true, slash: { from: 0, to: 0, r: 22, lift: 1.2 }, finisher: true, showName: true },
  // RMB, LMB: bunt - a short, fast jab with the haft that staggers
  AHL: { id: 'a_bunt', name: 'BUNT', pose: 'a_bunt', dmg: 5, structure: 55, range: 22, arc: 1.0, windup: 0.06, active: 0.1, recover: 0.16, kb: 240, knockdown: false, lunge: 110, hitstop: 0.06, shake: 0.4, sfx: 'axe', limb: 'blade', hitR: 5, axe: true, slash: { from: 0, to: 0, r: 18 }, showName: true },
  // RUN + LMB: grand slam - sprinting flat swing with a huge launch
  ARUN: { id: 'a_grandslam', name: 'GRAND SLAM', pose: 'a_homerun', dmg: 20, structure: 130, range: 34, arc: 1.6, windup: 0.1, active: 0.3, recover: 0.46, kb: 900, knockdown: true, lunge: 0, hitstop: 0.18, shake: 1.3, sfx: 'axe', limb: 'blade', hitR: 7, axe: true, bleed: true, launch: 200, travel: 300, slash: { from: -2.8, to: 1.1, r: 24 }, finisher: true, showName: true },
  ADASH: { id: 'a_dashswing', name: 'SLIDING SWING', pose: 'a_swing1', dmg: 12, structure: 60, range: 30, arc: 1.5, windup: 0.05, active: 0.24, recover: 0.36, kb: 460, knockdown: true, lunge: 0, hitstop: 0.12, shake: 0.8, sfx: 'axe', limb: 'blade', hitR: 6, axe: true, bleed: true, travel: 280, slash: { from: -2.4, to: 0.9, r: 21 }, finisher: true, showName: true },
  // ============================== DUAL BLADES (fast, flurry, two hitboxes) ==============================
  DL: { id: 'd_cross', name: 'CROSS CUT', pose: 'd_cross', dmg: 4, structure: 12, range: 24, arc: 1.3, windup: 0.04, active: 0.08, recover: 0.08, kb: 90, knockdown: false, lunge: 90, hitstop: 0.04, shake: 0.25, sfx: 'dual', limb: 'blade2', hitR: 3.5, dual: true, bleed: true, slash: { from: -1.2, to: 0.8, r: 16 } },
  DLL: { id: 'd_scissor', name: 'SCISSOR', pose: 'd_scissor', dmg: 5, structure: 16, range: 24, arc: 1.3, windup: 0.05, active: 0.08, recover: 0.09, kb: 120, knockdown: false, lunge: 90, hitstop: 0.05, shake: 0.3, sfx: 'dual', limb: 'blade2', hitR: 3.5, dual: true, bleed: true, slash: { from: 1.1, to: -0.9, r: 16 } },
  DLLL: { id: 'd_flurry', name: 'BLADE FLURRY', pose: 'd_flurry', dmg: 2, structure: 8, range: 24, arc: 1.2, windup: 0.05, active: 0.45, recover: 0.2, kb: 30, knockdown: false, lunge: 70, hitstop: 0.02, shake: 0.15, sfx: 'dual', limb: 'blade2', hitR: 3.5, dual: true, bleed: true, rehit: 0.06, slash: { from: -1.0, to: 1.0, r: 16 }, showName: true },
  DLLLL: { id: 'd_xslash', name: 'X-SLASH', pose: 'd_xslash', dmg: 12, structure: 50, range: 26, arc: 1.2, windup: 0.14, active: 0.1, recover: 0.3, kb: 300, knockdown: true, lunge: 120, hitstop: 0.12, shake: 0.8, sfx: 'dual', limb: 'blade2', hitR: 4.5, dual: true, bleed: true, slash: { from: -1.4, to: 1.4, r: 18 }, finisher: true, showName: true },
  DH: { id: 'd_dance', name: 'BLADE DANCE', pose: 'd_dance', dmg: 4, structure: 16, range: 28, arc: Math.PI, windup: 0.1, active: 0.6, recover: 0.3, kb: 200, knockdown: true, lunge: 0, hitstop: 0.04, shake: 0.4, sfx: 'dual', limb: 'blade2', hitR: 4, dual: true, bleed: true, rehit: 0.14, slash: { from: 0, to: Math.PI * 6, r: 18 }, finisher: true, showName: true },
  DLH: { id: 'd_launch', name: 'TWIN RISING', pose: 'd_launch', dmg: 9, structure: 40, range: 24, arc: 1.0, windup: 0.1, active: 0.12, recover: 0.3, kb: 120, knockdown: true, lunge: 140, hitstop: 0.1, shake: 0.7, sfx: 'dual', limb: 'blade2', hitR: 5, dual: true, bleed: true, launch: 220, slash: { from: 0.6, to: -1.2, r: 17, lift: 0.3 }, finisher: true, showName: true },
  DRUN: { id: 'd_dash', name: 'PHANTOM CROSS', pose: 'd_dash', dmg: 14, structure: 70, range: 30, arc: 1.0, windup: 0.08, active: 0.26, recover: 0.4, kb: 200, knockdown: true, lunge: 0, hitstop: 0.0, shake: 0.4, sfx: 'dual', limb: 'blade2', hitR: 5, dual: true, bleed: true, travel: 540, rehit: 0.3, slash: { from: 0, to: 0, r: 16 }, finisher: true, showName: true },
  DDASH: { id: 'd_dashcut', name: 'DASH SCISSOR', pose: 'd_scissor', dmg: 8, structure: 30, range: 26, arc: 1.4, windup: 0.04, active: 0.22, recover: 0.22, kb: 220, knockdown: true, lunge: 0, hitstop: 0.08, shake: 0.5, sfx: 'dual', limb: 'blade2', hitR: 4, dual: true, bleed: true, travel: 300, slash: { from: 1.3, to: -1.1, r: 16 }, finisher: true, showName: true },
} as Record<string, Move>);

export const MOVE_LIST: { keys: string; name: string; desc: string }[] = [
  { keys: 'KANTOR FIST: LMB / RMB / O', name: 'BUTTERFLY FLIP, AXE KICK & CARTWHEEL KICK', desc: 'Kombo Fist Mode di Kantor V2 dilengkapi AXE KICK (tendangan kapak lurus tinggi ke atas kepala lalu menghantam lurus ke bahu/kepala lawan), CARTWHEEL KICK (tendangan roda 360° dua kaki), dan BUTTERFLY FLIP ala Liu Kang dengan ancang-ancang membungkuk rendah yang bertenaga. Tekan RMB / O beruntun atau rangkai LMB untuk melancarkannya.' },
  { keys: '4 / N', name: 'NUNCHAKU V1 / V2', desc: 'Tekan 4 untuk memakai nunchaku dan N untuk berganti versi. V2 memakai rantai fisika serta kombo SWING, CROSS, SPIN, dan WHIP CRACK. Tahan klik kiri atau tekan berulang; klik kanan untuk WHIP CRACK.' },
  { keys: 'FIST / NUNCHAKU / BAT: G', name: 'ADEGAN AKSI SILAT', desc: 'Dekati musuh dan tekan G untuk memulai tangkapan, counter, atau adegan serangan. Serangan pada musuh yang lemah juga dapat memicu adegan otomatis.' },
  { keys: 'T: BASEBALL BAT', name: 'STREET BAT', desc: 'Tahan klik kiri untuk ayunan berantai, klik kanan untuk putaran, dan tekan T lagi untuk taunt. Serang musuh di udara untuk juggle.' },
  { keys: 'LMB x5', name: 'JAB > CROSS > HOOK > ROUNDHOUSE > DRAGON TAIL', desc: 'Light chain ending in a 360 launcher. Every hit lands where the fist/foot is.' },
  { keys: 'X', name: 'ONE FOR ALL (SLOW-MO SUPER)', desc: 'At 25+ charge, press X: the WORLD drops to 30% speed while you keep running at full real-time speed (about 4.4x faster than everything around you), the camera pulls back, lightning crackles off your body, and every strike AUTO-LOCKS and blinks to the nearest enemy. The meter burns for roughly 12.5 seconds on a full charge. Charge it by landing hits (damage x0.1), kills (+7, boss +15), parries (+5) and fatalities (+6/+10). Ported from STICK FIST.' },
  { keys: 'RHYTHM = STYLE', name: 'FREESTYLE FLOW (FISTS)', desc: 'Your click TEMPO picks the style and the game chains the moves. FAST taps (0.1-0.3s) = WING CHUN chain punch. MEDIUM groove (0.3-0.6s) = BLACK LEG kick flow (Collier > Epaule > Cotelette > Anti-Manner > Mouton Shot > Concasse > Party Table > DIABLE JAMBE). SLOW heavy beats (0.6-1.0s) = KUNG FU heavies (Palm > Iron Palm > Hammer Fist > Dragon Uppercut). Switch tempo mid-fight to transition styles; nearly-dead targets get an automatic finisher.' },
  { keys: 'HEAT', name: 'IN THE ZONE', desc: 'Stay in one rhythm to build HEAT: damage and move speed rise, the screen pulses with the beat. Getting hit cools you down.' },
  { keys: 'R (RAGE FULL)', name: 'RAGE MODE', desc: '8 seconds: every LMB dashes to the nearest enemy and executes it (bosses take heavy damage). Fair: rage only fills by landing chain punches.' },
  { keys: 'LMB x4, RMB', name: 'MANTIS STRIKE', desc: 'One-inch finger strike. Shatters structure.' },
  { keys: 'LMB x3, RMB', name: 'DRAGON UPPERCUT', desc: 'Launcher. Juggle them in the air.' },
  { keys: 'LMB, LMB, RMB', name: 'SWEEP KICK', desc: '360 sweep. Knocks everyone down.' },
  { keys: 'LMB, RMB, LMB / RMB', name: 'TWIN PALM / TIGER CLAW', desc: 'Palm blast across the room, or a 4-hit bleeding claw rake.' },
  { keys: 'RMB, LMB, LMB / RMB', name: 'AXE KICK / MONKEY FLIP', desc: 'Heel crash, or a backflip kick that launches.' },
  { keys: 'RMB, RMB, LMB', name: 'CRANE KICK', desc: 'The classic. Long windup, devastating.' },
  { keys: 'RUN + LMB', name: 'TAEKWONDO FLYING SIDE KICK', desc: 'Fists only. Sprint, then left click.' },
  { keys: '4: NUNCHAKU LMB x4', name: 'BRUCE LEE TRIANGLE COMBO', desc: 'From the underarm tuck: diagonal down-left strike > bounce up to the left shoulder > horizontal chest sweep back right > catch & lock under the right armpit. 5th LMB: SKULL CRACKER.' },
  { keys: 'NUNCHAKU RMB', name: 'HELICOPTER / SPECIALS', desc: 'RMB: HELICOPTER (hold). RMB,LMB: ANKLE BREAKER. RMB,RMB: TORNADO. LMB,RMB: WHIP CRACK. LMB,LMB,RMB: CHAIN CHOKE SLAM.' },
  { keys: 'NUNCHAKU: RUN + LMB', name: 'DRAGON LASH', desc: 'Lethal charging strike: leap in, chain whips around and detonates. Replaces the kick.' },
  { keys: 'NUNCHAKU: F', name: 'CHAIN FATALITIES', desc: 'Garrote snap, skull drum, helicopter decapitation.' },
  { keys: '5: KATANA', name: 'IAI DRAW > RETURN CUT > CRESCENT MOON > HEAVEN SPLITTER', desc: 'RMB: LUNGING THRUST. LMB,RMB: RISING MOON (launch). LMB,LMB,RMB: WHIRLWIND. RMB,LMB: THOUSAND CUTS. RMB,RMB: DRAGON FANG. Cuts bleed.' },
  { keys: 'KATANA: RUN + LMB', name: 'IAIJUTSU', desc: 'Dash through them. One cut. They fall after you sheathe.' },
  { keys: '5: KATANA V2', name: 'VARIABLE CHAINS + DASH SLASH', desc: 'Every chain is rolled: 1 cut then SHEATHE FLASH (snap into the sheath), 2 cuts then DASH CUT through them, or the classic 4-hit HEAVEN SPLITTER. Dash-slashes trail afterimages.' },
  { keys: 'KATANA: F', name: 'BLADE FATALITIES', desc: 'Bisection, beheading, impale & flick.' },
  { keys: '6: AXE', name: 'SWING > BACKHAND > HOME RUN', desc: 'Baseball-bat swings: load, hips, contact, follow-through. 3rd swing is a HOME RUN launcher. RMB: TORNADO SWING (720). LMB,RMB: GOLF SWING (scoop launch). LMB,LMB,RMB: SKULL SPLITTER. RMB,LMB: BUNT. RUN+LMB: GRAND SLAM.' },
  { keys: '7: DUAL BLADES', name: 'CROSS > SCISSOR > FLURRY > X-SLASH', desc: 'Two hitboxes, very fast. RMB: BLADE DANCE. LMB,RMB: TWIN RISING (launch). RUN+LMB: PHANTOM CROSS (dash through).' },
  { keys: 'SPACE', name: 'JUMP', desc: 'Hop over bullets and sweeps. LMB in the air = DIVE KICK.' },
  { keys: 'SHIFT', name: 'SHADOW STEP', desc: 'Dash with i-frames. Perfect-dodge to refill focus.' },
  { keys: 'E', name: 'DRAGON PALM', desc: 'Focus attack. Costs 1 focus bar.' },
  { keys: 'F', name: 'FATALITY', desc: 'Weapon-specific finishers. Staggered (yellow) enemy = PERFECT.' },
];

// ============================== BASEBALL BAT: FREESTYLE SLUGGER & SHOWTIME ATRAKSI ==============================
// Tempo ayunan diperlambat agar setiap ancang-ancang bahu/pinggul, putaran tongkat, dan hantaman terbaca jelas & berbobot!
// Dilengkapi atraksi Windmill Twirl, Behind-the-Back Whip, Bunt Spin, Knee Slide Sweep, Bat Flip Toss & Catch, dan Call Your Shot Home Run!
const BAT = { sfx: 'axe' as const, limb: 'blade' as const, axe: true, bat: true, knockdown: true, trail: true };
Object.assign(MOVES, {
  B_SWING: { ...BAT, id: 'b_swing', name: 'LINE DRIVE', pose: 'a_swing1', dmg: 9, structure: 45, range: 30, arc: 1.65, windup: 0.11, active: 0.12, recover: 0.16, kb: 380, lunge: 85, hitstop: 0.08, shake: 0.65, hitR: 6.2, slash: { from: -2.4, to: 1.0, r: 22 } },
  B_BACK: { ...BAT, id: 'b_back', name: 'BACKHAND DRIVE', pose: 'a_swing2', dmg: 9, structure: 45, range: 30, arc: 1.65, windup: 0.105, active: 0.12, recover: 0.16, kb: 380, lunge: 80, hitstop: 0.08, shake: 0.65, hitR: 6.2, slash: { from: 2.4, to: -1.0, r: 22 } },
  B_BEHIND: { ...BAT, id: 'b_behind', name: 'BEHIND-THE-BACK WHIP', pose: 'b_behind', dmg: 11, structure: 58, range: 31, arc: 2.3, windup: 0.12, active: 0.14, recover: 0.18, kb: 460, lunge: 82, hitstop: 0.09, shake: 0.78, hitR: 6.6, slash: { from: -4.2, to: 1.1, r: 23 }, showName: true },
  B_WINDMILL: { ...BAT, id: 'b_windmill', name: 'WINDMILL SLUGGER', pose: 'b_windmill', dmg: 10, structure: 52, range: 31, arc: 2.0, windup: 0.13, active: 0.14, recover: 0.18, kb: 420, lunge: 88, hitstop: 0.085, shake: 0.72, hitR: 6.6, slash: { from: -4.0, to: 1.1, r: 23 }, showName: true },
  B_BUNTSPIN: { ...BAT, id: 'b_buntspin', name: 'PROPELLER BUNT SPIN', pose: 'b_buntspin', knockdown: false, dmg: 5.5, structure: 32, range: 29, arc: 1.9, windup: 0.085, active: 0.26, recover: 0.15, kb: 160, lunge: 78, hitstop: 0.035, shake: 0.38, hitR: 6.4, rehit: 0.10, slash: { from: 0, to: Math.PI * 3, r: 21 }, showName: true },
  B_KNEESLIDER: { ...BAT, id: 'b_kneeslider', name: 'KNEE SLIDE SWEEP', pose: 'b_kneeslider', dmg: 9.5, structure: 54, range: 31, arc: 1.85, windup: 0.105, active: 0.15, recover: 0.18, kb: 260, lunge: 115, hitstop: 0.08, shake: 0.65, hitR: 6.6, launch: 145, slash: { from: 2.1, to: -1.5, r: 22 }, showName: true },
  B_TOSSCATCH: { ...BAT, id: 'b_tosscatch', name: 'BAT FLIP & SMASH!', pose: 'b_tosscatch', dmg: 16, structure: 98, range: 32, arc: 1.6, windup: 0.16, active: 0.15, recover: 0.22, kb: 580, lunge: 95, hitstop: 0.13, shake: 1.1, hitR: 7.2, launch: 120, slash: { from: -2.4, to: 1.1, r: 24, lift: 0.95 }, finisher: true, showName: true },
  B_CORKSCREW: { ...BAT, id: 'b_corkscrew', name: 'CORKSCREW TORNADO', pose: 'b_corkscrew', dmg: 6.5, structure: 36, range: 33, arc: Math.PI, windup: 0.105, active: 0.32, recover: 0.19, kb: 380, lunge: 60, hitstop: 0.05, shake: 0.65, hitR: 6.8, rehit: 0.12, launch: 80, slash: { from: 0, to: Math.PI * 3.2, r: 24 }, finisher: true, showName: true },
  B_CALLSHOT: { ...BAT, id: 'b_callshot', name: 'CALL YOUR SHOT HOMER!', pose: 'b_callshot', dmg: 19, structure: 115, range: 34, arc: 1.8, windup: 0.17, active: 0.14, recover: 0.24, kb: 1100, lunge: 115, hitstop: 0.15, shake: 1.25, hitR: 7.4, launch: 185, slash: { from: -2.8, to: 1.25, r: 25 }, finisher: true, showName: true },
  B_POP: { ...BAT, id: 'b_pop', name: 'POP-FLY LAUNCHER', pose: 'a_golf', dmg: 9, structure: 55, range: 29, arc: 1.4, windup: 0.11, active: 0.12, recover: 0.18, kb: 140, lunge: 72, hitstop: 0.09, shake: 0.75, hitR: 6.4, launch: 245, slash: { from: 1.4, to: -1.7, r: 22, lift: 0.5 }, showName: true },
  B_SLAM: { ...BAT, id: 'b_slam', name: 'CLEANUP SLAM', pose: 'a_overhead', dmg: 14, structure: 90, range: 29, arc: 1.1, windup: 0.13, active: 0.12, recover: 0.21, kb: 280, lunge: 110, hitstop: 0.12, shake: 1.0, hitR: 6.8, slash: { from: 0, to: 0, r: 22, lift: 1.2 }, showName: true },
  B_BUNT: { ...BAT, id: 'b_bunt', name: 'BUNT CHECK', pose: 'a_bunt', dmg: 6, structure: 60, range: 25, arc: 1.0, windup: 0.075, active: 0.10, recover: 0.14, kb: 260, knockdown: false, lunge: 105, hitstop: 0.055, shake: 0.45, hitR: 5.5, slash: { from: 0, to: 0, r: 19 } },
  B_HELI: { ...BAT, id: 'b_heli', name: 'HELICOPTER BAT', pose: 'b_corkscrew', dmg: 8, structure: 45, range: 32, arc: Math.PI, windup: 0.1, active: 0.28, recover: 0.18, kb: 440, lunge: 45, hitstop: 0.06, shake: 0.65, hitR: 6.6, rehit: 0.14, slash: { from: 0, to: Math.PI * 2, r: 24 }, showName: true },
  B_HOMER: { ...BAT, id: 'b_homerun', name: 'HOME RUN!', pose: 'b_callshot', dmg: 18, structure: 110, range: 34, arc: 1.75, windup: 0.16, active: 0.14, recover: 0.24, kb: 920, lunge: 115, hitstop: 0.15, shake: 1.25, hitR: 7.2, launch: 175, slash: { from: -2.8, to: 1.2, r: 25 }, finisher: true, showName: true },
  B_PEPPER: { ...BAT, id: 'b_pepper', name: 'JUGGLE POP', pose: 'a_golf', dmg: 6, structure: 32, range: 34, arc: 1.45, windup: 0.075, active: 0.11, recover: 0.14, kb: 40, knockdown: false, lunge: 58, hitstop: 0.06, shake: 0.48, hitR: 7, launch: 225, slash: { from: 1.3, to: -1.7, r: 22, lift: 0.6 } },
  B_SPIKE: { ...BAT, id: 'b_spike', name: 'METEOR SPIKE!', pose: 'b_tosscatch', dmg: 16, structure: 120, range: 34, arc: 1.45, windup: 0.12, active: 0.13, recover: 0.22, kb: 620, lunge: 80, hitstop: 0.15, shake: 1.3, hitR: 7.5, slash: { from: 0, to: 0, r: 23, lift: 1.2 }, finisher: true, showName: true },
  BH: { ...BAT, id: 'b_tornado', name: 'CORKSCREW TORNADO', pose: 'b_corkscrew', dmg: 7, structure: 45, range: 33, arc: Math.PI, windup: 0.11, active: 0.36, recover: 0.22, kb: 440, lunge: 35, hitstop: 0.06, shake: 0.7, hitR: 6.8, rehit: 0.14, slash: { from: 0, to: Math.PI * 3.5, r: 24 }, finisher: true, showName: true },
  BRUN: { ...BAT, id: 'b_grandslam', name: 'GRAND SLAM!', pose: 'b_callshot', dmg: 20, structure: 130, range: 35, arc: 1.75, windup: 0.11, active: 0.22, recover: 0.26, kb: 940, lunge: 0, hitstop: 0.15, shake: 1.25, hitR: 7.5, launch: 200, travel: 300, slash: { from: -2.8, to: 1.2, r: 25 }, finisher: true, showName: true },
  BDASH: { ...BAT, id: 'b_slide', name: 'SLIDE INTO HOME', pose: 'b_kneeslider', dmg: 12, structure: 65, range: 31, arc: 1.65, windup: 0.07, active: 0.20, recover: 0.20, kb: 480, lunge: 0, hitstop: 0.09, shake: 0.75, hitR: 6.6, launch: 95, travel: 275, slash: { from: 2.1, to: -1.5, r: 22 }, finisher: true, showName: true },
});

// ============================== STREET BAT: Weighty Freestyle & Atraksi Swings ==============================
Object.assign(MOVES, {
  SB_F: { ...BAT, id: 'sb_f', name: 'SLUGGER FOREHAND', pose: 'b_wild', dmg: 7, structure: 34, range: 30, arc: 1.7, windup: 0.095, active: 0.115, recover: 0.14, kb: 220, knockdown: false, lunge: 68, hitstop: 0.05, shake: 0.4, hitR: 6.2, slash: { from: -2.2, to: 1.2, r: 22 } },
  SB_B: { ...BAT, id: 'sb_b', name: 'WHIP BACKHAND', pose: 'b_wildback', dmg: 7, structure: 34, range: 30, arc: 1.7, windup: 0.095, active: 0.115, recover: 0.14, kb: 230, knockdown: false, lunge: 68, hitstop: 0.05, shake: 0.4, hitR: 6.2, slash: { from: 2.2, to: -1.2, r: 22 } },
  SB_KNOB: { ...BAT, id: 'sb_knob', name: 'HANDLE KNOB RAM', pose: 'b_knob', limb: 'fhand', dmg: 6, structure: 52, range: 22, arc: 1.1, windup: 0.075, active: 0.10, recover: 0.13, kb: 180, knockdown: false, lunge: 95, hitstop: 0.055, shake: 0.42, hitR: 5.5, slash: { from: Math.PI, to: Math.PI, r: 0 }, showName: true },
  SB_UPPER: { ...BAT, id: 'sb_upper', name: 'UPPERCUT SCOOP', pose: 'b_upper', dmg: 9, structure: 54, range: 29, arc: 1.45, windup: 0.105, active: 0.12, recover: 0.17, kb: 150, lunge: 72, hitstop: 0.08, shake: 0.65, hitR: 6.5, launch: 230, slash: { from: 1.5, to: -1.8, r: 22, lift: 0.45 }, showName: true },
  SB_SMASH: { ...BAT, id: 'sb_smash', name: 'SKULL SPLITTER SLAM', pose: 'b_smash', dmg: 13, structure: 90, range: 30, arc: 1.2, windup: 0.13, active: 0.12, recover: 0.19, kb: 290, lunge: 105, hitstop: 0.1, shake: 0.9, hitR: 7, slash: { from: -2.2, to: 1.0, r: 23, lift: 0.85 }, showName: true },
  SB_POUND: { ...BAT, id: 'sb_pound', name: 'CURB SMASH', pose: 'b_pound', dmg: 10, structure: 72, range: 29, arc: 1.35, windup: 0.105, active: 0.115, recover: 0.17, kb: 80, lunge: 55, hitstop: 0.08, shake: 0.75, hitR: 8, launch: 155, slash: { from: -1.8, to: 1.3, r: 21, lift: 0.8 }, showName: true },
  SB_SPIN: { ...BAT, id: 'sb_spin', name: '360 CORKSCREW', pose: 'b_corkscrew', dmg: 7.5, structure: 44, range: 32, arc: Math.PI, windup: 0.105, active: 0.26, recover: 0.17, kb: 360, lunge: 45, hitstop: 0.055, shake: 0.62, hitR: 6.6, rehit: 0.13, slash: { from: 0, to: Math.PI * 2.5, r: 24 }, showName: true },
  // ---- POWER SWING (RMB): ayunan pamungkas berbobot & beratraksi!
  BP_HOMER: { ...BAT, id: 'bp_homer', name: 'CALL YOUR SHOT HOMER!', pose: 'b_callshot', dmg: 16, structure: 98, range: 34, arc: 1.75, windup: 0.16, active: 0.14, recover: 0.22, kb: 1350, knockdown: true, lunge: 110, hitstop: 0.14, shake: 1.2, hitR: 7.2, launch: 135, finisher: true, slash: { from: -2.7, to: 1.25, r: 25 }, showName: true },
  BP_LINE: { ...BAT, id: 'bp_line', name: 'WINDMILL LINE DRIVE!', pose: 'b_windmill', dmg: 13, structure: 78, range: 32, arc: 1.75, windup: 0.13, active: 0.14, recover: 0.19, kb: 1150, launch: 65, knockdown: true, lunge: 100, hitstop: 0.11, shake: 1.0, hitR: 6.8, finisher: true, slash: { from: -3.8, to: 1.1, r: 24 }, showName: true },
  BP_BACK: { ...BAT, id: 'bp_back', name: 'BEHIND-THE-BACK SMASH!', pose: 'b_behind', dmg: 13, structure: 78, range: 32, arc: 2.1, windup: 0.13, active: 0.14, recover: 0.19, kb: 1150, launch: 65, knockdown: true, lunge: 95, hitstop: 0.11, shake: 1.0, hitR: 6.8, finisher: true, slash: { from: -4.2, to: 1.2, r: 24 }, showName: true },
  BP_LOFT: { ...BAT, id: 'bp_loft', name: 'SKY-HIGH GRAND SLAM!', pose: 'a_golf', dmg: 12, structure: 74, range: 32, arc: 1.55, windup: 0.135, active: 0.13, recover: 0.20, kb: 780, knockdown: true, lunge: 88, hitstop: 0.12, shake: 1.0, hitR: 7, launch: 280, finisher: true, slash: { from: 1.5, to: -1.9, r: 24, lift: 0.6 }, showName: true },
});

/** Rangkaian Kombo Freestyle & Atraksi Baseball Bat (mengalir lewat LMB beruntun): */
export const BAT_PLANS: string[][] = [
  ['SB_F', 'SB_B', 'B_WINDMILL', 'B_BEHIND', 'B_CALLSHOT'],
  ['B_WINDMILL', 'SB_B', 'B_BUNTSPIN', 'B_KNEESLIDER', 'B_TOSSCATCH'],
  ['SB_F', 'B_BEHIND', 'SB_UPPER', 'B_CORKSCREW', 'BP_HOMER'],
  ['SB_KNOB', 'SB_F', 'B_BUNTSPIN', 'B_WINDMILL', 'B_TOSSCATCH'],
  ['SB_B', 'B_KNEESLIDER', 'B_POP', 'B_CORKSCREW', 'B_CALLSHOT'],
];

// ============================== BOXING: sarung tinju, tiga gaya ==============================
// ALI  : flicker jab + Ali Shuffle (jab beruntun sambil kaki menari).
// TYSON: peek-a-boo — merunduk masuk, hook badan lalu uppercut.
// IPPO : menekan maju — body blow, Dempsey Roll, Gazelle Punch, Heartbreak Shot.
const BOX: Move = {
  id: 'bx_jab', name: 'FLICKER JAB', pose: 'bx_jab', dmg: 3, structure: 12, range: 21, arc: 0.95,
  windup: 0.03, active: 0.06, recover: 0.08, kb: 90, knockdown: false, lunge: 70,
  hitstop: 0.03, shake: 0.16, sfx: 'punch', limb: 'fhand', hitR: 5.4, trail: true,
};
Object.assign(MOVES, {
  BX_JAB: { ...BOX },
  BX_CROSS: { ...BOX, id: 'bx_cross', name: 'STRAIGHT RIGHT', pose: 'bx_cross', dmg: 6, structure: 26, range: 23, arc: 0.95, windup: 0.06, active: 0.07, recover: 0.15, kb: 260, lunge: 110, hitstop: 0.055, shake: 0.36, limb: 'bhand', hitR: 5.6, showName: true },
  BX_LHOOK: { ...BOX, id: 'bx_lhook', name: 'LEFT HOOK', pose: 'bx_lhook', dmg: 7, structure: 34, range: 20, arc: 1.9, windup: 0.07, active: 0.09, recover: 0.17, kb: 300, knockdown: true, lunge: 80, hitstop: 0.06, shake: 0.42, hitR: 5.8, showName: true },
  BX_UPPER: { ...BOX, id: 'bx_upper', name: 'UPPERCUT', pose: 'bx_upper', dmg: 9, structure: 48, range: 18, arc: 1.2, windup: 0.09, active: 0.08, recover: 0.24, kb: 200, knockdown: true, lunge: 90, launch: 210, hitstop: 0.09, shake: 0.62, limb: 'bhand', hitR: 5.8, showName: true },
  BX_BODY: { ...BOX, id: 'bx_body', name: 'BODY BLOW', pose: 'bx_body', dmg: 5, structure: 52, range: 18, arc: 1.1, windup: 0.05, active: 0.07, recover: 0.12, kb: 70, lunge: 95, hitstop: 0.05, shake: 0.3, hitR: 5.6 },
  BX_SMASH: { ...BOX, id: 'bx_smash', name: 'SMASH', pose: 'bx_smash', dmg: 14, structure: 90, range: 22, arc: 1.3, windup: 0.16, active: 0.09, recover: 0.34, kb: 520, knockdown: true, lunge: 130, hitstop: 0.13, shake: 1.0, limb: 'bhand', hitR: 6.2, finisher: true, showName: true },
  BX_GAZELLE: { ...BOX, id: 'bx_gazelle', name: 'GAZELLE PUNCH', pose: 'bx_gazelle', dmg: 13, structure: 80, range: 25, arc: 1.7, windup: 0.1, active: 0.26, recover: 0.3, kb: 620, knockdown: true, lunge: 0, travel: 330, jump: 13, hitstop: 0.12, shake: 0.9, hitR: 6.4, launch: 150, finisher: true, showName: true, trail: true },
  BX_DEMPSEY: { ...BOX, id: 'bx_dempsey', name: 'DEMPSEY ROLL', pose: 'bx_dempsey', dmg: 3.2, structure: 22, range: 22, arc: 2.4, windup: 0.06, active: 0.78, recover: 0.28, kb: 110, lunge: 150, hitstop: 0.02, shake: 0.2, hitR: 6.2, rehit: 0.085, limb: 'both', finisher: true, showName: true, trail: true },
  BX_HEART: { ...BOX, id: 'bx_heart', name: 'HEARTBREAK SHOT', pose: 'bx_heart', dmg: 18, structure: 130, range: 24, arc: 1.0, windup: 0.34, active: 0.1, recover: 0.4, kb: 760, knockdown: true, lunge: 190, hitstop: 0.17, shake: 1.25, limb: 'bhand', hitR: 6.4, launch: 90, finisher: true, showName: true, trail: true },
  BX_SHUFFLE: { ...BOX, id: 'bx_shuffle', name: 'ALI SHUFFLE', pose: 'bx_jab', dmg: 2.6, structure: 16, range: 23, arc: 1.1, windup: 0.04, active: 0.62, recover: 0.22, kb: 90, lunge: 60, hitstop: 0.02, shake: 0.16, hitR: 5.6, rehit: 0.1, limb: 'both', finisher: true, showName: true, trail: true },
  BX_JAB2: { ...BOX, id: 'bx_jab2', name: 'DOUBLE JAB', pose: 'bx_jab', dmg: 2.2, structure: 10, range: 22, arc: 1.0, windup: 0.02, active: 0.16, recover: 0.07, kb: 55, lunge: 55, hitstop: 0.015, shake: 0.12, hitR: 5.4, rehit: 0.075 },
  BX_RHOOK: { ...BOX, id: 'bx_rhook', name: 'RIGHT HOOK', pose: 'bx_rhook', dmg: 7, structure: 34, range: 20, arc: 1.9, windup: 0.07, active: 0.09, recover: 0.17, kb: 300, lunge: 80, hitstop: 0.06, shake: 0.42, limb: 'bhand', hitR: 5.8, showName: true },
  BX_SHOVEL: { ...BOX, id: 'bx_shovel', name: 'SHOVEL HOOK', pose: 'bx_shovel', dmg: 6, structure: 44, range: 19, arc: 1.3, windup: 0.06, active: 0.08, recover: 0.15, kb: 150, lunge: 100, hitstop: 0.055, shake: 0.36, limb: 'bhand', hitR: 5.7, launch: 60 },
  BX_OVER: { ...BOX, id: 'bx_over', name: 'OVERHAND', pose: 'bx_over', dmg: 8, structure: 46, range: 22, arc: 1.4, windup: 0.1, active: 0.08, recover: 0.2, kb: 340, lunge: 115, hitstop: 0.075, shake: 0.5, limb: 'bhand', hitR: 5.9, showName: true },
  BX_CHECK: { ...BOX, id: 'bx_check', name: 'CHECK HOOK', pose: 'bx_lhook', dmg: 6, structure: 38, range: 21, arc: 2.1, windup: 0.05, active: 0.1, recover: 0.18, kb: 360, lunge: -70, hitstop: 0.06, shake: 0.4, hitR: 5.8, showName: true },
  BX_ROLLIN: { ...BOX, id: 'bx_rollin', name: 'PEEK-A-BOO RUSH', pose: 'bx_dempsey', dmg: 5, structure: 40, range: 20, arc: 2.2, windup: 0.08, active: 0.5, recover: 0.26, kb: 220, knockdown: true, lunge: 210, hitstop: 0.05, shake: 0.4, hitR: 6.0, rehit: 0.14, limb: 'both', finisher: true, showName: true, trail: true },
});

// ============================== BUSTER SWORD (ala Cloud Strife) ==============================
// Konsep: BERAT yang dibayar dengan JANGKAUAN & MOMENTUM.
//  - Tiap ayunan punya ancang-ancang berat, tapi ayunan berikutnya mewarisi inersia pedang (momentum 0..3 => makin cepat).
//  - OPERATOR (lincah) vs PUNISHER (tombol I): Punisher lebih lambat, damage besar, dan MENANGKIS + counter otomatis.
//  - LIMIT gauge terisi dari memukul & dipukul. Penuh => RMB = OMNISLASH.
const BU = { sfx: 'axe' as const, limb: 'blade' as const, buster: true, knockdown: false };
const BUSTER_BASE: Record<string, Move> = {
  X1: { ...BU, id: 'x_cleave', name: 'CLEAVE', pose: 'a_chop', dmg: 7, structure: 34, range: 36, arc: 1.7, windup: 0.13, active: 0.09, recover: 0.16, kb: 260, lunge: 110, hitstop: 0.07, shake: 0.45, hitR: 8, slash: { from: -2.3, to: 1.1, r: 30 } },
  X2: { ...BU, id: 'x_back', name: 'BACKSWING', pose: 'a_backswing', dmg: 7, structure: 34, range: 36, arc: 1.7, windup: 0.1, active: 0.09, recover: 0.16, kb: 260, lunge: 90, hitstop: 0.07, shake: 0.45, hitR: 8, slash: { from: 2.2, to: -1.2, r: 30 } },
  X3: { ...BU, id: 'x_rise', name: 'RISING SLASH', pose: 'k_rising', dmg: 9, structure: 50, range: 34, arc: 1.3, windup: 0.11, active: 0.1, recover: 0.2, kb: 160, knockdown: true, lunge: 100, hitstop: 0.09, shake: 0.6, hitR: 8, launch: 150, slash: { from: 1.4, to: -2.0, r: 28, lift: 0.6 } },
  X4: { ...BU, id: 'x_spin', name: 'SPIN CUTTER', pose: 'a_spin', dmg: 6, structure: 30, range: 40, arc: Math.PI, windup: 0.08, active: 0.3, recover: 0.16, kb: 320, knockdown: true, lunge: 40, hitstop: 0.05, shake: 0.5, hitR: 8, rehit: 0.15, slash: { from: 0, to: Math.PI * 2, r: 32 }, showName: true },
  X5: { ...BU, id: 'x_finish', name: 'FINISHING TOUCH', pose: 'a_overhead', dmg: 18, structure: 120, range: 40, arc: 1.2, windup: 0.22, active: 0.1, recover: 0.36, kb: 640, knockdown: true, lunge: 150, hitstop: 0.18, shake: 1.2, hitR: 9, launch: 120, finisher: true, showName: true, slash: { from: -2.7, to: 0.9, r: 32 } },
  XH: { ...BU, id: 'x_braver', name: 'BRAVER', pose: 'a_overhead', dmg: 22, structure: 140, range: 42, arc: 1.3, windup: 0.3, active: 0.12, recover: 0.42, kb: 520, knockdown: true, lunge: 0, hitstop: 0.2, shake: 1.4, hitR: 10, travel: 190, jump: 34, finisher: true, showName: true, slash: { from: -2.9, to: 0.9, r: 34 } },
  XRUN: { ...BU, id: 'x_cross', name: 'CROSS SLASH', pose: 'k_dragonfang', dmg: 6, structure: 40, range: 38, arc: 1.6, windup: 0.06, active: 0.32, recover: 0.28, kb: 300, knockdown: true, lunge: 0, hitstop: 0.06, shake: 0.6, hitR: 9, travel: 260, rehit: 0.1, finisher: true, showName: true, slash: { from: -2.2, to: 1.4, r: 32 } },
  XBEAM: { ...BU, id: 'x_beam', name: 'BLADE BEAM', pose: 'k_heaven', dmg: 10, structure: 60, range: 38, arc: 1.2, windup: 0.08, active: 0.08, recover: 0.3, kb: 380, knockdown: true, lunge: 60, hitstop: 0.1, shake: 0.8, hitR: 9, finisher: true, showName: true, slash: { from: -2.4, to: 0.8, r: 32 } },
  XAIR: { ...BU, id: 'x_plunge', name: 'METEOR DROP', pose: 'a_overhead', dmg: 14, structure: 80, range: 34, arc: 1.4, windup: 0.06, active: 0.3, recover: 0.3, kb: 420, knockdown: true, lunge: 0, hitstop: 0.12, shake: 1.0, hitR: 9, travel: 220, air: true, finisher: true, showName: true, slash: { from: -2.6, to: 1.0, r: 30 } },
  XCOUNTER: { ...BU, id: 'x_counter', name: 'COUNTER', pose: 'a_backswing', dmg: 14, structure: 90, range: 40, arc: 1.9, windup: 0.03, active: 0.09, recover: 0.2, kb: 520, knockdown: true, lunge: 120, hitstop: 0.14, shake: 0.9, hitR: 9, launch: 80, showName: true, slash: { from: 2.4, to: -1.3, r: 32 } },
};
for (const [k, mv] of Object.entries(BUSTER_BASE)) {
  MOVES[k] = mv;
  // PUNISHER: varian berat — ayunan lambat & mantap, damage/knockback besar, sedikit maju
  MOVES['P' + k] = { ...mv, id: mv.id + '_p', name: mv.name, dmg: mv.dmg * 1.55, structure: mv.structure * 1.5, kb: mv.kb * 1.35, windup: mv.windup * 1.45, recover: mv.recover * 1.2, lunge: mv.lunge * 0.55, hitstop: mv.hitstop * 1.35, shake: mv.shake * 1.25, knockdown: true };
}

// ============================== FIST MODE: KICK CHAIN (Sanji / Hwoarang feel) ==============================
const KICK = { sfx: 'kick' as const, limb: 'ffoot' as const, kick: true, trail: true, knockdown: false };
export const KICK_MOVES: Record<string, Move> = {
  KV1: { ...KICK, id: 'kv_low', name: 'LOW CHECK', pose: 'sweep', dmg: 3, structure: 14, range: 22, arc: 1.3, windup: 0.045, active: 0.08, recover: 0.1, kb: 95, lunge: 55, hitstop: 0.03, shake: 0.18, hitR: 5.5 },
  KV2: { ...KICK, id: 'kv_round', name: 'HIGH ROUND', pose: 'roundhouse', dmg: 4.5, structure: 20, range: 25, arc: 1.5, windup: 0.055, active: 0.09, recover: 0.11, kb: 150, lunge: 65, hitstop: 0.045, shake: 0.28, hitR: 6 },
  KV3: { ...KICK, id: 'kv_axe', name: 'AXE KICK', pose: 'axekick', sfx: 'heavy', dmg: 7, structure: 42, range: 26, arc: 1.2, windup: 0.125, active: 0.13, recover: 0.17, kb: 145, knockdown: true, lunge: 68, hitstop: 0.085, shake: 0.62, hitR: 7.0, showName: true },
  KV4: { ...KICK, id: 'kv_spin', name: 'SPIN HEEL', pose: 'dragontail', dmg: 5, structure: 30, range: 28, arc: Math.PI, windup: 0.06, active: 0.22, recover: 0.16, kb: 260, knockdown: true, lunge: 30, hitstop: 0.045, shake: 0.45, hitR: 6.5, rehit: 0.14, showName: true },
  KV5: { ...KICK, id: 'kv_flurry', name: 'HWOARANG FLURRY', pose: 'spinback', dmg: 3.5, structure: 22, range: 25, arc: 1.8, windup: 0.045, active: 0.28, recover: 0.17, kb: 170, knockdown: true, lunge: 45, hitstop: 0.03, shake: 0.35, hitR: 6, rehit: 0.085, showName: true },
  KVH: { ...KICK, id: 'kv_diablo', name: 'DIABLE JAMBE', pose: 'monkeyflip', sfx: 'heavy', dmg: 12, structure: 75, range: 30, arc: 1.5, windup: 0.14, active: 0.12, recover: 0.3, kb: 520, knockdown: true, lunge: 110, hitstop: 0.14, shake: 0.9, hitR: 7.5, launch: 170, finisher: true, showName: true },
};
Object.assign(MOVES, KICK_MOVES);
Object.assign(MOVES, FOOT_MOVES);
Object.assign(MOVES, SCYTHE_MOVES);

// ============================== FIST MODE: IPPO COMBO (tinju tanpa sarung tangan) ==============================
// Teknik tinju gaya Ippo dipakai langsung di fist mode (BX_*). Pamungkas panjangnya dipangkas supaya tidak keburu diserang.
export const IPPO_FIST_MOVES: Record<string, Move> = {
  FP_DEMPSEY: { ...MOVES.BX_DEMPSEY, id: 'fp_dempsey', name: 'DEMPSEY ROLL', dmg: 3.6, active: 0.46, recover: 0.16, lunge: 130 },
  FP_HEART: { ...MOVES.BX_HEART, id: 'fp_heart', name: 'HEARTBREAK SHOT', dmg: 15, windup: 0.22, recover: 0.26, kb: 620 },
  FP_GAZELLE: { ...MOVES.BX_GAZELLE, id: 'fp_gazelle', name: 'GAZELLE PUNCH', dmg: 11, active: 0.22, recover: 0.22 },
  FP_SMASH: { ...MOVES.BX_SMASH, id: 'fp_smash', name: 'SMASH', dmg: 12, windup: 0.12, recover: 0.24, kb: 440 },
};
Object.assign(MOVES, IPPO_FIST_MOVES);
/** rangkaian kombo Ippo (klik berurutan). Sebagian digabung dengan tendangan supaya tetap bergaya kung fu */
export const IPPO_PLANS: string[][] = [
  ['BX_JAB', 'BX_JAB2', 'BX_CROSS', 'BX_BODY', 'BX_OVER'],
  ['BX_JAB', 'BX_CROSS', 'BX_LHOOK', 'BX_SHOVEL', 'FP_GAZELLE'],
  ['BX_BODY', 'BX_SHOVEL', 'BX_UPPER', 'FP_HEART'],
  ['BX_JAB2', 'BX_CROSS', 'BX_CHECK', 'FP_DEMPSEY'],
  ['BX_JAB', 'BX_JAB2', 'BX_BODY', 'BX_OVER', 'FP_SMASH'],
  ['BX_JAB', 'BX_CROSS', 'BX_RHOOK', 'KV2', 'FP_HEART'],
  ['BX_BODY', 'BX_OVER', 'KV3', 'BX_UPPER', 'FP_GAZELLE'],
];
export const IPPO_HEAVY = ['FP_HEART', 'FP_GAZELLE', 'FP_SMASH', 'FP_DEMPSEY'];

// ============================== FIST MODE: PUKULAN TAMBAHAN (variasi) ==============================
export const FX_MOVES: Record<string, Move> = {
  FX_TRIPLE: { ...MOVES.L, id: 'fx_triple', name: 'TRIPLE JAB', dmg: 1.5, structure: 8, windup: 0.02, active: 0.2, recover: 0.09, rehit: 0.065, limb: 'both', lunge: 80, hitstop: 0.012, shake: 0.12, showName: true },
  FX_SHOCKPALM: { ...MOVES.H, id: 'fx_shockpalm', name: 'SHOCK PALM', dmg: 5, structure: 44, windup: 0.08, active: 0.09, recover: 0.2, kb: 420, knockdown: true, lunge: 110, hitstop: 0.09, shake: 0.55, showName: true },
  FX_RISEELBOW: { ...MOVES.LH, id: 'fx_riseelbow', name: 'RISING ELBOW', pose: 'uppercut', windup: 0.06, active: 0.09, recover: 0.18, kb: 150, launch: 110, dmg: 5, structure: 40, hitstop: 0.07, shake: 0.45, showName: true },
  FX_HOOKS: { ...MOVES.LLL, id: 'fx_hooks', name: 'HOOK HOOK', windup: 0.04, active: 0.22, recover: 0.14, rehit: 0.11, dmg: 2.4, limb: 'both', structure: 22, kb: 210, lunge: 90, showName: true },
  FX_KNEES: { ...MOVES.HL, id: 'fx_knees', name: 'DOUBLE KNEE', windup: 0.05, active: 0.2, recover: 0.16, rehit: 0.1, dmg: 3, structure: 28, kb: 190, showName: true },
  FX_DROPFIST: { ...MOVES.KF2, id: 'fx_dropfist', name: 'DROP HAMMER', windup: 0.12, recover: 0.22, dmg: 8, kb: 260, knockdown: true, showName: true },
  FX_CLAW: { ...MOVES.LHH, id: 'fx_claw', name: 'RAKING CLAW', windup: 0.05, active: 0.18, rehit: 0.09, dmg: 2.8, structure: 20, bleed: true, kb: 140, showName: true },
  FX_STRAIGHT: { ...MOVES.BX_CROSS, id: 'fx_straight', name: 'LEAD STRAIGHT', windup: 0.05, dmg: 5, kb: 340, lunge: 150 },
};
Object.assign(MOVES, FX_MOVES);

// ============================== FIST MODE KANTOR V2: SHAOLIN / LIU KANG ACROBATICS ==============================
// - FK_AXEKICK    : Axe Kick (Tendangan Kapak) — angkat satu kaki lurus tinggi ke atas kepala, hentakkan lurus ke bawah ke bahu/kepala lawan.
// - FK_CARTWHEEL  : Cartwheel Kick (Tendangan Roda) — ancang-ancang membungkuk rendah -> putaran roda 360° dua kaki lurus menghantam beruntun.
// - FK_BUTTERFLY  : Butterfly Flip ala Liu Kang — ancang-ancang membungkuk rendah -> salto kupu-kupu horizontal 360° dengan 2 sabetan kaki sabit.
export const OFFICE_SHAOLIN_MOVES: Record<string, Move> = {
  FK_AXEKICK: {
    id: 'fk_axekick', name: 'AXE KICK', pose: 'axekick',
    dmg: 8.5, structure: 58, range: 27, arc: 1.35,
    windup: 0.145, active: 0.14, recover: 0.21,
    kb: 165, knockdown: true, lunge: 78,
    hitstop: 0.11, shake: 0.82, sfx: 'heavy',
    limb: 'ffoot', hitR: 7.4, kick: true, trail: true, showName: true,
  },
  FK_CARTWHEEL: {
    id: 'fk_cartwheel', name: 'CARTWHEEL KICK', pose: 'cartwheelkick',
    dmg: 5.5, structure: 36, range: 30, arc: 1.8,
    windup: 0.105, active: 0.31, recover: 0.19,
    kb: 245, knockdown: true, lunge: 150,
    hitstop: 0.065, shake: 0.62, sfx: 'heavy',
    limb: 'ffoot', hitR: 7.4, launch: 115, rehit: 0.14,
    kick: true, trail: true, showName: true,
  },
  FK_BUTTERFLY: {
    id: 'fk_butterfly', name: 'BUTTERFLY FLIP', pose: 'butterflyflip',
    dmg: 6.5, structure: 44, range: 32, arc: 1.95,
    windup: 0.115, active: 0.33, recover: 0.22,
    kb: 390, knockdown: true, lunge: 175,
    hitstop: 0.078, shake: 0.82, sfx: 'heavy',
    limb: 'ffoot', hitR: 7.6, launch: 165, jump: 13, rehit: 0.14,
    kick: true, trail: true, finisher: true, showName: true,
  },
};
Object.assign(MOVES, OFFICE_SHAOLIN_MOVES);

/** Rangkaian kombo Fist Mode khusus V2 Mode Kantor: pukulan pembuka mengalir ke Axe Kick, Cartwheel Kick & Butterfly Flip (Liu Kang) */
export const OFFICE_FIST_PLANS: string[][] = [
  ['L', 'LL', 'FK_AXEKICK', 'FK_CARTWHEEL', 'FK_BUTTERFLY'],
  ['L', 'LLL', 'FK_CARTWHEEL', 'FK_AXEKICK', 'FK_BUTTERFLY'],
  ['KV1', 'KV2', 'FK_AXEKICK', 'FK_BUTTERFLY'],
  ['L', 'LH', 'FK_BUTTERFLY'],
  ['BX_JAB', 'BX_CROSS', 'FK_CARTWHEEL', 'FK_AXEKICK', 'FK_BUTTERFLY'],
  ['L', 'KV2', 'FK_CARTWHEEL', 'FK_BUTTERFLY'],
];
export const OFFICE_HEAVY_CHAIN: string[] = ['FK_AXEKICK', 'FK_CARTWHEEL', 'FK_BUTTERFLY'];

// ============================== GERBANG 6: DRUNKEN MASTER (ZUI QUAN / JURUS MABUK) ==============================
// Basic attacks (DRK_1..DRK_4) tetap seperti serangan dasar biasa (knockback normal agar kombo rapat & mengalir, feel lebih mantap),
// sedangkan Finisher Punch (DRK_FINISHER) menghantam seperti HEAVY ATTACK dahsyat yang melontarkan musuh mental jauh!
export const DRUNKEN_MASTER_MOVES: Record<string, Move> = {
  DRK_1: {
    id: 'drk_cup', name: 'DRUNKEN CUP STRIKE', pose: 'drunk_cup',
    dmg: 3.2, structure: 14, range: 19, arc: 1.25,
    windup: 0.045, active: 0.085, recover: 0.09,
    kb: 70, knockdown: false, lunge: 65,
    hitstop: 0.036, shake: 0.22, sfx: 'punch',
    limb: 'fhand', hitR: 4.8, trail: true,
  },
  DRK_2: {
    id: 'drk_sway', name: 'SWAYING BACKFIST', pose: 'drunk_sway',
    dmg: 3.8, structure: 18, range: 20, arc: 1.45,
    windup: 0.05, active: 0.09, recover: 0.095,
    kb: 85, knockdown: false, lunge: 75,
    hitstop: 0.04, shake: 0.25, sfx: 'punch',
    limb: 'bhand', hitR: 5.2, trail: true,
  },
  DRK_3: {
    id: 'drk_stumble', name: 'STUMBLE ELBOW', pose: 'drunk_stumble',
    dmg: 4.5, structure: 24, range: 19, arc: 1.35,
    windup: 0.055, active: 0.095, recover: 0.105,
    kb: 95, knockdown: false, lunge: 88,
    hitstop: 0.044, shake: 0.28, sfx: 'kick',
    limb: 'bhand', hitR: 5.4, trail: true,
  },
  DRK_4: {
    id: 'drk_mule', name: 'DRUNKEN UPKICK', pose: 'drunk_mule',
    dmg: 5.0, structure: 28, range: 23, arc: 1.5,
    windup: 0.06, active: 0.105, recover: 0.12,
    kb: 110, knockdown: false, lunge: 72,
    hitstop: 0.048, shake: 0.32, sfx: 'kick',
    limb: 'ffoot', hitR: 6.0, kick: true, trail: true,
  },
  DRK_FINISHER: {
    id: 'drk_cannon', name: 'DRUNKEN GOD FIST!', pose: 'drunk_cannon',
    dmg: 11.5, structure: 78, range: 24, arc: 1.45,
    windup: 0.085, active: 0.12, recover: 0.24,
    kb: 680, knockdown: true, lunge: 135,
    hitstop: 0.115, shake: 0.88, sfx: 'heavy',
    limb: 'both', hitR: 6.8, launch: 165,
    finisher: true, showName: true, trail: true,
  },
};
Object.assign(MOVES, DRUNKEN_MASTER_MOVES);

export const DRUNKEN_PLANS: string[][] = [
  ['DRK_1', 'DRK_2', 'DRK_3', 'DRK_FINISHER'],
  ['DRK_1', 'DRK_4', 'DRK_2', 'DRK_FINISHER'],
  ['DRK_2', 'DRK_1', 'DRK_3', 'DRK_4', 'DRK_FINISHER'],
  ['DRK_1', 'DRK_2', 'FK_CARTWHEEL', 'DRK_FINISHER'],
];
