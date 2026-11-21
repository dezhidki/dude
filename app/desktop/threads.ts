import type { FileInfo, Person, Thread } from '../web/api.ts';

/** one message as a folder list keeps it (mail.ts toItem) */
export interface Item {
  uid: number;
  key: string;
  threadId?: string;
  messageId?: string;
  chain: string[];
  subject: string;
  from: Person;
  to: Person[];
  date: number;
  unread: boolean;
  starred: boolean;
  list: boolean;
  snippet: string;
  atts: FileInfo[];
  size: number;
}

// Groups messages into conversations (no mail server needed; tested by threads.test.ts).
// Reply-chain ids from raw headers: Message-ID links to In-Reply-To/References; Outlook's
// Thread-Index starts with the same 22 bytes for a whole conversation.
export function chainIds(raw: Buffer | string | undefined): string[] {
  const h = String(raw || '').replace(/\r?\n[ \t]+/g, ' ');
  const ids: string[] = [];
  for (const line of h.split(/\r?\n/)) {
    const m = /^(references|in-reply-to|thread-index):\s*(.*)$/i.exec(line);
    if (!m) {
      continue;
    }
    if (m[1].toLowerCase() === 'thread-index') {
      const v = m[2].trim();
      if (v.length >= 30) {
        ids.push(`ti:${v.slice(0, 28)}`);
      }
    } else {
      ids.push(...(m[2].match(/<[^>]+>/g) || []));
    }
  }
  return ids;
}

// Conversations: Gmail's thread id when there is one, else messages joined through their reply
// chains (union-find). Unrelated mails that only share a subject stay separate.
export function group(msgs: Item[], folder: string): Thread[] {
  const parent = new Map<string, string>();
  const find = (x: string) => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x) as string) as string);
      x = parent.get(x) as string;
    }
    return x;
  };
  const add = (x: string) => {
    if (!parent.has(x)) {
      parent.set(x, x);
    }
    return x;
  };
  const union = (a: string, b: string) => {
    const ra = find(add(a)),
      rb = find(add(b));
    if (ra !== rb) {
      parent.set(ra, rb);
    }
  };
  for (const m of msgs) {
    const self = add(`uid:${m.uid}`);
    if (m.threadId) {
      union(self, `gm:${m.threadId}`);
    } else {
      if (m.messageId) {
        union(self, m.messageId);
      }
      for (const id of m.chain) {
        union(self, id);
      }
    }
  }
  const map = new Map<string, Item & { folder: string; uids: number[]; count: number }>();
  for (const m of msgs) {
    const k = find(`uid:${m.uid}`);
    const t = map.get(k);
    if (!t) {
      map.set(k, { ...m, folder, uids: [m.uid], count: 1 });
    } else {
      t.uids.push(m.uid);
      t.count++;
      if (m.atts?.length) {
        t.atts = [...(t.atts || []), ...m.atts.filter((x) => !(t.atts || []).some((y) => y.name === x.name))].slice(
          0,
          8,
        );
      }
      t.unread = t.unread || m.unread;
      t.starred = t.starred || m.starred;
      if (m.date > t.date) {
        Object.assign(t, { date: m.date, from: m.from, snippet: m.snippet, key: m.key, subject: m.subject });
      }
    }
  }
  return [...map.values()]
    .map(({ chain, ...t }) => ({ ...t, id: `${folder}:${t.uids.join(',')}` }))
    .sort((a, b) => b.date - a.date);
}
