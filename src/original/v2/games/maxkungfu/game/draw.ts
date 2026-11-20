import { drawJackHud } from './jack5';
import { drawStoryHud } from './storyBoss';
import { drawTeamHud } from './teamHud';
import { buildMeadowGround } from './meadow';
import { buildOfficeCanvas, officeFloorIndex } from './office';
import { beautifyArena, drawArenaAmbience } from './arenaArt';

export { drawArenaAmbience };
import { TILE, VIEW_H, VIEW_W, ZONES, type Palette } from './constants';
import type { Level } from './level';
import { tileAt } from './level';
import { MOVES } from './moves';
import { FOOT_SCHOOLS, footMove, footStanceColor } from './footwork';
import { SCYTHE_COLOR, scytheMove } from './scythe';
import { drawPistolIcon, drawRifleIcon } from './guns';
import { pcircle, pellipse, pfont, pfontO, pline, prect, pring, px, textWidth, type Ctx } from './pixel';
import { hash2, clamp, rnd } from './rng';
import type { WeaponKind } from './types';
import type { Game } from './game';
export { drawStick, solvePose, drawSkeleton, blendSkeleton, strikeK, type StickOpts, type Skeleton } from './stick';

const inlineScreen = new URLSearchParams(window.location.search).get('inline') === '1';

export function drawShadow(ctx: Ctx, x: number, y: number, s: number, z = 0) {
  const k = 1 - Math.min(0.6, z / 60);
  pellipse(ctx, x, y + 1, 4 * s * k, 1.5 * s * k, `rgba(0,0,0,${0.38 * k})`);
}

// ------------------------------------------------------------ LEVEL CANVAS
export function buildLevelCanvas(level: Level, pal: Palette, g1 = false): HTMLCanvasElement {
  if (level.sideView) return buildOfficeCanvas(level, pal);
  if (level.outdoor) return buildMeadowGround(level);
  const cv = document.createElement('canvas');
  cv.width = level.w * TILE;
  cv.height = level.h * TILE;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, cv.width, cv.height);
  if (g1) {
    // STICK FIST's exact terrain recipe: flat floor + dot grid + wall-depth bricks (no checkerboard)
    const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < level.w && y < level.h && tileAt(level, x, y) === 1;
    for (let ty = 0; ty < level.h; ty++) for (let tx = 0; tx < level.w; tx++) {
      const X = tx * TILE, Y = ty * TILE;
      if (tileAt(level, tx, ty) === 0) {
        ctx.fillStyle = pal.floor; ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = pal.floorAlt; ctx.fillRect(X + 7, Y + 7, 2, 2);
        if ((tx * 7 + ty * 13) % 5 === 0) { ctx.fillStyle = pal.floorAlt; ctx.fillRect(X + 2, Y + 12, 1, 1); }
        if (solid(tx, ty - 1)) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X, Y, TILE, 5); }
      }
    }
    for (let ty = 0; ty < level.h; ty++) for (let tx = 0; tx < level.w; tx++) {
      if (!solid(tx, ty)) continue;
      const X = tx * TILE, Y = ty * TILE;
      let near = 9;
      for (let oy = -2; oy <= 2 && near > 1; oy++) for (let ox = -2; ox <= 2; ox++) {
        if (!solid(tx + ox, ty + oy) && (ox || oy)) near = Math.min(near, Math.max(Math.abs(ox), Math.abs(oy)));
      }
      if (near > 2) {
        ctx.fillStyle = pal.bg; ctx.fillRect(X, Y, TILE, TILE);
        if ((tx * 3 + ty * 5) % 4 === 0) { ctx.fillStyle = pal.floor; ctx.fillRect(X + 5, Y + 9, 1, 1); }
        continue;
      }
      if (near === 2) {
        ctx.fillStyle = pal.wall; ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = pal.bg + '88'; ctx.fillRect(X + 2, Y + 4, 5, 1); ctx.fillRect(X + 9, Y + 11, 4, 1);
        continue;
      }
      ctx.fillStyle = pal.wallTop; ctx.fillRect(X, Y, TILE, TILE);
      if (!solid(tx, ty + 1)) { ctx.fillStyle = pal.wall; ctx.fillRect(X, Y + TILE - 6, TILE, 6); ctx.fillStyle = pal.bg; ctx.fillRect(X, Y + TILE - 6, TILE, 1); }
      ctx.fillStyle = pal.wall; ctx.fillRect(X + 3, Y + 3, 4, 1); ctx.fillRect(X + 9, Y + 6, 3, 1);
      if (!solid(tx, ty - 1)) { ctx.fillStyle = pal.accent + '55'; ctx.fillRect(X, Y, TILE, 1); }
    }
    beautifyArena(ctx, level, pal);
    return cv;
  }
  for (let ty = 0; ty < level.h; ty++) {
    for (let tx = 0; tx < level.w; tx++) {
      const t = tileAt(level, tx, ty);
      const X = tx * TILE, Y = ty * TILE;
      const h = hash2(tx, ty, level.seed);
      if (t === 0) {
        ctx.fillStyle = (tx + ty) & 1 ? pal.floor : pal.floorAlt;
        ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(X, Y, TILE, 1);
        ctx.fillRect(X, Y, 1, TILE);
        if (h % 6 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(X + 3 + (h % 9), Y + 4 + ((h >> 3) % 8), 2, 1);
        }
        if (h % 13 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(X + 2 + (h % 10), Y + 2 + ((h >> 4) % 10), 3, 1);
          ctx.fillRect(X + 3 + (h % 10), Y + 1 + ((h >> 4) % 10), 1, 3);
        }
        if (h % 53 === 0) {
          ctx.fillStyle = pal.accent;
          ctx.globalAlpha = 0.14;
          ctx.fillRect(X + 6, Y + 6, 4, 4);
          ctx.globalAlpha = 0.3;
          ctx.fillRect(X + 7, Y + 7, 2, 2);
          ctx.globalAlpha = 1;
        }
      } else {
        const below = tileAt(level, tx, ty + 1) === 0;
        const above = tileAt(level, tx, ty - 1) === 0;
        const left = tileAt(level, tx - 1, ty) === 0;
        const right = tileAt(level, tx + 1, ty) === 0;
        const anyFloorNear = below || above || left || right || tileAt(level, tx - 1, ty - 1) === 0 || tileAt(level, tx + 1, ty - 1) === 0 || tileAt(level, tx - 1, ty + 1) === 0 || tileAt(level, tx + 1, ty + 1) === 0;
        if (!anyFloorNear) {
          ctx.fillStyle = pal.bg;
          ctx.fillRect(X, Y, TILE, TILE);
          if (h % 7 === 0) { ctx.fillStyle = pal.wall; ctx.globalAlpha = 0.3; ctx.fillRect(X + (h % 12), Y + ((h >> 5) % 12), 2, 2); ctx.globalAlpha = 1; }
          continue;
        }
        ctx.fillStyle = pal.wallTop;
        ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        for (let r = 0; r < 4; r++) {
          ctx.fillRect(X, Y + r * 4, TILE, 1);
          const off = r % 2 ? 4 : 0;
          ctx.fillRect(X + off, Y + r * 4, 1, 4);
          ctx.fillRect(X + off + 8, Y + r * 4, 1, 4);
        }
        if (h % 5 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(X + (h % 8), Y + ((h >> 3) % 12), 3, 2); }
        if (below) {
          ctx.fillStyle = pal.wall;
          ctx.fillRect(X, Y + 9, TILE, 7);
          ctx.fillStyle = pal.accent;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(X, Y + 9, TILE, 1);
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(X, Y + 15, TILE, 1);
          if (h % 9 === 0) {
            ctx.fillStyle = pal.accent2;
            ctx.fillRect(X + 6, Y + 11, 3, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(X + 7, Y + 12, 1, 1);
          }
        }
        if (above) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(X, Y, TILE, 1); }
        if (left) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(X, Y, 1, TILE); }
        if (right) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + TILE - 1, Y, 1, TILE); }
      }
    }
  }
  for (let ty = 0; ty < level.h; ty++) for (let tx = 0; tx < level.w; tx++) {
    if (tileAt(level, tx, ty) === 0 && tileAt(level, tx, ty - 1) === 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(tx * TILE, ty * TILE, TILE, 3);
    }
  }
  beautifyArena(ctx, level, pal);
  return cv;
}

