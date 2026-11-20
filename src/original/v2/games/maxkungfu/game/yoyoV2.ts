import { pcircle, pline, prect, pring, px, type Ctx } from './pixel';
import { clamp } from './rng';
import type { Vec } from './types';
import { DEFAULT_YOYO_SKIN, getYoyoSkin, type YoyoSkin, type YoyoSkinId } from './yoyoSkins';

type Phase = 'windup' | 'active' | 'recover' | 'none';
type TrailPoint = Vec & { life: number };
export const YOYO_TRAIL_LIFE = 0.32;
const MAX_TRAIL_POINTS = 24;

export function drawYoyoSprite(ctx: Ctx, x: number, y: number, skin: YoyoSkin, spin: number, active: boolean, flash = false) {
  const alpha = ctx.globalAlpha;
  const VS = 0.72;
  ctx.save();
  ctx.translate(x, y); ctx.scale(VS, VS); ctx.translate(-x, -y);
  const body = flash ? skin.highlight : skin.body;
  ctx.globalAlpha = alpha * (active ? 0.12 : 0.05);
  pcircle(ctx, x, y, 7, skin.aura);
  ctx.globalAlpha = alpha * (active ? 0.5 : 0.25);
  pring(ctx, x, y, active ? 6.8 : 5.8, skin.aura, 1);
  ctx.globalAlpha = alpha;
  if (skin.shape === 'round') {
    pcircle(ctx, x, y, 5.1, skin.rim);
    pcircle(ctx, x, y, 4.2, body);
    pring(ctx, x, y, 3.5, skin.trim, 1);
    pline(ctx, x - 2, y - 2, x + 1, y - 2, skin.highlight, 1);
  } else if (skin.shape === 'butterfly') {
    pcircle(ctx, x - 2.1, y, 3.7, skin.rim); pcircle(ctx, x + 2.1, y, 3.7, skin.rim);
    pcircle(ctx, x - 2.1, y, 2.9, body); pcircle(ctx, x + 2.1, y, 2.9, body);
    pline(ctx, x - 4, y - 2, x - 1, y - 3, skin.trim, 1);
    pline(ctx, x + 1, y - 3, x + 4, y - 2, skin.trim, 1);
    prect(ctx, x - 1, y - 3, 2, 6, skin.rim);
  } else if (skin.shape === 'flower') {
    const rotation = spin * 0.15 - Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const a = rotation + i * Math.PI * 2 / 5;
      const px = x + Math.cos(a) * 4.2, py = y + Math.sin(a) * 4.2;
      pline(ctx, x, y, px, py, skin.rim, 3);
      pcircle(ctx, px, py, 1.9, skin.rim);
    }
    for (let i = 0; i < 5; i++) {
      const a = rotation + i * Math.PI * 2 / 5;
      const px = x + Math.cos(a) * 4.2, py = y + Math.sin(a) * 4.2;
      pline(ctx, x, y, px, py, body, 1);
      pcircle(ctx, px, py, 1.2, body);
      pcircle(ctx, px, py, 0.5, skin.trim);
    }
  } else {
    for (let i = -5; i <= 5; i++) prect(ctx, x - (5 - Math.abs(i)), y + i, (5 - Math.abs(i)) * 2 + 1, 1, skin.rim);
    for (let i = -4; i <= 4; i++) prect(ctx, x - (4 - Math.abs(i)), y + i, (4 - Math.abs(i)) * 2 + 1, 1, body);
    pline(ctx, x - 3, y, x + 3, y, skin.trim, 1);
    pline(ctx, x, y - 3, x, y + 3, skin.trim, 1);
  }
  pcircle(ctx, x, y, 1.5, skin.core);
  px(ctx, x - 1, y - 1, skin.highlight);
  if (active) {
    px(ctx, x + Math.cos(spin) * 7, y + Math.sin(spin) * 7, skin.spark);
    px(ctx, x - Math.cos(spin) * 7, y - Math.sin(spin) * 7, skin.trailLight);
  }
  ctx.globalAlpha = alpha;
  ctx.restore();
}

export class YoyoV2 {
  position: Vec = { x: 0, y: 0 };
  hand: Vec = { x: 0, y: 0 };
  trail: TrailPoint[] = [];
  spin = 0;
  flash = 0;
  skinId: YoyoSkinId = DEFAULT_YOYO_SKIN;

  get skin() { return getYoyoSkin(this.skinId); }

  setSkin(id: YoyoSkinId) {
    if (this.skinId === id) return;
    this.skinId = id;
    this.trail = [];
    this.flash = 0;
  }

  reset(x: number, y: number) {
    this.position = { x, y };
    this.hand = { x, y };
    this.trail = [];
    this.flash = 0;
  }

  impact() { this.flash = 0.14; }

