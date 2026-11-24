// dude + the todo board, as a click-through. Mail and week are forked from dude-design-system/ui_kits/mail;
// the board is new. Board keys: ← → days, ↑ ↓ / J K todos, Enter open, E done, D new, Shift+← → move a day,
// # delete, T this week, - = weeks, Z undo. Everywhere: 1 mail, 2 week, 3 board, Ctrl+K, ?.
// (Icon, IconButton, Button, Segmented, EventView and the date helpers come from board.jsx.)
const {
  ListRow, ListSeparator, ZeroState, MessageRow, Message, Invite, ContactCard,
  AppShell, ListHeader, ThreadView, Pane, SplitTabs, TabBar,
  CommandPalette, Dialog, KeysList, ToastStack,
  DayCalendar, WeekView, MiniMonth, CalendarOptions,
} = window.DudeDesignSystem_3fa3b0;

const BOARD_KEYS = [
  'Board',
  [['Open board', '3'], ['Days / todos', '← → ↑ ↓'], ['Open todo', 'Enter'], ['Done', 'E'], ['New todo', 'D'], ['Move a day', 'Shift ← →'], ['Delete', '#'], ['This week', 'T'], ['Previous / next week', '- ='], ['Save', 'Ctrl Enter']],
];
const MAIL_TODO_KEYS = ['Mail', [['Make todo from mail', 'D'], ['Create event', 'B']]];

const freshDraft = (day, extra = {}) => ({ id: null, title: '', day, origDay: undefined, when: whenText(day), labels: [], mails: [], tasks: [], notes: '', ...extra });

// the rail with a third button: mail · calendar · todo
function BoardRail({ active, onChange }) {
  const b = (id, icon, label, key) => (
    <button type="button" className={active === id ? 'on' : undefined} title={`${label} (${key})`} aria-label={label} onClick={() => onChange(id)}>
      <Icon name={icon} />
    </button>
  );
  return (
    <nav className="d-rail" aria-label="Apps">
      {b('mail', 'mail', 'Mail', 1)}
      {b('cal', 'cal', 'Calendar', 2)}
      {b('board', 'check', 'Todo board', 3)}
    </nav>
  );
}

