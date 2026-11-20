import type { Move } from './moves';
import { clamp } from './rng';

export type FootSchool = 'capoeira' | 'taekwondo' | 'lotus' | 'ember' | 'flamingo' | 'break' | 'chagi' | 'hwarang' | 'backlash' | 'hawk' | 'lee' | 'drop';
export type FootVersion = 1 | 2 | 3;

export const FOOT_SCHOOLS = {
  capoeira: { label: 'CAPOEIRA', color: '#79eec6', light: '#dcfff0' },
  taekwondo: { label: 'TAEKWONDO', color: '#83daff', light: '#edfbff' },
  lotus: { label: 'LOTUS', color: '#c1b1ff', light: '#f1e9ff' },
  ember: { label: 'BLACK LEG', color: '#ff9e55', light: '#fff0aa' },
  flamingo: { label: 'FLAMINGO', color: '#ffa568', light: '#fff2cb' },
  break: { label: 'BREAK', color: '#ffd84f', light: '#fff6cf' },
  // ---- FOOT MODE V2 (gaya Hwoarang): palet neon sendiri supaya langsung beda dari V1 ----
  chagi: { label: 'CHAGI', color: '#4fe3ff', light: '#eaffff' },
  lee: { label: 'KONOHA', color: '#7dff6a', light: '#ecffe6' },
  hwarang: { label: 'FLAMINGO V2', color: '#ff4f9a', light: '#ffe3f0' },
  backlash: { label: 'BACKLASH', color: '#b488ff', light: '#f4ebff' },
  hawk: { label: 'HAWK', color: '#ffd23f', light: '#fff8d2' },
  drop: { label: 'DROP', color: '#7dffb8', light: '#eafff3' },
} satisfies Record<FootSchool, { label: string; color: string; light: string }>;

export type FootLeg = 'ffoot' | 'bfoot';
export type FootBeat = { from: number; to: number; leg: FootLeg; power?: number; structure?: number; push?: number; stop?: number };

export interface FootMove extends Move {
  foot: {
    school: FootSchool; window: [number, number]; both?: boolean; beats?: readonly FootBeat[];
    /** Foot Mode V2: suara & efek kontak memakai jalur Fist Mode. */
    v2?: boolean;
    /** Pelontar: membuka kombo udara (lompat bisa diantrekan). */
    launcher?: boolean;
    /** Penutup udara: membanting lawan ke lantai. */
    spike?: boolean;
  };
}

function kick(id: string, name: string, pose: Move['pose'], school: FootSchool, options: Partial<Move> & {
  window?: [number, number]; both?: boolean; beats?: readonly FootBeat[]; v2?: boolean; launcher?: boolean; spike?: boolean;
} = {}): FootMove {
  const { window = [0.26, 0.86], both, beats, v2, launcher, spike, ...move } = options;
  return {
    id: `foot_${id}`, name, pose, kick: true, trail: false, limb: 'ffoot', sfx: 'kick',
    dmg: 3.4, structure: 17, range: 23, arc: 1.25, windup: 0.08, active: 0.17, recover: 0.14,
    kb: 58, knockdown: false, lunge: 32, hitstop: 0.033, shake: 0.23, hitR: 4.6,
    foot: { school, window, both, beats, v2, launcher, spike }, ...move,
  };
}

