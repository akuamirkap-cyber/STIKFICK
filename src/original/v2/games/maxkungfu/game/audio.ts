import { SOUND_DATA } from './soundData';
import { PACK_ASSETS, SOUND_PACK_FILES, V1_SOURCE_FILES, type PackKind, type SoundVersion } from './soundPacks';
import { GUN_SAMPLES } from './gunSamples';

export type { SoundVersion } from './soundPacks';

type OscType = OscillatorType;
type SampleId = keyof typeof SOUND_DATA;
type PunchId = 'punch1' | 'punch2' | 'punch3';
type ImpactKind = 'light' | 'kick' | 'heavy';

/** Senjata yang punya rekaman tembakan asli. */
type GunKind = 'pistol' | 'rifle' | 'shotgun';
/** Satu klip rekaman: buffer + offset transient (awal letusan sebenarnya). */
interface GunClip { buffer: AudioBuffer; start: number; len: number }

/** Satu klip yang siap diputar (buffer + potongan + gain). */
interface Clip {
  buffer: AudioBuffer;
  offset: number;
  duration: number;
  gain: number;
}

/** Gain dasar untuk file paket baru (V2 / V3). */
const PACK_GAIN = 0.85;
/** Durasi maksimum satu klip paket baru (detik). */
const PACK_DURATION = 0.9;

/**
 * Cari titik letusan di rekaman: sampel pertama yang menembus 12% dari puncak,
 * dimundurkan 1.5 ms supaya transien tajamnya tidak terpotong. Panjang klip
 * dibatasi agar rentetan otomatis tidak ikut terdengar sebagai satu tembakan.
 */
function sliceGunTransient(buffer: AudioBuffer, maxLen = 0.95): GunClip {
  const data = buffer.getChannelData(0);
  const n = data.length;
  let peak = 0;
  for (let i = 0; i < n; i += 4) { const v = Math.abs(data[i]); if (v > peak) peak = v; }
  if (peak <= 0) return { buffer, start: 0, len: buffer.duration };
  const threshold = peak * 0.12;
  let start = 0;
  for (let i = 0; i < n; i++) { if (Math.abs(data[i]) >= threshold) { start = i; break; } }
  start = Math.max(0, start - Math.floor(buffer.sampleRate * 0.0015));
  // ekor: potong saat level turun di bawah 1.2% puncak selama > 20 ms
  const sr = buffer.sampleRate;
  const win = Math.max(1, Math.floor(sr * 0.02));
  const floorLevel = peak * 0.012;
  let end = n;
  for (let i = start; i + win < n; i += win) {
    let m = 0;
    for (let j = i; j < i + win; j += 2) { const v = Math.abs(data[j]); if (v > m) m = v; }
    if (m < floorLevel) { end = Math.min(n, i + Math.floor(sr * 0.12)); break; }
  }
  const len = Math.min((end - start) / sr, maxLen);
  return { buffer, start: start / sr, len };
}

// Skip the silence before each recorded impact so hits sound in sync with combat.
const PUNCHES: Record<PunchId, { offset: number; duration: number; gain: number }> = {
  punch1: { offset: 0.14, duration: 0.31, gain: 0.9 },
  punch2: { offset: 0.08, duration: 0.41, gain: 0.8 },
  punch3: { offset: 0.29, duration: 0.42, gain: 0.78 },
};

export class Sfx {
  ctx: AudioContext | null = null;
  /** Versi suara aktif: v1 (asli), v2 (campuran), v3 (paket baru saja). */
  readonly version: SoundVersion;
  private packBuffers: Partial<Record<PackKind, { name: string; buffer: AudioBuffer }[]>> = {};
  private packLoading = false;
  private lastPack: AudioBuffer | null = null;
  /** Rekaman tembakan asli: pistol / rifle / shotgun, lengkap dengan titik transient-nya. */
  private gunClips: Partial<Record<GunKind, GunClip[]>> = {};
  private gunLoading = false;
  private lastGun: Partial<Record<GunKind, GunClip | null>> = {};

  constructor(version: SoundVersion = 'v2') {
    this.version = version;
  }

  private master!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private noiseBuf!: AudioBuffer;
  muted = false;
  musicOn = true;
  // music
  private musicTimer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private bpm = 128;
  intensity = 0;
  private sampleBuffers: Partial<Record<SampleId, AudioBuffer>> = {};
  private sampleVoices = new Set<AudioBufferSourceNode>();
  private samplesLoading = false;
  private punchQueue: PunchId[] = [];
  private lastPunch: PunchId | null = null;
  private lastImpactAt = -Infinity;

  init() {
    if (this.ctx) {
      if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') void this.ctx.resume().catch(() => {});
      this.loadSamples(this.ctx);
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      this.ctx = null;
      return;
    }
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.sfxGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.sfxGain.connect(this.master);
    this.musicGain.connect(this.master);
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 1.2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') void this.ctx.resume().catch(() => {});
    this.loadSamples(this.ctx);
  }

