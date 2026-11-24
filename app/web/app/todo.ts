// ---------- the todo board: state and actions (board.tsx draws it, ../todos.ts is the model) ----------
// Todos are kept here (settings key "todos"), like events kept here. The board's week is the
// calendar's (S.calDay), so the week's buttons and keys work on it too.

import { onSettled, snapshot } from 'solid-js';
import type { Thread } from '../api.ts';
import {
  addLabel,
  dayKey,
  dayWord,
  type Label,
  mailRef,
  moveDay,
  normLabel,
  normTodo,
  sortDay,
  type Todo,
  type TodoMail,
  todoTitle,
  whenText,
  whenToDay,
} from '../todos.ts';
import { undo } from './actions.ts';
import { calToday, closeEvent, goCal, goMail, weekMove } from './calendar.ts';
import { leaveCompose, stashReply } from './compose.ts';
import { B, type CalItem, type Conv, dayStart, LS, M, now, root, S, type TodoForm, toast } from './core.ts';
import { ACTIONS } from './events.ts';
import { openCmd, render } from './render.tsx';
import { openThread } from './thread.ts';
import { addDays, weekDays } from './week.tsx';

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? v : []);

export function todos(): Todo[] {
  return list(LS.get('todos', [])).flatMap((x) => normTodo(x) ?? []);
}

/** the label filter, while some todo still wears that label */
export function boardFilter(): string | null {
  const f = S.boardFilter;
  return f && todos().some((t) => t.labels.includes(f)) ? f : null;
}

export function labels(): Label[] {
  return list<Label>(LS.get('todo:labels', []));
}

/** keeps the todos; Z brings back the ones before, unless not undoable. A change ends the last one's arrival. */
export function setTodos(next: Todo[], undoable = true) {
  if (undoable) {
    M.undo.push({ todos: todos() });
  }
  S.todoFresh = null;
  LS.set('todos', next);
}

