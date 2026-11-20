import { clamp, lerp } from './rng';
import type { Pose, Vec } from './types';
import type { Skeleton, StickOpts } from './stick';

type Frame = readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number];
type Beat = readonly [number, Frame];

// Hip, shoulder, head, lead and rear ankles, then the two hands gripping the shaft.
// Tangan selalu mengunci posisi gagang: depan memegang ujung, belakang di pangkal.
const guard: Frame = [-0.3,-4.55, -0.75,-8.15, -0.55,-11.2, 3,0, -3.1,0, 3.6,-6.3, 0.7,-5.1];
const airReady: Frame = [0,-5.4, 0.25,-9.3, 0.65,-12.2, 3.3,-2.0, -2.6,-1.4, 3,-8.4, -2.8,-7.0];

const poses: Partial<Record<Pose, readonly Beat[]>> = {
  scy_guard: [[0,guard],[1,guard]],
  // Harvest Slash: tarik bilah ke belakang bahu, lalu sapu melintang dengan kedua tangan searah.
  scy_reap1: [
    [0,guard],[.14,[-.2,-4.3, -1.6,-7.9, -1.9,-10.9, 2.2,-.8, -2.4,0, -2.9,-9.7, -.9,-7.6]],
    [.26,[-.6,-4.6, -2.6,-7.7, -3.2,-10.6, 1.6,-4.9, -1.2,0, 2.2,-8.9, -.4,-7.0]],
    [.345,[.8,-4.9, -2.9,-7.1, -3.9,-10.0, 11.4,-6.3, -.7,0, 6.4,-6.6, 1.6,-5.2]],
    [.45,[1.4,-4.9, -2.5,-7.0, -3.5,-9.9, 12.6,-6.5, -.6,0, 7.4,-6.3, 2.6,-5.0]],
    [.58,[.5,-4.7, -1.2,-7.9, -1.5,-10.9, 3.4,-4.6, -1.0,0, 3.0,-7.4, -.6,-5.8]], [.80,guard],[1,guard],
  ],
  // Soil Turn: backhand berlawanan, bahu dibuka ke belakang lalu bilah menyapu dari bawah ke atas.
  scy_reap2: [
    [0,guard],[.14,[-.2,-4.3, 1.2,-7.8, 1.5,-10.8, 1.8,-.6, -2.2,0, -3.4,-7.2, 2.4,-5.6]],
    [.26,[-.6,-4.6, 2.4,-7.5, 2.9,-10.5, .8,-4.8, -1.4,0, -4.4,-8.4, 1.2,-6.4]],
    [.345,[.8,-4.9, 3.0,-7.0, 3.8,-9.9, 11.2,-4.4, -.8,0, -5.2,-8.2, -1.2,-6.0]],
    [.45,[1.4,-4.9, 2.6,-6.9, 3.4,-9.8, 12.4,-4.6, -.6,0, -4.4,-8.0, -.4,-5.8]],
    [.58,[.5,-4.7, .6,-7.8, .9,-10.8, 3.2,-4.4, -1.0,0, 2.6,-7.6, -1.8,-5.6]], [.80,guard],[1,guard],
  ],
  // Death Spin: hop, badan berputar penuh (paper-doll), kedua tangan menjulur sejajar lantai.
  scy_spin: [
    [0,guard],[.13,[-.5,-3.4, -.4,-6.9, .1,-9.7, 2.4,0, -2.6,0, 3.2,-4.4, -1.6,-3.8]],
    [.24,[.2,-5.0, .4,-8.8, .8,-11.7, 2.2,-3.4, -2.4,-1.2, 9.8,-6.2, -8.6,-6.2]],
    [.36,[.6,-5.4, -.6,-9.2, -.8,-12.1, 1.8,-3.8, -1.8,-1.6, -9.4,-6.4, 9.2,-6.4]],
    [.48,[.4,-5.3, .6,-9.0, .8,-11.9, 2.0,-3.6, -2.0,-1.4, 9.6,-6.0, -8.8,-6.0]],
    [.60,[.5,-5.1, -.4,-8.9, -.6,-11.8, 1.8,-3.7, -1.8,-1.5, -9.2,-6.3, 8.9,-6.3]],
    [.72,[.3,-3.6, 1.2,-6.9, 1.7,-9.7, 2.2,-.8, -2.4,0, 4.0,-4.8, -2.2,-4.2]], [.86,guard],[1,guard],
  ],
  // Grave Digger: tongkat ditarik jauh ke belakang atas, lalu tebasan menukik ke depan-bawah sambil melompat.
  scy_grave: [
    [0,guard],[.16,[-.4,-3.6, -1.2,-7.2, -1.4,-10.2, 2.6,-.4, -2.8,0, -2.4,-10.8, -1.6,-9.4]],
    [.28,[-.8,-4.6, -2.2,-7.6, -2.6,-10.6, 1.8,-3.6, -1.6,0, -3.4,-12.6, -2.2,-11.0]],
    [.38,[.9,-5.2, -2.6,-7.4, -3.4,-10.2, 10.8,-5.2, -.8,0, 5.2,-8.4, .4,-7.0]],
    [.48,[1.5,-5.0, -2.2,-7.2, -3.0,-10.0, 12.2,-5.6, -.6,0, 6.4,-8.2, 1.4,-6.8]],
    [.62,[.6,-4.6, -.8,-7.6, -1.0,-10.6, 3.6,-4.2, -1.2,0, 2.6,-7.8, -1.0,-6.4]], [.82,guard],[1,guard],
  ],
  // Reaper's Halo: hop, tangan mengayun vertikal membentuk lingkaran di atas kepala.
  scy_halo: [
    [0,guard],[.14,[-.5,-3.5, -.2,-6.9, .3,-9.8, 2.2,-.2, -2.4,0, 2.6,-7.4, -1.8,-8.6]],
    [.26,[.2,-5.0, .2,-8.9, .6,-11.8, 1.6,-3.2, -2.2,-1.0, 6.2,-12.6, -2.4,-11.2]],
    [.38,[.6,-5.3, -.4,-9.1, -.6,-12.0, 1.4,-3.4, -1.8,-1.4, 11.4,-9.4, 3.2,-12.2]],
    [.50,[.5,-5.2, .4,-9.0, .6,-11.9, 1.6,-3.3, -2.0,-1.3, 8.4,-5.2, -4.2,-11.6]],
    [.62,[.3,-4.0, .8,-7.6, 1.2,-10.5, 1.8,-1.6, -2.4,0, 3.4,-6.8, -1.2,-9.4]], [.84,guard],[1,guard],
  ],
  // Soul Harvest: tolakan lari, badan membentuk horizontal, sapuan melayang menembus barisan.
  scy_soul: [
    [0,guard],[.14,[-.8,-3.0, .2,-6.0, .8,-8.8, 2.8,0, -3.2,0, 3.4,-3.4, -1.2,-4.6]],
    [.26,[-.2,-5.0, -.6,-8.8, -.2,-11.7, 3.0,-4.0, -2.2,-1.2, 10.6,-5.4, 4.2,-6.8]],
    [.38,[.6,-5.4, -1.8,-7.8, -2.6,-10.4, 11.6,-5.2, .2,-2.6, 11.8,-5.2, 5.4,-6.6]],
    [.50,[1.2,-5.3, -1.4,-7.6, -2.2,-10.1, 12.4,-5.0, .4,-2.4, 12.2,-5.0, 5.6,-6.4]],
    [.62,[.8,-4.6, .4,-7.6, .8,-10.5, 4.6,-3.4, -2.0,-1.2, 6.2,-6.4, 1.2,-7.2]], [.82,guard],[1,guard],
  ],
  // Windmill Reap: satu tangan menapak lantai, kaki membelah, sabit mengukur lingkaran rendah.
  scy_mill: [
    [0,guard],[.13,[-.6,-3.0, -.2,-6.2, .4,-9.0, 2.6,0, -2.8,0, 1.2,-2.6, -3.4,-1.4]],
    [.24,[.2,-4.6, -.6,-8.0, -.4,-10.9, 3.4,-4.6, -2.0,-1.6, 10.8,-3.2, .8,-2.2]],
    [.40,[.6,-4.9, -1.4,-8.4, -1.2,-11.3, 2.6,-5.4, -1.4,-2.2, -2.2,-2.0, 11.2,-4.4]],
    [.56,[.4,-4.7, .6,-8.2, .8,-11.1, 3.2,-5.0, -1.8,-2.0, -10.6,-4.0, -1.6,-2.4]],
    [.72,[.2,-4.2, 1.0,-7.4, 1.4,-10.3, 3.0,-4.2, -2.2,0, -6.4,-6.8, 2.4,-4.0]], [.88,guard],[1,guard],
  ],
  // Sky Reap: tebasan diagonal cepat di udara.
  scy_air: [
    [0,airReady],[.24,[-.4,-5.2, -.8,-9.0, -.6,-11.9, 2.2,-4.6, -2.4,-2.2, 6.4,-8.6, 1.4,-9.8]],
    [.36,[.4,-5.5, -1.6,-8.8, -1.8,-11.6, 1.6,-4.8, -2.2,-2.4, 11.2,-7.4, 4.6,-8.8]],
    [.46,[.8,-5.5, -1.8,-8.7, -2.0,-11.5, 1.4,-4.9, -2.0,-2.5, 11.8,-7.2, 5.0,-8.6]],
    [.62,[.2,-5.3, -.2,-9.1, 0,-12.0, 2.0,-4.4, -2.4,-2.0, 4.2,-8.8, 1.0,-10.0]], [1,airReady],
  ],
  // Death Dive: menyelam menukik, bilah di depan seperti paruh.
  scy_dive: [
    [0,airReady],[.22,[-.6,-5.6, -1.2,-9.4, -.8,-12.3, 1.4,-3.4, -3.0,-2.6, 5.8,-11.6, 2.2,-12.8]],
    [.34,[.6,-6.0, -2.0,-9.6, -1.6,-12.5, .4,-2.6, -3.6,-3.0, 10.6,-9.2, 5.2,-10.6]],
    [.46,[1.0,-6.0, -2.2,-9.4, -1.8,-12.3, .2,-2.5, -3.8,-3.1, 11.2,-9.0, 5.6,-10.4]],
    [.64,[.4,-5.6, -.6,-9.4, -.2,-12.3, 1.6,-3.6, -2.8,-2.8, 4.6,-10.6, 1.4,-11.8]], [1,airReady],
  ],
};

