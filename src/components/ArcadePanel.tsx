import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Crosshair,
  Gamepad2,
  Keyboard,
  Mouse,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { controls, readLocal, type Panel, type PlayMode, type PracticeStyle } from '../data';

type Props = {
  panel: Exclude<Panel, null>;
  onClose: () => void;
  onPlay: (mode: PlayMode, style?: PracticeStyle) => void;
  player: string;
  onSavePlayer: (value: string) => void;
};

const moves = [
  {
    name: 'Muay Thai Clinch',
    type: 'MUAY THAI',
    key: 'K',
    alt: 'atau klik kanan',
    desc: 'Satu clinch, satu serangan lutut. Kedua karakter terhubung pada titik kontak yang sama, lalu kembali ke posisi siap.',
    how: 'Gunakan tangan kosong dan dekati lawan yang goyah. Tekan K sekali saat penanda CLINCH muncul. Di dojo, partner selalu siap.',
  },
  {
    name: 'Chain Punch',
    type: 'KUNGFU',
    key: 'J',
    alt: 'atau klik kiri',
    desc: 'Rangkaian serangan ringan yang mengalir dari satu animasi ke animasi berikutnya.',
    how: 'Hadapi lawan dengan tangan kosong. Tekan J secara berurutan untuk menyambung serangan ringan.',
  },
  {
    name: 'Taekwondo Back Kick',
    type: 'TAEKWONDO',
    key: 'AUTO',
    alt: 'finisher kontekstual',
    desc: 'Gerakan penutup berupa tendangan putar, bagian dari sistem finisher asli Kungfu Drifter.',
    how: 'Selesaikan rangkaian pukulan pada lawan dengan HP rendah. Finisher ini dapat muncul otomatis saat cooldown selesai.',
  },
  {
    name: 'Foot Mode',
    type: 'FOOT MODE',
    key: 'O',
    alt: 'atau pilih Foot Mode dari menu senjata',
    desc: 'Kombo kaki dengan sapuan Capoeira, putaran Taekwondo, akrobat Lotus, dan finisher Black Leg. Tekanan berikutnya bisa masuk sebelum animasi selesai.',
    how: 'Tekan I, J, J, K untuk Flamingo Rush. J melanjutkan Flow, K melanjutkan Power, dan S + K membuka rangkaian udara.',
  },
];

