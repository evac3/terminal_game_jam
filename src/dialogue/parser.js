/**
 * Turns a dialogue script (.txt) into a list of steps. See scripts/intro.txt
 * for the format.
 *
 * Steps:
 *   { type: 'say',   target: 'main' | 'npc', text, line }
 *   { type: 'input', options: [option...], from: 'main' | 'npc' | null, wrong: [text...], line }
 *   { type: 'event', id, line }
 *
 * Input options (the player must satisfy any one of them):
 *   { kind: 'key',  key: 'Enter', label: 'Enter' }   // key press; key '*' = any key
 *   { kind: 'text', word: 'yes',  label: '"yes"' }    // typed keyword + Enter
 */

/** Script key names -> KeyboardEvent.key values. */
export const KEY_NAMES = {
  enter: 'Enter',
  space: ' ',
  tab: 'Tab',
  esc: 'Escape',
  escape: 'Escape',
  backspace: 'Backspace',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  any: '*',
};

const KEY_LABELS = { ' ': 'Space', '*': 'any key' };

function parseOption(raw, lineNo) {
  const token = raw.trim();
  if (!token) throw new ScriptError(lineNo, 'empty input target');

  // "quoted" -> always a keyword
  const quoted = token.match(/^"(.*)"$/);
  if (quoted) return textOption(quoted[1], lineNo);

  // key:x -> a single key press
  const single = token.match(/^key:(.)$/i);
  if (single) {
    const key = single[1].toLowerCase();
    return { kind: 'key', key, label: key.toUpperCase() };
  }

  const named = KEY_NAMES[token.toLowerCase()];
  if (named) return { kind: 'key', key: named, label: KEY_LABELS[named] ?? named };

  return textOption(token, lineNo);
}

function textOption(word, lineNo) {
  const normalized = word.trim().toLowerCase();
  if (!normalized) throw new ScriptError(lineNo, 'empty keyword');
  return { kind: 'text', word: normalized, label: `"${normalized}"` };
}

/* Helper to generate standard "input [enter]" steps
function createEnterKeyInput(line) {
  return {
    type: 'input',
    options: [{ kind: 'key', key: 'Enter', label: 'enter' }],
    from: null,
    wrong: [],
    line,
  };
}
// Helper to delay between consecutive npc lines (dynamic reading time)
function getReadingDelay(text) {
  return Math.min(2500, Math.max(900, text.length * 45));
}
  */
/**
 * Tag handlers: tag name -> (rest of line, line number, steps so far) => step.
 * Returning nothing adds no step (used by `wrong`, which changes the step before it).
 * Add new tags here.
 */
const SAY_TAGS = new Set(['main', 'npc', 'player']);

export const TAGS = {
  main: (text, line) => ({ type: 'say', target: 'main', text, line }),
  npc: (text, line) => ({ type: 'say', target: 'npc', text, line }),
  player: (text, line) => ({ type: 'say', target: 'player', text, line }),

  // Manual wait support (e.g. wait: 1.5s or wait: 800ms)
  wait: (text, line) => {
    const raw = text.trim().toLowerCase();
    let ms = 0;
    if (raw.endsWith('ms')) ms = parseFloat(raw.replace('ms', ''));
    else if (raw.endsWith('s')) ms = parseFloat(raw.replace('s', '')) * 1000;
    else ms = parseFloat(raw);

    if (isNaN(ms) || ms < 0) {
      throw new ScriptError(line, `Invalid wait duration: "${text}"`);
    }
    return { type: 'wait', duration: ms, line };
  },

  // input [targets]  or  input npc [targets] / input main [targets]
  input: (rest, line) => {
    const m = rest.match(/^(?:(main|npc)\s+)?\[(.*)\]$/i);
    if (!m) throw new ScriptError(line, 'input needs a target in brackets, e.g. input [enter]');
    return {
      type: 'input',
      options: m[2].split('|').map((o) => parseOption(o, line)),
      from: m[1]?.toLowerCase() ?? null,
      wrong: [],
      line,
    };
  },
  // wrong: <text>  what the NPC says when a typed answer on the NPC screen is wrong
  wrong: (text, line, steps) => {
    const prev = steps[steps.length - 1];
    if (prev?.type !== 'input') throw new ScriptError(line, 'wrong must come right after an input line');
    prev.wrong.push(text);
  },
  // screen: <id>  switch the main window to a screen from src/screens (or `terminal`)
  screen: (id, line) => {
    if (!/^[\w-]+$/.test(id)) throw new ScriptError(line, 'screen needs an id, e.g. screen: ending');
    return { type: 'screen', id, line };
  },
  // event: <id>  start a game event from src/events
  event: (id, line) => {
    if (!/^[\w-]+$/.test(id)) throw new ScriptError(line, 'event needs an id, e.g. event: word-puzzle');
    return { type: 'event', id, line };
  },
};

export class ScriptError extends Error {
  constructor(line, message) {
    super(`line ${line}: ${message}`);
    this.line = line;
  }
}

export function parseScript(source) {
  const rawSteps = [];

  // Pass 1: Parse all tags into intermediate raw steps
  source.split(/\r?\n/).forEach((rawLine, i) => {
    const lineNo = i + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const m = line.match(/^([a-z]+)\s*:?\s?(.*)$/i);
    const handler = m && TAGS[m[1].toLowerCase()];
    if (!handler) throw new ScriptError(lineNo, `unknown tag in "${line}"`);

    // Text lines keep their leading spaces (after the one space following the
    // colon), so indented text like a folder tree lines up.
    const tag = m[1].toLowerCase();
    const rest = SAY_TAGS.has(tag) ? m[2].trimEnd() : m[2].trim();
    const step = handler(rest, lineNo, rawSteps);
    if (step) rawSteps.push(step);
  });

  // Pass 2: Normalize and auto-inject wait / input steps
  const steps = [];

  for (let i = 0; i < rawSteps.length; i++) {
    const curr = rawSteps[i];
    const next = rawSteps[i + 1];

    steps.push(curr);

    /* Rule 1: PLAYER lines -> input [enter] after every line (unless next is already an input)
    if (curr.type === 'say' && (curr.target === 'player' || curr.target === 'npc')) {
      if (next?.type !== 'input') {
        steps.push(createEnterKeyInput(curr.line));
      }
    }

    // Rule 2: NPC lines
    if (curr.type === 'say' && curr.target === 'npc') {
      if (next?.type === 'say' && next?.target === 'npc') {
        // Between consecutive NPC lines -> auto wait
        steps.push({
          type: 'wait',
          duration: getReadingDelay(curr.text),
          line: curr.line,
        });
      } else if (next?.type !== 'input') {
        // End of an NPC chunk -> input [enter]
        steps.push(createEnterKeyInput(curr.line));
      }
    }
      */
  }

  return steps;
}
