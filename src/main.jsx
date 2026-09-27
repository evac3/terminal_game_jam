import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { games } from './games';

// A popup opened by `run` loads /?game=<id>; otherwise show the main window.
const gameId = new URLSearchParams(window.location.search).get('game');
const Game = gameId ? games[gameId] : null;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {Game ? <Game /> : gameId ? <p style={{ color: '#fff' }}>Unknown game: {gameId}</p> : <App />}
  </StrictMode>
);
