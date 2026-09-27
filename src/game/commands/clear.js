export default {
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the terminal screen',
  usage: 'clear',
  run({ terminal }) {
    terminal.clear();
  },
};
