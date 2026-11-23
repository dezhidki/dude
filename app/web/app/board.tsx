// ---------- the todo board: the week as columns, one per day plus someday ----------
// Each day holds its events (as the calendar draws them), then its open todos and "+ todo", then the
// done ones. Cards drag to another day.

import { createMemo, createSignal, For, onSettled } from 'solid-js';
import { dayKey, HUES, keyDay, type Todo } from '../todos.ts';
import { openEvent } from './calendar.ts';
import { MOD } from './commands.ts';
import { type CalItem, firstOf, fmtTime, now, on, root, S } from './core.ts';
import { press } from './events.ts';
import { ic } from './icons.tsx';
import { boardCols, evDone, labels, moveTodo, todos, toggleEvDone, toggleTodo } from './todo.ts';
import { addDays, dayEvents, evCls, isAllDay, weekStartOf } from './week.tsx';

const DRAG = 'application/x-dude-todo'; // what a dragged card carries: its id

// the tick: a click on it is its own, not the card's
const Ring = (props: { on: boolean; title: string; onClick: () => void }) => (
  <button
    class={['tb-ring', { on: props.on }]}
    title={props.title}
    aria-pressed={props.on ? 'true' : 'false'}
    onClick={on((e: MouseEvent) => {
      e.stopPropagation();
      props.onClick();
    })}
  >
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
  const [dragging, setDragging] = createSignal(false);
  return (
    <div
      class={[
        'tb-card',
        { sel: props.sel, done: t().done, draft: props.draft, fresh: S.todoFresh === t().id, dragging: dragging() },
      ]}
      data-todo-id={t().id}
      draggable={props.draft ? 'false' : 'true'}
      onDragStart={(e) => {
        e.dataTransfer?.setData(DRAG, props.todo.id);
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
        }
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={on(() => {
        S.todoSel = props.todo.id;
        S.boardDay = props.todo.day;
      })}
    >
      {props.draft ? (
        <span />
      ) : (
        <Ring on={t().done} title={t().done ? 'Not done (E)' : 'Done (E)'} onClick={() => toggleTodo(props.todo.id)} />
      )}
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
      class={[
        'tb-ev',
        evCls(props.ev),
        { allday: isAllDay(props.ev), done: props.done, sel: S.eventForm?.id === String(props.ev.id) },
      ]}
      title={`${props.ev.title}${props.ev.where ? ` · ${props.ev.where}` : ''}`}
      onClick={on(() => openEvent(String(props.ev.id || '')))}
    >
      {isAllDay(props.ev) ? null : (
        <Ring
          on={props.done}
          title={props.done ? 'Not done' : 'Done'}
          onClick={() => toggleEvDone(props.day, props.ev)}
        />
      )}
      <b>{props.ev.title}</b>
      {isAllDay(props.ev) ? null : (
        <span class="tm">{`${fmtTime(props.ev.start)}${props.ev.where ? ` · ${props.ev.where}` : ''}`}</span>
      )}
    </div>
  );
}

function Day(props: { k: string | null; today: string; todos: Todo[] }) {
  const open = () => props.todos.filter((t) => !t.done);
  const adding = () => !!S.boardAdd && S.boardAdd.day === props.k;
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
  const [over, setOver] = createSignal(false); // a card is being dragged over this day
  return (
    <section
      class={[
        'tb-col',
        {
          today: props.k === props.today,
          past: props.k !== null && props.k < props.today,
          someday: props.k === null,
          focus: props.k === S.boardDay,
          drop: over(),
        },
      ]}
      onDragOver={(e) => {
        if (e.dataTransfer?.types.includes(DRAG)) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOver(false);
        }
      }}
      onDrop={on((e: DragEvent) => {
        setOver(false);
        const id = e.dataTransfer?.getData(DRAG);
        if (id) {
          e.preventDefault();
          moveTodo(id, props.k);
        }
      })}
    >
      <div class="tb-dh">
        <span class="d">{head()}</span>
        {open().length ? <span class="n">{open().length}</span> : null}
      </div>
      <div class="tb-stack">
        <For each={evs()}>
          {(ev) => <EventCard ev={ev} day={props.k ?? ''} done={evDone().includes(`${props.k}|${ev.id}`)} />}
        </For>
        {evs().length ? <div class="tb-gap" /> : null}
        <For each={open()} keyed={(t) => t.id}>
          {(t) => <TodoCard todo={t()} sel={t().id === S.todoSel} />}
        </For>
        {open().length || evs().length || adding() ? null : (
          <div class="tb-empty">{props.k === props.today ? 'nothing today.' : 'nothing.'}</div>
        )}
        {adding() ? (
          <>
            <input class="tb-addin" data-todo="quick" placeholder="todo? hit Enter." aria-label="New todo" />
            <div class="tb-hint">shift+enter: open it</div>
          </>
        ) : (
          <button
            class="tb-add"
            title="Add a todo here"
            onClick={on(() => {
              S.boardAdd = { day: props.k, text: '' };
              S.boardDay = props.k;
              onSettled(() => {
                root.querySelector<HTMLInputElement>('[data-todo="quick"]')?.focus();
              });
            })}
          >
            + todo
          </button>
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
