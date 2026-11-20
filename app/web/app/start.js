// ---------- start ----------
// Every minute: look for new inbox mail, notify about it (Settings: important / all / off),
// keep the tray's unread count right, and refresh the inbox on screen without moving you.

import { onSettled } from 'solid-js';
import { autoClear } from './commands.js';
import { startCompose } from './compose.js';
import { B, change, DESKTOP, keyOf, LS, M, nameOf, needSignIn, plus, root, S, VIEWS } from './core.js';
import { current, load, snapKey, snoozes, splitOf, visible } from './data.js';
import { loadContacts } from './people.js';
import { render } from './render.jsx';
import { SET } from './settings.jsx';
import { openThread, tidyDrafts } from './thread.js';

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
  M.cache.inbox = list;
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
  if (S.screen === 'list' && S.view === 'inbox' && !S.overlay && !S.composer && !S.menu)
    change(() => {
      const selId = current()?.id;
      S.threads = list;
      const i = visible().findIndex((t) => t.id === selId);
      S.sel = i >= 0 ? i : Math.min(S.sel, Math.max(0, visible().length - 1));
      render();
    });
}

// The timer is the backup (Settings → check mail); pushed changes from the server come at once.
let pollTimer = null;

export function schedulePoll() {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(
    async () => {
      await poll();
      schedulePoll();
    },
    (SET().pollSeconds || 60) * 1000,
  );
}

async function checkThread() {
  const t = S.open;
  if (S.screen !== 'thread' || !t || !S.msgs.length || M.checking) return;
  M.checking = true;
  try {
    let next = t;
    if (VIEWS[S.view] && S.view !== 'reminders') {
      // A new message gets a new number on the server: find this conversation's current group.
      const list = await B.list(S.view);
      const mine = new Set(t.uids || []);
      next = list.find((g) => (g.uids || []).some((u) => mine.has(u)) && g.folder === t.folder) || t;
      if (S.open !== t) return;
      change(() => {
        S.threads = list;
      });
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
    if (fresh.length)
      change(() => {
        S.newer = { thread: next, msgs: got, count: fresh.length };
        render();
      });
  } catch {
    /* offline for a moment: try again next time */
  } finally {
    M.checking = false;
  }
}

export function showNewMessages() {
  const n = S.newer;
  if (!n) return;
  const have = new Set(S.msgs.map((m) => m.messageId || m.id));
  const extra = (M.sentIn[keyOf(S.open)] || []).filter((m) => !n.msgs.some((x) => x.messageId === m.messageId));
  const merged = tidyDrafts(
    n.thread,
    [...n.msgs, ...extra, ...S.msgs.filter((m) => m.draft)].sort((a, b) => a.date - b.date),
  );
  S.open = n.thread;
  S.msgs = merged;
  S.newer = null;
  merged.forEach((m, i) => {
    if (!have.has(m.messageId || m.id)) S.expanded = plus(S.expanded, i);
  });
  S.focus = merged.findIndex((m) => !have.has(m.messageId || m.id));
  if (S.focus < 0) S.focus = merged.length - 1;
  render();
  onSettled(() => {
    root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
  });
}

// Runs once every module has loaded (../main.js calls it): show the first screen, start the timers.
export function start() {
  (async () => {
    try {
      const acc = DESKTOP ? await B.accounts() : [];
      if (acc.length) {
        change(() => {
          S.account = acc[0];
          S.screen = 'list';
          load('inbox');
        });
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
        if (live !== S.pushLive)
          change(() => {
            S.pushLive = live;
            if (S.screen === 'settings') render();
          });
      } catch {}
    }, 10e3);
  if (window.mail?.onAuth)
    window.mail.onAuth((info) => {
      if (!B.demo) needSignIn(info);
    });
  if (window.mail?.onOpen) {
    window.mail.onOpen((id) => {
      const t = [...S.threads, ...(M.cache.inbox || [])].find((x) => x.id === id);
      if (!t) return;
      change(() => {
        if (S.screen !== 'list' && S.screen !== 'thread') S.screen = 'list';
        openThread(t);
      });
    });
    window.mail.onDo((what) => {
      if (what === 'compose' && S.account) change(() => startCompose('new'));
    });
  }
  setInterval(checkThread, 30e3);
}
