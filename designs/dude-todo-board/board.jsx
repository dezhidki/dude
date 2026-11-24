// The todo board's pieces: dates, the typed-time parser, cards, columns, the form in the right pane, tweaks.
// Presentational only: state lives in app.jsx. Built from window.DudeDesignSystem_3fa3b0 + board.css.
const { Icon, IconButton, Button, Segmented, EventView } = window.DudeDesignSystem_3fa3b0;

// ---------- dates (keys are YYYY-MM-DD, local time) ----------
const pad2 = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (k, n) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayHead = (k) => `${WD[fromKey(k).getDay()]} ${fromKey(k).getDate()}`;
const dayLong = (k) => `${WD[fromKey(k).getDay()]}, ${MO[fromKey(k).getMonth()]} ${fromKey(k).getDate()}`;
// how a day reads in a toast: "today", "tomorrow", "fri", "someday"
const dayWord = (k) => (!k ? 'someday' : k === TODAY_KEY ? 'today' : k === addDays(TODAY_KEY, 1) ? 'tomorrow' : WD[fromKey(k).getDay()].toLowerCase());
const weekTitle = (k0) => {
  const a = fromKey(k0),
    b = fromKey(addDays(k0, 6));
  return a.getMonth() === b.getMonth() ? `${MO[a.getMonth()]} ${a.getDate()} – ${b.getDate()}` : `${MO[a.getMonth()]} ${a.getDate()} – ${MO[b.getMonth()]} ${b.getDate()}`;
};
const fmtH = (h) => {
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return `${hh % 12 || 12}:${pad2(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
};

// Typed time, the app's input language: "today", "tomorrow", "fri", "next week", "3 days", "nov 27", "someday".
function parseWhen(text) {
  const s = (text || '').trim().toLowerCase();
  if (!s || /^(someday|no day|later|never)$/.test(s)) return { ok: true, day: null };
  if (s === 'today') return { ok: true, day: TODAY_KEY };
  if (/^(tomorrow|tmr|tom)$/.test(s)) return { ok: true, day: addDays(TODAY_KEY, 1) };
  if (s === 'next week') return { ok: true, day: addDays(TODAY_KEY, ((8 - fromKey(TODAY_KEY).getDay()) % 7) || 7) };
  let m = /^(?:in )?(\d+)\s*(d|days?)$/.exec(s);
  if (m) return { ok: true, day: addDays(TODAY_KEY, +m[1]) };
  const wi = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].findIndex((w) => s.startsWith(w));
  if (wi >= 0 && s.length <= 9) return { ok: true, day: addDays(TODAY_KEY, (wi - fromKey(TODAY_KEY).getDay() + 7) % 7) };
  m = /^([a-z]{3})[a-z]*\s+(\d{1,2})$/.exec(s) || /^(\d{1,2})\s+([a-z]{3})[a-z]*$/.exec(s);
  if (m) {
    const [mon, d] = /\d/.test(m[1]) ? [m[2], +m[1]] : [m[1], +m[2]];
    const mi = MO.findIndex((x) => x.toLowerCase() === mon);
    if (mi >= 0 && d >= 1 && d <= 31) {
      let k = keyOf(new Date(2026, mi, d));
      if (k < TODAY_KEY) k = keyOf(new Date(2027, mi, d));
      return { ok: true, day: k };
    }
  }
  return { ok: false, day: null };
}
const whenText = (k) => (!k ? 'someday' : k === TODAY_KEY ? 'today' : k === addDays(TODAY_KEY, 1) ? 'tomorrow' : dayHead(k).toLowerCase());

const labelColor = (id) => (LABELS.find((l) => l.id === id) || {}).c || 'var(--text-3)';
const mailOf = (id) => THREADS.find((t) => t.id === id);
// "maya", but "the weekly byte" stays whole
const firstName = (t) => (!t ? '' : /^the /i.test(t.from) ? t.from.toLowerCase() : t.from.split(' ')[0].toLowerCase());

// ---------- small parts ----------
function Ring({ on, onClick, title = on ? 'Not done (E)' : 'Done (E)' }) {
  return (
    <button
      type="button"
      className={`tb-ring${on ? ' on' : ''}`}
      title={title}
      aria-pressed={on ? 'true' : 'false'}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      ✓
    </button>
  );
}

function LabelTag({ id }) {
  return (
    <span className="tb-lb" style={{ '--c': labelColor(id) }}>
      <i />
      {id}
    </span>
  );
}

// A todo on the board: ring, title, then one mono line of labels · mail · task progress.
function TodoCard({ todo, sel, fresh, draft, onOpen, onToggle, onOpenMail, onDragStart, onDragEnd }) {
  const tasks = todo.tasks || [];
  const doneN = tasks.filter((t) => t.done).length;
  const mails = (todo.mails || []).map(mailOf).filter(Boolean);
  const meta = (todo.labels || []).length || mails.length || tasks.length;
  return (
    <div
      className={['tb-card', sel && 'sel', todo.done && 'done', fresh && 'fresh', draft && 'draft'].filter(Boolean).join(' ')}
      data-todo={todo.id}
      draggable={!draft}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
    >
      {draft ? <span /> : <Ring on={todo.done} onClick={onToggle} />}
      <div className="t">{todo.title || 'new todo'}</div>
      {meta ? (
        <div className="tb-meta">
          {(todo.labels || []).map((l) => (
            <LabelTag key={l} id={l} />
          ))}
          {mails.length ? (
            <span
              className="ml"
              title={`open: ${mails[0].subject}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenMail && onOpenMail(mails[0].id);
              }}
            >
              <Icon name="mail" /> {firstName(mails[0])}
              {mails.length > 1 ? ` +${mails.length - 1}` : ''}
            </span>
          ) : null}
          {tasks.length ? (
            <span className={`pg${doneN === tasks.length ? ' all' : ''}`} title={`${doneN} of ${tasks.length} tasks done`}>
              <Icon name="check" /> {`${doneN}/${tasks.length}`}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// An event of the day as a card: same fills as the calendar (filled, outlined, dashed for an invite).
function EventCard({ ev, done, sel, onToggle, onOpen }) {
  if (ev.allDay) {
    return (
      <div className={['tb-ev allday', ev.kind, done && 'done', sel && 'sel'].filter(Boolean).join(' ')} onClick={onOpen} title={ev.title}>
        <b>{ev.title}</b>
      </div>
    );
  }
  return (
    <div className={['tb-ev', ev.kind, done && 'done', sel && 'sel'].filter(Boolean).join(' ')} onClick={onOpen} title={`${ev.title}${ev.where ? ` · ${ev.where}` : ''}`}>
      <Ring on={done} onClick={onToggle} title={done ? 'Not done' : 'Done'} />
      <b>{ev.title}</b>
      <span className="tm">{`${fmtH(ev.start)}${ev.where ? ` · ${ev.where}` : ''}`}</span>
    </div>
  );
}

// "+ todo" at the foot of a day; becomes a bar-marked input. Enter adds and stays open; Esc closes.
function QuickAdd({ open, onOpen, onAdd, onClose }) {
  const [v, setV] = React.useState('');
  if (!open) {
    return (
      <button type="button" className="tb-add" onClick={onOpen} title="Add a todo here">
        + todo
      </button>
    );
  }
  return (
    <>
      <input
        className="tb-addin"
        autoFocus
        value={v}
        placeholder="todo? hit Enter."
        onChange={(e) => setV(e.target.value)}
        onBlur={() => !v && onClose()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && v.trim()) {
            onAdd(v.trim(), e.shiftKey);
            setV('');
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            setV('');
            onClose();
          }
        }}
      />
      <div className="tb-hint">shift+enter: open it</div>
    </>
  );
}

