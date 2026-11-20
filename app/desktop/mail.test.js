// Run: node mail.test.js (no network: a fake mail server stands in for Outlook and Gmail)
const assert = require('node:assert');
const Module = require('node:module');

// ---------- a fake IMAP server: folders of messages, and a log of every search asked ----------
let boxes = {},
  searched = [],
  failing = null;

const msg = (uid, subject, from, date, o = {}) => ({
  uid,
  flags: new Set(o.flags || []),
  envelope: { messageId: `<${uid}@x>`, subject, date: new Date(date), from: [from], to: [] },
  headers: Buffer.from(o.list ? 'List-Id: <news.example>' : ''),
  bodyStructure: o.att
    ? {
        childNodes: [
          { type: 'text/plain' },
          { type: 'application/pdf', disposition: 'attachment', dispositionParameters: { filename: o.att } },
        ],
      }
    : { type: 'text/plain' },
  source: Buffer.from(`Subject: ${subject}\r\n\r\nhello`),
  size: 100,
});

class FakeImap {
  usable = true;
  on() {}
  async connect() {}
  async list() {
    const use = { Archive: '\\Archive', Sent: '\\Sent', '[Gmail]/All Mail': '\\All' };
    return Object.keys(boxes).map((path) => ({ path, specialUse: use[path], flags: new Set() }));
  }
  async mailboxCreate() {}
  async getMailboxLock(box) {
    this.box = box;
    this.mailbox = { uidValidity: 1n, exists: (boxes[box] || []).length };
    return { release() {} };
  }
  async search(criteria) {
    searched.push([this.box, criteria]);
    if (this.box === failing) throw new Error('server said no');
    return (boxes[this.box] || []).map((m) => m.uid);
  }
  async *fetch(range) {
    const uids = String(range).split(',').map(Number);
    for (const m of boxes[this.box] || []) if (uids.includes(m.uid)) yield m;
  }
}

const realLoad = Module._load;

Module._load = (req, ...rest) =>
  req === 'imapflow'
    ? { ImapFlow: FakeImap }
    : req === './oauth'
      ? { PROVIDERS: { microsoft: { imap: {} }, google: { imap: {} } }, freshToken: async () => 't' } // no Electron here
      : realLoad(req, ...rest);

const mail = require('./mail');
const { toCriteria } = mail;

// ---------- the words, turned into an IMAP search (Outlook) ----------
const NOW = Date.UTC(2026, 10, 18, 10, 30);
Date.now = () => NOW;
const crit = (q) => toCriteria(q).criteria;
const DAY = 864e5;

assert.deepStrictEqual(toCriteria(''), { folder: 'all', criteria: { all: true }, post: {} });
assert.deepStrictEqual(crit('budget'), { text: 'budget' });
assert.deepStrictEqual(crit('"exact phrase"'), { text: 'exact phrase' });
assert.deepStrictEqual(crit('from:maya'), { from: 'maya' });
assert.deepStrictEqual(crit('FROM:"Maya Lindqvist"'), { from: 'Maya Lindqvist' });

assert.deepStrictEqual(crit('to:lena cc:omar bcc:jun subject:"poster v2"'), {
  to: 'lena',
  cc: 'omar',
  bcc: 'jun',
  subject: 'poster v2',
});

assert.deepStrictEqual(crit('domain:example.edu'), { from: '@example.edu' });
assert.deepStrictEqual(crit('domain:@example.edu'), { from: '@example.edu' });

// "-" leaves things out: one is a NOT, several are a NOT (… OR …)
assert.deepStrictEqual(crit('-from:news'), { not: { from: 'news' } });
assert.deepStrictEqual(crit('-domain:example.edu'), { not: { from: '@example.edu' } });
assert.deepStrictEqual(crit('thesis -word'), { text: 'thesis', not: { text: 'word' } });

assert.deepStrictEqual(crit('-from:news -"old stuff" -subject:re'), {
  not: { or: [{ from: 'news' }, { text: 'old stuff' }, { subject: 're' }] },
});

// is: read / unread / starred, in any case; is:list and has:attachment are checked on the results
assert.deepStrictEqual(crit('is:unread'), { seen: false });
assert.deepStrictEqual(crit('-is:unread'), { seen: true });
assert.deepStrictEqual(crit('is:read'), { seen: true });
assert.deepStrictEqual(crit('IS:Starred'), { flagged: true });
assert.deepStrictEqual(crit('-is:starred'), { flagged: false });
assert.deepStrictEqual(toCriteria('is:list'), { folder: 'all', criteria: { all: true }, post: { list: true } });
assert.deepStrictEqual(toCriteria('-is:list').post, { list: false });
assert.deepStrictEqual(toCriteria('has:attachment').post, { hasAtt: true });
assert.deepStrictEqual(toCriteria('has:Attachments').post, { hasAtt: true });
assert.deepStrictEqual(toCriteria('-has:attachment').post, { hasAtt: false });
assert.deepStrictEqual(toCriteria('has:drive'), { folder: 'all', criteria: { all: true }, post: {} });
assert.deepStrictEqual(toCriteria('filename:Poster.PDF').post, { filename: 'poster.pdf' });

// in: / label: pick the folder
assert.strictEqual(toCriteria('in:Sent thanks').folder, 'sent');
assert.deepStrictEqual(crit('in:Sent thanks'), { text: 'thanks' });
assert.strictEqual(toCriteria('label:Projects').folder, 'projects');

