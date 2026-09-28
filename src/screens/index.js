import NpcScreen from './NpcScreen';
import EndingScreen from './EndingScreen';

/**
 * Screen registry: screen id -> React component.
 * Each screen gets props { data, close }. `data` is whatever was passed to
 * showScreen(id, data), and close() returns to the terminal.
 * A screen component with `locksHotkeys = true` can't be left with a hotkey.
 */
export const screens = {
  npc: NpcScreen,
  ending: EndingScreen,
};
