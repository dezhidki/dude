// Your real calendar. Microsoft 365: Exchange Web Services with Thunderbird's own client and its EWS
// scope (a separate "connect calendar" sign-in). Google: Calendar API with the calendar scope that
// Thunderbird's Google sign-in already asks for.
const { freshToken } = require('./oauth');

const EWS = 'https://outlook.office365.com/EWS/Exchange.asmx';
const GCAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const x = (s) =>
  String(s == null ? '' : s).replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  );
const unx = (s) =>
  String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/\r/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z');
// A refused calendar token: main.js then disconnects only the calendar.
const refused = (msg) => Object.assign(new Error(msg), { authenticationFailed: true });
const attendeesXml = (guests) =>
  `<t:RequiredAttendees>${guests.map((g) => `<t:Attendee><t:Mailbox><t:EmailAddress>${x(g)}</t:EmailAddress></t:Mailbox></t:Attendee>`).join('')}</t:RequiredAttendees>`;
const tag = (xml, name) => {
  const m = new RegExp(`<t:${name}(?:\\s[^>]*)?>([\\s\\S]*?)</t:${name}>`).exec(xml);
  return m ? unx(m[1]) : '';
};

function soap(body) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
<soap:Header><t:RequestServerVersion Version="Exchange2016"/><t:TimeZoneContext><t:TimeZoneDefinition Id="UTC"/></t:TimeZoneContext></soap:Header>
<soap:Body>${body}</soap:Body></soap:Envelope>`;
}

async function ews(acct, body) {
  const token = await freshToken(acct.cal);
  const r = await fetch(EWS, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      Authorization: `Bearer ${token}`,
      'X-AnchorMailbox': acct.email,
    },
    body: soap(body),
  });
  const text = await r.text();
  if (r.status === 401 || r.status === 403) throw refused(`calendar sign-in refused (${r.status})`);
  const err = /ResponseClass="Error"[\s\S]*?<m:MessageText>([\s\S]*?)<\/m:MessageText>/.exec(text);
  if (!r.ok || err) throw new Error(`calendar: ${err ? unx(err[1]) : `HTTP ${r.status}`}`);
  return text;
}

// Events between two times, oldest first: { id, title, start, end, allDay, where, organizer }.
function parseEws(xml) {
  const out = [];
  for (const m of xml.matchAll(/<t:CalendarItem>([\s\S]*?)<\/t:CalendarItem>/g)) {
    const it = m[1];
    out.push({
      id: (/<t:ItemId Id="([^"]+)"/.exec(it) || [])[1],
      title: tag(it, 'Subject') || '(no title)',
      start: Date.parse(tag(it, 'Start')),
      end: Date.parse(tag(it, 'End')),
      allDay: tag(it, 'IsAllDayEvent') === 'true',
      where: tag(it, 'Location'),
      organizer: tag(tag(it, 'Organizer') ? it.slice(it.indexOf('<t:Organizer>')) : '', 'Name'),
      response: tag(it, 'MyResponseType'),
      server: true,
      isMeeting: tag(it, 'IsMeeting') === 'true',
      isOrganizer: tag(it, 'MyResponseType') === 'Organizer' || tag(it, 'IsMeeting') !== 'true',
      cancelled: tag(it, 'IsCancelled') === 'true',
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

async function events(acct, from, to) {
  if (acct.provider === 'google') {
    const token = await freshToken(acct);
    const u = new URL(GCAL);
    Object.entries({
      timeMin: iso(from),
      timeMax: iso(to),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    }).forEach(([k, v]) => {
      u.searchParams.set(k, v);
    });
    const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 || r.status === 403) throw refused('calendar sign-in refused');
    if (!r.ok) throw new Error(`calendar: ${j.error?.message || r.status}`);
    return (j.items || [])
      .filter((e) => e.status !== 'cancelled')
      .map((e) => ({
        id: e.id,
        title: e.summary || '(no title)',
        where: e.location || '',
        organizer: (e.organizer && (e.organizer.displayName || e.organizer.email)) || '',
        allDay: !!e.start?.date,
        server: true,
        isMeeting: (e.attendees || []).length > 0,
        isOrganizer: !e.organizer || !!e.organizer.self,
        response: (() => {
          const me = (e.attendees || []).find((a) => a.self);
          return me
            ? { accepted: 'Accept', tentative: 'Tentative', declined: 'Decline', needsAction: 'NoResponseReceived' }[
                me.responseStatus
              ] || ''
            : 'Organizer';
        })(),
        start: Date.parse((e.start && (e.start.dateTime || `${e.start.date}T00:00:00`)) || 0),
        end: Date.parse((e.end && (e.end.dateTime || `${e.end.date}T00:00:00`)) || 0),
      }));
  }
  if (!acct.cal) throw new Error('CAL_NOT_CONNECTED');
  const xml = await ews(
    acct,
    `<m:FindItem Traversal="Shallow"><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape><t:AdditionalProperties>
    <t:FieldURI FieldURI="item:Subject"/><t:FieldURI FieldURI="calendar:Start"/><t:FieldURI FieldURI="calendar:End"/><t:FieldURI FieldURI="calendar:Location"/>
    <t:FieldURI FieldURI="calendar:IsAllDayEvent"/><t:FieldURI FieldURI="calendar:Organizer"/><t:FieldURI FieldURI="calendar:MyResponseType"/><t:FieldURI FieldURI="calendar:IsMeeting"/><t:FieldURI FieldURI="calendar:IsCancelled"/></t:AdditionalProperties></m:ItemShape>
    <m:CalendarView MaxEntriesReturned="250" StartDate="${iso(from)}" EndDate="${iso(to)}"/>
    <m:ParentFolderIds><t:DistinguishedFolderId Id="calendar"/></m:ParentFolderIds></m:FindItem>`,
  );
  return parseEws(xml);
}

// A new event in your calendar; guests get real invitations from the calendar service.
async function create(acct, ev) {
  if (acct.provider === 'google') {
    const token = await freshToken(acct);
    const r = await fetch(`${GCAL}?sendUpdates=all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: ev.title,
        location: ev.where || undefined,
        description: ev.notes || undefined,
        start: { dateTime: iso(ev.start) },
        end: { dateTime: iso(ev.end) },
        attendees: ev.guests.map((email) => ({ email })),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`calendar: ${j.error?.message || r.status}`);
    return { id: j.id };
  }
  if (!acct.cal) throw new Error('CAL_NOT_CONNECTED');
  const att = ev.guests.length ? attendeesXml(ev.guests) : '';
  const xml = await ews(
    acct,
    `<m:CreateItem SendMeetingInvitations="${ev.guests.length ? 'SendToAllAndSaveCopy' : 'SendToNone'}"><m:SavedItemFolderId><t:DistinguishedFolderId Id="calendar"/></m:SavedItemFolderId><m:Items>
    <t:CalendarItem><t:Subject>${x(ev.title)}</t:Subject><t:Body BodyType="Text">${x(ev.notes || '')}</t:Body><t:Start>${iso(ev.start)}</t:Start><t:End>${iso(ev.end)}</t:End>${ev.where ? `<t:Location>${x(ev.where)}</t:Location>` : ''}${att}</t:CalendarItem>
    </m:Items></m:CreateItem>`,
  );
  return { id: (/<t:ItemId Id="([^"]+)"/.exec(xml) || [])[1] };
}