// ------------------------------------------------------------ HUD
function weaponIcon(ctx: Ctx, x: number, y: number, k: WeaponKind, c: string) {
  if (k === 'boxing') {
    // dua sarung tinju berhadapan
    prect(ctx, x, y + 1, 4, 4, c); prect(ctx, x + 1, y, 2, 1, c);
    prect(ctx, x + 5, y + 1, 4, 4, c); prect(ctx, x + 6, y, 2, 1, c);
    px(ctx, x + 1, y + 2, '#ffffff'); px(ctx, x + 6, y + 2, '#ffffff');
  } else if (k === 'guandao') {
    pline(ctx, x, y + 6, x + 6, y - 1, '#7a2a30', 1); prect(ctx, x + 4, y - 3, 4, 4, c); px(ctx, x + 7, y - 4, '#47e6d0'); px(ctx, x + 3, y + 1, '#d8a232');
  } else if (k === 'fist') {
    prect(ctx, x + 1, y + 1, 4, 3, c); prect(ctx, x, y + 2, 1, 2, c); prect(ctx, x + 2, y, 2, 1, c);
  } else if (k === 'foot') {
    pline(ctx, x + 1, y + 1, x + 4, y + 3, c, 2);
    pline(ctx, x + 4, y + 3, x + 6, y, c, 1);
    prect(ctx, x + 6, y, 3, 2, c);
  } else if (k === 'nunchaku') {
    pline(ctx, x, y + 5, x + 3, y, c, 1); pline(ctx, x + 5, y, x + 8, y + 5, c, 1); px(ctx, x + 4, y, c);
  } else if (k === 'katana') {
    pline(ctx, x, y + 5, x + 8, y, c, 1); px(ctx, x + 2, y + 2, c); px(ctx, x + 1, y + 4, c);
  } else if (k === 'buster') {
    pline(ctx, x, y + 6, x + 2, y + 4, '#7a6250', 1); pline(ctx, x + 1, y + 3, x + 3, y + 5, c, 1); pline(ctx, x + 3, y + 3, x + 9, y - 2, c, 2); pline(ctx, x + 4, y + 4, x + 10, y - 1, '#d8e0e8', 1);
  } else if (k === 'bow') {
    pline(ctx, x + 2, y - 1, x + 5, y + 2, c, 1); pline(ctx, x + 5, y + 2, x + 5, y + 4, c, 1); pline(ctx, x + 5, y + 4, x + 2, y + 7, c, 1); pline(ctx, x + 2, y - 1, x + 2, y + 7, '#bbbbbb', 1); pline(ctx, x, y + 3, x + 9, y + 3, '#e2cfa0', 1);
  } else if (k === 'shotgun') {
    pline(ctx, x - 1, y + 5, x + 3, y + 3, '#8a4e22', 2); pline(ctx, x + 3, y + 3, x + 10, y, c, 1); px(ctx, x + 3, y + 5, c);
  } else if (k === 'bat') {
    pline(ctx, x, y + 6, x + 8, y, c, 2); px(ctx, x + 8, y, '#ffe6b0');
  } else if (k === 'axe') {
    pline(ctx, x, y + 5, x + 6, y, c, 1); prect(ctx, x + 5, y - 1, 3, 3, c);
  } else if (k === 'dual') {
    pline(ctx, x, y + 5, x + 4, y, c, 1); pline(ctx, x + 8, y + 5, x + 4, y, c, 1);
  } else if (k === 'hayabusa') {
    pline(ctx, x, y + 5, x + 8, y, c, 1); px(ctx, x + 3, y + 3, '#c4202c'); px(ctx, x + 6, y + 1, '#ffffff');
  } else if (k === 'takamura') {
    pline(ctx, x, y + 5, x + 8, y - 1, c, 1); pline(ctx, x, y + 6, x + 3, y + 3, c, 1); px(ctx, x + 2, y + 4, '#c4202c');
  } else if (k === 'yoyo') {
    pline(ctx, x, y + 1, x + 4, y + 3, c, 1); prect(ctx, x + 4, y + 2, 3, 3, c); px(ctx, x + 5, y + 3, '#000');
  } else if (k === 'pistol') {
    drawPistolIcon(ctx, x, y, c);
  } else if (k === 'rifle') {
    drawRifleIcon(ctx, x, y, c);
  } else {
    prect(ctx, x, y + 2, 9, 1, c); prect(ctx, x + 2, y + 1, 7, 1, c); prect(ctx, x, y + 3, 2, 2, c); prect(ctx, x + 4, y + 3, 2, 1, c);
  }
}

