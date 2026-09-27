import { useEffect, useState } from 'react';
import './Game2048.css';

const SIZE = 4;
const KEY_TO_DIR = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
};

const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
const transpose = (g) => g[0].map((_, c) => g.map((row) => row[c]));
const reverseRows = (g) => g.map((row) => [...row].reverse());

/** Slide one row to the left, merging equal neighbours once. */
function slideRow(row) {
  const tiles = row.filter(Boolean);
  const out = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] * 2);
      gained += tiles[i] * 2;
      i++;
    } else {
      out.push(tiles[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

/** Every direction is turned into "slide left", then turned back. */
function move(grid, dir) {
  const vertical = dir === 'up' || dir === 'down';
  const reversed = dir === 'right' || dir === 'down';

  let g = vertical ? transpose(grid) : grid;
  if (reversed) g = reverseRows(g);

  let gained = 0;
  g = g.map((row) => {
    const result = slideRow(row);
    gained += result.gained;
    return result.row;
  });

  if (reversed) g = reverseRows(g);
  if (vertical) g = transpose(g);

  const moved = g.some((row, r) => row.some((v, c) => v !== grid[r][c]));
  return { grid: g, gained, moved };
}

function addRandomTile(grid) {
  const empty = [];
  grid.forEach((row, r) => row.forEach((v, c) => !v && empty.push([r, c])));
  if (empty.length === 0) return grid;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

const canMove = (grid) => ['left', 'right', 'up', 'down'].some((d) => move(grid, d).moved);

function newGame() {
  return { grid: addRandomTile(addRandomTile(emptyGrid())), score: 0, won: false, over: false };
}

export default function Game2048() {
  const [state, setState] = useState(newGame);

  useEffect(() => {
    document.title = '2048';
    const onKeyDown = (e) => {
      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;
      e.preventDefault();

      setState((prev) => {
        if (prev.over) return prev;
        const result = move(prev.grid, dir);
        if (!result.moved) return prev;

        const grid = addRandomTile(result.grid);
        return {
          grid,
          score: prev.score + result.gained,
          won: prev.won || grid.some((row) => row.includes(2048)),
          over: !canMove(grid),
        };
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const { grid, score, won, over } = state;

  return (
    <div className="g2048">
      <header className="g2048-header">
        <h1>2048</h1>
        <div className="g2048-score">Score: {score}</div>
      </header>

      <div className="g2048-board">
        {grid.flat().map((value, i) => (
          <div key={i} className={`g2048-tile g2048-tile--${value > 2048 ? 'big' : value}`}>
            {value || ''}
          </div>
        ))}
      </div>

      <p className="g2048-status">
        {over ? 'Game over!' : won ? 'You reached 2048!' : 'Use arrow keys or WASD'}
      </p>
      <div className="g2048-actions">
        <button onClick={() => setState(newGame())}>New game</button>
        <button onClick={() => window.close()}>Close</button>
      </div>
    </div>
  );
}
