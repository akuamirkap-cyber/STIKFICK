export type PlayMode = 'story' | 'survival' | 'training';
export type Panel = 'controls' | 'moves' | 'updates' | 'profile' | null;
export type PracticeStyle = 'fist' | 'foot';

export type FootPracticeRoute = 'flow' | 'mixed' | 'aerial' | 'flamingo' | 'v2' | 'v3';
export const FOOT_PRACTICE = {
  v3: {
    label: 'Foot V3', hint: 'J x6. Jurus V2 dan V1 bergantian: Yeop Chagi, Rasteira, Backlash kiri, Au Batido, Konoha Senpu, Ember Crescent.',
    keys: ['J', 'J', 'J', 'J', 'J', 'J'], moves: ['F2_YEOP', 'FT_RASTEIRA', 'F2_BACK_L', 'FT_AU', 'F2_SENPU', 'FT_EMBER'],
  },
  v2: {
    label: 'Foot V2', hint: 'J, J, J, J, K. Yeop Chagi, Flamingo Thrust, Backlash Heel kiri dan kanan, lalu Hunting Hawk.',
    keys: ['J', 'J', 'J', 'J', 'K'], moves: ['F2_YEOP', 'F2_THRUST', 'F2_BACK_L', 'F2_BACK_R', 'F2_HAWK'],
  },
  flamingo: {
    label: 'Flamingo', hint: 'I, J, J, K. Dua benturan dari Switch Double, lalu Reverse Hook dan Heel Breaker.',
    keys: ['I', 'J', 'J', 'K'], moves: ['FT_FL_DOUBLE', 'FT_FL_DOUBLE', 'FT_FL_HOOK', 'FT_FL_BREAK'],
  },
  flow: {
    label: 'Flow', hint: 'Lima tendangan capoeira: Rasteira, Side Snap, Au Batido, Lotus Wheel, Ember Crescent.',
    keys: ['J', 'J', 'J', 'J', 'J'], moves: ['FT_RASTEIRA', 'FT_SIDE', 'FT_AU', 'FT_WHEEL', 'FT_EMBER'],
  },
  mixed: {
    label: 'Mix', hint: 'Kenakan Side Snap dan Crosswind untuk membuka Cinder Dragon.',
    keys: ['J', 'J', 'K', 'J'], moves: ['FT_RASTEIRA', 'FT_SIDE', 'FT_CROSS', 'FT_DRAGON'],
  },
  aerial: {
    label: 'Udara', hint: 'Angkat partner, lompat, lalu tutup dengan Comet Drop.',
    keys: ['S + K', 'Spasi', 'J', 'J', 'K'], moves: ['FT_LAUNCH', 'FT_AIR_SCISSOR', 'FT_AIR_TORNADO', 'FT_AIR_COMET'],
  },
} as const satisfies Record<FootPracticeRoute, { label: string; hint: string; keys: readonly string[]; moves: readonly string[] }>;

export const modes: {
  id: PlayMode;
  name: string;
  label: string;
  description: string;
  image: string;
  number: string;
}[] = [
  {
    id: 'story',
    name: 'Story Mode',
    label: 'CAMPAIGN',
    description: 'Hadapi para bos dan buka jurus baru.',
    image: 'mode-story',
    number: '01',
  },
  {
    id: 'survival',
    name: 'Survival',
    label: 'ENDLESS',
    description: 'Bertahan dari gelombang musuh tanpa akhir.',
    image: 'mode-survival',
    number: '02',
  },
  {
    id: 'training',
    name: 'Dojo Latihan',
    label: 'PRACTICE',
    description: 'Asah kombo dan sempurnakan teknikmu.',
    image: 'mode-dojo',
    number: '03',
  },
];

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`pigeon_${key}`);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(`pigeon_${key}`, JSON.stringify(value));
  } catch {
    /* Private browsing can disable storage. */
  }
}

export const controls = [
  { key: 'A / D', name: 'Gerak kiri / kanan', desc: 'Geser posisi petarung di arena.' },
  { key: 'W / S', name: 'Gerak atas / bawah', desc: 'Jelajahi arena top-down atau gunakan tangga.' },
  { key: 'J', name: 'Serangan ringan', desc: 'Alternatif: klik kiri pada arena.' },
  { key: 'O', name: 'Foot Mode', desc: 'Pilih gaya kaki. Q atau roda mouse menggilir Fist, Foot, lalu Pistol.' },
  { key: 'I', name: 'Kuda-kuda Flamingo', desc: 'Saat memakai Foot Mode, ubah kaki depan lalu sambungkan J, J, K.' },
  {
    key: 'K',
    name: 'Serangan berat / clinch',
    desc: 'Alternatif: klik kanan. Clinch aktif saat lawan goyah.',
  },
  { key: 'Shift', name: 'Dash', desc: 'Berpindah posisi dengan cepat.' },
  { key: 'Space', name: 'Lompat', desc: 'Lompat dan sambungkan serangan udara.' },
  { key: 'C', name: 'Parry', desc: 'Tangkis serangan dengan timing yang tepat.' },
  { key: 'Esc', name: 'Jeda / lanjutkan', desc: 'Hentikan atau lanjutkan sesi permainan.' },
];
