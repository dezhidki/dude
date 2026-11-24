import React from 'react';
import { Icon } from '../controls/Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');
const HOUR = 44;
// en-US toLocaleTimeString, as the app shows it: "9:30 AM"
const fmtHour = (h) => {
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
};
const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;

// The day beside the mail: head, all-day chips, 24 hours of 44px. `scrollTo` is the first hour in view.
export function DayCalendar({ label, events = [], allDay = [], now, tz = 'EET', isToday = true, scrollTo = 8, note, onPrev, onNext, onWeek }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTo * HOUR;
  }, [scrollTo]);
  return (
    <>
      <div className="d-cal-h">
        <span className="d">{label}</span>
        <button type="button" className="d-ibtn xs" title="Previous day (-)" onClick={onPrev}>
          <Icon name="left" />
        </button>
        <button type="button" className="d-ibtn xs" title="Next day (=)" onClick={onNext}>
          <Icon name="right" />
        </button>
        <span className="grow" />
        {isToday ? null : (
          <button type="button" className="d-btn-outline" title="Back to today">
            today
          </button>
        )}
        <button type="button" className="d-btn-outline" title="Open week (2)" onClick={onWeek}>
          week
        </button>
      </div>
      {note}
      {allDay.length ? (
        <div className="d-cal-allday">
          {allDay.map((t) => (
            <EventChip key={t} title={t} />
          ))}
        </div>
      ) : null}
      <div className="d-cal-b" ref={ref}>
        <div className="d-cal-g">
          <span className="d-cal-tz">{tz}</span>
          {Array.from({ length: 24 }, (_, h) => (
            <div className="d-cal-hr" key={h}>
              {h ? <span>{hourLabel(h)}</span> : null}
            </div>
          ))}
          {events.map((e) => (
            <EventBlock key={e.title + e.start} {...e} />
          ))}
          {now != null ? <div className="d-cal-now" style={{ top: now * HOUR }} /> : null}
        </div>
      </div>
    </>
  );
}

// One event in its hours. start/end are hours of the day (9.5 = 9:30). kind: local | pending | inv | draft | declined.
export function EventBlock({ title, start, end, where, kind, lane = 0, lanes = 1, onClick }) {
  const w = 100 / lanes;
  const height = Math.max(15, (end - start) * HOUR - 2);
  return (
    <div
      className={cx('d-cal-ev', kind, height < 30 && 'short')}
      style={{ top: start * HOUR, height, left: `calc(${lane * w}% + 2px)`, right: 'auto', width: `calc(${w}% - 4px)` }}
      title={title}
      onClick={onClick}
    >
      <b>{title}</b>
      {` ${fmtHour(start)} – ${fmtHour(end)}${where ? ` · ${where}` : ''}`}
    </div>
  );
}

export function EventChip({ title, onClick }) {
  return (
    <span className="d-cal-chip" title={title} onClick={onClick}>
      {title}
    </span>
  );
}

