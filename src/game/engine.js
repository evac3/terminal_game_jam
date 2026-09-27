import { parse } from './parser';
import commands from './commands';

export const MAX_COMMAND_LENGTH = 1000;

/** True if the line starts with a real command name. */
export function isCommand(raw) {
  return commands.get(parse(raw).command) != null;
}

/**
 * Parse a raw input line and route it to the matching command handler.
 *
 * `terminal` is how commands affect the screen beyond printing text:
 *   { clear(), launch(gameId), showScreen(screenId, data?), startDialogue(name) }
 *
 * Returns the text to print (may be empty).
 */
export async function execute(raw, { session, terminal }) {
  const input = raw.slice(0, MAX_COMMAND_LENGTH);
  const { command, args } = parse(input);
  if (!command) return '';

  session.history.push(input);
  if (session.history.length > 500) session.history.shift();

  const handler = commands.get(command);
  if (!handler) return `${command}: command not found`;

  try {
    const result = await handler.run({ args, session, terminal, commands });
    return result ?? '';
  } catch (err) {
    console.error(`[error] "${input}":`, err);
    return `${command}: internal error`;
  }
}
