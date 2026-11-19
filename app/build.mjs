// The UI is plain HTML/CSS/JS: building is copying web/ (tests stay out) to dist/, or to the folder given.
import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] || 'dist';
rmSync(out, { recursive: true, force: true });
cpSync(join(import.meta.dirname, 'web'), out, { recursive: true, filter: (src) => !src.endsWith('.test.js') });
console.log(`built ${out}/`);
