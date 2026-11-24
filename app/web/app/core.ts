// dude: keyboard-first mail. inbox, reading, replies, command palette, reminders, calendar.
// The app is the modules in this folder; ../main.ts starts it. The screens are Solid components
// (render.tsx, week.tsx, settings.tsx) that read S, a Solid store; the rest changes S inside change().
// This one: state, settings storage, icons, helpers, attachments.

import { createSignal, createStore, flush, snapshot } from 'solid-js';
import type {
  Account,
  Action,
  Backend,
  CalEvent,
  Folder,
  Guest,
  Mail,
  Msg,
  OutFile,
  OutMsg,
  Person,
  Provider,
  Thread,
} from '../api.ts';
import { DemoBackend } from '../demo.ts';
import type { Todo, TodoMail, TodoTask } from '../todos.ts';
import { render, renderLayer } from './render.tsx';

// ---------- the shapes of what's on screen ----------
/** a conversation as the screens keep it (the list's own, plus what they mark on it) */
export type Conv = Thread & {
  /** on its way out of the list (done, trash…) */
  _leaving?: boolean;
  /** a row of the Scheduled list: the mail waiting to be sent */
  sched?: Scheduled;
};

/** a mail to send later (kept in settings until it's due) */
export interface Scheduled {
  at: number;
  msg: OutMsg;
}

/** an inbox split: conversations matching a search */
export interface Split {
  id: string;
  name: string;
  q?: string;
}

/** an email as the screens keep it */
export type Mail1 = Msg & {
  /** being sent (you can still undo it) */
  pending?: boolean;
  /** the reply you're writing here, shown as a draft row */
  local?: Composer;
  /** older saved copies of this draft, to delete on the next save */
  others?: number[];
};

export interface Composer {
  mode: 'new' | 'reply' | 'replyall' | 'forward';
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
  messageId?: string;
  quoteOf?: Msg;
  /** the quoted mail is unfolded under the writing box */
  showQuote?: boolean;
  files?: OutFile[];
  showCc?: boolean;
  showBcc?: boolean;
  /** where the text cursor goes when the box is drawn */
  caret?: number;
  /** the saved copy in Drafts, and older copies to delete */
  draftUid?: number | null;
  extraDrafts?: number[];
  saving?: boolean;
  again?: boolean;
  sent?: boolean;
  discarded?: boolean;
}

/** an event in the week: the server's, or one kept here */
export type CalItem = CalEvent & {
  guests?: string[];
  /** column in the day when events overlap */
  _lane?: number;
  /** the invitation being read, shown in its day */
  invite?: boolean;
};

export interface EventForm {
  id?: string;
  server?: boolean;
  title: string;
  guests: string;
  when: string;
  where: string;
  notes: string;
  start?: number;
  end?: number;
  organizer?: string;
  response?: string;
  readOnly?: boolean;
  said?: string;
  /** just opened ('drawn' once drawn: the title gets focus once) */
  fresh?: boolean | 'drawn';
  dirty?: boolean;
  guestsTouched?: boolean;
  orgBox?: { name: string; email: string } | null;
  attendees?: Guest[];
}

/** a todo open in the right pane: what's typed, and the day it had (orig) when it was opened */
export interface TodoForm {
  id?: string;
  orig?: string | null;
  title: string;
  when: string;
  labels: string[];
  mails: TodoMail[];
  tasks: TodoTask[];
  notes: string;
  labelQ: string;
  taskQ: string;
  fromMail?: string;
  fresh?: boolean;
}

export type Overlay =
  | { kind: 'cmd'; mode: string; q: string; i: number; arg?: unknown }
  | { kind: 'file'; url: string; name: string; pdf: boolean; folder: string; uid: number; index: number }
  | { kind: 'keys' };

/** To/Cc suggestions under the field being typed in */
export interface Sugg {
  el: HTMLInputElement | HTMLTextAreaElement;
  start: number;
  end: number;
  items: Person[];
  i: number;
}

export interface CalState {
  status: { connected: boolean; canConnect: boolean } | null;
  /** a day (calKey) -> its events, and when they were read */
  days: Map<string, { at: number; list: CalItem[] }>;
  loading: Set<string>;
  error: string | null;
}

