// Demo data, forked from dude-design-system/ui_kits/mail/data.jsx (content follows app/web/demo.ts),
// plus the todo board's todos and labels. "Today" is Mon Nov 23 2026.
const ME = { name: 'You', address: 'you@example.edu' };

const THREADS = [
  {
    id: 't1', split: 'important', group: '', from: 'Maya Lindqvist', address: 'maya.lindqvist@example.edu',
    subject: 'Draft of the thesis chapter 3', date: '2:22 PM', unread: true,
    snippet: 'Hi! I went through chapter 3 and left comments in the margins. The method section reads well; the evaluation needs one more baseline.',
    messages: [{ from: 'Maya Lindqvist', date: '2:22 PM', text: 'Hi! I went through chapter 3 and left comments in the margins. The method section reads well; the evaluation needs one more baseline. Can we talk on Thursday?\n\nMaya' }],
  },
  {
    id: 't2', split: 'other', group: '', from: 'CodeHost', address: 'notifications@codehost.example',
    subject: '[dude/core] Pull request #214: faster thread list rendering', date: '1:30 PM', unread: true,
    snippet: 'jun-park requested your review on #214. Changes: virtualised rows, memoised date grouping, 38 files changed.',
    messages: [{ from: 'CodeHost', date: '1:30 PM', text: 'jun-park requested your review on #214.\n\nChanges: virtualised rows, memoised date grouping, 38 files changed.' }],
  },
  {
    id: 't3', split: 'important', group: '', from: 'Omar Haddad', address: 'omar@studio-north.example',
    subject: 'Re: Poster layout', date: '12:08 PM', unread: true, count: 3, files: ['poster-final.pdf'],
    snippet: 'Looks great. I nudged the title up a bit and swapped the fonts on the figure captions. Final PDF attached.',
    messages: [
      { from: 'Me', date: '22 Nov', text: 'Here is the first poster draft. Does the layout work for you?' },
      { from: 'Omar', date: '22 Nov', text: 'Mostly! Could the title be larger?' },
      { from: 'Omar Haddad', date: '12:08 PM', text: 'Looks great. I nudged the title up a bit and swapped the fonts on the figure captions. Final PDF attached.', quoted: 'On Sun, Omar Haddad wrote:\n> Mostly! Could the title be larger?', attachments: [{ name: 'poster-final.pdf', size: 248000 }], html: true },
    ],
  },
  {
    id: 't4', split: 'important', group: '', from: 'Department Calendar', address: 'calendar@example.edu',
    subject: 'Invitation: Research seminar @ Thu 14:00', date: '10:15 AM', unread: true,
    snippet: 'You have been invited to Research seminar. When: Thursday 14:00-15:30. Where: Lecture hall T2.',
    invite: { when: 'Thursday, November 26, 2:00 PM – 3:30 PM', where: 'Lecture hall T2', who: 'Department Calendar, Maya Lindqvist, Lena Virtanen', day: 4, start: 14, end: 15.5 },
    messages: [{ from: 'Department Calendar', date: '10:15 AM', text: 'You have been invited to Research seminar.\n\nWhen: Thursday 14:00-15:30\nWhere: Lecture hall T2' }],
  },
  {
    id: 't5', split: 'important', group: 'Yesterday', from: 'Lena Virtanen', address: 'lena.virtanen@example.edu',
    subject: 'Course assistants meeting notes', date: '22 Nov', starred: true,
    snippet: 'Notes from today: exam dates confirmed, grading split by exercise set, next sync in two weeks.',
    messages: [{ from: 'Lena Virtanen', date: '22 Nov', text: 'Notes from today: exam dates confirmed, grading split by exercise set, next sync in two weeks.' }],
  },
  {
    id: 't6', split: 'other', group: 'Yesterday', from: 'The Weekly Byte', address: 'hello@weeklybyte.example',
    subject: 'Ten keyboard tricks you are not using yet', date: '22 Nov', paper: true,
    snippet: 'This week: modal editing everywhere, why command palettes won, and a tiny tool that renames 2,000 files.',
    messages: [{ from: 'The Weekly Byte', date: '22 Nov', paper: true, text: 'This week: modal editing everywhere, why command palettes won, and a tiny tool that renames 2,000 files.' }],
  },
  {
    id: 't7', split: 'important', group: 'Yesterday', from: 'Jun Park', address: 'jun.park@example.org',
    subject: 'Lunch on Friday?', date: '22 Nov', unread: true,
    snippet: 'There is a new noodle place next to the library. 12:15?',
    messages: [{ from: 'Jun Park', date: '22 Nov', text: 'There is a new noodle place next to the library. 12:15?' }],
  },
  {
    id: 't8', split: 'other', group: 'Yesterday', from: 'Northbank', address: 'no-reply@northbank.example',
    subject: 'Your monthly statement is ready', date: '22 Nov',
    snippet: 'Your statement for this month is available in the online bank.',
    messages: [{ from: 'Northbank', date: '22 Nov', text: 'Your statement for this month is available in the online bank.' }],
  },
  {
    id: 't9', split: 'important', group: 'November 21st', from: 'Priya Nair', address: 'priya@labmail.example',
    subject: 'Dataset access', date: '21 Nov',
    snippet: 'I have added you to the shared bucket. Credentials are in the usual vault entry. Ping me if anything is missing.',
    messages: [{ from: 'Priya Nair', date: '21 Nov', text: 'I have added you to the shared bucket. Credentials are in the usual vault entry. Ping me if anything is missing.' }],
  },
  {
    id: 't10', split: 'important', group: 'Last 7 days', from: 'Tom Becker', address: 'tbecker@example.edu',
    subject: 'Re: Grant report deadline', date: '20 Nov', count: 2,
    snippet: 'Thanks for the reminder. I will send my part by Monday morning.',
    messages: [
      { from: 'Me', date: '19 Nov', text: 'Reminder: the grant report is due on the 1st.' },
      { from: 'Tom Becker', date: '20 Nov', text: 'Thanks for the reminder. I will send my part by Monday morning.' },
    ],
  },
  {
    id: 't11', split: 'important', group: 'Last 7 days', from: 'Ana Costa', address: 'ana.costa@example.com',
    subject: 'Photos from the hike', date: '19 Nov', files: ['ridge.jpg', 'summit.jpg', 'route.gpx'],
    snippet: 'Uploaded the photos from Saturday, the ridge shot came out really well!',
    messages: [{ from: 'Ana Costa', date: '19 Nov', text: 'Uploaded the photos from Saturday, the ridge shot came out really well!', attachments: [{ name: 'ridge.jpg', size: 2400000 }, { name: 'summit.jpg', size: 1900000 }, { name: 'route.gpx', size: 52000 }] }],
  },
  {
    id: 't12', split: 'important', group: 'Last 30 days', from: 'Maya Lindqvist', address: 'maya.lindqvist@example.edu',
    subject: 'Room booking for the defence', date: '15 Nov',
    snippet: 'I booked the seminar room for the 12th, 10-12. Let me know if the committee needs another slot.',
    messages: [{ from: 'Maya Lindqvist', date: '15 Nov', text: 'I booked the seminar room for the 12th, 10-12. Let me know if the committee needs another slot.' }],
  },
  {
    id: 't13', split: 'other', group: 'Last 7 days', from: 'Parcel Tracking', address: 'track@parcels.example',
    subject: 'Your parcel is on its way', date: '21 Nov',
    snippet: 'Parcel 4471-XK has left the sorting centre and will arrive tomorrow between 9 and 14.',
    messages: [{ from: 'Parcel Tracking', date: '21 Nov', text: 'Parcel 4471-XK has left the sorting centre and will arrive tomorrow between 9 and 14.' }],
  },
];

