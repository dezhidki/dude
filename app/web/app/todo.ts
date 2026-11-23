// ---------- the todo board: state and actions (board.tsx draws it, ../todos.ts is the model) ----------
// Todos are kept here (settings key "todos"), like events kept here. The board's week is the
// calendar's (S.calDay), so the week's buttons and keys work on it too.

import { addLabel, dayKey, type Label, mailRef, normTodo, type Todo } from '../todos.ts';
import { goCal, goMail } from './calendar.ts';
import { leaveCompose, stashReply } from './compose.ts';
import { B, dayStart, LS, M, now, S } from './core.ts';
import { render } from './render.tsx';
import { addDays, weekDays } from './week.tsx';

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? v : []);

export function todos(): Todo[] {
  return list(LS.get('todos', [])).flatMap((x) => normTodo(x) ?? []);
}

export function labels(): Label[] {
  return list<Label>(LS.get('todo:labels', []));
}

export function setTodos(next: Todo[]) {
  LS.set('todos', next);
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
