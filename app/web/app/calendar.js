// ---------- calendar ----------
// Real calendar events (Microsoft 365 via EWS after "connect", Google directly), a day at a time,
// refreshed when older than 5 minutes; your local events show too.

import { onSettled } from 'solid-js';
import { parseWhen } from '../when.js';
import { act } from './actions.js';
import { leaveCompose, meAddr, stashReply } from './compose.js';
import { B, change, DAY, dayStart, errText, LS, M, minus, now, plus, root, S, ticks, toast } from './core.js';
import { refreshCal, render } from './render.jsx';
import { SET } from './settings.jsx';
import { addDays, dayEnd, HPX, weekStartOf } from './week.jsx';

export const calKey = (t) => new Date(t).toDateString();

async function calStatus() {
  if (!B.calStatus) return null;
  if (!S.cal.status) {
    let st;
    try {
      st = await B.calStatus();
    } catch {
      st = { connected: false, canConnect: false };
    }
    change(() => {
      S.cal.status = st;
    });
    if (!S.cal.status.connected && S.cal.status.canConnect && (S.pane === 'calendar' || S.eventForm)) refreshCal(); // show the "connect" prompt
  }
  return S.cal.status;
}

// Days are fetched a range at a time (the week, or the day beside the mail) and kept 5 minutes.
export function ensureCalDay(force) {
  return S.screen === 'calendar' ? ensureCalRange(weekStartOf(S.calDay), 7, force) : ensureCalRange(S.calDay, 1, force);
}

async function ensureCalRange(from, n, force) {
  const st = await calStatus();
  if (!st?.connected || !B.calEvents) return;
  const days = Array.from({ length: n }, (_, i) => addDays(from, i));
  const need = days.filter((t) => {
    const h = S.cal.days.get(calKey(t));
    return !S.cal.loading.has(calKey(t)) && (force || !h || Date.now() - h.at > 5 * 60e3);
  });
  if (!need.length) return;
  change(() =>
    need.forEach((t) => {
      S.cal.loading = plus(S.cal.loading, calKey(t));
    }),
  );
  let list, failed;
  try {
    list = await B.calEvents(need[0], dayEnd(need[need.length - 1]));
  } catch (e) {
    failed = String(e.message || e);
  }
  change(() => {
    if (failed === undefined) {
      need.forEach((t) => {
        const e = dayEnd(t);
        S.cal.days = plus(S.cal.days, calKey(t), {
          at: Date.now(),
          list: list.filter((x) => x.start < e && x.end > t),
        });
      });
      S.cal.error = null;
    } else if (/CAL_SIGNIN_NEEDED|CAL_NOT_CONNECTED/.test(failed)) {
      S.cal.status = { connected: false, canConnect: true };
      S.cal.error = 'calendar login gone. connect again.';
    } else S.cal.error = 'calendar no load.';
    need.forEach((t) => {
      S.cal.loading = minus(S.cal.loading, calKey(t));
    });
  });
  redrawCal();
}

function redrawCal() {
  if (S.screen === 'calendar' || S.pane === 'calendar' || S.eventForm || invOf()) refreshCal();
}

export async function connectCalendar() {
  toast('login window…');
  try {
    await B.calConnect();
    change(() => {
      S.cal.status = { connected: true, canConnect: true };
      S.cal.days = new Map();
      S.cal.error = null;
    });
    toast('calendar linked.');
    ensureCalDay(true);
    render();
  } catch (e) {
    toast(`calendar link fail: ${errText(e)}`, 8000);
  }
}

export const events = () => LS.get('events', []);

export function eventDialog(at = {}) {
  const t = S.screen === 'thread' ? S.open : null;
  const guests = new Set();
  if (t)
    S.msgs.forEach((m) => {
      [m.from, ...(m.to || []), ...(m.cc || [])].forEach((p) => {
        if (p?.address && p.address.toLowerCase() !== meAddr()) guests.add(p.address);
      });
    });
  S.eventForm = {
    title: t ? t.subject.replace(/^((re|fwd?|vs|aw|sv):\s*)+/i, '') : '',
    guests: [...guests].join(', '),
    when: '',
    where: '',
    notes: '',
    start: at.start,
    end: at.end,
    fresh: true,
  };
  M.paneBefore = S.pane;
  if (S.screen !== 'calendar') S.pane = 'calendar';
  render();
  onSettled(() => {
    root.querySelector('[data-e="title"]')?.focus();
  });
}

