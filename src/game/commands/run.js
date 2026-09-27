import { resolvePath, getNode } from '../fileSystem';

export default {
  name: 'run',
  description: 'Run a program file (launches its mini game)',
  usage: 'run <file>',
  run({ args, session, terminal }) {
    const target = args[0];
    if (!target) return 'run: missing file\nUsage: run <file>';

    const node = getNode(session.fs, resolvePath(session.cwd, target, session.home));
    if (!node) return `run: ${target}: No such file or directory`;
    if (node.type === 'dir') return `run: ${target}: Is a directory`;
    if (!node.game) return `run: ${target}: Not a program`;

    terminal.launch(node.game);
    return `Launching ${target}...`;
  },
};