function BoardSide({ filter, onFilter, todos }) {
  return (
    <aside className="d-pane contact">
      <MiniMonth year={2026} month={10} today={23} weekOf={23} />
      <div className="d-cal-sec">
        <div className="d-cal-sec-h">
          <Icon name="cmd" /> labels
        </div>
        {LABELS.map((l) => {
          const n = todos.filter((t) => !t.done && (t.labels || []).includes(l.id)).length;
          return (
            <button type="button" key={l.id} className="d-cal-acct" style={{ textAlign: 'left', color: filter === l.id ? 'var(--brand)' : undefined }} onClick={() => onFilter(filter === l.id ? null : l.id)}>
              <LabelTag id={l.id} /> <span>{n || ''}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div className="d-pane-foot">
        <b>{ME.address}</b>
      </div>
    </aside>
  );
}

function App() {
  const [screen, setScreen] = React.useState('board');
  const [back, setBack] = React.useState('list');
  const [dark, setDark] = React.useState(/carbon/.test(location.hash));
  const [enter, setEnter] = React.useState('enter-fade');
  const [toasts, setToasts] = React.useState([]);
  const [overlay, setOverlay] = React.useState(null);
  // mail
  const [split, setSplit] = React.useState('important');
  const [sel, setSel] = React.useState(0);
  const [openId, setOpenId] = React.useState(null);
  const [rsvp, setRsvp] = React.useState({});
  // board
  const [todos, setTodos] = React.useState(TODOS.map((t) => ({ labels: [], mails: [], tasks: [], notes: '', ...t })));
  const [hist, setHist] = React.useState([]);
  const [weekStart, setWeekStart] = React.useState('2026-11-22');
  const [selId, setSelId] = React.useState('k2');
  const [focusKey, setFocusKey] = React.useState(TODAY_KEY);
  const [freshId, setFreshId] = React.useState(null);
  const [form, setForm] = React.useState(null); // { draft, isNew, fresh }
  const [evSel, setEvSel] = React.useState(null); // { k, i }
  const [evDone, setEvDone] = React.useState(new Set(['2026-11-22|Grading']));
  const [filter, setFilter] = React.useState(null);
  const [adding, setAdding] = React.useState(undefined);
  const [tweaks, setTweaks] = React.useState({ cards: 'filled', events: 'top', labels: 'dots', days: '7', pane: 'hide' });

  React.useEffect(() => {
    document.documentElement.classList.toggle('carbon', dark);
  }, [dark]);

  const toast = (m) => {
    setToasts((l) => [...l, m]);
    setTimeout(() => setToasts((l) => l.slice(1)), 2600);
  };
  const go = (s) => {
    setEnter(s === 'thread' ? 'enter-in' : 'enter-fade');
    setScreen(s);
  };

  // ---------- todos ----------
  const change = (fn) => {
    setHist((h) => [...h.slice(-30), todos]);
    setTodos(fn(todos));
  };
  const undo = () => {
    if (!hist.length) return toast('nothing undo.');
    setTodos(hist[hist.length - 1]);
    setHist((h) => h.slice(0, -1));
    toast('undone.');
  };
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((k) => tweaks.days === '7' || ![0, 6].includes(fromKey(k).getDay()));
  const cols = [...days, null];
  const colTodos = (k) => {
    const l = todos.filter((t) => t.day === k && (!filter || t.labels.includes(filter)));
    return [...l.filter((t) => !t.done), ...l.filter((t) => t.done)];
  };
  const toggle = (id) => {
    const t = todos.find((x) => x.id === id);
    change((l) => l.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    toast(t.done ? 'not done.' : ['done. ', 'Z', ' undo']);
  };
  const moveTo = (id, k) => {
    const t = todos.find((x) => x.id === id);
    if (!t || t.day === k) return;
    change((l) => [...l.filter((x) => x.id !== id), { ...t, day: k }]);
    setSelId(id);
    setFocusKey(k);
    if (form && form.draft.id === id) setForm({ ...form, draft: { ...form.draft, day: k, origDay: k, when: whenText(k) } });
    toast([`moved to ${dayWord(k)}. `, 'Z', ' undo']);
  };
  const openTodo = (id) => {
    const t = todos.find((x) => x.id === id);
    setSelId(id);
    setFocusKey(t.day);
    setEvSel(null);
    setForm({ isNew: false, fresh: true, draft: { ...t, labels: [...t.labels], mails: [...t.mails], tasks: t.tasks.map((x) => ({ ...x })), when: whenText(t.day), origDay: t.day } });
  };
  const newTodo = (k = focusKey === undefined ? TODAY_KEY : focusKey, extra = {}) => {
    setEvSel(null);
    setForm({ isNew: true, fresh: true, draft: freshDraft(k, extra) });
  };
  const save = () => {
    if (!form) return;
    const d = form.draft;
    if (!d.title.trim()) return toast('todo need name.');
    if (!parseWhen(d.when).ok) return toast('when? like “fri” or “someday”');
    const { origDay, fromMail, ...clean } = d;
    if (form.isNew) {
      const id = `n${Date.now()}`;
      change((l) => [...l, { ...clean, id, title: d.title.trim() }]);
      setSelId(id);
      setFreshId(id);
      setFocusKey(d.day);
      toast(screen === 'board' ? `todo on ${dayWord(d.day)}.` : [`todo on ${dayWord(d.day)}. `, '3', ' board']);
    } else {
      change((l) => l.map((x) => (x.id === d.id ? { ...x, ...clean, title: d.title.trim() } : x)));
      toast(d.day !== origDay ? `saved. moved to ${dayWord(d.day)}.` : 'saved.');
    }
    setForm(null);
  };
  const del = (id) => {
    change((l) => l.filter((x) => x.id !== id));
    if (form && form.draft.id === id) setForm(null);
    toast(['todo gone. ', 'Z', ' undo']);
  };
  const openMail = (id) => {
    const t = mailOf(id);
    if (!t) return;
    setBack(screen === 'thread' ? back : screen);
    setOpenId(id);
    t.unread = false;
    go('thread');
  };
  const attach = (id) => {
    if (!form) return;
    if (!form.draft.mails.includes(id)) setForm({ ...form, fresh: false, draft: { ...form.draft, mails: [...form.draft.mails, id] } });
    toast('mail on todo.');
  };
  const todoFromMail = (t) => {
    newTodo(TODAY_KEY, { title: t.subject.replace(/^(Re|Fwd?): /i, ''), mails: [t.id], fromMail: t.id });
  };

  // ---------- mail ----------
  const rows = THREADS.filter((t) => t.split === split);
  const cur = screen === 'thread' ? mailOf(openId) : rows[Math.min(sel, rows.length - 1)];
  const counts = { important: THREADS.filter((t) => t.split === 'important' && t.unread).length, other: THREADS.filter((t) => t.split === 'other' && t.unread).length };

  // ---------- palette ----------
  const commands = [
    { t: 'New Todo', keys: ['D'], run: () => (screen === 'thread' && cur ? todoFromMail(cur) : newTodo()) },
    ...(form ? [{ t: 'Attach Mail to Todo', keys: ['Ctrl', 'Shift', 'M'], run: () => setOverlay({ kind: 'attach', q: '', i: 0 }) }] : []),
    ...(screen === 'board' && selId ? [{ t: 'Mark Done', keys: ['E'], run: () => toggle(selId) }, { t: 'Move to Tomorrow', keys: [], run: () => moveTo(selId, addDays(TODAY_KEY, 1)) }, { t: 'Move to Someday', keys: [], run: () => moveTo(selId, null) }] : []),
    { t: 'Open Board', keys: ['3'], run: () => go('board') },
    { t: 'Back to Mail', keys: ['1'], run: () => go('list') },
    { t: 'Open Week', keys: ['2'], run: () => go('week') },
    { t: 'Switch Theme', keys: [], run: () => setDark((v) => !v) },
    { t: 'Undo', keys: ['Z'], run: undo },
  ];
  const palItems = () => {
    const q = (overlay?.q || '').toLowerCase();
    if (overlay?.kind === 'attach') {
      return THREADS.filter((t) => !(form?.draft.mails || []).includes(t.id) && `${t.subject} ${t.from}`.toLowerCase().includes(q)).map((t) => ({ t: t.subject, when: `${firstName(t)} · ${t.date}`, id: t.id }));
    }
    return commands.filter((c) => c.t.toLowerCase().includes(q));
  };
  const pick = (it) => {
    const kind = overlay?.kind;
    setOverlay(null);
    if (!it) return;
    if (kind === 'attach') attach(it.id);
    else it.run();
  };

  // ---------- keys ----------
  React.useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing = /INPUT|TEXTAREA/.test(el?.tagName || '');
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key;
      if (mod && k.toLowerCase() === 'k') {
        e.preventDefault();
        return setOverlay({ kind: 'cmd', q: '', i: 0 });
      }
      if (overlay && overlay.kind !== 'keys') {
        const items = palItems();
        if (k === 'Escape') setOverlay(null);
        else if (k === 'ArrowDown') {
          e.preventDefault();
          setOverlay({ ...overlay, i: Math.min(overlay.i + 1, items.length - 1) });
        } else if (k === 'ArrowUp') {
          e.preventDefault();
          setOverlay({ ...overlay, i: Math.max(overlay.i - 1, 0) });
        } else if (k === 'Enter') {
          e.preventDefault();
          pick(items[overlay.i]);
        }
        return;
      }
      if (overlay) {
        if (k === 'Escape') setOverlay(null);
        return;
      }
      if (form && mod && k === 'Enter') {
        e.preventDefault();
        return save();
      }
      if (form && mod && e.shiftKey && k.toLowerCase() === 'm') {
        e.preventDefault();
        return setOverlay({ kind: 'attach', q: '', i: 0 });
      }
      if (k === 'Escape') {
        if (typing) el.blur();
        if (form) return setForm(null);
        if (evSel) return setEvSel(null);
        if (screen === 'thread') return go(back);
        if (screen !== 'list' && screen !== 'board') return go('list');
        return;
      }
      if (typing) return;
      if (k === '1') return go('list');
      if (k === '2') return go('week');
      if (k === '3') return go('board');
      if (k === '?') return setOverlay({ kind: 'keys' });
      if (k === 'z') return undo();
      if (screen === 'thread' && cur && k === 'd') return todoFromMail(cur);
      if (screen === 'list') {
        if (k === 'j') setSel((s) => Math.min(s + 1, rows.length - 1));
        else if (k === 'k') setSel((s) => Math.max(s - 1, 0));
        else if (k === 'Enter') openMail(cur.id);
        else if (k === 'd' && cur) todoFromMail(cur);
        return;
      }
      if (screen !== 'board') return;
      const ci = Math.max(0, cols.indexOf(focusKey));
      const list = colTodos(focusKey);
      const ti = list.findIndex((t) => t.id === selId);
      if (e.shiftKey && (k === 'ArrowLeft' || k === 'ArrowRight') && selId) {
        e.preventDefault();
        const nk = cols[Math.min(Math.max(ci + (k === 'ArrowLeft' ? -1 : 1), 0), cols.length - 1)];
        return moveTo(selId, nk);
      }
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        const nk = cols[Math.min(Math.max(ci + (k === 'ArrowLeft' ? -1 : 1), 0), cols.length - 1)];
        setFocusKey(nk);
        setSelId((colTodos(nk)[0] || {}).id || null);
      } else if (k === 'ArrowDown' || k === 'j') {
        e.preventDefault();
        if (list.length) setSelId(list[Math.min(ti + 1, list.length - 1)].id);
      } else if (k === 'ArrowUp' || k === 'k') {
        e.preventDefault();
        if (list.length) setSelId(list[Math.max(ti - 1, 0)].id);
      } else if (k === 'Enter' && selId) openTodo(selId);
      else if ((k === 'e' || k === 'x') && selId) toggle(selId);
      else if (k === 'd') newTodo(focusKey);
      else if (k === '#' && selId) del(selId);
      else if (k === 't') setWeekStart('2026-11-22');
      else if (k === '-') setWeekStart((w) => addDays(w, -7));
      else if (k === '=') setWeekStart((w) => addDays(w, 7));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------- screens ----------
  const todoPane = form ? (
    <TodoPane
      key={form.draft.id || 'new'}
      draft={form.draft}
      isNew={form.isNew}
      fresh={form.fresh}
      onChange={(d) => setForm({ ...form, fresh: false, draft: d })}
      onSave={save}
      onCancel={() => setForm(null)}
      onDelete={() => del(form.draft.id)}
      onAttach={() => setOverlay({ kind: 'attach', q: '', i: 0 })}
      onOpenMail={openMail}
    />
  ) : null;

  let main, pane;
  if (screen === 'board') {
    const ev = evSel && (BOARD_EVENTS[evSel.k] || [])[evSel.i];
    main = (
      <Board
        weekStart={weekStart}
        todos={todos}
        cols={cols}
        selId={selId}
        focusKey={focusKey}
        freshId={freshId}
        evSel={evSel}
        evDone={evDone}
        filter={filter}
        tweaks={tweaks}
        adding={adding}
        draft={form ? form.draft : null}
        onWeek={(n) => setWeekStart((w) => (n ? addDays(w, 7 * n) : '2026-11-22'))}
        onFilter={setFilter}
        onNew={() => newTodo()}
        onCmd={() => setOverlay({ kind: 'cmd', q: '', i: 0 })}
        onSelect={(id) => openTodo(id)}
        onToggle={toggle}
        onOpenMail={openMail}
        onOpenEvent={(k, i) => {
          setForm(null);
          setFocusKey(k);
          setEvSel({ k, i });
        }}
        onToggleEvent={(k, e) => {
          const key = `${k}|${e.title}`;
          const n = new Set(evDone);
          n.has(key) ? n.delete(key) : n.add(key);
          setEvDone(n);
        }}
        onAddOpen={(k) => {
          setAdding(k);
          setFocusKey(k);
        }}
        onAddClose={() => setAdding(undefined)}
        onQuickAdd={(k, title, openIt) => {
          const id = `n${Date.now()}`;
          const t = { id, day: k, title, labels: filter ? [filter] : [], mails: [], tasks: [], notes: '' };
          change((l) => [...l, t]);
          setFreshId(id);
          setSelId(id);
          if (openIt) {
            setAdding(undefined);
            setForm({ isNew: false, fresh: true, draft: { ...t, when: whenText(k), origDay: k } });
          }
        }}
        onMove={moveTo}
      />
    );
    pane = form ? todoPane : ev ? (
      <EventPane
        k={evSel.k}
        ev={ev}
        done={evDone.has(`${evSel.k}|${ev.title}`)}
        onToggle={() => {
          const key = `${evSel.k}|${ev.title}`;
          const n = new Set(evDone);
          n.has(key) ? n.delete(key) : n.add(key);
          setEvDone(n);
        }}
        onMakeTodo={() => newTodo(evSel.k, { title: ev.title, notes: ev.allDay ? '' : `${dayLong(evSel.k)} · ${ev.where || ''}` })}
        onClose={() => setEvSel(null)}
      />
    ) : tweaks.pane === 'side' ? (
      <BoardSide filter={filter} onFilter={setFilter} todos={todos} />
    ) : null;
  } else if (screen === 'list') {
    main = (
      <>
        <ListHeader actions={<><IconButton icon="cal" title="Calendar (0)" /><IconButton icon="pen" title="Compose (C)" /><IconButton icon="search" title="Search (/)" /></>}>
          <SplitTabs active={split} onChange={(s) => { setSplit(s); setSel(0); }} splits={[{ id: 'important', name: 'Important', n: counts.important }, { id: 'other', name: 'Other', n: counts.other }]} />
        </ListHeader>
        {rows.length ? (
          <div className="d-list">
            {rows.map((t, i) => (
              <React.Fragment key={t.id}>
                {t.group && t.group !== (rows[i - 1] || {}).group ? <ListSeparator>{t.group}</ListSeparator> : null}
                <ListRow {...t} selected={i === sel} onClick={() => { setSel(i); openMail(t.id); }} />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <ZeroState />
        )}
      </>
    );
    pane = todoPane || (cur ? <Pane contact foot={ME.address}><ContactCard name={cur.from} address={cur.address} mail={THREADS.filter((x) => x.address === cur.address).map((x) => x.subject)} /></Pane> : null);
  } else if (screen === 'thread' && cur) {
    const last = cur.messages.length - 1;
    const onTodos = todos.filter((t) => t.mails.includes(cur.id));
    main = (
      <ThreadView title={cur.subject} onBack={() => go(back)} actions={<><IconButton icon="check" title="Mark Done (E)" /><IconButton icon="clock" title="Remind Me (H)" /><IconButton icon="cmd" title="Command" onClick={() => setOverlay({ kind: 'cmd', q: '', i: 0 })} /></>}>
        {cur.messages.map((m, i) =>
          i < last ? (
            <MessageRow key={i} name={m.from.split(' ')[0]} snippet={m.text} date={m.date} />
          ) : (
            <Message key={i} focus from={m.from} to="You" date={m.date} html={m.html} quoted={m.quoted} attachments={m.attachments} invite={cur.invite ? <Invite answer={rsvp[cur.id]} onAnswer={(a) => setRsvp({ ...rsvp, [cur.id]: a })} when={cur.invite.when} where={cur.invite.where} who={cur.invite.who} /> : null}>
              {m.paper ? <div style={{ fontFamily: 'Georgia', background: '#f4efe6', padding: 24, color: '#333' }}>{m.text}</div> : m.text}
            </Message>
          ),
        )}
        {onTodos.length ? (
          <div className="d-invite" style={{ margin: '6px 36px 0' }}>
            {onTodos.map((t) => (
              <div className="d-inv-row" key={t.id}>
                <span className="d-inv-q">todo</span>
                <span className="d-inv-a">
                  <button type="button" className="d-btn-link" onClick={() => { go('board'); openTodo(t.id); }}>
                    {t.title}
                  </button>
                  <span style={{ color: 'var(--text-3)', font: '12px var(--mono)', marginLeft: 8 }}>{t.done ? 'done' : dayWord(t.day)}</span>
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="d-replybar">
          <Button variant="soft" keyHint="Enter">reply all</Button>
          <Button variant="soft" keyHint="R">reply</Button>
          <Button variant="soft" keyHint="F">forward</Button>
          <Button variant="soft" keyHint="B">event</Button>
          <Button variant="soft" keyHint="D" title="Make a todo from this mail (D)" onClick={() => todoFromMail(cur)}>todo</Button>
        </div>
      </ThreadView>
    );
    pane = todoPane || <Pane contact foot={ME.address}><ContactCard name={cur.from} address={cur.address} mail={THREADS.filter((x) => x.address === cur.address).map((x) => x.subject)} /></Pane>;
  } else if (screen === 'week') {
    main = <WeekView title="November 2026" days={WEEK} now={NOW} scrollTo={8.5} />;
    pane = (
      <aside className="d-pane">
        <MiniMonth year={2026} month={10} today={23} weekOf={23} />
        <CalendarOptions account={ME.address} options={[{ label: 'weekends', on: true }, { label: 'declined events' }, { label: 'week starts monday' }]} />
        <div style={{ flex: 1 }} />
        <div className="d-pane-foot"><b>{ME.address}</b></div>
      </aside>
    );
  }

  const railActive = screen === 'week' ? 'cal' : screen === 'board' ? 'board' : 'mail';
  return (
    <>
      <AppShell enter={enter} rail={<BoardRail active={railActive} onChange={(v) => go(v === 'cal' ? 'week' : v === 'board' ? 'board' : 'list')} />} pane={pane}>
        <React.Fragment key={screen + (openId || '')}>{main}</React.Fragment>
        {/* phones: the rail's place goes to the tab bar */}
        <TabBar items={['Mail', 'Board', 'Calendar', 'More']} onPick={(t) => (t === 'More' ? setOverlay({ kind: 'cmd', q: '', i: 0 }) : go({ Mail: 'list', Board: 'board', Calendar: 'week' }[t]))} />
      </AppShell>
      {overlay && overlay.kind !== 'keys' ? (
        <CommandPalette
          ask={overlay.kind === 'attach'}
          icon={overlay.kind === 'attach' ? 'mail' : 'cmd'}
          title={overlay.kind === 'attach' ? 'attach mail' : 'dude command'}
          placeholder={overlay.kind === 'attach' ? 'which? maya, poster, grant' : ''}
          query={overlay.q}
          items={palItems().slice(0, 8)}
          active={overlay.i}
          onQuery={(v) => setOverlay({ ...overlay, q: v, i: 0 })}
          onPick={pick}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.kind === 'keys' ? (
        <Dialog title="keys" width={720} onClose={() => setOverlay(null)}>
          <KeysList groups={[BOARD_KEYS, MAIL_TODO_KEYS, ...KEY_GROUPS]} />
        </Dialog>
      ) : null}
      <ToastStack toasts={toasts} />
      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} dark={dark} setDark={setDark} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
