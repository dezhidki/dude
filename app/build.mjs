// Builds the UI with Vite (see vite.config.js) into dist/, or into the folder given.
import { resolve } from 'node:path';
import { build } from 'vite';

const outDir = resolve(process.argv[2] || 'dist');
process.chdir(import.meta.dirname); // the bundle's module order follows paths relative to here: same output from any folder
await build({ configFile: 'vite.config.js', build: { outDir }, logLevel: 'warn' });
console.log(`built ${outDir}`);
