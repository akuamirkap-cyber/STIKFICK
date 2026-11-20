import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  Crosshair,
  Footprints,
  Gamepad2,
  Keyboard,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Game, type UIState } from '../original/v2/games/maxkungfu/game/game';
import { VIEW_H, VIEW_W } from '../original/v2/games/maxkungfu/game/constants';
import { FOOT_PRACTICE, modes, readLocal, writeLocal, type FootPracticeRoute, type PlayMode, type PracticeStyle } from '../data';
import { PigeonMark } from './Brand';
import ArcadePanel from './ArcadePanel';
import { createDojoRenderer } from '../game/dojoRenderer';
import { FootPractice } from '../game/footPractice';

type Props = {
  mode: PlayMode;
  initialStyle: PracticeStyle;
  initialRoute?: FootPracticeRoute;
  sound: boolean;
  changeSound: (v: boolean) => void;
  player: string;
  onExit: () => void;
  onPlay: (m: PlayMode, style?: PracticeStyle) => void;
};

export default function GameScreen({ mode, initialStyle, initialRoute = 'flow', sound, changeSound, player, onExit, onPlay }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [ui, setUI] = useState<UIState | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 540 });
  const [help, setHelp] = useState(false);
  const [full, setFull] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restart, setRestart] = useState(0);
  const equippedStyle = useRef<PracticeStyle>(initialStyle);
  const drill = useRef(new FootPractice(initialRoute));
  const [drillRoute, setDrillRoute] = useState<FootPracticeRoute>(drill.current.route);
  const [drillResult, setDrillResult] = useState({ hits: 0, complete: false });
  const [hits, setHits] = useState(0);
  const [showTouch, setShowTouch] = useState(() => readLocal('touch', window.matchMedia('(pointer: coarse)').matches));
  const settings = useRef({ sound, changeSound });
  settings.current = { sound, changeSound };
  const resumeAfterHelp = useRef(false);
  const training = mode === 'training';
  const foot = ui?.weapon === 'foot';
  const modeInfo = modes.find((m) => m.id === mode)!;
  useEffect(() => {
    if (!canvas.current) return;
    let g: Game | null = null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onHidden = () => {
      if (document.hidden) g?.pause();
    };
    const onFull = () => setFull(!!document.fullscreenElement);
    try {
      g = new Game(canvas.current, 'v2');
      game.current = g;
      if (g.sfx.muted !== !settings.current.sound) g.sfx.toggleMute();
      g.blood.mode = 'normal';
      g.particles.bloodEnabled = () => false;
      let starting = true;
      g.onUI = (s) => {
        setUI(s);
        if (!starting && training && (s.weapon === 'fist' || s.weapon === 'foot')) equippedStyle.current = s.weapon;
        if (training) drill.current.readStance(Boolean(s.footStance));
        // Scroll mouse menukar Foot Mode V1 / V2: rute latihan ikut menyesuaikan.
        if (training && s.weapon === 'foot' && s.footVer) {
          const current = drill.current.route;
          const wanted: FootPracticeRoute = s.footVer === 3 ? 'v3' : s.footVer === 2 ? 'v2' : current === 'v2' || current === 'v3' ? 'flow' : current;
          if (wanted !== current) {
            drill.current.select(wanted);
            setDrillRoute(wanted);
            setDrillResult({ hits: drill.current.best, complete: false });
          }
        }
        setHits(g?.muay.contacts ?? 0);
        if (s.muted === settings.current.sound) settings.current.changeSound(!s.muted);
      };
      if (training) {
        g.startTraining();
        g.onFootPractice = (move, count, beat) => {
          drill.current.hit(move, count, beat);
          setDrillResult({ hits: drill.current.best, complete: drill.current.complete });
        };
        g.render = createDojoRenderer(g, canvas.current, player, drill.current);
      } else if (mode === 'story') {
        g.arena = 'office';
        g.startStoryMode();
      } else {
        g.arena = 'city';
        g.startWaveMode();
      }
      g.setWeapon(training ? equippedStyle.current : 'fist');
      starting = false;
      g.start();
      g.input.focus();
      (window as Window & { __kf?: Game }).__kf = g;
    } catch (e) {
      console.error('Arena initialization failed', e);
      setError('Arena tidak dapat dimuat. Coba mulai ulang atau kembali ke lobi.');
    }
    document.addEventListener('visibilitychange', onHidden);
    document.addEventListener('fullscreenchange', onFull);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      document.removeEventListener('fullscreenchange', onFull);
      document.body.style.overflow = oldOverflow;
      if (g) {
        if (!training) writeLocal('best', Math.max(readLocal('best', 0), Math.round(g.score)));
        g.onUI = null;
        g.destroy();
      }
      game.current = null;
      delete (window as Window & { __kf?: Game }).__kf;
      document.body.classList.remove('smooth-mode', 'view-2d');
    };
  }, [mode, initialStyle, training, restart]);
  useEffect(() => {
    const stage = canvas.current?.parentElement;
    if (!training || !foot || !stage) return;
    const media = window.matchMedia('(max-width: 700px) and (orientation: portrait)');
    const resize = () => {
      if (!media.matches) { setCanvasSize({ width: 960, height: 540 }); return; }
      const { width: w, height: h } = stage.getBoundingClientRect();
      const width = Math.round(Math.max(500, Math.min(660, w * 1.55)));
      if (w && h) setCanvasSize({ width, height: Math.round(width * h / w) });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    media.addEventListener('change', resize);
    return () => { observer.disconnect(); media.removeEventListener('change', resize); };
  }, [training, foot]);
  useEffect(() => {
    const g = game.current;
    if (g && g.sfx.muted !== !sound) g.toggleMute();
  }, [sound]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  const helpOpen = () => {
    resumeAfterHelp.current = game.current?.state === 'playing';
    game.current?.pause();
    setHelp(true);
  };
  const helpClose = () => {
    setHelp(false);
    if (resumeAfterHelp.current) game.current?.resume();
  };
  const reset = () => {
    setError('');
    setNotice('');
    setHits(0);
    drill.current.reset();
    setDrillResult({ hits: drill.current.best, complete: false });
    setRestart((n) => n + 1);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await screen.current?.requestFullscreen();
    } catch {
      setNotice('Layar penuh tidak tersedia pada peramban ini.');
    }
  };
  const practice = () => {
    const g = game.current;
    if (!g || g.state !== 'playing') return;
    if (!g.muay.markedTarget(g)) {
      setNotice(
        g.muay.active || g.muay.cd > 0
          ? 'Tunggu hingga posisi siap.'
          : 'Dekati partner atau pilih Ulangi posisi.',
      );
      return;
    }
    g.input.focus();
    g.input.mouse.rpressed = true;
    g.muay.maybeStart(g);
  };
  const kickPractice = (input: 'L' | 'H') => {
    const g = game.current;
    if (!g || g.state !== 'playing') return;
    const e = g.enemies[0];
    if (e && g.player.attackPhase === 'none') g.player.aim = Math.atan2(e.y - g.player.y, e.x - g.player.x);
    setNotice('');
    g.input.focus();
    g.queueAttack(input);
  };
  const resetPosition = (announce = true) => {
    game.current?.resetTrainingPartner();
    game.current?.input.focus();
    drill.current.reset();
    setDrillResult({ hits: drill.current.best, complete: false });
    setHits(0);
    setNotice(announce ? 'Posisi latihan diatur ulang.' : '');
  };
  const changeDrill = (route: FootPracticeRoute) => {
    drill.current.select(route);
    setDrillRoute(route);
    game.current?.setFootVersion(route === 'v3' ? 3 : route === 'v2' ? 2 : 1);
    game.current?.resetTrainingPartner();
    game.current?.input.focus();
    setDrillResult({ hits: drill.current.best, complete: false });
    setNotice('');
  };
  const practiceShortcut = (key: 'launch' | 'jump') => {
    const g = game.current;
    if (!g || g.state !== 'playing' || g.player.weapon !== 'foot') return;
    setNotice('');
    g.input.focus();
    if (key === 'launch') g.queueFootLauncher();
    else g.input.pressed.add(' ');
  };
  const switchFootStance = () => {
    const g = game.current;
    if (!g || g.state !== 'playing') return;
    setNotice('');
    g.input.focus();
    g.queueFootStance();
  };
  const touchDown = (e: PointerEvent<HTMLButtonElement>, key: string) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const g = game.current;
    if (!g || g.state !== 'playing') return;
    g.input.focus();
    if (key === 'j' || key === 'k') {
      const nearest = g.enemies
        .filter((v) => !v.dead)
        .sort(
          (a, b) =>
            Math.hypot(a.x - g.player.x, a.y - g.player.y) - Math.hypot(b.x - g.player.x, b.y - g.player.y),
        )[0];
      if (nearest) {
        g.input.mouse.x = (nearest.x - g.cam.x - VIEW_W / 2) * g.zoom + VIEW_W / 2;
        g.input.mouse.y = (nearest.y - g.cam.y - VIEW_H / 2) * g.zoom + VIEW_H / 2;
      }
      g.input.synthMouseDown(key === 'j' ? 0 : 2);
    } else {
      if (!g.input.keys.has(key)) g.input.pressed.add(key);
      g.input.keys.add(key);
    }
  };
  const touchUp = (key: string) => {
    const g = game.current;
    if (!g) return;
    g.input.keys.delete(key);
    if (key === 'j' || key === 'k') g.input.synthMouseUp(key === 'j' ? 0 : 2);
  };
  const touchKey = (key: string, content: React.ReactNode, label: string) => (
    <button
      key={key}
      aria-label={label}
      className={`touch-key touch-${key === ' ' ? 'jump' : key}`}
      onPointerDown={(e) => touchDown(e, key)}
      onPointerUp={() => touchUp(key)}
      onPointerCancel={() => touchUp(key)}
      onLostPointerCapture={() => touchUp(key)}
    >
      {content}
    </button>
  );
  const state = ui?.state;
  const isOverlay = !!state && state !== 'playing' && !help;
  const activeDrill = FOOT_PRACTICE[drillRoute];
  const stance = ui?.footStance;
  return (
    <div className={`game-screen${foot ? training ? ' foot-active foot-dojo' : ' foot-active' : ''}`} ref={screen}>
      <header className="game-header">
        <div className="game-header-left">
          <button className="back-button" onClick={onExit}>
            <ChevronLeft size={17} />
            <span>Lobi</span>
          </button>
          <span className="nav-divider" />
          <PigeonMark size={27} />
          <div>
            <span className="game-wordmark">KUNGFU DRIFTER</span>
            <span className="game-mode-name">{modeInfo.name}</span>
          </div>
        </div>
        <div className="game-toolbar">
          {foot && !training && <button type="button" className="square-button native-stance-toggle" aria-label="Ganti kuda-kuda Flamingo" aria-pressed={Boolean(stance)} onClick={switchFootStance}>I</button>}
          <button
            className="square-button"
            title="Panduan kontrol"
            aria-label="Panduan kontrol"
            onClick={helpOpen}
          >
            <Keyboard size={17} />
          </button>
          <button
            className="square-button"
            onClick={() => {
              changeSound(!sound);
              game.current?.input.focus();
            }}
            aria-label={sound ? 'Matikan suara' : 'Aktifkan suara'}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            className="square-button"
            onClick={() => (state === 'paused' ? game.current?.resume() : game.current?.pause())}
            aria-label={state === 'paused' ? 'Lanjutkan permainan' : 'Jeda permainan'}
          >
            {state === 'paused' ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            className="square-button fullscreen-button"
            onClick={fullscreen}
            aria-label={full ? 'Keluar layar penuh' : 'Layar penuh'}
          >
            {full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>
      <div className="arena-frame">
        <div className="arena-stage">
          <canvas
            ref={canvas}
            width={foot && training ? canvasSize.width : 960}
            height={foot && training ? canvasSize.height : 540}
            aria-label={`Arena Kungfu Drifter, ${modeInfo.name}. Gunakan WASD untuk bergerak, J untuk memukul, K untuk clinch.`}
          />
          {error && (
            <div className="arena-overlay">
              <h2>ARENA TERHENTI</h2>
              <p>{error}</p>
              <button className="primary-button" onClick={reset}>
                COBA LAGI
              </button>
              <button className="text-action" onClick={onExit}>
                Kembali ke lobi
              </button>
            </div>
          )}
          {isOverlay && !error && (
            <div className="arena-overlay">
              <span className="micro-label">PIGEON / {modeInfo.label}</span>
              <h2>
                {state === 'paused'
                  ? 'GAME DIJEDA'
                  : state === 'mutation'
                    ? 'PILIH UPGRADE'
                    : state === 'victory'
                      ? 'KAMU MENANG'
                      : 'RONDE SELESAI'}
              </h2>
              {state === 'paused' ? (
                <p>Tarik napas. Arena menunggumu.</p>
              ) : state === 'mutation' ? (
                <p>Pilih kemampuan untuk ronde berikutnya.</p>
              ) : (
                <p>
                  Skor {Math.round(ui?.score ?? 0).toLocaleString('id-ID')}{' '}
                  <span className="muted-slash">/</span> {ui?.kills ?? 0} lawan dikalahkan
                </p>
              )}
              <div className="overlay-actions">
                {state === 'mutation' ? (
                  ui?.choices.map((c, i) => (
                    <button
                      className="secondary-button"
                      key={c.id}
                      onClick={() => game.current?.chooseMutation(i)}
                    >
                      {c.name}
                    </button>
                  ))
                ) : (
                  <button
                    className="primary-button"
                    onClick={() =>
                      state === 'paused'
                        ? game.current?.resume()
                        : state === 'dead'
                          ? game.current?.respawn()
                          : reset()
                    }
                  >
                    <Play size={15} fill="currentColor" />
                    {state === 'paused' ? 'LANJUTKAN' : state === 'dead' ? 'BANGKIT' : 'MAIN LAGI'}
                  </button>
                )}
                <button className="secondary-button" onClick={onExit}>
                  Kembali ke lobi <ArrowRight size={15} />
                </button>
              </div>
              {state === 'paused' && (
                <button className="text-action" onClick={reset}>
                  <RotateCcw size={14} />
                  Mulai ulang sesi
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {training && (
        <div className="practice-console">
          <div className="practice-style" role="group" aria-label="Gaya latihan">
            {(['fist', 'foot'] as const).map((style, index) => (
              <button key={style} type="button" disabled={state !== 'playing'} aria-pressed={style === (foot ? 'foot' : 'fist')}
                onClick={() => { game.current?.setWeapon(style); game.current?.input.focus(); }}>
                <span>0{index + 1}</span>{style === 'foot' ? 'FOOT MODE' : 'FIST MODE'}
              </button>
            ))}
            {foot && <div className="foot-drills" role="group" aria-label="Rute latihan Foot Mode">
              {(Object.keys(FOOT_PRACTICE) as FootPracticeRoute[]).map((route) => (
                <button key={route} type="button" disabled={state !== 'playing'} aria-pressed={route === drillRoute}
                  onClick={() => changeDrill(route)} aria-label={`Rute ${FOOT_PRACTICE[route].label}`}>
                  {FOOT_PRACTICE[route].label}
                </button>
              ))}
            </div>}
          </div>
          <div className="practice-bar">
          <div className="practice-title">
            {foot ? <Footprints size={20} /> : <Crosshair size={20} />}
            <div>
              <strong>{foot ? drillResult.complete ? 'KOMBO BERHASIL' : drillRoute === 'flamingo' ? 'FLAMINGO RUSH' : 'LATIHAN FOOT MODE' : 'MUAY THAI CLINCH'}</strong>
              <span>
                {foot ? (drillResult.complete ? `${activeDrill.label} selesai. Rekor sesi ${drillResult.hits} hit.` : activeDrill.hint) : hits
                  ? `${hits} kontak berhasil. Lepaskan tombol sebelum mencoba lagi.`
                  : 'Dekati partner, lalu tekan K sekali untuk satu dengkul.'}
              </span>
            </div>
          </div>
          <div className="practice-actions">
            <button
              className="secondary-button"
              disabled={state !== 'playing'}
              onClick={() => resetPosition()}
            >
              <RotateCcw size={14} />
              <span>Ulangi posisi</span>
            </button>
            {foot ? <>
              <button className="secondary-button foot-stance-action" type="button" disabled={state !== 'playing'} aria-label="Ganti kuda-kuda Flamingo" aria-pressed={Boolean(stance)} onClick={switchFootStance}>
                {ui?.footVer === 2 ? 'SKY LIFT' : stance === 'left' ? 'KIRI DI DEPAN' : stance === 'right' ? 'KANAN DI DEPAN' : 'FLAMINGO'} <kbd>I</kbd>
              </button>
              {drillRoute === 'aerial' && <>
                <button className="secondary-button" disabled={state !== 'playing'} onClick={() => practiceShortcut('launch')}>ANGKAT</button>
                {!showTouch && <button className="secondary-button" disabled={state !== 'playing'} onClick={() => practiceShortcut('jump')}>LOMPAT</button>}
              </>}
              {!showTouch && <>
                <button className="secondary-button" disabled={state !== 'playing'} onClick={() => kickPractice('L')}>{stance ? 'RUSH' : 'FLOW'} <kbd>J</kbd></button>
                <button className={`primary-button${stance ? ' flamingo-finisher-action' : ''}`} disabled={state !== 'playing'} onClick={() => kickPractice('H')}>{stance ? 'BREAKER' : 'POWER'} <kbd>K</kbd></button>
              </>}
            </> : <button className="primary-button" disabled={state !== 'playing'} onClick={practice}>UJI CLINCH <kbd>K</kbd></button>}
          </div>
          </div>
        </div>
      )}
      {showTouch && state === 'playing' && (
        <div className="touch-controls">
          <div className="touch-dpad">
            {touchKey('w', <ArrowUp size={18} />, 'Gerak atas')}
            {touchKey('a', <ArrowLeft size={18} />, 'Gerak kiri')}
            {touchKey('s', <ArrowDown size={18} />, 'Gerak bawah')}
            {touchKey('d', <ArrowRight size={18} />, 'Gerak kanan')}
          </div>
          <div className="touch-attacks">
            {touchKey('j', foot ? 'TENDANG' : 'PUKUL', foot ? 'Tendang' : 'Pukul')}
            {touchKey('k', foot ? 'POWER' : 'CLINCH', foot ? 'Tendangan berat' : 'Clinch')}
            {touchKey(' ', 'LOMPAT', 'Lompat')}
            {touchKey('shift', 'DASH', 'Dash')}
          </div>
        </div>
      )}
      <footer className="game-footer">
        <span className="live-player">
          <i />
          {player}
        </span>
        <div className="key-legend">
          <span>
            <kbd>WASD</kbd> Gerak
          </span>
          <span>
            <kbd>J</kbd> {foot ? 'Flow' : 'Pukul'}
          </span>
          <span>
            <kbd>K</kbd> {foot ? 'Power' : 'Clinch'}
          </span>
          <span>
            <kbd>Esc</kbd> Jeda
          </span>
        </div>
        <button
          className="text-action"
          aria-pressed={showTouch}
          onClick={() => {
            setShowTouch(!showTouch);
            writeLocal('touch', !showTouch);
            game.current?.input.focus();
          }}
        >
          <Gamepad2 size={16} />
          Kontrol sentuh
        </button>
      </footer>
      {notice && (
        <div className="game-notice" role="status">
          {notice}
        </div>
      )}
      {help && (
        <ArcadePanel
          panel="controls"
          onClose={helpClose}
          onPlay={(m, style) => {
            setHelp(false);
            if (m === mode) {
              if (style) game.current?.setWeapon(style);
              game.current?.resume();
            } else onPlay(m, style);
          }}
          player={player}
          onSavePlayer={() => {}}
        />
      )}
    </div>
  );
}
