import { TILE, type Palette } from './constants';
import type { Level } from './level';
import { px, prect, pline, pfontO, type Ctx } from './pixel';
import { clamp, hash2 } from './rng';
import type { Vec } from './types';

// Office tile types
export const OT_AIR = 0;
export const OT_WALL = 1;    // Solid concrete wall / outer wall / pillar
export const OT_FLOOR = 2;   // One-way walkable office floor slab (jump up through, drop down with S+Space)
export const OT_STAIRS = 3;  // Stairwell / ladder connecting floors
export const OT_GLASS = 4;   // Breakable glass partition (shatters on attack / dash / slam)
export const OT_ELEV = 5;    // Elevator / boost pad (W or Space zips up to next floor)

export type OfficeThemeId = 'cyber_night' | 'sunset_corp' | 'midnight_rain' | 'dojo_tower';

export interface OfficeTheme {
  id: OfficeThemeId;
  name: string;
  skyTop: string;
  skyBot: string;
  cityFar: string;
  cityNear: string;
  cityWin: string;
  wallFill: string;
  wallShade: string;
  wallTrim: string;
  roomBg: string;
  roomPanel: string;
  slabTop: string;
  slabBody: string;
  slabBot: string;
  stairCol: string;
  glassCol: string;
  accent: string;
  accent2: string;
  lightTint: string;
}

export const OFFICE_THEMES: Record<OfficeThemeId, OfficeTheme> = {
  cyber_night: {
    id: 'cyber_night',
    name: 'CYBER NIGHT',
    skyTop: '#060916',
    skyBot: '#131d38',
    cityFar: '#0b1224',
    cityNear: '#0f1830',
    cityWin: '#ffd86b',
    wallFill: '#242b3d',
    wallShade: '#181d2b',
    wallTrim: '#49587a',
    roomBg: '#121622',
    roomPanel: '#171c2b',
    slabTop: '#566482',
    slabBody: '#2b3347',
    slabBot: '#181c28',
    stairCol: '#c48d48',
    glassCol: '#7ce8ff',
    accent: '#ff5a36',
    accent2: '#46e2ff',
    lightTint: '#d6f0ff',
  },
  sunset_corp: {
    id: 'sunset_corp',
    name: 'SUNSET CORP',
    skyTop: '#1b0b1e',
    skyBot: '#5c2230',
    cityFar: '#281123',
    cityNear: '#1c0c1b',
    cityWin: '#ffb84a',
    wallFill: '#2d232b',
    wallShade: '#1d161c',
    wallTrim: '#634b5c',
    roomBg: '#19141a',
    roomPanel: '#211a22',
    slabTop: '#7a5d66',
    slabBody: '#382b33',
    slabBot: '#1c151a',
    stairCol: '#d99a4e',
    glassCol: '#ffd0a6',
    accent: '#ff6b35',
    accent2: '#ffd166',
    lightTint: '#ffe8c8',
  },
  midnight_rain: {
    id: 'midnight_rain',
    name: 'RAINY HQ',
    skyTop: '#05080d',
    skyBot: '#0f1c24',
    cityFar: '#081016',
    cityNear: '#0c161e',
    cityWin: '#63f2c8',
    wallFill: '#1e272e',
    wallShade: '#13191e',
    wallTrim: '#3e515e',
    roomBg: '#10151a',
    roomPanel: '#141b21',
    slabTop: '#4a5d6b',
    slabBody: '#242f38',
    slabBot: '#12181d',
    stairCol: '#8fa4b3',
    glassCol: '#8be9fd',
    accent: '#35f0ff',
    accent2: '#ff4d6d',
    lightTint: '#c4f5ff',
  },
  dojo_tower: {
    id: 'dojo_tower',
    name: 'DOJO TOWER',
    skyTop: '#0b0807',
    skyBot: '#291512',
    cityFar: '#160d0b',
    cityNear: '#100908',
    cityWin: '#ffaa44',
    wallFill: '#2f241f',
    wallShade: '#1e1613',
    wallTrim: '#6e5041',
    roomBg: '#171210',
    roomPanel: '#1f1815',
    slabTop: '#8c6244',
    slabBody: '#402c20',
    slabBot: '#211610',
    stairCol: '#d9a45b',
    glassCol: '#ffe6b3',
    accent: '#ffd447',
    accent2: '#ff3b3b',
    lightTint: '#ffebb8',
  },
};

export type OfficeDecorKind =
  | 'window'
  | 'cabinet'
  | 'server'
  | 'whiteboard'
  | 'light'
  | 'plant_bg'
  | 'reception'
  | 'cubicle'
  | 'vending'
  | 'sofa'
  | 'bookshelf'
  | 'pantry'
  | 'copier'
  | 'banner'
  | 'chandelier'
  | 'vent'
  | 'security_gate'
  | 'watercooler'
  | 'rooftop_hvac';

export interface OfficeDecor {
  tx: number;
  ty: number;
  kind: OfficeDecorKind;
  w?: number;
  h?: number;
  label?: string;
}

export interface OfficePropSpawn {
  tx: number;
  ty: number;
  kind: 'table' | 'pot' | 'crate' | 'barrel' | 'computer';
}

export interface OfficeMapData {
  id: string;
  name: string;
  w: number;
  h: number;
  theme: OfficeThemeId;
  tiles: number[];
  decor: OfficeDecor[];
  props: OfficePropSpawn[];
  spawn: { tx: number; ty: number };
  leftGates: { tx: number; ty: number }[];
  rightGates: { tx: number; ty: number }[];
  updatedAt?: number;
}

const STORAGE_MAPS_KEY = 'v2_kf_office_maps_v1';
const STORAGE_ACTIVE_ID_KEY = 'v2_kf_office_active_map_v1';

/** Build an empty boxed building shell with ground floor. */
export function createBlankOfficeMap(name = 'KANTOR BARU', w = 68, h = 24, theme: OfficeThemeId = 'cyber_night'): OfficeMapData {
  const tiles = new Array<number>(w * h).fill(OT_AIR);
  const set = (tx: number, ty: number, v: number) => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) tiles[ty * w + tx] = v;
  };
  for (let x = 0; x < w; x++) {
    set(x, 0, OT_WALL);
    set(x, 1, OT_WALL);
    set(x, h - 1, OT_WALL);
    set(x, h - 2, OT_WALL);
  }
  for (let y = 0; y < h; y++) {
    set(0, y, OT_WALL);
    set(1, y, OT_WALL);
    set(w - 1, y, OT_WALL);
    set(w - 2, y, OT_WALL);
  }
  const groundTy = h - 2;
  return {
    id: `custom_${Date.now()}`,
    name,
    w,
    h,
    theme,
    tiles,
    decor: [],
    props: [
      { tx: Math.floor(w / 2) - 6, ty: groundTy, kind: 'table' },
      { tx: Math.floor(w / 2) - 3, ty: groundTy, kind: 'computer' },
      { tx: Math.floor(w / 2) + 5, ty: groundTy, kind: 'pot' },
    ],
    spawn: { tx: Math.floor(w / 2), ty: groundTy },
    leftGates: [{ tx: 3, ty: groundTy }],
    rightGates: [{ tx: w - 4, ty: groundTy }],
    updatedAt: Date.now(),
  };
}

