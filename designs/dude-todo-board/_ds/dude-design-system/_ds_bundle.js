/* @ds-bundle: {"format":3,"namespace":"DudeDesignSystem_3fa3b0","components":[{"name":"DayCalendar","sourcePath":"components/calendar/Calendar.jsx"},{"name":"EventBlock","sourcePath":"components/calendar/Calendar.jsx"},{"name":"EventChip","sourcePath":"components/calendar/Calendar.jsx"},{"name":"CalNote","sourcePath":"components/calendar/Calendar.jsx"},{"name":"WeekView","sourcePath":"components/calendar/Calendar.jsx"},{"name":"MiniMonth","sourcePath":"components/calendar/Calendar.jsx"},{"name":"CalendarOptions","sourcePath":"components/calendar/Calendar.jsx"},{"name":"EventForm","sourcePath":"components/calendar/Calendar.jsx"},{"name":"EventView","sourcePath":"components/calendar/Calendar.jsx"},{"name":"EventButtons","sourcePath":"components/calendar/Calendar.jsx"},{"name":"Button","sourcePath":"components/controls/Controls.jsx"},{"name":"Key","sourcePath":"components/controls/Controls.jsx"},{"name":"Keys","sourcePath":"components/controls/Controls.jsx"},{"name":"IconButton","sourcePath":"components/controls/Controls.jsx"},{"name":"ChoiceButton","sourcePath":"components/controls/Controls.jsx"},{"name":"Segmented","sourcePath":"components/controls/Controls.jsx"},{"name":"Field","sourcePath":"components/controls/Controls.jsx"},{"name":"Checkbox","sourcePath":"components/controls/Controls.jsx"},{"name":"BarInput","sourcePath":"components/controls/Controls.jsx"},{"name":"ICON_NAMES","sourcePath":"components/controls/Icon.jsx"},{"name":"Icon","sourcePath":"components/controls/Icon.jsx"},{"name":"ListRow","sourcePath":"components/mail/Mail.jsx"},{"name":"SplitTabs","sourcePath":"components/mail/Mail.jsx"},{"name":"ListSeparator","sourcePath":"components/mail/Mail.jsx"},{"name":"ListNote","sourcePath":"components/mail/Mail.jsx"},{"name":"FileType","sourcePath":"components/mail/Mail.jsx"},{"name":"AttachmentChip","sourcePath":"components/mail/Mail.jsx"},{"name":"ZeroState","sourcePath":"components/mail/Mail.jsx"},{"name":"MessageRow","sourcePath":"components/mail/Mail.jsx"},{"name":"Message","sourcePath":"components/mail/Mail.jsx"},{"name":"Attachment","sourcePath":"components/mail/Mail.jsx"},{"name":"ReplyBar","sourcePath":"components/mail/Mail.jsx"},{"name":"NewMail","sourcePath":"components/mail/Mail.jsx"},{"name":"Editor","sourcePath":"components/mail/Mail.jsx"},{"name":"Composer","sourcePath":"components/mail/Mail.jsx"},{"name":"FileChip","sourcePath":"components/mail/Mail.jsx"},{"name":"Invite","sourcePath":"components/mail/Mail.jsx"},{"name":"Suggestions","sourcePath":"components/mail/Mail.jsx"},{"name":"ContactCard","sourcePath":"components/mail/Mail.jsx"},{"name":"SearchTips","sourcePath":"components/mail/Mail.jsx"},{"name":"RecentSearch","sourcePath":"components/mail/Mail.jsx"},{"name":"CommandPalette","sourcePath":"components/overlays/Overlays.jsx"},{"name":"Dialog","sourcePath":"components/overlays/Overlays.jsx"},{"name":"KeysList","sourcePath":"components/overlays/Overlays.jsx"},{"name":"Toast","sourcePath":"components/overlays/Overlays.jsx"},{"name":"ToastStack","sourcePath":"components/overlays/Overlays.jsx"},{"name":"SideMenu","sourcePath":"components/overlays/Overlays.jsx"},{"name":"AuthBar","sourcePath":"components/overlays/Overlays.jsx"},{"name":"FileViewer","sourcePath":"components/overlays/Overlays.jsx"},{"name":"AppShell","sourcePath":"components/shell/Shell.jsx"},{"name":"Logo","sourcePath":"components/shell/Shell.jsx"},{"name":"Rail","sourcePath":"components/shell/Shell.jsx"},{"name":"ListHeader","sourcePath":"components/shell/Shell.jsx"},{"name":"ThreadView","sourcePath":"components/shell/Shell.jsx"},{"name":"Pane","sourcePath":"components/shell/Shell.jsx"},{"name":"SettingsSection","sourcePath":"components/shell/Shell.jsx"},{"name":"TabBar","sourcePath":"components/shell/Shell.jsx"}],"sourceHashes":{"components/calendar/Calendar.jsx":"f096e6e82e8e","components/controls/Controls.jsx":"0a14eb4f304c","components/controls/Icon.jsx":"16f2c8fa4b3a","components/mail/Mail.jsx":"c658fa6855c6","components/overlays/Overlays.jsx":"87bbcd3e33a9","components/shell/Shell.jsx":"e3b833425614","ui_kits/mail/app.jsx":"a842960a8985","ui_kits/mail/data.jsx":"e8d91e71cb77"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DudeDesignSystem_3fa3b0 = window.DudeDesignSystem_3fa3b0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/controls/Icon.jsx
try { (() => {
// Generated from app/web/app/icons.tsx (dude's own icon set). Do not hand-edit; re-run:
// node tools/extract-icons.mjs ../../app/web/app/icons.tsx assets/icons components/controls/Icon.jsx
// 1.3–1.5px strokes, currentColor, drawn at their natural 7–16px size. Never scaled up.
const ICONS = {
  "clip": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M12 6.5L7 11.5a3 3 0 01-4.3-4.3L8 2a2 2 0 012.8 2.8L5.6 10a1 1 0 01-1.4-1.4L9 3.8\" /></svg>",
  "mail": "<svg width=\"14\" height=\"12\" viewBox=\"0 0 14 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><rect x=\".7\" y=\".7\" width=\"12.6\" height=\"10.6\" rx=\"2\" /><path d=\"M1.5 2l5.5 4.2L12.5 2\" /></svg>",
  "cal": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><rect x=\".7\" y=\"1.7\" width=\"12.6\" height=\"11.6\" rx=\"2\" /><path d=\"M.7 5.2h12.6M4 .5v2.5M10 .5v2.5\" /></svg>",
  "menu": "<svg width=\"16\" height=\"12\" viewBox=\"0 0 16 12\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M0 1h16M0 6h16M0 11h16\" /></svg>",
  "pen": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 15 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M10.5 1.5l3 3L5 13H2v-3z\" /><path d=\"M1 14.3h13\" /></svg>",
  "search": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><circle cx=\"6\" cy=\"6\" r=\"4.8\" /><path d=\"M9.6 9.6L13.3 13.3\" /></svg>",
  "check": "<svg width=\"14\" height=\"11\" viewBox=\"0 0 14 11\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M1 5.5l4 4L13 1\" /></svg>",
  "clock": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 15 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><circle cx=\"7.5\" cy=\"7.5\" r=\"6.6\" /><path d=\"M7.5 3.8v4l2.6 1.6\" /></svg>",
  "cmd": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 15 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M7.5 1l6 3.3-6 3.3-6-3.3z\" /><path d=\"M1.5 7.5l6 3.3 6-3.3M1.5 10.7l6 3.3 6-3.3\" /></svg>",
  "trash": "<svg width=\"13\" height=\"14\" viewBox=\"0 0 13 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M1 3h11M4.5 3V1.5h4V3M2.5 3l.7 10h6.6l.7-10\" /></svg>",
  "person": "<svg width=\"13\" height=\"14\" viewBox=\"0 0 13 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><circle cx=\"6.5\" cy=\"4\" r=\"3\" /><path d=\"M1 13.5c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5\" /></svg>",
  "pin": "<svg width=\"12\" height=\"15\" viewBox=\"0 0 12 15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M6 14s5-5 5-8.5a5 5 0 0 0-10 0C1 9 6 14 6 14z\" /><circle cx=\"6\" cy=\"5.5\" r=\"1.8\" /></svg>",
  "lines": "<svg width=\"13\" height=\"11\" viewBox=\"0 0 13 11\" stroke=\"currentColor\" stroke-width=\"1.3\"><path d=\"M0 1h13M0 5.5h13M0 10h8\" /></svg>",
  "download": "<svg width=\"13\" height=\"14\" viewBox=\"0 0 13 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M6.5 1v8.5M2.8 6l3.7 3.7L10.2 6M1 13h11\" /></svg>",
  "back": "<svg width=\"16\" height=\"14\" viewBox=\"0 0 16 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M7 1L1 7l6 6M1 7h15\" /></svg>",
  "up": "<svg width=\"12\" height=\"8\" viewBox=\"0 0 12 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M1 7l5-5.5L11 7\" /></svg>",
  "down": "<svg width=\"12\" height=\"8\" viewBox=\"0 0 12 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M1 1l5 5.5L11 1\" /></svg>",
  "left": "<svg width=\"7\" height=\"12\" viewBox=\"0 0 7 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M6 1L1 6l5 5\" /></svg>",
  "right": "<svg width=\"7\" height=\"12\" viewBox=\"0 0 7 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"><path d=\"M1 1l5 5-5 5\" /></svg>"
};
const ICON_NAMES = Object.keys(ICONS);
function Icon({
  name,
  title
}) {
  const svg = ICONS[name];
  if (!svg) return null;
  return /*#__PURE__*/React.createElement("span", {
    className: "d-icon",
    role: title ? 'img' : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true,
    dangerouslySetInnerHTML: {
      __html: svg
    }
  });
}
Object.assign(__ds_scope, { ICON_NAMES, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/Icon.jsx", error: String((e && e.message) || e) }); }

// components/calendar/Calendar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon
} = __ds_scope;
const cx = (...a) => a.filter(Boolean).join(' ');
const HOUR = 44;
// en-US toLocaleTimeString, as the app shows it: "9:30 AM"
const fmtHour = h => {
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
};
const hourLabel = h => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;

// The day beside the mail: head, all-day chips, 24 hours of 44px. `scrollTo` is the first hour in view.
function DayCalendar({
  label,
  events = [],
  allDay = [],
  now,
  tz = 'EET',
  isToday = true,
  scrollTo = 8,
  note,
  onPrev,
  onNext,
  onWeek
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTo * HOUR;
  }, [scrollTo]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "d-cal-h"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn xs",
    title: "Previous day (-)",
    onClick: onPrev
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "left"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn xs",
    title: "Next day (=)",
    onClick: onNext
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "right"
  })), /*#__PURE__*/React.createElement("span", {
    className: "grow"
  }), isToday ? null : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-outline",
    title: "Back to today"
  }, "today"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-outline",
    title: "Open week (2)",
    onClick: onWeek
  }, "week")), note, allDay.length ? /*#__PURE__*/React.createElement("div", {
    className: "d-cal-allday"
  }, allDay.map(t => /*#__PURE__*/React.createElement(EventChip, {
    key: t,
    title: t
  }))) : null, /*#__PURE__*/React.createElement("div", {
    className: "d-cal-b",
    ref: ref
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-cal-g"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-cal-tz"
  }, tz), Array.from({
    length: 24
  }, (_, h) => /*#__PURE__*/React.createElement("div", {
    className: "d-cal-hr",
    key: h
  }, h ? /*#__PURE__*/React.createElement("span", null, hourLabel(h)) : null)), events.map(e => /*#__PURE__*/React.createElement(EventBlock, _extends({
    key: e.title + e.start
  }, e))), now != null ? /*#__PURE__*/React.createElement("div", {
    className: "d-cal-now",
    style: {
      top: now * HOUR
    }
  }) : null)));
}