export interface State {
  screen: 'signin' | 'list' | 'thread' | 'compose' | 'search' | 'settings' | 'calendar' | 'board';
  lastScreen?: string;
  more: boolean;
  email?: string;
  account: Account | null;
  authNeeded?: { email: string; provider: Provider } | null;
  view: string;
  split: string;
  threads: Conv[];
  sel: number;
  picked: Set<string>;
  loading: boolean;
  loadError?: boolean;
  unreadOnly?: boolean;
  open: Conv | null;
  msgs: Mail1[];
  focus: number;
  expanded: Set<number>;
  quotes: Set<number>;
  newer?: { thread: Conv; msgs: Mail1[]; count: number } | null;
  composer: Composer | null;
  replyDrafts: Map<string, Composer>;
  pane: string;
  calDay: number;
  mmMonth?: number | null;
  cal: CalState;
  eventForm?: EventForm | null;
  drag?: { day: number; start: number; end: number } | null;
  /** the board's focused column (a day key, null for someday) and the todo picked in it */
  boardDay?: string | null;
  todoSel?: string | null;
  /** the label the board shows only (null: all) */
  boardFilter?: string | null;
  /** the board's quick add, open under a day (null: someday), and its text */
  boardAdd?: { day: string | null; text: string } | null;
  /** the todo that just arrived (drawn sliding in) */
  todoFresh?: string | null;
  todoForm?: TodoForm | null;
  search: { q: string } | null;
  overlay: Overlay | null;
  sugg?: Sugg | null;
  menu: { sel: number; fresh: boolean } | null;
  folders: Folder[] | null;
  pushLive?: boolean;
  enter?: string;
}

/** a step Z takes back: a triage action, a send still waiting, a reminder, or the todos before a change */
export type Undo =
  | { action: Action | undefined; threads: Conv[]; reload: boolean }
  | { send: ReturnType<typeof setTimeout>; draft: Composer; unshow: () => void }
  | { snooze: string[] }
  | { todos: Todo[] };

// The mail engine: the desktop's (over IPC, which copies what it's given: snapshot() turns the store's
// objects back into plain ones) or the demo's. commands.ts and events.ts switch it.
const bridge = (m: Mail): Backend =>
  Object.fromEntries(
    Object.entries(m).map(([k, f]: [string, (...a: unknown[]) => unknown]) => [
      k,
      (...a: unknown[]) => f(...a.map((x) => snapshot(x))),
    ]),
  ) as unknown as Backend;
export let B: Backend = window.mail ? bridge(window.mail) : DemoBackend;
export const setBackend = (b: Backend) => {
  B = b === window.mail ? bridge(window.mail) : b;
};

export const DESKTOP = !!window.mail;
export const root = document.getElementById('root') as HTMLElement;
export const layer = document.getElementById('layer') as HTMLElement;

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c] as string);

// Settings are kept in localStorage: reading one subscribes to `stored`, writing one bumps it.
const [stored, setStored] = createSignal(0);

export const carbon = () => {
  stored(); // the theme is a class on <html>, saved with the settings
  return document.documentElement.classList.contains('carbon');
};

export const LS = {
  get: <T>(k: string, d: T): T => {
    stored();
    try {
      return JSON.parse(localStorage.getItem(`dude:${k}`) as string) ?? d;
    } catch {
      return d;
    }
  },
  set: (k: string, v: unknown) => {
    localStorage.setItem(`dude:${k}`, JSON.stringify(v));
    setStored((n) => n + 1);
  },
};

// Before the rename, settings were kept under "kestrel:": move them over (once).
try {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('kestrel:')) {
      const to = `dude:${k.slice(8)}`;
      if (localStorage.getItem(to) === null) {
        localStorage.setItem(to, localStorage.getItem(k) as string);
      }
      localStorage.removeItem(k);
    }
  }
} catch {}

export const DAY = 864e5;

export const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// What's on screen: a Solid store. Read it anywhere; change it only inside change() (outside, a write
// is ignored), and when change() returns the page shows it. Event handlers and timers wrap their
// work in change(); code after an await is outside, so it wraps its own.
const [store, setStore] = createStore<State>({
  screen: 'signin',
  more: false,
  account: null,
  view: 'inbox',
  split: 'important',
  threads: [],
  sel: 0,
  picked: new Set<string>(),
  loading: false,
  open: null,
  msgs: [],
  focus: 0,
  quotes: new Set<number>(),
  expanded: new Set<number>(),
  composer: null,
  pane: LS.get('pane', 'contact'),
  calDay: dayStart(Date.now()),
  search: null,
  overlay: null,
  cal: {
    status: null,
    days: new Map<string, { at: number; list: CalItem[] }>(),
    loading: new Set<string>(),
    error: null,
  },
  replyDrafts: new Map<string, Composer>(),
  menu: null,
  folders: null,
});
export const S = store;
let changing = 0;
export function change<T>(fn: () => T): T {
  let out: T | undefined;
  changing++;
  try {
    setStore(() => {
      setTicks((n) => n + 1);
      out = fn();
    });
  } finally {
    changing--;
  }
  if (!changing) {
    flush(); // only the outermost: a flush inside a setter loses that change
  }
  return out as T;
}
// What isn't in the store but is shown (the clock; invitations read from the calendar) is looked
// at again after every change, as when every change redrew the screen: it reads ticks().
const [ticks, setTicks] = createSignal(0);