function makePresetTower4(): OfficeMapData {
  const w = 82, h = 26;
  const m = createBlankOfficeMap('MENARA KORPORAT 4 LT', w, h, 'cyber_night');
  m.id = 'preset_tower_4';
  const set = (tx: number, ty: number, v: number) => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) m.tiles[ty * w + tx] = v;
  };
  // Floor surface Y tile indices:
  // LT 1 (Ground = 24): Grand Lobby, Reception Desk, Security Checkpoints & VIP Waiting Lounge
  // LT 2 (Floor 2 = 19): Open-Plan Cubicle Workstations, Trading Ticker, Copy Center & Pantry Cafe
  // LT 3 (Floor 3 = 14): Cyber Mainframe Server Core, R&D Lab, Overhead HVAC & Tactical Catwalks
  // LT 4 (Floor 4 = 9) : Executive Boardroom, CEO Library, Chandelier Lounge & Dojo Suite
  // Roof Slab (y = 4)  : Rooftop HVAC Chillers, Satellite Dish, Helipad Beacon & Neon Corp Sign
  const floors = [24, 19, 14, 9];
  for (let x = 2; x < w - 2; x++) set(x, 4, OT_WALL);

  // Add upper one-way floor slabs with stairwell openings & central atrium drop-gaps
  for (const fy of [19, 14, 9]) {
    for (let x = 2; x < w - 2; x++) {
      // Leave stairwell openings at x=11..14, x=67..70
      if ((x >= 11 && x <= 14) || (x >= 67 && x <= 70)) continue;
      // Secondary express service ladder shaft at x=29 on floor 2->3 and x=52 on floor 3->4
      if (fy === 14 && x === 29) continue;
      if (fy === 9 && x === 52) continue;
      set(x, fy, OT_FLOOR);
    }
  }

  // Elevated Mezzanine Catwalk Platforms (split-level tactical platforms for parkour & aerial combat!)
  for (let x = 35; x <= 46; x++) set(x, 21, OT_FLOOR); // Lobby central mezzanine balcony above reception
  for (let x = 18; x <= 25; x++) set(x, 16, OT_FLOOR); // Floor 2 left IT overlook platform
  for (let x = 56; x <= 63; x++) set(x, 16, OT_FLOOR); // Floor 2 right pantry mezzanine
  for (let x = 36; x <= 45; x++) set(x, 11, OT_FLOOR); // Floor 3 suspended server catwalk bridge

  // Left & Right 4-tile-wide switchback staircases connecting all 4 floors
  for (let f = 0; f < 3; f++) {
    const bot = floors[f] - 1;
    const top = floors[f + 1];
    for (let y = top; y <= bot; y++) {
      for (let sx = 11; sx <= 14; sx++) set(sx, y, OT_STAIRS);
      for (let sx = 67; sx <= 70; sx++) set(sx, y, OT_STAIRS);
    }
  }
  // Auxiliary single-column tactical ladders between mid floors
  for (let y = 14; y <= 18; y++) set(29, y, OT_STAIRS);
  for (let y = 9; y <= 13; y++) set(52, y, OT_STAIRS);

  // Twin Express Elevator Shafts (Left-Center x=33..34 & Right-Center x=47..48) on floors 1, 2, 3
  for (const fy of [24, 19, 14]) {
    set(33, fy - 1, OT_ELEV); set(34, fy - 1, OT_ELEV);
    set(47, fy - 1, OT_ELEV); set(48, fy - 1, OT_ELEV);
  }

  // Breakable Glass Conference & Security Partitions across floors
  for (const [gx, fy] of [
    [22, 24], [59, 24], // Lobby glass security dividers
    [26, 19], [55, 19], // Floor 2 meeting & pantry glass walls
    [24, 14], [35, 14], [46, 14], [57, 14], // Floor 3 glass mainframe server containment room
    [27, 9], [54, 9],   // Floor 4 VIP Executive glass suite
  ]) {
    for (let dy = 1; dy <= 3; dy++) set(gx, fy - dy, OT_GLASS);
  }

  // Structural interior concrete columns on ground & mid floors (with doorway gaps)
  for (const [px, fy] of [[8, 24], [73, 24], [19, 14], [62, 14]]) {
    set(px, fy - 3, OT_WALL);
    set(px, fy - 4, OT_WALL);
  }

  // Doors for enemy waves on Left and Right on every floor!
  m.leftGates = [
    { tx: 3, ty: 24 },
    { tx: 3, ty: 19 },
    { tx: 3, ty: 14 },
    { tx: 3, ty: 9 },
  ];
  m.rightGates = [
    { tx: w - 4, ty: 24 },
    { tx: w - 4, ty: 19 },
    { tx: w - 4, ty: 14 },
    { tx: w - 4, ty: 9 },
  ];
  m.spawn = { tx: 40, ty: 24 };

  // Panoramic Windows & Ceiling Lighting across all 4 floors
  for (const fy of floors) {
    for (let x = 5; x < w - 7; x += 9) {
      if (Math.abs(x - 33) > 3 && Math.abs(x - 47) > 3 && Math.abs(x - 12) > 3 && Math.abs(x - 68) > 3) {
        m.decor.push({ tx: x, ty: fy - 3, kind: 'window', w: 5, h: 2 });
      }
      m.decor.push({ tx: x + 1, ty: fy - 4, kind: 'light', w: 3, h: 1 });
    }
  }

  // ---- LT 1 (ty=24): GRAND LOBBY, RESEPSIONIS, POS SEKURITI & LOUNGE TAMU ----
  m.decor.push({ tx: 6, ty: 23, kind: 'security_gate' });
  m.decor.push({ tx: 74, ty: 23, kind: 'security_gate' });
  m.decor.push({ tx: 38, ty: 23, kind: 'reception', w: 5, h: 1, label: 'NAGA CORP' });
  m.decor.push({ tx: 39, ty: 20, kind: 'chandelier', w: 3, h: 1 });
  m.decor.push({ tx: 16, ty: 23, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 61, ty: 23, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 25, ty: 23, kind: 'vending' });
  m.decor.push({ tx: 27, ty: 23, kind: 'watercooler' });
  m.decor.push({ tx: 54, ty: 23, kind: 'vending' });
  m.decor.push({ tx: 52, ty: 23, kind: 'plant_bg' });
  m.decor.push({ tx: 29, ty: 23, kind: 'plant_bg' });
  m.decor.push({ tx: 38, ty: 21, kind: 'banner', w: 5, h: 1, label: 'LOBBY // SEC' });

  // ---- LT 2 (ty=19): OPEN CUBICLES, TRADING FLOOR, COPY CENTER & PANTRY CAFE ----
  m.decor.push({ tx: 16, ty: 18, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 21, ty: 18, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 36, ty: 18, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 42, ty: 18, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 30, ty: 18, kind: 'copier', w: 2, h: 1 });
  m.decor.push({ tx: 50, ty: 18, kind: 'cabinet' });
  m.decor.push({ tx: 52, ty: 18, kind: 'whiteboard' });
  m.decor.push({ tx: 57, ty: 18, kind: 'pantry', w: 4, h: 1 });
  m.decor.push({ tx: 62, ty: 18, kind: 'vending' });
  m.decor.push({ tx: 64, ty: 18, kind: 'watercooler' });
  m.decor.push({ tx: 38, ty: 16, kind: 'banner', w: 5, h: 1, label: 'TRADING // IT' });

  // ---- LT 3 (ty=14): CYBER SERVER CORE, R&D LAB & HVAC DUCTING ----
  for (const sx of [26, 31, 37, 40, 43, 50, 54]) {
    m.decor.push({ tx: sx, ty: 13, kind: 'server' });
  }
  m.decor.push({ tx: 16, ty: 13, kind: 'whiteboard' });
  m.decor.push({ tx: 20, ty: 13, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 59, ty: 13, kind: 'copier', w: 2, h: 1 });
  m.decor.push({ tx: 63, ty: 13, kind: 'cabinet' });
  m.decor.push({ tx: 25, ty: 10, kind: 'vent', w: 4, h: 1 });
  m.decor.push({ tx: 50, ty: 10, kind: 'vent', w: 4, h: 1 });
  m.decor.push({ tx: 38, ty: 11, kind: 'banner', w: 5, h: 1, label: 'SERVER CORE' });

  // ---- LT 4 (ty=9): EXECUTIVE BOARDROOM, VIP LOUNGE & DOJO PENTHOUSE ----
  m.decor.push({ tx: 16, ty: 8, kind: 'bookshelf', w: 3, h: 1 });
  m.decor.push({ tx: 20, ty: 8, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 29, ty: 5, kind: 'chandelier', w: 3, h: 1 });
  m.decor.push({ tx: 49, ty: 5, kind: 'chandelier', w: 3, h: 1 });
  m.decor.push({ tx: 38, ty: 6, kind: 'banner', w: 5, h: 1, label: 'EXEC // DOJO' });
  m.decor.push({ tx: 56, ty: 8, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 61, ty: 8, kind: 'bookshelf', w: 3, h: 1 });
  m.decor.push({ tx: 65, ty: 8, kind: 'pantry', w: 3, h: 1 });
  m.decor.push({ tx: 31, ty: 8, kind: 'plant_bg' });
  m.decor.push({ tx: 50, ty: 8, kind: 'plant_bg' });

  // ---- ROOFTOP SKYLINE STRUCTURES (above y=4 roof slab) ----
  m.decor.push({ tx: 14, ty: 3, kind: 'rooftop_hvac', w: 6, h: 1, label: 'HVAC' });
  m.decor.push({ tx: 36, ty: 3, kind: 'rooftop_hvac', w: 10, h: 1, label: 'NAGA CORP HQ' });
  m.decor.push({ tx: 60, ty: 3, kind: 'rooftop_hvac', w: 6, h: 1, label: 'SAT' });

  // Interactive Props (Tables/Desks, Flower Pots [1-Hand Throw], Office Computers [2-Hand Throw], Crates, Explosive Dispensers)
  m.props = [
    // Floor 1 Lobby & Mezzanine
    { tx: 19, ty: 24, kind: 'table' },
    { tx: 25, ty: 24, kind: 'computer' },
    { tx: 30, ty: 24, kind: 'pot' },
    { tx: 37, ty: 24, kind: 'computer' },
    { tx: 44, ty: 24, kind: 'computer' },
    { tx: 51, ty: 24, kind: 'pot' },
    { tx: 56, ty: 24, kind: 'computer' },
    { tx: 63, ty: 24, kind: 'table' },
    { tx: 38, ty: 21, kind: 'computer' },
    { tx: 42, ty: 21, kind: 'pot' },
    // Floor 2 Cubicles & Pantry
    { tx: 17, ty: 19, kind: 'computer' },
    { tx: 20, ty: 19, kind: 'table' },
    { tx: 24, ty: 19, kind: 'pot' },
    { tx: 31, ty: 19, kind: 'barrel' },
    { tx: 37, ty: 19, kind: 'computer' },
    { tx: 40, ty: 19, kind: 'table' },
    { tx: 44, ty: 19, kind: 'computer' },
    { tx: 51, ty: 19, kind: 'pot' },
    { tx: 60, ty: 19, kind: 'table' },
    { tx: 21, ty: 16, kind: 'computer' },
    { tx: 59, ty: 16, kind: 'pot' },
    // Floor 3 Server Core & Catwalk
    { tx: 18, ty: 14, kind: 'table' },
    { tx: 22, ty: 14, kind: 'computer' },
    { tx: 28, ty: 14, kind: 'pot' },
    { tx: 39, ty: 14, kind: 'barrel' },
    { tx: 49, ty: 14, kind: 'computer' },
    { tx: 54, ty: 14, kind: 'pot' },
    { tx: 61, ty: 14, kind: 'table' },
    { tx: 38, ty: 11, kind: 'computer' },
    { tx: 42, ty: 11, kind: 'pot' },
    // Floor 4 Executive Boardroom
    { tx: 23, ty: 9, kind: 'table' },
    { tx: 31, ty: 9, kind: 'pot' },
    { tx: 36, ty: 9, kind: 'computer' },
    { tx: 40, ty: 9, kind: 'pot' },
    { tx: 45, ty: 9, kind: 'computer' },
    { tx: 50, ty: 9, kind: 'table' },
    { tx: 58, ty: 9, kind: 'barrel' },
  ];
  return m;
}

function makePresetLobbyMezz(): OfficeMapData {
  const w = 74, h = 24;
  const m = createBlankOfficeMap('ATRIUM MEZANIN & SKYBRIDGE', w, h, 'sunset_corp');
  m.id = 'preset_lobby_mezz';
  const set = (tx: number, ty: number, v: number) => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) m.tiles[ty * w + tx] = v;
  };
  for (let x = 2; x < w - 2; x++) set(x, 3, OT_WALL);
  // Mezzanine left & right wings (ty=17) + mid skybridge (ty=13) + top executive gallery (ty=8)
  for (let x = 2; x <= 28; x++) set(x, 17, OT_FLOOR);
  for (let x = 45; x <= w - 3; x++) set(x, 17, OT_FLOOR);
  for (let x = 20; x <= w - 21; x++) set(x, 13, OT_FLOOR);
  for (let x = 2; x < w - 2; x++) {
    if ((x >= 12 && x <= 14) || (x >= 59 && x <= 61) || (x >= 35 && x <= 38)) continue;
    set(x, 8, OT_FLOOR);
  }
  // Switchback stairs & side stairs
  for (let y = 17; y <= 21; y++) {
    set(25, y, OT_STAIRS); set(26, y, OT_STAIRS); set(27, y, OT_STAIRS);
    set(46, y, OT_STAIRS); set(47, y, OT_STAIRS); set(48, y, OT_STAIRS);
  }
  for (let y = 13; y <= 16; y++) {
    set(21, y, OT_STAIRS); set(22, y, OT_STAIRS); set(23, y, OT_STAIRS);
    set(50, y, OT_STAIRS); set(51, y, OT_STAIRS); set(52, y, OT_STAIRS);
  }
  for (let y = 8; y <= 16; y++) {
    set(12, y, OT_STAIRS); set(13, y, OT_STAIRS); set(14, y, OT_STAIRS);
    set(59, y, OT_STAIRS); set(60, y, OT_STAIRS); set(61, y, OT_STAIRS);
  }
  // Center lobby & skybridge elevator pads
  set(36, 21, OT_ELEV); set(37, 21, OT_ELEV);
  set(36, 12, OT_ELEV); set(37, 12, OT_ELEV);
  // Glass partitions
  for (let dy = 1; dy <= 3; dy++) {
    set(16, 22 - dy, OT_GLASS);
    set(57, 22 - dy, OT_GLASS);
    set(29, 13 - dy, OT_GLASS);
    set(44, 13 - dy, OT_GLASS);
    set(24, 8 - dy, OT_GLASS);
    set(49, 8 - dy, OT_GLASS);
  }
  m.spawn = { tx: 36, ty: 22 };
  m.leftGates = [{ tx: 3, ty: 22 }, { tx: 3, ty: 17 }, { tx: 3, ty: 8 }];
  m.rightGates = [{ tx: w - 4, ty: 22 }, { tx: w - 4, ty: 17 }, { tx: w - 4, ty: 8 }];
  for (let x = 6; x < w - 6; x += 11) {
    m.decor.push({ tx: x, ty: 18, kind: 'window', w: 6, h: 3 });
    m.decor.push({ tx: x, ty: 10, kind: 'window', w: 5, h: 2 });
    m.decor.push({ tx: x + 1, ty: 4, kind: 'light', w: 3, h: 1 });
  }
  m.decor.push({ tx: 6, ty: 21, kind: 'security_gate' });
  m.decor.push({ tx: w - 8, ty: 21, kind: 'security_gate' });
  m.decor.push({ tx: 34, ty: 21, kind: 'reception', w: 5, h: 1, label: 'SUNSET PLAZA' });
  m.decor.push({ tx: 19, ty: 21, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 51, ty: 21, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 7, ty: 16, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 16, ty: 16, kind: 'pantry', w: 4, h: 1 });
  m.decor.push({ tx: 54, ty: 16, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 64, ty: 16, kind: 'vending' });
  m.decor.push({ tx: 34, ty: 12, kind: 'banner', w: 5, h: 1, label: 'SKYBRIDGE' });
  m.decor.push({ tx: 31, ty: 12, kind: 'server' });
  m.decor.push({ tx: 41, ty: 12, kind: 'server' });
  m.decor.push({ tx: 17, ty: 7, kind: 'bookshelf', w: 3, h: 1 });
  m.decor.push({ tx: 53, ty: 7, kind: 'bookshelf', w: 3, h: 1 });
  m.decor.push({ tx: 35, ty: 4, kind: 'chandelier', w: 3, h: 1 });
  m.decor.push({ tx: 32, ty: 2, kind: 'rooftop_hvac', w: 9, h: 1, label: 'SUNSET CORP' });
  m.props = [
    { tx: 30, ty: 22, kind: 'pot' },
    { tx: 34, ty: 22, kind: 'computer' },
    { tx: 40, ty: 22, kind: 'computer' },
    { tx: 43, ty: 22, kind: 'pot' },
    { tx: 11, ty: 22, kind: 'table' },
    { tx: 62, ty: 22, kind: 'table' },
    { tx: 10, ty: 17, kind: 'table' },
    { tx: 15, ty: 17, kind: 'computer' },
    { tx: 57, ty: 17, kind: 'computer' },
    { tx: 63, ty: 17, kind: 'pot' },
    { tx: 26, ty: 13, kind: 'table' },
    { tx: 33, ty: 13, kind: 'computer' },
    { tx: 41, ty: 13, kind: 'pot' },
    { tx: 47, ty: 13, kind: 'barrel' },
    { tx: 28, ty: 8, kind: 'table' },
    { tx: 34, ty: 8, kind: 'computer' },
    { tx: 45, ty: 8, kind: 'pot' },
  ];
  return m;
}

