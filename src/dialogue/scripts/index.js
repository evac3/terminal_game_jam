/**
 * All dialogue scripts in this folder, by file name without .txt:
 * scripts/intro.txt -> scripts.intro (raw text).
 */
const files = import.meta.glob('./*.txt', { query: '?raw', import: 'default', eager: true });

export const scripts = Object.fromEntries(
  Object.entries(files).map(([path, text]) => [path.slice(2, -4), text])
);