export const FOOT_MOVES = {
  FT_RASTEIRA: kick('rasteira', 'RASTEIRA SWEEP', 'foot_rasteira', 'capoeira', {
    active: 0.20, arc: 2.2, range: 22, lunge: 27, window: [0.23, 0.79],
  }),
  FT_SIDE: kick('side', 'SIDE SNAP', 'foot_side', 'taekwondo', {
    dmg: 4.1, structure: 22, lunge: 43, active: 0.15, window: [0.25, 0.90],
  }),
  FT_WHEEL: kick('wheel', 'LOTUS WHEEL', 'foot_wheel', 'lotus', {
    dmg: 4.6, structure: 26, windup: 0.10, active: 0.27, recover: 0.17, kb: 70, lunge: 50,
    range: 26, arc: 2.1, window: [0.18, 0.86], both: true,
  }),
  FT_EMBER: kick('ember', 'EMBER CRESCENT', 'foot_ember', 'ember', {
    dmg: 5.9, structure: 31, windup: 0.10, active: 0.24, recover: 0.20, kb: 140, lunge: 44,
    hitstop: 0.054, shake: 0.41, range: 27, launch: 80, window: [0.36, 0.87],
  }),
  /** Au Batido (capoeira): kayang satu tangan, kaki menebas dari atas. */
  FT_AU: kick('au', 'AU BATIDO', 'foot_au', 'capoeira', {
    dmg: 5.2, structure: 28, windup: .10, active: .26, recover: .17, kb: 78, lunge: 46, limb: 'bfoot',
    range: 27, arc: 2.2, hitR: 5.2, hitstop: .042, shake: .28, window: [.15, .82], both: true,
  }),
  /** Break Windmill (breakdance): kincir dua kaki di lantai, dua kali kena. */
  FT_WINDMILL: kick('windmill', 'BREAK WINDMILL', 'foot_windmill', 'break', {
    dmg: 6.8, structure: 35, windup: .10, active: .34, recover: .20, kb: 72, lunge: 30,
    range: 27, arc: 3.1, hitR: 5.4, hitstop: .034, shake: .26, both: true,
    beats: [
      { from: .16, to: .50, leg: 'ffoot', power: .45, structure: .45, push: .40, stop: .020 },
      { from: .66, to: 1, leg: 'bfoot', power: .55, structure: .55, push: 1, stop: .040 },
    ],
    window: [.16, 1],
  }),
  FT_MEIA: kick('meia', 'MOON SWEEP', 'foot_meia', 'capoeira', {
    dmg: 5.8, structure: 29, windup: 0.11, active: 0.24, recover: 0.17, lunge: 37, kb: 68,
    arc: 2.5, range: 26, hitstop: 0.044, limb: 'bfoot', window: [0.25, 0.87],
  }),
  FT_TORNADO: kick('tornado', 'TORNADO HEEL', 'foot_tornado', 'taekwondo', {
    dmg: 6.4, structure: 37, windup: 0.115, active: 0.28, recover: 0.19, kb: 83, lunge: 57,
    range: 27, arc: 2.2, jump: 5, hitstop: 0.049, shake: 0.37, window: [0.20, 0.87], both: true,
  }),
  FT_BLAZE: kick('blaze', 'BLAZING COMET', 'foot_comet', 'ember', {
    dmg: 9.2, structure: 52, windup: 0.15, active: 0.27, recover: 0.30, kb: 225, lunge: 64,
    range: 28, jump: 5.5, launch: 115, knockdown: true, finisher: true, hitstop: 0.072,
    shake: 0.53, window: [0.34, 0.91],
  }),
  FT_LAUNCH: kick('launch', 'RISING LOTUS', 'foot_lotus', 'lotus', {
    dmg: 4.7, structure: 30, windup: 0.10, active: 0.19, recover: 0.17, lunge: 43, kb: 38,
    range: 24, launch: 165, hitstop: 0.037, window: [0.28, 0.85], launcher: true,
  }),
  FT_BACK: kick('back', 'COMET BACK KICK', 'foot_back', 'taekwondo', {
    dmg: 5.9, structure: 31, windup: 0.075, active: 0.245, recover: 0.22, travel: 164, jump: 3.5,
    kb: 125, range: 26, lunge: 0, hitstop: 0.054, window: [0.31, 0.87],
  }),
  FT_AIR_SCISSOR: kick('air_scissor', 'SKY SCISSORS', 'foot_scissor', 'lotus', {
    dmg: 4.1, structure: 24, windup: 0.055, active: 0.18, recover: 0.11, kb: 54, lunge: 47,
    range: 25, air: true, window: [0.23, 0.91], both: true,
  }),
  FT_AIR_TORNADO: kick('air_tornado', 'SKY TORNADO', 'foot_tornado', 'taekwondo', {
    dmg: 5.3, structure: 29, windup: 0.07, active: 0.23, recover: 0.13, kb: 74, lunge: 36,
    air: true, range: 26, window: [0.20, 0.90], both: true,
  }),
  FT_AIR_COMET: kick('air_comet', 'COMET DROP', 'foot_dive', 'ember', {
    dmg: 7.2, structure: 43, windup: 0.07, active: 0.235, recover: 0.20, lunge: 56, kb: 139,
    air: true, knockdown: true, range: 27, finisher: true, hitstop: 0.061, shake: 0.43,
    window: [0.20, 0.96],
  }),
  FT_CROSS: kick('cross', 'CROSSWIND', 'foot_cross', 'capoeira', {
    dmg: 6.1, structure: 32, windup: .082, active: .245, recover: .17, kb: 74, lunge: 49,
    arc: 2.2, range: 27, hitstop: .042, shake: .24, window: [.20, .91], both: true,
  }),
  FT_DRAGON: kick('dragon', 'CINDER DRAGON', 'foot_dragon', 'ember', {
    dmg: 8.8, structure: 50, windup: .13, active: .29, recover: .25, kb: 185, lunge: 65,
    range: 28, jump: 5.3, launch: 94, knockdown: true, finisher: true, hitstop: .066,
    shake: .42, window: [.30, .94],
  }),
  FT_FL_DOUBLE: kick('fl_double', 'SWITCH DOUBLE', 'foot_switch_double', 'flamingo', {
    dmg: 5.1, structure: 24, windup: .065, active: .33, recover: .153, kb: 41, lunge: 38,
    range: 25, arc: 1.49, hitR: 4.8, hitstop: .032, shake: .21,
    beats: [
      { from: .10, to: .36, leg: 'ffoot', power: .44, structure: .44, push: .48, stop: .017 },
      { from: .59, to: .90, leg: 'bfoot', power: .56, structure: .56, push: .62, stop: .034 },
    ],
    window: [.10, .90],
  }),
  FT_FL_HOOK: kick('fl_hook', 'REVERSE HOOK', 'foot_switch_hook', 'flamingo', {
    dmg: 5.8, structure: 29, windup: .072, active: .208, recover: .165, kb: 59, lunge: 41,
    limb: 'bfoot', range: 26, arc: 1.74, hitR: 5.1, hitstop: .038, shake: .24, window: [.24, .92],
  }),
  FT_FL_BREAK: kick('fl_break', 'HEEL BREAKER', 'foot_switch_ender', 'flamingo', {
    dmg: 8.6, structure: 45, windup: .115, active: .27, recover: .235, kb: 202, lunge: 54,
    range: 28, arc: 1.48, hitR: 5.9, hitstop: .074, shake: .43, knockdown: true, finisher: true,
    window: [.30, .91],
  }),

  // =====================================================================================
  // FOOT MODE V2: delapan jurus gaya Hwoarang. Lebih cepat dari V1, suara hit = Fist Mode.
  // Kunci jurus diawali F2_, pose diawali foot_v2_.
  // =====================================================================================
  /** Konoha Senpu (Rock Lee): sapuan rendah berputar yang menjegal lawan. */
  F2_SENPU: kick('v2_senpu', 'KONOHA SENPU', 'foot_v2_senpu', 'lee', {
    v2: true, sfx: 'kick', dmg: 5.6, structure: 32, windup: .085, active: .260, recover: .150,
    kb: 60, lunge: 38, range: 28, arc: 3.1, hitR: 5.6, knockdown: true, hitstop: .045, shake: .30, window: [.12, .95],
  }),
  /** Konoha Dai Senpu (Rock Lee): sapuan rendah lalu tebasan tinggi berputar yang mengangkat lawan. */
  F2_DAISENPU: kick('v2_daisenpu', 'KONOHA DAI SENPU', 'foot_v2_daisenpu', 'lee', {
    v2: true, sfx: 'heavy', limb: 'bfoot', dmg: 8.4, structure: 44, windup: .090, active: .340, recover: .190,
    kb: 120, lunge: 40, range: 28, arc: 3.1, hitR: 5.6, launch: 95, hitstop: .055, shake: .40,
    beats: [
      { from: .06, to: .36, leg: 'ffoot', power: .40, structure: .40, push: .20, stop: .026 },
      { from: .58, to: .92, leg: 'bfoot', power: .60, structure: .60, push: 1, stop: .055 },
    ],
    window: [.06, .92],
  }),
  /** Yeop Chagi: tendangan lurus ke samping. */
  F2_YEOP: kick('v2_yeop', 'YEOP CHAGI', 'foot_v2_yeop', 'chagi', {
    v2: true, sfx: 'punch', dmg: 4.3, structure: 23, windup: .066, active: .150, recover: .112,
    kb: 64, lunge: 47, range: 26, arc: 1.2, hitR: 4.9, hitstop: .030, shake: .22, window: [.14, .78],
  }),
  /** Right Flamingo Thrust: tendangan dorong kanan dari stance Flamingo. */
  F2_THRUST: kick('v2_thrust', 'RIGHT FLAMINGO THRUST', 'foot_v2_thrust', 'hwarang', {
    v2: true, sfx: 'kick', limb: 'bfoot', dmg: 4.9, structure: 28, windup: .072, active: .158, recover: .118,
    kb: 112, lunge: 42, range: 27, arc: 1.15, hitR: 5.1, hitstop: .036, shake: .26, window: [.16, .80],
  }),
  /** Backlash Heel kiri: putaran badan diikuti hantaman tumit kiri. */
  F2_BACK_L: kick('v2_backlash_l', 'BACKLASH HEEL KIRI', 'foot_v2_backlash_l', 'backlash', {
    v2: true, sfx: 'kick', limb: 'ffoot', dmg: 5.5, structure: 30, windup: .086, active: .190, recover: .125,
    kb: 72, lunge: 44, range: 27, arc: 2.2, hitR: 5.3, hitstop: .040, shake: .28, window: [.20, .86],
  }),
  /** Backlash Heel kanan: putaran berlawanan, tumit kanan menghujam diagonal. */
  F2_BACK_R: kick('v2_backlash_r', 'BACKLASH HEEL KANAN', 'foot_v2_backlash_r', 'backlash', {
    v2: true, sfx: 'heavy', limb: 'bfoot', dmg: 6.4, structure: 35, windup: .088, active: .200, recover: .140,
    kb: 128, lunge: 46, range: 28, arc: 2.2, hitR: 5.5, hitstop: .050, shake: .34, window: [.18, .88],
  }),
  /** Flamingo Sky Lift: tendangan pelontar untuk membuka kombo udara. */
  F2_SKYLIFT: kick('v2_skylift', 'FLAMINGO SKY LIFT', 'foot_v2_skylift', 'hwarang', {
    v2: true, sfx: 'kick', launcher: true, dmg: 4.8, structure: 31, windup: .088, active: .180, recover: .150,
    kb: 34, lunge: 44, range: 25, launch: 178, hitR: 5.2, hitstop: .040, shake: .28, window: [.16, .86],
  }),
  /** Shotgun Dropkick (V3): lari + Shift + K. Kedua kaki mengenai berurutan, dorong lawan terpental jauh,
   *  lalu badan berputar sejajar lantai dengan dagu ditempelkan ke dada sebelum mendarat. */
  FT_RDK: kick('rdk', 'SHOTGUN DROPKICK', 'foot_rdk', 'drop', {
    dmg: 6.2, structure: 40, windup: .10, active: .40, recover: .22, kb: 504, lunge: 40, jump: 4.0, launch: 70,
    range: 30, arc: 1.4, hitR: 6.8, hitstop: .056, shake: .5, knockdown: true,
    beats: [
      { from: .22, to: .42, leg: 'ffoot', power: .45, structure: .45, push: .30, stop: .022 },
      { from: .42, to: .60, leg: 'bfoot', power: .55, structure: .55, push: 1, stop: .056 },
    ],
    window: [.24, .74],
  }),
  /** Running Jump Kick (V3): lari + J/K, sesekali keluar sebagai tendangan lompat tinggi satu kaki. */
  FT_RJK: kick('rjk', 'RUNNING JUMP KICK', 'foot_rjk', 'drop', {
    dmg: 5.6, structure: 36, windup: .10, active: .34, recover: .20, kb: 440, lunge: 40, jump: 5.0, launch: 80,
    range: 29, arc: 1.4, hitR: 6.4, hitstop: .05, shake: .46, knockdown: true, window: [.26, .66],
  }),
  /** Hunting Hawk: tiga tendangan sambil melompat (kiri, kanan, kiri). */
  F2_HAWK: kick('v2_hawk', 'HUNTING HAWK', 'foot_v2_hawk', 'hawk', {
    v2: true, sfx: 'heavy', dmg: 11.4, structure: 58, windup: .105, active: .420, recover: .220,
    kb: 215, lunge: 36, range: 28, arc: 1.5, jump: 7.2, launch: 70, hitR: 5.6, knockdown: true, finisher: true,
    hitstop: .070, shake: .5,
    beats: [
      { from: .04, to: .25, leg: 'ffoot', power: .27, structure: .27, push: .22, stop: .020 },
      { from: .37, to: .57, leg: 'bfoot', power: .29, structure: .29, push: .26, stop: .024 },
      { from: .73, to: .98, leg: 'ffoot', power: .44, structure: .44, push: 1, stop: .070 },
    ],
    window: [.04, .98],
  }),
  /** 540 Tornado Kick: tendangan lompat berputar. */
  F2_540: kick('v2_540', '540 TORNADO KICK', 'foot_v2_540', 'backlash', {
    v2: true, sfx: 'heavy', limb: 'bfoot', dmg: 7.6, structure: 42, windup: .110, active: .300, recover: .185,
    kb: 112, lunge: 34, range: 28, arc: 2.4, jump: 6.6, hitR: 5.6, knockdown: false,
    hitstop: .058, shake: .42, window: [.12, .90], both: true,
  }),
  /** Flying Side Kick: tendangan terbang untuk menutup jarak. */
  F2_FLYING: kick('v2_flying', 'FLYING SIDE KICK', 'foot_v2_flying', 'chagi', {
    v2: true, sfx: 'heavy', dmg: 6.6, structure: 34, windup: .066, active: .250, recover: .190,
    travel: 188, jump: 4.6, kb: 158, lunge: 0, range: 27, hitR: 5.4, knockdown: true,
    hitstop: .056, shake: .38, window: [.10, .96],
  }),
  /** Right Sky Snap: tendangan kanan cepat di udara. */
  F2_SKYSNAP: kick('v2_skysnap', 'RIGHT SKY SNAP', 'foot_v2_skysnap', 'chagi', {
    v2: true, sfx: 'punch', limb: 'bfoot', dmg: 3.9, structure: 23, windup: .044, active: .140, recover: .085,
    kb: 46, lunge: 44, range: 26, air: true, hitR: 5.0, hitstop: .026, shake: .2, window: [.12, .84],
  }),
  /** 540 Tornado Kick versi udara: penutup kombo udara yang membanting lawan. */
  F2_AIR_540: kick('v2_air_540', '540 TORNADO KICK', 'foot_v2_540', 'backlash', {
    v2: true, sfx: 'heavy', limb: 'bfoot', dmg: 7.4, structure: 44, windup: .062, active: .240, recover: .170,
    kb: 142, lunge: 48, range: 28, arc: 2.4, air: true, hitR: 5.6, knockdown: true, finisher: true, spike: true,
    hitstop: .062, shake: .44, window: [.12, .92], both: true,
  }),
} satisfies Record<string, FootMove>;