// The week of Sun Nov 22 – Sat Nov 28 2026 (index 1 = today).
const WEEK = [
  { label: 'Sun 22', events: [{ title: 'Grading', start: 14, end: 16.5 }] },
  { label: 'Mon 23', today: true, events: [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }, { title: 'Lunch with Jun', start: 12.25, end: 13, where: 'Noodle place', kind: 'local' }] },
  { label: 'Tue 24', events: [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }, { title: 'Thesis chapter 3', start: 13, end: 14, where: 'https://meet.example.edu/maya', kind: 'pending' }] },
  { label: 'Wed 25', allDay: ['Writing day'], events: [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }] },
  { label: 'Thu 26', events: [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }] },
  { label: 'Fri 27', events: [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }] },
  { label: 'Sat 28', events: [] },
];
const DAY_LABELS = ['Sun, Nov 22', 'Mon, Nov 23', 'Tue, Nov 24', 'Wed, Nov 25', 'Thu, Nov 26', 'Fri, Nov 27', 'Sat, Nov 28'];
const NOW = 14.4; // 2:24 PM

const TIPS = [
  ['from:nicole', 'from Nicole'], ['to:roman', 'to Roman'], ['"be brilliant"', 'contains "be brilliant"'], ['subject:lunch', 'subject contains "lunch"'],
  ['domain:example.com', 'from that domain'], ['has:attachment', 'has files'], ['filename:pdf', 'file name has pdf'], ['larger:5M', 'bigger than 5 mb'],
  ['in:sent', 'in Sent'], ['is:unread', 'unread conversations'], ['is:starred', 'starred conversations'], ['before:2025/06/01', 'before June 2025'],
  ['older_than:3d', 'more than 3 days ago'], ['-word', 'without that word'],
];

