/**
 * Konfigurasi versi suara pukulan / tendangan / pentungan.
 *
 * V1 : suara asli game (sampel embedded di soundData.ts: punch (1..3).mp3).
 * V2 : suara V1 DICAMPUR dengan paket suara baru di bawah ini.
 * V3 : HANYA paket suara baru di bawah ini (tanpa V1).
 *
 * Semua file paket diambil dari folder `public/sounds/` dengan nama PERSIS
 * seperti daftar di bawah. File yang belum ada akan dilewati (ada peringatan di
 * console). Jika sebuah kategori kosong (tidak ada file yang termuat), game
 * memakai suara synth bawaan untuk kategori itu.
 */

export type SoundVersion = 'v1' | 'v2' | 'v3';

/** Kategori dampak: punch = pukulan, kick = tendangan, heavy = pentungan / hantaman berat. */
export type PackKind = 'punch' | 'kick' | 'heavy';

export const SOUND_PACK_FILES: Record<PackKind, string[]> = {
  punch: [
    'Punch Hit 1.wav',
    'Punch Hit 2.wav',
    'Punch Hit 3.wav',
    'punch (1).mp3',
    'punch (2).mp3',
    'punch (3).mp3',
  ],
  kick: [
    'kick type1 02.wav',
    'kick type1 03.wav',
    'kick type1 04.wav',
    'kick type2 02.wav',
  ],
  heavy: [
    'kick type3 02.wav',
    'kick type3 03.wav',
    'kick type3 04.wav',
    'kick type3 05.wav',
  ],
};

/** File yang sudah ada di V1 (embedded). Pada V2 file ini tidak dimuat ulang agar tidak dobel. */
export const V1_SOURCE_FILES = ['punch (1).mp3', 'punch (2).mp3', 'punch (3).mp3'];

/**
 * Aset suara yang benar-benar ada di folder ./sounds, diselesaikan saat build.
 * File di-inline ke bundel, jadi tidak ada request yang gagal (404) untuk file
 * yang belum tersedia, dan suara tetap jalan walau dibuka tanpa server.
 * Menambah suara baru = taruh filenya di ./sounds lalu build ulang.
 */
const PACK_URLS = import.meta.glob('./sounds/*.{wav,mp3,ogg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const PACK_ASSETS: Record<string, string> = Object.fromEntries(
  Object.entries(PACK_URLS).map(([path, url]) => [decodeURIComponent(path.split('/').pop() ?? ''), url]),
);

export const SOUND_VERSIONS: { id: SoundVersion; label: string; hint: string }[] = [
  { id: 'v1', label: 'V1', hint: 'Suara asli' },
  { id: 'v2', label: 'V2', hint: 'Suara baru dicampur V1' },
  { id: 'v3', label: 'V3', hint: 'Suara baru saja (tanpa V1)' },
];
