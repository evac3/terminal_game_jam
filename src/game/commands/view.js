import { resolvePath, getNode } from '../fileSystem';

export default {
  name: 'view',
  description: 'Show a file (documents and images open in a new window)',
  usage: 'view <file>',
  run({ args, session, terminal }) {
    const target = args[0];
    if (!target) return 'view: missing file\nUsage: view <file>';

    const node = getNode(session.fs, resolvePath(session.cwd, target, session.home));
    if (!node) return `view: ${target}: No such file or directory`;
    if (node.type === 'dir') return `view: ${target}: Is a directory`;
    if (node.image) {
      terminal.openImage(node.image);
      return `Opening ${target} in a new window...`;
    }
    if (node.doc) {
      terminal.openDocument(node.doc);
      return `Opening ${target} in a new window...`;
    }
    return node.content;
  },
};
