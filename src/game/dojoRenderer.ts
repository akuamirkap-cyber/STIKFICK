import dojoArenaArt from '../assets/dojo-arena.webp';
import type { Game } from '../original/v2/games/maxkungfu/game/game';
import { MOVES } from '../original/v2/games/maxkungfu/game/moves';
import { drawFootImpact, drawFootPivot, drawFootRibbon } from '../original/v2/games/maxkungfu/game/footEffects';
import { FOOT_SCHOOLS, footMove, footStanceColor } from '../original/v2/games/maxkungfu/game/footwork';
import { FOOT_PRACTICE } from '../data';
import type { FootPractice } from './footPractice';
import { solvePose, type Skeleton, type StickOpts } from '../original/v2/games/maxkungfu/game/stick';
import type { Pose, Vec } from '../original/v2/games/maxkungfu/game/types';

type Painter = CanvasRenderingContext2D;
const point = (x: number, y: number): Vec => ({ x, y });
const mix = (a: Vec, b: Vec, t: number) => point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const ink = '#181a16';
const dojoPoint = (v: Vec) => point(v.x, v.y - Math.min(1, Math.max(0, -v.y / 3.6)) * 2.45);
const footDojoPoint = (v: Vec) => point(v.x, v.y - Math.min(1, Math.max(0, -v.y / 3.6)) * .70);

function shape(c: Painter, color: string, points: number[][], line = 0.09) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
  if (line) {
    c.lineWidth = line;
    c.strokeStyle = ink;
    c.stroke();
  }
}

