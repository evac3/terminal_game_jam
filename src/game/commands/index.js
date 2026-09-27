/**
 * Command registry.
 *
 * Every other .js file in this folder is loaded automatically. To add a
 * command, drop in a file that exports:
 *
 *   export default {
 *     name: 'whoami',
 *     aliases: [],                       // optional
 *     description: 'Print current user',
 *     usage: 'whoami',
 *     run({ args, session, terminal, commands }) { return 'guest'; },
 *   };
 *
 * `run` returns the output string (or nothing) and may be async.
 * `terminal` is { clear(), launch(gameId), openDocument(docId), showScreen(screenId, data?),
 * startDialogue(name) }.
 */
const modules = import.meta.glob(['./*.js', '!./index.js'], { eager: true });

const registry = new Map(); // name/alias -> command
const primary = [];         // unique commands, for `help`

for (const [fileName, mod] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
  const cmd = mod.default;
  if (!cmd?.name || typeof cmd.run !== 'function') {
    throw new Error(`Invalid command module: ${fileName}`);
  }

  for (const key of [cmd.name, ...(cmd.aliases || [])]) {
    if (registry.has(key)) throw new Error(`Duplicate command name: ${key}`);
    registry.set(key, cmd);
  }
  primary.push(cmd);
}

export default {
  get: (name) => registry.get(name),
  list: () => primary,
};