export function footMove(move?: Move | null): FootMove | undefined {
  return move && 'foot' in move ? move as FootMove : undefined;
}

export function footContact(move: FootMove, progress: number) {
  return progress >= move.foot.window[0] && progress <= move.foot.window[1];
}

export function footBeatAt(move: FootMove, progress: number) {
  return move.foot.beats?.findIndex(beat => progress >= beat.from && progress <= beat.to) ?? -1;
}

export function footLeg(leg: FootLeg, lead: 1 | -1): FootLeg {
  return lead === 1 ? leg : leg === 'ffoot' ? 'bfoot' : 'ffoot';
}

export const footStanceColor = (lead: 1 | -1) => lead === 1 ? '#79eec6' : '#ffa568';

// V1 (capoeira + break): J = Rasteira > Side Snap > Au Batido > Lotus Wheel > Ember Crescent.
const LIGHT = ['FT_RASTEIRA', 'FT_SIDE', 'FT_AU', 'FT_WHEEL', 'FT_EMBER'] as const;
// K = Moon Sweep > Break Windmill > Tornado Heel > Blazing Comet.
const HEAVY = ['FT_MEIA', 'FT_WINDMILL', 'FT_TORNADO', 'FT_BLAZE'] as const;
const AIR = ['FT_AIR_SCISSOR', 'FT_AIR_TORNADO'] as const;
// Foot Mode V2: J = Yeop Chagi > Flamingo Thrust > Backlash kiri > Backlash kanan, K = 540 Tornado > Hunting Hawk.
const LIGHT_V2 = ['F2_YEOP', 'F2_THRUST', 'F2_BACK_L', 'F2_BACK_R', 'F2_SENPU'] as const;
const HEAVY_V2 = ['F2_540', 'F2_DAISENPU', 'F2_HAWK'] as const;
const AIR_V2 = ['F2_SKYSNAP'] as const;
export const FOOT_VERSION_COLOR = { 1: '#79eec6', 2: '#ff4f9a', 3: '#ffd23f' } as const;
// =====================================================================================
// FOOT MODE V3: jurus V1 dan V2 disilang bergantian dalam satu rantai.
// J = V2, V1, V2, V1, V2, V1.  K = V1, V2, V1, V2, V2.
// =====================================================================================
const LIGHT_V3 = ['F2_YEOP', 'FT_RASTEIRA', 'F2_BACK_L', 'FT_AU', 'F2_SENPU', 'FT_EMBER'] as const;
const HEAVY_V3 = ['FT_MEIA', 'F2_540', 'FT_WINDMILL', 'F2_DAISENPU', 'F2_HAWK'] as const;
const AIR_V3 = ['F2_SKYSNAP', 'FT_AIR_SCISSOR', 'FT_AIR_TORNADO'] as const;
/** Cabang silang V3: jurus rantai J yang kena lalu K membuka jurus dari versi seberang. */
const CROSS_V3_HEAVY: Partial<Record<FootKey, FootKey>> = {
  F2_YEOP: 'FT_WHEEL', FT_RASTEIRA: 'F2_BACK_R', F2_BACK_L: 'FT_TORNADO', FT_AU: 'F2_HAWK', F2_SENPU: 'FT_BLAZE',
};
/** Cabang silang V3: jurus rantai K yang kena lalu J membuka jurus dari versi seberang. */
const CROSS_V3_LIGHT: Partial<Record<FootKey, FootKey>> = {
  FT_MEIA: 'F2_THRUST', F2_540: 'FT_SIDE', FT_WINDMILL: 'FT_CROSS', F2_DAISENPU: 'FT_DRAGON',
};
export type FootKey = keyof typeof FOOT_MOVES;

