import { VIEW_W, VIEW_H } from './constants';
import type { Ctx } from './pixel';

/** Efek kedalaman halus untuk mode non-pixel: bayangan gradient + cahaya radial + vignette lembut. */
export function drawSoftShadows(g: any, ctx: Ctx) {
  const p = g.player;
  const list: { x: number; y: number; r: number; a: number }[] = [{ x: p.x, y: p.y + 1, r: 11, a: 0.34 }];
  for (const e of g.enemies) if (!e.dead && e.spawnT <= 0) list.push({ x: e.x, y: e.y + 1, r: 10 * (e.scale ?? 1), a: 0.28 });
  for (const pr of g.props) if (!pr.dead) list.push({ x: pr.x, y: pr.y + 2, r: 8, a: 0.2 });
  ctx.save();
  for (const s of list) {
    const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    grd.addColorStop(0, `rgba(0,0,0,${s.a})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawDepthLight(g: any, ctx: Ctx, sxOf: (x: number) => number, syOf: (y: number) => number) {
  const p = g.player;
  const px = sxOf(p.x), py = syOf(p.y - 10);
  ctx.save();
  const light = ctx.createRadialGradient(px, py, 12, px, py, VIEW_W * 0.55);
  light.addColorStop(0, 'rgba(150,205,255,0.11)');
  light.addColorStop(0.45, 'rgba(80,130,200,0.045)');
  light.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = light; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.2, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const floor = ctx.createLinearGradient(0, VIEW_H * 0.55, 0, VIEW_H);
  floor.addColorStop(0, 'rgba(255,255,255,0)');
  floor.addColorStop(1, 'rgba(130,170,220,0.045)');
  ctx.fillStyle = floor; ctx.fillRect(0, VIEW_H * 0.55, VIEW_W, VIEW_H * 0.45);
  ctx.restore();
}
