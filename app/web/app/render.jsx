// The screens, as Solid components that read S, and render(): call it after changing S (a screen,
// a folder, a conversation); it redraws and then does what needs the drawn page (sizes the writing
// boxes, loads the calendar's days, puts the calendar's scroll back). show() alone just redraws.

import { createMemo, createSignal, For, Show } from 'solid-js';
import { tint } from '../markdown.js';
import { ensureCalDay, eventTimes, invOf, meetings, readInvites, rsvpOf } from './calendar.js';
import { goto, MOD, paletteItems } from './commands.js';
import { meAddr, scheduled } from './compose.js';
import {
  B,
  DESKTOP,
  dayStart,
  fileBits,
  fmtTime,
  groupOf,
  ic,
  keyOf,
  LS,
  layer,
  linkify,
  listDate,
  nameOf,
  root,
  S,
  show,
  svg,
  VIEWS,
} from './core.js';
import { allSplits, counts, current, load, visible } from './data.js';
import { niceName } from './people.js';
import { openSettings, Settings, SettingsPane } from './settings.jsx';
import { CalSide, DayPane, Week } from './week.jsx';

export function menuItems() {
  const c = counts();
  const base = [
    { label: 'Important · Other', n: c.important || 0, keys: ['G', 'I'], run: goto('inbox', 'important') },
    { label: 'Starred', keys: ['G', 'S'], run: goto('starred') },
    { label: 'Drafts', keys: ['G', 'D'], run: goto('drafts') },
    { label: 'Sent', keys: ['G', 'T'], run: goto('sent') },
    { label: 'Done', keys: ['G', 'E'], run: goto('done') },
    { label: 'Scheduled', n: scheduled().length || '', keys: [], run: goto('scheduled') },
    { label: 'Reminders', keys: ['G', 'H'], run: goto('reminders') },
    { label: 'Spam', keys: ['G', '!'], run: goto('spam') },
    { label: 'Trash', keys: ['G', '#'], run: goto('trash') },
    { label: 'All Mail', keys: ['G', 'A'], run: goto('all') },
  ];
  const own = (S.folders || []).map((f) => ({
    label: f.name,
    folder: true,
    keys: [],
    run: () => {
      if (S.screen !== 'list') {
        S.screen = 'list';
        S.open = null;
      }
      VIEWS[f.path] = VIEWS[f.path] || f.name;
      load(f.path);
    },
  }));
  return [...base, ...own, { label: 'Settings', keys: [MOD, ','], run: () => openSettings(), settings: true }];
}

// The menu is laid over the screen without redrawing it (only show(): the screen's HTML stays),
// and filled in place when the folders arrive, so it slides in once and nothing behind it blinks.
export function openMenu() {
  S.menu = { sel: 0, fresh: true };
  show();
  if (!S.folders && B.folders)
    B.folders()
      .then((f) => {
        S.folders = f;
        if (S.menu) show();
      })
      .catch(() => {
        S.folders = [];
      });
}

export function closeMenu() {
  S.menu = null;
  show();
}

const Keys = (props) => <For each={props.k || []}>{(x) => <span class="key">{x}</span>}</For>;

function Menu() {
  const items = () => menuItems();
  return (
    <Show when={S.menu}>
      <div class="sidemenu-scrim" data-a="close-menu" />
      <nav class={['sidemenu', { fresh: S.menu?.fresh }]} aria-label="Folders">
        <div class="sm-head">{S.account?.email || ''}</div>
        <For each={items()} keyed={false}>
          {(it, i) => (
            <>
              {i === items().findIndex((x) => x.folder) && <div class="sm-sep">Folders</div>}
              {i === items().findIndex((x) => x.settings) && <div class="sm-gap" />}
              <button class={['sm-item', { on: i === S.menu?.sel }]} data-menu={i}>
                <span>
                  {it().n ? `${it().label} ` : it().label}
                  {it().n ? <span class="n">{it().n > 150 ? '150+' : it().n}</span> : null}
                </span>
                <span class="sm-keys">
                  {it().keys.length === 2 && it().keys[0] === 'G' ? (
                    <>
                      <span class="key">G</span>
                      <small>then</small>
                      <span class="key">{it().keys[1]}</span>
                    </>
                  ) : (
                    <Keys k={it().keys} />
                  )}
                </span>
              </button>
            </>
          )}
        </For>
      </nav>
    </Show>
  );
}

// render() has run once: before that nothing is drawn (at start the desktop app first asks for
// the account, then shows the inbox, not the sign-in screen)
const [rendered, setRendered] = createSignal(0);

