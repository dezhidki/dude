// Run: node tests/web/search.test.ts
import assert from 'node:assert';
import type { Thread } from '../../web/api.ts';
import { DemoBackend } from '../../web/demo.ts';
import { matchQuery } from '../../web/search.ts';

const maya = {
  from: { name: 'Maya Lindqvist', address: 'maya@cs.example.edu' },
  to: [
    { name: 'Me', address: 'me@example.edu' },
    { name: 'Lena V', address: 'lena@example.edu' },
  ],
  subject: 'Thesis chapter 3: draft',
  snippet: 'Comments are in. Be brilliant on Friday.',
  unread: true,
  starred: false,
  list: false,
  atts: [{ name: 'Chapter3.PDF' }],
  size: 2.5 * 1048576,
};

const news = {
  from: { name: 'The Weekly Byte', address: 'hello@weeklybyte.example' },
  to: [{ name: '', address: 'me@example.edu' }],
  subject: 'Ten keyboard tricks',
  snippet: 'unsubscribe any time',
  unread: false,
  starred: true,
  list: true,
};

const bare = { from: { address: 'x@badexample.edu' }, subject: '' }; // no to, atts, size, snippet
const all = { maya, news, bare };

const hits = (q: string | undefined) =>
  (Object.keys(all) as (keyof typeof all)[]).filter((k) => matchQuery(all[k] as Partial<Thread>, q)).join(' ');

// nothing typed: everything matches
assert.strictEqual(hits(''), 'maya news bare');
assert.strictEqual(hits(undefined), 'maya news bare');
assert.strictEqual(hits('   '), 'maya news bare');

// plain words: anywhere in subject, preview, sender name or address; any case; every word must match
assert.strictEqual(hits('thesis'), 'maya');
assert.strictEqual(hits('BRILLIANT'), 'maya');
assert.strictEqual(hits('lindqvist'), 'maya');
assert.strictEqual(hits('weeklybyte'), 'news');
assert.strictEqual(hits('friday thesis'), 'maya');
assert.strictEqual(hits('friday tricks'), '');
assert.strictEqual(hits('-thesis'), 'news bare');
assert.strictEqual(hits('-thesis -tricks'), 'bare');

// "exact phrase", also negated
assert.strictEqual(hits('"be brilliant"'), 'maya');
assert.strictEqual(hits('"brilliant be"'), '');
assert.strictEqual(hits('-"be brilliant"'), 'news bare');

// from: name or address, quoted full names, negated, key in any case
assert.strictEqual(hits('from:maya'), 'maya');
assert.strictEqual(hits('from:"maya lindqvist"'), 'maya');
assert.strictEqual(hits('from:"Lindqvist, Maya"'), '');
assert.strictEqual(hits('from:weeklybyte.example'), 'news');
assert.strictEqual(hits('FROM:Maya'), 'maya');
assert.strictEqual(hits('-from:maya'), 'news bare');

// to: / cc: / bcc: look at everyone the mail went to
assert.strictEqual(hits('to:lena'), 'maya');
assert.strictEqual(hits('cc:lena'), 'maya');
assert.strictEqual(hits('bcc:"lena v"'), 'maya');
assert.strictEqual(hits('to:me@example.edu'), 'maya news');
assert.strictEqual(hits('-to:lena'), 'news bare');

// subject: only the subject
assert.strictEqual(hits('subject:chapter'), 'maya');
assert.strictEqual(hits('subject:brilliant'), '');
assert.strictEqual(hits('subject:"chapter 3:"'), 'maya');

// domain: the sender's domain or one under it, with or without @
assert.strictEqual(hits('domain:example.edu'), 'maya');
assert.strictEqual(hits('domain:cs.example.edu'), 'maya');
assert.strictEqual(hits('domain:@weeklybyte.example'), 'news');
assert.strictEqual(hits('domain:ample.edu'), ''); // not badexample.edu or example.edu
assert.strictEqual(hits('domain:badexample.edu'), 'bare');
assert.strictEqual(hits('-domain:example.edu'), 'news bare');

// is: unread / read / starred / list; anything else matches nothing
assert.strictEqual(hits('is:unread'), 'maya');
assert.strictEqual(hits('is:read'), 'news bare');
assert.strictEqual(hits('is:starred'), 'news');
assert.strictEqual(hits('is:list'), 'news');
assert.strictEqual(hits('IS:UNREAD'), 'maya');
assert.strictEqual(hits('-is:unread'), 'news bare');
assert.strictEqual(hits('is:important'), '');

// has: attachment(s) / list
assert.strictEqual(hits('has:attachment'), 'maya');
assert.strictEqual(hits('has:attachments'), 'maya');
assert.strictEqual(hits('-has:attachment'), 'news bare');
assert.strictEqual(hits('has:list'), 'news');
assert.strictEqual(hits('has:drive'), '');

// filename: part of an attachment's name, any case
assert.strictEqual(hits('filename:pdf'), 'maya');
assert.strictEqual(hits('filename:chapter3'), 'maya');
assert.strictEqual(hits('filename:docx'), '');

// larger: / smaller: bytes, k, m, g (with or without b), decimals; a bad size matches nothing
assert.strictEqual(hits('larger:2M'), 'maya');
assert.strictEqual(hits('larger:2.5m'), ''); // not larger than itself
assert.strictEqual(hits('larger:2000kb'), 'maya');
assert.strictEqual(hits('larger:1g'), '');
assert.strictEqual(hits('smaller:3m'), 'maya news bare'); // no size counts as 0
assert.strictEqual(hits('smaller:100'), 'news bare');
assert.strictEqual(hits('larger:big'), '');
assert.strictEqual(hits('-larger:2m'), 'news bare');

// words combine: all must hold
assert.strictEqual(hits('from:maya is:unread has:attachment thesis'), 'maya');
assert.strictEqual(hits('from:maya is:read'), '');
assert.strictEqual(hits('is:starred -from:maya tricks'), 'news');

// an unknown word: is looked for as text (its part after the colon)
assert.strictEqual(hits('foo:tricks'), 'news');

// the demo mailbox searches with it, and also understands in:<folder>
const demo = async (q: string) => (await DemoBackend.search(q)).map((t) => t.id).join(' ');

assert.strictEqual(await demo('from:maya'), 'd1 d15');
assert.strictEqual(await demo('poster'), 'd3 d17');
assert.strictEqual(await demo('poster in:sent'), 'd17');
assert.strictEqual(await demo('in:done'), 'd16');
assert.strictEqual(await demo('in:inbox has:attachment'), 'd3 d12');
assert.strictEqual(await demo('domain:example.edu is:unread'), 'd1 d4');
assert.strictEqual(await demo('larger:1m filename:jpg'), 'd12');
assert.strictEqual(await demo('is:list -from:codehost'), 'd6 d8 d10 d14');
assert.strictEqual(await demo('nothing-like-this'), '');
console.log('search ok');
