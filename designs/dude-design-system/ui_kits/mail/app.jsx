// dude, as a click-through: sign-in → inbox → thread → reply / compose, search, settings, week, palette.
// Keys work like the app: J K Enter Esc E Z C R / 0 2 1 ? Ctrl+K, and ← for folders.
const {
  Logo, Button, IconButton, Segmented, Field, BarInput,
  AppShell, Rail, ListHeader, ThreadView, Pane, SettingsSection,
  SplitTabs, ListSeparator, ListNote, ListRow, ZeroState, MessageRow, Message, Invite, ReplyBar, Composer, Editor, ContactCard, SearchTips, RecentSearch,
  CommandPalette, Dialog, KeysList, ToastStack, SideMenu,
  DayCalendar, WeekView, MiniMonth, CalendarOptions,
} = window.DudeDesignSystem_3fa3b0;

const COMMANDS = [
  { t: 'Mark Done', keys: ['E'], run: 'done' },
  { t: 'Remind Me', keys: ['H'], run: 'remind' },
  { t: 'Compose', keys: ['C'], run: 'compose' },
  { t: 'Search', keys: ['/'], run: 'search' },
  { t: 'Show or Hide Calendar', keys: ['0'], run: 'day' },
  { t: 'Open Week', keys: ['2'], run: 'week' },
  { t: 'Go to Folder…', keys: ['←'], run: 'menu' },
  { t: 'Switch Theme', keys: [], run: 'theme' },
  { t: 'Settings', keys: ['Ctrl', ','], run: 'settings' },
  { t: 'Undo', keys: ['Z'], run: 'undo' },
];
const REMIND = [{ t: 'tomorrow', when: 'Tue 8:00 AM' }, { t: 'next week', when: 'Mon 8:00 AM' }, { t: 'this weekend', when: 'Sat 8:00 AM' }, { t: 'someday', when: '¯\\_(ツ)_/¯' }];

