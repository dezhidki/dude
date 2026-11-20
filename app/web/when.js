// Understands typed times like Superhuman: "8 am", "3 days", "2h", "tomorrow 2 pm 30 min",
// "mon 9:30", "aug 7", "next week". Returns { start, minutes } or null. Also loaded by when.test.js.
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const UNIT = {
  m: 60e3,
  min: 60e3,
  mins: 60e3,
  minute: 60e3,
  minutes: 60e3,
  h: 3600e3,
  hr: 3600e3,
  hrs: 3600e3,
  hour: 3600e3,
  hours: 3600e3,
  d: 864e5,
  day: 864e5,
  days: 864e5,
  w: 6048e5,
  wk: 6048e5,
  week: 6048e5,
  weeks: 6048e5,
  mo: 2592e6,
  month: 2592e6,
  months: 2592e6,
};

function parseWhen(text, now = new Date(), defaultHour = 8) {
  let s =
    ' ' +
    String(text || '')
      .toLowerCase()
      .replace(/[,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() +
    ' ';
  if (!s.trim()) return null;
  let minutes = null,
    day = null,
    hour = null,
    minute = 0,
    rel = null;
  const take = (re) => {
    const m = s.match(re);
    if (m) s = s.replace(m[0], ' ');
    return m;
  };

  // A length ("for 1 hour", or "30 min" next to a real time) is the event's duration.
  const DUR = '(\\d+(?:\\.\\d+)?) ?(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)';
  let m = take(new RegExp(` for ${DUR} `));
  if (
    !m &&
    /(am|pm|\d:\d\d|noon|tomorrow|today|mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(
      s,
    )
  )
    m = take(new RegExp(` ${DUR} (?!(am|pm))`));
  if (m) minutes = Math.round((parseFloat(m[1]) * UNIT[m[2]]) / 60e3);

  m = take(
    / (?:in )?(\d+(?:\.\d+)?) ?(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|week|weeks|mo|month|months) /,
  );
  if (m) rel = parseFloat(m[1]) * UNIT[m[2]];
  m = take(/ (\d{1,2})(?::(\d{2}))? ?(am|pm) /) || take(/ (\d{1,2}):(\d{2}) /);
  if (m) {
    hour = (+m[1] % (m[3] ? 12 : 24)) + (m[3] === 'pm' ? 12 : 0);
    minute = +(m[2] || 0);
  } else if (take(/ (noon|midday) /)) hour = 12;
  else if (take(/ (tonight|evening) /)) {
    hour = 19;
    day = day ?? 0;
  } else if (take(/ morning /)) hour = 8;

  const base = new Date(now);
  base.setSeconds(0, 0);
  if (take(/ today /)) day = 0;
  if (take(/ tomorrow /)) day = 1;
  if (take(/ (next week) /)) {
    const d = (8 - base.getDay()) % 7 || 7;
    day = d;
  }
  if (take(/ (this )?weekend /)) {
    const d = (6 - base.getDay() + 7) % 7 || 7;
    day = d;
  }
  m = take(/ (?:next |on )?(sun|mon|tue|wed|thu|fri|sat)[a-z]* /);
  if (m) {
    const d = (DAYS.indexOf(m[1]) - base.getDay() + 7) % 7 || 7;
    day = d;
  }
  let date = null;
  m =
    take(/ (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2}) /) ||
    take(/ (\d{1,2}) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* /);
  if (m) {
    const named = Number.isNaN(+m[1]); // "aug 7" or "7 aug"
    const mon = MONTHS.indexOf(named ? m[1] : m[2]),
      dd = +(named ? m[2] : m[1]);
    date = new Date(base.getFullYear(), mon, dd);
    if (date < new Date(base.getFullYear(), base.getMonth(), base.getDate())) date.setFullYear(date.getFullYear() + 1);
  }
  if (s.replace(/ (at|on|in|for|next|this) /g, ' ').trim()) return null; // words we don't understand

  let start;
  if (rel != null && hour == null && day == null && !date) start = new Date(base.getTime() + rel);
  else {
    start = date ? new Date(date) : new Date(base);
    if (!date) start.setDate(start.getDate() + (day || 0));
    start.setHours(hour ?? defaultHour, hour == null ? 0 : minute, 0, 0);
    if (!date && day == null && start <= base) start.setDate(start.getDate() + 1); // "8 am" means the next 8 am
    if (rel != null) start = new Date(start.getTime() + rel);
  }
  return { start: start.getTime(), minutes };
}

export { parseWhen };
