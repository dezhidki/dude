# Todo Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a todo board to dude: the week as columns (one per day plus "someday"), each holding that day's events and todos. Todos are edited in the right pane like events, can carry emails, labels and a checklist, and are opened from a third rail button or `3`.

**Architecture:** Same split as the calendar (`calendar.ts` + `week.tsx`):
- `web/todos.ts`: pure logic, no DOM, unit-tested like `when.ts`.
- `web/app/todo.ts`: state and actions on `S`, `LS` and `M`.
- `web/app/board.tsx`: the Solid components.

Todos live in `localStorage` through `LS` (key `todos`), like events kept here and reminders. The board shares its week with the calendar through `S.calDay`, so it reuses `weekMove`, `calToday`, `ensureCalDay` and the event form.

**Tech Stack:** Solid 2.0 (`solid-js` / `@solidjs/web` 2.0.3), strict TypeScript, Vite, Biome. Tests are plain `node:assert` scripts run by `node --test`. The UI smoke test runs in Electron.

**Spec:** `designs/dude-todo-board/README.md`, with the clickable prototype beside it (`Todo Board.html`, `board.jsx`, `board.css`, `app.jsx`). Serve with `python3 -m http.server 4311 --directory designs` and open `http://localhost:4311/dude-todo-board/Todo%20Board.html`. Visual values come from `designs/dude-design-system/` (the app's own CSS, extracted). `designs/` is untracked: keep it, don't delete it.

## Global Constraints

- Read `app/node_modules/solid-js/skills/solid-2.0/SKILL.md` and `app/node_modules/solid-js/CHEATSHEET.md` before writing Solid code (see `AGENTS.md`). In particular:
  - Read props as `props.x`; never destructure them.
  - `createEffect(compute, apply)` takes two functions.
  - Use `class={[...]}` / `class={{...}}`; never join class strings.
  - With default `<For>`, the item is a value and the index is an accessor.
- Follow the app's patterns:
  - Change `S` only inside `change()`, `on()` or `press()`.
  - Buttons use `onClick={press('name')}` with an `ACTIONS` entry in `events.ts`.
  - Text fields are read by the document-level `input` listener in `events.ts` through a `data-*` attribute (`data-todo="title"`), like `data-e` for events.
  - Settings and data go through `LS.get` / `LS.set`.
- No new dependencies.
- Copy is lowercase and terse, exactly as in the prototype:
  - Toasts: `todo on ${dayWord}.`; from mail: `['todo on ${dayWord}. ', '3', ' board']`; `saved.`; `saved. moved to ${dayWord}.`; `['done. ', 'Z', ' undo']`; `not done.`; `['moved to ${dayWord}. ', 'Z', ' undo']`; `['todo gone. ', 'Z', ' undo']`; `mail on todo.`; `todo need name.`; `when? like “fri” or “someday”`; `undone.`
  - Empty column: `nothing today.` for today, `nothing.` otherwise.
  - Placeholders: `what`, `when? today, fri, next week, someday`, `labels`, `add task`, `notes`, `todo? hit Enter.`; quick-add hint `shift+enter: open it`.
  - Buttons: `save` `nope` `delete`, `+ todo`, `attach mail`, `todo` (event form and reply bar).
  - Palette head: `attach mail` with placeholder `which? maya, poster, grant`.
- Keys:

| Key | Action |
|---|---|
| `3` (anywhere) | board |
| `1` / `2` | mail / week |
| `D` | new todo; from a mail, a todo with that mail |
| `E` | done toggle |
| `#` | delete |
| `Shift ←/→` | move a day |
| `← →` | change column |
| `↑ ↓` / `J K` | move between todos |
| `Enter` | open todo |
| `T` | this week |
| `-` / `=` | previous / next week |
| `Z` | undo |
| `Ctrl+Enter` | save |
| `Esc` | close |
| `Ctrl+Shift+M` | attach mail (form open) |

- Visuals: port `designs/dude-todo-board/board.css` into `app/web/style.css`. Swap design-system tokens for the app's variables and literals:

| Prototype token | App value |
|---|---|
| `--r-l` | `4px` |
| `--r-s` / `--r-m` | as they are (exist in the app) |
| `--bar-w` | `3px` |
| `--t-row` | `0.08s` |
| `--type-day` | `500 14px / 22px var(--sans)` |
| `--type-label` | `700 13px / 16px var(--sans)` |
| `--type-title-s` | `400 17px / 24px var(--sans)` |
| `--ev-edge` | `box-shadow: inset 3px 0 0 var(--ev-bar)`, under `:root:not(.carbon)` only |
| `--ev-text` | `#143a6b` light / `#e6ffa8` carbon |
| `--on-brand` | `#fff` light / `#000` carbon |

- Label colours: hue classes `.c0`…`.c5` on the label dot:

| Class | Light | Carbon |
|---|---|---|
| `c0` | `#1f5fae` | `#79b8ff` |
| `c1` | `#1a7f37` | `#56d364` |
| `c2` | `#7a3fbf` | `#d2a8ff` |
| `c3` | `#a14e00` | `#ffa657` |
| `c4` | `#b42318` | `#ff7b72` |
| `c5` | `var(--text-3)` | `var(--text-3)` |

- Both themes (light, carbon) must work. Narrow windows use the app's existing `@media (max-width: 1200px)` and `(max-width: 768px)`.
- Done means all of these pass: `cd app && npm run lint && npm test && npm run smoke`.

## Review Focus

- **An attached mail that has since moved** (marked done, trashed, deleted on another device): opening it from a todo must not throw. `openThread` already catches a failed load and toasts `no open: …`, and `Esc` must then return to the board. → smoke steps in Task 5.
- **Editing an old todo:** the "when" field is pre-filled with a past date (`nov 20`). `parseWhen` would read that as next year, so saving without touching "when" must keep the day. → `whenToDay` keep-day test in Task 1.
- **Labels typed in odd ways** (`Thesis`, ` #thesis `, `two words`, a duplicate): they must fold to one lowercase label and never duplicate. → `normLabel` / `addLabel` tests in Task 1.
- **Old or hand-edited `localStorage`:** a todo missing `tasks` / `mails` / `labels`, or not an object, must not crash the board. → `normTodo` test in Task 1.
- **Moving at the ends:** `Shift ←` on the first day, and `Shift →` on "someday", leave the todo where it is. → `moveDay` test in Task 1.

---

### Task 1: Todo model (pure)

**Files:**
- Create: `app/web/todos.ts`
- Test: `app/tests/web/todos.test.ts`

**Interfaces:**
- Consumes: `parseWhen(text, now, defaultHour?)` from `web/when.ts`; `Thread` from `web/api.ts`.
- Produces:
  - `export type TodoMail = Omit<Thread, 'atts' | 'prevFolder'>`
  - `export interface TodoTask { t: string; done: boolean }`
  - `export interface Todo { id: string; title: string; day: string | null; done: boolean; labels: string[]; mails: TodoMail[]; tasks: TodoTask[]; notes: string }`. `day` is a local `YYYY-MM-DD`, or `null` for someday.
  - `export interface Label { id: string; hue: number }` and `export const HUES = 6`
  - `dayKey(t: number): string`: local `YYYY-MM-DD`
  - `keyDay(k: string): number`: local midnight
  - `dayWord(k: string | null, now: Date): string`: `'someday' | 'today' | 'tomorrow' | 'mon'…'sun'`
  - `whenText(k: string | null, now: Date): string`: `'someday' | 'today' | 'tomorrow' | 'nov 27'`
  - `whenToDay(text: string, now: Date, keep?: string | null): { ok: boolean; day: string | null }`
  - `sortDay(list: Todo[]): Todo[]`: open todos first in stored order, then done
  - `normLabel(s: string): string`
  - `addLabel(labels: Label[], name: string): Label[]`
  - `normTodo(x: unknown): Todo | null`
  - `moveDay(cols: (string | null)[], day: string | null, d: -1 | 1): string | null`
  - `todoTitle(subject: string): string`
  - `mailRef(t: Thread): TodoMail`

- [ ] **Step 1: Write the failing test** `app/tests/web/todos.test.ts` (header comment `// Run: node tests/web/todos.test.ts`, like `when.test.ts`), with `now = new Date(2026, 10, 23, 9, 15)` (Mon 23 Nov 2026):

```ts
assert.strictEqual(dayKey(new Date(2026, 10, 23, 23, 59).getTime()), '2026-11-23');
assert.strictEqual(keyDay('2026-11-23'), new Date(2026, 10, 23).getTime());
assert.strictEqual(dayWord(null, now), 'someday');
assert.strictEqual(dayWord('2026-11-23', now), 'today');
assert.strictEqual(dayWord('2026-11-24', now), 'tomorrow');
assert.strictEqual(dayWord('2026-11-27', now), 'fri');
assert.strictEqual(whenText('2026-11-27', now), 'nov 27');
assert.deepStrictEqual(whenToDay('', now), { ok: true, day: null });
assert.deepStrictEqual(whenToDay('someday', now), { ok: true, day: null });
assert.deepStrictEqual(whenToDay('today', now), { ok: true, day: '2026-11-23' });
assert.deepStrictEqual(whenToDay('fri', now), { ok: true, day: '2026-11-27' });
assert.deepStrictEqual(whenToDay('nov 30', now), { ok: true, day: '2026-11-30' });
assert.deepStrictEqual(whenToDay('blah', now), { ok: false, day: null });
// an old todo keeps its day when "when" is saved untouched (parseWhen would say next year)
assert.deepStrictEqual(whenToDay(whenText('2026-11-20', now), now, '2026-11-20'), { ok: true, day: '2026-11-20' });
for (let i = 0; i < 300; i++) { const k = dayKey(now.getTime() + i * 864e5); assert.strictEqual(whenToDay(whenText(k, now), now).day, k); }
assert.strictEqual(normLabel(' #Thesis '), 'thesis');
assert.strictEqual(normLabel('two  words'), 'two-words');
assert.deepStrictEqual(addLabel([{ id: 'thesis', hue: 0 }], 'Thesis'), [{ id: 'thesis', hue: 0 }]);
assert.deepStrictEqual(addLabel([{ id: 'thesis', hue: 0 }], 'code'), [{ id: 'thesis', hue: 0 }, { id: 'code', hue: 1 }]);
assert.deepStrictEqual(normTodo({ id: 'a', title: 'x' }), { id: 'a', title: 'x', day: null, done: false, labels: [], mails: [], tasks: [], notes: '' });
assert.strictEqual(normTodo('junk'), null);
assert.strictEqual(normTodo({ title: 'no id' }), null);
const cols = ['2026-11-22', '2026-11-23', null];
assert.strictEqual(moveDay(cols, '2026-11-22', -1), '2026-11-22');
assert.strictEqual(moveDay(cols, null, 1), null);
assert.strictEqual(moveDay(cols, '2026-11-23', 1), null);
assert.deepStrictEqual(sortDay([{ ...t('a'), done: true }, t('b'), t('c')]).map((x) => x.id), ['b', 'c', 'a']); // t(id) = normTodo({ id, title: id })
assert.strictEqual(todoTitle('Re: Fwd: Poster layout'), 'Poster layout');
assert.strictEqual('atts' in mailRef({ ...thread, atts: [] }), false); // thread: a minimal Thread literal
console.log('todos ok');
```

- [ ] **Step 2: Run it.** Run `cd app && node tests/web/todos.test.ts`. Expected: FAIL, `Cannot find module '../../web/todos.ts'`.
- [ ] **Step 3: Implement `app/web/todos.ts`** with the exports above.
  - `whenToDay`: `''`, `someday`, `no day` and `later` mean `null`. If `keep !== undefined` and `text.trim() === whenText(keep, now)`, return `keep`. Otherwise use `parseWhen(text, now)` and take `dayKey(start)`; a `null` result is `{ ok: false, day: null }`.
  - `normLabel`: trim, drop a leading `#`, lowercase, collapse whitespace runs to `-`, cut at 24 characters.
  - A new label gets `hue = labels.length % HUES`.
- [ ] **Step 4: Run** `cd app && node tests/web/todos.test.ts`, then `npm run types`. Expected: `todos ok`, no type errors.
- [ ] **Step 5: Commit**: `git add app/web/todos.ts app/tests/web/todos.test.ts && git commit -m "Add the todo model: days, typed when, labels"`

### Task 2: The board screen (read-only)

**Files:**
- Create: `app/web/app/todo.ts`, `app/web/app/board.tsx`
- Modify:
  - `app/web/app/core.ts`: `State.screen` gets `'board'`. New `S` fields: `boardDay?: string | null` (the focused column), `todoSel?: string | null`.
  - `app/web/app/calendar.ts:59` and `:111`, and `app/web/app/render.tsx:301`: treat `S.screen === 'board'` like `'calendar'`, loading the week range and redrawing.
  - `app/web/app/week.tsx`: export `dayEvents`.
  - `app/web/app/render.tsx`:
    - In `Shell`, add a third rail button, `data-a="go-board"`, `<ic.check />`, `title="Todo board (3)"`, `class={{ on: S.screen === 'board' }}`. The mail button's `on` becomes `S.screen !== 'calendar' && S.screen !== 'board'`.
    - The main switch renders `<Board />` for `'board'`, with `{ 'main-cal': S.screen === 'calendar' || S.screen === 'board' }`.
    - `Pane()` renders nothing on `'board'` for now.
    - Add a `Board` button to the `.tabbar`.
  - `app/web/app/events.ts`: `ACTIONS['go-board']`. Key `3` in the mail switch and in the calendar block goes to `goBoard`. On the board, `1` goes to `leaveBoard('list')` and `2` goes to `leaveBoard('calendar')`.
  - `app/web/app/commands.ts`: `{ t: 'Open Board', k: ['3'], a: ['todo', 'tasks', 'kanban'], when: () => S.screen !== 'board', run: goBoard }`.
  - `app/web/style.css`: board section. Port `.tb*` rules from the prototype: header, columns, day heads, today wash, someday background, `.tb-card`, `.tb-ring`, `.tb-meta`, `.tb-lb` with `.c0`–`.c5`, `.tb-ev` variants, `.tb-empty`.
  - `app/tests/ui/smoke.ts`: steps below.

**Interfaces:**
- Consumes: Task 1 exports; `weekStartOf`, `addDays` and `dayEvents(t: number): CalItem[]` from `week.tsx`; `weekMove`, `calToday` and `ensureCalDay` from `calendar.ts`.
- Produces, in `todo.ts`:
  - `todos(): Todo[]`: `LS.get('todos', [])` mapped through `normTodo`, dropping nulls
  - `labels(): Label[]`: `LS 'todo:labels'`
  - `setTodos(next: Todo[]): void`
  - `boardCols(): (string | null)[]`: the week's days by `dayKey`, respecting `LS 'cal:weekends'`, plus `null`
  - `goBoard(): void`: like `goCal`. Stashes a reply, clears `S.composer` and `S.eventForm`, and sets `S.screen = 'board'`. If today is in the shown week, it sets `S.boardDay = dayKey(now())` and `S.todoSel` = the first open todo of that day (`sortDay`). Then `render()`.
  - `leaveBoard(to: 'list' | 'calendar'): void`
  - `seedDemo(): void`: in demo mode only (`B.demo`), when `localStorage` has no `dude:todos`. Writes three todos:
    - "Answer Maya on chapter 3": today, label `thesis`, mail = the `S.threads` row whose subject is `Draft of the thesis chapter 3`, tasks `add the missing baseline` (done) and `rerun eval`
    - "Print the poster": in 3 days, label `poster`, mail = `Re: Poster layout`
    - "Try modal editing everywhere": someday, no label
- Produces, in `board.tsx`: `Board`, `TodoCard`, `EventCard`.
  - `TodoCard`'s props: `{ todo: Todo; sel: boolean; draft?: boolean }`. It renders `div.tb-card` with `data-todo-id={props.todo.id}`, and the sender in the meta line is `span.ml`.
  - `EventCard`'s props: `{ ev: CalItem; day: string; done: boolean }`.

- [ ] **Step 1: Write the failing smoke steps.** Add after `['mail again', …]` in `STEPS`:

```ts
['board', `__key('3')`, '.tb-col.today', 400],
['board todos', '0', '.tb-card'],
['board events', '0', '.tb-ev'],
['board leaves', `__key('1')`, '.row', 300],
```

- [ ] **Step 2: Run** `cd app && npm run smoke`. Expected: FAIL at `board`, with "no .tb-col.today".
- [ ] **Step 3: Implement the board.**
  - Header (`.tb-h`): `today` (cal-btn), ‹ ›, title `Nov 22 – 28` (`Nov 29 – Dec 5` across months), grow, `+` (`title="New todo (D)"`), command icon.
  - One `section.tb-col` per `boardCols()` entry, with classes `today` / `past` / `someday` / `focus`.
  - Day head: `Mon 23`, plus the open-todo count in mono. The someday head reads `someday`.
  - The stack has, in order:
    - the day's events (all-day first, then by start), as `EventCard`
    - open todos, as `TodoCard`
    - an empty note when the day has neither
    - done todos
  - `TodoCard` shows the ring, the title, and a meta line: labels, the first mail's sender via `firstOf(m.from)` lowercased (`+n` for more), and task progress `n/m` (class `all` when every task is done).
  - Call `seedDemo()` from `goBoard()`.
- [ ] **Step 4: Run** `cd app && npm run lint && npm test && npm run smoke`. Expected: all pass. Open the web build in light and carbon and compare with the prototype.
- [ ] **Step 5: Commit**: `git commit -am "Show the week as a todo board (3)"` (after `git add` of the new files)

### Task 3: Working the board: tick, select, move, delete, undo, quick add, events

**Files:**
- Modify:
  - `app/web/app/todo.ts`
  - `app/web/app/board.tsx`
  - `app/web/app/core.ts`: `Undo` union gets `| { todos: Todo[] }`. New `S` fields: `boardAdd?: { day: string | null; text: string } | null` and `todoFresh?: string | null` (the card that just arrived, drawn with class `fresh`).
  - `app/web/app/actions.ts`: in `undo()`, handle `'todos' in u` with `LS.set('todos', u.todos)`, toast `undone.`, `render()`.
  - `app/web/app/events.ts`: board key block and `data-todo="quick"` input.
  - `app/web/app/commands.ts`
  - `app/web/style.css`
  - `app/tests/ui/smoke.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces, in `todo.ts`:
  - `setTodos(next: Todo[], undoable = true)`: replaces Task 2's version; pushes `{ todos: before }` onto `M.undo`
  - `toggleTodo(id: string): void`
  - `moveTodo(id: string, day: string | null): void`: moves the todo to the end of that day; sets `S.boardDay = day` and `S.todoSel = id`
  - `deleteTodo(id: string): void`
  - `quickAdd(day: string | null, title: string, open: boolean): void`
  - `evDone(): string[]`: `LS 'todo:evdone'`, entries `${day}|${ev.id}`
  - `toggleEvDone(day: string, ev: CalItem): void`
  - `boardKey(e: KeyboardEvent): boolean`: true when handled

- [ ] **Step 1: Write the failing smoke steps:**

```ts
['board again', `__key('3')`, '.tb-card.sel', 400],
['todo done', `__key('e')`, '.tb-card.done.sel'],
['todo undo', `__key('z')`, undefined, 300],
['todo move', `__key('ArrowRight', { shiftKey: true })`, '.tb-col.focus:not(.today) .tb-card.sel'],
['quick add', `__click('.tb-col.focus .tb-add')`, '[data-todo="quick"]'],
['quick type', `__type('[data-todo="quick"]', 'Buy paper')`],
['quick enter', `__key('Enter')`, '.tb-card.fresh'],
['quick close', `__key('Escape')`],
```

- [ ] **Step 2: Run** `npm run smoke`. Expected: FAIL at `board again` (no `.tb-card.sel`).
- [ ] **Step 3: Implement.**
  - `boardKey` runs in `events.ts` before the `if (S.screen === 'calendar')` block, when `S.screen === 'board'` and not typing:
    - `← →` change `S.boardDay` and select its first todo
    - `↑ ↓` / `j k` move `S.todoSel` within the column (`sortDay` order)
    - `Shift ← →` → `moveTodo(sel, moveDay(...))`
    - `e` / `x` → `toggleTodo`
    - `#` → `deleteTodo`
    - `t` → `calToday`; `-` / `=` → `weekMove`
    - `z` → `undo`; `?` → keys
  - Clicking a card's ring toggles done; clicking the card selects it (the form comes in Task 4).
  - Drag and drop: native `draggable` on `TodoCard`; `dragover` / `drop` on `.tb-col` calls `moveTodo`. A component-local `createSignal` holds the column being dragged over, shown as `.drop`.
  - `+ todo` sets `S.boardAdd`. In the quick-add input, `Enter` adds and stays open; `Shift+Enter` adds and opens (Task 4 wires the opening; until then it only adds); `Esc` closes. `+ todo` is hidden on past days.
  - Event cards get a ring for `toggleEvDone`. Clicking an event calls the existing `openEvent(id)`, and `Pane()` renders `<CalSide />` on the board when `S.eventForm` is set.
  - Add palette commands, each `when: () => S.screen === 'board' && !!S.todoSel`:
    - `Mark Todo Done` (E)
    - `Move Todo to Tomorrow`
    - `Move Todo to Someday`
    - `Delete Todo` (#)
- [ ] **Step 4: Run** `npm run lint && npm test && npm run smoke`. Expected: all pass.
- [ ] **Step 5: Commit**: `git commit -am "Tick, move, drag, delete and quick-add todos on the board"`

### Task 4: The todo form in the right pane

**Files:**
- Modify:
  - `app/web/app/core.ts`: add `export interface TodoForm { id?: string; orig?: string | null; title: string; when: string; labels: string[]; mails: TodoMail[]; tasks: TodoTask[]; notes: string; labelQ: string; taskQ: string; fromMail?: string; fresh?: boolean }` and `S.todoForm?: TodoForm | null`.
  - `app/web/app/todo.ts`, `app/web/app/board.tsx`
  - `app/web/app/render.tsx`: `Pane()` shows `<TodoPane />` whenever `S.todoForm` is set, on any screen, before the other branches.
  - `app/web/app/events.ts`: `data-todo` inputs and form keys.
  - `app/web/app/week.tsx`: the `todo` button in `EvBtns` from Task 3.
  - `app/web/app/commands.ts`: `New Todo` (D).
  - `app/web/style.css`
  - `app/tests/ui/smoke.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces, in `todo.ts`:
  - `openTodo(id: string): void`
  - `newTodo(day: string | null, extra?: Partial<TodoForm>): void`
  - `saveTodo(): void`
  - `closeTodo(): void`
  - `todoFormKey(e: KeyboardEvent): boolean`
- Produces, in `board.tsx`: `TodoPane`.

- [ ] **Step 1: Write the failing smoke steps:**

```ts
['new todo', `__key('d')`, '[data-todo="title"]', 300],
['todo title', `__type('[data-todo="title"]', 'Print poster')`],
['todo when', `__type('[data-todo="when"]', 'fri')`, '.tb-card.draft'],
['todo label', `__type('[data-todo="labelq"]', 'Poster')`],
['todo label add', `__key('Enter')`, '.tb-chip'],
['todo task', `__type('[data-todo="taskq"]', 'check margins')`],
['todo task add', `__key('Enter')`, '.tb-task'],
['todo save', `__key('Enter', { ctrlKey: true })`, '.tb-card.fresh', 300],
['todo open', `__key('Enter')`, '[data-todo="title"]', 300],
['todo close', `document.activeElement.blur(); __key('Escape')`],
```

- [ ] **Step 2: Run** `npm run smoke`. Expected: FAIL at `new todo`.
- [ ] **Step 3: Implement**, laid out like `EvForm` / `EvBtns` and reusing `.evform`, `.etitle`, `.evrow`, `.evparsed` and `.evbtns`:
  - **Title:** `.etitle` with `data-todo="title"` and placeholder `what`. It gets focus once when `fresh`, through `onSettled`, as in `eventDialog`.
  - **When:** an `evrow` with `ic.clock` and `data-todo="when"`. Under it, `.evparsed` shows `whenToDay(f.when, now, f.orig)`: the day as `Mon, Nov 23`, `someday ¯\_(ツ)_/¯`, or `when? “fri”, “tomorrow”, “nov 30”` when it doesn't parse.
  - **Labels:** an `evrow` with `ic.cmd`. Chips (`.tb-chip`, label dot, `✕` with `data-rmlabel`), then an input with `data-todo="labelq"` and placeholder `labels`. Below it, a `.sugg` list of matching labels plus `new label`. `Enter` or `,` adds through `addLabel` (saving `todo:labels`); `Backspace` on an empty input drops the last chip.
  - **Mail:** an `evrow` with `ic.mail`. Each mail is a `.tb-mail` row: bold first name, subject, and `✕` with `data-rmmail`. Clicking a row opens the mail (Task 5). Under them, an `attach mail` link (Task 5).
  - **Tasks:** an `evrow` with `ic.check`. Each task is a ring + text + `✕`; below them, an input with `data-todo="taskq"` and placeholder `add task`, where `Enter` adds.
  - **Notes:** an `evrow` with `ic.lines` and a textarea, `data-todo="notes"`.
  - **Buttons:** `.evbtns` with `save` (class `save`), `nope`, `delete` (existing todos only, colour `var(--now)`), and the hint `${MOD}+Enter · Esc`.
  - **Ghost card:** while `whenToDay(...).day !== f.orig`, the board shows a dashed `TodoCard draft` in the target column, and that column gets `.drop`.
  - **Saving:** `saveTodo` validates with the toasts `todo need name.` and `when? like “fri” or “someday”`, writes through `setTodos` (undoable), and toasts as listed in Global Constraints.
  - **Opening:** `Enter`, or a click on the card, opens it. `D` and the header `+` open `newTodo(S.boardDay === undefined ? dayKey(now()) : S.boardDay)`; `null` is the someday column, so keep it. Quick add's `Shift+Enter` opens the new todo. The event form's `todo` button calls `newTodo(dayKey(ev.start), { title: ev.title })`.
  - **Keys** (`todoFormKey`, checked in `onKey` right after the `S.eventForm` block): `Ctrl+Enter` saves, `Esc` closes.
  - **Below 1200px:** `.pane.todo-pane` is `position: fixed; top: 0; right: 0; bottom: 0; z-index: 25`, with `box-shadow: 0 0 30px rgba(0, 0, 0, 0.18)` in light. `.tb.editing .tb-cols` gets `padding-right: 398px` and `scroll-padding-right: 398px`.
  - **Below 768px:** `inset: 0 0 56px`, `width: auto`.
- [ ] **Step 4: Run** `npm run lint && npm test && npm run smoke`. Expected: all pass.
- [ ] **Step 5: Commit**: `git commit -am "Edit todos in the right pane: when, labels, tasks, notes"`

### Task 5: Mail and todos

**Files:**
- Modify:
  - `app/web/app/todo.ts`
  - `app/web/app/core.ts`: `M.threadFrom: 'board' | null`
  - `app/web/app/thread.ts`: in `closeThread`, go to `'board'` and clear `M.threadFrom` when it is `'board'`
  - `app/web/app/events.ts`: `case 'd'` in the mail switch; `Ctrl+Shift+M` in `todoFormKey`
  - `app/web/app/commands.ts`: palette mode `'attach'`; commands `Make Todo from Mail` (D) and `Attach Mail to Todo` (`Ctrl Shift M`)
  - `app/web/app/render.tsx`:
    - `HEADS.attach = ['mail', 'attach mail', 'which? maya, poster, grant']`
    - in the reply bar, `todo <span class="key">D</span>` with `data-a="todo"`
    - under the last message, a `div.invite.todo-of` block listing the todos that carry this thread: `todo` question, the title as a link that opens it on the board, and `dayWord` or `done` in mono
  - `app/web/app/board.tsx`, `app/tests/ui/smoke.ts`

**Interfaces:**
- Consumes: Task 4's `newTodo` and `openTodo`; `openThread`; `firstOf`; `listDate`; `fold`.
- Produces, in `todo.ts`:
  - `todoFromThread(t: Thread): void` → `newTodo(dayKey(now), { title: todoTitle(t.subject), mails: [mailRef(t)], fromMail: t.id })`
  - `attachMail(t: Thread): void`: skips a mail already attached by `id`; toasts `mail on todo.`
  - `openTodoMail(m: TodoMail): Promise<void>`
  - `todosOf(threadId: string): Todo[]`

- [ ] **Step 1: Write the failing smoke steps:**

```ts
['mail for todo', `__key('1')`, '.row', 300],
['open mail', `__key('Enter')`, '.msg', 500],
['todo from mail', `__key('d')`, '.tb-mail', 300],
['todo from mail save', `__key('Enter', { ctrlKey: true })`, '.todo-of', 300],
['attach on board', `__key('3')`, '.tb-card.sel', 400],
['attach open', `__key('Enter')`, '[data-todo="title"]', 300],
['attach picker', `document.activeElement.blur(); __key('M', { ctrlKey: true, shiftKey: true })`, '.cmd input'],
['attach pick', `__key('Enter')`, undefined, 300],
['attach close', `__key('Escape')`],
```

- [ ] **Step 2: Run** `npm run smoke`. Expected: FAIL at `todo from mail`.
- [ ] **Step 3: Implement.**
  - The `'attach'` palette mode lists `S.threads`, minus mails already on the form, matched with `fold` on subject + sender. Each item is `{ t: subject, lbl: `${firstOf(from)} · ${listDate(date)}`, run: () => attachMail(t) }`. ponytail: only the loaded folder's conversations; search the mailbox when that's too few.
  - `openTodoMail` sets `M.threadFrom = 'board'` when on the board, then `await openThread(m as Conv)`. If the thread fails to load, it toasts `mail no load.` and returns to the board.
  - The `.tb-meta` sender on a card opens the first mail; a `.tb-mail` row in the form opens that mail.
- [ ] **Step 4: Pin a mail that no longer exists.** Add smoke steps that put such a todo in storage. `LS.get` reads `localStorage` on every render, so a screen change shows it:

```ts
['stale todo', `const l = JSON.parse(localStorage.getItem('dude:todos')); l.push({ id: 'stale', title: 'stale', day: null, mails: [{ id: 'nope', folder: 'inbox', subject: 'gone', from: { name: 'Gone', address: 'g@x.example' }, to: [], date: 0, unread: false, starred: false, list: false, count: 1, snippet: '', size: 0 }] }); localStorage.setItem('dude:todos', JSON.stringify(l)); __key('1')`, '.row', 300],
['stale board', `__key('3')`, '[data-todo-id="stale"]', 400],
['stale open', `__click('[data-todo-id="stale"] .ml')`, undefined, 500],
['stale back', `__key('Escape')`, '.tb', 300],
```

Run `npm run smoke`. Expected: pass. The smoke test already fails on any uncaught error or console error.
- [ ] **Step 5: Run** `npm run lint && npm test && npm run smoke`, then commit: `git commit -am "Make todos from mail (D) and attach mail to todos"`

### Task 6: Label filter, keys sheet, docs

**Files:**
- Modify:
  - `app/web/app/board.tsx`: header filter chips
  - `app/web/app/core.ts`: `S.boardFilter?: string | null`
  - `app/web/app/render.tsx`: the `keyGroups()` 'Board' group, plus `['Make todo', 'D']` under Messages
  - `app/web/style.css`: `.tb-filters` scrolls in one line (`overflow-x: auto; scrollbar-width: none`); columns `scroll-snap`; the ≤768 stacked layout from the prototype (sticky `.tb-dh`, `.tb-cols { display: block }`, `padding-bottom: 56px`)
  - `app/web/app/todo.ts`: on narrow windows, scroll the board to today when it opens (`onSettled`, `scrollLeft` / `scrollTop` to `.tb-col.today`)
  - `README.md`: Features gets a **Todo board** line. Keys table: `3`, `D`. Privacy: todos are local, in the profile.
  - `app/tests/ui/smoke.ts`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces: nothing new for other tasks.

- [ ] **Step 1: Write the failing smoke steps:**

```ts
['board for filter', `__key('3')`, '.tb-filter', 300],
['board filter', `__click('.tb-filter')`, '.tb-filter.on'],
['keys board', `__key('?')`, '.keys h5'],
['keys has board', `if (![...document.querySelectorAll('.keys h5')].some((h) => h.textContent === 'Board')) throw new Error('no Board keys')`],
['keys board close', `__key('Escape')`],
```
- [ ] **Step 2: Run** `npm run smoke`. Expected: FAIL at `board filter`.
- [ ] **Step 3: Implement.**
  - A chip per label in use; click toggles `S.boardFilter`. Cards without the label are hidden; events stay.
  - Keys sheet group `Board`, rows:
    - `Open board` `3`
    - `Days / todos` `← → ↑ ↓`
    - `Open todo` `Enter`
    - `Done` `E`
    - `New todo` `D`
    - `Move a day` `Shift ← →`
    - `Delete` `#`
    - `This week` `T`
    - `Save` `${MOD} Enter`
  - Write the README lines.
- [ ] **Step 4: Run** `npm run lint && npm test && npm run smoke`. Then build (`npm run build`), serve `app/dist`, and check the demo at 1440, 1024 and 390px wide in light and carbon against the prototype. Expected: no overlap, today in view, form over the board below 1200px.
- [ ] **Step 5: Commit**: `git commit -am "Board label filter, keys, narrow windows, docs"`

---

## Decided here (the prototype's open questions)

- Unfinished todos don't roll over to today; the week arrows find them. Add rollover when it's missed.
- Event ticks are remembered (`LS 'todo:evdone'`).
- `D` is the todo key: it is unused in the app today.
- Todos are kept on this computer only (no Google Tasks / Microsoft To Do).
- The prototype's tweaks become fixed choices:
  - filled cards
  - events at the top of the day
  - label dots
  - the week follows the existing "weekends" calendar option
  - no right pane while nothing is open