export type FootCommand = { input: 'L' | 'H'; airborne: boolean; momentum: boolean; backKick: boolean; rising: boolean; autoAim?: boolean; aim?: number };
export type FootChain = 'flow' | 'power' | 'air' | 'mixed' | 'special' | 'flamingo';
type FootContact = { x: number; y: number; at: number; direction: number; originY: number; originZ: number };

export class Footwork {
  private steps = { light: 0, heavy: 0, air: 0 };
  private lastStarted = -Infinity;
  private queue: { command: FootCommand; at: number }[] = [];
  private chase: { target: number; until: number } | null = null;
  private jumpUntil = -Infinity;
  private switchUntil = -Infinity;
  private stanceSince = -Infinity;
  private stanceUntil = -Infinity;
  private stanceStep = 0;
  private contacts = new Map<number, Set<number>>();
  /** 1 = Foot Mode V1 (Capoeira/Break), 2 = Foot Mode V2 (Hwoarang/Rock Lee), 3 = Foot Mode V3 (silang V1 + V2). */
  version: FootVersion = 1;
  lead: 1 | -1 = 1;
  attackLead: 1 | -1 = 1;
  contactBeat = -1;
  target: number | null = null;
  linkFrom: { pose: Move['pose']; t: number; facing: number; aim: number; footLead?: 1 | -1; footSwitch?: boolean } | null = null;
  clock = 0;
  activeKey: FootKey | null = null;
  route: FootChain = 'flow';
  confirmed = false;
  hits = 0;
  best = 0;
  lastHit = -Infinity;
  changedAt = -Infinity;
  beat = 0;
  total = 0;
  impact: (FootContact & { color: string; strong: boolean; school: FootSchool }) | null = null;

