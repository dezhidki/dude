// Run: node threads.test.js
const assert = require('node:assert');
const { group, chainIds } = require('./threads');
const m = (uid, messageId, headers, subject = 'Same subject', date = uid) => ({ uid, messageId, chain: chainIds(headers), subject, date, from: {}, snippet: '' });
const msgs = [
  m(1, '<a@x>', ''),
  m(2, '<b@x>', 'In-Reply-To: <a@x>\r\nReferences: <a@x>'),
  m(3, '<c@x>', 'References: <a@x>\r\n <b@x>'),            // folded header
  m(4, '<d@x>', ''),                                       // same subject, unrelated
  m(5, '<e@x>', 'Thread-Index: AdtXyZ1234567890abcdefghijklmnopq'),
  m(6, '<f@x>', 'Thread-Index: AdtXyZ1234567890abcdefghijklmnopqrstuvAAAA'),
];
const g = group(msgs, 'INBOX');
const sizes = g.map(t => t.count).sort();
assert.deepStrictEqual(sizes, [1, 2, 3], JSON.stringify(g.map(t => t.uids)));
assert.ok(g.every(t => !('chain' in t)));
assert.strictEqual(g.find(t => t.count === 3).uids.sort().join(), '1,2,3');
console.log('threads ok');