function stroke(c: Painter, a: Vec, b: Vec, width: number, color: string) {
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b.x, b.y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function limb(c: Painter, a: Vec, b: Vec, r0: number, r1: number, color: string, highlight?: string) {
  const length = Math.max(0.05, Math.hypot(b.x - a.x, b.y - a.y));
  const nx = -(b.y - a.y) / length,
    ny = (b.x - a.x) / length;
  const m = mix(a, b, 0.42);
  c.beginPath();
  c.moveTo(a.x + nx * r0, a.y + ny * r0);
  c.quadraticCurveTo(m.x + nx * r0 * 1.3, m.y + ny * r0 * 1.3, b.x + nx * r1, b.y + ny * r1);
  c.quadraticCurveTo(b.x + (b.x - a.x) * 0.09, b.y + (b.y - a.y) * 0.09, b.x - nx * r1, b.y - ny * r1);
  c.quadraticCurveTo(m.x - nx * r0, m.y - ny * r0, a.x - nx * r0, a.y - ny * r0);
  c.quadraticCurveTo(a.x - (b.x - a.x) * 0.16, a.y - (b.y - a.y) * 0.16, a.x + nx * r0, a.y + ny * r0);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.lineWidth = 0.09;
  c.strokeStyle = ink;
  c.stroke();
  if (highlight) {
    const h = mix(a, b, 0.72);
    stroke(
      c,
      point(a.x + nx * r0 * 0.7, a.y + ny * r0 * 0.7),
      point(h.x + nx * r1 * 0.65, h.y + ny * r1 * 0.65),
      0.1,
      highlight,
    );
  }
}

function wrapped(c: Painter, a: Vec, b: Vec, radius: number, pale: string) {
  limb(c, a, b, radius * 1.08, radius, pale);
  const len = Math.max(0.01, Math.hypot(b.x - a.x, b.y - a.y));
  const nx = -(b.y - a.y) / len,
    ny = (b.x - a.x) / len;
  for (let i = 1; i < 6; i++) {
    const k = mix(a, b, i / 6),
      k2 = mix(a, b, (i + 0.48) / 6);
    stroke(
      c,
      point(k.x - nx * radius, k.y - ny * radius),
      point(k2.x + nx * radius, k2.y + ny * radius),
      0.035,
      '#6f7566',
    );
  }
}

function fighter(c: Painter, skeleton: Skeleton, o: StickOpts, guest: boolean, time: number) {
  const f = o.facing;
  const skin = guest ? '#9b856b' : '#ab8966',
    shade = guest ? '#655e50' : '#71553f';
  const light = guest ? '#b4a58d' : '#d0b58c',
    cloth = guest ? '#34454a' : '#34382c';
  const isFoot = !guest && (o.c2 === FOOT_SCHOOLS.capoeira.color || o.footLead !== undefined);
  const seam = guest ? '#91b2b6' : isFoot ? o.c2 : '#c4d765',
    tape = guest ? '#b5c3be' : '#dbdac7';
  // The same monotone projection is applied to both rigs, including their shared contact point.
  const map = isFoot ? footDojoPoint : dojoPoint;
  const hip = map(skeleton.hip),
    neck = map(skeleton.neck),
    head = map(skeleton.head);
  const collar = mix(neck, head, 0.25);
  const leg = (knee: Vec | null, foot: Vec, back: boolean) => {
    const k = map(knee ?? mix(skeleton.hip, foot, 0.5)),
      ft = map(foot),
      h = point(hip.x + (back ? -0.48 : 0.34) * f, hip.y);
    limb(c, h, k, back ? 0.79 : 0.88, 0.42, back ? shade : skin, light);
    limb(c, k, ft, 0.46, 0.27, back ? shade : skin, light);
    const wrapColor = o.footLead !== undefined && !guest && (back === (o.footLead === -1)) ? '#dfbb7e' : back ? '#9b9d8b' : tape;
    wrapped(c, mix(k, ft, 0.66), ft, 0.31, wrapColor);
    shape(c, back ? shade : skin, [
      [ft.x - f * 0.34, ft.y - 0.12],
      [ft.x + f * 0.17, ft.y - 0.25],
      [ft.x + f * 1.08, ft.y + 0.16],
      [ft.x + f * 1.1, ft.y + 0.39],
      [ft.x - f * 0.36, ft.y + 0.35],
    ]);
    const hem = mix(h, k, 0.57);
    limb(c, h, hem, back ? 0.96 : 1.05, 0.86, back ? '#252c26' : cloth);
    stroke(c, point(hem.x - 0.69, hem.y - 0.08), point(hem.x + 0.65, hem.y + 0.12), 0.15, seam);
  };
  const arm = (hand: Vec, elbow: Vec | null, back: boolean) => {
    const sh = point(collar.x + (back ? -0.46 : 0.27) * f, collar.y + 0.3);
    const palm = map(hand),
      el = elbow ? map(elbow) : point((sh.x + palm.x) / 2 - 0.45 * f, (sh.y + palm.y) / 2 + 0.9);
    limb(c, sh, el, back ? 0.64 : 0.79, 0.41, back ? shade : skin, light);
    limb(c, el, palm, 0.47, 0.3, back ? shade : skin, light);
    wrapped(c, mix(el, palm, 0.46), palm, 0.39, back ? '#a3a899' : tape);
    c.save();
    c.translate(palm.x, palm.y);
    c.scale(f, 1);
    shape(c, back ? '#b6b9a9' : tape, [
      [-0.4, 0.3],
      [-0.48, -0.22],
      [-0.22, -0.67],
      [0.3, -0.78],
      [0.66, -0.4],
      [0.64, 0.14],
      [0.1, 0.46],
    ]);
    for (let i = 0; i < 3; i++)
      stroke(c, point(-0.18 + i * 0.21, -0.61), point(-0.18 + i * 0.21, -0.27), 0.045, '#6b705f');
    c.restore();
  };
  c.lineJoin = 'round';
  c.lineCap = 'round';
  leg(skeleton.bknee, skeleton.bfoot, true);
  arm(skeleton.bhand, skeleton.belbow, true);
  leg(skeleton.fknee, skeleton.ffoot, false);
  limb(c, collar, head, 0.69, 0.48, shade);
  const dx = collar.x - hip.x,
    dy = collar.y - hip.y,
    length = Math.hypot(dx, dy);
  c.save();
  c.translate(hip.x, hip.y);
  c.rotate(Math.atan2(dy, dx) + Math.PI / 2);
  c.scale(f, 1);
  shape(c, skin, [
    [-0.82, 0.15],
    [-0.97, -1.08],
    [-1.58, -length + 0.9],
    [-1.37, -length - 0.02],
    [-0.58, -length - 0.37],
    [0.22, -length - 0.29],
    [1.35, -length - 0.04],
    [1.52, -length + 0.8],
    [1.2, -length + 1.69],
    [0.8, -0.77],
    [0.91, 0.05],
  ]);
  shape(
    c,
    shade,
    [
      [-1.32, -length + 0.36],
      [-0.37, -length + 0.85],
      [-0.48, -2.5],
      [-0.11, -1.74],
      [-0.45, -0.76],
      [-0.33, 0],
      [-0.87, 0],
      [-1.18, -2.4],
    ],
    0,
  );
  stroke(c, point(0.1, -length + 0.78), point(0.88, -length + 0.56), 0.09, light);
  stroke(c, point(0.09, -length + 1.62), point(0.98, -length + 1.39), 0.075, shade);
  for (let i = 0; i < 3; i++)
    stroke(c, point(-0.08, -2.1 + i * 0.51), point(0.51, -2.16 + i * 0.51), 0.065, shade);
  shape(c, cloth, [
    [-1.12, -0.54],
    [1.04, -0.62],
    [1.26, 0.68],
    [0.46, 1.03],
    [-0.82, 0.92],
    [-1.29, 0.5],
  ]);
  shape(
    c,
    seam,
    [
      [-1.11, -0.56],
      [1.03, -0.65],
      [1.09, -0.22],
      [-1.18, -0.14],
    ],
    0.05,
  );
  shape(
    c,
    guest ? '#47606a' : '#949f4d',
    [
      [-0.94, -0.2],
      [-0.67, -0.3],
      [-0.88, 1.45],
      [-1.22, 1.67],
    ],
    0.05,
  );
  c.restore();
  c.save();
  c.translate(head.x, head.y);
  c.scale(f, 1);
  if (o.clinch?.receiver) c.rotate(0.54 * o.clinch.w);
  shape(c, skin, [
    [-0.74, -1.02],
    [-0.17, -1.25],
    [0.55, -0.98],
    [0.77, -0.36],
    [0.78, -0.09],
    [1.02, 0.16],
    [0.78, 0.24],
    [0.73, 0.75],
    [0.28, 1.04],
    [-0.2, 0.94],
    [-0.79, 0.34],
    [-0.93, -0.41],
  ]);
  shape(
    c,
    shade,
    [
      [-0.79, -0.35],
      [-0.2, 0.04],
      [-0.23, 0.47],
      [0.31, 0.91],
      [-0.17, 0.94],
      [-0.78, 0.35],
    ],
    0,
  );
  shape(
    c,
    ink,
    [
      [-0.9, 0.16],
      [-1.01, -0.5],
      [-0.91, -0.94],
      [-1.12, -1.16],
      [-0.66, -1.11],
      [-0.83, -1.47],
      [-0.27, -1.3],
      [-0.25, -1.67],
      [0.16, -1.35],
      [0.45, -1.6],
      [0.55, -1.25],
      [1.01, -1.28],
      [0.67, -0.78],
      [0.3, -0.61],
      [0.26, -0.29],
      [-0.12, -0.56],
      [-0.5, 0.06],
      [-0.61, 0.34],
    ],
    0.04,
  );
  if (!guest) {
    shape(
      c,
      seam,
      [
        [-0.93, -0.61],
        [0.76, -0.7],
        [0.77, -0.46],
        [-0.86, -0.3],
      ],
      0.05,
    );
    const wind = Math.sin(time * 4) * 0.21;
    shape(
      c,
      seam,
      [
        [-0.85, -0.53],
        [-1.73, -0.27 + wind],
        [-2.52, -0.58 + wind],
        [-2.34, -0.25 + wind],
        [-1.65, 0.05 + wind],
        [-0.81, -0.33],
      ],
      0.06,
    );
  }
  stroke(c, point(0.18, -0.18), point(0.72, -0.13), 0.11, ink);
  stroke(c, point(0.42, -0.02), point(0.66, -0.05), 0.06, '#e9e5d6');
  stroke(c, point(0.51, 0.48), point(0.77, 0.46), 0.045, ink);
  c.restore();
  arm(skeleton.fhand, skeleton.felbow, false);
}

function drawFootReadout(ctx: Painter, g: Game, drill: FootPractice, w: number, h: number, move: ReturnType<typeof footMove>, reduced: boolean) {
  const route = FOOT_PRACTICE[drill.route];
  const inStance = g.footwork.inFlamingo;
  const stanceColor = footStanceColor(g.footwork.lead);
  const school = move ? FOOT_SCHOOLS[move.foot.school] : inStance ? FOOT_SCHOOLS.flamingo : FOOT_SCHOOLS.capoeira;
  const age = g.footwork.clock - g.footwork.changedAt;
  const progress = drill.progress;
  const landMark = drill.route === 'aerial' && progress > 0 && !g.player.airborne && progress < 2;
  const step = drill.route === 'flamingo' ? progress >= 2 ? Math.min(progress, 3) : drill.stance || progress ? 1 : 0
    : drill.route === 'aerial' && progress > 0 ? progress + (landMark ? 0 : 1) : progress;
  const keys = route.keys;
  const width = 270, x = w / 2 - width / 2, y = 63;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const isFlamingo = drill.route === 'flamingo';
  ctx.fillStyle = isFlamingo ? '#181710ea' : '#101b17e8';
  ctx.fillRect(x, y, width, 39);
  ctx.fillStyle = drill.complete ? '#c9ef86' : isFlamingo ? '#e5aa69' : '#70cbaa';
  ctx.fillRect(x, y, 2, 39);
  ctx.font = '500 9px "Plex Mono",monospace';
  ctx.fillText(drill.complete ? 'RUTE SELESAI' : `RUTE / ${route.label.toUpperCase()}`, x + 12, y + 11);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#afbaad';
  ctx.fillText(`${progress}/${route.moves.length} HIT`, x + width - 12, y + 11);
  ctx.textAlign = 'center';
  ctx.font = '600 10px "Plex Mono",monospace';
  const keyWidths = keys.map(k => k.length * 6 + 15);
  let kx = w / 2 - (keyWidths.reduce((a, b) => a + b, 0) + (keys.length - 1) * 5) / 2;
  keys.forEach((label, i) => {
    const kw = keyWidths[i], done = drill.complete || i < step, next = !done && i === step;
    ctx.fillStyle = done ? '#244438' : next ? isFlamingo ? '#ffca90' : '#9aecc5' : '#24302a';
    ctx.fillRect(kx, y + 20, kw, 13);
    ctx.fillStyle = done ? '#abe2c4' : next ? '#142820' : '#a8b5a9';
    ctx.fillText(label, kx + kw / 2, y + 27);
    kx += kw + 5;
  });

  const hits = g.footwork.chainHits;
  if (hits > 0) {
    const size = 28 + (reduced ? 0 : Math.max(0, .12 - (g.footwork.clock - g.footwork.lastHit)) * 30);
    ctx.textAlign = 'right';
    ctx.font = `900 italic ${size}px "Barlow Condensed",sans-serif`;
    ctx.fillStyle = school.light;
    ctx.fillText(`${hits} HIT`, w - 22, 72);
    ctx.font = '500 9px "Plex Mono",monospace';
    ctx.fillStyle = school.color;
    ctx.fillText(g.footwork.route === 'flamingo' ? 'FLAMINGO RUSH' : g.footwork.route === 'mixed' ? (g.footVer === 3 ? 'SILANG V1+V2' : g.footVer === 2 ? 'HAWK RUSH' : 'CROSSFLOW') : hits >= 6 ? 'KOMBO PANJANG' : 'FOOT CHAIN', w - 22, 89);
  }

  const label = move ? move.name : inStance ? 'FLAMINGO STANCE' : 'FOOTWORK READY';
  const pending = g.footwork.inputs.map(input => input === 'L' ? 'J' : 'K');
  const panelW = Math.max(215, label.length * 9), panelX = w / 2 - panelW / 2, panelY = h - 55;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0d1916eb';
  ctx.fillRect(panelX, panelY, panelW, 40);
  ctx.fillStyle = inStance ? stanceColor : school.color;
  ctx.fillRect(panelX, panelY, panelW, 1);
  ctx.font = '800 italic 18px "Barlow Condensed",sans-serif';
  ctx.fillStyle = school.light;
  const lift = reduced ? 0 : -Math.max(0, 1 - age / .12) * 2;
  ctx.fillText(label, w / 2, panelY + 14 + lift);
  ctx.font = '500 9px "Plex Mono",monospace';
  ctx.fillStyle = school.color;
  const lead = g.footwork.lead === 1 ? 'KIRI' : 'KANAN';
  ctx.fillText(pending.length ? `ANTRIAN  ${pending.join(' / ')}` : inStance ? `${lead} DI DEPAN  /  J J K` : move ? `${school.label}   ${g.footwork.beat}/${g.footwork.total}` : (g.footVer === 3 ? 'SCROLL V1/V2/V3  /  J + K  SILANG' : g.footVer === 2 ? 'SCROLL V1/V2/V3  /  J  CHAGI  /  K  540' : 'SCROLL V1/V2/V3  /  I  FLAMINGO  /  J  FLOW'), w / 2, panelY + 29);
  if (inStance) {
    ctx.fillStyle = '#2c3226'; ctx.fillRect(panelX, panelY + 39, panelW, 2);
    ctx.fillStyle = stanceColor; ctx.fillRect(panelX, panelY + 39, panelW * g.footwork.stanceFill, 2);
  }
  ctx.restore();
}

export function createDojoRenderer(g: Game, canvas: HTMLCanvasElement, name: string, drill: FootPractice) {
  const ctx = canvas.getContext('2d')!;
  const background = new Image();
  background.src = dojoArenaArt;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let camera = g.player.x + 8,
    oldCount = 0,
    impactAt = -2,
    zoomSmoothing = 0,
    drillRevision = -1;
  return () => {
    const p = g.player,
      e = g.enemies[0];
    if (!e) return;
    const foot = p.weapon === 'foot';
    const kick = foot && p.attackPhase !== 'none' && p.moveKey ? footMove(MOVES[p.moveKey]) : undefined;
    const w = canvas.width,
      h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#454536';
    ctx.fillRect(0, 0, w, h);
    if (background.complete && background.naturalWidth) {
      const cover = Math.max(w / background.naturalWidth, h / background.naturalHeight);
      const bw = background.naturalWidth * cover, bh = background.naturalHeight * cover;
      ctx.drawImage(background, (w - bw) / 2, (h - bh) / 2, bw, bh);
    }
    ctx.fillStyle = '#1b1f172c';
    ctx.fillRect(0, 0, w, h);
    const floor = h * 0.84;
    const reduced = motion.matches;
    const headroom = (y: number, z: number) => Math.max(0, g.level.spawn.y - y) * .55 + Math.max(0, z) * .78;
    const worldHeight = Math.min(13, Math.max(headroom(p.y, p.z), headroom(e.y, e.z))) + 15.1;
    const wantedScale = Math.min(h / (foot ? 31 : 29), foot ? (floor - 72) / worldHeight : Infinity,
      (w * 0.83) / Math.max(29, Math.abs(e.x - p.x) + 13));
    const rate = Math.max(0, g.rawDt || 1 / 60);
    if (drillRevision !== drill.sequence) {
      drillRevision = drill.sequence;
      camera = (p.x + e.x) / 2;
      zoomSmoothing = wantedScale;
    }
    zoomSmoothing += (wantedScale - zoomSmoothing) * (1 - Math.exp(-(wantedScale < zoomSmoothing ? 17 : 6) * rate));
    const scale = foot ? Math.min(zoomSmoothing, wantedScale * 1.035) : wantedScale;
    camera += ((p.x + e.x) / 2 - camera) * (1 - Math.exp(-10 * rate));
    const hit = foot ? g.footwork.impact : null;
    const jolt = hit?.strong && !reduced ? Math.max(0, 1 - (g.time - hit.at) / .18) * Math.sin((g.time - hit.at) * 76) * scale * .10 : 0;
    const sx = (x: number) => w / 2 + (x - camera) * scale + jolt;
    if (g.muay.contacts !== oldCount) {
      if (g.muay.contacts > oldCount) impactAt = g.time;
      oldCount = g.muay.contacts;
    }
    const flash = Math.max(0, 1 - (g.time - impactAt) / 0.27);
    for (const pos of [e.x, p.x]) {
      ctx.beginPath();
      ctx.ellipse(sx(pos), floor + scale * 0.4, scale * 3.9, scale * 0.52, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#15180f5c';
      ctx.fill();
    }
    const stance = foot && !p.moving ? g.footStancePose() : null;
    let pose: Pose = stance?.pose ?? (foot && !p.moving ? 'foot_guard' : 'idle'),
      t = stance?.t ?? 0;
    if (p.airMagnet) { pose = 'flying'; t = .41; }
    else if (p.attackPhase !== 'none' && p.moveKey && MOVES[p.moveKey]) {
      pose = MOVES[p.moveKey].pose;
      t = g.attackPoseT();
    } else if (p.dashT > 0) pose = 'dash';
    else if (p.airborne) {
      pose = 'jump';
      const velocity = -(p.svVy ?? 0);
      t = velocity > 48 ? .15 + .22 * Math.max(0, 1 - velocity / 210) : velocity > -45 ? .45 : .67;
    }
    else if (p.parryT > 0) pose = 'parry';
    if (p.holdT > 0) {
      pose = p.holdPose;
      t = p.holdPoseT;
    }
    const action = g.muay.poseOverride() ?? g.tkd.poseOverride() ?? g.botPunch.poseOverride();
    if (action) {
      pose = action.pose as Pose;
      t = action.t;
    }
    const po = g.playerStickOpts(pose, t);
    const eo: StickOpts = {
      ...po,
      x: e.x,
      y: e.y,
      c2: e.color2,
      footLead: undefined,
      footSwitch: undefined,
      footLink: undefined,
      aim: e.aim,
      look: e.aim,
      facing: e.facing,
      pose: e.scenePose ?? (foot && e.y < g.level.spawn.y - .5 ? 'launched' : foot && e.down > 0 ? 'down' : foot && e.flash > 0 ? 'hurt' : 'idle'),
      t: e.sceneT ?? (foot && e.down > 0 ? 1 - Math.min(1, e.down / .34) : 0),
      moving: false,
      walk: 0,
      turn: 0,
      run: 0,
      locoMix: 0,
      z: 0,
      recoil: 0,
      lean: { x: e.facing, y: 0 },
      brake: 0,
      seed: 4,
    };
    g.muay.bindPose(g, po);
    g.muay.bindPose(g, eo, e);
    const lift = (y: number, z: number) => foot ? headroom(y, z) : (Math.max(0, g.level.spawn.y - y) + Math.max(0, z)) * .23;
    const baseline = (y: number, z: number) => floor - Math.min(foot ? 13 : 5.5, lift(y, z)) * scale;
    if (pose === 'foot_flamingo_switch') drawFootPivot(ctx, sx(p.x), floor, scale, t, footStanceColor(g.footwork.lead), reduced);
    if (kick && p.attackPhase === 'active' && !reduced) {
      const ghosts = g.afterimages.filter((a) => a.pose.startsWith('foot_')).slice(-2);
      for (const ghost of ghosts) {
        ctx.save();
        ctx.translate(sx(ghost.x), baseline(ghost.y, 0)); ctx.scale(scale, scale);
        ctx.globalAlpha = .13 * (ghost.life / ghost.max);
        fighter(ctx, solvePose({ ...po, pose: ghost.pose, t: ghost.t, facing: ghost.facing, aim: ghost.aim }), po, false, g.time);
        ctx.restore();
      }
    }
    for (const [o, guest] of [
      [eo, true],
      [po, false],
    ] as const) {
      ctx.save();
      ctx.translate(sx(o.x), baseline(o.y, guest ? 0 : p.z));
      ctx.scale(scale, scale);
      if (!guest && kick) drawFootRibbon(ctx, { ...o, x: 0, y: 0, z: 0 }, kick, footDojoPoint, reduced);
      fighter(ctx, solvePose(o), o, guest, g.time);
      ctx.restore();
    }
    if (hit) {
      const impactY = baseline(hit.originY, hit.originZ) + footDojoPoint(point(0, hit.y - hit.originY + hit.originZ)).y * scale;
      drawFootImpact(ctx, sx(hit.x), impactY, scale, g.time - hit.at, hit.color, hit.strong, hit.direction, hit.school, reduced);
    }
    if (flash > 0 && g.muay.active?.phase === 'knee') {
      const x = sx(p.x + Math.cos(g.muay.active.dir) * 5.2),
        y = floor - scale * 10.55;
      ctx.save();
      ctx.globalAlpha = flash * 0.85;
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + 0.25,
          r = scale * (1.6 + (1 - flash) * 1.4);
        stroke(
          ctx,
          point(x + Math.cos(a) * r, y + Math.sin(a) * r),
          point(x + Math.cos(a) * (r + scale * 0.6 * flash), y + Math.sin(a) * (r + scale * 0.6 * flash)),
          1.6,
          '#f4f5cb',
        );
      }
      ctx.restore();
    }
    const shade = ctx.createLinearGradient(0, 0, 0, h * 0.2);
    shade.addColorStop(0, '#0d110be8');
    shade.addColorStop(1, '#0d110b00');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h * 0.2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '700 14px "Barlow Condensed",sans-serif';
    ctx.fillStyle = '#ecefdc';
    ctx.fillText(`P1  /  ${name.toUpperCase()}`, 22, 24);
    ctx.fillStyle = foot ? FOOT_SCHOOLS.capoeira.color : '#d3f34b';
    ctx.fillRect(22, 38, w * 0.28, 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ecefdc';
    ctx.fillText('PARTNER LATIHAN', w - 22, 24);
    ctx.fillStyle = '#9bbcc3';
    ctx.fillRect(w - 22 - w * 0.28, 38, w * 0.28, 4);
    ctx.textAlign = 'center';
    ctx.font = '500 10px "Plex Mono",monospace';
    ctx.fillStyle = '#d5dbc9';
    ctx.fillText(foot ? 'FOOT MODE' : 'FREE PRACTICE', w / 2, 28);
    if (foot) { drawFootReadout(ctx, g, drill, w, h, kick, reduced); return; }
    const available = !!g.muay.markedTarget(g);
    const status = g.muay.active
      ? g.muay.active.hitDone
        ? 'SINGLE KNEE'
        : 'CLINCH'
      : available
        ? 'K  /  CLINCH SIAP'
        : 'DEKATI PARTNER';
    ctx.font = '500 10px "Plex Mono",monospace';
    const sw = ctx.measureText(status).width + 30;
    ctx.fillStyle = '#10160dea';
    ctx.fillRect((w - sw) / 2, h - 38, sw, 23);
    ctx.fillStyle = available || g.muay.active ? '#d3f34b' : '#c6cfbb';
    ctx.fillText(status, w / 2, h - 26);
  };
}
