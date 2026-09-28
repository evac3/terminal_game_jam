import { useEffect, useState } from 'react';
import { getCitations } from '../citations';
import './EndingScreen.css';

const BANNER = String.raw`
 _____   _   _   ____        ___    _____
| ____| | \ | | |  _ \      / _ \  |  ___|
|  _|   |  \| | | | | |    | | | | | |_
| |___  | |\  | | |_| |    | |_| | |  _|
|_____| |_| \_| |____/      \___/  |_|

      ____    _____   __  __    ___
     |  _ \  | ____| |  \/  |  / _ \
     | | | | |  _|   | |\/| | | | | |
     | |_| | | |___  | |  | | | |_| |
     |____/  |_____| |_|  |_|  \___/
`;

/**
 * Ending screen (screen id `ending`), shown by `screen: ending` in a script.
 * Page 1: "END OF DEMO" banner. Enter switches to page 2: the citations
 * (from getCitations()), and Enter again goes back.
 */
export default function EndingScreen() {
  const [page, setPage] = useState('banner');
  const citations = getCitations();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Enter' || e.repeat) return;
      setPage((p) => (p === 'banner' ? 'citations' : 'banner'));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (page === 'citations') {
    return (
      <div className="ending-screen">
        <h1 className="ending-title">CITATIONS</h1>
        <ul className="ending-citations">
          {citations.map((c) => (
            <li key={c.source}>
              <span className="ending-source">{c.source}</span>
              <span>{c.text}</span>
            </li>
          ))}
        </ul>
        <p className="ending-hint">[ press Enter to go back ]</p>
      </div>
    );
  }

  return (
    <div className="ending-screen">
      <pre className="ending-banner">{BANNER}</pre>
      <p className="ending-subtitle">This is the end of the demo. Thank you for playing!</p>
      <p className="ending-hint">[ press Enter to see citations ]</p>
    </div>
  );
}

// The 1 hotkey can't leave this screen (see App.jsx).
EndingScreen.locksHotkeys = true;