export { ticks };
export const now = () => {
  ticks();
  return Date.now();
};
// An event handler: its work is one change (onClick={on(() => …)}).
export const on =
  <E>(fn: (e: E) => unknown) =>
  (e: E) =>
    change(() => fn(e));
// A store sees assignments, not changes inside a Set or Map: these give a changed copy to assign.
export function plus<K, V>(c: Map<K, V>, k: K, v: V): Map<K, V>;
export function plus<K>(c: Set<K>, k: K): Set<K>;
export function plus<K, V>(c: Map<K, V> | Set<K>, k: K, v?: V) {
  return c instanceof Map ? new Map(c).set(k, v as V) : new Set(c).add(k);
}
export function minus<K, V>(c: Map<K, V>, k: K): Map<K, V>;
export function minus<K>(c: Set<K>, k: K): Set<K>;
export function minus<K, V>(c: Map<K, V> | Set<K>, k: K) {
  const n = c instanceof Map ? new Map(c) : new Set(c);
  n.delete(k);
  return n;
}

// What the app remembers that isn't on screen: a plain object, changed anywhere.
export interface Mem {
  back: { screen: State['screen']; open?: Conv | null; view?: string; msgs?: Mail1[]; sel?: number } | null;
  calFrom: { screen: State['screen']; open?: Conv | null; msgs?: Mail1[] } | null;
  threadFrom: { form: TodoForm | null } | null;
  draft: Composer | null;
  paneBefore: string | null;
  fileUrl: string | null;
  checking: boolean;
  invFor: string | null;
  g: boolean;
  calScroll: number | undefined;
  undo: Undo[];
  cache: Record<string, Conv[]>;
  tcache: Map<string, Mail1[]>;
  sentIn: Record<string, Mail1[]>;
}
export const M: Mem = {
  back: null, // where Esc goes from search / compose / settings
  calFrom: null, // where 1 goes back to from the week
  threadFrom: null, // the mail open was opened from the board (the todo open there put away): Esc goes back
  draft: null, // a new mail left behind (C brings it back)
  paneBefore: null,
  fileUrl: null,
  checking: false,
  invFor: null,
  g: false, // G pressed: the next key picks a folder
  calScroll: undefined, // the calendar's scroll, kept across redraws
  undo: [],
  cache: {}, // folder lists
  tcache: new Map(), // conversations read ahead
  sentIn: {}, // your replies, until the server has them
};

document.documentElement.classList.toggle('carbon', LS.get('theme', 'carbon') === 'carbon');

// Open emails follow the theme: their pages (srcdoc in render.tsx) read carbon().
export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle('carbon', dark);
  LS.set('theme', dark ? 'carbon' : 'light');
  if (S.screen !== 'signin') {
    render();
  }
}

export const VIEWS: Record<string, string> = {
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

// ---------- helpers ----------
export const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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

const ord = (n: number) =>
  n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

export function listDate(t: number) {
  if (t >= dayStart(now())) {
    return fmtTime(t);
  }
  const d = new Date(t);
  return (
    d.getDate() +
    ' ' +
    MONTHS[d.getMonth()].slice(0, 3) +
    (d.getFullYear() !== new Date(now()).getFullYear() ? ` ${d.getFullYear()}` : '')
  );
}

export function groupOf(t: number) {
  const today = dayStart(now()),
    days = Math.floor((today - dayStart(t)) / DAY);
  if (days <= 0) {
    return '';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  const d = new Date(t);
  if (days === 2) {
    return `${MONTHS[d.getMonth()]} ${ord(d.getDate())}`;
  }
  if (days < 7) {
    return 'Last 7 days';
  }
  if (days < 30) {
    return 'Last 30 days';
  }
  return d.getFullYear() === new Date(now()).getFullYear() ? MONTHS[d.getMonth()] : String(d.getFullYear());
}

export const fullDate = (t: number) =>
  new Date(t).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export const nameOf = (p: Person | null | undefined) => (p && (p.name || p.address)) || 'Unknown';

export const addrList = (a: Person[] | null | undefined) =>
  (a || [])
    .map((p) =>
      p.name ? `${/[,;"<>]/.test(p.name) ? `"${p.name.replace(/"/g, '')}"` : p.name} <${p.address}>` : p.address,
    )
    .join(', ');