// When the event is: the typed time, else the next half hour; 30 minutes unless a length is typed.
export function eventTimes(f) {
  if (!f.when.trim() && f.start) return { ok: true, start: f.start, end: f.end || f.start + 30 * 60e3 };
  const p = f.when.trim() ? parseWhen(f.when, new Date(now()), 9) : null;
  const start = p
    ? p.start
    : (() => {
        const d = new Date(now());
        d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
        return d.getTime();
      })();
  return { ok: !f.when.trim() || !!p, start, end: start + (p?.minutes || 30) * 60e3 };
}

export function closeEvent() {
  S.eventForm = null;
  M.invFor = null;
  if (S.screen !== 'calendar') S.pane = M.paneBefore || S.pane;
  render();
}

export async function saveEvent() {
  const f = S.eventForm;
  if (!f) return;
  const tm = eventTimes(f);
  if (!f.title.trim()) {
    toast('event need name.');
    root.querySelector('[data-e="title"]')?.focus();
    return;
  }
  if (!tm.ok) {
    toast('time? like “tomorrow 2 pm 30 min”');
    return;
  }
  const ev = {
    id: `ev${Date.now()}`,
    title: f.title.trim(),
    start: tm.start,
    end: tm.end,
    where: f.where,
    notes: f.notes,
    guests: f.guests.match(/[^\s<>,;"]+@[^\s<>,;"]+/g) || [],
  };
  S.eventForm = null;
  S.calDay = dayStart(ev.start);
  M.calScroll = undefined;
  if (S.screen !== 'calendar') {
    S.pane = 'calendar';
    LS.set('pane', S.pane);
  }
  if (f.id) {
    // a change to an event that exists
    if (!f.server) {
      LS.set(
        'events',
        events().map((x) => (x.id === f.id ? { ...x, ...ev, id: x.id } : x)),
      );
      toast('event changed.');
      return render();
    }
    render();
    try {
      await B.calUpdate(f.id, { ...ev, guests: f.guestsTouched ? ev.guests : undefined, attendees: f.attendees });
      toast('event changed.');
    } catch (e) {
      toast(`change fail: ${errText(e)}`, 8000);
    }
    change(() => {
      S.cal.days = new Map();
    });
    ensureCalDay(true);
    return;
  }
  const st = await calStatus();
  if (st?.connected) {
    // straight into your real calendar; the calendar service sends the invitations
    render();
    try {
      await B.calCreate(ev);
      ensureCalDay(true);
      toast(
        ev.guests.length
          ? `event in calendar. ${ev.guests.length} invite${ev.guests.length > 1 ? 's' : ''} sent.`
          : 'event in calendar.',
      );
      return;
    } catch (e) {
      if (/CAL_SIGNIN_NEEDED/.test(String(e.message)))
        change(() => {
          S.cal.status = { connected: false, canConnect: true };
        });
      toast('calendar no take it. sending invite by mail.');
    }
  }
  LS.set('events', [...events(), ev]);
  render();
  try {
    await B.invite(ev);
    toast(
      ev.guests.length
        ? `invite sent. ${ev.guests.length} ${ev.guests.length > 1 ? 'guests' : 'guest'}.`
        : 'event made. invite in your mail.',
    );
  } catch (e) {
    toast(`event kept. invite fail: ${e.message || e}`);
  }
}

export function dayMove(d) {
  S.calDay = dayStart(S.calDay + d * DAY + 2 * 3600e3);
  render();
}

function findEvent(id) {
  for (const d of S.cal.days.values()) {
    const x = (d.list || []).find((e) => String(e.id) === id);
    if (x) return x;
  }
  return events().find((e) => String(e.id) === id) || null;
}

const RESP = { Accept: 'yes', Tentative: 'maybe', Decline: 'no' };

// An event you click: yours open to change; other people's meetings show what they are, to answer.
export async function openEvent(id) {
  if (id === 'inv') return; // the invitation's own box answers it
  const x = findEvent(id);
  if (!x) return;
  const readOnly = !!(x.server && x.isMeeting && !x.isOrganizer);
  S.eventForm = {
    id: String(x.id),
    server: !!x.server,
    title: x.title,
    when: '',
    start: x.start,
    end: x.end,
    where: x.where || '',
    notes: x.notes || '',
    guests: (x.guests || []).join(', '),
    organizer: x.organizer || '',
    response: x.response,
    readOnly,
    said: RESP[x.response] || '',
    fresh: true,
  };
  M.paneBefore = S.pane;
  if (S.screen !== 'calendar') S.pane = 'calendar';
  render();
  const f = S.eventForm;
  if (!x.server || !B.calDetail) return;
  try {
    const d = await B.calDetail(f.id);
    if (S.eventForm !== f || !d || f.dirty) return;
    const orgMail = String(d.organizer?.email || '').toLowerCase();
    const others = (d.attendees || []).filter(
      (a) => String(a.email).toLowerCase() !== meAddr() && (!readOnly || String(a.email).toLowerCase() !== orgMail),
    );
    change(() => {
      f.notes = d.notes || '';
      f.attendees = d.attendees;
      f.guests = readOnly ? others.map((a) => a.name || a.email).join(', ') : others.map((a) => a.email).join(', ');
      if (d.organizer) f.organizer = d.organizer.name || d.organizer.email;
      f.fresh = false; // filled in: no sliding in again
    });
  } catch {}
}