export function CalNote({ children, action, onAction }) {
  return (
    <div className="d-cal-note">
      {children}
      {action ? (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

// The week: "November 2026", today / ‹ › on the left, + and command on the right; 56px hour gutter.
export function WeekView({ title, days = [], tz = 'EET', now, scrollTo = 8, onToday, onPrev, onNext, onAdd }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTo * HOUR;
  }, [scrollTo]);
  const anyAllDay = days.some((d) => (d.allDay || []).length);
  return (
    <div className="d-wk" style={{ '--n': days.length }}>
      <header className="d-wk-h">
        <button type="button" className="d-btn-outline" title="Today (T)" onClick={onToday}>
          today
        </button>
        <button type="button" className="d-ibtn" title="Previous week (-)" onClick={onPrev}>
          <Icon name="left" />
        </button>
        <button type="button" className="d-ibtn" title="Next week (=)" onClick={onNext}>
          <Icon name="right" />
        </button>
        <h1>{title}</h1>
        <span className="grow" />
        <button type="button" className="d-ibtn" title="Create event (B)" onClick={onAdd}>
          +
        </button>
        <button type="button" className="d-ibtn" title="Command (Ctrl+K)">
          <Icon name="cmd" />
        </button>
      </header>
      <div className="d-wk-days">
        <span className="d-wk-tz">{tz}</span>
        {days.map((d) => (
          <div key={d.label} className={cx('d-wk-dh', d.today && 'today')}>
            <span>{d.label}</span>
          </div>
        ))}
      </div>
      {anyAllDay ? (
        <div className="d-wk-all">
          <span />
          {days.map((d) => (
            <div key={d.label}>
              {(d.allDay || []).map((t) => (
                <EventChip key={t} title={t} />
              ))}
            </div>
          ))}
        </div>
      ) : null}
      <div className="d-wk-b" ref={ref}>
        <div className="d-wk-g">
          <div className="d-wk-hrs">
            {Array.from({ length: 23 }, (_, i) => (
              <span key={i} style={{ top: (i + 1) * HOUR }}>
                {hourLabel(i + 1)}
              </span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d.label} className={cx('d-wk-col', d.today && 'today')}>
              {(d.events || []).map((e) => (
                <EventBlock key={e.title + e.start} {...e} />
              ))}
              {d.today && now != null ? <div className="d-cal-now" style={{ top: now * HOUR }} /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A month to jump around in. month is 0-based. Weeks start Sunday unless mondayFirst.
export function MiniMonth({ year, month, today, weekOf, mondayFirst, onPick }) {
  const first = new Date(year, month, 1);
  const ws = mondayFirst ? 1 : 0;
  const start = new Date(year, month, 1 - ((first.getDay() - ws + 7) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const wk0 = weekOf ? new Date(year, month, weekOf - ((new Date(year, month, weekOf).getDay() - ws + 7) % 7)) : null;
  const inWk = (d) => wk0 && d >= wk0 && d < new Date(wk0.getFullYear(), wk0.getMonth(), wk0.getDate() + 7);
  return (
    <div className="d-mm">
      <div className="d-mm-h">
        <b>{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
        <span className="grow" />
        <button type="button" className="d-ibtn" title="Previous month">
          <Icon name="left" />
        </button>
        <button type="button" className="d-ibtn" title="Next month">
          <Icon name="right" />
        </button>
      </div>
      <div className="d-mm-g">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <span key={`h${i}`}>{'SMTWTFS'[(i + ws) % 7]}</span>
        ))}
        {cells.map((d) => (
          <button
            type="button"
            key={d.toDateString()}
            className={cx('d-mm-d', d.getMonth() !== month && 'o', d.getMonth() === month && d.getDate() === today && 'today', inWk(d) && 'inwk')}
            aria-label={d.toDateString()}
            onClick={() => onPick && onPick(d)}
          >
            <span>{d.getDate()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Beside the week, under the month: your calendar account and three options.
export function CalendarOptions({ account, status = 'linked', options = [], onToggle }) {
  return (
    <div className="d-cal-sec">
      <div className="d-cal-sec-h">
        <Icon name="cal" /> calendar
      </div>
      <div className="d-cal-acct">
        {account} <span>{status}</span>
      </div>
      {options.map((o) => (
        <label className="d-check" key={o.label}>
          <input type="checkbox" checked={!!o.on} onChange={(e) => onToggle && onToggle(o.label, e.target.checked)} /> {o.label}
        </label>
      ))}
    </div>
  );
}

// Writing an event: "what" on a 2px brand underline, then who / when / where / notes as icon rows.
// The parsed time reads back in mono under "when".
export function EventForm({ title = '', guests = '', when = '', parsed, where = '', notes = '', fresh, onChange }) {
  const set = (k) => (e) => onChange && onChange({ [k]: e.target.value });
  const row = (icon, k, v, ph) => (
    <label className="d-evrow">
      <span>
        <Icon name={icon} />
      </span>
      <input value={v} placeholder={ph} onChange={set(k)} />
    </label>
  );
  return (
    <div className={cx('d-evform', fresh && 'fresh')}>
      <input className="d-etitle" value={title} placeholder="what" aria-label="Event title" onChange={set('title')} />
      {row('person', 'guests', guests, 'who')}
      {row('clock', 'when', when, 'tomorrow 2 pm 30 min')}
      <div className="d-evparsed">{parsed || 'time? “tomorrow 2 pm 30 min”'}</div>
      {row('pin', 'where', where, 'where')}
      {row('lines', 'notes', notes, 'notes')}
    </div>
  );
}

// Someone else's meeting: 18px title, icon lines, rsvp choices, notes under a hairline.
export function EventView({ title, when, where, who, answer, notes, onAnswer }) {
  return (
    <div className="d-evform d-evview">
      <div className="d-etitle-ro">{title}</div>
      <div className="d-evline">
        <Icon name="clock" />
        <span>{when}</span>
      </div>
      {where ? (
        <div className="d-evline">
          <Icon name="pin" />
          <span>{where}</span>
        </div>
      ) : null}
      {who ? (
        <div className="d-evline">
          <Icon name="person" />
          <span>{who}</span>
        </div>
      ) : null}
      <div className="d-evline rsvp">
        <span className="d-inv-q">rsvp</span>
        <span>
          {['yes', 'maybe', 'no'].map((x) => (
            <button type="button" key={x} className={cx('d-choice', answer === x && 'on')} aria-pressed={answer === x ? 'true' : 'false'} onClick={() => onAnswer && onAnswer(x)}>
              {x}
            </button>
          ))}
        </span>
      </div>
      {notes ? <div className="d-evnotes">{notes}</div> : null}
    </div>
  );
}

// Under an event form: "SAVE" filled, "NOPE", "DELETE" in red when editing, then the keys in --text-3.
export function EventButtons({ view, canDelete, onSave, onCancel, onDelete }) {
  return view ? (
    <div className="d-evbtns">
      <button type="button" className="d-btn-caps" onClick={onCancel}>
        close
      </button>
      <span>Esc</span>
    </div>
  ) : (
    <div className="d-evbtns">
      <button type="button" className="d-btn-save" onClick={onSave}>
        save
      </button>
      <button type="button" className="d-btn-caps" onClick={onCancel}>
        nope
      </button>
      {canDelete ? (
        <button type="button" className="d-btn-caps danger" onClick={onDelete}>
          delete
        </button>
      ) : null}
      <span>Ctrl+Enter · Esc</span>
    </div>
  );
}
