// ---------- the todo board: the week as columns, one per day plus someday ----------
// Each day holds its events (as the calendar draws them), then its open todos, then the done ones.

import { createMemo, For } from 'solid-js';
import { dayKey, HUES, keyDay, type Todo } from '../todos.ts';
import { MOD } from './commands.ts';
import { type CalItem, firstOf, fmtTime, now, S } from './core.ts';
import { press } from './events.ts';
import { ic } from './icons.tsx';
import { boardCols, labels, todos } from './todo.ts';
import { addDays, dayEvents, evCls, isAllDay, weekStartOf } from './week.tsx';

const Ring = (props: { on: boolean; title: string }) => (
  <button class={['tb-ring', { on: props.on }]} title={props.title} aria-pressed={props.on ? 'true' : 'false'}>
    ✓
  </button>
);

// a label: a dot in its hue (c0…c5) and its name
const LabelTag = (props: { id: string }) => (
  <span class="tb-lb">
    <i class={`c${labels().find((l) => l.id === props.id)?.hue ?? HUES - 1}`} />
    {props.id}
  </span>
);

// A todo: ring, title, then one mono line of labels · the mail's sender · tasks done.
export function TodoCard(props: { todo: Todo; sel: boolean; draft?: boolean }) {
  const t = () => props.todo;
  const ticked = () => t().tasks.filter((x) => x.done).length;
  return (
    <div class={['tb-card', { sel: props.sel, done: t().done, draft: props.draft }]} data-todo-id={t().id}>
      {props.draft ? <span /> : <Ring on={t().done} title={t().done ? 'Not done (E)' : 'Done (E)'} />}
      <div class="t">{t().title || 'new todo'}</div>
      {t().labels.length || t().mails.length || t().tasks.length ? (
        <div class="tb-meta">
          <For each={t().labels}>{(l) => <LabelTag id={l} />}</For>
          {t().mails.length ? (
            <span class="ml" title={`open: ${t().mails[0]?.subject}`}>
              <ic.mail />
              {`${firstOf(t().mails[0]?.from).toLowerCase()}${t().mails.length > 1 ? ` +${t().mails.length - 1}` : ''}`}
            </span>
          ) : null}
          {t().tasks.length ? (
            <span
              class={['pg', { all: ticked() === t().tasks.length }]}
              title={`${ticked()} of ${t().tasks.length} tasks done`}
            >
              <ic.check />
              {`${ticked()}/${t().tasks.length}`}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// An event of the day, in the calendar's fills: filled, outlined (kept here, unanswered), dashed (invite).
export function EventCard(props: { ev: CalItem; day: string; done: boolean }) {
  return (
    <div
      class={['tb-ev', evCls(props.ev), { allday: isAllDay(props.ev), done: props.done }]}
      title={`${props.ev.title}${props.ev.where ? ` · ${props.ev.where}` : ''}`}
    >
      {isAllDay(props.ev) ? null : <Ring on={props.done} title={props.done ? 'Not done' : 'Done'} />}
      <b>{props.ev.title}</b>
      {isAllDay(props.ev) ? null : (
        <span class="tm">{`${fmtTime(props.ev.start)}${props.ev.where ? ` · ${props.ev.where}` : ''}`}</span>
      )}
    </div>
  );
}

function Day(props: { k: string | null; today: string; todos: Todo[] }) {
  const open = () => props.todos.filter((t) => !t.done);
  const done = () => props.todos.filter((t) => t.done);
  const evs = () =>
    props.k === null
      ? []
      : dayEvents(keyDay(props.k)).sort((a, b) => Number(isAllDay(b)) - Number(isAllDay(a)) || a.start - b.start);
  const head = () => {
    if (props.k === null) {
      return 'someday';
    }
    const d = new Date(keyDay(props.k));
    return `${d.toLocaleDateString([], { weekday: 'short' })} ${d.getDate()}`;
  };
  return (
    <section
      class={[
        'tb-col',
        {
          today: props.k === props.today,
          past: props.k !== null && props.k < props.today,
          someday: props.k === null,
          focus: props.k === S.boardDay,
        },
      ]}
    >
      <div class="tb-dh">
        <span class="d">{head()}</span>
        {open().length ? <span class="n">{open().length}</span> : null}
      </div>
      <div class="tb-stack">
        <For each={evs()}>{(ev) => <EventCard ev={ev} day={props.k ?? ''} done={false} />}</For>
        {evs().length ? <div class="tb-gap" /> : null}
        <For each={open()} keyed={(t) => t.id}>
          {(t) => <TodoCard todo={t()} sel={t().id === S.todoSel} />}
        </For>
        {open().length || evs().length ? null : (
          <div class="tb-empty">{props.k === props.today ? 'nothing today.' : 'nothing.'}</div>
        )}
        {done().length ? <div class="tb-gap" /> : null}
        <For each={done()} keyed={(t) => t.id}>
          {(t) => <TodoCard todo={t()} sel={t().id === S.todoSel} />}
        </For>
      </div>
    </section>
  );
}

export function Board() {
  const all = createMemo(() => todos());
  const today = () => dayKey(now());
  const title = () => {
    const a = new Date(weekStartOf(S.calDay)),
      b = new Date(addDays(a.getTime(), 6));
    const md = (d: Date) => `${d.toLocaleDateString([], { month: 'short' })} ${d.getDate()}`;
    return `${md(a)} – ${a.getMonth() === b.getMonth() ? b.getDate() : md(b)}`;
  };
  return (
    <div class="tb">
      <header class="tb-h">
        <button class="cal-btn" data-a="cal-today" onClick={press('cal-today')} title="This week (T)">
          today
        </button>
        <button class="ibtn" data-a="wk-prev" onClick={press('wk-prev')} title="Previous week (-)">
          <ic.left />
        </button>
        <button class="ibtn" data-a="wk-next" onClick={press('wk-next')} title="Next week (=)">
          <ic.right />
        </button>
        <h1>{title()}</h1>
        <span class="grow" />
        <button class="ibtn" title="New todo (D)">
          +
        </button>
        <button class="ibtn" data-a="cmd" onClick={press('cmd')} title={`Command (${MOD}+K)`}>
          <ic.cmd />
        </button>
      </header>
      <div class="tb-cols">
        <For each={boardCols()}>{(k) => <Day k={k} today={today()} todos={all().filter((t) => t.day === k)} />}</For>
      </div>
    </div>
  );
}
