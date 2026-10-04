import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

// Playground: a demo app that imports the library from its sources, like a consumer would.
export default defineConfig({
  root: 'playground',
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'better-react-email-editor/styles.css', replacement: src('styles.css') },
      { find: /^better-react-email-editor$/, replacement: src('index.ts') },
    ],
  },
  build: {
    outDir: '../dist-playground',
    emptyOutDir: true,
  },
});
