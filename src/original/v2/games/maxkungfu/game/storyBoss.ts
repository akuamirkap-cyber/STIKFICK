import { pcircle, pfontO, prect, type Ctx } from './pixel';
import { DUEL_LADDER, type DuelFoe } from './duel';
import { makeWeaponBoss, type TechId } from './enemyWield';
import { makeSmart } from './smartBoss';
import type { Enemy, WeaponKind } from './types';
import { clamp } from './rng';

/**
 * MODE STORY — tiap wave diakhiri BOS yang memakai senjata berikutnya. Kalahkan dia -> senjatanya terbuka.
 * Mulai hanya dengan tangan kosong (fist).
 */
type G = any;
export interface StoryStage {
  weapon: WeaponKind; label: string; boss: string;
  mode: 'smart' | 'duel' | 'wield';
  smart?: { w: 'pistol' | 'rifle' | 'shotgun' | 'bow'; skill: number; tint: string };
  duelIdx?: number;
  wield?: { kind: string; techs: TechId[]; tint: string; skill: number };
}
export const STORY: StoryStage[] = [
  { weapon: 'pistol', label: 'PISTOL', boss: 'JAGOAN PISTOL', mode: 'smart', smart: { w: 'pistol', skill: 0.7, tint: '#ff8a6a' } },
  { weapon: 'rifle', label: 'RIFLE', boss: 'PENEMBAK RIFLE', mode: 'smart', smart: { w: 'rifle', skill: 0.75, tint: '#ffd27a' } },
  { weapon: 'bat', label: 'BASEBALL', boss: 'PEMUKUL JALANAN', mode: 'wield', wield: { kind: 'bat', techs: ['sweep', 'reverse', 'taishan', 'whirl', 'thrust'], tint: '#ffb347', skill: 0.8 } },
  { weapon: 'shotgun', label: 'SHOTGUN', boss: 'TUKANG SHOTGUN', mode: 'smart', smart: { w: 'shotgun', skill: 0.82, tint: '#ff7a6a' } },
  { weapon: 'nunchaku', label: 'NUNCHAKU', boss: 'RENGGA', mode: 'duel', duelIdx: 0 },
  { weapon: 'katana', label: 'KATANA', boss: 'KAORI SANG SAMURAI', mode: 'wield', wield: { kind: 'katana', techs: ['thrust', 'sweep', 'reverse', 'moon'], tint: '#c9a4ff', skill: 0.7 } },
  { weapon: 'axe', label: 'KAPAK', boss: 'SI PENEBANG', mode: 'wield', wield: { kind: 'axe', techs: ['taishan', 'sweep', 'twirl'], tint: '#ffb347', skill: 0.66 } },
  { weapon: 'dual', label: 'PEDANG KEMBAR', boss: 'SASUKE', mode: 'wield', wield: { kind: 'dual', techs: ['twirl', 'sweep', 'reverse', 'whirl'], tint: '#7fd6ff', skill: 0.8 } },
  { weapon: 'bow', label: 'PANAH', boss: 'PEMANAH BAYANGAN', mode: 'smart', smart: { w: 'bow', skill: 0.86, tint: '#9ff0ff' } },
  { weapon: 'boxing', label: 'BOXING', boss: 'IRON JAW', mode: 'duel', duelIdx: 4 },
  { weapon: 'buster', label: 'BUSTER SWORD', boss: 'JENDERAL PEDANG', mode: 'wield', wield: { kind: 'buster', techs: ['taishan', 'moon', 'whirl', 'sweep'], tint: '#7dffc8', skill: 0.86 } },
  { weapon: 'guandao', label: 'GUAN DAO', boss: 'GURU TOMBAK', mode: 'wield', wield: { kind: 'guandao', techs: ['sweep', 'reverse', 'twirl', 'thrust', 'taishan', 'moon', 'whirl'], tint: '#5dffa0', skill: 0.95 } },
];