function Shell() {
  return (
    <>
      <div class="shell">
        <nav class="rail" aria-label="Apps">
          <button class={S.screen !== 'calendar' ? 'on' : ''} data-a="go-mail" title="Mail (1)" aria-label="Mail">
            {svg(ic.mail)}
          </button>
          <button
            class={S.screen === 'calendar' ? 'on' : ''}
            data-a="go-cal"
            title="Calendar (2)"
            aria-label="Calendar"
          >
            {svg(ic.cal)}
          </button>
        </nav>
        {/* a new screen (another conversation, folder or split) is new elements, and slides in */}
        <Show when={S.lastScreen} keyed>
          {() => (
            <div class={`main${S.enter}${S.screen === 'calendar' ? ' main-cal' : ''}`}>
              {S.screen === 'thread' ? (
                <Thread />
              ) : S.screen === 'compose' ? (
                <ComposePage />
              ) : S.screen === 'search' ? (
                <SearchPage />
              ) : S.screen === 'settings' ? (
                <Settings />
              ) : S.screen === 'calendar' ? (
                <Week />
              ) : (
                <List />
              )}
            </div>
          )}
        </Show>
        <Pane />
      </div>
      {S.authNeeded ? (
        <div class="authbar" role="alert">
          <span>
            login for <b>{S.authNeeded?.email}</b> dead. mail stuck.
          </span>
          <button data-a="relogin">login again</button>
        </div>
      ) : null}
      <div class="tabbar">
        <button data-a="go-inbox">Inbox</button>
        <button data-a="search">Search</button>
        <button data-a="compose">Compose</button>
        <button data-a="cal">Calendar</button>
        <button data-a="cmd">More</button>
      </div>
    </>
  );
}

export const App = () => (
  <>
    <Show when={rendered()}>{S.screen === 'signin' ? <Signin /> : <Shell />}</Show>
    <Menu />
  </>
);

function enterClass() {
  const k = `${S.screen}|${S.screen === 'thread' ? S.open?.id : `${S.view}|${S.split}`}`;
  const changed = k !== S.lastScreen;
  S.lastScreen = k;
  return changed ? (S.screen === 'thread' || S.screen === 'compose' ? ' enter-in' : ' enter-fade') : '';
}

export function fitEditor(t) {
  t.style.height = 'auto';
  t.style.height = `${Math.max(t.closest('.settings') ? 96 : 200, t.scrollHeight)}px`;
}

export function render() {
  if (S.screen === 'signin') return renderSignin();
  if (S.eventForm) {
    const t = eventTimes(S.eventForm);
    if (t.ok) S.calDay = dayStart(t.start);
  } else if (S.screen === 'thread' && S.open && S.invFor !== S.open.id) {
    const v = invOf();
    if (v) {
      S.invFor = S.open.id;
      S.calDay = dayStart(v.start);
      S.calScroll = Math.max(0, (new Date(v.start).getHours() - 1) * 44);
    }
  }
  document.body.classList.remove('on-signin');
  if (S.menu) S.menu.fresh = false; // a redraw lays it there again, without sliding
  if (S.eventForm?.fresh === 'drawn') S.eventForm.fresh = false; // the form slides in once: until the next redraw
  S.enter = enterClass();
  readInvites();
  setRendered((n) => n + 1);
  show();
  if (S.eventForm?.fresh) S.eventForm.fresh = 'drawn';
  root.querySelectorAll('.editor textarea').forEach(fitEditor);
  if (S.screen === 'calendar' || S.pane === 'calendar' || S.eventForm || invOf()) ensureCalDay();
  calScrollSetup();
}

function calScrollSetup() {
  const cb = root.querySelector('.cal-b');
  if (!cb) return;
  cb.scrollTop = S.calScroll ?? Math.max(0, (new Date().getHours() - 2) * 44);
  if (cb.scrollTop) S.calScroll = cb.scrollTop; // where it ended up (the hours may not reach that far)
}

// While an event is being written, the day beside it follows what's typed (the form and your
// cursor stay as they are).
export function refreshCal() {
  if (S.screen !== 'calendar' && !S.eventForm) return render();
  if (S.eventForm) {
    const t = eventTimes(S.eventForm);
    if (t.ok) S.calDay = dayStart(t.start);
  }
  show();
  ensureCalDay();
}

export function renderSignin() {
  document.body.classList.add('on-signin');
  setRendered((n) => n + 1);
  show();
}

// ---------- sign in ----------
const Signin = () => (
  <div class="signin">
    <div class="signin-inner">
      <div class="logo">
        <span class="logo-mark">d</span>
        <span class="logo-word">dude</span>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: the page's one heading, styled as the prompt (an h1 would bring its own styles) */}
      <div class="prompt" role="heading" aria-level="1">
        <span>no super.</span> <span>just email.</span>
      </div>
      <button class="btn-main" data-a="start">
        go
      </button>
      {S.more ? (
        <div class="signin-more">
          {DESKTOP ? (
            <>
              <input type="email" placeholder="you@uni.fi" data-a="email" value={S.email || ''} autocomplete="email" />
              <button data-a="signin-ms">microsoft login</button>
              <button data-a="signin-g">google login</button>
              <p>login like thunderbird. uni say ok.</p>
              <button data-a="demo">try demo</button>
            </>
          ) : (
            <>
              <button data-a="demo">try demo</button>
              <p>demo only. real mail need desktop app.</p>
            </>
          )}
        </div>
      ) : null}
    </div>
  </div>
);

// ---------- a folder, a split, or search results ----------
const n150 = (x) => (x > 150 ? '150+' : x);