// An Outlook meeting request by its item id: what the invitation says, as parseInvite gives it.
const STATUS = {
  Accept: 'ACCEPTED',
  Tentative: 'TENTATIVE',
  Decline: 'DECLINED',
  NoResponseReceived: 'NEEDS-ACTION',
  Unknown: 'NEEDS-ACTION',
  Organizer: 'ACCEPTED',
};
function parseMeeting(xml, id) {
  const it =
    /<t:(MeetingRequest|MeetingCancellation|MeetingMessage|CalendarItem)\b[^>]*>([\s\S]*?)<\/t:\1>/.exec(xml) || [];
  if (!it[2]) return null;
  const body = it[2];
  const box = (s) => ({ name: tag(s, 'Name'), email: tag(s, 'EmailAddress') });
  const org = /<t:Organizer>([\s\S]*?)<\/t:Organizer>/.exec(body);
  const attendees = [...body.matchAll(/<t:Attendee>([\s\S]*?)<\/t:Attendee>/g)].map((m) => ({
    ...box(m[1]),
    status: STATUS[tag(m[1], 'ResponseType')] || '',
  }));
  const my = (/<t:MyResponseType>([^<]*)</.exec(body) || [])[1];
  return {
    ews: id,
    method: it[1] === 'MeetingCancellation' ? 'CANCEL' : 'REQUEST',
    uid: tag(body, 'UID'),
    title: tag(body, 'Subject') || '(no title)',
    where: tag(body, 'Location'),
    start: Date.parse(tag(body, 'Start')),
    end: Date.parse(tag(body, 'End')),
    allDay: tag(body, 'IsAllDayEvent') === 'true',
    organizer: org ? box(org[1]) : null,
    attendees,
    my: STATUS[my] || '',
    cancelled: it[1] === 'MeetingCancellation' || tag(body, 'IsCancelled') === 'true',
  };
}
async function meeting(acct, id) {
  if (acct.provider !== 'microsoft' || !acct.cal) throw new Error('CAL_NOT_CONNECTED');
  const xml = await ews(
    acct,
    `<m:GetItem><m:ItemShape><t:BaseShape>AllProperties</t:BaseShape></m:ItemShape><m:ItemIds><t:ItemId Id="${x(id)}"/></m:ItemIds></m:GetItem>`,
  );
  return parseMeeting(xml, id);
}

