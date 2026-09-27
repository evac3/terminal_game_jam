import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSession, getPrompt, MOTD } from '../game/session';
import { execute, isCommand } from '../game/engine';
import { useScreen } from '../screens/ScreenContext';
import { useDialogue } from '../dialogue/DialogueContext';
import { runEvent } from '../events';

export function formatPrompt({ user, host, cwd }) {
  return `${user}@${host}:${cwd}$`;
}

/**
 * Opens this app in its own window with `?<param>=<id>`; main.jsx reads it and
 * shows a mini game (?game=) or a document (?doc=). Reusing `name` reuses the window.
 */
function openPopup(param, id, { width, height }) {
  return window.open(`?${param}=${encodeURIComponent(id)}`, `${param}-${id}`, `width=${width},height=${height}`);
}

/**
 * Holds the game session and the terminal's output log.
 *
 * lines: [{ id, kind: 'input' | 'output' | 'system' | 'dialogue', text }]
 */
export function useTerminal() {
  const { showScreen } = useScreen();
  const { onMainPrint, onGameEvent, accepts, submit, startDialogue } = useDialogue();

  const sessionRef = useRef(null);
  if (!sessionRef.current) sessionRef.current = createSession();

  const nextIdRef = useRef(1);
  const [lines, setLines] = useState([{ id: 0, kind: 'output', text: MOTD }]);
  const [prompt, setPrompt] = useState(() => getPrompt(sessionRef.current));

  // Keep the latest prompt in a ref so sendCommand can echo it without re-creating.
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  const appendLine = useCallback((text, kind = 'output') => {
    setLines((prev) => [...prev, { id: nextIdRef.current++, kind, text }]);
  }, []);

  // What commands and events can do besides printing text.
  const terminal = useMemo(
    () => ({
      clear: () => setLines([]),
      showScreen,
      startDialogue,
      launch: (gameId) => {
        if (!openPopup('game', gameId, { width: 480, height: 640 })) {
          appendLine('Could not open the game window.', 'system');
        }
      },
      openDocument: (docId) => {
        if (!openPopup('doc', docId, { width: 760, height: 820 })) {
          appendLine('Could not open the document window.', 'system');
        }
      },
    }),
    [appendLine, showScreen, startDialogue]
  );

  // Dialogue `main:` lines are printed here.
  useEffect(() => onMainPrint(appendLine), [onMainPrint, appendLine]);

  // Dialogue `event:` lines run here, because this hook holds the player's session.
  useEffect(
    () =>
      onGameEvent((id) => {
        try {
          runEvent(id, { session: sessionRef.current, terminal });
        } catch (err) {
          console.error(`Event "${id}":`, err);
          appendLine(`[event error] ${id}: ${err.message}`, 'system');
        }
      }),
    [onGameEvent, terminal, appendLine]
  );

  const runCommand = useCallback(
    async (raw) => {
      const session = sessionRef.current;
      const output = await execute(raw, { session, terminal });
      if (output) appendLine(output);
      setPrompt(getPrompt(session));
    },
    [appendLine, terminal]
  );

  const sendCommand = useCallback(
    async (raw) => {
      appendLine(`${formatPrompt(promptRef.current)} ${raw}`, 'input');

      // A dialogue keyword that isn't also a real command is only an answer,
      // so don't print "command not found" for it.
      const answer = { text: raw, from: 'main' };
      const answersDialogue = accepts(answer);
      if (raw.trim() && (!answersDialogue || isCommand(raw))) await runCommand(raw);
      if (answersDialogue) submit(answer);
    },
    [appendLine, accepts, submit, runCommand]
  );

  return { lines, prompt, sendCommand };
}