// One event in its hours. start/end are hours of the day (9.5 = 9:30). kind: local | pending | inv | draft | declined.
function EventBlock({
  title,
  start,
  end,
  where,
  kind,
  lane = 0,
  lanes = 1,
  onClick
}) {
  const w = 100 / lanes;
  const height = Math.max(15, (end - start) * HOUR - 2);
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-cal-ev', kind, height < 30 && 'short'),
    style: {
      top: start * HOUR,
      height,
      left: `calc(${lane * w}% + 2px)`,
      right: 'auto',
      width: `calc(${w}% - 4px)`
    },
    title: title,
    onClick: onClick
  }, /*#__PURE__*/React.createElement("b", null, title), ` ${fmtHour(start)} – ${fmtHour(end)}${where ? ` · ${where}` : ''}`);
}
function EventChip({
  title,
  onClick
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "d-cal-chip",
    title: title,
    onClick: onClick
  }, title);
}
function CalNote({
  children,
  action,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-cal-note"
  }, children, action ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction
  }, action) : null);
}

// The week: "November 2026", today / ‹ › on the left, + and command on the right; 56px hour gutter.
function WeekView({
  title,
  days = [],
  tz = 'EET',
  now,
  scrollTo = 8,
  onToday,
  onPrev,
  onNext,
  onAdd
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTo * HOUR;
  }, [scrollTo]);
  const anyAllDay = days.some(d => (d.allDay || []).length);
  return /*#__PURE__*/React.createElement("div", {
    className: "d-wk",
    style: {
      '--n': days.length
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "d-wk-h"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-outline",
    title: "Today (T)",
    onClick: onToday
  }, "today"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Previous week (-)",
    onClick: onPrev
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "left"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Next week (=)",
    onClick: onNext
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "right"
  })), /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("span", {
    className: "grow"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Create event (B)",
    onClick: onAdd
  }, "+"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Command (Ctrl+K)"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cmd"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "d-wk-days"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-wk-tz"
  }, tz), days.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    className: cx('d-wk-dh', d.today && 'today')
  }, /*#__PURE__*/React.createElement("span", null, d.label)))), anyAllDay ? /*#__PURE__*/React.createElement("div", {
    className: "d-wk-all"
  }, /*#__PURE__*/React.createElement("span", null), days.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.label
  }, (d.allDay || []).map(t => /*#__PURE__*/React.createElement(EventChip, {
    key: t,
    title: t
  }))))) : null, /*#__PURE__*/React.createElement("div", {
    className: "d-wk-b",
    ref: ref
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-wk-g"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-wk-hrs"
  }, Array.from({
    length: 23
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      top: (i + 1) * HOUR
    }
  }, hourLabel(i + 1)))), days.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    className: cx('d-wk-col', d.today && 'today')
  }, (d.events || []).map(e => /*#__PURE__*/React.createElement(EventBlock, _extends({
    key: e.title + e.start
  }, e))), d.today && now != null ? /*#__PURE__*/React.createElement("div", {
    className: "d-cal-now",
    style: {
      top: now * HOUR
    }
  }) : null)))));
}

// A month to jump around in. month is 0-based. Weeks start Sunday unless mondayFirst.
function MiniMonth({
  year,
  month,
  today,
  weekOf,
  mondayFirst,
  onPick
}) {
  const first = new Date(year, month, 1);
  const ws = mondayFirst ? 1 : 0;
  const start = new Date(year, month, 1 - (first.getDay() - ws + 7) % 7);
  const cells = Array.from({
    length: 42
  }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const wk0 = weekOf ? new Date(year, month, weekOf - (new Date(year, month, weekOf).getDay() - ws + 7) % 7) : null;
  const inWk = d => wk0 && d >= wk0 && d < new Date(wk0.getFullYear(), wk0.getMonth(), wk0.getDate() + 7);
  return /*#__PURE__*/React.createElement("div", {
    className: "d-mm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-mm-h"
  }, /*#__PURE__*/React.createElement("b", null, first.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })), /*#__PURE__*/React.createElement("span", {
    className: "grow"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Previous month"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "left"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Next month"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "right"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "d-mm-g"
  }, [0, 1, 2, 3, 4, 5, 6].map(i => /*#__PURE__*/React.createElement("span", {
    key: `h${i}`
  }, 'SMTWTFS'[(i + ws) % 7])), cells.map(d => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: d.toDateString(),
    className: cx('d-mm-d', d.getMonth() !== month && 'o', d.getMonth() === month && d.getDate() === today && 'today', inWk(d) && 'inwk'),
    "aria-label": d.toDateString(),
    onClick: () => onPick && onPick(d)
  }, /*#__PURE__*/React.createElement("span", null, d.getDate())))));
}

// Beside the week, under the month: your calendar account and three options.
function CalendarOptions({
  account,
  status = 'linked',
  options = [],
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-cal-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-cal-sec-h"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal"
  }), " calendar"), /*#__PURE__*/React.createElement("div", {
    className: "d-cal-acct"
  }, account, " ", /*#__PURE__*/React.createElement("span", null, status)), options.map(o => /*#__PURE__*/React.createElement("label", {
    className: "d-check",
    key: o.label
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!o.on,
    onChange: e => onToggle && onToggle(o.label, e.target.checked)
  }), " ", o.label)));
}

// Writing an event: "what" on a 2px brand underline, then who / when / where / notes as icon rows.
// The parsed time reads back in mono under "when".
function EventForm({
  title = '',
  guests = '',
  when = '',
  parsed,
  where = '',
  notes = '',
  fresh,
  onChange
}) {
  const set = k => e => onChange && onChange({
    [k]: e.target.value
  });
  const row = (icon, k, v, ph) => /*#__PURE__*/React.createElement("label", {
    className: "d-evrow"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: icon
  })), /*#__PURE__*/React.createElement("input", {
    value: v,
    placeholder: ph,
    onChange: set(k)
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-evform', fresh && 'fresh')
  }, /*#__PURE__*/React.createElement("input", {
    className: "d-etitle",
    value: title,
    placeholder: "what",
    "aria-label": "Event title",
    onChange: set('title')
  }), row('person', 'guests', guests, 'who'), row('clock', 'when', when, 'tomorrow 2 pm 30 min'), /*#__PURE__*/React.createElement("div", {
    className: "d-evparsed"
  }, parsed || 'time? “tomorrow 2 pm 30 min”'), row('pin', 'where', where, 'where'), row('lines', 'notes', notes, 'notes'));
}

// Someone else's meeting: 18px title, icon lines, rsvp choices, notes under a hairline.
function EventView({
  title,
  when,
  where,
  who,
  answer,
  notes,
  onAnswer
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-evform d-evview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-etitle-ro"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "d-evline"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock"
  }), /*#__PURE__*/React.createElement("span", null, when)), where ? /*#__PURE__*/React.createElement("div", {
    className: "d-evline"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin"
  }), /*#__PURE__*/React.createElement("span", null, where)) : null, who ? /*#__PURE__*/React.createElement("div", {
    className: "d-evline"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "person"
  }), /*#__PURE__*/React.createElement("span", null, who)) : null, /*#__PURE__*/React.createElement("div", {
    className: "d-evline rsvp"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-inv-q"
  }, "rsvp"), /*#__PURE__*/React.createElement("span", null, ['yes', 'maybe', 'no'].map(x => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: x,
    className: cx('d-choice', answer === x && 'on'),
    "aria-pressed": answer === x ? 'true' : 'false',
    onClick: () => onAnswer && onAnswer(x)
  }, x)))), notes ? /*#__PURE__*/React.createElement("div", {
    className: "d-evnotes"
  }, notes) : null);
}

// Under an event form: "SAVE" filled, "NOPE", "DELETE" in red when editing, then the keys in --text-3.
function EventButtons({
  view,
  canDelete,
  onSave,
  onCancel,
  onDelete
}) {
  return view ? /*#__PURE__*/React.createElement("div", {
    className: "d-evbtns"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-caps",
    onClick: onCancel
  }, "close"), /*#__PURE__*/React.createElement("span", null, "Esc")) : /*#__PURE__*/React.createElement("div", {
    className: "d-evbtns"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-save",
    onClick: onSave
  }, "save"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-caps",
    onClick: onCancel
  }, "nope"), canDelete ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-caps danger",
    onClick: onDelete
  }, "delete") : null, /*#__PURE__*/React.createElement("span", null, "Ctrl+Enter \xB7 Esc"));
}
Object.assign(__ds_scope, { DayCalendar, EventBlock, EventChip, CalNote, WeekView, MiniMonth, CalendarOptions, EventForm, EventView, EventButtons });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/calendar/Calendar.jsx", error: String((e && e.message) || e) }); }

// components/controls/Controls.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon
} = __ds_scope;
const cx = (...a) => a.filter(Boolean).join(' ');

// dude's buttons are words. Copy is lowercase ("go", "reply all", "send"); keycaps ride along.
function Button({
  variant = 'soft',
  primary,
  danger,
  icon,
  keyHint,
  title,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cx(VARIANT[variant], primary && 'primary', danger && 'danger'),
    title: title,
    onClick: onClick
  }, icon ? /*#__PURE__*/React.createElement(Icon, {
    name: icon
  }) : null, children, keyHint ? /*#__PURE__*/React.createElement("span", {
    className: "d-key"
  }, keyHint) : null);
}
function Key({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "d-key"
  }, children);
}