// Putaran badan sungguhan (badan menyempit, membelakangi layar, lalu kembali).
const spins: Partial<Record<Pose, readonly [number, number, number]>> = {
  scy_spin: [.20, .58, 2],
  scy_mill: [.20, .62, 1],
};

export function isScythePose(pose: string) { return pose.startsWith('scy_'); }

export function solveScythePose(o: StickOpts, tall = false): Skeleton {
  const f = o.facing < 0 ? -1 : 1;
  const s = (o.limbScale ?? 1) * o.scale;
  const aim = o.sideView ? 0 : Math.sin(o.aim);
  const frames = poses[o.pose];
  const t = clamp(o.t, 0, 1);
  const sway = Math.sin(o.time * 4.6);
  let step = 0;
  if (frames) while (step < frames.length - 2 && t > frames[step + 1][0]) step++;
  const [a, first] = frames?.[step] ?? [0, guard];
  const [b, last] = frames?.[step + 1] ?? [1, guard];
  const u = clamp((t - a) / (b - a), 0, 1);
  const smooth = u * u * (3 - 2 * u), ahead = frames?.[step + 2], behind = frames?.[step - 1];
  const interpolate = (i: number) => {
    const v0 = first[i], v1 = last[i], d = v1 - v0;
    if (Math.abs(d) < .001 || !frames) return lerp(v0, v1, smooth);
    const safeSlope = (slope: number) => Math.sign(slope) === Math.sign(d) ? Math.sign(d) * Math.min(Math.abs(slope), 1.6 * Math.abs(d)) : 0;
    const m0 = behind ? safeSlope((v1 - behind[1][i]) * (b - a) / (b - behind[0])) : 0;
    const m1 = ahead ? safeSlope((ahead[1][i] - v0) * (b - a) / (ahead[0] - a)) : 0;
    return lerp(v0, v1, smooth) + u * (1 - u) * ((1 - u) * m0 - u * m1);
  };
  const spin = spins[o.pose];
  const turn = spin && t > spin[0] && t < spin[1] ? Math.cos((t - spin[0]) / (spin[1] - spin[0]) * Math.PI * 2 * spin[2]) : 1;
  const pivot = turn !== 1 ? interpolate(0) : 0;
  const joint = (index: number): Vec => {
    let x = interpolate(index), y = interpolate(index + 1);
    if (!frames) {
      if (index <= 4) { x += sway * 0.41; y += Math.cos(o.time * 4.6) * 0.33; }
    }
    if (turn !== 1 && index !== 0) x = pivot + (x - pivot) * turn;
    const squash = 1 + ((o.squash ?? 1) - 1) * .48;
    return { x: x * s * f * (tall ? 1.07 : 1) * (1 + (1 - squash) * .32), y: (y + x * aim * 0.25) * s * (tall ? 1.27 : 1) * squash };
  };
  const hip = joint(0), neck = joint(2), head = joint(4), ffoot = joint(6), bfoot = joint(8), fhand = joint(10), bhand = joint(12);
  const bend = (a: Vec, b: Vec, len: number, dir: number): Vec => {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(.001, Math.hypot(dx, dy));
    const arch = Math.sqrt(Math.max(0, len * len / 4 - d * d / 4)) * dir * f;
    return { x: (a.x + b.x) / 2 - dy / d * arch, y: (a.y + b.y) / 2 + dx / d * arch };
  };
  return {
    hip, neck, head, ffoot, bfoot, fhand, bhand,
    fknee: bend(hip, ffoot, 6.9 * s, -1), bknee: bend(hip, bfoot, 6.7 * s, -1),
    felbow: bend(neck, fhand, 5.1 * s, 1), belbow: bend(neck, bhand, 4.9 * s, -1), trail: null,
  };
}
