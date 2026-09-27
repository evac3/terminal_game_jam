import NpcScreen from './NpcScreen';

/**
 * Screen registry: screen id -> React component.
 * Each screen gets props { data, close }. `data` is whatever was passed to
 * showScreen(id, data), and close() returns to the terminal.
 */
export const screens = {
  npc: NpcScreen,
};
