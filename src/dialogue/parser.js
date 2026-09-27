/**
 * Turns a dialogue script (.txt) into a list of steps. See scripts/intro.txt
 * for the format.
 *
 * Steps:
 *   { type: 'say',   target: 'main' | 'npc', text, line }
 *   { type: 'input', options: [option...], line }
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

/**
 * Tag handlers: tag name -> (rest of line, line number) => step.
 * Add new tags here.
 */
export const TAGS = {
  main: (text, line) => ({ type: 'say', target: 'main', text, line }),
  npc: (text, line) => ({ type: 'say', target: 'npc', text, line }),
  input: (rest, line) => {
    const m = rest.match(/^\[(.*)\]$/);
    if (!m) throw new ScriptError(line, 'input needs a target in brackets, e.g. input [enter]');
    return { type: 'input', options: m[1].split('|').map((o) => parseOption(o, line)), line };
  },
};

export class ScriptError extends Error {
  constructor(line, message) {
    super(`line ${line}: ${message}`);
    this.line = line;
  }
}

export function parseScript(source) {
  const steps = [];
  source.split(/\r?\n/).forEach((rawLine, i) => {
    const lineNo = i + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    // "<tag>: rest" or "<tag> rest"
    const m = line.match(/^([a-z]+)\s*:?\s?(.*)$/i);
    const handler = m && TAGS[m[1].toLowerCase()];
    if (!handler) throw new ScriptError(lineNo, `unknown tag in "${line}"`);

    steps.push(handler(m[2].trim(), lineNo));
  });
  return steps;
}
