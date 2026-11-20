// SILAT SCENES — The Raid style close-quarters set pieces for FIST mode.
// Each scene is a list of beats. A beat sets the player's pose and the victim's pose, and moves the victim
// to an offset relative to the player (f = forward along the fight line, s = sideways, z = height, r = body
// rotation, × victim facing). Offsets are eased from the previous beat, so the two bodies move together.
import type { Pose } from './types';

export type SilatFx = 'knee' | 'elbow' | 'punch' | 'snap' | 'slam' | 'sweep' | 'head' | 'block' | 'bat';
export interface SilatHit { dmg: number; fx: SilatFx; word: string; stop?: number; shake?: number; final?: boolean }
export interface SilatBeat {
  d: number;
  pp: Pose; pt: [number, number];          // player pose + pose time range over the beat
  ep: Pose; et?: [number, number];         // victim pose + pose time range
  f: number; s?: number; z?: number; r?: number;
  step?: number;                           // player walks this far along the fight line during the beat
  head?: boolean;                          // player's front hand locks onto the victim's head
  turn?: boolean;                          // player turns around (fight line flips) at the start of the beat
  away?: boolean;                          // victim faces away from the player (back take)
  snap?: boolean;                          // jump straight to this beat's offsets (no easing)
  hit?: SilatHit;
  name?: string;
  pz?: number;                             // player jump arc height during the beat (flips)
  acro?: boolean;                          // acrobatic beat: afterimages + air dust
  spin?: number;                           // nunchaku: hand circles the shoulder at this rad/s (helicopter)
  // ---- DOUBLE scenes: second victim (offsets relative to the player like f/s/z/r) ----
  bat?: 'shoulder' | 'across';             // bat held on the shoulder (taunt) / across the victim's throat
  batSpin?: number;                        // bat twirls around the wrist at this rad/s
  f2?: number; s2?: number; z2?: number; r2?: number; ep2?: Pose; et2?: [number, number]; away2?: boolean; hit2?: SilatHit;
}
export interface SilatScene { weapon?: 'fist' | 'nunchaku' | 'bat'; double?: boolean; id: string; title: string; beats: SilatBeat[]; release: { kb: number; down: boolean; launch?: number } }

const kneeUp = (dmg: number, word: string, extra: Partial<SilatHit> = {}): SilatBeat[] => [
  { d: 0.09, pp: 'knee', pt: [0.12, 0.45], ep: 'stagger', f: 7, r: 0.85, head: true, hit: { dmg, fx: 'knee', word, ...extra } },
  { d: 0.07, pp: 'knee', pt: [0.45, 0.15], ep: 'stagger', f: 7, r: 0.75, head: true },
];