// Answer an invitation in your own calendar, so it's marked there and the organiser hears back.
// Returns null when the calendar doesn't have that event (then it's answered by mail).
async function respond(acct, inv, answer) {
  const word = {
    yes: ['accepted', 'AcceptItem'],
    maybe: ['tentative', 'TentativelyAcceptItem'],
    no: ['declined', 'DeclineItem'],
  }[answer];
  if (!word || !inv || !(inv.uid || inv.ews || inv.gid)) throw new Error('bad answer');
  if (acct.provider === 'google') {
    const token = await freshToken(acct),
      H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const r = await fetch(
      inv.gid ? `${GCAL}/${encodeURIComponent(inv.gid)}` : `${GCAL}?iCalUID=${encodeURIComponent(inv.uid)}`,
      { headers: H },
    );
    if (r.status === 401 || r.status === 403) throw refused('calendar sign-in refused');
    const j = await r.json().catch(() => ({})),
      ev = inv.gid ? (r.ok ? j : null) : (j.items || [])[0];
    if (!ev) return null;
    const me = String(acct.email).toLowerCase(),
      mine = (a) => a.self || String(a.email).toLowerCase() === me;
    const attendees = (ev.attendees || []).map((a) => (mine(a) ? { ...a, responseStatus: word[0] } : a));
    if (!attendees.some(mine)) attendees.push({ email: acct.email, responseStatus: word[0] });
    const p = await fetch(`${GCAL}/${encodeURIComponent(ev.id)}?sendUpdates=all`, {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify({ attendees }),
    });
    if (!p.ok) throw new Error(`calendar: ${p.status}`);
    return { ok: true };
  }
  if (!acct.cal) throw new Error('CAL_NOT_CONNECTED');
  const answer1 = async (id) => {
    await ews(
      acct,
      `<m:CreateItem MessageDisposition="SendAndSaveCopy"><m:Items><t:${word[1]}><t:ReferenceItemId Id="${x(id)}"/></t:${word[1]}></m:Items></m:CreateItem>`,
    );
    return { ok: true };
  };
  if (inv.ews) return answer1(inv.ews); // the meeting request itself
  const xml = await ews(
    acct,
    `<m:FindItem Traversal="Shallow"><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape><t:AdditionalProperties><t:FieldURI FieldURI="calendar:UID"/></t:AdditionalProperties></m:ItemShape>
    <m:CalendarView MaxEntriesReturned="100" StartDate="${iso(inv.start - 60e3)}" EndDate="${iso(inv.end + 60e3)}"/>
    <m:ParentFolderIds><t:DistinguishedFolderId Id="calendar"/></m:ParentFolderIds></m:FindItem>`,
  );
  const item = [...xml.matchAll(/<t:CalendarItem>([\s\S]*?)<\/t:CalendarItem>/g)]
    .map((m) => m[1])
    .find((it) => tag(it, 'UID').toLowerCase() === inv.uid.toLowerCase());
  const id = item && (/<t:ItemId Id="([^"]+)"/.exec(item) || [])[1];
  if (!id) return null;
  return answer1(id);
}

// Your organisation's address book (Microsoft, with the calendar connected): names matching what you type.
async function people(acct, q) {
  q = String(q || '').trim();
  if (acct.provider !== 'microsoft' || !acct.cal || q.length < 3) return [];
  const xml = await ews(
    acct,
    `<m:ResolveNames ReturnFullContactData="false" SearchScope="ActiveDirectoryContacts"><m:UnresolvedEntry>${x(q)}</m:UnresolvedEntry></m:ResolveNames>`,
  );
  return [...xml.matchAll(/<t:Mailbox>([\s\S]*?)<\/t:Mailbox>/g)]
    .map((m) => ({ name: tag(m[1], 'Name'), address: tag(m[1], 'EmailAddress') }))
    .filter((p) => /@/.test(p.address))
    .slice(0, 8);
}

