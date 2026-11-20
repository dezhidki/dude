// Reading a calendar invitation (text/calendar, iCalendar) and writing the RSVP answer (iMIP REPLY).
// Times are turned into real moments: UTC ("…Z"), named time zones (IANA, or the Windows names
// Outlook uses), or the invitation's own VTIMEZONE offset. Tested by invite.test.js.
const { stamp, text: esc } = require('./ics');

const WIN_TZ = {
  'FLE Standard Time': 'Europe/Helsinki',
  'W. Europe Standard Time': 'Europe/Berlin',
  'Central Europe Standard Time': 'Europe/Budapest',
  'Central European Standard Time': 'Europe/Warsaw',
  'Romance Standard Time': 'Europe/Paris',
  'GMT Standard Time': 'Europe/London',
  'GTB Standard Time': 'Europe/Athens',
  'E. Europe Standard Time': 'Europe/Chisinau',
  'Russian Standard Time': 'Europe/Moscow',
  'Eastern Standard Time': 'America/New_York',
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
  UTC: 'UTC',
  'Greenwich Standard Time': 'Atlantic/Reykjavik',
  'China Standard Time': 'Asia/Shanghai',
  'Tokyo Standard Time': 'Asia/Tokyo',
  'India Standard Time': 'Asia/Kolkata',
  'AUS Eastern Standard Time': 'Australia/Sydney',
  'Singapore Standard Time': 'Asia/Singapore',
};

function unfold(text) {
  return String(text || '').replace(/\r?\n[ \t]/g, '');
}

function lines(text) {
  return unfold(text)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/); // first ":" outside quotes
      const head = l.slice(0, i),
        value = l.slice(i + 1);
      const [name, ...ps] = head.split(';');
      const params = {};
      ps.forEach((p) => {
        const j = p.indexOf('=');
        if (j > 0) params[p.slice(0, j).toUpperCase()] = p.slice(j + 1).replace(/^"|"$/g, '');
      });
      return { name: name.toUpperCase(), params, value };
    });
}

const text = (v) =>
  String(v || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\([,;\\])/g, '$1');

// Offset (minutes east of UTC) of an IANA zone at a moment.
function zoneOffset(zone, t) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t) / 60e3;
}

function when(prop, tzOffsets) {
  if (!prop) return null;
  const v = prop.value,
    m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  if (!m[4]) return { t: new Date(+m[1], +m[2] - 1, +m[3]).getTime(), allDay: true }; // a date: local midnight
  if (m[7]) return { t: wall };
  const tzid = prop.params.TZID;
  const zone = tzid && (WIN_TZ[tzid] || (/^[A-Za-z]+\/[A-Za-z_]+/.test(tzid) ? tzid : null));
  if (zone) {
    try {
      let t = wall - zoneOffset(zone, wall) * 60e3;
      t = wall - zoneOffset(zone, t) * 60e3;
      return { t };
    } catch {}
  }
  if (tzid && tzOffsets[tzid] != null) return { t: wall - tzOffsets[tzid] * 60e3 };
  return { t: new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime() }; // floating: your time
}

function parseInvite(ics) {
  const ls = lines(ics);
  const method = ls.find((l) => l.name === 'METHOD')?.value || '';
  // VTIMEZONE: use its STANDARD offset as a last resort
  const tzOffsets = {};
  let curTz = null,
    inStd = false;
  for (const l of ls) {
    if (l.name === 'BEGIN' && l.value === 'VTIMEZONE') curTz = '';
    else if (curTz !== null && l.name === 'TZID') curTz = l.value;
    else if (l.name === 'BEGIN' && l.value === 'STANDARD') inStd = true;
    else if (l.name === 'END' && l.value === 'STANDARD') inStd = false;
    else if (inStd && curTz && l.name === 'TZOFFSETTO') {
      const m = /^([+-])(\d{2})(\d{2})$/.exec(l.value);
      if (m) tzOffsets[curTz] = (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]);
    } else if (l.name === 'END' && l.value === 'VTIMEZONE') curTz = null;
  }
  const s = ls.findIndex((l) => l.name === 'BEGIN' && l.value === 'VEVENT'),
    e = ls.findIndex((l, i) => i > s && l.name === 'END' && l.value === 'VEVENT');
  if (s < 0) return null;
  const ev = ls.slice(s + 1, e < 0 ? undefined : e);
  const get = (n) => ev.find((l) => l.name === n);
  const person = (l) => ({
    email: String(l.value).replace(/^mailto:/i, ''),
    name: l.params.CN || '',
    status: (l.params.PARTSTAT || '').toUpperCase(),
  });
  const start = when(get('DTSTART'), tzOffsets),
    end = when(get('DTEND'), tzOffsets);
  return {
    method: method.toUpperCase(),
    uid: get('UID')?.value || '',
    sequence: +(get('SEQUENCE')?.value || 0),
    title: text(get('SUMMARY')?.value) || '(no title)',
    where: text(get('LOCATION')?.value),
    start: start ? start.t : null,
    end: end ? end.t : start && start.t + (start.allDay ? 864e5 : 3600e3),
    allDay: !!start?.allDay,
    organizer: get('ORGANIZER') ? person(get('ORGANIZER')) : null,
    attendees: ev.filter((l) => l.name === 'ATTENDEE').map(person),
    cancelled: method.toUpperCase() === 'CANCEL' || /CANCELLED/i.test(get('STATUS')?.value || ''),
  };
}

// The answer: METHOD:REPLY with your PARTSTAT, for the organiser (RFC 5546 iMIP).
function buildReply(inv, me, myName, answer) {
  const part = { yes: 'ACCEPTED', maybe: 'TENTATIVE', no: 'DECLINED' }[answer];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//dude//EN',
    'METHOD:REPLY',
    'BEGIN:VEVENT',
    `UID:${inv.uid}`,
    `SEQUENCE:${inv.sequence || 0}`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(inv.start)}`,
    `DTEND:${stamp(inv.end)}`,
    `SUMMARY:${esc(inv.title)}`,
    inv.organizer
      ? `ORGANIZER${inv.organizer.name ? `;CN="${inv.organizer.name.replace(/"/g, '')}"` : ''}:mailto:${inv.organizer.email}`
      : null,
    `ATTENDEE;PARTSTAT=${part}${myName ? `;CN="${myName.replace(/"/g, '')}"` : ''}:mailto:${me}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `${lines.join('\r\n')}\r\n`;
}

module.exports = { parseInvite, buildReply };
