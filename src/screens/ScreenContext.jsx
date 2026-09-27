import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { screens } from './index';

/**
 * Which screen the main window shows. `current` is null for the terminal, or
 * { id, data } for a screen from src/screens/index.js.
 *
 * Any component can switch screens with useScreen():
 *   showScreen('npc', { ... })      // switch to a screen, with optional data
 *   showTerminal()                   // back to the terminal
 *   toggleScreen('npc')              // switch to it, or back if it's already open
 */
const ScreenContext = createContext(null);

export function ScreenProvider({ children }) {
  const [current, setCurrent] = useState(null);

  const showScreen = useCallback((id, data = {}) => {
    if (!screens[id]) {
      console.warn(`Unknown screen: ${id}`);
      return;
    }
    setCurrent({ id, data });
  }, []);

  const showTerminal = useCallback(() => setCurrent(null), []);

  const toggleScreen = useCallback(
    (id, data = {}) => {
      if (current?.id === id) showTerminal();
      else showScreen(id, data);
    },
    [current, showScreen, showTerminal]
  );

  const value = useMemo(
    () => ({ current, showScreen, showTerminal, toggleScreen }),
    [current, showScreen, showTerminal, toggleScreen]
  );

  return <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>;
}

export function useScreen() {
  const ctx = useContext(ScreenContext);
  if (!ctx) throw new Error('useScreen must be used inside <ScreenProvider>');
  return ctx;
}