// sizes: bytes, k, m, g, with or without b, decimals; a bad size is left out
assert.deepStrictEqual(crit('larger:5M'), { larger: 5 * 1048576 });
assert.deepStrictEqual(crit('smaller:100kb'), { smaller: 102400 });
assert.deepStrictEqual(crit('larger:1.5mb smaller:2G'), { larger: 1572864, smaller: 2 * 1073741824 });
assert.deepStrictEqual(crit('larger:10'), { larger: 10 });
assert.deepStrictEqual(crit('larger:huge'), { all: true });

// dates: the day typed, the same in every time zone (IMAP dates have none)
for (const tz of ['America/Los_Angeles', 'UTC', 'Europe/Helsinki', 'Asia/Tokyo']) {
  process.env.TZ = tz;
  const june1 = new Date(Date.UTC(2025, 5, 1));
  for (const typed of ['2025/06/01', '2025/6/1', '2025-06-01', '2025-6-1', '06/01/2025'])
    assert.deepStrictEqual(crit(`before:${typed}`), { before: june1 }, `${tz} before:${typed}`);
  assert.deepStrictEqual(crit('after:2025/6/1'), { since: june1 }, tz);
  assert.deepStrictEqual(crit('after:2025/01/01 before:2025/02/01'), {
    since: new Date(Date.UTC(2025, 0, 1)),
    before: new Date(Date.UTC(2025, 1, 1)),
  });
}

assert.ok(Number.isNaN(crit('before:yesterday').before.getTime())); // imapflow leaves an invalid date out
assert.deepStrictEqual(crit('older_than:3d'), { before: new Date(NOW - 3 * DAY) });
assert.deepStrictEqual(crit('newer_than:2w'), { since: new Date(NOW - 14 * DAY) });
assert.deepStrictEqual(crit('newer_than:1m'), { since: new Date(NOW - 30 * DAY) });
assert.deepStrictEqual(crit('older_than:1y'), { before: new Date(NOW - 365 * DAY) });
assert.deepStrictEqual(crit('older_than:soon'), { all: true });

// everything together
assert.deepStrictEqual(toCriteria('in:inbox from:maya is:unread -is:starred larger:1m thesis -draft has:attachment'), {
  folder: 'inbox',
  criteria: { from: 'maya', seen: false, flagged: false, larger: 1048576, text: 'thesis', not: { text: 'draft' } },
  post: { hasAtt: true },
});

// ---------- searching a mailbox ----------
const maya = { name: 'Maya', address: 'maya@example.edu' };
const news = { name: 'News', address: 'hi@news.example' };
const outlook = { email: 'me@example.edu', provider: 'microsoft' };
const gmail = { email: 'me@gmail.example', provider: 'google' };
const subjects = (r) => r.map((t) => t.subject).join(' | ');

const reset = () => {
  boxes = {
    INBOX: [
      msg(1, 'Thesis ch 3', maya, NOW - 5 * DAY, { att: 'Chapter3.pdf' }),
      msg(2, 'Weekly news', news, NOW - DAY, { list: true }),
    ],
    Archive: [msg(11, 'Old thesis notes', maya, NOW - 40 * DAY)],
    Sent: [msg(21, 'Re: Thesis ch 3', { name: 'Me', address: 'me@example.edu' }, NOW - 2 * DAY)],
    '[Gmail]/All Mail': [msg(31, 'Gmail thesis', maya, NOW - DAY)],
  };
  searched = [];
  failing = null;
};

(async () => {
  // Outlook: inbox, Done (Archive) and Sent, newest first; accents folded away (Exchange needs that)
  reset();
  assert.strictEqual(
    subjects(await mail.search(outlook, 'Isomöttönen')),
    'Weekly news | Re: Thesis ch 3 | Thesis ch 3 | Old thesis notes',
  );
  assert.deepStrictEqual(searched, [
    ['INBOX', { text: 'Isomottonen' }],
    ['Archive', { text: 'Isomottonen' }],
    ['Sent', { text: 'Isomottonen' }],
  ]);

  // in: searches that folder only
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, 'in:sent thanks')), 'Re: Thesis ch 3');
  assert.deepStrictEqual(searched, [['Sent', { text: 'thanks' }]]);
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, 'in:done')), 'Old thesis notes');

  // has:attachment / filename: / is:list narrow the server's answer
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, 'has:attachment')), 'Thesis ch 3');
  reset();
  assert.strictEqual(
    subjects(await mail.search(outlook, '-has:attachment')),
    'Weekly news | Re: Thesis ch 3 | Old thesis notes',
  );
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, 'filename:chapter3')), 'Thesis ch 3');
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, 'filename:docx')), '');
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, 'is:list')), 'Weekly news');
  reset();
  assert.strictEqual(subjects(await mail.search(outlook, '-is:list in:inbox')), 'Thesis ch 3');

  // Archive or Sent failing still shows what the inbox found; the inbox failing is an error
  reset();
  failing = 'Sent';
  assert.strictEqual(subjects(await mail.search(outlook, 'thesis')), 'Weekly news | Thesis ch 3 | Old thesis notes');
  reset();
  failing = 'INBOX';
  await assert.rejects(mail.search(outlook, 'thesis'), /server said no/);

  // Gmail understands the words itself: one search of All Mail, sent as typed
  reset();
  assert.strictEqual(subjects(await mail.search(gmail, 'from:maya has:attachment Isomöttönen')), 'Gmail thesis');
  assert.deepStrictEqual(searched, [['[Gmail]/All Mail', { gmraw: 'from:maya has:attachment Isomöttönen' }]]);
  console.log('mail search ok');
})();