  get pending() { return this.queue[0] ?? null; }
  get inputs() { return this.queue.map(({ command }) => command.input); }
  get launchPending() { return this.queue.some(({ command }) => command.rising); }
  get chainHits() { return this.clock - this.lastHit <= 1.36 ? this.hits : 0; }
  get inFlamingo() { return this.version !== 2 && this.clock < this.stanceUntil; }
  get switchPending() { return this.clock <= this.switchUntil; }
  get stanceTime() { return this.clock - this.stanceSince; }
  get stanceFill() { return clamp((this.stanceUntil - this.clock) / 2, 0, 1); }

  reset() {
    this.steps = { light: 0, heavy: 0, air: 0 };
    this.lastStarted = -Infinity;
    this.queue = [];
    this.chase = null;
    this.target = null;
    this.linkFrom = null;
    this.activeKey = null;
    this.confirmed = false;
    this.jumpUntil = -Infinity;
    this.switchUntil = this.stanceUntil = this.stanceSince = -Infinity;
    this.lead = this.attackLead = 1; this.stanceStep = 0;
    this.contacts.clear(); this.contactBeat = -1;
    this.route = 'flow';
    this.hits = this.best = 0; this.lastHit = -Infinity;
    this.changedAt = -Infinity;
    this.beat = this.total = 0;
    this.impact = null;
  }

