import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Maximize2, Minimize2, Pause, Play, Settings2, Volume2, VolumeX, X } from 'lucide-react';
import { VIEW_H, VIEW_W, ZONES } from './game/constants';
import { Game, type UIState } from './game/game';
import { OFFICE_PRESETS } from './game/office';
import type { SoundVersion } from './game/soundPacks';
import { MOVE_LIST } from './game/moves';
import { MUTATIONS } from './game/mutations';
import { YOYO_SKINS, isYoyoSkinId } from './game/yoyoSkins';
import type { WeaponKind } from './game/types';
import { MutIcon, MutIconSm } from './MutIcon';
import { OfficeTitleMenu, type OfficeMenuItem } from '../../../shared/office/OfficeTitleMenu';
import officeMenuArt from '../../../../assets/v2-office-menu.png';
import { readLocal, writeLocal } from '../../../../data';

const MENU_ITEMS = [
  { id: 'office', label: 'MULAI: MENARA KANTOR', sub: 'StickBrawl bertingkat - wave tanpa akhir' },
  { id: 'story', label: 'STORY MODE', sub: 'Taklukkan bos dan buka senjata baru' },
  { id: 'classic', label: 'ARENA 3/4 KLASIK', sub: 'Bertahan di arena StickBrawl top-down' },
] as const;
type MenuId = typeof MENU_ITEMS[number]['id'];


const initialUI: UIState = {
  state: 'menu', level: 1, zoneName: ZONES[0].name, zoneSub: ZONES[0].sub, score: 0, age: 20, deathCounter: 1, deaths: 0, kills: 0,
  bestCombo: 0, choices: [], save: null, best: { level: 0, score: 0 }, muted: false, mutations: [], ageGain: 0, hp: 5, maxHp: 5, accent: '#ff5a36',
  mode: 'story', wave: 0, survivalTime: 0, bestWave: 0, bestSurvivalScore: 0, blood: 'combined', v2: true, long: false, tall: false, smooth: false,
  filters: false, duelRound: 1, duelName: 'RENGGA', duelTitle: 'AHLI NUNCHAKU', duelHp: 1, clashOn: false,
  weapon: 'fist', yoyoVer: 2, yoyoSkin: 'ember', nunStyle: 'v3', boxStance: 'ali', arena: 'meadow', officeMapId: 'preset_tower_4', officeMapName: 'MENARA KANTOR 4 LT', tempo: 1, campaign: false, view2d: false, botOn: false, mirrorOn: false, showHits: false, hasNunchaku: false,
};

function aimAtNearest(game: Game, scene = false) {
  if (!scene && game.input.mouseMovedAt && performance.now() - game.input.mouseMovedAt < 1500) return;
  let nearest = null;
  let distance = Infinity;
  for (const enemy of game.enemies) {
    if (enemy.dead || enemy.spawnT > 0 || (scene && (enemy.boss || enemy.z > 1 || enemy.down > 0))) continue;
    const d = (enemy.x - game.player.x) ** 2 + (enemy.y - game.player.y) ** 2;
    if (scene && d > (30 + enemy.r) ** 2) continue;
    if (d < distance) { distance = d; nearest = enemy; }
  }
  if (!nearest) return;
  game.input.mouse.x = (nearest.x - game.cam.x - VIEW_W / 2) * game.zoom + VIEW_W / 2;
  game.input.mouse.y = (nearest.y - game.cam.y - VIEW_H / 2) * game.zoom + VIEW_H / 2;
}

function HoldButton({ label, children, onPress, onRelease, className = '' }: {
  label: string; children: ReactNode; onPress: () => void; onRelease: () => void; className?: string;
}) {
  const held = useRef(false);
  const release = () => { if (held.current) { held.current = false; onRelease(); } };
  const press = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (held.current) return;
    held.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onPress();
  };
  return <button type="button" className={`game-touch-button ${className}`} aria-label={label}
    onPointerDown={press} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onClick={(event) => { if (event.detail === 0) { onPress(); window.setTimeout(onRelease, 120); } }}>
    {children}
  </button>;
}

function TouchControls({ gameRef, foot }: { gameRef: RefObject<Game | null>; foot: boolean }) {
  const key = (code: string, down: boolean) => {
    const game = gameRef.current;
    if (!game) return;
    if (down && code === 'KeyG') aimAtNearest(game, true);
    game.input.focus();
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
  };
  const mouse = (button: number, down: boolean) => {
    const game = gameRef.current;
    if (!game) return;
    if (down) { aimAtNearest(game); game.input.focus(); game.input.synthMouseDown(button); }
    else game.input.synthMouseUp(button);
  };
  const keyButton = (code: string, label: string, content: ReactNode, className = '') => (
    <HoldButton label={label} className={className} onPress={() => key(code, true)} onRelease={() => key(code, false)}>{content}</HoldButton>
  );
  return <div className="game-touch" aria-label="Kontrol sentuh">
    <div className="game-dpad">
      {keyButton('KeyW', 'Bergerak ke atas', <ArrowUp size={20} />, 'dpad-up')}
      {keyButton('KeyA', 'Bergerak ke kiri', <ArrowLeft size={20} />, 'dpad-left')}
      {keyButton('KeyS', 'Bergerak ke bawah', <ArrowDown size={20} />, 'dpad-down')}
      {keyButton('KeyD', 'Bergerak ke kanan', <ArrowRight size={20} />, 'dpad-right')}
    </div>
    <div className="game-actions">
      {keyButton('ShiftLeft', 'Menghindar', 'DASH')}
      {keyButton('Space', 'Lompat', 'LOMPAT')}
      {keyButton('KeyC', 'Parry', 'PARRY')}
      {keyButton('KeyG', 'Adegan aksi', 'AKSI')}
      <HoldButton label={foot ? 'Tendangan kombo' : 'Serangan ringan'} className="game-attack" onPress={() => mouse(0, true)} onRelease={() => mouse(0, false)}>{foot ? 'TENDANG' : 'PUKUL'}</HoldButton>
      <HoldButton label={foot ? 'Tendangan berat' : 'Serangan berat'} onPress={() => mouse(2, true)} onRelease={() => mouse(2, false)}>{foot ? 'POWER' : 'BERAT'}</HoldButton>
      {keyButton('KeyE', 'Focus strike', 'FOCUS')}
      {keyButton('KeyX', 'One For All', 'OFA')}
      {keyButton('KeyF', 'Fatality', 'FINISH')}
    </div>
  </div>;
}

function useScale(root: RefObject<HTMLDivElement | null>, inMenu: boolean, touch: boolean) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const calc = () => {
      const portrait = touch && el.clientHeight > el.clientWidth && el.clientWidth <= 820 && !inMenu;
      setScale(Math.min(el.clientWidth / VIEW_W, Math.max(120, el.clientHeight - (portrait ? 210 : 0)) / VIEW_H) || 1);
    };
    calc();
    const observer = new ResizeObserver(calc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [root, inMenu, touch]);
  return scale;
}

