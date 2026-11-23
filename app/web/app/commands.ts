// ---------- commands ----------

import { onSettled } from 'solid-js';
import type { Action, Answer, Folder, Thread } from '../api.ts';
import { parseWhen } from '../when.ts';
import { act, openSearch, pick, switchSplit, targets, toggle, undo } from './actions.ts';
import {
  answerInvite,
  calToday,
  connectCalendar,
  deleteEvent,
  ensureCalDay,
  eventDialog,
  goCal,
  goMail,
  invIdx,
  setCalOpt,
  weekMove,
} from './calendar.ts';
import {
  focusComposer,
  meAddr,
  openWhen,
  remind,
  scheduleDraftSave,
  sendComposer,
  sendLater,
  startCompose,
  whenOptions,
} from './compose.ts';
import {
  addrList,
  B,
  type Composer,
  type Conv,
  change,
  DAY,
  dayStart,
  firstOf,
  fold,
  fullDate,
  keyOf,
  LS,
  layer,
  M,
  type Mail1,
  now,
  openFile,
  plus,
  root,
  S,
  setBackend,
  setTheme,
  splitList,
  toast,
} from './core.ts';
import { addSplit, current, customSplits, load, removeSplit, snoozes, visible } from './data.ts';
import { ACTIONS } from './events.ts';
import { openCmd, openMenu, render, renderLayer } from './render.tsx';
import { openSettings, SET, setSetting, sigBlock } from './settings.tsx';
import { closeThread, lastRealIndex, toggleMsg } from './thread.ts';
import { goBoard } from './todo.ts';

export const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
const inList = () => S.screen === 'list' && !!current();
const anyThread = () => (S.screen === 'thread' && !!S.open) || inList();

export const goto = (view: string, split?: string) => () => {
  if (S.screen === 'calendar' || S.screen === 'board') {
    S.screen = 'list';
    S.eventForm = null;
  }
  if (S.screen === 'thread') {
    closeThread();
  }
  if (split) {
    S.split = split;
  }
  if (view !== S.view || split === undefined) {
    void load(view);
  } else {
    S.sel = 0;
    render();
  }
};

/** a line in the palette: its name, keys, other words it's found by, when it shows, what it does */
export interface Command {
  t: string;
  k?: string[];
  a?: (string | undefined)[];
  lbl?: string;
  when?: () => boolean;
  run: () => unknown;
}