  select({ input, airborne, momentum, backKick, rising }: FootCommand, time: number, tempo: number) {
    const fresh = time - this.lastStarted > 1.18 / Math.min(tempo, 1);
    if (fresh) this.steps = { light: 0, heavy: 0, air: 0 };
    this.lastStarted = time;
    this.changedAt = this.clock;
    const previous = this.activeKey;
    const linked = this.confirmed;
    this.confirmed = false;
    if (!airborne) this.steps.air = 0;
    if (!rising && !this.launchPending) this.clearJump();
    if (this.version === 2) {
      this.leaveStance();
      if (airborne) return input === 'H' ? this.special('F2_AIR_540', 'air') : this.next('air', AIR_V2);
      if (rising) return this.special('F2_SKYLIFT');
      if (backKick || momentum) return this.special('F2_FLYING');
      // Rute pamungkas: J, J, J, J lalu K = Hunting Hawk langsung setelah Backlash kanan mengenai lawan.
      if (!fresh && linked && input === 'H' && previous === 'F2_BACK_R') {
        this.steps.heavy = 0; this.steps.light = 0;
        this.route = 'mixed'; this.beat = this.total = 5;
        return this.activeKey = 'F2_HAWK';
      }
      // Rute Rock Lee: Konoha Senpu yang kena lalu K = Konoha Dai Senpu, K berikutnya Hunting Hawk.
      if (!fresh && linked && input === 'H' && previous === 'F2_SENPU') {
        this.steps.heavy = 2; this.steps.light = 0;
        this.route = 'mixed'; this.beat = 6; this.total = 7;
        return this.activeKey = 'F2_DAISENPU';
      }
      return input === 'H' ? this.next('heavy', HEAVY_V2) : this.next('light', LIGHT_V2);
    }
    if (this.version === 3) {
      // Udara: J menyilang Sky Snap (V2) > Sky Scissors (V1) > Sky Tornado (V1); K bergantian Comet Drop (V1) / 540 banting (V2).
      if (airborne) {
        this.leaveStance();
        if (input === 'H') return this.special(this.steps.air % 2 ? 'F2_AIR_540' : 'FT_AIR_COMET', 'air');
        return this.next('air', AIR_V3);
      }
      if (rising) { this.leaveStance(); return this.special('F2_SKYLIFT'); }
      // W+K (Comet Back Kick) dan kuda-kuda Flamingo memakai aturan V1 di bawah.
      if (!backKick && !this.inFlamingo) {
        // Foot Mode V3: lari / dash + K (Shift+K) = Shotgun Dropkick alih-alih Flying Side Kick.
        if (momentum) return this.special(Math.random() < 0.6 ? 'FT_RDK' : 'FT_RJK');
        const cross = !fresh && linked && previous ? (input === 'H' ? CROSS_V3_HEAVY : CROSS_V3_LIGHT)[previous] : undefined;
        if (cross) {
          this.route = 'mixed'; this.beat = this.total = 2;
          return this.activeKey = cross;
        }
        return input === 'H' ? this.next('heavy', HEAVY_V3) : this.next('light', LIGHT_V3);
      }
    }
    if (airborne || rising || backKick) this.leaveStance();
    if (airborne) return input === 'H' ? this.special('FT_AIR_COMET', 'air') : this.next('air', AIR);
    if (rising) return this.special('FT_LAUNCH');
    if (backKick) return this.special('FT_BACK');
    if (this.inFlamingo) {
      this.stanceUntil = this.clock + 2;
      if (input === 'H') return this.flamingo('FT_FL_BREAK', 3);
      if (!fresh && linked && previous === 'FT_FL_DOUBLE' && this.stanceStep === 1) return this.flamingo('FT_FL_HOOK', 2);
      return this.flamingo('FT_FL_DOUBLE', 1);
    }
    if (momentum) return this.special('FT_BACK');
    if (!fresh && linked && input === 'H' && previous === 'FT_SIDE') return this.branch('FT_CROSS', 3);
    if (!fresh && linked && input === 'L' && previous === 'FT_CROSS') return this.branch('FT_DRAGON', 4);
    return input === 'H' ? this.next('heavy', HEAVY) : this.next('light', LIGHT);
  }

