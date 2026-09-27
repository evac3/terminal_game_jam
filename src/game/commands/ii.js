import { resolvePath, getNode } from '../fileSystem';

export default {
  name: 'ii',
  description: 'Display an image file',
  usage: 'ii <file>',
  run({ args, session }) {
    const target = args[0];
    if (!target) return 'ii: missing file\nUsage: ii <file>';

    const node = getNode(session.fs, resolvePath(session.cwd, target, session.home));
    if (!node) return `ii: ${target}: No such file or directory`;
    if (node.type === 'dir') return `ii: ${target}: Is a directory`;
    return node.content;
  },
};