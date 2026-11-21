// Builds the UI with Vite (see vite.config.js) into dist/, or into the folder given.
// --dev: with Solid's development checks (they warn about store writes it ignores and the like).
const dev = process.argv.includes('--dev');
if (dev) {
  process.env.NODE_ENV = 'development'; // before Vite loads: Solid's plugin picks its build by it
}
const { resolve } = await import('node:path');
const { build } = await import('vite');

const outDir = resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'dist');
process.chdir(import.meta.dirname); // the bundle's module order follows paths relative to here: same output from any folder
await build({
  configFile: 'vite.config.js',
  build: { outDir },
  logLevel: 'warn',
  ...(dev && { mode: 'development', define: { 'process.env.NODE_ENV': '"development"' } }),
});
console.log(`built ${outDir}${dev ? ' (dev)' : ''}`);