  buffer(command: FootCommand, time: number) {
    // Keep the first committed link; a deliberate special may replace the last queued tap.
    if (this.queue.length >= 2) {
      const last = this.queue[1];
      const deliberate = command.rising || command.backKick || command.airborne;
      const stanceFinisher = this.inFlamingo && command.input === 'H' && last.command.input === 'L';
      if ((deliberate || stanceFinisher) && !(last.command.rising || last.command.backKick)) {
        this.queue[1] = { command, at: time };
      }
      return;
    }
    this.queue.push({ command, at: time });
  }

  discard() { this.queue = []; }

  interrupt() {
    this.discard(); this.target = null; this.linkFrom = null; this.chase = null;
    this.leaveStance(); this.switchUntil = -Infinity;
    this.activeKey = null; this.confirmed = false; this.clearJump();
    this.hits = 0; this.lastHit = -Infinity; this.lastStarted = -Infinity;
  }

  /** Ganti Foot Mode V1 <-> V2: antrean & kuda-kuda dibersihkan, tendangan yang sedang berjalan dibiarkan selesai. */
  setVersion(version: FootVersion) {
    if (this.version === version) return false;
    this.version = version;
    this.discard(); this.leaveStance(); this.switchUntil = -Infinity; this.clearJump();
    this.steps = { light: 0, heavy: 0, air: 0 };
    this.confirmed = false; this.lead = 1; this.changedAt = this.clock;
    return true;
  }