  update(dt: number, hand: Vec, origin: Vec, aim: number, moveId: string | null, phase: Phase, progress: number, reach: number) {
    this.hand = hand;
    this.spin += dt * (moveId === 'y_orbit' || moveId === 'y_storm' || moveId === 'y_flare' ? 17 : 12);
    this.flash = Math.max(0, this.flash - dt);
    for (const point of this.trail) point.life -= dt;
    this.trail = this.trail.filter((point) => point.life > 0);

    const forward = { x: Math.cos(aim), y: Math.sin(aim) };
    const side = { x: -forward.y, y: forward.x };
    let next: Vec;
    if (!moveId || phase === 'none') {
      const bob = Math.sin(this.spin * 0.6);
      next = { x: hand.x + forward.x * (10 + bob * 2) + side.x * 3, y: hand.y + forward.y * (10 + bob * 2) + side.y * 3 + 3 };
    } else if (moveId === 'y_orbit' || moveId === 'y_storm' || moveId === 'y_flare') {
      const power = phase === 'windup' ? clamp(progress / 0.3, 0, 1) : phase === 'recover' ? clamp((1 - progress) / 0.4, 0, 1) : 1;
      const wide = moveId === 'y_storm' || moveId === 'y_flare';
      const baseRange = wide ? 64 : 54;
      const radius = 10 + (wide ? 44 : 36) * power * clamp(reach / baseRange, 1, 2) + Math.sin(this.spin * 0.5) * 4 * power;
      const angle = this.spin + (wide ? Math.PI / 3 : 0);
      next = { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
    } else {
      // During the active frames the yo-yo travels out and returns; its visible path is also its hitbox.
      const u = phase === 'active' ? clamp((progress - 0.3) / 0.3, 0, 1) : 0;
      const extension = phase === 'active' ? Math.sin(Math.PI * u) : phase === 'windup' ? 0.06 : 0;
      const distance = 9 + Math.max(0, reach - 9) * extension;
      const wave = moveId === 'y_snap' ? 6 * Math.sin(u * Math.PI * 2) * extension
        : moveId === 'y_loop' ? 20 * Math.sin(u * Math.PI * 2) * extension
          : moveId === 'y_trapeze' || moveId === 'y_dragon' ? 20 * Math.sin(u * Math.PI * 2) * extension * (moveId === 'y_dragon' ? -1 : 1)
            : moveId === 'y_breakaway' ? -18 * Math.sin(u * Math.PI * 2) * extension : 0;
      next = { x: origin.x + forward.x * distance + side.x * wave, y: origin.y + forward.y * distance + side.y * wave };
    }
    const previous = this.position;
    this.position = next;
    if (moveId && phase !== 'none' && Math.hypot(next.x - previous.x, next.y - previous.y) > 0.3) {
      this.trail.push({ x: previous.x, y: previous.y, life: YOYO_TRAIL_LIFE });
      if (this.trail.length > MAX_TRAIL_POINTS) this.trail.shift();
    }
  }

  draw(ctx: Ctx, active: boolean, hand: Vec = this.hand) {
    const oldAlpha = ctx.globalAlpha;
    const skin = this.skin;
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1], b = this.trail[i];
      const fade = clamp(b.life / YOYO_TRAIL_LIFE, 0, 1);
      ctx.globalAlpha = oldAlpha * fade * 0.14;
      pline(ctx, a.x, a.y, b.x, b.y, skin.trailGlow, 3);
      ctx.globalAlpha = oldAlpha * fade * 0.65;
      pline(ctx, a.x, a.y, b.x, b.y, skin.trail, 1);
      ctx.globalAlpha = oldAlpha * fade * 0.9;
      pline(ctx, a.x, a.y, b.x, b.y, i % 3 === 0 ? skin.highlight : skin.trailLight, 1);
      if (skin.trailStyle === 'ribbon' || skin.trailStyle === 'stardust') {
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const ox = -dy / len * 1.4, oy = dx / len * 1.4;
        ctx.globalAlpha = oldAlpha * fade * 0.4;
        pline(ctx, a.x + ox, a.y + oy, b.x + ox, b.y + oy, skin.trailLight, 1);
      }
      if ((skin.trailStyle === 'petal' || skin.trailStyle === 'stardust') && i % 4 === 0) {
        ctx.globalAlpha = oldAlpha * fade * 0.7;
        px(ctx, b.x + (i % 3 - 1) * 2, b.y - 3, skin.spark);
        if (skin.trailStyle === 'stardust') px(ctx, b.x + (i % 3 - 1) * 2, b.y - 4, skin.spark);
      }
    }
    ctx.globalAlpha = oldAlpha * 0.48;
    const midX = (hand.x + this.position.x) / 2;
    const midY = (hand.y + this.position.y) / 2 + (active ? 1.5 : 3);
    pline(ctx, hand.x, hand.y, midX, midY, skin.string);
    pline(ctx, midX, midY, this.position.x, this.position.y, skin.string);
    ctx.globalAlpha = oldAlpha;
    drawYoyoSprite(ctx, this.position.x, this.position.y, skin, this.spin, active, this.flash > 0);
    ctx.globalAlpha = oldAlpha;
  }
}