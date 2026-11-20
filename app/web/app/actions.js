// ---------- actions ----------

import { onSettled } from 'solid-js';
import { goto } from './commands.js';
import { leaveCompose } from './compose.js';
import { B, change, LS, M, minus, plus, root, S, toast } from './core.js';
import { allSplits, current, load, snoozes, visible } from './data.js';
import { render } from './render.jsx';
import { closeThread, step } from './thread.js';

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

export function targets() {
  if (S.screen === 'thread' && S.open) return [S.open];
  const v = visible();
  if (S.picked.size) return v.filter((t) => S.picked.has(t.id));
  return v[S.sel] ? [v[S.sel]] : [];
}

export async function act(action, list = targets(), quiet = false, folder) {
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
      change(() =>
        list.forEach((t) => {
          t._leaving = true;
        }),
      );
      rows.forEach((r) => {
        r.classList.add('leaving');
      });
      await new Promise((r) => setTimeout(r, 170));
    }
  }
  change(() => {
    if (removes) {
      const ids = new Set(list.map((t) => t.id));
      S.threads = S.threads.filter((t) => !ids.has(t.id));
      if (M.cache[S.view]) M.cache[S.view] = S.threads;
      ids.forEach((id) => {
        M.tcache.delete(id);
      });
      S.picked = new Set();
      if (S.screen === 'thread') closeThread(true);
    } else
      list.forEach((t) => {
        if (action === 'star' || action === 'unstar') t.starred = action === 'star';
        if (action === 'read' || action === 'unread') t.unread = action === 'unread';
      });
    S.sel = Math.min(S.sel, Math.max(0, visible().length - 1));
    render();
  });
  if (!quiet) toast([`${LABEL[action]}${list.length > 1 ? ` · ${list.length}` : ''} `, 'Z', ' undo']);
  try {
    const res = await Promise.all(list.map((t) => B.act(t, action, folder)));
    M.undo.push({ action: INVERSE[action], threads: res.map((r, i) => (r?.id ? r : list[i])), reload: removes });
  } catch (e) {
    toast(`no work: ${e.message || e}`);
    load(S.view, true);
  }
}

export async function undo() {
  const u = M.undo.pop();
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

export function toggle(kind) {
  const t = targets()[0];
  if (!t) return;
  if (kind === 'star') act(t.starred ? 'unstar' : 'star');
  else act(t.unread ? 'read' : 'unread');
}

// Search is its own page, with tips on the right; Enter searches the whole mailbox.
export function openSearch() {
  if (S.screen === 'compose') leaveCompose();
  if (S.screen !== 'search')
    M.back = { screen: S.screen === 'thread' ? 'thread' : 'list', open: S.open, msgs: S.msgs, view: S.view };
  S.screen = 'search';
  S.search = { q: S.search?.q || '' };
  render();
  onSettled(() => {
    const i = root.querySelector('.sq');
    if (i) {
      i.focus();
      i.select();
    }
  });
}

export function runSearch(q) {
  q = q.trim();
  if (!q) return;
  LS.set('recent', [q, ...LS.get('recent', []).filter((x) => x !== q)].slice(0, 8));
  S.search = { q };
  S.screen = 'list';
  load('search');
}

export function closeSearch() {
  const b = M.back || {};
  M.back = null;
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

export function switchSplit(d = 1) {
  if (S.view !== 'inbox') return goto('inbox', 'important')();
  const sp = allSplits(),
    i = sp.findIndex((x) => x.id === S.split);
  S.split = sp[(i + d + sp.length) % sp.length].id;
  S.sel = 0;
  render();
}

export function pick() {
  const t = current();
  if (!t) return;
  S.picked = S.picked.has(t.id) ? minus(S.picked, t.id) : plus(S.picked, t.id);
  step(1);
  render();
}