// ---------- the board ----------
function Board({ weekStart, todos, cols, selId, focusKey, freshId, evSel, evDone, filter, tweaks, adding, draft, onWeek, onFilter, onNew, onCmd, onSelect, onToggle, onOpenMail, onOpenEvent, onToggleEvent, onAddOpen, onAddClose, onQuickAdd, onMove }) {
  const [dragId, setDragId] = React.useState(null);
  const [overKey, setOverKey] = React.useState(undefined);
  const colsRef = React.useRef(null);
  // keep the day you're working in on screen when the pane narrows the board
  React.useEffect(() => {
    const el = colsRef.current && colsRef.current.querySelector('.tb-col.focus');
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focusKey, !!draft]);
  // narrow windows open on today, not on a past Sunday
  React.useEffect(() => {
    const el = colsRef.current && colsRef.current.querySelector('.tb-col.today');
    if (el && colsRef.current.scrollWidth + colsRef.current.scrollHeight > colsRef.current.clientWidth + colsRef.current.clientHeight) {
      colsRef.current.scrollLeft = el.offsetLeft - colsRef.current.offsetLeft;
      colsRef.current.scrollTop = el.offsetTop - colsRef.current.offsetTop;
    }
  }, [weekStart]);
  const visibleTodos = todos.filter((t) => !filter || (t.labels || []).includes(filter));
  const usedLabels = LABELS.filter((l) => todos.some((t) => (t.labels || []).includes(l.id)));
  const cls = ['tb', tweaks.cards === 'lined' && 'lined', tweaks.labels === 'plain' && 'plain', draft && 'editing'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <header className="tb-h">
        <button type="button" className="d-btn-outline" title="This week (T)" onClick={() => onWeek(0)}>
          today
        </button>
        <IconButton icon="left" title="Previous week (-)" onClick={() => onWeek(-1)} />
        <IconButton icon="right" title="Next week (=)" onClick={() => onWeek(1)} />
        <h1>{weekTitle(weekStart)}</h1>
        <span className="grow" />
        <div className="tb-filters">
          {usedLabels.map((l) => (
            <button type="button" key={l.id} className={`tb-filter${filter === l.id ? ' on' : ''}`} onClick={() => onFilter(filter === l.id ? null : l.id)} title={filter === l.id ? 'Show all' : `Only ${l.id}`}>
              <LabelTag id={l.id} />
            </button>
          ))}
        </div>
        <IconButton title="New todo (D)" onClick={onNew}>
          +
        </IconButton>
        <IconButton icon="cmd" title="Command (Ctrl+K)" onClick={onCmd} />
      </header>
      <div className="tb-cols" ref={colsRef}>
        {cols.map((k) => {
          const dayTodos = visibleTodos.filter((t) => t.day === k);
          const open = dayTodos.filter((t) => !t.done);
          const done = dayTodos.filter((t) => t.done);
          const evs = k && tweaks.events !== 'hide' ? [...(BOARD_EVENTS[k] || [])].sort((a, b) => (a.allDay ? -1 : b.allDay ? 1 : a.start - b.start)) : [];
          const ghost = draft && draft.day === k && draft.day !== draft.origDay ? draft : null;
          const evBlock = evs.map((ev, i) => (
            <EventCard key={`e${i}`} ev={ev} done={evDone.has(`${k}|${ev.title}`)} sel={evSel && evSel.k === k && evSel.i === i} onToggle={() => onToggleEvent(k, ev)} onOpen={() => onOpenEvent(k, i)} />
          ));
          const card = (t) => (
            <TodoCard
              key={t.id}
              todo={t}
              sel={t.id === selId}
              fresh={t.id === freshId}
              onOpen={() => onSelect(t.id, true)}
              onToggle={() => onToggle(t.id)}
              onOpenMail={onOpenMail}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', t.id);
                setDragId(t.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverKey(undefined);
              }}
            />
          );
          return (
            <section
              key={k || 'someday'}
              className={['tb-col', k === TODAY_KEY && 'today', k && k < TODAY_KEY && 'past', !k && 'someday', (overKey === k && dragId) || ghost ? 'drop' : '', focusKey === k && 'focus'].filter(Boolean).join(' ')}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverKey(k);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOverKey(undefined);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                setDragId(null);
                setOverKey(undefined);
                if (id) onMove(id, k);
              }}
            >
              <div className="tb-dh">
                <span className="d">{k ? dayHead(k) : 'someday'}</span>
                {open.length ? <span className="n">{open.length}</span> : null}
              </div>
              <div className="tb-stack">
                {tweaks.events === 'top' ? evBlock : null}
                {tweaks.events === 'top' && evs.length ? <div className="tb-gap" /> : null}
                {open.map(card)}
                {ghost ? <TodoCard todo={ghost} draft /> : null}
                {!open.length && !evs.length && !ghost && !(adding === k) ? <div className="tb-empty">{k === TODAY_KEY ? 'nothing today.' : 'nothing.'}</div> : null}
                <QuickAdd open={adding === k} onOpen={() => onAddOpen(k)} onClose={onAddClose} onAdd={(title, openIt) => onQuickAdd(k, title, openIt)} />
                {tweaks.events === 'bottom' && evs.length ? <div className="tb-gap" /> : null}
                {tweaks.events === 'bottom' ? evBlock : null}
                {done.length ? <div className="tb-gap" /> : null}
                {done.map(card)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------- the form in the right pane, like the event form ----------
// what (on the brand underline), when (typed, read back in mono), labels, mail, tasks, notes.
function TodoForm({ draft, isNew, onChange, onAttach, onOpenMail, fresh }) {
  const parsed = parseWhen(draft.when);
  const [lq, setLq] = React.useState('');
  const [li, setLi] = React.useState(0);
  const [tq, setTq] = React.useState('');
  const set = (patch) => onChange({ ...draft, ...patch });
  const lsugg = lq.trim()
    ? [...LABELS.filter((l) => l.id.startsWith(lq.trim().toLowerCase()) && !draft.labels.includes(l.id)).map((l) => l.id), ...(LABELS.some((l) => l.id === lq.trim().toLowerCase()) ? [] : [`new: ${lq.trim().toLowerCase()}`])]
    : [];
  const addLabel = (v) => {
    const id = v.replace(/^new: /, '');
    if (!LABELS.some((l) => l.id === id)) {
      const hues = ['var(--ft-doc)', 'var(--ft-sheet)', 'var(--ft-img)', 'var(--ft-slide)', 'var(--ft-pdf)'];
      LABELS.push({ id, c: hues[LABELS.length % hues.length] });
    }
    if (!draft.labels.includes(id)) set({ labels: [...draft.labels, id] });
    setLq('');
    setLi(0);
  };
  return (
    <div className={`d-evform tb-form${fresh ? ' fresh' : ''}`}>
      {draft.fromMail ? <div className="tb-from">from mail · {mailOf(draft.fromMail)?.from}</div> : null}
      <input className="d-etitle" value={draft.title} placeholder="what" aria-label="Todo" autoFocus={isNew && !draft.title} onChange={(e) => set({ title: e.target.value })} />
      <label className="d-evrow">
        <span>
          <Icon name="clock" />
        </span>
        <input value={draft.when} placeholder="when? today, fri, next week, someday" onChange={(e) => set({ when: e.target.value, day: parseWhen(e.target.value).ok ? parseWhen(e.target.value).day : draft.day })} />
      </label>
      <div className="d-evparsed">{parsed.ok ? (parsed.day ? dayLong(parsed.day) : 'someday ¯\\_(ツ)_/¯') : 'when? “fri”, “tomorrow”, “nov 30”'}</div>
      <div className="d-evrow">
        <span>
          <Icon name="cmd" />
        </span>
        <div className="tb-row-body tb-chips">
          {draft.labels.map((l) => (
            <span className="tb-chip" key={l}>
              <LabelTag id={l} />
              <button type="button" title="remove" aria-label={`remove ${l}`} onClick={() => set({ labels: draft.labels.filter((x) => x !== l) })}>
                ✕
              </button>
            </span>
          ))}
          <input
            value={lq}
            placeholder={draft.labels.length ? '' : 'labels'}
            aria-label="Add label"
            onChange={(e) => {
              setLq(e.target.value);
              setLi(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setLi(Math.min(li + 1, lsugg.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setLi(Math.max(li - 1, 0));
              } else if ((e.key === 'Enter' || e.key === ',') && lsugg.length) {
                e.preventDefault();
                addLabel(lsugg[li]);
              } else if (e.key === 'Backspace' && !lq && draft.labels.length) {
                set({ labels: draft.labels.slice(0, -1) });
              }
            }}
          />
          {lsugg.length ? (
            <div className="d-sugg" role="listbox">
              {lsugg.map((s, i) => (
                <div
                  key={s}
                  className={`d-sg${i === li ? ' on' : ''}`}
                  role="option"
                  aria-selected={i === li ? 'true' : 'false'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addLabel(s);
                  }}
                >
                  {s.startsWith('new: ') ? (
                    <>
                      <b>{s.slice(5)}</b>
                      <span>new label</span>
                    </>
                  ) : (
                    <LabelTag id={s} />
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="d-evrow">
        <span>
          <Icon name="mail" />
        </span>
        <div className="tb-row-body tb-mails">
          {draft.mails.map((id) => {
            const t = mailOf(id);
            return t ? (
              <div className="tb-mail" key={id} title={`open: ${t.subject}`} onClick={() => onOpenMail(id)}>
                <b>{t.from.split(' ')[0]}</b>
                <span>{t.subject}</span>
                <button
                  type="button"
                  title="take off"
                  aria-label={`take off ${t.subject}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    set({ mails: draft.mails.filter((x) => x !== id) });
                  }}
                >
                  ✕
                </button>
              </div>
            ) : null;
          })}
          <Button variant="link" onClick={onAttach} title="Attach mail (Ctrl+Shift+M)">
            attach mail
          </Button>
        </div>
      </div>
      <div className="d-evrow">
        <span>
          <Icon name="check" />
        </span>
        <div className="tb-row-body tb-tasks">
          {draft.tasks.map((t, i) => (
            <div className={`tb-task${t.done ? ' done' : ''}`} key={i}>
              <Ring on={t.done} title={t.done ? 'Not done' : 'Done'} onClick={() => set({ tasks: draft.tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })} />
              <span>{t.t}</span>
              <button type="button" title="remove" aria-label={`remove ${t.t}`} onClick={() => set({ tasks: draft.tasks.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
          ))}
          <input
            className="tb-taskin"
            value={tq}
            placeholder="add task"
            aria-label="Add task"
            onChange={(e) => setTq(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tq.trim()) {
                e.preventDefault();
                set({ tasks: [...draft.tasks, { t: tq.trim(), done: false }] });
                setTq('');
              }
            }}
          />
        </div>
      </div>
      <label className="d-evrow">
        <span>
          <Icon name="lines" />
        </span>
        <textarea className="tb-notes" value={draft.notes} placeholder="notes" onChange={(e) => set({ notes: e.target.value })} />
      </label>
    </div>
  );
}

// The pane while a todo is open: the form, then SAVE · NOPE · DELETE like an event.
function TodoPane({ draft, isNew, fresh, onChange, onSave, onCancel, onDelete, onAttach, onOpenMail }) {
  return (
    <aside className="d-pane tb-pane">
      <TodoForm draft={draft} isNew={isNew} fresh={fresh} onChange={onChange} onAttach={onAttach} onOpenMail={onOpenMail} />
      <div className="d-evbtns">
        <button type="button" className="d-btn-save" onClick={onSave}>
          save
        </button>
        <button type="button" className="d-btn-caps" onClick={onCancel}>
          nope
        </button>
        {isNew ? null : (
          <button type="button" className="d-btn-caps danger" onClick={onDelete}>
            delete
          </button>
        )}
        <span>Ctrl+Enter · Esc</span>
      </div>
    </aside>
  );
}

// An event picked on the board: read-only, like the calendar, plus "make todo".
function EventPane({ k, ev, done, onToggle, onMakeTodo, onClose }) {
  const when = ev.allDay ? `${dayLong(k)}, all day` : `${dayLong(k)}, ${fmtH(ev.start)} – ${fmtH(ev.end)}`;
  return (
    <aside className="d-pane tb-pane">
      <div className="tb-form" style={{ flex: 1 }}>
        {ev.kind === 'pending' || ev.kind === 'inv' ? (
          <EventView title={ev.title} when={when} where={ev.where} who={ev.who} />
        ) : (
          // your own event: no rsvp to give
          <div className="d-evform d-evview">
            <div className="d-etitle-ro">{ev.title}</div>
            <div className="d-evline">
              <Icon name="clock" />
              <span>{when}</span>
            </div>
            {ev.where ? (
              <div className="d-evline">
                <Icon name="pin" />
                <span>{ev.where}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className="tb-evacts">
        <button type="button" className="d-btn-save" onClick={onMakeTodo}>
          make todo
        </button>
        <button type="button" className="d-btn-caps" onClick={onToggle}>
          {done ? 'not done' : 'done'}
        </button>
        <button type="button" className="d-btn-caps" onClick={onClose}>
          close
        </button>
      </div>
    </aside>
  );
}

// ---------- tweaks: in-page switches for the open design questions ----------
function TweaksPanel({ tweaks, setTweaks, dark, setDark }) {
  const [shown, setShown] = React.useState(false);
  const row = (title, k, opts) => (
    <div>
      <h5>{title}</h5>
      <Segmented value={tweaks[k]} onChange={(v) => setTweaks((t) => ({ ...t, [k]: v }))} options={opts.map(([value, label]) => ({ value, label }))} />
    </div>
  );
  return (
    <>
      {shown ? (
        <div className="tb-tweaks" role="dialog" aria-label="Tweaks">
          {row('cards', 'cards', [['filled', 'filled'], ['lined', 'lined']])}
          {row('events in a day', 'events', [['top', 'top'], ['bottom', 'bottom'], ['hide', 'hide']])}
          {row('labels', 'labels', [['dots', 'dots'], ['plain', '#plain']])}
          {row('days', 'days', [['7', 'all 7'], ['5', 'mon–fri']])}
          {row('pane when idle', 'pane', [['hide', 'hide'], ['side', 'month + labels']])}
          <div>
            <h5>look</h5>
            <Segmented value={dark ? 'carbon' : 'light'} onChange={(v) => setDark(v === 'carbon')} options={[{ value: 'light', label: 'light' }, { value: 'carbon', label: 'dark' }]} />
          </div>
        </div>
      ) : null}
      <button type="button" className="d-btn-outline tb-tweaks-btn" onClick={() => setShown(!shown)}>
        {shown ? 'close tweaks' : 'tweaks'}
      </button>
    </>
  );
}

Object.assign(window, { keyOf, fromKey, addDays, dayHead, dayLong, dayWord, whenText, parseWhen, mailOf, Board, TodoPane, EventPane, TweaksPanel, LabelTag });
