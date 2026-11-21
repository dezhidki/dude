// ---------- data ----------

import type { Msg, Thread } from '../api.ts';
import { matchQuery } from '../search.ts';
import { autoClear } from './commands.ts';
import { meAddr, scheduled, whenLabel } from './compose.ts';
import { B, type Conv, change, keyOf, LS, M, now, S, type Split, toast } from './core.ts';
import { render } from './render.tsx';

export const snoozes = () => LS.get<Record<string, number>>('snooze', {});
export const customSplits = () => LS.get<Split[]>('splits', []);

export const allSplits = (): Split[] => [
  { id: 'important', name: 'Important' },
  ...customSplits(),
  { id: 'other', name: 'Other' },
];

export function splitOf(t: Thread) {
  for (const sp of customSplits()) {
    if (matchQuery(t, sp.q)) {
      return sp.id;
    }
  }
  return t.list ? 'other' : 'important';
}

export function visible() {
  const sn = snoozes(),
    at = now();
  let t = S.threads;
  if (S.view === 'inbox') {
    const split = allSplits().some((x) => x.id === S.split) ? S.split : 'important'; // a removed split: Important
    t = t.filter((x) => !((sn[keyOf(x)] ?? 0) > at) && splitOf(x) === split);
  }
  if (S.unreadOnly) {
    t = t.filter((x) => x.unread);
  }
  return t;
}

export const current = () => visible()[S.sel];

export const counts = () => {
  const sn = snoozes(),
    at = now(),
    c: Record<string, number> = {};
  S.threads.forEach((x) => {
    if (!((sn[keyOf(x)] ?? 0) > at)) {
      const k = splitOf(x);
      c[k] = (c[k] || 0) + 1;
    }
  });
  return c;
};

export function addSplit(name: string, q: string) {
  const id = `sp${Date.now()}`;
  LS.set('splits', [...customSplits(), { id, name, q }]);
  S.view = 'inbox';
  S.split = id;
  S.sel = 0;
  S.screen = 'list';
  render();
  toast(`split “${name}” made. Tab move.`);
}

export function removeSplit(id: string) {
  LS.set(
    'splits',
    customSplits().filter((x) => x.id !== id),
  );
  if (S.split === id) {
    S.split = 'important';
  }
  render();
  toast('split gone.');
}

export function learnMyName(list: Pick<Thread, 'from' | 'to'>[]) {
  if (!S.account || S.account.name) {
    return;
  }
  const acct = S.account;
  const known = LS.get(`myname:${meAddr()}`, '');
  if (known) {
    acct.name = known;
    return;
  }
  for (const t of list || []) {
    for (const p of [t.from, ...(t.to || [])]) {
      if (p?.name && (p.address || '').toLowerCase() === meAddr()) {
        acct.name = p.name;
        LS.set(`myname:${meAddr()}`, p.name);
        return;
      }
    }
  }
}

// Lists show at once from memory (and the inbox from the last session), then refresh quietly;
// "Loading…" only appears the very first time a folder is opened.
export const snapKey = () => `snap:${meAddr()}`;

function cachedList(view: string): Conv[] | null {
  if (M.cache[view]) {
    return M.cache[view];
  }
  if (view === 'inbox' && !B.demo) {
    const snap = LS.get<Conv[] | null>(snapKey(), null);
    if (snap) {
      M.cache.inbox = snap;
      return snap;
    }
  }
  return null;
}

export async function load(view = S.view, keepSel = false) {
  let selId: string | undefined,
    cached: Conv[] | null = null;
  change(() => {
    const prevView = S.view;
    selId = current()?.id;
    S.view = view;
    if (view !== 'search') {
      S.search = null;
    }
    if (!keepSel) {
      S.sel = 0;
      S.picked = new Set();
    }
    cached = view !== 'search' && view !== 'reminders' && view !== 'scheduled' ? cachedList(view) : null;
    if (prevView !== view || !keepSel) {
      S.threads = cached || [];
    }
    S.loading = !cached;
    render();
  });
  // nothing in memory: show last time's copy from disk at once, then refresh from the server
  if (!cached && B.listCached && view !== 'search' && view !== 'reminders' && view !== 'scheduled') {
    try {
      const quick = await B.listCached(view);
      change(() => {
        if (quick?.length && S.view === view && S.loading) {
          S.threads = quick;
          S.loading = false;
          render();
        }
      });
    } catch {}
  }
  let list: Conv[] = [],
    failed: unknown;
  try {
    if (view === 'reminders') {
      const sn = snoozes(),
        all = await B.list('all');
      list = all.filter((t) => (sn[keyOf(t)] ?? 0) > Date.now());
    } else if (view === 'scheduled') {
      list = scheduled()
        .sort((a, b) => a.at - b.at)
        .map(
          (x, i) =>
            ({
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
            }) as Partial<Conv> as Conv, // a row to show, not a conversation on the server
        );
    } else if (view === 'search') {
      list = await B.search(S.search?.q ?? '');
    } else {
      list = await B.list(view);
    }
  } catch (e) {
    failed = e;
  }
  change(() => {
    if (failed) {
      toast(`mail no load: ${(failed as Error).message || failed}`);
      if (!cached) {
        S.threads = [];
      }
      S.loadError = true;
    } else {
      S.threads = view === 'inbox' ? autoClear(list) : list;
      S.loadError = false;
    }
    if (S.view !== view) {
      return; // you moved on while it loaded
    }
    S.loading = false;
    if (view !== 'search' && view !== 'reminders') {
      M.cache[view] = S.threads;
      if (view === 'inbox' && !B.demo) {
        LS.set(snapKey(), S.threads.slice(0, 150));
      }
    }
    learnMyName(S.threads);
    // keep the same conversation selected when the list refreshes underneath you
    const v = visible(),
      at = selId
        ? v.findIndex(
            (t) =>
              t.id === selId || (t.uids || []).some((u) => (selId?.split(':')[1] || '').split(',').includes(String(u))),
          )
        : -1;
    S.sel = at >= 0 && keepSel ? at : Math.min(S.sel, Math.max(0, v.length - 1));
    if (S.screen === 'list') {
      render();
    }
    prefetch(current());
  });
}

// Fetch the conversation you're on before you open it (without marking it read).
let prefetchTimer: ReturnType<typeof setTimeout> | undefined;

export function prefetch(t: Thread | undefined) {
  clearTimeout(prefetchTimer);
  if (!t || M.tcache.has(t.id)) {
    return;
  }
  prefetchTimer = setTimeout(async () => {
    try {
      const got = await B.thread(t, { peek: true });
      let more: Msg[] = [];
      if (B.related) {
        try {
          more = await B.related(t, got);
        } catch {}
      }
      const have = new Set(got.map((m) => m.messageId).filter(Boolean));
      M.tcache.set(
        t.id,
        [...got, ...more.filter((m) => !m.messageId || !have.has(m.messageId))].sort((a, b) => a.date - b.date),
      );
    } catch {}
  }, 120);
}