export default function App({ soundVersion = 'v2', onState }: {
  soundVersion?: SoundVersion;
  onState?: (ui: UIState) => void;
}) {
  const stateCb = useRef(onState);
  stateCb.current = onState;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const pausedForSetup = useRef(false);
  const [ui, setUi] = useState<UIState>(initialUI);
  type Tr = { key: number; phase: 'close' | 'hold' | 'open' | 'fight'; label: string; sub: string; cx: number; cy: number; fight: boolean };
  const [tr, setTr] = useState<Tr | null>(null);
  const [leaving, setLeaving] = useState(false);
  const busyRef = useRef(false);
  const transitionTimers = useRef<number[]>([]);
  const prevState = useRef<string>(initialUI.state);
  const [showSetup, setShowSetup] = useState(false);
  const [menuIdx, setMenuIdx] = useState(0);
  const [showTouch, setShowTouch] = useState(() => readLocal('touch', window.matchMedia('(pointer: coarse)').matches));
  const [fullscreen, setFullscreen] = useState(false);
  const inMenu = ui.state === 'menu';
  const scale = useScale(rootRef, inMenu, showTouch);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { transitionTimers.current = transitionTimers.current.filter((t) => t !== id); fn(); }, ms);
    transitionTimers.current.push(id);
  };
  useEffect(() => () => transitionTimers.current.forEach((t) => window.clearTimeout(t)), []);
  const updateTouch = (enabled: boolean) => { setShowTouch(enabled); writeLocal('touch', enabled); };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let g: Game;
    try {
      g = new Game(canvas, soundVersion);
    } catch (err) {
      console.error('[KUNGFU DRIFTER] failed to create game', err);
      return;
    }
    gameRef.current = g;
    (window as unknown as { __kf?: Game }).__kf = g;
    // The title has its own office artwork; do not paint the hidden attract-mode canvas.
    const renderGame = g.render.bind(g);
    g.render = () => { if (g.state !== 'menu') renderGame(); };
    let muted = !readLocal('sound', true);
    g.sfx.muted = muted;
    g.onUI = (u) => {
      setUi(u); stateCb.current?.(u);
      if (muted !== u.muted) { muted = u.muted; writeLocal('sound', !muted); }
    };
    try {
      g.start();
    } catch (err) {
      console.error('[KUNGFU DRIFTER] failed to start game', err);
    }
    g.input.focus();
    const resumeAudio = () => { if (g.sfx.ctx && g.sfx.ctx.state !== 'running' && g.sfx.ctx.state !== 'closed' && !g.sfx.muted) g.sfx.init(); };
    window.addEventListener('pointerdown', resumeAudio, true);
    window.addEventListener('keydown', resumeAudio, true);

    return () => {
      window.removeEventListener('pointerdown', resumeAudio, true);
      window.removeEventListener('keydown', resumeAudio, true);
      g.destroy();
      if (gameRef.current === g) gameRef.current = null;
      if ((window as unknown as { __kf?: Game }).__kf === g) delete (window as unknown as { __kf?: Game }).__kf;
    };
  }, []);

  const closeSetup = useCallback(() => {
    setShowSetup(false);
    const game = gameRef.current;
    if (pausedForSetup.current && game?.state === 'paused') game.resume();
    else game?.input.focus();
    pausedForSetup.current = false;
  }, []);

  useEffect(() => {
    if (!showSetup) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation(); closeSetup();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [showSetup, closeSetup]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Ukur berapa jauh tombol kanan atas menutupi panggung, lalu geser HUD kanan selebar itu.
  useEffect(() => {
    const apply = () => {
      const game = gameRef.current;
      const stage = rootRef.current?.querySelector('.solo-stage');
      const quick = rootRef.current?.querySelector('.game-quick');
      if (!game || !stage || !quick) return;
      const overlap = quick.getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
      game.hudInset = Math.max(0, Math.ceil(overlap / scale));
    };
    apply();
    const id = window.setTimeout(apply, 60);
    return () => window.clearTimeout(id);
  }, [scale, fullscreen, ui.state]);

  const g = () => gameRef.current!;
  const runMenuItem = (id: MenuId) => {
    const game = gameRef.current;
    if (!game || busyRef.current) return;
    game.sfx.init();
    game.sfx.select();
    if (id === 'office') transition(() => game.startOfficeFromMenu(OFFICE_PRESETS[0].id), 'KANTOR BERTINGKAT!', 'STICKBRAWL / MENARA KANTOR');
    else if (id === 'story') transition(() => { game.setArena('office'); game.startCampaignFromMenu(); }, 'SIAP BERTARUNG!', 'MODE STORY');
    else if (id === 'classic') transition(() => { game.setArena('meadow'); game.startSurvivalFromMenu(); }, 'SIAP BERTARUNG!', 'ARENA 3/4 KLASIK');
  };
  const focusGame = () => gameRef.current?.input.focus();
  const act = (fn: () => void) => () => { focusGame(); fn(); focusGame(); };
  const items: OfficeMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    run: () => runMenuItem(item.id),
  }));
  const menuKey = useEffectEvent((event: KeyboardEvent) => {
    if (showSetup || busyRef.current || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable], dialog')) return;
    const direction = ['ArrowUp', 'KeyW'].includes(event.code) ? -1 : ['ArrowDown', 'KeyS'].includes(event.code) ? 1 : 0;
    if (direction) {
      event.preventDefault(); event.stopImmediatePropagation();
      let next = menuIdx;
      do { next = (next + direction + items.length) % items.length; } while (items[next].disabled);
      setMenuIdx(next);
      rootRef.current?.querySelector<HTMLButtonElement>(`[data-office-menu-item="${items[next].id}"]`)?.focus();
      gameRef.current?.sfx.beep();
    } else if (['Enter', 'NumpadEnter', 'Space'].includes(event.code) && !(target instanceof HTMLElement && target.closest('button, a'))) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat && !items[menuIdx].disabled) items[menuIdx].run();
    }
  });
  useEffect(() => {
    if (!inMenu) return;
    const onKey = (event: KeyboardEvent) => menuKey(event);
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [inMenu]);
  /** posisi pemain di layar (persen) — pusat iris tempat transisi menutup / membuka */
  function focusPct() {
    const G = gameRef.current;
    if (!G) return { x: 50, y: 52 };
    const z = G.zoom || 1;
    const sx = ((G.player.x - G.cam.x - VIEW_W / 2) * z + VIEW_W / 2) / VIEW_W;
    const sy = ((G.player.y - 6 - G.cam.y - VIEW_H / 2) * z + VIEW_H / 2) / VIEW_H;
    return { x: Math.max(8, Math.min(92, sx * 100)), y: Math.max(12, Math.min(88, sy * 100)) };
  }
  /** TRANSISI SINEMATIK: menu berpamitan -> iris menutup ke arah petarung -> (aksi) -> kartu judul bergaya film -> iris membuka -> "FIGHT!" */
  function transition(fn: () => void, label?: string, sub?: string, fight = true) {
    if (busyRef.current) return;
    busyRef.current = true;
    const from = focusPct();
    const wasMenu = ui.state === 'menu';
    setLeaving(wasMenu);
    gameRef.current?.sfx.whoosh?.();
    setTr({ key: Date.now(), phase: 'close', label: label ?? '', sub: sub ?? '', cx: from.x, cy: from.y, fight });
    schedule(() => {
      fn();
      setLeaving(false);
      const G = gameRef.current;
      const to = focusPct();
      // kartu judul + FIGHT! hanya bila aksi benar-benar membawa ke permainan (bukan ke layar game over / menu)
      const showCard = !!label && G?.state === 'playing';
      if (showCard) G?.slow(1.9, 0.02);   // dunia nyaris berhenti selama kartu judul, jadi tidak ada musuh yang sudah bergerak
      setTr((t) => (t ? { ...t, phase: 'hold', label: showCard ? t.label : '', fight: showCard && t.fight, cx: to.x, cy: to.y } : t));
      schedule(() => {
        const G2 = gameRef.current;
        if (G2) G2.slowT = 0;
        setTr((t) => (t ? { ...t, phase: 'open' } : t));
        G2?.sfx.whoosh?.();
        schedule(() => {
          if (showCard && fight) { setTr((t) => (t ? { ...t, phase: 'fight' } : t)); gameRef.current?.sfx.announce?.(); schedule(() => { setTr(null); busyRef.current = false; }, 950); }
          else { setTr(null); busyRef.current = false; }
        }, 800);
      }, showCard ? 1250 : 140);
    }, 700);
  }
  const openSetup = () => {
    const game = gameRef.current;
    if (!game) return;
    pausedForSetup.current = game.state === 'playing';
    if (pausedForSetup.current) game.pause();
    setShowSetup(true);
  };
  const restart = () => {
    const game = gameRef.current;
    if (!game) return;
    pausedForSetup.current = false; setShowSetup(false);
    if (game.mode === 'survival') game.newSurvival(); else game.newGame(null);
  };
  const quit = () => {
    pausedForSetup.current = false; setShowSetup(false);
    gameRef.current?.toMenu(); gameRef.current?.input.focus();
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch (error) { console.warn('Layar penuh tidak tersedia:', error); }
  };
  const w = VIEW_W * scale, h = VIEW_H * scale;
  const fontPx = Math.min(22, Math.max(12, Math.round(4.5 * scale)));
  // V2 renders into a display-sized backing store so the picture is resampled exactly ONCE (hard pixel edges).
  // V1 keeps the classic fixed 480x270 buffer that CSS stretches — that is the old, softer look.
  const dpr = typeof window === 'undefined' ? 1 : Math.min(2, window.devicePixelRatio || 1);
  // Pixel art diperbesar nearest-neighbour, jadi buffer di atas ~960px tidak menambah
  // detail apa pun — hanya melipatgandakan biaya fill. Dibatasi supaya tetap mulus.
  const bw = ui.v2 ? Math.max(VIEW_W, Math.min(ui.view2d ? 1920 : 960, Math.round(w * Math.min(dpr, ui.view2d ? 2 : 1.5)))) : VIEW_W;
  const bh = ui.v2 ? Math.max(VIEW_H, Math.round((bw * VIEW_H) / VIEW_W)) : VIEW_H;

  useEffect(() => {
    const prev = prevState.current;
    prevState.current = ui.state;
    if (ui.state !== 'playing' || busyRef.current) return;
    const label = prev === 'menu' ? 'SIAP BERTARUNG!' : prev === 'dead' ? 'BANGKIT!' : prev === 'gameover' ? 'COBA LAGI!' : prev === 'victory' ? 'ULANGI!' : '';
    if (!label) return;
    busyRef.current = true;
    const sub = ui.arena === 'office' ? `KANTOR · ${ui.officeMapName}` : ui.mode === 'team' ? 'BIRU LAWAN MERAH' : ui.campaign ? 'MODE STORY' : ui.mode === 'survival' ? 'MODE WAVE' : `${ui.zoneName}`;
    const to = focusPct();
    gameRef.current?.slow(1.2, 0.02);
    setTr({ key: Date.now(), phase: 'hold', label, sub, cx: to.x, cy: to.y, fight: true });
    schedule(() => {
      if (gameRef.current) gameRef.current.slowT = 0;
      setTr((t) => (t ? { ...t, phase: 'open' } : t));
      schedule(() => { setTr((t) => (t ? { ...t, phase: 'fight' } : t)); schedule(() => { setTr(null); busyRef.current = false; }, 900); }, 800);
    }, 900);
  }, [ui.state, ui.mode, ui.zoneName]);

  return (
    <div ref={rootRef} className={`solo-game ${showTouch && ui.state === 'playing' ? 'solo-game--touch' : ''}`} onContextMenu={(e) => e.preventDefault()}>
      {!inMenu && <div className="game-quick pixel">
        <button type="button" onClick={act(() => g().toggleMute())} aria-label={ui.muted ? 'Nyalakan suara' : 'Bisukan semua suara'} aria-pressed={ui.muted} title={ui.muted ? 'Suara mati [M]' : 'Suara nyala [M]'}>{ui.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
        {['playing', 'paused'].includes(ui.state) && <>
          <button type="button" className="foot-mode-quick" aria-pressed={ui.weapon === 'foot'} aria-label="Foot Mode (O)" title="Foot Mode [O]" onClick={act(() => g().setWeapon(ui.weapon === 'foot' ? 'fist' : 'foot'))}>FOOT <small>O</small></button>
          {ui.weapon === 'foot' && ui.state === 'playing' && (ui.footVer === 2
            ? <button type="button" className="foot-stance-quick" aria-label="Flamingo Sky Lift" title="Flamingo Sky Lift [I]" onClick={act(() => g().queueFootStance())}>SKY LIFT <small>I</small></button>
            : <button type="button" className="foot-stance-quick" aria-label="Ganti kuda-kuda Flamingo" title="Flamingo [I]" aria-pressed={Boolean(ui.footStance)} onClick={act(() => g().queueFootStance())}>FLAMINGO <small>I</small></button>)}
          <button type="button" onClick={() => { if (g().state === 'playing') g().pause(); else g().resume(); }} aria-label={ui.state === 'playing' ? 'Jeda permainan' : 'Lanjutkan permainan'} title={ui.state === 'playing' ? 'Jeda' : 'Lanjutkan'}>{ui.state === 'playing' ? <Pause size={15} /> : <Play size={15} />}</button>
          <button type="button" onClick={openSetup} aria-label="Pengaturan dan senjata"><Settings2 size={15} /><span>SENJATA</span></button>
        </>}
      </div>}
      <div className={`solo-stage relative ${inMenu ? 'v2-opening-stage' : ''} ${leaving ? 'stage-zoom' : ''}`} style={{ width: w, height: h, fontSize: fontPx }}>
        <canvas
          ref={canvasRef}
          width={bw}
          height={bh}
          tabIndex={0}
          aria-label="Arena Kungfu Drifter V2"
          className="block w-full h-full cursor-none outline-none"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* garis pindai retro — hanya bila filter dinyalakan */}
        {ui.filters && !inMenu && (
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.13]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 2px, transparent 4px)' }}
          />
        )}
        {(ui.state === 'dead' || ui.state === 'gameover') && (
          <div className="ui-deathfx" aria-hidden="true"><i className="ui-deathfx__top" /><i className="ui-deathfx__bot" /><b className="ui-deathfx__vig" /></div>
        )}
        {tr && (
          <div key={tr.key} className={`tr tr--${tr.phase}`} style={{ ['--cx' as string]: `${tr.cx}%`, ['--cy' as string]: `${tr.cy}%`, ['--acc' as string]: ui.accent }} aria-hidden="true">
            <div className="tr__iris" />
            {tr.label && (tr.phase === 'hold' || tr.phase === 'open') && (
              <>
                <div className="tr__bar tr__bar--t" /><div className="tr__bar tr__bar--b" />
                <div className="tr__card pixel">
                  <span className="tr__kicker">{tr.sub}</span>
                  <b className="tr__title">{tr.label.split('').map((ch, i) => <i key={i} style={{ animationDelay: `${0.08 + i * 0.035}s` }}>{ch === ' ' ? '\u00a0' : ch}</i>)}</b>
                  <span className="tr__rule" />
                </div>
              </>
            )}
            {tr.phase === 'fight' && <div className="tr__fight pixel"><b>FIGHT!</b></div>}
          </div>
        )}
        {inMenu && (
          <>
            <img className="v2-office-art" src={officeMenuArt} alt="" fetchPriority="high" />
            <OfficeTitleMenu items={items} active={menuIdx} onSelect={setMenuIdx} label="Menu utama V2"
              className={`v2-office-title ${leaving ? 'is-leaving' : ''}`}
              record={<div className="of-best pixel">REKOR: {ui.bestSurvivalScore.toLocaleString('id-ID')} - WAVE {ui.bestWave}</div>} />
            <div className="of-tools v2-office-tools" aria-label="Opsi layar">
              <button type="button" className="of-icon" aria-label={ui.muted ? 'Nyalakan suara' : 'Matikan suara'} onClick={act(() => g().toggleMute())}>
                {ui.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button type="button" className="of-icon" aria-label={fullscreen ? 'Keluar layar penuh' : 'Layar penuh'} onClick={toggleFullscreen}>
                {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button type="button" className={`of-icon of-icon--txt ${showTouch ? 'is-on' : ''}`} aria-label="Kontrol sentuh" aria-pressed={showTouch} onClick={() => updateTouch(!showTouch)}>TOUCH</button>
            </div>
          </>
        )}
        {ui.state === 'mutation' && (
          <Overlay dim="bg-black/70">
            <div className="flex flex-col items-center gap-[0.9em] text-center px-[1em]">
              <div className="pixel text-[1.2em]" style={{ color: ui.accent }}>PILIH MUTASI</div>
              <div className="pixel text-[0.55em] text-white/55">1 · 2 · 3</div>
              <div className="flex flex-wrap justify-center gap-[0.8em] max-w-[36em]">
                {ui.choices.map((m, i) => (
                  <button key={m.id} type="button" onClick={act(() => g().chooseMutation(i))}
                    className="pixel text-left w-[10.5em] p-[0.8em] border-[0.15em] bg-black/70 cursor-pointer transition-transform hover:-translate-y-[0.15em]"
                    style={{ borderColor: m.color, boxShadow: '0.25em 0.25em 0 #000' }}>
                    <div className="flex items-center gap-[0.5em] mb-[0.4em]">
                      <MutIcon id={m.id} color={m.color} />
                      <span className="text-[0.62em]" style={{ color: m.color }}>{m.name}</span>
                    </div>
                    <div className="text-[0.5em] text-white/70 leading-[1.5]">{m.desc}</div>
                    <div className="text-[0.5em] text-white/35 mt-[0.5em]">[{i + 1}]</div>
                  </button>
                ))}
              </div>
            </div>
          </Overlay>
        )}
        {ui.state === 'dead' && (
          <Overlay dim="bg-black/55" kind="dead">
            <div className="flex flex-col items-center gap-[0.7em] text-center px-[1em]">
              <div className="ui-title ui-title--dead pixel" data-text="TUMBANG">TUMBANG</div>
              <div className="pixel text-[0.6em] text-white/70">
                {ui.mode === 'duel' ? `RONDE ${ui.duelRound} · ${ui.duelName}` : ui.mode === 'team' ? 'TIM BIRU KALAH · COBA LAGI!' : `UMUR ${ui.age} · KEMATIAN ${ui.deathCounter}`}
              </div>
              <Stats ui={ui} base={0.8} />
              <div className="pixel text-[0.55em] text-white/45">ENTER UNTUK BANGKIT</div>
              <div className="flex gap-[0.8em] mt-[0.3em] ui-late">
                <Btn accent={ui.accent} onClick={act(() => transition(() => g().respawn(), ui.mode === 'team' ? 'ULANGI!' : 'BANGKIT!', ui.mode === 'team' ? 'TIM 20 VS 20' : ui.campaign ? 'MODE STORY' : 'MODE WAVE'))} primary>BANGKIT</Btn>
                <Btn accent={ui.accent} onClick={act(() => transition(() => g().toMenu(), undefined, undefined, false))}>MENU</Btn>
              </div>
            </div>
          </Overlay>
        )}
        {ui.state === 'gameover' && (
          <Overlay dim="bg-black/75" kind="gameover">
            <div className="flex flex-col items-center gap-[0.8em] text-center px-[1em]">
              <div className="ui-title ui-title--dead pixel" data-text="PERJALANAN USAI">PERJALANAN USAI</div>
              <Stats ui={ui} base={0.8} />
              <div className="flex gap-[0.8em] mt-[0.5em] ui-late">
                <Btn accent={ui.accent} onClick={act(() => transition(() => g().restartZone(), 'COBA LAGI!', ui.campaign ? 'MODE STORY' : 'MODE WAVE'))} primary>{ui.mode === 'survival' ? 'SURVIVE AGAIN' : ui.mode === 'duel' ? 'COBA LAGI' : 'RETRY ZONE'}</Btn>
                <Btn accent={ui.accent} onClick={act(() => transition(() => g().toMenu(), undefined, undefined, false))}>MENU</Btn>
              </div>
            </div>
          </Overlay>
        )}
        {ui.state === 'victory' && (
          <Overlay dim="bg-black/75" kind="victory">
            <div className="flex flex-col items-center gap-[0.8em] text-center px-[1em]">
              <div className="ui-title ui-title--win pixel" data-text={ui.mode === 'team' ? 'TIM BIRU MENANG!' : 'KAMU SANG GURU'}>{ui.mode === 'team' ? 'TIM BIRU MENANG!' : 'KAMU SANG GURU'}</div>
              <div className="pixel text-[0.6em] text-white/70">{ui.mode === 'team' ? 'KEDUA PULUH LAWAN TUMBANG. KEKUATAN TIM!' : 'SEMUA LAWAN TUMBANG. TANGAN KOSONG, HATI PENUH.'}</div>
              <Stats ui={ui} />
<div className="flex gap-[0.8em] ui-late">              {ui.mode === 'team' && <Btn accent={ui.accent} onClick={act(() => transition(() => g().startTeamMode(), 'TIM 20 VS 20!', 'BIRU LAWAN MERAH'))} primary>MAIN LAGI</Btn>}
              <Btn accent={ui.accent} onClick={act(() => transition(() => g().toMenu(), undefined, undefined, false))} primary={ui.mode !== 'team'}>KEMBALI KE MENU</Btn></div>
            </div>
          </Overlay>
        )}
        {ui.state === 'paused' && (
          <Overlay dim="bg-black/70" kind="pause">
            <div className="flex flex-col items-center gap-[0.8em] text-center">
              <div className="ui-title pixel" data-text="PAUSED">PAUSED</div>
              <div className="pixel text-[0.55em] text-white/60">{ui.mode === 'survival' ? `SURVIVAL - WAVE ${ui.wave}` : `LEVEL ${ui.level} - ${ui.zoneName} - AGE ${ui.age}`}</div>
              <div className="flex flex-wrap justify-center gap-[0.4em] max-w-[30em]">
                {ui.mutations.map((id, i) => {
                  const m = MUTATIONS.find((mm) => mm.id === id);
                  return m ? <span key={i} title={m.name}><MutIconSm id={m.id} color={m.color} /></span> : null;
                })}
              </div>
              <div className="flex flex-wrap justify-center gap-[0.8em]">
                <Btn accent={ui.accent} onClick={act(() => g().resume())} primary>RESUME [ESC]</Btn>
                <Btn accent={ui.accent} onClick={act(() => g().toggleMute())}>{ui.muted ? 'UNMUTE' : 'MUTE'} [,]</Btn>
                <Btn accent="#ff4d4d" onClick={act(() => g().cycleBlood())}>BLOOD: {ui.blood.toUpperCase()} [B]</Btn>
                <Btn accent={ui.accent} onClick={act(() => g().toMenu())}>MENU UTAMA</Btn>
              </div>
              <Controls compact />
            </div>
          </Overlay>
        )}
      </div>
      {showTouch && ui.state === 'playing' && !showSetup && <TouchControls gameRef={gameRef} foot={ui.weapon === 'foot'} />}
      {showSetup && <GameSetup gameRef={gameRef} ui={ui} close={closeSetup} restart={restart} quit={quit} showTouch={showTouch} setShowTouch={updateTouch} fullscreen={fullscreen} toggleFullscreen={toggleFullscreen} />}
    </div>
  );
}

