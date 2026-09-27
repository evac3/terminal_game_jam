export default {
  name: 'help',
  description: 'Show this guide',
  usage: 'help',
  run({ commands }) {
    const list = commands.list();
    const width = Math.max(...list.map((c) => c.usage.length));
    const lines = list.map((c) => {
      const aliases = c.aliases?.length ? ` (also: ${c.aliases.join(', ')})` : '';
      return `  ${c.usage.padEnd(width)}  ${c.description}${aliases}`;
    });

    return [
      '=== GUIDE ===',
      '',
      'Commands:',
      ...lines,
      '',
      'Paths:',
      '  ~    your home folder',
      '  ..   the folder above the current one',
      '  /    the top of the file system',
      '',
      'Keys:',
      '  1    open the speaker screen to reread earlier messages',
      '       (press 1 again to come back)',
      '',
      'Tips:',
      '  Use the up/down arrow keys to reuse earlier commands.',
      '  Program files can be started with run.',
    ].join('\n');
  },
};
