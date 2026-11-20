import { prect, pfont, pfontO, type Ctx } from './pixel';

const BLUE = '#4aa8ff', RED = '#ff4a4a';
type G = any;
/** papan skor tim di tengah atas: jumlah anggota tiap tim */
export function drawTeamHud(ctx: Ctx, g: G, VIEW_W: number) {
  if (g.mode !== 'team' || (g.state !== 'playing' && g.state !== 'paused' && g.state !== 'victory')) return;
  const T = g.team;
  const b: number = T.blueAlive(g), r: number = T.redAlive(g);
  const cx = Math.round(VIEW_W / 2), y = 4, half = 62;
  prect(ctx, cx - half - 3, y - 2, half * 2 + 6, 22, 'rgba(4,5,10,0.78)');
  prect(ctx, cx - half - 3, y - 2, half * 2 + 6, 1, 'rgba(255,255,255,0.3)');
  prect(ctx, cx - half - 3, y + 19, half * 2 + 6, 1, 'rgba(0,0,0,0.9)');
  prect(ctx, cx - half - 3, y - 2, 2, 22, BLUE); prect(ctx, cx + half + 1, y - 2, 2, 22, RED);
  pfontO(ctx, `${b}`, cx - 24, y + 1, BLUE, '#000', 2, 'right');
  pfontO(ctx, `${r}`, cx + 24, y + 1, RED, '#000', 2, 'left');
  pfont(ctx, 'VS', cx, y + 3, '#ffffff', 1, 'center');
  const bw = half - 4;
  prect(ctx, cx - bw - 1, y + 14, bw, 3, '#101826'); prect(ctx, cx + 1, y + 14, bw, 3, '#261010');
  const bf = Math.round(bw * Math.max(0, Math.min(1, b / 20))), rf = Math.round(bw * Math.max(0, Math.min(1, r / 20)));
  prect(ctx, cx - 1 - bf, y + 14, bf, 3, BLUE); prect(ctx, cx + 1, y + 14, rf, 3, RED);
}
