import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession, getPrompt, MOTD } from '../game/session';
import { execute, isCommand } from '../game/engine';
import { useScreen } from '../screens/ScreenContext';
import { useDialogue } from '../dialogue/DialogueContext';

export function formatPrompt({ user, host, cwd }) {
  return `${user}@${host}:${cwd}$`;
}

/** Opens a mini game in its own window. main.jsx sees ?game= and renders the game. */
function openGameWindow(gameId) {
  return window.open(`?game=${encodeURIComponent(gameId)}`, `minigame-${gameId}`, 'width=480,height=640');
}

/**
 * Holds the game session and the terminal's output log.
 *
 * lines: [{ id, kind: 'input' | 'output' | 'system' | 'dialogue', text }]
 */
export function useTerminal() {
  const { showScreen } = useScreen();
  const { onMainPrint, accepts, submit, startDialogue } = useDialogue();

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

  // Dialogue `main:` lines are printed here.
  useEffect(() => onMainPrint(appendLine), [onMainPrint, appendLine]);

  const runCommand = useCallback(
    async (raw) => {
      const session = sessionRef.current;
      const terminal = {
        clear: () => setLines([]),
        showScreen,
        startDialogue,
        launch: (gameId) => {
          if (!openGameWindow(gameId)) appendLine('Could not open the game window.', 'system');
        },
      };

      const output = await execute(raw, { session, terminal });
      if (output) appendLine(output);
      setPrompt(getPrompt(session));
    },
    [appendLine, showScreen, startDialogue]
  );

  const sendCommand = useCallback(
    async (raw) => {
      appendLine(`${formatPrompt(promptRef.current)} ${raw}`, 'input');

      // A dialogue keyword that isn't also a real command is only an answer,
      // so don't print "command not found" for it.
      const answersDialogue = accepts({ text: raw });
      if (raw.trim() && (!answersDialogue || isCommand(raw))) await runCommand(raw);
      if (answersDialogue) submit({ text: raw });
    },
    [appendLine, accepts, submit, runCommand]
  );

  return { lines, prompt, sendCommand };
}
