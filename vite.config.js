import { defineConfig } from 'vite';

export default defineConfig({
  base: '/glitch-run/',
  build: {
    chunkSizeWarningLimit: 700
  }
});
