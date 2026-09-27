import { resolvePath, getNode } from '../fileSystem';

export default {
  name: 'cd',
  description: 'Change the current directory',
  usage: 'cd [path]',
  run({ args, session }) {
    const target = args[0] || '~';
    const absPath = resolvePath(session.cwd, target, session.home);
    const node = getNode(session.fs, absPath);

    if (!node) return `cd: ${target}: No such file or directory`;
    if (node.type !== 'dir') return `cd: ${target}: Not a directory`;

    session.cwd = absPath;
  },
};