export function toggleTodo(id: string) {
  const t = todos().find((x) => x.id === id);
  if (!t) {
    return;
  }
  setTodos(todos().map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  toast(t.done ? 'not done.' : ['done. ', 'Z', ' undo']);
}

/** to the end of that day, and the board follows it there */
export function moveTodo(id: string, day: string | null) {
  const t = todos().find((x) => x.id === id);
  if (!t || t.day === day) {
    return;
  }
  setTodos([...todos().filter((x) => x.id !== id), { ...t, day }]);
  S.boardDay = day;
  S.todoSel = id;
  if (S.todoForm?.id === id) {
    S.todoForm.orig = day; // the open form goes with it
    S.todoForm.when = whenText(day, new Date(now()));
  }
  toast([`moved to ${dayWord(day, new Date(now()))}. `, 'Z', ' undo']);
}

export function deleteTodo(id: string) {
  if (!todos().some((x) => x.id === id)) {
    return;
  }
  setTodos(todos().filter((x) => x.id !== id));
  if (S.todoForm?.id === id) {
    S.todoForm = null;
  }
  toast(['todo gone. ', 'Z', ' undo']);
}

/** "+ todo" under a day: Enter adds and stays open; Shift+Enter (open) adds and opens the todo */
export function quickAdd(day: string | null, title: string, open: boolean) {
  const id = `t${Date.now()}`;
  setTodos([
    ...todos(),
    {
      id,
      title,
      day,
      done: false,
      labels: boardFilter() ? [boardFilter() as string] : [],
      mails: [],
      tasks: [],
      notes: '',
    },
  ]);
  S.todoFresh = id;
  S.todoSel = id;
  S.boardDay = day;
  if (open) {
    S.boardAdd = null;
    openTodo(id);
  }
}

// ---------- the todo open in the right pane (board.tsx's TodoPane), like the event form ----------

/** the day the form's "when" puts the todo on; an old todo keeps its day while "when" is as it was */
export const formWhen = (f: TodoForm) => whenToDay(f.when, new Date(now()), f.orig);

function openForm(f: TodoForm) {
  if (S.eventForm) {
    closeEvent(); // one form in the pane at a time
  }
  S.todoForm = f;
  onSettled(() => {
    root.querySelector<HTMLInputElement>('[data-todo="title"]')?.focus();
  });
}

export function openTodo(id: string) {
  const t = todos().find((x) => x.id === id);
  if (!t) {
    return;
  }
  S.todoSel = id;
  S.boardDay = t.day;
  const { done: _done, day, ...rest } = t;
  openForm({ ...rest, orig: day, when: whenText(day, new Date(now())), labelQ: '', taskQ: '', fresh: true });
}

/** a new todo for that day (null: someday); one for a day gone by is for today */
export function newTodo(day: string | null, extra: Partial<TodoForm> = {}) {
  const today = dayKey(now()),
    d = day !== null && day < today ? today : day;
  openForm({
    title: '',
    when: whenText(d, new Date(now())),
    labels: boardFilter() ? [boardFilter() as string] : [],
    mails: [],
    tasks: [],
    notes: '',
    labelQ: '',
    taskQ: '',
    fresh: true,
    ...extra,
  });
}

export function closeTodo() {
  S.todoForm = null;
}

export function saveTodo() {
  const f = S.todoForm;
  if (!f) {
    return;
  }
  const w = formWhen(f);
  if (!f.title.trim()) {
    toast('todo need name.');
    root.querySelector<HTMLInputElement>('[data-todo="title"]')?.focus();
    return;
  }
  if (!w.ok) {
    toast('when? like “fri” or “someday”');
    return;
  }
  const d = snapshot(f),
    id = d.id ?? `t${Date.now()}`,
    old = todos().find((x) => x.id === id),
    t: Todo = {
      id,
      title: d.title.trim(),
      day: w.day,
      done: !!old?.done,
      labels: d.labels,
      mails: d.mails,
      tasks: d.tasks,
      notes: d.notes,
    };
  // the same day keeps its place; another day gets it at the end, as a move does
  setTodos(old?.day === t.day ? todos().map((x) => (x.id === id ? t : x)) : [...todos().filter((x) => x.id !== id), t]);
  if (!shown(t)) {
    S.boardFilter = null; // it lost the filter's label: show it
  }
  S.todoForm = null;
  S.todoFresh = id;
  S.todoSel = id;
  S.boardDay = t.day;
  const word = dayWord(t.day, new Date(now()));
  if (old) {
    toast(t.day !== old.day ? `saved. moved to ${word}.` : 'saved.');
  } else {
    toast(S.screen === 'board' ? `todo on ${word}.` : [`todo on ${word}. `, '3', ' board']);
  }
}

// ---------- todos and mail ----------

/** D on a mail: a todo for today, named after it, with the mail on it */
export function todoFromThread(t: Thread) {
  newTodo(dayKey(now()), { title: todoTitle(t.subject), mails: [mailRef(snapshot(t))], fromMail: t.id });
}

/** the mail picked in the palette (Ctrl+Shift+M) onto the open todo; once */
export function attachMail(t: Thread) {
  const f = S.todoForm;
  if (!f) {
    return;
  }
  if (!f.mails.some((m) => m.id === t.id)) {
    f.mails = [...f.mails, mailRef(snapshot(t))];
  }
  toast('mail on todo.');
}

/** a todo's mail, read as a conversation (whatever the list shows); Esc goes back to the board it was
 * opened from. One gone since (done, trashed, deleted elsewhere): openThread says "no open: …". */
export async function openTodoMail(m: TodoMail) {
  if (S.screen === 'board') {
    M.threadFrom = 'board';
  }
  await openThread(m as Conv, true);
}

/** the todos with this mail on them */
export const todosOf = (threadId: string) => todos().filter((t) => t.mails.some((m) => m.id === threadId));

export function takeLabel(id: string) {
  const f = S.todoForm;
  if (!f) {
    return;
  }
  LS.set('todo:labels', addLabel(labels(), id));
  if (!f.labels.includes(id)) {
    f.labels = [...f.labels, id];
  }
  f.labelQ = '';
}

// The form's keys, asked before the typing check: true when the key was one of them.
export function todoFormKey(e: KeyboardEvent): boolean {
  const f = S.todoForm,
    el = e.target as HTMLElement,
    k = e.key,
    field = el.dataset?.todo;
  if (!f || (!field && el.matches?.('input, textarea'))) {
    return false; // typing somewhere else (a reply, search): its own keys
  }
  if ((e.metaKey || e.ctrlKey) && k === 'Enter') {
    saveTodo();
  } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && k.toLowerCase() === 'm') {
    openCmd('attach');
  } else if (k === 'Escape') {
    closeTodo();
  } else if (field === 'labelq' && (k === 'Enter' || k === ',')) {
    const id = normLabel(f.labelQ); // what's typed, existing or new
    if (id && !f.labels.includes(id)) {
      takeLabel(id);
    } else {
      f.labelQ = ''; // nothing, or already on it
    }
  } else if (field === 'labelq' && k === 'Backspace' && !f.labelQ && f.labels.length) {
    f.labels = f.labels.slice(0, -1);
  } else if (field === 'taskq' && k === 'Enter' && f.taskQ.trim()) {
    f.tasks = [...f.tasks, { t: f.taskQ.trim(), done: false }];
    f.taskQ = '';
  } else {
    return false;
  }
  return true;
}

// Events ticked off on the board, as "day|event id" (settings key "todo:evdone").
export function evDone(): string[] {
  return list<string>(LS.get('todo:evdone', []));
}

export function toggleEvDone(day: string, ev: CalItem) {
  const k = `${day}|${ev.id}`;
  LS.set('todo:evdone', evDone().includes(k) ? evDone().filter((x) => x !== k) : [...evDone(), k]);
}