function List() {
  const v = createMemo(() => visible()); // once per redraw; the rows read it
  const c = createMemo(() => counts());
  const zero = () => !S.loading && !v().length && S.view !== 'search' && !S.loadError;
  return (
    <>
      <header class="head">
        <button class="menu-btn" data-a="menu" title="Folders">
          {svg(ic.menu)}
        </button>
        {S.view === 'inbox' ? (
          <div class="splits">
            <For each={allSplits()}>
              {(sp) => (
                <button class={['split', { on: S.split === sp.id }]} data-split={sp.id}>
                  {sp.name}
                  {c()[sp.id] ? <span class="n">{n150(c()[sp.id])}</span> : null}
                </button>
              )}
            </For>
          </div>
        ) : S.view === 'search' ? (
          <>
            <div class="splits">
              <span class="split on">
                {`search: ${S.search?.q || ''}`}
                <span class="n">{v().length}</span>
              </span>
            </div>
            <button class="ibtn" data-a="close-search" title="Close search (Esc)">
              ✕
            </button>
          </>
        ) : (
          <div class="splits">
            <span class="split on">
              {VIEWS[S.view] || S.view}
              <span class="n">{v().length}</span>
            </span>
          </div>
        )}
        <div class="head-icons">
          <button class={['ibtn', { on: S.pane === 'calendar' }]} data-a="cal" title="Calendar (0)">
            {svg(ic.cal)}
          </button>
          <button class="ibtn" data-a="compose" title="Compose (C)">
            {svg(ic.pen)}
          </button>
          <button class="ibtn" data-a="search" title="Search (/)">
            {svg(ic.search)}
          </button>
        </div>
      </header>
      {zero() ? (
        <div class="zero">
          <h2>{S.view === 'inbox' ? 'inbox zero.' : 'empty.'}</h2>
          <p>{S.view === 'inbox' ? 'nothing left. go outside.' : 'nothing here.'}</p>
        </div>
      ) : (
        <div class="list">
          {S.loading && !v().length ? (
            <div class="note">loading…</div>
          ) : v().length ? (
            <For each={v()}>{(_, i) => <Row v={v()} i={i()} />}</For>
          ) : S.loadError ? (
            <div class="note">folder no load.</div>
          ) : (
            <div class="note">nothing.</div>
          )}
        </div>
      )}
    </>
  );
}

function Row(props) {
  const t = () => props.v[props.i] || {};
  const group = () => groupOf(t().date);
  const atts = () => (t().atts || []).slice(0, 4);
  const who = () =>
    S.view === 'sent' ||
    S.view === 'drafts' ||
    ((t().from?.address || '').toLowerCase() === meAddr() && (t().to || []).length)
      ? `To: ${(t().to || []).map((p) => firstName(p)).join(', ')}`
      : nameOf(t().from);
  return (
    <>
      {group() && group() !== (props.i ? groupOf(props.v[props.i - 1].date) : null) ? (
        <div class="sep">{group()}</div>
      ) : null}
      <div
        class={[
          'row',
          { sel: props.i === S.sel, unread: t().unread, picked: S.picked.has(t().id), 'with-atts': atts().length },
        ]}
        data-i={props.i}
      >
        <span class="st" />
        <span class="from">
          {S.replyDrafts.has(keyOf(t())) ? <span class="dr">draft</span> : null}
          {S.replyDrafts.has(keyOf(t())) && t().starred ? ' ' : null}
          {t().starred ? <span class="star">★</span> : null}
          {S.replyDrafts.has(keyOf(t())) && !t().starred ? ` ${who()}` : who()}
          {t().count > 1 ? <span class="cnt">{t().count}</span> : null}
        </span>
        <span class="ss">
          <span class="subj">{t().subject || '(no subject)'}</span>
          {t().snippet}
        </span>
        <span class="meta">
          <span class="date">{listDate(t().date)}</span>
          <span class="acts">
            <button data-a="row-done" title="Mark Done (E)">
              {svg(ic.check)}
            </button>
            <button data-a="row-remind" title="Remind Me (H)">
              {svg(ic.clock)}
            </button>
            <button data-a="cmd" title={`Command (${MOD}+K)`}>
              {svg(ic.cmd)}
            </button>
          </span>
        </span>
        {atts().length ? (
          <span class="ratts">
            <For each={atts()}>
              {(a, k) => (
                <button class="rchip" data-ratt={`${props.i}:${k()}`} title={`open ${a.name}`}>
                  <span class={`att-type t-${fileBits(a.name, a.type).kind}`}>{fileBits(a.name, a.type).ext}</span>
                  <span class="rchip-name">{fileBits(a.name, a.type).base}</span>
                </button>
              )}
            </For>
            {(t().atts || []).length > 4 ? <span class="rmore">{`+${t().atts.length - 4}`}</span> : null}
          </span>
        ) : null}
      </div>
    </>
  );
}

// ---------- search: its own page, with tips on the right; Enter searches the whole mailbox ----------
const SearchPage = () => (
  <>
    <header class="head search-head">
      <input class="sq" data-a="sq" placeholder="search" value={S.search?.q || ''} aria-label="Search" />
      <button class="ibtn" data-a="close-search" title="Close (Esc)">
        ✕
      </button>
    </header>
    <div class="list">
      {LS.get('recent', []).length ? (
        <For each={LS.get('recent', [])}>
          {(q) => (
            <div class="recent" data-recent={q}>
              {q}
            </div>
          )}
        </For>
      ) : (
        <div class="note">type. hit Enter. tricks on right.</div>
      )}
    </div>
  </>
);

