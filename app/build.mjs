// The UI is plain HTML/CSS/JS: building is copying web/ to dist/ (tests stay out).
import { cpSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
cpSync('web', 'dist', { recursive: true, filter: src => !src.endsWith('.test.js') });
console.log('built dist/');
