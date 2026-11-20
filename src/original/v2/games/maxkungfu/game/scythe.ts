import type { Move } from './moves';
import { clamp } from './rng';

// =====================================================================================
// SCYTHE MODE — sabit Grim Reaper. Cepat, akrobatik, dan setiap jurus menyambung:
// tekan J terus untuk rantai panen, K untuk hop-spin & dash pemungkas.
// =====================================================================================

export type ScytheKey =
  | 'SC_R1' | 'SC_R2' | 'SC_SPIN' | 'SC_GRAVE'
  | 'SC_HALO' | 'SC_SOUL' | 'SC_MILL'
  | 'SC_AIR' | 'SC_DIVE';

export interface ScytheMove extends Move {
  scythe: { school: 'grim' | 'halo' | 'soul'; window: [number, number]; both?: boolean; spike?: boolean };
}

function scythe(id: string, name: string, pose: Move['pose'], school: ScytheMove['scythe']['school'], options: Partial<Move> & {
  window?: [number, number]; both?: boolean;
} = {}): ScytheMove {
  const { window = [0.24, 0.88], both, ...move } = options;
  return {
    id: `scy_${id}`, name, pose, kick: true, trail: true, limb: 'blade', sfx: 'slash',
    dmg: 3.2, structure: 20, range: 27, arc: 1.5, windup: 0.05, active: 0.11, recover: 0.10,
    kb: 58, knockdown: false, lunge: 54, hitstop: 0.027, shake: 0.2, hitR: 5.2,
    scythe: { school, window, both }, ...move,
  };
}

export const SCYTHE_MOVES = {
  // ---- Rantai J (panen cepat): tiga sapuan melintang lalu tebasan dari atas ----
  SC_R1: scythe('r1', 'HARVEST SLASH', 'scy_reap1', 'grim', {
    dmg: 3.2, structure: 19, range: 27, arc: 1.6, windup: .048, active: .105, recover: .085,
    kb: 52, lunge: 56, hitstop: .024, shake: .17, hitR: 5.2, window: [.14, .80],
    slash: { from: -1.25, to: 1.05, r: 19 },
  }),
  SC_R2: scythe('r2', 'SOIL TURN', 'scy_reap2', 'grim', {
    dmg: 3.4, structure: 21, range: 27, arc: 1.8, windup: .044, active: .10, recover: .085,
    kb: 58, lunge: 52, hitstop: .024, shake: .18, hitR: 5.2, window: [.14, .80],
    slash: { from: 1.35, to: -1.05, r: 19 },
  }),
  SC_SPIN: scythe('spin', 'DEATH SPIN', 'scy_spin', 'grim', {
    dmg: 4.3, structure: 26, range: 29, arc: 3.14, windup: .055, active: .22, recover: .115,
    kb: 78, lunge: 40, jump: 1.1, hitstop: .032, shake: .24, hitR: 5.6, both: true, rehit: .11,
    window: [.12, .90], slash: { from: 0, to: 6.28, r: 21 },
  }),
  SC_GRAVE: scythe('grave', 'GRAVE DIGGER', 'scy_grave', 'grim', {
    dmg: 7.0, structure: 38, range: 29, arc: 1.7, windup: .075, active: .15, recover: .19,
    kb: 185, lunge: 58, jump: 3.1, launch: 60, knockdown: true, finisher: true, showName: true,
    hitstop: .052, shake: .4, hitR: 5.8, window: [.16, .88],
    slash: { from: -2.4, to: 0.9, r: 22, lift: .5 },
  }),
  // ---- Rantai K (berat): hop-spin vertikal lalu dash melayang berputar ----
  SC_HALO: scythe('halo', "REAPER'S HALO", 'scy_halo', 'halo', {
    dmg: 6.1, structure: 32, range: 30, arc: 2.9, windup: .085, active: .25, recover: .15,
    kb: 118, lunge: 34, jump: 2.4, rehit: .13, hitstop: .044, shake: .33, hitR: 5.8, both: true,
    window: [.14, .90], slash: { from: -1.5, to: 1.5, r: 24, lift: .8 },
  }),
  SC_SOUL: scythe('soul', 'SOUL HARVEST', 'scy_soul', 'soul', {
    dmg: 8.3, structure: 46, range: 30, arc: 2.2, windup: .07, active: .21, recover: .19,
    travel: 178, jump: 4.2, kb: 205, knockdown: true, finisher: true, showName: true,
    hitstop: .058, shake: .47, hitR: 5.9, window: [.12, .94],
    slash: { from: -2.2, to: 1.2, r: 23, lift: .6 },
  }),
  // ---- Akrobatik lantai: satu tangan menapak, sabit mengukur lingkaran ----
  SC_MILL: scythe('mill', 'WINDMILL REAP', 'scy_mill', 'grim', {
    dmg: 5.3, structure: 30, range: 29, arc: 3.14, windup: .065, active: .28, recover: .15,
    kb: 92, lunge: 30, jump: 1.5, rehit: .14, hitstop: .038, shake: .3, hitR: 5.6, both: true,
    window: [.12, .94], slash: { from: 0, to: 6.28, r: 22 },
  }),
  // ---- Udara ----
  SC_AIR: scythe('air', 'SKY REAP', 'scy_air', 'grim', {
    dmg: 3.6, structure: 20, range: 26, arc: 1.5, windup: .038, active: .115, recover: .075,
    kb: 42, lunge: 44, air: true, hitstop: .022, shake: .16, hitR: 5.0, window: [.10, .82],
    slash: { from: -0.9, to: 1.0, r: 18 },
  }),
  SC_DIVE: scythe('dive', 'DEATH DIVE', 'scy_dive', 'soul', {
    dmg: 6.2, structure: 34, range: 27, arc: 1.9, windup: .045, active: .15, recover: .13,
    kb: 88, lunge: 30, air: true, knockdown: true, spike: true as unknown as undefined,
    hitstop: .048, shake: .36, hitR: 5.6, window: [.10, .90],
    slash: { from: 0.6, to: 1.7, r: 19, lift: .4 },
  } as Partial<Move>) as ScytheMove,
} satisfies Record<string, ScytheMove>;

