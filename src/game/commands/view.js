import { resolvePath, getNode } from '../fileSystem';

export default {
  name: 'view',
  description: 'Show the contents of a file',
  usage: 'view <file>',
  run({ args, session }) {
    const target = args[0];
    if (!target) return 'view: missing file\nUsage: view <file>';

    const node = getNode(session.fs, resolvePath(session.cwd, target, session.home));
    if (!node) return `view: ${target}: No such file or directory`;
    if (node.type === 'dir') return `view: ${target}: Is a directory`;
    return node.content;
  },
};