// A shortcut: ["G", "then", "I"] or ["Mod", "Shift", "L"]. "then" renders as a small word, not a cap.
function Keys({
  keys = []
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, keys.map((k, i) => k === 'then' ? /*#__PURE__*/React.createElement("small", {
    key: i,
    style: {
      font: '700 13px var(--mono)',
      color: 'var(--text-3)'
    }
  }, "then") : /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "d-key"
  }, k)));
}
function IconButton({
  icon,
  label,
  title,
  on,
  size,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cx('d-ibtn', on && 'on', size),
    title: title || label,
    "aria-label": label || title,
    onClick: onClick
  }, icon ? /*#__PURE__*/React.createElement(Icon, {
    name: icon
  }) : children);
}
const VARIANT = {
  main: 'd-btn-main',
  secondary: 'd-btn-secondary',
  soft: 'd-btn-soft',
  outline: 'd-btn-outline',
  toolbar: 'd-btn-toolbar',
  quiet: 'd-btn-quiet',
  caps: 'd-btn-caps',
  save: 'd-btn-save',
  link: 'd-btn-link',
  banner: 'd-btn-banner',
  alert: 'd-btn-alert'
};
function ChoiceButton({
  on,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: cx('d-choice', on && 'on'),
    "aria-pressed": on ? 'true' : 'false',
    onClick: onClick
  }, children);
}
function Segmented({
  options = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-seg",
    role: "group"
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: String(o.value),
    className: String(o.value) === String(value) ? 'on' : undefined,
    onClick: () => onChange && onChange(o.value)
  }, o.label)));
}
function Field({
  tall,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("input", _extends({
    className: cx('d-field', tall && 'tall')
  }, rest));
}
function Checkbox({
  label,
  checked,
  onChange
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "d-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    onChange: e => onChange && onChange(e.target.checked)
  }), " ", label);
}
function BarInput(props) {
  return /*#__PURE__*/React.createElement("input", _extends({
    className: "d-barinput"
  }, props));
}
Object.assign(__ds_scope, { Button, Key, Keys, IconButton, ChoiceButton, Segmented, Field, Checkbox, BarInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/Controls.jsx", error: String((e && e.message) || e) }); }

// components/mail/Mail.jsx
try { (() => {
const {
  Icon
} = __ds_scope;
const cx = (...a) => a.filter(Boolean).join(' ');
const n150 = n => n > 150 ? '150+' : n;

// One conversation. Selected rows get --hi and the 3px bar; the date gives way to done / remind / command.
function ListRow({
  from,
  subject,
  snippet,
  date,
  unread,
  selected,
  picked,
  starred,
  count,
  draft,
  files = [],
  leaving,
  onClick,
  onDone,
  onRemind,
  onCmd
}) {
  const stop = fn => e => {
    e.stopPropagation();
    fn && fn();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-row', selected && 'sel', unread && 'unread', picked && 'picked', files.length && 'with-atts', leaving && 'leaving'),
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    className: "st"
  }), /*#__PURE__*/React.createElement("span", {
    className: "from"
  }, draft ? /*#__PURE__*/React.createElement("span", {
    className: "d-dr"
  }, "draft ") : null, starred ? /*#__PURE__*/React.createElement("span", {
    className: "star"
  }, "\u2605") : null, from, count > 1 ? /*#__PURE__*/React.createElement("span", {
    className: "cnt"
  }, count) : null), /*#__PURE__*/React.createElement("span", {
    className: "ss"
  }, /*#__PURE__*/React.createElement("span", {
    className: "subj"
  }, subject || '(no subject)'), snippet), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "date"
  }, date), /*#__PURE__*/React.createElement("span", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Mark Done (E)",
    onClick: stop(onDone)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Remind Me (H)",
    onClick: stop(onRemind)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "Command (Ctrl+K)",
    onClick: stop(onCmd)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cmd"
  })))), files.length ? /*#__PURE__*/React.createElement("span", {
    className: "d-ratts"
  }, files.slice(0, 4).map(n => /*#__PURE__*/React.createElement(AttachmentChip, {
    key: n,
    name: n
  })), files.length > 4 ? /*#__PURE__*/React.createElement("span", {
    className: "d-rmore"
  }, `+${files.length - 4}`) : null) : null);
}

// "Important • Other • Newsletters": the inbox's splits, with unread counts in mono.
function SplitTabs({
  splits = [],
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-splits"
  }, splits.map(sp => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: sp.id,
    className: cx('d-split', sp.id === active && 'on'),
    onClick: () => onChange && onChange(sp.id)
  }, sp.name, sp.n ? /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, n150(sp.n)) : null)));
}
function ListSeparator({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-sep"
  }, children);
}
function ListNote({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-note"
  }, children);
}
const FT = [['pdf', /pdf/], ['doc', /^(docx?|odt|rtf|pages)$/], ['sheet', /^(xlsx?|csv|ods|numbers)$/], ['slide', /^(pptx?|odp|key)$/], ['img', /^(png|jpe?g|gif|webp|heic|svg)$/], ['cal', /^(ics|vcs)$/]];
// Same split as the app's fileBits(): base name, short extension, kind, human size.
function fileBits(name = 'file', size) {
  const dot = name.lastIndexOf('.');
  const ext = (dot > 0 ? name.slice(dot + 1) : 'file').toLowerCase().slice(0, 5);
  const kind = (FT.find(([, re]) => re.test(ext)) || ['file'])[0];
  const sz = !size ? '' : size < 1024 ? `${size} b` : size < 1048576 ? `${Math.round(size / 1024)} kb` : `${(size / 1048576).toFixed(1)} mb`;
  return {
    base: dot > 0 ? name.slice(0, dot) : name,
    ext,
    kind,
    size: sz
  };
}
function FileType({
  name
}) {
  const f = fileBits(name);
  return /*#__PURE__*/React.createElement("span", {
    className: cx('d-ftype', `t-${f.kind}`)
  }, f.ext);
}
function AttachmentChip({
  name,
  onClick
}) {
  const f = fileBits(name);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-rchip",
    title: `open ${name}`,
    onClick: onClick
  }, /*#__PURE__*/React.createElement(FileType, {
    name: name
  }), /*#__PURE__*/React.createElement("span", {
    className: "d-rchip-name"
  }, f.base));
}
function ZeroState({
  title = 'inbox zero.',
  line = 'nothing left. go outside.'
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-zero"
  }, /*#__PURE__*/React.createElement("h2", null, title), /*#__PURE__*/React.createElement("p", null, line));
}

// A collapsed message in a thread: bold first name, one line, date.
function MessageRow({
  name,
  snippet,
  date,
  focus,
  draft,
  onClick
}) {
  return /*#__PURE__*/React.createElement("article", {
    className: cx('d-msg d-mrow', focus && 'focus'),
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    className: cx('nm', draft && 'd-dr')
  }, draft ? 'draft' : name), /*#__PURE__*/React.createElement("span", {
    className: "snip"
  }, snippet), /*#__PURE__*/React.createElement("span", {
    className: "dt"
  }, date));
}

// An open message on --card. Body is plain text at 16/24; `paper` for designed HTML mail (white sheet).
function Message({
  from,
  to,
  date,
  focus,
  paper,
  html,
  quoted,
  invite,
  attachments = [],
  onReply,
  onReplyAll,
  onForward,
  children
}) {
  const [showQuote, setShowQuote] = React.useState(false);
  return /*#__PURE__*/React.createElement("article", {
    className: cx('d-msg open', focus && 'focus')
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-msg-h"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nm"
  }, from, to ? ` to ${to}` : ''), /*#__PURE__*/React.createElement("span", {
    className: "macts"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn sm",
    title: "Reply (R)",
    onClick: onReply
  }, "\u21A9"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn sm",
    title: "Reply all (Enter)",
    onClick: onReplyAll
  }, "\u293A"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn sm",
    title: "Forward (F)",
    onClick: onForward
  }, "\u21AA")), /*#__PURE__*/React.createElement("span", {
    className: "dt"
  }, date)), invite, /*#__PURE__*/React.createElement("div", {
    className: cx('d-body', paper && 'paper', html && 'html')
  }, children), quoted ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-dots",
    title: "Show quoted text",
    onClick: () => setShowQuote(!showQuote)
  }, "\u2026"), showQuote ? /*#__PURE__*/React.createElement("div", {
    className: "d-quote"
  }, quoted) : null) : null, attachments.length ? /*#__PURE__*/React.createElement("div", {
    className: "d-atts"
  }, attachments.map(a => /*#__PURE__*/React.createElement(Attachment, {
    key: a.name,
    name: a.name,
    size: a.size
  }))) : null);
}
function Attachment({
  name,
  size,
  onOpen,
  onSave
}) {
  const f = fileBits(name, size);
  return /*#__PURE__*/React.createElement("div", {
    className: "d-att",
    role: "button",
    tabIndex: 0,
    title: `open ${name}`,
    onClick: onOpen
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-att-name"
  }, f.base), /*#__PURE__*/React.createElement("div", {
    className: "d-att-foot"
  }, /*#__PURE__*/React.createElement(FileType, {
    name: name
  }), /*#__PURE__*/React.createElement("span", {
    className: "d-att-size"
  }, f.size), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-att-dl",
    title: "save to Downloads",
    onClick: e => {
      e.stopPropagation();
      onSave && onSave();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download"
  }))));
}

// Under a thread when nothing is being written: four soft buttons, each with its key.
function ReplyBar({
  onReplyAll,
  onReply,
  onForward,
  onEvent
}) {
  const b = (label, key, fn) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-soft",
    onClick: fn
  }, label, " ", /*#__PURE__*/React.createElement("span", {
    className: "d-key"
  }, key));
  return /*#__PURE__*/React.createElement("div", {
    className: "d-replybar"
  }, b('reply all', 'Enter', onReplyAll), b('reply', 'R', onReply), b('forward', 'F', onForward), b('event', 'B', onEvent));
}
function NewMail({
  count = 1,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-newmsgs"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-banner",
    title: "Show new messages (Shift+N)",
    onClick: onClick
  }, `${count > 1 ? `${count} ` : ''}new mail. show`));
}

