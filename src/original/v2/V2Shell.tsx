import { useEffect } from 'react';
import V2App from './App';
import './v2.css';

/** GAME V2: satu-satunya game di build ini (Game V1 sudah dihapus).
 *  Kode di src/v2, penyimpanan berprefiks v2_, CSS dikurung di .v2-root. */
export default function V2Shell() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'StickBrawl | Menara Kantor';
    return () => {
      document.title = prev;
      // V2 menempelkan kelas render ke <body>; bersihkan saat keluar
      document.body.classList.remove('smooth-mode', 'view-2d');
      delete (window as unknown as { __kf?: unknown }).__kf;
    };
  }, []);
  return (
    <div className="v2-root">
      <V2App />
    </div>
  );
}