// Penanda khusus: Death Dive membanting lawan ke bawah seperti foot_air_comet.
SCYTHE_MOVES.SC_DIVE.scythe.spike = true;

export function scytheMove(move?: Move | null): ScytheMove | undefined {
  return move && 'scythe' in move ? move as ScytheMove : undefined;
}

export function scytheContact(move: ScytheMove, progress: number) {
  return progress >= move.scythe.window[0] && progress <= move.scythe.window[1];
}

export const SCYTHE_COLOR = { grim: '#b488ff', halo: '#7df9ff', soul: '#ff4f6d' };
export const SCYTHE_LIGHT = { grim: '#f1e9ff', halo: '#eaffff', soul: '#ffd9e0' };

export type ScytheInput = 'L' | 'H';
export type ScytheCommand = { input: ScytheInput; airborne: boolean; momentum: boolean; rising: boolean; backKick: boolean; autoAim?: boolean; aim?: number };
export type ScytheChain = 'harvest' | 'halo' | 'air' | 'cross' | 'special';
type ScytheContact = { x: number; y: number; at: number; direction: number };

/** Mesin rantai sabit: J = panen cepat, K = berat, ganti tombol setelah kena = cabang silang. */
export class ScytheFlow {
  private steps = { light: 0, heavy: 0, air: 0 };
  private lastStarted = -Infinity;
  private queue: { command: ScytheCommand; at: number }[] = [];
  private chase: { target: number; until: number } | null = null;
  private jumpUntil = -Infinity;
  private contacts = new Map<number, Set<number>>();
  clock = 0;
  activeKey: ScytheKey | null = null;
  route: ScytheChain = 'harvest';
  linkFrom = false;
  confirmed = false;
  hits = 0;
  best = 0;
  lastHit = -Infinity;
  changedAt = -Infinity;
  beat = 0;
  total = 0;
  target: number | null = null;
  impact: (ScytheContact & { color: string; strong: boolean }) | null = null;

  get pending() { return this.queue[0] ?? null; }
  get inputs() { return this.queue.map(({ command }) => command.input); }
  get launchPending() { return this.queue.some(({ command }) => command.rising); }
  get chainHits() { return this.clock - this.lastHit <= 1.36 ? this.hits : 0; }

