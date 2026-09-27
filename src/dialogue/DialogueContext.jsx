import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useScreen } from '../screens/ScreenContext';
import { parseScript } from './parser';
import { DialogueRunner } from './runner';
import { scripts } from './scripts';

/**
 * Runs dialogue scripts and connects them to the UI.
 *
 * useDialogue() returns:
 *   startDialogue(name)   start scripts/<name>.txt. Returns false on error
 *   npcLines              every NPC-screen line so far (kept across dialogues)
 *                         [{ id, kind: 'npc' | 'player' | 'divider', text }]
 *   waitingFor            input options being waited on, or null
 *   active                true while a script is running
 *   accepts({ key } | { text }), submit(...)   check or give player input
 *   claimsKey(key)        true if the current wait needs this key (so hotkeys leave it alone)
 *   reply(text)           player typed on the NPC screen: shown there, then submitted
 *   onMainPrint(fn)       subscribe to `main:` lines (the terminal does this)
 */
const DialogueContext = createContext(null);

// Oldest NPC-screen lines are dropped past this many.
const MAX_NPC_LINES = 500;

export function DialogueProvider({ children }) {
  const { showScreen, showTerminal } = useScreen();
  const runnerRef = useRef(null);
  const mainListenersRef = useRef(new Set());
  const nextIdRef = useRef(0);

  const [npcLines, setNpcLines] = useState([]);
  const [waitingFor, setWaitingFor] = useState(null);
  const [active, setActive] = useState(false);

  const addNpcLine = useCallback((text, kind) => {
    setNpcLines((prev) => [...prev, { id: nextIdRef.current++, kind, text }].slice(-MAX_NPC_LINES));
  }, []);

  const printMain = useCallback((text, kind = 'dialogue') => {
    mainListenersRef.current.forEach((fn) => fn(text, kind));
  }, []);

  const onMainPrint = useCallback((fn) => {
    mainListenersRef.current.add(fn);
    return () => mainListenersRef.current.delete(fn);
  }, []);

  const startDialogue = useCallback(
    (name) => {
      let steps;
      try {
        if (!(name in scripts)) throw new Error('no such script');
        steps = parseScript(scripts[name]);
      } catch (err) {
        console.error(`Dialogue "${name}":`, err);
        printMain(`[dialogue error] ${name}.txt: ${err.message}`, 'system');
        return false;
      }

      // Keep earlier conversations, separated by a divider.
      setNpcLines((prev) => (prev.length ? [...prev, { id: nextIdRef.current++, kind: 'divider', text: '' }] : prev));
      const runner = new DialogueRunner(steps, {
        say: (target, text) => {
          if (target === 'npc') {
            addNpcLine(text, 'npc');
            showScreen('npc');
          } else {
            printMain(text);
            showTerminal();
          }
        },
        wait: (options) => setWaitingFor(options),
        end: () => {
          setWaitingFor(null);
          setActive(false);
        },
      });
      runnerRef.current = runner;
      setActive(true);
      runner.start();
      return true;
    },
    [addNpcLine, printMain, showScreen, showTerminal]
  );

  const accepts = useCallback((input) => runnerRef.current?.accepts(input) ?? false, []);

  // A hotkey must not steal a key the dialogue is waiting for: a key target
  // like [key:1] or [any], or the first letter of a keyword like [1984].
  const claimsKey = useCallback((key) => {
    const options = runnerRef.current?.waitingFor;
    if (!options) return false;
    return options.some((o) =>
      o.kind === 'key' ? runnerRef.current.accepts({ key }) : o.word.startsWith(key.toLowerCase())
    );
  }, []);
  const submit = useCallback((input, atStep) => runnerRef.current?.submit(input, atStep) ?? false, []);

  const reply = useCallback(
    (text) => {
      if (text.trim()) addNpcLine(text, 'player');
      return submit({ text });
    },
    [addNpcLine, submit]
  );

  // Key-press targets like input [enter] work from any screen.
  useEffect(() => {
    const onKeyDown = (e) => {
      const runner = runnerRef.current;
      if (e.repeat || !runner?.accepts({ key: e.key })) return;
      // Decide now, before the key also submits a command or reply, but continue
      // on the next tick so that command's output prints first. `atStep` stops
      // this key from also answering whatever step comes next.
      const atStep = runner.index;
      setTimeout(() => runner.submit({ key: e.key }, atStep), 0);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const value = useMemo(
    () => ({ startDialogue, npcLines, waitingFor, active, accepts, claimsKey, submit, reply, onMainPrint }),
    [startDialogue, npcLines, waitingFor, active, accepts, claimsKey, submit, reply, onMainPrint]
  );

  return <DialogueContext.Provider value={value}>{children}</DialogueContext.Provider>;
}

export function useDialogue() {
  const ctx = useContext(DialogueContext);
  if (!ctx) throw new Error('useDialogue must be used inside <DialogueProvider>');
  return ctx;
}
