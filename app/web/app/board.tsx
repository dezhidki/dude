// ---------- the todo board: the week as columns, one per day plus someday ----------
// Each day holds its events (as the calendar draws them), then its open todos and "+ todo", then the
// done ones. Cards drag to another day. A todo opens in the right pane (TodoPane).

import { createMemo, createSignal, For, onSettled } from 'solid-js';
import { dayKey, HUES, keyDay, labelChoices, normLabel, type Todo } from '../todos.ts';
import { openEvent } from './calendar.ts';
import { MOD } from './commands.ts';
import { type CalItem, firstOf, fmtTime, nameOf, now, on, root, S, type TodoForm } from './core.ts';
import { press } from './events.ts';
import { ic } from './icons.tsx';
import {
  boardCols,
  boardFilter,
  evDone,
  formWhen,
  labels,
  moveTodo,
  openTodo,
  openTodoMail,
  shown,
  takeLabel,
  todos,
  toggleEvDone,
  toggleTodo,
} from './todo.ts';
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
      onClick={on(() => openTodo(props.todo.id))}
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
            <span
              class="ml"
              title={`open: ${t().mails[0]?.subject}`}
              onClick={on((e: MouseEvent) => {
                e.stopPropagation(); // the mail, not the todo
                const m = props.todo.mails[0];
                if (m) {
                  void openTodoMail(m);
                }
              })}
            >
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
  // the todo open in the pane, drawn dashed where its "when" puts it (when that's another day)
  const ghost = () => {
    const f = S.todoForm,
      w = f && formWhen(f);
    return f && w?.ok && w.day !== f.orig && w.day === props.k ? f : null;
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
          drop: over() || !!ghost(),
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
        {ghost() ? (
          <TodoCard todo={{ ...(ghost() as TodoForm), id: 'draft', day: props.k, done: false }} sel={false} draft />
        ) : null}
        {open().length || evs().length || adding() || ghost() ? null : (
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
  const used = () => labels().filter((l) => all().some((t) => t.labels.includes(l.id)));
  return (
    <div class={['tb', { editing: !!S.todoForm }]}>
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
        <div class="tb-filters">
          <For each={used()}>
            {(l) => (
              <button
                class={['tb-filter', { on: boardFilter() === l.id }]}
                title={boardFilter() === l.id ? 'Show all' : `Only ${l.id}`}
                aria-pressed={boardFilter() === l.id ? 'true' : 'false'}
                onClick={on(() => {
                  S.boardFilter = boardFilter() === l.id ? null : l.id;
                })}
              >
                <LabelTag id={l.id} />
              </button>
            )}
          </For>
        </div>
        <button class="ibtn" data-a="new-todo" onClick={press('new-todo')} title="New todo (D)">
          +
        </button>
        <button class="ibtn" data-a="cmd" onClick={press('cmd')} title={`Command (${MOD}+K)`}>
          <ic.cmd />
        </button>
      </header>
      <div class="tb-cols">
        <For each={boardCols()}>
          {(k) => <Day k={k} today={today()} todos={all().filter((t) => t.day === k && shown(t))} />}
        </For>
      </div>
    </div>
  );
}

const NONE: TodoForm = { title: '', when: '', labels: [], mails: [], tasks: [], notes: '', labelQ: '', taskQ: '' };

// what "when" reads as: the day, someday, or what to type
function whenRead(f: TodoForm) {
  const w = formWhen(f);
  if (!w.ok) {
    return 'when? “fri”, “tomorrow”, “nov 30”';
  }
  return w.day === null
    ? 'someday ¯\\_(ツ)_/¯'
    : new Date(keyDay(w.day)).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// The todo open in the right pane, laid out like the event form: what, when (read back under it),
// labels, mail, tasks, notes; then save · nope · delete. The fields' text is kept in S.todoForm as
// it's typed (events.ts), and its keys are todoFormKey's.
export function TodoPane() {
  const f = () => S.todoForm ?? NONE; // NONE only while the pane goes away
  const from = () => (f().fromMail ? f().mails.find((m) => m.id === f().fromMail) : undefined); // made from it
  const typed = () => normLabel(f().labelQ),
    choices = () => labelChoices(labels(), f().labelQ, f().labels);
  const remove = (fn: (t: TodoForm) => void) =>
    on((e: MouseEvent) => {
      e.stopPropagation();
      if (S.todoForm) {
        fn(S.todoForm);
      }
    });
  return (
    <aside class="pane todo-pane">
      <div class={['evform tb-form', { fresh: !!f().fresh }]}>
        {from() ? <div class="tb-from">{`from mail · ${nameOf(from()?.from)}`}</div> : null}
        <input class="etitle" data-todo="title" value={f().title} placeholder="what" aria-label="Todo" />
        <label class="evrow">
          <span>
            <ic.clock />
          </span>
          <input
            data-todo="when"
            value={f().when}
            placeholder="when? today, fri, next week, someday"
            aria-label="When"
            autocomplete="off"
          />
        </label>
        <div class="evparsed">{whenRead(f())}</div>
        <div class="evrow">
          <span>
            <ic.cmd />
          </span>
          <div class="tb-row-body tb-chips">
            <For each={f().labels}>
              {(l) => (
                <span class="tb-chip">
                  <LabelTag id={l} />
                  <button
                    data-rmlabel={l}
                    title="remove"
                    aria-label={`remove ${l}`}
                    onClick={remove((t) => {
                      t.labels = t.labels.filter((x) => x !== l);
                    })}
                  >
                    ✕
                  </button>
                </span>
              )}
            </For>
            <input
              data-todo="labelq"
              value={f().labelQ}
              placeholder={f().labels.length ? '' : 'labels'}
              aria-label="Add label"
              autocomplete="off"
            />
            {choices().length ? (
              <div class="sugg" role="listbox">
                <For each={choices()}>
                  {(id) => (
                    // biome-ignore lint/a11y/useFocusableInteractive: focus stays in the field; Enter takes what's typed
                    <div
                      class={['sg', { on: id === typed() }]}
                      role="option"
                      aria-selected={id === typed() ? 'true' : 'false'}
                      onMouseDown={on((e: MouseEvent) => {
                        e.preventDefault(); // the field keeps the focus
                        takeLabel(id);
                      })}
                    >
                      {labels().some((l) => l.id === id) ? (
                        <LabelTag id={id} />
                      ) : (
                        <>
                          <b>{id}</b>
                          <span>new label</span>
                        </>
                      )}
                    </div>
                  )}
                </For>
              </div>
            ) : null}
          </div>
        </div>
        <div class="evrow">
          <span>
            <ic.mail />
          </span>
          <div class="tb-row-body tb-mails">
            <For each={f().mails}>
              {(m) => (
                <div class="tb-mail" title={`open: ${m.subject}`} onClick={on(() => openTodoMail(m))}>
                  <b>{firstOf(m.from)}</b>
                  <span>{m.subject}</span>
                  <button
                    data-rmmail={m.id}
                    title="take off"
                    aria-label={`take off ${m.subject}`}
                    onClick={remove((t) => {
                      t.mails = t.mails.filter((x) => x.id !== m.id);
                    })}
                  >
                    ✕
                  </button>
                </div>
              )}
            </For>
            <button
              class="tb-link"
              data-a="attach-mail"
              onClick={press('attach-mail')}
              title="Attach mail (Ctrl+Shift+M)"
            >
              attach mail
            </button>
          </div>
        </div>
        <div class="evrow">
          <span>
            <ic.check />
          </span>
          <div class="tb-row-body tb-tasks">
            <For each={f().tasks}>
              {(x, i) => (
                <div class={['tb-task', { done: x.done }]}>
                  <Ring
                    on={x.done}
                    title={x.done ? 'Not done' : 'Done'}
                    onClick={() => {
                      x.done = !x.done;
                    }}
                  />
                  <span>{x.t}</span>
                  <button
                    title="remove"
                    aria-label={`remove ${x.t}`}
                    onClick={remove((t) => {
                      t.tasks = t.tasks.filter((_, j) => j !== i());
                    })}
                  >
                    ✕
                  </button>
                </div>
              )}
            </For>
            <input
              class="tb-taskin"
              data-todo="taskq"
              value={f().taskQ}
              placeholder="add task"
              aria-label="Add task"
              autocomplete="off"
            />
          </div>
        </div>
        <label class="evrow">
          <span>
            <ic.lines />
          </span>
          <textarea class="tb-notes" data-todo="notes" value={f().notes} placeholder="notes" aria-label="Notes" />
        </label>
      </div>
      <div class="evbtns">
        <button class="save" data-a="save-todo" onClick={press('save-todo')}>
          save
        </button>
        <button data-a="close-todo" onClick={press('close-todo')}>
          nope
        </button>
        {f().id ? (
          <button data-a="delete-todo" onClick={press('delete-todo')} title="Delete todo">
            delete
          </button>
        ) : null}
        <span>{`${MOD}+Enter · Esc`}</span>
      </div>
    </aside>
  );
}
