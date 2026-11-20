// The UI build: web/ → dist/ (the web demo) or the folder given to build.mjs (the desktop app's ui/).
// Paths stay relative so the page also loads from disk in Electron; nothing is minified, as before.
import solid from '@solidjs/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  base: './',
  plugins: [solid()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    cssMinify: false,
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
  },
});
