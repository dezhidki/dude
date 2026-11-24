// ---------- thread ----------

import { onSettled } from 'solid-js';
import type { Msg } from '../api.ts';
import { blankDraft, focusComposer, scheduled, stashReply } from './compose.ts';
import { addrList, B, type Conv, change, keyOf, LS, M, type Mail1, minus, plus, root, S, toast } from './core.ts';
import { current, prefetch, visible } from './data.ts';
import { render } from './render.tsx';

/** plain: read it as a conversation whatever the list shows (a todo's mail), not as a draft or a scheduled send */
export async function openThread(t0: Conv | undefined, plain = false) {
  if (!t0) {
    return;
  }
  let t: Conv = t0;
  let early: Mail1[] | undefined, wasUnread: boolean | undefined;
  const opening = change(() => {
    if (!plain) {
      leaveTodoMail(); // another mail: Esc goes back to the list
    }
    if (S.screen === 'thread') {
      stashReply();
    }
    if (t.sched && !plain) {
      return openScheduled(t);
    }
    if (S.view === 'drafts' && !plain) {
      return openServerDraft(t);
    }
    S.open = t;
    t = S.open as Conv; // the store's own: what S.open is compared with later
    S.screen = 'thread';
    S.msgs = [];
    S.newer = null;
    S.composer = null;
    S.expanded = new Set();
    S.quotes = new Set();
    S.focus = 0;
    early = M.tcache.get(t.id);
    if (early) {
      const seen = early;
      const extra0 = (M.sentIn[keyOf(t)] || []).filter((m) => !seen.some((x) => x.messageId === m.messageId));
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
    wasUnread = t.unread;
    if (t.unread) {
      t.unread = false;
    }
    return true;
  });
  if (opening !== true) {
    return;
  }
  if (early) {
    onSettled(() => {
      root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
    });
  }
  let got: Msg[] | undefined;
  try {
    got = await B.thread(t, { unread: wasUnread });
  } catch (e) {
    if (!early) {
      toast(`no open: ${(e as Error).message || e}`);
    }
  }
  if (got) {
    if (early && S.open === t) {
      // already showing: only redraw if the server knows more than we did
      const ids = new Set(S.msgs.map((m) => m.messageId || m.id));
      if (got.every((m) => ids.has(m.messageId || m.id))) {
        return mergeRelated(t);
      }
    }
    if (S.open !== t) {
      return;
    }
    const fresh = got;
    change(() => {
      const have = new Set(fresh.map((m) => m.messageId).filter(Boolean));
      const extra = (M.sentIn[keyOf(t)] || []).filter((m) => !have.has(m.messageId));
      S.msgs = tidyDrafts(
        t,
        withLocalDraft(
          t,
          [...fresh, ...extra].sort((a, b) => a.date - b.date),
        ),
      );
      const lastReal = lastRealIndex(S.msgs);
      S.expanded = new Set([lastReal]);
      S.focus = lastReal;
      M.tcache.set(t.id, S.msgs);
    });
  }
  render();
  onSettled(() => {
    root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest' });
  });
  void mergeRelated(t);
}

// Your own replies (from Sent) arrive a moment after the conversation opens.
export const lastRealIndex = (list: Mail1[]) => {
  for (let i = list.length - 1; i >= 0; i--) {
    if (!list[i]?.draft) {
      return i;
    }
  }
  return Math.max(0, list.length - 1);
};

// Draft rows in a conversation: none while you're writing a reply in it; otherwise only one (yours
// from this session, else the newest saved copy). Older copies are remembered and removed from
// the Drafts folder the next time that draft is saved.
export function tidyDrafts(t: Conv, list: Mail1[]): Mail1[] {
  const composing = !!S.composer && S.composer.mode !== 'new' && S.screen === 'thread';
  const real = list.filter((m) => !m.draft);
  if (composing) {
    return real;
  }
  const c = S.replyDrafts.get(keyOf(t));
  const drafts = list.filter((m) => m.draft && !(c?.draftUid && !m.local && m.uid === c.draftUid));
  drafts.sort((a, b) => (b.local ? 1 : 0) - (a.local ? 1 : 0) || b.date - a.date);
  const keep = drafts[0];
  if (!keep) {
    return real;
  }
  keep.others = drafts
    .slice(1)
    .map((d) => d.uid)
    .filter((u): u is number => !!u);
  return [...real, keep];
}

function withLocalDraft(t: Conv, list: Mail1[]): Mail1[] {
  const c = S.replyDrafts.get(keyOf(t));
  const out = list.filter((m) => !(m.draft && c?.draftUid && m.uid === c.draftUid));
  if (c && !blankDraft(c)) {
    out.push({
      id: 'local-draft',
      draft: true,
      local: c,
      to: c.to
        .split(/[,;]/)
        .map((x) => ({ name: x.replace(/<.*>/, '').trim(), address: (/<([^>]+)>/.exec(x) || [null, x.trim()])[1] })),
      text: c.text,
      date: Date.now(),
    } as Mail1); // a row standing for the reply being written
  }
  return out;
}

async function mergeRelated(t: Conv) {
  if (!B.related || S.open !== t || !S.msgs.length) {
    return;
  }
  let more: Msg[];
  try {
    more = await B.related(t, S.msgs);
  } catch {
    return;
  }
  if (S.open !== t || !more || !more.length) {
    return;
  }
  change(() => mergeIn(t, more));
}
function mergeIn(t: Conv, more: Mail1[]) {
  const have = new Set(S.msgs.map((m) => m.messageId).filter(Boolean));
  const localUid = (S.composer && S.open === t && S.composer.draftUid) || S.replyDrafts.get(keyOf(t))?.draftUid;
  const add = more.filter(
    (m) => (!m.messageId || !have.has(m.messageId)) && !(m.draft && localUid && m.uid === localUid),
  );
  if (!add.length) {
    return;
  }
  const wasLast = S.focus === S.msgs.length - 1,
    fm = S.msgs[S.focus],
    focusId = fm && (fm.messageId || fm.id);
  const open = new Set([...S.expanded].map((i) => S.msgs[i] && (S.msgs[i].messageId || S.msgs[i].id)));
  S.msgs = tidyDrafts(
    t,
    [...S.msgs, ...add].sort((a, b) => a.date - b.date),
  );
  S.expanded = new Set(S.msgs.map((m, i) => (open.has(m.messageId || m.id) ? i : -1)).filter((i) => i >= 0));
  if (wasLast) {
    S.expanded = plus(S.expanded, S.msgs.length - 1);
    S.focus = S.msgs.length - 1;
  } else {
    S.focus = Math.max(
      0,
      S.msgs.findIndex((m) => (m.messageId || m.id) === focusId),
    );
  }
  M.tcache.set(t.id, S.msgs);
  if (!S.composer) {
    render();
  }
}

async function openServerDraft(t: Conv) {
  try {
    const got = await B.thread(t, { peek: true });
    const m = got[got.length - 1];
    if (!m) {
      return;
    }
    M.back = { screen: 'list' };
    change(() => {
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
    });
  } catch (e) {
    toast(`draft no open: ${(e as Error).message || e}`);
  }
}

function openScheduled(t: Conv) {
  const sched = t.sched as NonNullable<Conv['sched']>;
  LS.set(
    'scheduled',
    scheduled().filter((x) => x.at !== sched.at || x.msg.subject !== sched.msg.subject),
  );
  const m = sched.msg;
  M.back = { screen: 'list' };
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

/** a todo's mail is left: the todo open on the board comes back; true when the mail was opened from the board */
export function leaveTodoMail() {
  const from = M.threadFrom;
  M.threadFrom = null;
  if (from?.form && !S.todoForm) {
    S.todoForm = from.form;
  }
  return !!from;
}

export function closeThread(keep?: boolean) {
  if (!keep) {
    stashReply();
  }
  S.screen = leaveTodoMail() ? 'board' : 'list'; // back to the todo it was opened from
  S.open = null;
  S.msgs = [];
  if (!keep) {
    S.composer = null;
  }
  render();
}

export function step(d: number) {
  const v = visible();
  if (!v.length) {
    return;
  }
  S.sel = Math.max(0, Math.min(v.length - 1, S.sel + d));
  if (S.screen === 'thread') {
    void openThread(v[S.sel]);
  } else {
    updateSel();
  }
  onSettled(scrollSel);
}

function updateSel() {
  if (S.screen !== 'list' || !root.querySelector('.list')) {
    return render();
  }
  prefetch(current()); // only the highlight moves, and the pane beside it follows
}

// Inside a conversation: arrows move between its messages; J/K move between conversations.
export function moveFocus(d: number) {
  if (!S.msgs.length) {
    return;
  }
  S.focus = Math.max(0, Math.min(S.msgs.length - 1, S.focus + d)); // only the highlight moves
  onSettled(() => {
    root.querySelector('.msg.focus')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

export function toggleMsg(i = S.focus) {
  S.expanded = S.expanded.has(i) ? minus(S.expanded, i) : plus(S.expanded, i);
  S.focus = i;
  render();
}

function scrollSel() {
  const r = root.querySelector('.row.sel');
  if (r) {
    r.scrollIntoView({ block: 'nearest' });
  }
}
