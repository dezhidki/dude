// Run from designs/dude-design-system: node tools/extract-icons.mjs ../../app/web/app/icons.tsx assets/icons components/controls/Icon.jsx
// Pull the app's own icon SVGs out of app/web/app/icons.tsx: one .svg per icon + a React Icon module.
import fs from 'node:fs';
const [src, outDir, jsxOut] = process.argv.slice(2);
const text = fs.readFileSync(src, 'utf8');
const re = /^\s{2}(\w+): \(\) => \(\s*(<svg[\s\S]*?<\/svg>)\s*\),/gm;
const icons = {};
for (const m of text.matchAll(re)) icons[m[1]] = m[2].replace(/\s*\n\s*/g, '');
for (const [n, svg] of Object.entries(icons)) {
  fs.writeFileSync(`${outDir}/${n}.svg`, svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') + '\n');
}
const body = `import React from 'react';\n\n// Generated from app/web/app/icons.tsx (dude's own icon set). Do not hand-edit; re-run:\n// node tools/extract-icons.mjs ../../app/web/app/icons.tsx assets/icons components/controls/Icon.jsx
// 1.3–1.5px strokes, currentColor, drawn at their natural 7–16px size. Never scaled up.
const ICONS = ${JSON.stringify(icons, null, 2)};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, title }) {
  const svg = ICONS[name];
  if (!svg) return null;
  return <span className="d-icon" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} dangerouslySetInnerHTML={{ __html: svg }} />;
}
`;
fs.writeFileSync(jsxOut, body);
console.log(Object.keys(icons).length, Object.keys(icons).join(' '));
