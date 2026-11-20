// Run: node invite.test.js
const assert = require('node:assert');
const { parseInvite, buildReply } = require('./invite');

const outlook = [
  'BEGIN:VCALENDAR',
  'METHOD:REQUEST',
  'PRODID:Microsoft Exchange Server 2010',
  'VERSION:2.0',
  'BEGIN:VTIMEZONE',
  'TZID:FLE Standard Time',
  'BEGIN:STANDARD',
  'DTSTART:16010101T040000',
  'TZOFFSETFROM:+0300',
  'TZOFFSETTO:+0200',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:16010101T030000',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0300',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
  'BEGIN:VEVENT',
  'ORGANIZER;CN=Sara Lehtonen:mailto:sara@example.org',
  'ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=Mika Rantanen:mailto:mika@example.edu',
  'DESCRIPTION;LANGUAGE=en-US:Agenda:\\nfirst\\, then second',
  'UID:040000008200E00074C5B7101A82E0080000000',
  'SUMMARY;LANGUAGE=en-US:Course planning',
  'DTSTART;TZID=FLE Standard Time:20261118T083000',
  'DTEND;TZID=FLE Standard Time:20261118T090000',
  'SEQUENCE:2',
  'LOCATION;LANGUAGE=en-US:Teams\\, room T2',
  'STATUS:CONFIRMED',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const inv = parseInvite(outlook);
assert.strictEqual(inv.method, 'REQUEST');
assert.strictEqual(inv.title, 'Course planning');
assert.strictEqual(inv.where, 'Teams, room T2');
assert.strictEqual(new Date(inv.start).toISOString(), '2026-11-18T06:30:00.000Z'); // 08:30 Helsinki (UTC+2 in November)
assert.strictEqual(inv.end - inv.start, 30 * 60e3);
assert.strictEqual(inv.organizer.email, 'sara@example.org');
assert.strictEqual(inv.organizer.name, 'Sara Lehtonen');
assert.strictEqual(inv.attendees[0].status, 'NEEDS-ACTION');
assert.strictEqual(inv.sequence, 2);

// UTC times and summer time in an IANA zone
assert.strictEqual(
  new Date(
    parseInvite('BEGIN:VEVENT\nUID:a\nDTSTART:20260601T120000Z\nDTEND:20260601T130000Z\nEND:VEVENT').start,
  ).toISOString(),
  '2026-06-01T12:00:00.000Z',
);

assert.strictEqual(
  new Date(
    parseInvite('BEGIN:VEVENT\nUID:b\nDTSTART;TZID=Europe/Helsinki:20260601T120000\nEND:VEVENT').start,
  ).toISOString(),
  '2026-06-01T09:00:00.000Z',
);

// all-day
assert.ok(parseInvite('BEGIN:VEVENT\nUID:c\nDTSTART;VALUE=DATE:20261120\nEND:VEVENT').allDay);
// cancel
assert.ok(parseInvite('METHOD:CANCEL\nBEGIN:VEVENT\nUID:d\nDTSTART:20261120T100000Z\nEND:VEVENT').cancelled);
// reply
const r = buildReply(inv, 'mika@example.edu', 'Mika Rantanen', 'maybe');
assert.match(r, /METHOD:REPLY\r\n/);
assert.match(r, /UID:040000008200E00074C5B7101A82E0080000000\r\n/);
assert.match(r, /ATTENDEE;PARTSTAT=TENTATIVE;CN="Mika Rantanen":mailto:mika@example.edu/);
assert.match(r, /ORGANIZER;CN="Sara Lehtonen":mailto:sara@example.org/);
assert.match(r, /DTSTART:20261118T063000Z/);
console.log('invite ok');
