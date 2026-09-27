import { useEffect, useRef } from 'react';
import Terminal from './components/Terminal';
import { DialogueProvider, useDialogue } from './dialogue/DialogueContext';
import { screens } from './screens';
import { ScreenProvider, useScreen } from './screens/ScreenContext';
import { useScreenHotkeys } from './screens/useScreenHotkeys';

// Dialogue script (src/dialogue/scripts/<name>.txt) to play when the game opens. null = none.
const OPENING_DIALOGUE = 'example';

/** The main window: the terminal, or whichever screen is switched on top of it. */
export default function App() {
  return (
    <ScreenProvider>
      <DialogueProvider>
        <MainWindow />
      </DialogueProvider>
    </ScreenProvider>
  );
}

function MainWindow() {
  const { current, showTerminal } = useScreen();
  const { startDialogue, claimsKey } = useDialogue();
  useScreenHotkeys(undefined, claimsKey);

  // Runs after Terminal has subscribed to `main:` lines (child effects run first).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current || !OPENING_DIALOGUE) return;
    startedRef.current = true;
    startDialogue(OPENING_DIALOGUE);
  }, [startDialogue]);

  const Screen = current ? screens[current.id] : null;

  return (
    <>
      {/* The terminal stays mounted while hidden so its log and game state survive. */}
      <Terminal active={!Screen} />
      {Screen && <Screen data={current.data} close={showTerminal} />}
    </>
  );
}
