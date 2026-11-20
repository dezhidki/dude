// dude: keyboard-first mail. inbox, reading, replies, command palette, reminders, calendar.
// The app is the modules in this folder; ../main.js starts it. The screens are Solid components
// (render.jsx, week.jsx, settings.jsx) that read S, a Solid store; the rest changes S inside change().
// This one: state, settings storage, icons, helpers, attachments.

import { createSignal, createStore, flush, snapshot } from 'solid-js';
import { DemoBackend } from '../demo.js';
import { render, renderLayer } from './render.jsx';

// The mail engine: the desktop's (over IPC, which copies what it's given: snapshot() turns the store's
// objects back into plain ones) or the demo's. commands.js and events.js switch it.
const bridge = (m) =>
  Object.fromEntries(Object.entries(m).map(([k, f]) => [k, (...a) => f(...a.map((x) => snapshot(x)))]));
export let B = window.mail ? bridge(window.mail) : DemoBackend;
export const setBackend = (b) => {
  B = b === window.mail ? bridge(b) : b;
};

export const DESKTOP = !!window.mail;
export const root = document.getElementById('root');
export const layer = document.getElementById('layer');

export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// Settings are kept in localStorage: reading one subscribes to `stored`, writing one bumps it.
const [stored, setStored] = createSignal(0);

export const carbon = () => {
  stored(); // the theme is a class on <html>, saved with the settings
  return document.documentElement.classList.contains('carbon');
};

export const LS = {
  get: (k, d) => {
    stored();
    try {
      return JSON.parse(localStorage.getItem(`dude:${k}`)) ?? d;
    } catch {
      return d;
    }
  },
  set: (k, v) => {
    localStorage.setItem(`dude:${k}`, JSON.stringify(v));
    setStored((n) => n + 1);
  },
};

// Before the rename, settings were kept under "kestrel:": move them over (once).
try {
  for (const k of Object.keys(localStorage))
    if (k.startsWith('kestrel:')) {
      const to = `dude:${k.slice(8)}`;
      if (localStorage.getItem(to) === null) localStorage.setItem(to, localStorage.getItem(k));
      localStorage.removeItem(k);
    }
} catch {}

export const DAY = 864e5;

