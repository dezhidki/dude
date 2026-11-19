// dude: keyboard-first mail. inbox, reading, replies, command palette, reminders, calendar.
(() => {
  let B = window.mail || window.DemoBackend;
  const DESKTOP = !!window.mail;
  const root = document.getElementById('root');
  const layer = document.getElementById('layer');
  const toastBox = document.getElementById('toast');
  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const LS = {
    get: (k, d) => {
      try {
        return JSON.parse(localStorage.getItem(`kestrel:${k}`)) ?? d;
      } catch {
        return d;
      }
    },
    set: (k, v) => localStorage.setItem(`kestrel:${k}`, JSON.stringify(v)),
  };
  const DAY = 864e5;
  const dayStart = (t) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const S = {
    screen: 'signin',
    more: false,
    account: null,
    accounts: [],
    view: 'inbox',
    split: 'important',
    threads: [],
    sel: 0,
    picked: new Set(),
    loading: false,
    open: null,
    msgs: [],
    expanded: new Set(),
    composer: null,
    pop: null,
    pane: LS.get('pane', 'contact'),
    calDay: dayStart(Date.now()),
    search: null,
    overlay: null,
    undo: [],
    g: false,
    cal: { status: null, days: new Map(), loading: new Set(), error: null },
    sentIn: {},
    cache: {},
    tcache: new Map(),
    replyDrafts: new Map(),
    menu: null,
    folders: null,
  };
  document.documentElement.classList.toggle('carbon', LS.get('theme', 'carbon') === 'carbon');
  // Switching theme redraws the screen, so open emails are coloured again for the new theme.
  function setTheme(dark) {
    document.documentElement.classList.toggle('carbon', dark);
    LS.set('theme', dark ? 'carbon' : 'light');
    if (S.screen !== 'signin') render();
  }

  const VIEWS = {
    scheduled: 'Scheduled',
    inbox: 'Inbox',
    starred: 'Starred',
    drafts: 'Drafts',
    sent: 'Sent',
    done: 'Done',
    reminders: 'Reminders',
    spam: 'Spam',
    trash: 'Trash',
    all: 'All Mail',
  };

  // ---------- icons (simple strokes) ----------
  const ic = {
    clip: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 6.5L7 11.5a3 3 0 01-4.3-4.3L8 2a2 2 0 012.8 2.8L5.6 10a1 1 0 01-1.4-1.4L9 3.8"/></svg>',
    mail: '<svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" stroke-width="1.4"><rect x=".7" y=".7" width="12.6" height="10.6" rx="2"/><path d="M1.5 2l5.5 4.2L12.5 2"/></svg>',
    cal: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x=".7" y="1.7" width="12.6" height="11.6" rx="2"/><path d="M.7 5.2h12.6M4 .5v2.5M10 .5v2.5"/></svg>',
    menu: '<svg width="16" height="12" viewBox="0 0 16 12" stroke="currentColor" stroke-width="1.4"><path d="M0 1h16M0 6h16M0 11h16"/></svg>',
    pen: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10.5 1.5l3 3L5 13H2v-3z"/><path d="M1 14.3h13"/></svg>',
    search:
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6" cy="6" r="4.8"/><path d="M9.6 9.6L13.3 13.3"/></svg>',
    check:
      '<svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5.5l4 4L13 1"/></svg>',
    clock:
      '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="7.5" cy="7.5" r="6.6"/><path d="M7.5 3.8v4l2.6 1.6"/></svg>',
    cmd: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7.5 1l6 3.3-6 3.3-6-3.3z"/><path d="M1.5 7.5l6 3.3 6-3.3M1.5 10.7l6 3.3 6-3.3"/></svg>',
    trash:
      '<svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1 3h11M4.5 3V1.5h4V3M2.5 3l.7 10h6.6l.7-10"/></svg>',
    person:
      '<svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6.5" cy="4" r="3"/><path d="M1 13.5c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5"/></svg>',
    pin: '<svg width="12" height="15" viewBox="0 0 12 15" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M6 14s5-5 5-8.5a5 5 0 0 0-10 0C1 9 6 14 6 14z"/><circle cx="6" cy="5.5" r="1.8"/></svg>',
    lines:
      '<svg width="13" height="11" viewBox="0 0 13 11" stroke="currentColor" stroke-width="1.3"><path d="M0 1h13M0 5.5h13M0 10h8"/></svg>',
    download:
      '<svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6.5 1v8.5M2.8 6l3.7 3.7L10.2 6M1 13h11"/></svg>',
    back: '<svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7 1L1 7l6 6M1 7h15"/></svg>',
    up: '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 7l5-5.5L11 7"/></svg>',
    down: '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 1l5 5.5L11 1"/></svg>',
    left: '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 1L1 6l5 5"/></svg>',
    right:
      '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 1l5 5-5 5"/></svg>',
  };
  const keysHtml = (k) => (k || []).map((x) => `<span class="key">${esc(x)}</span>`).join('');
  const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

  // ---------- helpers ----------
  const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const ord = (n) =>
    n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  function listDate(t) {
    if (t >= dayStart(Date.now())) return fmtTime(t);
    const d = new Date(t);
    return (
      d.getDate() +
      ' ' +
      MONTHS[d.getMonth()].slice(0, 3) +
      (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '')
    );
  }
  function groupOf(t) {
    const today = dayStart(Date.now()),
      days = Math.floor((today - dayStart(t)) / DAY);
    if (days <= 0) return '';
    if (days === 1) return 'Yesterday';
    const d = new Date(t);
    if (days === 2) return `${MONTHS[d.getMonth()]} ${ord(d.getDate())}`;
    if (days < 7) return 'Last 7 days';
    if (days < 30) return 'Last 30 days';
    return d.getFullYear() === new Date().getFullYear() ? MONTHS[d.getMonth()] : String(d.getFullYear());
  }
  const fullDate = (t) =>
    new Date(t).toLocaleString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  const nameOf = (p) => (p && (p.name || p.address)) || 'Unknown';
  const addrList = (a) =>
    (a || [])
      .map((p) =>
        p.name ? `${/[,;"<>]/.test(p.name) ? `"${p.name.replace(/"/g, '')}"` : p.name} <${p.address}>` : p.address,
      )
      .join(', ');
  const splitList = (s) =>
    (String(s || '').match(/(?:"[^"]*"|<[^>]*>|[^,;])+/g) || []).map((x) => x.trim()).filter(Boolean);
  const fold = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const firstOf = (p) => {
    const n = String(p?.name || '')
      .replace(/"/g, '')
      .trim();
    const m = /^([^,]+),\s*(\S+)/.exec(n);
    if (m) return m[2];
    if (n) return n.split(/\s+/)[0];
    const a = String(p?.address || '')
      .split('@')[0]
      .split(/[._-]/)[0];
    return a ? a[0].toUpperCase() + a.slice(1) : '';
  };
  const keyOf = (t) => t.key || t.id;
  const linkify = (s) =>
    esc(s).replace(/https?:\/\/[^\s<>"')\]]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);

  function needSignIn(info) {
    if (!S.account) return;
    S.authNeeded = {
      email: info?.email || S.account.email,
      provider: info?.provider || S.account.provider,
    };
    if (S.screen !== 'signin') render();
  }
  const errText = (e) => String(e?.message || e).replace(/^Error invoking remote method 'mail': (Error: )?/, '');
  function toast(html, ms = 4000) {
    if (/SIGNIN_NEEDED/.test(html)) {
      needSignIn();
      return;
    }
    const d = document.createElement('div');
    d.innerHTML = html;
    toastBox.appendChild(d);
    setTimeout(() => d.remove(), ms);
  }

  // ---------- files ----------
  function fileBits(name, type) {
    name = String(name || 'file');
    type = String(type || '').toLowerCase();
    const dot = name.lastIndexOf('.'),
      ext = (dot > 0 ? name.slice(dot + 1) : type.split('/')[1] || 'file').toLowerCase().slice(0, 5);
    const base = dot > 0 ? name.slice(0, dot) : name;
    const kind = /pdf/.test(ext + type)
      ? 'pdf'
      : /^(docx?|odt|rtf|pages)$/.test(ext)
        ? 'doc'
        : /^(xlsx?|csv|ods|numbers)$/.test(ext)
          ? 'sheet'
          : /^(pptx?|odp|key)$/.test(ext)
            ? 'slide'
            : /^image\//.test(type) || /^(png|jpe?g|gif|webp|heic|svg)$/.test(ext)
              ? 'img'
              : /^(zip|rar|7z|gz|tgz|tar)$/.test(ext)
                ? 'zip'
                : /^(ics|vcs)$/.test(ext)
                  ? 'cal'
                  : 'file';
    const size = (b) =>
      !b ? '' : b < 1024 ? `${b} b` : b < 1048576 ? `${Math.round(b / 1024)} kb` : `${(b / 1048576).toFixed(1)} mb`;
    return { base, ext, kind, size };
  }
  const previewable = (name, type) =>
    /pdf/i.test(type || '') ||
    /\.pdf$/i.test(name || '') ||
    /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/i.test(type || '') ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(name || '');
  async function viewFile(folder, uid, name, index) {
    toast('opening…', 1200);
    try {
      const r = await B.attachmentData(folder, uid, name, index);
      const bytes = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
      const type = /\.pdf$/i.test(r.name) ? 'application/pdf' : r.type || 'application/octet-stream';
      if (S.fileUrl) URL.revokeObjectURL(S.fileUrl);
      S.fileUrl = URL.createObjectURL(new Blob([bytes], { type }));
      S.overlay = { kind: 'file', url: S.fileUrl, name: r.name, pdf: type === 'application/pdf', folder, uid, index };
      renderLayer();
    } catch (e) {
      toast(`file no open: ${esc(errText(e))}`);
    }
  }
  async function openFile(folder, uid, name, index, mode) {
    if (!B.attachment || !folder || !uid) {
      toast('demo. no real file.');
      return;
    }
    if (mode === 'open' && B.attachmentData && previewable(name, '')) return viewFile(folder, uid, name, index);
    toast(mode === 'save' ? 'saving…' : 'opening…', 1500);
    try {
      const r = await B.attachment(folder, uid, name, index, mode);
      if (mode === 'save') toast(`saved: ${esc(r.name)}`);
    } catch (e) {
      toast(`file no open: ${esc(errText(e))}`);
    }
  }

  // ---------- data ----------
  const snoozes = () => LS.get('snooze', {});
  // Search words, as in Superhuman: from: to: subject: domain: is:unread is:starred is:list,
  // "exact phrase", -word to exclude, plain words anywhere.
  function matchQuery(t, q) {
    const toks = String(q || '').match(/-?\w+:"[^"]*"|-?\w+:\S+|-?"[^"]*"|\S+/g) || [];
    const lc = (x) => String(x || '').toLowerCase();
    const who = (p) => lc(`${p?.name} ${p?.address}`);
    return toks.every((tok) => {
      const neg = tok.startsWith('-');
      if (neg) tok = tok.slice(1);
      let [k, v] = /^\w+:/.test(tok)
        ? [tok.slice(0, tok.indexOf(':')).toLowerCase(), tok.slice(tok.indexOf(':') + 1)]
        : ['', tok];
      v = lc(v.replace(/^"|"$/g, ''));
      let ok;
      if (k === 'from') ok = who(t.from).includes(v);
      else if (k === 'domain') ok = (lc(t.from.address).split('@')[1] || '').endsWith(v.replace(/^@/, ''));
      else if (k === 'to' || k === 'cc' || k === 'bcc') ok = (t.to || []).some((p) => who(p).includes(v));
      else if (k === 'subject') ok = lc(t.subject).includes(v);
      else if (k === 'is')
        ok =
          v === 'unread'
            ? !!t.unread
            : v === 'read'
              ? !t.unread
              : v === 'starred'
                ? !!t.starred
                : v === 'list'
                  ? !!t.list
                  : false;
      else if (k === 'has') ok = /^attachments?$/.test(v) ? !!t.atts?.length : v === 'list' ? !!t.list : false;
      else if (k === 'filename') ok = (t.atts || []).some((a) => lc(a.name).includes(v));
      else if (k === 'larger' || k === 'smaller') {
        const m = /^(\d+(?:\.\d+)?)([kmg]?)b?$/.exec(v),
          n = m ? +m[1] * { '': 1, k: 1024, m: 1048576, g: 1073741824 }[m[2]] : 0;
        ok = !!m && (k === 'larger' ? (t.size || 0) > n : (t.size || 0) < n);
      } else ok = `${lc(t.subject)} ${lc(t.snippet)} ${who(t.from)}`.includes(v);
      return neg ? !ok : ok;
    });
  }
  window.kestrelMatch = matchQuery;
  const customSplits = () => LS.get('splits', []);
  const allSplits = () => [{ id: 'important', name: 'Important' }, ...customSplits(), { id: 'other', name: 'Other' }];
  function splitOf(t) {
    for (const sp of customSplits()) if (matchQuery(t, sp.q)) return sp.id;
    return t.list ? 'other' : 'important';
  }
  function visible() {
    const sn = snoozes(),
      now = Date.now();
    let t = S.threads;
    if (S.view === 'inbox') {
      if (!allSplits().some((x) => x.id === S.split)) S.split = 'important';
      t = t.filter((x) => !(sn[keyOf(x)] > now) && splitOf(x) === S.split);
    }
    if (S.unreadOnly) t = t.filter((x) => x.unread);
    return t;
  }
  const current = () => visible()[S.sel];
  const counts = () => {
    const sn = snoozes(),
      now = Date.now(),
      c = {};
    S.threads.forEach((x) => {
      if (!(sn[keyOf(x)] > now)) {
        const k = splitOf(x);
        c[k] = (c[k] || 0) + 1;
      }
    });
    return c;
  };
  function addSplit(name, q) {
    const id = `sp${Date.now()}`;
    LS.set('splits', [...customSplits(), { id, name, q }]);
    S.view = 'inbox';
    S.split = id;
    S.sel = 0;
    S.screen = 'list';
    render();
    toast(`split “${esc(name)}” made. Tab move.`);
  }
  function removeSplit(id) {
    LS.set(
      'splits',
      customSplits().filter((x) => x.id !== id),
    );
    if (S.split === id) S.split = 'important';
    render();
    toast('split gone.');
  }

  function learnMyName(list) {
    if (!S.account || S.account.name) return;
    const known = LS.get(`myname:${meAddr()}`, '');
    if (known) {
      S.account.name = known;
      return;
    }
    for (const t of list || [])
      for (const p of [t.from, ...(t.to || [])]) {
        if (p?.name && (p.address || '').toLowerCase() === meAddr()) {
          S.account.name = p.name;
          LS.set(`myname:${meAddr()}`, p.name);
          return;
        }
      }
  }
  // Lists show at once from memory (and the inbox from the last session), then refresh quietly;
  // "Loading…" only appears the very first time a folder is opened.
  const snapKey = () => `snap:${meAddr()}`;
  function cachedList(view) {
    if (S.cache[view]) return S.cache[view];
    if (view === 'inbox' && !B.demo) {
      const snap = LS.get(snapKey(), null);
      if (snap) {
        S.cache.inbox = snap;
        return snap;
      }
    }
    return null;
  }
  async function load(view = S.view, keepSel = false) {
    const prevView = S.view,
      selId = current()?.id;
    S.view = view;
    if (view !== 'search') S.search = null;
    if (!keepSel) {
      S.sel = 0;
      S.picked.clear();
    }
    const cached = view !== 'search' && view !== 'reminders' && view !== 'scheduled' ? cachedList(view) : null;
    if (prevView !== view || !keepSel) S.threads = cached || [];
    S.loading = !cached;
    render();
    // nothing in memory: show last time's copy from disk at once, then refresh from the server
    if (!cached && B.listCached && view !== 'search' && view !== 'reminders' && view !== 'scheduled') {
      try {
        const quick = await B.listCached(view);
        if (quick?.length && S.view === view && S.loading) {
          S.threads = quick;
          S.loading = false;
          render();
        }
      } catch {}
    }
    try {
      if (view === 'reminders') {
        const sn = snoozes(),
          all = await B.list('all');
        S.threads = all.filter((t) => sn[keyOf(t)] > Date.now());
      } else if (view === 'scheduled') {
        S.threads = scheduled()
          .sort((a, b) => a.at - b.at)
          .map((x, i) => ({
            id: `sch${i}-${x.at}`,
            sched: x,
            subject: x.msg.subject || '(no subject)',
            from: { name: `To: ${x.msg.to}`, address: '' },
            to: [],
            snippet:
              'Sends ' +
              whenLabel(x.at) +
              ' · ' +
              String(x.msg.text || '')
                .replace(/\s+/g, ' ')
                .slice(0, 140),
            date: x.at,
            unread: false,
          }));
      } else if (view === 'search') S.threads = await B.search(S.search.q);
      else S.threads = await B.list(view);
      if (view === 'inbox') S.threads = autoClear(S.threads);
      S.loadError = false;
    } catch (e) {
      toast(`mail no load: ${esc(e.message || e)}`);
      if (!cached) S.threads = [];
      S.loadError = true;
    }
    if (S.view !== view) return; // you moved on while it loaded
    S.loading = false;
    if (view !== 'search' && view !== 'reminders') {
      S.cache[view] = S.threads;
      if (view === 'inbox' && !B.demo) LS.set(snapKey(), S.threads.slice(0, 150));
    }
    learnMyName(S.threads);
    // keep the same conversation selected when the list refreshes underneath you
    const v = visible(),
      at = selId
        ? v.findIndex(
            (t) =>
              t.id === selId || (t.uids || []).some((u) => (selId.split(':')[1] || '').split(',').includes(String(u))),
          )
        : -1;
    S.sel = at >= 0 && keepSel ? at : Math.min(S.sel, Math.max(0, v.length - 1));
    if (S.screen === 'list') render();
    prefetch(current());
  }

  // Fetch the conversation you're on before you open it (without marking it read).
  let prefetchTimer = null;
  function prefetch(t) {
    clearTimeout(prefetchTimer);
    if (!t || S.tcache.has(t.id)) return;
    prefetchTimer = setTimeout(async () => {
      try {
        const got = await B.thread(t, { peek: true });
        let more = [];
        if (B.related) {
          try {
            more = await B.related(t, got);
          } catch {}
        }
        const have = new Set(got.map((m) => m.messageId).filter(Boolean));
        S.tcache.set(
          t.id,
          [...got, ...more.filter((m) => !m.messageId || !have.has(m.messageId))].sort((a, b) => a.date - b.date),
        );
      } catch {}
    }, 120);
  }

  // ---------- actions ----------
  const INVERSE = {
    move: 'undone',
    done: 'undone',
    undone: 'done',
    trash: 'undone',
    spam: 'undone',
    star: 'unstar',
    unstar: 'star',
    read: 'unread',
    unread: 'read',
  };
  const LABEL = {
    move: 'moved.',
    done: 'done.',
    undone: 'back in inbox.',
    trash: 'trashed.',
    spam: 'spam. bye.',
    star: 'starred.',
    unstar: 'unstarred.',
    read: 'read.',
    unread: 'unread.',
  };
  const REMOVES = new Set(['done', 'trash', 'spam', 'undone', 'move']);

  function targets() {
    if (S.screen === 'thread' && S.open) return [S.open];
    const v = visible();
    if (S.picked.size) return v.filter((t) => S.picked.has(t.id));
    return v[S.sel] ? [v[S.sel]] : [];
  }

  async function act(action, list = targets(), quiet = false, folder) {
    if (!list.length) return;
    if (action === 'done' && S.view === 'done') action = 'undone';
    const removes = REMOVES.has(action) && !(action === 'undone' && S.view === 'inbox');
    if (removes) list = list.filter((t) => !t._leaving);
    if (!list.length) return;
    if (removes && S.screen === 'list' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ids = new Set(list.map((t) => t.id)),
        v = visible();
      const rows = [...root.querySelectorAll('.row')].filter((r) => v[+r.dataset.i] && ids.has(v[+r.dataset.i].id));
      if (rows.length) {
        list.forEach((t) => {
          t._leaving = true;
        });
        rows.forEach((r) => {
          r.classList.add('leaving');
        });
        await new Promise((r) => setTimeout(r, 170));
      }
    }
    if (removes) {
      const ids = new Set(list.map((t) => t.id));
      S.threads = S.threads.filter((t) => !ids.has(t.id));
      if (S.cache[S.view]) S.cache[S.view] = S.threads;
      ids.forEach((id) => {
        S.tcache.delete(id);
      });
      S.picked.clear();
      if (S.screen === 'thread') closeThread(true);
    } else
      list.forEach((t) => {
        if (action === 'star' || action === 'unstar') t.starred = action === 'star';
        if (action === 'read' || action === 'unread') t.unread = action === 'unread';
      });
    S.sel = Math.min(S.sel, Math.max(0, visible().length - 1));
    render();
    if (!quiet) toast(`${LABEL[action]}${list.length > 1 ? ` · ${list.length}` : ''} <span class="key">Z</span> undo`);
    try {
      const res = await Promise.all(list.map((t) => B.act(t, action, folder)));
      S.undo.push({ action: INVERSE[action], threads: res.map((r, i) => (r?.id ? r : list[i])), reload: removes });
    } catch (e) {
      toast(`no work: ${esc(e.message || e)}`);
      load(S.view, true);
    }
  }

  async function undo() {
    const u = S.undo.pop();
    if (!u) return toast('nothing undo.');
    if (u.snooze) {
      const sn = snoozes();
      u.snooze.forEach((k) => {
        delete sn[k];
      });
      LS.set('snooze', sn);
      toast('remind gone.');
      return load(S.view, true);
    }
    if (u.send) {
      clearTimeout(u.send);
      u.unshow?.();
      u.draft.sent = false;
      toast('send stop.');
      S.composer = u.draft;
      render();
      return;
    }
    await Promise.all(u.threads.map((t) => B.act(t, u.action)));
    toast('undone.');
    load(S.view, true);
  }

  function toggle(kind) {
    const t = targets()[0];
    if (!t) return;
    if (kind === 'star') act(t.starred ? 'unstar' : 'star');
    else act(t.unread ? 'read' : 'unread');
  }

  // ---------- thread ----------
  async function openThread(t) {
    if (!t) return;
    if (S.screen === 'thread') stashReply();
    if (t.sched) return openScheduled(t);
    if (S.view === 'drafts') return openServerDraft(t);
    S.open = t;
    S.screen = 'thread';
    S.msgs = [];
    S.newer = null;
    S.composer = null;
    S.expanded = new Set();
    S.quotes = new Set();
    S.focus = 0;
    const early = S.tcache.get(t.id);
    if (early) {
      const extra0 = (S.sentIn[keyOf(t)] || []).filter((m) => !early.some((x) => x.messageId === m.messageId));
      S.msgs = tidyDrafts(
        t,
        withLocalDraft(
          t,
          [...early, ...extra0].sort((a, b) => a.date - b.date),
        ),
      );
      const lastReal0 = lastRealIndex(S.msgs);
      S.expanded = new Set([lastReal0]);
      S.focus = lastReal0;
    }
    render();
    if (early) root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
    const wasUnread = t.unread;
    if (t.unread) {
      t.unread = false;
    }
    try {
      const got = await B.thread(t, { unread: wasUnread });
      if (early && S.open === t) {
        // already showing: only redraw if the server knows more than we did
        const ids = new Set(S.msgs.map((m) => m.messageId || m.id));
        if (got.every((m) => ids.has(m.messageId || m.id))) {
          mergeRelated(t);
          return;
        }
      }
      if (S.open !== t) return;
      const have = new Set(got.map((m) => m.messageId).filter(Boolean));
      const extra = (S.sentIn[keyOf(t)] || []).filter((m) => !have.has(m.messageId));
      S.msgs = tidyDrafts(
        t,
        withLocalDraft(
          t,
          [...got, ...extra].sort((a, b) => a.date - b.date),
        ),
      );
      const lastReal = lastRealIndex(S.msgs);
      S.expanded = new Set([lastReal]);
      S.focus = lastReal;
      S.tcache.set(t.id, S.msgs);
    } catch (e) {
      if (!early) toast(`no open: ${esc(e.message || e)}`);
    }
    render();
    root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
    mergeRelated(t);
  }
  // Your own replies (from Sent) arrive a moment after the conversation opens.
  const lastRealIndex = (list) => {
    for (let i = list.length - 1; i >= 0; i--) if (!list[i].draft) return i;
    return Math.max(0, list.length - 1);
  };
  // Draft rows in a conversation: none while you're writing a reply in it; otherwise only one (yours
  // from this session, else the newest saved copy). Older copies are remembered and removed from
  // the Drafts folder the next time that draft is saved.
  function tidyDrafts(t, list) {
    const composing = !!S.composer && S.composer.mode !== 'new' && S.screen === 'thread';
    const real = list.filter((m) => !m.draft);
    if (composing) return real;
    const c = S.replyDrafts.get(keyOf(t));
    const drafts = list.filter((m) => m.draft && !(c?.draftUid && !m.local && m.uid === c.draftUid));
    drafts.sort((a, b) => (b.local ? 1 : 0) - (a.local ? 1 : 0) || b.date - a.date);
    const keep = drafts[0];
    if (!keep) return real;
    keep.others = drafts
      .slice(1)
      .map((d) => d.uid)
      .filter(Boolean);
    return [...real, keep];
  }
  function withLocalDraft(t, list) {
    const c = S.replyDrafts.get(keyOf(t));
    const out = list.filter((m) => !(m.draft && c?.draftUid && m.uid === c.draftUid));
    if (c && !blankDraft(c))
      out.push({
        id: 'local-draft',
        draft: true,
        local: c,
        to: c.to
          .split(/[,;]/)
          .map((x) => ({ name: x.replace(/<.*>/, '').trim(), address: (/<([^>]+)>/.exec(x) || [null, x.trim()])[1] })),
        text: c.text,
        date: Date.now(),
      });
    return out;
  }
  async function mergeRelated(t) {
    if (!B.related || S.open !== t || !S.msgs.length) return;
    let more;
    try {
      more = await B.related(t, S.msgs);
    } catch {
      return;
    }
    if (S.open !== t || !more || !more.length) return;
    const have = new Set(S.msgs.map((m) => m.messageId).filter(Boolean));
    const localUid = (S.composer && S.open === t && S.composer.draftUid) || S.replyDrafts.get(keyOf(t))?.draftUid;
    const add = more.filter(
      (m) => (!m.messageId || !have.has(m.messageId)) && !(m.draft && localUid && m.uid === localUid),
    );
    if (!add.length) return;
    const wasLast = S.focus === S.msgs.length - 1,
      focusId = S.msgs[S.focus] && (S.msgs[S.focus].messageId || S.msgs[S.focus].id);
    const open = new Set([...S.expanded].map((i) => S.msgs[i] && (S.msgs[i].messageId || S.msgs[i].id)));
    S.msgs = tidyDrafts(
      t,
      [...S.msgs, ...add].sort((a, b) => a.date - b.date),
    );
    S.expanded = new Set(S.msgs.map((m, i) => (open.has(m.messageId || m.id) ? i : -1)).filter((i) => i >= 0));
    if (wasLast) {
      S.expanded.add(S.msgs.length - 1);
      S.focus = S.msgs.length - 1;
    } else
      S.focus = Math.max(
        0,
        S.msgs.findIndex((m) => (m.messageId || m.id) === focusId),
      );
    S.tcache.set(t.id, S.msgs);
    if (!S.composer) render();
  }
  async function openServerDraft(t) {
    try {
      const got = await B.thread(t, { peek: true });
      const m = got[got.length - 1];
      if (!m) return;
      S.back = { screen: 'list' };
      S.composer = {
        mode: m.inReplyTo ? 'reply' : 'new',
        to: addrList(m.to),
        cc: addrList(m.cc),
        subject: m.subject || '',
        text: m.text || '',
        inReplyTo: m.inReplyTo,
        references: m.references,
        draftUid: m.uid,
      };
      S.screen = 'compose';
      render();
      focusComposer('text');
    } catch (e) {
      toast(`draft no open: ${esc(e.message || e)}`);
    }
  }
  function openScheduled(t) {
    LS.set(
      'scheduled',
      scheduled().filter((x) => x.at !== t.sched.at || x.msg.subject !== t.sched.msg.subject),
    );
    const m = t.sched.msg;
    S.back = { screen: 'list' };
    S.composer = {
      mode: m.inReplyTo ? 'reply' : 'new',
      to: m.to,
      cc: m.cc || '',
      subject: m.subject || '',
      text: m.text || '',
      inReplyTo: m.inReplyTo,
      references: m.references,
    };
    S.screen = 'compose';
    render();
    focusComposer('text');
    toast('unscheduled. send now or later.');
  }
  function closeThread(keep) {
    if (!keep) stashReply();
    S.screen = 'list';
    S.open = null;
    S.msgs = [];
    if (!keep) S.composer = null;
    render();
  }
  function step(d) {
    const v = visible();
    if (!v.length) return;
    S.sel = Math.max(0, Math.min(v.length - 1, S.sel + d));
    if (S.screen === 'thread') openThread(v[S.sel]);
    else updateSel();
    scrollSel();
  }
  function updateSel() {
    if (S.screen !== 'list' || !root.querySelector('.list')) return render();
    root.querySelectorAll('.row').forEach((r) => {
      r.classList.toggle('sel', +r.dataset.i === S.sel);
    });
    const pane = root.querySelector('aside.pane');
    if (pane && S.pane !== 'calendar' && !S.eventForm) pane.outerHTML = paneHtml();
    prefetch(current());
  }
  // Inside a conversation: arrows move between its messages; J/K move between conversations.
  function moveFocus(d) {
    if (!S.msgs.length) return;
    S.focus = Math.max(0, Math.min(S.msgs.length - 1, S.focus + d));
    // only the highlight moves: open emails stay as they are (no reload, no flicker)
    root.querySelectorAll('.thread .msg').forEach((m) => {
      m.classList.toggle('focus', +m.dataset.m === S.focus && !S.composer);
    });
    root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function toggleMsg(i = S.focus) {
    S.expanded.has(i) ? S.expanded.delete(i) : S.expanded.add(i);
    S.focus = i;
    render();
  }
  function scrollSel() {
    const r = root.querySelector('.row.sel');
    if (r) r.scrollIntoView({ block: 'nearest' });
  }

  // ---------- settings ----------
  const SET = () => ({ signature: '', undoSeconds: 3, ...LS.get('settings', {}) });
  function setSetting(k, v) {
    LS.set('settings', { ...SET(), [k]: v });
  }
  const sigBlock = () => {
    const sg = SET().signature.trim();
    return sg ? `\n\n${sg}` : '';
  };
  function openSettings() {
    if (S.screen === 'compose') leaveCompose();
    if (S.screen === 'thread') closeThread();
    if (S.screen !== 'settings') S.back = { screen: 'list' };
    S.screen = 'settings';
    S.menu = null;
    render();
  }
  function settingsHtml() {
    const st = SET(),
      theme = document.documentElement.classList.contains('carbon') ? 'carbon' : 'light';
    const seg = (attr, opts, cur) =>
      `<div class="seg">${opts.map(([v, l]) => `<button data-${attr}="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    return `<div class="thread"><div class="thread-top"><button class="back" data-a="close-settings" title="Back (Esc)">${ic.back}</button></div>
      <div class="tcol settings"><div class="thead"><h1>settings</h1></div>
        <section><h3>signature</h3><p class="hint">goes under mail. **bold** *italic* \`code\` links ok.</p>
          <div class="editor"><div class="tint" aria-hidden="true">${window.Markdown.tint(st.signature)}</div><textarea data-set="signature" placeholder="Best,&#10;Your name" aria-label="Signature">
${esc(st.signature)}</textarea></div></section>
        <section><h3>name</h3><p class="hint">name on your mail.</p><input class="field" data-set="name" value="${esc(S.account?.name || '')}" placeholder="name"></section>
        <section><h3>undo send</h3><p class="hint">time to hit Z.</p>${seg(
          'undo',
          [
            [0, 'off'],
            [3, '3 s'],
            [5, '5 s'],
            [10, '10 s'],
            [20, '20 s'],
          ],
          st.undoSeconds,
        )}</section>
        <section><h3>check mail</h3><p class="hint">outlook tells dude when mail lands${S.pushLive === true ? ': <b>live</b>' : S.pushLive === false ? ': <b>not live now</b>, checks on timer' : ''}. timer is backup.</p>${seg(
          'poll',
          [
            [15, '15 s'],
            [30, '30 s'],
            [60, '1 min'],
            [120, '2 min'],
            [300, '5 min'],
          ],
          st.pollSeconds || 60,
        )}</section>
        <section><h3>ping</h3><p class="hint">new mail ping. dude live in tray.</p>${seg(
          'notify',
          [
            ['important', 'important'],
            ['all', 'all'],
            ['off', 'off'],
          ],
          st.notify || 'important',
        )}</section>
        <section><h3>look</h3>${seg(
          'theme',
          [
            ['carbon', 'dark'],
            ['light', 'light'],
          ],
          theme,
        )}</section>
        <section><h3>splits</h3>${
          customSplits()
            .map(
              (sp) =>
                `<div class="setrow"><span>${esc(sp.name)} <small>${esc(sp.q)}</small></span><button data-rmsplit="${esc(sp.id)}">remove</button></div>`,
            )
            .join('') || '<p class="hint">only important + other.</p>'
        }
          <button class="link" data-a="new-split">new split</button></section>
        <section><h3>account</h3><div class="setrow"><span>${esc(S.account?.email || '')}</span>${B.demo ? '' : '<button data-a="signout">logout</button>'}</div></section>
        <section><h3>keys</h3><button class="link" data-a="keys">all keys</button></section>
      </div></div>`;
  }

  // ---------- compose ----------
  const meAddr = () => (S.account?.email || '').toLowerCase();
  function startCompose(mode) {
    if (mode === 'new') {
      S.back = S.screen === 'compose' ? S.back : { screen: S.screen, open: S.open, msgs: S.msgs };
      S.composer = S.draft || { mode, to: '', cc: '', subject: '', text: sigBlock() };
      S.draft = null;
      S.screen = 'compose';
      S.pop = false;
      render();
      focusComposer(S.composer.to ? 'text' : 'to');
      return;
    }
    const di = S.msgs.findIndex((x) => x.draft);
    if (di >= 0 && mode !== 'forward') return resumeDraft(di); // a reply is already drafted here
    const m = (S.msgs[S.focus] && !S.msgs[S.focus].draft && S.msgs[S.focus]) || S.msgs[lastRealIndex(S.msgs)];
    if (!m) return;
    const subj = S.open.subject || m.subject || '';
    const base = /^(re|fwd?):/i.test(subj) ? subj.replace(/^(re|fwd?):\s*/i, '') : subj;
    const refs = [m.references, m.messageId].filter(Boolean).join(' ').trim();
    const fromMe = (m.from.address || '').toLowerCase() === meAddr();
    let to = '',
      cc = '';
    if (mode === 'reply') to = fromMe ? addrList(m.to) : addrList([m.from]);
    if (mode === 'replyall') {
      const others = [m.from, ...(m.to || []), ...(m.cc || [])].filter(
        (p) => p && (p.address || '').toLowerCase() !== meAddr(),
      );
      const seen = new Set(),
        uniq = others.filter((p) => !seen.has(p.address.toLowerCase()) && seen.add(p.address.toLowerCase()));
      to = addrList(uniq.slice(0, 1));
      cc = addrList(uniq.slice(1));
    }
    S.composer = {
      mode,
      to,
      cc,
      text: sigBlock(),
      subject: (mode === 'forward' ? 'Fwd: ' : 'Re: ') + base,
      inReplyTo: mode === 'forward' ? undefined : m.messageId,
      references: mode === 'forward' ? undefined : refs,
      quoteOf: m,
    };
    S.pop = false;
    render();
    focusComposer(mode === 'forward' ? 'to' : 'text');
  }
  const blankDraft = (c) =>
    !c ||
    !(
      c.to.trim() ||
      (c.cc || '').trim() ||
      (c.bcc || '').trim() ||
      (c.files || []).length ||
      c.subject.trim() ||
      (c.text.trim() && c.text.trim() !== sigBlock().trim())
    );
  // Drafts are saved in the mailbox's Drafts folder a moment after you stop typing.
  let draftTimer = null;
  function scheduleDraftSave() {
    clearTimeout(draftTimer);
    const c = S.composer;
    if (c) draftTimer = setTimeout(() => saveDraftNow(c), 2000);
  }
  async function saveDraftNow(c) {
    if (!c || !B.saveDraft || c.sent || c.discarded || blankDraft(c)) return;
    if (c.saving) {
      c.again = true;
      return;
    }
    c.saving = true;
    try {
      const body = c.text + quoted(c);
      const r = await B.saveDraft({
        to: c.to,
        cc: c.cc || '',
        bcc: c.bcc || '',
        files: c.files || [],
        subject: c.subject,
        text: body,
        html: window.Markdown.toHtml(body),
        inReplyTo: c.inReplyTo,
        references: c.references,
        fromName: S.account?.name || '',
        replaceUid: c.draftUid,
      });
      if (c.sent || c.discarded) {
        if (r?.uid) B.deleteDraft(r.uid).catch(() => {});
      } else if (r?.uid) c.draftUid = r.uid;
      if (!c.sent && !c.discarded && c.extraDrafts?.length) {
        const ex = c.extraDrafts;
        c.extraDrafts = [];
        ex.forEach((u) => {
          if (u !== c.draftUid) B.deleteDraft(u).catch(() => {});
        });
      }
    } catch {
      /* kept here; saved again on the next change */
    } finally {
      c.saving = false;
      if (c.again && !c.sent && !c.discarded) {
        c.again = false;
        saveDraftNow(c);
      }
    }
  }
  function discardDraft(c) {
    if (!c) return;
    c.discarded = true;
    clearTimeout(draftTimer);
    if (c.draftUid && B.deleteDraft) B.deleteDraft(c.draftUid).catch(() => {});
    if (S.open) S.replyDrafts.delete(keyOf(S.open));
  }
  // A reply you leave behind stays with its conversation, as "Draft to …".
  function stashReply() {
    const c = S.composer;
    if (!c || !S.open || c.mode === 'new') return;
    if (blankDraft(c)) discardDraft(c);
    else {
      S.replyDrafts.set(keyOf(S.open), c);
      saveDraftNow(c);
    }
  }
  function resumeDraft(i) {
    const m = S.msgs[i];
    if (!m?.draft) return;
    S.msgs.splice(i, 1);
    S.expanded = new Set([...S.expanded].filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
    S.focus = Math.max(0, S.msgs.length - 1);
    S.composer = m.local || {
      mode: 'reply',
      to: addrList(m.to),
      cc: addrList(m.cc),
      subject: m.subject,
      text: m.text || '',
      inReplyTo: m.inReplyTo,
      references: m.references,
      draftUid: m.uid,
    };
    S.composer.extraDrafts = [...(S.composer.extraDrafts || []), ...(m.others || [])].filter(
      (u) => u && u !== S.composer.draftUid,
    );
    S.replyDrafts.delete(keyOf(S.open));
    render();
    focusComposer('text');
  }
  // Leaving a new message keeps it as a draft (C brings it back); an empty one is dropped.
  function leaveCompose(discard) {
    if (discard) discardDraft(S.composer);
    else if (!blankDraft(S.composer)) {
      S.draft = S.composer;
      saveDraftNow(S.composer);
      toast('draft kept. <span class="key">C</span> resume.');
    }
    S.composer = null;
    const b = S.back || { screen: 'list' };
    S.back = null;
    S.screen = b.screen === 'thread' && b.open ? 'thread' : b.screen === 'calendar' ? 'calendar' : 'list';
    if (S.screen === 'thread') {
      S.open = b.open;
      S.msgs = b.msgs;
    }
    render();
  }
  function focusComposer(f) {
    setTimeout(() => {
      const el = root.querySelector(`[data-c="${f}"]`) || layer.querySelector(`[data-c="${f}"]`);
      if (el) {
        el.focus();
        if (f === 'text') el.setSelectionRange(0, 0);
      }
    }, 0);
  }
  function quoted(c) {
    const m = c.quoteOf;
    if (!m) return '';
    const body = (m.text || '').trim();
    if (c.mode === 'forward')
      return `\n\n---------- Forwarded message ----------\nFrom: ${addrList([m.from])}\nDate: ${fullDate(m.date)}\nSubject: ${m.subject || S.open?.subject || ''}\nTo: ${addrList(m.to)}\n\n${body}`;
    return (
      `\n\nOn ${fullDate(m.date)}, ${nameOf(m.from)} wrote:\n` +
      body
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')
    );
  }
  function sendComposer(done) {
    const c = S.composer;
    if (!c) return;
    if (!c.to.trim()) {
      toast('need who.');
      focusComposer('to');
      return;
    }
    const domain = meAddr().split('@')[1] || 'dude.local';
    const messageId = `<dude.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}@${domain}>`;
    learnMyName(S.msgs.map((m) => ({ from: m.from, to: [...(m.to || []), ...(m.cc || [])] })));
    const body = c.text + quoted(c);
    const msg = {
      to: c.to,
      cc: c.cc || '',
      bcc: c.bcc || '',
      files: c.files || [],
      subject: c.subject,
      text: body,
      html: window.Markdown.toHtml(body),
      inReplyTo: c.inReplyTo,
      references: c.references,
      messageId,
      fromName: S.account?.name || '',
    };
    c.sent = true;
    clearTimeout(draftTimer);
    if (S.open) S.replyDrafts.delete(keyOf(S.open));
    const draft = c;
    const inThread = S.screen === 'thread' && S.open && c.mode !== 'new' ? S.open : null;
    const parse = (list) =>
      splitList(list).map((x) => {
        const m = /^(.*?)\s*<([^>]+)>$/.exec(x);
        return m ? { name: m[1].replace(/^"|"$/g, ''), address: m[2] } : { name: '', address: x };
      });
    const mine = inThread && {
      id: messageId,
      messageId,
      pending: true,
      from: { name: S.account?.name || '', address: meAddr() },
      to: parse(c.to),
      cc: parse(c.cc),
      date: Date.now(),
      subject: c.subject,
      text: c.text,
      html: window.Markdown.toHtml(c.text),
      references: [c.references, c.inReplyTo].filter(Boolean).join(' '),
      attachments: (c.files || []).map((f) => ({ filename: f.name, size: f.size, type: f.type })),
    };
    S.composer = null;
    S.pop = false;
    if (mine) {
      const k = keyOf(inThread);
      S.sentIn[k] = S.sentIn[k] || [];
      S.sentIn[k].push(mine);
      if (S.open === inThread) {
        S.msgs.push(mine);
        S.expanded.add(S.msgs.length - 1);
        S.focus = S.msgs.length - 1;
      }
    }
    if (S.screen === 'compose') leaveCompose(true);
    else render();
    if (mine) root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
    const unshow = () => {
      if (!mine) return;
      const k = keyOf(inThread);
      S.sentIn[k] = (S.sentIn[k] || []).filter((m) => m !== mine);
      const i = S.msgs.indexOf(mine);
      if (i >= 0) {
        S.msgs.splice(i, 1);
        S.expanded.delete(i);
        S.focus = Math.min(S.focus, S.msgs.length - 1);
      }
    };
    const timer = setTimeout(async () => {
      S.undo = S.undo.filter((u) => u.send !== timer);
      try {
        await B.send(msg);
        if (mine) {
          mine.pending = false;
          if (S.screen === 'thread') render();
        }
        toast('sent.');
        if (draft.draftUid && B.deleteDraft) B.deleteDraft(draft.draftUid).catch(() => {});
      } catch (e) {
        toast(`not sent: ${esc(e.message || e)}`);
        unshow();
        draft.sent = false;
        S.composer = draft;
        render();
      }
    }, SET().undoSeconds * 1000);
    S.undo.push({ send: timer, draft, unshow });
    if (SET().undoSeconds) toast('sending… <span class="key">Z</span> undo', SET().undoSeconds * 1000);
    if ((done === true || SET().sendAndDone) && inThread) act('done', [inThread], true);
  }
  // Send later: kept here and sent by the app when it's due (the app has to be open then).
  const scheduled = () => LS.get('scheduled', []);
  function sendLater(at) {
    const c = S.composer;
    if (!c) return;
    if (!c.to.trim()) {
      toast('need who.');
      focusComposer('to');
      return;
    }
    if ((c.files || []).length) {
      toast('files + later no work. send now.');
      return;
    }
    LS.set('scheduled', [
      ...scheduled(),
      {
        at,
        msg: {
          to: c.to,
          cc: c.cc || '',
          bcc: c.bcc || '',
          subject: c.subject,
          text: c.text + quoted(c),
          inReplyTo: c.inReplyTo,
          references: c.references,
        },
      },
    ]);
    S.composer = null;
    if (S.screen === 'compose') leaveCompose(true);
    else render();
    toast(`send ${esc(whenLabel(at))}.`);
  }
  async function sendDue() {
    const now = Date.now(),
      list = scheduled(),
      due = list.filter((x) => x.at <= now);
    if (!due.length || !S.account) return;
    LS.set(
      'scheduled',
      list.filter((x) => x.at > now),
    );
    for (const d of due) {
      try {
        await B.send(d.msg);
        toast('scheduled mail sent.');
      } catch {
        LS.set('scheduled', [...scheduled(), d]);
      }
    }
  }
  setInterval(sendDue, 30e3);

  // ---------- reminders ----------
  const whenLabel = (t) => new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  // Choices for the Remind me / Send later palette: what was typed (if it reads as a time), then presets.
  function whenOptions(q) {
    const now = new Date(),
      at = (text) => window.parseWhen(text, now).start;
    const presets = [
      ['tomorrow', at('tomorrow')],
      ['next week', at('next week')],
      ['this weekend', at('this weekend')],
      ['someday', now.getTime() + 90 * DAY],
    ];
    q = (q || '').trim().toLowerCase();
    const typed = q ? window.parseWhen(q, now) : null;
    const list = presets
      .filter(([l]) => !q || l.startsWith(q))
      .map(([l, t]) => [l, t, l === 'someday' ? '¯\\_(ツ)_/¯' : whenLabel(t)]);
    if (typed && !list.some(([l]) => l === q)) list.unshift([q, typed.start, whenLabel(typed.start)]);
    return list;
  }
  function remind(until) {
    const list = targets();
    if (!list.length) return;
    const sn = snoozes();
    list.forEach((t) => {
      sn[keyOf(t)] = until;
    });
    LS.set('snooze', sn);
    S.undo.push({ snooze: list.map(keyOf) });
    S.overlay = null;
    if (S.screen === 'thread') closeThread();
    S.picked.clear();
    S.sel = Math.min(S.sel, Math.max(0, visible().length - 1));
    render();
    renderLayer();
    toast(`remind ${esc(whenLabel(until))} <span class="key">Z</span> undo`);
  }

  // ---------- calendar ----------
  // Real calendar events (Microsoft 365 via EWS after "connect", Google directly), a day at a time,
  // refreshed when older than 5 minutes; your local events show too.
  const calKey = (t) => new Date(t).toDateString();
  async function calStatus() {
    if (!B.calStatus) return null;
    if (!S.cal.status) {
      try {
        S.cal.status = await B.calStatus();
      } catch {
        S.cal.status = { connected: false, canConnect: false };
      }
      if (!S.cal.status.connected && S.cal.status.canConnect && (S.pane === 'calendar' || S.eventForm)) refreshCal(); // show the "connect" prompt
    }
    return S.cal.status;
  }
  // Days are fetched a range at a time (the week, or the day beside the mail) and kept 5 minutes.
  function ensureCalDay(force) {
    return S.screen === 'calendar'
      ? ensureCalRange(weekStartOf(S.calDay), 7, force)
      : ensureCalRange(S.calDay, 1, force);
  }
  async function ensureCalRange(from, n, force) {
    const st = await calStatus();
    if (!st?.connected || !B.calEvents) {
      if (S.screen === 'calendar') updateWeek();
      return;
    }
    const days = Array.from({ length: n }, (_, i) => addDays(from, i));
    const need = days.filter((t) => {
      const h = S.cal.days.get(calKey(t));
      return !S.cal.loading.has(calKey(t)) && (force || !h || Date.now() - h.at > 5 * 60e3);
    });
    if (!need.length) return;
    need.forEach((t) => {
      S.cal.loading.add(calKey(t));
    });
    try {
      const list = await B.calEvents(need[0], dayEnd(need[need.length - 1]));
      need.forEach((t) => {
        const e = dayEnd(t);
        S.cal.days.set(calKey(t), { at: Date.now(), list: list.filter((x) => x.start < e && x.end > t) });
      });
      S.cal.error = null;
    } catch (e) {
      const msg = String(e.message || e);
      if (/CAL_SIGNIN_NEEDED|CAL_NOT_CONNECTED/.test(msg)) {
        S.cal.status = { connected: false, canConnect: true };
        S.cal.error = 'calendar login gone. connect again.';
      } else S.cal.error = 'calendar no load.';
    } finally {
      need.forEach((t) => {
        S.cal.loading.delete(calKey(t));
      });
    }
    redrawCal();
  }
  function redrawCal() {
    if (S.screen === 'calendar') return S.eventForm ? refreshCal() : updateWeek();
    if (S.pane === 'calendar' || S.eventForm || invOf()) refreshCal();
  }
  function updateWeek() {
    const main = S.screen === 'calendar' && root.querySelector('.main');
    if (!main) return;
    const keep = root.querySelector('.cal-b') ? root.querySelector('.cal-b').scrollTop : null;
    main.innerHTML = weekHtml();
    if (keep !== null) S.calScroll = keep;
    calScrollSetup();
  }
  async function connectCalendar() {
    toast('login window…');
    try {
      await B.calConnect();
      S.cal.status = { connected: true, canConnect: true };
      S.cal.days.clear();
      S.cal.error = null;
      toast('calendar linked.');
      ensureCalDay(true);
      render();
    } catch (e) {
      toast(`calendar link fail: ${esc(errText(e))}`, 8000);
    }
  }
  const events = () => LS.get('events', []);
  function eventDialog(at = {}) {
    const t = S.screen === 'thread' ? S.open : null;
    const guests = new Set();
    if (t)
      S.msgs.forEach((m) => {
        [m.from, ...(m.to || []), ...(m.cc || [])].forEach((p) => {
          if (p?.address && p.address.toLowerCase() !== meAddr()) guests.add(p.address);
        });
      });
    S.eventForm = {
      title: t ? t.subject.replace(/^((re|fwd?|vs|aw|sv):\s*)+/i, '') : '',
      guests: [...guests].join(', '),
      when: '',
      where: '',
      notes: '',
      start: at.start,
      end: at.end,
      fresh: true,
    };
    S.paneBefore = S.pane;
    if (S.screen !== 'calendar') S.pane = 'calendar';
    render();
    setTimeout(() => root.querySelector('[data-e="title"]')?.focus(), 0);
  }
  // When the event is: the typed time, else the next half hour; 30 minutes unless a length is typed.
  function eventTimes(f) {
    if (!f.when.trim() && f.start) return { ok: true, start: f.start, end: f.end || f.start + 30 * 60e3 };
    const p = f.when.trim() ? window.parseWhen(f.when, new Date(), 9) : null;
    const start = p
      ? p.start
      : (() => {
          const d = new Date();
          d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
          return d.getTime();
        })();
    return { ok: !f.when.trim() || !!p, start, end: start + (p?.minutes || 30) * 60e3 };
  }
  function closeEvent() {
    S.eventForm = null;
    S.invFor = null;
    if (S.screen !== 'calendar') S.pane = S.paneBefore || S.pane;
    render();
  }
  async function saveEvent() {
    const f = S.eventForm;
    if (!f) return;
    const tm = eventTimes(f);
    if (!f.title.trim()) {
      toast('event need name.');
      root.querySelector('[data-e="title"]')?.focus();
      return;
    }
    if (!tm.ok) {
      toast('time? like “tomorrow 2 pm 30 min”');
      return;
    }
    const ev = {
      id: `ev${Date.now()}`,
      title: f.title.trim(),
      start: tm.start,
      end: tm.end,
      where: f.where,
      notes: f.notes,
      guests: f.guests.match(/[^\s<>,;"]+@[^\s<>,;"]+/g) || [],
    };
    S.eventForm = null;
    S.calDay = dayStart(ev.start);
    S.calScroll = undefined;
    if (S.screen !== 'calendar') {
      S.pane = 'calendar';
      LS.set('pane', S.pane);
    }
    if (f.id) {
      // a change to an event that exists
      if (!f.server) {
        LS.set(
          'events',
          events().map((x) => (x.id === f.id ? { ...x, ...ev, id: x.id } : x)),
        );
        toast('event changed.');
        return render();
      }
      render();
      try {
        await B.calUpdate(f.id, { ...ev, guests: f.guestsTouched ? ev.guests : undefined, attendees: f.attendees });
        toast('event changed.');
      } catch (e) {
        toast(`change fail: ${esc(errText(e))}`, 8000);
      }
      S.cal.days.clear();
      ensureCalDay(true);
      return;
    }
    const st = await calStatus();
    if (st?.connected) {
      // straight into your real calendar; the calendar service sends the invitations
      render();
      try {
        await B.calCreate(ev);
        ensureCalDay(true);
        toast(
          ev.guests.length
            ? `event in calendar. ${ev.guests.length} invite${ev.guests.length > 1 ? 's' : ''} sent.`
            : 'event in calendar.',
        );
        return;
      } catch (e) {
        if (/CAL_SIGNIN_NEEDED/.test(String(e.message))) S.cal.status = { connected: false, canConnect: true };
        toast('calendar no take it. sending invite by mail.');
      }
    }
    LS.set('events', [...events(), ev]);
    render();
    try {
      await B.invite(ev);
      toast(
        ev.guests.length
          ? `invite sent. ${ev.guests.length} ${ev.guests.length > 1 ? 'guests' : 'guest'}.`
          : 'event made. invite in your mail.',
      );
    } catch (e) {
      toast(`event kept. invite fail: ${esc(e.message || e)}`);
    }
  }
  function dayMove(d) {
    S.calDay = dayStart(S.calDay + d * DAY + 2 * 3600e3);
    render();
  }
  function findEvent(id) {
    for (const d of S.cal.days.values()) {
      const x = (d.list || []).find((e) => String(e.id) === id);
      if (x) return x;
    }
    return events().find((e) => String(e.id) === id) || null;
  }
  const RESP = { Accept: 'yes', Tentative: 'maybe', Decline: 'no' };
  // An event you click: yours open to change; other people's meetings show what they are, to answer.
  async function openEvent(id) {
    if (id === 'inv') return; // the invitation's own box answers it
    const x = findEvent(id);
    if (!x) return;
    const readOnly = !!(x.server && x.isMeeting && !x.isOrganizer);
    S.eventForm = {
      id: String(x.id),
      server: !!x.server,
      title: x.title,
      when: '',
      start: x.start,
      end: x.end,
      where: x.where || '',
      notes: x.notes || '',
      guests: (x.guests || []).join(', '),
      organizer: x.organizer || '',
      response: x.response,
      readOnly,
      said: RESP[x.response] || '',
      fresh: true,
    };
    S.paneBefore = S.pane;
    if (S.screen !== 'calendar') S.pane = 'calendar';
    render();
    const f = S.eventForm;
    if (!x.server || !B.calDetail) return;
    try {
      const d = await B.calDetail(f.id);
      if (S.eventForm !== f || !d || f.dirty) return;
      const orgMail = String(d.organizer?.email || '').toLowerCase();
      const others = (d.attendees || []).filter(
        (a) => String(a.email).toLowerCase() !== meAddr() && (!readOnly || String(a.email).toLowerCase() !== orgMail),
      );
      f.notes = d.notes || '';
      f.attendees = d.attendees;
      f.guests = readOnly ? others.map((a) => a.name || a.email).join(', ') : others.map((a) => a.email).join(', ');
      if (d.organizer) f.organizer = d.organizer.name || d.organizer.email;
      const el = root.querySelector('.evform');
      if (el) el.outerHTML = evFormHtml(f);
    } catch {}
  }
  async function deleteEvent() {
    const f = S.eventForm;
    if (!f?.id || f.readOnly) return;
    S.eventForm = null;
    if (!f.server) {
      LS.set(
        'events',
        events().filter((x) => x.id !== f.id),
      );
      toast('event gone.');
      return render();
    }
    for (const d of S.cal.days.values()) d.list = (d.list || []).filter((x) => String(x.id) !== f.id);
    render();
    try {
      await B.calDelete(f.id);
      toast('event gone.');
    } catch (e) {
      toast(`delete fail: ${esc(errText(e))}`, 8000);
    }
    S.cal.days.clear();
    ensureCalDay(true);
  }
  async function answerEvent(ans) {
    const f = S.eventForm;
    if (!f?.readOnly || !B.rsvp) return;
    const before = f.said;
    f.said = ans;
    const mark = (x) =>
      root.querySelectorAll('[data-evrsvp]').forEach((b) => {
        const on = b.dataset.evrsvp === x;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
    mark(ans);
    toast('telling…');
    try {
      await B.rsvp(
        S.account && S.account.provider === 'google' ? { gid: f.id, title: f.title } : { ews: f.id, title: f.title },
        ans,
        S.account?.name || '',
      );
      toast(`${{ yes: 'going.', maybe: 'maybe.', no: 'not going.' }[ans]} organizer told.`);
      S.cal.days.clear();
      ensureCalDay(true);
    } catch (e) {
      f.said = before;
      mark(before || '');
      toast(`rsvp fail: ${esc(errText(e))}`, 8000);
    }
  }
  // Mail and calendar: 1 and 2, like the two buttons on the left.
  function goCal() {
    if (S.screen === 'calendar') return;
    if (S.screen === 'compose') leaveCompose();
    if (S.screen === 'thread') stashReply();
    S.calFrom = { screen: S.screen === 'thread' ? 'thread' : 'list', open: S.open, msgs: S.msgs };
    S.composer = null;
    S.eventForm = null;
    S.mmMonth = null;
    S.calScroll = undefined;
    S.screen = 'calendar';
    render();
  }
  function goMail() {
    if (S.screen !== 'calendar') return;
    const b = S.calFrom || { screen: 'list' };
    S.eventForm = null;
    S.screen = b.screen === 'thread' && b.open ? 'thread' : 'list';
    if (S.screen === 'thread') {
      S.open = b.open;
      S.msgs = b.msgs;
    }
    render();
  }
  function weekMove(n) {
    S.calDay = addDays(weekStartOf(S.calDay), 7 * n);
    S.mmMonth = null;
    render();
  }
  function calToday() {
    S.calDay = dayStart(Date.now());
    S.mmMonth = null;
    S.calScroll = undefined;
    render();
  }
  function setCalOpt(k, v) {
    LS.set(`cal:${k}`, v);
    S.mmMonth = null;
    render();
  }
  // Pressing on an empty spot makes an event there; dragging sets how long (15-minute steps).
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !e.target.closest) return;
    const col = e.target.closest('.wk-col, .cal-g');
    if (!col || e.target.closest('.cal-ev')) return;
    const day = +col.dataset.day;
    if (!day) return;
    e.preventDefault();
    const at = (y) => {
      const r = col.getBoundingClientRect(),
        m = Math.max(0, Math.min(24 * 60, Math.floor(((y - r.top) / HPX) * 4) * 15)),
        d = new Date(day);
      d.setMinutes(m);
      return d.getTime();
    };
    const a = at(e.clientY);
    let b = a + 30 * 60e3,
      moved = false;
    const sel = document.createElement('div');
    sel.className = 'cal-ev draft';
    col.appendChild(sel);
    const draw = () => {
      const s0 = Math.min(a, b),
        e0 = Math.max(b, a + 15 * 60e3);
      sel.style.cssText = `top:${((s0 - day) / 3600e3) * HPX}px;height:${Math.max(15, ((e0 - s0) / 3600e3) * HPX - 2)}px;left:2px;right:auto;width:calc(100% - 4px)`;
      sel.innerHTML = `<b>new event</b> ${esc(fmtTime(s0))} – ${esc(fmtTime(e0))}`;
    };
    draw();
    const move = (ev) => {
      if (Math.abs(ev.clientY - e.clientY) > 4) moved = true;
      if (moved) {
        b = at(ev.clientY + HPX / 8);
        if (b <= a) b = a + 15 * 60e3;
        draw();
      }
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      sel.remove();
      eventDialog({ start: a, end: moved ? Math.max(b, a + 15 * 60e3) : a + 30 * 60e3 });
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  document.addEventListener('change', (e) => {
    const o = e.target.dataset?.calopt;
    if (o) setCalOpt(o, e.target.checked);
  });

  // ---------- invitations ----------
  const ANS = { ACCEPTED: 'yes', TENTATIVE: 'maybe', DECLINED: 'no' };
  function invIdx() {
    if (S.screen !== 'thread') return -1;
    for (let i = S.msgs.length - 1; i >= 0; i--)
      if (S.msgs[i].invite && !S.msgs[i].invite.cancelled && !S.msgs[i].invite.pending) return i;
    return -1;
  }
  const invOf = () => {
    const i = invIdx();
    return i < 0 ? null : S.msgs[i].invite;
  };
  function rsvpOf(v) {
    const said = LS.get('rsvp', {})[v.uid || v.ews];
    if (said) return said;
    const mine = (v.attendees || []).find((a) => String(a.email).toLowerCase() === meAddr());
    return ANS[v.my] || (mine ? ANS[mine.status] || '' : '');
  }
  const meetings = new Map(); // Outlook item id -> invitation read from the calendar
  async function fillMeeting(m) {
    const id = m.invite.ews;
    if (meetings.has(id)) {
      const got = meetings.get(id);
      if (got && typeof got === 'object') m.invite = got;
      return;
    }
    // the conversation may have been reloaded meanwhile: find its message by the invite's id
    const redraw = () =>
      S.msgs.forEach((x, i) => {
        if (!x.invite || x.invite.ews !== id) return;
        const got = meetings.get(id);
        if (got && typeof got === 'object') x.invite = got;
        const el = root.querySelector(`.msg[data-m="${i}"] .invite`);
        if (el) el.outerHTML = inviteHtml(x, i);
      });
    const st = await calStatus();
    if (!st?.connected || !B.meeting) return redraw(); // shows "connect"
    meetings.set(id, 'busy');
    try {
      const got = await B.meeting(id);
      meetings.set(id, got || 'fail');
    } catch {
      meetings.set(id, 'fail');
    }
    redraw();
    if (S.screen === 'thread' && invOf() && invOf().ews === id) render(); // its day beside it
  }
  function inviteHtml(m, i) {
    if (m.invite.pending) {
      const st = S.cal.status;
      if (!(st && !st.connected) && meetings.get(m.invite.ews) !== 'fail') fillMeeting(m);
      if (meetings.get(m.invite.ews) === 'fail')
        return '<div class="invite"><div class="inv-row"><span class="inv-q">rsvp</span><span class="inv-a">invite no load. open in outlook.</span></div></div>';
      if (m.invite.pending && st && !st.connected)
        return `<div class="invite"><div class="inv-row"><span class="inv-q">rsvp</span><span class="inv-a">outlook invite. need calendar. <button class="inv-b" data-a="cal-connect">connect</button></span></div></div>`;
      if (m.invite.pending)
        return '<div class="invite"><div class="inv-row"><span class="inv-q">rsvp</span><span class="inv-a">reading invite…</span></div></div>';
    }
    const v = m.invite,
      said = rsvpOf(v),
      opt = { weekday: 'long', day: 'numeric', month: 'long' };
    const when = v.allDay
      ? new Date(v.start).toLocaleDateString([], opt)
      : `${new Date(v.start).toLocaleString([], { ...opt, hour: 'numeric', minute: '2-digit' })} – ${fmtTime(v.end)}`;
    const ppl = [v.organizer, ...(v.attendees || [])].filter((p) => p?.email);
    const who = ppl
      .filter((p, k) => ppl.findIndex((q) => q.email.toLowerCase() === p.email.toLowerCase()) === k)
      .map((p) => (p.email.toLowerCase() === meAddr() ? 'Me' : p.name || p.email));
    const row = (q, a) => `<div class="inv-row"><span class="inv-q">${q}</span><span class="inv-a">${a}</span></div>`;
    return `<div class="invite${v.cancelled ? ' off' : ''}">
      ${v.cancelled ? row('rsvp', 'event cancelled.') : row('rsvp', ['yes', 'maybe', 'no'].map((x) => `<button class="inv-b${said === x ? ' on' : ''}" data-rsvp="${i}:${x}" aria-pressed="${said === x}">${x}</button>`).join(''))}
      ${row('when', `<button class="inv-when" data-invday="${i}" title="show day">${esc(when)}</button>`)}
      ${v.where ? row('where', esc(v.where)) : ''}
      ${who.length ? row('who', esc(who.slice(0, 6).join(', ') + (who.length > 6 ? ` +${who.length - 6}` : ''))) : ''}
    </div>`;
  }
  async function answerInvite(i, ans) {
    // the button's message, or (if the conversation was reloaded meanwhile) the newest invitation in it
    let m = S.msgs[i];
    if (!m?.invite) {
      i = invIdx();
      m = S.msgs[i];
    }
    let v = m?.invite;
    if (!v) return toast('no invite here.');
    if (!B.rsvp) return toast('no answer in this mode.');
    if (v.cancelled) return toast('event cancelled. nothing to answer.');
    if (v.pending) {
      // an Outlook invite still being read: read it now
      try {
        const got = await B.meeting(v.ews);
        if (got) {
          meetings.set(v.ews, got);
          v = m.invite = got;
        }
      } catch (e) {
        return toast(`invite no read: ${esc(errText(e))}`, 8000);
      }
      if (!v || v.pending) return toast('invite no read. link calendar first.', 8000);
    }
    const before = LS.get('rsvp', {})[v.uid || v.ews];
    const key = v.uid || v.ews,
      keep = (x) => {
        const map = LS.get('rsvp', {});
        if (x) map[key] = x;
        else delete map[key];
        LS.set('rsvp', map);
      };
    const mark = (x) =>
      root.querySelectorAll(`[data-rsvp^="${i}:"]`).forEach((b) => {
        const on = b.dataset.rsvp === `${i}:${x}`;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
    keep(ans);
    mark(ans);
    toast('telling…');
    try {
      const r = await B.rsvp(v, ans, S.account?.name || '');
      toast(
        { yes: 'going.', maybe: 'maybe.', no: 'not going.' }[ans] +
          (r && r.via === 'calendar' ? ' calendar updated.' : ' organizer told.'),
      );
      if (SET().rsvpAndDone && S.open) act('done', [S.open], true);
      S.cal.days.clear();
      ensureCalDay(true);
    } catch (e) {
      keep(before);
      mark(before || '');
      toast(`rsvp fail: ${esc(errText(e))}`, 8000);
    }
  }

  // ---------- commands ----------
  const inList = () => S.screen === 'list' && !!current();
  const anyThread = () => (S.screen === 'thread' && !!S.open) || inList();
  const goto = (view, split) => () => {
    if (S.screen === 'calendar') {
      S.screen = 'list';
      S.eventForm = null;
    }
    if (S.screen === 'thread') closeThread();
    if (split) S.split = split;
    if (view !== S.view || split === undefined) load(view);
    else {
      S.sel = 0;
      render();
    }
  };
  const COMMANDS = [
    { t: 'Mark Done', k: ['E'], a: ['archive'], when: anyThread, run: () => act('done') },
    { t: 'Remind Me', k: ['H'], a: ['snooze', 'later', 'boomerang'], when: anyThread, run: () => openWhen('remind') },
    { t: 'Star or Unstar', k: ['S'], a: ['flag'], when: anyThread, run: () => toggle('star') },
    { t: 'Mark Read or Unread', k: ['U'], when: anyThread, run: () => toggle('read') },
    {
      t: 'Mark not Done',
      k: ['Shift', 'E'],
      a: ['move to inbox', 'unarchive'],
      when: anyThread,
      run: () => act('undone'),
    },
    { t: 'Trash', k: ['#'], a: ['delete'], when: anyThread, run: () => act('trash') },
    { t: 'Mark as Spam', k: ['!'], a: ['junk'], when: anyThread, run: () => act('spam') },
    { t: 'Reply All', k: ['Enter'], when: () => S.screen === 'thread', run: () => startCompose('replyall') },
    { t: 'Reply', k: ['R'], when: () => S.screen === 'thread', run: () => startCompose('reply') },
    { t: 'Forward', k: ['F'], when: () => S.screen === 'thread', run: () => startCompose('forward') },
    { t: 'Compose', k: ['C'], a: ['new message', 'write'], run: () => startCompose('new') },
    { t: 'Search', k: ['/'], a: ['find'], run: () => openSearch() },
    { t: 'Create Event', k: ['B'], a: ['calendar', 'meeting', 'invite', 'schedule'], run: () => eventDialog() },
    {
      t: 'Open Week',
      k: ['2'],
      a: ['calendar', 'see my week', 'week view', 'open calendar'],
      when: () => S.screen !== 'calendar',
      run: () => goCal(),
    },
    {
      t: 'Back to Mail',
      k: ['1'],
      a: ['inbox', 'mail', 'close calendar'],
      when: () => S.screen === 'calendar',
      run: () => goMail(),
    },
    { t: 'Today', k: ['T'], a: ['calendar today'], when: () => S.screen === 'calendar', run: () => calToday() },
    { t: 'Next Week', k: ['='], when: () => S.screen === 'calendar', run: () => weekMove(1) },
    { t: 'Previous Week', k: ['-'], when: () => S.screen === 'calendar', run: () => weekMove(-1) },
    {
      get t() {
        return LS.get('cal:weekends', true) ? 'Hide Weekends' : 'Show Weekends';
      },
      k: [],
      a: ['weekends', 'calendar'],
      run: () => setCalOpt('weekends', !LS.get('cal:weekends', true)),
    },
    {
      get t() {
        return LS.get('cal:declined', false) ? 'Hide Declined Events' : 'Show Declined Events';
      },
      k: [],
      a: ['declined', 'calendar'],
      run: () => setCalOpt('declined', !LS.get('cal:declined', false)),
    },
    {
      get t() {
        return LS.get('cal:monday', false) ? 'Start Week on Sunday' : 'Start Week on Monday';
      },
      k: [],
      a: ['week start', 'calendar'],
      run: () => setCalOpt('monday', !LS.get('cal:monday', false)),
    },
    {
      t: 'Delete Event',
      k: [],
      a: ['remove event', 'cancel event'],
      when: () => !!(S.eventForm?.id && !S.eventForm.readOnly),
      run: () => deleteEvent(),
    },
    {
      t: 'Show or Hide Calendar',
      k: ['0'],
      a: ['calendar', 'agenda', 'open day', 'day view'],
      run: () => {
        S.pane = S.pane === 'calendar' ? 'contact' : 'calendar';
        LS.set('pane', S.pane);
        render();
      },
    },
    { t: 'Next Split Inbox', k: ['Tab'], when: () => S.view === 'inbox', run: () => switchSplit() },
    { t: 'Previous Split Inbox', k: ['Shift', 'Tab'], when: () => S.view === 'inbox', run: () => switchSplit(-1) },
    {
      t: 'New Split Inbox',
      k: [],
      a: ['add split', 'create split', 'filter'],
      run: () => {
        S.overlay = { kind: 'cmd', mode: 'split', q: '', i: 0 };
        renderLayer(true);
      },
    },
    {
      t: 'Send Later',
      k: [MOD, 'Shift', 'L'],
      a: ['schedule send'],
      when: () => !!S.composer,
      run: () => openWhen('later'),
    },
    { t: 'Discard Draft', k: [MOD, 'Shift', ','], when: () => !!S.composer, run: () => ACTIONS.discard() },
    { t: 'Go to Important', k: ['G', 'I'], a: ['inbox'], run: goto('inbox', 'important') },
    { t: 'Go to Other', k: ['G', 'O'], run: goto('inbox', 'other') },
    { t: 'Go to Starred', k: ['G', 'S'], run: goto('starred') },
    { t: 'Go to Drafts', k: ['G', 'D'], run: goto('drafts') },
    { t: 'Go to Sent', k: ['G', 'T'], run: goto('sent') },
    { t: 'Go to Done', k: ['G', 'E'], a: ['archive'], run: goto('done') },
    { t: 'Go to Reminders', k: ['G', 'H'], a: ['snoozed'], run: goto('reminders') },
    { t: 'Go to Spam', k: ['G', '!'], a: ['junk'], run: goto('spam') },
    { t: 'Go to Trash', k: ['G', '#'], a: ['deleted'], run: goto('trash') },
    { t: 'Go to All Mail', k: ['G', 'A'], run: goto('all') },
    { t: 'Select Conversation', k: ['X'], when: inList, run: () => pick() },
    { t: 'Undo', k: ['Z'], run: () => undo() },
    { t: 'Refresh', k: [], a: ['sync', 'reload'], run: () => load(S.view, true) },
    {
      t: 'Switch Theme',
      k: [],
      a: ['dark', 'light', 'carbon', 'appearance'],
      run: () => setTheme(!document.documentElement.classList.contains('carbon')),
    },
    {
      t: 'Settings',
      k: [MOD, ','],
      a: ['preferences', 'signature', 'signatures', 'undo send', 'theme'],
      run: () => openSettings(),
    },
    { t: 'Go to Folder…', k: ['←'], a: ['folders', 'labels', 'menu'], run: () => openMenu() },
    { t: 'Go to Scheduled', k: [], a: ['send later'], run: goto('scheduled') },
    {
      t: 'Connect Calendar',
      k: [],
      a: ['calendar sync', 'link calendar', 'outlook calendar', 'exchange'],
      when: () => !!B.calConnect && !S.cal.status?.connected,
      run: () => connectCalendar(),
    },
    ...[
      ['yes', 'Yes', ['accept', 'going']],
      ['maybe', 'Maybe', ['tentative']],
      ['no', 'No', ['decline', 'not going']],
    ].map(([x, w, al]) => ({
      get t() {
        return `RSVP: ${w}${SET().rsvpAndDone ? ' and Mark Done' : ''}`;
      },
      k: [],
      a: ['invite', ...al],
      when: () => invIdx() >= 0 && !!B.rsvp,
      run: () => answerInvite(invIdx(), x),
    })),
    {
      get t() {
        return `RSVP + Mark Done: ${SET().rsvpAndDone ? 'turn off' : 'turn on'}`;
      },
      k: [],
      a: ['settings', 'invite'],
      run: () => {
        setSetting('rsvpAndDone', !SET().rsvpAndDone);
        toast(SET().rsvpAndDone ? 'rsvp then done.' : 'rsvp only.');
      },
    },
    {
      t: 'Move',
      k: ['V'],
      a: ['folder', 'file', 'move to folder'],
      when: anyThread,
      run: () => openFolderPick('move'),
    },
    {
      t: 'Label',
      k: ['L'],
      a: ['add label', 'tag', 'copy to folder'],
      when: () => anyThread() && isGmail(),
      run: () => openFolderPick('copy'),
    },
    {
      t: 'Mute',
      k: [],
      a: ['ignore conversation', 'silence'],
      when: () => anyThread() && !isMuted(),
      run: () => mute(true),
    },
    { t: 'Unmute', k: [], when: () => anyThread() && isMuted(), run: () => mute(false) },
    {
      get t() {
        const t = targets()[0];
        return `Block Sender: ${t?.from.address || ''}`;
      },
      k: [],
      a: ['block', 'spam sender'],
      when: () => anyThread() && !isBlocked(),
      run: () => block(true),
    },
    {
      get t() {
        const t = targets()[0];
        return `Unblock Sender: ${t?.from.address || ''}`;
      },
      k: [],
      when: () => anyThread() && isBlocked(),
      run: () => block(false),
    },
    {
      t: 'Remove Reminder',
      k: [],
      a: ['unsnooze', 'snooze'],
      when: () => anyThread() && targets().some((t) => snoozes()[keyOf(t)] > Date.now()),
      run: () => {
        const sn = snoozes();
        targets().forEach((t) => {
          delete sn[keyOf(t)];
        });
        LS.set('snooze', sn);
        toast('remind gone.');
        load(S.view, true);
      },
    },
    {
      t: 'Unsubscribe',
      k: [],
      a: ['newsletter', 'mailing list'],
      when: () => S.screen === 'thread' && S.msgs.some((m) => m.unsub),
      run: () => unsubscribe(false),
    },
    {
      t: 'Unsubscribe and Mark Done',
      k: [],
      a: ['newsletter', 'mailing list'],
      when: () => S.screen === 'thread' && S.msgs.some((m) => m.unsub),
      run: () => unsubscribe(true),
    },
    {
      t: 'Get Me To Zero',
      k: [],
      a: ['bulk mark done', 'bulk archive', 'inbox zero', 'clean up my inbox'],
      when: () => S.screen === 'list' && visible().length > 0,
      run: () => {
        S.overlay = { kind: 'cmd', mode: 'zero', q: '', i: 0 };
        renderLayer(true);
      },
    },
    {
      get t() {
        return S.unreadOnly ? 'Show All Conversations' : 'Filter Unread Conversations';
      },
      k: [],
      a: ['unread only', 'filter'],
      when: () => S.screen === 'list',
      run: () => {
        S.unreadOnly = !S.unreadOnly;
        S.sel = 0;
        render();
        toast(S.unreadOnly ? 'unread only.' : 'all mail.');
      },
    },
    {
      t: 'Select All',
      k: [MOD, 'A'],
      when: () => S.screen === 'list' && visible().length > 0,
      run: () => selectAll(false),
    },
    {
      t: 'Select All From Here',
      k: [MOD, 'Shift', 'A'],
      when: () => S.screen === 'list' && visible().length > 0,
      run: () => selectAll(true),
    },
    {
      t: 'Expand / Collapse All Messages',
      k: ['Shift', 'O'],
      when: () => S.screen === 'thread',
      run: () => expandAll(),
    },
    { t: 'Expand / Collapse Message', k: ['O'], when: () => S.screen === 'thread', run: () => toggleMsg() },
    { t: 'Copy Subject', k: [], when: anyThread, run: () => copy(targets()[0]?.subject || '', 'subject') },
    {
      t: 'Copy Recipients',
      k: [],
      when: () => S.screen === 'thread' && !!focusedMsg(),
      run: () => {
        const m = focusedMsg();
        copy(
          addrList(
            [m.from, ...(m.to || []), ...(m.cc || [])].filter((p) => p && (p.address || '').toLowerCase() !== meAddr()),
          ),
          'recipients',
        );
      },
    },
    {
      t: 'Copy Message Contents',
      k: [],
      when: () => S.screen === 'thread' && !!focusedMsg(),
      run: () => copy(focusedMsg().text || '', 'message'),
    },
    {
      t: 'Copy Conversation Contents',
      k: [],
      when: () => S.screen === 'thread' && S.msgs.length > 0,
      run: () =>
        copy(
          S.msgs
            .filter((m) => !m.draft)
            .map((m) => `From: ${addrList([m.from])}\nDate: ${fullDate(m.date)}\n\n${(m.text || '').trim()}`)
            .join('\n\n----\n\n'),
          'conversation',
        ),
    },
    {
      t: 'Copy Message to New Draft',
      k: [],
      a: ['duplicate message', 'resend'],
      when: () => S.screen === 'thread' && !!focusedMsg(),
      run: () => {
        const m = focusedMsg();
        composeNew({
          to: addrList(m.to),
          cc: addrList(m.cc),
          subject: m.subject || S.open.subject || '',
          text: m.text || '',
        });
      },
    },
    {
      t: 'Open Attachment',
      k: [],
      a: ['open file', 'download'],
      when: () => S.screen === 'thread' && S.msgs.some((m) => (m.attachments || []).length),
      run: () => {
        const m = focusedMsg()?.attachments.length ? focusedMsg() : S.msgs.find((x) => (x.attachments || []).length);
        openFile(m.folder, m.uid, m.attachments[0].filename, 0, 'open');
      },
    },
    {
      t: 'Print',
      k: [],
      a: ['save as pdf', 'print to pdf', 'export to pdf'],
      when: () => S.screen === 'thread',
      run: () => setTimeout(() => window.print(), 50),
    },
    {
      get t() {
        const t = targets()[0];
        return `Compose to ${t?.from.address || ''}`;
      },
      k: [],
      a: ['email sender', 'write to'],
      when: () => anyThread() && !!targets()[0]?.from.address,
      run: () => composeNew({ to: addrList([targets()[0].from]) }),
    },
    {
      t: 'Instant Intro',
      k: [],
      a: ['move sender to bcc', 'to bcc'],
      when: () => S.screen === 'thread' && S.msgs.length > 0,
      run: () => instantIntro(),
    },
    {
      t: 'Send & Mark Done',
      k: [],
      a: ['send and archive'],
      when: () => !!S.composer && S.screen === 'thread',
      run: () => sendComposer(true),
    },
    {
      get t() {
        return `Send + Mark Done always: ${SET().sendAndDone ? 'turn off' : 'turn on'}`;
      },
      k: [],
      a: ['settings', 'send and done'],
      run: () => {
        setSetting('sendAndDone', !SET().sendAndDone);
        toast(SET().sendAndDone ? 'send then done.' : 'send only.');
      },
    },
    {
      t: 'Attach',
      k: [MOD, 'Shift', 'A'],
      a: ['add attachment', 'file'],
      when: () => !!S.composer,
      run: () => attachFiles(),
    },
    { t: 'Change To', k: [], a: ['edit recipients'], when: () => !!S.composer, run: () => focusComposer('to') },
    { t: 'Change CC', k: [MOD, 'Shift', 'C'], a: ['add cc'], when: () => !!S.composer, run: () => ACTIONS.showcc() },
    { t: 'Change BCC', k: [MOD, 'Shift', 'B'], a: ['add bcc'], when: () => !!S.composer, run: () => ACTIONS.showbcc() },
    { t: 'Change Subject', k: [], a: ['edit subject'], when: () => !!S.composer, run: () => focusComposer('subject') },
    { t: 'Use Snippet', k: [';'], a: ['template', 'canned response', 'insert snippet'], run: () => snippetPick() },
    {
      t: 'Create Snippet from Draft',
      k: [],
      a: ['save template', 'new snippet'],
      when: () => !!S.composer && !!S.composer.text.trim(),
      run: () => {
        S.overlay = { kind: 'cmd', mode: 'snipname', q: '', i: 0 };
        renderLayer(true);
      },
    },
    {
      t: 'Jump to Date',
      k: [],
      a: ['go to date', 'calendar day', 'open day'],
      run: () => {
        S.overlay = { kind: 'cmd', mode: 'date', q: '', i: 0 };
        renderLayer(true);
      },
    },
    {
      t: 'Close Calendar',
      k: ['0'],
      when: () => S.pane === 'calendar' && !S.eventForm,
      run: () => {
        S.pane = 'contact';
        LS.set('pane', S.pane);
        render();
      },
    },
    { t: 'Set Theme: Carbon', k: [], a: ['dark theme', 'dark mode'], run: () => setTheme(true) },
    { t: 'Set Theme: Light', k: [], a: ['light theme', 'light mode', 'snow'], run: () => setTheme(false) },
    ...[
      ['important', 'Important Only'],
      ['all', 'All Mail'],
      ['off', 'Off'],
    ].map(([v, l]) => ({
      t: `Notifications: ${l}`,
      k: [],
      a: ['notification settings', 'alerts'],
      when: () => (SET().notify || 'important') !== v,
      run: () => {
        setSetting('notify', v);
        toast(`notifications ${v}.`);
      },
    })),
    {
      t: 'Refresh Calendar',
      k: [],
      a: ['calendar sync'],
      when: () => !!B.calEvents,
      run: () => {
        S.cal.days.clear();
        ensureCalDay(true);
      },
    },
    {
      t: 'Keyboard Shortcuts',
      k: ['?'],
      a: ['help', 'keys'],
      run: () => {
        S.overlay = { kind: 'keys' };
        renderLayer();
      },
    },
    {
      t: 'Sign Out',
      k: [],
      a: ['logout', 'account'],
      when: () => !B.demo,
      run: async () => {
        await B.signOut(S.account.email);
        S.account = null;
        S.screen = 'signin';
        S.more = false;
        render();
      },
    },
    {
      t: 'Leave Demo',
      k: [],
      when: () => !!B.demo,
      run: () => {
        if (window.mail) B = window.mail;
        S.account = null;
        S.screen = 'signin';
        S.more = false;
        render();
      },
    },
  ];
  function paletteItems(q) {
    const o = S.overlay || {};
    q = (q || '').trim();
    if (o.mode === 'split') {
      const t = current() || S.open,
        out = [];
      if (q) out.push({ t: `New Split Inbox with: ${q}`, k: [], run: () => addSplit(q, q) });
      if (t) {
        const a = (t.from.address || '').toLowerCase(),
          dom = a.split('@')[1];
        out.push({ t: `New Split Inbox with sender: ${a}`, k: [], run: () => addSplit(t.from.name || a, `from:${a}`) });
        if (dom)
          out.push({ t: `New Split Inbox with domain: ${dom}`, k: [], run: () => addSplit(dom, `domain:${dom}`) });
        (t.to || []).slice(0, 1).forEach((p) => {
          out.push({
            t: `New Split Inbox with recipient: ${p.address}`,
            k: [],
            run: () => addSplit(p.address, `to:${p.address}`),
          });
        });
        if (t.subject)
          out.push({
            t: `New Split Inbox with subject: ${t.subject}`,
            k: [],
            run: () => addSplit(t.subject.slice(0, 30), `subject:"${t.subject.replace(/"/g, '')}"`),
          });
      }
      return out;
    }
    if (o.mode === 'move' || o.mode === 'copy') {
      const base =
        o.mode === 'copy'
          ? []
          : [
              ['Inbox', 'undone'],
              ['Done', 'done'],
              ['Spam', 'spam'],
              ['Trash', 'trash'],
            ].map(([l, a]) => ({ t: l, k: [], run: () => act(a) }));
      const own = (S.folders || []).map((f) => ({
        t: f.name,
        lbl: f.path !== f.name ? f.path : '',
        k: [],
        run: () => moveTo(f, o.mode),
      }));
      const all = [...base, ...own],
        ql = fold(q);
      if (!S.folders) all.push({ t: 'folders loading…', k: [], run: () => {} });
      return ql ? all.filter((x) => fold(`${x.t} ${x.lbl || ''}`).includes(ql)) : all;
    }
    if (o.mode === 'zero')
      return [
        ['older than 1 day', 1],
        ['older than 1 week', 7],
        ['older than 2 weeks', 14],
        ['older than 1 month', 30],
        ['all of this split', 0],
      ]
        .map(([l, d]) => {
          const list = visible().filter((t) => !d || t.date < Date.now() - d * DAY);
          return {
            t: `Mark Done: ${l}`,
            lbl: `${list.length} conversation${list.length === 1 ? '' : 's'}`,
            run: () => {
              if (list.length) act('done', list);
            },
          };
        })
        .filter((x) => !q || x.t.toLowerCase().includes(q.toLowerCase()));
    if (o.mode === 'date') {
      const now = new Date(),
        opts = [
          ['today', now.getTime()],
          ['tomorrow', now.getTime() + DAY],
          ['next week', window.parseWhen('next week', now).start],
        ];
      const typed = q ? window.parseWhen(q, now, 9) : null;
      if (typed) opts.unshift([q, typed.start]);
      return opts
        .filter(([l], i) => !q || (typed && i === 0) || l.startsWith(q.toLowerCase()))
        .map(([l, at]) => ({
          t: l,
          lbl: new Date(at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }),
          run: () => {
            S.calDay = dayStart(at);
            S.calScroll = undefined;
            S.pane = 'calendar';
            LS.set('pane', S.pane);
            render();
          },
        }));
    }
    if (o.mode === 'snippet') {
      const all = snippets().map((sn) => ({
        t: sn.name,
        lbl: sn.text.replace(/\s+/g, ' ').slice(0, 40),
        k: [],
        run: () => useSnippet(sn),
      }));
      const ql = fold(q),
        hit = ql ? all.filter((x) => fold(`${x.t} ${x.lbl}`).includes(ql)) : all;
      return hit.length
        ? hit
        : [
            {
              t: snippets().length
                ? 'no snippet like that.'
                : 'no snippets yet. write a draft, then “Create Snippet from Draft”.',
              k: [],
              run: () => {},
            },
          ];
    }
    if (o.mode === 'snipname')
      return [
        {
          t: q ? `Save snippet: ${q}` : 'type a name, then Enter',
          k: [],
          run: () => {
            if (q) saveSnippet(q);
          },
        },
      ];
    if (o.mode === 'remind' || o.mode === 'later')
      return whenOptions(q).map(([l, at, label]) => ({
        t: l,
        lbl: label,
        run: () => (o.mode === 'remind' ? remind(at) : sendLater(at)),
      }));
    q = q.toLowerCase();
    const dyn = [
      ...customSplits().map((sp) => ({
        t: `Remove Split Inbox: ${sp.name}`,
        k: [],
        a: ['delete split', sp.q],
        run: () => removeSplit(sp.id),
      })),
      ...snippets().map((sn) => ({
        t: `Delete Snippet: ${sn.name}`,
        k: [],
        a: ['remove snippet', 'template'],
        run: () => {
          LS.set(
            'snippets',
            snippets().filter((x) => x.id !== sn.id),
          );
          toast('snippet gone.');
        },
      })),
    ];
    const ok = [...COMMANDS, ...dyn].filter((c) => !c.when || c.when());
    if (!q) return ok;
    return ok.filter((c) => `${c.t} ${(c.a || []).join(' ')}`.toLowerCase().includes(q));
  }
  function openPalette() {
    rememberCaret();
    S.overlay = { kind: 'cmd', q: '', i: 0 };
    renderLayer(true);
  }

  // ---------- more commands ----------
  const isGmail = () => !!(S.account && S.account.provider === 'google');
  const focusedMsg = () =>
    S.screen === 'thread'
      ? S.msgs[S.focus] && !S.msgs[S.focus].draft
        ? S.msgs[S.focus]
        : S.msgs[lastRealIndex(S.msgs)]
      : null;
  function copy(text, what) {
    navigator.clipboard.writeText(text).then(
      () => toast(`${what} copied.`),
      () => toast('copy no work.'),
    );
  }
  function expandAll() {
    const all = S.msgs.every((_, i) => S.expanded.has(i));
    S.expanded = all ? new Set([S.focus]) : new Set(S.msgs.map((_, i) => i));
    render();
  }
  function selectAll(fromHere) {
    const v = visible();
    (fromHere ? v.slice(S.sel) : v).forEach((t) => {
      S.picked.add(t.id);
    });
    render();
    toast(`${S.picked.size} picked.`);
  }
  async function openFolderPick(mode) {
    if (!targets().length) return;
    S.overlay = { kind: 'cmd', mode, q: '', i: 0 };
    renderLayer(true);
    if (!S.folders) {
      try {
        S.folders = B.folders ? await B.folders() : [];
      } catch {
        S.folders = [];
      }
      if (S.overlay && S.overlay.mode === mode) renderLayer();
    }
  }
  async function moveTo(f, mode) {
    const list = targets();
    if (!list.length) return;
    if (mode === 'copy') {
      try {
        await Promise.all(list.map((t) => B.act(t, 'copy', f.path)));
        toast(`label ${esc(f.name)}.`);
      } catch (e) {
        toast(`no work: ${esc(e.message || e)}`);
      }
      return;
    }
    if (list.every((t) => t.folder === f.path)) return toast('already there.');
    act('move', list, true, f.path);
    toast(`moved to ${esc(f.name)}. <span class="key">Z</span> undo`);
  }
  // Muted conversations and blocked senders are cleared out of the inbox whenever it loads.
  const isMuted = () => {
    const t = targets()[0];
    return !!t && LS.get('muted', []).includes(keyOf(t));
  };
  const isBlocked = () => {
    const t = targets()[0];
    return !!t && LS.get('blocked', []).includes((t.from.address || '').toLowerCase());
  };
  function mute(on) {
    const keys = targets().map(keyOf),
      m = LS.get('muted', []).filter((k) => !keys.includes(k));
    LS.set('muted', on ? [...m, ...keys].slice(-500) : m);
    if (on) {
      act('done', targets(), true);
      toast('muted. new replies skip inbox.');
    } else toast('unmuted.');
  }
  function block(on) {
    const t = targets()[0];
    if (!t) return;
    const a = (t.from.address || '').toLowerCase(),
      b = LS.get('blocked', []).filter((x) => x !== a);
    LS.set('blocked', on ? [...b, a] : b);
    if (on) {
      act('trash', targets(), true);
      toast(`${esc(a)} blocked. mail go trash.`);
    } else toast(`${esc(a)} unblocked.`);
  }
  function autoClear(list) {
    const bl = new Set(LS.get('blocked', [])),
      mu = new Set(LS.get('muted', []));
    if (!bl.size && !mu.size) return list;
    return list.filter((t) => {
      const b = bl.has((t.from.address || '').toLowerCase()),
        m = mu.has(keyOf(t));
      if (b || m) B.act(t, b ? 'trash' : 'done').catch(() => {});
      return !b && !m;
    });
  }
  function composeNew(p) {
    S.draft = {
      mode: 'new',
      to: p.to || '',
      cc: p.cc || '',
      subject: p.subject || '',
      text: (p.text || '') + sigBlock(),
    };
    startCompose('new');
  }
  function unsubscribe(andDone) {
    const m = [...S.msgs].reverse().find((x) => x.unsub),
      t = S.open;
    if (!m) return;
    const u = m.unsub;
    if (andDone && t) act('done', [t], true);
    if (u.url) {
      window.open(u.url);
      toast('unsubscribe page open in browser.');
      return;
    }
    const mm = /^(?:mailto:)?([^?]+)(?:\?(.*))?$/i.exec(u.mail || '');
    if (!mm) return;
    const qs = new URLSearchParams(mm[2] || '');
    composeNew({
      to: decodeURIComponent(mm[1]),
      subject: qs.get('subject') || 'unsubscribe',
      text: qs.get('body') || 'unsubscribe',
    });
    toast('unsubscribe mail ready. send it.');
  }
  function instantIntro() {
    const m = S.msgs[lastRealIndex(S.msgs)];
    if (!m) return;
    S.focus = lastRealIndex(S.msgs);
    startCompose('replyall');
    const c = S.composer;
    if (c?.mode !== 'replyall') return;
    const k = (m.from.address || '').toLowerCase(),
      drop = (s) =>
        splitList(s)
          .filter((x) => !x.toLowerCase().includes(k))
          .join(', ');
    c.to = drop(c.to);
    c.cc = drop(c.cc);
    if (!c.to && c.cc) {
      const [first, ...rest] = splitList(c.cc);
      c.to = first;
      c.cc = rest.join(', ');
    }
    c.bcc = addrList([m.from]);
    c.showBcc = true;
    c.text = `Thanks ${firstOf(m.from)} (to bcc)!\n\n${c.text}`;
    render();
    focusComposer(c.to ? 'text' : 'to');
  }
  // Files: picked with the system file picker, sent along as attachments (25 MB each at most).
  function attachFiles() {
    const c = S.composer;
    if (!c) return;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.onchange = async () => {
      for (const f of inp.files) {
        if (f.size > 25 * 1048576) {
          toast(`${esc(f.name)} too big. 25 mb max.`);
          continue;
        }
        const data = await new Promise((r) => {
          const fr = new FileReader();
          fr.onload = () => r(String(fr.result).split(',')[1] || '');
          fr.onerror = () => r('');
          fr.readAsDataURL(f);
        });
        c.files = c.files || [];
        c.files.push({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, data });
      }
      if (S.composer === c) {
        render();
        scheduleDraftSave();
      }
    };
    inp.click();
  }
  // Snippets: saved bits of text; {first_name} becomes the first person's first name.
  const snippets = () => LS.get('snippets', []);
  function rememberCaret() {
    const ta = root.querySelector('[data-c="text"]') || layer.querySelector('[data-c="text"]');
    if (S.composer && ta) S.composer.caret = ta.selectionStart;
  }
  function snippetPick() {
    rememberCaret();
    S.overlay = { kind: 'cmd', mode: 'snippet', q: '', i: 0 };
    renderLayer(true);
  }
  function saveSnippet(name) {
    const c = S.composer;
    if (!c) return;
    const sig = sigBlock().trim();
    let text = c.text;
    if (sig && text.includes(sig)) text = text.slice(0, text.lastIndexOf(sig));
    LS.set('snippets', [
      ...snippets().filter((x) => x.name !== name),
      { id: `sn${Date.now()}`, name, text: text.trim(), subject: c.mode === 'new' ? c.subject : '' },
    ]);
    toast(`snippet “${esc(name)}” saved. <span class="key">;</span> use.`);
  }
  function useSnippet(sn) {
    if (!S.composer) {
      if (S.screen === 'thread' && S.msgs.length) startCompose('reply');
      else startCompose('new');
    }
    const c = S.composer;
    if (!c) return;
    const who = splitList(c.to)[0] || '',
      m = /^(.*?)\s*<([^>]+)>$/.exec(who);
    const body = sn.text.replace(/\{first_?name\}/gi, firstOf(m ? { name: m[1], address: m[2] } : { address: who }));
    const at = Math.min(c.caret ?? 0, c.text.length);
    c.text = c.text.slice(0, at) + body + c.text.slice(at);
    if (!c.subject && sn.subject) c.subject = sn.subject;
    render();
    scheduleDraftSave();
    setTimeout(() => {
      const ta = root.querySelector('[data-c="text"]') || layer.querySelector('[data-c="text"]');
      if (ta) {
        ta.focus();
        ta.setSelectionRange(at + body.length, at + body.length);
        c.caret = at + body.length;
      }
    }, 0);
  }

  // ---------- people (To/Cc/Bcc suggestions) ----------
  // Everyone in your recent mail (Sent counts most), plus the organisation's address book when the
  // Outlook calendar is linked. The list sits under the field; ↑ ↓ pick, Enter or Tab take it.
  let contactList = null,
    contactsAsked = false,
    suggTimer = null;
  function loadContacts() {
    if (contactsAsked || !B.contacts) return;
    contactsAsked = true;
    B.contacts()
      .then((l) => {
        contactList = l;
      })
      .catch(() => {
        contactsAsked = false;
      });
  }
  function knownPeople() {
    const map = new Map();
    const add = (p, w) => {
      if (!p?.address || !/@/.test(p.address)) return;
      const k = p.address.toLowerCase();
      if (k === meAddr()) return;
      const c = map.get(k) || { name: '', address: p.address, score: 0 };
      if (!c.name && p.name) c.name = p.name;
      c.score += w;
      map.set(k, c);
    };
    (contactList || []).forEach((p) => {
      add(p, p.score || 1);
    });
    Object.values(S.cache).forEach((list) => {
      (list || []).forEach((t) => {
        add(t.from, t.list ? 0.1 : 1);
        (t.to || []).forEach((p) => {
          add(p, 0.5);
        });
      });
    });
    S.msgs.forEach((m) => {
      [m.from, ...(m.to || []), ...(m.cc || [])].forEach((p) => {
        add(p, 1);
      });
    });
    return [...map.values()];
  }
  function matchPeople(q) {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return knownPeople()
      .filter((p) => {
        const toks = fold(`${p.name} ${p.address}`).split(/[\s.@,<>_"'()-]+/);
        return words.every((w) => toks.some((x) => x.startsWith(w))) || fold(p.address).startsWith(words.join(' '));
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }
  const niceName = (n) => {
    n = String(n || '')
      .replace(/"/g, '')
      .trim();
    const m = /^([^,]+),\s*(.+)$/.exec(n);
    return m ? `${m[2]} ${m[1]}` : n;
  };
  function suggest(el) {
    const v = el.value,
      pos = el.selectionStart ?? v.length;
    const start = Math.max(v.lastIndexOf(',', pos - 1), v.lastIndexOf(';', pos - 1)) + 1;
    const tok = v.slice(start, pos).trim();
    if (!tok || /[<>]/.test(tok)) return closeSugg();
    loadContacts();
    const show = (items) => {
      if (!items.length || document.activeElement !== el) return closeSugg();
      const i = S.sugg && S.sugg.el === el ? Math.min(S.sugg.i, items.length - 1) : 0;
      S.sugg = { el, start, end: pos, items, i };
      drawSugg();
    };
    const local = matchPeople(tok);
    show(local);
    clearTimeout(suggTimer);
    if (B.people && tok.length >= 3)
      suggTimer = setTimeout(async () => {
        const more = await B.people(tok).catch(() => []);
        if (document.activeElement !== el || el.value.slice(start, el.selectionStart).trim() !== tok) return;
        const have = new Set(local.map((p) => p.address.toLowerCase()));
        show([...local, ...more.filter((p) => !have.has(p.address.toLowerCase()))].slice(0, 8));
      }, 250);
  }
  function drawSugg() {
    const sg = S.sugg;
    if (!sg) return;
    const host = sg.el.parentElement;
    let box = host.querySelector('.sugg');
    if (!box) {
      box = document.createElement('div');
      box.className = 'sugg';
      box.setAttribute('role', 'listbox');
      host.appendChild(box);
    }
    box.innerHTML = sg.items
      .map(
        (p, i) =>
          `<div class="sg${i === sg.i ? ' on' : ''}" data-sg="${i}" role="option" aria-selected="${i === sg.i}"><b>${esc(niceName(p.name) || p.address)}</b><span>${esc(p.address)}</span></div>`,
      )
      .join('');
  }
  function closeSugg() {
    if (S.sugg) S.sugg.el.parentElement?.querySelector('.sugg')?.remove();
    S.sugg = null;
    clearTimeout(suggTimer);
  }
  function takeSugg(i) {
    const sg = S.sugg;
    if (!sg) return;
    const p = sg.items[i ?? sg.i];
    if (!p) return;
    const v = sg.el.value,
      n = niceName(p.name).replace(/[",;<>]/g, '');
    const ins = `${n ? `${n} <${p.address}>` : p.address}, `;
    let before = v.slice(0, sg.start);
    if (before && !/\s$/.test(before)) before += ' ';
    const after = v.slice(sg.end).replace(/^[^,;]*[,;]?\s*/, '');
    closeSugg();
    sg.el.value = before + ins + after;
    const at = (before + ins).length;
    sg.el.setSelectionRange(at, at);
    sg.el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  document.addEventListener('mousedown', (e) => {
    const g = e.target.closest?.('.sg');
    if (g) {
      e.preventDefault();
      takeSugg(+g.dataset.sg);
    }
  });
  document.addEventListener('focusout', (e) => {
    if (S.sugg && e.target === S.sugg.el)
      setTimeout(() => {
        if (S.sugg && document.activeElement !== S.sugg.el) closeSugg();
      }, 100);
  });
  function openWhen(mode) {
    if (mode === 'remind' && !targets().length) return;
    S.overlay = { kind: 'cmd', mode, q: '', i: 0 };
    renderLayer(true);
  }
  // Search is its own page, with tips on the right; Enter searches the whole mailbox.
  function openSearch() {
    if (S.screen === 'compose') leaveCompose();
    if (S.screen !== 'search')
      S.back = { screen: S.screen === 'thread' ? 'thread' : 'list', open: S.open, msgs: S.msgs, view: S.view };
    S.screen = 'search';
    S.search = { q: S.search?.q || '' };
    render();
    setTimeout(() => {
      const i = root.querySelector('.sq');
      if (i) {
        i.focus();
        i.select();
      }
    }, 0);
  }
  function runSearch(q) {
    q = q.trim();
    if (!q) return;
    LS.set('recent', [q, ...LS.get('recent', []).filter((x) => x !== q)].slice(0, 8));
    S.search = { q };
    S.screen = 'list';
    load('search');
  }
  function closeSearch() {
    const b = S.back || {};
    S.back = null;
    S.search = null;
    if (b.screen === 'thread' && b.open) {
      S.screen = 'thread';
      S.open = b.open;
      S.msgs = b.msgs;
      render();
    } else {
      S.screen = 'list';
      load(b.view && b.view !== 'search' ? b.view : 'inbox');
    }
  }
  function switchSplit(d = 1) {
    if (S.view !== 'inbox') return goto('inbox', 'important')();
    const sp = allSplits(),
      i = sp.findIndex((x) => x.id === S.split);
    S.split = sp[(i + d + sp.length) % sp.length].id;
    S.sel = 0;
    render();
  }
  function pick() {
    const t = current();
    if (!t) return;
    S.picked.has(t.id) ? S.picked.delete(t.id) : S.picked.add(t.id);
    step(1);
    render();
  }

  // ---------- render ----------
  function menuItems() {
    const c = counts();
    const base = [
      { label: 'Important · Other', n: c.important || 0, keys: ['G', 'I'], run: goto('inbox', 'important') },
      { label: 'Starred', keys: ['G', 'S'], run: goto('starred') },
      { label: 'Drafts', keys: ['G', 'D'], run: goto('drafts') },
      { label: 'Sent', keys: ['G', 'T'], run: goto('sent') },
      { label: 'Done', keys: ['G', 'E'], run: goto('done') },
      { label: 'Scheduled', n: scheduled().length || '', keys: [], run: goto('scheduled') },
      { label: 'Reminders', keys: ['G', 'H'], run: goto('reminders') },
      { label: 'Spam', keys: ['G', '!'], run: goto('spam') },
      { label: 'Trash', keys: ['G', '#'], run: goto('trash') },
      { label: 'All Mail', keys: ['G', 'A'], run: goto('all') },
    ];
    const own = (S.folders || []).map((f) => ({
      label: f.name,
      folder: true,
      keys: [],
      run: () => {
        if (S.screen !== 'list') {
          S.screen = 'list';
          S.open = null;
        }
        VIEWS[f.path] = VIEWS[f.path] || f.name;
        load(f.path);
      },
    }));
    return [...base, ...own, { label: 'Settings', keys: [MOD, ','], run: () => openSettings(), settings: true }];
  }
  // The menu is laid over the screen without redrawing it, and filled in place when the folders
  // arrive, so it slides in once and nothing behind it blinks.
  function openMenu() {
    S.menu = { sel: 0 };
    root.insertAdjacentHTML('beforeend', menuHtml(true));
    if (!S.folders && B.folders)
      B.folders()
        .then((f) => {
          S.folders = f;
          redrawMenu();
        })
        .catch(() => {
          S.folders = [];
        });
  }
  function redrawMenu() {
    const nav = root.querySelector('.sidemenu');
    if (!nav || !S.menu) return;
    const t = document.createElement('template');
    t.innerHTML = menuHtml();
    nav.innerHTML = t.content.querySelector('.sidemenu').innerHTML;
  }
  function closeMenu() {
    S.menu = null;
    root.querySelectorAll('.sidemenu, .sidemenu-scrim').forEach((x) => {
      x.remove();
    });
  }
  function menuHtml(fresh) {
    if (!S.menu) return '';
    const items = menuItems(),
      keys = (k) =>
        k.length === 2 && k[0] === 'G'
          ? `<span class="key">G</span><small>then</small><span class="key">${esc(k[1])}</span>`
          : keysHtml(k);
    const firstOwn = items.findIndex((x) => x.folder),
      set = items.findIndex((x) => x.settings);
    return `<div class="sidemenu-scrim" data-a="close-menu"></div><nav class="sidemenu${fresh ? ' fresh' : ''}" aria-label="Folders">
      <div class="sm-head">${esc(S.account?.email || '')}</div>
      ${items.map((it, i) => `${i === firstOwn ? '<div class="sm-sep">Folders</div>' : ''}${i === set ? '<div class="sm-gap"></div>' : ''}<button class="sm-item${i === S.menu.sel ? ' on' : ''}" data-menu="${i}"><span>${esc(it.label)}${it.n ? ` <span class="n">${it.n > 150 ? '150+' : it.n}</span>` : ''}</span><span class="sm-keys">${keys(it.keys)}</span></button>`).join('')}
    </nav>`;
  }
  function enterClass() {
    const k = `${S.screen}|${S.screen === 'thread' ? S.open?.id : `${S.view}|${S.split}`}`;
    const changed = k !== S.lastScreen;
    S.lastScreen = k;
    return changed ? (S.screen === 'thread' || S.screen === 'compose' ? ' enter-in' : ' enter-fade') : '';
  }
  function fitEditor(t) {
    t.style.height = 'auto';
    t.style.height = `${Math.max(t.closest('.settings') ? 96 : 200, t.scrollHeight)}px`;
  }
  function render() {
    if (S.screen === 'signin') return renderSignin();
    if (S.eventForm) {
      const t = eventTimes(S.eventForm);
      if (t.ok) S.calDay = dayStart(t.start);
    } else if (S.screen === 'thread' && S.open && S.invFor !== S.open.id) {
      const v = invOf();
      if (v) {
        S.invFor = S.open.id;
        S.calDay = dayStart(v.start);
        S.calScroll = Math.max(0, (new Date(v.start).getHours() - 1) * 44);
      }
    }
    document.body.classList.remove('on-signin');
    root.innerHTML = `<div class="shell">
      <nav class="rail" aria-label="Apps"><button class="${S.screen !== 'calendar' ? 'on' : ''}" data-a="go-mail" title="Mail (1)" aria-label="Mail">${ic.mail}</button><button class="${S.screen === 'calendar' ? 'on' : ''}" data-a="go-cal" title="Calendar (2)" aria-label="Calendar">${ic.cal}</button></nav>
      <div class="main${enterClass()}${S.screen === 'calendar' ? ' main-cal' : ''}">${S.screen === 'calendar' ? weekHtml() : S.screen === 'settings' ? settingsHtml() : S.screen === 'thread' ? threadHtml() : S.screen === 'compose' ? composePageHtml() : S.screen === 'search' ? searchHtml() : listHtml()}</div>
      ${paneHtml()}
    </div>
    ${menuHtml()}
    ${S.authNeeded ? `<div class="authbar" role="alert"><span>login for <b>${esc(S.authNeeded.email)}</b> dead. mail stuck.</span><button data-a="relogin">login again</button></div>` : ''}
    ${S.pop && S.composer ? `<div class="pop"><div class="ttl">new mail</div>${composerHtml()}</div>` : ''}
    <div class="tabbar">
      <button data-a="go-inbox">Inbox</button><button data-a="search">Search</button><button data-a="compose">Compose</button><button data-a="cal">Calendar</button><button data-a="cmd">More</button>
    </div>`;
    if (S.eventForm) S.eventForm.fresh = false; // the form slides in once, not on every redraw
    if (S.screen === 'thread') mountBodies();
    root.querySelectorAll('.editor textarea').forEach(fitEditor);
    if (S.screen === 'calendar' || S.pane === 'calendar' || S.eventForm || invOf()) ensureCalDay();
    calScrollSetup();
  }
  function calScrollSetup() {
    const cb = root.querySelector('.cal-b');
    if (!cb) return;
    cb.scrollTop = S.calScroll ?? Math.max(0, (new Date().getHours() - 2) * 44);
    cb.addEventListener('scroll', () => {
      S.calScroll = cb.scrollTop;
    });
  }
  // While an event is being written only the day beside the form is redrawn; the form (and your
  // cursor) and the mail stay as they are, so nothing flashes.
  function refreshCal() {
    if (S.screen === 'calendar') {
      if (S.eventForm) {
        const t = eventTimes(S.eventForm);
        if (t.ok) S.calDay = dayStart(t.start);
        const p = root.querySelector('.evparsed');
        if (p) p.innerHTML = evParsed(S.eventForm);
      }
      updateWeek();
      ensureCalDay();
      return;
    }
    const pane = root.querySelector('.cal-pane'),
      form = pane?.querySelector('.evform');
    if (!form || !S.eventForm) return render();
    const t = eventTimes(S.eventForm);
    if (t.ok) S.calDay = dayStart(t.start);
    const tpl = document.createElement('template');
    tpl.innerHTML = calendarHtml().trim();
    const fresh = tpl.content.firstElementChild,
      nf = fresh.querySelector('.evform');
    const ep = form.querySelector('.evparsed'),
      np = nf.querySelector('.evparsed');
    if (ep && np) ep.innerHTML = np.innerHTML;
    [...pane.children].forEach((c) => {
      if (c !== form) c.remove();
    });
    [...fresh.children].forEach((c) => {
      if (c !== nf) pane.append(c);
    });
    pane.className = fresh.className;
    calScrollSetup();
    ensureCalDay();
  }

  function renderSignin() {
    document.body.classList.add('on-signin');
    root.innerHTML = `<div class="signin"><div class="signin-inner">
        <div class="logo"><span class="logo-mark">d</span><span class="logo-word">dude</span></div>
        <div class="prompt" role="heading" aria-level="1"><span>no super.</span> <span>just email.</span></div>
        <button class="btn-main" data-a="start">go</button>
        ${
          S.more
            ? `<div class="signin-more">
          ${
            DESKTOP
              ? `<input type="email" placeholder="you@uni.fi" data-a="email" value="${esc(S.email || '')}" autocomplete="email">
          <button data-a="signin-ms">microsoft login</button>
          <button data-a="signin-g">google login</button>
          <p>login like thunderbird. uni say ok.</p>`
              : `<button data-a="demo">try demo</button><p>demo only. real mail need desktop app.</p>`
          }
          ${DESKTOP ? `<button data-a="demo">try demo</button>` : ''}
        </div>`
            : ''
        }
      </div></div>`;
  }

  function listHtml() {
    const v = visible(),
      c = counts();
    const n = (x) => (x > 150 ? '150+' : x);
    const head =
      S.view === 'inbox'
        ? `<div class="splits">${allSplits()
            .map(
              (sp) =>
                `<button class="split ${S.split === sp.id ? 'on' : ''}" data-split="${esc(sp.id)}">${esc(sp.name)}${c[sp.id] ? `<span class="n">${n(c[sp.id])}</span>` : ''}</button>`,
            )
            .join('')}</div>`
        : S.view === 'search'
          ? `<div class="splits"><span class="split on">search: ${esc(S.search?.q || '')}<span class="n">${v.length}</span></span></div><button class="ibtn" data-a="close-search" title="Close search (Esc)">✕</button>`
          : `<div class="splits"><span class="split on">${esc(VIEWS[S.view] || S.view)}<span class="n">${v.length}</span></span></div>`;
    let rows = '',
      last = null;
    v.forEach((t, i) => {
      const g = groupOf(t.date);
      if (g !== last) {
        if (g) rows += `<div class="sep">${esc(g)}</div>`;
        last = g;
      }
      const atts = (t.atts || []).slice(0, 4);
      rows += `<div class="row${i === S.sel ? ' sel' : ''}${t.unread ? ' unread' : ''}${S.picked.has(t.id) ? ' picked' : ''}${atts.length ? ' with-atts' : ''}" data-i="${i}">
        <span class="st"></span>
        <span class="from">${S.replyDrafts.has(keyOf(t)) ? '<span class="dr">draft</span> ' : ''}${t.starred ? '<span class="star">★</span>' : ''}${esc(S.view === 'sent' || S.view === 'drafts' || ((t.from.address || '').toLowerCase() === meAddr() && (t.to || []).length) ? `To: ${(t.to || []).map((p) => firstName(p)).join(', ')}` : nameOf(t.from))}${t.count > 1 ? `<span class="cnt">${t.count}</span>` : ''}</span>
        <span class="ss"><span class="subj">${esc(t.subject || '(no subject)')}</span>${esc(t.snippet)}</span>
        <span class="meta"><span class="date">${esc(listDate(t.date))}</span>
          <span class="acts"><button data-a="row-done" title="Mark Done (E)">${ic.check}</button><button data-a="row-remind" title="Remind Me (H)">${ic.clock}</button><button data-a="cmd" title="Command (${MOD}+K)">${ic.cmd}</button></span></span>
        ${
          atts.length
            ? `<span class="ratts">${atts
                .map((a, k) => {
                  const f = fileBits(a.name, a.type);
                  return `<button class="rchip" data-ratt="${i}:${k}" title="open ${esc(a.name)}"><span class="att-type t-${f.kind}">${esc(f.ext)}</span><span class="rchip-name">${esc(f.base)}</span></button>`;
                })
                .join('')}${(t.atts || []).length > 4 ? `<span class="rmore">+${t.atts.length - 4}</span>` : ''}</span>`
            : ''
        }
      </div>`;
    });
    const zero = !S.loading && !v.length && S.view !== 'search' && !S.loadError;
    return `<header class="head"><button class="menu-btn" data-a="menu" title="Folders">${ic.menu}</button>${head}
        <div class="head-icons"><button class="ibtn${S.pane === 'calendar' ? ' on' : ''}" data-a="cal" title="Calendar (0)">${ic.cal}</button><button class="ibtn" data-a="compose" title="Compose (C)">${ic.pen}</button><button class="ibtn" data-a="search" title="Search (/)">${ic.search}</button></div></header>
      ${
        zero
          ? `<div class="zero"><h2>${S.view === 'inbox' ? 'inbox zero.' : 'empty.'}</h2><p>${S.view === 'inbox' ? 'nothing left. go outside.' : 'nothing here.'}</p></div>`
          : `<div class="list">${S.loading && !v.length ? '<div class="note">loading…</div>' : rows || (S.loadError ? '<div class="note">folder no load.</div>' : '<div class="note">nothing.</div>')}</div>`
      }`;
  }

  // Splits a plain-text message into what was written and the quoted history below it.
  const QUOTE =
    /^(?:On [^\n]{0,300}wrote:[ \t]*$|-{2,}\s*(?:Original Message|Alkuperäinen viesti)\s*-{2,}|_{8,}[ \t]*$|(?:From|Lähettäjä|Från|Von): [^\n]+\n(?:Sent|Date|Lähetetty|Skickat|Gesendet|To|Vastaanottaja): |>)/m;
  function splitQuote(text) {
    const i = (text || '').search(QUOTE);
    return i > 0 ? [text.slice(0, i).replace(/\s+$/, ''), text.slice(i)] : [text || '', ''];
  }
  const HTML_QUOTE = /gmail_quote|type="?cite|divRplyFwdMsg|appendonsend|moz-cite-prefix/i;
  const firstName = (p) => {
    const n = (p?.name || '').replace(/^"|"$/g, '').trim();
    return n
      ? n.includes(',')
        ? n.split(',')[1].trim().split(' ')[0] || n
        : n.split(/\s+/)[0]
      : p?.address || 'Unknown';
  };

  const isMe = (p) => !!p && (p.address || '').toLowerCase() === meAddr();
  const asMe = (p) =>
    p && !p.name && (p.address || '').toLowerCase() === meAddr() && S.account?.name
      ? { ...p, name: S.account.name }
      : p;
  function threadHtml() {
    const t = S.open;
    const msgs = S.msgs
      .map((m0, i) => {
        const m = { ...m0, from: asMe(m0.from) };
        const open = S.expanded.has(i),
          focus = i === S.focus && !S.composer;
        if (m.draft)
          return `<article class="msg mrow draftrow${focus ? ' focus' : ''}" data-m="${i}" title="Continue this draft (Enter)">
        <span class="nm dr">draft</span><span class="snip">to ${esc((m.to || []).map((p) => firstName(p)).join(', ') || '…')} · ${esc(
          splitQuote(m.text || '')[0]
            .replace(/\s+/g, ' ')
            .slice(0, 160),
        )}</span><span class="dt">${esc(listDate(m.date))}</span></article>`;
        if (!open)
          return `<article class="msg mrow${focus ? ' focus' : ''}" data-m="${i}">
        <span class="nm">${esc(isMe(m.from) ? 'Me' : firstName(m.from))}</span><span class="snip">${esc(splitQuote(m.text)[0].replace(/\s+/g, ' ').slice(0, 220))}</span><span class="dt">${esc(listDate(m.date))}</span></article>`;
        const [main, quote] = splitQuote(m.text);
        const hasQuote = m.html ? HTML_QUOTE.test(m.html) : !!quote;
        const showQ = S.quotes.has(i);
        const to = [...(m.to || []), ...(m.cc || [])].map((p) => p.name || p.address).join(', ');
        return `<article class="msg open${focus ? ' focus' : ''}" data-m="${i}">
        <div class="msg-h"><span class="nm" title="${esc(m.from.address)}">${esc(isMe(m.from) ? 'Me' : nameOf(m.from))}${to ? ` <span class="tolist">to ${esc(to)}</span>` : ''}</span>
          <span class="macts"><button class="ibtn" data-a="reply" title="Reply (R)">↩</button><button class="ibtn" data-a="replyall" title="Reply all (Enter)">⤺</button><button class="ibtn" data-a="forward" title="Forward (F)">↪</button></span>
          <span class="dt">${m.pending ? 'Sending…' : esc(listDate(m.date))}</span></div>
        ${m.invite ? inviteHtml(m, i) : ''}<div class="body" data-b="${i}">${m.html ? '<iframe sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Message"></iframe>' : `<pre>${linkify(showQ ? m.text : main)}</pre>`}</div>
        ${hasQuote ? `<button class="dots" data-q="${i}" title="Show quoted text">…</button>` : ''}
        ${
          m.attachments?.length
            ? `<div class="atts">${m.attachments
                .map((a, j) => {
                  const f = fileBits(a.filename, a.type);
                  return `<div class="att" data-att="${i}:${j}" role="button" tabindex="0" title="open ${esc(a.filename || 'file')}"><div class="att-name">${esc(f.base)}</div><div class="att-foot"><span class="att-type t-${f.kind}">${esc(f.ext)}</span><span class="att-size">${esc(f.size(a.size))}</span><button class="att-dl" data-attsave="${i}:${j}" title="save to Downloads">${ic.download}</button></div></div>`;
                })
                .join('')}</div>`
            : ''
        }
      </article>`;
      })
      .join('');
    return `<div class="thread">
      <div class="thread-top"><button class="back" data-a="back" title="Back (Esc)">${ic.back}</button></div>
      <div class="tcol">
        <div class="thead"><h1>${esc(t.subject || '(no subject)')}</h1>
          <div class="tacts"><button class="ibtn" data-a="done" title="Mark Done (E)">${ic.check}</button><button class="ibtn" data-a="remind" title="Remind Me (H)">${ic.clock}</button><button class="ibtn" data-a="cmd" title="Command">${ic.cmd}</button><button class="ibtn" data-a="prev" title="Previous conversation (K)">${ic.up}</button><button class="ibtn" data-a="next" title="Next conversation (J)">${ic.down}</button></div></div>
        ${S.msgs.length ? msgs : '<div class="note" style="padding-left:36px">loading…</div>'}
        ${S.newer ? `<div class="newmsgs"><button data-a="show-new" title="Show new messages (Shift+N)">${S.newer.count > 1 ? `${S.newer.count} ` : ''}new mail. show</button></div>` : ''}
        ${S.composer && !S.pop ? composerHtml() : S.msgs.length ? `<div class="replybar"><button data-a="replyall">reply all <span class="key">Enter</span></button><button data-a="reply">reply <span class="key">R</span></button><button data-a="forward">forward <span class="key">F</span></button><button data-a="event">event <span class="key">B</span></button></div>` : ''}
      </div></div>`;
  }

  function composerHtml() {
    const c = S.composer;
    return `<div class="composer">
      <div class="crow"><b>To</b><input data-c="to" value="${esc(c.to)}" autocomplete="off" aria-label="To">${c.cc || c.showCc ? '' : `<button class="ccbtn" data-a="showcc" title="Cc (${MOD}+Shift+C)">Cc</button>`}${c.bcc || c.showBcc ? '' : `<button class="ccbtn" data-a="showbcc" title="Bcc (${MOD}+Shift+B)">Bcc</button>`}</div>
      ${c.cc || c.showCc ? `<div class="crow"><b>Cc</b><input data-c="cc" value="${esc(c.cc)}" autocomplete="off" aria-label="Cc"></div>` : ''}
      ${c.bcc || c.showBcc ? `<div class="crow"><b>Bcc</b><input data-c="bcc" value="${esc(c.bcc || '')}" autocomplete="off" aria-label="Bcc"></div>` : ''}
      <input class="csubj" data-c="subject" value="${esc(c.subject)}" placeholder="subject" aria-label="Subject">
      <div class="editor"><div class="tint" aria-hidden="true">${window.Markdown.tint(c.text)}</div><textarea data-c="text" placeholder="${c.mode === 'new' ? 'write.' : 'reply.'}" aria-label="Message">
${esc(c.text)}</textarea></div>
      ${(c.files || []).length ? `<div class="cfiles">${c.files.map((f, j) => `<span class="cfile">${esc(f.name)} <small>${esc(fileBits(f.name, f.type).size(f.size))}</small><button data-rmfile="${j}" title="remove" aria-label="remove ${esc(f.name)}">✕</button></span>`).join('')}</div>` : ''}
      <div class="cfoot"><button class="primary" data-a="send" title="Send (${MOD}+Enter)">send</button><button data-a="later" title="Send later (${MOD}+Shift+L)">later</button><span class="grow"></span>
        <button class="ibtn" data-a="attach" title="Attach (${MOD}+Shift+A)">${ic.clip}</button><button class="ibtn" data-a="event" title="Create event (B)">${ic.cal}</button><button class="ibtn" data-a="discard" title="Discard (${MOD}+Shift+,)">${ic.trash}</button></div>
    </div>`;
  }
  function composePageHtml() {
    return `<div class="thread"><div class="thread-top"><button class="back" data-a="leave-compose" title="Back (Esc)">${ic.back}</button></div>
      <div class="tcol"><div class="thead"><h1>${esc(S.composer.subject.trim() || 'new mail')}</h1></div>${composerHtml()}</div></div>`;
  }
  function searchHtml() {
    const recent = LS.get('recent', []);
    return `<header class="head search-head"><input class="sq" data-a="sq" placeholder="search" value="${esc(S.search?.q || '')}" aria-label="Search">
        <button class="ibtn" data-a="close-search" title="Close (Esc)">✕</button></header>
      <div class="list">${recent.map((q) => `<div class="recent" data-recent="${esc(q)}">${esc(q)}</div>`).join('') || '<div class="note">type. hit Enter. tricks on right.</div>'}</div>`;
  }

  function paneHtml() {
    if (S.screen === 'calendar') return calSideHtml();
    if (S.pane === 'calendar' || S.eventForm || invOf()) return calendarHtml();
    if (S.screen === 'search') {
      const tips = [
        ['from:nicole', 'from Nicole'],
        ['to:roman', 'to Roman'],
        ['"be brilliant"', 'contains "be brilliant"'],
        ['subject:lunch', 'subject contains "lunch"'],
        ['domain:example.com', 'from that domain'],
        ['has:attachment', 'has files'],
        ['filename:pdf', 'file name has pdf'],
        ['larger:5M', 'bigger than 5 mb'],
        ['cc:anna', 'anna in copy'],
        ['label:projects', 'in that folder'],
        ['in:sent', 'in Sent'],
        ['is:unread', 'unread conversations'],
        ['is:starred', 'starred conversations'],
        ['before:2025/06/01', 'before June 2025'],
        ['after:2025/06/01', 'June 2025 or later'],
        ['older_than:3d', 'more than 3 days ago'],
        ['newer_than:1m', '1 month ago or later'],
        ['-word', 'without that word'],
      ];
      return `<aside class="pane contact-pane"><div class="contact"><div class="nm">tricks</div><div class="tips">${tips.map(([a, b]) => `<b data-tip="${esc(a)}">${esc(a)}</b><span>${esc(b)}</span>`).join('')}</div></div></aside>`;
    }
    if (S.screen === 'settings')
      return `<aside class="pane contact-pane"><div class="contact"><div class="nm">looks like</div><div class="sigprev">${window.Markdown.toHtml(SET().signature)}</div></div></aside>`;
    if (S.screen === 'compose')
      return `<aside class="pane contact-pane"><div class="contact"><div class="nm">${esc(S.account?.name || 'you')}</div><div class="em">${esc(S.account?.email || '')}</div></div></aside>`;
    const t = S.screen === 'thread' ? S.open : current();
    if (!t) return `<aside class="pane contact-pane"><div class="contact"></div></aside>`;
    const p = t.from,
      addr = (p.address || '').toLowerCase(),
      domain = addr.split('@')[1] || '';
    const recent = S.threads.filter((x) => (x.from.address || '').toLowerCase() === addr).slice(0, 4);
    return `<aside class="pane contact-pane"><div class="contact">
      <div class="nm">${esc(nameOf(p))}</div>
      <div class="em">${esc(p.address)}</div>
      <div class="sec"><div class="sec-h">${ic.mail} Mail</div>${recent.map((x) => `<div class="it" data-open="${esc(x.id)}">${esc(x.subject || '(no subject)')}</div>`).join('')}</div>
      ${domain ? `<div class="sec"><div class="sec-h">${ic.search} ${esc(domain)}</div></div>` : ''}
    </div><div class="pane-foot"><b>${esc(S.account?.email || '')}</b><button class="ibtn" data-a="keys" title="Shortcuts (?)">?</button></div></aside>`;
  }

  function calendarHtml() {
    const t = S.calDay,
      d = new Date(t),
      list = dayEvents(t),
      allDay = list.filter(isAllDay),
      f = S.eventForm;
    const hrs = Array.from(
      { length: 24 },
      (_, h) => `<div class="cal-hr">${h ? `<span>${hourLabel(h)}</span>` : ''}</div>`,
    ).join('');
    return `<aside class="pane cal-pane${f ? ' with-form' : ''}">${f ? evFormHtml(f) : ''}
      <div class="cal-h"><span class="d">${esc(d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }))}</span>
        <button class="ibtn" data-a="day-prev" title="Previous day (-)">${ic.left}</button><button class="ibtn" data-a="day-next" title="Next day (=)">${ic.right}</button>
        <span class="grow"></span>${t !== dayStart(Date.now()) ? '<button class="cal-btn" data-a="day-today" title="Back to today">today</button>' : ''}<button class="cal-btn" data-a="go-cal" title="Open week (2)">week</button></div>
      ${calNoteHtml(t)}${allDay.length ? `<div class="cal-allday">${allDay.map(chipHtml).join('')}</div>` : ''}
      <div class="cal-b"><div class="cal-g" data-day="${t}"><span class="cal-tz">${esc(tzName(t))}</span>${hrs}${blocksHtml(t, list)}</div></div>
      ${f ? evBtnsHtml(f) : `<div class="pane-foot"><b>${esc(S.account?.email || '')}</b><button class="ibtn" data-a="event" title="Create Event (B)">+</button></div>`}
    </aside>`;
  }

  // ---------- the whole calendar: a week ----------
  const HPX = 44; // one hour, in pixels
  const addDays = (t, n) => {
    const d = new Date(t);
    d.setDate(d.getDate() + n);
    return d.getTime();
  };
  const dayEnd = (t) => addDays(dayStart(t), 1);
  const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
  const tzName = (t) =>
    new Intl.DateTimeFormat([], { timeZoneName: 'short' })
      .formatToParts(new Date(t))
      .find((x) => x.type === 'timeZoneName')?.value || '';
  const weekStartsOn = () => (LS.get('cal:monday', false) ? 1 : 0);
  const weekStartOf = (t) => {
    const d = new Date(dayStart(t));
    d.setDate(d.getDate() - ((d.getDay() - weekStartsOn() + 7) % 7));
    return d.getTime();
  };
  const isAllDay = (x) => !!x.allDay || x.end - x.start >= DAY;
  const fmtRange = (a, b) => `${fullDate(a)} – ${fmtTime(b)}`;
  function weekDays() {
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
  function dayEvents(t) {
    const e = dayEnd(t),
      f = S.eventForm,
      declined = LS.get('cal:declined', false);
    const server = S.cal.days.get(calKey(t))?.list || [];
    const inv = invOf(),
      ghost =
        inv && !server.some((x) => Math.abs(x.start - inv.start) < 60e3 && x.title === inv.title)
          ? [
              {
                id: 'inv',
                title: inv.title,
                start: inv.start,
                end: inv.end,
                where: inv.where,
                allDay: inv.allDay,
                invite: true,
              },
            ]
          : [];
    return [...server, ...events(), ...ghost].filter(
      (x) =>
        x.start < e &&
        x.end > t &&
        !x.cancelled &&
        (declined || x.response !== 'Decline') &&
        !(f?.id && !f.readOnly && x.id === f.id),
    );
  }
  const chipHtml = (x) =>
    `<span class="cal-chip${x.invite ? ' inv' : ''}" data-ev="${esc(String(x.id || ''))}" title="${esc(x.title)}">${esc(x.title)}</span>`;
  function blocksHtml(t, list) {
    const e = dayEnd(t),
      timed = list.filter((x) => !isAllDay(x)).sort((a, b) => a.start - b.start || b.end - a.end);
    const lanes = [];
    timed.forEach((x) => {
      let l = lanes.findIndex((v) => v <= x.start);
      if (l < 0) {
        l = lanes.length;
        lanes.push(0);
      }
      lanes[l] = x.end;
      x._lane = l;
    });
    const pos = (a, b) =>
      `top:${Math.max(0, ((a - t) / 3600e3) * HPX)}px;height:${Math.max(15, ((Math.min(b, e) - Math.max(a, t)) / 3600e3) * HPX - 2)}px`;
    const html = timed
      .map((x) => {
        const n = timed.filter((o) => o.start < x.end && o.end > x.start).reduce((m, o) => Math.max(m, o._lane + 1), 1),
          w = 100 / n;
        const pend = x.isMeeting && !x.isOrganizer && /NoResponse|Unknown|Tentative/.test(x.response || '');
        const cls =
          (x.invite ? ' inv' : !x.server ? ' local' : pend ? ' pending' : '') +
          (x.response === 'Decline' ? ' declined' : '') +
          (((x.end - x.start) / 3600e3) * HPX < 30 ? ' short' : '');
        return `<div class="cal-ev${cls}" data-ev="${esc(String(x.id || ''))}" style="${pos(x.start, x.end)};left:calc(${x._lane * w}% + 2px);right:auto;width:calc(${w}% - 4px)" title="${esc(x.title)}${x.where ? ` · ${esc(x.where)}` : ''}${x.organizer ? ` · ${esc(x.organizer)}` : ''}"><b>${esc(x.title)}</b> ${esc(fmtTime(x.start))} – ${esc(fmtTime(x.end))}${x.where ? ` · ${esc(x.where)}` : ''}</div>`;
      })
      .join('');
    const f = S.eventForm,
      ft = f && !f.readOnly && eventTimes(f);
    const draft =
      ft?.ok && ft.start < e && ft.end > t
        ? `<div class="cal-ev draft" style="${pos(ft.start, ft.end)};left:2px;right:auto;width:calc(100% - 4px)"><b>${esc(f.title || 'new event')}</b> ${esc(fmtTime(ft.start))} – ${esc(fmtTime(ft.end))}</div>`
        : '';
    const now = Date.now();
    return (
      html +
      draft +
      (now >= t && now < e ? `<div class="cal-now" style="top:${((now - t) / 3600e3) * HPX}px"></div>` : '')
    );
  }
  function calNoteHtml(t, wide) {
    const st = S.cal.status,
      k = calKey(t),
      cls = `cal-note${wide ? ' wk-note' : ''}`;
    if (st?.canConnect && !st.connected)
      return `<div class="${cls}">calendar not linked. <button data-a="cal-connect">connect</button></div>`;
    if (S.cal.error) return `<div class="${cls}">${esc(S.cal.error)}</div>`;
    return S.cal.loading.has(k) && !S.cal.days.has(k) ? `<div class="${cls}">loading…</div>` : '';
  }
  function weekHtml() {
    const days = weekDays(),
      today = dayStart(Date.now()),
      a = new Date(days[0]),
      b = new Date(days[days.length - 1]);
    const title =
      a.getMonth() === b.getMonth()
        ? a.toLocaleDateString([], { month: 'long', year: 'numeric' })
        : `${a.toLocaleDateString([], { month: 'short' })} – ${b.toLocaleDateString([], { month: 'short', year: 'numeric' })}`;
    const lists = days.map(dayEvents),
      anyAll = lists.some((l) => l.some(isAllDay));
    return `<div class="wk" style="--n:${days.length}">
      <header class="wk-h"><button class="cal-btn" data-a="cal-today" title="Today (T)">today</button><button class="ibtn" data-a="wk-prev" title="Previous week (-)">${ic.left}</button><button class="ibtn" data-a="wk-next" title="Next week (=)">${ic.right}</button>
        <h1>${esc(title)}</h1><span class="grow"></span><button class="ibtn" data-a="event" title="Create event (B)">+</button><button class="ibtn" data-a="cmd" title="Command (${MOD}+K)">${ic.cmd}</button></header>
      ${calNoteHtml(days[0], true)}
      <div class="wk-days"><span class="wk-tz">${esc(tzName(days[0]))}</span>${days
        .map((t) => {
          const d = new Date(t);
          return `<div class="wk-dh${t === today ? ' today' : ''}"><span>${esc(d.toLocaleDateString([], { weekday: 'short' }))} ${d.getDate()}</span></div>`;
        })
        .join('')}</div>
      ${anyAll ? `<div class="wk-all"><span></span>${lists.map((l) => `<div>${l.filter(isAllDay).map(chipHtml).join('')}</div>`).join('')}</div>` : ''}
      <div class="cal-b wk-b"><div class="wk-g"><div class="wk-hrs">${Array.from({ length: 24 }, (_, h) => (h ? `<span style="top:${h * HPX}px">${hourLabel(h)}</span>` : '')).join('')}</div>${days.map((t, i) => `<div class="wk-col${t === today ? ' today' : ''}" data-day="${t}">${blocksHtml(t, lists[i])}</div>`).join('')}</div></div>
    </div>`;
  }
  // Beside the week: a month to jump around in and the calendar's options; or the event you're on.
  function calSideHtml() {
    const f = S.eventForm,
      email = esc(S.account?.email || '');
    if (f)
      return `<aside class="pane cal-pane cal-side with-form">${evFormHtml(f)}<div class="grow"></div>${evBtnsHtml(f)}</aside>`;
    const m0 = new Date(S.mmMonth ?? S.calDay);
    m0.setDate(1);
    m0.setHours(0, 0, 0, 0);
    const ws = weekStartsOn(),
      first = new Date(m0);
    first.setDate(1 - ((m0.getDay() - ws + 7) % 7));
    const today = dayStart(Date.now()),
      wk0 = weekStartOf(S.calDay),
      wk1 = addDays(wk0, 7);
    const names = Array.from({ length: 7 }, (_, i) => `<span>${'SMTWTFS'[(i + ws) % 7]}</span>`).join('');
    const cells = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      const t = d.getTime();
      return `<button class="mm-d${d.getMonth() !== m0.getMonth() ? ' o' : ''}${t === today ? ' today' : ''}${t >= wk0 && t < wk1 ? ' inwk' : ''}" data-jump="${t}" aria-label="${esc(d.toDateString())}"><span>${d.getDate()}</span></button>`;
    }).join('');
    const st = S.cal.status,
      opt = (k, label, on) =>
        `<label class="cal-opt"><input type="checkbox" data-calopt="${k}"${on ? ' checked' : ''}> ${label}</label>`;
    return `<aside class="pane cal-pane cal-side">
      <div class="mm"><div class="mm-h"><b>${esc(m0.toLocaleDateString([], { month: 'long', year: 'numeric' }))}</b><span class="grow"></span><button class="ibtn" data-a="mm-prev" title="Previous month">${ic.left}</button><button class="ibtn" data-a="mm-next" title="Next month">${ic.right}</button></div>
        <div class="mm-g">${names}${cells}</div></div>
      <div class="cal-sec"><div class="cal-sec-h">${ic.cal} calendar</div>
        <div class="cal-acct">${email} <span>${st?.connected ? 'linked' : st?.canConnect ? '<button data-a="cal-connect">connect</button>' : 'events made here only'}</span></div>
        ${opt('weekends', 'weekends', LS.get('cal:weekends', true))}${opt('declined', 'declined events', LS.get('cal:declined', false))}${opt('monday', 'week starts monday', LS.get('cal:monday', false))}
      </div>
      <div class="grow"></div><div class="pane-foot"><b>${email}</b><button class="ibtn" data-a="event" title="Create Event (B)">+</button></div></aside>`;
  }
  function evParsed(f) {
    const ft = eventTimes(f);
    return ft.ok ? esc(fmtRange(ft.start, ft.end)) : 'time? “tomorrow 2 pm 30 min”';
  }
  function evFormHtml(f) {
    if (f.readOnly)
      return `<div class="evform evview${f.fresh ? ' fresh' : ''}">
        <div class="etitle-ro">${esc(f.title)}</div>
        <div class="evline">${ic.clock}<span>${esc(fmtRange(f.start, f.end))}</span></div>
        ${f.where ? `<div class="evline">${ic.pin}<span>${linkify(f.where)}</span></div>` : ''}
        ${f.organizer || f.guests ? `<div class="evline">${ic.person}<span>${esc([f.organizer && `${f.organizer} (organizer)`, f.guests].filter(Boolean).join(', '))}</span></div>` : ''}
        <div class="evline evrsvp"><span class="inv-q">rsvp</span><span>${['yes', 'maybe', 'no'].map((x) => `<button class="inv-b${f.said === x ? ' on' : ''}" data-evrsvp="${x}" aria-pressed="${f.said === x}">${x}</button>`).join('')}</span></div>
        ${f.notes ? `<div class="evnotes">${linkify(f.notes)}</div>` : ''}
      </div>`;
    return `<div class="evform${f.fresh ? ' fresh' : ''}">
        <input class="etitle" data-e="title" value="${esc(f.title)}" placeholder="what" aria-label="Event title">
        <label class="evrow"><span>${ic.person}</span><input data-e="guests" value="${esc(f.guests)}" placeholder="who" autocomplete="off"></label>
        <label class="evrow"><span>${ic.clock}</span><input data-e="when" value="${esc(f.when)}" placeholder="${f.start ? 'change time: fri 3 pm 1 h' : 'tomorrow 2 pm 30 min'}"></label>
        <div class="evparsed">${evParsed(f)}</div>
        <label class="evrow"><span>${ic.pin}</span><input data-e="where" value="${esc(f.where)}" placeholder="where"></label>
        <label class="evrow"><span>${ic.lines}</span><input data-e="notes" value="${esc(f.notes)}" placeholder="notes"></label>
      </div>`;
  }
  function evBtnsHtml(f) {
    if (f.readOnly) return `<div class="evbtns"><button data-a="cancel-event">close</button><span>Esc</span></div>`;
    return `<div class="evbtns"><button class="save" data-a="save-event">save</button><button data-a="cancel-event">nope</button>${f.id ? '<button data-a="delete-event" title="Delete event">delete</button>' : ''}<span>${MOD}+Enter · Esc</span></div>`;
  }

  // Emails designed with their own backgrounds keep them on a white sheet; plain ones take the
  // theme's colours so text an email sets to black stays readable in the dark theme.
  const DESIGNED =
    /bgcolor\s*=|background(?:-color)?\s*:\s*(?!\s*(?:transparent|none|inherit|initial|#fff(?:fff)?\b|white|rgba?\(\s*255\s*,\s*255\s*,\s*255))[^;"']+|background\s*=/i;
  function mountBodies() {
    const carbon = document.documentElement.classList.contains('carbon');
    root.querySelectorAll('[data-b] iframe').forEach((f) => {
      const i = +f.parentElement.dataset.b,
        m = S.msgs[i];
      const paper = DESIGNED.test(m.html); // emails with their own design get a white sheet; plain ones take the card's colours
      f.classList.toggle('paper', paper);
      f.addEventListener('load', () => {
        try {
          f.contentDocument.addEventListener('keydown', (ev) => {
            const copy = new KeyboardEvent('keydown', {
              key: ev.key,
              code: ev.code,
              shiftKey: ev.shiftKey,
              ctrlKey: ev.ctrlKey,
              metaKey: ev.metaKey,
              altKey: ev.altKey,
              bubbles: true,
              cancelable: true,
            });
            if (!document.dispatchEvent(copy)) ev.preventDefault();
          });
        } catch {}
        const fit = () => {
          try {
            f.style.height = `${f.contentDocument.body.scrollHeight}px`;
          } catch {}
        };
        fit();
        setTimeout(fit, 400);
        setTimeout(fit, 1500);
      });
      const themed = paper
        ? ''
        : `body *{color:inherit!important;background-color:transparent!important;border-color:${carbon ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)'}!important}body a,body a *{color:${carbon ? '#7cc0ff' : '#1a5fa8'}!important}`;
      const fold = S.quotes.has(i)
        ? ''
        : `.gmail_quote,blockquote[type=cite],.moz-cite-prefix,.moz-cite-prefix~blockquote,#divRplyFwdMsg,#divRplyFwdMsg~*,#appendonsend~*{display:none!important}`;
      const bg = paper ? '#fff' : 'transparent';
      const fg = paper ? '#141413' : carbon ? 'rgba(255,255,255,.9)' : '#141413';
      // The frame's color-scheme must match the page's, or the browser paints it white under dark-theme text.
      f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
        html{color-scheme:${carbon && !paper ? 'dark' : 'light'}}html,body{background:${bg}!important;color:${fg}!important}body{margin:0;padding:${paper ? '16px' : '2px'};font:16px/24px -apple-system,"Segoe UI",sans-serif;overflow-wrap:anywhere}
        img{max-width:100%;height:auto}table{max-width:100%}a{color:${paper || !carbon ? '#1a5fa8' : '#7cc0ff'}}${themed}${fold}</style></head><body>${m.html}</body></html>`;
    });
  }

  function renderLayer(fresh) {
    const o = S.overlay;
    if (o?.kind !== 'file' && S.fileUrl) {
      URL.revokeObjectURL(S.fileUrl);
      S.fileUrl = null;
    }
    if (!o) {
      layer.innerHTML = '';
      return;
    }
    if (o.kind === 'cmd') {
      const items = paletteItems(o.q);
      o.i = Math.min(o.i, Math.max(0, items.length - 1));
      const list = items
        .map(
          (c, i) =>
            `<li class="${i === o.i ? 'on' : ''}" data-ci="${i}">${o.mode ? '' : '<span class="ic"></span>'}<span class="t">${esc(c.t)}</span>${c.lbl ? `<span class="when">${esc(c.lbl)}</span>` : `<span class="ks">${keysHtml(c.k || [])}</span>`}</li>`,
        )
        .join('');
      const had = layer.querySelector('.cmd input');
      if (had && !fresh) {
        layer.querySelector('.cmd ul').innerHTML = list;
        layer.querySelector('.cmd li.on')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      const head = {
        move: [ic.cmd, 'move to', 'folder?'],
        copy: [ic.cmd, 'label', 'label?'],
        zero: [ic.check, 'get me to zero', 'how old?'],
        date: [ic.cal, 'jump to date', 'when? friday, dec 3, next week'],
        snippet: [ic.pen, 'use snippet', 'which?'],
        snipname: [ic.pen, 'new snippet', 'name?'],
        remind: [ic.clock, 'remind when', 'when? 8 am, 3 days, aug 7'],
        later: [ic.clock, 'send when', 'when? 8 am, 3 days, aug 7'],
        split: [ic.cmd, 'new split', 'words. like from:github.com'],
      }[o.mode] || [ic.cmd, 'dude command', ''];
      layer.innerHTML = `<div class="scrim" data-a="close"><div class="cmd" role="dialog" aria-label="${head[1]}">
        <div class="cmd-h">${head[0]} ${head[1]}</div>
        <div class="cmd-in"><input placeholder="${esc(head[2])}" aria-label="${head[1]}" data-a="cq"></div>
        <ul>${list}</ul></div></div>`;
      setTimeout(() => layer.querySelector('.cmd input')?.focus(), 0);
      return;
    }
    if (o.kind === 'file') {
      layer.innerHTML = `<div class="viewer" role="dialog" aria-label="${esc(o.name)}">
        <div class="vbar"><span class="vname">${esc(o.name)}</span><button data-a="file-save" title="save to Downloads (S)">${ic.download} save</button><button data-a="file-close" title="close (Esc)">✕</button></div>
        <div class="vbody">${o.pdf ? `<iframe src="${o.url}#toolbar=1&view=FitH" title="${esc(o.name)}"></iframe>` : `<img src="${o.url}" alt="${esc(o.name)}">`}</div></div>`;
      return;
    }
    if (o.kind === 'keys') {
      const groups = [
        [
          'Navigation',
          [
            ['Next / previous conversation', 'J K'],
            ['Next / previous message', '↓ ↑'],
            ['Folder menu', '←'],
            ['Show new messages', 'Shift N'],
            ['Open', 'Enter'],
            ['Open or close message', 'O'],
            ['Back', 'Esc'],
            ['Next split inbox', 'Tab'],
            ['Command', `${MOD} K`],
            ['Search', '/'],
          ],
        ],
        [
          'Conversations',
          [
            ['Mark Done', 'E'],
            ['Mark not Done', 'Shift E'],
            ['Remind Me', 'H'],
            ['Star', 'S'],
            ['Read or unread', 'U'],
            ['Trash', '#'],
            ['Spam', '!'],
            ['Select', 'X'],
            ['Select all', `${MOD} A`],
            ['Move', 'V'],
            ['Undo', 'Z'],
          ],
        ],
        [
          'Messages',
          [
            ['Reply all', 'Enter'],
            ['Reply', 'R'],
            ['Forward', 'F'],
            ['Compose', 'C'],
            ['Send', `${MOD} Enter`],
            ['Send later', `${MOD} Shift L`],
            ['Cc', `${MOD} Shift C`],
            ['Discard draft', `${MOD} Shift ,`],
            ['Bcc', `${MOD} Shift B`],
            ['Attach', `${MOD} Shift A`],
            ['Snippet', ';'],
          ],
        ],
        [
          'Folders',
          [
            ['Next / previous split', 'Tab · Shift Tab'],
            ['Important / Other', 'G I · G O'],
            ['Starred', 'G S'],
            ['Sent', 'G T'],
            ['Done', 'G E'],
            ['Reminders', 'G H'],
            ['All mail', 'G A'],
            ['Trash', 'G #'],
          ],
        ],
        [
          'Calendar',
          [
            ['Day beside mail', '0'],
            ['Week', '2'],
            ['Back to mail', '1'],
            ['Create event', 'B'],
            ['Previous / next', '- ='],
            ['Today (week)', 'T'],
            ['Save event', `${MOD} Enter`],
            ['Answer event', 'Y M N'],
          ],
        ],
      ];
      layer.innerHTML = `<div class="scrim dim" data-a="close"><div class="dlg" role="dialog" style="width:720px"><h2>keys</h2><div class="keys">${groups.map(([g, rows]) => `<section><h5>${g}</h5>${rows.map(([n, k]) => `<div><span>${esc(n)}</span><span>${keysHtml(k.split(' '))}</span></div>`).join('')}</section>`).join('')}</div></div></div>`;
      return;
    }
  }

  // ---------- events ----------
  async function signIn(provider) {
    const email = (S.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast('type email first.');
      root.querySelector('[data-a="email"]')?.focus();
      return;
    }
    toast('login window…');
    try {
      S.account = await B.signIn(provider, email);
      S.screen = 'list';
      load('inbox');
    } catch (e) {
      toast(`login fail: ${esc(e.message || e)}`, 7000);
    }
  }

  const ACTIONS = {
    start: () => {
      S.more = true;
      renderSignin();
      root.querySelector('[data-a="email"]')?.focus();
    },
    'signin-ms': () => signIn('microsoft'),
    'signin-g': () => signIn('google'),
    demo: async () => {
      const D = window.DemoBackend;
      B = D;
      S.account = (await D.accounts())[0];
      S.screen = 'list';
      load('inbox');
    },
    'go-inbox': () => {
      if (S.pane === 'calendar' && window.innerWidth <= 768) {
        S.pane = 'contact';
        LS.set('pane', S.pane);
      }
      goto('inbox', S.split)();
    },
    cal: () => COMMANDS.find((c) => c.k[0] === '0').run(),
    menu: () => (S.menu ? closeMenu() : openMenu()),
    'close-menu': () => closeMenu(),
    'close-settings': () => {
      S.screen = 'list';
      render();
    },
    'new-split': () => {
      S.screen = 'list';
      S.overlay = { kind: 'cmd', mode: 'split', q: '', i: 0 };
      render();
      renderLayer(true);
    },
    signout: () => COMMANDS.find((c) => c.t === 'Sign Out').run(),
    relogin: async () => {
      const a = S.authNeeded;
      if (!a) return;
      toast('login window…');
      try {
        S.account = await B.signIn(a.provider, a.email);
        S.authNeeded = null;
        toast('login ok.');
        load(S.view === 'search' ? 'inbox' : S.view, true);
      } catch (e) {
        toast(`login fail: ${esc(errText(e))}`, 7000);
      }
    },
    cmd: () => openPalette(),
    search: () => openSearch(),
    compose: () => startCompose('new'),
    'row-done': () => act('done'),
    'row-remind': () => openWhen('remind'),
    done: () => act('done'),
    remind: () => openWhen('remind'),
    later: () => openWhen('later'),
    showcc: () => {
      S.composer.showCc = true;
      render();
      focusComposer('cc');
    },
    showbcc: () => {
      S.composer.showBcc = true;
      render();
      focusComposer('bcc');
    },
    attach: () => attachFiles(),
    'cal-connect': () => connectCalendar(),
    'file-close': () => {
      S.overlay = null;
      renderLayer();
    },
    'file-save': () => {
      const o = S.overlay;
      if (o && o.kind === 'file') openFile(o.folder, o.uid, o.name, o.index, 'save');
    },
    'leave-compose': () => leaveCompose(),
    'show-new': () => showNewMessages(),
    'close-search': () => closeSearch(),
    'cancel-event': () => closeEvent(),
    back: () => closeThread(),
    prev: () => step(-1),
    next: () => step(1),
    reply: () => startCompose('reply'),
    replyall: () => startCompose('replyall'),
    forward: () => startCompose('forward'),
    event: () => eventDialog(),
    send: () => sendComposer(),
    discard: () => {
      if (S.screen === 'compose') leaveCompose(true);
      else {
        S.composer = null;
        S.pop = false;
        render();
      }
    },
    'day-prev': () => dayMove(-1),
    'day-next': () => dayMove(1),
    'day-today': () => {
      S.calDay = dayStart(Date.now());
      S.calScroll = undefined;
      render();
    },
    'go-cal': () => goCal(),
    'go-mail': () => goMail(),
    'cal-today': () => calToday(),
    'wk-prev': () => weekMove(-1),
    'wk-next': () => weekMove(1),
    'mm-prev': () => {
      const d = new Date(S.mmMonth ?? S.calDay);
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      S.mmMonth = d.getTime();
      render();
    },
    'mm-next': () => {
      const d = new Date(S.mmMonth ?? S.calDay);
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      S.mmMonth = d.getTime();
      render();
    },
    'delete-event': () => deleteEvent(),
    keys: () => {
      S.overlay = { kind: 'keys' };
      renderLayer();
    },
    'save-event': () => saveEvent(),
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]');
    if (a && a.dataset.a === 'close' && e.target === a) {
      S.overlay = null;
      renderLayer();
      return;
    } // not a click inside the dialog
    const ci = e.target.closest('[data-ci]');
    if (ci) {
      const c = paletteItems(S.overlay.q)[+ci.dataset.ci];
      S.overlay = null;
      renderLayer();
      c?.run();
      return;
    }
    if (a && ACTIONS[a.dataset.a] && a.tagName !== 'INPUT') {
      const row = a.closest('[data-i]');
      if (row) S.sel = +row.dataset.i;
      e.stopPropagation();
      ACTIONS[a.dataset.a]();
      return;
    }
    const mi = e.target.closest('[data-menu]');
    if (mi) {
      const it = menuItems()[+mi.dataset.menu];
      closeMenu();
      it.run();
      if (S.screen === 'list') render();
      return;
    }
    const pl = e.target.closest('[data-poll]');
    if (pl) {
      setSetting('pollSeconds', +pl.dataset.poll);
      schedulePoll();
      render();
      return;
    }
    const nt = e.target.closest('[data-notify]');
    if (nt) {
      setSetting('notify', nt.dataset.notify);
      render();
      return;
    }
    const un = e.target.closest('[data-undo]');
    if (un) {
      setSetting('undoSeconds', +un.dataset.undo);
      render();
      return;
    }
    const th = e.target.closest('[data-theme]');
    if (th) {
      setTheme(th.dataset.theme === 'carbon');
      return;
    }
    const rs = e.target.closest('[data-rmsplit]');
    if (rs) {
      removeSplit(rs.dataset.rmsplit);
      S.screen = 'settings';
      render();
      return;
    }
    const sp = e.target.closest('[data-split]');
    if (sp) {
      S.split = sp.dataset.split;
      S.sel = 0;
      render();
      return;
    }
    const rc = e.target.closest('[data-recent]');
    if (rc) {
      runSearch(rc.dataset.recent);
      return;
    }
    const rf = e.target.closest('[data-rmfile]');
    if (rf && S.composer) {
      S.composer.files.splice(+rf.dataset.rmfile, 1);
      render();
      scheduleDraftSave();
      return;
    }
    const evb = e.target.closest('[data-ev]');
    if (evb) {
      openEvent(evb.dataset.ev);
      return;
    }
    const er = e.target.closest('[data-evrsvp]');
    if (er) {
      answerEvent(er.dataset.evrsvp);
      return;
    }
    const jd = e.target.closest('[data-jump]');
    if (jd) {
      S.calDay = +jd.dataset.jump;
      S.calScroll = undefined;
      render();
      return;
    }
    const rv = e.target.closest('[data-rsvp]');
    if (rv) {
      const [i, x] = rv.dataset.rsvp.split(':');
      answerInvite(+i, x);
      return;
    }
    const iv = e.target.closest('[data-invday]');
    if (iv) {
      const v = S.msgs[+iv.dataset.invday] && S.msgs[+iv.dataset.invday].invite;
      if (v) {
        S.calDay = dayStart(v.start);
        S.calScroll = Math.max(0, (new Date(v.start).getHours() - 1) * 44);
        render();
      }
      return;
    }
    const as = e.target.closest('[data-attsave]');
    if (as) {
      const [i, j] = as.dataset.attsave.split(':').map(Number),
        m = S.msgs[i],
        a = m.attachments[j];
      openFile(m.folder, m.uid, a.filename, j, 'save');
      return;
    }
    const ao = e.target.closest('[data-att]');
    if (ao) {
      const [i, j] = ao.dataset.att.split(':').map(Number),
        m = S.msgs[i],
        a = m.attachments[j];
      openFile(m.folder, m.uid, a.filename, j, 'open');
      return;
    }
    const rc2 = e.target.closest('[data-ratt]');
    if (rc2) {
      const [i, k] = rc2.dataset.ratt.split(':').map(Number),
        t = visible()[i],
        a = t?.atts[k];
      if (a) openFile(t.folder, a.uid, a.name, 0, 'open');
      return;
    }
    const tip = e.target.closest('[data-tip]');
    if (tip) {
      const i = root.querySelector('.sq');
      if (i) {
        i.value = (i.value ? `${i.value} ` : '') + tip.dataset.tip;
        S.search.q = i.value;
        i.focus();
      }
      return;
    }
    const op = e.target.closest('[data-open]');
    if (op) {
      const t = S.threads.find((x) => x.id === op.dataset.open);
      if (t) openThread(t);
      return;
    }
    const q = e.target.closest('[data-q]');
    if (q) {
      const i = +q.dataset.q;
      S.quotes.has(i) ? S.quotes.delete(i) : S.quotes.add(i);
      render();
      return;
    }
    const m = e.target.closest('.msg');
    if (m) {
      const i = +m.dataset.m;
      if (S.msgs[i]?.draft) return resumeDraft(i);
      if (!S.expanded.has(i)) toggleMsg(i);
      else if (S.focus !== i) {
        S.focus = i;
        render();
      }
      return;
    }
    const row = e.target.closest('.row');
    if (row) {
      S.sel = +row.dataset.i;
      openThread(current());
    }
  });
  document.addEventListener('dblclick', (e) => {
    const m = e.target.closest('.msg.open .msg-h');
    if (m) toggleMsg(+m.parentElement.dataset.m);
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (/^(to|cc|bcc)$/.test(el.dataset.c || '') || el.dataset.e === 'guests') suggest(el);
    if (el.closest?.('.editor')) {
      el.previousElementSibling.innerHTML = window.Markdown.tint(el.value);
      fitEditor(el);
    }
    if (el.dataset.set) {
      if (el.dataset.set === 'name') {
        if (S.account) S.account.name = el.value.trim();
        LS.set(`myname:${meAddr()}`, el.value.trim());
      } else setSetting(el.dataset.set, el.value);
      if (el.dataset.set === 'signature') {
        const pv = root.querySelector('.sigprev');
        if (pv) pv.innerHTML = window.Markdown.toHtml(el.value);
      }
    }
    if (el.dataset.c && S.composer) {
      scheduleDraftSave();
      S.composer[el.dataset.c] = el.value;
      if (el.dataset.c === 'subject' && S.screen === 'compose') {
        const h = root.querySelector('.thead h1');
        if (h) h.textContent = el.value.trim() || 'new mail';
      }
    } else if (el.dataset.e && S.eventForm) {
      S.eventForm[el.dataset.e] = el.value;
      S.eventForm.dirty = true;
      if (el.dataset.e === 'guests') S.eventForm.guestsTouched = true;
      if (el.dataset.e === 'when' || el.dataset.e === 'title') refreshCal();
    } else if (el.dataset.a === 'cq') {
      S.overlay.q = el.value;
      S.overlay.i = 0;
      renderLayer();
    } else if (el.dataset.a === 'sq') S.search.q = el.value;
    else if (el.dataset.a === 'email') S.email = el.value;
  });

  const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  document.addEventListener('keydown', async (e) => {
    const mod = e.metaKey || e.ctrlKey,
      k = e.key,
      o = S.overlay,
      tgt = e.target;
    if (S.sugg && tgt === S.sugg.el) {
      const sg = S.sugg;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        sg.i = (sg.i + (k === 'ArrowDown' ? 1 : -1) + sg.items.length) % sg.items.length;
        drawSugg();
        return;
      }
      if ((k === 'Enter' && !mod) || (k === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        takeSugg();
        return;
      }
      if (k === 'Escape') {
        e.preventDefault();
        closeSugg();
        return;
      }
    }
    if (S.screen === 'signin') {
      if (k === 'Enter' && tgt.dataset?.a === 'email') {
        e.preventDefault();
        signIn(S.email && /gmail|googlemail/i.test(S.email) ? 'google' : 'microsoft');
      }
      return;
    }
    if (mod && k === ',') {
      e.preventDefault();
      openSettings();
      return;
    }
    if (S.menu && !o) {
      const items = menuItems();
      const moveMenu = (d) => {
        S.menu.sel = (S.menu.sel + d + items.length) % items.length;
        root.querySelectorAll('[data-menu]').forEach((b) => {
          b.classList.toggle('on', +b.dataset.menu === S.menu.sel);
        });
        root.querySelector('.sm-item.on')?.scrollIntoView({ block: 'nearest' });
      };
      if (k === 'ArrowDown' || k === 'j') moveMenu(1);
      else if (k === 'ArrowUp' || k === 'k') moveMenu(-1);
      else if (k === 'Enter') {
        const it = items[S.menu.sel];
        closeMenu();
        it.run();
        if (S.screen === 'list') render();
      } else if (k === 'Escape' || k === 'ArrowRight' || k === 'ArrowLeft') closeMenu();
      else return;
      e.preventDefault();
      return;
    }
    if (S.screen === 'settings' && !o) {
      if (k === 'Escape') {
        e.preventDefault();
        if (typing(tgt)) tgt.blur();
        else {
          S.screen = 'list';
          render();
        }
      }
      return;
    }
    if (mod && k.toLowerCase() === 'k') {
      e.preventDefault();
      if (o && o.kind === 'cmd') {
        S.overlay = null;
        renderLayer();
      } else openPalette();
      return;
    }
    if (o) {
      if (k === 'Escape') {
        e.preventDefault();
        S.overlay = null;
        renderLayer();
        return;
      }
      if (o.kind === 'file') {
        if (k === 's' || k === 'S') {
          e.preventDefault();
          ACTIONS['file-save']();
        }
        return;
      }
      if (o.kind === 'cmd') {
        if (k === 'Backspace' && !o.q && o.mode === 'split') {
          S.overlay = { kind: 'cmd', q: '', i: 0 };
          renderLayer(true);
          e.preventDefault();
          return;
        }
        const items = paletteItems(o.q);
        if (k === 'ArrowDown' || (k === 'Tab' && !e.shiftKey)) {
          e.preventDefault();
          o.i = (o.i + 1) % Math.max(1, items.length);
          renderLayer();
        } else if (k === 'ArrowUp' || (k === 'Tab' && e.shiftKey)) {
          e.preventDefault();
          o.i = (o.i - 1 + items.length) % Math.max(1, items.length);
          renderLayer();
        } else if (k === 'Enter') {
          e.preventDefault();
          const c = items[o.i];
          S.overlay = null;
          renderLayer();
          c?.run();
        }
        return;
      }
      return;
    }
    if (S.eventForm) {
      if (mod && k === 'Enter') {
        e.preventDefault();
        if (!S.eventForm.readOnly) saveEvent();
      } else if (k === 'Escape') {
        e.preventDefault();
        closeEvent();
      } else if (S.eventForm.readOnly && !typing(tgt) && ['y', 'm', 'n'].includes(k)) {
        e.preventDefault();
        answerEvent({ y: 'yes', m: 'maybe', n: 'no' }[k]);
      }
      return;
    }
    if (S.composer && (typing(tgt) || S.screen === 'compose')) {
      const kl = k.toLowerCase();
      if (mod && k === 'Enter') {
        e.preventDefault();
        sendComposer();
      } else if (mod && e.shiftKey && kl === 'c') {
        e.preventDefault();
        S.composer.showCc = true;
        render();
        focusComposer('cc');
      } else if (mod && e.shiftKey && kl === 'b') {
        e.preventDefault();
        S.composer.showBcc = true;
        render();
        focusComposer('bcc');
      } else if (mod && e.shiftKey && kl === 'a') {
        e.preventDefault();
        attachFiles();
      } else if (mod && e.shiftKey && kl === 'l') {
        e.preventDefault();
        openWhen('later');
      } else if (mod && e.shiftKey && (k === ',' || k === '<')) {
        e.preventDefault();
        ACTIONS.discard();
      } else if (k === 'Escape') {
        e.preventDefault();
        if (S.screen === 'compose') leaveCompose();
        else if (!S.composer.text.trim()) {
          S.composer = null;
          render();
        } else tgt.blur?.();
      }
      return;
    }
    if (S.screen === 'search') {
      if (k === 'Escape') {
        e.preventDefault();
        closeSearch();
      } else if (k === 'Enter') {
        e.preventDefault();
        runSearch(root.querySelector('.sq')?.value || '');
      }
      return;
    }
    if (typing(tgt)) return;
    if (mod && k.toLowerCase() === 'a' && S.screen === 'list') {
      e.preventDefault();
      selectAll(e.shiftKey);
      return;
    }
    if (e.altKey || (mod && k !== 'Enter')) return;

    if (S.g) {
      S.g = false;
      const map = {
        i: ['inbox', 'important'],
        o: ['inbox', 'other'],
        s: ['starred'],
        d: ['drafts'],
        t: ['sent'],
        e: ['done'],
        h: ['reminders'],
        '!': ['spam'],
        '#': ['trash'],
        a: ['all'],
      };
      const m = map[k.toLowerCase()] || map[k];
      if (m) {
        e.preventDefault();
        goto(m[0], m[1])();
      }
      return;
    }
    if (S.screen === 'calendar') {
      const fn = {
        '-': () => weekMove(-1),
        '=': () => weekMove(1),
        ArrowLeft: () => weekMove(-1),
        ArrowRight: () => weekMove(1),
        t: calToday,
        T: calToday,
        b: () => eventDialog(),
        B: () => eventDialog(),
        Escape: goMail,
        1: goMail,
        c: () => startCompose('new'),
        '?': () => ACTIONS.keys(),
      }[k];
      if (fn) {
        e.preventDefault();
        fn();
      }
      return;
    }
    const thread = S.screen === 'thread';
    const handled = (() => {
      switch (k) {
        case 'ArrowLeft':
          if (!thread) openMenu();
          return true; // Superhuman: ← opens the folder menu
        case 'j':
          step(1);
          return true;
        case 'k':
          step(-1);
          return true;
        case 'ArrowDown':
        case 'n':
          thread ? moveFocus(1) : step(1);
          return true;
        case 'ArrowUp':
        case 'p':
          thread ? moveFocus(-1) : step(-1);
          return true;
        case 'Enter':
          if (!thread) openThread(current());
          else if (S.msgs[S.focus] && S.msgs[S.focus].draft) resumeDraft(S.focus);
          else if (S.msgs.length && !S.expanded.has(S.focus)) toggleMsg();
          else startCompose('replyall');
          return true;
        case 'Escape':
          if (thread) closeThread();
          else if (S.picked.size) {
            S.picked.clear();
            render();
          } else if (S.view === 'search') closeSearch();
          return true;
        case 'e':
          act('done');
          return true;
        case 'E':
          act('undone');
          return true;
        case 'h':
          openWhen('remind');
          return true;
        case 's':
          toggle('star');
          return true;
        case 'u':
          toggle('read');
          return true;
        case '#':
          act('trash');
          return true;
        case '!':
          act('spam');
          return true;
        case 'x':
          if (!thread) pick();
          return true;
        case 'z':
          undo();
          return true;
        case 'r':
          if (thread) startCompose('reply');
          return true;
        case 'f':
          if (thread) startCompose('forward');
          return true;
        case 'c':
          startCompose('new');
          return true;
        case '/':
          openSearch();
          return true;
        case 'g':
          S.g = true;
          setTimeout(() => (S.g = false), 1500);
          return true;
        case 'Tab':
          switchSplit(e.shiftKey ? -1 : 1);
          return true;
        case '0':
          ACTIONS.cal();
          return true;
        case '2':
          goCal();
          return true;
        case 'b':
        case 'B':
          eventDialog();
          return true;
        case '-':
          dayMove(-1);
          return true;
        case '=':
          dayMove(1);
          return true;
        case '?':
          ACTIONS.keys();
          return true;
        case 'o':
          if (thread) toggleMsg();
          return true;
        case 'O':
          if (thread) expandAll();
          return true;
        case 'v':
          openFolderPick('move');
          return true;
        case 'l':
          openFolderPick(isGmail() ? 'copy' : 'move');
          return true;
        case ';':
          snippetPick();
          return true;
        case 'N':
          if (thread) showNewMessages();
          return true;
      }
      return false;
    })();
    if (handled) e.preventDefault();
  });

  // ---------- start ----------
  (async () => {
    try {
      const acc = DESKTOP ? await B.accounts() : [];
      if (acc.length) {
        S.account = acc[0];
        S.screen = 'list';
        load('inbox');
        setTimeout(loadContacts, 8000);
        return;
      }
    } catch {}
    render();
  })();
  // Refresh the open folder (not the inbox: poll() below does that) every two minutes.
  setInterval(() => {
    if (S.screen === 'list' && S.view !== 'inbox' && !S.overlay && !S.composer && !S.search && !B.demo)
      load(S.view, true);
  }, 120e3);
  // Every minute: look for new inbox mail, notify about it (Settings: important / all / off),
  // keep the tray's unread count right, and refresh the inbox on screen without moving you.
  const seenMail = new Set();
  let pollReady = false;
  let polling = false,
    pollAgain = false;
  async function poll() {
    if (B.demo || !S.account || !window.mail) return;
    if (polling) {
      pollAgain = true;
      return;
    } // a push while checking: check once more after
    polling = true;
    let list;
    try {
      list = autoClear(await B.list('inbox'));
    } catch {
      return;
    } finally {
      polling = false;
      if (pollAgain) {
        pollAgain = false;
        setTimeout(poll, 300);
      }
    }
    S.cache.inbox = list;
    LS.set(snapKey(), list.slice(0, 150));
    const mode = SET().notify || 'important',
      fresh = [];
    for (const t of list) {
      let isNew = false;
      for (const u of t.uids || [t.id]) {
        const k = `${t.folder}:${u}`;
        if (!seenMail.has(k)) {
          seenMail.add(k);
          isNew = true;
        }
      }
      if (isNew && pollReady && t.unread && !(snoozes()[keyOf(t)] > Date.now())) fresh.push(t);
    }
    pollReady = true;
    const wanted = fresh.filter((t) => mode === 'all' || (mode === 'important' && splitOf(t) !== 'other'));
    if (wanted.length > 3)
      window.mail.notify({
        title: `${wanted.length} new mail`,
        body: `${wanted
          .slice(0, 3)
          .map((t) => nameOf(t.from))
          .join(', ')}…`,
      });
    else
      wanted.forEach((t) => {
        window.mail.notify({
          title: nameOf(t.from),
          body: (t.subject || '(no subject)') + (t.snippet ? ` — ${t.snippet.slice(0, 110)}` : ''),
          id: t.id,
        });
      });
    window.mail.setUnread(list.filter((t) => t.unread && splitOf(t) !== 'other').length);
    if (S.screen === 'list' && S.view === 'inbox' && !S.overlay && !S.composer && !S.menu) {
      const selId = current()?.id;
      S.threads = list;
      const i = visible().findIndex((t) => t.id === selId);
      S.sel = i >= 0 ? i : Math.min(S.sel, Math.max(0, visible().length - 1));
      render();
    }
  }
  // The timer is the backup (Settings → check mail); pushed changes from the server come at once.
  let pollTimer = null;
  function schedulePoll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(
      async () => {
        await poll();
        schedulePoll();
      },
      (SET().pollSeconds || 60) * 1000,
    );
  }
  schedulePoll();
  setTimeout(poll, 4000);
  if (window.mail?.onMail)
    window.mail.onMail(() => {
      if (B.demo) return;
      poll();
      if (S.screen === 'thread') checkThread();
      if (S.screen === 'list' && S.view !== 'inbox' && !S.overlay) load(S.view, true);
    });
  if (window.mail?.pushStatus)
    setInterval(async () => {
      try {
        const live = (await window.mail.pushStatus()).live;
        if (live !== S.pushLive) {
          S.pushLive = live;
          if (S.screen === 'settings') render();
        }
      } catch {}
    }, 10e3);
  if (window.mail?.onAuth)
    window.mail.onAuth((info) => {
      if (!B.demo) needSignIn(info);
    });
  if (window.mail?.onOpen) {
    window.mail.onOpen((id) => {
      const t = [...S.threads, ...(S.cache.inbox || [])].find((x) => x.id === id);
      if (!t) return;
      if (S.screen !== 'list' && S.screen !== 'thread') {
        S.screen = 'list';
      }
      openThread(t);
    });
    window.mail.onDo((what) => {
      if (what === 'compose' && S.account) startCompose('new');
    });
  }
  async function checkThread() {
    const t = S.open;
    if (S.screen !== 'thread' || !t || !S.msgs.length || S.checking) return;
    S.checking = true;
    try {
      let next = t;
      if (VIEWS[S.view] && S.view !== 'reminders') {
        // A new message gets a new number on the server: find this conversation's current group.
        const list = await B.list(S.view);
        const mine = new Set(t.uids || []);
        next = list.find((g) => (g.uids || []).some((u) => mine.has(u)) && g.folder === t.folder) || t;
        if (S.open !== t) return;
        S.threads = list;
      }
      const got = await B.thread(next);
      if (B.related) {
        try {
          got.push(...(await B.related(next, got)));
        } catch {}
      }
      if (S.open !== t) return;
      for (let i = got.length - 1; i >= 0; i--) if (got[i].draft) got.splice(i, 1);
      const have = new Set(S.msgs.map((m) => m.messageId || m.id));
      const fresh = got.filter((m) => !have.has(m.messageId || m.id));
      if (fresh.length) {
        S.newer = { thread: next, msgs: got, count: fresh.length };
        render();
      }
    } catch {
      /* offline for a moment: try again next time */
    } finally {
      S.checking = false;
    }
  }
  setInterval(checkThread, 30e3);
  function showNewMessages() {
    const n = S.newer;
    if (!n) return;
    const have = new Set(S.msgs.map((m) => m.messageId || m.id));
    const extra = (S.sentIn[keyOf(S.open)] || []).filter((m) => !n.msgs.some((x) => x.messageId === m.messageId));
    const merged = tidyDrafts(
      n.thread,
      [...n.msgs, ...extra, ...S.msgs.filter((m) => m.draft)].sort((a, b) => a.date - b.date),
    );
    S.open = n.thread;
    S.msgs = merged;
    S.newer = null;
    merged.forEach((m, i) => {
      if (!have.has(m.messageId || m.id)) S.expanded.add(i);
    });
    S.focus = merged.findIndex((m) => !have.has(m.messageId || m.id));
    if (S.focus < 0) S.focus = merged.length - 1;
    render();
    root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
  }
})();
