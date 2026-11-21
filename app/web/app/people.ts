// ---------- people (To/Cc/Bcc suggestions) ----------
// Everyone in your recent mail (Sent counts most), plus the organisation's address book when the
// Outlook calendar is linked. The list sits under the field; ↑ ↓ pick, Enter or Tab take it.

import type { Contact, Person } from '../api.ts';
import { meAddr } from './compose.ts';
import { B, change, fold, M, S } from './core.ts';

let contactList: Contact[] | null = null,
  contactsAsked = false,
  suggTimer: ReturnType<typeof setTimeout> | undefined;

export function loadContacts() {
  if (contactsAsked || !B.contacts) {
    return;
  }
  contactsAsked = true;
  B.contacts()
    .then((l) => {
      contactList = l;
    })
    .catch(() => {
      contactsAsked = false;
    });
}

type Known = Person & { score: number };

function knownPeople(): Known[] {
  const map = new Map<string, Known>();
  const add = (p: Person | undefined, w: number) => {
    if (!p?.address || !/@/.test(p.address)) {
      return;
    }
    const k = p.address.toLowerCase();
    if (k === meAddr()) {
      return;
    }
    const c = map.get(k) || { name: '', address: p.address, score: 0 };
    if (!c.name && p.name) {
      c.name = p.name;
    }
    c.score += w;
    map.set(k, c);
  };
  (contactList || []).forEach((p) => {
    add(p, p.score || 1);
  });
  Object.values(M.cache).forEach((list) => {
    (list || []).forEach((t) => {
      add(t.from, t.list ? 0.1 : 1);
      (t.to || []).forEach((p) => {
        add(p, 0.5);
      });
    });
  });
  S.msgs.forEach((m) => {
    [m.from, ...(m.to || []), ...(m.cc || [])].forEach((p) => {
      add(p, 1);
    });
  });
  return [...map.values()];
}

function matchPeople(q: string) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [];
  }
  return knownPeople()
    .filter((p) => {
      const toks = fold(`${p.name} ${p.address}`).split(/[\s.@,<>_"'()-]+/);
      return words.every((w) => toks.some((x) => x.startsWith(w))) || fold(p.address).startsWith(words.join(' '));
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export const niceName = (n0: unknown) => {
  const n = String(n0 || '')
    .replace(/"/g, '')
    .trim();
  const m = /^([^,]+),\s*(.+)$/.exec(n);
  return m ? `${m[2]} ${m[1]}` : n;
};

export function suggest(el: HTMLInputElement | HTMLTextAreaElement) {
  const v = el.value,
    pos = el.selectionStart ?? v.length;
  const start = Math.max(v.lastIndexOf(',', pos - 1), v.lastIndexOf(';', pos - 1)) + 1;
  const tok = v.slice(start, pos).trim();
  if (!tok || /[<>]/.test(tok)) {
    return closeSugg();
  }
  loadContacts();
  const offer = (items: Person[]) => {
    if (!items.length || document.activeElement !== el) {
      return closeSugg();
    }
    const i = S.sugg && S.sugg.el === el ? Math.min(S.sugg.i, items.length - 1) : 0;
    S.sugg = { el, start, end: pos, items, i }; // the field's Sugg (render.jsx) shows it
  };
  const local = matchPeople(tok);
  offer(local);
  clearTimeout(suggTimer);
  if (B.people && tok.length >= 3) {
    suggTimer = setTimeout(async () => {
      const more = await (B.people as NonNullable<typeof B.people>)(tok).catch((): Person[] => []);
      if (document.activeElement !== el || el.value.slice(start, el.selectionStart as number).trim() !== tok) {
        return;
      }
      const have = new Set(local.map((p) => p.address.toLowerCase()));
      change(() => offer([...local, ...more.filter((p) => !have.has(p.address.toLowerCase()))].slice(0, 8)));
    }, 250);
  }
}

export function closeSugg() {
  S.sugg = null;
  clearTimeout(suggTimer);
}

export function takeSugg(i?: number) {
  const sg = S.sugg;
  if (!sg) {
    return;
  }
  const p = sg.items[i ?? sg.i];
  if (!p) {
    return;
  }
  const v = sg.el.value,
    n = niceName(p.name).replace(/[",;<>]/g, '');
  const ins = `${n ? `${n} <${p.address}>` : p.address}, `;
  let before = v.slice(0, sg.start);
  if (before && !/\s$/.test(before)) {
    before += ' ';
  }
  const after = v.slice(sg.end).replace(/^[^,;]*[,;]?\s*/, '');
  closeSugg();
  sg.el.value = before + ins + after;
  const at = (before + ins).length;
  sg.el.setSelectionRange(at, at);
  sg.el.dispatchEvent(new Event('input', { bubbles: true }));
}

document.addEventListener('focusout', (e) => {
  if (S.sugg && e.target === S.sugg.el) {
    setTimeout(() => {
      if (S.sugg && document.activeElement !== S.sugg.el) {
        change(closeSugg);
      }
    }, 100);
  }
});
