# Notes for coding agents

## Solid 2.0

The UI in `app/web` uses **Solid 2.0** (`solid-js` and `@solidjs/web` 2.0.x). Its API differs from Solid 1.x and from most examples online. Before writing or reviewing Solid code, read:

- `app/node_modules/solid-js/skills/solid-2.0/SKILL.md`: the primer. It covers the three rules that matter most, the 1.x → 2.0 corrections, and which primitives to use.
- `app/node_modules/solid-js/CHEATSHEET.md`: a one-page reference. The end lists what changed from 1.x.
- `documentation/solid-2.0/MIGRATION.md` in the Solid repository (github.com/solidjs/solid): the full migration guide.
- https://docs.solidjs.com: the docs. `/llms.txt` and `/llms-full.txt` are versions for agents.

The primer and cheatsheet come with the npm package, so run `cd app && npm ci` first if `node_modules` is missing.

## UI and user-facing text

Write all UI and user-facing text with the **caveman** skill (`/caveman`). This covers labels, buttons, placeholders, hints, toasts, tooltips, palette commands, the keys sheet, empty states and errors, and user docs such as `README.md`. Match dude's existing voice: lowercase, terse, a full stop on most lines. Examples: `need who.`, `time to hit Z.`, `inbox zero. nothing left. go outside.`.

- Never drop a negation (`not`, `no`, `never`, `only`).
- Keep keys, numbers and names exact.
- Use one word per thing, e.g. `remove` everywhere, not `remove` here and `take off` there.
- Tooltips read `Action (Key)`, e.g. `Mark Done (E)`.
- Palette commands and folder names stay in Title Case.
