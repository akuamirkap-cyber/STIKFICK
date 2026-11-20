import { SCYTHE_COLOR, SCYTHE_LIGHT, type ScytheMove } from './scythe';
import { clamp } from './rng';
import { solvePose, type StickOpts } from './stick';
import type { Vec } from './types';

/** Menggambar sabit Grim Reaper di tangan depan: gagang panjang + bilah sabit melengkung. */
export function drawScythe(
  ctx: CanvasRenderingContext2D,
  hand: Vec,
  angle: number,
  glow: number,
  scale = 1,
  time = 0,
) {
  const tip = { x: hand.x + Math.cos(angle) * 13.5 * scale, y: hand.y + Math.sin(angle) * 13.5 * scale };
  const back = { x: hand.x - Math.cos(angle) * 4.5 * scale, y: hand.y - Math.sin(angle) * 4.5 * scale };
  ctx.save();
  // gagang kayu gelap
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#120d18';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath(); ctx.moveTo(back.x, back.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  ctx.strokeStyle = '#5b4636';
  ctx.lineWidth = .9 * scale;
  ctx.beginPath(); ctx.moveTo(back.x, back.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  // bilah sabit: busur besar dari ujung gagang, melengkung ke belakang seperti sabit bulan
  const flare = Math.sin(time * 3.1) * .06;
  const a0 = angle + Math.PI * .72 + flare, a1 = angle - Math.PI * .42 + flare;
  const r = 10.6 * scale;
  const cx = tip.x, cy = tip.y;
  const p0 = { x: cx + Math.cos(a0) * r, y: cy + Math.sin(a0) * r };
  const p1 = { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r };
  const mid = { x: cx + Math.cos((a0 + a1) / 2) * r * 1.22, y: cy + Math.sin((a0 + a1) / 2) * r * 1.22 };
  const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  grad.addColorStop(0, '#8f7bd8');
  grad.addColorStop(.55, '#e9dcff');
  grad.addColorStop(1, '#ffffff');
  ctx.strokeStyle = '#171022';
  ctx.lineWidth = 3.1 * scale;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(mid.x, mid.y, p1.x, p1.y); ctx.stroke();
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.9 * scale;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(mid.x, mid.y, p1.x, p1.y); ctx.stroke();
  // taji runcing di ujung bilah
  const spike = { x: p1.x + Math.cos(a1) * 3.6 * scale, y: p1.y + Math.sin(a1) * 3.6 * scale };
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = .7 * scale;
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(spike.x, spike.y); ctx.stroke();
  if (glow > 0) {
    ctx.globalAlpha = clamp(glow, 0, 1) * .8;
    ctx.strokeStyle = SCYTHE_COLOR.grim;
    ctx.lineWidth = .5 * scale;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(mid.x, mid.y, p1.x, p1.y); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** Jejak ayunan sabit: pita gradient sepanjang busur bilah saat aktif. */
export function drawScytheRibbon(ctx: CanvasRenderingContext2D, opts: StickOpts, move: ScytheMove, reduced = false) {
  if (opts.t < 0.26 || opts.t > 0.78) return;
  const color = SCYTHE_COLOR[move.scythe.school];
  const light = SCYTHE_LIGHT[move.scythe.school];
  const fade = clamp((opts.t - 0.24) / 0.08, 0, 1) * clamp((0.80 - opts.t) / 0.12, 0, 1) * (reduced ? .6 : 1);
  const rig = solvePose(opts);
  const hand = opts.footLead === -1 ? rig.bhand : rig.fhand;
  const angle = opts.aim;
  const r = move.slash?.r ?? 19;
  const from = (move.slash?.from ?? -1.2) * (opts.facing < 0 ? -1 : 1);
  const to = (move.slash?.to ?? 1.1) * (opts.facing < 0 ? -1 : 1);
  const samples = reduced ? 9 : 16;
  const path: Vec[] = [];
  for (let i = 0; i < samples; i++) {
    const a = angle + from + (to - from) * (i / (samples - 1));
    path.push({ x: opts.x + hand.x + Math.cos(a) * r * opts.scale, y: opts.y + hand.y - (opts.z ?? 0) + Math.sin(a) * r * opts.scale * .8 });
  }
  ctx.save();
  ctx.globalAlpha = fade * .8;
  const grad = ctx.createLinearGradient(path[0].x, path[0].y, path[path.length - 1].x, path[path.length - 1].y);
  grad.addColorStop(0, `${color}00`);
  grad.addColorStop(.5, color);
  grad.addColorStop(1, light);
  ctx.strokeStyle = grad;
  ctx.lineWidth = (move.finisher ? 1.7 : 1.05) * opts.scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  ctx.lineTo(path[path.length - 1].x, path[path.length - 1].y);
  ctx.stroke();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = light;
  ctx.lineWidth = .4 * opts.scale;
  ctx.stroke();
  ctx.restore();
}
