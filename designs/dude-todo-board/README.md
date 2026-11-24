# dude · todo board (prototype)

A clickable design for a new view in dude: the week as a board, one column per day. Built on `dude-design-system` (imported in `_ds/`). Open `Todo Board.html` over HTTP.

The mail and week screens are forked from `dude-design-system/ui_kits/mail`. The board is new: `board.jsx` and `board.css`.

## What it does

- **Getting there:** a third rail button (✓) under mail and calendar, or press `3`.
- **Days:** a column per day of the week, plus **someday** for todos with no day. Today has the brand pill and a 4% wash, like the week view.
- **Events as tasks:** each day's events sit at the top, in the calendar's own fills. Filled means a server event, outlined means kept locally or not yet answered, dashed means an invite. Tick one off for the day. Clicking an event opens it in the right pane, with "make todo".
- **Todos:** each card has a ring to tick it done, a title, then one mono line with labels, the attached mail's sender, and task progress (`1/3`). Done cards sink to the bottom.
- **Adding:** `+ todo` at the foot of a day opens a bar-marked input. Enter adds and keeps the input open; Shift+Enter adds and opens the todo. `D` or `+` in the header opens the full form.
- **The form (right pane, like events):**
  - *what*, on the brand underline
  - *when*, typed (`fri`, `tomorrow`, `nov 30`, `someday`) and read back in mono, with a dashed ghost card in the target day
  - *labels*, as chips with suggestions; you can create new ones
  - *mail*, with an "attach mail" picker
  - *tasks*, a checklist
  - *notes*
  - SAVE · NOPE · DELETE at the bottom, with `Ctrl+Enter` / `Esc`
- **Mail → todo:** on an open mail, `D` (or "todo D" in the reply bar) opens the form with the mail attached. The thread then shows which todos it's on.
- **Moving todos:** drag a card to another day, or press `Shift ← →`.
- **Labels:** filter chips in the header. Colours reuse the system's small functional hues (the file-type set).
- **Keys:**

| Key | Action |
|---|---|
| `← →` | change day |
| `↑ ↓` / `J K` | move between todos |
| `Enter` | open todo |
| `E` | done |
| `D` | new todo |
| `#` | delete |
| `T` | this week |
| `- =` | previous / next week |
| `Z` | undo |
| `?` | all keys |

- **Narrow windows.** The board follows the window frame's own width, at the same breakpoints the app uses:
  - Below 1200px, the form lays over the board from the right instead of squeezing it. The board can still scroll its last days out from under it.
  - Days snap as you scroll sideways, the label chips scroll instead of wrapping, and the board opens scrolled to today.
  - Below 768px (phones), days stack into one list with sticky day heads, the form covers the screen above the tab bar (like the app's calendar pane there), and the tab bar gets "Board".
  - Checked at 1440, 1280, 1024, 820 and 390px wide.
- **Tweaks** (bottom centre) to compare:
  - cards: filled or lined
  - events: top, bottom, or hidden
  - labels: dots or `#plain`
  - days: 7 or Mon–Fri
  - right pane when nothing is open: hidden, or month + labels
  - light or dark

## Calls made without asking

- "Add tasks to a todo" became a checklist inside each todo. Adding todos to a day is the `+ todo` quick add.
- The right pane appears only while editing, so the columns get the width. The *pane when idle* tweak shows the alternative.
- Todos stay on this computer, like reminders and snippets. No Google Tasks or Microsoft To Do sync.
- Labels are dude's own, not Gmail labels (Microsoft 365 has none).
- The rail icon is the existing `check` icon. A dedicated todo icon would be drawn in the same 1.3px style.

## Open questions

- Should unfinished todos from past days roll over to today?
- Should ticking an event off be remembered, or is it just for today?
- Is `D` for "todo" right? It's free in the app's keymap today.
