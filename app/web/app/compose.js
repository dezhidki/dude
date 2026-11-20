// ---------- compose ----------

import { toHtml } from '../markdown.js';
import { parseWhen } from '../when.js';
import { act, targets } from './actions.js';
import { addrList, B, DAY, esc, fullDate, keyOf, LS, layer, nameOf, root, S, splitList, toast } from './core.js';
import { learnMyName, snoozes, visible } from './data.js';
import { render, renderLayer } from './render.jsx';
import { SET, sigBlock } from './settings.jsx';
import { closeThread, lastRealIndex } from './thread.js';

export const meAddr = () => (S.account?.email || '').toLowerCase();

export function startCompose(mode) {
  if (mode === 'new') {
    S.back = S.screen === 'compose' ? S.back : { screen: S.screen, open: S.open, msgs: S.msgs };
    S.composer = S.draft || { mode, to: '', cc: '', subject: '', text: sigBlock() };
    S.draft = null;
    S.screen = 'compose';
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
  render();
  focusComposer(mode === 'forward' ? 'to' : 'text');
}

export const blankDraft = (c) =>
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

export function scheduleDraftSave() {
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
      html: toHtml(body),
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
export function stashReply() {
  const c = S.composer;
  if (!c || !S.open || c.mode === 'new') return;
  if (blankDraft(c)) discardDraft(c);
  else {
    S.replyDrafts.set(keyOf(S.open), c);
    saveDraftNow(c);
  }
}

export function resumeDraft(i) {
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
export function leaveCompose(discard) {
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

export function focusComposer(f) {
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

export function sendComposer(done) {
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
    html: toHtml(body),
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
    html: toHtml(c.text),
    references: [c.references, c.inReplyTo].filter(Boolean).join(' '),
    attachments: (c.files || []).map((f) => ({ filename: f.name, size: f.size, type: f.type })),
  };
  S.composer = null;
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
export const scheduled = () => LS.get('scheduled', []);

export function sendLater(at) {
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
export const whenLabel = (t) =>
  new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

// Choices for the Remind me / Send later palette: what was typed (if it reads as a time), then presets.
export function whenOptions(q) {
  const now = new Date(),
    at = (text) => parseWhen(text, now).start;
  const presets = [
    ['tomorrow', at('tomorrow')],
    ['next week', at('next week')],
    ['this weekend', at('this weekend')],
    ['someday', now.getTime() + 90 * DAY],
  ];
  q = (q || '').trim().toLowerCase();
  const typed = q ? parseWhen(q, now) : null;
  const list = presets
    .filter(([l]) => !q || l.startsWith(q))
    .map(([l, t]) => [l, t, l === 'someday' ? '¯\\_(ツ)_/¯' : whenLabel(t)]);
  if (typed && !list.some(([l]) => l === q)) list.unshift([q, typed.start, whenLabel(typed.start)]);
  return list;
}

export function remind(until) {
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

export function openWhen(mode) {
  if (mode === 'remind' && !targets().length) return;
  S.overlay = { kind: 'cmd', mode, q: '', i: 0 };
  renderLayer(true);
}
