import { useState } from 'react';
import { ATMO_LIST, type AtmoId } from '../shared/office/atmo';
import { loadV2Atmo, loadV2HitFx, loadV2Glow } from '../shared/office/look';
import { loadAuraColor, type AuraColor } from './games/maxkungfu/game/eightGates';
import MaxkungfuGame from './games/maxkungfu/App';
import type { Game, UIState } from './games/maxkungfu/game/game';
import { SOUND_VERSIONS, type SoundVersion } from './games/maxkungfu/game/soundPacks';

function initialVersion(): SoundVersion {
  // Default V2 (pukulan, tendangan, pentungan). Bisa ditimpa lewat URL: ?v=1 / ?v=2 / ?v=3
  const param = new URLSearchParams(window.location.search).get('v');
  const match = SOUND_VERSIONS.find((v) => v.id === `v${param}`);
  return match ? match.id : 'v2';
}

const handle = () => (window as unknown as { __kf?: Game }).__kf;

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sound-bar__unit">
      <span className="sound-bar__label">{label}</span>
      <div className="sound-bar__group" role="group" aria-label={label}>{children}</div>
    </div>
  );
}

export default function App() {
  const [version, setVersion] = useState<SoundVersion>(initialVersion);
  const [ui, setUi] = useState<UIState | null>(null);
  const active = SOUND_VERSIONS.find((v) => v.id === version);
  const [atmo, setAtmo] = useState<'auto' | AtmoId>(loadV2Atmo);
  const [hitFx, setHitFx] = useState<'v1' | 'v2'>(loadV2HitFx);
  const [glow, setGlow] = useState<boolean>(loadV2Glow);
  const [aura, setAura] = useState<AuraColor>(loadAuraColor);

  const nunStyle = ui?.nunStyle ?? 'v3';
  const showHits = ui?.showHits ?? false;

  return (
    <div className={`flex h-full w-full flex-col bg-black ${!ui || ui.state === 'menu' ? 'v2-native-menu' : ''}`}>
      <div className="game-shell">
        {/* key -> game dibuat ulang saat versi suara berganti (audio lama ditutup oleh destroy()) */}
        <MaxkungfuGame key={version} soundVersion={version} onState={setUi} />
      </div>

      <div id="sound-bar" className="sound-bar">
        {ui?.arena === 'office' && (<>
          <Group label="SUASANA">
            <button type="button" className="sound-bar__btn" title="Otomatis: waktu berganti tiap 2 wave, kadang hujan deras" aria-pressed={atmo === 'auto'} onClick={() => { setAtmo('auto'); handle()?.setOfficeAtmo('auto'); }}>AUTO</button>
            {ATMO_LIST.map((x) => (
              <button key={x.id} type="button" className="sound-bar__btn" title={`Suasana ${x.name} (sama dengan kantor V1)`} aria-pressed={atmo === x.id} onClick={() => { setAtmo(x.id); handle()?.setOfficeAtmo(x.id); }}>{x.id === 'hujan' ? 'HUJAN' : x.name}</button>
            ))}
          </Group>
          <Group label="EFEK HIT">
            <button type="button" className="sound-bar__btn" title="Efek pukulan V1: kilatan kecil di depan, darah & gelombang kejut keluar dari punggung" aria-pressed={hitFx === 'v1'} onClick={() => { setHitFx('v1'); handle()?.setHitFx('v1'); }}>V1</button>
            <button type="button" className="sound-bar__btn" title="Efek pukulan asli game V2" aria-pressed={hitFx === 'v2'} onClick={() => { setHitFx('v2'); handle()?.setHitFx('v2'); }}>V2</button>
          </Group>
          <Group label="GLOW">
            <button type="button" className="sound-bar__btn" title="Glow V1: cahaya saat menghajar & KO, pendar mode N (8 Gerbang) dan mode X (One For All), moncong senjata, ledakan" aria-pressed={glow} onClick={() => { setGlow(true); handle()?.setGlow(true); }}>V1</button>
            <button type="button" className="sound-bar__btn" title="Tanpa glow V1 (tampilan asli V2)" aria-pressed={!glow} onClick={() => { setGlow(false); handle()?.setGlow(false); }}>OFF</button>
          </Group>
        </>)}
        <Group label="AURA">
          <button type="button" className="sound-bar__btn" title="Aura Delapan Gerbang (tombol N) MERAH (bawaan)" aria-pressed={aura === 'red'} onClick={() => { setAura('red'); handle()?.setAuraColor('red'); }}>MERAH</button>
          <button type="button" className="sound-bar__btn" title="Aura Delapan Gerbang (tombol N) HIJAU" aria-pressed={aura === 'green'} onClick={() => { setAura('green'); handle()?.setAuraColor('green'); }}>HIJAU</button>
          <button type="button" className="sound-bar__btn" title="Aura Delapan Gerbang (tombol N) BIRU" aria-pressed={aura === 'blue'} onClick={() => { setAura('blue'); handle()?.setAuraColor('blue'); }}>BIRU</button>
        </Group>
        <Group label="SUARA">
          {SOUND_VERSIONS.map((v) => (
            <button key={v.id} type="button" className="sound-bar__btn" title={v.hint}
              aria-label={`Suara ${v.label}`} aria-pressed={v.id === version} onClick={() => setVersion(v.id)}>{v.label}</button>
          ))}
        </Group>

        <Group label="NUNCHAKU">
          {(['v1', 'v2', 'v3'] as const).map((s) => (
            <button key={s} type="button" className="sound-bar__btn"
              title={s === 'v3' ? 'Fire Trail — jejak api atraksi' : s === 'v2' ? 'Stick Fist klasik' : 'Drifter klasik'}
              aria-label={`Nunchaku ${s === 'v3' ? 'Api' : s.toUpperCase()}`}
              aria-pressed={nunStyle === s}
              onClick={() => handle()?.selectNunStyle(s)}>{s === 'v3' ? 'API' : s.toUpperCase()}</button>
          ))}
        </Group>

        <Group label="BOXING">
          {([['ali', 'ALI'], ['tyson', 'TYSON'], ['ippo', 'IPPO']] as const).map(([id, label]) => (
            <button key={id} type="button" className="sound-bar__btn"
              title={id === 'ali' ? 'Ali Shuffle — melayang, flicker jab' : id === 'tyson' ? 'Peek-a-Boo — merunduk, hook & uppercut' : 'Dempsey Roll — menekan, body blow & Gazelle'}
              aria-label={`Boxing ${label}`}
              aria-pressed={ui?.weapon === 'boxing' && ui?.boxStance === id}
              onClick={() => handle()?.selectBoxStance(id)}>{label}</button>
          ))}
        </Group>

        <Group label="MODE">
          <button type="button" className="sound-bar__btn" title="Bertahan dari gelombang musuh tanpa akhir"
            aria-label="Mode Wave" aria-pressed={ui?.mode === 'survival' && !ui?.campaign} onClick={() => handle()?.startWaveMode()}>WAVE</button>
          <button type="button" className="sound-bar__btn" title="Story: tiap wave diakhiri bos bersenjata. Menang = senjata baru"
            aria-label="Mode Story" aria-pressed={!!ui?.campaign} onClick={() => handle()?.startStoryMode()}>STORY</button>
        </Group>

        <Group label="ARENA">
          <button type="button" className="sound-bar__btn" title="Arena Padang Rumput klasik (top-down)"
            aria-label="Arena Padang Rumput" aria-pressed={(ui?.arena ?? 'meadow') === 'meadow'} onClick={() => handle()?.setArena('meadow')}>PADANG</button>
          <button type="button" className="sound-bar__btn" title="Kantor Bertingkat Side-View — bertahan dari musuh kiri & kanan (default memakai Fist Mode)"
            aria-label="Arena Kantor Side-View" aria-pressed={ui?.arena === 'office'} onClick={() => { handle()?.startOfficeMode(); handle()?.setWeapon('fist'); }}>KANTOR 2D</button>
        </Group>

        <Group label="TEMPO">
          {([[1, 'NORMAL', 'Kecepatan serangan asli'], [0.5, 'NATURAL', 'Ayunan setengah kecepatan, terasa natural  (tombol [ dan ])'], [0.35, 'PELAN', 'Ayunan pelan dan nyaman'], [0.25, 'SANTAI', 'Ayunan sangat pelan, sinematik']] as const).map(([v, label, hint]) => (
            <button key={label} type="button" className="sound-bar__btn" title={hint} aria-label={`Tempo serangan ${label}`}
              aria-pressed={(ui?.tempo ?? 1) === v} onClick={() => handle()?.setTempo(v)}>{label}</button>
          ))}
        </Group>

        <Group label="GAMBAR">
          <button type="button" className="sound-bar__btn" title="Tampilan pixel asli" aria-label="Gambar pixel"
            aria-pressed={!(ui?.view2d ?? false)} onClick={() => handle()?.set2D(false)}>PIXEL</button>
          <button type="button" className="sound-bar__btn" title="Versi 2D mulus tanpa blok pixel, dengan bayangan lembut" aria-label="Gambar 2D halus"
            aria-pressed={ui?.view2d ?? false} onClick={() => handle()?.set2D(true)}>2D HALUS</button>
        </Group>

        <Group label="MODEL">
          <button type="button" className="sound-bar__btn" title="Proporsi stickman lebih tinggi: badan, tangan, kaki memanjang"
            aria-pressed={ui?.tall ?? false} onClick={() => handle()?.toggleTall()}>PANJANG</button>
          <button type="button" className="sound-bar__btn" title="Render halus dengan bayangan dan cahaya kedalaman, tanpa pixelated"
            aria-pressed={ui?.smooth ?? false} onClick={() => handle()?.toggleSmooth()}>3D HALUS</button>
        </Group>

        <Group label="BOT">
          <button type="button" className="sound-bar__btn" title="Bot sekutu ahli kombo + fatality (tombol M)"
            aria-pressed={ui?.botOn ?? false} onClick={() => handle()?.toggleBot()}>BOT</button>
          <button type="button" className="sound-bar__btn" title="Musuh cermin yang memakai senjata pemain secara live"
            aria-pressed={ui?.mirrorOn ?? false} onClick={() => handle()?.spawnMirror()}>MIRROR</button>
        </Group>

        <Group label="FX">
          <button type="button" className="sound-bar__btn" title="Filter retro: vignette + garis pindai"
            aria-label="Filter retro" aria-pressed={ui?.filters ?? false}
            onClick={() => handle()?.setFilters(!(ui?.filters ?? false))}>{(ui?.filters ?? false) ? 'ON' : 'OFF'}</button>
        </Group>

        <Group label="TEKS">
          <button type="button" className="sound-bar__btn" title="Hanya judul jurus pamungkas"
            aria-pressed={!showHits} onClick={() => handle()?.setShowHits(false)}>MIN</button>
          <button type="button" className="sound-bar__btn" title="Tampilkan kata tiap hantaman"
            aria-pressed={showHits} onClick={() => handle()?.setShowHits(true)}>FULL</button>
        </Group>

        <span className="sound-bar__hint">{active?.hint}</span>
      </div>
    </div>
  );
}
