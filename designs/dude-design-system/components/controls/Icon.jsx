import React from 'react';

// Generated from app/web/app/icons.tsx (dude's own icon set). Do not hand-edit; re-run:
// node tools/extract-icons.mjs ../../app/web/app/icons.tsx assets/icons components/controls/Icon.jsx
// 1.3–1.5px strokes, currentColor, drawn at their natural 7–16px size. Never scaled up.
const ICONS = {
  "clip": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M12 6.5L7 11.5a3 3 0 01-4.3-4.3L8 2a2 2 0 012.8 2.8L5.6 10a1 1 0 01-1.4-1.4L9 3.8\" /></svg>",
  "mail": "<svg width=\"14\" height=\"12\" viewBox=\"0 0 14 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><rect x=\".7\" y=\".7\" width=\"12.6\" height=\"10.6\" rx=\"2\" /><path d=\"M1.5 2l5.5 4.2L12.5 2\" /></svg>",
  "cal": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><rect x=\".7\" y=\"1.7\" width=\"12.6\" height=\"11.6\" rx=\"2\" /><path d=\"M.7 5.2h12.6M4 .5v2.5M10 .5v2.5\" /></svg>",
  "menu": "<svg width=\"16\" height=\"12\" viewBox=\"0 0 16 12\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M0 1h16M0 6h16M0 11h16\" /></svg>",
  "pen": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 15 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M10.5 1.5l3 3L5 13H2v-3z\" /><path d=\"M1 14.3h13\" /></svg>",
  "search": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><circle cx=\"6\" cy=\"6\" r=\"4.8\" /><path d=\"M9.6 9.6L13.3 13.3\" /></svg>",
  "check": "<svg width=\"14\" height=\"11\" viewBox=\"0 0 14 11\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M1 5.5l4 4L13 1\" /></svg>",
  "clock": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 15 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><circle cx=\"7.5\" cy=\"7.5\" r=\"6.6\" /><path d=\"M7.5 3.8v4l2.6 1.6\" /></svg>",
  "cmd": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 15 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M7.5 1l6 3.3-6 3.3-6-3.3z\" /><path d=\"M1.5 7.5l6 3.3 6-3.3M1.5 10.7l6 3.3 6-3.3\" /></svg>",
  "trash": "<svg width=\"13\" height=\"14\" viewBox=\"0 0 13 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M1 3h11M4.5 3V1.5h4V3M2.5 3l.7 10h6.6l.7-10\" /></svg>",
  "person": "<svg width=\"13\" height=\"14\" viewBox=\"0 0 13 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><circle cx=\"6.5\" cy=\"4\" r=\"3\" /><path d=\"M1 13.5c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5\" /></svg>",
  "pin": "<svg width=\"12\" height=\"15\" viewBox=\"0 0 12 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M6 14s5-5 5-8.5a5 5 0 0 0-10 0C1 9 6 14 6 14z\" /><circle cx=\"6\" cy=\"5.5\" r=\"1.8\" /></svg>",
  "lines": "<svg width=\"13\" height=\"11\" viewBox=\"0 0 13 11\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M0 1h13M0 5.5h13M0 10h8\" /></svg>",
  "download": "<svg width=\"13\" height=\"14\" viewBox=\"0 0 13 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M6.5 1v8.5M2.8 6l3.7 3.7L10.2 6M1 13h11\" /></svg>",
  "back": "<svg width=\"16\" height=\"14\" viewBox=\"0 0 16 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M7 1L1 7l6 6M1 7h15\" /></svg>",
  "up": "<svg width=\"12\" height=\"8\" viewBox=\"0 0 12 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M1 7l5-5.5L11 7\" /></svg>",
  "down": "<svg width=\"12\" height=\"8\" viewBox=\"0 0 12 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M1 1l5 5.5L11 1\" /></svg>",
  "left": "<svg width=\"7\" height=\"12\" viewBox=\"0 0 7 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M6 1L1 6l5 5\" /></svg>",
  "right": "<svg width=\"7\" height=\"12\" viewBox=\"0 0 7 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M1 1l5 5-5 5\" /></svg>"
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, title }) {
  const svg = ICONS[name];
  if (!svg) return null;
  return <span className="d-icon" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} dangerouslySetInnerHTML={{ __html: svg }} />;
}