export const dayStart = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// What's on screen: a Solid store. Read it anywhere; change it only inside change() (outside, a write
// is ignored), and when change() returns the page shows it. Event handlers and timers wrap their
// work in change(); code after an await is outside, so it wraps its own.
const [store, setStore] = createStore({
  screen: 'signin',
  more: false,
  account: null,
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
  pane: LS.get('pane', 'contact'),
  calDay: dayStart(Date.now()),
  search: null,
  overlay: null,
  cal: { status: null, days: new Map(), loading: new Set(), error: null },
  replyDrafts: new Map(),
  menu: null,
  folders: null,
});
export const S = store;
let changing = 0;
export function change(fn) {
  let out;
  changing++;
  try {
    setStore(() => {
      setTicks((n) => n + 1);
      out = fn();
    });
  } finally {
    changing--;
  }
  if (!changing) flush(); // only the outermost: a flush inside a setter loses that change
  return out;
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
export const on = (fn) => (e) => change(() => fn(e));
// A store sees assignments, not changes inside a Set or Map: these give a changed copy to assign.
export const plus = (c, k, v) => (c instanceof Map ? new Map(c).set(k, v) : new Set(c).add(k));
export const minus = (c, k) => {
  const n = c instanceof Map ? new Map(c) : new Set(c);
  n.delete(k);
  return n;
};

// What the app remembers that isn't on screen: a plain object, changed anywhere.
export const M = {
  back: null, // where Esc goes from search / compose / settings
  calFrom: null, // where 1 goes back to from the week
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

// Open emails follow the theme: their pages (srcdoc in render.jsx) read carbon().
export function setTheme(dark) {
  document.documentElement.classList.toggle('carbon', dark);
  LS.set('theme', dark ? 'carbon' : 'light');
  if (S.screen !== 'signin') render();
}

export const VIEWS = {
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
export const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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

export function listDate(t) {
  if (t >= dayStart(now())) return fmtTime(t);
  const d = new Date(t);
  return (
    d.getDate() +
    ' ' +
    MONTHS[d.getMonth()].slice(0, 3) +
    (d.getFullYear() !== new Date(now()).getFullYear() ? ` ${d.getFullYear()}` : '')
  );
}

export function groupOf(t) {
  const today = dayStart(now()),
    days = Math.floor((today - dayStart(t)) / DAY);
  if (days <= 0) return '';
  if (days === 1) return 'Yesterday';
  const d = new Date(t);
  if (days === 2) return `${MONTHS[d.getMonth()]} ${ord(d.getDate())}`;
  if (days < 7) return 'Last 7 days';
  if (days < 30) return 'Last 30 days';
  return d.getFullYear() === new Date(now()).getFullYear() ? MONTHS[d.getMonth()] : String(d.getFullYear());
}

export const fullDate = (t) =>
  new Date(t).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export const nameOf = (p) => (p && (p.name || p.address)) || 'Unknown';

export const addrList = (a) =>
  (a || [])
    .map((p) =>
      p.name ? `${/[,;"<>]/.test(p.name) ? `"${p.name.replace(/"/g, '')}"` : p.name} <${p.address}>` : p.address,
    )
    .join(', ');

export const splitList = (s) =>
  (String(s || '').match(/(?:"[^"]*"|<[^>]*>|[^,;])+/g) || []).map((x) => x.trim()).filter(Boolean);

export const fold = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const firstOf = (p) => {
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

export const keyOf = (t) => t.key || t.id;

export const linkify = (s) =>
  esc(s).replace(/https?:\/\/[^\s<>"')\]]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);

export function needSignIn(info) {
  if (!S.account) return;
  change(() => {
    S.authNeeded = {
      email: info?.email || S.account.email,
      provider: info?.provider || S.account.provider,
    };
    if (S.screen !== 'signin') render();
  });
}

export const errText = (e) => String(e?.message || e).replace(/^Error invoking remote method 'mail': (Error: )?/, '');

// A message at the bottom for a while: text, or [text, key, more] to show a key in it.
const [toasts, setToasts] = createSignal([]);

export { toasts };
export function toast(msg, ms = 4000) {
  if (/SIGNIN_NEEDED/.test(String(msg))) {
    needSignIn();
    return;
  }
  const t = { msg };
  setToasts((l) => [...l, t]);
  setTimeout(() => setToasts((l) => l.filter((x) => x !== t)), ms);
}

// ---------- files ----------
export function fileBits(name, type) {
  name = String(name || 'file');
  type = String(type || '').toLowerCase();
  const dot = name.lastIndexOf('.'),
    ext = (dot > 0 ? name.slice(dot + 1) : type.split('/')[1] || 'file').toLowerCase().slice(0, 5);
  const base = dot > 0 ? name.slice(0, dot) : name;
  const kind =
    [
      ['pdf', /pdf/.test(ext + type)],
      ['doc', /^(docx?|odt|rtf|pages)$/.test(ext)],
      ['sheet', /^(xlsx?|csv|ods|numbers)$/.test(ext)],
      ['slide', /^(pptx?|odp|key)$/.test(ext)],
      ['img', /^image\//.test(type) || /^(png|jpe?g|gif|webp|heic|svg)$/.test(ext)],
      ['zip', /^(zip|rar|7z|gz|tgz|tar)$/.test(ext)],
      ['cal', /^(ics|vcs)$/.test(ext)],
    ].find(([, hit]) => hit)?.[0] || 'file';
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
    if (M.fileUrl) URL.revokeObjectURL(M.fileUrl);
    M.fileUrl = URL.createObjectURL(new Blob([bytes], { type }));
    change(() => {
      S.overlay = { kind: 'file', url: M.fileUrl, name: r.name, pdf: type === 'application/pdf', folder, uid, index };
      renderLayer();
    });
  } catch (e) {
    toast(`file no open: ${errText(e)}`);
  }
}

export async function openFile(folder, uid, name, index, mode) {
  if (!B.attachment || !folder || !uid) {
    toast('demo. no real file.');
    return;
  }
  if (mode === 'open' && B.attachmentData && previewable(name, '')) return viewFile(folder, uid, name, index);
  toast(mode === 'save' ? 'saving…' : 'opening…', 1500);
  try {
    const r = await B.attachment(folder, uid, name, index, mode);
    if (mode === 'save') toast(`saved: ${r.name}`);
  } catch (e) {
    toast(`file no open: ${errText(e)}`);
  }
}
