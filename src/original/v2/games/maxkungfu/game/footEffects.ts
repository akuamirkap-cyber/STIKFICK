import { FOOT_SCHOOLS, footLeg, type FootMove, type FootSchool } from './footwork';
import { clamp } from './rng';
import { solvePose, type StickOpts } from './stick';
import type { Vec } from './types';

export function drawFootRibbon(ctx: CanvasRenderingContext2D, opts: StickOpts, move: FootMove, project: (point: Vec) => Vec = point => point, reduced = false) {
  if (opts.t < 0.31 || opts.t > 0.74) return;
  const fade = clamp((opts.t - 0.29) / 0.09, 0, 1) * clamp((0.75 - opts.t) / 0.12, 0, 1) * (reduced ? .64 : 1);
  const color = FOOT_SCHOOLS[move.foot.school];
  const split = move.foot.beats;
  const v2 = !!move.foot.v2;
  // Foot Mode V2 (Hunting Hawk): jejak mengikuti kaki dari tendangan yang sedang berjalan.
  let strike = 0;
  if (v2 && split) split.forEach((beat, index) => { if ((opts.t - .3) / .3 >= beat.from - .1) strike = index; });
  const leg = v2 && split ? split[strike].leg : split ? opts.t < .458 ? 'ffoot' : 'bfoot' : move.limb === 'bfoot' ? 'bfoot' : 'ffoot';
  const feet = move.foot.both ? ['bfoot', 'ffoot'] as const : [footLeg(leg, opts.footLead ?? 1)] as const;
  const paths = feet.map(() => [] as Vec[]);
  const samples = reduced ? 7 : 12;
  for (let i = 0; i < samples; i++) {
    const start = v2 && split ? .3 + .3 * Math.max(0, split[strike].from - .1) : split && leg === 'bfoot' ? .453 : .19;
    const rig = solvePose({ ...opts, footLink: undefined, t: Math.max(start, opts.t - (1 - i / (samples - 1)) * 0.158) });
    paths.forEach((path, index) => {
      const foot = project(rig[feet[index]]);
      path.push({ x: opts.x + foot.x, y: opts.y - (opts.z ?? 0) + foot.y });
    });
  }
  ctx.save();
  for (const path of paths) {
    const len = path.length - 1;
    if (path.reduce((length, p, i) => i ? length + Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y) : 0, 0) < .55) continue;
    const outside: Vec[] = [], inside: Vec[] = [];
    for (let i = 0; i <= len; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(len, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(0.08, Math.hypot(dx, dy));
      const width = (move.finisher ? 1.96 : v2 ? 1.5 : move.foot.both ? 1.05 : 1.15) * opts.scale * Math.sin(Math.PI * i / (len + 0.7));
      const x = path[i].x, y = path[i].y;
      inside.push({ x: x - dy / d * width * 0.65, y: y + dx / d * width * 0.65 });
      outside.push({ x: x + dy / d * width, y: y - dx / d * width });
    }
    const a = path[0], b = path[len];
    const gradient = ctx.createLinearGradient(a.x, a.y, b.x + .05, b.y);
    gradient.addColorStop(0, `${color.color}00`);
    gradient.addColorStop(.44, `${color.color}6c`);
    gradient.addColorStop(1, move.foot.school === 'ember' ? '#ffc66f' : split && leg === 'ffoot' ? '#91f7cf' : color.color);
    ctx.globalAlpha = fade * .82;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(outside[0].x, outside[0].y);
    curve(ctx, outside);
    const reverse = inside.reverse();
    ctx.lineTo(reverse[0].x, reverse[0].y);
    curve(ctx, reverse);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = fade * .95;
    ctx.strokeStyle = color.light;
    ctx.lineWidth = move.finisher ? .47 : .28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(path[3].x, path[3].y);
    curve(ctx, path.slice(3));
    ctx.stroke();
    if (v2 && !reduced && len >= 6) {
      // Foot Mode V2: tepi neon putih + percik berlian di sepanjang busur.
      ctx.globalAlpha = fade * .9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = .17;
      ctx.beginPath();
      ctx.moveTo(outside[2].x, outside[2].y);
      curve(ctx, outside.slice(2));
      ctx.stroke();
      ctx.fillStyle = color.light;
      for (let i = 3; i <= len; i += 3) {
        const spark = outside[i], size = .34 + i / len * .56;
        ctx.globalAlpha = fade * i / len;
        ctx.save(); ctx.translate(spark.x, spark.y); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }
    if (move.foot.school === 'ember' && !reduced) {
      ctx.fillStyle = '#ffc66f';
      for (let i = 1; i < len; i += 2) {
        const p = outside[i];
        const o = (len - i) * .21;
        ctx.globalAlpha = fade * i / len;
        ctx.fillRect(p.x - o * opts.facing, p.y + (i % 3 - 1) * o, .32 + i / len * .38, .46);
      }
    }
  }
  ctx.restore();
}

function curve(ctx: CanvasRenderingContext2D, points: Vec[]) {
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  const end = points[points.length - 1];
  ctx.lineTo(end.x, end.y);
}

export function drawFootImpact(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, age: number, color: string, strong: boolean, direction = 0, school?: FootSchool, reduced = false) {
  const duration = strong ? .29 : .20;
  if (age < 0 || age > duration) return;
  const u = age / duration, ease = 1 - (1 - u) ** 2, r = (.65 + ease * (strong ? 5.7 : 3.4)) * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(direction);
  ctx.globalAlpha = (1 - u) * .82;
  ctx.fillStyle = color;
  const n = reduced ? 4 : strong ? 10 : 6;
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.rotate((i / (n - 1) - .5) * (strong ? 4.3 : 3.5));
    const speed = .7 + i % 4 * .14;
    ctx.beginPath(); ctx.moveTo(r * speed * .56, 0);
    ctx.lineTo(r * speed + (1.7 - u * .8) * scale, -.04 * scale);
    ctx.lineTo(r * speed, .26 * scale); ctx.lineTo(r * speed * .58, .11 * scale);
    ctx.fill(); ctx.restore();
  }
  if (school === 'flamingo' && strong && !reduced) {
    const wake = (1 - u) * .60, pivot = r * .4;
    ctx.strokeStyle = '#ffe8bc';
    for (const s of [-1, 1]) {
      ctx.globalAlpha = wake;
      ctx.lineWidth = (.31 + .17 * (1 - u)) * scale;
      ctx.beginPath(); ctx.moveTo(-r * .54, s * pivot * .32);
      ctx.quadraticCurveTo(r * .32, s * r * .94, r * (1.65 + u), s * r * .57);
      ctx.stroke();
    }
  }
  if (strong || school === 'capoeira') {
    ctx.globalAlpha = (1 - u) * (strong ? .65 : .37);
    ctx.strokeStyle = color; ctx.lineWidth = (.20 + (1 - u) * .2) * scale;
    ctx.beginPath(); ctx.ellipse(0, 0, r * .72, r * .83, 0, 0, 2 * Math.PI); ctx.stroke();
  }
  if ((school === 'chagi' || school === 'hwarang' || school === 'backlash' || school === 'hawk' || school === 'lee') && !reduced) {
    // Foot Mode V2: tebasan silang putih + bingkai berlian warna jurus.
    const reach = r * (strong ? 1.5 : 1.15);
    ctx.lineCap = 'round';
    ctx.globalAlpha = (1 - u) * .9;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = (.1 + .34 * (1 - u)) * scale;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(-reach * .7, -s * reach * .5); ctx.lineTo(reach * .9, s * reach * .5); ctx.stroke();
    }
    ctx.globalAlpha = (1 - u) * .75;
    ctx.strokeStyle = color; ctx.lineWidth = .22 * scale;
    ctx.beginPath(); ctx.moveTo(reach, 0); ctx.lineTo(0, reach * .8); ctx.lineTo(-reach, 0); ctx.lineTo(0, -reach * .8); ctx.closePath(); ctx.stroke();
  }
  ctx.globalAlpha = (1 - u) * .87;
  ctx.fillStyle = '#fff9e0'; ctx.rotate(Math.PI / 4);
  const dot = (strong ? 1.35 : .78) * (1 - u) * scale;
  ctx.fillRect(-dot / 2, -dot / 2, dot, dot);
  ctx.restore();
}

export function drawFootPivot(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, t: number, color: string, reduced = false) {
  if (t < .12 || t > .98) return;
  const fade = Math.sin(Math.PI * t) * (reduced ? .35 : .73);
  const reach = (2.2 + t * 5.1) * scale;
  ctx.save(); ctx.translate(x, y);
  ctx.globalAlpha = fade;
  ctx.strokeStyle = color; ctx.lineWidth = .27 * scale;
  ctx.beginPath(); ctx.ellipse(0, 0, reach, reach * .24, 0, t * 3, 4.05 + t * 3); ctx.stroke();
  if (!reduced) {
    ctx.strokeStyle = '#ffe0a8'; ctx.lineWidth = .16 * scale;
    ctx.beginPath(); ctx.ellipse(0, 0, reach * .73, reach * .16, 0, -t * 2, 2.2 - t * 2); ctx.stroke();
  }
  ctx.restore();
}