export async function deleteEvent() {
  const f = S.eventForm;
  if (!f?.id || f.readOnly) return;
  S.eventForm = null;
  if (!f.server) {
    LS.set(
      'events',
      events().filter((x) => x.id !== f.id),
    );
    toast('event gone.');
    return render();
  }
  S.cal.days = new Map(
    [...S.cal.days].map(([k, d]) => [k, { ...d, list: (d.list || []).filter((x) => String(x.id) !== f.id) }]),
  );
  render();
  try {
    await B.calDelete(f.id);
    toast('event gone.');
  } catch (e) {
    toast(`delete fail: ${errText(e)}`, 8000);
  }
  change(() => {
    S.cal.days = new Map();
  });
  ensureCalDay(true);
}

export async function answerEvent(ans) {
  const f = S.eventForm;
  if (!f?.readOnly || !B.rsvp) return;
  const before = f.said;
  f.said = ans; // the buttons follow it
  toast('telling…');
  try {
    await B.rsvp(
      S.account && S.account.provider === 'google' ? { gid: f.id, title: f.title } : { ews: f.id, title: f.title },
      ans,
      S.account?.name || '',
    );
    toast(`${{ yes: 'going.', maybe: 'maybe.', no: 'not going.' }[ans]} organizer told.`);
    change(() => {
      S.cal.days = new Map();
    });
    ensureCalDay(true);
  } catch (e) {
    change(() => {
      f.said = before;
    });
    toast(`rsvp fail: ${errText(e)}`, 8000);
  }
}

// Mail and calendar: 1 and 2, like the two buttons on the left.
export function goCal() {
  if (S.screen === 'calendar') return;
  if (S.screen === 'compose') leaveCompose();
  if (S.screen === 'thread') stashReply();
  M.calFrom = { screen: S.screen === 'thread' ? 'thread' : 'list', open: S.open, msgs: S.msgs };
  S.composer = null;
  S.eventForm = null;
  S.mmMonth = null;
  M.calScroll = undefined;
  S.screen = 'calendar';
  render();
}

export function goMail() {
  if (S.screen !== 'calendar') return;
  const b = M.calFrom || { screen: 'list' };
  S.eventForm = null;
  S.screen = b.screen === 'thread' && b.open ? 'thread' : 'list';
  if (S.screen === 'thread') {
    S.open = b.open;
    S.msgs = b.msgs;
  }
  render();
}

export function weekMove(n) {
  S.calDay = addDays(weekStartOf(S.calDay), 7 * n);
  S.mmMonth = null;
  render();
}

export function calToday() {
  S.calDay = dayStart(Date.now());
  S.mmMonth = null;
  M.calScroll = undefined;
  render();
}

export function setCalOpt(k, v) {
  LS.set(`cal:${k}`, v);
  S.mmMonth = null;
  render();
}

