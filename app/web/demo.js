// Demo mailbox used when the app runs in a plain browser (no desktop mail engine).
// Same interface as the desktop bridge in desktop/preload.js.
(function () {
  const now = Date.now(), H = 3600e3, D = 24 * H;
  const P = (name, address) => ({ name, address });
  const me = P('You', 'you@example.edu');
  const people = {
    maya: P('Maya Lindqvist', 'maya.lindqvist@example.edu'),
    omar: P('Omar Haddad', 'omar@studio-north.example'),
    lena: P('Lena Virtanen', 'lena.virtanen@example.edu'),
    jun: P('Jun Park', 'jun.park@example.org'),
    priya: P('Priya Nair', 'priya@labmail.example'),
    tom: P('Tom Becker', 'tbecker@example.edu'),
    ana: P('Ana Costa', 'ana.costa@example.com'),
    git: P('CodeHost', 'notifications@codehost.example'),
    news: P('The Weekly Byte', 'hello@weeklybyte.example'),
    bank: P('Northbank', 'no-reply@northbank.example'),
    cal: P('Department Calendar', 'calendar@example.edu'),
    shop: P('Parcel Tracking', 'track@parcels.example'),
  };
  let seq = 0;
  const mk = (folder, from, subject, body, ago, o = {}) => ({
    id: 'd' + (++seq), folder, subject, from, to: [me], date: now - ago,
    unread: !!o.unread, starred: !!o.starred, list: !!o.list, count: o.count || 1,
    snippet: body.replace(/\s+/g, ' ').slice(0, 160),
    atts: (o.files || []).map(f => ({ name: f[0], type: f[1], size: f[2] })), size: 4000 + (o.files || []).reduce((n, f) => n + f[2], 0),
    messages: (o.msgs || []).concat([{ from, to: [me], cc: o.cc || [], date: now - ago, text: body, html: o.html || null, invite: o.invite || null, attachments: (o.files || []).map(f => ({ filename: f[0], type: f[1], size: f[2] })) }]),
  });
  const threads = [
    mk('inbox', people.maya, 'Draft of the thesis chapter 3', 'Hi! I went through chapter 3 and left comments in the margins. The method section reads well; the evaluation needs one more baseline. Can we talk on Thursday?\n\nMaya', 0.6 * H, { unread: true }),
    mk('inbox', people.git, '[dude/core] Pull request #214: faster thread list rendering', 'jun-park requested your review on #214. Changes: virtualised rows, memoised date grouping, 38 files changed.', 1.5 * H, { unread: true, list: true }),
    mk('inbox', people.omar, 'Re: Poster layout', 'Looks great. I nudged the title up a bit and swapped the fonts on the figure captions. Final PDF attached.\n\nOn Mon, Omar Haddad wrote:\n> Mostly! Could the title be larger?', 3 * H, { unread: true, count: 3, files: [['poster-final.pdf', 'application/pdf', 248000]], html: '<div style="font-family:Calibri;color:#000000">Looks great. I nudged the title up a bit and swapped the fonts on the figure captions. Final PDF attached.</div><div id="appendonsend"></div><hr><div id="divRplyFwdMsg"><b>From:</b> Omar Haddad</div><div style="color:black">Mostly! Could the title be larger?</div>', msgs: [
      { from: me, to: [people.omar], date: now - 26 * H, text: 'Here is the first poster draft. Does the layout work for you?' },
      { from: people.omar, to: [me], date: now - 20 * H, text: 'Mostly! Could the title be larger?' }] }),
    mk('inbox', people.cal, 'Invitation: Research seminar @ Thu 14:00', 'You have been invited to Research seminar. When: Thursday 14:00-15:30. Where: Lecture hall T2.', 5 * H, { unread: true, invite: (() => { const d = new Date(); d.setDate(d.getDate() + ((11 - d.getDay()) % 7 || 7)); d.setHours(14, 0, 0, 0); return { method: 'REQUEST', uid: 'demo-seminar', title: 'Research seminar', where: 'Lecture hall T2', start: d.getTime(), end: d.getTime() + 1.5 * H, organizer: { email: people.cal.address, name: 'Department Calendar' }, attendees: [{ email: people.maya.address, name: 'Maya Lindqvist', status: 'ACCEPTED' }, { email: people.lena.address, name: 'Lena Virtanen', status: 'TENTATIVE' }, { email: me.address, name: 'You', status: 'NEEDS-ACTION' }] }; })() }),
    mk('inbox', people.lena, 'Course assistants meeting notes', 'Notes from today: exam dates confirmed, grading split by exercise set, next sync in two weeks.', 22 * H, { starred: true }),
    mk('inbox', people.news, 'Ten keyboard tricks you are not using yet', 'This week: modal editing everywhere, why command palettes won, and a tiny tool that renames 2,000 files.', 25 * H, { list: true, html: '<table width="100%" bgcolor="#f4efe6" style="font-family:Georgia"><tr><td style="padding:24px"><h2 style="color:#222">The Weekly Byte</h2><p style="color:#333">This week: modal editing everywhere, why command palettes won, and a tiny tool that renames 2,000 files.</p></td></tr></table>' }),
    mk('inbox', people.jun, 'Lunch on Friday?', 'There is a new noodle place next to the library. 12:15?', 27 * H, { unread: true }),
    mk('inbox', people.bank, 'Your monthly statement is ready', 'Your statement for this month is available in the online bank.', 30 * H, { list: true }),
    mk('inbox', people.priya, 'Dataset access', 'I have added you to the shared bucket. Credentials are in the usual vault entry. Ping me if anything is missing.', 2.2 * D),
    mk('inbox', people.shop, 'Your parcel is on its way', 'Parcel 4471-XK has left the sorting centre and will arrive tomorrow between 9 and 14.', 2.5 * D, { list: true }),
    mk('inbox', people.tom, 'Re: Grant report deadline', 'Thanks for the reminder. I will send my part by Monday morning.', 3.1 * D, { count: 2 }),
    mk('inbox', people.ana, 'Photos from the hike', 'Uploaded the photos from Saturday, the ridge shot came out really well!', 4 * D, { files: [['ridge.jpg', 'image/jpeg', 2400000], ['summit.jpg', 'image/jpeg', 1900000], ['route.gpx', 'application/gpx+xml', 52000]] }),
    mk('inbox', people.git, '[dude/core] Issue #198 closed', 'Issue "Search ignores diacritics" was closed by #205.', 5 * D, { list: true }),
    mk('inbox', people.news, 'Weekend reading list', 'Long reads about calm software, latency budgets and the history of e-mail.', 6 * D, { list: true }),
    mk('inbox', people.maya, 'Room booking for the defence', 'I booked the seminar room for the 12th, 10-12. Let me know if the committee needs another slot.', 8 * D),
    mk('done', people.lena, 'Exercise set 4 solutions', 'Solutions are uploaded.', 9 * D),
    mk('sent', me, 'Re: Poster layout', 'Here is the first poster draft.', 26 * H),
  ];
  threads.forEach(t => { if (t.folder === 'sent') t.from = people.omar; });
  const at = (dayOffset, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0); return d.getTime(); };
  const mine = { server: true, isOrganizer: true, isMeeting: false, response: 'Organizer' };
  const cal = [
    ...[-3, -2, -1, 0, 1, 2, 3].filter(o => { const g = new Date(at(o, 9)).getDay(); return g > 0 && g < 6; }).map(o => ({ ...mine, id: 'cs' + o, title: 'Standup', start: at(o, 9, 30), end: at(o, 9, 45), where: 'Room B204' })),
    { ...mine, id: 'cl', title: 'Lunch with Jun', start: at(0, 12, 15), end: at(0, 13), where: 'Noodle place' },
    { id: 'cm', server: true, isOrganizer: false, isMeeting: true, response: 'NoResponseReceived', title: 'Thesis chapter 3', start: at(1, 13), end: at(1, 14), where: 'https://meet.example.edu/maya', organizer: 'Maya Lindqvist',
      org: { name: 'Maya Lindqvist', email: people.maya.address }, att: [{ name: 'Maya Lindqvist', email: people.maya.address, status: 'ACCEPTED' }, { name: 'You', email: me.address, status: 'NEEDS-ACTION' }], notes: 'Go through the evaluation section and the missing baseline.' },
    { ...mine, id: 'cd', title: 'Writing day', start: at(2, 0), end: at(3, 0), allDay: true },
    { ...mine, id: 'cg', title: 'Grading', start: at(-1, 14), end: at(-1, 16, 30), notes: 'Exercise set 4.' },
  ];
  const byId = id => threads.find(t => t.id === id);
  const pub = t => { const { messages, ...rest } = t; return { ...rest }; };
  const FOLDER = { inbox: 'inbox', done: 'done', sent: 'sent', trash: 'trash', spam: 'spam', drafts: 'drafts' };
  window.DemoBackend = {
    demo: true,
    async accounts() { return [{ email: me.address, provider: 'demo', name: me.name }]; },
    async signIn() { return { email: me.address, provider: 'demo' }; },
    async signOut() {},
    async list(view) {
      let r;
      if (view === 'starred') r = threads.filter(t => t.starred && t.folder !== 'trash');
      else if (view === 'all') r = threads.filter(t => t.folder !== 'trash' && t.folder !== 'spam');
      else r = threads.filter(t => t.folder === (FOLDER[view] || view));
      return r.sort((a, b) => b.date - a.date).map(pub);
    },
    async search(q) {
      const inF = /(?:^|\s)in:(\w+)/.exec(q), folder = inF && inF[1];
      const rest = q.replace(/(?:^|\s)in:\w+/, '');
      return threads.filter(t => t.folder !== 'trash' && (!folder || t.folder === folder) && window.kestrelMatch(t, rest)).sort((a, b) => b.date - a.date).map(pub);
    },
    async thread(t) {
      const x = byId(t.id); x.unread = false;
      return x.messages.map((m, i) => ({ ...m, id: x.id + '.' + i, subject: x.subject, attachments: m.attachments || [] }));
    },
    async act(t, action, folder) {
      const x = byId(t.id);
      if (action === 'copy') return pub(x);
      const moves = { done: 'done', undone: 'inbox', trash: 'trash', spam: 'spam', restore: t.folder, move: folder };
      if (action in moves) { const prev = x.folder; x.folder = moves[action]; return { ...pub(x), prevFolder: prev }; }
      if (action === 'star') x.starred = true;
      if (action === 'unstar') x.starred = false;
      if (action === 'read') x.unread = false;
      if (action === 'unread') x.unread = true;
      return pub(x);
    },
    async send(msg) {
      const to = msg.to.split(',')[0].trim();
      threads.push(mk('sent', to ? P(to, to) : me, msg.subject || '(no subject)', msg.text, 0));
      return { ok: true };
    },
    async invite() { return { ok: true }; },
    async folders() { return [{ name: 'Projects', path: 'projects' }, { name: 'Receipts', path: 'receipts' }, { name: 'Teaching', path: 'teaching' }]; },
    async rsvp(inv, ans) { const e = inv && inv.ews && cal.find(x => x.id === inv.ews); if (e) e.response = { yes: 'Accept', maybe: 'Tentative', no: 'Decline' }[ans]; return { via: e ? 'calendar' : 'mail' }; },
    // a small calendar around today
    async calStatus() { return { connected: true, canConnect: false }; },
    async calEvents(from, to) { return cal.filter(e => e.start < to && e.end > from).map(e => ({ ...e })); },
    async calCreate(ev) { const e = { ...ev, id: 'c' + (++seq), server: true, isOrganizer: true, isMeeting: ev.guests.length > 0, response: 'Organizer' }; cal.push(e); return { id: e.id }; },
    async calDetail(id) { const e = cal.find(x => x.id === id); return e && { notes: e.notes || '', organizer: e.org || null, attendees: e.att || [] }; },
    async calUpdate(id, ev) { const e = cal.find(x => x.id === id); if (e) Object.assign(e, { title: ev.title, start: ev.start, end: ev.end, where: ev.where, notes: ev.notes }); return { ok: true }; },
    async calDelete(id) { const i = cal.findIndex(x => x.id === id); if (i >= 0) cal.splice(i, 1); return { ok: true }; },
  };
})();
