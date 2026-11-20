// ---------- data ----------

import { matchQuery } from '../search.js';
import { autoClear } from './commands.js';
import { meAddr, scheduled, whenLabel } from './compose.js';
import { B, esc, keyOf, LS, S, toast } from './core.js';
import { render } from './render.jsx';

export const snoozes = () => LS.get('snooze', {});
export const customSplits = () => LS.get('splits', []);

export const allSplits = () => [
  { id: 'important', name: 'Important' },
  ...customSplits(),
  { id: 'other', name: 'Other' },
];

export function splitOf(t) {
  for (const sp of customSplits()) if (matchQuery(t, sp.q)) return sp.id;
  return t.list ? 'other' : 'important';
}

export function visible() {
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

export const current = () => visible()[S.sel];

export const counts = () => {
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

export function addSplit(name, q) {
  const id = `sp${Date.now()}`;
  LS.set('splits', [...customSplits(), { id, name, q }]);
  S.view = 'inbox';
  S.split = id;
  S.sel = 0;
  S.screen = 'list';
  render();
  toast(`split “${esc(name)}” made. Tab move.`);
}

export function removeSplit(id) {
  LS.set(
    'splits',
    customSplits().filter((x) => x.id !== id),
  );
  if (S.split === id) S.split = 'important';
  render();
  toast('split gone.');
}

export function learnMyName(list) {
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
export const snapKey = () => `snap:${meAddr()}`;

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

export async function load(view = S.view, keepSel = false) {
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

export function prefetch(t) {
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
