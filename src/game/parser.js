/**
 * Split a raw command line into { command, args }.
 * Supports single/double quotes and backslash escapes, e.g.
 *   cat "my file.txt"  ->  { command: 'cat', args: ['my file.txt'] }
 */
export function parse(input) {
  const tokens = [];
  let current = '';
  let inToken = false;
  let quote = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '\\' && quote !== "'" && i + 1 < input.length) {
      current += input[++i];
      inToken = true;
    } else if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      inToken = true;
    } else if (/\s/.test(ch)) {
      if (inToken) tokens.push(current);
      current = '';
      inToken = false;
    } else {
      current += ch;
      inToken = true;
    }
  }
  if (inToken) tokens.push(current);

  const [command = '', ...args] = tokens;
  return { command, args };
}