function makePresetServerHQ(): OfficeMapData {
  const w = 72, h = 24;
  const m = createBlankOfficeMap('BENTENG DATA & LAB SIBER', w, h, 'midnight_rain');
  m.id = 'preset_server_hq';
  const set = (tx: number, ty: number, v: number) => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) m.tiles[ty * w + tx] = v;
  };
  for (let x = 2; x < w - 2; x++) set(x, 4, OT_WALL);
  for (const fy of [17, 11]) {
    for (let x = 2; x < w - 2; x++) {
      if ((x >= 10 && x <= 13) || (x >= 58 && x <= 61)) continue;
      set(x, fy, OT_FLOOR);
    }
  }
  // Suspended cyber catwalks
  for (let x = 28; x <= 43; x++) set(x, 14, OT_FLOOR);
  for (let x = 28; x <= 43; x++) set(x, 8, OT_FLOOR);

  for (let y = 11; y <= 21; y++) {
    for (let sx = 10; sx <= 13; sx++) set(sx, y, OT_STAIRS);
    for (let sx = 58; sx <= 61; sx++) set(sx, y, OT_STAIRS);
  }
  set(24, 21, OT_ELEV); set(25, 21, OT_ELEV);
  set(46, 21, OT_ELEV); set(47, 21, OT_ELEV);
  set(35, 16, OT_ELEV); set(36, 16, OT_ELEV);

  for (const [gx, fy] of [[20, 22], [51, 22], [22, 17], [49, 17], [25, 11], [46, 11]]) {
    for (let dy = 1; dy <= 3; dy++) set(gx, fy - dy, OT_GLASS);
  }
  m.spawn = { tx: 36, ty: 22 };
  m.leftGates = [{ tx: 3, ty: 22 }, { tx: 3, ty: 17 }, { tx: 3, ty: 11 }];
  m.rightGates = [{ tx: w - 4, ty: 22 }, { tx: w - 4, ty: 17 }, { tx: w - 4, ty: 11 }];
  for (const fy of [22, 17, 11]) {
    for (let x = 15; x < 55; x += 7) {
      m.decor.push({ tx: x, ty: fy - 1, kind: 'server' });
      m.decor.push({ tx: x + 1, ty: fy - 4, kind: 'light', w: 3, h: 1 });
    }
    m.decor.push({ tx: 16, ty: fy - 4, kind: 'vent', w: 4, h: 1 });
    m.decor.push({ tx: 50, ty: fy - 4, kind: 'vent', w: 4, h: 1 });
  }
  m.decor.push({ tx: 6, ty: 21, kind: 'security_gate' });
  m.decor.push({ tx: w - 8, ty: 21, kind: 'security_gate' });
  m.decor.push({ tx: 33, ty: 21, kind: 'reception', w: 5, h: 1, label: 'CYBER CORE' });
  m.decor.push({ tx: 15, ty: 16, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 53, ty: 16, kind: 'copier', w: 2, h: 1 });
  m.decor.push({ tx: 63, ty: 21, kind: 'vending' });
  m.decor.push({ tx: 33, ty: 14, kind: 'banner', w: 5, h: 1, label: 'MAINFRAME' });
  m.decor.push({ tx: 31, ty: 3, kind: 'rooftop_hvac', w: 10, h: 1, label: 'DATA FORTRESS' });
  m.props = [
    { tx: 17, ty: 22, kind: 'computer' }, { tx: 54, ty: 22, kind: 'barrel' },
    { tx: 29, ty: 22, kind: 'table' }, { tx: 34, ty: 22, kind: 'computer' }, { tx: 42, ty: 22, kind: 'pot' },
    { tx: 27, ty: 17, kind: 'table' }, { tx: 32, ty: 17, kind: 'computer' }, { tx: 39, ty: 17, kind: 'pot' }, { tx: 44, ty: 17, kind: 'barrel' },
    { tx: 33, ty: 14, kind: 'computer' }, { tx: 38, ty: 14, kind: 'pot' },
    { tx: 19, ty: 11, kind: 'table' }, { tx: 35, ty: 11, kind: 'computer' }, { tx: 52, ty: 11, kind: 'pot' },
    { tx: 35, ty: 8, kind: 'barrel' },
  ];
  return m;
}

function makePresetDojoCorp(): OfficeMapData {
  const w = 76, h = 24;
  const m = createBlankOfficeMap('MARKAS DOJO & PENTHOUSE ZAIBATSU', w, h, 'dojo_tower');
  m.id = 'preset_dojo_corp';
  const set = (tx: number, ty: number, v: number) => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h) m.tiles[ty * w + tx] = v;
  };
  for (let x = 2; x < w - 2; x++) set(x, 3, OT_WALL);
  for (const fy of [17, 11]) {
    for (let x = 2; x < w - 2; x++) {
      if ((x >= 14 && x <= 17) || (x >= 58 && x <= 61)) continue;
      set(x, fy, OT_FLOOR);
    }
  }
  // Dojo elevated training platforms
  for (let x = 22; x <= 30; x++) set(x, 14, OT_FLOOR);
  for (let x = 45; x <= 53; x++) set(x, 14, OT_FLOOR);

  for (let y = 11; y <= 21; y++) {
    for (let sx = 14; sx <= 17; sx++) set(sx, y, OT_STAIRS);
    for (let sx = 58; sx <= 61; sx++) set(sx, y, OT_STAIRS);
  }
  set(37, 21, OT_ELEV); set(38, 21, OT_ELEV);
  set(37, 16, OT_ELEV); set(38, 16, OT_ELEV);
  for (let dy = 1; dy <= 3; dy++) {
    set(26, 22 - dy, OT_GLASS); set(49, 22 - dy, OT_GLASS);
    set(29, 17 - dy, OT_GLASS); set(46, 17 - dy, OT_GLASS);
  }
  m.spawn = { tx: 38, ty: 22 };
  m.leftGates = [{ tx: 3, ty: 22 }, { tx: 3, ty: 17 }, { tx: 3, ty: 11 }];
  m.rightGates = [{ tx: w - 4, ty: 22 }, { tx: w - 4, ty: 17 }, { tx: w - 4, ty: 11 }];
  for (const fy of [22, 17, 11]) {
    for (let x = 6; x < w - 9; x += 11) {
      if (Math.abs(x - 15) > 3 && Math.abs(x - 59) > 3 && Math.abs(x - 37) > 3) {
        m.decor.push({ tx: x, ty: fy - 3, kind: 'window', w: 5, h: 2 });
      }
      m.decor.push({ tx: x + 1, ty: fy - 4, kind: 'light', w: 3, h: 1 });
    }
  }
  m.decor.push({ tx: 35, ty: 21, kind: 'reception', w: 5, h: 1, label: 'RYU ZAIBATSU' });
  m.decor.push({ tx: 19, ty: 21, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 53, ty: 21, kind: 'sofa', w: 3, h: 1 });
  m.decor.push({ tx: 20, ty: 16, kind: 'cubicle', w: 3, h: 1 });
  m.decor.push({ tx: 51, ty: 16, kind: 'pantry', w: 4, h: 1 });
  m.decor.push({ tx: 21, ty: 10, kind: 'bookshelf', w: 3, h: 1 });
  m.decor.push({ tx: 51, ty: 10, kind: 'bookshelf', w: 3, h: 1 });
  m.decor.push({ tx: 35, ty: 8, kind: 'banner', w: 5, h: 1, label: 'GRAND DOJO' });
  m.decor.push({ tx: 27, ty: 4, kind: 'chandelier', w: 3, h: 1 });
  m.decor.push({ tx: 46, ty: 4, kind: 'chandelier', w: 3, h: 1 });
  m.decor.push({ tx: 33, ty: 2, kind: 'rooftop_hvac', w: 10, h: 1, label: 'DOJO TOWER' });
  m.props = [
    { tx: 22, ty: 22, kind: 'pot' }, { tx: 35, ty: 22, kind: 'computer' }, { tx: 41, ty: 22, kind: 'computer' }, { tx: 52, ty: 22, kind: 'pot' },
    { tx: 31, ty: 22, kind: 'table' }, { tx: 44, ty: 22, kind: 'table' },
    { tx: 24, ty: 17, kind: 'table' }, { tx: 33, ty: 17, kind: 'computer' }, { tx: 42, ty: 17, kind: 'pot' }, { tx: 50, ty: 17, kind: 'barrel' },
    { tx: 26, ty: 14, kind: 'pot' }, { tx: 49, ty: 14, kind: 'computer' },
    { tx: 37, ty: 11, kind: 'pot' }, { tx: 26, ty: 11, kind: 'table' }, { tx: 32, ty: 11, kind: 'computer' }, { tx: 48, ty: 11, kind: 'table' },
  ];
  return m;
}

export const OFFICE_PRESETS: OfficeMapData[] = [
  makePresetTower4(),
  makePresetLobbyMezz(),
  makePresetServerHQ(),
  makePresetDojoCorp(),
];

export function cloneOfficeMap(m: OfficeMapData): OfficeMapData {
  return {
    ...m,
    tiles: [...m.tiles],
    decor: m.decor.map((d) => ({ ...d })),
    props: m.props.map((p) => ({ ...p })),
    spawn: { ...m.spawn },
    leftGates: m.leftGates.map((g) => ({ ...g })),
    rightGates: m.rightGates.map((g) => ({ ...g })),
  };
}

export function loadCustomOfficeMaps(): OfficeMapData[] {
  try {
    const raw = localStorage.getItem(STORAGE_MAPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listAllOfficeMaps(): OfficeMapData[] {
  const custom = loadCustomOfficeMaps();
  const customIds = new Set(custom.map((m) => m.id));
  return [...custom, ...OFFICE_PRESETS.filter((p) => !customIds.has(p.id))];
}

export function getSelectedOfficeMapId(): string {
  try { return localStorage.getItem(STORAGE_ACTIVE_ID_KEY) || OFFICE_PRESETS[0].id; } catch { return OFFICE_PRESETS[0].id; }
}

export function setSelectedOfficeMapId(id: string) {
  try { localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id); } catch { /* ignore */ }
}

export function getOfficeMapById(id?: string): OfficeMapData {
  const target = id || getSelectedOfficeMapId();
  const all = listAllOfficeMaps();
  return cloneOfficeMap(all.find((m) => m.id === target) || OFFICE_PRESETS[0]);
}

/** Build a playable Level object from an OfficeMapData blueprint. */
export function buildOfficeLevel(mapData: OfficeMapData): Level {
  const map = cloneOfficeMap(mapData);
  const w = map.w, h = map.h;
  const officeTiles = new Uint8Array(w * h);
  const tiles = new Uint8Array(w * h);
  const floorRowSet = new Set<number>();

  const allFloorRows = new Set<number>();
  for (let i = 0; i < w * h; i++) {
    const v = map.tiles[i] ?? 0;
    officeTiles[i] = v;
    // Standard level.tiles: 1 = blocks horizontal movement & bullets (Wall or unbroken Glass)
    tiles[i] = v === OT_WALL || v === OT_GLASS ? 1 : 0;
    if (v === OT_FLOOR) allFloorRows.add(Math.floor(i / w) * TILE);
  }

  // Register main story floors (major floor slabs & solid ground floor top) so short mezzanine catwalks don't skew LT numbering
  for (let ty = 1; ty < h; ty++) {
    let floorRun = 0;
    let groundRun = 0;
    for (let tx = 2; tx < w - 2; tx++) {
      const v = officeTiles[ty * w + tx];
      if (v === OT_FLOOR) floorRun++;
      if (v === OT_WALL && officeTiles[(ty - 1) * w + tx] !== OT_WALL) groundRun++;
    }
    if (floorRun > w * 0.25 || groundRun > w * 0.4) floorRowSet.add(ty * TILE);
  }
  if (floorRowSet.size === 0) {
    for (const r of allFloorRows) floorRowSet.add(r);
  }

  const officeFloors = [...floorRowSet].sort((a, b) => b - a); // [Floor 1 bottom .. Top floor]
  const floorTiles: Vec[] = [];
  for (let ty = 1; ty < h - 1; ty++) {
    for (let tx = 1; tx < w - 1; tx++) {
      const here = officeTiles[ty * w + tx];
      const below = officeTiles[(ty + 1) * w + tx];
      if ((here === OT_AIR || here === OT_STAIRS || here === OT_ELEV) && (below === OT_WALL || below === OT_FLOOR)) {
        floorTiles.push({ x: tx * TILE + TILE / 2, y: (ty + 1) * TILE });
      }
    }
  }

  const spawn: Vec = { x: map.spawn.tx * TILE + TILE / 2, y: map.spawn.ty * TILE };
  const leftSpawns: Vec[] = (map.leftGates.length ? map.leftGates : [{ tx: 3, ty: map.spawn.ty }]).map((g) => ({
    x: g.tx * TILE + TILE / 2,
    y: g.ty * TILE,
  }));
  const rightSpawns: Vec[] = (map.rightGates.length ? map.rightGates : [{ tx: w - 4, ty: map.spawn.ty }]).map((g) => ({
    x: g.tx * TILE + TILE / 2,
    y: g.ty * TILE,
  }));

  return {
    n: 1,
    zone: 0,
    w,
    h,
    tiles,
    spawn,
    exit: { ...spawn },
    floorTiles,
    isBoss: false,
    style: map.theme,
    seed: 707,
    sideView: true,
    officeMap: map,
    officeTiles,
    officeFloors,
    leftSpawns,
    rightSpawns,
  };
}

export function officeTileAt(l: Level, tx: number, ty: number): number {
  if (tx < 0 || ty < 0 || tx >= l.w || ty >= l.h) return OT_WALL;
  return l.officeTiles ? l.officeTiles[ty * l.w + tx] : OT_AIR;
}

/** True if (x, y) collides with solid wall or unbroken glass in side-view. */
export function officeSolidAt(l: Level, x: number, y: number): boolean {
  const t = officeTileAt(l, Math.floor(x / TILE), Math.floor(y / TILE));
  return t === OT_WALL || t === OT_GLASS;
}

/** Check entity body box [x-r .. x+r] x [y-12 .. y-1] against solid walls/glass. */
export function officeBodySolid(l: Level, x: number, y: number, r: number): boolean {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - 12) / TILE), y1 = Math.floor((y - 1.5) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = officeTileAt(l, tx, ty);
      if (t === OT_WALL || t === OT_GLASS) return true;
    }
  }
  return false;
}

