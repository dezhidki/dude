// Run: node tests/web/todos.test.ts
import assert from 'node:assert';
import type { Thread } from '../../web/api.ts';
import {
  addLabel,
  dayKey,
  dayWord,
  keyDay,
  labelChoices,
  mailRef,
  moveDay,
  normLabel,
  normTodo,
  sortDay,
  todoTitle,
  whenText,
  whenToDay,
} from '../../web/todos.ts';

const now = new Date(2026, 10, 23, 9, 15); // Mon 23 Nov 2026 09:15
const t = (id: string) => normTodo({ id, title: id }) as NonNullable<ReturnType<typeof normTodo>>;
const thread: Thread = {
  id: '1',
  folder: 'INBOX',
  subject: 's',
  from: { name: 'A', address: 'a@x' },
  to: [],
  date: 0,
  unread: false,
  starred: false,
  list: false,
  count: 1,
  snippet: '',
  size: 1,
};

assert.strictEqual(dayKey(new Date(2026, 10, 23, 23, 59).getTime()), '2026-11-23');
assert.strictEqual(keyDay('2026-11-23'), new Date(2026, 10, 23).getTime());
assert.strictEqual(dayWord(null, now), 'someday');
assert.strictEqual(dayWord('2026-11-23', now), 'today');
assert.strictEqual(dayWord('2026-11-24', now), 'tomorrow');
assert.strictEqual(dayWord('2026-11-27', now), 'fri');
assert.strictEqual(whenText('2026-11-27', now), 'nov 27');
assert.deepStrictEqual(whenToDay('', now), { ok: true, day: null });
assert.deepStrictEqual(whenToDay('someday', now), { ok: true, day: null });
assert.deepStrictEqual(whenToDay('today', now), { ok: true, day: '2026-11-23' });
assert.deepStrictEqual(whenToDay('fri', now), { ok: true, day: '2026-11-27' });
assert.deepStrictEqual(whenToDay('nov 30', now), { ok: true, day: '2026-11-30' });
assert.deepStrictEqual(whenToDay('blah', now), { ok: false, day: null });
// an old todo keeps its day when "when" is saved untouched (parseWhen would say next year)
assert.deepStrictEqual(whenToDay(whenText('2026-11-20', now), now, '2026-11-20'), { ok: true, day: '2026-11-20' });
for (let i = 0; i < 300; i++) {
  const k = dayKey(now.getTime() + i * 864e5);
  assert.strictEqual(whenToDay(whenText(k, now), now).day, k);
}
// the label field offers what's typed first (Enter takes it), then the labels it starts; never one on the todo
const lb = (...ids: string[]) => ids.map((id, hue) => ({ id, hue }));
assert.deepStrictEqual(labelChoices(lb('poster-draft', 'poster'), 'poster', []), ['poster', 'poster-draft']);
assert.deepStrictEqual(labelChoices(lb('poster'), 'po', []), ['po', 'poster']);
assert.deepStrictEqual(labelChoices(lb('poster'), ' #Poster ', []), ['poster']);
assert.deepStrictEqual(labelChoices(lb('poster-draft', 'poster'), 'poster', ['poster']), ['poster-draft']);
assert.deepStrictEqual(labelChoices(lb('poster'), 'po', ['poster']), ['po']);
assert.deepStrictEqual(labelChoices(lb('poster'), '  ', []), []);
assert.strictEqual(normLabel(' #Thesis '), 'thesis');
assert.strictEqual(normLabel('two  words'), 'two-words');
assert.deepStrictEqual(addLabel([{ id: 'thesis', hue: 0 }], 'Thesis'), [{ id: 'thesis', hue: 0 }]);
assert.deepStrictEqual(addLabel([{ id: 'thesis', hue: 0 }], 'code'), [
  { id: 'thesis', hue: 0 },
  { id: 'code', hue: 1 },
]);
assert.deepStrictEqual(normTodo({ id: 'a', title: 'x' }), {
  id: 'a',
  title: 'x',
  day: null,
  done: false,
  labels: [],
  mails: [],
  tasks: [],
  notes: '',
});
const bad = normTodo({
  id: 'a',
  title: 'x',
  tasks: [null, 'y', { t: 'ok', done: 1 }],
  labels: [1, ' #Thesis ', 'thesis', ''],
  mails: [null, { id: 'm' }, { id: 'm2', folder: 'inbox' }],
  day: 'junk',
});
assert.deepStrictEqual(bad?.tasks, [{ t: 'ok', done: true }]);
assert.deepStrictEqual(bad?.labels, ['thesis']);
assert.deepStrictEqual(
  bad?.mails.map((m) => m.id),
  ['m2'],
);
assert.strictEqual(bad?.day, null);
assert.strictEqual(normTodo({ id: 'a', day: '2026-11-23' })?.day, '2026-11-23');
assert.strictEqual(normTodo('junk'), null);
assert.strictEqual(normTodo({ title: 'no id' }), null);
const cols = ['2026-11-22', '2026-11-23', null];
assert.strictEqual(moveDay(cols, '2026-11-22', -1), '2026-11-22');
assert.strictEqual(moveDay(cols, null, 1), null);
assert.strictEqual(moveDay(cols, '2026-11-23', 1), null);
assert.deepStrictEqual(
  sortDay([{ ...t('a'), done: true }, t('b'), t('c')]).map((x) => x.id),
  ['b', 'c', 'a'],
);
assert.strictEqual(todoTitle('Re: Fwd: Poster layout'), 'Poster layout');
assert.strictEqual('atts' in mailRef({ ...thread, atts: [] }), false);
// a Scheduled row's mail is kept as a plain reference: opening it never unschedules the send
const row = mailRef({ ...thread, sched: { at: 1, msg: { to: 'a@x.example' } }, _leaving: true } as Thread);
assert.strictEqual('sched' in row, false);
assert.strictEqual('_leaving' in row, false);
console.log('todos ok');
