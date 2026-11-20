import type { Ctx } from './pixel';

/** Renderer stickman "versi 3D": tubuh silinder bergradasi, kepala bola, bayangan offset. */
type O = any;
type SK = any;
let DEPTH = false;
export function setDepthMode(v: boolean) { DEPTH = v; }
export function isDepthMode() { return DEPTH; }

const P = (o: O, v: any) => ({ x: o.x + v.x, y: o.y - (o.z ?? 0) + v.y });
function capsule(ctx: Ctx, a: any, b: any, w: number, c1: string, c2: string, alpha = 1) {
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha * 0.3;
  ctx.strokeStyle = '#05070b'; ctx.lineWidth = w + 1.5;
  ctx.beginPath(); ctx.moveTo(a.x + 1.5, a.y + 2); ctx.lineTo(b.x + 1.5, b.y + 2); ctx.stroke();
  const g = ctx.createLinearGradient(a.x - w, a.y - w, b.x + w, b.y + w);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, c1); g.addColorStop(0.72, c2); g.addColorStop(1, '#1d2735');
  ctx.globalAlpha = alpha; ctx.strokeStyle = g; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.globalAlpha = alpha * 0.45; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, w * 0.22);
  ctx.beginPath(); ctx.moveTo(a.x - w * 0.18, a.y - w * 0.12); ctx.lineTo(b.x - w * 0.18, b.y - w * 0.12); ctx.stroke();
  ctx.restore();
}
function sphere(ctx: Ctx, x: number, y: number, r: number, c: string, alpha = 1) {
  const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, c); g.addColorStop(1, '#202a38');
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(5,8,12,0.7)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