  requestSwitch(tempo: number) { this.switchUntil = this.clock + .68 / Math.min(tempo, 1); }
  clearSwitch() { this.switchUntil = -Infinity; }

  switchStance() {
    this.switchUntil = -Infinity;
    this.lead = this.lead === 1 ? -1 : 1;
    this.stanceSince = this.clock;
    this.stanceUntil = this.clock + 2;
    if (this.route !== 'flamingo' || this.activeKey === 'FT_FL_BREAK') this.stanceStep = 0;
  }

  leaveStance() { this.stanceUntil = -Infinity; this.stanceStep = 0; }

  beginMove(move: FootMove) {
    this.contacts.clear(); this.contactBeat = -1;
    this.attackLead = move.foot.school === 'flamingo' ? this.lead : 1;
  }

  // The double kick owns two contact sets; holding or freezing a frame cannot repeat a beat.
  canContact(target: number, beat: number) { return !this.contacts.get(beat)?.has(target); }

  spendContact(target: number, beat: number) {
    let group = this.contacts.get(beat);
    if (!group) { group = new Set(); this.contacts.set(beat, group); }
    group.add(target);
  }

  take(time: number, lifetime: number) {
    while (this.queue.length && time - this.queue[0].at > lifetime) this.queue.shift();
    return this.queue.shift()?.command ?? null;
  }

  markLauncher(target: number, time: number) { this.chase = { target, until: time + .55 }; }

  bufferJump(tempo: number) { this.jumpUntil = this.clock + .46 / Math.min(tempo, 1); }
  get jumpQueued() { return this.clock <= this.jumpUntil; }
  clearJump() { this.jumpUntil = -Infinity; }

  takeLauncher(time: number) {
    const chase = this.chase;
    this.chase = null;
    return chase && time <= chase.until ? chase.target : null;
  }

  private next(track: keyof Footwork['steps'], list: readonly FootKey[]) {
    this.route = track === 'light' ? 'flow' : track === 'heavy' ? 'power' : 'air';
    this.beat = this.steps[track]++ % list.length + 1;
    this.total = list.length;
    return this.activeKey = list[this.beat - 1];
  }

  private special(key: FootKey, route: FootChain = 'special') {
    this.route = route;
    this.beat = this.total = 1;
    return this.activeKey = key;
  }

  private branch(key: FootKey, beat: number) {
    this.route = 'mixed'; this.beat = beat; this.total = 4;
    return this.activeKey = key;
  }

  private flamingo(key: FootKey, beat: number) {
    this.route = 'flamingo'; this.beat = this.stanceStep = beat; this.total = 3;
    if (key === 'FT_FL_BREAK') this.leaveStance();
    return this.activeKey = key;
  }

  recordImpact(contact: FootContact, move: FootMove) {
    this.confirmed = true;
    this.hits = this.clock - this.lastHit > 1.36 ? 1 : this.hits + 1;
    this.lastHit = this.clock;
    this.best = Math.max(this.best, this.hits);
    const switchColor = this.contactBeat === 1 ? this.attackLead === 1 ? -1 : 1 : this.attackLead;
    this.impact = { ...contact, color: move.foot.school === 'flamingo' ? footStanceColor(switchColor) : FOOT_SCHOOLS[move.foot.school].color, school: move.foot.school, strong: !!move.finisher };
  }
}

export function footProgress(attackT: number, active: number) {
  return clamp(1 - attackT / active, 0, 1);
}