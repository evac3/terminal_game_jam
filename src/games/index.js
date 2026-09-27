import Game2048 from './Game2048';

/**
 * Mini game registry. The key is the game id used by `program('<id>')`
 * in the backend's src/fileSystem.js.
 */
export const games = {
  2048: Game2048,
};
