// MENARA KANTOR — model peta side view.
// Peta = grid petak 16px. Tinggi peta selalu kelipatan STORY (1 lantai = 4 baris ruang + 1 baris pelat beton).

export const T = 16;
export const STORY = 5;

export interface OfficeMap {
  name: string; w: number; h: number; rows: string[]; roof: boolean;
  /** tema per lantai (indeks lantai dari atas). Kosong = siklus bawaan */
  themes?: string[];
  /** nomor lantai terbawah (gedung pencakar langit: level tinggi = lantai tinggi) */
  floorBase?: number;
}

export type ThemeId = 'lobby' | 'cubicle' | 'server' | 'meeting' | 'exec' | 'pantry' | 'gym' | 'archive' | 'lab' | 'lounge' | 'security' | 'roof';
export interface Theme {
  id: ThemeId;
  name: string; wall: string; wall2: string; panel: string; trim: string; floor: string; floorTop: string; light: string; accent: string; outdoor?: boolean;
}

export const THEMES: Record<ThemeId, Theme> = {
  lobby: { id: 'lobby', name: 'LOBI UTAMA', wall: '#3a3f57', wall2: '#2c3045', panel: '#4a5070', trim: '#d4af5a', floor: '#3b3a40', floorTop: '#cfc6b4', light: '#ffe6b0', accent: '#ffd166' },
  cubicle: { id: 'cubicle', name: 'RUANG KUBIKEL', wall: '#35504f', wall2: '#2a403f', panel: '#46625f', trim: '#7fa09a', floor: '#2b2f3a', floorTop: '#4c5f80', light: '#e6fbff', accent: '#5ff0d0' },
  server: { id: 'server', name: 'RUANG SERVER', wall: '#1a2233', wall2: '#131a28', panel: '#222d44', trim: '#2f8fff', floor: '#22262f', floorTop: '#5a6578', light: '#9fd0ff', accent: '#3aa0ff' },
  meeting: { id: 'meeting', name: 'RUANG RAPAT', wall: '#4d3b33', wall2: '#3e2f29', panel: '#5e4a3f', trim: '#a3794e', floor: '#2e2724', floorTop: '#7a5338', light: '#ffd8a0', accent: '#ff9f43' },
  exec: { id: 'exec', name: 'KANTOR DIREKSI', wall: '#3f2b45', wall2: '#30203a', panel: '#4e3656', trim: '#e0b84a', floor: '#2a1d22', floorTop: '#8a2433', light: '#ffe2c4', accent: '#ff4f7a' },
  pantry: { id: 'pantry', name: 'PANTRI & KANTIN', wall: '#4a4436', wall2: '#3a3528', panel: '#d8d2c0', trim: '#c96a3a', floor: '#2e2a24', floorTop: '#b8a888', light: '#ffe8c0', accent: '#ffb347' },
  gym: { id: 'gym', name: 'PUSAT KEBUGARAN', wall: '#2e3440', wall2: '#232832', panel: '#3b4252', trim: '#ff3b5c', floor: '#1e2128', floorTop: '#3a3e48', light: '#e0f0ff', accent: '#ff3b5c' },
  archive: { id: 'archive', name: 'PERPUSTAKAAN ARSIP', wall: '#3d2f26', wall2: '#30241c', panel: '#4e3a2c', trim: '#c9a063', floor: '#2a1f18', floorTop: '#6b4a30', light: '#ffd9a0', accent: '#e8b860' },
  lab: { id: 'lab', name: 'LAB RISET', wall: '#8a9aa4', wall2: '#6e7e88', panel: '#c4d0d6', trim: '#3ad8a8', floor: '#3a4248', floorTop: '#a8b6bc', light: '#e8fff8', accent: '#3ad8a8' },
  lounge: { id: 'lounge', name: 'LOUNGE KREATIF', wall: '#3a2a4a', wall2: '#2c2038', panel: '#4a3560', trim: '#ff8fd0', floor: '#241a2c', floorTop: '#5a4a6a', light: '#ffd0f0', accent: '#ff8fd0' },
  security: { id: 'security', name: 'RUANG KEAMANAN', wall: '#2a3530', wall2: '#202a26', panel: '#34423c', trim: '#ff4d4d', floor: '#1c2420', floorTop: '#3a4440', light: '#d0ffe0', accent: '#ff4d4d' },
  roof: { id: 'roof', name: 'ATAP GEDUNG', wall: '#000000', wall2: '#000000', panel: '#000000', trim: '#8c96a8', floor: '#3a3d45', floorTop: '#6b6e78', light: '#ffffff', accent: '#ff3b3b', outdoor: true },
};
const CYCLE: ThemeId[] = ['cubicle', 'pantry', 'server', 'meeting', 'lounge', 'archive', 'gym', 'lab', 'security', 'exec'];

export const storiesOf = (m: OfficeMap) => Math.floor(m.h / STORY);

export function themeOf(m: OfficeMap, story: number): Theme {
  const n = storiesOf(m);
  const forced = m.themes?.[story] as ThemeId | undefined;
  if (forced && THEMES[forced]) return THEMES[forced];
  const b = n - 1 - story;
  if (m.roof && story === 0 && n > 1) return THEMES.roof;
  if (b <= 0 && !(m.floorBase && m.floorBase > 1)) return THEMES.lobby;
  return THEMES[CYCLE[(b - 1 + CYCLE.length + ((m.floorBase ?? 1) - 1)) % CYCLE.length]];
}