export function drawHUD(ctx: Ctx, g: Game) {
  const p = g.player;
  const pal = g.pal;
  if (g.mode === 'duel') { drawDuelHUD(ctx, g); return; }
  drawJackHud(ctx, g, VIEW_W);
  drawStoryHud(ctx, g, VIEW_W);
  drawTeamHud(ctx, g, VIEW_W);
  const maxHp = g.maxHp();
  // panel kaca gelap di belakang meter (bingkai 1px terang di atas/kiri, gelap di bawah/kanan)
  {
    const pw = 120, ph = 42;
    prect(ctx, 2, 2, pw, ph, 'rgba(6,8,16,0.62)');
    prect(ctx, 2, 2, pw, 1, 'rgba(255,255,255,0.22)'); prect(ctx, 2, 2, 1, ph, 'rgba(255,255,255,0.14)');
    prect(ctx, 2, 2 + ph - 1, pw, 1, 'rgba(0,0,0,0.6)'); prect(ctx, 2 + pw - 1, 2, 1, ph, 'rgba(0,0,0,0.5)');
    prect(ctx, 2, 2, 3, 1, pal.accent); prect(ctx, 2, 2, 1, 3, pal.accent);
  }
  // HP: hati pixel, berdenyut saat sekarat, berkedip putih saat baru kehilangan nyawa
  const gh = g as unknown as { _hpPrev?: number; _hpFlash?: number };
  if (gh._hpPrev === undefined) gh._hpPrev = p.hp;
  if (p.hp < gh._hpPrev) gh._hpFlash = 0.6;
  gh._hpPrev = p.hp;
  gh._hpFlash = Math.max(0, (gh._hpFlash ?? 0) - 0.016);
  const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  for (let i = 0; i < maxHp; i++) {
    const x = 6 + i * 8, y = 5;
    const full = i < p.hp;
    const low = p.hp <= 1 && full && Math.sin(g.time * 14) > 0;
    const flashing = (gh._hpFlash ?? 0) > 0 && i === p.hp && Math.floor(g.time * 24) % 2 === 0;
    const beat = full && p.hp <= 2 ? Math.max(0, Math.sin(g.time * 7)) * 0.9 : 0;
    for (let ry = 0; ry < HEART.length; ry++) for (let rx = 0; rx < 7; rx++) {
      if (HEART[ry][rx] !== 'X') continue;
      const edge = ry === 0 || ry === 5 || rx === 0 || rx === 6 || HEART[ry + 1]?.[rx] !== 'X' || HEART[ry]?.[rx - 1] !== 'X' || HEART[ry]?.[rx + 1] !== 'X';
      let c: string;
      if (flashing) c = '#ffffff';
      else if (full) c = low ? '#ffffff' : edge ? '#c21f2a' : (rx === 1 && ry === 1) || (rx === 2 && ry === 1) ? '#ffb3b3' : '#ff4b55';
      else c = edge ? '#3b1a22' : '#1a0d12';
      px(ctx, x + rx, y + ry - (beat > 0.6 && ry < 3 ? 1 : 0), c);
    }
  }
  for (let i = 0; i < 3; i++) {
    const x = 6 + i * 15, y = 13;
    prect(ctx, x - 1, y - 1, 15, 5, '#000a');
    prect(ctx, x, y, 13, 3, '#0f2a33');
    const fill = clamp(p.focus - i * 100, 0, 100) / 100;
    if (fill > 0) prect(ctx, x, y, Math.max(1, Math.round(13 * fill)), 3, fill >= 1 ? (Math.sin(g.time * 8) > 0 ? '#9ff8ff' : '#35f0ff') : '#1aa8b8');
  }
  // RAGE meter
  {
    const rx = 6, ry = 17, rw = 43;
    prect(ctx, rx - 1, ry - 1, rw + 2, 4, '#000');
    prect(ctx, rx, ry, rw, 2, '#2a0a0a');
    const full = p.rage >= 100;
    const col = p.rageOn ? (Math.sin(g.time * 20) > 0 ? '#ffffff' : '#ff2a2a') : full ? (Math.sin(g.time * 8) > 0 ? '#ff6a6a' : '#ff2a2a') : '#b31b1b';
    prect(ctx, rx, ry, Math.round(rw * clamp(p.rage / 100, 0, 1)), 2, col);
    pfont(ctx, p.rageOn ? `RAGE ${p.rageT.toFixed(1)}` : full ? 'RAGE READY [R]' : 'RAGE', rx + rw + 3, ry - 1, p.rageOn || full ? '#ff6a6a' : '#5a3a3a', 1);
  }
  // ONE FOR ALL meter (X) — game1's slow-mo super, ported. Sits under the weapon row so nothing moves.
  {
    const ox = 6, oy = 34, ow = 43;
    prect(ctx, ox - 1, oy - 1, ow + 2, 4, '#000');
    prect(ctx, ox, oy, ow, 2, '#0a222c');
    const ready = p.ofa >= 25;
    const col = p.ofaActive ? (Math.sin(g.time * 20) > 0 ? '#ffffff' : '#57e6ff') : ready ? (Math.sin(g.time * 8) > 0 ? '#9ff8ff' : '#57e6ff') : '#1d5566';
    prect(ctx, ox, oy, Math.round(ow * clamp(p.ofa / 100, 0, 1)), 2, col);
    prect(ctx, ox + Math.round(ow * 0.25), oy, 1, 2, '#0009');   // notch = activation cost (25)
    pfont(ctx, p.ofaActive ? `OFA ${Math.ceil(p.ofa / 8)}s` : ready ? 'OFA READY [X]' : 'OFA', ox + ow + 3, oy - 1, p.ofaActive || ready ? '#9ff8ff' : '#2f5a66', 1);
  }
  // tag versi (tombol V): biar kelihatan build mana yang sedang jalan
  pfont(ctx, g.v2 ? 'V2' : 'V1', VIEW_W - 6, VIEW_H - 9, g.v2 ? '#4d8794' : '#5a5a5a', 1, 'right');
  let x = 6;
  const y = 23;
  const slots: WeaponKind[] = ['fist', 'foot', 'pistol', 'rifle', 'nunchaku', 'katana', 'axe', 'dual', 'yoyo', 'takamura', 'hayabusa', 'guandao', 'bat', 'shotgun', 'bow', 'buster', 'boxing'];
  for (const k of slots) {
    const owned = g.weaponAllowed(k) && (k === 'fist' || k === 'foot' || k === 'guandao' || k === 'pistol' || (k === 'rifle' && p.hasRifle) || (k === 'nunchaku' && p.hasNunchaku) || (k === 'katana' && p.hasKatana) || (k === 'axe' && p.hasAxe) || (k === 'dual' && p.hasDual) || k === 'yoyo' || k === 'takamura' || k === 'hayabusa' || k === 'bat' || k === 'shotgun' || k === 'bow' || k === 'buster' || k === 'boxing');
    const active = p.weapon === k;
    const col = !owned ? '#2e2e2e' : active ? '#ffffff' : '#6a6a6a';
    {
      const bw = (k === 'rifle' ? 13 : 11);
      prect(ctx, x - 2, y - 3, bw, 11, active ? 'rgba(255,255,255,0.20)' : 'rgba(4,6,12,0.55)');
      prect(ctx, x - 2, y - 3, bw, 1, active ? pal.accent : 'rgba(255,255,255,0.10)');
      prect(ctx, x - 2, y + 7, bw, 1, active ? pal.accent : 'rgba(0,0,0,0.5)');
      if (active) { prect(ctx, x - 2, y - 3, 1, 11, pal.accent); prect(ctx, x - 2 + bw - 1, y - 3, 1, 11, pal.accent); }
    }
    weaponIcon(ctx, x, y, k, col);
    const w = k === 'rifle' ? 11 : 9;
    if (active) {
      const txt = k === 'fist' ? 'KUNG FU' : k === 'foot' ? 'FOOT MODE' : k === 'guandao' ? 'GUAN DAO' : k === 'nunchaku' ? 'NUNCHAKU' : k === 'katana' ? 'KATANA' : k === 'axe' ? 'AXE' : k === 'dual' ? 'DUAL' : k === 'yoyo' ? (g.yoyoVer === 2 ? 'YOYO V2' : 'YOYO V1') : k === 'takamura' ? 'TAKAMURA' : k === 'hayabusa' ? 'HAYABUSA' : k === 'bat' ? 'BAT' : k === 'shotgun' ? `SHOTGUN ${g.sg.shells}` : k === 'bow' ? (g.bow.trick ? g.bow.trick.label : g.bow.cd > 0 ? 'BOW' : 'BOW [RMB]') : k === 'buster' ? `BUSTER ${g.bu.punisher ? 'PUNISHER' : 'OPERATOR'}${g.bu.limit >= 100 ? ' LIMIT!' : ''}` : k === 'boxing' ? `BOXING ${g.box.stance.toUpperCase()}` : k === 'pistol' ? (g.guns.trick ? g.guns.trick.label : `${p.ammoP}`) : (g.guns.trick ? g.guns.trick.label : `${p.ammoR}`);
      const empty = (k === 'shotgun' && !g.sg.shells) || (k === 'pistol' && !p.ammoP) || (k === 'rifle' && !p.ammoR);
      pfont(ctx, txt, x + w + 3, y, empty ? '#ff3b3b' : k === 'foot' ? (g.footVer === 3 ? FOOT_SCHOOLS.hawk.color : g.footVer === 2 ? FOOT_SCHOOLS.hwarang.color : FOOT_SCHOOLS.capoeira.color) : k === 'scythe' ? SCYTHE_COLOR.grim : '#ffffff', 1);
      x += w + 3 + textWidth(txt) + 6;
    } else x += w + 4;
  }
  if (p.weapon === 'foot' && g.state === 'playing') {
    const current = p.attackPhase !== 'none' && p.moveKey ? footMove(MOVES[p.moveKey]) : undefined;
    const stance = g.footwork.inFlamingo;
    const v2 = g.footVer === 2, v3 = g.footVer === 3;
    const ink = current ? FOOT_SCHOOLS[current.foot.school] : stance ? FOOT_SCHOOLS.flamingo : v3 ? FOOT_SCHOOLS.hawk : v2 ? FOOT_SCHOOLS.hwarang : FOOT_SCHOOLS.capoeira;
    const label = current ? current.name : stance ? 'FLAMINGO STANCE' : v3 ? 'FOOT V3  J/K SILANG V1+V2' : v2 ? 'FOOT V2  J CHAGI  K 540' : 'FOOT V1  I FLAMINGO  J FLOW';
    const next = g.footwork.inputs.map(k => k === 'L' ? 'J' : 'K').join(' ');
    const width = Math.max(textWidth(label) + 10, next ? 86 : 0);
    prect(ctx, 4, 41, width, next || stance ? 25 : 17, '#090e17cf');
    prect(ctx, 4, 41, 2, 17, ink.color);
    pfont(ctx, label, 9, 45, ink.light);
    if (current) for (let i = 0; i < g.footwork.total; i++) prect(ctx, 9 + i * 10, 53, 8, 2, i < g.footwork.beat ? ink.color : '#34424f');
    if (next) pfont(ctx, `NEXT ${next}`, 9, 58, '#adc9bb');
    else if (stance) pfont(ctx, `${g.footwork.lead === 1 ? 'LEFT' : 'RIGHT'} LEAD`, 9, 58, footStanceColor(g.footwork.lead));
    if (g.footwork.chainHits > 1) pfontO(ctx, `${g.footwork.chainHits}X ${v3 ? 'CROSS' : v2 ? 'RUSH' : 'FLOW'}`, 8 + width, 45, ink.color, '#090e17');
    else if (!current && !next && !stance) pfontO(ctx, 'SCROLL: V1/V2/V3', 8 + width, 45, '#8fa0a8', '#090e17');
  }
  if (p.weapon === 'scythe' && g.state === 'playing') {
    const current = p.attackPhase !== 'none' && p.moveKey ? scytheMove(MOVES[p.moveKey]) : undefined;
    const ink = current ? SCYTHE_COLOR[current.scythe.school] : SCYTHE_COLOR.grim;
    const label = current ? current.name : 'SHIFT+G SCYTHE  J HARVEST  K HALO';
    const next = g.scythe.inputs.map(k => k === 'L' ? 'J' : 'K').join(' ');
    const width = Math.max(textWidth(label) + 10, next ? 86 : 0);
    prect(ctx, 4, 41, width, next ? 25 : 17, '#0d0a18f0');
    prect(ctx, 4, 41, 2, 17, ink);
    pfont(ctx, label, 9, 45, '#efe6ff');
    if (current) for (let i = 0; i < g.scythe.total; i++) prect(ctx, 9 + i * 10, 53, 8, 2, i < g.scythe.beat ? ink : '#3a3450');
    if (next) pfont(ctx, `NEXT ${next}`, 9, 58, '#b9a8e8');
    if (g.scythe.chainHits > 1) pfontO(ctx, `${g.scythe.chainHits}X REAP`, 8 + width, 45, ink, '#0d0a18');
  }
  // Kolom kanan turun sejauh tombol DOM (mute / jeda / senjata) agar tidak tertutup.
  const ty = 6 + g.hudInset;
  if (g.mode === 'survival') {
    const mm = Math.floor(g.survivalTime / 60), ss = Math.floor(g.survivalTime % 60);
    pfontO(ctx, `WAVE ${g.wave}`, VIEW_W - 6, ty, g.bossWaveActive ? '#ff2a2a' : '#ffffff', '#000', 2, 'right');
    pfont(ctx, `${mm}:${ss < 10 ? '0' : ''}${ss}`, VIEW_W - 6, ty + 13, pal.accent, 1, 'right');
    pfont(ctx, `${g.score}`, VIEW_W - 6, ty + 20, '#9a9a9a', 1, 'right');
    // wave progress bar (time) + incoming budget
    const bw = 60, bx = VIEW_W - 6 - bw, by = ty + 27;
    prect(ctx, bx - 1, by - 1, bw + 2, 4, '#000');
    prect(ctx, bx, by, Math.round(bw * clamp(g.waveT / g.waveLen, 0, 1)), 2, pal.accent2);
    const alive = g.enemies.filter((e) => !e.dead).length;
    pfont(ctx, `${alive} ON FIELD  +${g.waveBudget} INCOMING`, VIEW_W - 6, ty + 33, '#cfcfcf', 1, 'right');
    if (g.level.sideView) {
      const fl = officeFloorIndex(g.level, p.y);
      pfontO(ctx, `KANTOR LT ${fl}`, VIEW_W - 6, ty + 41, pal.accent2, '#000', 1, 'right');
      // Subtle off-screen left / right incoming enemy indicators
      let leftCnt = 0, rightCnt = 0;
      const halfVis = VIEW_W / (2 * Math.max(1, g.zoom));
      for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        if (e.x < p.x - halfVis * 0.9) leftCnt++;
        else if (e.x > p.x + halfVis * 0.9) rightCnt++;
      }
      if (leftCnt > 0) {
        pfontO(ctx, `< ${leftCnt}`, 10, VIEW_H / 2 - 4, Math.floor(g.time * 6) % 2 ? '#ff4b55' : '#ffd447', '#000', 1, 'left');
      }
      if (rightCnt > 0) {
        pfontO(ctx, `${rightCnt} >`, VIEW_W - 10, VIEW_H / 2 - 4, Math.floor(g.time * 6) % 2 ? '#ff4b55' : '#ffd447', '#000', 1, 'right');
      }
    }
  } else if (g.mode === 'team') {
    pfontO(ctx, 'TIM 20 VS 20', VIEW_W - 6, ty, '#ffffff', '#000', 1, 'right');
    pfont(ctx, `${g.score}`, VIEW_W - 6, ty + 9, '#9a9a9a', 1, 'right');
  } else {
    pfont(ctx, `LV ${g.levelN}/200`, VIEW_W - 6, ty, '#ffffff', 1, 'right');
    pfont(ctx, ZONES[g.level.zone].name, VIEW_W - 6, ty + 7, pal.accent, 1, 'right');
    pfont(ctx, `${g.score}`, VIEW_W - 6, ty + 14, '#9a9a9a', 1, 'right');
  }
  const boss = g.enemies.find((e) => e.boss && !e.dead);
  if (boss) {
    pfontO(ctx, boss.name, VIEW_W / 2, 5, '#ffffff', '#000', 1, 'center');
    const bw = 160, bx = VIEW_W / 2 - bw / 2, by = 12;
    prect(ctx, bx - 1, by - 1, bw + 2, 6, '#000');
    prect(ctx, bx, by, bw, 4, '#3a0a0a');
    prect(ctx, bx, by, Math.round((bw * Math.max(0, boss.hp)) / boss.maxHp), 4, boss.flash > 0 ? '#ffffff' : pal.accent2);
    prect(ctx, bx, by + 5, Math.round(bw * clamp(boss.structure / boss.maxStructure, 0, 1)), 1, boss.stagger > 0 ? '#ffffff' : '#ffd700');
  } else if ((g.state === 'playing' || g.state === 'paused') && g.mode === 'story') {
    const left = g.enemies.filter((e) => !e.dead).length + g.spawnQueue.length;
    if (left > 0) pfont(ctx, `ENEMIES ${left}`, VIEW_W / 2, 6, '#cfcfcf', 1, 'center');
    else if (g.exitOpen) pfont(ctx, Math.sin(g.time * 6) > 0 ? 'FIND THE EXIT' : '', VIEW_W / 2, 6, pal.accent, 1, 'center');
  } else if (g.mode === 'survival' && g.state === 'playing') {
    const br = g.brutality();
    const label = br < 0.2 ? 'WARMING UP' : br < 0.45 ? 'AGGRESSIVE' : br < 0.7 ? 'TACTICAL' : br < 0.95 ? 'BRUTAL' : 'MERCILESS';
    pfont(ctx, `AI: ${label}`, VIEW_W / 2, 6, br < 0.45 ? '#cfcfcf' : br < 0.95 ? '#ff9f43' : '#ff2a2a', 1, 'center');
  }
  // FINISH HIM prompt
  if (!p.fatality && g.state === 'playing' && g.finishTarget()) {
    if (Math.floor(g.time * 5) % 2 === 0) pfontO(ctx, 'FINISH HIM!  [F]', VIEW_W / 2, 14, '#ffd700', '#000', 1, 'center');
  }
  // FATALITY banner
  if (g.fatalityTextT > 0) {
    const el = 1.8 - g.fatalityTextT;
    const a = el < 0.08 ? el / 0.08 : g.fatalityTextT < 0.4 ? g.fatalityTextT / 0.4 : 1;
    const sc = el < 0.12 ? 6 : el < 0.2 ? 5 : 4;
    const shx = el < 0.35 ? rnd(-2, 2) : 0, shy = el < 0.35 ? rnd(-1, 1) : 0;
    ctx.globalAlpha = a * 0.6;
    prect(ctx, 0, 24, VIEW_W, 22 + (sc - 4) * 4, '#000');
    prect(ctx, 0, 24, VIEW_W, 1, '#ff1a1a'); prect(ctx, 0, 45 + (sc - 4) * 4, VIEW_W, 1, '#ff1a1a');
    ctx.globalAlpha = a;
    pfontO(ctx, 'FATALITY', VIEW_W / 2 + shx, 27 + shy, el < 0.2 ? '#ffffff' : '#ff1a1a', '#000', sc, 'center');
    ctx.globalAlpha = 1;
  }
  // Strip pengumuman: SATU tulisan kecil di pita atas (di bawah penghitung musuh),
  // ukurannya dibatasi & disesuaikan lebar layar supaya tidak pernah menutupi pertarungan.
  {
    // Kartu level sedang tampil? Tahan pengumuman supaya tetap SATU tulisan besar.
    const an = g.bannerT > 0 && g.mode === 'story' ? undefined : g.announce[0];
    if (an) {
      const k = an.t / an.max;
      const a = k < 0.1 ? k / 0.1 : k > 0.75 ? (1 - k) / 0.25 : 1;
      const slide = k < 0.1 ? (1 - k / 0.1) * -4 : 0;
      const maxW = 232;                                  // aman dari meter kiri & panel wave kanan
      let sc = Math.min(2, Math.max(1, Math.round(an.scale)));
      while (sc > 1 && textWidth(an.text, sc) > maxW) sc--;
      const y = 30 + (g.fatalityTextT > 0 ? 24 : 0);
      const w = Math.min(VIEW_W - 12, textWidth(an.text, sc) + 10);
      ctx.globalAlpha = a * 0.55;
      prect(ctx, VIEW_W / 2 - w / 2, y - 2 + slide, w, sc * 5 + 4, '#000');
      ctx.globalAlpha = a;
      pfontO(ctx, an.text, VIEW_W / 2, y + slide, an.c, '#000', sc, 'center');
      ctx.globalAlpha = 1;
    }
  }
  // age (story) / kills (survival)
  if (g.mode === 'survival' || g.mode === 'team') {
    pfont(ctx, `KILLS ${g.kills}`, 6, VIEW_H - 11, '#ff6b6b', 1);
  } else {
    const ageCol = g.age < 40 ? '#ffd700' : g.age < 60 ? '#ffa500' : '#ff3b3b';
    pcircle(ctx, 9, VIEW_H - 9, 3, ageCol);
    px(ctx, 9, VIEW_H - 9, '#000');
    pfont(ctx, `AGE ${g.age}`, 16, VIEW_H - 11, ageCol, 1);
    for (let i = 0; i < g.deathCounter; i++) prect(ctx, 16 + i * 3, VIEW_H - 4, 2, 2, '#ff3b3b');
  }
  // Petunjuk senjata: hanya sebentar setelah ganti senjata (atau saat mode teks FULL),
  // supaya layar tidak penuh tulisan permanen.
  const showWeaponHints = g.showHits || g.time - g.weaponEquipT < 9;
  if (p.fatality || !showWeaponHints) {
    /* no hints during the cinematic */
  } else if (g.boxOn && g.state === 'playing') {
    const d = g.boxDef;
    const nx = MOVES[g.box.peekHeavy()];
    pfontO(ctx, `LMB SPAM: SEMUA TEKNIK (TIDAK MEMATIKAN)`, 6, VIEW_H - 27, '#ffffff', '#000', 1);
    pfontO(ctx, `RMB: ${nx ? nx.name : 'FINISHER'} - HABISI`, 6, VIEW_H - 19, d.accent, '#000', 1);
  } else if (g.sfNunOn && g.state === 'playing') {
    pfontO(ctx, 'LMB HOLD: SWING / CROSS / SPIN / WHIP', 6, VIEW_H - 27, '#ffd27f', '#000', 1);
    pfontO(ctx, 'RMB WHIP CRACK   N: V1 / V2 / V3', 6, VIEW_H - 19, '#ff8b6a', '#000', 1);
  } else if (p.weapon !== 'pistol' && p.weapon !== 'rifle' && p.weapon !== 'bat' && p.comboStr && (p.attackPhase !== 'none' || p.comboTimer > 0)) {
    const root = p.weapon === 'nunchaku' ? 'N' : p.weapon === 'katana' ? 'K' : p.weapon === 'axe' ? 'A' : p.weapon === 'dual' ? 'D' : '';
    const nl = MOVES[p.comboStr + 'L'] ?? MOVES[root + 'L'], nh = MOVES[p.comboStr + 'H'] ?? MOVES[root + 'H'];
    pfontO(ctx, `LMB ${nl.name}`, 6, VIEW_H - 27, '#ffffff', '#000', 1);
    pfontO(ctx, `RMB ${nh.name}`, 6, VIEW_H - 19, pal.accent2, '#000', 1);
  } else if (p.weapon === 'takamura' && g.state === 'playing') {
    const ns = g.tak.nextStep();
    pfontO(ctx, `LMB ${ns.name}${g.tak.mode === 'step' ? '  (TAP TO CHAIN)' : ''}`, 6, VIEW_H - 27, ns.col, '#000', 1);
    pfontO(ctx, g.tak.mode === 'charge' ? (g.tak.chargeLevel >= 0.65 ? 'RELEASE: AMAKAKERU RYU NO HIRAMEKI' : 'KEEP HOLDING...') : 'RMB RYU SHO SEN   HOLD RMB = HIRAMEKI', 6, VIEW_H - 19, g.tak.mode === 'charge' ? (g.tak.chargeLevel >= 0.65 ? '#ff4d4d' : '#ffe66d') : '#bfe8ff', '#000', 1);
  } else if (p.weapon === 'yoyo' && g.state === 'playing') {
    if (g.yoyoVer === 2) {
      pfontO(ctx, 'LMB FREESTYLE COMBO   HOLD = AUTO CHAIN', 6, VIEW_H - 27, '#ffb84a', '#000', 1);
      pfontO(ctx, 'RMB ORBIT / DANCE   [8] SWAP V1', 6, VIEW_H - 19, '#ff6546', '#000', 1);
    } else {
      const nt = g.yoyo.nextTrick();
      const nb = g.yoyo.nextBreak();
      pfontO(ctx, `LMB ${nb.name}  (HOLD = FREESTYLE)`, 6, VIEW_H - 27, nb.col, '#000', 1);
      pfontO(ctx, `RMB ${nt.name}   [8] SWAP V2`, 6, VIEW_H - 19, nt.col, '#000', 1);
    }
  } else if (p.running && p.weapon === 'fist') {
    pfontO(ctx, p.tkdCd <= 0 ? 'LMB TAEKWONDO KICK   RMB FLYING KICK / STRAIGHT' : 'LMB STRAIGHT   RMB FLYING KICK', 6, VIEW_H - 19, p.tkdCd <= 0 ? '#ffe66d' : '#9a9a9a', '#000', 1);
  } else if (p.running && p.weapon === 'nunchaku') {
    pfontO(ctx, p.tkdCd <= 0 ? 'LMB DRAGON LASH' : 'LMB FLYING HELICOPTER', 6, VIEW_H - 19, p.tkdCd <= 0 ? '#ffe66d' : '#9a9a9a', '#000', 1);
  } else if (p.running && p.weapon === 'katana') {
    pfontO(ctx, p.tkdCd <= 0 ? 'LMB IAIJUTSU' : 'LMB DASH CUT', 6, VIEW_H - 19, p.tkdCd <= 0 ? '#bfe8ff' : '#9a9a9a', '#000', 1);
  } else if (p.weapon === 'bat' && g.state === 'playing') {
    pfontO(ctx, 'LMB HOLD: STREET COMBO / JUGGLE', 6, VIEW_H - 27, '#ffe66d', '#000', 1);
    pfontO(ctx, 'RMB SPIN   T TAUNT   G ACTION', 6, VIEW_H - 19, '#ffb347', '#000', 1);
  } else if (p.weapon === 'axe' && g.state === 'playing') {
    const flying = !g.lev.held;
    if (flying) {
      pfontO(ctx, 'LMB FISTS (AXE IN FLIGHT)', 6, VIEW_H - 27, '#ffffff', '#000', 1);
      pfontO(ctx, 'RMB RECALL', 6, VIEW_H - 19, '#bfe8ff', '#000', 1);
    } else {
      pfontO(ctx, 'RMB THROW   SHIFT+RMB LEAP SMASH', 6, VIEW_H - 19, '#ffb347', '#000', 1);
    }
  } else if (p.running && p.weapon === 'axe') {
    pfontO(ctx, p.tkdCd <= 0 ? 'LMB LEAPING SLAM' : 'LMB CHARGING CHOP', 6, VIEW_H - 19, p.tkdCd <= 0 ? '#ffb347' : '#9a9a9a', '#000', 1);
  } else if (p.running && p.weapon === 'dual') {
    pfontO(ctx, p.tkdCd <= 0 ? 'LMB PHANTOM CROSS' : 'LMB DASH SCISSOR', 6, VIEW_H - 19, p.tkdCd <= 0 ? '#bfe8ff' : '#9a9a9a', '#000', 1);
  }
  // shadow step cooldown pip
  {
    const cd = clamp(1 - p.dashCd / (0.55 * g.stats.dashCd), 0, 1);
    prect(ctx, 52, 13, 14, 3, '#1a1a2a');
    prect(ctx, 52, 13, Math.round(14 * cd), 3, cd >= 1 ? '#c7b3ff' : '#6a4fcf');
    pfont(ctx, 'STEP', 68, 12, cd >= 1 ? '#c7b3ff' : '#555', 1);
  }
  if (!p.fatality && g.fatTargetId >= 0 && !g.finishTarget()) pfontO(ctx, 'F  FATALITY', 6, VIEW_H - 35, Math.sin(g.time * 8) > 0 ? '#ff4d4d' : '#ff1a1a', '#000', 1);
  else if (!p.fatality && g.fatalityCd > 0) {
    prect(ctx, 6, VIEW_H - 34, 30, 3, '#2a0a0a');
    prect(ctx, 6, VIEW_H - 34, Math.round(30 * (1 - g.fatalityCd / 7)), 3, '#b30000');
    pfont(ctx, 'FATALITY', 38, VIEW_H - 35, '#5a3a3a', 1);
  }
  // Satu baris bantuan saja: kalau pemain belum menekan tombol, tampilkan ajakan WASD,
  // bukan daftar kontrol yang bertumpuk dengannya. Teks dipendekkan agar tidak menabrak AGE / tag V2.
  const needsKeys = !g.input.keyboardSeen && g.levelTime > 2.5;
  if (g.state === 'playing' && !needsKeys && g.levelN <= 2 && g.levelTime < 9 && g.bannerT <= 0) {
    ctx.globalAlpha = g.levelTime > 7.5 ? (9 - g.levelTime) / 1.5 : 1;
    pfontO(ctx, 'WASD RUN   SPACE JUMP   SHIFT DODGE   CLICK ATTACK   F FATALITY', VIEW_W / 2, VIEW_H - 14, '#ffffff', '#000', 1, 'center');
    ctx.globalAlpha = 1;
  }
  // keyboard focus diagnostics: the #1 reason "WASD does nothing" is that the page/iframe has no keyboard focus
  if (g.state === 'playing' && g.bannerT <= 0 && !inlineScreen) {
    const focused = g.input.hasFocus() || g.input.parentAttached > 0;
    if (!focused) {
      const pulse = Math.sin(g.time * 7) > 0;
      prect(ctx, 0, VIEW_H / 2 - 18, VIEW_W, 36, 'rgba(0,0,0,0.75)');
      prect(ctx, 0, VIEW_H / 2 - 19, VIEW_W, 1, '#ff3b3b'); prect(ctx, 0, VIEW_H / 2 + 18, VIEW_W, 1, '#ff3b3b');
      pfontO(ctx, 'KEYBOARD NOT FOCUSED', VIEW_W / 2, VIEW_H / 2 - 12, pulse ? '#ffffff' : '#ff3b3b', '#000', 2, 'center');
      pfontO(ctx, 'CLICK THE GAME ONCE TO ENABLE W A S D', VIEW_W / 2, VIEW_H / 2 + 5, '#ffffff', '#000', 1, 'center');
    } else if (!g.input.keyboardSeen && g.levelTime > 2.5) {
      pfontO(ctx, 'PRESS W A S D TO RUN', VIEW_W / 2, VIEW_H - 14, Math.sin(g.time * 5) > 0 ? '#ffffff' : '#ffd700', '#000', 1, 'center');
    }
  }
  if (p.chain >= 3) {
    const pulse = Math.sin(g.time * 30) > 0;
    pfontO(ctx, `${p.chain}`, p.x - g.cam.x + 14, p.y - g.cam.y - 30, pulse ? '#ffffff' : '#ffe66d', '#000', 2);
    pfontO(ctx, 'CHAIN', p.x - g.cam.x + 14, p.y - g.cam.y - 20, '#ffe66d', '#000', 1);
  }
  // RHYTHM / STYLE indicator (bottom centre): style name, heat bar, and a beat lane showing your last gaps
  if (p.weapon === 'fist' && (p.style !== 'none' || p.styleHeat > 0.02) && g.state === 'playing') {
    const cx = VIEW_W / 2, by = VIEW_H - 24;
    const name = p.style === 'wingchun' ? 'WING CHUN' : p.style === 'blackleg' ? 'BLACK LEG' : p.style === 'kungfu' ? 'KUNG FU' : '';
    const col = p.style === 'wingchun' ? '#ffe66d' : p.style === 'blackleg' ? '#ffb347' : p.style === 'kungfu' ? '#7cff6b' : '#9a9a9a';
    if (name) pfontO(ctx, `${name}  x${p.styleStreak}`, cx, by - 10, col, '#000', 1, 'center');
    // heat bar
    const hw = 60;
    prect(ctx, cx - hw / 2 - 1, by - 1, hw + 2, 5, '#000');
    prect(ctx, cx - hw / 2, by, hw, 3, '#1a1a1a');
    prect(ctx, cx - hw / 2, by, Math.round(hw * p.styleHeat), 3, p.styleHeat >= 0.99 ? (Math.sin(g.time * 14) > 0 ? '#ffffff' : '#ff6a00') : '#ff9f43');
    if (p.styleHeat >= 0.99) pfontO(ctx, 'IN THE ZONE', cx, by + 6, Math.sin(g.time * 10) > 0 ? '#ffffff' : '#ff6a00', '#000', 1, 'center');
    // beat lane: tempo zones FAST | MED | SLOW with a marker at your last gap
    const lx = cx - hw / 2, ly = by + 13, lw = hw;
    prect(ctx, lx, ly, Math.round(lw * 0.29), 1, '#ffe66d'); prect(ctx, lx + Math.round(lw * 0.29), ly, Math.round(lw * 0.3), 1, '#ffb347'); prect(ctx, lx + Math.round(lw * 0.59), ly, lw - Math.round(lw * 0.59), 1, '#7cff6b');
    const last = p.rhythm.length ? p.rhythm[p.rhythm.length - 1] : -1;
    if (last >= 0) { const mx = lx + Math.round(lw * clamp(last / 1.05, 0, 1)); prect(ctx, mx, ly - 2, 1, 5, '#ffffff'); }
  }
  if (g.combo > 1) {
    const tier = g.combo >= 50 ? 4 : g.combo >= 25 ? 3 : g.combo >= 12 ? 2 : g.combo >= 6 ? 1 : 0;
    const cols = ['#ffffff', '#ffe66d', '#ff9f43', '#ff3b3b', '#ff3df2'];
    const names = ['', 'GOOD', 'GREAT', 'BRUTAL', 'MASTER'];
    const sc = g.comboPop > 0 ? 3 : 2;
    pfontO(ctx, `${g.combo} HITS`, VIEW_W - 6, VIEW_H - 30, cols[tier], '#000', sc, 'right');
    if (tier > 0) pfontO(ctx, names[tier], VIEW_W - 6, VIEW_H - 16, cols[tier], '#000', 1, 'right');
    prect(ctx, VIEW_W - 6 - 44, VIEW_H - 8, 44, 2, '#222');
    prect(ctx, VIEW_W - 6 - 44, VIEW_H - 8, Math.round(44 * clamp(g.comboTimer / g.comboMax, 0, 1)), 2, cols[tier]);
  }
  // crosshair
  const mx = g.input.mouse.x, my = g.input.mouse.y;
  const cc = pal.accent;
  if (p.weapon === 'fist') {
    pring(ctx, mx, my, 3, cc, 1);
    px(ctx, mx, my, '#ffffff');
  } else {
    const gap = 3 + p.recoil * 5 + p.bloom * 40 + (p.moving ? 1.5 : 0);
    prect(ctx, mx - gap - 2, my, 3, 1, cc); prect(ctx, mx + gap, my, 3, 1, cc);
    prect(ctx, mx, my - gap - 2, 1, 3, cc); prect(ctx, mx, my + gap, 1, 3, cc);
    px(ctx, mx, my, '#ffffff');
  }
  if (g.hitMarkerT > 0) {
    const k = g.hitMarkerT / 0.14;
    const d = 4 + (1 - k) * 4;
    const c = g.hitMarkerKill ? '#ff3b3b' : '#ffffff';
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) pline(ctx, mx + sx * d, my + sy * d, mx + sx * (d + 3), my + sy * (d + 3), c, g.hitMarkerKill ? 2 : 1);
  }
}

