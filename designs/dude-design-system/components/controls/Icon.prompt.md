dude's own 19 stroke icons (copied from app/web/app/icons.tsx); use them inside IconButton, pane headings and event lines, never larger than drawn.

```jsx
<Icon name="check" />   // clip mail cal menu pen search check clock cmd trash person pin lines download back up down left right
```

- 1.3–1.5px strokes in `currentColor`, natural size 7–16px. Colour comes from the parent (`--text-2` by default, `--brand` when on).
- Anything a Unicode glyph already says stays a glyph: ✕ + ? ↩ ⤺ ↪ ★ ✓ • …
