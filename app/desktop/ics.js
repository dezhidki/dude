// Builds an iCalendar invitation (RFC 5545 / iMIP REQUEST) that Outlook and Google Calendar accept.
const stamp = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const text = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Lines longer than 75 octets are folded with CRLF + space.
function fold(line) {
  const out = []; let cur = '';
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > (out.length ? 74 : 75)) { out.push(cur); cur = ''; }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function buildInvite(ev, organizer) {
  const attendees = ev.guests.length ? ev.guests : [organizer];
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dude//EN', 'CALSCALE:GREGORIAN', 'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${ev.id}@dude.mail`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(ev.start)}`,
    `DTEND:${stamp(ev.end)}`,
    `SUMMARY:${text(ev.title)}`,
    ...(ev.where ? [`LOCATION:${text(ev.where)}`] : []),
    ...(ev.notes ? [`DESCRIPTION:${text(ev.notes)}`] : []),
    `ORGANIZER:mailto:${organizer}`,
    ...attendees.map(a => `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`),
    'SEQUENCE:0', 'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

module.exports = { buildInvite, stamp, text };