// The app's tint() from markdown.ts: colours markdown under the transparent textarea, same letter widths.
const esc = s => String(s).replace(/[&<>"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
})[c]);
function tint(text) {
  return `${esc(text || '').replace(/(^|\n)(```[\s\S]*?(?:\n```|(?![\s\S])))/g, '$1<span class="t-code">$2</span>').replace(/^(&gt;.*)$/gm, '<span class="t-quote">$1</span>').replace(/^(#{1,3} .*)$/gm, '<span class="t-head">$1</span>').replace(/^(\s*(?:[-*+]|\d+[.)]) )/gm, '<span class="t-mark">$1</span>').replace(/(\*\*|__)(?=\S)([^\n]*?\S)\1/g, '<span class="t-mark">$1</span><span class="t-bold">$2</span><span class="t-mark">$1</span>').replace(/(^|[^*\w])(\*|_)(?=\S)([^*_\n]*?\S)\2(?![*\w])/g, '$1<span class="t-mark">$2</span><span class="t-it">$3</span><span class="t-mark">$2</span>').replace(/(`)([^`\n]+)(`)/g, '<span class="t-code">$1$2$3</span>')}\n`;
}
function Editor({
  value,
  onChange,
  placeholder = 'write.',
  short,
  boxed
}) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(short ? 96 : 200, el.scrollHeight)}px`;
  }, [value, short]);
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-editor', short && 'short', boxed && 'boxed')
  }, /*#__PURE__*/React.createElement("div", {
    className: "tint",
    "aria-hidden": "true",
    dangerouslySetInnerHTML: {
      __html: tint(value)
    }
  }), /*#__PURE__*/React.createElement("textarea", {
    ref: ref,
    value: value,
    placeholder: placeholder,
    "aria-label": "Message",
    onChange: e => onChange && onChange(e.target.value)
  }));
}

// Writing: To / Cc / Bcc rows, a bold subject line, the tinted writing box, and a footer of words.
function Composer({
  to = '',
  cc,
  subject = '',
  text = '',
  mode = 'new',
  inline,
  files = [],
  suggestions,
  onChange,
  onSend,
  onLater,
  onDiscard
}) {
  const set = k => e => onChange && onChange({
    [k]: e.target.value
  });
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-composer', inline && 'inline')
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-crow"
  }, /*#__PURE__*/React.createElement("b", null, "To"), /*#__PURE__*/React.createElement("input", {
    value: to,
    onChange: set('to'),
    autoComplete: "off",
    "aria-label": "To"
  }), cc === undefined ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ccbtn",
    title: "Cc (Ctrl+Shift+C)",
    onClick: () => onChange && onChange({
      cc: ''
    })
  }, "Cc"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ccbtn",
    title: "Bcc (Ctrl+Shift+B)"
  }, "Bcc")) : null, suggestions), cc !== undefined ? /*#__PURE__*/React.createElement("div", {
    className: "d-crow"
  }, /*#__PURE__*/React.createElement("b", null, "Cc"), /*#__PURE__*/React.createElement("input", {
    value: cc,
    onChange: set('cc'),
    autoComplete: "off",
    "aria-label": "Cc"
  })) : null, /*#__PURE__*/React.createElement("input", {
    className: "d-csubj",
    value: subject,
    onChange: set('subject'),
    placeholder: "subject",
    "aria-label": "Subject"
  }), /*#__PURE__*/React.createElement(Editor, {
    value: text,
    onChange: v => onChange && onChange({
      text: v
    }),
    placeholder: mode === 'new' ? 'write.' : 'reply.'
  }), files.length ? /*#__PURE__*/React.createElement("div", {
    className: "d-cfiles"
  }, files.map(f => /*#__PURE__*/React.createElement(FileChip, {
    key: f.name,
    name: f.name,
    size: f.size
  }))) : null, /*#__PURE__*/React.createElement("div", {
    className: "d-cfoot"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-quiet primary",
    title: "Send (Ctrl+Enter)",
    onClick: onSend
  }, "send"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-quiet",
    title: "Send later (Ctrl+Shift+L)",
    onClick: onLater
  }, "later"), /*#__PURE__*/React.createElement("span", {
    className: "grow"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Attach (Ctrl+Shift+A)"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clip"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Create event (B)"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-ibtn",
    title: "Discard (Ctrl+Shift+,)",
    onClick: onDiscard
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash"
  }))));
}
function FileChip({
  name,
  size,
  onRemove
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "d-cfile"
  }, `${name} `, /*#__PURE__*/React.createElement("small", null, fileBits(name, size).size), /*#__PURE__*/React.createElement("button", {
    type: "button",
    title: "remove",
    "aria-label": `remove ${name}`,
    onClick: onRemove
  }, "\u2715"));
}

// An invitation inside a mail: rsvp / when / where / who rows. Bold question, plain answer.
function Invite({
  answer,
  when,
  where,
  who,
  cancelled,
  onAnswer
}) {
  const row = (q, a) => /*#__PURE__*/React.createElement("div", {
    className: "d-inv-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-inv-q"
  }, q), /*#__PURE__*/React.createElement("span", {
    className: "d-inv-a"
  }, a));
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-invite', cancelled && 'off')
  }, cancelled ? row('rsvp', 'event cancelled.') : row('rsvp', ['yes', 'maybe', 'no'].map(x => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: x,
    className: cx('d-choice', answer === x && 'on'),
    "aria-pressed": answer === x ? 'true' : 'false',
    onClick: () => onAnswer && onAnswer(x)
  }, x))), when ? row('when', when) : null, where ? row('where', where) : null, who ? row('who', who) : null);
}

// People under a To / Cc field. `inline` drops the absolute positioning (for specimens).
function Suggestions({
  people = [],
  active = 0,
  inline
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-sugg', inline && 'inline'),
    role: "listbox"
  }, people.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.address,
    className: cx('d-sg', i === active && 'on'),
    role: "option",
    "aria-selected": i === active ? 'true' : 'false'
  }, /*#__PURE__*/React.createElement("b", null, p.name || p.address), /*#__PURE__*/React.createElement("span", null, p.address))));
}

// The pane beside a conversation: name, address, their recent mail, their domain.
function ContactCard({
  name,
  address,
  mail = []
}) {
  const domain = (address || '').split('@')[1];
  return /*#__PURE__*/React.createElement("div", {
    className: "d-contact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-pane-title"
  }, name), /*#__PURE__*/React.createElement("div", {
    className: "em"
  }, address), /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-h"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail"
  }), " Mail"), mail.slice(0, 4).map(s => /*#__PURE__*/React.createElement("div", {
    className: "it",
    key: s
  }, s))), domain ? /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-h"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search"
  }), " ", domain)) : null);
}
function SearchTips({
  tips = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-tips"
  }, tips.map(([q, meaning]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: q
  }, /*#__PURE__*/React.createElement("b", null, q), /*#__PURE__*/React.createElement("span", null, meaning))));
}
function RecentSearch({
  children,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-recent",
    onClick: onClick
  }, children);
}
Object.assign(__ds_scope, { ListRow, SplitTabs, ListSeparator, ListNote, FileType, AttachmentChip, ZeroState, MessageRow, Message, Attachment, ReplyBar, NewMail, Editor, Composer, FileChip, Invite, Suggestions, ContactCard, SearchTips, RecentSearch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mail/Mail.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Overlays.jsx
try { (() => {
const {
  Icon
} = __ds_scope;
const cx = (...a) => a.filter(Boolean).join(' ');
const caps = (keys = []) => keys.map((k, i) => /*#__PURE__*/React.createElement("span", {
  key: i,
  className: "d-key"
}, k));

// The command palette. Mono throughout: a small head with an icon, a 21px input on the brand bar, 60px lines.
// Plain mode: every line starts with an empty ring and ends in keycaps. Ask modes ("remind when") show typed times.
function CommandPalette({
  icon = 'cmd',
  title = 'dude command',
  placeholder = '',
  query = '',
  items = [],
  active = 0,
  ask,
  inline,
  onQuery,
  onPick,
  onClose
}) {
  const box = /*#__PURE__*/React.createElement("div", {
    className: "d-cmd",
    role: "dialog",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-cmd-h"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon
  }), " ", title), /*#__PURE__*/React.createElement("div", {
    className: "d-cmd-in"
  }, /*#__PURE__*/React.createElement("input", {
    value: query,
    placeholder: placeholder,
    "aria-label": title,
    onChange: e => onQuery && onQuery(e.target.value),
    autoFocus: !inline
  })), /*#__PURE__*/React.createElement("ul", null, items.map((c, i) => /*#__PURE__*/React.createElement("li", {
    key: c.t,
    className: i === active ? 'on' : undefined,
    onClick: () => onPick && onPick(c, i)
  }, ask ? null : /*#__PURE__*/React.createElement("span", {
    className: "ic"
  }), /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, c.t), c.when ? /*#__PURE__*/React.createElement("span", {
    className: "when"
  }, c.when) : /*#__PURE__*/React.createElement("span", {
    className: "ks"
  }, caps(c.keys))))));
  if (inline) return box;
  return /*#__PURE__*/React.createElement("div", {
    className: "d-scrim",
    onClick: e => e.target === e.currentTarget && onClose && onClose()
  }, box);
}

// A dialog: dims the app (the only overlay that does), 17px title in lowercase.
function Dialog({
  title,
  width,
  inline,
  onClose,
  children
}) {
  const box = /*#__PURE__*/React.createElement("div", {
    className: "d-dlg",
    role: "dialog",
    style: width ? {
      width
    } : undefined
  }, title ? /*#__PURE__*/React.createElement("h2", null, title) : null, children);
  if (inline) return box;
  return /*#__PURE__*/React.createElement("div", {
    className: "d-scrim dim",
    onClick: e => e.target === e.currentTarget && onClose && onClose()
  }, box);
}

// The shortcut sheet inside a Dialog: two columns of groups, caps group heads, keycaps on the right.
function KeysList({
  groups = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-keys"
  }, groups.map(([g, rows]) => /*#__PURE__*/React.createElement("section", {
    key: g
  }, /*#__PURE__*/React.createElement("h5", null, g), rows.map(([name, keys]) => /*#__PURE__*/React.createElement("div", {
    key: name
  }, /*#__PURE__*/React.createElement("span", null, name), /*#__PURE__*/React.createElement("span", null, caps(keys.split(' '))))))));
}

// A toast. Pass ["sending… ", "Z", " undo"] to put a keycap in the middle.
function Toast({
  msg
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-toast"
  }, Array.isArray(msg) ? [msg[0], /*#__PURE__*/React.createElement("span", {
    key: "k",
    className: "d-key"
  }, msg[1]), msg[2]] : msg);
}
function ToastStack({
  toasts = [],
  inline
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-toasts', inline && 'inline'),
    role: "status",
    "aria-live": "polite"
  }, toasts.map((t, i) => /*#__PURE__*/React.createElement(Toast, {
    key: i,
    msg: t
  })));
}

