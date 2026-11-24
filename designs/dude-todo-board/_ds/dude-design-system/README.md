# dude Design System

The design language of **dude**, a keyboard-first desktop mail client for Gmail and Microsoft 365 ("No super. Just email."). One product, one surface: an Electron window (also runs as a web demo) with mail, a calendar, a command palette and settings. Two themes: **light** (warm paper, olive accent) and **carbon** (true black, acid-lime accent). The app ships carbon as its default; this system documents light first and carbon as the override.

The app's stylesheet sums the look up in one line: *"really dark, flat, one sharp accent, no pictures."* In light it becomes: warm off-white, flat, one olive accent, no pictures.

## Sources

Extracted from the codebase, not screenshots, at commit `04de447b8bafe23ae1d0b4275c5b2e69861c08a4` (2026-11-21) of `github.com/dezhidki/dude`:

- `app/web/style.css`: every token and component value here (2,541 lines, one file).
- `app/web/app/render.tsx`, `week.tsx`, `settings.tsx`: screen structure and all UI copy.
- `app/web/app/icons.tsx`: the icon set (copied into `assets/icons/` by `tools/extract-icons.mjs`).
- `app/web/app/commands.ts`, `compose.ts`, `calendar.ts`, `actions.ts`: palette commands, toasts.
- `app/web/demo.ts`: the demo mailbox the UI kit's content follows.
- `app/desktop/assets/*.png`, `app/web/assets/favicon.svg`: the app icon, tray icons, favicon.

Checked side by side against the real web build (`app/dist`, demo mode) in headless Chrome.

---

## CONTENT FUNDAMENTALS

**Caveman-terse.** dude talks like it has no time: articles and verbs drop out, a full stop closes almost everything, lowercase throughout. It is deadpan, a little funny, never cute.

| Where | Copy |
|---|---|
| Sign-in | `no super. just email.` · `go` · `login like thunderbird. uni say ok.` · `demo only. real mail need desktop app.` |
| Empty | `inbox zero.` / `nothing left. go outside.` · `empty.` / `nothing here.` · `nothing.` · `loading…` |
| Errors | `folder no load.` · `need who.` · `files + later no work. send now.` · `copy no work.` · `login for x dead. mail stuck.` |
| Toasts | `sent.` · `done. [Z] undo` · `sending… [Z] undo` · `undone.` · `nothing undo.` · `muted. new replies skip inbox.` · `going. organizer told.` |
| Placeholders | `write.` · `reply.` · `subject` · `search` · `what` · `who` · `where` · `when? 8 am, 3 days, aug 7` |
| Settings hints | `time to hit Z.` · `name on your mail.` · `new mail ping. dude live in tray.` · `only important + other.` |
| Buttons | `go` · `send` · `later` · `reply all` · `save` · `nope` · `delete` · `connect` · `login again` |

- **Case.** UI words, buttons, settings headings, dialog titles, palette heads (`dude command`, `remind when`) and toasts are lowercase. **Title Case** is kept for *names of things*: folders (`Starred`, `All Mail`), splits (`Important`, `Other`), palette commands (`Mark Done`, `Go to Important`, `Send & Mark Done`), key-sheet rows, tooltips. Short caps labels only in a few fixed spots (`FOLDERS`, `NAVIGATION`, `SAVE`/`NOPE`, `2 NEW MAIL. SHOW`), done in CSS, never typed.
- **Person.** The user is "you", rarely said; the app calls itself **dude** in the third person (`outlook tells dude when mail lands`). You appear as `Me` in threads and invitations.
- **Keys everywhere.** Any action that has a key shows it: keycaps in the palette, reply bar, side menu and toasts; tooltips read `Action (Key)`: `Mark Done (E)`, `Send later (Ctrl+Shift+L)`. Chords read `G then I`.
- **Typed time** is the input language for dates: `8 am`, `2h`, `3 days`, `mon 9:30`, `next week`, `tomorrow 2 pm 30 min`. It reads back in mono (`Tue, Nov 24, 2:00 PM – 2:30 PM`).
- **Emoji:** none in the UI. The one joke glyph is `¯\_(ツ)_/¯` for "someday" in the remind picker.
- **Numbers:** counts cap at `150+`; sizes are `248 kb`, `2.4 mb` (lowercase units, space before).

## VISUAL FOUNDATIONS