/** True if tile (tx, ty) has a walkable top surface (i.e. the tile above it is not solid wall/glass). */
export function officeHasWalkableTop(l: Level, tx: number, ty: number, ignoreOneWay = false): boolean {
  const t = officeTileAt(l, tx, ty);
  const above = officeTileAt(l, tx, ty - 1);
  if (above === OT_WALL || above === OT_GLASS) return false;
  if (t === OT_WALL || t === OT_GLASS) return true;
  if (!ignoreOneWay && t === OT_FLOOR) return true;
  return false;
}

/** Find the Y coordinate of the supporting floor surface directly under/at entity's feet. */
export function officeFloorSupportY(l: Level, x: number, y: number, r: number, ignoreOneWay = false): number | null {
  const x0 = Math.floor((x - r * 0.65) / TILE), x1 = Math.floor((x + r * 0.65) / TILE);
  const tyStart = Math.max(1, Math.floor((y - 2) / TILE));
  for (let ty = tyStart; ty < l.h; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (officeHasWalkableTop(l, tx, ty, ignoreOneWay)) {
        return ty * TILE;
      }
    }
  }
  return null;
}

export function officeOnStairs(l: Level, x: number, y: number, padPx = 5): boolean {
  const tyFoot = Math.floor((y - 2) / TILE);
  const tyHead = Math.floor((y - 11) / TILE);
  for (const ox of [0, -padPx, padPx]) {
    const tx = Math.floor((x + ox) / TILE);
    if (
      officeTileAt(l, tx, tyFoot) === OT_STAIRS ||
      officeTileAt(l, tx, tyHead) === OT_STAIRS ||
      officeTileAt(l, tx, tyFoot + 1) === OT_STAIRS
    ) {
      return true;
    }
  }
  return false;
}

export function officeStairSpan(
  l: Level,
  x: number,
  y: number,
): { sx0: number; sx1: number; sy0: number; sy1: number; cols: number } | null {
  const tyCand = [Math.floor((y - 2) / TILE), Math.floor((y - 11) / TILE), Math.floor((y + 4) / TILE)];
  const txCand = [Math.floor(x / TILE), Math.floor((x - 7) / TILE), Math.floor((x + 7) / TILE)];
  let hitTx = -1;
  let hitTy = -1;
  for (const cy of tyCand) {
    for (const cx of txCand) {
      if (officeTileAt(l, cx, cy) === OT_STAIRS) {
        hitTx = cx;
        hitTy = cy;
        break;
      }
    }
    if (hitTx >= 0) break;
  }
  if (hitTx < 0) return null;

  let sx0 = hitTx;
  let sx1 = hitTx;
  while (sx0 > 0 && officeTileAt(l, sx0 - 1, hitTy) === OT_STAIRS) sx0--;
  while (sx1 < l.w - 1 && officeTileAt(l, sx1 + 1, hitTy) === OT_STAIRS) sx1++;

  let sy0 = hitTy;
  let sy1 = hitTy;
  while (sy0 > 0) {
    let ok = false;
    for (let cx = sx0; cx <= sx1; cx++) if (officeTileAt(l, cx, sy0 - 1) === OT_STAIRS) { ok = true; break; }
    if (!ok) break;
    sy0--;
  }
  while (sy1 < l.h - 1) {
    let ok = false;
    for (let cx = sx0; cx <= sx1; cx++) if (officeTileAt(l, cx, sy1 + 1) === OT_STAIRS) { ok = true; break; }
    if (!ok) break;
    sy1++;
  }
  return { sx0, sx1, sy0, sy1, cols: sx1 - sx0 + 1 };
}

export function officeStairCenterX(l: Level, x: number, y: number): number | null {
  const sp = officeStairSpan(l, x, y);
  if (!sp) return null;
  return ((sp.sx0 + sp.sx1 + 1) * TILE) / 2;
}

/** Target X along the rendered zig-zag office staircase at height y, so climbers follow the treads. */
export function officeStairZigZagX(l: Level, x: number, y: number): number | null {
  const sp = officeStairSpan(l, x, y);
  if (!sp) return null;
  if (sp.cols <= 1) return sp.sx0 * TILE + TILE / 2;

  const bx = sp.sx0 * TILE;
  const bw = sp.cols * TILE;
  const byTop = sp.sy0 * TILE;
  const byBot = (sp.sy1 + 1) * TILE;
  const totalH = Math.max(TILE, byBot - byTop);
  const storyRows = Math.max(1, Math.round((sp.sy1 - sp.sy0 + 1) / 5));
  const segH = totalH / storyRows;
  const segIdx = clamp(Math.floor(Math.max(0, byBot - y - 1) / segH), 0, storyRows - 1);
  const sBot = byBot - segIdx * segH;
  const u = clamp((sBot - y) / segH, 0, 1);
  const padL = bx + 7;
  const padR = bx + bw - 8;
  if (u <= 0.5) return padL + (padR - padL) * (u * 2);
  return padR - (padR - padL) * ((u - 0.5) * 2);
}

/** Find a nearby stair entrance within maxDist px horizontally (for pressing W/S beside stairs). */
export function officeFindNearbyStairX(l: Level, x: number, y: number, wantDown: boolean, maxDist = 24): number | null {
  const ty = Math.floor((wantDown ? y + 4 : y - 4) / TILE);
  let bestX: number | null = null;
  let bestD = maxDist;
  for (let ox = -maxDist; ox <= maxDist; ox += 4) {
    const cx = x + ox;
    const tx = Math.floor(cx / TILE);
    if (officeTileAt(l, tx, ty) === OT_STAIRS || officeTileAt(l, tx, ty - (wantDown ? 0 : 1)) === OT_STAIRS) {
      const d = Math.abs(ox);
      if (d < bestD) { bestD = d; bestX = cx; }
    }
  }
  return bestX;
}

export function officeOnElev(l: Level, x: number, y: number): boolean {
  const tx = Math.floor(x / TILE);
  const tyFoot = Math.floor((y - 3) / TILE);
  return officeTileAt(l, tx, tyFoot) === OT_ELEV;
}

export interface OfficeStandProp {
  x: number;
  y: number;
  kind: string;
  dead: boolean;
}

/** Tabletop surface Y (pr.y - 9) if falling entity crosses an intact desk from above. */
export function sideTableSurfaceY(
  props: readonly OfficeStandProp[] | undefined,
  x: number,
  oldY: number,
  ny: number,
  dropThrough = false,
): number | null {
  if (!props || dropThrough) return null;
  let best: number | null = null;
  for (const pr of props) {
    if (pr.dead || pr.kind !== 'table') continue;
    const topY = pr.y - 9;
    if (x >= pr.x - 10 && x <= pr.x + 10 && oldY <= topY + 4 && ny >= topY - 0.5) {
      if (best === null || topY < best) best = topY;
    }
  }
  return best;
}

/** Check if an entity at (x, y) is currently supported on top of an intact desk. */
export function sideTableSupportY(
  props: readonly OfficeStandProp[] | undefined,
  x: number,
  y: number,
): number | null {
  if (!props) return null;
  for (const pr of props) {
    if (pr.dead || pr.kind !== 'table') continue;
    const topY = pr.y - 9;
    if (x >= pr.x - 10 && x <= pr.x + 10 && Math.abs(y - topY) <= 4) {
      return topY;
    }
  }
  return null;
}

/** Push an entity horizontally out of any wall/glass overlap at its current floor height. */
export function unstickSideView(l: Level, e: { x: number; y: number; r: number }): boolean {
  const r = e.r * 0.75;
  const minX = 2 * TILE + r + 0.5;
  const maxX = (l.w - 2) * TILE - r - 0.5;
  if (officeTileAt(l, 1, Math.floor((e.y - 6) / TILE)) === OT_WALL && e.x < minX) e.x = minX;
  if (officeTileAt(l, l.w - 2, Math.floor((e.y - 6) / TILE)) === OT_WALL && e.x > maxX) e.x = maxX;
  if (!officeBodySolid(l, e.x, e.y, r)) return false;

  // 1) Try purely horizontal push first so the entity stays on the same floor Y
  for (let ox = 1; ox <= 36; ox += 1.5) {
    for (const sgn of [-1, 1]) {
      const nx = clamp(e.x + sgn * ox, minX, maxX);
      if (!officeBodySolid(l, nx, e.y, r)) {
        e.x = nx;
        return true;
      }
    }
  }
  // 2) Try small vertical + horizontal adjustments if embedded in a floor slab or ceiling corner
  for (let rad = 2; rad <= 40; rad += 2) {
    for (const oy of [-rad * 0.5, rad * 0.5, -rad, rad]) {
      const ny = clamp(e.y + oy, 2 * TILE + 13, (l.h - 2) * TILE);
      for (const ox of [0, -rad, rad]) {
        const nx = clamp(e.x + ox, minX, maxX);
        if (!officeBodySolid(l, nx, ny, r)) {
          e.x = nx;
          e.y = ny;
          return true;
        }
      }
    }
  }
  return true;
}