const TIPS = [
  ['from:nicole', 'from Nicole'],
  ['to:roman', 'to Roman'],
  ['"be brilliant"', 'contains "be brilliant"'],
  ['subject:lunch', 'subject contains "lunch"'],
  ['domain:example.com', 'from that domain'],
  ['has:attachment', 'has files'],
  ['filename:pdf', 'file name has pdf'],
  ['larger:5M', 'bigger than 5 mb'],
  ['cc:anna', 'anna in copy'],
  ['label:projects', 'in that folder'],
  ['in:sent', 'in Sent'],
  ['is:unread', 'unread conversations'],
  ['is:starred', 'starred conversations'],
  ['before:2025/06/01', 'before June 2025'],
  ['after:2025/06/01', 'June 2025 or later'],
  ['older_than:3d', 'more than 3 days ago'],
  ['newer_than:1m', '1 month ago or later'],
  ['-word', 'without that word'],
];

// ---------- the pane on the right: the day, search tips, the person you're reading, … ----------
function Pane() {
  return (
    <>
      {S.screen === 'calendar' || S.pane === 'calendar' || S.eventForm || invOf() ? (
        S.screen === 'calendar' ? (
          <CalSide />
        ) : (
          <DayPane />
        )
      ) : S.screen === 'search' ? (
        <aside class="pane contact-pane">
          <div class="contact">
            <div class="nm">tricks</div>
            <div class="tips">
              <For each={TIPS}>
                {([a, b]) => (
                  <>
                    <b data-tip={a}>{a}</b>
                    <span>{b}</span>
                  </>
                )}
              </For>
            </div>
          </div>
        </aside>
      ) : S.screen === 'settings' ? (
        <SettingsPane />
      ) : S.screen === 'compose' ? (
        <aside class="pane contact-pane">
          <div class="contact">
            <div class="nm">{S.account?.name || 'you'}</div>
            <div class="em">{S.account?.email || ''}</div>
          </div>
        </aside>
      ) : (
        <Contact />
      )}
    </>
  );
}

function Contact() {
  const t = () => (S.screen === 'thread' ? S.open : current());
  const addr = () => (t()?.from.address || '').toLowerCase();
  const domain = () => addr().split('@')[1] || '';
  return (
    <aside class="pane contact-pane">
      {t() ? (
        <>
          <div class="contact">
            <div class="nm">{nameOf(t()?.from)}</div>
            <div class="em">{t()?.from.address}</div>
            <div class="sec">
              <div class="sec-h">{svg(ic.mail)} Mail</div>
              <For each={S.threads.filter((x) => (x.from.address || '').toLowerCase() === addr()).slice(0, 4)}>
                {(x) => (
                  <div class="it" data-open={x.id}>
                    {x.subject || '(no subject)'}
                  </div>
                )}
              </For>
            </div>
            {domain() ? (
              <div class="sec">
                <div class="sec-h">
                  {svg(ic.search)}
                  {` ${domain()}`}
                </div>
              </div>
            ) : null}
          </div>
          <div class="pane-foot">
            <b>{S.account?.email || ''}</b>
            <button class="ibtn" data-a="keys" title="Shortcuts (?)">
              ?
            </button>
          </div>
        </>
      ) : (
        <div class="contact" />
      )}
    </aside>
  );
}

// Splits a plain-text message into what was written and the quoted history below it.
const QUOTE =
  /^(?:On [^\n]{0,300}wrote:[ \t]*$|-{2,}\s*(?:Original Message|Alkuperäinen viesti)\s*-{2,}|_{8,}[ \t]*$|(?:From|Lähettäjä|Från|Von): [^\n]+\n(?:Sent|Date|Lähetetty|Skickat|Gesendet|To|Vastaanottaja): |>)/m;

function splitQuote(text) {
  const i = (text || '').search(QUOTE);
  return i > 0 ? [text.slice(0, i).replace(/\s+$/, ''), text.slice(i)] : [text || '', ''];
}

const HTML_QUOTE = /gmail_quote|type="?cite|divRplyFwdMsg|appendonsend|moz-cite-prefix/i;

const firstName = (p) => {
  const n = (p?.name || '').replace(/^"|"$/g, '').trim();
  return n
    ? n.includes(',')
      ? n.split(',')[1].trim().split(' ')[0] || n
      : n.split(/\s+/)[0]
    : p?.address || 'Unknown';
};

const isMe = (p) => !!p && (p.address || '').toLowerCase() === meAddr();