// Pressing on an empty spot of a day makes an event there; dragging sets how long (15-minute steps).
export function startDrag(e, day) {
  if (e.button !== 0 || e.target.closest('.cal-ev')) return;
  const col = e.currentTarget;
  e.preventDefault();
  const at = (y) => {
    const r = col.getBoundingClientRect(),
      m = Math.max(0, Math.min(24 * 60, Math.floor(((y - r.top) / HPX) * 4) * 15)),
      d = new Date(day);
    d.setMinutes(m);
    return d.getTime();
  };
  const a = at(e.clientY);
  let b = a + 30 * 60e3,
    moved = false;
  // the block being drawn: week.jsx shows S.drag in its day
  const draw = () =>
    change(() => {
      S.drag = { day, start: Math.min(a, b), end: Math.max(b, a + 15 * 60e3) };
    });
  draw();
  const move = (ev) => {
    if (Math.abs(ev.clientY - e.clientY) > 4) moved = true;
    if (moved) {
      b = at(ev.clientY + HPX / 8);
      if (b <= a) b = a + 15 * 60e3;
      draw();
    }
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    change(() => {
      S.drag = null;
      eventDialog({ start: a, end: moved ? Math.max(b, a + 15 * 60e3) : a + 30 * 60e3 });
    });
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// ---------- invitations ----------
const ANS = { ACCEPTED: 'yes', TENTATIVE: 'maybe', DECLINED: 'no' };

export function invIdx() {
  if (S.screen !== 'thread') return -1;
  for (let i = S.msgs.length - 1; i >= 0; i--)
    if (S.msgs[i].invite && !S.msgs[i].invite.cancelled && !S.msgs[i].invite.pending) return i;
  return -1;
}

export const invOf = () => {
  const i = invIdx();
  return i < 0 ? null : S.msgs[i].invite;
};

export function rsvpOf(v) {
  const said = LS.get('rsvp', {})[v.uid || v.ews];
  if (said) return said;
  const mine = (v.attendees || []).find((a) => String(a.email).toLowerCase() === meAddr());
  return ANS[v.my] || (mine ? ANS[mine.status] || '' : '');
}

const meetings = new Map(); // Outlook item id -> invitation read from the calendar
export const meetingOf = (id) => {
  ticks(); // filled in outside the store
  return meetings.get(id);
};

async function fillMeeting(m) {
  const id = m.invite.ews;
  if (meetings.has(id)) {
    const got = meetings.get(id);
    if (got && typeof got === 'object') m.invite = got;
    return;
  }
  // the conversation may have been reloaded meanwhile: find its message by the invite's id
  const redraw = () =>
    change(() => {
      for (const x of S.msgs) {
        const got = meetings.get(id);
        if (x.invite?.ews === id && got && typeof got === 'object') x.invite = got;
      }
    });
  const st = await calStatus();
  if (!st?.connected || !B.meeting) return redraw(); // shows "connect"
  meetings.set(id, 'busy');
  try {
    const got = await B.meeting(id);
    meetings.set(id, got || 'fail');
  } catch {
    meetings.set(id, 'fail');
  }
  redraw();
  if (S.screen === 'thread' && invOf() && invOf().ews === id) render(); // its day beside it
}

// An Outlook invite on screen (in an open message) is read from the calendar: render() asks.
export function readInvites() {
  if (S.screen !== 'thread') return;
  const st = S.cal.status;
  S.msgs.forEach((m, i) => {
    if (m.draft || !S.expanded.has(i) || !m.invite?.pending) return;
    if (!(st && !st.connected) && meetings.get(m.invite.ews) !== 'fail') fillMeeting(m);
  });
}

export async function answerInvite(i, ans) {
  // the button's message, or (if the conversation was reloaded meanwhile) the newest invitation in it
  let m = S.msgs[i];
  if (!m?.invite) {
    i = invIdx();
    m = S.msgs[i];
  }
  let v = m?.invite;
  if (!v) return toast('no invite here.');
  if (!B.rsvp) return toast('no answer in this mode.');
  if (v.cancelled) return toast('event cancelled. nothing to answer.');
  if (v.pending) {
    // an Outlook invite still being read: read it now
    try {
      const got = await B.meeting(v.ews);
      if (got) {
        meetings.set(v.ews, got);
        change(() => {
          m.invite = got;
        });
        v = m.invite;
      }
    } catch (e) {
      return toast(`invite no read: ${errText(e)}`, 8000);
    }
    if (!v || v.pending) return toast('invite no read. link calendar first.', 8000);
  }
  const before = LS.get('rsvp', {})[v.uid || v.ews];
  const key = v.uid || v.ews,
    keep = (x) => {
      const map = LS.get('rsvp', {});
      if (x) map[key] = x;
      else delete map[key];
      LS.set('rsvp', map);
    };
  keep(ans); // the buttons follow what's kept

  toast('telling…');
  try {
    const r = await B.rsvp(v, ans, S.account?.name || '');
    toast(
      { yes: 'going.', maybe: 'maybe.', no: 'not going.' }[ans] +
        (r && r.via === 'calendar' ? ' calendar updated.' : ' organizer told.'),
    );
    if (SET().rsvpAndDone && S.open) act('done', [S.open], true);
    change(() => {
      S.cal.days = new Map();
    });
    ensureCalDay(true);
  } catch (e) {
    keep(before);
    toast(`rsvp fail: ${errText(e)}`, 8000);
  }
}
