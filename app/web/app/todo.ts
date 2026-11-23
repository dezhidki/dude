// ---------- the todo board: state and actions (board.tsx draws it, ../todos.ts is the model) ----------
// Todos are kept here (settings key "todos"), like events kept here. The board's week is the
// calendar's (S.calDay), so the week's buttons and keys work on it too.

import { addLabel, dayKey, dayWord, type Label, mailRef, moveDay, normTodo, sortDay, type Todo } from '../todos.ts';
import { undo } from './actions.ts';
import { calToday, goCal, goMail, weekMove } from './calendar.ts';
import { leaveCompose, stashReply } from './compose.ts';
import { B, type CalItem, dayStart, LS, M, now, S, toast } from './core.ts';
import { ACTIONS } from './events.ts';
import { render } from './render.tsx';
import { addDays, weekDays } from './week.tsx';

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? v : []);

export function todos(): Todo[] {
  return list(LS.get('todos', [])).flatMap((x) => normTodo(x) ?? []);
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
  toast([`moved to ${dayWord(day, new Date(now()))}. `, 'Z', ' undo']);
}

export function deleteTodo(id: string) {
  if (!todos().some((x) => x.id === id)) {
    return;
  }
  setTodos(todos().filter((x) => x.id !== id));
  toast(['todo gone. ', 'Z', ' undo']);
}

/** "+ todo" under a day: Enter adds and stays open; Shift+Enter (open) adds and closes it, to open the todo */
export function quickAdd(day: string | null, title: string, open: boolean) {
  const id = `t${Date.now()}`;
  setTodos([...todos(), { id, title, day, done: false, labels: [], mails: [], tasks: [], notes: '' }]);
  S.todoFresh = id;
  S.todoSel = id;
  S.boardDay = day;
  if (open) {
    S.boardAdd = null;
  }
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
    sel = todos().find((t) => t.id === S.todoSel && cols.includes(t.day)); // only a todo on screen
  const inDay = () => sortDay(todos().filter((t) => t.day === S.boardDay));
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
