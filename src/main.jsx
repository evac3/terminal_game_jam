import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { games } from './games';
import DocumentWindow from './components/DocumentWindow';

// Popups load /?game=<id> (from `run`) or /?doc=<id> (from `view`); otherwise show the main window.
const params = new URLSearchParams(window.location.search);
const gameId = params.get('game');
const docId = params.get('doc');
const Game = gameId ? games[gameId] : null;

function Root() {
  if (docId) return <DocumentWindow id={docId} />;
  if (Game) return <Game />;
  if (gameId) return <p style={{ color: '#fff' }}>Unknown game: {gameId}</p>;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
