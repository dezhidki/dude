// dude: keyboard-first mail. inbox, reading, replies, command palette, reminders, calendar.
// The app is the modules in this folder; ../main.js starts it. The screens are Solid components
// (render.jsx, week.jsx, settings.jsx) that read S; the rest changes S and calls render() or show().
// This one: state, settings storage, icons, helpers, attachments.

import { createSignal, flush } from 'solid-js';
import { DemoBackend } from '../demo.js';
import { render, renderLayer } from './render.jsx';

export let B = window.mail || DemoBackend;

// the demo, or the desktop's mail engine (commands.js and events.js switch it)
export const setBackend = (b) => {
  B = b;
};

export const DESKTOP = !!window.mail;
export const root = document.getElementById('root');
export const layer = document.getElementById('layer');
const toastBox = document.getElementById('toast');

export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// The screens are Solid components that read S (and settings): reading subscribes them to `drawn`,
// and show() redraws whatever reads what changed since. render() in render.jsx calls it.
const [drawn, setDrawn] = createSignal(0);

export function show() {
  setDrawn((n) => n + 1);
  flush();
}

// HTML made here (icons, emails): as elements, to put in a component
const nodes = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html;
  return [...t.content.childNodes];
};

export const svg = (html) => nodes(html)[0];

export const carbon = () => {
  drawn(); // the theme is a class on <html>: read like S, so what shows it redraws
  return document.documentElement.classList.contains('carbon');
};

const track = (state) =>
  new Proxy(state, {
    get: (t, k) => {
      drawn();
      return t[k];
    },
  });

export const LS = {
  get: (k, d) => {
    drawn();
    try {
      return JSON.parse(localStorage.getItem(`dude:${k}`)) ?? d;
    } catch {
      return d;
    }
  },
  set: (k, v) => localStorage.setItem(`dude:${k}`, JSON.stringify(v)),
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

export const S = track({
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
});

document.documentElement.classList.toggle('carbon', LS.get('theme', 'carbon') === 'carbon');

// Switching theme redraws the screen, so open emails are coloured again for the new theme.
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

// ---------- icons (simple strokes) ----------
export const ic = {
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
  if (t >= dayStart(Date.now())) return fmtTime(t);
  const d = new Date(t);
  return (
    d.getDate() +
    ' ' +
    MONTHS[d.getMonth()].slice(0, 3) +
    (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '')
  );
}

export function groupOf(t) {
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
  S.authNeeded = {
    email: info?.email || S.account.email,
    provider: info?.provider || S.account.provider,
  };
  if (S.screen !== 'signin') render();
}

export const errText = (e) => String(e?.message || e).replace(/^Error invoking remote method 'mail': (Error: )?/, '');

export function toast(html, ms = 4000) {
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
export function fileBits(name, type) {
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

export async function openFile(folder, uid, name, index, mode) {
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