export function drawVignette(ctx: Ctx, cache: { cv: HTMLCanvasElement | null }) {
  if (!cache.cv) {
    const cv = document.createElement('canvas');
    cv.width = VIEW_W; cv.height = VIEW_H;
    const c = cv.getContext('2d')!;
    const gr = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.72);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.7)');
    c.fillStyle = gr;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    cache.cv = cv;
  }
  ctx.drawImage(cache.cv, 0, 0);
}


/** HUD duel: hanya dua bilah nyawa, meter tempur ringkas, dan penanda ronde.
 *  Semua ornamen mode cerita (level, zona, umur, petunjuk tombol) disembunyikan
 *  supaya layar bersih dan adegan adu parry yang jadi pusat perhatian. */
function drawDuelHUD(ctx: Ctx, g: Game) {
  const p = g.player, pal = g.pal;
  const bw = 148, gap = 30, y = 9;
  const px2 = VIEW_W / 2 - gap / 2 - bw, bx2 = VIEW_W / 2 + gap / 2;
  const php = Math.max(0, p.hp / g.maxHp());
  const bhp = Math.max(0, g.duelHpNow);
  // bar bergaya baru: bingkai kaca, isi bergradasi, tick 10%, dan bar bayangan yang menyusut pelan saat kena damage
  const gh = g as unknown as { _dp?: number; _db?: number; _lowP?: number };
  if (gh._dp === undefined || gh._dp < php) gh._dp = php;
  if (gh._db === undefined || gh._db < bhp) gh._db = bhp;
  gh._dp = Math.max(php, gh._dp - 0.0042); gh._db = Math.max(bhp, gh._db - 0.0042);
  const frame = (x0: number, acc: string) => {
    prect(ctx, x0 - 2, y - 3, bw + 4, 13, 'rgba(4,5,10,0.78)');
    prect(ctx, x0 - 2, y - 3, bw + 4, 1, 'rgba(255,255,255,0.28)');
    prect(ctx, x0 - 2, y + 9, bw + 4, 1, 'rgba(0,0,0,0.9)');
    prect(ctx, x0 - 2, y - 3, 1, 13, 'rgba(255,255,255,0.12)');
    prect(ctx, x0 + bw + 1, y - 3, 1, 13, 'rgba(0,0,0,0.7)');
    prect(ctx, x0, y, bw, 7, '#1a1218');
    void acc;
  };
  frame(px2, '#7cff9b'); frame(bx2, g.duelFoe.accent);
  const fillBar = (x0: number, w: number, fromRight: boolean, col: string, hi: string, lo: string) => {
    if (w <= 0) return;
    const xs = fromRight ? x0 + bw - w : x0;
    prect(ctx, xs, y, w, 7, col);
    prect(ctx, xs, y, w, 2, hi);
    prect(ctx, xs, y + 5, w, 2, lo);
  };
  const pw = Math.round(bw * php), bwd = Math.round(bw * bhp);
  const gp = Math.round(bw * (gh._dp ?? php)), gb = Math.round(bw * (gh._db ?? bhp));
  // bayangan damage (kuning pucat)
  fillBar(px2, gp, true, '#e8c36a', '#fff0b8', '#a8863a');
  fillBar(bx2, gb, false, '#e8c36a', '#fff0b8', '#a8863a');
  const low = php <= 0.3, pulse = low && Math.sin(g.time * 10) > 0;
  fillBar(px2, pw, true, low ? (pulse ? '#ffffff' : '#ff5a5a') : '#52e07e', low ? '#ffb0b0' : '#b8ffcb', low ? '#a02030' : '#238a49');
  fillBar(bx2, bwd, false, g.duelFoe.accent, 'rgba(255,255,255,0.45)', 'rgba(0,0,0,0.35)');
  for (let i = 1; i < 10; i++) { prect(ctx, px2 + Math.round((bw * i) / 10), y + 5, 1, 2, 'rgba(0,0,0,0.45)'); prect(ctx, bx2 + Math.round((bw * i) / 10), y + 5, 1, 2, 'rgba(0,0,0,0.45)'); }
  // struktur/postur: garis tipis di bawah bilah
  const bs = g.duelBoss;
  if (bs && !bs.dead) {
    const st = Math.max(0, Math.min(1, bs.structure / bs.maxStructure));
    prect(ctx, bx2, y + 8, bw, 1, 'rgba(255,255,255,0.12)');
    prect(ctx, bx2, y + 8, Math.round(bw * st), 1, bs.stagger > 0 ? '#ffffff' : '#ffd700');
  }
  // label nama dengan chip warna
  prect(ctx, px2, y + 11, 2, 7, '#7cff9b'); pfont(ctx, 'KAMU', px2 + 5, y + 12, '#7cff9b', 1);
  prect(ctx, bx2 + bw - 2, y + 11, 2, 7, g.duelFoe.accent); pfont(ctx, g.duelFoe.name, bx2 + bw - 5, y + 12, g.duelFoe.accent, 1, 'right');
  // penanda ronde di tengah: lencana berlian
  const cx = VIEW_W / 2, cy = y + 3;
  prect(ctx, cx - 13, cy - 6, 26, 13, 'rgba(4,5,10,0.85)');
  prect(ctx, cx - 13, cy - 6, 26, 1, 'rgba(255,255,255,0.3)'); prect(ctx, cx - 13, cy + 6, 26, 1, 'rgba(0,0,0,0.9)');
  prect(ctx, cx - 13, cy - 6, 2, 13, g.duelFoe.accent); prect(ctx, cx + 11, cy - 6, 2, 13, g.duelFoe.accent);
  pfont(ctx, `${g.duelRound}/${g.duelTotal}`, cx, cy - 3, '#ffffff', 1, 'center');

  // meter tempur ringkas di kiri bawah — fokus, rage, OFA
  const mx = 8, my = VIEW_H - 26;
  prect(ctx, mx - 4, my - 4, 70, 22, 'rgba(4,5,10,0.6)'); prect(ctx, mx - 4, my - 4, 70, 1, 'rgba(255,255,255,0.2)'); prect(ctx, mx - 4, my + 17, 70, 1, 'rgba(0,0,0,0.8)'); prect(ctx, mx - 4, my - 4, 1, 22, pal.accent);
  for (let i = 0; i < 3; i++) {
    const f = clamp(p.focus - i * 100, 0, 100) / 100;
    prect(ctx, mx + i * 13, my, 11, 3, '#0f2a33');
    if (f > 0) prect(ctx, mx + i * 13, my, Math.max(1, Math.round(11 * f)), 3, f >= 1 ? '#9ff8ff' : '#1aa8b8');
  }
  prect(ctx, mx, my + 5, 37, 3, '#2a0a0a');
  prect(ctx, mx, my + 5, Math.round(37 * clamp(p.rage / 100, 0, 1)), 3, p.rageOn ? '#ffffff' : '#b31b1b');
  prect(ctx, mx, my + 10, 37, 3, '#0a222c');
  prect(ctx, mx, my + 10, Math.round(37 * clamp(p.ofa / 100, 0, 1)), 3, p.ofaActive ? '#ffffff' : '#57e6ff');
  // senjata aktif: ikon saja, tanpa teks
  weaponIcon(ctx, mx + 44, my + 4, p.weapon, '#ffffff');

  // panji ronde: hanya judul lawan, singkat, lalu hilang
  if (g.duelBannerT > 0) {
    const al = Math.min(1, g.duelBannerT / 0.6);
    ctx.globalAlpha = al * 0.72;
    const tw = textWidth(g.duelFoe.title, 2) + 16;
    prect(ctx, VIEW_W / 2 - tw / 2, 30, tw, 16, '#000');
    ctx.globalAlpha = al;
    pfontO(ctx, g.duelFoe.title, VIEW_W / 2, 34, g.duelFoe.accent, '#000', 2, 'center');
    ctx.globalAlpha = 1;
  }
  // petunjuk satu baris hanya di 6 detik pertama
  if (g.duelBannerT > 0 || g.levelTime < 6) {
    ctx.globalAlpha = g.levelTime > 4.5 ? Math.max(0, (6 - g.levelTime) / 1.5) : 1;
    pfontO(ctx, 'KLIK = SATU TEBASAN   LEPAS = DIA MENEBAS', VIEW_W / 2, VIEW_H - 12, '#ffffff', '#000', 1, 'center');
    ctx.globalAlpha = 1;
  }
  void pal;
}