function SignIn({ onDemo }) {
  const [more, setMore] = React.useState(false);
  return (
    <div className="kit-signin">
      <div className="kit-signin-inner">
        <Logo />
        <div className="kit-prompt" role="heading" aria-level="1">no super. just email.</div>
        <div className="kit-go"><Button variant="main" onClick={() => setMore(true)}>go</Button></div>
        {more ? (
          <div className="kit-more">
            <Button variant="secondary" onClick={onDemo}>try demo</Button>
            <p>demo only. real mail need desktop app.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = React.useState(location.hash === '#signin' ? 'signin' : 'list');
  const [dark, setDark] = React.useState(/carbon/.test(location.hash));
  const [split, setSplit] = React.useState('important');
  const [sel, setSel] = React.useState(0);
  const [done, setDone] = React.useState([]);
  const [leaving, setLeaving] = React.useState(null);
  const [openId, setOpenId] = React.useState(null);
  const [reply, setReply] = React.useState(null);
  const [draft, setDraft] = React.useState({ to: '', subject: '', text: '' });
  const [paneDay, setPaneDay] = React.useState(false);
  const [overlay, setOverlay] = React.useState(null); // {kind:'cmd'|'remind'|'keys'|'menu', q, i}
  const [toasts, setToasts] = React.useState([]);
  const [rsvp, setRsvp] = React.useState({});
  const [q, setQ] = React.useState('');
  const [undo, setUndo] = React.useState(3);
  const [sig, setSig] = React.useState('Best,\n**You**');
  const [enter, setEnter] = React.useState('enter-fade');

  React.useEffect(() => {
    document.documentElement.classList.toggle('carbon', dark);
  }, [dark]);

  const toast = (m) => {
    setToasts((l) => [...l, m]);
    setTimeout(() => setToasts((l) => l.slice(1)), 2600);
  };
  const rows = THREADS.filter((t) => t.split === split && !done.includes(t.id));
  const counts = { important: THREADS.filter((t) => t.split === 'important' && t.unread && !done.includes(t.id)).length, other: THREADS.filter((t) => t.split === 'other' && t.unread && !done.includes(t.id)).length };
  const cur = screen === 'thread' ? THREADS.find((t) => t.id === openId) : rows[Math.min(sel, rows.length - 1)];

  const go = (s) => {
    setEnter(s === 'thread' || s === 'compose' ? 'enter-in' : 'enter-fade');
    setReply(null);
    setScreen(s);
  };
  const open = (t) => {
    if (!t) return;
    setOpenId(t.id);
    setReply(null);
    t.unread = false;
    go('thread');
  };
  const markDone = () => {
    const t = cur;
    if (!t) return;
    if (screen === 'thread') {
      setDone((d) => [...d, t.id]);
      go('list');
    } else {
      setLeaving(t.id);
      setTimeout(() => {
        setDone((d) => [...d, t.id]);
        setLeaving(null);
      }, 160);
    }
    toast(['done. ', 'Z', ' undo']);
  };
  const doUndo = () => {
    if (!done.length) return toast('nothing undo.');
    setDone((d) => d.slice(0, -1));
    toast('undone.');
  };
  const run = (r) => {
    setOverlay(null);
    if (r === 'done') markDone();
    else if (r === 'remind') setOverlay({ kind: 'remind', q: '', i: 0 });
    else if (r === 'compose') { setDraft({ to: '', subject: '', text: '' }); go('compose'); }
    else if (r === 'search') go('search');
    else if (r === 'day') setPaneDay((v) => !v);
    else if (r === 'week') go('week');
    else if (r === 'menu') setOverlay({ kind: 'menu', i: 0 });
    else if (r === 'theme') setDark((v) => !v);
    else if (r === 'settings') go('settings');
    else if (r === 'undo') doUndo();
  };
  const send = () => {
    toast(['sending… ', 'Z', ' undo']);
    setTimeout(() => toast('sent.'), undo * 1000 || 300);
    if (screen === 'compose') go('list');
    setReply(null);
  };

  const palItems = () => (overlay?.kind === 'remind' ? REMIND : COMMANDS).filter((c) => c.t.toLowerCase().includes((overlay?.q || '').toLowerCase()));

  React.useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
      const mod = e.ctrlKey || e.metaKey;
      if (screen === 'signin') return;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); return setOverlay({ kind: 'cmd', q: '', i: 0 }); }
      if (mod && e.key === 'Enter' && (reply || screen === 'compose')) { e.preventDefault(); return send(); }
      if (mod && e.key === ',') { e.preventDefault(); return go('settings'); }
      if (overlay && (overlay.kind === 'cmd' || overlay.kind === 'remind')) {
        const items = palItems();
        if (e.key === 'Escape') setOverlay(null);
        else if (e.key === 'ArrowDown') { e.preventDefault(); setOverlay({ ...overlay, i: Math.min(overlay.i + 1, items.length - 1) }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setOverlay({ ...overlay, i: Math.max(overlay.i - 1, 0) }); }
        else if (e.key === 'Enter') {
          const it = items[overlay.i];
          if (overlay.kind === 'remind') { setOverlay(null); if (it) { setDone((d) => [...d, cur.id]); toast([`remind ${it.when === '¯\\_(ツ)_/¯' ? 'someday' : it.when} `, 'Z', ' undo']); if (screen === 'thread') go('list'); } }
          else if (it) run(it.run);
        }
        return;
      }
      if (overlay) { if (e.key === 'Escape') setOverlay(null); return; }
      if (e.key === 'Escape') {
        if (typing) document.activeElement.blur();
        if (reply) return setReply(null);
        if (screen !== 'list') return go('list');
        return;
      }
      if (typing) return;
      const k = e.key;
      if (screen === 'list') {
        if (k === 'j') setSel((s) => Math.min(s + 1, rows.length - 1));
        else if (k === 'k') setSel((s) => Math.max(s - 1, 0));
        else if (k === 'Enter') open(cur);
        else if (k === 'Tab') { e.preventDefault(); setSplit((s) => (s === 'important' ? 'other' : 'important')); setSel(0); }
        else if (k === 'ArrowLeft') setOverlay({ kind: 'menu', i: 0 });
      }
      if (screen === 'thread') {
        if (k === 'Enter' || k === 'r') { e.preventDefault(); setReply({ to: cur.from.split(' ')[0].toLowerCase(), subject: `Re: ${cur.subject.replace(/^Re: /, '')}`, text: '' }); }
      }
      const triage = screen === 'list' || screen === 'thread';
      if (k === 'e' && triage) markDone();
      else if (k === 'h' && triage) setOverlay({ kind: 'remind', q: '', i: 0 });
      else if (k === 'z') doUndo();
      else if (k === 'c') { e.preventDefault(); run('compose'); }
      else if (k === '/') { e.preventDefault(); go('search'); }
      else if (k === '0') setPaneDay((v) => !v);
      else if (k === '2') go('week');
      else if (k === '1') go('list');
      else if (k === '?') setOverlay({ kind: 'keys' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (screen === 'signin') return <SignIn onDemo={() => go('list')} />;

  const headIcons = (
    <>
      <IconButton icon="cal" on={paneDay} title="Calendar (0)" onClick={() => setPaneDay(!paneDay)} />
      <IconButton icon="pen" title="Compose (C)" onClick={() => run('compose')} />
      <IconButton icon="search" title="Search (/)" onClick={() => go('search')} />
    </>
  );
  const todayIdx = 1;
  const dayPane = (inv) => {
    const di = inv ? inv.day : todayIdx;
    const evs = [...WEEK[di].events, ...(inv ? [{ title: 'Research seminar', start: inv.start, end: inv.end, where: inv.where, kind: 'inv' }] : [])];
    return (
      <aside className="d-pane">
        <DayCalendar label={DAY_LABELS[di]} isToday={di === todayIdx} allDay={WEEK[di].allDay || []} events={evs} now={di === todayIdx ? NOW : undefined} scrollTo={inv ? 12 : 8.5} onWeek={() => go('week')} />
        <div className="d-pane-foot"><b>{ME.address}</b><IconButton title="Create Event (B)">+</IconButton></div>
      </aside>
    );
  };

  let main, pane;
  if (screen === 'list') {
    main = (
      <>
        <ListHeader onMenu={() => setOverlay({ kind: 'menu', i: 0 })} actions={headIcons}>
          <SplitTabs active={split} onChange={(s) => { setSplit(s); setSel(0); }} splits={[{ id: 'important', name: 'Important', n: counts.important }, { id: 'other', name: 'Other', n: counts.other }]} />
        </ListHeader>
        {rows.length ? (
          <div className="d-list">
            {rows.map((t, i) => (
              <React.Fragment key={t.id}>
                {t.group && t.group !== (rows[i - 1] || {}).group ? <ListSeparator>{t.group}</ListSeparator> : null}
                <ListRow {...t} selected={i === sel} leaving={leaving === t.id} onClick={() => { setSel(i); open(t); }} onDone={() => { setSel(i); markDone(); }} onRemind={() => setOverlay({ kind: 'remind', q: '', i: 0 })} onCmd={() => setOverlay({ kind: 'cmd', q: '', i: 0 })} />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <ZeroState />
        )}
      </>
    );
    pane = paneDay ? dayPane() : cur ? <Pane contact foot={ME.address} footAction={<IconButton title="Shortcuts (?)" onClick={() => setOverlay({ kind: 'keys' })}>?</IconButton>}><ContactCard name={cur.from} address={cur.address} mail={THREADS.filter((x) => x.address === cur.address).map((x) => x.subject)} /></Pane> : null;
  } else if (screen === 'thread' && cur) {
    const last = cur.messages.length - 1;
    main = (
      <ThreadView title={cur.subject} onBack={() => go('list')} actions={<><IconButton icon="check" title="Mark Done (E)" onClick={markDone} /><IconButton icon="clock" title="Remind Me (H)" onClick={() => setOverlay({ kind: 'remind', q: '', i: 0 })} /><IconButton icon="cmd" title="Command" onClick={() => setOverlay({ kind: 'cmd', q: '', i: 0 })} /><IconButton icon="up" title="Previous conversation (K)" /><IconButton icon="down" title="Next conversation (J)" /></>}>
        {cur.messages.map((m, i) =>
          i < last ? (
            <MessageRow key={i} name={m.from.split(' ')[0]} snippet={m.text} date={m.date} />
          ) : (
            <Message key={i} focus={!reply} from={m.from} to="You" date={m.date} paper={m.paper} html={m.html} quoted={m.quoted} attachments={m.attachments}
              invite={cur.invite ? <Invite answer={rsvp[cur.id]} onAnswer={(a) => { setRsvp({ ...rsvp, [cur.id]: a }); toast(`${{ yes: 'going.', maybe: 'maybe.', no: 'not going.' }[a]} organizer told.`); }} when={cur.invite.when} where={cur.invite.where} who={cur.invite.who} /> : null}
              onReply={() => setReply({ to: m.from.split(' ')[0].toLowerCase(), subject: `Re: ${cur.subject}`, text: '' })}>
              {m.paper ? <div style={{ fontFamily: 'Georgia', background: '#f4efe6', padding: 24 }}><h2 style={{ color: '#222', margin: '0 0 8px' }}>The Weekly Byte</h2><p style={{ color: '#333', margin: 0 }}>{m.text}</p></div> : m.text}
            </Message>
          ),
        )}
        {reply ? (
          <Composer inline mode="reply" {...reply} onChange={(p) => setReply({ ...reply, ...p })} onSend={send} onDiscard={() => setReply(null)} />
        ) : (
          <ReplyBar onReplyAll={() => setReply({ to: cur.from.split(' ')[0].toLowerCase(), subject: `Re: ${cur.subject}`, text: '' })} onReply={() => setReply({ to: cur.from.split(' ')[0].toLowerCase(), subject: `Re: ${cur.subject}`, text: '' })} onEvent={() => setPaneDay(true)} />
        )}
      </ThreadView>
    );
    pane = cur.invite ? dayPane(cur.invite) : paneDay ? dayPane() : <Pane contact foot={ME.address} footAction={<IconButton title="Shortcuts (?)" onClick={() => setOverlay({ kind: 'keys' })}>?</IconButton>}><ContactCard name={cur.from} address={cur.address} mail={THREADS.filter((x) => x.address === cur.address).map((x) => x.subject)} /></Pane>;
  } else if (screen === 'compose') {
    main = (
      <ThreadView title={draft.subject.trim() || 'new mail'} onBack={() => go('list')}>
        <Composer {...draft} onChange={(p) => setDraft({ ...draft, ...p })} onSend={send} onDiscard={() => go('list')} />
      </ThreadView>
    );
    pane = <Pane contact title="You"><div className="d-contact"><div className="em">{ME.address}</div></div></Pane>;
  } else if (screen === 'search') {
    main = (
      <>
        <header className="d-head" style={{ paddingRight: 30 }}>
          <BarInput autoFocus placeholder="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" style={{ marginLeft: -16 }} />
          <IconButton title="Close (Esc)" onClick={() => go('list')}>✕</IconButton>
        </header>
        <div className="d-list">{q ? THREADS.filter((t) => (t.subject + t.snippet + t.from).toLowerCase().includes(q.toLowerCase())).map((t) => <ListRow key={t.id} {...t} onClick={() => open(t)} />) : <><RecentSearch>from:maya</RecentSearch><RecentSearch>has:attachment poster</RecentSearch></>}</div>
      </>
    );
    pane = <Pane contact title="tricks"><SearchTips tips={TIPS} /></Pane>;
  } else if (screen === 'settings') {
    main = (
      <ThreadView title="settings" onBack={() => go('list')}>
        <SettingsSection title="signature" hint="goes under mail. **bold** *italic* `code` links ok."><Editor short boxed value={sig} onChange={setSig} placeholder={'Best,\nYour name'} /></SettingsSection>
        <SettingsSection title="name" hint="name on your mail."><Field defaultValue="You" placeholder="name" /></SettingsSection>
        <SettingsSection title="undo send" hint="time to hit Z."><Segmented value={undo} onChange={setUndo} options={[{ value: 0, label: 'off' }, { value: 3, label: '3 s' }, { value: 5, label: '5 s' }, { value: 10, label: '10 s' }, { value: 20, label: '20 s' }]} /></SettingsSection>
        <SettingsSection title="ping" hint="new mail ping. dude live in tray."><Segmented value="important" options={[{ value: 'important', label: 'important' }, { value: 'all', label: 'all' }, { value: 'off', label: 'off' }]} /></SettingsSection>
        <SettingsSection title="look"><Segmented value={dark ? 'carbon' : 'light'} onChange={(v) => setDark(v === 'carbon')} options={[{ value: 'carbon', label: 'dark' }, { value: 'light', label: 'light' }]} /></SettingsSection>
        <SettingsSection title="splits" hint="only important + other."><Button variant="link">new split</Button></SettingsSection>
        <SettingsSection title="account"><div className="kit-setrow"><span>{ME.address}</span><Button variant="link" onClick={() => go('signin')}>logout</Button></div></SettingsSection>
        <SettingsSection title="keys"><Button variant="link" onClick={() => setOverlay({ kind: 'keys' })}>all keys</Button></SettingsSection>
      </ThreadView>
    );
    pane = <Pane contact title="looks like"><div className="d-sigprev" dangerouslySetInnerHTML={{ __html: sig.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') }} /></Pane>;
  } else if (screen === 'week') {
    main = <WeekView title="November 2026" days={WEEK} now={NOW} scrollTo={8.5} onAdd={() => toast('event need name.')} />;
    pane = (
      <aside className="d-pane">
        <MiniMonth year={2026} month={10} today={23} weekOf={23} />
        <CalendarOptions account={ME.address} options={[{ label: 'weekends', on: true }, { label: 'declined events' }, { label: 'week starts monday' }]} />
        <div style={{ flex: 1 }} />
        <div className="d-pane-foot"><b>{ME.address}</b><IconButton title="Create Event (B)">+</IconButton></div>
      </aside>
    );
  }

  return (
    <>
      <AppShell enter={enter} rail={<Rail active={screen === 'week' ? 'cal' : 'mail'} onChange={(v) => go(v === 'cal' ? 'week' : 'list')} />} pane={pane}>
        {/* keyed so a new screen replays its entrance */}
        <React.Fragment key={screen + (openId || '') + split}>{main}</React.Fragment>
      </AppShell>
      {overlay?.kind === 'cmd' || overlay?.kind === 'remind' ? (
        <CommandPalette
          ask={overlay.kind === 'remind'}
          icon={overlay.kind === 'remind' ? 'clock' : 'cmd'}
          title={overlay.kind === 'remind' ? 'remind when' : 'dude command'}
          placeholder={overlay.kind === 'remind' ? 'when? 8 am, 3 days, aug 7' : ''}
          query={overlay.q}
          items={palItems()}
          active={overlay.i}
          onQuery={(v) => setOverlay({ ...overlay, q: v, i: 0 })}
          onPick={(c) => (overlay.kind === 'remind' ? (setOverlay(null), cur && (setDone((d) => [...d, cur.id]), toast([`remind ${c.t} `, 'Z', ' undo']))) : run(c.run))}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay?.kind === 'keys' ? (
        <Dialog title="keys" width={720} onClose={() => setOverlay(null)}>
          <KeysList groups={KEY_GROUPS} />
        </Dialog>
      ) : null}
      {overlay?.kind === 'menu' ? <SideMenu account={ME.address} items={MENU.map((m, i) => (i === 0 ? { ...m, n: counts.important } : m))} folders={['Projects', 'Receipts']} active={0} onPick={(it) => { setOverlay(null); if (it.label === 'Settings') go('settings'); else go('list'); }} onClose={() => setOverlay(null)} /> : null}
      <ToastStack toasts={toasts} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