/** Move entity in side-view with sub-stepped horizontal wall blocking and one-way floor slabs + stairs + office desks. */
export function moveSideView(
  l: Level,
  e: { x: number; y: number; r: number },
  dx: number,
  dy: number,
  dropThrough = false,
  props?: readonly OfficeStandProp[],
): { bx: boolean; by: boolean; onTable?: boolean; hitGlass: { tx: number; ty: number }[] } {
  let bx = false, by = false;
  let onTable = false;
  const hitGlass: { tx: number; ty: number }[] = [];
  const r = e.r * 0.75;

  if (officeBodySolid(l, e.x, e.y, r)) {
    unstickSideView(l, e);
  }

  if (dx !== 0) {
    // Sub-step horizontal motion (max 3.5px per step) so high-speed knockback never tunnels into/through walls!
    const hSteps = Math.max(1, Math.ceil(Math.abs(dx) / 3.5));
    const stepDx = dx / hSteps;
    const dir = Math.sign(dx);
    for (let s = 0; s < hSteps; s++) {
      const nx = e.x + stepDx;
      if (!officeBodySolid(l, nx, e.y, r)) {
        e.x = nx;
      } else {
        // Check if we hit glass tiles
        const txCheck = Math.floor((nx + dir * r) / TILE);
        const y0 = Math.floor((e.y - 12) / TILE), y1 = Math.floor((e.y - 1.5) / TILE);
        for (let ty = y0; ty <= y1; ty++) {
          if (officeTileAt(l, txCheck, ty) === OT_GLASS && !hitGlass.some((g) => g.tx === txCheck && g.ty === ty)) {
            hitGlass.push({ tx: txCheck, ty });
          }
        }
        let tries = 0;
        while (tries < 6 && !officeBodySolid(l, e.x + dir * 0.5, e.y, r)) {
          e.x += dir * 0.5;
          tries++;
        }
        bx = true;
        break;
      }
    }
  }

  if (dy !== 0) {
    const oldY = e.y;
    const ny = e.y + dy;
    if (dy > 0) {
      // Falling / moving down: stop ONLY at horizontal floor tops (where tile above is NOT solid wall/glass), one-way slabs, or desks
      const x0 = Math.floor((e.x - r * 0.7) / TILE), x1 = Math.floor((e.x + r * 0.7) / TILE);
      const ty0 = Math.floor(oldY / TILE), ty1 = Math.floor(ny / TILE);
      let landedY: number | null = null;
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (!officeHasWalkableTop(l, tx, ty, dropThrough)) continue;
          const surfY = ty * TILE;
          if (oldY <= surfY + 3 && (landedY === null || surfY < landedY)) {
            landedY = surfY;
          }
        }
      }
      const tableY = sideTableSurfaceY(props, e.x, oldY, ny, dropThrough);
      if (tableY !== null && ny >= tableY && (landedY === null || tableY <= landedY)) {
        landedY = tableY;
        onTable = true;
      }
      if (landedY !== null && ny >= landedY) {
        e.y = landedY;
        by = true;
      } else if (!officeBodySolid(l, e.x, ny, r)) {
        e.y = ny;
      } else {
        // Step down up to solid boundary without embedding
        let tries = 0;
        while (tries < 12 && !officeBodySolid(l, e.x, e.y + 1, r)) {
          e.y += 1;
          tries++;
        }
        by = true;
      }
    } else {
      // Jumping / moving UP: one-way floor slabs (OT_FLOOR) and desks do NOT block upward movement!
      const x0 = Math.floor((e.x - r * 0.7) / TILE), x1 = Math.floor((e.x + r * 0.7) / TILE);
      const headY = ny - 12;
      const headTy = Math.floor(headY / TILE);
      let hitCeil = false;
      for (let tx = x0; tx <= x1; tx++) {
        const t = officeTileAt(l, tx, headTy);
        if (t === OT_WALL || t === OT_GLASS) { hitCeil = true; break; }
      }
      if (!hitCeil && !officeBodySolid(l, e.x, ny, r)) {
        e.y = ny;
      } else {
        const snapY = (headTy + 1) * TILE + 12.1;
        if (!officeBodySolid(l, e.x, snapY, r)) e.y = snapY;
        by = true;
      }
    }
  }

  if (officeBodySolid(l, e.x, e.y, r)) {
    unstickSideView(l, e);
  }

  return { bx, by, onTable, hitGlass };
}

