import { FOOT_PRACTICE, type FootPracticeRoute } from '../data';
import type { FootKey } from '../original/v2/games/maxkungfu/game/footwork';

export class FootPractice {
  route: FootPracticeRoute = 'flow';
  progress = 0;
  best = 0;
  sequence = 0;
  stance = false;

  constructor(route: FootPracticeRoute = 'flow') { this.route = route; }

  select(route: FootPracticeRoute) {
    this.route = route;
    this.reset();
  }

  reset() { this.progress = 0; this.stance = false; this.sequence++; }

  hit(key: FootKey | null, hits: number, beat = -1) {
    this.best = Math.max(this.best, hits);
    if (!key) return;
    if (hits === 1 && !this.complete) this.progress = 0;
    const expected: readonly string[] = FOOT_PRACTICE[this.route].moves;
    if (this.route === 'flamingo' && key === 'FT_FL_DOUBLE') {
      this.progress = beat === 0 ? 1 : beat === 1 && this.progress === 1 ? 2 : 0;
      return;
    }
    if (this.progress < expected.length && key === expected[this.progress]) this.progress++;
    else if (key === expected[0]) this.progress = 1;
    else if (this.progress < expected.length) this.progress = 0;
  }

  readStance(active: boolean) { this.stance = active; }

  get complete() { return this.progress === FOOT_PRACTICE[this.route].moves.length; }
}