export const COMMANDS: Command[] = [
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
    when: () => S.screen === 'calendar' || S.screen === 'board',
    run: () => goMail(),
  },
  { t: 'Open Board', k: ['3'], a: ['todo', 'tasks', 'kanban'], when: () => S.screen !== 'board', run: goBoard },
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
      openCmd('split');
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
  ...(
    [
      ['yes', 'Yes', ['accept', 'going']],
      ['maybe', 'Maybe', ['tentative']],
      ['no', 'No', ['decline', 'not going']],
    ] as [Answer, string, string[]][]
  ).map(([x, w, al]) => ({
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
    when: () => anyThread() && targets().some((t) => snoozes()[keyOf(t)] > now()),
    run: () => {
      const sn = snoozes();
      targets().forEach((t) => {
        delete sn[keyOf(t)];
      });
      LS.set('snooze', sn);
      toast('remind gone.');
      void load(S.view, true);
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
      openCmd('zero');
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
      if (!m) {
        return;
      }
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
    run: () => copy(focusedMsg()?.text || '', 'message'),
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
      if (!m) {
        return;
      }
      composeNew({
        to: addrList(m.to),
        cc: addrList(m.cc),
        subject: m.subject || S.open?.subject || '',
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
      const a = m?.attachments[0];
      if (m && a) {
        void openFile(m.folder, m.uid, a.filename, 0, 'open');
      }
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
    run: () => composeNew({ to: addrList([(targets()[0] as Conv).from]) }), // shown only with a conversation
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
      openCmd('snipname');
    },
  },
  {
    t: 'Jump to Date',
    k: [],
    a: ['go to date', 'calendar day', 'open day'],
    run: () => {
      openCmd('date');
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
  ...(
    [
      ['important', 'Important Only'],
      ['all', 'All Mail'],
      ['off', 'Off'],
    ] as const
  ).map(([v, l]) => ({
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
      S.cal.days = new Map();
      void ensureCalDay(true);
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
      await B.signOut(S.account?.email ?? '');
      change(() => {
        S.account = null;
        S.screen = 'signin';
        S.more = false;
        render();
      });
    },
  },
  {
    t: 'Leave Demo',
    k: [],
    when: () => !!B.demo,
    run: () => {
      if (window.mail) {
        setBackend(window.mail);
      }
      S.account = null;
      S.screen = 'signin';
      S.more = false;
      render();
    },
  },
];

export function paletteItems(q0: string | undefined): Command[] {
  const ov = S.overlay;
  const o = ov?.kind === 'cmd' ? ov : { mode: undefined };
  let q = (q0 || '').trim();
  if (o.mode === 'split') {
    const t = current() || S.open,
      out: Command[] = [];
    if (q) {
      out.push({ t: `New Split Inbox with: ${q}`, k: [], run: () => addSplit(q, q) });
    }
    if (t) {
      const a = (t.from.address || '').toLowerCase(),
        dom = a.split('@')[1];
      out.push({ t: `New Split Inbox with sender: ${a}`, k: [], run: () => addSplit(t.from.name || a, `from:${a}`) });
      if (dom) {
        out.push({ t: `New Split Inbox with domain: ${dom}`, k: [], run: () => addSplit(dom, `domain:${dom}`) });
      }
      (t.to || []).slice(0, 1).forEach((p) => {
        out.push({
          t: `New Split Inbox with recipient: ${p.address}`,
          k: [],
          run: () => addSplit(p.address, `to:${p.address}`),
        });
      });
      if (t.subject) {
        out.push({
          t: `New Split Inbox with subject: ${t.subject}`,
          k: [],
          run: () => addSplit(t.subject.slice(0, 30), `subject:"${t.subject.replace(/"/g, '')}"`),
        });
      }
    }
    return out;
  }
  if (o.mode === 'move' || o.mode === 'copy') {
    const mode = o.mode;
    const base: Command[] =
      mode === 'copy'
        ? []
        : (
            [
              ['Inbox', 'undone'],
              ['Done', 'done'],
              ['Spam', 'spam'],
              ['Trash', 'trash'],
            ] as [string, Action][]
          ).map(([l, a]) => ({ t: l, k: [], run: () => act(a) }));
    const own = (S.folders || []).map((f) => ({
      t: f.name,
      lbl: f.path !== f.name ? f.path : '',
      k: [],
      run: () => moveTo(f, mode),
    }));
    const all = [...base, ...own],
      ql = fold(q);
    if (!S.folders) {
      all.push({ t: 'folders loading…', k: [], run: () => {} });
    }
    return ql ? all.filter((x) => fold(`${x.t} ${x.lbl || ''}`).includes(ql)) : all;
  }
  if (o.mode === 'zero') {
    return (
      [
        ['older than 1 day', 1],
        ['older than 1 week', 7],
        ['older than 2 weeks', 14],
        ['older than 1 month', 30],
        ['all of this split', 0],
      ] as [string, number][]
    )
      .map(([l, d]) => {
        const list = visible().filter((t) => !d || t.date < Date.now() - d * DAY);
        return {
          t: `Mark Done: ${l}`,
          lbl: `${list.length} conversation${list.length === 1 ? '' : 's'}`,
          run: () => {
            if (list.length) {
              void act('done', list);
            }
          },
        };
      })
      .filter((x) => !q || x.t.toLowerCase().includes(q.toLowerCase()));
  }
  if (o.mode === 'date') {
    const today = new Date(now()),
      opts: [string, number][] = [
        ['today', today.getTime()],
        ['tomorrow', today.getTime() + DAY],
        ['next week', (parseWhen('next week', today) as { start: number }).start],
      ];
    const typed = q ? parseWhen(q, today, 9) : null;
    if (typed) {
      opts.unshift([q, typed.start]);
    }
    return opts
      .filter(([l], i) => !q || (typed && i === 0) || l.startsWith(q.toLowerCase()))
      .map(([l, at]) => ({
        t: l,
        lbl: new Date(at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }),
        run: () => {
          S.calDay = dayStart(at);
          M.calScroll = undefined;
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
  if (o.mode === 'snipname') {
    return [
      {
        t: q ? `Save snippet: ${q}` : 'type a name, then Enter',
        k: [],
        run: () => {
          if (q) {
            saveSnippet(q);
          }
        },
      },
    ];
  }
  if (o.mode === 'remind' || o.mode === 'later') {
    return whenOptions(q).map(([l, at, label]) => ({
      t: l,
      lbl: label,
      run: () => (o.mode === 'remind' ? remind(at) : sendLater(at)),
    }));
  }
  q = q.toLowerCase();
  const dyn: Command[] = [
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
  if (!q) {
    return ok;
  }
  return ok.filter((c) => `${c.t} ${(c.a || []).join(' ')}`.toLowerCase().includes(q));
}

export function openPalette() {
  rememberCaret();
  openCmd();
}

// ---------- more commands ----------
export const isGmail = () => !!(S.account && S.account.provider === 'google');

const focusedMsg = (): Mail1 | null | undefined =>
  S.screen === 'thread'
    ? S.msgs[S.focus] && !S.msgs[S.focus]?.draft
      ? S.msgs[S.focus]
      : S.msgs[lastRealIndex(S.msgs)]
    : null;

function copy(text: string, what: string) {
  navigator.clipboard.writeText(text).then(
    () => toast(`${what} copied.`),
    () => toast('copy no work.'),
  );
}

export function expandAll() {
  const all = S.msgs.every((_, i) => S.expanded.has(i));
  S.expanded = all ? new Set([S.focus]) : new Set(S.msgs.map((_, i) => i));
  render();
}

export function selectAll(fromHere: boolean) {
  const v = visible();
  (fromHere ? v.slice(S.sel) : v).forEach((t) => {
    S.picked = plus(S.picked, t.id);
  });
  render();
  toast(`${S.picked.size} picked.`);
}

export async function openFolderPick(mode: 'move' | 'copy') {
  if (!targets().length) {
    return;
  }
  openCmd(mode);
  if (!S.folders) {
    let f: Folder[];
    try {
      f = B.folders ? await B.folders() : [];
    } catch {
      f = [];
    }
    change(() => {
      S.folders = f;
      if (S.overlay?.kind === 'cmd' && S.overlay.mode === mode) {
        renderLayer();
      }
    });
  }
}

async function moveTo(f: Folder, mode: string | undefined) {
  const list = targets();
  if (!list.length) {
    return;
  }
  if (mode === 'copy') {
    try {
      await Promise.all(list.map((t) => B.act(t, 'copy', f.path)));
      toast(`label ${f.name}.`);
    } catch (e) {
      toast(`no work: ${(e as Error).message || e}`);
    }
    return;
  }
  if (list.every((t) => t.folder === f.path)) {
    return toast('already there.');
  }
  void act('move', list, true, f.path);
  toast([`moved to ${f.name}. `, 'Z', ' undo']);
}

// Muted conversations and blocked senders are cleared out of the inbox whenever it loads.
const isMuted = () => {
  const t = targets()[0];
  return !!t && LS.get<string[]>('muted', []).includes(keyOf(t));
};

const isBlocked = () => {
  const t = targets()[0];
  return !!t && LS.get<string[]>('blocked', []).includes((t.from.address || '').toLowerCase());
};

function mute(on: boolean) {
  const keys = targets().map(keyOf),
    m = LS.get<string[]>('muted', []).filter((k) => !keys.includes(k));
  LS.set('muted', on ? [...m, ...keys].slice(-500) : m);
  if (on) {
    void act('done', targets(), true);
    toast('muted. new replies skip inbox.');
  } else {
    toast('unmuted.');
  }
}

function block(on: boolean) {
  const t = targets()[0];
  if (!t) {
    return;
  }
  const a = (t.from.address || '').toLowerCase(),
    b = LS.get<string[]>('blocked', []).filter((x) => x !== a);
  LS.set('blocked', on ? [...b, a] : b);
  if (on) {
    void act('trash', targets(), true);
    toast(`${a} blocked. mail go trash.`);
  } else {
    toast(`${a} unblocked.`);
  }
}

export function autoClear<T extends Thread>(list: T[]): T[] {
  const bl = new Set(LS.get<string[]>('blocked', [])),
    mu = new Set(LS.get<string[]>('muted', []));
  if (!bl.size && !mu.size) {
    return list;
  }
  return list.filter((t) => {
    const b = bl.has((t.from.address || '').toLowerCase()),
      m = mu.has(keyOf(t));
    if (b || m) {
      B.act(t, b ? 'trash' : 'done').catch(() => {});
    }
    return !b && !m;
  });
}

function composeNew(p: Partial<Pick<Composer, 'to' | 'cc' | 'subject' | 'text'>>) {
  M.draft = {
    mode: 'new',
    to: p.to || '',
    cc: p.cc || '',
    subject: p.subject || '',
    text: (p.text || '') + sigBlock(),
  };
  startCompose('new');
}

function unsubscribe(andDone: boolean) {
  const m = [...S.msgs].reverse().find((x) => x.unsub),
    t = S.open;
  if (!m) {
    return;
  }
  const u = m.unsub as NonNullable<Mail1['unsub']>;
  if (andDone && t) {
    void act('done', [t], true);
  }
  if (u.url) {
    window.open(u.url);
    toast('unsubscribe page open in browser.');
    return;
  }
  const mm = /^(?:mailto:)?([^?]+)(?:\?(.*))?$/i.exec(u.mail || '');
  if (!mm) {
    return;
  }
  const qs = new URLSearchParams(mm[2] || '');
  composeNew({
    to: decodeURIComponent(mm[1] as string),
    subject: qs.get('subject') || 'unsubscribe',
    text: qs.get('body') || 'unsubscribe',
  });
  toast('unsubscribe mail ready. send it.');
}

function instantIntro() {
  const m = S.msgs[lastRealIndex(S.msgs)];
  if (!m) {
    return;
  }
  S.focus = lastRealIndex(S.msgs);
  startCompose('replyall');
  const c = S.composer;
  if (c?.mode !== 'replyall') {
    return;
  }
  const k = (m.from.address || '').toLowerCase(),
    drop = (s: unknown) =>
      splitList(s)
        .filter((x) => !x.toLowerCase().includes(k))
        .join(', ');
  c.to = drop(c.to);
  c.cc = drop(c.cc);
  if (!c.to && c.cc) {
    const [first, ...rest] = splitList(c.cc);
    c.to = first as string;
    c.cc = rest.join(', ');
  }
  c.bcc = addrList([m.from]);
  c.showBcc = true;
  c.text = `Thanks ${firstOf(m.from)} (to bcc)!\n\n${c.text}`;
  render();
  focusComposer(c.to ? 'text' : 'to');
}

// Files: picked with the system file picker, sent along as attachments (25 MB each at most).
export function attachFiles() {
  const c = S.composer;
  if (!c) {
    return;
  }
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.multiple = true;
  inp.onchange = async () => {
    for (const f of inp.files ?? []) {
      if (f.size > 25 * 1048576) {
        toast(`${f.name} too big. 25 mb max.`);
        continue;
      }
      const data = await new Promise<string>((r) => {
        const fr = new FileReader();
        fr.onload = () => r(String(fr.result).split(',')[1] || '');
        fr.onerror = () => r('');
        fr.readAsDataURL(f);
      });
      change(() => {
        c.files = [
          ...(c.files || []),
          { name: f.name, type: f.type || 'application/octet-stream', size: f.size, data },
        ];
      });
    }
    if (S.composer === c) {
      render();
      scheduleDraftSave();
    }
  };
  inp.click();
}

// Snippets: saved bits of text; {first_name} becomes the first person's first name.
/** a saved bit of text */
interface Snippet {
  id: string;
  name: string;
  text: string;
  subject?: string;
}

const snippets = () => LS.get<Snippet[]>('snippets', []);

function rememberCaret() {
  const ta =
    root.querySelector<HTMLTextAreaElement>('[data-c="text"]') ||
    layer.querySelector<HTMLTextAreaElement>('[data-c="text"]');
  if (S.composer && ta) {
    S.composer.caret = ta.selectionStart;
  }
}

export function snippetPick() {
  rememberCaret();
  openCmd('snippet');
}

function saveSnippet(name: string) {
  const c = S.composer;
  if (!c) {
    return;
  }
  const sig = sigBlock().trim();
  let text = c.text;
  if (sig && text.includes(sig)) {
    text = text.slice(0, text.lastIndexOf(sig));
  }
  LS.set('snippets', [
    ...snippets().filter((x) => x.name !== name),
    { id: `sn${Date.now()}`, name, text: text.trim(), subject: c.mode === 'new' ? c.subject : '' },
  ]);
  toast([`snippet “${name}” saved. `, ';', ' use.']);
}

function useSnippet(sn: Snippet) {
  if (!S.composer) {
    if (S.screen === 'thread' && S.msgs.length) {
      startCompose('reply');
    } else {
      startCompose('new');
    }
  }
  const c = S.composer;
  if (!c) {
    return;
  }
  const who = splitList(c.to)[0] || '',
    m = /^(.*?)\s*<([^>]+)>$/.exec(who);
  const body = sn.text.replace(
    /\{first_?name\}/gi,
    firstOf(m ? { name: m[1] as string, address: m[2] as string } : { name: '', address: who }),
  );
  const at = Math.min(c.caret ?? 0, c.text.length);
  c.text = c.text.slice(0, at) + body + c.text.slice(at);
  if (!c.subject && sn.subject) {
    c.subject = sn.subject;
  }
  render();
  scheduleDraftSave();
  onSettled(() => {
    const ta =
      root.querySelector<HTMLTextAreaElement>('[data-c="text"]') ||
      layer.querySelector<HTMLTextAreaElement>('[data-c="text"]');
    if (ta) {
      ta.focus();
      ta.setSelectionRange(at + body.length, at + body.length);
      change(() => {
        c.caret = at + body.length;
      });
    }
  });
}