function GameSetup({ gameRef, ui, close, restart, quit, showTouch, setShowTouch, fullscreen, toggleFullscreen }: {
  gameRef: RefObject<Game | null>;
  ui: UIState;
  close: () => void;
  restart: () => void;
  quit: () => void;
  showTouch: boolean;
  setShowTouch: (value: boolean) => void;
  fullscreen: boolean;
  toggleFullscreen: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const game = gameRef.current;
  if (!game) return null;
  const weapons: { id: WeaponKind; label: string; key: string; available: boolean }[] = [
    { id: 'fist', label: 'FIST MODE', key: '1', available: true },
    { id: 'foot', label: 'FOOT MODE', key: 'O', available: true },
    { id: 'scythe', label: 'SCYTHE MODE', key: 'SHFT+G', available: true },
    { id: 'pistol', label: 'PISTOL MODE', key: '2', available: true },
    { id: 'rifle', label: 'RIFLE', key: '3', available: true },
    { id: 'nunchaku', label: 'NUNCHAKU', key: '4', available: game.player.hasNunchaku },
    { id: 'axe', label: 'AXE', key: '6', available: game.player.hasAxe },
    { id: 'guandao', label: 'GUAN DAO', key: 'Z', available: true },
    { id: 'bat', label: 'BASEBALL', key: 'T', available: true },
    { id: 'shotgun', label: 'SHOTGUN', key: 'Y', available: true },
    { id: 'bow', label: 'PANAH', key: 'U', available: true },
    { id: 'buster', label: 'BUSTER SWORD', key: 'I', available: true },
    { id: 'yoyo', label: 'YO-YO', key: '8', available: true },
    { id: 'takamura', label: 'TAKAMURA', key: '9', available: true },
    { id: 'boxing', label: 'BOXING', key: 'Shift+J', available: true },
  ];
  const weaponButton = (weapon: typeof weapons[number]) => (
    <button key={weapon.id} type="button" data-weapon={weapon.id}
      disabled={!weapon.available || !game.weaponAllowed(weapon.id)} aria-pressed={ui.weapon === weapon.id}
      onClick={() => game.setWeapon(weapon.id)}>
      <span>{weapon.label}</span><small>{weapon.key}</small>
    </button>
  );

  return <div className="game-setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="setup-title" onMouseDown={(event) => event.stopPropagation()}>
    <div className="game-setup pixel">
      <div className="game-setup__header">
        <div><span>GAME DIJEDA</span><h2 id="setup-title">SENJATA &amp; KONTROL</h2></div>
        <button ref={closeRef} type="button" onClick={close} aria-label="Tutup pengaturan"><X size={17} /></button>
      </div>
      <div className="setup-label">PILIH SENJATA</div>
      <div className="weapon-grid weapon-grid--styles" role="group" aria-label="Gaya bertarung dan pistol">
        {weapons.slice(0, 3).map(weaponButton)}
      </div>
      <div className="weapon-grid weapon-grid--gear" role="group" aria-label="Senjata lain">
        {weapons.slice(3).map(weaponButton)}
      </div>
      {ui.weapon === 'scythe' && <div className="foot-picker-note foot-picker-note--scythe">
        <strong>GRIM REAPER / SHIFT+G</strong>
        <span><b>J x4</b> Harvest Slash, Soil Turn, Death Spin, Grave Digger <b>K x2</b> Reaper's Halo, Soul Harvest <b>J kena lalu K</b> / <b>K kena lalu J</b> cabang silang <b>S+K</b> Grave Digger <b>W+K / lari</b> Soul Harvest dash <b>Udara J / K</b> Sky Reap / Death Dive</span>
        <span className="foot-version-hint">Tekan J terus untuk rantai panen; ganti tombol setelah kena untuk cabang silang.</span>
      </div>}
      {ui.weapon === 'foot' && <div className={`foot-picker-note foot-picker-note--v${ui.footVer ?? 1}`}>
        {ui.footVer === 3 ? <>
          <strong>SILANG V1 + V2</strong>
          <span><b>J x6</b> Yeop Chagi, Rasteira, Backlash kiri, Au Batido, Konoha Senpu, Ember <b>K x5</b> Moon Sweep, 540 Tornado, Break Windmill, Dai Senpu, Hunting Hawk <b>J kena lalu K</b> / <b>K kena lalu J</b> cabang silang <b>I</b> Flamingo <b>S+K</b> Sky Lift <b>Lari + J/K</b> Running Dropkick / Jump Kick (lawan terpental jauh &amp; menabrak temannya)</span>
        </> : ui.footVer === 2 ? <>
          <strong>HWOARANG + ROCK LEE</strong>
          <span><b>J x5</b> Yeop Chagi, Flamingo Thrust, Backlash kiri, kanan, Konoha Senpu <b>K x3</b> 540 Tornado, Konoha Dai Senpu, Hunting Hawk <b>S+K / I</b> Sky Lift <b>W+K</b> Flying Side Kick <b>Udara J</b> Sky Snap</span>
        </> : <>
          <strong>CAPOEIRA + BREAK / FLAMINGO</strong>
          <span><b>J x5</b> Rasteira, Side Snap, Au Batido, Lotus Wheel, Ember <b>K x4</b> Moon Sweep, Break Windmill, Tornado Heel, Blazing Comet <b>I, J, J, K</b> Flamingo Rush <b>S+K</b> Rising Lotus</span>
        </>}
        <span className="foot-version-hint">Scroll mouse saat bermain untuk ganti senjata.</span>
      </div>}
      <div className="setup-label">TEMPO SERANGAN  ( [ LAMBAT   ] CEPAT )</div>
      <div className="setup-options">
        {([[1, 'NORMAL'], [0.5, 'NATURAL'], [0.35, 'PELAN'], [0.25, 'SANTAI']] as const).map(([v, label]) => (
          <button key={label} type="button" aria-pressed={ui.tempo === v} onClick={() => game.setTempo(v)}>{label}</button>
        ))}
      </div>
      <div className="setup-versions">
        <div className="setup-version" role="group" aria-label="Gaya boxing">
          <span>BOXING</span>
          {(['ali', 'tyson', 'ippo'] as const).map((st) => <button key={st} type="button" aria-pressed={ui.weapon === 'boxing' && ui.boxStance === st} onClick={() => game.selectBoxStance(st)}>{st === 'ali' ? 'ALI' : st === 'tyson' ? 'TYSON' : 'IPPO'}</button>)}
        </div>
        <div className="setup-version" role="group" aria-label="Versi nunchaku">
          <span>NUNCHAKU</span>
          {(['v1', 'v2', 'v3'] as const).map((version) => <button key={version} type="button" disabled={!ui.hasNunchaku} aria-pressed={ui.weapon === 'nunchaku' && ui.nunStyle === version} onClick={() => game.selectNunStyle(version)}>{version === 'v3' ? 'V3 API' : version.toUpperCase()}</button>)}
        </div>
        <div className="setup-version" role="group" aria-label="Versi yo-yo">
          <span>YO-YO</span>
          {([1, 2] as const).map((version) => <button key={version} type="button" aria-pressed={ui.weapon === 'yoyo' && ui.yoyoVer === version} onClick={() => game.selectYoyoVersion(version)}>V{version}</button>)}
          <label>SKIN <select aria-label="Skin yo-yo V2" value={ui.yoyoSkin} onChange={(event) => { if (isYoyoSkinId(event.target.value)) { game.setYoyoSkin(event.target.value); game.selectYoyoVersion(2); } }}>{YOYO_SKINS.map((skin) => <option key={skin.id} value={skin.id}>{skin.name}</option>)}</select></label>
        </div>
      </div>
      <div className="setup-options">
        <button type="button" onClick={() => game.toggleMute()}>{ui.muted ? 'SUARA: MATI' : 'SUARA: NYALA'}</button>
        <button type="button" onClick={() => setShowTouch(!showTouch)} aria-pressed={showTouch}>SENTUH: {showTouch ? 'NYALA' : 'MATI'}</button>
        <button type="button" onClick={() => game.toggleV2()}>GRAFIK: {ui.v2 ? 'V2' : 'V1'}</button>
        <button type="button" onClick={() => game.toggleLong()}>LONG: {ui.long ? 'NYALA' : 'MATI'}</button>
        <button type="button" onClick={() => game.toggleTall()}>BADAN: {ui.tall ? 'PANJANG' : 'NORMAL'}</button>
        <button type="button" onClick={() => game.toggleSmooth()}>3D: {ui.smooth ? 'HALUS' : 'PIXEL'}</button>
        <button type="button" onClick={() => game.toggle2D()}>GAMBAR: {ui.view2d ? '2D HALUS' : 'PIXEL'}</button>
        <button type="button" onClick={toggleFullscreen} disabled={!document.fullscreenEnabled && !fullscreen}>{fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />} {fullscreen ? 'KECILKAN' : 'LAYAR PENUH'}</button>
      </div>
      <div className="setup-label">ARENA &amp; MAP KANTOR SIDE-VIEW</div>
      <div className="setup-options">
        <button type="button" aria-pressed={ui.arena === 'meadow'} onClick={() => game.setArena('meadow')}>PADANG</button>
        <button type="button" aria-pressed={ui.arena === 'city'} onClick={() => game.setArena('city')}>KOTA</button>
        <button type="button" aria-pressed={ui.arena === 'office'} onClick={() => game.setArena('office')}>KANTOR 2D</button>
        {ui.arena === 'office' && (
          <label className="inline-flex items-center gap-1.5 text-[7px] text-[#7b86a3]">
            MAP
            <select
              aria-label="Pilih map kantor"
              value={ui.officeMapId}
              onChange={(event) => game.setArena('office', event.target.value)}
            >
              {OFFICE_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="setup-help">WASD GERAK / W+S TANGGA &amp; LIFT / S+SPACE TURUN LANTAI / KLIK SERANG / SPACE LOMPAT / ESC JEDA</div>
      <div className="setup-actions">
        <button type="button" className="setup-resume" onClick={close}>KEMBALI</button>
        <button type="button" onClick={restart}>ULANGI</button>
        <button type="button" onClick={quit}>MENU AWAL</button>
      </div>
    </div>
  </div>;
}

function Overlay({ children, dim = 'bg-black/40', kind }: { children: ReactNode; dim?: string; kind?: 'dead' | 'gameover' | 'victory' | 'pause' }) {
  return (
    <div className={`absolute inset-0 overflow-y-auto ${dim} cursor-default ui-overlay ${kind ? `ui-overlay--${kind}` : ''}`}>
      {kind === 'dead' || kind === 'gameover' ? <div className="ui-flash" aria-hidden="true" /> : null}
      <div className="min-h-full py-[1em] flex items-center justify-center w-full"><div className="ui-pop">{children}</div></div>
    </div>
  );
}

function Btn({ children, onClick, primary, accent }: { children: ReactNode; onClick: () => void; primary?: boolean; accent: string }) {
  return (
    <button onClick={onClick} className={`ui-btn pixel ${primary ? 'ui-btn--primary' : ''}`} style={{ ['--acc' as string]: accent }}>
      <span>{children}</span>
    </button>
  );
}

/** angka naik perlahan (count-up) supaya layar skor terasa hidup */
function Count({ value, delay = 0 }: { value: number; delay?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; let start = 0;
    const dur = 900;
    const tick = (t: number) => {
      if (!start) start = t + delay;
      const k = Math.max(0, Math.min(1, (t - start) / dur));
      setV(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  return <>{v.toLocaleString('id-ID')}</>;
}

function Stats({ ui, base = 0 }: { ui: UIState; base?: number }) {
  const rows: [string, number][] = [
    ['SCORE', ui.score], ['KILLS', ui.kills], ['BEST COMBO', ui.bestCombo], ['DEATHS', ui.deaths], ['MUTATIONS', ui.mutations.length],
    ui.mode === 'survival' ? ['WAVES', ui.wave] : ['BEST LEVEL', ui.best.level],
  ];
  return (
    <div className="ui-stats pixel">
      {rows.map(([k, v], i) => (
        <div key={k} className="ui-stat" style={{ animationDelay: `${base + 0.35 + i * 0.07}s` }}>
          <span className="ui-stat__k">{k}</span>
          <span className="ui-stat__v"><Count value={v} delay={(base + 0.35) * 1000 + i * 70} /></span>
        </div>
      ))}
    </div>
  );
}

function Controls({ compact }: { compact?: boolean }) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 gap-x-[2em]' : 'grid-cols-1 sm:grid-cols-2 gap-x-[2em]'} gap-y-[0.25em] pixel text-[0.5em] text-left bg-black/60 border border-white/15 p-[1em] max-w-[52em]`}>
      <div className="text-white/40 col-span-full mb-[0.3em]">CONTROLS</div>
      <Row k="G (FIST / BAT / NUNCHAKU)" v="ADEGAN GRAB / SILAT HANYA SAAT KAMU TEKAN G (G LAGI SAAT 'G: LINK!' = SAMBUNG). TIDAK MUNCUL OTOMATIS SAAT SPAM KLIK. F = FATALITY" />
      <Row k="T" v="SELECT BASEBALL BAT / TAUNT WHEN EQUIPPED" />
      <Row k="Y" v="SHOTGUN: LMB TEMBAK / RMB RELOAD PUTAR / KOSONG = PENTUNG" />
      <Row k="I" v="BUSTER SWORD: LMB COMBO 5 / TAHAN LMB = BLADE BEAM / RMB = BRAVER / LARI+LMB = CROSS SLASH / I LAGI = OPERATOR-PUNISHER / LIMIT PENUH + RMB = OMNISLASH" />
      <Row k="3 (RIFLE)" v="LMB TEMBAK / RMB = FREESTYLE SESUAI SITUASI (SALTO, SLIDE, SLIP, ROLL, UDARA, BERLUTUT, FAN FIRE) / DIAM = PUTAR SENJATA" />
      <Row k="2 (PISTOL) TEMPO" v="TEMBAKAN BERIRAMA, BUKAN SEMPROTAN: BURST 3 TEMBAKAN BERJEDA 0,11-0,13 DETIK LALU JEDA MIKRO. EASING: WINDUP SINGKAT, MELAMBAT SAAT GANTI ARAH, CEPAT DI TITIK TEMBAK. RECOIL RINGAN DI LENGAN & BADAN. TIAP HIT = HIT-STAGGER RINGAN SUPAYA KOMBO BISA DISAMBUNG; VISUAL HANYA MUZZLE FLASH SINGKAT" />
      <Row k="PISTOL ATRAKSI" v="FLOURISH BERGANTI-GANTI SEBAGAI PEMBUKA / PENGISI JEDA KOMBO (BISA DI-CANCEL KE SERANGAN): SPIN DI JARI > TOSS & CATCH > PINDAH TANGAN LEWAT BELAKANG PUNGGUNG > PUTAR BADAN SAMBIL MENARIK PISTOL > SPIN JARI ARAH BALIK > PUTARAN BAWAH LENGAN (UNDERARM)" />
      <Row k="PISTOL TRANSISI" v="TAHAN / KLIK LMB BERUNTUN — RANTAI ATRAKSI KOMBO: BURST TEMBAK > PISTOL-WHIP > TEMBAK DARI BELAKANG PUNGGUNG > PUTAR BADAN SAMBIL MENEMBAK > TEMBAK SAMBIL MELUNCUR > LEMPAR-TANGKAP-TEMBAK > TEMBAKAN FINISHER (SASARAN MELAYANG / JARAK JAUH). TEMBAKAN FINISHER YANG KENA = SLOW-MOTION MIKRO 0,1 DETIK" />
      <Row k="TEMBAK SAMBIL GERAK" v="PISTOL BISA MENEMBAK SAMBIL JALAN (GERAK BEBAS PENUH SELAMA BURST) DAN SAMBIL MELOMPAT (TAHAN LMB DI UDARA = TEMBAKAN BERIRAMA DI UDARA)" />
      <Row k="SPAM = GUN-FU" v="SPAM KLIK KIRI (3+ KLIK DALAM 1 DETIK) MEMBUKA KOMBINASI GUN-FU JARAK DEKAT ALA JOHN WICK / MADNESS COMBAT, BERGANTIAN DENGAN CROSS-BODY SHOT: HANTAMAN POPOR > TEMBAKAN POINT-BLANK > SAPUAN KAKI > TEMBAKAN PENUTUP SAMBIL MENEMPEL KE MUSUH" />
      <Row k="CROSS-BODY SHOT" v="SAAT SPAM DAN ADA MUSUH DI SAMPING / BELAKANG: LENGAN MENYILANG KE BELAKANG LEHER (BEHIND-THE-NECK) MENEMBAK MUSUH ITU — SELURUH BADAN TETAP MENGHADAP KE DEPAN, TIDAK IKUT BERPUTAR" />
      <Row k="SALTO KE BELAKANG" v="HADAP KANAN + LOMPAT KE KIRI = BACKFLIP / SALTO KE BELAKANG KE KIRI. HADAP KIRI + LOMPAT KE KANAN = SALTO KE BELAKANG KE KANAN. DI TENGAH SALTO TETAP BISA MENEMBAK (KLIK / TAHAN LMB)" />
      <Row k="RMB (PISTOL)" v="SISTEM LAMA (TIDAK DIUBAH): FREESTYLE SESUAI SITUASI — DI UDARA = AERIAL BURST, DASH = COMBAT ROLL, MUSUH DEKAT = SLIP FIRE, LARI = FLIP SHOT (SALTO), JALAN = SLIDE FIRE, DARAH TIPIS / TAK ADA TARGET = LAST STAND, SELAIN ITU = FAN FIRE" />
      <Row k="PISTOL UDARA" v="SPACE (LOMPAT) LALU LMB DI UDARA = UPPERCUT-TO-AERIAL SHOT: PISTOL-WHIP UPPERCUT MENGANGKAT MUSUH > MELOMPAT BERPUTAR SAMBIL MENEMBAK 2-3X KE MUSUH MELAYANG > HANTAMAN PISTOL MIRING KE BAWAH MEMBANTING MUSUH KE LANTAI" />
      <Row k="U" v="PANAH: TAHAN LMB TARIK, LEPAS TEMBAK / KLIK CEPAT = RAPID / RMB = ATRAKSI SESUAI SITUASI (LARI=SALTO, JALAN=SLIDE, MUSUH DEKAT=SLIP, DASH=ROLL, UDARA=SPIRAL, DARAH TIPIS=BERLUTUT, DIAM=MULTI)" />
      <Row k="4 / N" v="NUNCHAKU / SWITCH V1 AND V2" />
      <Row k="WASD" v="MOVE (HOLD TO RUN)" /><Row k="MOUSE" v="AIM" />
      <Row k="LMB" v="LIGHT ATTACK / SHOOT" /><Row k="RMB" v="HEAVY (PALM STRIKE)" />
      <Row k="RUN + LMB (FISTS)" v="TAEKWONDO FLYING SIDE KICK" /><Row k="RUN + RMB (FISTS)" v="MK FLYING KICK / RUNNING STRAIGHT" />
      <Row k="RUN + LMB (WEAPON)" v="DRAGON LASH / IAIJUTSU / GRAND SLAM / PHANTOM CROSS" />
      <Row k="SPACE (AIR) + LMB" v="DIVE KICK" />
      <Row k="KANTOR SIDE-VIEW" v="ARENA GEDUNG BERTINGKAT SIDE-SCROLLER: MUSUH DATANG DARI KIRI & KANAN. W/S = NAIK/TURUN TANGGA & LIFT, S+SPACE = TURUN LANTAI, SERANG/DASH = PECAHKAN PARTISI KACA!" />
      <Row k="DESAIN MAP" v="BUAT LANTAI, DINDING, TANGGA, LIFT, PARTISI KACA, MEJA/POT, DAN PINTU MUSUH KIRI/KANAN SENDIRI LALU MAIN LANGSUNG!" />
      <Row k="SPACE" v="JUMP (HOP OVER BULLETS)" /><Row k="SHIFT" v="SHADOW STEP (DASH, I-FRAMES)" />
      <Row k="BOT / MIRROR" v="TOMBOL BOT = TEMAN AI YANG MEMAKAI SENJATAMU / TOMBOL MIRROR = MUSUH YANG MEMAKAI SENJATA YANG SAMA SECARA LIVE" />
      <Row k="DEKAT POT / MEJA" v="RMB = AMBIL (POT 1 TANGAN, MEJA 2 TANGAN) / LMB = LEMPAR SECEPAT PELURU / POT PECAH, MEJA KEBELAH PAS KENA BOT / RMB LAGI = TARUH" />
      <Row k="Z" v="DEKAT POT = LEMPAR POT BUNGA (PECAH PAS KENA BOT) / DEKAT BOT TAK BERDAYA = TARIK TANGAN ATAU KAKI, LEMPAR KE KERUMUNAN TERDEKAT; TAHAN Z = LEMPARAN KUAT" />
      <Row k="MELEE CHASE" v="SENJATA SELAIN PISTOL / RIFLE / SHOTGUN / BOW: TIAP HIT BIKIN BOT MUNDUR, PEMAIN OTOMATIS MELANGKAH MENDEKAT; TAHAN LMB UNTUK LANJUT KOMBO" />
      <Row k="FIST + RMB" v="SAAT MARKER RMB STRAIGHT MENYALA DI BOT, KLIK KANAN = STRAIGHT PUNCH: MELUNCUR, BOT TERPELANTING, BISA MENABRAK BOT LAIN / DINDING" />
      <Row k="MUAY THAI CLINCH" v="SAAT PENANDA CLINCH MUNCUL, TEKAN K ATAU KLIK KANAN SEKALI. SATU INPUT, SATU DENGKUL. MENAHAN TOMBOL TIDAK MENGULANGI SERANGAN." />
      <Row k="BACK KICK (FINISHER)" v="RANTAI PUKULAN YANG MENAMATKAN MUSUH SEKARAT KADANG DIGANTI ADEGAN TAEKWONDO: PUTAR BADAN MEMBELAKANGI MUSUH, LALU BACK KICK LURUS KE BELAKANG DENGAN SELURUH MOMENTUM PUTARAN (BERGANTIAN DENGAN FINISHER BIASA)" />
      <Row k="STEP MAJU (SKIP STEP)" v="LOMPATAN KECIL PENGAMBIL MOMENTUM KECEPATAN SEBAGAI PENGHUBUNG ANTAR-KOMBO FIST: MUNCUL TIAP MATA RANTAI KE-3, SAAT ALIRAN BERPINDAH JURUS, DAN OTOMATIS MENGEJAR MUSUH YANG AGAK JAUH SEBELUM PUKULAN BERIKUTNYA" />
      <Row k="SHIFT+K / H" v="SHIFT+K = PROPORSI STICKMAN LEBIH TINGGI / H = MODE 3D HALUS TANPA PIXELATED" />
      <Row k="SCROLL / FOOT V2" v="DI FOOT MODE, SCROLL MOUSE (ATAU O) MEMUTAR FOOT MODE V1, V2, DAN V3. V3 MENYILANG JURUS V1 DAN V2: J x6, K x5, DAN GANTI TOMBOL SETELAH KENA UNTUK CABANG SILANG. V2: J x5 = YEOP CHAGI, RIGHT FLAMINGO THRUST, BACKLASH HEEL KIRI, BACKLASH HEEL KANAN, KONOHA SENPU. K x3 = 540 TORNADO KICK, KONOHA DAI SENPU, HUNTING HAWK. V1: J x5 DAN K x4 BERISI AU BATIDO DAN BREAK WINDMILL. S+K ATAU I = FLAMINGO SKY LIFT, W+K ATAU LARI = FLYING SIDE KICK, SPASI LALU J = RIGHT SKY SNAP, UDARA K = 540 BANTING." />
      <Row k="O / FOOT MODE" v="O MEMILIH FOOT MODE. J / KLIK KIRI = KOMBO KAKI, K / KLIK KANAN = POWER. S+K = RISING LOTUS, W+K = BACK KICK, SPASI LALU J/K = KOMBO UDARA. SHIFT+L TETAP MEMBUKA RANTAI TENDANGAN LAMA DI FIST MODE." />
      <Row k="C" v="PARRY" />
      <Row k="BOSS PARRY" v="SAAT MUSUH BERSINAR MERAH, KLIK KIRI TEPAT DI JENDELA HIJAU = PARRY + COUNTER / BOSS JUGA BISA MEMPARRY SERANGANMU LALU MENYERANG LAGI / BISA SAMBIL JALAN ATAU LARI" />
      <Row k="PETARUNG FIST (MUSUH BARU)" v="MUSUH BERSERAGAM MERAH (EMAS = ELITE) BERIKAT KEPALA PUTIH, AHLI TANGAN KOSONG, MUNCUL DARI GELOMBANG 3. COMBO 2-4 PUKULAN/TENDANGAN (JAB, CROSS, HOOK, UPPERCUT, SIKU, TENDANGAN). CINCIN MERAH MENYEMPIT SAAT BERSIAP, BERUBAH HIJAU 'C!' DI 0,2 DETIK TERAKHIR = TEKAN C SEKARANG = PARRY SEMPURNA (MUSUH PUSING & POSTURNYA RUNTUH). CINCIN KUNING = TIPUAN, JANGAN PARRY DULU. MEREKA JUGA BLOK (DAMAGE -70%, TAPI POSTURNYA TETAP TERGERUS), MENGHINDAR MUNDUR LALU MEMBALAS, DAN KADANG MEMPARRY SERANGANMU. SETELAH COMBO ADA JEDA = CELAH MENYERANG BALIK" />
      <Row k="E" v="FOCUS STRIKE" /><Row k="F" v="FATALITY (ANY ENEMY IN REACH)" />
      <Row k="X" v="ONE FOR ALL (AT 25+ CHARGE): WORLD SLOWS TO 30%, YOU RUN AT REAL TIME, STRIKES AUTO-LOCK" />
      <Row k="CLICK TEMPO (FISTS)" v="FAST = WING CHUN  /  MEDIUM = BLACK LEG KICKS  /  SLOW = KUNG FU HEAVIES" /><Row k="R" v="RAGE (WHEN METER FULL): LMB = DASH + EXECUTE" />
 <Row k="FIST + IPPO" v="FIST MODE SEKARANG MENCAMPUR TINJU GAYA IPPO TANPA SARUNG TANGAN: JAB-JAB-STRAIGHT, BODY BLOW, SHOVEL HOOK, OVERHAND, LALU PAMUNGKAS GAZELLE / HEARTBREAK / SMASH / DEMPSEY ROLL. MUNCUL DI KLIK BERURUTAN, SELINGAN TENDANGAN, DAN DEMPSEY ROLL DI RANTAI KLIK CEPAT" />
      <Row k="GAMBAR" v="TOMBOL GAMBAR DI BILAH BAWAH / MENU SENJATA: PIXEL = ASLI, 2D HALUS = VERSI 2D MULUS TANPA BLOK PIXEL DENGAN BAYANGAN LEMBUT. BISA DIGANTI KAPAN SAJA" />
      <Row k="N (DELAPAN GERBANG)" v="TEKAN N = ADEGAN SINEMATIK 6 FASE: (1) KUDA-KUDA SANTAI, ANGIN & DEBU > (2) MEMUSATKAN TENAGA, MATA TERPEJAM, KEPALAN MENGERAT, CUT KE KEPALAN > (3) TUBUH MENEGANG, SLOW-MOTION, GARIS KECEPATAN & RETAKAN TANAH > (4) POSE SILANG X, MENDAK SEPERTI PEGAS, ZOOM KE MATA YANG TERBUKA > (5) LEDAKAN CHAKRA, TANAH PECAH, TERIAK, KILAT PUTIH > (6) AURA STABIL DI DALAM KAWAH: POSE KEKUATAN MENDAK LEBAR, BADAN CONDONG, KEDUA KEPALAN TERANGKAT DI SISI TUBUH, GIGI TERKATUP, URAT MENONJOL, GARIS LEDAKAN RADIAL, KAMERA MENGITARI. WARNA KULIT TIDAK BERUBAH. GERBANG NAIK CEPAT 1 > 6 LALU LANGSUNG AKTIF PENUH (TIDAK BERTAHAP). N LAGI SAAT SINEMATIK = LEWATI, N LAGI SAAT AKTIF = TUTUP. DARI GERBANG 3 + TANGAN KOSONG: KLIK KANAN DEKAT MUSUH = LOTUS TERSEMBUNYI. WARNA AURA: PILIH MERAH (BAWAAN) / HIJAU / BIRU DI BILAH BAWAH (AURA)" />
      <Row k="GERBANG 6 = DRUNKEN MASTER" v="SAAT GERBANG 6 AKTIF: GERAK +54% & SERANGAN +66% LEBIH CEPAT; SETIAP SERANGAN DASAR TERASA HEAVY DI MUSUH (HITSTOP TEBAL, GUNCANGAN, CINCIN KEJUT, DAMAGE BESAR) TAPI MUSUH TIDAK MUDAH TERPENTAL: TERTAHAN DI TEMPAT & TERHUYUNG SESAAT, LONTARAN BAWAAN JURUS DIPANGKAS SEPARUH. BADAN SEMPOYONGAN KHAS DRUNKEN MASTER: CONDONG KIRI-KANAN TAK BERATURAN, KEPALA TERKULAI, TANGAN LUNGLAI, LANGKAH TERHUYUNG (KECEPATAN NAIK-TURUN), MENGHANTAM DENGAN LURCH MAJU LALU TERAYUN MUNDUR" />
      <Row k="LARI + KLIK KANAN (FIST)" v="KADANG TENDANGAN TERBANG TAEKWONDO YANG MEMBUNTUTI MUSUH TERDEKAT" />
      <Row k="B (BRUTALITY)" v="SERANGAN TITIK LEMAH ALA MORTAL KOMBAT: PADA MUSUH YANG GOYAH / SEKARAT / JATUH. KAMERA MENGUNCI TITIK LEMAH (RAHANG, LEHER, IGA, LUTUT), PUKUL ATAU AYUN SENJATA (GUAN DAO, KATANA, BASEBALL), LALU LAYAR X-RAY. SHIFT+B = GANTI MODE DARAH" />
      <Row k="M" v="PANGGIL / HILANGKAN BOT SEKUTU: AHLI KOMBO TANGAN & KAKI, MENGHINDAR, DAN FATALITY (F) PADA MUSUH YANG GOYAH" />
      <Row k="MODE STORY" v="TIAP WAVE DIAKHIRI BOS YANG MEMAKAI SENJATA BARU. KALAHKAN DIA UNTUK MEMBUKA SENJATANYA. MULAI DARI TANGAN KOSONG." />
      <Row k="Z (GUAN DAO)" v="SENJATA GUAN YU — GREEN DRAGON CRESCENT BLADE. Z LAGI = ATRAKSI PUTAR TONGKAT (BERGANTI-GANTI, TERMASUK ALIRAN SAMPING) / LARI+LMB = TUSUK NAGA" />
      <Row k="LMB (ALIRAN KOMBO)" v="KOMBO MENYAMPING: SAPU NAGA > NAIK BALIK > SABIT MENYILANG > BALING-BALING > KOMBO PUTARAN, DITUTUP BERGANTIAN OLEH LONCAT SERGAP NAGA / TAI SHAN. ARAH AYUNAN BERGANTI-GANTI SISI (KIRI-KANAN) TIAP SERANGAN ALA KATA SAMURAI — TIDAK MONOTON ATAS-BAWAH. TAHAN / KLIK LAGI SAAT RECOVERY = RANTAI TERUS MENGALIR" />
      <Row k="LONCAT SERGAP" v="PENUTUP KOMBO BERGANTIAN: KARAKTER MELOMPAT MENUJU MUSUH TERDEKAT SAMBIL MENEBAS MENYAMPING DI UDARA. KOMBO JUGA KADANG DIBUKA DENGAN LOMPATAN INI BILA MUSUH AGAK JAUH" />
      <Row k="KOMBO PUTARAN" v="SERANGAN KE-4 RANTAI LMB: SENJATA DIPUTAR CEPAT 2+ PUTARAN MENGELILINGI TUBUH, MEMPERPANJANG KOMBO + DAMAGE AREA (AOE) KE SEGALA ARAH. MURNI ANIMASI AYUNAN SENJATA — TANPA PARTIKEL ANGIN / TANPA EFEK TORNADO" />
      <Row k="KOMBO UDARA" v="SPACE (LOMPAT) LALU LMB DI UDARA = DIAGONAL-TO-AERIAL SPIN SLASH: TEBASAN MIRING > MELOMPAT BERPUTAR DI UDARA (AERIAL SPIN) > TEBASAN MIRING KE ARAH BAWAH SAAT MENUKIK & MENDARAT" />
      <Row k="RMB / K TAP <0,2 D" v="KLIK KANAN CEPAT (ATAU TOMBOL K) DILEPAS SEBELUM 0,2 DETIK = BASIC HEAVY ATTACK: TEBASAN BERAT STANDAR" />
      <Row k="RMB / K TAHAN ≥0,2 D" v="TAHAN KLIK KANAN MINIMAL 0,2 DETIK SAMPAI CHARGE PENUH, LALU LEPAS = CHARGED HEAVY: TEBASAN VERTIKAL SUPER KUAT YANG MEMBELAH TUBUH STICKMAN MUSUH JADI DUA BAGIAN (ATAS & BAWAH TERPISAH DAN JATUH)" />
      <Row k="NUNCHAKU TEMPO" v="AYUNAN TAK LAGI SECEPAT KILAT: ADA FASE KUMPUL MOMENTUM (MELAMBAT SAAT GANTI ARAH), LEDAKAN DI PUNCAK AYUNAN, LALU FOLLOW-THROUGH — BERBOBOT & ALAMI DENGAN FISIKA RANTAI VERLET. JEDA ANTAR-KOMBO DIISI ATRAKSI ACAK: WRIST ROLL, OPERAN BELAKANG PUNGGUNG (BEHIND-THE-BACK PASS), LEMPAR-TANGKAP (TOSS & CATCH), DAN PUTARAN BIASA" />
      <Row k="PUTARAN NUNCHAKU" v="RANTAI LMB DIPERPANJANG JURUS PUTAR BERMOMENTUM: FIGURE-8 (POLA ANGKA 8) > SIDE SPIN (PUTARAN SAMPING) > OVERHEAD (PUTARAN ATAS KEPALA) > WHIP CRACK. HITBOX MENGIKUTI LINTASAN UJUNG NUNCHAKU (AOE). MURNI ANIMASI FISIK SENJATA, RANTAI & TANGAN — TANPA PARTIKEL ANGIN / AURA / TORNADO" />
      <Row k="NUNCHAKU UDARA" v="SPACE (LOMPAT) LALU LMB DI UDARA = DIAGONAL-TO-AERIAL SPIN SMASH: AYUNAN MIRING KE ATAS MENGANGKAT MUSUH > KARAKTER MELOMPAT BERPUTAR DI UDARA > BANTINGAN MIRING KE BAWAH MENGHANTAM MUSUH KERAS KE LANTAI" />
      <Row k="RMB NUNCHAKU" v="TAP <0,2 DETIK = BASIC HEAVY (HANTAMAN CEPAT, MOMENTUM MAJU, KNOCKBACK SEDANG). TAHAN ≥0,2 DETIK = CHARGED HEAVY: HANTAMAN SUPER KUAT YANG MEMATAHKAN TULANG BAGIAN YANG KENA (LEHER / LENGAN / KAKI) — MUSUH PINCANG, PUKULANNYA MELEMAH, ATAU TAK BISA MENOLEH SELAMANYA; MAYATNYA IKUT BENGKOK EKSTREM" />
      <Row k="G (DEKAT MAYAT)" v="TARIK TANGAN/KAKI BOT MATI YG DIBIDIK KURSOR (DI ANTARA 2 TANGAN/KAKI = KEDUANYA) > LMB LEMPAR / RMB PUSARAN SINGKAT LALU LEMPAR / G LEPAS" />
      <Row k="Q / SCROLL MOUSE / 1 / O / 2" v="FIST / FOOT / PISTOL / RIFLE / NUNCHAKU / KATANA / AXE / DUAL / YOYO / TAKAMURA / HAYABUSA / GUAN DAO" />
      <Row k="HAYABUSA (0) LMB" v="NINJA CHAIN: MOON SLASH > REVERSE FLOW > AERIAL RAVE > IZUNA DROP (TAP TO FLOW · THE BLADE ITSELF HITS)" />
      <Row k="HAYABUSA (0) RMB" v="TAP = BLADE MODE (SLOW-MO, 3 PRECISE CUTS, THEN ZANDATSU — PETALS, NO LIGHTNING) · HOLD = FLYING SWALLOW DASH-CUT" />
      <Row k="AXE (6) RMB" v="IDLE/WALK = THROW (FLIES, HITS, RETURNS TO YOUR HAND) · RMB AGAIN = RECALL EARLY" />
      <Row k="AXE (6) SHIFT+RMB" v="LEAP SMASH: JUMP THEN CHOP STRAIGHT DOWN (SHOCKWAVE + FROST). IF THE AXE IS OUT IT RACES BACK SO YOU SLAM WITH IT" />
      <Row k="TAKAMURA (9) LMB" v="SWORD CHAIN: BATTOUJUTSU > KESA X-CUT > CHAMPLOO SPIN > RYU TSUI SEN (TAP AGAIN AFTER A CUT TO FLOW INTO THE NEXT · THE BLADE ITSELF DOES THE HITTING)" />
      <Row k="TAKAMURA (9) RMB" v="TAP = RYU SHO SEN (RISING CUT, LAUNCHES) · HOLD + RELEASE = AMAKAKERU RYU NO HIRAMEKI (TWO HUGE CUTS, STRONGER THE LONGER YOU HOLD)" />
      <Row k="TAKAMURA (9) NOTO" v="EVERY ENEMY YOU CUT IS MARKED · WHEN THE BLADE CLICKS BACK INTO THE SAYA THE DELAYED CUTS LAND" />
      <Row k="B" v="BLOOD: NORMAL / GORE / COMBINED" /><Row k="ESC" v="PAUSE" />
      <Row k="V" v="SWITCH LOOK: V2 = CRISP PIXELS + GAME1 RAGDOLL (WALL BOUNCE, DIZZY STARS, KICKABLE BODIES) / V1 = CLASSIC BUILD" />
      {!compact && (
        <>
          <div className="text-white/40 col-span-full mt-[0.8em] mb-[0.3em]">KUNG FU TECHNIQUES</div>
          {MOVE_LIST.map((m) => (
            <div key={m.name} className="col-span-full flex gap-[1em] leading-relaxed">
              <span className="text-yellow-300 min-w-[9em]">{m.keys}</span>
              <span className="text-white">{m.name}</span>
              <span className="text-white/50">{m.desc}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-[1em]">
      <span className="text-yellow-300 min-w-[9em]">{k}</span>
      <span className="text-white/80">{v}</span>
    </div>
  );
}