  reset() {
    this.steps = { light: 0, heavy: 0, air: 0 };
    this.lastStarted = -Infinity;
    this.queue = [];
    this.chase = null;
    this.target = null;
    this.activeKey = null;
    this.confirmed = false;
    this.jumpUntil = -Infinity;
    this.contacts.clear();
    this.route = 'harvest';
    this.linkFrom = false;
    this.hits = this.best = 0; this.lastHit = -Infinity;
    this.changedAt = -Infinity;
    this.beat = this.total = 0;
    this.impact = null;
  }

  beginMove() { this.contacts.clear(); }

  select({ input, airborne, momentum, rising, backKick }: ScytheCommand, time: number, tempo: number) {
    const fresh = time - this.lastStarted > 1.15 / Math.min(tempo, 1);
    if (fresh) this.steps = { light: 0, heavy: 0, air: 0 };
    this.lastStarted = time;
    this.changedAt = this.clock;
    const previous = this.activeKey;
    const linked = this.confirmed;
    this.confirmed = false;
    if (!airborne) this.steps.air = 0;
    if (!rising && !this.launchPending) this.clearJump();
    if (airborne) return input === 'H' ? this.special('SC_DIVE', 'air') : this.next('air', ['SC_AIR']);
    if (rising) return this.special('SC_GRAVE');
    if (backKick || momentum) return this.special('SC_SOUL', 'special');
    // Cabang silang: ganti tombol di tengah rantai segera setelah jurus kena.
    if (!fresh && linked && previous) {
      const cross: Partial<Record<ScytheKey, { L?: ScytheKey; H?: ScytheKey }>> = {
        SC_R1: { H: 'SC_HALO' },
        SC_R2: { H: 'SC_SOUL' },
        SC_SPIN: { H: 'SC_SOUL' },
        SC_HALO: { L: 'SC_SPIN' },
        SC_MILL: { H: 'SC_SOUL', L: 'SC_R1' },
      };
      const want = cross[previous]?.[input];
      if (want) { this.route = 'cross'; this.beat = this.total = 2; return this.activeKey = want; }
    }
    return input === 'H' ? this.next('heavy', ['SC_HALO', 'SC_SOUL']) : this.next('light', ['SC_R1', 'SC_R2', 'SC_SPIN', 'SC_GRAVE']);
  }

  buffer(command: ScytheCommand, time: number) {
    if (this.queue.length >= 2) return;
    this.queue.push({ command, at: time });
  }

  discard() { this.queue = []; }

  interrupt() {
    this.discard(); this.target = null; this.chase = null;
    this.activeKey = null; this.confirmed = false; this.clearJump();
    this.hits = 0; this.lastHit = -Infinity; this.lastStarted = -Infinity;
  }

  bufferJump(tempo: number) { this.jumpUntil = this.clock + .46 / Math.min(tempo, 1); }
  get jumpQueued() { return this.clock <= this.jumpUntil; }
  clearJump() { this.jumpUntil = -Infinity; }

  markLauncher(target: number, time: number) { this.chase = { target, until: time + .55 }; }
  takeLauncher(time: number) {
    const chase = this.chase;
    this.chase = null;
    return chase && time <= chase.until ? chase.target : null;
  }

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

  recordImpact(contact: ScytheContact, move: ScytheMove) {
    this.confirmed = true;
    this.hits = this.clock - this.lastHit > 1.36 ? 1 : this.hits + 1;
    this.lastHit = this.clock;
    this.best = Math.max(this.best, this.hits);
    this.impact = { ...contact, color: SCYTHE_COLOR[move.scythe.school], strong: !!move.finisher };
  }

  private next(track: keyof ScytheFlow['steps'], list: readonly ScytheKey[]) {
    this.route = track === 'light' ? 'harvest' : track === 'heavy' ? 'halo' : 'air';
    this.beat = this.steps[track]++ % list.length + 1;
    this.total = list.length;
    return this.activeKey = list[this.beat - 1];
  }

  private special(key: ScytheKey, route: ScytheChain = 'special') {
    this.route = route;
    this.beat = this.total = 1;
    return this.activeKey = key;
  }
}

export function scytheProgress(attackT: number, active: number) {
  return clamp(1 - attackT / active, 0, 1);
}