**Colour.** Two neutral ramps and one accent. Light is warm (`#fcfaf7` pane, `#f7f6f2` card, `#f2f0eb` selected, `#141413` ink); carbon is true black stepped in tiny increments (`#000` → `#070707` → `#0e0e0e` → `#171717`) with white-alpha text (92/66/52%) and white-alpha lines (7%, 16%). The accent is **olive `#4d7c0f`** in light and **acid lime `#c8f135`** in carbon, and it means *focus or "on"*: the 3px bar, unread dot, picked ✓, the active rail/icon, today, the one filled button. Everything else colour-coded is small and functional: star amber, draft red, event blue (light) / olive (carbon), now-line red, file-type hues. See `tokens/colors.css`.

**Type.** System fonts only, no webfonts shipped. **Sans** (`-apple-system, Segoe UI, Inter, Roboto…`) carries reading and controls at a 13/20 base with 0.005em tracking. **Mono** (`JetBrains Mono, DejaVu Sans Mono, …`) is dude's own voice: the wordmark, sign-in, the command palette, dates and counts, keycaps, file types, calendar hours, inbox zero. Weights are mostly 400 and 700: 500 for unread senders and week day heads, 600 for small labels (event titles, menu section heads, suggestion names), 800 only for the wordmark and inbox zero. Titles are light, not bold: the thread subject is 400 22/32. See `tokens/type.css`.

**The bar.** The signature motif: a **3px accent edge on the left** of whatever has focus: the selected row (`::before`), the focused message and inline composer (`inset 3px 0 0`), the search box and palette input (boxless inputs whose only chrome is the bar), the event title (a 2px underline instead).

**Space and layout.** A fixed frame: 40px rail | main | 398px pane. List text starts at 63px (the unread dot sits at 43px), right gutter 30px, header 76px, rows 36px. Reading pages centre a 712px column with 36px insets. Odd numbers are on purpose; copy them exactly. The pane hides under 1200px; under 768px the rail goes, rows wrap to two lines and a word-only tab bar appears. See `tokens/layout.css` and the Window grid card.

**Backgrounds.** Flat fills only. No images, illustrations, patterns or gradients, with two exceptions: the week grid's hour lines are a `repeating-linear-gradient`, and today's column gets a 4% brand wash (`color-mix`). Designed HTML mail keeps its own white sheet in both themes (dimmed 8% in carbon); plain mail takes the theme.

**Cards.** An open message or composer is a `--card` fill, 4px radius, no border, no shadow. Attachment tiles (154×92) and chips add a 1px `--line-2` border that turns brand on hover. Nothing is elevated.

**Borders and depth.** Hairlines (`--line`) separate regions; visible borders (`--line-2`) outline fields, chips and overlays. Overlays (palette, dialogs, toasts) are flat in **both** themes: 1px `--line-2`, 3px radius, `box-shadow: none`. Shadows exist only in three places: the side menu in light (`0 0 30px` 18%), the To/Cc suggestion list (`0 10px 30px` 25%), and the red sign-in-again bar.

**Radii.** Nearly square: 2px (rows, keycaps, buttons, chips), 3px (overlays, icon buttons), 4px (cards, fields, segmented), 6px only on the alert bar. Circles only for the unread dot, the now dot, the palette's empty rings and the mini-month day.

**Transparency and blur.** No blur anywhere (`backdrop-filter: none` is explicit). Transparency is for carbon's white-alpha text and lines, the 25% scrim behind dialogs (the palette has none), the 92% black behind the file viewer, and declined events at 55%.

**Motion.** Quick and light; all off under `prefers-reduced-motion`. Screen changes fade (0.14s); a thread rises 8px (0.18s, `cubic-bezier(.2,.8,.2,1)`); palette and dialogs pop from −6px at 98% scale with a 10% overshoot (0.14s); toasts rise 10px; the side menu slides 24px; a row marked Done slides 24px right and collapses (0.16s, ease-in). Row, message and palette-line backgrounds change in 0.06–0.1s linear; every other hover is instant. No bounces, loops, or decorative motion.

**Hover.** Text goes from `--text-2` to `--text`; rows and icon buttons get `--hover`; soft buttons go to `--hi`; outlined chips and tiles get a brand border; brand fills brighten (`filter: brightness(1.08)`). **Press:** no pressed styles at all. **Focus:** a 2px brand outline, 2px off; text inputs drop it for the bar.

**Scrollbars** are invisible until you hover a scrolling area, then thin and 35% grey.

**Imagery.** None of the app's own. Mail images render as sent.

## ICONOGRAPHY