export const SILAT: SilatScene[] = [
  {
    id: 'clinch', title: 'HEAD CLINCH KNEES',
    beats: [
      { d: 0.14, pp: 'grab', pt: [0, 0.7], ep: 'stagger', f: 8, head: true, name: 'GRAB THE HEAD' },
      { d: 0.12, pp: 'grab', pt: [0.7, 1], ep: 'stagger', f: 7, r: 0.75, head: true },
      ...kneeUp(4, 'KNEE!'), ...kneeUp(4, 'KNEE!'), ...kneeUp(5, 'KNEE!!'),
      { d: 0.1, pp: 'knee', pt: [0.12, 0.5], ep: 'launched', et: [0.3, 0.3], f: 9, z: 5, r: -0.5, hit: { dmg: 6, fx: 'knee', word: 'CRACK!', stop: 0.08, shake: 0.5 } },
      { d: 0.2, pp: 'hammer', pt: [0.15, 0.55], ep: 'launched', f: 10, z: 0, r: -1.3, hit: { dmg: 8, fx: 'slam', word: 'ELBOW DROP!', stop: 0.1, shake: 0.8, final: true } },
    ],
    release: { kb: 120, down: true },
  },
  {
    id: 'armbar', title: 'ARM LOCK BREAK',
    beats: [
      { d: 0.12, pp: 'parry', pt: [0.3, 0.5], ep: 'punch', et: [0.5, 0.5], f: 10, name: 'CATCH THE ARM' },
      { d: 0.14, pp: 'grab', pt: [0.4, 1], ep: 'hurt', f: 8, s: 3, r: 0.35 },
      { d: 0.1, pp: 'elbow', pt: [0.2, 0.45], ep: 'hurt', f: 8, s: 3, r: 0.55, hit: { dmg: 5, fx: 'snap', word: 'SNAP!', stop: 0.08, shake: 0.4 } },
      { d: 0.1, pp: 'hook', pt: [0.2, 0.45], ep: 'hurt', f: 7, s: 2, r: 0.2, hit: { dmg: 4, fx: 'elbow', word: 'ELBOW!' } },
      { d: 0.14, pp: 'sweep', pt: [0.2, 0.55], ep: 'fly', f: 8, z: 9, r: 1.6, hit: { dmg: 3, fx: 'sweep', word: 'SWEEP!', shake: 0.3 } },
      { d: 0.08, pp: 'sweep', pt: [0.55, 0.7], ep: 'down', f: 9, z: 0, r: 0, snap: true, hit: { dmg: 3, fx: 'slam', word: 'BAM!', shake: 0.6 } },
      { d: 0.18, pp: 'hammer', pt: [0.15, 0.55], ep: 'down', f: 9, hit: { dmg: 8, fx: 'punch', word: 'GROUND POUND!', stop: 0.1, shake: 0.7, final: true } },
    ],
    release: { kb: 40, down: true },
  },
  {
    id: 'hipthrow', title: 'SILAT HIP THROW',
    beats: [
      { d: 0.12, pp: 'grab', pt: [0, 0.8], ep: 'stagger', f: 7, head: true, name: 'BANTINGAN' },
      { d: 0.1, pp: 'grab', pt: [0.8, 1], ep: 'stagger', f: 3, s: 2, head: true },
      { d: 0.14, pp: 'spinback', pt: [0.2, 0.42], ep: 'fly', f: 0, s: 1, z: 18, r: 1.6 },
      { d: 0.14, pp: 'spinback', pt: [0.42, 0.6], ep: 'fly', f: -11, z: 0, r: 3.1, hit: { dmg: 8, fx: 'slam', word: 'BANTING!', stop: 0.1, shake: 0.9 } },
      { d: 0.03, pp: 'crouch', pt: [0, 0], ep: 'down', f: 11, r: 0, turn: true, snap: true },
      { d: 0.22, pp: 'kneedrop', pt: [0.3, 0.6], ep: 'down', f: 6, step: 4, hit: { dmg: 8, fx: 'slam', word: 'KNEE DROP!', stop: 0.1, shake: 0.7, final: true } },
    ],
    release: { kb: 30, down: true },
  },
  {
    id: 'flurry', title: 'ELBOW STORM',
    beats: [
      { d: 0.09, pp: 'parry', pt: [0.3, 0.5], ep: 'hurt', f: 9, name: 'TRAP THE HANDS' },
      { d: 0.085, pp: 'elbow', pt: [0.2, 0.48], ep: 'hurt', f: 9, r: 0.25, hit: { dmg: 3, fx: 'elbow', word: 'ELBOW!' } },
      { d: 0.085, pp: 'hook', pt: [0.2, 0.48], ep: 'hurt', f: 8, r: -0.3, hit: { dmg: 3, fx: 'punch', word: 'HOOK!' } },
      { d: 0.085, pp: 'elbow', pt: [0.2, 0.48], ep: 'hurt', f: 8, r: 0.3, hit: { dmg: 3, fx: 'elbow', word: 'ELBOW!' } },
      { d: 0.085, pp: 'hook', pt: [0.2, 0.48], ep: 'hurt', f: 8, r: -0.35, hit: { dmg: 3, fx: 'punch', word: 'HOOK!' } },
      { d: 0.09, pp: 'palm', pt: [0.2, 0.48], ep: 'stagger', f: 9, r: -0.5, hit: { dmg: 4, fx: 'head', word: 'PALM!', stop: 0.06 } },
      { d: 0.16, pp: 'spinback', pt: [0.25, 0.58], ep: 'launched', f: 13, z: 4, r: -0.6, hit: { dmg: 8, fx: 'elbow', word: 'SPINNING ELBOW!', stop: 0.12, shake: 0.8, final: true } },
    ],
    release: { kb: 420, down: true, launch: 90 },
  },
  {
    id: 'collar', title: 'COLLAR HEADBUTT THROW',
    beats: [
      { d: 0.12, pp: 'grab', pt: [0, 0.8], ep: 'stagger', f: 7, head: true, name: 'GRAB THE COLLAR' },
      { d: 0.08, pp: 'grab', pt: [0.8, 1], ep: 'stagger', f: 5, r: 0.2, head: true },
      { d: 0.1, pp: 'grab', pt: [1, 1], ep: 'hurt', f: 6, r: -0.5, step: 1, head: true, hit: { dmg: 4, fx: 'head', word: 'HEADBUTT!', stop: 0.08, shake: 0.5 } },
      { d: 0.08, pp: 'grab', pt: [1, 1], ep: 'hurt', f: 6, r: -0.2, head: true, hit: { dmg: 3, fx: 'head', word: 'AGAIN!', stop: 0.05 } },
      { d: 0.16, pp: 'throw', pt: [0.2, 0.7], ep: 'launched', f: 13, z: 5, r: -0.4, hit: { dmg: 6, fx: 'punch', word: 'THROW!', stop: 0.06, shake: 0.5, final: true } },
    ],
    release: { kb: 680, down: true },
  },
  {
    id: 'backtake', title: 'NECK CRANK TAKEDOWN',
    beats: [
      { d: 0.14, pp: 'dash', pt: [0, 0], ep: 'hurt', f: -9, step: 18, name: 'SLIP BEHIND' },
      { d: 0.03, pp: 'grab', pt: [0, 0.3], ep: 'stagger', f: 9, turn: true, away: true, snap: true },
      { d: 0.18, pp: 'grab', pt: [0.3, 1], ep: 'stagger', f: 6, r: -0.55, head: true, away: true },
      { d: 0.12, pp: 'grab', pt: [1, 1], ep: 'hurt', f: 6, r: -0.95, head: true, away: true, hit: { dmg: 5, fx: 'snap', word: 'CRACK!', stop: 0.1, shake: 0.5 } },
      { d: 0.18, pp: 'hammer', pt: [0.15, 0.55], ep: 'down', f: 8, r: 0, away: true, snap: true, hit: { dmg: 7, fx: 'slam', word: 'TAKEDOWN!', stop: 0.1, shake: 0.8, final: true } },
    ],
    release: { kb: 30, down: true },
  },
  // ---------------- SWEEP / TAKEDOWN ----------------
  {
    id: 'legsweep', title: 'LEG SWEEP TAKEDOWN',
    beats: [
      { d: 0.1, pp: 'parry', pt: [0.3, 0.5], ep: 'hurt', f: 10, name: 'TRAP' },
      { d: 0.16, pp: 'sweep', pt: [0.2, 0.55], ep: 'fly', f: 10, z: 10, r: 1.5, hit: { dmg: 3, fx: 'sweep', word: 'SWEEP!', shake: 0.3 } },
      { d: 0.08, pp: 'sweep', pt: [0.55, 0.75], ep: 'down', f: 11, z: 0, r: 0, snap: true, hit: { dmg: 3, fx: 'slam', word: 'BAM!', shake: 0.6 } },
      { d: 0.14, pp: 'jump', pt: [0.2, 0.45], ep: 'down', f: 7, step: 4, pz: 12, acro: true },
      { d: 0.18, pp: 'stomp', pt: [0.3, 0.6], ep: 'down', f: 4, step: 3, hit: { dmg: 9, fx: 'slam', word: 'STOMP!', stop: 0.12, shake: 0.9, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  {
    id: 'tackle', title: 'DOUBLE LEG TACKLE',
    beats: [
      { d: 0.1, pp: 'crouch', pt: [0, 0], ep: 'stagger', f: 12, name: 'SHOOT IN' },
      { d: 0.12, pp: 'rush', pt: [0.3, 0.5], ep: 'fly', f: 9, step: 6, z: 7, r: -1.3, hit: { dmg: 3, fx: 'slam', word: 'TACKLE!', shake: 0.4 } },
      { d: 0.08, pp: 'takedown', pt: [0, 0.1], ep: 'down', f: 5, z: 0, r: 0, snap: true, step: 4, hit: { dmg: 3, fx: 'slam', word: 'SLAM!', shake: 0.7 } },
      { d: 0.1, pp: 'takedown', pt: [0.1, 0.5], ep: 'down', f: 5, hit: { dmg: 3, fx: 'punch', word: 'POUND!' } },
      { d: 0.1, pp: 'takedown', pt: [0.5, 0.9], ep: 'down', f: 5, hit: { dmg: 3, fx: 'punch', word: 'POUND!' } },
      { d: 0.1, pp: 'takedown', pt: [0.1, 0.5], ep: 'down', f: 5, hit: { dmg: 3, fx: 'punch', word: 'POUND!!' } },
      { d: 0.2, pp: 'hammer', pt: [0.15, 0.55], ep: 'down', f: 6, hit: { dmg: 9, fx: 'slam', word: 'HAMMER FIST!', stop: 0.12, shake: 0.9, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  // ---------------- THROW ----------------
  {
    id: 'shoulder', title: 'SHOULDER THROW',
    beats: [
      { d: 0.12, pp: 'grab', pt: [0, 0.8], ep: 'stagger', f: 7, head: true, name: 'SEOI NAGE' },
      { d: 0.1, pp: 'crouch', pt: [0, 0], ep: 'fly', f: 3, z: 6, r: 0.8, head: true },
      { d: 0.14, pp: 'throw', pt: [0.1, 0.45], ep: 'fly', f: 6, z: 22, r: 2.2 },
      { d: 0.12, pp: 'throw', pt: [0.45, 0.7], ep: 'down', f: 14, z: 0, r: 3.1, hit: { dmg: 7, fx: 'slam', word: 'THROWN!', stop: 0.1, shake: 0.9 } },
      { d: 0.04, pp: 'jump', pt: [0, 0.1], ep: 'down', f: 14, r: 0, snap: true },
      { d: 0.2, pp: 'flying', pt: [0.2, 0.5], ep: 'down', f: 6, step: 8, pz: 14, acro: true },
      { d: 0.2, pp: 'axekick', pt: [0.3, 0.62], ep: 'down', f: 6, hit: { dmg: 9, fx: 'slam', word: 'HEEL DROP!', stop: 0.12, shake: 1, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  // ---------------- COUNTER CHAIN (triggered by a dodge or a perfect parry) ----------------
  {
    id: 'counter', title: 'COUNTER CHAIN',
    beats: [
      { d: 0.12, pp: 'parry', pt: [0, 0.3], ep: 'punch', et: [0.1, 0.55], f: 11, name: 'HE ATTACKS' },
      { d: 0.1, pp: 'dash', pt: [0, 0], ep: 'punch', et: [0.55, 0.8], f: 10, s: -6, name: 'SLIP!' },
      { d: 0.1, pp: 'cross', pt: [0.2, 0.48], ep: 'hurt', f: 9, s: -3, hit: { dmg: 3, fx: 'punch', word: 'COUNTER!' } },
      { d: 0.14, pp: 'parry', pt: [0.2, 0.5], ep: 'kick', et: [0.1, 0.6], f: 10, s: -1, name: 'HE COUNTERS', hit: { dmg: 0, fx: 'block', word: 'BLOCKED!' } },
      { d: 0.1, pp: 'uppercut', pt: [0.2, 0.5], ep: 'launched', f: 9, z: 8, r: -0.4, hit: { dmg: 4, fx: 'punch', word: 'RE-COUNTER!', stop: 0.07 } },
      { d: 0.2, pp: 'monkeyflip', pt: [0.2, 0.6], ep: 'fly', f: 8, z: 16, r: -1.4, pz: 14, acro: true, hit: { dmg: 4, fx: 'knee', word: 'FLIP KICK!' } },
      { d: 0.22, pp: 'axekick', pt: [0.25, 0.6], ep: 'down', f: 9, z: 0, r: 0, hit: { dmg: 10, fx: 'slam', word: 'FINISHER!', stop: 0.14, shake: 1.1, final: true } },
    ],
    release: { kb: 30, down: true },
  },
  // ======================= NUNCHAKU (Bruce Lee) =======================
  {
    weapon: 'nunchaku', id: 'n_flourish', title: 'WATAAA! FLOURISH STRIKE',
    beats: [
      { d: 0.26, pp: 'n_figure8', pt: [0, 1], ep: 'idle', f: 14, spin: 22, name: 'FLOURISH...' },
      { d: 0.1, pp: 'n_idle', pt: [0, 0], ep: 'stagger', f: 13, name: 'WATAAA!' },
      { d: 0.12, pp: 'n_lash', pt: [0.2, 0.5], ep: 'hurt', f: 12, r: 0.4, step: 2, hit: { dmg: 4, fx: 'head', word: 'CRACK!' } },
      { d: 0.12, pp: 'n_cross', pt: [0.2, 0.5], ep: 'hurt', f: 12, r: -0.45, hit: { dmg: 4, fx: 'head', word: 'CRACK!' } },
      { d: 0.12, pp: 'n_whipcrack', pt: [0.2, 0.5], ep: 'stagger', f: 12, r: 0.5, hit: { dmg: 5, fx: 'snap', word: 'WHIP!', stop: 0.07 } },
      { d: 0.22, pp: 'n_overhead', pt: [0.15, 0.55], ep: 'down', f: 12, hit: { dmg: 10, fx: 'slam', word: 'SKULL CRACKER!', stop: 0.13, shake: 1, final: true } },
    ],
    release: { kb: 30, down: true },
  },
  {
    weapon: 'nunchaku', id: 'n_sweep', title: 'CHAIN LEG SWEEP',
    beats: [
      { d: 0.12, pp: 'n_lowsweep', pt: [0.1, 0.35], ep: 'hurt', f: 12, spin: -20, name: 'HOOK THE LEG' },
      { d: 0.14, pp: 'n_lowsweep', pt: [0.35, 0.65], ep: 'fly', f: 12, z: 11, r: 1.6, hit: { dmg: 4, fx: 'sweep', word: 'SWEEP!', shake: 0.3 } },
      { d: 0.08, pp: 'n_idle', pt: [0, 0], ep: 'down', f: 12, z: 0, r: 0, snap: true, hit: { dmg: 3, fx: 'slam', word: 'BAM!', shake: 0.6 } },
      { d: 0.12, pp: 'n_helicopter', pt: [0.2, 0.6], ep: 'down', f: 10, step: 2, spin: 26, hit: { dmg: 3, fx: 'head', word: 'WHAP!' } },
      { d: 0.22, pp: 'n_overhead', pt: [0.15, 0.55], ep: 'down', f: 10, hit: { dmg: 9, fx: 'slam', word: 'DRUM ROLL!', stop: 0.13, shake: 1, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  {
    weapon: 'nunchaku', id: 'n_choke', title: 'CHAIN CHOKE THROW',
    beats: [
      { d: 0.14, pp: 'dash', pt: [0, 0], ep: 'hurt', f: -10, step: 20, name: 'GET BEHIND' },
      { d: 0.03, pp: 'n_choke', pt: [0, 0.3], ep: 'stagger', f: 7, turn: true, away: true, snap: true },
      { d: 0.2, pp: 'n_garrote', pt: [0.1, 0.6], ep: 'stagger', f: 6, r: -0.5, away: true, name: 'CHOKE!' },
      { d: 0.12, pp: 'n_garrote', pt: [0.6, 1], ep: 'hurt', f: 5, r: -0.8, away: true, hit: { dmg: 5, fx: 'snap', word: 'SQUEEZE!', stop: 0.08 } },
      { d: 0.14, pp: 'spinback', pt: [0.2, 0.42], ep: 'fly', f: 0, s: 2, z: 18, r: 1.6, away: true },
      { d: 0.12, pp: 'spinback', pt: [0.42, 0.6], ep: 'down', f: -12, z: 0, r: 3.1, hit: { dmg: 6, fx: 'slam', word: 'THROWN!', stop: 0.1, shake: 0.9 } },
      { d: 0.03, pp: 'n_idle', pt: [0, 0], ep: 'down', f: 12, r: 0, turn: true, snap: true },
      { d: 0.22, pp: 'n_whipcrack', pt: [0.2, 0.55], ep: 'down', f: 13, hit: { dmg: 9, fx: 'snap', word: 'FINAL WHIP!', stop: 0.13, shake: 1, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  {
    weapon: 'nunchaku', id: 'n_storm', title: 'HELICOPTER STORM',
    beats: [
      { d: 0.1, pp: 'n_helicopter', pt: [0, 0.3], ep: 'hurt', f: 12, spin: 26, name: 'HOOO!' },
      { d: 0.08, pp: 'n_helicopter', pt: [0.3, 0.5], ep: 'hurt', f: 12, r: 0.3, spin: 30, hit: { dmg: 2, fx: 'head', word: 'WHAP!' } },
      { d: 0.08, pp: 'n_helicopter', pt: [0.5, 0.7], ep: 'hurt', f: 12, r: -0.3, spin: 30, hit: { dmg: 2, fx: 'head', word: 'WHAP!' } },
      { d: 0.08, pp: 'n_helicopter', pt: [0.3, 0.5], ep: 'hurt', f: 12, r: 0.35, spin: 30, hit: { dmg: 2, fx: 'head', word: 'WHAP!' } },
      { d: 0.14, pp: 'n_tornado', pt: [0.2, 0.6], ep: 'launched', f: 12, z: 14, r: -0.8, spin: 34, hit: { dmg: 3, fx: 'knee', word: 'TORNADO!', stop: 0.06 } },
      { d: 0.18, pp: 'flying', pt: [0.2, 0.5], ep: 'launched', f: 10, z: 18, r: -1.6, step: 4, pz: 16, acro: true, spin: 30 },
      { d: 0.22, pp: 'n_dragonlash', pt: [0.2, 0.6], ep: 'down', f: 12, z: 0, r: 0, hit: { dmg: 10, fx: 'slam', word: 'DRAGON LASH!', stop: 0.14, shake: 1.1, final: true } },
    ],
    release: { kb: 160, down: true },
  },
  {
    weapon: 'nunchaku', id: 'n_triangle', title: 'TRIANGLE & SIDE KICK',
    beats: [
      { d: 0.12, pp: 'n_choke', pt: [0.2, 0.5], ep: 'punch', et: [0.5, 0.5], f: 10, name: 'WRAP THE ARM' },
      { d: 0.1, pp: 'n_tri1', pt: [0.2, 0.5], ep: 'hurt', f: 11, r: 0.3, hit: { dmg: 3, fx: 'head', word: 'ONE!' } },
      { d: 0.1, pp: 'n_tri2', pt: [0.2, 0.5], ep: 'hurt', f: 11, r: -0.4, hit: { dmg: 3, fx: 'head', word: 'TWO!' } },
      { d: 0.1, pp: 'n_tri3', pt: [0.2, 0.5], ep: 'hurt', f: 11, r: 0.4, hit: { dmg: 3, fx: 'head', word: 'THREE!' } },
      { d: 0.1, pp: 'n_tri4', pt: [0.2, 0.5], ep: 'stagger', f: 10, r: -0.2 },
      { d: 0.2, pp: 'sidekick', pt: [0.2, 0.55], ep: 'launched', f: 12, z: 4, r: -0.5, hit: { dmg: 9, fx: 'knee', word: 'SIDE KICK!', stop: 0.14, shake: 1, final: true } },
    ],
    release: { kb: 720, down: true },
  },
  {
    weapon: 'nunchaku', id: 'n_counter', title: 'NUNCHAKU COUNTER CHAIN',
    beats: [
      { d: 0.12, pp: 'n_idle', pt: [0, 0], ep: 'punch', et: [0.1, 0.55], f: 12, name: 'HE ATTACKS' },
      { d: 0.1, pp: 'dash', pt: [0, 0], ep: 'punch', et: [0.55, 0.8], f: 11, s: -7, name: 'SLIP!' },
      { d: 0.12, pp: 'n_lash', pt: [0.2, 0.5], ep: 'hurt', f: 12, s: -3, hit: { dmg: 4, fx: 'head', word: 'COUNTER!' } },
      { d: 0.14, pp: 'n_figure8', pt: [0.2, 0.6], ep: 'kick', et: [0.1, 0.6], f: 11, s: -1, spin: 24, name: 'HE COUNTERS', hit: { dmg: 0, fx: 'block', word: 'CHAIN BLOCK!' } },
      { d: 0.12, pp: 'n_cross', pt: [0.2, 0.5], ep: 'launched', f: 11, z: 8, r: -0.4, hit: { dmg: 4, fx: 'snap', word: 'RE-COUNTER!', stop: 0.07 } },
      { d: 0.2, pp: 'monkeyflip', pt: [0.2, 0.6], ep: 'fly', f: 9, z: 16, r: -1.4, pz: 14, acro: true, spin: 28, hit: { dmg: 4, fx: 'knee', word: 'FLIP!' } },
      { d: 0.22, pp: 'n_overhead', pt: [0.15, 0.55], ep: 'down', f: 12, z: 0, r: 0, hit: { dmg: 10, fx: 'slam', word: 'FINISHER!', stop: 0.14, shake: 1.1, final: true } },
    ],
    release: { kb: 30, down: true },
  },
  // ======================= DOUBLE (2 enemies at once) =======================
  {
    double: true, id: 'd_clash', title: 'DOUBLE HEAD CLASH',
    beats: [
      { d: 0.12, pp: 'grab', pt: [0, 0.8], ep: 'stagger', f: 8, s: -6, ep2: 'stagger', f2: 8, s2: 6, name: 'GRAB BOTH!' },
      { d: 0.08, pp: 'grab', pt: [0.8, 1], ep: 'stagger', f: 7, s: -9, ep2: 'stagger', f2: 7, s2: 9 },
      { d: 0.1, pp: 'grab', pt: [1, 1], ep: 'hurt', f: 8, s: -2.5, r: 0.5, ep2: 'hurt', f2: 8, s2: 2.5, r2: -0.5, hit: { dmg: 5, fx: 'head', word: 'CLASH!', stop: 0.1, shake: 0.7 }, hit2: { dmg: 5, fx: 'head', word: 'CLASH!' } },
      { d: 0.18, pp: 'spinback', pt: [0.2, 0.6], ep: 'launched', f: 13, s: -6, z: 4, r: -0.6, ep2: 'launched', f2: 13, s2: 6, z2: 4, r2: 0.6, hit: { dmg: 8, fx: 'knee', word: 'SPIN KICK!', stop: 0.12, shake: 1, final: true }, hit2: { dmg: 8, fx: 'knee', word: 'BOTH!', final: true } },
    ],
    release: { kb: 520, down: true },
  },
  {
    double: true, id: 'd_frontback', title: 'FRONT & BACK',
    beats: [
      { d: 0.08, pp: 'elbow', pt: [0.2, 0.48], ep: 'hurt', f: 9, r: 0.3, ep2: 'idle', f2: -10, name: 'SURROUNDED', hit: { dmg: 3, fx: 'elbow', word: 'ELBOW!' } },
      { d: 0.1, pp: 'spinback', pt: [0.3, 0.5], ep: 'hurt', f: 9, ep2: 'hurt', f2: -9, r2: -0.4, hit2: { dmg: 4, fx: 'knee', word: 'BACK KICK!' } },
      { d: 0.08, pp: 'hook', pt: [0.2, 0.48], ep: 'stagger', f: 9, r: -0.4, ep2: 'stagger', f2: -9, hit: { dmg: 3, fx: 'punch', word: 'HOOK!' } },
      { d: 0.2, pp: 'dragontail', pt: [0.2, 0.7], ep: 'fly', f: 10, z: 8, r: 1.4, ep2: 'fly', f2: -10, z2: 8, r2: -1.4, hit: { dmg: 8, fx: 'sweep', word: 'TORNADO SWEEP!', stop: 0.12, shake: 1, final: true }, hit2: { dmg: 8, fx: 'sweep', word: 'BOTH!', final: true } },
    ],
    release: { kb: 380, down: true },
  },
  {
    weapon: 'nunchaku', double: true, id: 'nd_storm', title: 'TWIN DRAGON STORM',
    beats: [
      { d: 0.1, pp: 'n_lash', pt: [0.2, 0.5], ep: 'hurt', f: 12, r: 0.4, ep2: 'idle', f2: -12, name: 'WATAAA!', hit: { dmg: 3, fx: 'head', word: 'CRACK!' } },
      { d: 0.1, pp: 'n_cross', pt: [0.2, 0.5], ep: 'hurt', f: 12, ep2: 'hurt', f2: -12, r2: -0.4, spin: 24, hit2: { dmg: 3, fx: 'head', word: 'CRACK!' } },
      { d: 0.12, pp: 'n_helicopter', pt: [0.2, 0.6], ep: 'hurt', f: 12, r: -0.3, ep2: 'hurt', f2: -12, r2: 0.3, spin: 30, hit: { dmg: 3, fx: 'head', word: 'WHAP!' }, hit2: { dmg: 3, fx: 'head', word: 'WHAP!' } },
      { d: 0.22, pp: 'n_tornado', pt: [0.2, 0.7], ep: 'launched', f: 13, z: 10, r: -0.9, ep2: 'launched', f2: -13, z2: 10, r2: 0.9, spin: 34, hit: { dmg: 8, fx: 'slam', word: 'TWIN DRAGON!', stop: 0.13, shake: 1.1, final: true }, hit2: { dmg: 8, fx: 'slam', word: 'BOTH!', final: true } },
    ],
    release: { kb: 460, down: true },
  },
  {
    weapon: 'nunchaku', double: true, id: 'nd_clothesline', title: 'CHAIN CLOTHESLINE',
    beats: [
      { d: 0.12, pp: 'n_garrote', pt: [0, 0.5], ep: 'stagger', f: 9, s: -7, ep2: 'stagger', f2: 9, s2: 7, name: 'CHAIN BOTH NECKS!' },
      { d: 0.12, pp: 'n_garrote', pt: [0.5, 1], ep: 'hurt', f: 8, s: -2.5, r: 0.6, ep2: 'hurt', f2: 8, s2: 2.5, r2: -0.6, hit: { dmg: 5, fx: 'head', word: 'CLASH!', stop: 0.1, shake: 0.7 }, hit2: { dmg: 5, fx: 'head', word: 'CLASH!' } },
      { d: 0.2, pp: 'n_overhead', pt: [0.15, 0.55], ep: 'down', f: 11, s: -4, ep2: 'down', f2: 11, s2: 4, hit: { dmg: 8, fx: 'slam', word: 'DOUBLE DROP!', stop: 0.13, shake: 1.1, final: true }, hit2: { dmg: 8, fx: 'slam', word: 'BOTH!', final: true } },
    ],
    release: { kb: 30, down: true },
  },
  // ======================= BASEBALL BAT (street freestyle) =======================
  {
    weapon: 'bat', id: 'b_derby', title: 'HOME RUN DERBY',
    beats: [
      { d: 0.12, pp: 'b_upper', pt: [0.1, 0.55], ep: 'launched', f: 11, z: 10, r: -0.4, name: 'BATTER UP!', hit: { dmg: 3, fx: 'bat', word: 'POP UP!' } },
      { d: 0.1, pp: 'a_golf', pt: [0.2, 0.55], ep: 'fly', f: 11, z: 20, r: -1.2, hit: { dmg: 2, fx: 'bat', word: 'PEPPER!' } },
      { d: 0.1, pp: 'b_upper', pt: [0.2, 0.55], ep: 'fly', f: 11, z: 28, r: -2.4, hit: { dmg: 2, fx: 'bat', word: 'PEPPER!' } },
      { d: 0.14, pp: 'b_taunt', pt: [0, 0.5], ep: 'fly', f: 12, z: 16, r: -3.4, name: 'CALL THE SHOT', bat: 'shoulder' },
      { d: 0.2, pp: 'a_homerun', pt: [0.1, 0.62], ep: 'fly', f: 11, z: 7, r: -4.2, hit: { dmg: 10, fx: 'bat', word: 'HOME RUN!', stop: 0.15, shake: 1.2, final: true } },
    ],
    release: { kb: 900, down: true, launch: 120 },
  },
  {
    weapon: 'bat', id: 'b_twirl', title: 'BAT TWIRL BEATDOWN',
    beats: [
      { d: 0.2, pp: 'b_taunt', pt: [0, 1], ep: 'idle', f: 13, name: 'TWIRL...', batSpin: 24 },
      { d: 0.08, pp: 'b_knob', pt: [0.2, 0.5], ep: 'hurt', f: 10, r: -0.3, hit: { dmg: 3, fx: 'head', word: 'KNOB!' } },
      { d: 0.08, pp: 'b_wild', pt: [0.2, 0.55], ep: 'hurt', f: 11, r: 0.45, hit: { dmg: 3, fx: 'bat', word: 'WHAM!' } },
      { d: 0.08, pp: 'b_wildback', pt: [0.2, 0.55], ep: 'hurt', f: 11, r: -0.45, hit: { dmg: 3, fx: 'bat', word: 'BONK!' } },
      { d: 0.12, pp: 'a_spin', pt: [0.2, 0.6], ep: 'stagger', f: 12, r: 0.3, hit: { dmg: 3, fx: 'bat', word: '360!' } },
      { d: 0.2, pp: 'b_smash', pt: [0.1, 0.6], ep: 'down', f: 12, hit: { dmg: 9, fx: 'slam', word: 'OVERHEAD SMASH!', stop: 0.14, shake: 1.1, final: true } },
    ],
    release: { kb: 30, down: true },
  },
  {
    weapon: 'bat', id: 'b_curb', title: 'CURB STOMP SPECIAL',
    beats: [
      { d: 0.14, pp: 'a_golf', pt: [0.15, 0.55], ep: 'fly', f: 11, z: 10, r: 1.6, name: 'LOW SWEEP', hit: { dmg: 3, fx: 'sweep', word: 'TAKE OUT THE KNEES!', shake: 0.4 } },
      { d: 0.08, pp: 'b_wild', pt: [0.6, 0.8], ep: 'down', f: 12, z: 0, r: 0, snap: true, hit: { dmg: 3, fx: 'slam', word: 'BAM!', shake: 0.6 } },
      { d: 0.1, pp: 'b_pound', pt: [0.15, 0.55], ep: 'down', f: 10, step: 2, hit: { dmg: 3, fx: 'slam', word: 'CURB!' } },
      { d: 0.1, pp: 'b_pound', pt: [0.15, 0.55], ep: 'down', f: 10, hit: { dmg: 3, fx: 'slam', word: 'CURB!!' } },
      { d: 0.14, pp: 'b_taunt', pt: [0, 0.6], ep: 'down', f: 10, name: 'WHO NEXT?', bat: 'shoulder' },
      { d: 0.22, pp: 'b_smash', pt: [0.1, 0.62], ep: 'down', f: 10, pz: 8, hit: { dmg: 9, fx: 'slam', word: 'GROUND RULE!', stop: 0.14, shake: 1.2, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  {
    weapon: 'bat', id: 'b_choke', title: 'BAT CHOKE SLAM',
    beats: [
      { d: 0.14, pp: 'dash', pt: [0, 0], ep: 'hurt', f: -10, step: 20, name: 'GET BEHIND' },
      { d: 0.03, pp: 'grab', pt: [0, 0.4], ep: 'stagger', f: 7, turn: true, away: true, snap: true, bat: 'across' },
      { d: 0.2, pp: 'grab', pt: [0.4, 1], ep: 'stagger', f: 5, r: -0.6, away: true, name: 'BAT CHOKE!', bat: 'across' },
      { d: 0.12, pp: 'grab', pt: [1, 1], ep: 'hurt', f: 5, r: -0.9, away: true, bat: 'across', hit: { dmg: 4, fx: 'snap', word: 'SQUEEZE!', stop: 0.08 } },
      { d: 0.14, pp: 'spinback', pt: [0.2, 0.42], ep: 'fly', f: 0, s: 2, z: 18, r: 1.6, away: true, bat: 'across' },
      { d: 0.12, pp: 'spinback', pt: [0.42, 0.6], ep: 'down', f: -12, z: 0, r: 3.1, hit: { dmg: 6, fx: 'slam', word: 'SUPLEX!', stop: 0.1, shake: 0.9 } },
      { d: 0.03, pp: 'a_idle', pt: [0, 0], ep: 'down', f: 12, r: 0, turn: true, snap: true },
      { d: 0.22, pp: 'b_pound', pt: [0.1, 0.6], ep: 'down', f: 11, hit: { dmg: 9, fx: 'slam', word: 'BATTER DOWN!', stop: 0.14, shake: 1.1, final: true } },
    ],
    release: { kb: 20, down: true },
  },
  {
    weapon: 'bat', id: 'b_counter', title: 'BAT COUNTER CHAIN',
    beats: [
      { d: 0.12, pp: 'a_idle', pt: [0, 0], ep: 'punch', et: [0.1, 0.55], f: 12, name: 'HE ATTACKS' },
      { d: 0.1, pp: 'dash', pt: [0, 0], ep: 'punch', et: [0.55, 0.8], f: 11, s: -7, name: 'SLIP!' },
      { d: 0.1, pp: 'b_knob', pt: [0.2, 0.5], ep: 'hurt', f: 10, s: -3, hit: { dmg: 3, fx: 'head', word: 'COUNTER!' } },
      { d: 0.14, pp: 'a_bunt', pt: [0.2, 0.5], ep: 'kick', et: [0.1, 0.6], f: 11, s: -1, name: 'HE COUNTERS', hit: { dmg: 0, fx: 'block', word: 'BAT BLOCK!' } },
      { d: 0.12, pp: 'b_upper', pt: [0.2, 0.55], ep: 'launched', f: 11, z: 12, r: -0.5, hit: { dmg: 4, fx: 'bat', word: 'RE-COUNTER!', stop: 0.07 } },
      { d: 0.2, pp: 'a_spin', pt: [0.2, 0.7], ep: 'fly', f: 10, z: 18, r: -1.6, pz: 12, acro: true, hit: { dmg: 4, fx: 'bat', word: 'AIR 360!' } },
      { d: 0.22, pp: 'a_homerun', pt: [0.1, 0.62], ep: 'fly', f: 11, z: 6, r: -2.6, hit: { dmg: 10, fx: 'bat', word: 'WALK-OFF HOMER!', stop: 0.15, shake: 1.2, final: true } },
    ],
    release: { kb: 880, down: true, launch: 100 },
  },
  {
    weapon: 'bat', id: 'b_disarm', title: 'BAT ARM BREAKER',
    beats: [
      { d: 0.1, pp: 'a_bunt', pt: [0.2, 0.5], ep: 'punch', et: [0.5, 0.5], f: 10, name: 'CATCH THE ARM' },
      { d: 0.1, pp: 'b_knob', pt: [0.2, 0.5], ep: 'hurt', f: 9, s: 3, r: 0.4, hit: { dmg: 4, fx: 'snap', word: 'SNAP!', stop: 0.08, shake: 0.4 } },
      { d: 0.1, pp: 'b_wildback', pt: [0.2, 0.55], ep: 'hurt', f: 11, r: -0.4, hit: { dmg: 3, fx: 'bat', word: 'SMACK!' } },
      { d: 0.2, pp: 'a_homerun', pt: [0.1, 0.62], ep: 'launched', f: 12, z: 5, r: -0.6, hit: { dmg: 9, fx: 'bat', word: 'GRAND SLAM!', stop: 0.14, shake: 1.1, final: true } },
    ],
    release: { kb: 820, down: true },
  },
  {
    weapon: 'bat', double: true, id: 'bd_double', title: 'DOUBLE PLAY',
    beats: [
      { d: 0.1, pp: 'b_wild', pt: [0.2, 0.55], ep: 'hurt', f: 11, r: 0.4, ep2: 'idle', f2: -11, name: 'DOUBLE PLAY!', hit: { dmg: 3, fx: 'bat', word: 'WHAM!' } },
      { d: 0.1, pp: 'b_wildback', pt: [0.2, 0.55], ep: 'hurt', f: 11, ep2: 'hurt', f2: -11, r2: -0.4, hit2: { dmg: 3, fx: 'bat', word: 'BONK!' } },
      { d: 0.24, pp: 'a_spin', pt: [0.15, 0.8], ep: 'launched', f: 13, z: 8, r: -0.8, ep2: 'launched', f2: -13, z2: 8, r2: 0.8, hit: { dmg: 9, fx: 'bat', word: 'TWIN HOMER!', stop: 0.14, shake: 1.2, final: true }, hit2: { dmg: 9, fx: 'bat', word: 'BOTH!', final: true } },
    ],
    release: { kb: 700, down: true },
  },
  {
    weapon: 'bat', double: true, id: 'bd_clash', title: 'BASH BROTHERS',
    beats: [
      { d: 0.12, pp: 'b_wild', pt: [0.1, 0.55], ep: 'hurt', f: 9, s: -7, r: 0.5, ep2: 'stagger', f2: 9, s2: 7, name: 'LINE THEM UP', hit: { dmg: 4, fx: 'bat', word: 'WHACK!' } },
      { d: 0.1, pp: 'b_wild', pt: [0.55, 0.8], ep: 'fly', f: 9, s: 4, z: 6, r: 1.4, ep2: 'hurt', f2: 9, s2: 7, r2: -0.5, hit2: { dmg: 5, fx: 'head', word: 'COLLIDE!', stop: 0.1, shake: 0.7 } },
      { d: 0.2, pp: 'b_smash', pt: [0.1, 0.62], ep: 'down', f: 11, s: 3, z: 0, r: 0, ep2: 'down', f2: 11, s2: 8, hit: { dmg: 8, fx: 'slam', word: 'BASH!', stop: 0.14, shake: 1.1, final: true }, hit2: { dmg: 8, fx: 'slam', word: 'BOTH!', final: true } },
    ],
    release: { kb: 30, down: true },
  },
];
/** acrobatic link beats: flip toward the next victim (step is set at runtime to the real distance) */
export const LINK_FLIPS: { pp: Pose; pt: [number, number]; name: string }[] = [
  { pp: 'monkeyflip', pt: [0.15, 0.62], name: 'FLIP!' },
  { pp: 'flying', pt: [0.15, 0.5], name: 'FLYING LINK!' },
  { pp: 'spin', pt: [0.1, 0.9], name: 'CORKSCREW!' },
  { pp: 'cranekick', pt: [0.2, 0.6], name: 'CRANE HOP!' },
];