export const splitList = (s: unknown) =>
  (String(s || '').match(/(?:"[^"]*"|<[^>]*>|[^,;])+/g) || []).map((x) => x.trim()).filter(Boolean);

export const fold = (s: unknown) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const firstOf = (p: Person | null | undefined) => {
  const n = String(p?.name || '')
    .replace(/"/g, '')
    .trim();
  const m = /^([^,]+),\s*(\S+)/.exec(n);
  if (m) {
    return m[2];
  }
  if (n) {
    return n.split(/\s+/)[0];
  }
  const a = String(p?.address || '')
    .split('@')[0]
    .split(/[._-]/)[0];
  return a ? a[0].toUpperCase() + a.slice(1) : '';
};

export const keyOf = (t: Thread) => t.key || t.id;

export const linkify = (s: unknown) =>
  esc(s).replace(/https?:\/\/[^\s<>"')\]]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);

export function needSignIn(info?: { email?: string; provider?: Provider }) {
  if (!S.account) {
    return;
  }
  change(() => {
    S.authNeeded = {
      email: info?.email || (S.account as Account).email,
      provider: info?.provider || (S.account as Account).provider,
    };
    if (S.screen !== 'signin') {
      render();
    }
  });
}

export const errText = (e: unknown) =>
  String((e as Error)?.message || e).replace(/^Error invoking remote method 'mail': (Error: )?/, '');

// A message at the bottom for a while: text, or [text, key, more] to show a key in it.
/** a toast's text, or [text, key, more] to show a key in it */
export type ToastMsg = string | [string, string, string?];
const [toasts, setToasts] = createSignal<{ msg: ToastMsg }[]>([]);

export { toasts };
export function toast(msg: ToastMsg, ms = 4000) {
  if (/SIGNIN_NEEDED/.test(String(msg))) {
    needSignIn();
    return;
  }
  const t = { msg };
  setToasts((l) => [...l, t]);
  setTimeout(() => setToasts((l) => l.filter((x) => x !== t)), ms);
}

// ---------- files ----------
export function fileBits(name0: unknown, type0: unknown) {
  const name = String(name0 || 'file');
  const type = String(type0 || '').toLowerCase();
  const dot = name.lastIndexOf('.'),
    ext = (dot > 0 ? name.slice(dot + 1) : type.split('/')[1] || 'file').toLowerCase().slice(0, 5);
  const base = dot > 0 ? name.slice(0, dot) : name;
  const kind =
    (
      [
        ['pdf', /pdf/.test(ext + type)],
        ['doc', /^(docx?|odt|rtf|pages)$/.test(ext)],
        ['sheet', /^(xlsx?|csv|ods|numbers)$/.test(ext)],
        ['slide', /^(pptx?|odp|key)$/.test(ext)],
        ['img', /^image\//.test(type) || /^(png|jpe?g|gif|webp|heic|svg)$/.test(ext)],
        ['zip', /^(zip|rar|7z|gz|tgz|tar)$/.test(ext)],
        ['cal', /^(ics|vcs)$/.test(ext)],
      ] as const
    ).find(([, hit]) => hit)?.[0] || 'file';
  const size = (b?: number) =>
    !b ? '' : b < 1024 ? `${b} b` : b < 1048576 ? `${Math.round(b / 1024)} kb` : `${(b / 1048576).toFixed(1)} mb`;
  return { base, ext, kind, size };
}

const previewable = (name: string, type: string) =>
  /pdf/i.test(type || '') ||
  /\.pdf$/i.test(name || '') ||
  /^image\/(png|jpe?g|gif|webp|bmp|svg\+xml)$/i.test(type || '') ||
  /\.(png|jpe?g|gif|webp|bmp)$/i.test(name || '');

async function viewFile(folder: string, uid: number, name: string, index: number) {
  toast('opening…', 1200);
  try {
    const r = await (B.attachmentData as NonNullable<Backend['attachmentData']>)(folder, uid, name, index);
    const bytes = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
    const type = /\.pdf$/i.test(r.name) ? 'application/pdf' : r.type || 'application/octet-stream';
    if (M.fileUrl) {
      URL.revokeObjectURL(M.fileUrl);
    }
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    M.fileUrl = url;
    change(() => {
      S.overlay = { kind: 'file', url, name: r.name, pdf: type === 'application/pdf', folder, uid, index };
      renderLayer();
    });
  } catch (e) {
    toast(`file no open: ${errText(e)}`);
  }
}

export async function openFile(
  folder: string | undefined,
  uid: number | undefined,
  name: string,
  index: number,
  mode: 'open' | 'save',
) {
  if (!B.attachment || !folder || !uid) {
    toast('demo. no real file.');
    return;
  }
  if (mode === 'open' && B.attachmentData && previewable(name, '')) {
    return viewFile(folder, uid, name, index);
  }
  toast(mode === 'save' ? 'saving…' : 'opening…', 1500);
  try {
    const r = await B.attachment(folder, uid, name, index, mode);
    if (mode === 'save') {
      toast(`saved: ${r.name}`);
    }
  } catch (e) {
    toast(`file no open: ${errText(e)}`);
  }
}
