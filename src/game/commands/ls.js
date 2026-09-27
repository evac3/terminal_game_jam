import { resolvePath, getNode } from '../fileSystem';

export default {
  name: 'ls',
  description: 'List directory contents',
  usage: 'ls [-a] [path]',
  run({ args, session }) {
    const showHidden = args.includes('-a');
    const target = args.find((a) => !a.startsWith('-'));

    const absPath = resolvePath(session.cwd, target, session.home);
    const node = getNode(session.fs, absPath);

    if (!node) return `ls: cannot access '${target}': No such file or directory`;
    if (node.type === 'file') return target;

    return Object.entries(node.children)
      .filter(([name]) => showHidden || !name.startsWith('.'))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, child]) => (child.type === 'dir' ? `${name}/` : name))
      .join('  ');
  },
};
