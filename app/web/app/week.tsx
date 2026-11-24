// ---------- the whole calendar: a week ----------

import { For } from 'solid-js';
import type { Answer } from '../api.ts';
import { answerEvent, calKey, events, eventTimes, invOf, openEvent, startDrag } from './calendar.ts';
import { MOD } from './commands.ts';
import { type CalItem, DAY, dayStart, type EventForm, fmtTime, fullDate, LS, linkify, M, now, on, S } from './core.ts';
import { press } from './events.ts';
import { ic } from './icons.tsx';
import { render, Sugg } from './render.tsx';

export const HPX = 44; // one hour, in pixels

export const addDays = (t: number, n: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

export const dayEnd = (t: number) => addDays(dayStart(t), 1);
const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;

const tzName = (t: number) =>
  new Intl.DateTimeFormat([], { timeZoneName: 'short' })
    .formatToParts(new Date(t))
    .find((x) => x.type === 'timeZoneName')?.value || '';

const weekStartsOn = () => (LS.get('cal:monday', false) ? 1 : 0);

export const weekStartOf = (t: number) => {
  const d = new Date(dayStart(t));
  d.setDate(d.getDate() - ((d.getDay() - weekStartsOn() + 7) % 7));
  return d.getTime();
};

export const isAllDay = (x: CalItem) => !!x.allDay || x.end - x.start >= DAY;
const fmtRange = (a: number, b: number) => `${fullDate(a)} – ${fmtTime(b)}`;

export function weekDays() {
  const ws = weekStartOf(S.calDay),
    all = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  return LS.get('cal:weekends', true)
    ? all
    : all.filter((t) => {
        const g = new Date(t).getDay();
        return g !== 0 && g !== 6;
      });
}

// What's on a day: your calendar, events kept here, and an invitation you're reading.
export function dayEvents(t: number): CalItem[] {
  const e = dayEnd(t),
    f = S.eventForm,
    declined = LS.get('cal:declined', false);
  const server = S.cal.days.get(calKey(t))?.list || [];
  const inv = invOf(),
    ghost =
      inv && !server.some((x) => Math.abs(x.start - (inv.start as number)) < 60e3 && x.title === inv.title)
        ? [
            {
              id: 'inv',
              title: inv.title as string,
              start: inv.start as number,
              end: inv.end as number,
              where: inv.where,
              allDay: inv.allDay,
              invite: true,
            } as CalItem,
          ]
        : [];
  return [...server, ...events(), ...ghost].filter(
    (x) =>
      x.start < e &&
      x.end > t &&
      !x.cancelled &&
      (declined || x.response !== 'Decline') &&
      !(f?.id && !f.readOnly && x.id === f.id && S.screen !== 'board'), // the week draws it where it's going
  );
}

const Chip = (props: { x: CalItem }) => (
  <span
    class={['cal-chip', { inv: props.x.invite }]}
    data-ev={String(props.x.id || '')}
    title={props.x.title}
    onClick={on(() => openEvent(String(props.x.id || '')))}
  >
    {props.x.title}
  </span>
);

// How an event is drawn: an invitation being read, kept here, waiting for your answer, declined.
export function evCls(x: CalItem) {
  const pend = x.isMeeting && !x.isOrganizer && /NoResponse|Unknown|Tentative/.test(x.response || '');
  return {
    inv: x.invite,
    local: !x.invite && !x.server,
    pending: !x.invite && x.server && pend,
    declined: x.response === 'Decline',
  };
}

// The events of a day as blocks in their hours; ones at the same time share the width.
function blocks(t: number, list: CalItem[]) {
  const timed = list.filter((x) => !isAllDay(x)).sort((a, b) => a.start - b.start || b.end - a.end);
  const lanes: number[] = [];
  timed.forEach((x) => {
    let l = lanes.findIndex((v) => v <= x.start);
    if (l < 0) {
      l = lanes.length;
      lanes.push(0);
    }
    lanes[l] = x.end;
    x._lane = l;
  });
  return timed.map((x) => {
    const lane = x._lane as number,
      n = timed
        .filter((o) => o.start < x.end && o.end > x.start)
        .reduce((m, o) => Math.max(m, (o._lane as number) + 1), 1),
      w = 100 / n;
    const cls = { ...evCls(x), short: ((x.end - x.start) / 3600e3) * HPX < 30 };
    return {
      x,
      cls,
      style: `${pos(t, x.start, x.end)};left:calc(${lane * w}% + 2px);right:auto;width:calc(${w}% - 4px)`,
      title: `${x.title}${x.where ? ` · ${x.where}` : ''}${x.organizer ? ` · ${x.organizer}` : ''}`,
    };
  });
}

const pos = (t: number, a: number, b: number) =>
  `top:${Math.max(0, ((a - t) / 3600e3) * HPX)}px;height:${Math.max(15, ((Math.min(b, dayEnd(t)) - Math.max(a, t)) / 3600e3) * HPX - 2)}px`;

// a day's blocks, the event being written, and the line at now
function Blocks(props: { t: number; list: CalItem[] }) {
  const ft = () => {
    const f = S.eventForm;
    return f && !f.readOnly ? eventTimes(f) : null;
  };
  const d = () => ft() as ReturnType<typeof eventTimes>; // read only where ft() is set
  return (
    <>
      <For each={blocks(props.t, props.list)}>
        {(b) => (
          <div
            class={['cal-ev', b.cls]}
            data-ev={String(b.x.id || '')}
            style={b.style}
            title={b.title}
            onClick={on(() => openEvent(String(b.x.id || '')))}
          >
            <b>{b.x.title}</b>
            {` ${fmtTime(b.x.start)} – ${fmtTime(b.x.end)}${b.x.where ? ` · ${b.x.where}` : ''}`}
          </div>
        )}
      </For>
      {ft()?.ok && d().start < dayEnd(props.t) && d().end > props.t ? (
        <div
          class="cal-ev draft"
          style={`${pos(props.t, d().start, d().end)};left:2px;right:auto;width:calc(100% - 4px)`}
        >
          <b>{S.eventForm?.title || 'new event'}</b>
          {` ${fmtTime(d().start)} – ${fmtTime(d().end)}`}
        </div>
      ) : null}
      {now() >= props.t && now() < dayEnd(props.t) ? (
        <div class="cal-now" style={`top:${((now() - props.t) / 3600e3) * HPX}px`} />
      ) : null}
      {S.drag?.day === props.t ? (
        <div
          class="cal-ev draft"
          style={`${pos(props.t, S.drag.start, S.drag.end)};left:2px;right:auto;width:calc(100% - 4px)`}
        >
          <b>new event</b>
          {` ${fmtTime(S.drag.start)} – ${fmtTime(S.drag.end)}`}
        </div>
      ) : null}
    </>
  );
}

function CalNote(props: { t: number; wide?: boolean }) {
  const k = () => calKey(props.t);
  const cls = () => ['cal-note', { 'wk-note': props.wide }];
  return (
    <>
      {S.cal.status?.canConnect && !S.cal.status.connected ? (
        <div class={cls()}>
          calendar not linked.{' '}
          <button data-a="cal-connect" onClick={press('cal-connect')}>
            connect
          </button>
        </div>
      ) : S.cal.error ? (
        <div class={cls()}>{S.cal.error}</div>
      ) : S.cal.loading.has(k()) && !S.cal.days.has(k()) ? (
        <div class={cls()}>loading…</div>
      ) : null}
    </>
  );
}

// the calendar's scroll is kept, so the hours you were at stay when it redraws (render.jsx sets it)
const keepScroll = (e: Event & { currentTarget: HTMLElement }) => {
  M.calScroll = e.currentTarget.scrollTop;
};

export function Week() {
  const days = () => weekDays();
  const today = () => dayStart(now());
  const lists = () => days().map(dayEvents);
  const title = () => {
    const a = new Date(days()[0]),
      b = new Date(days()[days().length - 1]);
    return a.getMonth() === b.getMonth()
      ? a.toLocaleDateString([], { month: 'long', year: 'numeric' })
      : `${a.toLocaleDateString([], { month: 'short' })} – ${b.toLocaleDateString([], { month: 'short', year: 'numeric' })}`;
  };
  return (
    <div class="wk" style={`--n:${days().length}`}>
      <header class="wk-h">
        <button class="cal-btn" data-a="cal-today" onClick={press('cal-today')} title="Today (T)">
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
        <button class="ibtn" data-a="event" onClick={press('event')} title="Create event (B)">
          +
        </button>
        <button class="ibtn" data-a="cmd" onClick={press('cmd')} title={`Command (${MOD}+K)`}>
          <ic.cmd />
        </button>
      </header>
      <CalNote t={days()[0]} wide />
      <div class="wk-days">
        <span class="wk-tz">{tzName(days()[0])}</span>
        <For each={days()}>
          {(t) => (
            <div class={['wk-dh', { today: t === today() }]}>
              <span>{`${new Date(t).toLocaleDateString([], { weekday: 'short' })} ${new Date(t).getDate()}`}</span>
            </div>
          )}
        </For>
      </div>
      {lists().some((l) => l.some(isAllDay)) ? (
        <div class="wk-all">
          <span />
          <For each={lists()}>
            {(l) => (
              <div>
                <For each={l.filter(isAllDay)}>{(x) => <Chip x={x} />}</For>
              </div>
            )}
          </For>
        </div>
      ) : null}
      <div class="cal-b wk-b" onScroll={keepScroll}>
        <div class="wk-g">
          <div class="wk-hrs">
            <For each={Array.from({ length: 23 }, (_, h) => h + 1)}>
              {(h) => <span style={`top:${h * HPX}px`}>{hourLabel(h)}</span>}
            </For>
          </div>
          <For each={days()}>
            {(t, i) => (
              <div class={['wk-col', { today: t === today() }]} data-day={t} onMouseDown={on((e) => startDrag(e, t))}>
                <Blocks t={t} list={lists()[i()]} />
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

// Beside the week: a month to jump around in and the calendar's options; or the event you're on.
export function CalSide() {
  const m0 = () => {
    const d = new Date(S.mmMonth ?? S.calDay);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const first = () => {
    const d = new Date(m0());
    d.setDate(1 - ((m0().getDay() - weekStartsOn() + 7) % 7));
    return d;
  };
  const cells = () =>
    Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first());
      d.setDate(first().getDate() + i);
      return d;
    });
  return (
    <>
      {S.eventForm ? (
        <aside class="pane cal-pane cal-side with-form">
          <EvForm />
          <div class="grow" />
          <EvBtns />
        </aside>
      ) : (
        <aside class={['pane cal-pane cal-side', { 'board-side': S.screen === 'board' }]}>
          <div class="mm">
            <div class="mm-h">
              <b>{m0().toLocaleDateString([], { month: 'long', year: 'numeric' })}</b>
              <span class="grow" />
              <button class="ibtn" data-a="mm-prev" onClick={press('mm-prev')} title="Previous month">
                <ic.left />
              </button>
              <button class="ibtn" data-a="mm-next" onClick={press('mm-next')} title="Next month">
                <ic.right />
              </button>
            </div>
            <div class="mm-g">
              <For each={[0, 1, 2, 3, 4, 5, 6]}>{(i) => <span>{'SMTWTFS'[(i + weekStartsOn()) % 7]}</span>}</For>
              <For each={cells()}>
                {(d) => (
                  <button
                    class={[
                      'mm-d',
                      {
                        o: d.getMonth() !== m0().getMonth(),
                        today: d.getTime() === dayStart(now()),
                        inwk: d.getTime() >= weekStartOf(S.calDay) && d.getTime() < addDays(weekStartOf(S.calDay), 7),
                      },
                    ]}
                    data-jump={d.getTime()}
                    onClick={on(() => {
                      S.calDay = d.getTime();
                      M.calScroll = undefined;
                      render();
                    })}
                    aria-label={d.toDateString()}
                  >
                    <span>{d.getDate()}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
          <div class="cal-sec">
            <div class="cal-sec-h">
              <ic.cal /> calendar
            </div>
            <div class="cal-acct">
              {`${S.account?.email || ''} `}
              <span>
                {S.cal.status?.connected ? (
                  'linked'
                ) : S.cal.status?.canConnect ? (
                  <button data-a="cal-connect" onClick={press('cal-connect')}>
                    connect
                  </button>
                ) : (
                  'events made here only'
                )}
              </span>
            </div>
          </div>
          <div class="grow" />
          <div class="pane-foot">
            <b>{S.account?.email || ''}</b>
            <button class="ibtn" data-a="event" onClick={press('event')} title="Create Event (B)">
              +
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

// The day beside the mail (0), or beside an invitation or the event being written.
export function DayPane() {
  const t = () => S.calDay;
  const list = () => dayEvents(t());
  return (
    <aside class={['pane cal-pane', { 'with-form': !!S.eventForm }]}>
      {S.eventForm ? <EvForm /> : null}
      <div class="cal-h">
        <span class="d">
          {new Date(t()).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <button class="ibtn" data-a="day-prev" onClick={press('day-prev')} title="Previous day (-)">
          <ic.left />
        </button>
        <button class="ibtn" data-a="day-next" onClick={press('day-next')} title="Next day (=)">
          <ic.right />
        </button>
        <span class="grow" />
        {t() !== dayStart(now()) ? (
          <button class="cal-btn" data-a="day-today" onClick={press('day-today')} title="Back to today">
            today
          </button>
        ) : null}
        <button class="cal-btn" data-a="go-cal" onClick={press('go-cal')} title="Open week (2)">
          week
        </button>
      </div>
      <CalNote t={t()} />
      {list().filter(isAllDay).length ? (
        <div class="cal-allday">
          <For each={list().filter(isAllDay)}>{(x) => <Chip x={x} />}</For>
        </div>
      ) : null}
      <div class="cal-b" onScroll={keepScroll}>
        <div class="cal-g" data-day={t()} onMouseDown={on((e) => startDrag(e, t()))}>
          <span class="cal-tz">{tzName(t())}</span>
          <For each={Array.from({ length: 24 }, (_, h) => h)}>
            {(h) => <div class="cal-hr">{h ? <span>{hourLabel(h)}</span> : null}</div>}
          </For>
          <Blocks t={t()} list={list()} />
        </div>
      </div>
      {S.eventForm ? (
        <EvBtns />
      ) : (
        <div class="pane-foot">
          <b>{S.account?.email || ''}</b>
          <button class="ibtn" data-a="event" onClick={press('event')} title="Create Event (B)">
            +
          </button>
        </div>
      )}
    </aside>
  );
}

function evParsed(f: EventForm) {
  const ft = eventTimes(f);
  return ft.ok ? fmtRange(ft.start, ft.end) : 'time? “tomorrow 2 pm 30 min”';
}

// An event: yours to write or change, or someone else's meeting to see and answer.
function EvForm() {
  const f = (): Partial<EventForm> => S.eventForm || {};
  return (
    <>
      {f().readOnly ? (
        <div class={['evform evview', { fresh: !!f().fresh }]}>
          <div class="etitle-ro">{f().title}</div>
          <div class="evline">
            <ic.clock />
            <span>{fmtRange(f().start as number, f().end as number)}</span>
          </div>
          {f().where ? (
            <div class="evline">
              <ic.pin />
              <span innerHTML={linkify(f().where)} />
            </div>
          ) : null}
          {f().organizer || f().guests ? (
            <div class="evline">
              <ic.person />
              <span>{[f().organizer && `${f().organizer} (organizer)`, f().guests].filter(Boolean).join(', ')}</span>
            </div>
          ) : null}
          <div class="evline evrsvp">
            <span class="inv-q">rsvp</span>
            <span>
              <For each={['yes', 'maybe', 'no'] as Answer[]}>
                {(x) => (
                  <button
                    class={['inv-b', { on: f().said === x }]}
                    data-evrsvp={x}
                    onClick={on(() => answerEvent(x))}
                    aria-pressed={f().said === x ? 'true' : 'false'}
                  >
                    {x}
                  </button>
                )}
              </For>
            </span>
          </div>
          {f().notes ? <div class="evnotes" innerHTML={linkify(f().notes)} /> : null}
        </div>
      ) : (
        <div class={['evform', { fresh: !!f().fresh }]}>
          <input class="etitle" data-e="title" value={f().title ?? ''} placeholder="what" aria-label="Event title" />
          <label class="evrow">
            <span>
              <ic.person />
            </span>
            <input data-e="guests" value={f().guests ?? ''} placeholder="who" autocomplete="off" />
            <Sugg field="guests" />
          </label>
          <label class="evrow">
            <span>
              <ic.clock />
            </span>
            <input
              data-e="when"
              value={f().when ?? ''}
              placeholder={f().start ? 'change time: fri 3 pm 1 h' : 'tomorrow 2 pm 30 min'}
            />
          </label>
          <div class="evparsed">{evParsed(f() as EventForm)}</div>
          <label class="evrow">
            <span>
              <ic.pin />
            </span>
            <input data-e="where" value={f().where ?? ''} placeholder="where" />
          </label>
          <label class="evrow">
            <span>
              <ic.lines />
            </span>
            <input data-e="notes" value={f().notes ?? ''} placeholder="notes" />
          </label>
        </div>
      )}
    </>
  );
}

const EvBtns = () => (
  <>
    {S.eventForm?.readOnly ? (
      <div class="evbtns">
        <button data-a="cancel-event" onClick={press('cancel-event')}>
          close
        </button>
        <button data-a="event-todo" onClick={press('event-todo')} title="Make todo">
          todo
        </button>
        <span>Esc</span>
      </div>
    ) : (
      <div class="evbtns">
        <button class="save" data-a="save-event" onClick={press('save-event')}>
          save
        </button>
        <button data-a="cancel-event" onClick={press('cancel-event')}>
          nope
        </button>
        <button data-a="event-todo" onClick={press('event-todo')} title="Make todo">
          todo
        </button>
        {S.eventForm?.id ? (
          <button data-a="delete-event" onClick={press('delete-event')} title="Delete event">
            delete
          </button>
        ) : null}
        <span>{`${MOD}+Enter · Esc`}</span>
      </div>
    )}
  </>
);