/** Shatter a glass partition tile and update both level.officeTiles, level.tiles, and levelCanvas. */
export function shatterOfficeGlassTile(l: Level, canvas: HTMLCanvasElement | null, tx: number, ty: number): Vec | null {
  if (!l.officeTiles || tx < 0 || ty < 0 || tx >= l.w || ty >= l.h) return null;
  const idx = ty * l.w + tx;
  if (l.officeTiles[idx] !== OT_GLASS) return null;
  l.officeTiles[idx] = OT_AIR;
  l.tiles[idx] = 0;

  // Also shatter connected vertical glass pane tiles (entire office partition!)
  const pts: { x: number; y: number }[] = [{ x: tx, y: ty }];
  for (const dir of [-1, 1]) {
    for (let dy = 1; dy <= 4; dy++) {
      const ny = ty + dir * dy;
      if (ny < 0 || ny >= l.h) break;
      const nIdx = ny * l.w + tx;
      if (l.officeTiles[nIdx] === OT_GLASS) {
        l.officeTiles[nIdx] = OT_AIR;
        l.tiles[nIdx] = 0;
        pts.push({ x: tx, y: ny });
      } else break;
    }
  }

  if (canvas && l.officeMap) {
    const ctx = canvas.getContext('2d')!;
    const th = OFFICE_THEMES[l.officeMap.theme] ?? OFFICE_THEMES.cyber_night;
    for (const pt of pts) {
      const X = pt.x * TILE, Y = pt.y * TILE;
      ctx.fillStyle = th.roomBg;
      ctx.fillRect(X, Y, TILE, TILE);
      // subtle wall panel seam + broken glass frame stubs at top/bottom
      ctx.fillStyle = th.roomPanel;
      ctx.fillRect(X + 1, Y + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = th.glassCol + '55';
      ctx.fillRect(X + 6, Y, 4, 2);
      ctx.fillRect(X + 6, Y + TILE - 2, 4, 2);
    }
  }

  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** Draw the multi-story side-view office building onto an offscreen canvas. */
export function buildOfficeCanvas(l: Level, _pal: Palette): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = l.w * TILE;
  cv.height = l.h * TILE;
  const ctx = cv.getContext('2d')!;
  const map = l.officeMap;
  const th = OFFICE_THEMES[map?.theme ?? 'cyber_night'];

  // 1. Night / Dusk City Skyline Background (visible outside windows & above roof)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, cv.height);
  skyGrad.addColorStop(0, th.skyTop);
  skyGrad.addColorStop(1, th.skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, cv.width, cv.height);

  // Far & Near skyscraper silhouettes
  for (let bx = 0; bx < cv.width; bx += 28) {
    const hFar = 50 + (hash2(bx, 1, 19) % 130);
    ctx.fillStyle = th.cityFar;
    ctx.fillRect(bx, cv.height - hFar - 40, 26, hFar + 40);
  }
  for (let bx = 8; bx < cv.width; bx += 36) {
    const hNear = 40 + (hash2(bx, 2, 41) % 110);
    const by = cv.height - hNear - 20;
    ctx.fillStyle = th.cityNear;
    ctx.fillRect(bx, by, 32, hNear + 20);
    // Tiny lit skyscraper windows
    for (let wy = by + 6; wy < cv.height - 16; wy += 7) {
      for (let wx = bx + 4; wx < bx + 28; wx += 6) {
        if (hash2(wx, wy, 77) % 5 === 0) {
          ctx.fillStyle = th.cityWin + '77';
          ctx.fillRect(wx, wy, 3, 4);
        }
      }
    }
  }

  // Find top roof slab row so interior fill doesn't overwrite rooftop open sky
  let roofTy = 3;
  for (let ty = 2; ty < Math.min(8, l.h - 2); ty++) {
    let wallCnt = 0;
    for (let tx = 3; tx < l.w - 3; tx++) if (officeTileAt(l, tx, ty) === OT_WALL) wallCnt++;
    if (wallCnt > l.w * 0.5) { roofTy = ty; break; }
  }

  // 2. Interior Corporate Rooms (fill inside building bounds with wainscoting, ceiling conduit & zone trim)
  for (let ty = roofTy + 1; ty < l.h - 1; ty++) {
    for (let tx = 1; tx < l.w - 1; tx++) {
      const t = officeTileAt(l, tx, ty);
      if (t === OT_WALL) continue;
      if (tx >= 2 && tx <= l.w - 3 && ty >= roofTy + 1 && ty <= l.h - 3) {
        const X = tx * TILE, Y = ty * TILE;
        ctx.fillStyle = th.roomBg;
        ctx.fillRect(X, Y, TILE, TILE);
        // Subtle acoustic drywall panel
        ctx.fillStyle = th.roomPanel;
        ctx.fillRect(X + 1, Y + 1, TILE - 2, TILE - 2);
        // Architectural vertical pillar molding every 8 tiles
        if (tx % 8 === 0) {
          ctx.fillStyle = th.wallShade;
          ctx.fillRect(X, Y, 2, TILE);
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(X + 2, Y, 1, TILE);
        }
        // Overhead cable tray / ceiling pipe conduit just below floor slabs
        const above = officeTileAt(l, tx, ty - 1);
        if (above === OT_FLOOR || above === OT_WALL) {
          ctx.fillStyle = th.wallShade;
          ctx.fillRect(X, Y, TILE, 2);
          if ((tx + ty) % 4 === 0) {
            ctx.fillStyle = th.wallTrim;
            ctx.fillRect(X + 6, Y + 2, 4, 1);
          }
        }
        // Wainscoting dado rail & baseboard near floor surface
        const below = officeTileAt(l, tx, ty + 1);
        if (below === OT_FLOOR || below === OT_WALL) {
          ctx.fillStyle = th.wallShade;
          ctx.fillRect(X, Y + TILE - 6, TILE, 6);
          ctx.fillStyle = th.wallTrim + '66';
          ctx.fillRect(X, Y + TILE - 7, TILE, 1);
          ctx.fillStyle = '#0b0e16';
          ctx.fillRect(X, Y + TILE - 2, TILE, 2);
        }
      }
    }
  }

  // 2b. Continuous Elevator Shaft Guide Rails & Counterweight Cables connecting OT_ELEV columns
  for (let tx = 2; tx < l.w - 2; tx++) {
    let minEy = 999, maxEy = -1;
    for (let ty = roofTy + 1; ty < l.h - 1; ty++) {
      if (officeTileAt(l, tx, ty) === OT_ELEV) {
        if (ty < minEy) minEy = ty;
        if (ty > maxEy) maxEy = ty;
      }
    }
    if (maxEy >= minEy) {
      const sx = tx * TILE;
      const topY = Math.max((roofTy + 1) * TILE, (minEy - 4) * TILE);
      const botY = (maxEy + 1) * TILE;
      ctx.fillStyle = 'rgba(6, 10, 18, 0.55)';
      ctx.fillRect(sx + 1, topY, TILE - 2, botY - topY);
      ctx.fillStyle = th.wallTrim + '55';
      ctx.fillRect(sx + 2, topY, 1, botY - topY);
      ctx.fillRect(sx + TILE - 3, topY, 1, botY - topY);
      ctx.fillStyle = th.accent2 + '28';
      ctx.fillRect(sx + 7, topY, 2, botY - topY);
      for (let ry = topY + 6; ry < botY; ry += 12) {
        ctx.fillStyle = th.wallShade;
        ctx.fillRect(sx + 2, ry, TILE - 4, 1);
      }
    }
  }

  // 3. Decor (Windows, Lights, Reception, Cubicles, Copiers, Pantry, Vending, Sofas, Bookshelves, Server Racks, Rooftop HVAC)
  if (map) {
    for (const d of map.decor) {
      const X = d.tx * TILE, Y = d.ty * TILE;
      if (d.kind === 'window') {
        const ww = (d.w ?? 5) * TILE, wh = (d.h ?? 2) * TILE;
        const wSky = ctx.createLinearGradient(0, Y, 0, Y + wh);
        wSky.addColorStop(0, th.skyTop);
        wSky.addColorStop(1, th.skyBot);
        ctx.fillStyle = wSky;
        ctx.fillRect(X, Y, ww, wh);
        // Distant towers inside window
        for (let sx = X + 4; sx < X + ww - 8; sx += 14) {
          const sh = 10 + (hash2(sx, d.ty, 99) % (wh - 6));
          ctx.fillStyle = th.cityNear;
          ctx.fillRect(sx, Y + wh - sh, 10, sh);
          for (let wy = Y + wh - sh + 3; wy < Y + wh - 3; wy += 5) {
            if (hash2(sx, wy, 12) % 3 === 0) {
              ctx.fillStyle = th.cityWin + '99';
              ctx.fillRect(sx + 2, wy, 2, 2);
              ctx.fillRect(sx + 6, wy, 2, 2);
            }
          }
        }
        // Venetian blinds at top of window + mullion frame
        ctx.fillStyle = 'rgba(12, 16, 26, 0.45)';
        ctx.fillRect(X + 2, Y + 2, ww - 4, 5);
        ctx.strokeStyle = th.wallTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(X + 1, Y + 1, ww - 2, wh - 2);
        ctx.fillStyle = th.wallTrim;
        for (let mx = X + TILE * 2; mx < X + ww - 4; mx += TILE * 2) {
          ctx.fillRect(mx, Y, 2, wh);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillRect(X + 3, Y + 3, ww - 6, 3);
      } else if (d.kind === 'light') {
        const lw = (d.w ?? 3) * TILE;
        ctx.fillStyle = th.wallTrim;
        ctx.fillRect(X + 2, Y, lw - 4, 2);
        ctx.fillStyle = th.lightTint;
        ctx.fillRect(X + 4, Y + 2, lw - 8, 2);
      } else if (d.kind === 'chandelier') {
        const cw = (d.w ?? 3) * TILE;
        const cx = X + Math.floor(cw / 2);
        // Grand multi-tier crystal / pendant chandelier
        ctx.fillStyle = th.wallTrim;
        ctx.fillRect(cx - 8, Y, 16, 2);
        ctx.fillRect(cx - 1, Y + 2, 2, 6);
        ctx.fillStyle = '#d9a441';
        ctx.fillRect(cx - 14, Y + 7, 28, 2);
        ctx.fillRect(cx - 9, Y + 11, 18, 2);
        ctx.fillStyle = th.lightTint;
        for (let lx = cx - 12; lx <= cx + 10; lx += 5) {
          ctx.fillRect(lx, Y + 9, 2, 2);
        }
        for (let lx = cx - 7; lx <= cx + 6; lx += 4) {
          ctx.fillRect(lx, Y + 13, 2, 2);
        }
      } else if (d.kind === 'vent') {
        const vw = (d.w ?? 4) * TILE;
        // Ceiling galvanized HVAC duct + louver grilles
        ctx.fillStyle = '#2a3344';
        ctx.fillRect(X, Y + 1, vw, 9);
        ctx.fillStyle = '#3f4c63';
        ctx.fillRect(X + 1, Y + 2, vw - 2, 6);
        ctx.fillStyle = '#181e29';
        for (let gx = X + 5; gx < X + vw - 8; gx += 12) {
          ctx.fillRect(gx, Y + 3, 7, 4);
          ctx.fillStyle = '#5c6e8c';
          ctx.fillRect(gx + 1, Y + 4, 5, 1);
          ctx.fillStyle = '#181e29';
        }
      } else if (d.kind === 'cabinet') {
        ctx.fillStyle = '#3c4559';
        ctx.fillRect(X + 2, Y - 6, 12, 22);
        ctx.fillStyle = '#53607a';
        ctx.fillRect(X + 3, Y - 5, 10, 5);
        ctx.fillRect(X + 3, Y + 2, 10, 5);
        ctx.fillRect(X + 3, Y + 9, 10, 5);
        ctx.fillStyle = '#b9c6e0';
        ctx.fillRect(X + 7, Y - 3, 2, 1);
        ctx.fillRect(X + 7, Y + 4, 2, 1);
        ctx.fillRect(X + 7, Y + 11, 2, 1);
        // Stacked archival binder folders on top
        ctx.fillStyle = th.accent;
        ctx.fillRect(X + 3, Y - 10, 3, 4);
        ctx.fillStyle = th.accent2;
        ctx.fillRect(X + 7, Y - 10, 3, 4);
      } else if (d.kind === 'whiteboard') {
        ctx.fillStyle = '#5a6378';
        ctx.fillRect(X - 4, Y - 8, 24, 14);
        ctx.fillStyle = '#dde5ed';
        ctx.fillRect(X - 3, Y - 7, 22, 12);
        ctx.fillStyle = th.accent;
        ctx.fillRect(X - 1, Y - 4, 9, 1);
        ctx.fillRect(X + 11, Y - 5, 5, 4);
        ctx.fillStyle = '#2d6cdf';
        ctx.fillRect(X - 1, Y - 1, 14, 1);
        ctx.fillRect(X + 1, Y + 2, 8, 1);
        // Sticky notes
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(X + 13, Y + 1, 3, 3);
      } else if (d.kind === 'server') {
        ctx.fillStyle = '#151b26';
        ctx.fillRect(X + 1, Y - 11, 14, 27);
        ctx.fillStyle = '#263044';
        ctx.fillRect(X + 2, Y - 10, 12, 25);
        for (let sy = Y - 8; sy <= Y + 11; sy += 4) {
          ctx.fillStyle = '#0e131d';
          ctx.fillRect(X + 3, sy, 10, 2);
          ctx.fillStyle = (sy + X) % 3 === 0 ? th.accent2 : '#39ff88';
          ctx.fillRect(X + 4, sy, 2, 1);
          ctx.fillStyle = '#ff5a36';
          if ((sy + X) % 5 === 0) ctx.fillRect(X + 10, sy, 2, 1);
        }
      } else if (d.kind === 'plant_bg') {
        // Tall indoor ornamental planter
        ctx.fillStyle = '#6e472b';
        ctx.fillRect(X + 4, Y + 7, 8, 9);
        ctx.fillStyle = '#8c5a36';
        ctx.fillRect(X + 3, Y + 6, 10, 2);
        ctx.fillStyle = '#1e5e2f';
        ctx.fillRect(X + 3, Y - 4, 10, 10);
        ctx.fillStyle = '#38a152';
        ctx.fillRect(X + 2, Y - 6, 4, 6);
        ctx.fillRect(X + 9, Y - 5, 5, 6);
        ctx.fillRect(X + 5, Y - 8, 6, 6);
      } else if (d.kind === 'reception') {
        // Grand Corporate Reception Desk + Backlit Wall Sign + Dual Terminals
        const rw = (d.w ?? 5) * TILE;
        // Backlit corporate feature wall panel
        ctx.fillStyle = '#111624';
        ctx.fillRect(X + 4, Y - 24, rw - 8, 22);
        ctx.fillStyle = th.accent2 + '88';
        ctx.fillRect(X + 4, Y - 24, rw - 8, 1);
        ctx.fillRect(X + 4, Y - 3, rw - 8, 1);
        if (d.label) {
          pfontO(ctx, d.label, X + Math.floor(rw / 2), Y - 15, '#ffffff', '#000000', 1, 'center');
        }
        // Dual computer monitors on desk
        for (const mx of [X + 14, X + rw - 24]) {
          ctx.fillStyle = '#1d2436';
          ctx.fillRect(mx, Y - 5, 10, 6);
          ctx.fillStyle = th.accent2;
          ctx.fillRect(mx + 1, Y - 4, 8, 4);
          ctx.fillStyle = '#39445e';
          ctx.fillRect(mx + 4, Y + 1, 2, 2);
        }
        // Sleek marble & dark wood counter
        ctx.fillStyle = '#1b2130';
        ctx.fillRect(X + 2, Y + 3, rw - 4, 13);
        ctx.fillStyle = '#d8e1ef';
        ctx.fillRect(X, Y + 1, rw, 3);
        ctx.fillStyle = th.accent;
        ctx.fillRect(X + 6, Y + 7, rw - 12, 2);
        ctx.fillStyle = th.accent2;
        ctx.fillRect(X + Math.floor(rw / 2) - 6, Y + 11, 12, 2);
      } else if (d.kind === 'cubicle') {
        // Office Workstation Cubicle: acoustic partition, desk, dual monitors, chair & CPU
        const cw = (d.w ?? 3) * TILE;
        // Partition panel back
        ctx.fillStyle = '#252f45';
        ctx.fillRect(X + 2, Y - 8, cw - 4, 16);
        ctx.fillStyle = '#3c4b6b';
        ctx.fillRect(X + 2, Y - 9, cw - 4, 2);
        // Office task chair
        ctx.fillStyle = '#181d2b';
        ctx.fillRect(X + Math.floor(cw / 2) - 4, Y - 3, 7, 11);
        ctx.fillRect(X + Math.floor(cw / 2) - 1, Y + 8, 2, 7);
        ctx.fillRect(X + Math.floor(cw / 2) - 4, Y + 14, 8, 2);
        // Dual Monitors
        ctx.fillStyle = '#131824';
        ctx.fillRect(X + 6, Y - 5, 11, 7);
        ctx.fillStyle = '#46e2ff';
        ctx.fillRect(X + 7, Y - 4, 9, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(X + 8, Y - 3, 5, 1);
        if (cw >= 40) {
          ctx.fillStyle = '#131824';
          ctx.fillRect(X + cw - 18, Y - 5, 10, 7);
          ctx.fillStyle = '#63f2c8';
          ctx.fillRect(X + cw - 17, Y - 4, 8, 5);
        }
        // Coffee mug & desk surface
        ctx.fillStyle = '#ff6b5b';
        ctx.fillRect(X + 20, Y, 3, 3);
        ctx.fillStyle = '#7c5836';
        ctx.fillRect(X + 1, Y + 3, cw - 2, 3);
        ctx.fillStyle = '#3b2b1d';
        ctx.fillRect(X + 3, Y + 6, 2, 10);
        ctx.fillRect(X + cw - 5, Y + 6, 2, 10);
        // Side acoustic divider post
        ctx.fillStyle = '#49587a';
        ctx.fillRect(X + 1, Y - 9, 2, 25);
        ctx.fillRect(X + cw - 3, Y - 9, 2, 25);
      } else if (d.kind === 'vending') {
        // Illuminated Cyber Vending Machine
        ctx.fillStyle = '#141926';
        ctx.fillRect(X + 1, Y - 10, 14, 26);
        ctx.fillStyle = th.accent;
        ctx.fillRect(X + 2, Y - 9, 12, 2);
        // Lit display window with colorful drink rows
        ctx.fillStyle = '#0c2233';
        ctx.fillRect(X + 3, Y - 6, 8, 13);
        const cols = ['#ff4d6d', '#46e2ff', '#ffd166', '#39ff88'];
        for (let r = 0; r < 3; r++) {
          ctx.fillStyle = cols[r % cols.length];
          ctx.fillRect(X + 4, Y - 5 + r * 4, 2, 3);
          ctx.fillStyle = cols[(r + 1) % cols.length];
          ctx.fillRect(X + 8, Y - 5 + r * 4, 2, 3);
        }
        // Coin panel & dispenser flap
        ctx.fillStyle = '#39ff88';
        ctx.fillRect(X + 12, Y - 3, 1, 3);
        ctx.fillStyle = '#090c14';
        ctx.fillRect(X + 3, Y + 9, 10, 4);
      } else if (d.kind === 'watercooler') {
        // Office Water Cooler with blue gallon jug
        ctx.fillStyle = '#7ce8ff99';
        ctx.fillRect(X + 5, Y - 6, 6, 8);
        ctx.fillStyle = '#ffffff88';
        ctx.fillRect(X + 6, Y - 5, 2, 5);
        ctx.fillStyle = '#d8e1ef';
        ctx.fillRect(X + 4, Y + 2, 8, 14);
        ctx.fillStyle = '#9aa8c2';
        ctx.fillRect(X + 4, Y + 9, 8, 7);
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(X + 6, Y + 5, 1, 2);
        ctx.fillStyle = '#35f0ff';
        ctx.fillRect(X + 9, Y + 5, 1, 2);
      } else if (d.kind === 'sofa') {
        const sw = (d.w ?? 3) * TILE;
        // Area carpet runner
        ctx.fillStyle = th.accent + '44';
        ctx.fillRect(X, Y + 14, sw, 2);
        // Plush leather sofa backrest & cushions
        ctx.fillStyle = '#3b1f2b';
        ctx.fillRect(X + 3, Y + 2, sw - 6, 7);
        ctx.fillStyle = '#5e2f40';
        ctx.fillRect(X + 4, Y + 3, sw - 8, 5);
        // Armrests & seat base
        ctx.fillStyle = '#2b151e';
        ctx.fillRect(X + 1, Y + 5, 4, 10);
        ctx.fillRect(X + sw - 5, Y + 5, 4, 10);
        ctx.fillRect(X + 3, Y + 9, sw - 6, 6);
        // Low glass coffee table in front
        ctx.fillStyle = '#7ce8ff88';
        ctx.fillRect(X + 10, Y + 11, sw - 20, 2);
      } else if (d.kind === 'bookshelf') {
        const bw = (d.w ?? 3) * TILE;
        ctx.fillStyle = '#2b1d16';
        ctx.fillRect(X + 2, Y - 12, bw - 4, 28);
        ctx.fillStyle = '#473023';
        ctx.fillRect(X + 3, Y - 11, bw - 6, 26);
        const bookCols = ['#e0533c', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ec4899'];
        for (let sy = Y - 9; sy <= Y + 9; sy += 6) {
          ctx.fillStyle = '#1f140e';
          ctx.fillRect(X + 4, sy, bw - 8, 5);
          for (let bx = X + 5; bx < X + bw - 7; bx += 4) {
            if ((bx + sy) % 5 !== 0) {
              ctx.fillStyle = bookCols[(bx + sy) % bookCols.length];
              ctx.fillRect(bx, sy + 1, 3, 4);
            }
          }
        }
      } else if (d.kind === 'pantry') {
        const pw = (d.w ?? 4) * TILE;
        // Upper kitchen cabinets
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(X + 2, Y - 12, pw - 20, 8);
        ctx.fillStyle = '#4a5568';
        for (let cx = X + 4; cx < X + pw - 24; cx += 10) {
          ctx.fillRect(cx, Y - 11, 8, 6);
        }
        // Stainless Steel Refrigerator on right end
        ctx.fillStyle = '#718096';
        ctx.fillRect(X + pw - 16, Y - 11, 14, 27);
        ctx.fillStyle = '#a0aec0';
        ctx.fillRect(X + pw - 15, Y - 10, 12, 11);
        ctx.fillRect(X + pw - 15, Y + 2, 12, 13);
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(X + pw - 5, Y - 6, 1, 4);
        ctx.fillRect(X + pw - 5, Y + 4, 1, 5);
        // Espresso Machine & Microwave on counter
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(X + 6, Y - 2, 9, 6);
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(X + 7, Y - 1, 3, 2);
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(X + 20, Y - 1, 11, 5);
        ctx.fillStyle = '#38b2ac';
        ctx.fillRect(X + 22, Y, 6, 3);
        // Countertop & lower cabinets
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(X + 2, Y + 4, pw - 18, 2);
        ctx.fillStyle = '#242c3d';
        ctx.fillRect(X + 2, Y + 6, pw - 18, 10);
      } else if (d.kind === 'copier') {
        const cw = (d.w ?? 2) * TILE;
        // Large Office Multifunction Photocopier / Printer
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(X + 3, Y - 1, cw - 6, 17);
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(X + 2, Y - 4, cw - 4, 3);
        ctx.fillStyle = '#39ff88';
        ctx.fillRect(X + 5, Y - 3, 4, 1);
        // Paper tray & vents
        ctx.fillStyle = '#718096';
        for (let ty2 = Y + 3; ty2 <= Y + 12; ty2 += 4) {
          ctx.fillRect(X + 5, ty2, cw - 10, 2);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(X + cw - 3, Y + 4, 3, 2);
      } else if (d.kind === 'banner') {
        const bw = (d.w ?? 5) * TILE;
        ctx.fillStyle = '#090d16';
        ctx.fillRect(X + 2, Y, bw - 4, 12);
        ctx.strokeStyle = th.accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(X + 2.5, Y + 0.5, bw - 5, 11);
        ctx.fillStyle = th.accent2;
        ctx.fillRect(X + 5, Y + 2, 6, 2);
        ctx.fillStyle = '#39ff88';
        ctx.fillRect(X + bw - 12, Y + 2, 6, 2);
        if (d.label) {
          pfontO(ctx, d.label, X + Math.floor(bw / 2), Y + 4, th.lightTint, '#000000', 1, 'center');
        }
      } else if (d.kind === 'security_gate') {
        // Walk-through Security Metal Detector Archway
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(X + 1, Y - 9, 3, 25);
        ctx.fillRect(X + 12, Y - 9, 3, 25);
        ctx.fillRect(X + 1, Y - 10, 14, 3);
        ctx.fillStyle = '#39ff88';
        ctx.fillRect(X + 5, Y - 9, 6, 1);
        ctx.fillStyle = th.accent2 + '33';
        ctx.fillRect(X + 4, Y - 7, 8, 22);
      } else if (d.kind === 'rooftop_hvac') {
        const rw = (d.w ?? 6) * TILE;
        if (d.label === 'HVAC') {
          // Industrial Rooftop Chiller Units & Exhaust Fans
          ctx.fillStyle = '#1e2636';
          ctx.fillRect(X + 4, Y, rw - 8, 16);
          ctx.fillStyle = '#344159';
          ctx.fillRect(X + 6, Y + 2, rw - 12, 12);
          for (let fx = X + 10; fx < X + rw - 16; fx += 18) {
            ctx.fillStyle = '#0d111a';
            ctx.fillRect(fx, Y + 4, 12, 8);
            ctx.fillStyle = '#5c6e8c';
            ctx.fillRect(fx + 2, Y + 6, 8, 4);
          }
        } else if (d.label === 'SAT') {
          // Rooftop Communications Dish & Radio Mast
          ctx.fillStyle = '#2b3548';
          ctx.fillRect(X + 12, Y + 4, 14, 12);
          ctx.fillStyle = '#718096';
          ctx.fillRect(X + 42, Y - 18, 2, 34);
          ctx.fillRect(X + 38, Y - 10, 10, 1);
          ctx.fillStyle = '#ff3b3b';
          ctx.fillRect(X + 41, Y - 20, 4, 3);
          // Parabolic dish
          pline(ctx, X + 18, Y + 4, X + 8, Y - 8, '#a0aec0', 2);
          pline(ctx, X + 8, Y - 8, X + 26, Y - 12, '#cbd5e0', 2);
          pline(ctx, X + 17, Y - 10, X + 23, Y - 15, th.accent2, 1);
        } else {
          // Giant Rooftop Neon Corporate Signboard + Helipad Beacon
          ctx.fillStyle = '#2d3748';
          ctx.fillRect(X + 8, Y + 6, 3, 10);
          ctx.fillRect(X + rw - 11, Y + 6, 3, 10);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(X + 2, Y - 10, rw - 4, 17);
          ctx.strokeStyle = th.accent;
          ctx.lineWidth = 2;
          ctx.strokeRect(X + 3, Y - 9, rw - 6, 15);
          pfontO(ctx, d.label || 'NAGA CORP HQ', X + Math.floor(rw / 2), Y - 4, th.accent2, '#000000', 1, 'center');
        }
      }
    }
  }

  // 4. Tiles: Solid Walls (1), One-Way Floor Slabs (2), Stairs (3), Breakable Glass (4), Elevator Pads (5)
  const drawnStair = new Uint8Array(l.w * l.h);
  const drawDiagonalFlight = (
    xStart: number,
    yStart: number,
    xEnd: number,
    yEnd: number,
    steps: number,
  ) => {
    const dx = xEnd - xStart;
    const dy = yEnd - yStart; // negative (going UP)
    const sw = Math.abs(dx) / steps;
    const sh = Math.abs(dy) / steps;
    const dir = dx >= 0 ? 1 : -1;

    // Angled steel stringer beam underneath the steps
    ctx.strokeStyle = '#0d111a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(xStart, yStart + 2);
    ctx.lineTo(xEnd, yEnd + 4);
    ctx.stroke();

    ctx.strokeStyle = th.slabBody;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xStart, yStart + 2);
    ctx.lineTo(xEnd, yEnd + 4);
    ctx.stroke();

    // Individual chunky stair steps (riser + tread + bright top edge)
    for (let s = 0; s < steps; s++) {
      const sx0 = xStart + dir * s * sw;
      const sx1 = xStart + dir * (s + 1) * sw;
      const rx = Math.round(Math.min(sx0, sx1));
      const rw = Math.max(3, Math.ceil(Math.abs(sx1 - sx0)) + 1);
      const ry = Math.round(yStart + (s + 1) * (dy / steps));
      const rh = Math.max(3, Math.ceil(sh) + 2);

      // Step riser block
      ctx.fillStyle = th.wallShade;
      ctx.fillRect(rx, ry + 2, rw, rh);
      // Warm/metallic stair tread cap
      ctx.fillStyle = th.stairCol;
      ctx.fillRect(rx - (dir < 0 ? 1 : 0), ry, rw + 1, 2);
      ctx.fillStyle = '#fff3d1';
      ctx.globalAlpha = 0.45;
      ctx.fillRect(rx, ry, rw, 1);
      ctx.globalAlpha = 1;
    }

    // Handrail balusters & angled safety rail
    ctx.fillStyle = th.wallTrim;
    for (let s = 0; s <= steps; s += Math.max(1, Math.floor(steps / 3))) {
      const bx = Math.round(xStart + (s / steps) * dx);
      const by = Math.round(yStart + (s / steps) * dy);
      ctx.fillRect(bx, by - 9, 1, 9);
    }
    pline(ctx, xStart, yStart - 8, xEnd, yEnd - 8, '#0b0d14', 2);
    pline(ctx, xStart, yStart - 9, xEnd, yEnd - 9, th.wallTrim, 1);
    pline(ctx, xStart, yStart - 10, xEnd, yEnd - 10, '#cfd9eb', 1);
  };

  for (let ty = 0; ty < l.h; ty++) {
    for (let tx = 0; tx < l.w; tx++) {
      const t = officeTileAt(l, tx, ty);
      const X = tx * TILE, Y = ty * TILE;
      if (t === OT_WALL) {
        ctx.fillStyle = th.wallFill;
        ctx.fillRect(X, Y, TILE, TILE);
        ctx.fillStyle = th.wallShade;
        ctx.fillRect(X, Y + TILE - 3, TILE, 3);
        ctx.fillRect(X + TILE - 2, Y, 2, TILE);
        if (officeTileAt(l, tx, ty - 1) !== OT_WALL) {
          ctx.fillStyle = th.wallTrim;
          ctx.fillRect(X, Y, TILE, 3);
        }
        if ((tx + ty) % 3 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(X + 3, Y + 5, 5, 2);
        }
      } else if (t === OT_FLOOR) {
        // Sleek concrete & steel floor slab with drop ceiling underneath
        ctx.fillStyle = th.slabTop;
        ctx.fillRect(X, Y, TILE, 3);
        ctx.fillStyle = th.slabBody;
        ctx.fillRect(X, Y + 3, TILE, 5);
        ctx.fillStyle = th.slabBot;
        ctx.fillRect(X, Y + 8, TILE, 2);
        // Steel I-beam rivets
        ctx.fillStyle = th.wallTrim;
        ctx.fillRect(X + 3, Y + 5, 2, 1);
        ctx.fillRect(X + 11, Y + 5, 2, 1);
        // Safety balcony railing on open edges of mezzanine / stairwell drop-offs
        const leftOpen = officeTileAt(l, tx - 1, ty) === OT_AIR;
        const rightOpen = officeTileAt(l, tx + 1, ty) === OT_AIR;
        if (leftOpen || rightOpen) {
          ctx.fillStyle = th.wallTrim;
          if (leftOpen) ctx.fillRect(X, Y - 7, 2, 7);
          if (rightOpen) ctx.fillRect(X + TILE - 2, Y - 7, 2, 7);
          ctx.fillStyle = th.accent2 + '88';
          ctx.fillRect(X, Y - 7, TILE, 1);
        }
      } else if (t === OT_STAIRS) {
        if (drawnStair[ty * l.w + tx]) continue;
        // Measure horizontal span of contiguous OT_STAIRS at this row
        let sx0 = tx, sx1 = tx;
        while (sx0 > 0 && officeTileAt(l, sx0 - 1, ty) === OT_STAIRS) sx0--;
        while (sx1 < l.w - 1 && officeTileAt(l, sx1 + 1, ty) === OT_STAIRS) sx1++;
        const cols = sx1 - sx0 + 1;

        if (cols >= 2) {
          // Multi-tile stairwell bay: find vertical extent matching this bay width
          let sy0 = ty, sy1 = ty;
          while (sy0 > 0) {
            let ok = false;
            for (let x = sx0; x <= sx1; x++) if (officeTileAt(l, x, sy0 - 1) === OT_STAIRS) { ok = true; break; }
            if (!ok) break;
            sy0--;
          }
          while (sy1 < l.h - 1) {
            let ok = false;
            for (let x = sx0; x <= sx1; x++) if (officeTileAt(l, x, sy1 + 1) === OT_STAIRS) { ok = true; break; }
            if (!ok) break;
            sy1++;
          }
          for (let y = sy0; y <= sy1; y++) {
            for (let x = sx0; x <= sx1; x++) {
              if (officeTileAt(l, x, y) === OT_STAIRS) drawnStair[y * l.w + x] = 1;
            }
          }

          const bx = sx0 * TILE, bw = cols * TILE;
          const byTop = sy0 * TILE, byBot = (sy1 + 1) * TILE;
          const totalH = byBot - byTop;

          // Recessed architectural stairwell shaft background
          ctx.fillStyle = 'rgba(6, 8, 14, 0.56)';
          ctx.fillRect(bx + 1, byTop, bw - 2, totalH);
          ctx.fillStyle = th.wallShade;
          ctx.fillRect(bx, byTop, 2, totalH);
          ctx.fillRect(bx + bw - 2, byTop, 2, totalH);

          // Split shaft into 5-tile (80px) floor-to-floor flights with zig-zag switchback steps
          const storyRows = Math.max(1, Math.round((sy1 - sy0 + 1) / 5));
          const segH = totalH / storyRows;
          for (let f = 0; f < storyRows; f++) {
            const sBot = Math.round(byBot - f * segH);
            const sTop = Math.round(byBot - (f + 1) * segH);
            const sMid = Math.round((sBot + sTop) * 0.5);
            const padL = bx + 5;
            const padR = bx + bw - 6;
            const landW = Math.max(10, Math.round(bw * 0.24));

            // Lower flight: left -> right up to mid-landing
            drawDiagonalFlight(padL, sBot - 3, padR - landW + 2, sMid, Math.max(4, Math.min(7, cols + 2)));

            // Mid-landing platform (bordes)
            ctx.fillStyle = th.slabBody;
            ctx.fillRect(padR - landW, sMid, landW + 3, 5);
            ctx.fillStyle = th.stairCol;
            ctx.fillRect(padR - landW, sMid - 1, landW + 3, 2);
            ctx.fillStyle = th.wallTrim;
            ctx.fillRect(padR - landW, sMid - 9, 1, 9);
            ctx.fillRect(padR + 2, sMid - 9, 1, 9);
            pline(ctx, padR - landW, sMid - 9, padR + 2, sMid - 9, '#cfd9eb', 1);

            // Upper flight: mid-landing right -> upper floor left
            drawDiagonalFlight(padR - landW + 1, sMid - 1, padL + 2, sTop + 3, Math.max(4, Math.min(7, cols + 2)));

            // Top landing edge connecting cleanly to the floor slab
            ctx.fillStyle = th.stairCol;
            ctx.fillRect(bx + 2, sTop, Math.min(bw - 4, 14), 2);
          }
        } else {
          drawnStair[ty * l.w + tx] = 1;
          // Check for diagonal stair placement in custom maps
          const diagUpR = officeTileAt(l, tx + 1, ty - 1) === OT_STAIRS || officeTileAt(l, tx - 1, ty + 1) === OT_STAIRS;
          const diagUpL = officeTileAt(l, tx - 1, ty - 1) === OT_STAIRS || officeTileAt(l, tx + 1, ty + 1) === OT_STAIRS;
          if (diagUpR) {
            drawDiagonalFlight(X, Y + TILE - 1, X + TILE, Y - 1, 4);
          } else if (diagUpL) {
            drawDiagonalFlight(X + TILE, Y + TILE - 1, X, Y - 1, 4);
          } else {
            // Single-column industrial steel access ladder
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fillRect(X + 3, Y, TILE - 6, TILE);
            ctx.fillStyle = th.wallTrim;
            ctx.fillRect(X + 3, Y, 2, TILE);
            ctx.fillRect(X + TILE - 5, Y, 2, TILE);
            ctx.fillStyle = th.stairCol;
            for (let sy = 2; sy < TILE; sy += 4) {
              ctx.fillRect(X + 4, Y + sy, TILE - 8, 2);
            }
          }
        }
      } else if (t === OT_GLASS) {
        // Translucent cyan/tint glass partition with diagonal specular streaks
        ctx.fillStyle = th.glassCol + '38';
        ctx.fillRect(X + 5, Y, 6, TILE);
        ctx.fillStyle = th.glassCol + 'aa';
        ctx.fillRect(X + 5, Y, 1, TILE);
        ctx.fillRect(X + 10, Y, 1, TILE);
        ctx.fillStyle = '#ffffff88';
        ctx.fillRect(X + 7, Y + 3, 2, 4);
        ctx.fillRect(X + 7, Y + 11, 2, 3);
      } else if (t === OT_ELEV) {
        // Elevator shaft frame + glowing up pad
        ctx.fillStyle = th.wallShade;
        ctx.fillRect(X + 1, Y, TILE - 2, TILE);
        ctx.fillStyle = th.accent2 + '44';
        ctx.fillRect(X + 2, Y + 2, TILE - 4, TILE - 2);
        ctx.fillStyle = th.accent2;
        ctx.fillRect(X + 2, Y + TILE - 3, TILE - 4, 2);
        // Up chevron
        px(ctx, X + 8, Y + 7, th.accent2);
        pline(ctx, X + 5, Y + 10, X + 8, Y + 7, th.accent2, 1);
        pline(ctx, X + 11, Y + 10, X + 8, Y + 7, th.accent2, 1);
      }
    }
  }

  // 5. Floor Stencil Numbers & Department Zone Plaques (LT 1 LOBBY, LT 2 WORKSPACE, LT 3 SERVER, LT 4 EXEC)
  const zoneNames = ['LOBBY & SEC', 'WORK & CAFE', 'CYBER LAB', 'EXEC SUITE', 'PENTHOUSE'];
  if (l.officeFloors) {
    l.officeFloors.forEach((fy, idx) => {
      const floorNum = idx + 1;
      const zName = zoneNames[idx % zoneNames.length];
      pfontO(ctx, `LT ${floorNum}  ${zName}`, 38, fy - 24, th.wallTrim, '#000', 1, 'left');
      pfontO(ctx, `LT ${floorNum}`, l.w * TILE - 38, fy - 24, th.wallTrim, '#000', 1, 'right');
    });
  }
  const drawGateDoor = (gx: number, gy: number, side: 'L' | 'R') => {
    const X = Math.round(gx - 8), Y = Math.round(gy - 24);
    prect(ctx, X, Y, 16, 24, th.wallShade);
    prect(ctx, X + 2, Y + 2, 12, 22, '#0b0e14');
    prect(ctx, X + 2, Y + 2, 12, 2, th.accent);
    pfontO(ctx, side === 'L' ? 'IN>' : '<IN', gx, Y - 5, th.accent, '#000', 1, 'center');
  };
  for (const g of l.leftSpawns ?? []) drawGateDoor(g.x, g.y, 'L');
  for (const g of l.rightSpawns ?? []) drawGateDoor(g.x, g.y, 'R');

  return cv;
}

/** Live animated ambient effects for side-view office (light cones, blinking server LEDs, monitor glow, rooftop beacon, dust). */
export function drawOfficeAmbience(ctx: Ctx, l: Level, camX: number, camY: number, time: number, sw: number, sh: number) {
  const map = l.officeMap;
  if (!map) return;
  const th = OFFICE_THEMES[map.theme] ?? OFFICE_THEMES.cyber_night;

  // Soft fluorescent & chandelier light cones + live blinking server / cubicle / rooftop lights
  for (const d of map.decor) {
    const lx = d.tx * TILE, ly = d.ty * TILE;
    if (d.kind === 'light' || d.kind === 'chandelier') {
      const lw = (d.w ?? 3) * TILE;
      if (lx + lw < camX - 24 || lx > camX + sw + 24 || ly + 52 < camY || ly > camY + sh) continue;
      const flicker = (hash2(d.tx, d.ty, 7) % 5 === 0 && Math.sin(time * 24 + d.tx) > 0.92) ? 0.03 : d.kind === 'chandelier' ? 0.11 : 0.075;
      ctx.fillStyle = d.kind === 'chandelier' ? '#ffe8b0' : th.lightTint;
      ctx.globalAlpha = flicker;
      ctx.beginPath();
      ctx.moveTo(lx + 4, ly + 4);
      ctx.lineTo(lx + lw - 4, ly + 4);
      ctx.lineTo(lx + lw + 12, ly + 50);
      ctx.lineTo(lx - 12, ly + 50);
      ctx.closePath();
      ctx.fill();
    } else if (d.kind === 'server') {
      if (lx + 16 < camX || lx > camX + sw || ly + 16 < camY || ly - 12 > camY + sh) continue;
      const blinkRow = Math.floor(time * 9 + d.tx * 3) % 5;
      ctx.globalAlpha = 0.85;
      px(ctx, lx + 8, ly - 8 + blinkRow * 4, blinkRow % 2 === 0 ? '#39ff88' : th.accent2);
      px(ctx, lx + 10, ly - 8 + ((blinkRow + 2) % 5) * 4, '#ffd166');
    } else if (d.kind === 'cubicle' || d.kind === 'reception') {
      const cw = (d.w ?? 3) * TILE;
      if (lx + cw < camX || lx > camX + sw || ly + 16 < camY || ly - 10 > camY + sh) continue;
      ctx.globalAlpha = 0.14 + 0.05 * Math.sin(time * 6 + d.tx);
      prect(ctx, lx + 6, ly - 6, 11, 7, th.accent2);
    } else if (d.kind === 'rooftop_hvac' && d.label === 'SAT') {
      if (lx + 60 < camX || lx > camX + sw || ly + 16 < camY || ly - 24 > camY + sh) continue;
      const beaconOn = Math.sin(time * 7) > 0;
      if (beaconOn) {
        ctx.globalAlpha = 0.9;
        prect(ctx, lx + 41, ly - 20, 4, 3, '#ff2a2a');
        ctx.globalAlpha = 0.28;
        prect(ctx, lx + 39, ly - 22, 8, 7, '#ff5a5a');
      }
    }
  }
  ctx.globalAlpha = 1;

  // Pulsing glow on Left & Right spawn doors
  const pulse = 0.25 + 0.2 * Math.sin(time * 5);
  ctx.globalAlpha = pulse;
  for (const g of [...(l.leftSpawns ?? []), ...(l.rightSpawns ?? [])]) {
    if (g.x < camX - 24 || g.x > camX + sw + 24 || g.y < camY - 24 || g.y > camY + sh + 24) continue;
    prect(ctx, Math.round(g.x - 5), Math.round(g.y - 20), 10, 18, th.accent);
  }
  ctx.globalAlpha = 1;

  // Subtle floating dust / office air motes
  for (let i = 0; i < 18; i++) {
    const mx = camX + ((hash2(i, 1, 31) + time * (6 + (i % 5))) % sw);
    const my = camY + ((hash2(i, 2, 57) + Math.sin(time * 0.9 + i) * 14) % sh);
    ctx.globalAlpha = 0.22;
    px(ctx, mx, my, th.lightTint);
  }
  ctx.globalAlpha = 1;
}

/** Determine which story floor number (1-based) an entity at y is currently on. */
export function officeFloorIndex(l: Level, y: number): number {
  const floors = l.officeFloors;
  if (!floors || floors.length === 0) return 1;
  let best = 1;
  let bestDist = Infinity;
  floors.forEach((fy, idx) => {
    const d = Math.abs(y - fy);
    if (d < bestDist) { bestDist = d; best = idx + 1; }
  });
  return best;
}

/** Polyline of the walkable tread surface (feet height) for the drawn zig-zag flight at this height:
 *  lower floor -> up-right to the mid-landing -> landing -> up-left to the upper floor. */
export function officeStairPath(l: Level, x: number, y: number): { x: number; y: number }[] | null {
  const sp = officeStairSpan(l, x, y);
  if (!sp || sp.cols < 2) return null;
  const bx = sp.sx0 * TILE, bw = sp.cols * TILE;
  const byTop = sp.sy0 * TILE, byBot = (sp.sy1 + 1) * TILE;
  const totalH = Math.max(TILE, byBot - byTop);
  const storyRows = Math.max(1, Math.round((sp.sy1 - sp.sy0 + 1) / 5));
  const segH = totalH / storyRows;
  const segIdx = clamp(Math.floor(Math.max(0, byBot - y - 1) / segH), 0, storyRows - 1);
  const sBot = Math.round(byBot - segIdx * segH);
  const sTop = Math.round(byBot - (segIdx + 1) * segH);
  const sMid = Math.round((sBot + sTop) * 0.5);
  const padL = bx + 5, padR = bx + bw - 6;
  const landW = Math.max(10, Math.round(bw * 0.24));
  const turnX = padR - landW + 2;
  return [
    { x: padL - 2, y: sBot },
    { x: padL, y: sBot - 2 },
    { x: turnX, y: sMid - 1 },
    { x: padR - 1, y: sMid - 1 },
    { x: turnX, y: sMid - 1.5 },
    { x: padL + 2, y: sTop + 2 },
    { x: padL, y: sTop },
  ];
}

export function stairPathProject(pts: { x: number; y: number }[], x: number, y: number) {
  let best = Infinity, bestS = 0, acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1e-3;
    const u = clamp(((x - a.x) * dx + (y - a.y) * dy) / (len * len), 0, 1);
    const d = Math.hypot(a.x + dx * u - x, a.y + dy * u - y);
    if (d < best) { best = d; bestS = acc + u * len; }
    acc += len;
  }
  return { s: bestS, total: acc, dist: best };
}

export function stairPathAt(pts: { x: number; y: number }[], s: number) {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (s <= acc + len || i === pts.length - 2) {
      const u = len > 0 ? clamp((s - acc) / len, 0, 1) : 0;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dir: Math.sign(b.x - a.x) };
    }
    acc += len;
  }
  return { ...pts[pts.length - 1], dir: 0 };
}
