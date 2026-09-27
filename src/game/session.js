import { createFileSystem, displayPath } from './fileSystem';

export const MOTD = [
  'Connected to mainframe.',
  'Unauthorized access is prohibited. All activity is logged.',
  "Type 'help' to see available commands.",
].join('\n');

/** The player's game state. Add new per-player data here. */
export function createSession() {
  return {
    user: 'guest',
    host: 'mainframe',
    home: '/home/guest',
    cwd: '/home/guest',
    fs: createFileSystem(),
    history: [],
  };
}

/** Prompt info for the UI, with the home folder shown as ~. */
export function getPrompt(session) {
  return {
    user: session.user,
    host: session.host,
    cwd: displayPath(session.cwd, session.home),
  };
}