const KEY_GROUPS = [
  ['Navigation', [['Next / previous conversation', 'J K'], ['Open', 'Enter'], ['Back', 'Esc'], ['Next split inbox', 'Tab'], ['Command', 'Ctrl K'], ['Search', '/']]],
  ['Conversations', [['Mark Done', 'E'], ['Remind Me', 'H'], ['Star', 'S'], ['Read or unread', 'U'], ['Trash', '#'], ['Undo', 'Z']]],
  ['Messages', [['Reply all', 'Enter'], ['Reply', 'R'], ['Forward', 'F'], ['Compose', 'C'], ['Send', 'Ctrl Enter']]],
  ['Calendar', [['Day beside mail', '0'], ['Week', '2'], ['Back to mail', '1'], ['Create event', 'B']]],
];

const MENU = [
  { label: 'Important · Other', keys: ['G', 'I'] }, { label: 'Starred', keys: ['G', 'S'] }, { label: 'Drafts', keys: ['G', 'D'] },
  { label: 'Sent', keys: ['G', 'T'] }, { label: 'Done', keys: ['G', 'E'] }, { label: 'Reminders', keys: ['G', 'H'] },
  { label: 'Spam', keys: ['G', '!'] }, { label: 'Trash', keys: ['G', '#'] }, { label: 'All Mail', keys: ['G', 'A'] },
];

// ---------- todo board ----------
// Label colours borrow the system's small functional hues (the file-type set); one accent stays the brand.
const LABELS = [
  { id: 'thesis', c: 'var(--ft-doc)' },
  { id: 'teaching', c: 'var(--ft-sheet)' },
  { id: 'code', c: 'var(--ft-img)' },
  { id: 'poster', c: 'var(--ft-slide)' },
  { id: 'admin', c: 'var(--ft-pdf)' },
  { id: 'home', c: 'var(--text-3)' },
];

const TODOS = [
  { id: 'k1', day: '2026-11-22', title: 'Grade exercise set 4', labels: ['teaching'], done: true },
  { id: 'k2', day: '2026-11-23', title: 'Answer Maya on chapter 3', labels: ['thesis'], mails: ['t1'], notes: 'Thursday works?', tasks: [{ t: 'add the missing baseline', done: true }, { t: 'rerun eval', done: false }, { t: 'send new pdf', done: false }] },
  { id: 'k3', day: '2026-11-23', title: 'Review PR #214', labels: ['code'], mails: ['t2'] },
  { id: 'k4', day: '2026-11-23', title: 'Book the noodle place for Friday', labels: ['home'], mails: ['t7'], done: true },
  { id: 'k5', day: '2026-11-24', title: 'Slides for the thesis meeting', labels: ['thesis'], tasks: [{ t: 'results table', done: false }, { t: 'baseline plot', done: false }] },
  { id: 'k8', day: '2026-11-24', title: 'Check bucket access', labels: ['code'], mails: ['t9'] },
  { id: 'k10', day: '2026-11-24', title: 'Pick up parcel 4471-XK', labels: ['home'], mails: ['t13'] },
  { id: 'k6', day: '2026-11-25', title: 'Write section 4.2', labels: ['thesis'] },
  { id: 'k13', day: '2026-11-25', title: 'Put exam dates in the calendar', labels: ['teaching'], mails: ['t5'] },
  { id: 'k7', day: '2026-11-26', title: 'Print the poster', labels: ['poster'], mails: ['t3'] },
  { id: 'k9', day: '2026-11-27', title: 'Send my part of the grant report', labels: ['admin'], mails: ['t10'] },
  { id: 'k11', day: null, title: 'Answer the defence room booking', labels: ['thesis'], mails: ['t12'] },
  { id: 'k12', day: null, title: 'Try modal editing everywhere', labels: [], mails: ['t6'] },
];

// Events by day, as the board shows them (start/end in hours). Same week as WEEK, plus the Thursday seminar invite.
const BOARD_EVENTS = {
  '2026-11-22': [{ title: 'Grading', start: 14, end: 16.5 }],
  '2026-11-23': [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }, { title: 'Lunch with Jun', start: 12.25, end: 13, where: 'Noodle place', kind: 'local' }],
  '2026-11-24': [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }, { title: 'Thesis chapter 3', start: 13, end: 14, where: 'meet.example.edu/maya', kind: 'pending', who: 'Maya Lindqvist (organizer), You' }],
  '2026-11-25': [{ title: 'Writing day', allDay: true }, { title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }],
  '2026-11-26': [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }, { title: 'Research seminar', start: 14, end: 15.5, where: 'Lecture hall T2', kind: 'inv', who: 'Department Calendar, Maya Lindqvist, Lena Virtanen' }],
  '2026-11-27': [{ title: 'Standup', start: 9.5, end: 9.75, where: 'Room B204' }],
};
const TODAY_KEY = '2026-11-23';

Object.assign(window, { ME, THREADS, WEEK, DAY_LABELS, NOW, TIPS, KEY_GROUPS, MENU, LABELS, TODOS, BOARD_EVENTS, TODAY_KEY });