// ---------- one event: read, change, delete ----------
async function gfetch(acct, url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${await freshToken(acct)}`, 'Content-Type': 'application/json' },
  });
  if (r.status === 401 || r.status === 403) throw refused('calendar sign-in refused');
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 410) throw new Error(`calendar: ${j.error?.message || r.status}`);
  return j;
}
// Guests, organiser and notes of an event (the list view only has times and titles).
async function detail(acct, id) {
  if (acct.provider === 'google') {
    const e = await gfetch(acct, `${GCAL}/${encodeURIComponent(id)}`);
    const st = { accepted: 'ACCEPTED', tentative: 'TENTATIVE', declined: 'DECLINED', needsAction: 'NEEDS-ACTION' };
    return {
      notes: e.description || '',
      organizer: e.organizer ? { name: e.organizer.displayName || '', email: e.organizer.email || '' } : null,
      attendees: (e.attendees || []).map((a) => ({
        name: a.displayName || '',
        email: a.email || '',
        status: st[a.responseStatus] || '',
      })),
    };
  }
  if (!acct.cal) throw new Error('CAL_NOT_CONNECTED');
  const xml = await ews(
    acct,
    `<m:GetItem><m:ItemShape><t:BaseShape>AllProperties</t:BaseShape><t:BodyType>Text</t:BodyType></m:ItemShape><m:ItemIds><t:ItemId Id="${x(id)}"/></m:ItemIds></m:GetItem>`,
  );
  const m = parseMeeting(xml, id);
  if (!m) return null;
  return { notes: tag(xml, 'Body').trim(), organizer: m.organizer, attendees: m.attendees };
}
// Change an event; guests hear about it from the calendar service.
async function update(acct, id, ev) {
  const guests = (ev.guests || []).filter((g) => /@/.test(g));
  if (acct.provider === 'google') {
    const keep = new Map((ev.attendees || []).map((a) => [String(a.email).toLowerCase(), a]));
    await gfetch(acct, `${GCAL}/${encodeURIComponent(id)}?sendUpdates=all`, {
      method: 'PATCH',
      body: JSON.stringify({
        summary: ev.title,
        location: ev.where || '',
        description: ev.notes || '',
        start: { dateTime: iso(ev.start) },
        end: { dateTime: iso(ev.end) },
        ...(ev.guests
          ? {
              attendees: guests.map((g) => {
                const a = keep.get(g.toLowerCase());
                return a
                  ? {
                      email: a.email,
                      responseStatus:
                        { ACCEPTED: 'accepted', TENTATIVE: 'tentative', DECLINED: 'declined' }[a.status] ||
                        'needsAction',
                    }
                  : { email: g };
              }),
            }
          : {}),
      }),
    });
    return { ok: true };
  }
  if (!acct.cal) throw new Error('CAL_NOT_CONNECTED');
  const set = (uri, inner) =>
    `<t:SetItemField><t:FieldURI FieldURI="${uri}"/><t:CalendarItem>${inner}</t:CalendarItem></t:SetItemField>`;
  const del = (uri) => `<t:DeleteItemField><t:FieldURI FieldURI="${uri}"/></t:DeleteItemField>`;
  const changes = [
    set('item:Subject', `<t:Subject>${x(ev.title)}</t:Subject>`),
    ev.notes ? set('item:Body', `<t:Body BodyType="Text">${x(ev.notes)}</t:Body>`) : del('item:Body'),
    set('calendar:Start', `<t:Start>${iso(ev.start)}</t:Start>`),
    set('calendar:End', `<t:End>${iso(ev.end)}</t:End>`),
    ev.where ? set('calendar:Location', `<t:Location>${x(ev.where)}</t:Location>`) : del('calendar:Location'),
    ...(ev.guests
      ? [guests.length ? set('calendar:RequiredAttendees', attendeesXml(guests)) : del('calendar:RequiredAttendees')]
      : []),
  ];
  await ews(
    acct,
    `<m:UpdateItem ConflictResolution="AlwaysOverwrite" SendMeetingInvitationsOrCancellations="SendToChangedAndSaveCopy"><m:ItemChanges><t:ItemChange><t:ItemId Id="${x(id)}"/><t:Updates>${changes.join('')}</t:Updates></t:ItemChange></m:ItemChanges></m:UpdateItem>`,
  );
  return { ok: true };
}
// Delete an event you own (guests get a cancellation).
async function remove(acct, id) {
  if (acct.provider === 'google') {
    await gfetch(acct, `${GCAL}/${encodeURIComponent(id)}?sendUpdates=all`, { method: 'DELETE' });
    return { ok: true };
  }
  if (!acct.cal) throw new Error('CAL_NOT_CONNECTED');
  await ews(
    acct,
    `<m:DeleteItem DeleteType="MoveToDeletedItems" SendMeetingCancellations="SendToAllAndSaveCopy"><m:ItemIds><t:ItemId Id="${x(id)}"/></m:ItemIds></m:DeleteItem>`,
  );
  return { ok: true };
}

module.exports = { detail, update, remove, events, create, respond, meeting, people, parseMeeting, parseEws, soap };