// Folders: your address, the fixed views with G-then-key chords, your folders, Settings last.
function SideMenu({
  account,
  items = [],
  folders = [],
  active = 0,
  inline,
  onPick,
  onClose
}) {
  let n = -1;
  const line = it => {
    n += 1;
    const i = n;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: `${it.label}${i}`,
      className: cx('d-sm-item', i === active && 'on'),
      onClick: () => onPick && onPick(it, i)
    }, /*#__PURE__*/React.createElement("span", null, it.label, it.n ? /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, it.n > 150 ? '150+' : it.n) : null), /*#__PURE__*/React.createElement("span", {
      className: "d-sm-keys"
    }, it.keys && it.keys[0] === 'G' && it.keys.length === 2 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "d-key"
    }, "G"), /*#__PURE__*/React.createElement("small", null, "then"), /*#__PURE__*/React.createElement("span", {
      className: "d-key"
    }, it.keys[1])) : caps(it.keys)));
  };
  const nav = /*#__PURE__*/React.createElement("nav", {
    className: cx('d-sidemenu', inline && 'inline'),
    "aria-label": "Folders"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-sm-head"
  }, account), items.map(line), folders.length ? /*#__PURE__*/React.createElement("div", {
    className: "d-sm-sep"
  }, "Folders") : null, folders.map(f => line({
    label: f,
    keys: []
  })), /*#__PURE__*/React.createElement("div", {
    className: "d-sm-gap"
  }), line({
    label: 'Settings',
    keys: ['Ctrl', ',']
  }));
  if (inline) return nav;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "d-sidemenu-scrim",
    onClick: onClose
  }), nav);
}
function AuthBar({
  email,
  inline,
  onLogin
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-authbar', inline && 'inline'),
    role: "alert"
  }, /*#__PURE__*/React.createElement("span", null, "login for ", /*#__PURE__*/React.createElement("b", null, email), " dead. mail stuck."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-alert",
    onClick: onLogin
  }, "login again"));
}

// PDFs and pictures open inside the app: a page-coloured bar over a near-black backdrop.
function FileViewer({
  name,
  src,
  pdf,
  inline,
  onSave,
  onClose,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: cx('d-viewer', inline && 'inline'),
    role: "dialog",
    "aria-label": name
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-vbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-vname"
  }, name), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-toolbar",
    title: "save to Downloads (S)",
    onClick: onSave
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download"
  }), " save"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-btn-toolbar",
    title: "close (Esc)",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "d-vbody"
  }, children || (src ? pdf ? /*#__PURE__*/React.createElement("iframe", {
    src: src,
    title: name
  }) : /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : null)));
}
Object.assign(__ds_scope, { CommandPalette, Dialog, KeysList, Toast, ToastStack, SideMenu, AuthBar, FileViewer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Overlays.jsx", error: String((e && e.message) || e) }); }

// components/shell/Shell.jsx
try { (() => {
const {
  Icon
} = __ds_scope; // Rail | main | pane. `enter` replays the screen-change animation: "enter-fade" for lists, "enter-in" for a thread.
function AppShell({
  rail,
  pane,
  enter,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-shell"
  }, rail, /*#__PURE__*/React.createElement("div", {
    className: ['d-main', enter].filter(Boolean).join(' ')
  }, children), pane);
}
function Logo() {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-logo"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-logo-mark"
  }, "d"), /*#__PURE__*/React.createElement("span", {
    className: "d-logo-word"
  }, "dude"));
}
function Rail({
  active = 'mail',
  onChange
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "d-rail",
    "aria-label": "Apps"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: active === 'mail' ? 'on' : undefined,
    title: "Mail (1)",
    "aria-label": "Mail",
    onClick: () => onChange && onChange('mail')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail"
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: active === 'cal' ? 'on' : undefined,
    title: "Calendar (2)",
    "aria-label": "Calendar",
    onClick: () => onChange && onChange('cal')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal"
  })));
}

// The list's header: hamburger at 18px, the splits (or the folder name), then the three icons on the right.
function ListHeader({
  onMenu,
  actions,
  children
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "d-head"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-menu-btn",
    title: "Folders",
    "aria-label": "Folders",
    onClick: onMenu
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "menu"
  })), children, actions ? /*#__PURE__*/React.createElement("div", {
    className: "d-head-icons"
  }, actions) : null);
}

// A reading page: back arrow pinned top-left, a 712px column, the subject as a 22px light title.
function ThreadView({
  title,
  onBack,
  actions,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-thread"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-thread-top"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "d-back",
    title: "Back (Esc)",
    "aria-label": "Back",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "back"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "d-tcol"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-thead"
  }, /*#__PURE__*/React.createElement("h1", null, title), actions ? /*#__PURE__*/React.createElement("div", {
    className: "d-tacts"
  }, actions) : null), children));
}

// The right pane. `contact` panes hide under 1200px; calendar panes stay.
function Pane({
  title,
  contact,
  foot,
  footAction,
  children
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: ['d-pane', contact && 'contact'].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-pane-body"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "d-pane-title"
  }, title) : null, children), foot ? /*#__PURE__*/React.createElement("div", {
    className: "d-pane-foot"
  }, /*#__PURE__*/React.createElement("b", null, foot), footAction) : null);
}

