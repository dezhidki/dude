// IMAP/SMTP engine over XOAUTH2: list conversations, open them, triage, send, invite.
import fs from 'node:fs';
import path from 'node:path';
import {
  type AppendResponseObject,
  type CopyResponseObject,
  type FetchMessageObject,
  type FetchQueryObject,
  ImapFlow,
  type ImapFlowOptions,
  type MailboxObject,
  type MessageAddressObject,
  type MessageEnvelopeObject,
  type SearchObject,
} from 'imapflow';
import { type AddressObject, simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import type { Action, Answer, Contact, EventInput, Folder, Invite, Msg, OutMsg, Thread } from '../web/api.ts';
import { filesIn } from './files.ts';
import { buildInvite } from './ics.ts';
import { buildReply, parseInvite } from './invite.ts';
import { type Acct, freshToken, PROVIDERS } from './oauth.ts';
import { chainIds, group, type Item } from './threads.ts';

/** the account's special folders by role (inbox, done, sent, drafts, trash, spam, all, starred) */
type Folders = Record<string, string | undefined>;

interface Conn {
  client: ImapFlow;
  folders: Folders;
  gmail: boolean;
}

/** a folder's list as remembered: its UIDVALIDITY, newest listing, and what each message looked like */
interface MetaList {
  validity: string;
  order?: number[];
  byUid: Map<number, Item>;
  savedAt?: number;
}

/** what's kept on disk per account (one file) */
interface Saved {
  v: number;
  folders: Folders | null;
  lists?: Record<string, { validity: string; order: number[]; items: Item[] }>;
}

/** the message parts a reply needs to find its conversation */
type ChainOf = Pick<Msg, 'messageId' | 'inReplyTo' | 'references'>;

/** a search's uids; imapflow answers false when the search failed, which reads as nothing found here */
type Found = number[] | undefined;

/** mailparser also reads the List-* headers (not in its types) */
type Unsub = { url?: string | string[]; mail?: string | string[] };

const clients = new Map<string, Conn>(); // email -> { client, folders }

const imapClient = async (acct: Acct, extra?: Partial<ImapFlowOptions>) =>
  new ImapFlow({
    ...PROVIDERS[acct.provider].imap,
    auth: { user: acct.email, accessToken: await freshToken(acct) },
    logger: false,
    ...extra,
  });

async function connect(acct: Acct): Promise<Conn> {
  const c = clients.get(acct.email);
  if (c?.client.usable) {
    return c;
  }
  const client = await imapClient(acct);
  client.on('error', () => clients.delete(acct.email));
  client.on('close', () => clients.delete(acct.email));
  await client.connect();
  const list = await client.list();
  const use = (u: string) => list.find((f) => f.specialUse === u)?.path;
  const byName = (re: RegExp) => list.find((f) => re.test(f.path))?.path;
  const gmail = acct.provider === 'google';
  const paths = {
    inbox: 'INBOX',
    done: use('\\Archive') || (gmail ? use('\\All') : null) || byName(/^archive$/i) || 'Archive',
    sent: use('\\Sent') || byName(/sent/i),
    drafts: use('\\Drafts') || byName(/drafts/i),
    trash: use('\\Trash') || byName(/trash|deleted/i),
    spam: use('\\Junk') || byName(/junk|spam/i),
    all: use('\\All') || 'INBOX',
    starred: use('\\Flagged') || 'INBOX',
  };
  if (!list.some((f) => f.path === paths.done)) {
    await client.mailboxCreate(paths.done).catch(() => {});
  }
  const entry = { client, folders: paths, gmail };
  clients.set(acct.email, entry);
  return entry;
}

// A separate short-lived connection, so background reading never queues behind what you're doing.
async function withOwnBox<T>(acct: Acct, folder: string, fn: (c: ImapFlow) => Promise<T>): Promise<T> {
  const client = await imapClient(acct);
  client.on('error', () => {});
  await client.connect();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      return await fn(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

async function withBox<T>(acct: Acct, folder: string, fn: (c: ImapFlow, e: Conn) => Promise<T>): Promise<T> {
  let e: Conn;
  try {
    e = await connect(acct);
  } catch (err) {
    clients.delete(acct.email);
    throw err;
  }
  const lock = await e.client.getMailboxLock(folder);
  try {
    return await fn(e.client, e);
  } finally {
    lock.release();
  }
}

const addr = (a: MessageAddressObject[] | undefined) =>
  (a || []).map((x) => ({ name: x.name || '', address: x.address || '' }));

// What's been read before is remembered (per account, folder and message number), so a refresh
// asks the server only for read/starred flags plus the messages that are new since last time.
const metaCache = new Map<string, MetaList>(); // email|folder -> { validity, order: [uid] (newest listing), byUid: Map(uid -> item) }

// ---------- folder lists kept on disk ----------
// Each account's folder lists live in one file in the app's data folder, so any folder shows at once,
// even right after start; the server is then asked only for flags and mail that's new since.
let cacheDir: string | null = null;

const restored = new Set<string>(),
  savedFolders = new Map<string, Folders>(),
  saveTimers = new Map<string, NodeJS.Timeout>();

export function setCacheDir(d: string): void {
  cacheDir = d;
}

const cacheFile = (email: string) =>
  cacheDir &&
  path.join(
    cacheDir,
    `${String(email)
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '_')}.json`,
  );

function restore(email: string) {
  if (restored.has(email) || !cacheDir) {
    return;
  }
  restored.add(email);
  try {
    const j = JSON.parse(fs.readFileSync(cacheFile(email) as string, 'utf8')) as Saved;
    if (j.v !== 1) {
      return;
    }
    if (j.folders) {
      savedFolders.set(email, j.folders);
    }
    for (const [folder, l] of Object.entries(j.lists || {})) {
      const key = `${email}|${folder}`;
      if (!metaCache.has(key)) {
        metaCache.set(key, { validity: l.validity, order: l.order, byUid: new Map(l.items.map((it) => [it.uid, it])) });
      }
    }
  } catch {
    /* no copy yet */
  }
}

function persist(email: string) {
  if (!cacheDir) {
    return;
  }
  clearTimeout(saveTimers.get(email));
  saveTimers.set(
    email,
    setTimeout(() => {
      const lists: NonNullable<Saved['lists']> = {};
      for (const [k, mc] of metaCache) {
        if (!k.startsWith(`${email}|`) || !mc.order) {
          continue;
        }
        lists[k.slice(email.length + 1)] = {
          validity: mc.validity,
          order: mc.order,
          items: mc.order.map((u) => mc.byUid.get(u)).filter(Boolean) as Item[],
        };
      }
      const f = cacheFile(email) as string,
        tmp = `${f}.tmp`;
      try {
        fs.mkdirSync(cacheDir as string, { recursive: true, mode: 0o700 });
        fs.writeFileSync(tmp, JSON.stringify({ v: 1, folders: savedFolders.get(email) || null, lists }), {
          mode: 0o600,
        });
        fs.renameSync(tmp, f);
      } catch {
        /* tried again on the next change */
      }
    }, 2000),
  );
}

// What a folder looked like last time, without asking the server.
export function listCached(acct: Acct, view: string): Thread[] {
  restore(acct.email);
  const f: Folders = savedFolders.get(acct.email) || {},
    folder = f[view] || (view === 'inbox' ? 'INBOX' : view);
  const mc = metaCache.get(`${acct.email}|${folder}`);
  if (!mc?.order) {
    return [];
  }
  return group(mc.order.map((u) => mc.byUid.get(u)).filter(Boolean) as Item[], folder);
}

export function dropCache(email: string): void {
  for (const k of [...metaCache.keys()]) {
    if (k.startsWith(`${email}|`)) {
      metaCache.delete(k);
    }
  }
  savedFolders.delete(email);
  restored.delete(email);
  try {
    if (cacheDir) {
      fs.rmSync(cacheFile(email) as string, { force: true });
    }
  } catch {}
}

const msgCache = new Map<string, Msg>(); // email|folder|uid -> parsed message (most recent 500)

function remember(k: string, v: Msg) {
  msgCache.delete(k);
  msgCache.set(k, v);
  if (msgCache.size > 500) {
    msgCache.delete(msgCache.keys().next().value as string);
  }
}

const LIST_Q = (gmail: boolean): FetchQueryObject => ({
  uid: true,
  envelope: true,
  flags: true,
  internalDate: true,
  bodyStructure: true,
  threadId: gmail,
  headers: ['list-id', 'list-unsubscribe', 'precedence', 'auto-submitted', 'references', 'in-reply-to', 'thread-index'],
  source: { start: 0, maxLength: 12000 },
});

async function toItem(m: FetchMessageObject): Promise<Item> {
  let snippet = '';
  try {
    const p = await simpleParser(m.source as Buffer, { skipHtmlToText: false, skipImageLinks: true });
    snippet = (p.text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  } catch {}
  const h = (m.headers || '').toString().toLowerCase();
  const env: Partial<MessageEnvelopeObject> = m.envelope || {};
  return {
    uid: m.uid,
    key: env.messageId || String(m.uid),
    threadId: m.threadId,
    messageId: env.messageId,
    chain: chainIds(m.headers),
    subject: env.subject || '',
    from: addr(env.from)[0] || { name: '', address: '' },
    to: addr([...(env.to || []), ...(env.cc || [])]).slice(0, 8),
    date: new Date(env.date || m.internalDate || Date.now()).getTime(),
    unread: !(m.flags as Set<string>).has('\\Seen'),
    starred: (m.flags as Set<string>).has('\\Flagged'),
    list: /list-id:|list-unsubscribe:|precedence: *(bulk|list)|auto-submitted: *auto/.test(h),
    snippet,
    atts: filesIn(m.bodyStructure, m.uid).slice(0, 8),
    size: m.size || 0,
  };
}

async function fetchList(acct: Acct, view: string, criteria?: SearchObject): Promise<Thread[]> {
  restore(acct.email);
  const e = await connect(acct);
  savedFolders.set(acct.email, e.folders);
  const folder = e.folders[view] || view;
  if (!folder) {
    return [];
  }
  return withBox(acct, folder, async (c) => {
    const key = `${acct.email}|${folder}`,
      validity = String((c.mailbox as MailboxObject).uidValidity);
    let mc = metaCache.get(key);
    if (!mc || mc.validity !== validity) {
      mc = { validity, byUid: new Map() };
      metaCache.set(key, mc);
    }
    let range: string,
      byUid = true;
    if (criteria) {
      const uids = (await c.search(criteria, { uid: true })) as Found;
      if (!uids?.length) {
        return [];
      }
      range = uids.slice(-150).join(',');
    } else if (view === 'starred' && folder === 'INBOX') {
      const uids = (await c.search({ flagged: true }, { uid: true })) as Found;
      if (!uids?.length) {
        return [];
      }
      range = uids.slice(-150).join(',');
    } else {
      const n = (c.mailbox as MailboxObject).exists;
      if (!n) {
        return [];
      }
      range = `${Math.max(1, n - 199)}:*`;
      byUid = false;
    }
    const flags = new Map<number, Set<string>>();
    for await (const m of c.fetch(range, { uid: true, flags: true }, { uid: byUid })) {
      flags.set(m.uid, m.flags as Set<string>);
    }
    const missing = [...flags.keys()].filter((u) => !mc.byUid.has(u));
    if (missing.length) {
      for await (const m of c.fetch(missing.join(','), LIST_Q(e.gmail), { uid: true })) {
        mc.byUid.set(m.uid, await toItem(m));
      }
    }
    if (!criteria && byUid === false) {
      // the folder's own listing: remember it (and forget mail that left)
      const now = [...flags.keys()],
        changed =
          !mc.order ||
          missing.length ||
          now.length !== mc.order.length ||
          now.some((u, i) => u !== (mc.order as number[])[i]);
      mc.order = now;
      for (const u of [...mc.byUid.keys()]) {
        if (!flags.has(u)) {
          mc.byUid.delete(u);
        }
      }
      if (changed || Date.now() - (mc.savedAt || 0) > 60e3) {
        mc.savedAt = Date.now();
        persist(acct.email);
      }
    }
    const out = [];
    for (const [uid, f] of flags) {
      const it = mc.byUid.get(uid);
      if (!it) {
        continue;
      }
      it.unread = !f.has('\\Seen');
      it.starred = f.has('\\Flagged');
      out.push(it);
    }
    return group(out, folder);
  });
}

async function parseMsg(m: FetchMessageObject): Promise<Msg> {
  const p = await simpleParser(m.source as Buffer);
  const cal = (p.attachments || []).find(
    (a) => /^text\/calendar|^application\/ics/i.test(a.contentType || '') || /\.ics$/i.test(a.filename || ''),
  );
  let inv: Invite | null = null;
  try {
    inv = cal ? parseInvite(cal.content.toString('utf8')) : null;
  } catch {}
  if (inv && !/^(REQUEST|CANCEL)$/.test(inv.method as string)) {
    inv = null; // replies and published calendars aren't questions
  }
  const owa =
    !inv &&
    /Microsoft Outlook Web Access:\s*https:\/\/outlook\.office365\.com\/owa\/\S*?[?&]itemid=([^&\s]+)/.exec(
      p.text || '',
    );
  if (owa) {
    inv = { ews: decodeURIComponent(owa[1]), pending: true };
    p.text = (p.text as string)
      .replace(/Microsoft Outlook Web Access:\s*\S+\s*/, '')
      .replace(/To receive meeting invitations as \.?iCalendar[\s\S]*?iCalendar format\.\s*/, '')
      .trim();
  }
  const un = (p as { list?: { unsubscribe?: Unsub } }).list?.unsubscribe;
  return {
    invite: inv,
    unsub: un
      ? {
          url: ([] as string[]).concat(un.url || [])[0] || null,
          mail: ([] as string[]).concat(un.mail || [])[0] || null,
        }
      : null,
    id: String(m.uid),
    uid: m.uid,
    subject: p.subject || '',
    date: (p.date || new Date()).getTime(),
    from: addr(p.from?.value)[0] || { name: '', address: '' },
    to: addr((p.to as AddressObject | undefined)?.value),
    cc: addr((p.cc as AddressObject | undefined)?.value),
    messageId: p.messageId,
    inReplyTo: p.inReplyTo,
    references: ([] as string[]).concat(p.references || []).join(' '),
    text: p.text || '',
    html: p.html || null,
    attachments: (p.attachments || [])
      .filter((a) => !(inv && /calendar|ics/i.test(a.contentType || '')))
      .filter((a) => a.contentDisposition !== 'inline' || (a.filename && !/^image\//.test(a.contentType)))
      .map((a) => ({ filename: a.filename || 'attachment', size: a.size, type: a.contentType || '' })),
  };
}

// Your replies to a conversation live in Sent (and Archive): find them by reply chain
// (In-Reply-To/References), never by subject, since servers often find nothing for subjects
// with letters like ä/ö. The reply-chain ids of each folder's recent mail are remembered, so
// only messages that arrived since the last look are read again.
const chainCache = new Map<string, { uidValidity: string; uidNext: number; byUid: Map<number, string[]> }>(); // email|folder -> { uidNext, byUid: Map(uid -> ids) }

async function folderChains(acct: Acct, folder: string, depth: number, own?: boolean): Promise<Map<number, string[]>> {
  const key = `${acct.email}|${folder}`;
  return (own ? withOwnBox : (withBox as typeof withOwnBox))(acct, folder, async (c) => {
    let entry = chainCache.get(key);
    const uidNext = (c.mailbox as MailboxObject).uidNext,
      n = (c.mailbox as MailboxObject).exists;
    if (!entry || entry.uidValidity !== String((c.mailbox as MailboxObject).uidValidity)) {
      entry = { uidValidity: String((c.mailbox as MailboxObject).uidValidity), uidNext: 0, byUid: new Map() };
    }
    const q = { uid: true, envelope: true, headers: ['references', 'in-reply-to'] };
    const add = (m: FetchMessageObject) =>
      entry.byUid.set(m.uid, [m.envelope?.messageId, ...chainIds(m.headers)].filter(Boolean) as string[]);
    if (n && !entry.uidNext) {
      for await (const m of c.fetch(`${Math.max(1, n - depth + 1)}:*`, q)) {
        add(m);
      }
    } else if (n && uidNext > entry.uidNext) {
      for await (const m of c.fetch(`${entry.uidNext}:*`, q, { uid: true })) {
        add(m);
      }
    }
    entry.uidNext = uidNext;
    const present = await c.search({ all: true }, { uid: true }).catch(() => null);
    if (present) {
      const keep = new Set(present);
      for (const u of entry.byUid.keys()) {
        if (!keep.has(u)) {
          entry.byUid.delete(u);
        }
      }
    }
    chainCache.set(key, entry);
    return entry.byUid;
  });
}

// Read Sent/Archive reply chains in the background once, so the first conversation opens complete.
const warmed = new Set<string>();

export async function warm(acct: Acct): Promise<void> {
  if (warmed.has(acct.email)) {
    return;
  }
  warmed.add(acct.email);
  try {
    const e = await connect(acct);
    if (e.gmail) {
      return;
    }
    for (const [f, depth] of [
      [e.folders.sent, 500],
      [e.folders.done, 300],
    ] as const) {
      if (f && f !== 'INBOX') {
        await folderChains(acct, f, depth, true).catch(() => {});
      }
    }
  } catch {
    warmed.delete(acct.email);
  }
}

export async function related(acct: Acct, t: Thread, have: ChainOf[]): Promise<Msg[]> {
  const e = await connect(acct);
  if (e.gmail) {
    return []; // Gmail threads already come whole from All Mail
  }
  const known = new Set<string>();
  for (const m of have) {
    if (m.messageId) {
      known.add(m.messageId);
    }
    String(m.references || '')
      .split(/\s+/)
      .forEach((id) => {
        if (id) {
          known.add(id);
        }
      });
    if (m.inReplyTo) {
      known.add(m.inReplyTo);
    }
  }
  if (!known.size) {
    return [];
  }
  const out: Msg[] = [];
  for (const [f, depth] of [
    [e.folders.sent, 500],
    [e.folders.drafts, 100],
    [t.folder === 'INBOX' ? e.folders.done : null, 300],
  ] as const) {
    if (!f || f === t.folder) {
      continue;
    }
    try {
      const chains = await folderChains(acct, f, depth);
      const uids = [...chains].filter(([, ids]) => ids.some((id) => known.has(id))).map(([uid]) => uid);
      if (!uids.length) {
        continue;
      }
      const k = `${acct.email}|${f}|`,
        need = uids.filter((u) => !msgCache.has(k + u));
      if (need.length) {
        await withBox(acct, f, async (c) => {
          for await (const m of c.fetch(need.join(','), { uid: true, source: true }, { uid: true })) {
            remember(k + m.uid, { ...(await parseMsg(m)), folder: f });
          }
        });
      }
      uids.forEach((u) => {
        const m = msgCache.get(k + u);
        if (m) {
          out.push(f === e.folders.drafts ? { ...m, draft: true } : m);
        }
      });
    } catch {
      /* a missing folder just means fewer messages */
    }
  }
  return out;
}

export async function thread(acct: Acct, t: Thread, opts: { peek?: boolean; unread?: boolean } = {}): Promise<Msg[]> {
  const e = await connect(acct);
  const k = `${acct.email}|${t.folder}|`;
  const need = (t.uids as number[]).filter((u) => !msgCache.has(k + u)); // this engine's conversations carry their uids
  const markRead = !opts.peek && opts.unread !== false;
  if (need.length || markRead) {
    await withBox(acct, t.folder, async (c) => {
      if (need.length) {
        for await (const m of c.fetch(need.join(','), { uid: true, source: true }, { uid: true })) {
          remember(k + m.uid, { ...(await parseMsg(m)), folder: t.folder });
        }
      }
      if (markRead) {
        await c.messageFlagsAdd((t.uids as number[]).join(','), ['\\Seen'], { uid: true }).catch(() => {});
      }
    });
  }
  const msgs = (t.uids as number[]).map((u) => msgCache.get(k + u)).filter(Boolean) as Msg[];
  if (e.gmail && t.threadId && e.folders.all && e.folders.all !== t.folder) {
    try {
      const all = await withBox(acct, e.folders.all, async (c) => {
        const uids = (await c.search({ threadId: t.threadId }, { uid: true })) as Found;
        const out: Msg[] = [];
        if (uids?.length) {
          for await (const m of c.fetch(uids.join(','), { uid: true, source: true }, { uid: true })) {
            out.push({ ...(await parseMsg(m)), folder: e.folders.all });
          }
        }
        return out;
      });
      if (all.length) {
        msgs.push(...all);
      }
    } catch {
      /* fall back to the inbox copies */
    }
  }
  const seen = new Set();
  return msgs
    .filter((m) => !m.messageId || (!seen.has(m.messageId) && seen.add(m.messageId)))
    .sort((a, b) => a.date - b.date);
}

export async function act(acct: Acct, t: Thread, action: Action, folder?: string): Promise<Thread> {
  const e = await connect(acct);
  const range = (t.uids as number[]).join(',');
  const flag = (
    {
      star: ['add', '\\Flagged'],
      unstar: ['remove', '\\Flagged'],
      read: ['add', '\\Seen'],
      unread: ['remove', '\\Seen'],
    } as Partial<Record<Action, [string, string]>>
  )[action];
  if (flag) {
    return withBox(acct, t.folder, async (c) => {
      await (flag[0] === 'add'
        ? c.messageFlagsAdd(range, [flag[1]], { uid: true })
        : c.messageFlagsRemove(range, [flag[1]], { uid: true }));
      return t;
    });
  }
  if (action === 'copy') {
    if (!folder) {
      throw new Error('which folder?');
    }
    return withBox(acct, t.folder, async (c) => {
      await c.messageCopy(range, folder, { uid: true });
      return t;
    });
  }
  const dest =
    action === 'move'
      ? folder
      : (
          { done: e.folders.done, undone: 'INBOX', trash: e.folders.trash, spam: e.folders.spam } as Partial<
            Record<Action, string>
          >
        )[action];
  if (!dest) {
    throw new Error(`unsupported action ${action}`);
  }
  if (dest === t.folder) {
    return t;
  }
  return withBox(acct, t.folder, async (c) => {
    // Gmail: "done" means removing the Inbox label, which a move to All Mail does.
    const r = (await c.messageMove(range, dest, { uid: true })) as CopyResponseObject | undefined; // false: as nothing
    const uids = (t.uids as number[]).map((u) => (r?.uidMap ? r.uidMap.get(u) : null)).filter(Boolean) as number[];
    return { ...t, folder: dest, uids, id: `${dest}:${uids.join(',')}` };
  });
}

function splitAddrs(s: string | undefined) {
  return (String(s || '').match(/(?:"[^"]*"|<[^>]*>|[^,;])+/g) || []).map((x) => x.trim()).filter(Boolean);
}

// Files you attach come from the window as base64.
const files = (msg: OutMsg) =>
  (msg.files || []).slice(0, 20).map((f) => ({
    filename: String(f.name || 'file'),
    content: String(f.data || ''),
    encoding: 'base64',
    contentType: f.type || undefined,
  }));

export async function send(acct: Acct, msg: OutMsg): Promise<{ ok: boolean; id: string }> {
  const p = PROVIDERS[acct.provider];
  const t = nodemailer.createTransport({
    ...p.smtp,
    requireTLS: !p.smtp.secure,
    auth: { type: 'OAuth2', user: acct.email, accessToken: await freshToken(acct) },
  });
  const info = await t.sendMail({
    from: msg.fromName ? { name: msg.fromName, address: acct.email } : acct.email,
    to: splitAddrs(msg.to),
    cc: splitAddrs(msg.cc),
    bcc: splitAddrs(msg.bcc),
    subject: msg.subject,
    text: msg.text,
    html: msg.html || undefined,
    inReplyTo: msg.inReplyTo,
    references: msg.references,
    messageId: msg.messageId,
    attachments: files(msg),
    icalEvent: msg.ics ? { method: msg.method || 'REQUEST', content: msg.ics } : undefined,
  });
  return { ok: true, id: info.messageId };
}

// Answer an invitation by mail (iMIP REPLY to the organiser), for when the calendar can't do it.
export async function rsvp(
  acct: Acct,
  inv: Invite,
  answer: Answer,
  fromName?: string,
): Promise<{ ok: boolean; id: string }> {
  if (!inv?.organizer?.email) {
    throw new Error('no organiser to answer');
  }
  const word = { yes: 'Accepted', maybe: 'Tentative', no: 'Declined' }[answer];
  if (!word) {
    throw new Error('bad answer');
  }
  return send(acct, {
    to: inv.organizer.email,
    fromName,
    subject: `${word}: ${inv.title}`,
    text: `${fromName || acct.email} ${{ yes: 'accepted', maybe: 'tentatively accepted', no: 'declined' }[answer]} "${inv.title}".`,
    ics: buildReply(inv, acct.email, fromName, answer),
    method: 'REPLY',
  });
}

export async function invite(acct: Acct, ev: EventInput): Promise<{ ok: boolean; id: string }> {
  const ics = buildInvite(ev, acct.email);
  const to = ev.guests.length ? ev.guests.join(', ') : acct.email;
  const when = new Date(ev.start).toLocaleString();
  return send(acct, {
    to,
    subject: `Invitation: ${ev.title} @ ${when}`,
    text: `${ev.title}\n${when}${ev.where ? `\n${ev.where}` : ''}${ev.notes ? `\n\n${ev.notes}` : ''}`,
    ics,
  });
}

// Search words (from:, subject:, has:attachment, …) -> an IMAP search (Gmail understands them natively).
export function toCriteria(q: string): {
  folder: string;
  criteria: SearchObject;
  post: { list?: boolean; hasAtt?: boolean; filename?: string };
} {
  const toks = String(q).match(/-?\w+:"[^"]*"|-?\w+:\S+|-?"[^"]*"|\S+/g) || [];
  const c: SearchObject = {},
    words: string[] = [],
    not: SearchObject[] = [],
    post: { list?: boolean; hasAtt?: boolean; filename?: string } = {};
  let folder = 'all';
  const ago = (v: string) => {
    const m = /^(\d+)([dwmy])$/.exec(v);
    if (!m) {
      return null;
    }
    const d = ({ d: 1, w: 7, m: 30, y: 365 } as Record<string, number>)[m[2] as string] * +(m[1] as string);
    return new Date(Date.now() - d * 864e5);
  };
  // A typed day (2025/06/01, 2025-6-1, 06/01/2025) as that calendar day wherever you are: IMAP
  // compares dates without a time zone, and imapflow writes the UTC day.
  const day = (v: string) => {
    const d = new Date(v.replace(/-/g, '/'));
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  };
  for (let tok of toks) {
    const neg = tok.startsWith('-');
    if (neg) {
      tok = tok.slice(1);
    }
    const i = tok.indexOf(':');
    let k = i > 0 ? tok.slice(0, i).toLowerCase() : '',
      v = (i > 0 ? tok.slice(i + 1) : tok).replace(/^"|"$/g, '');
    if (k === 'domain') {
      k = 'from';
      v = `@${v.replace(/^@/, '')}`;
    }
    if (k === 'in' || k === 'label') {
      folder = v.toLowerCase();
      continue;
    }
    if (k === 'is') {
      v = v.toLowerCase();
      if (v === 'unread') {
        c.seen = neg;
      } else if (v === 'read') {
        c.seen = !neg;
      } else if (v === 'starred') {
        c.flagged = !neg;
      } else if (v === 'list') {
        post.list = !neg; // checked on the results
      }
      continue;
    }
    if (k === 'from' || k === 'to' || k === 'subject' || k === 'cc' || k === 'bcc') {
      if (neg) {
        not.push({ [k]: v });
      } else {
        c[k] = v;
      }
      continue;
    }
    if (k === 'before') {
      c.before = day(v);
      continue;
    }
    if (k === 'after') {
      c.since = day(v);
      continue;
    }
    if (k === 'older_than') {
      const d = ago(v);
      if (d) {
        c.before = d;
      }
      continue;
    }
    if (k === 'newer_than') {
      const d = ago(v);
      if (d) {
        c.since = d;
      }
      continue;
    }
    if (k === 'has') {
      if (/^attachments?$/i.test(v)) {
        post.hasAtt = !neg;
      }
      continue;
    } // checked on the results
    if (k === 'filename') {
      post.filename = v.toLowerCase();
      continue;
    }
    if (k === 'larger' || k === 'smaller') {
      const m = /^(\d+(?:\.\d+)?)([kmg]?)b?$/i.exec(v);
      if (m) {
        c[k] = Math.round(
          +(m[1] as string) *
            ({ '': 1, k: 1024, m: 1048576, g: 1073741824 } as Record<string, number>)[(m[2] as string).toLowerCase()],
        );
      }
      continue;
    }
    ((neg ? not : words) as unknown[]).push(neg ? { text: v } : v);
  }
  if (words.length) {
    c.text = words.join(' ');
  }
  if (not.length) {
    c.not = not.length === 1 ? not[0] : { or: not };
  }
  if (!Object.keys(c).length) {
    c.all = true;
  }
  return { folder, criteria: c, post };
}

const fold = (s: string) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export async function search(acct: Acct, q: string): Promise<Thread[]> {
  const e = await connect(acct);
  if (e.gmail) {
    return fetchList(acct, 'all', { gmraw: q });
  }
  // Exchange finds nothing when the search has letters like ö, yet ignores accents when matching:
  // so "Isomöttönen" is asked as "Isomottonen".
  const { folder, criteria, post } = toCriteria(fold(q));
  const view = folder === 'all' ? 'inbox' : folder;
  let results = await fetchList(acct, view, criteria);
  // Without "in:", look in Done (Archive) and Sent too: a search covers all your mail.
  if (folder === 'all') {
    for (const f of ['done', 'sent']) {
      if (!e.folders[f] || e.folders[f] === 'INBOX') {
        continue;
      }
      try {
        results.push(...(await fetchList(acct, f, criteria)));
      } catch {}
    }
  }
  if (post.hasAtt !== undefined) {
    results = results.filter((t) => !!t.atts?.length === post.hasAtt);
  }
  if (post.list !== undefined) {
    results = results.filter((t) => !!t.list === post.list);
  }
  if (post.filename) {
    results = results.filter((t) =>
      (t.atts || []).some((a) =>
        fold(a.name)
          .toLowerCase()
          .includes(post.filename as string),
      ),
    );
  }
  return results.sort((a, b) => b.date - a.date);
}

// Drafts live in the mailbox's own Drafts folder. Saving again replaces the previous copy.
export async function saveDraft(acct: Acct, msg: OutMsg): Promise<{ uid: number | null }> {
  const e = await connect(acct);
  const folder = e.folders.drafts;
  if (!folder) {
    throw new Error('this mailbox has no Drafts folder');
  }
  const raw = await new MailComposer({
    from: msg.fromName ? { name: msg.fromName, address: acct.email } : acct.email,
    to: splitAddrs(msg.to),
    cc: splitAddrs(msg.cc),
    bcc: splitAddrs(msg.bcc),
    subject: msg.subject || '',
    text: msg.text || '',
    html: msg.html || undefined,
    inReplyTo: msg.inReplyTo,
    references: msg.references,
    messageId: msg.messageId,
    attachments: files(msg),
  })
    .compile()
    .build();
  const res = (await e.client.append(folder, raw, ['\\Draft', '\\Seen'])) as AppendResponseObject | undefined; // false: as nothing
  if (msg.replaceUid) {
    await deleteDraft(acct, msg.replaceUid).catch(() => {});
  }
  return { uid: res?.uid ? res.uid : null };
}

export async function deleteDraft(acct: Acct, uid: number): Promise<void> {
  const e = await connect(acct);
  if (!e.folders.drafts || !uid) {
    return;
  }
  await withBox(acct, e.folders.drafts, (c) => c.messageDelete(String(uid), { uid: true }));
  msgCache.delete(`${acct.email}|${e.folders.drafts}|${uid}`);
}

// Your own folders/labels, for the side menu (special folders are shown by name already).
export async function folders(acct: Acct): Promise<Folder[]> {
  const e = await connect(acct);
  const list = await e.client.list();
  const special = new Set(Object.values(e.folders));
  // Exchange also lists its calendar, contacts, notes and tasks stores: they hold no mail.
  const notMail =
    /^(Calendar|Contacts|Journal|Notes|Tasks|Outbox|Conversation History|Sync Issues|RSS Feeds|RSS Subscriptions|Suggested Contacts|Social Activity Notifications|Files|Yammer Root|ExternalContacts|PersonMetadata|Snoozed)(\/|$)/i;
  return list
    .filter(
      (f) =>
        !f.specialUse &&
        !special.has(f.path) &&
        !f.flags?.has('\\Noselect') &&
        f.path !== 'INBOX' &&
        !notMail.test(f.path),
    )
    .map((f) => ({ path: f.path, name: f.name || f.path }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function attachment(
  acct: Acct,
  folder: string,
  uid: number,
  name: string,
  index: number,
): Promise<{ name: string; content: Buffer; type: string }> {
  const raw = await withBox(acct, folder, async (c) => {
    for await (const m of c.fetch(String(uid), { uid: true, source: true }, { uid: true })) {
      return m.source;
    }
    return null;
  });
  if (!raw) {
    throw new Error('message not found');
  }
  const p = await simpleParser(raw);
  const all = p.attachments || [];
  const a =
    all.find((x) => (x.filename || 'attachment') === name) ||
    all.filter((x) => x.contentDisposition !== 'inline' || x.filename)[index || 0];
  if (!a) {
    throw new Error('file not found');
  }
  return { name: a.filename || name || 'attachment', content: a.content, type: a.contentType };
}

export function forget(email: string): void {
  const c = clients.get(email);
  if (c) {
    c.client.logout().catch(() => {});
  }
  clients.delete(email);
}

// People you write to (Sent counts most) and hear from, for the To/Cc suggestions.
const contactCache = new Map<string, { at: number; list: Contact[] }>();

export async function contacts(acct: Acct): Promise<Contact[]> {
  const hit = contactCache.get(acct.email);
  if (hit && Date.now() - hit.at < 30 * 60e3) {
    return hit.list;
  }
  const e = await connect(acct),
    seen = new Map<string, Contact>(),
    me = acct.email.toLowerCase();
  const add = (p: MessageAddressObject | undefined, w: number, d: number) => {
    if (!p?.address) {
      return;
    }
    const k = p.address.toLowerCase();
    if (k === me || /(^|[.-])(no-?reply|do-?not-?reply|notifications?|mailer-daemon|bounce)/.test(k)) {
      return;
    }
    const c = seen.get(k) || { name: '', address: p.address, score: 0, last: 0 };
    if (p.name && !c.name) {
      c.name = p.name;
    }
    c.score += w;
    c.last = Math.max(c.last, d);
    seen.set(k, c);
  };
  for (const [f, w, who] of [
    [e.folders.sent, 3, ['to', 'cc', 'bcc']],
    ['INBOX', 1, ['from', 'cc']],
    [e.folders.done, 1, ['from']],
  ] as const) {
    if (!f) {
      continue;
    }
    try {
      await withBox(acct, f, async (c) => {
        const n = (c.mailbox as MailboxObject).exists;
        if (!n) {
          return;
        }
        for await (const m of c.fetch(`${Math.max(1, n - 1500)}:*`, { envelope: true })) {
          const env: Partial<MessageEnvelopeObject> = m.envelope || {},
            d = new Date(env.date || 0).getTime();
          who.forEach((k) => {
            (env[k] || []).forEach((p) => {
              add(p, w, d);
            });
          });
        }
      });
    } catch {
      /* fewer suggestions */
    }
  }
  const list = [...seen.values()].sort((a, b) => b.score - a.score || b.last - a.last).slice(0, 4000);
  contactCache.set(acct.email, { at: Date.now(), list });
  return list;
}

// ---------- push: the server says when the inbox changes ----------
// A second, quiet connection keeps the inbox open in IMAP IDLE (Outlook and Gmail both support it),
// so new mail shows within seconds instead of at the next check. It reconnects by itself after
// drops, sleep or an expired sign-in, with a fresh token.
const watchers = new Map<string, { stopped: boolean; live: boolean; client?: ImapFlow }>(); // email -> { client, stopped, live }

export function watch(acct: Acct, onChange: () => void): void {
  if (watchers.has(acct.email)) {
    return;
  }
  const w: { stopped: boolean; live: boolean; client?: ImapFlow } = { stopped: false, live: false };
  watchers.set(acct.email, w);
  let timer: NodeJS.Timeout | undefined;
  const ping = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 500);
  };
  const start = async () => {
    if (w.stopped) {
      return;
    }
    let client: ImapFlow | null = null;
    try {
      client = await imapClient(acct, { maxIdleTime: 4 * 60e3 });
      w.client = client;
      client.on('exists', ping);
      client.on('expunge', ping);
      client.on('flags', ping);
      client.on('error', () => {});
      client.on('close', () => {
        w.live = false;
        if (!w.stopped && w.client === client) {
          setTimeout(start, 10e3);
        }
      });
      await client.connect();
      await client.mailboxOpen('INBOX'); // imapflow sits in IDLE on its own while nothing else is asked
      w.live = true;
      ping(); // catch up on whatever arrived while it was away
    } catch {
      w.live = false;
      try {
        client?.close();
      } catch {}
      if (!w.stopped) {
        setTimeout(start, 60e3);
      }
    }
  };
  void start();
}

export function unwatch(email: string): void {
  const w = watchers.get(email);
  if (!w) {
    return;
  }
  w.stopped = true;
  watchers.delete(email);
  try {
    w.client?.logout().catch(() => {});
  } catch {}
}

// After the computer wakes up the old connection is dead: start again at once.
export function rewatch(acct: Acct, onChange: () => void): void {
  unwatch(acct.email);
  watch(acct, onChange);
}

export const pushLive = (email: string): boolean => !!watchers.get(email)?.live;

export { fetchList as list };
