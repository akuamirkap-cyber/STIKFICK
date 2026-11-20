import type { Game } from './game';
import type { Level } from './level';
import { MOVES } from './moves';
import { OT_AIR, officeTileAt } from './office';
import { TILE } from './constants';

type Door = { ceil: number; x: number; y: number; state: 'closed' | 'open' | 'broken'; push: number; swing: number; side: number; shake: number };
type Room = { x0: number; x1: number; y: number; ceil: number; name: string; tint: string };
const ROOM_NAMES = ['RUANG RAPAT', 'HRD', 'GUDANG', 'PANTRY', 'R. DIREKTUR', 'IT SUPPORT', 'ARSIP', 'KEUANGAN', 'LOUNGE', 'SERVER'];
const ROOM_TINTS = ['rgba(90,140,200,0.10)', 'rgba(200,150,80,0.10)', 'rgba(120,190,120,0.09)', 'rgba(190,100,140,0.09)', 'rgba(160,160,170,0.08)'];
type Panel = { x: number; y: number; vx: number; vy: number; rot: number; spin: number; life: number; hit: number[]; grounded: boolean };

const DOOR_H = 26;

/** Pintu kantor (side view): menghalangi jalan, bisa dibuka pelan atau DIDOBRAK hingga daun pintu terpental menghantam musuh. */
export class OfficeDoors {
  doors: Door[] = [];
  panels: Panel[] = [];
  rooms: Room[] = [];
  private level: Level | null = null;

  private build(g: Game) {
    this.level = g.level; this.doors = []; this.panels = []; this.rooms = [];
    const l = g.level;
    if (!l.sideView || !l.officeTiles) return;
    const byY = new Map<number, number[]>();
    for (const t of l.floorTiles) { const a = byY.get(t.y) ?? []; a.push(t.x); byY.set(t.y, a); }
    const avoid = [l.spawn, ...(l.leftSpawns ?? []), ...(l.rightSpawns ?? [])];
    for (const [y, xs] of byY) {
      xs.sort((a, b) => a - b);
      let last = -1e9;
      for (const x of xs) {
        if (x - last < TILE * 9) continue;
        const tx = Math.floor(x / TILE), ty = y / TILE - 1;
        let clear = true;
        // butuh ruang kosong 2 tile tinggi & 3 tile lebar (bukan tangga / lift / tembok)
        for (let dx = -1; dx <= 1 && clear; dx++) for (let dy = 0; dy < 2; dy++) if (officeTileAt(l, tx + dx, ty - dy) !== OT_AIR) { clear = false; break; }
        if (!clear) continue;
        if (avoid.some((s) => Math.abs(s.x - x) < 56 && Math.abs(s.y - y) < 30)) continue;
        if (x < TILE * 5 || x > (l.w - 5) * TILE) continue;
        let ceil = y - DOOR_H - 4;
        for (let cy = ty - 2; cy > 0; cy--) { if (officeTileAt(l, tx, cy) !== OT_AIR) { ceil = (cy + 1) * TILE; break; } }
        this.doors.push({ ceil, x, y, state: 'closed', push: 0, swing: 0, side: 1, shake: 0 });
        last = x;
      }
    }
    // ruangan = ruas lantai di antara dua pintu (berselang-seling warna & nama)
    const floors = new Map<number, Door[]>();
    for (const d of this.doors) { const a = floors.get(d.y) ?? []; a.push(d); floors.set(d.y, a); }
    let k = 0;
    for (const [y, ds] of floors) {
      ds.sort((a, b) => a.x - b.x);
      for (let i = 0; i < ds.length; i++) {
        const x0 = ds[i].x + 5;
        let x1 = i + 1 < ds.length ? ds[i + 1].x - 5 : x0 + TILE * 8;
        // hentikan ruangan di tembok / tangga terdekat
        for (let x = x0; x < x1; x += TILE) if (officeTileAt(l, Math.floor(x / TILE), y / TILE - 1) !== OT_AIR) { x1 = x; break; }
        if (x1 - x0 > TILE * 2) this.rooms.push({ x0, x1, y, ceil: ds[i].ceil, name: ROOM_NAMES[k % ROOM_NAMES.length], tint: ROOM_TINTS[k % ROOM_TINTS.length] });
        k++;
      }
    }
  }

  /** Latar ruangan (di belakang karakter): warna dinding tiap ruang + papan nama. */
  drawBack(g: Game, ctx: CanvasRenderingContext2D) {
    if (!g.level.sideView || this.level !== g.level) return;
    for (const r of this.rooms) {
      ctx.fillStyle = r.tint; ctx.fillRect(r.x0, r.ceil, r.x1 - r.x0, r.y - r.ceil);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(r.x0, r.y - 6, r.x1 - r.x0, 6); // plint
    }
    for (const d of this.doors) {
      // tembok sekat penuh dari lantai ke langit-langit (pintu adalah satu-satunya jalan masuk)
      const X = Math.round(d.x), Y = Math.round(d.y);
      ctx.fillStyle = '#3b3833'; ctx.fillRect(X - 7, d.ceil, 14, Y - d.ceil);
      ctx.fillStyle = '#4c4842'; ctx.fillRect(X - 6, d.ceil, 12, Y - d.ceil);
      ctx.fillStyle = '#5a564f'; ctx.fillRect(X - 6, d.ceil, 1, Y - d.ceil);
      ctx.fillStyle = '#151311'; ctx.fillRect(X - 5, Y - DOOR_H, 10, DOOR_H); // lubang pintu gelap
    }
  }