export default function ArcadePanel({ panel, onClose, onPlay, player, onSavePlayer }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<'keyboard' | 'touch'>('keyboard');
  const [move, setMove] = useState(0);
  const [name, setName] = useState(player);
  const [nameError, setNameError] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const el = dialog.current;
    const before = document.activeElement as HTMLElement | null;
    el?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      before?.focus({ preventScroll: true });
    };
  }, []);
  const data = {
    controls: { title: 'Panduan Kontrol', tag: 'PLAYER MANUAL', icon: <Keyboard /> },
    moves: { title: 'Daftar Jurus', tag: 'COMBAT ARCHIVE', icon: <BookOpen /> },
    updates: { title: 'Catatan Pembaruan', tag: 'PATCH NOTES', icon: <Sparkles /> },
    profile: { title: 'Profil Pemain', tag: 'LOCAL PLAYER', icon: <UserRound /> },
  }[panel];
  return (
    <dialog
      ref={dialog}
      className="arcade-dialog"
      aria-labelledby="panel-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-paper">
        <div className="dialog-topline">
          <span className="micro-label">PIGEON / {data.tag}</span>
          <button className="square-button" onClick={onClose} aria-label="Tutup panel">
            <X size={18} />
          </button>
        </div>
        <header className="dialog-heading">
          <span className="dialog-icon">{data.icon}</span>
          <h2 id="panel-title">{data.title}</h2>
        </header>
        {panel === 'controls' && (
          <>
            <div className="panel-tabs" role="tablist" aria-label="Perangkat kontrol">
              <button role="tab" aria-selected={tab === 'keyboard'} onClick={() => setTab('keyboard')}>
                <Keyboard size={15} />
                Keyboard & mouse
              </button>
              <button role="tab" aria-selected={tab === 'touch'} onClick={() => setTab('touch')}>
                <Gamepad2 size={15} />
                Layar sentuh
              </button>
            </div>
            {tab === 'keyboard' ? (
              <div className="control-list">
                {controls.map((c) => (
                  <div className="control-line" key={c.key}>
                    <kbd>{c.key}</kbd>
                    <div>
                      <strong>{c.name}</strong>
                      <p>{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="touch-help">
                <Gamepad2 size={36} />
                <h3>Arcade di genggamanmu.</h3>
                <p>
                  Gunakan tombol arah di bawah arena untuk bergerak. Ketuk <b>Pukul</b> untuk serangan ringan
                  atau <b>Clinch</b> saat berada di dekat lawan yang goyah.
                </p>
                <p>
                  Tombol <b>Lompat</b> dan <b>Dash</b> berada di sisi kanan. Putar perangkat ke posisi lanskap
                  untuk arena yang lebih luas.
                </p>
              </div>
            )}
            <div className="panel-foot">
              <span className="hint">
                <Mouse size={14} />
                Arahkan mouse untuk membidik.
              </span>
              <button className="text-action" onClick={() => onPlay('training')}>
                Coba di dojo <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
        {panel === 'moves' && (
          <>
            <div className="move-selector" role="tablist" aria-label="Pilih jurus">
              {moves.map((m, i) => (
                <button key={m.type} role="tab" aria-selected={move === i} onClick={() => setMove(i)}>
                  {m.type}
                </button>
              ))}
            </div>
            <div className="move-detail" role="tabpanel" key={move}>
              <span className="micro-label">TEKNIK / 0{move + 1}</span>
              <h3>{moves[move].name}</h3>
              <p>{moves[move].desc}</p>
              <div className="move-input">
                <kbd>{moves[move].key}</kbd>
                <span>{moves[move].alt}</span>
              </div>
              <div className="instruction">
                <Crosshair size={18} />
                <p>{moves[move].how}</p>
              </div>
            </div>
            <button className="primary-button panel-cta" onClick={() => onPlay('training', moves[move].type === 'FOOT MODE' ? 'foot' : 'fist')}>
              MASUK DOJO LATIHAN <ArrowRight size={17} />
            </button>
          </>
        )}
        {panel === 'updates' && (
          <div className="patch-content">
            <span className="version-tag">BUILD 2.1</span>
            <h3>Single-knee update</h3>
            <p>Pembaruan animasi Muay Thai untuk pertarungan yang lebih rapat dan lebih terbaca.</p>
            <div className="patch-row">
              <span>01</span>
              <div>
                <h4>Satu input, satu dengkul</h4>
                <p>Tiga hantaman diganti satu serangan. Menahan tombol tidak mengulangi clinch.</p>
              </div>
            </div>
            <div className="patch-row">
              <span>02</span>
              <div>
                <h4>Kontak yang lebih dekat</h4>
                <p>
                  Jarak clinch diperkecil. Animasi tangan, kepala lawan, dan lutut memakai satu titik kontak
                  bersama.
                </p>
              </div>
            </div>
            <div className="patch-row">
              <span>03</span>
              <div>
                <h4>Pemulihan yang natural</h4>
                <p>Jeda singkat saat kontak dan recoil yang lebih ringan menggantikan lontaran berlebihan.</p>
              </div>
            </div>
            <button className="primary-button panel-cta" onClick={() => onPlay('training')}>
              COBA PEMBARUAN <ArrowRight size={17} />
            </button>
          </div>
        )}
        {panel === 'profile' && (
          <form
            className="profile-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) {
                setNameError(true);
                return;
              }
              onSavePlayer(name.trim());
              setSaved(true);
              setNameError(false);
            }}
          >
            <p>Profil dan rekor permainan disimpan di perangkat ini.</p>
            <label htmlFor="player-name">NAMA PEMAIN</label>
            <input
              id="player-name"
              maxLength={18}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
                setNameError(false);
              }}
              autoComplete="off"
              aria-invalid={nameError}
            />
            {nameError && <p className="form-error">Masukkan nama pemain terlebih dahulu.</p>}
            <div className="profile-record">
              <span>Skor terbaik</span>
              <strong>{readLocal<number>('best', 0).toLocaleString('id-ID')}</strong>
            </div>
            <div className="profile-record">
              <span>Sesi dimainkan</span>
              <strong>{readLocal<number>('sessions', 0)}</strong>
            </div>
            <button className="primary-button panel-cta" type="submit">
              {saved ? (
                <>
                  <Check size={17} /> TERSIMPAN
                </>
              ) : (
                <>
                  SIMPAN PROFIL <ChevronRight size={17} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
