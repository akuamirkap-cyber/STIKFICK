import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  ChevronDown,
  Gamepad2,
  Grid2X2,
  Keyboard,
  Menu,
  Play,
  Radio,
  Swords,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Brand, { PigeonMark } from './components/Brand';
import ArcadePanel from './components/ArcadePanel';
import { modes, readLocal, writeLocal, type Panel, type PlayMode, type PracticeStyle } from './data';

const GameScreen = lazy(() => import('./components/GameScreen'));
const OriginalScreen = lazy(() => import('./components/OriginalScreen'));
const go = (route: string) => {
  window.location.hash = route;
};
const panelRoutes: Record<string, Panel> = {
  kontrol: 'controls',
  jurus: 'moves',
  pembaruan: 'updates',
  pemain: 'profile',
};
const nav = [
  { route: 'lobi', label: 'Lobi Game', Icon: Gamepad2 },
  { route: 'jurus', label: 'Daftar Jurus', Icon: Swords },
  { route: 'pembaruan', label: 'Pembaruan', Icon: Radio },
];

function LoadingArena() {
  return (
    <div className="loading-arena">
      <PigeonMark size={62} />
      <span className="micro-label">MEMUAT ARENA</span>
      <div className="load-track">
        <i />
      </div>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const arcade = params.get('arcade') === '1' && params.get('original') !== '1';
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || 'lobi');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sound, setSound] = useState(() => readLocal<boolean>('sound', true));
  const [player, setPlayer] = useState(() => readLocal<string>('player', 'Pemain 01'));
  useEffect(() => {
    const sync = () => {
      setRoute(window.location.hash.slice(1) || 'lobi');
      setMobileMenu(false);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const mode = route.startsWith('arena/') ? modes.find((m) => m.id === route.split('/')[1])?.id : null;
  const flamingoPractice = route === 'arena/training/foot/flamingo';
  const practiceStyle: PracticeStyle = flamingoPractice || route === 'arena/training/foot' ? 'foot' : 'fist';
  useEffect(() => {
    document.title = mode
      ? `${mode === 'training' && practiceStyle === 'foot' ? 'Foot Mode' : modes.find((m) => m.id === mode)?.name} | StickBrawl`
      : 'StickBrawl | Pigeon Arcade';
    if (mode) window.scrollTo(0, 0);
  }, [mode, practiceStyle]);
  const changeSound = (value: boolean) => {
    setSound(value);
    writeLocal('sound', value);
  };
  const play = (to: PlayMode, style: PracticeStyle = 'fist') => {
    writeLocal('sessions', readLocal<number>('sessions', 0) + 1);
    go(`arena/${to}${to === 'training' && style === 'foot' ? '/foot/flamingo' : ''}`);
  };

  if (mode)
    return (
      <Suspense fallback={<LoadingArena />}>
        <GameScreen
          key={route}
          mode={mode}
          initialStyle={practiceStyle}
          initialRoute={flamingoPractice ? 'flamingo' : 'flow'}
          sound={sound}
          changeSound={changeSound}
          player={player}
          onExit={() => go(arcade ? 'lobi' : 'menu')}
          onPlay={play}
        />
      </Suspense>
    );
  if (!arcade)
    return (
      <Suspense fallback={<LoadingArena />}>
        <OriginalScreen />
      </Suspense>
    );
  const panel = panelRoutes[route] || null;

  return (
    <div className="arcade-site">
      <a className="skip-link" href="#mode-title">
        Langsung ke pilihan mode
      </a>
      <header className="site-header">
        <div className="page-width nav-shell">
          <a href="#lobi" className="brand-link" aria-label="Pigeon Arcade, lobi game">
            <Brand />
          </a>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {nav.map(({ route: dest, label, Icon }) => (
              <a
                key={dest}
                href={`#${dest}`}
                className={
                  route === dest || (dest === 'lobi' && !['jurus', 'pembaruan'].includes(route))
                    ? 'active'
                    : ''
                }
              >
                <Icon size={15} strokeWidth={1.7} />
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-tools">
            <button
              className={`sound-toggle ${sound ? 'sound-on' : ''}`}
              onClick={() => changeSound(!sound)}
              aria-pressed={sound}
              aria-label={sound ? 'Matikan suara game' : 'Aktifkan suara game'}
              title={sound ? 'Matikan suara game' : 'Aktifkan suara game'}
            >
              {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
              <span>
                Suara <b>{sound ? 'ON' : 'OFF'}</b>
              </span>
            </button>
            <span className="nav-divider" />
            <button className="player-button" onClick={() => go('pemain')} aria-label="Buka profil pemain">
              <span className="avatar">P1</span>
              <span className="player-name">{player}</span>
              <ChevronDown size={13} />
            </button>
            <button
              className="mobile-menu-button square-button"
              aria-label={mobileMenu ? 'Tutup navigasi' : 'Buka navigasi'}
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <nav className="mobile-nav" aria-label="Navigasi seluler">
            {nav.map(({ route: dest, label, Icon }) => (
              <a key={dest} href={`#${dest}`} onClick={() => setMobileMenu(false)}>
                <Icon size={17} />
                {label}
                <ArrowUpRight size={15} />
              </a>
            ))}
            <a href="#kontrol">
              <Keyboard size={17} />
              Panduan Kontrol
              <ArrowUpRight size={15} />
            </a>
          </nav>
        )}
      </header>
      <main>
        <section className="hero" aria-labelledby="game-title">
          <img
            className="hero-art"
            src="/images/drifter-keyart.webp"
            alt="Ilustrasi petarung StickBrawl dengan balutan tangan dan ikat kepala hijau di gang kota."
            fetchPriority="high"
          />
          <div className="hero-shading" />
          <div className="page-width hero-inner">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <i className="speed-bars" aria-hidden="true" />
                <span>PIGEON ORIGINAL</span>
                <span className="eyebrow-slash">/</span>
                <span className="edition">ARCADE SERIES</span>
              </div>
              <h1 id="game-title">
                <span className="hero-word">STICK</span>
                <span className="hero-word lime-word">BRAWL</span>
              </h1>
              <p className="hero-description">
                Pertarungan jalanan, kombo tanpa batas. Kuasai arena
                <br className="desktop-break" /> dengan teknik Muay Thai yang lebih presisi.
              </p>
              <div className="hero-actions">
                <button className="primary-button play-main" onClick={() => play('story')}>
                  <Play size={17} fill="currentColor" strokeWidth={1.6} />
                  MAIN SEKARANG
                </button>
                <button className="secondary-button" onClick={() => go('kontrol')}>
                  <Keyboard size={18} />
                  Panduan Kontrol
                </button>
              </div>
            </div>
          </div>
          <div className="hero-edge" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </section>
        <section className="mode-section page-width" aria-labelledby="mode-title">
          <div className="mode-heading">
            <div>
              <div className="section-eyebrow">
                <span />
                GAME SELECT
              </div>
              <h2 id="mode-title">
                PILIH MODE<span className="lime-period">.</span>
              </h2>
            </div>
            <div className="mode-count">
              <Grid2X2 size={13} />
              <span>03 MODE TERSEDIA</span>
            </div>
          </div>
          <div className="mode-grid">
            {modes.map((m, i) => (
              <button
                className={`mode-card mode-${m.id}`}
                key={m.id}
                onClick={() => play(m.id)}
                style={{ '--order': i } as React.CSSProperties}
                aria-label={`Main ${m.name}: ${m.description}`}
              >
                <img src={`/images/${m.image}.webp`} alt="" loading="eager" />
                <span className="card-shade" />
                <span className="mode-index">
                  <b>{m.number}</b>
                  <span>/</span>
                  {m.label}
                </span>
                <span className="mode-bottom">
                  <span className="mode-card-copy">
                    <strong>{m.name}</strong>
                    <span>{m.description}</span>
                  </span>
                  <span className="card-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="update-line page-width" aria-label="Pembaruan terbaru">
          <div className="update-line-left">
            <span className="update-symbol">
              <AudioLines size={15} />
            </span>
            <span className="micro-label">UPDATE 2.1</span>
            <span className="update-separator" />
            <p>Muay Thai Clinch: satu dengkul, kontak lebih dekat.</p>
          </div>
          <button className="text-action" onClick={() => go('pembaruan')}>
            Catatan patch <ArrowRight size={14} />
          </button>
        </section>
      </main>
      <footer className="site-footer page-width">
        <span className="footer-brand">
          <PigeonMark size={19} />
          PIGEON ARCADE
        </span>
        <span className="footer-caption">STICKBRAWL / MENARA KANTOR</span>
        <a className="classic-link" href="?original=1">
          Launcher klasik <ArrowUpRight size={11} />
        </a>
        <span className="system-ready">
          <i />
          SISTEM SIAP
        </span>
      </footer>
      {panel && (
        <ArcadePanel
          key={panel}
          panel={panel}
          onClose={() => go('lobi')}
          onPlay={play}
          player={player}
          onSavePlayer={(name) => {
            setPlayer(name);
            writeLocal('player', name);
          }}
        />
      )}
    </div>
  );
}