  /** Memuat file paket suara baru dari public/sounds/ (hanya untuk V2 dan V3). */
  private loadPacks(context: AudioContext) {
    if (this.version === 'v1' || this.packLoading) return;
    this.packLoading = true;
    const missing: string[] = [];
    for (const key of Object.keys(SOUND_PACK_FILES) as PackKind[]) {
      const names = SOUND_PACK_FILES[key].filter((name) => this.version !== 'v2' || !V1_SOURCE_FILES.includes(name));
      for (const name of names) {
        const url = PACK_ASSETS[name];
        if (!url) { missing.push(name); continue; }
        void (async () => {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buffer = await context.decodeAudioData(await res.arrayBuffer());
            if (this.ctx === context) (this.packBuffers[key] ??= []).push({ name, buffer });
          } catch (error) {
            console.warn(`[KUNGFU DRIFTER] Gagal memuat suara "${name}":`, error);
          }
        })();
      }
    }
    if (missing.length) {
      console.info('[KUNGFU DRIFTER] Suara belum tersedia (taruh di src/games/maxkungfu/game/sounds/):', missing.join(', '));
    }
  }

  /**
   * Muat rekaman tembakan asli lalu potong tepat di transien letusannya.
   * File yang berisi rentetan (mis. rifle otomatis) otomatis diambil satu
   * tembakan pertama saja supaya sinkron dengan animasi.
   */
  private loadGunSamples(context: AudioContext) {
    if (this.gunLoading) return;
    this.gunLoading = true;
    // maxLen: rekaman rentetan (rifle otomatis) dipotong jadi SATU letusan saja
    const map: Record<string, { kinds: GunKind[]; maxLen: number; repeat?: number }> = {
      pistol9mm: { kinds: ['pistol'], maxLen: 0.9, repeat: 3 },   // rekaman 9mm jadi suara utama
      pistolAlt: { kinds: ['pistol'], maxLen: 0.34 },              // variasi sesekali
      rifle: { kinds: ['rifle'], maxLen: 0.13 },
      shotgun: { kinds: ['shotgun'], maxLen: 0.95 },
    };
    for (const [key, entry] of Object.entries(map)) {
      const kinds = entry.kinds;
      const dataUri = GUN_SAMPLES[key];
      if (!dataUri) continue;
      void (async () => {
        try {
          const raw = atob(dataUri.slice(dataUri.indexOf(',') + 1));
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          const buffer = await context.decodeAudioData(bytes.buffer);
          if (this.ctx !== context) return;
          const clip = sliceGunTransient(buffer, entry.maxLen);
          for (const kind of kinds) {
            const pool = (this.gunClips[kind] ??= []);
            for (let i = 0; i < (entry.repeat ?? 1); i++) pool.push(clip);
          }
        } catch (error) {
          console.warn(`[KUNGFU DRIFTER] Gagal memuat suara tembakan ${key}:`, error);
        }
      })();
    }
  }

  /** suara tembakan yang sedang hidup per jenis — dibatasi supaya spam tidak menumpuk & mendistorsi */
  private gunVoices: Record<string, { src: AudioBufferSourceNode; gain: GainNode }[]> = { pistol: [], rifle: [] };
  private lastShotAt = { pistol: -Infinity, rifle: -Infinity };

  /** Putar satu rekaman tembakan dengan pitch, volume, dan posisi stereo acak. */
  private playGun(kind: GunKind, volume: number, rate: number, pan = 0): boolean {
    const pool = this.gunClips[kind];
    if (!this.ok || !this.ctx || !pool || !pool.length) return false;
    // VOICE STEALING: maksimal 3 tembakan sejenis hidup bersamaan; yang tertua diredam cepat
    // (0,03 dtk) lalu dimatikan — tanpa ini, spam membuat ekor suara bertumpuk, kompresor
    // master terjepit, dan bunyinya jadi rusak / terpotong-potong.
    const voices = this.gunVoices[kind] ?? (this.gunVoices[kind] = []);
    const now0 = this.ctx.currentTime;
    while (voices.length >= 3) {
      const old = voices.shift()!;
      try {
        old.gain.gain.cancelScheduledValues(now0);
        old.gain.gain.setValueAtTime(Math.max(0.0001, old.gain.gain.value), now0);
        old.gain.gain.linearRampToValueAtTime(0.0001, now0 + 0.03);
        old.src.stop(now0 + 0.04);
      } catch { /* sudah berhenti */ }
    }
    let clip = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && clip === this.lastGun[kind]) clip = pool[(pool.indexOf(clip) + 1) % pool.length];
    this.lastGun[kind] = clip;
    const context = this.ctx;
    const buffer = clip.buffer;
    const offset = Math.max(0, clip.start);
    const length = Math.min(clip.len, buffer.duration - offset);
    if (length <= 0) return false;
    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;
      const dur = length / rate;
      source.buffer = buffer;
      source.playbackRate.value = rate;
      // serangan instan (0.3 ms) supaya "crack"-nya tidak tumpul, lalu ekor natural
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.0003);
      gain.gain.setValueAtTime(volume, now + dur * 0.55);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      let tail: AudioNode = gain;
      if (pan !== 0 && typeof context.createStereoPanner === 'function') {
        const panner = context.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        gain.connect(panner);
        tail = panner;
      }
      source.connect(gain);
      tail.connect(this.sfxGain);
      source.onended = () => {
        this.sampleVoices.delete(source); source.disconnect(); gain.disconnect();
        const vi = voices.findIndex((v) => v.src === source);
        if (vi >= 0) voices.splice(vi, 1);
      };
      source.start(now, offset, length);
      this.sampleVoices.add(source);
      voices.push({ src: source, gain });
      return true;
    } catch {
      return false;
    }
  }

  private loadSamples(context: AudioContext) {
    if (this.samplesLoading) return;
    this.samplesLoading = true;
    this.loadPacks(context);
    this.loadGunSamples(context);
    for (const id of Object.keys(SOUND_DATA) as SampleId[]) {
      void (async () => {
        try {
          const raw = atob(SOUND_DATA[id]);
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          const buffer = await context.decodeAudioData(bytes.buffer);
          if (this.ctx === context) this.sampleBuffers[id] = buffer;
        } catch (error) {
          console.warn(`[KUNGFU DRIFTER] Gagal memuat suara ${id}:`, error);
        }
      })();
    }
  }

  private playSample(id: SampleId, volume: number, rate: number, offset: number, duration: number) {
    const buffer = this.sampleBuffers[id];
    return buffer ? this.playBuffer(buffer, volume, rate, offset, duration) : false;
  }

  private playBuffer(buffer: AudioBuffer, volume: number, rate: number, offset: number, duration: number) {
    const context = this.ctx;
    if (!this.ok || !context) return false;
    const length = Math.min(duration, buffer.duration - offset);
    if (length <= 0) return false;
    try {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;
      const end = now + length / rate;
      source.buffer = buffer;
      source.playbackRate.value = rate;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.004);
      gain.gain.setValueAtTime(volume, Math.max(now + 0.004, end - 0.025));
      gain.gain.linearRampToValueAtTime(0, end);
      source.connect(gain); gain.connect(this.sfxGain);
      source.onended = () => { this.sampleVoices.delete(source); source.disconnect(); gain.disconnect(); };
      source.start(now, offset, length);
      this.sampleVoices.add(source);
      return true;
    } catch {
      return false;
    }
  }

  private nextPunch(): PunchId | null {
    const available = (['punch1', 'punch2', 'punch3'] as PunchId[]).filter((id) => this.sampleBuffers[id]);
    if (!available.length) return null;
    this.punchQueue = this.punchQueue.filter((id) => this.sampleBuffers[id]);
    if (!this.punchQueue.length) {
      this.punchQueue = [...available];
      for (let i = this.punchQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.punchQueue[i], this.punchQueue[j]] = [this.punchQueue[j], this.punchQueue[i]];
      }
      if (this.punchQueue.length > 1 && this.punchQueue[0] === this.lastPunch) {
        [this.punchQueue[0], this.punchQueue[1]] = [this.punchQueue[1], this.punchQueue[0]];
      }
    }
    const next = this.punchQueue.shift()!;
    this.lastPunch = next;
    return next;
  }

  /** Klip V1 (sampel embedded) yang sudah dimuat. */
  private v1Clips(): Clip[] {
    const clips: Clip[] = [];
    for (const id of ['punch1', 'punch2', 'punch3'] as PunchId[]) {
      const buffer = this.sampleBuffers[id];
      if (buffer) clips.push({ buffer, ...PUNCHES[id] });
    }
    return clips;
  }

  /** Klip paket baru untuk kategori tertentu (V3 = paket saja, V2 = V1 + paket). */
  private nextPackClip(kind: ImpactKind): Clip | null {
    const key: PackKind = kind === 'light' ? 'punch' : kind;
    const pool: Clip[] = this.version === 'v2' ? this.v1Clips() : [];
    for (const pack of this.packBuffers[key] ?? []) {
      pool.push({ buffer: pack.buffer, offset: 0, duration: PACK_DURATION, gain: PACK_GAIN });
    }
    if (!pool.length) return null;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    // hindari suara yang sama dua kali berturut-turut
    if (pool.length > 1 && pick.buffer === this.lastPack) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    this.lastPack = pick.buffer;
    return pick;
  }

  /** Klip V1 dengan urutan acak tanpa pengulangan langsung. */
  private nextPunchClip(): Clip | null {
    const id = this.nextPunch();
    if (!id) return null;
    return { buffer: this.sampleBuffers[id]!, ...PUNCHES[id] };
  }

  private impact(kind: ImpactKind) {
    if (!this.ok || !this.ctx) return true;
    if (this.ctx.currentTime - this.lastImpactAt < 0.04) return true;
    const clip = this.version === 'v1' ? this.nextPunchClip() : this.nextPackClip(kind);
    if (!clip) return false;
    const rate = (kind === 'heavy' ? 0.88 : kind === 'kick' ? 0.95 : 1) + Math.random() * 0.08;
    const volume = clip.gain * (kind === 'heavy' ? 1.15 : kind === 'kick' ? 1 : 0.9) * (0.94 + Math.random() * 0.12);
    if (!this.playBuffer(clip.buffer, volume, rate, clip.offset, clip.duration)) return false;
    this.lastImpactAt = this.ctx.currentTime;
    return true;
  }

  dispose() {
    this.stopMusic();
    for (const source of this.sampleVoices) { try { source.stop(); } catch { /* already stopped */ } }
    this.sampleVoices.clear();
    const context = this.ctx;
    this.ctx = null;
    this.sampleBuffers = {};
    this.samplesLoading = false;
    this.punchQueue = []; this.lastPunch = null; this.lastImpactAt = -Infinity;
    this.packBuffers = {}; this.packLoading = false; this.lastPack = null;
    this.gunClips = {}; this.gunLoading = false; this.lastGun = {}; this.lastEnemyShotAt = -Infinity;
    this.gunVoices = { pistol: [], rifle: [] }; this.lastShotAt = { pistol: -Infinity, rifle: -Infinity };
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    if (this.muted) for (const source of this.sampleVoices) { try { source.stop(); } catch { /* already stopped */ } }
    return this.muted;
  }

  private get ok() {
    return !!this.ctx && this.ctx.state === 'running' && !this.muted;
  }

  private tone(f0: number, f1: number, dur: number, type: OscType, vol: number, delay = 0, dest?: AudioNode) {
    if (!this.ok) return;
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, ftype: BiquadFilterType, f0: number, f1: number, vol: number, delay = 0, q = 1, dest?: AudioNode) {
    if (!this.ok) return;
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter();
    f.type = ftype;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxGain);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  punch() {
    if (this.impact('light')) this.tone(145, 55, 0.05, 'sine', 0.12);
    else { this.tone(160, 50, 0.08, 'sine', 0.5); this.noise(0.05, 'lowpass', 1200, 200, 0.35); }
  }
  kick() {
    if (this.impact('kick')) this.tone(115, 42, 0.08, 'sine', 0.2);
    else { this.tone(120, 40, 0.12, 'sine', 0.6); this.noise(0.08, 'lowpass', 800, 150, 0.4); }
  }
  footImpact(school: string, strong: boolean, hits: number, beat = -1) {
    const pitch = school === 'flamingo' ? beat === 0 ? 118 : beat === 1 ? 195 : 144 : school === 'capoeira' ? 104 : school === 'taekwondo' ? 153 : school === 'lotus' ? 175 : 118;
    const step = 1 + Math.min(6, Math.max(0, hits - 1)) * .035;
    this.tone(pitch * step, strong ? 38 : 56, strong ? .15 : .075, 'sine', strong ? .49 : .31);
    this.noise(strong ? .095 : .039, 'bandpass', school === 'ember' ? 1250 : 1820, 270, strong ? .18 : .115, 0, .85);
    if (school === 'lotus' || strong) this.tone(strong ? 320 : 490, strong ? 120 : 260, .057, 'triangle', .075, .018);
  }
  scytheSwing(finisher = false) {
    this.noise(finisher ? .16 : .09, 'bandpass', finisher ? 700 : 1100, finisher ? 3200 : 2600, .16, 0, 1.8);
    this.tone(finisher ? 240 : 320, finisher ? 90 : 150, .05, 'triangle', .06, .012);
  }
  /** Sabit hit: goresan tajam + dentum rendah, makin deras dalam rantai. */
  scytheHit(strong: boolean, hits = 0) {
    const step = 1 + Math.min(6, Math.max(0, hits - 1)) * .04;
    this.noise(strong ? .09 : .035, 'highpass', 2400, 3400, strong ? .3 : .18);
    this.tone(190 * step, strong ? 60 : 95, strong ? .11 : .05, 'sawtooth', strong ? .22 : .1);
    this.tone(strong ? 82 : 120, strong ? 34 : 52, strong ? .14 : .06, 'sine', strong ? .42 : .22);
    if (strong) this.tone(660, 220, .07, 'triangle', .06, .02);
  }
  footSwitch() {
    this.noise(.048, 'bandpass', 740, 320, .13, 0, 1.4);
    this.tone(185, 90, .046, 'triangle', .075, .017);
  }
  heavy() {
    if (this.impact('heavy')) { this.tone(85, 30, 0.16, 'sine', 0.3); this.noise(0.06, 'lowpass', 900, 160, 0.1); }
    else { this.tone(90, 28, 0.22, 'sine', 0.9); this.noise(0.16, 'lowpass', 1500, 100, 0.55); this.tone(55, 30, 0.25, 'square', 0.12); }
  }
  whoosh() {
    this.noise(0.1, 'bandpass', 500, 2200, 0.2, 0, 2);
  }
  hit() {
    this.noise(0.04, 'highpass', 1800, 2500, 0.3);
    this.tone(420, 180, 0.05, 'square', 0.08);
  }
  dash() {
    this.noise(0.16, 'bandpass', 300, 2800, 0.22, 0, 1.5);
  }
  /**
   * PISTOL / RIFLE — rekaman lapangan asli + lapisan sintetis.
   * `pan` = arah hadap (-1 kiri … 1 kanan) supaya tembakan terasa datang dari senjata.
   */
  shot(kind: 'pistol' | 'rifle', pan = 0) {
    if (!this.ok) return;
    // THROTTLE: tembakan lebih rapat dari 0,05 dtk tidak dibuatkan suara baru. Tanpa ini,
    // spam klik menumpuk belasan lapisan suara per detik -> bunyi rusak, telat, dan glitch.
    const nowS = this.ctx!.currentTime;
    const gap = nowS - this.lastShotAt[kind];
    if (gap < 0.05) return;
    this.lastShotAt[kind] = nowS;
    const dense = gap < 0.17; // spam rapat: ekor ruangan & echo dipangkas supaya tetap jernih
    const p = Math.max(-1, Math.min(1, pan)) * 0.35;
    if (kind === 'pistol') {
      const live = this.playGun('pistol', 0.9, 0.97 + Math.random() * 0.08, p);
      this.noise(0.005, 'highpass', 6200, 9500, live ? 0.42 : 0.75);  // supersonic crack
      if (!live) {
        this.noise(0.09, 'lowpass', 6000, 400, 0.9);                  // blast
        this.tone(150, 34, 0.16, 'sine', 0.8);                         // chest thump
      } else {
        this.tone(128, 30, 0.13, 'sine', 0.3);                         // bobot dada (tipis)
      }
      // aksi slide: klik logam + pantulan selongsong di dalam
      this.noise(0.018, 'bandpass', 2400, 1200, 0.16, 0.048, 3);
      this.tone(1750, 900, 0.022, 'square', 0.05, 0.05);
      this.noise(dense ? 0.16 : 0.3, 'bandpass', 950, 260, dense ? 0.05 : 0.11, 0.012, 1.1); // ekor ruangan
      if (!dense) this.noise(0.16, 'bandpass', 620, 300, 0.045, 0.11, 2);                    // echo slap
    } else {
      const live = this.playGun('rifle', 0.95, 1.0 + Math.random() * 0.1, p);
      this.noise(0.004, 'highpass', 7000, 10000, live ? 0.4 : 0.6);
      if (!live) {
        this.noise(0.055, 'lowpass', 6500, 700, 0.65);
        this.tone(120, 40, 0.07, 'sine', 0.5);
      } else {
        this.tone(112, 36, 0.075, 'sine', 0.3);
        this.tone(430, 90, 0.035, 'sawtooth', 0.14);                   // gigitan 5.56
      }
      // gas system + bolt carrier menghantam
      this.noise(0.02, 'bandpass', 1800, 800, 0.14, 0.055, 2.5);
      this.tone(900, 420, 0.025, 'square', 0.045, 0.058);
      this.noise(dense ? 0.09 : 0.14, 'bandpass', 900, 330, dense ? 0.04 : 0.06, 0.014, 1.5); // ekor pendek
    }
  }
  /** BUSTER: dengung energi mako saat charge, nadanya naik */
  busterHum(c: number) {
    this.tone(110 + 330 * c, 120 + 360 * c, 0.09, 'sawtooth', 0.04 + 0.04 * c);
    this.tone(220 + 660 * c, 230 + 700 * c, 0.08, 'sine', 0.05);
  }
  /** BUSUR: derit kayu & tali saat ditarik — nadanya naik mengikuti tegangan */
  bowCreak(draw: number) {
    this.noise(0.06, 'bandpass', 320 + 520 * draw, 260 + 480 * draw, 0.07 + 0.06 * draw, 0, 6);
    this.tone(90 + 140 * draw, 85 + 135 * draw, 0.07, 'sawtooth', 0.025 + 0.02 * draw);
  }
  /** tarikan penuh: "ting" tegang + jantung berdetak pelan */
  bowFull() {
    this.tone(1760, 1760, 0.1, 'sine', 0.08);
    this.tone(2640, 2640, 0.07, 'sine', 0.04, 0.02);
    this.tone(70, 50, 0.12, 'sine', 0.3);
  }
  /** LEPAS: tali "TWANG" + desis panah — makin kuat makin dalam & panjang */
  bowRelease(power: number) {
    this.noise(0.012, 'highpass', 4000, 7000, 0.35 + 0.3 * power);
    this.tone(150 + 60 * power, 95, 0.18 + 0.2 * power, 'triangle', 0.25 + 0.3 * power);
    this.tone(300 + 120 * power, 190, 0.12 + 0.12 * power, 'square', 0.05 + 0.05 * power);
    this.noise(0.14 + 0.12 * power, 'bandpass', 2600, 900, 0.12 + 0.18 * power, 0.01, 1.4);
    if (power > 0.95) this.tone(60, 30, 0.2, 'sine', 0.45);
  }
  /** panah dipasang ke tali: "tk" kecil */
  bowNock() {
    this.tone(1400, 1000, 0.02, 'triangle', 0.1);
    this.noise(0.012, 'bandpass', 3000, 2400, 0.12, 0, 3);
  }
  /** panah menembus daging: "THUNK" basah */
  arrowFlesh(heavy: boolean) {
    this.noise(0.05, 'lowpass', 1600, 200, heavy ? 0.7 : 0.5);
    this.tone(150, 55, heavy ? 0.16 : 0.1, 'sine', heavy ? 0.7 : 0.5);
    this.noise(0.08, 'bandpass', 600, 300, 0.25, 0.01, 2);
  }
  /** menancap di kayu/dinding: "THOCK" + dengung batang bergetar */
  arrowWood() {
    this.tone(520, 300, 0.05, 'square', 0.22);
    this.noise(0.03, 'bandpass', 1800, 900, 0.4, 0, 3);
    this.tone(210, 200, 0.22, 'triangle', 0.06, 0.02);
  }
  headshot() {
    this.tone(1320, 1320, 0.08, 'sine', 0.18);
    this.tone(1980, 1980, 0.12, 'sine', 0.12, 0.05);
  }
  /** SHOTGUN: ledakan berat 12-gauge — rekaman asli + crack, dentuman dada, ekor ruangan panjang */
  shotgunBlast(pan = 0) {
    if (!this.ok) return;
    const p = Math.max(-1, Math.min(1, pan)) * 0.3;
    const live = this.playGun('shotgun', 1.15, 0.9 + Math.random() * 0.1, p);
    this.noise(0.009, 'highpass', 4800, 9500, live ? 0.7 : 0.95);      // crack
    if (!live) {
      this.noise(0.16, 'lowpass', 5200, 220, 1.0);
      this.tone(260, 50, 0.08, 'sawtooth', 0.3);
    }
    this.tone(96, 22, live ? 0.26 : 0.34, 'sine', live ? 0.72 : 1.0);  // dentuman dada
    this.tone(52, 18, 0.4, 'square', 0.18);                            // sub rendah
    // taburan pellet yang menghantam udara + gesekan wad
    this.noise(0.12, 'highpass', 2600, 1400, 0.12, 0.01, 0.8);
    this.noise(0.7, 'bandpass', 720, 170, 0.2, 0.02, 1.05);            // ekor ruangan
    this.noise(0.4, 'bandpass', 480, 210, 0.1, 0.2, 2);                // echo slap
  }
  /** tuas ditarik: "CLICK" logam tajam */
  leverClick() {
    this.noise(0.012, 'highpass', 3500, 6000, 0.65);
    this.tone(2400, 1500, 0.025, 'square', 0.22);
    this.tone(900, 500, 0.03, 'triangle', 0.2, 0.004);
  }
  /** tuas didorong balik: "CLACK" berat, bolt mengunci */
  leverClack() {
    this.noise(0.02, 'bandpass', 1600, 900, 0.75, 0, 2);
    this.tone(700, 260, 0.05, 'square', 0.28);
    this.tone(180, 90, 0.07, 'sine', 0.35);
    this.noise(0.01, 'highpass', 5000, 7000, 0.4, 0.012);
  }
  /** kokang putar ala Terminator: wush putaran + click-clack */
  spinCock() {
    this.noise(0.26, 'bandpass', 500, 1500, 0.22, 0, 1.6);
    this.leverClick();
    window.setTimeout(() => this.leverClack(), 210);
  }
  /** peluru dimasukkan ke tabung: "tchk" */
  shellIn() {
    this.noise(0.015, 'bandpass', 2600, 1800, 0.45, 0, 3);
    this.tone(1300, 800, 0.03, 'triangle', 0.2);
    this.tone(320, 200, 0.04, 'sine', 0.18, 0.01);
  }
  /** selongsong jatuh ke tanah */
  shellDrop() {
    this.tone(1900, 1700, 0.05, 'triangle', 0.1, 0.12);
    this.tone(1500, 1350, 0.04, 'triangle', 0.07, 0.22);
  }
  /** tembak tapi kosong: "click" kering */
  dryFire() {
    this.tone(1800, 1200, 0.02, 'square', 0.18);
    this.noise(0.01, 'highpass', 4000, 6000, 0.3);
  }
  bulletWall() {
    this.noise(0.03, 'highpass', 3000, 5000, 0.18);
    this.tone(900 + Math.random() * 300, 300, 0.035, 'square', 0.05);
  }
  bulletFlesh() {
    this.noise(0.05, 'lowpass', 1400, 200, 0.35);
    this.tone(110, 50, 0.06, 'sine', 0.3);
  }
  casing() {
    this.tone(2600 + Math.random() * 800, 1900, 0.045, 'square', 0.035);
  }
  ricochet() {
    this.tone(1900, 500, 0.2, 'sawtooth', 0.07);
    this.noise(0.05, 'highpass', 4000, 6500, 0.12);
  }
  footstep(sprint = 0) {
    if (!this.ok) return;
    const pace = Math.max(0, Math.min(1, sprint));
    const rate = 0.96 + pace * 0.06 + Math.random() * 0.06;
    const volume = (0.32 + pace * 0.1) * (0.95 + Math.random() * 0.1);
    // The recording contains a second faint step; play one footfall per animation contact.
    if (!this.playSample('footstep', volume, rate, 0, 0.22)) this.noise(0.04, 'lowpass', 500, 180, 0.03);
  }
  slash(pitch = 1) {
    // steel whoosh: airy high band sweep + a thin metallic ring
    this.noise(0.14, 'bandpass', 1800 * pitch, 5200 * pitch, 0.3, 0, 1.5);
    this.tone(3200 * pitch, 2400 * pitch, 0.08, 'sine', 0.06);
  }
  slashHit(heavy: boolean) {
    // flesh cut: wet thud + metallic shing
    this.noise(0.08, 'lowpass', 1400, 200, heavy ? 0.6 : 0.4);
    this.tone(heavy ? 140 : 220, 60, heavy ? 0.14 : 0.08, 'sine', heavy ? 0.6 : 0.35);
    this.tone(4200, 2600, 0.12, 'sine', 0.1);
    this.noise(0.05, 'highpass', 4000, 6000, 0.2);
  }
  sheathe() {
    this.noise(0.18, 'highpass', 3000, 5000, 0.12);
    this.tone(2400, 1600, 0.12, 'sine', 0.06, 0.1);
    this.tone(600, 400, 0.05, 'square', 0.08, 0.2);
  }
  batCrack() {
    // the crack of the bat: sharp wooden snap
    this.noise(0.02, 'highpass', 1800, 3000, 0.6);
    this.tone(620, 180, 0.06, 'square', 0.25);
    this.tone(1900, 900, 0.05, 'triangle', 0.15);
  }
  axeSwing() {
    // heavy, low whoosh
    this.noise(0.22, 'bandpass', 220, 900, 0.32, 0, 1.2);
    this.tone(90, 60, 0.18, 'sine', 0.12);
  }
  axeHit(heavy: boolean) {
    // meaty chop: deep thud + wet crunch + metallic clank
    this.noise(0.06, 'lowpass', 900, 150, 0.7);
    this.tone(70, 25, heavy ? 0.3 : 0.18, 'sine', heavy ? 0.9 : 0.6);
    this.noise(0.12, 'bandpass', 400, 200, 0.45, 0.01, 1.5);
    this.tone(1800, 900, 0.08, 'triangle', 0.1, 0.01);
    if (heavy) this.tone(45, 20, 0.4, 'square', 0.15);
  }
  dualSwing() {
    // quick double 'shing'
    this.noise(0.07, 'bandpass', 2500 * 1.1, 6000, 0.2, 0, 2);
    this.tone(3600, 2800, 0.05, 'sine', 0.05);
    this.noise(0.06, 'bandpass', 2800, 6500, 0.16, 0.05, 2);
    this.tone(4200, 3200, 0.05, 'sine', 0.04, 0.05);
  }
  dualHit() {
    this.noise(0.05, 'lowpass', 1600, 300, 0.35);
    this.tone(300, 120, 0.06, 'sine', 0.3);
    this.tone(5200, 3400, 0.08, 'sine', 0.09);
  }
  /** Cebar air dangkal saat masuk kolam. */
  splash() {
    this.noise(0.16, 'bandpass', 900, 3600, 0.3, 0, 1.1);
    this.noise(0.09, 'highpass', 2600, 6200, 0.2, 0.01);
    this.tone(520, 190, 0.1, 'sine', 0.14);
    this.tone(880, 420, 0.07, 'triangle', 0.07, 0.02);
  }
  /** Langkah mengarungi air setinggi lutut. */
  wade() {
    this.noise(0.085, 'bandpass', 700, 2400, 0.13, 0, 1.4);
    this.tone(340, 170, 0.055, 'sine', 0.06);
  }
  /** Lensa retak: klik kaca tajam, pendek. */
  glassCrack() {
    this.noise(0.03, 'highpass', 5200, 8000, 0.3);
    this.tone(2600, 1500, 0.035, 'square', 0.1);
    this.tone(4200, 2600, 0.025, 'triangle', 0.07);
  }
  /** Kacamata pecah / terlempar: hamparan pecahan kaca. */
  glassShatter() {
    this.noise(0.09, 'highpass', 4200, 9000, 0.42);
    this.noise(0.22, 'bandpass', 3000, 6500, 0.2, 0.01, 1.4);
    for (let i = 0; i < 6; i++) {
      this.tone(2200 + Math.random() * 3400, 1400 + Math.random() * 1200, 0.05, 'triangle', 0.075, i * 0.022);
    }
    this.tone(180, 70, 0.09, 'sine', 0.2);
  }
  /** Kaca memantul di lantai. */
  glassTink() {
    this.tone(3200 + Math.random() * 2200, 2200, 0.035, 'triangle', 0.05);
  }
  /** Sarung tinju: tamparan kulit tumpul + dorongan badan, bukan retakan kayu. */
  boxing(power = 0.5) {
    const heavy = power > 0.75;
    this.impact(heavy ? 'heavy' : power > 0.4 ? 'kick' : 'light');
    this.noise(heavy ? 0.075 : 0.045, 'lowpass', heavy ? 1500 : 2100, 260, 0.34 + power * 0.3);
    this.tone(heavy ? 96 : 150, heavy ? 38 : 62, heavy ? 0.16 : 0.08, 'sine', 0.3 + power * 0.35);
    this.noise(0.02, 'highpass', 3200, 5200, 0.1 + power * 0.1);   // slap kulit
    if (heavy) this.tone(58, 30, 0.2, 'triangle', 0.16);
  }
  /** Langkah Ali Shuffle: gesekan sepatu ringan di kanvas. */
  shoeStep() {
    this.noise(0.035, 'bandpass', 1400, 2600, 0.075, 0, 1.6);
  }
  nunchakuHit(heavy: boolean) {
    // wood crack: short bright click + knock
    this.noise(0.03, 'highpass', 2500, 4000, heavy ? 0.5 : 0.35);
    this.tone(heavy ? 240 : 420, heavy ? 90 : 200, heavy ? 0.12 : 0.07, 'square', heavy ? 0.3 : 0.18);
    this.tone(1200, 700, 0.05, 'triangle', 0.12);
    if (heavy) this.tone(80, 30, 0.2, 'sine', 0.6);
  }
  yoyoThrow(spin: boolean) {
    this.noise(spin ? 0.16 : 0.09, 'bandpass', 900, 3200, 0.14, 0, 2);
    this.tone(spin ? 580 : 820, spin ? 1050 : 420, 0.12, 'triangle', 0.09);
  }
  yoyoHit(heavy: boolean) {
    this.tone(heavy ? 540 : 760, heavy ? 180 : 360, 0.08, 'triangle', 0.2);
    this.tone(2100, 1350, 0.06, 'sine', 0.07);
    this.noise(0.04, 'bandpass', 2300, 1000, 0.16, 0, 2);
  }
  chainRattle() {
    this.noise(0.05, 'bandpass', 3500, 5000, 0.08, 0, 3);
    this.tone(2800 + Math.random() * 1200, 2200, 0.03, 'square', 0.04);
  }
  swing(pitch = 1) {
    this.noise(0.12, 'bandpass', 400 * pitch, 2600 * pitch, 0.26, 0, 2);
  }
  launch() {
    this.tone(180, 950, 0.25, 'sine', 0.2);
    this.noise(0.22, 'bandpass', 500, 3200, 0.16, 0, 2);
  }
  land() {
    this.tone(110, 40, 0.12, 'sine', 0.5);
    this.noise(0.1, 'lowpass', 700, 100, 0.3);
  }
  fatality() {
    this.tone(90, 28, 0.9, 'sawtooth', 0.45);
    this.noise(0.8, 'lowpass', 1000, 60, 0.5);
    this.tone(55, 50, 1.3, 'square', 0.18, 0.1);
    this.tone(2200, 1200, 0.4, 'sine', 0.08, 0.05);
  }
  announce() {
    this.tone(320, 160, 0.25, 'sawtooth', 0.16);
    this.tone(320, 160, 0.25, 'sawtooth', 0.16, 0.18);
    this.noise(0.2, 'lowpass', 1200, 200, 0.25, 0.18);
  }
  /** Tembakan musuh: rekaman asli yang diredam + di-pan, jadi terdengar datang dari kejauhan. */
  private lastEnemyShotAt = -Infinity;
  enemyShot(pan = 0, far = false) {
    if (!this.ok || !this.ctx) return;
    // gerombolan besar bisa menembak serentak: batasi supaya tidak menumpuk jadi dengung
    const now = this.ctx.currentTime;
    if (now - this.lastEnemyShotAt < 0.035) {
      this.noise(0.06, 'bandpass', 1200, 420, far ? 0.08 : 0.13, 0, 1.2);
      return;
    }
    this.lastEnemyShotAt = now;
    const p = Math.max(-1, Math.min(1, pan)) * 0.65;
    const live = this.playGun(Math.random() < 0.55 ? 'rifle' : 'pistol', far ? 0.3 : 0.48, 0.9 + Math.random() * 0.16, p);
    if (!live) {
      this.noise(0.09, 'bandpass', 1300, 400, 0.28, 0, 1.2);
      this.tone(520, 180, 0.07, 'triangle', 0.15);
      return;
    }
    // jarak meredam frekuensi tinggi: sisakan dentuman badan + gema tipis
    this.tone(150, 46, 0.09, 'sine', far ? 0.1 : 0.17);
    this.noise(0.14, 'lowpass', 1500, 380, 0.06, 0.012);
    this.noise(0.22, 'bandpass', 700, 260, 0.045, 0.05, 1.4);
  }
  /** Penembak jitu: letusan besar berpantulan panjang. */
  sniper(pan = 0) {
    const p = Math.max(-1, Math.min(1, pan)) * 0.7;
    const live = this.playGun('shotgun', 0.85, 0.66, p);
    this.noise(0.006, 'highpass', 6000, 9500, live ? 0.45 : 0.7);
    if (!live) {
      this.noise(0.25, 'lowpass', 5000, 200, 0.6);
      this.tone(180, 40, 0.2, 'square', 0.3);
    } else {
      this.tone(88, 20, 0.3, 'sine', 0.5);
    }
    this.noise(0.7, 'bandpass', 620, 170, 0.16, 0.03, 1.05);
    this.noise(0.4, 'bandpass', 430, 200, 0.08, 0.24, 2);
  }
  parry() {
    this.tone(1400, 1900, 0.14, 'sine', 0.3);
    this.tone(2100, 2700, 0.12, 'sine', 0.2, 0.02);
    this.noise(0.06, 'highpass', 3000, 5000, 0.25);
  }
  kill() {
    this.noise(0.28, 'lowpass', 2800, 150, 0.6);
    this.tone(320, 35, 0.28, 'sawtooth', 0.22);
  }
  hurt() {
    this.tone(220, 90, 0.22, 'square', 0.3);
    this.noise(0.18, 'lowpass', 900, 200, 0.35);
  }
  pickup() {
    this.tone(880, 880, 0.06, 'square', 0.12);
    this.tone(1320, 1320, 0.09, 'square', 0.12, 0.07);
  }
  explosion() {
    this.noise(0.55, 'lowpass', 3200, 50, 0.9);
    this.tone(90, 18, 0.5, 'sine', 0.9);
  }
  spawn() {
    this.tone(180, 1000, 0.3, 'sine', 0.12);
    this.noise(0.3, 'bandpass', 300, 3500, 0.08, 0, 2);
  }
  stagger() {
    this.tone(600, 280, 0.16, 'square', 0.18);
    this.tone(900, 420, 0.16, 'square', 0.14, 0.09);
  }
  levelClear() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.16, 'square', 0.14, i * 0.08));
  }
  empty() {
    this.tone(1200, 700, 0.05, 'square', 0.1);
  }
  select() {
    this.tone(600, 950, 0.08, 'square', 0.14);
  }
  death() {
    this.tone(400, 45, 1.1, 'sawtooth', 0.4);
    this.noise(0.9, 'lowpass', 1600, 80, 0.5);
  }
  portal() {
    this.tone(300, 1400, 0.7, 'sine', 0.18);
    this.noise(0.7, 'bandpass', 400, 4000, 0.1, 0, 3);
  }
  focus() {
    this.tone(200, 1800, 0.35, 'sawtooth', 0.2);
    this.noise(0.4, 'highpass', 800, 4000, 0.2);
  }
  slam() {
    this.tone(70, 20, 0.35, 'sine', 1);
    this.noise(0.3, 'lowpass', 1000, 60, 0.7);
  }
  beep() {
    this.tone(1800, 1800, 0.04, 'square', 0.12);
  }
  talk() {
    this.tone(300, 500, 0.05, 'square', 0.06);
  }

  // ---------- MUSIC ----------
  startMusic(intensity: number) {
    if (!this.ctx) return;
    this.intensity = intensity;
    this.bpm = 126 + intensity * 3;
    if (this.musicTimer !== null) return;
    this.step = 0;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 30);
  }
  setIntensity(i: number) {
    this.intensity = i;
    this.bpm = 126 + i * 3;
  }
  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
  private schedule() {
    if (!this.ctx) return;
    const c = this.ctx;
    const stepDur = 60 / this.bpm / 4;
    while (this.nextNote < c.currentTime + 0.12) {
      if (this.musicOn && !this.muted) this.playStep(this.step, this.nextNote - c.currentTime, stepDur);
      this.nextNote += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }
  private playStep(s: number, delay: number, stepDur: number) {
    const g = this.musicGain;
    const bar = Math.floor(s / 16);
    const i = s % 16;
    const inten = this.intensity;
    // kick
    if (i % 4 === 0 || (i === 14 && bar % 2 === 1) || (inten > 8 && i === 10)) this.tone(150, 40, 0.18, 'sine', 0.9, delay, g);
    // snare
    if (i === 4 || i === 12) {
      this.noise(0.14, 'bandpass', 1800, 900, 0.4, delay, 0.8, g);
      this.tone(220, 120, 0.08, 'triangle', 0.2, delay, g);
    }
    // hat
    if (i % 2 === 1 || inten > 4) this.noise(0.03, 'highpass', 7000, 9000, i % 4 === 2 ? 0.16 : 0.09, delay, 1, g);
    // bass
    const roots = [55, 55, 65.4, 49];
    const root = roots[bar % 4];
    const pat = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
    if (pat[i]) {
      const f = i === 13 ? root * 1.5 : i === 8 ? root * 1.19 : root;
      this.tone(f, f * 0.995, stepDur * 1.8, 'sawtooth', 0.25, delay, g);
      this.tone(f * 2, f * 2, stepDur * 0.9, 'square', 0.05, delay, g);
    }
    // lead (higher intensity)
    if (inten >= 2) {
      const scale = [1, 1.2, 1.333, 1.5, 1.8, 2, 2.4];
      const seq = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 6, 5, 3, 2, 1];
      if ((i % 2 === 0 && bar % 2 === 1) || (inten >= 6 && i % 2 === 0)) {
        const f = root * 4 * scale[seq[(i + bar * 3) % 16] % scale.length];
        this.tone(f, f, stepDur * 0.8, 'square', 0.06, delay, g);
      }
    }
    // pad
    if (i === 0) {
      this.tone(root * 2, root * 2, stepDur * 16, 'triangle', 0.08, delay, g);
      this.tone(root * 2.4, root * 2.4, stepDur * 16, 'triangle', 0.05, delay, g);
    }
  }
}