// ---------- a conversation ----------
// Data is always reached through S in the expression that shows it (S.msgs[i], not a kept
// message): reading S is what redraws it when it changes.
function Thread() {
  return (
    <div class="thread">
      <div class="thread-top">
        <button class="back" data-a="back" title="Back (Esc)">
          {svg(ic.back)}
        </button>
      </div>
      <div class="tcol">
        <div class="thead">
          <h1>{S.open?.subject || '(no subject)'}</h1>
          <div class="tacts">
            <button class="ibtn" data-a="done" title="Mark Done (E)">
              {svg(ic.check)}
            </button>
            <button class="ibtn" data-a="remind" title="Remind Me (H)">
              {svg(ic.clock)}
            </button>
            <button class="ibtn" data-a="cmd" title="Command">
              {svg(ic.cmd)}
            </button>
            <button class="ibtn" data-a="prev" title="Previous conversation (K)">
              {svg(ic.up)}
            </button>
            <button class="ibtn" data-a="next" title="Next conversation (J)">
              {svg(ic.down)}
            </button>
          </div>
        </div>
        {S.msgs.length ? (
          <For each={S.msgs}>{(_, i) => <Msg i={i()} />}</For>
        ) : (
          <div class="note" style="padding-left:36px">
            loading…
          </div>
        )}
        {S.newer ? (
          <div class="newmsgs">
            <button data-a="show-new" title="Show new messages (Shift+N)">
              {`${S.newer?.count > 1 ? `${S.newer.count} ` : ''}new mail. show`}
            </button>
          </div>
        ) : null}
        {S.composer ? (
          <Composer />
        ) : S.msgs.length ? (
          <div class="replybar">
            <button data-a="replyall">
              reply all <span class="key">Enter</span>
            </button>
            <button data-a="reply">
              reply <span class="key">R</span>
            </button>
            <button data-a="forward">
              forward <span class="key">F</span>
            </button>
            <button data-a="event">
              event <span class="key">B</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const snip = (text, n) =>
  splitQuote(text || '')[0]
    .replace(/\s+/g, ' ')
    .slice(0, n);

function Msg(props) {
  const m = () => S.msgs[props.i] || {};
  const focus = () => props.i === S.focus && !S.composer;
  return (
    <>
      {m().draft ? (
        <article class={['msg mrow draftrow', { focus: focus() }]} data-m={props.i} title="Continue this draft (Enter)">
          <span class="nm dr">draft</span>
          <span class="snip">
            {`to ${(m().to || []).map((p) => firstName(p)).join(', ') || '…'} · ${snip(m().text, 160)}`}
          </span>
          <span class="dt">{listDate(m().date)}</span>
        </article>
      ) : S.expanded.has(props.i) ? (
        <OpenMsg i={props.i} focus={focus()} />
      ) : (
        <article class={['msg mrow', { focus: focus() }]} data-m={props.i}>
          <span class="nm">{isMe(m().from) ? 'Me' : firstName(m().from)}</span>
          <span class="snip">{snip(m().text, 220)}</span>
          <span class="dt">{listDate(m().date)}</span>
        </article>
      )}
    </>
  );
}

function OpenMsg(props) {
  const m = () => S.msgs[props.i] || {};
  const to = () => [...(m().to || []), ...(m().cc || [])].map((p) => p.name || p.address).join(', ');
  const parts = () => splitQuote(m().text);
  return (
    <article class={['msg open', { focus: props.focus }]} data-m={props.i}>
      <div class="msg-h">
        <span class="nm" title={m().from?.address}>
          {`${isMe(m().from) ? 'Me' : nameOf(m().from)}${to() ? ' ' : ''}`}
          {to() ? <span class="tolist">{`to ${to()}`}</span> : null}
        </span>
        <span class="macts">
          <button class="ibtn" data-a="reply" title="Reply (R)">
            ↩
          </button>
          <button class="ibtn" data-a="replyall" title="Reply all (Enter)">
            ⤺
          </button>
          <button class="ibtn" data-a="forward" title="Forward (F)">
            ↪
          </button>
        </span>
        <span class="dt">{m().pending ? 'Sending…' : listDate(m().date)}</span>
      </div>
      {m().invite ? <Invite i={props.i} /> : null}
      <div class="body" data-b={props.i}>
        {m().html ? (
          <iframe
            ref={frame}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title="Message"
            class={DESIGNED.test(m().html) ? 'paper' : undefined}
            srcdoc={srcdoc(m(), props.i)}
          />
        ) : (
          <pre innerHTML={linkify(S.quotes.has(props.i) ? m().text : parts()[0])} />
        )}
      </div>
      {(m().html ? HTML_QUOTE.test(m().html) : !!parts()[1]) ? (
        <button class="dots" data-q={props.i} title="Show quoted text">
          …
        </button>
      ) : null}
      {m().attachments?.length ? (
        <div class="atts">
          <For each={m().attachments}>
            {(a, j) => (
              // biome-ignore lint/a11y/useSemanticElements: it holds its own save button, and buttons can't nest
              // biome-ignore lint/a11y/useFocusableInteractive: it is (tabindex, lowercase in Solid)
              <div
                class="att"
                data-att={`${props.i}:${j()}`}
                role="button"
                tabindex="0"
                title={`open ${a.filename || 'file'}`}
              >
                <div class="att-name">{fileBits(a.filename, a.type).base}</div>
                <div class="att-foot">
                  <span class={`att-type t-${fileBits(a.filename, a.type).kind}`}>
                    {fileBits(a.filename, a.type).ext}
                  </span>
                  <span class="att-size">{fileBits(a.filename, a.type).size(a.size)}</span>
                  <button class="att-dl" data-attsave={`${props.i}:${j()}`} title="save to Downloads">
                    {svg(ic.download)}
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      ) : null}
    </article>
  );
}

function Invite(props) {
  const v = () => S.msgs[props.i]?.invite || {};
  const row = (q, a) => (
    <div class="inv-row">
      <span class="inv-q">{q}</span>
      <span class="inv-a">{a}</span>
    </div>
  );
  const when = () => {
    const opt = { weekday: 'long', day: 'numeric', month: 'long' };
    return v().allDay
      ? new Date(v().start).toLocaleDateString([], opt)
      : `${new Date(v().start).toLocaleString([], { ...opt, hour: 'numeric', minute: '2-digit' })} – ${fmtTime(v().end)}`;
  };
  const who = () => {
    const ppl = [v().organizer, ...(v().attendees || [])].filter((p) => p?.email);
    return ppl
      .filter((p, k) => ppl.findIndex((q) => q.email.toLowerCase() === p.email.toLowerCase()) === k)
      .map((p) => (p.email.toLowerCase() === meAddr() ? 'Me' : p.name || p.email));
  };
  return (
    <>
      {v().pending ? (
        <div class="invite">
          {meetings.get(v().ews) === 'fail'
            ? row('rsvp', 'invite no load. open in outlook.')
            : S.cal.status && !S.cal.status.connected
              ? row(
                  'rsvp',
                  <>
                    {'outlook invite. need calendar. '}
                    <button class="inv-b" data-a="cal-connect">
                      connect
                    </button>
                  </>,
                )
              : row('rsvp', 'reading invite…')}
        </div>
      ) : (
        <div class={['invite', { off: v().cancelled }]}>
          {v().cancelled
            ? row('rsvp', 'event cancelled.')
            : row(
                'rsvp',
                <For each={['yes', 'maybe', 'no']}>
                  {(x) => (
                    <button
                      class={['inv-b', { on: rsvpOf(v()) === x }]}
                      data-rsvp={`${props.i}:${x}`}
                      aria-pressed={String(rsvpOf(v()) === x)}
                    >
                      {x}
                    </button>
                  )}
                </For>,
              )}
          {row(
            'when',
            <button class="inv-when" data-invday={props.i} title="show day">
              {when()}
            </button>,
          )}
          {v().where ? row('where', v().where) : null}
          {who().length
            ? row('who', who().slice(0, 6).join(', ') + (who().length > 6 ? ` +${who().length - 6}` : ''))
            : null}
        </div>
      )}
    </>
  );
}

// Emails designed with their own backgrounds keep them on a white sheet; plain ones take the
// theme's colours so text an email sets to black stays readable in the dark theme.
const DESIGNED =
  /bgcolor\s*=|background(?:-color)?\s*:\s*(?!\s*(?:transparent|none|inherit|initial|#fff(?:fff)?\b|white|rgba?\(\s*255\s*,\s*255\s*,\s*255))[^;"']+|background\s*=/i;

// keys pressed in an email go to the app; the frame grows to fit the email
function frame(f) {
  f.addEventListener('load', () => {
    try {
      f.contentDocument.addEventListener('keydown', (ev) => {
        const copy = new KeyboardEvent('keydown', {
          key: ev.key,
          code: ev.code,
          shiftKey: ev.shiftKey,
          ctrlKey: ev.ctrlKey,
          metaKey: ev.metaKey,
          altKey: ev.altKey,
          bubbles: true,
          cancelable: true,
        });
        if (!document.dispatchEvent(copy)) ev.preventDefault();
      });
    } catch {}
    const fit = () => {
      try {
        f.style.height = `${f.contentDocument.body.scrollHeight}px`;
      } catch {}
    };
    fit();
    setTimeout(fit, 400);
    setTimeout(fit, 1500);
  });
}

// the email as a page of its own; it changes (and reloads) with the theme and the quoted-text fold
function srcdoc(m, i) {
  const carbon = document.documentElement.classList.contains('carbon');
  const paper = DESIGNED.test(m.html); // emails with their own design get a white sheet; plain ones take the card's colours
  const themed = paper
    ? ''
    : `body *{color:inherit!important;background-color:transparent!important;border-color:${carbon ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)'}!important}body a,body a *{color:${carbon ? '#7cc0ff' : '#1a5fa8'}!important}`;
  const fold = S.quotes.has(i)
    ? ''
    : `.gmail_quote,blockquote[type=cite],.moz-cite-prefix,.moz-cite-prefix~blockquote,#divRplyFwdMsg,#divRplyFwdMsg~*,#appendonsend~*{display:none!important}`;
  const bg = paper ? '#fff' : 'transparent';
  const fg = paper ? '#141413' : carbon ? 'rgba(255,255,255,.9)' : '#141413';
  // The frame's color-scheme must match the page's, or the browser paints it white under dark-theme text.
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
        html{color-scheme:${carbon && !paper ? 'dark' : 'light'}}html,body{background:${bg}!important;color:${fg}!important}body{margin:0;padding:${paper ? '16px' : '2px'};font:16px/24px -apple-system,"Segoe UI",sans-serif;overflow-wrap:anywhere}
        img{max-width:100%;height:auto}table{max-width:100%}a{color:${paper || !carbon ? '#1a5fa8' : '#7cc0ff'}}${themed}${fold}</style></head><body>${m.html}</body></html>`;
}

// ---------- writing: the reply under a conversation, or the compose page ----------
function Composer() {
  const c = () => S.composer || {};
  return (
    <div class="composer">
      <div class="crow">
        <b>To</b>
        <input data-c="to" value={c().to ?? ''} autocomplete="off" aria-label="To" />
        {c().cc || c().showCc ? null : (
          <button class="ccbtn" data-a="showcc" title={`Cc (${MOD}+Shift+C)`}>
            Cc
          </button>
        )}
        {c().bcc || c().showBcc ? null : (
          <button class="ccbtn" data-a="showbcc" title={`Bcc (${MOD}+Shift+B)`}>
            Bcc
          </button>
        )}
        <Sugg field="to" />
      </div>
      {c().cc || c().showCc ? (
        <div class="crow">
          <b>Cc</b>
          <input data-c="cc" value={c().cc ?? ''} autocomplete="off" aria-label="Cc" />
          <Sugg field="cc" />
        </div>
      ) : null}
      {c().bcc || c().showBcc ? (
        <div class="crow">
          <b>Bcc</b>
          <input data-c="bcc" value={c().bcc || ''} autocomplete="off" aria-label="Bcc" />
          <Sugg field="bcc" />
        </div>
      ) : null}
      <input class="csubj" data-c="subject" value={c().subject ?? ''} placeholder="subject" aria-label="Subject" />
      <div class="editor">
        <div class="tint" aria-hidden="true" innerHTML={tint(c().text ?? '')} />
        <textarea
          data-c="text"
          placeholder={c().mode === 'new' ? 'write.' : 'reply.'}
          aria-label="Message"
          value={c().text ?? ''}
        />
      </div>
      {(c().files || []).length ? (
        <div class="cfiles">
          <For each={c().files}>
            {(f, j) => (
              <span class="cfile">
                {`${f.name} `}
                <small>{fileBits(f.name, f.type).size(f.size)}</small>
                <button data-rmfile={j()} title="remove" aria-label={`remove ${f.name}`}>
                  ✕
                </button>
              </span>
            )}
          </For>
        </div>
      ) : null}
      <div class="cfoot">
        <button class="primary" data-a="send" title={`Send (${MOD}+Enter)`}>
          send
        </button>
        <button data-a="later" title={`Send later (${MOD}+Shift+L)`}>
          later
        </button>
        <span class="grow" />
        <button class="ibtn" data-a="attach" title={`Attach (${MOD}+Shift+A)`}>
          {svg(ic.clip)}
        </button>
        <button class="ibtn" data-a="event" title="Create event (B)">
          {svg(ic.cal)}
        </button>
        <button class="ibtn" data-a="discard" title={`Discard (${MOD}+Shift+,)`}>
          {svg(ic.trash)}
        </button>
      </div>
    </div>
  );
}

// the people suggested under a To / Cc / Bcc / guests field (people.js fills S.sugg)
export const Sugg = (props) => (
  <Show when={(S.sugg?.el.dataset.c || S.sugg?.el.dataset.e) === props.field}>
    <div class="sugg" role="listbox">
      <For each={S.sugg?.items}>
        {(p, i) => (
          // biome-ignore lint/a11y/useFocusableInteractive: focus stays in the field; ↑ ↓ move the choice
          <div
            class={['sg', { on: i() === S.sugg?.i }]}
            data-sg={i()}
            role="option"
            aria-selected={String(i() === S.sugg?.i)}
          >
            <b>{niceName(p.name) || p.address}</b>
            <span>{p.address}</span>
          </div>
        )}
      </For>
    </div>
  </Show>
);

const ComposePage = () => (
  <div class="thread">
    <div class="thread-top">
      <button class="back" data-a="leave-compose" title="Back (Esc)">
        {svg(ic.back)}
      </button>
    </div>
    <div class="tcol">
      <div class="thead">
        <h1>{S.composer?.subject.trim() || 'new mail'}</h1>
      </div>
      <Composer />
    </div>
  </div>
);

// ---------- the layer over the screen: command palette, file viewer, keys ----------
// renderLayer(fresh): show S.overlay. A new overlay (or fresh) gets a new dialog with the cursor in
// its box; the same one again only updates its list.
export function renderLayer(fresh) {
  const o = S.overlay;
  if (o?.kind !== 'file' && S.fileUrl) {
    URL.revokeObjectURL(S.fileUrl);
    S.fileUrl = null;
  }
  const had = !fresh && layer.querySelector('.cmd input');
  if (o?.kind === 'cmd') o.i = Math.min(o.i, Math.max(0, paletteItems(o.q).length - 1));
  show();
  if (o?.kind !== 'cmd') return;
  if (had) layer.querySelector('.cmd li.on')?.scrollIntoView({ block: 'nearest' });
  else setTimeout(() => layer.querySelector('.cmd input')?.focus(), 0);
}

// icon (by name: ic is in core.js, read when drawn), title, placeholder
const HEADS = {
  move: ['cmd', 'move to', 'folder?'],
  copy: ['cmd', 'label', 'label?'],
  zero: ['check', 'get me to zero', 'how old?'],
  date: ['cal', 'jump to date', 'when? friday, dec 3, next week'],
  snippet: ['pen', 'use snippet', 'which?'],
  snipname: ['pen', 'new snippet', 'name?'],
  remind: ['clock', 'remind when', 'when? 8 am, 3 days, aug 7'],
  later: ['clock', 'send when', 'when? 8 am, 3 days, aug 7'],
  split: ['cmd', 'new split', 'words. like from:github.com'],
};

function Palette(props) {
  const head = () => HEADS[props.o.mode] || ['cmd', 'dude command', ''];
  return (
    <div class="scrim" data-a="close">
      <div class="cmd" role="dialog" aria-label={head()[1]}>
        <div class="cmd-h">
          {svg(ic[head()[0]])}
          {` ${head()[1]}`}
        </div>
        <div class="cmd-in">
          <input placeholder={head()[2]} aria-label={head()[1]} data-a="cq" />
        </div>
        <ul>
          <For each={paletteItems(S.overlay?.q)} keyed={false}>
            {(c, i) => (
              <li class={i === S.overlay?.i ? 'on' : ''} data-ci={i}>
                {props.o.mode ? null : <span class="ic" />}
                <span class="t">{c().t}</span>
                {c().lbl ? (
                  <span class="when">{c().lbl}</span>
                ) : (
                  <span class="ks">
                    <Keys k={c().k} />
                  </span>
                )}
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
}

const Viewer = (props) => (
  <div class="viewer" role="dialog" aria-label={props.o.name}>
    <div class="vbar">
      <span class="vname">{props.o.name}</span>
      <button data-a="file-save" title="save to Downloads (S)">
        {svg(ic.download)} save
      </button>
      <button data-a="file-close" title="close (Esc)">
        ✕
      </button>
    </div>
    <div class="vbody">
      {props.o.pdf ? (
        <iframe src={`${props.o.url}#toolbar=1&view=FitH`} title={props.o.name} />
      ) : (
        <img src={props.o.url} alt={props.o.name} />
      )}
    </div>
  </div>
);

const keyGroups = () => [
  [
    'Navigation',
    [
      ['Next / previous conversation', 'J K'],
      ['Next / previous message', '↓ ↑'],
      ['Folder menu', '←'],
      ['Show new messages', 'Shift N'],
      ['Open', 'Enter'],
      ['Open or close message', 'O'],
      ['Back', 'Esc'],
      ['Next split inbox', 'Tab'],
      ['Command', `${MOD} K`],
      ['Search', '/'],
    ],
  ],
  [
    'Conversations',
    [
      ['Mark Done', 'E'],
      ['Mark not Done', 'Shift E'],
      ['Remind Me', 'H'],
      ['Star', 'S'],
      ['Read or unread', 'U'],
      ['Trash', '#'],
      ['Spam', '!'],
      ['Select', 'X'],
      ['Select all', `${MOD} A`],
      ['Move', 'V'],
      ['Undo', 'Z'],
    ],
  ],
  [
    'Messages',
    [
      ['Reply all', 'Enter'],
      ['Reply', 'R'],
      ['Forward', 'F'],
      ['Compose', 'C'],
      ['Send', `${MOD} Enter`],
      ['Send later', `${MOD} Shift L`],
      ['Cc', `${MOD} Shift C`],
      ['Discard draft', `${MOD} Shift ,`],
      ['Bcc', `${MOD} Shift B`],
      ['Attach', `${MOD} Shift A`],
      ['Snippet', ';'],
    ],
  ],
  [
    'Folders',
    [
      ['Next / previous split', 'Tab · Shift Tab'],
      ['Important / Other', 'G I · G O'],
      ['Starred', 'G S'],
      ['Sent', 'G T'],
      ['Done', 'G E'],
      ['Reminders', 'G H'],
      ['All mail', 'G A'],
      ['Trash', 'G #'],
    ],
  ],
  [
    'Calendar',
    [
      ['Day beside mail', '0'],
      ['Week', '2'],
      ['Back to mail', '1'],
      ['Create event', 'B'],
      ['Previous / next', '- ='],
      ['Today (week)', 'T'],
      ['Save event', `${MOD} Enter`],
      ['Answer event', 'Y M N'],
    ],
  ],
];

const KeysDialog = () => (
  <div class="scrim dim" data-a="close">
    <div class="dlg" role="dialog" style="width:720px">
      <h2>keys</h2>
      <div class="keys">
        <For each={keyGroups()}>
          {([g, rows]) => (
            <section>
              <h5>{g}</h5>
              <For each={rows}>
                {([n, k]) => (
                  <div>
                    <span>{n}</span>
                    <span>
                      <Keys k={k.split(' ')} />
                    </span>
                  </div>
                )}
              </For>
            </section>
          )}
        </For>
      </div>
    </div>
  </div>
);

// a new overlay object is a new dialog (keyed); changes to the same one update it
export const Layer = () => (
  <Show when={S.overlay} keyed>
    {(o) =>
      o.kind === 'cmd' ? (
        <Palette o={o} />
      ) : o.kind === 'file' ? (
        <Viewer o={o} />
      ) : o.kind === 'keys' ? (
        <KeysDialog />
      ) : null
    }
  </Show>
);