  drawLabels(ctx: CanvasRenderingContext2D) {
    ctx.font = '5px monospace'; ctx.textAlign = 'center';
    for (const r of this.rooms) {
      const cx = Math.round(r.x0 + 26), cy = Math.round(r.y - DOOR_H - 7);
      const w = Math.min(46, r.name.length * 3.2 + 6);
      ctx.fillStyle = '#1d2630'; ctx.fillRect(cx - w / 2, cy - 5, w, 7);
      ctx.fillStyle = '#cfe3ff'; ctx.fillText(r.name, cx, cy + 0.5);
    }
    ctx.textAlign = 'left';
  }

  update(g: Game, dt: number) {
    if (this.level !== g.level) this.build(g);
    if (!g.level.sideView) return;
    const p = g.player;
    for (const d of this.doors) {
      d.shake = Math.max(0, d.shake - dt);
      if (d.state === 'open') { d.swing = Math.min(1, d.swing + dt * 5); continue; }
      if (d.state !== 'closed') continue;
      // ---- PEMAIN
      if (Math.abs(p.y - d.y) < 6) {
        const dx = p.x - d.x, side = dx >= 0 ? 1 : -1;
        const mv = p.attackPhase === 'active' && p.moveKey ? MOVES[p.moveKey] : null;
        const facingDoor = Math.sign(d.x - p.x) === Math.sign(p.facing || 1);
        const fast = Math.abs(p.vx + p.kx) > 150 || p.dashT > 0;
        if (mv && facingDoor && Math.abs(dx) < (mv.range ?? 20) + 8) { this.breakDoor(g, d, -side, mv.kb ?? 300); continue; }
        if (Math.abs(dx) < p.r + 2) {
          if (fast && facingDoor) { this.breakDoor(g, d, -side, 360); continue; }
          p.x = d.x + side * (p.r + 2); p.kx = 0; if (Math.sign(p.vx) === -side) p.vx = 0;
          d.push += dt;
          if (d.push > 0.45) { d.state = 'open'; d.side = -side; g.sfx.footstep(1); }
        } else d.push = Math.max(0, d.push - dt);
      }
      // ---- MUSUH: tertahan, lalu membuka pintu pelan-pelan
      for (const e of g.enemies) {
        if (e.dead || e.spawnT > 0 || Math.abs(e.y - d.y) > 6) continue;
        const dx = e.x - d.x;
        if (Math.abs(dx) >= e.r + 2) continue;
        const side = dx >= 0 ? 1 : -1;
        if (Math.hypot(e.kx, e.ky) > 220) { this.breakDoor(g, d, -side, 260); break; } // musuh terpental menjebol pintu
        e.x = d.x + side * (e.r + 2); e.kx = 0;
        if (Math.random() < dt * 1.6) { d.state = 'open'; d.side = -side; }
      }
    }
    // ---- daun pintu yang terpental
    for (const pn of this.panels) {
      pn.life -= dt;
      if (!pn.grounded) {
        pn.x += pn.vx * dt; pn.y += pn.vy * dt; pn.vy += 260 * dt; pn.rot += pn.spin * dt;
        pn.vx *= Math.exp(-0.9 * dt);
        const fy = this.floorBelow(g.level, pn.x, pn.y);
        if (pn.y >= fy - 2) { pn.y = fy - 2; if (Math.abs(pn.vx) < 90) { pn.grounded = true; pn.rot = Math.PI / 2; g.sfx.land(); g.particles.smoke(pn.x, fy, 4, '#8a8378', 20, 0.3); } else { pn.vy = -Math.abs(pn.vy) * 0.25; pn.vx *= 0.7; } }
        if (officeTileAt(g.level, Math.floor((pn.x + Math.sign(pn.vx) * 8) / TILE), Math.floor((pn.y - 4) / TILE)) !== OT_AIR && officeTileAt(g.level, Math.floor((pn.x + Math.sign(pn.vx) * 8) / TILE), Math.floor((pn.y - 4) / TILE)) !== 3) { pn.vx *= -0.3; }
        const sp = Math.abs(pn.vx);
        if (sp > 110) for (const e of g.enemies) {
          if (e.dead || e.spawnT > 0 || pn.hit.includes(e.id)) continue;
          if (Math.abs(e.x - pn.x) > e.r + 9 || Math.abs((e.y - 7) - pn.y) > 14) continue;
          pn.hit.push(e.id);
          const dir = pn.vx >= 0 ? 0 : Math.PI;
          g.damageEnemy(e, 5 + Math.random() * 3, 45, dir, Math.min(520, sp * 1.1), { knockdown: true, hitstop: 0.05, shake: 0.4, melee: false });
          if (!e.dead && !e.boss) e.dkFly = { t: 0.5, dir, hit: [e.id], gen: 1 };
          g.texts.hit(e.x, e.y - 24, 'DOOR SLAM!', '#ffcf7a', 1, 0.55);
          g.particles.spark(e.x, e.y - 8, 10, '#ffcf7a', dir, 1, 200);
          g.sfx.slam();
          pn.vx *= 0.72;
        }
      }
    }
    this.panels = this.panels.filter((pn) => pn.life > 0);
  }

