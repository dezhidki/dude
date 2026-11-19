// Smallest check for the invitation builder: run with `npm test`.
const assert = require('node:assert');
const { buildInvite } = require('./ics');
const ev = { id: 'ev1', title: 'Thesis, chapter 3; review', start: Date.UTC(2026, 10, 19, 12), end: Date.UTC(2026, 10, 19, 13), where: 'Room T2', notes: 'Line 1\nLine 2 ' + 'x'.repeat(120), guests: ['a@example.org'] };
const raw = buildInvite(ev, 'me@example.edu');
const ics = raw.replace(/\r\n /g, ''); // unfold
assert.match(ics, /METHOD:REQUEST\r\n/);
assert.match(ics, /DTSTART:20261119T120000Z\r\n/);
assert.match(ics, /SUMMARY:Thesis\\, chapter 3\\; review\r\n/);
assert.match(ics, /ATTENDEE;[^\r]*mailto:a@example.org/);
assert.ok(raw.split('\r\n').every(l => Buffer.byteLength(l) <= 75), 'lines folded');
assert.match(buildInvite({ ...ev, guests: [] }, 'me@example.edu').replace(/\r\n /g, ''), /ATTENDEE;[^\r]*mailto:me@example.edu/);
console.log('ics ok');
