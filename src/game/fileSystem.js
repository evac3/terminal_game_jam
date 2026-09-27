/**
 * Mock file system.
 *
 * A node is either:
 *   { type: 'dir',  children: { [name]: node } }
 *   { type: 'file', content: string, game?: string, doc?: string }
 *
 * A file with `game` set is a program: `run <file>` launches that mini game
 * (the id must match a key in src/games/index.js).
 * A file with `doc` set is a document: `view <file>` opens it in its own
 * window (the id must match a document in an event, see src/events).
 */

export const dir = (children = {}) => ({ type: 'dir', children });
export const file = (content = '', extra = {}) => ({ type: 'file', content, ...extra });
export const program = (game, content = `[program: ${game}]`) => file(content, { game });
export const docFile = (docId) => file('', { doc: docId });

const TEMPLATE = dir({
  home: dir({
    guest: dir({
      '2048.exe': program('2048', 'A puzzle program. Start it with: run 2048.exe'),
      'readme.txt': file(
        'Welcome, guest.\n' +
          'Your access on this machine is limited.\n' +
          'Maybe someone left something useful lying around...'
      ),
      notes: dir({
        'todo.txt': file('- ask admin for a real account\n- stop leaving passwords in plain text'),
      }),
    }),
    admin: dir({
      'backup.tar': file('[binary data]'),
      '.secret': file('the password is hunter2'),
    }),
  }),
  etc: dir({
    hostname: file('mainframe'),
    motd: file('Unauthorized access is prohibited.'),
  }),
  var: dir({
    log: dir({
      'auth.log': file(
        'Sep 26 03:12:44 sshd: Accepted password for admin from 10.0.0.7\n' +
          'Sep 26 03:14:02 sshd: Failed password for root from 10.0.0.66'
      ),
    }),
  }),
  tmp: dir(),
});

export function createFileSystem() {
  return structuredClone(TEMPLATE);
}

/** Resolve `target` (absolute, relative, or ~-prefixed) against `cwd` into a normalized absolute path. */
export function resolvePath(cwd, target, home) {
  let p = target || '.';
  if (p === '~' || p.startsWith('~/')) p = home + p.slice(1);

  const parts = p.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  for (const segment of p.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return '/' + parts.join('/');
}

/** Return the node at an absolute path, or null if it doesn't exist. */
export function getNode(root, absPath) {
  let node = root;
  for (const segment of absPath.split('/').filter(Boolean)) {
    if (node.type !== 'dir' || !Object.hasOwn(node.children, segment)) return null;
    node = node.children[segment];
  }
  return node;
}

/** Put `node` at absPath (replacing anything there). The parent folder must exist. */
export function addFile(root, absPath, node) {
  const parts = absPath.split('/').filter(Boolean);
  const name = parts.pop();
  const parent = getNode(root, '/' + parts.join('/'));
  if (!name || parent?.type !== 'dir') throw new Error(`addFile: no folder for ${absPath}`);
  parent.children[name] = node;
}

/** Shorten the home directory to ~ for prompts. */
export function displayPath(absPath, home) {
  if (absPath === home) return '~';
  if (absPath.startsWith(home + '/')) return '~' + absPath.slice(home.length);
  return absPath;
}