- **One small hand-drawn set**: 19 stroke icons in `assets/icons/*.svg`, copied verbatim from `app/web/app/icons.tsx`: `clip mail cal menu pen search check clock cmd trash person pin lines download back up down left right`. 1.3–1.5px strokes, `currentColor`, round-ish 2px corners, drawn at 7–16px and **never scaled**. Use them through the `Icon` component (or `IconButton`).
- **Unicode does the rest**, set in the text font: `✕` close, `+` new event, `?` keys, `↩ ⤺ ↪` reply / reply all / forward, `★` star, `✓` picked, `•` split separator, `…` quoted text, `·` joiner, `–` time ranges.
- **The palette's empty ring**: every command line starts with a 20px circle (1.5px border, 80% opacity), not an icon.
- No icon font, no third-party set, no emoji. Don't add icons for things the app says with a word.
- **Logo**: a brand-coloured rounded square with a mono 800 "d", beside the wordmark "dude" in mono 800. The app icon (`assets/icon.png`) is lime on near-black; `assets/favicon.svg` is the same in SVG; `assets/tray*.png` are the tray icons.

---

## Index

| Path | What |
|---|---|
| `styles.css` | The one file to link. `@import`s only. |
| `tokens/colors.css` | Surfaces, lines, text, accent, calendar, status, file types; light on `:root`, carbon on `.carbon`. |
| `tokens/type.css` | Font stacks and the sans / mono scales. |
| `tokens/layout.css` | Radii, the window grid, heights, spacing steps, shadows, motion. |
| `tokens/base.css` | Resets, keycap, focus ring, scrollbars, keyframes. |
| `components/controls/` | `Icon`, `Key`, `Keys`, `IconButton`, `Button` (11 variants), `ChoiceButton`, `Segmented`, `Field`, `Checkbox`, `BarInput` |
| `components/shell/` | `Logo`, `AppShell`, `Rail`, `ListHeader`, `ThreadView`, `Pane`, `SettingsSection`, `TabBar` |
| `components/mail/` | `SplitTabs`, `ListSeparator`, `ListNote`, `ListRow`, `ZeroState`, `MessageRow`, `Message`, `Attachment`, `AttachmentChip`, `FileType`, `FileChip`, `ReplyBar`, `NewMail`, `Editor`, `Composer`, `Invite`, `Suggestions`, `ContactCard`, `SearchTips`, `RecentSearch` |
| `components/overlays/` | `CommandPalette`, `Dialog`, `KeysList`, `Toast`, `ToastStack`, `SideMenu`, `AuthBar`, `FileViewer` |
| `components/calendar/` | `DayCalendar`, `WeekView`, `EventBlock`, `EventChip`, `CalNote`, `MiniMonth`, `CalendarOptions`, `EventForm`, `EventView`, `EventButtons` |
| `ui_kits/mail/` | Click-through of the app: inbox, thread (with invite + day pane), reply, compose, search, settings, week, palette, side menu, keys. Open `index.html` (`#signin` for sign-in, `#carbon` for dark). |
| `guidelines/` | 21 foundation specimen cards (Colors, Type, Spacing, Brand). |
| `assets/` | App icon, tray icons, favicon, `icons/` (19 SVGs). |
| `tools/extract-icons.mjs` | Re-copies the icons from the app source. |
| `preview.html` | Everything above in one page. |

Components are on `window.DudeDesignSystem_3fa3b0` after loading `_ds_bundle.js` (React 18 first).

## How this differs from the app's code

- **Class names** are the app's own with a `d-` prefix (`.row` → `.d-row`, `.cmd` → `.d-cmd`, `.inv-b` → `.d-choice`, `.cal-btn` → `.d-btn-outline`). Source classes are noted in brackets in each CSS file.
- **Theme scope**: the app puts `carbon` on `<html>`; here `.carbon` works on any element, so a carbon island can sit inside a light page.
- **Theme-only rules became tokens**: `:root:not(.carbon)` overrides are now `--on-brand`, `--ev-text`, `--ev-edge`, `--shadow-menu`, `--star`, `--danger`, `--link`, `--ft-*`.
- **Narrow windows** use container queries on the shell instead of media queries, so specimens in small frames show the desktop layout.
- **HTML mail** renders in the app inside a sandboxed iframe with its own font (`--sans-mail`); here it is a plain `div` (`Message html` / `paper`).
- **Intentional additions** (no counterpart class in the app): `Icon` (wrapper for the copied SVGs), `Keys` (a row of keycaps), `inline` props on overlays (render in flow for mockups), `Editor boxed` (the settings signature box, `.settings .editor` in the app).
- Dates in the kit are en-US (`2:22 pm`); the app follows the system locale (`14:22`).

## Not covered yet

The file viewer appears only as a component, not in the kit. Also missing: send-later and the Scheduled view, snippets, multi-select (`X`), drag-to-create events, the phone layout as its own screen, and Microsoft-specific calendar notes.