  private floorBelow(l: Level, x: number, y: number) {
    const tx = Math.floor(x / TILE);
    for (let ty = Math.max(0, Math.floor((y - 2) / TILE)); ty < l.h; ty++) {
      const t = officeTileAt(l, tx, ty);
      if (t !== OT_AIR && t !== 3) return ty * TILE;
    }
    return l.h * TILE;
  }

  private breakDoor(g: Game, d: Door, dirSign: number, power: number) {
    d.state = 'broken';
    const vx = dirSign * Math.max(380, Math.min(620, power * 1.05));
    this.panels.push({ x: d.x, y: d.y - DOOR_H / 2, vx, vy: -60, rot: 0, spin: dirSign * 9, life: 7, hit: [], grounded: false });
    g.say('DOOR BREAK!', '#ffcf7a', 2, 0.6);
    g.sfx.slam(); g.sfx.heavy();
    g.shake(0.55); g.hitstop = Math.max(g.hitstop, 0.06);
    g.particles.burst(d.x, d.y - DOOR_H / 2, 16, '#a8743f', 200, 0.5, 2, 2);
    g.particles.smoke(d.x, d.y - 4, 6, '#9a9184', 26, 0.4);
  }

  draw(g: Game, ctx: CanvasRenderingContext2D) {
    if (!g.level.sideView) return;
    for (const d of this.doors) {
      const X = Math.round(d.x), Y = Math.round(d.y);
      // tembok di atas kusen (depan karakter) supaya terasa masuk lewat lubang pintu
      ctx.fillStyle = '#4c4842'; ctx.fillRect(X - 7, d.ceil, 14, Y - DOOR_H - 3 - d.ceil);
      ctx.fillStyle = '#5a564f'; ctx.fillRect(X - 7, d.ceil, 1, Y - DOOR_H - 3 - d.ceil); ctx.fillRect(X + 6, d.ceil, 1, Y - DOOR_H - 3 - d.ceil);
      // kusen
      ctx.fillStyle = '#2a2622';
      ctx.fillRect(X - 7, Y - DOOR_H - 3, 14, 3);
      ctx.fillRect(X - 7, Y - DOOR_H, 2, DOOR_H);
      ctx.fillRect(X + 5, Y - DOOR_H, 2, DOOR_H);
      if (d.state === 'broken') {
        ctx.fillStyle = '#6b4626';
        ctx.fillRect(X - 5, Y - DOOR_H, 2, 4); ctx.fillRect(X + 3, Y - 6, 2, 6);
        continue;
      }
      const sh = d.shake > 0 ? Math.round(Math.sin(d.shake * 80)) : 0;
      if (d.state === 'open') {
        const w = Math.max(2, Math.round(10 * (1 - d.swing * 0.8)));
        const x0 = d.side > 0 ? X - 5 : X + 5 - w;
        ctx.fillStyle = '#8c5a2e'; ctx.fillRect(x0, Y - DOOR_H, w, DOOR_H);
        ctx.fillStyle = '#5e3b1d'; ctx.fillRect(x0, Y - DOOR_H, 1, DOOR_H);
        continue;
      }
      ctx.fillStyle = '#9a6634'; ctx.fillRect(X - 5 + sh, Y - DOOR_H, 10, DOOR_H);
      ctx.fillStyle = '#7a4d26'; ctx.fillRect(X - 4 + sh, Y - DOOR_H + 3, 8, 8); ctx.fillRect(X - 4 + sh, Y - DOOR_H + 14, 8, 9);
      ctx.fillStyle = '#c99a5b'; ctx.fillRect(X - 5 + sh, Y - DOOR_H, 10, 1);
      ctx.fillStyle = '#ffd77a'; ctx.fillRect(X + 2 + sh, Y - 13, 2, 2);
    }
    this.drawLabels(ctx);
    for (const pn of this.panels) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, pn.life / 1.2);
      ctx.translate(Math.round(pn.x), Math.round(pn.y));
      ctx.rotate(pn.rot);
      ctx.fillStyle = '#9a6634'; ctx.fillRect(-5, -DOOR_H / 2, 10, DOOR_H);
      ctx.fillStyle = '#7a4d26'; ctx.fillRect(-4, -DOOR_H / 2 + 3, 8, 8); ctx.fillRect(-4, -DOOR_H / 2 + 14, 8, 9);
      ctx.fillStyle = '#ffd77a'; ctx.fillRect(2, 0, 2, 2);
      ctx.restore();
    }
  }
}