// The board's keys, asked first when nothing is being typed: true when the key was one of them.
export function boardKey(e: KeyboardEvent): boolean {
  const cols = boardCols(),
    sel = todos().find((t) => t.id === S.todoSel && cols.includes(t.day) && shown(t)); // only a todo on screen
  const inDay = () => sortDay(todos().filter((t) => t.day === S.boardDay && shown(t)));
  const pick = (d: -1 | 1) => {
    const l = inDay();
    if (l.length) {
      S.todoSel = l[Math.min(l.length - 1, Math.max(0, l.findIndex((t) => t.id === S.todoSel) + d))].id;
    }
  };
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowRight': {
      const d = e.key === 'ArrowLeft' ? -1 : 1;
      if (e.shiftKey) {
        if (sel) {
          moveTodo(sel.id, moveDay(cols, sel.day, d));
        }
      } else {
        const i = cols.indexOf(S.boardDay as string | null); // -1 when unset or another week
        S.boardDay = i < 0 ? cols[0] : moveDay(cols, cols[i], d);
        S.todoSel = inDay()[0]?.id ?? null;
      }
      return true;
    }
    case 'ArrowDown':
    case 'j':
      pick(1);
      return true;
    case 'ArrowUp':
    case 'k':
      pick(-1);
      return true;
    case 'Enter':
      if (!sel) {
        return false; // a focused button's own
      }
      openTodo(sel.id);
      return true;
    case 'd':
      ACTIONS['new-todo']();
      return true;
    case 'e':
    case 'x':
      if (sel) {
        toggleTodo(sel.id);
      }
      return true;
    case '#':
      if (sel) {
        deleteTodo(sel.id);
      }
      return true;
    case 't':
    case 'T':
      calToday();
      return true;
    case '-':
      weekMove(-1);
      return true;
    case '=':
      weekMove(1);
      return true;
    case 'z':
      void undo();
      return true;
    case 'Escape':
      S.boardAdd = null; // a quick add left open
      return true;
    case '?':
      ACTIONS.keys();
      return true;
    case '1':
      leaveBoard('list');
      return true;
    case '2':
      leaveBoard('calendar');
      return true;
  }
  return false;
}

/** the board's columns: the week's days (weekends as the calendar shows them), then someday */
/** a todo the label filter lets through */
export const shown = (t: Todo) => !boardFilter() || t.labels.includes(boardFilter() as string);

export function boardCols(): (string | null)[] {
  return [...weekDays().map(dayKey), null];
}

// The board is the third screen beside mail and the week: 3 (goCal / goMail in calendar.ts know it).
export function goBoard() {
  if (S.screen === 'board') {
    return;
  }
  if (S.screen === 'compose') {
    leaveCompose();
  }
  if (S.screen === 'thread') {
    stashReply();
    M.threadFrom = null; // left by another way than Esc
  }
  if (S.screen !== 'calendar') {
    M.calFrom = { screen: S.screen === 'thread' ? 'thread' : 'list', open: S.open, msgs: S.msgs };
  }
  S.composer = null;
  S.eventForm = null;
  S.screen = 'board';
  seedDemo();
  const today = dayKey(now());
  if (boardCols().includes(today)) {
    S.boardDay = today;
    S.todoSel = todos().find((t) => t.day === today && !t.done)?.id ?? null;
  }
  render();
  // narrow windows open on today, not on a past Sunday (only when it scrolls, and today is shown)
  onSettled(() => {
    const cols = root.querySelector<HTMLElement>('.tb-cols'),
      el = cols?.querySelector<HTMLElement>('.tb-col.today');
    if (cols && el && cols.scrollWidth + cols.scrollHeight > cols.clientWidth + cols.clientHeight) {
      cols.scrollLeft = el.offsetLeft - cols.offsetLeft;
      cols.scrollTop = el.offsetTop - cols.offsetTop;
    }
  });
}

export function leaveBoard(to: 'list' | 'calendar') {
  if (to === 'calendar') {
    goCal();
  } else {
    goMail();
  }
}

// The demo's first look at the board: a few todos, two of them on mails in the demo inbox.
export function seedDemo() {
  if (!B.demo || LS.get('todos', null) !== null) {
    return;
  }
  const mail = (subject: string) => {
    const t = S.threads.find((x) => x.subject === subject);
    return t ? [mailRef(t)] : [];
  };
  const today = dayStart(now());
  const todo = (t: Partial<Todo> & Pick<Todo, 'id' | 'title'>): Todo => ({
    day: null,
    done: false,
    labels: [],
    mails: [],
    tasks: [],
    notes: '',
    ...t,
  });
  LS.set('todo:labels', addLabel(addLabel(labels(), 'thesis'), 'poster'));
  LS.set('todos', [
    todo({
      id: 'demo1',
      title: 'Answer Maya on chapter 3',
      day: dayKey(today),
      labels: ['thesis'],
      mails: mail('Draft of the thesis chapter 3'),
      tasks: [
        { t: 'add the missing baseline', done: true },
        { t: 'rerun eval', done: false },
      ],
    }),
    todo({
      id: 'demo2',
      title: 'Print the poster',
      day: dayKey(addDays(today, 3)),
      labels: ['poster'],
      mails: mail('Re: Poster layout'),
    }),
    todo({ id: 'demo3', title: 'Try modal editing everywhere' }),
  ]);
}
