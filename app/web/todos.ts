// The todo board's model: days, typed "when", labels. Pure, no DOM.
import type { Thread } from './api.ts';
import { parseWhen } from './when.ts';

export type TodoMail = Omit<Thread, 'atts' | 'prevFolder'>;
export interface TodoTask {
  t: string;
  done: boolean;
}
export interface Todo {
  id: string;
  title: string;
  /** local YYYY-MM-DD, or null for someday */
  day: string | null;
  done: boolean;
  labels: string[];
  mails: TodoMail[];
  tasks: TodoTask[];
  notes: string;
}
export interface Label {
  id: string;
  hue: number;
}
export const HUES = 6;

const WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function keyDay(k: string): number {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function dayWord(k: string | null, now: Date): string {
  if (k === null) {
    return 'someday';
  }
  const diff = Math.round((keyDay(k) - keyDay(dayKey(now.getTime()))) / 864e5);
  if (diff === 0) {
    return 'today';
  }
  return diff === 1 ? 'tomorrow' : WEEK[new Date(keyDay(k)).getDay()];
}

export function whenText(k: string | null, now: Date): string {
  const w = dayWord(k, now);
  if (k === null || w === 'today' || w === 'tomorrow') {
    return w;
  }
  const d = new Date(keyDay(k));
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function whenToDay(text: string, now: Date, keep?: string | null): { ok: boolean; day: string | null } {
  const s = text.trim().toLowerCase();
  if (['', 'someday', 'no day', 'later'].includes(s)) {
    return { ok: true, day: null };
  }
  if (keep !== undefined && text.trim() === whenText(keep, now)) {
    return { ok: true, day: keep };
  }
  const r = parseWhen(text, now);
  return r ? { ok: true, day: dayKey(r.start) } : { ok: false, day: null };
}

/** open todos first in stored order, then done */
export function sortDay(list: Todo[]): Todo[] {
  return [...list.filter((x) => !x.done), ...list.filter((x) => x.done)];
}

export function normLabel(s: string): string {
  return s.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-').slice(0, 24);
}

export function addLabel(labels: Label[], name: string): Label[] {
  const id = normLabel(name);
  return !id || labels.some((l) => l.id === id) ? labels : [...labels, { id, hue: labels.length % HUES }];
}

/** labels offered for what's typed: it first (Enter takes it, existing or new), then the labels it starts; none taken */
export function labelChoices(labels: Label[], q: string, taken: string[]): string[] {
  const id = normLabel(q);
  return id
    ? [id, ...labels.map((l) => l.id).filter((x) => x.startsWith(id))].filter(
        (x, i, a) => !taken.includes(x) && a.indexOf(x) === i,
      )
    : [];
}

export function normTodo(x: unknown): Todo | null {
  const o = x as Record<string, unknown> | null;
  if (!o || typeof o !== 'object' || typeof o.id !== 'string' || !o.id) {
    return null;
  }
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null);
  const labels = arr(o.labels).flatMap((l) => (typeof l === 'string' ? [normLabel(l)] : []));
  return {
    id: o.id,
    title: typeof o.title === 'string' ? o.title : '',
    day: typeof o.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.day) ? o.day : null,
    done: o.done === true,
    labels: labels.filter((l, i) => l && labels.indexOf(l) === i),
    mails: arr(o.mails).filter(
      (m) => typeof obj(m)?.id === 'string' && typeof obj(m)?.folder === 'string',
    ) as TodoMail[],
    tasks: arr(o.tasks).flatMap((e) => {
      const r = obj(e);
      return r && typeof r.t === 'string' ? [{ t: r.t, done: !!r.done }] : [];
    }),
    notes: typeof o.notes === 'string' ? o.notes : '',
  };
}

/** the neighbouring column in direction d, staying put at the ends */
export function moveDay(cols: (string | null)[], day: string | null, d: -1 | 1): string | null {
  const i = cols.indexOf(day);
  return i < 0 ? day : cols[Math.min(cols.length - 1, Math.max(0, i + d))];
}

export function todoTitle(subject: string): string {
  return subject.replace(/^(\s*(re|fwd?)\s*:\s*)+/i, '').trim();
}

export function mailRef(t: Thread): TodoMail {
  const { atts: _atts, prevFolder: _prev, ...rest } = t;
  return rest;
}
