/**
 * `npm run dev`: starts the Vite dev server, then opens the Electron app on it.
 * Closing the app window (or Ctrl+C) stops everything.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import electronPath from 'electron';

const server = await createServer();
await server.listen();
const url = server.resolvedUrls.local[0];
console.log(`Vite dev server at ${url}`);

const electron = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
});

electron.on('exit', async () => {
  await server.close();
  process.exit(0);
});
process.on('SIGINT', () => electron.kill());
process.on('SIGTERM', () => electron.kill());