export function draw3DStick(ctx: Ctx, o: O, sk: SK) {
  const s = o.scale ?? 1, f = o.facing;
  const hip = P(o, sk.hip), neck = P(o, sk.neck), head = P(o, sk.head);
  const ffoot = P(o, sk.ffoot), bfoot = P(o, sk.bfoot);
  const fhand = P(o, sk.fhand), bhand = P(o, sk.bhand);
  const fknee = sk.fknee ? P(o, sk.fknee) : null, bknee = sk.bknee ? P(o, sk.bknee) : null;
  const felbow = sk.felbow ? P(o, sk.felbow) : null, belbow = sk.belbow ? P(o, sk.belbow) : null;
  const base = o.flash ? '#ffffff' : o.c;
  const shade = o.c2 || '#51657c';
  const alpha = o.alpha ?? 1;
  const lw = Math.max(2.4, 3.1 * s);
  // ground contact shadow
  ctx.save(); ctx.globalAlpha = alpha * 0.2; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(hip.x, hip.y + 3 * s, 7 * s, 2.4 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // back limbs
  if (bknee) { capsule(ctx, hip, bknee, lw * 0.85, shade, '#253348', alpha * 0.85); capsule(ctx, bknee, bfoot, lw * 0.8, shade, '#253348', alpha * 0.85); }
  else capsule(ctx, hip, bfoot, lw * 0.85, shade, '#253348', alpha * 0.85);
  if (belbow) { capsule(ctx, neck, belbow, lw * 0.7, shade, '#2b3a50', alpha * 0.85); capsule(ctx, belbow, bhand, lw * 0.65, shade, '#2b3a50', alpha * 0.85); }
  else capsule(ctx, neck, bhand, lw * 0.7, shade, '#2b3a50', alpha * 0.85);
  // torso: tapered body + chest highlight
  capsule(ctx, hip, neck, lw * 1.45, base, shade, alpha);
  ctx.save(); ctx.globalAlpha = alpha * 0.35; ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(neck.x - 0.6 * s, neck.y + 1.2 * s, 2.4 * s, 1.1 * s, o.aim * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // front limbs
  if (fknee) { capsule(ctx, hip, fknee, lw, base, shade, alpha); capsule(ctx, fknee, ffoot, lw * 0.92, base, shade, alpha); }
  else capsule(ctx, hip, ffoot, lw, base, shade, alpha);
  if (felbow) { capsule(ctx, neck, felbow, lw * 0.82, base, shade, alpha); capsule(ctx, felbow, fhand, lw * 0.76, base, shade, alpha); }
  else capsule(ctx, neck, fhand, lw * 0.82, base, shade, alpha);
  // head sphere, 5% bigger in tall mode
  const hr = 3 * s * (o.headScale ?? 1);
  sphere(ctx, head.x, head.y, hr, base, alpha);
  // headband / visor / accessory
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  const band = o.acc === 'band' || o.acc === 'headband' || o.acc === 'shades' ? o.c2 || '#c4202c' : null;
  if (band) {
    ctx.strokeStyle = band; ctx.lineWidth = 1.4 * s;
    ctx.beginPath(); ctx.moveTo(head.x - hr * 0.85, head.y - 0.5 * s); ctx.lineTo(head.x + hr * 0.85, head.y - 0.5 * s); ctx.stroke();
    ctx.globalAlpha = alpha * 0.7; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.6 * s;
    ctx.beginPath(); ctx.moveTo(head.x - hr * 0.7, head.y - 1.2 * s); ctx.lineTo(head.x + hr * 0.5, head.y - 1.2 * s); ctx.stroke();
  }
  if (o.acc === 'crown') { ctx.fillStyle = '#ffd700'; for (let i = -1; i <= 1; i++) ctx.fillRect(head.x + i * 1.5 * s, head.y - hr - 2 * s, s, 2 * s); }
  if (o.acc === 'horns') { ctx.strokeStyle = o.c2; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(head.x - hr, head.y - hr); ctx.lineTo(head.x - hr - 2 * s, head.y - hr - 2 * s); ctx.moveTo(head.x + hr, head.y - hr); ctx.lineTo(head.x + hr + 2 * s, head.y - hr - 2 * s); ctx.stroke(); }
  if (o.acc === 'hood') { ctx.strokeStyle = o.c2; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(head.x, head.y, hr + 0.6 * s, Math.PI, 0); ctx.stroke(); }
  // eye / facing glint
  ctx.fillStyle = o.eyes || '#111'; ctx.globalAlpha = alpha * 0.9;
  ctx.fillRect(head.x + f * hr * 0.35 - 0.5 * s, head.y - 0.3 * s, 1.1 * s, 0.8 * s);
  ctx.restore();
}

export function draw3DWeapon(ctx: Ctx, o: O, sk: SK) {
  const w = o.weapon;
  if (!w || w === 'none') return;
  const s = o.scale ?? 1, hand = P(o, sk.fhand);
  const a = o.aim + (o.gunSpin ?? 0);
  const dx = Math.cos(a), dy = Math.sin(a) * 0.6;
  const len = w === 'rifle' || w === 'shotgun' ? 17 : w === 'bat' || w === 'staff' ? 15 : w === 'smg' ? 12 : w === 'pistol' ? 10 : w === 'knife' ? 7 : 10;
  const tip = { x: hand.x + dx * len * s, y: hand.y + dy * len * s };
  if (w === 'shield') { sphere(ctx, hand.x + dx * 3 * s, hand.y, 4 * s, '#c9d2dc', o.alpha ?? 1); return; }
  if (w === 'bomb') { sphere(ctx, hand.x + dx * 3 * s, hand.y, 2.5 * s, '#1b1b22', o.alpha ?? 1); return; }
  capsule(ctx, hand, tip, w === 'bat' || w === 'staff' ? 3.2 * s : 2.5 * s, '#dfe7ef', '#52647a', o.alpha ?? 1);
  if (w === 'rifle' || w === 'shotgun' || w === 'smg') {
    capsule(ctx, { x: hand.x - dx * 5 * s, y: hand.y - dy * 5 * s }, hand, 2.2 * s, '#7a4a2b', '#2b1c12', o.alpha ?? 1);
  }
}