// A settings block: 15px bold lowercase title, one plain hint line, the control. Hairline under each.
function SettingsSection({
  title,
  hint,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "d-set"
  }, /*#__PURE__*/React.createElement("h3", null, title), hint ? /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, hint) : null, children);
}
function TabBar({
  items = ['Inbox', 'Search', 'Compose', 'Calendar', 'More'],
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "d-tabbar"
  }, items.map(t => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: t,
    onClick: () => onPick && onPick(t)
  }, t)));
}
Object.assign(__ds_scope, { AppShell, Logo, Rail, ListHeader, ThreadView, Pane, SettingsSection, TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mail/app.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// dude, as a click-through: sign-in → inbox → thread → reply / compose, search, settings, week, palette.
// Keys work like the app: J K Enter Esc E Z C R / 0 2 1 ? Ctrl+K, and ← for folders.
const {
  Logo,
  Button,
  IconButton,
  Segmented,
  Field,
  BarInput,
  AppShell,
  Rail,
  ListHeader,
  ThreadView,
  Pane,
  SettingsSection,
  SplitTabs,
  ListSeparator,
  ListNote,
  ListRow,
  ZeroState,
  MessageRow,
  Message,
  Invite,
  ReplyBar,
  Composer,
  Editor,
  ContactCard,
  SearchTips,
  RecentSearch,
  CommandPalette,
  Dialog,
  KeysList,
  ToastStack,
  SideMenu,
  DayCalendar,
  WeekView,
  MiniMonth,
  CalendarOptions
} = window.DudeDesignSystem_3fa3b0;
const COMMANDS = [{
  t: 'Mark Done',
  keys: ['E'],
  run: 'done'
}, {
  t: 'Remind Me',
  keys: ['H'],
  run: 'remind'
}, {
  t: 'Compose',
  keys: ['C'],
  run: 'compose'
}, {
  t: 'Search',
  keys: ['/'],
  run: 'search'
}, {
  t: 'Show or Hide Calendar',
  keys: ['0'],
  run: 'day'
}, {
  t: 'Open Week',
  keys: ['2'],
  run: 'week'
}, {
  t: 'Go to Folder…',
  keys: ['←'],
  run: 'menu'
}, {
  t: 'Switch Theme',
  keys: [],
  run: 'theme'
}, {
  t: 'Settings',
  keys: ['Ctrl', ','],
  run: 'settings'
}, {
  t: 'Undo',
  keys: ['Z'],
  run: 'undo'
}];
const REMIND = [{
  t: 'tomorrow',
  when: 'Tue 8:00 AM'
}, {
  t: 'next week',
  when: 'Mon 8:00 AM'
}, {
  t: 'this weekend',
  when: 'Sat 8:00 AM'
}, {
  t: 'someday',
  when: '¯\\_(ツ)_/¯'
}];
function SignIn({
  onDemo
}) {
  const [more, setMore] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "kit-signin"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kit-signin-inner"
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement("div", {
    className: "kit-prompt",
    role: "heading",
    "aria-level": "1"
  }, "no super. just email."), /*#__PURE__*/React.createElement("div", {
    className: "kit-go"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "main",
    onClick: () => setMore(true)
  }, "go")), more ? /*#__PURE__*/React.createElement("div", {
    className: "kit-more"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onDemo
  }, "try demo"), /*#__PURE__*/React.createElement("p", null, "demo only. real mail need desktop app.")) : null));
}
function App() {
  const [screen, setScreen] = React.useState(location.hash === '#signin' ? 'signin' : 'list');
  const [dark, setDark] = React.useState(/carbon/.test(location.hash));
  const [split, setSplit] = React.useState('important');
  const [sel, setSel] = React.useState(0);
  const [done, setDone] = React.useState([]);
  const [leaving, setLeaving] = React.useState(null);
  const [openId, setOpenId] = React.useState(null);
  const [reply, setReply] = React.useState(null);
  const [draft, setDraft] = React.useState({
    to: '',
    subject: '',
    text: ''
  });
  const [paneDay, setPaneDay] = React.useState(false);
  const [overlay, setOverlay] = React.useState(null); // {kind:'cmd'|'remind'|'keys'|'menu', q, i}
  const [toasts, setToasts] = React.useState([]);
  const [rsvp, setRsvp] = React.useState({});
  const [q, setQ] = React.useState('');
  const [undo, setUndo] = React.useState(3);
  const [sig, setSig] = React.useState('Best,\n**You**');
  const [enter, setEnter] = React.useState('enter-fade');
  React.useEffect(() => {
    document.documentElement.classList.toggle('carbon', dark);
  }, [dark]);
  const toast = m => {
    setToasts(l => [...l, m]);
    setTimeout(() => setToasts(l => l.slice(1)), 2600);
  };
  const rows = THREADS.filter(t => t.split === split && !done.includes(t.id));
  const counts = {
    important: THREADS.filter(t => t.split === 'important' && t.unread && !done.includes(t.id)).length,
    other: THREADS.filter(t => t.split === 'other' && t.unread && !done.includes(t.id)).length
  };
  const cur = screen === 'thread' ? THREADS.find(t => t.id === openId) : rows[Math.min(sel, rows.length - 1)];
  const go = s => {
    setEnter(s === 'thread' || s === 'compose' ? 'enter-in' : 'enter-fade');
    setReply(null);
    setScreen(s);
  };
  const open = t => {
    if (!t) return;
    setOpenId(t.id);
    setReply(null);
    t.unread = false;
    go('thread');
  };
  const markDone = () => {
    const t = cur;
    if (!t) return;
    if (screen === 'thread') {
      setDone(d => [...d, t.id]);
      go('list');
    } else {
      setLeaving(t.id);
      setTimeout(() => {
        setDone(d => [...d, t.id]);
        setLeaving(null);
      }, 160);
    }
    toast(['done. ', 'Z', ' undo']);
  };
  const doUndo = () => {
    if (!done.length) return toast('nothing undo.');
    setDone(d => d.slice(0, -1));
    toast('undone.');
  };
  const run = r => {
    setOverlay(null);
    if (r === 'done') markDone();else if (r === 'remind') setOverlay({
      kind: 'remind',
      q: '',
      i: 0
    });else if (r === 'compose') {
      setDraft({
        to: '',
        subject: '',
        text: ''
      });
      go('compose');
    } else if (r === 'search') go('search');else if (r === 'day') setPaneDay(v => !v);else if (r === 'week') go('week');else if (r === 'menu') setOverlay({
      kind: 'menu',
      i: 0
    });else if (r === 'theme') setDark(v => !v);else if (r === 'settings') go('settings');else if (r === 'undo') doUndo();
  };
  const send = () => {
    toast(['sending… ', 'Z', ' undo']);
    setTimeout(() => toast('sent.'), undo * 1000 || 300);
    if (screen === 'compose') go('list');
    setReply(null);
  };
  const palItems = () => (overlay?.kind === 'remind' ? REMIND : COMMANDS).filter(c => c.t.toLowerCase().includes((overlay?.q || '').toLowerCase()));
  React.useEffect(() => {
    const onKey = e => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
      const mod = e.ctrlKey || e.metaKey;
      if (screen === 'signin') return;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        return setOverlay({
          kind: 'cmd',
          q: '',
          i: 0
        });
      }
      if (mod && e.key === 'Enter' && (reply || screen === 'compose')) {
        e.preventDefault();
        return send();
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        return go('settings');
      }
      if (overlay && (overlay.kind === 'cmd' || overlay.kind === 'remind')) {
        const items = palItems();
        if (e.key === 'Escape') setOverlay(null);else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setOverlay({
            ...overlay,
            i: Math.min(overlay.i + 1, items.length - 1)
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setOverlay({
            ...overlay,
            i: Math.max(overlay.i - 1, 0)
          });
        } else if (e.key === 'Enter') {
          const it = items[overlay.i];
          if (overlay.kind === 'remind') {
            setOverlay(null);
            if (it) {
              setDone(d => [...d, cur.id]);
              toast([`remind ${it.when === '¯\\_(ツ)_/¯' ? 'someday' : it.when} `, 'Z', ' undo']);
              if (screen === 'thread') go('list');
            }
          } else if (it) run(it.run);
        }
        return;
      }
      if (overlay) {
        if (e.key === 'Escape') setOverlay(null);
        return;
      }
      if (e.key === 'Escape') {
        if (typing) document.activeElement.blur();
        if (reply) return setReply(null);
        if (screen !== 'list') return go('list');
        return;
      }
      if (typing) return;
      const k = e.key;
      if (screen === 'list') {
        if (k === 'j') setSel(s => Math.min(s + 1, rows.length - 1));else if (k === 'k') setSel(s => Math.max(s - 1, 0));else if (k === 'Enter') open(cur);else if (k === 'Tab') {
          e.preventDefault();
          setSplit(s => s === 'important' ? 'other' : 'important');
          setSel(0);
        } else if (k === 'ArrowLeft') setOverlay({
          kind: 'menu',
          i: 0
        });
      }
      if (screen === 'thread') {
        if (k === 'Enter' || k === 'r') {
          e.preventDefault();
          setReply({
            to: cur.from.split(' ')[0].toLowerCase(),
            subject: `Re: ${cur.subject.replace(/^Re: /, '')}`,
            text: ''
          });
        }
      }
      const triage = screen === 'list' || screen === 'thread';
      if (k === 'e' && triage) markDone();else if (k === 'h' && triage) setOverlay({
        kind: 'remind',
        q: '',
        i: 0
      });else if (k === 'z') doUndo();else if (k === 'c') {
        e.preventDefault();
        run('compose');
      } else if (k === '/') {
        e.preventDefault();
        go('search');
      } else if (k === '0') setPaneDay(v => !v);else if (k === '2') go('week');else if (k === '1') go('list');else if (k === '?') setOverlay({
        kind: 'keys'
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  if (screen === 'signin') return /*#__PURE__*/React.createElement(SignIn, {
    onDemo: () => go('list')
  });
  const headIcons = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
    icon: "cal",
    on: paneDay,
    title: "Calendar (0)",
    onClick: () => setPaneDay(!paneDay)
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "pen",
    title: "Compose (C)",
    onClick: () => run('compose')
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "search",
    title: "Search (/)",
    onClick: () => go('search')
  }));
  const todayIdx = 1;
  const dayPane = inv => {
    const di = inv ? inv.day : todayIdx;
    const evs = [...WEEK[di].events, ...(inv ? [{
      title: 'Research seminar',
      start: inv.start,
      end: inv.end,
      where: inv.where,
      kind: 'inv'
    }] : [])];
    return /*#__PURE__*/React.createElement("aside", {
      className: "d-pane"
    }, /*#__PURE__*/React.createElement(DayCalendar, {
      label: DAY_LABELS[di],
      isToday: di === todayIdx,
      allDay: WEEK[di].allDay || [],
      events: evs,
      now: di === todayIdx ? NOW : undefined,
      scrollTo: inv ? 12 : 8.5,
      onWeek: () => go('week')
    }), /*#__PURE__*/React.createElement("div", {
      className: "d-pane-foot"
    }, /*#__PURE__*/React.createElement("b", null, ME.address), /*#__PURE__*/React.createElement(IconButton, {
      title: "Create Event (B)"
    }, "+")));
  };
  let main, pane;
  if (screen === 'list') {
    main = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ListHeader, {
      onMenu: () => setOverlay({
        kind: 'menu',
        i: 0
      }),
      actions: headIcons
    }, /*#__PURE__*/React.createElement(SplitTabs, {
      active: split,
      onChange: s => {
        setSplit(s);
        setSel(0);
      },
      splits: [{
        id: 'important',
        name: 'Important',
        n: counts.important
      }, {
        id: 'other',
        name: 'Other',
        n: counts.other
      }]
    })), rows.length ? /*#__PURE__*/React.createElement("div", {
      className: "d-list"
    }, rows.map((t, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: t.id
    }, t.group && t.group !== (rows[i - 1] || {}).group ? /*#__PURE__*/React.createElement(ListSeparator, null, t.group) : null, /*#__PURE__*/React.createElement(ListRow, _extends({}, t, {
      selected: i === sel,
      leaving: leaving === t.id,
      onClick: () => {
        setSel(i);
        open(t);
      },
      onDone: () => {
        setSel(i);
        markDone();
      },
      onRemind: () => setOverlay({
        kind: 'remind',
        q: '',
        i: 0
      }),
      onCmd: () => setOverlay({
        kind: 'cmd',
        q: '',
        i: 0
      })
    }))))) : /*#__PURE__*/React.createElement(ZeroState, null));
    pane = paneDay ? dayPane() : cur ? /*#__PURE__*/React.createElement(Pane, {
      contact: true,
      foot: ME.address,
      footAction: /*#__PURE__*/React.createElement(IconButton, {
        title: "Shortcuts (?)",
        onClick: () => setOverlay({
          kind: 'keys'
        })
      }, "?")
    }, /*#__PURE__*/React.createElement(ContactCard, {
      name: cur.from,
      address: cur.address,
      mail: THREADS.filter(x => x.address === cur.address).map(x => x.subject)
    })) : null;
  } else if (screen === 'thread' && cur) {
    const last = cur.messages.length - 1;
    main = /*#__PURE__*/React.createElement(ThreadView, {
      title: cur.subject,
      onBack: () => go('list'),
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "check",
        title: "Mark Done (E)",
        onClick: markDone
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "clock",
        title: "Remind Me (H)",
        onClick: () => setOverlay({
          kind: 'remind',
          q: '',
          i: 0
        })
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "cmd",
        title: "Command",
        onClick: () => setOverlay({
          kind: 'cmd',
          q: '',
          i: 0
        })
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "up",
        title: "Previous conversation (K)"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "down",
        title: "Next conversation (J)"
      }))
    }, cur.messages.map((m, i) => i < last ? /*#__PURE__*/React.createElement(MessageRow, {
      key: i,
      name: m.from.split(' ')[0],
      snippet: m.text,
      date: m.date
    }) : /*#__PURE__*/React.createElement(Message, {
      key: i,
      focus: !reply,
      from: m.from,
      to: "You",
      date: m.date,
      paper: m.paper,
      html: m.html,
      quoted: m.quoted,
      attachments: m.attachments,
      invite: cur.invite ? /*#__PURE__*/React.createElement(Invite, {
        answer: rsvp[cur.id],
        onAnswer: a => {
          setRsvp({
            ...rsvp,
            [cur.id]: a
          });
          toast(`${{
            yes: 'going.',
            maybe: 'maybe.',
            no: 'not going.'
          }[a]} organizer told.`);
        },
        when: cur.invite.when,
        where: cur.invite.where,
        who: cur.invite.who
      }) : null,
      onReply: () => setReply({
        to: m.from.split(' ')[0].toLowerCase(),
        subject: `Re: ${cur.subject}`,
        text: ''
      })
    }, m.paper ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Georgia',
        background: '#f4efe6',
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        color: '#222',
        margin: '0 0 8px'
      }
    }, "The Weekly Byte"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: '#333',
        margin: 0
      }
    }, m.text)) : m.text)), reply ? /*#__PURE__*/React.createElement(Composer, _extends({
      inline: true,
      mode: "reply"
    }, reply, {
      onChange: p => setReply({
        ...reply,
        ...p
      }),
      onSend: send,
      onDiscard: () => setReply(null)
    })) : /*#__PURE__*/React.createElement(ReplyBar, {
      onReplyAll: () => setReply({
        to: cur.from.split(' ')[0].toLowerCase(),
        subject: `Re: ${cur.subject}`,
        text: ''
      }),
      onReply: () => setReply({
        to: cur.from.split(' ')[0].toLowerCase(),
        subject: `Re: ${cur.subject}`,
        text: ''
      }),
      onEvent: () => setPaneDay(true)
    }));
    pane = cur.invite ? dayPane(cur.invite) : paneDay ? dayPane() : /*#__PURE__*/React.createElement(Pane, {
      contact: true,
      foot: ME.address,
      footAction: /*#__PURE__*/React.createElement(IconButton, {
        title: "Shortcuts (?)",
        onClick: () => setOverlay({
          kind: 'keys'
        })
      }, "?")
    }, /*#__PURE__*/React.createElement(ContactCard, {
      name: cur.from,
      address: cur.address,
      mail: THREADS.filter(x => x.address === cur.address).map(x => x.subject)
    }));
  } else if (screen === 'compose') {
    main = /*#__PURE__*/React.createElement(ThreadView, {
      title: draft.subject.trim() || 'new mail',
      onBack: () => go('list')
    }, /*#__PURE__*/React.createElement(Composer, _extends({}, draft, {
      onChange: p => setDraft({
        ...draft,
        ...p
      }),
      onSend: send,
      onDiscard: () => go('list')
    })));
    pane = /*#__PURE__*/React.createElement(Pane, {
      contact: true,
      title: "You"
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-contact"
    }, /*#__PURE__*/React.createElement("div", {
      className: "em"
    }, ME.address)));
  } else if (screen === 'search') {
    main = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
      className: "d-head",
      style: {
        paddingRight: 30
      }
    }, /*#__PURE__*/React.createElement(BarInput, {
      autoFocus: true,
      placeholder: "search",
      value: q,
      onChange: e => setQ(e.target.value),
      "aria-label": "Search",
      style: {
        marginLeft: -16
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      title: "Close (Esc)",
      onClick: () => go('list')
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      className: "d-list"
    }, q ? THREADS.filter(t => (t.subject + t.snippet + t.from).toLowerCase().includes(q.toLowerCase())).map(t => /*#__PURE__*/React.createElement(ListRow, _extends({
      key: t.id
    }, t, {
      onClick: () => open(t)
    }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RecentSearch, null, "from:maya"), /*#__PURE__*/React.createElement(RecentSearch, null, "has:attachment poster"))));
    pane = /*#__PURE__*/React.createElement(Pane, {
      contact: true,
      title: "tricks"
    }, /*#__PURE__*/React.createElement(SearchTips, {
      tips: TIPS
    }));
  } else if (screen === 'settings') {
    main = /*#__PURE__*/React.createElement(ThreadView, {
      title: "settings",
      onBack: () => go('list')
    }, /*#__PURE__*/React.createElement(SettingsSection, {
      title: "signature",
      hint: "goes under mail. **bold** *italic* `code` links ok."
    }, /*#__PURE__*/React.createElement(Editor, {
      short: true,
      boxed: true,
      value: sig,
      onChange: setSig,
      placeholder: 'Best,\nYour name'
    })), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "name",
      hint: "name on your mail."
    }, /*#__PURE__*/React.createElement(Field, {
      defaultValue: "You",
      placeholder: "name"
    })), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "undo send",
      hint: "time to hit Z."
    }, /*#__PURE__*/React.createElement(Segmented, {
      value: undo,
      onChange: setUndo,
      options: [{
        value: 0,
        label: 'off'
      }, {
        value: 3,
        label: '3 s'
      }, {
        value: 5,
        label: '5 s'
      }, {
        value: 10,
        label: '10 s'
      }, {
        value: 20,
        label: '20 s'
      }]
    })), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "ping",
      hint: "new mail ping. dude live in tray."
    }, /*#__PURE__*/React.createElement(Segmented, {
      value: "important",
      options: [{
        value: 'important',
        label: 'important'
      }, {
        value: 'all',
        label: 'all'
      }, {
        value: 'off',
        label: 'off'
      }]
    })), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "look"
    }, /*#__PURE__*/React.createElement(Segmented, {
      value: dark ? 'carbon' : 'light',
      onChange: v => setDark(v === 'carbon'),
      options: [{
        value: 'carbon',
        label: 'dark'
      }, {
        value: 'light',
        label: 'light'
      }]
    })), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "splits",
      hint: "only important + other."
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "link"
    }, "new split")), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "account"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kit-setrow"
    }, /*#__PURE__*/React.createElement("span", null, ME.address), /*#__PURE__*/React.createElement(Button, {
      variant: "link",
      onClick: () => go('signin')
    }, "logout"))), /*#__PURE__*/React.createElement(SettingsSection, {
      title: "keys"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "link",
      onClick: () => setOverlay({
        kind: 'keys'
      })
    }, "all keys")));
    pane = /*#__PURE__*/React.createElement(Pane, {
      contact: true,
      title: "looks like"
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-sigprev",
      dangerouslySetInnerHTML: {
        __html: sig.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>')
      }
    }));
  } else if (screen === 'week') {
    main = /*#__PURE__*/React.createElement(WeekView, {
      title: "November 2026",
      days: WEEK,
      now: NOW,
      scrollTo: 8.5,
      onAdd: () => toast('event need name.')
    });
    pane = /*#__PURE__*/React.createElement("aside", {
      className: "d-pane"
    }, /*#__PURE__*/React.createElement(MiniMonth, {
      year: 2026,
      month: 10,
      today: 23,
      weekOf: 23
    }), /*#__PURE__*/React.createElement(CalendarOptions, {
      account: ME.address,
      options: [{
        label: 'weekends',
        on: true
      }, {
        label: 'declined events'
      }, {
        label: 'week starts monday'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "d-pane-foot"
    }, /*#__PURE__*/React.createElement("b", null, ME.address), /*#__PURE__*/React.createElement(IconButton, {
      title: "Create Event (B)"
    }, "+")));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(AppShell, {
    enter: enter,
    rail: /*#__PURE__*/React.createElement(Rail, {
      active: screen === 'week' ? 'cal' : 'mail',
      onChange: v => go(v === 'cal' ? 'week' : 'list')
    }),
    pane: pane
  }, /*#__PURE__*/React.createElement(React.Fragment, {
    key: screen + (openId || '') + split
  }, main)), overlay?.kind === 'cmd' || overlay?.kind === 'remind' ? /*#__PURE__*/React.createElement(CommandPalette, {
    ask: overlay.kind === 'remind',
    icon: overlay.kind === 'remind' ? 'clock' : 'cmd',
    title: overlay.kind === 'remind' ? 'remind when' : 'dude command',
    placeholder: overlay.kind === 'remind' ? 'when? 8 am, 3 days, aug 7' : '',
    query: overlay.q,
    items: palItems(),
    active: overlay.i,
    onQuery: v => setOverlay({
      ...overlay,
      q: v,
      i: 0
    }),
    onPick: c => overlay.kind === 'remind' ? (setOverlay(null), cur && (setDone(d => [...d, cur.id]), toast([`remind ${c.t} `, 'Z', ' undo']))) : run(c.run),
    onClose: () => setOverlay(null)
  }) : null, overlay?.kind === 'keys' ? /*#__PURE__*/React.createElement(Dialog, {
    title: "keys",
    width: 720,
    onClose: () => setOverlay(null)
  }, /*#__PURE__*/React.createElement(KeysList, {
    groups: KEY_GROUPS
  })) : null, overlay?.kind === 'menu' ? /*#__PURE__*/React.createElement(SideMenu, {
    account: ME.address,
    items: MENU.map((m, i) => i === 0 ? {
      ...m,
      n: counts.important
    } : m),
    folders: ['Projects', 'Receipts'],
    active: 0,
    onPick: it => {
      setOverlay(null);
      if (it.label === 'Settings') go('settings');else go('list');
    },
    onClose: () => setOverlay(null)
  }) : null, /*#__PURE__*/React.createElement(ToastStack, {
    toasts: toasts
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mail/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mail/data.jsx
try { (() => {
// Demo mailbox for the UI kit. Content follows app/web/demo.ts; "today" is Mon Nov 23 2026.
const ME = {
  name: 'You',
  address: 'you@example.edu'
};
const THREADS = [{
  id: 't1',
  split: 'important',
  group: '',
  from: 'Maya Lindqvist',
  address: 'maya.lindqvist@example.edu',
  subject: 'Draft of the thesis chapter 3',
  date: '2:22 PM',
  unread: true,
  snippet: 'Hi! I went through chapter 3 and left comments in the margins. The method section reads well; the evaluation needs one more baseline.',
  messages: [{
    from: 'Maya Lindqvist',
    date: '2:22 PM',
    text: 'Hi! I went through chapter 3 and left comments in the margins. The method section reads well; the evaluation needs one more baseline. Can we talk on Thursday?\n\nMaya'
  }]
}, {
  id: 't2',
  split: 'other',
  group: '',
  from: 'CodeHost',
  address: 'notifications@codehost.example',
  subject: '[dude/core] Pull request #214: faster thread list rendering',
  date: '1:30 PM',
  unread: true,
  snippet: 'jun-park requested your review on #214. Changes: virtualised rows, memoised date grouping, 38 files changed.',
  messages: [{
    from: 'CodeHost',
    date: '1:30 PM',
    text: 'jun-park requested your review on #214.\n\nChanges: virtualised rows, memoised date grouping, 38 files changed.'
  }]
}, {
  id: 't3',
  split: 'important',
  group: '',
  from: 'Omar Haddad',
  address: 'omar@studio-north.example',
  subject: 'Re: Poster layout',
  date: '12:08 PM',
  unread: true,
  count: 3,
  files: ['poster-final.pdf'],
  snippet: 'Looks great. I nudged the title up a bit and swapped the fonts on the figure captions. Final PDF attached.',
  messages: [{
    from: 'Me',
    date: '22 Nov',
    text: 'Here is the first poster draft. Does the layout work for you?'
  }, {
    from: 'Omar',
    date: '22 Nov',
    text: 'Mostly! Could the title be larger?'
  }, {
    from: 'Omar Haddad',
    date: '12:08 PM',
    text: 'Looks great. I nudged the title up a bit and swapped the fonts on the figure captions. Final PDF attached.',
    quoted: 'On Sun, Omar Haddad wrote:\n> Mostly! Could the title be larger?',
    attachments: [{
      name: 'poster-final.pdf',
      size: 248000
    }],
    html: true
  }]
}, {
  id: 't4',
  split: 'important',
  group: '',
  from: 'Department Calendar',
  address: 'calendar@example.edu',
  subject: 'Invitation: Research seminar @ Thu 14:00',
  date: '10:15 AM',
  unread: true,
  snippet: 'You have been invited to Research seminar. When: Thursday 14:00-15:30. Where: Lecture hall T2.',
  invite: {
    when: 'Thursday, November 26, 2:00 PM – 3:30 PM',
    where: 'Lecture hall T2',
    who: 'Department Calendar, Maya Lindqvist, Lena Virtanen',
    day: 4,
    start: 14,
    end: 15.5
  },
  messages: [{
    from: 'Department Calendar',
    date: '10:15 AM',
    text: 'You have been invited to Research seminar.\n\nWhen: Thursday 14:00-15:30\nWhere: Lecture hall T2'
  }]
}, {
  id: 't5',
  split: 'important',
  group: 'Yesterday',
  from: 'Lena Virtanen',
  address: 'lena.virtanen@example.edu',
  subject: 'Course assistants meeting notes',
  date: '22 Nov',
  starred: true,
  snippet: 'Notes from today: exam dates confirmed, grading split by exercise set, next sync in two weeks.',
  messages: [{
    from: 'Lena Virtanen',
    date: '22 Nov',
    text: 'Notes from today: exam dates confirmed, grading split by exercise set, next sync in two weeks.'
  }]
}, {
  id: 't6',
  split: 'other',
  group: 'Yesterday',
  from: 'The Weekly Byte',
  address: 'hello@weeklybyte.example',
  subject: 'Ten keyboard tricks you are not using yet',
  date: '22 Nov',
  paper: true,
  snippet: 'This week: modal editing everywhere, why command palettes won, and a tiny tool that renames 2,000 files.',
  messages: [{
    from: 'The Weekly Byte',
    date: '22 Nov',
    paper: true,
    text: 'This week: modal editing everywhere, why command palettes won, and a tiny tool that renames 2,000 files.'
  }]
}, {
  id: 't7',
  split: 'important',
  group: 'Yesterday',
  from: 'Jun Park',
  address: 'jun.park@example.org',
  subject: 'Lunch on Friday?',
  date: '22 Nov',
  unread: true,
  snippet: 'There is a new noodle place next to the library. 12:15?',
  messages: [{
    from: 'Jun Park',
    date: '22 Nov',
    text: 'There is a new noodle place next to the library. 12:15?'
  }]
}, {
  id: 't8',
  split: 'other',
  group: 'Yesterday',
  from: 'Northbank',
  address: 'no-reply@northbank.example',
  subject: 'Your monthly statement is ready',
  date: '22 Nov',
  snippet: 'Your statement for this month is available in the online bank.',
  messages: [{
    from: 'Northbank',
    date: '22 Nov',
    text: 'Your statement for this month is available in the online bank.'
  }]
}, {
  id: 't9',
  split: 'important',
  group: 'November 21st',
  from: 'Priya Nair',
  address: 'priya@labmail.example',
  subject: 'Dataset access',
  date: '21 Nov',
  snippet: 'I have added you to the shared bucket. Credentials are in the usual vault entry. Ping me if anything is missing.',
  messages: [{
    from: 'Priya Nair',
    date: '21 Nov',
    text: 'I have added you to the shared bucket. Credentials are in the usual vault entry. Ping me if anything is missing.'
  }]
}, {
  id: 't10',
  split: 'important',
  group: 'Last 7 days',
  from: 'Tom Becker',
  address: 'tbecker@example.edu',
  subject: 'Re: Grant report deadline',
  date: '20 Nov',
  count: 2,
  snippet: 'Thanks for the reminder. I will send my part by Monday morning.',
  messages: [{
    from: 'Me',
    date: '19 Nov',
    text: 'Reminder: the grant report is due on the 1st.'
  }, {
    from: 'Tom Becker',
    date: '20 Nov',
    text: 'Thanks for the reminder. I will send my part by Monday morning.'
  }]
}, {
  id: 't11',
  split: 'important',
  group: 'Last 7 days',
  from: 'Ana Costa',
  address: 'ana.costa@example.com',
  subject: 'Photos from the hike',
  date: '19 Nov',
  files: ['ridge.jpg', 'summit.jpg', 'route.gpx'],
  snippet: 'Uploaded the photos from Saturday, the ridge shot came out really well!',
  messages: [{
    from: 'Ana Costa',
    date: '19 Nov',
    text: 'Uploaded the photos from Saturday, the ridge shot came out really well!',
    attachments: [{
      name: 'ridge.jpg',
      size: 2400000
    }, {
      name: 'summit.jpg',
      size: 1900000
    }, {
      name: 'route.gpx',
      size: 52000
    }]
  }]
}, {
  id: 't12',
  split: 'important',
  group: 'Last 30 days',
  from: 'Maya Lindqvist',
  address: 'maya.lindqvist@example.edu',
  subject: 'Room booking for the defence',
  date: '15 Nov',
  snippet: 'I booked the seminar room for the 12th, 10-12. Let me know if the committee needs another slot.',
  messages: [{
    from: 'Maya Lindqvist',
    date: '15 Nov',
    text: 'I booked the seminar room for the 12th, 10-12. Let me know if the committee needs another slot.'
  }]
}];

// The week of Sun Nov 22 – Sat Nov 28 2026 (index 1 = today).
const WEEK = [{
  label: 'Sun 22',
  events: [{
    title: 'Grading',
    start: 14,
    end: 16.5
  }]
}, {
  label: 'Mon 23',
  today: true,
  events: [{
    title: 'Standup',
    start: 9.5,
    end: 9.75,
    where: 'Room B204'
  }, {
    title: 'Lunch with Jun',
    start: 12.25,
    end: 13,
    where: 'Noodle place',
    kind: 'local'
  }]
}, {
  label: 'Tue 24',
  events: [{
    title: 'Standup',
    start: 9.5,
    end: 9.75,
    where: 'Room B204'
  }, {
    title: 'Thesis chapter 3',
    start: 13,
    end: 14,
    where: 'https://meet.example.edu/maya',
    kind: 'pending'
  }]
}, {
  label: 'Wed 25',
  allDay: ['Writing day'],
  events: [{
    title: 'Standup',
    start: 9.5,
    end: 9.75,
    where: 'Room B204'
  }]
}, {
  label: 'Thu 26',
  events: [{
    title: 'Standup',
    start: 9.5,
    end: 9.75,
    where: 'Room B204'
  }]
}, {
  label: 'Fri 27',
  events: [{
    title: 'Standup',
    start: 9.5,
    end: 9.75,
    where: 'Room B204'
  }]
}, {
  label: 'Sat 28',
  events: []
}];
const DAY_LABELS = ['Sun, Nov 22', 'Mon, Nov 23', 'Tue, Nov 24', 'Wed, Nov 25', 'Thu, Nov 26', 'Fri, Nov 27', 'Sat, Nov 28'];
const NOW = 14.4; // 2:24 PM

const TIPS = [['from:nicole', 'from Nicole'], ['to:roman', 'to Roman'], ['"be brilliant"', 'contains "be brilliant"'], ['subject:lunch', 'subject contains "lunch"'], ['domain:example.com', 'from that domain'], ['has:attachment', 'has files'], ['filename:pdf', 'file name has pdf'], ['larger:5M', 'bigger than 5 mb'], ['in:sent', 'in Sent'], ['is:unread', 'unread conversations'], ['is:starred', 'starred conversations'], ['before:2025/06/01', 'before June 2025'], ['older_than:3d', 'more than 3 days ago'], ['-word', 'without that word']];
const KEY_GROUPS = [['Navigation', [['Next / previous conversation', 'J K'], ['Open', 'Enter'], ['Back', 'Esc'], ['Next split inbox', 'Tab'], ['Command', 'Ctrl K'], ['Search', '/']]], ['Conversations', [['Mark Done', 'E'], ['Remind Me', 'H'], ['Star', 'S'], ['Read or unread', 'U'], ['Trash', '#'], ['Undo', 'Z']]], ['Messages', [['Reply all', 'Enter'], ['Reply', 'R'], ['Forward', 'F'], ['Compose', 'C'], ['Send', 'Ctrl Enter']]], ['Calendar', [['Day beside mail', '0'], ['Week', '2'], ['Back to mail', '1'], ['Create event', 'B']]]];
const MENU = [{
  label: 'Important · Other',
  keys: ['G', 'I']
}, {
  label: 'Starred',
  keys: ['G', 'S']
}, {
  label: 'Drafts',
  keys: ['G', 'D']
}, {
  label: 'Sent',
  keys: ['G', 'T']
}, {
  label: 'Done',
  keys: ['G', 'E']
}, {
  label: 'Reminders',
  keys: ['G', 'H']
}, {
  label: 'Spam',
  keys: ['G', '!']
}, {
  label: 'Trash',
  keys: ['G', '#']
}, {
  label: 'All Mail',
  keys: ['G', 'A']
}];
Object.assign(window, {
  ME,
  THREADS,
  WEEK,
  DAY_LABELS,
  NOW,
  TIPS,
  KEY_GROUPS,
  MENU
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mail/data.jsx", error: String((e && e.message) || e) }); }

__ds_ns.DayCalendar = __ds_scope.DayCalendar;

__ds_ns.EventBlock = __ds_scope.EventBlock;

__ds_ns.EventChip = __ds_scope.EventChip;

__ds_ns.CalNote = __ds_scope.CalNote;

__ds_ns.WeekView = __ds_scope.WeekView;

__ds_ns.MiniMonth = __ds_scope.MiniMonth;

__ds_ns.CalendarOptions = __ds_scope.CalendarOptions;

__ds_ns.EventForm = __ds_scope.EventForm;

__ds_ns.EventView = __ds_scope.EventView;

__ds_ns.EventButtons = __ds_scope.EventButtons;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Key = __ds_scope.Key;

__ds_ns.Keys = __ds_scope.Keys;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ChoiceButton = __ds_scope.ChoiceButton;

__ds_ns.Segmented = __ds_scope.Segmented;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.BarInput = __ds_scope.BarInput;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.SplitTabs = __ds_scope.SplitTabs;

__ds_ns.ListSeparator = __ds_scope.ListSeparator;

__ds_ns.ListNote = __ds_scope.ListNote;

__ds_ns.FileType = __ds_scope.FileType;

__ds_ns.AttachmentChip = __ds_scope.AttachmentChip;

__ds_ns.ZeroState = __ds_scope.ZeroState;

__ds_ns.MessageRow = __ds_scope.MessageRow;

__ds_ns.Message = __ds_scope.Message;

__ds_ns.Attachment = __ds_scope.Attachment;

__ds_ns.ReplyBar = __ds_scope.ReplyBar;

__ds_ns.NewMail = __ds_scope.NewMail;

__ds_ns.Editor = __ds_scope.Editor;

__ds_ns.Composer = __ds_scope.Composer;

__ds_ns.FileChip = __ds_scope.FileChip;

__ds_ns.Invite = __ds_scope.Invite;

__ds_ns.Suggestions = __ds_scope.Suggestions;

__ds_ns.ContactCard = __ds_scope.ContactCard;

__ds_ns.SearchTips = __ds_scope.SearchTips;

__ds_ns.RecentSearch = __ds_scope.RecentSearch;

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.KeysList = __ds_scope.KeysList;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastStack = __ds_scope.ToastStack;

__ds_ns.SideMenu = __ds_scope.SideMenu;

__ds_ns.AuthBar = __ds_scope.AuthBar;

__ds_ns.FileViewer = __ds_scope.FileViewer;

__ds_ns.AppShell = __ds_scope.AppShell;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Rail = __ds_scope.Rail;

__ds_ns.ListHeader = __ds_scope.ListHeader;

__ds_ns.ThreadView = __ds_scope.ThreadView;

__ds_ns.Pane = __ds_scope.Pane;

__ds_ns.SettingsSection = __ds_scope.SettingsSection;

__ds_ns.TabBar = __ds_scope.TabBar;

})();