export function spawnStoryBoss(g: G, idx: number): Enemy | null {
  const st = STORY[idx];
  if (!st) return null;
  const p = g.player;
  const pos = g.randomFloorNear(p.x, p.y, 100, 175) ?? g.randomFloorNear(p.x, p.y, 60, 9999) ?? { x: p.x + 90, y: p.y };
  const hp = Math.round((90 + idx * 18) * 1.5);
  let e: Enemy;
  if (st.mode === 'smart') {
    e = g.spawnEnemyAt('gunner', pos.x, pos.y, true);
    Object.assign(e, { name: st.boss, hp: hp + 20, maxHp: hp + 20, maxStructure: hp, structure: 0, scale: 1.2, value: 400, color: st.smart!.tint, color2: '#ffffff' });
    makeSmart(e, st.smart!.w, st.smart!.skill, st.smart!.tint);
  } else if (st.mode === 'duel') {
    const base = DUEL_LADDER[st.duelIdx!];
    const foe: DuelFoe = { ...base, classic: base.weapon === 'nunchaku', skill: Math.min(1, base.skill + 0.14), aggression: 1 };
    e = g.spawnEnemyAt('duelist', pos.x, pos.y, false);
    Object.assign(e, { name: foe.name, color: foe.color, color2: foe.color2, scale: 1.1, maxHp: Math.round(foe.hp * 1.5), hp: Math.round(foe.hp * 1.5), maxStructure: foe.hp * 0.8, weapon: foe.weapon, speed: 100 + foe.skill * 42, accessory: 'band', eyeStyle: 'white', value: 400 });
    g.duelFoe = foe; g.brain.reset(foe, e.x, e.y); g.brain.clashCd = 999; g.duelBoss = e; g.bossExchange.reset();
  } else {
    e = g.spawnEnemyAt('thug', pos.x, pos.y, false);
    const w = st.wield!;
    makeWeaponBoss(g, e, { kind: w.kind, techs: w.techs, skill: w.skill, tint: w.tint, name: st.boss, hp: hp + 30 });
  }
  e.spawnT = 1.0;
  (e as unknown as { sboss: number }).sboss = idx;
  return e;
}

/** bar nyawa bos story + petunjuk tujuan di tengah atas */
export function drawStoryHud(ctx: Ctx, g: G, VIEW_W: number) {
  if (!g.campaign || g.state !== 'playing') return;
  const st = STORY[g.campStage];
  const cx = Math.round(VIEW_W / 2);
  const boss = g.campPhase === 'boss' ? g.enemies.find((e: Enemy) => e.id === g.campBossId && !e.dead) : null;
  if (boss && st) {
    const w = 150, x = cx - w / 2, y = 24;
    prect(ctx, x - 3, y - 3, w + 6, 14, 'rgba(4,5,10,0.82)');
    prect(ctx, x - 3, y - 3, w + 6, 1, 'rgba(255,255,255,0.3)'); prect(ctx, x - 3, y + 10, w + 6, 1, 'rgba(0,0,0,0.9)');
    prect(ctx, x - 3, y - 3, 2, 14, '#ffd447'); prect(ctx, x + w + 1, y - 3, 2, 14, '#ffd447');
    prect(ctx, x, y, w, 7, '#1a1218');
    const hp = clamp(boss.hp / boss.maxHp, 0, 1);
    prect(ctx, x, y, Math.round(w * hp), 7, '#ffd447'); prect(ctx, x, y, Math.round(w * hp), 2, 'rgba(255,255,255,0.5)'); prect(ctx, x, y + 5, Math.round(w * hp), 2, 'rgba(0,0,0,0.3)');
    for (let i = 1; i < 10; i++) prect(ctx, x + Math.round((w * i) / 10), y + 5, 1, 2, 'rgba(0,0,0,0.45)');
    pfontO(ctx, `BOS ${g.campStage + 1}/${STORY.length}  ${st.boss}`, cx, y + 12, '#ffffff', '#000', 1, 'center');
    pfontO(ctx, `MENANG = SENJATA ${st.label}`, cx, y + 22, '#ffd447', '#000', 1, 'center');
  } else if (st) {
    const t = `STORY ${g.campStage + 1}/${STORY.length}   BOS BERIKUTNYA MEMBAWA ${st.label}`;
    pfontO(ctx, t, cx, 8, '#ffd447', '#000', 1, 'center');
    pcircle(ctx, cx - 3, 20, 0.8, '#ffd447');
  }
}
