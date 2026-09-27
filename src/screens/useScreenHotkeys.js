import { useEffect } from 'react';
import { useScreen } from './ScreenContext';

/** key -> screen id. Pressing the key opens that screen, and pressing it again goes back. */
export const SCREEN_HOTKEYS = {
  1: 'npc',
};

/**
 * `isKeyClaimed(key)`: return true to leave a key alone this time (e.g. the
 * dialogue is waiting for that key).
 */
export function useScreenHotkeys(bindings = SCREEN_HOTKEYS, isKeyClaimed = () => false) {
  const { toggleScreen } = useScreen();

  useEffect(() => {
    const onKeyDown = (e) => {
      const id = bindings[e.key];
      if (!id || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isKeyClaimed(e.key)) return;

      // Let the key type normally while the player is in the middle of a command.
      if (e.target instanceof HTMLInputElement && e.target.value !== '') return;

      e.preventDefault(); // don't also type the key into the terminal
      toggleScreen(id);
    };

    // Capture phase, so this runs before the terminal input sees the key.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [bindings, isKeyClaimed, toggleScreen]);
}
