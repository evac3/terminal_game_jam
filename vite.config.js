import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built page works when Electron loads it from disk.
  base: './',
  server: { port: 3000 },
});
