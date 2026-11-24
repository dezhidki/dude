import React from 'react';
import { Icon } from '../controls/Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');
const n150 = (n) => (n > 150 ? '150+' : n);

// One conversation. Selected rows get --hi and the 3px bar; the date gives way to done / remind / command.
export function ListRow({ from, subject, snippet, date, unread, selected, picked, starred, count, draft, files = [], leaving, onClick, onDone, onRemind, onCmd }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn && fn();
  };
  return (
    <div className={cx('d-row', selected && 'sel', unread && 'unread', picked && 'picked', files.length && 'with-atts', leaving && 'leaving')} onClick={onClick}>
      <span className="st" />
      <span className="from">
        {draft ? <span className="d-dr">draft </span> : null}
        {starred ? <span className="star">★</span> : null}
        {from}
        {count > 1 ? <span className="cnt">{count}</span> : null}
      </span>
      <span className="ss">
        <span className="subj">{subject || '(no subject)'}</span>
        {snippet}
      </span>
      <span className="meta">
        <span className="date">{date}</span>
        <span className="acts">
          <button type="button" title="Mark Done (E)" onClick={stop(onDone)}>
            <Icon name="check" />
          </button>
          <button type="button" title="Remind Me (H)" onClick={stop(onRemind)}>
            <Icon name="clock" />
          </button>
          <button type="button" title="Command (Ctrl+K)" onClick={stop(onCmd)}>
            <Icon name="cmd" />
          </button>
        </span>
      </span>
      {files.length ? (
        <span className="d-ratts">
          {files.slice(0, 4).map((n) => (
            <AttachmentChip key={n} name={n} />
          ))}
          {files.length > 4 ? <span className="d-rmore">{`+${files.length - 4}`}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

// "Important • Other • Newsletters": the inbox's splits, with unread counts in mono.
export function SplitTabs({ splits = [], active, onChange }) {
  return (
    <div className="d-splits">
      {splits.map((sp) => (
        <button type="button" key={sp.id} className={cx('d-split', sp.id === active && 'on')} onClick={() => onChange && onChange(sp.id)}>
          {sp.name}
          {sp.n ? <span className="n">{n150(sp.n)}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function ListSeparator({ children }) {
  return <div className="d-sep">{children}</div>;
}

export function ListNote({ children }) {
  return <div className="d-note">{children}</div>;
}

const FT = [
  ['pdf', /pdf/],
  ['doc', /^(docx?|odt|rtf|pages)$/],
  ['sheet', /^(xlsx?|csv|ods|numbers)$/],
  ['slide', /^(pptx?|odp|key)$/],
  ['img', /^(png|jpe?g|gif|webp|heic|svg)$/],
  ['cal', /^(ics|vcs)$/],
];
// Same split as the app's fileBits(): base name, short extension, kind, human size.
function fileBits(name = 'file', size) {
  const dot = name.lastIndexOf('.');
  const ext = (dot > 0 ? name.slice(dot + 1) : 'file').toLowerCase().slice(0, 5);
  const kind = (FT.find(([, re]) => re.test(ext)) || ['file'])[0];
  const sz = !size ? '' : size < 1024 ? `${size} b` : size < 1048576 ? `${Math.round(size / 1024)} kb` : `${(size / 1048576).toFixed(1)} mb`;
  return { base: dot > 0 ? name.slice(0, dot) : name, ext, kind, size: sz };
}

export function FileType({ name }) {
  const f = fileBits(name);
  return <span className={cx('d-ftype', `t-${f.kind}`)}>{f.ext}</span>;
}

export function AttachmentChip({ name, onClick }) {
  const f = fileBits(name);
  return (
    <button type="button" className="d-rchip" title={`open ${name}`} onClick={onClick}>
      <FileType name={name} />
      <span className="d-rchip-name">{f.base}</span>
    </button>
  );
}

export function ZeroState({ title = 'inbox zero.', line = 'nothing left. go outside.' }) {
  return (
    <div className="d-zero">
      <h2>{title}</h2>
      <p>{line}</p>
    </div>
  );
}

// A collapsed message in a thread: bold first name, one line, date.
export function MessageRow({ name, snippet, date, focus, draft, onClick }) {
  return (
    <article className={cx('d-msg d-mrow', focus && 'focus')} onClick={onClick}>
      <span className={cx('nm', draft && 'd-dr')}>{draft ? 'draft' : name}</span>
      <span className="snip">{snippet}</span>
      <span className="dt">{date}</span>
    </article>
  );
}

// An open message on --card. Body is plain text at 16/24; `paper` for designed HTML mail (white sheet).
export function Message({ from, to, date, focus, paper, html, quoted, invite, attachments = [], onReply, onReplyAll, onForward, children }) {
  const [showQuote, setShowQuote] = React.useState(false);
  return (
    <article className={cx('d-msg open', focus && 'focus')}>
      <div className="d-msg-h">
        <span className="nm">
          {from}
          {to ? ` to ${to}` : ''}
        </span>
        <span className="macts">
          <button type="button" className="d-ibtn sm" title="Reply (R)" onClick={onReply}>
            ↩
          </button>
          <button type="button" className="d-ibtn sm" title="Reply all (Enter)" onClick={onReplyAll}>
            ⤺
          </button>
          <button type="button" className="d-ibtn sm" title="Forward (F)" onClick={onForward}>
            ↪
          </button>
        </span>
        <span className="dt">{date}</span>
      </div>
      {invite}
      <div className={cx('d-body', paper && 'paper', html && 'html')}>{children}</div>
      {quoted ? (
        <>
          <button type="button" className="d-dots" title="Show quoted text" onClick={() => setShowQuote(!showQuote)}>
            …
          </button>
          {showQuote ? <div className="d-quote">{quoted}</div> : null}
        </>
      ) : null}
      {attachments.length ? (
        <div className="d-atts">
          {attachments.map((a) => (
            <Attachment key={a.name} name={a.name} size={a.size} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function Attachment({ name, size, onOpen, onSave }) {
  const f = fileBits(name, size);
  return (
    <div className="d-att" role="button" tabIndex={0} title={`open ${name}`} onClick={onOpen}>
      <div className="d-att-name">{f.base}</div>
      <div className="d-att-foot">
        <FileType name={name} />
        <span className="d-att-size">{f.size}</span>
        <button
          type="button"
          className="d-att-dl"
          title="save to Downloads"
          onClick={(e) => {
            e.stopPropagation();
            onSave && onSave();
          }}
        >
          <Icon name="download" />
        </button>
      </div>
    </div>
  );
}

// Under a thread when nothing is being written: four soft buttons, each with its key.
export function ReplyBar({ onReplyAll, onReply, onForward, onEvent }) {
  const b = (label, key, fn) => (
    <button type="button" className="d-btn-soft" onClick={fn}>
      {label} <span className="d-key">{key}</span>
    </button>
  );
  return (
    <div className="d-replybar">
      {b('reply all', 'Enter', onReplyAll)}
      {b('reply', 'R', onReply)}
      {b('forward', 'F', onForward)}
      {b('event', 'B', onEvent)}
    </div>
  );
}

export function NewMail({ count = 1, onClick }) {
  return (
    <div className="d-newmsgs">
      <button type="button" className="d-btn-banner" title="Show new messages (Shift+N)" onClick={onClick}>
        {`${count > 1 ? `${count} ` : ''}new mail. show`}
      </button>
    </div>
  );
}

// The app's tint() from markdown.ts: colours markdown under the transparent textarea, same letter widths.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function tint(text) {
  return `${esc(text || '')
    .replace(/(^|\n)(```[\s\S]*?(?:\n```|(?![\s\S])))/g, '$1<span class="t-code">$2</span>')
    .replace(/^(&gt;.*)$/gm, '<span class="t-quote">$1</span>')
    .replace(/^(#{1,3} .*)$/gm, '<span class="t-head">$1</span>')
    .replace(/^(\s*(?:[-*+]|\d+[.)]) )/gm, '<span class="t-mark">$1</span>')
    .replace(/(\*\*|__)(?=\S)([^\n]*?\S)\1/g, '<span class="t-mark">$1</span><span class="t-bold">$2</span><span class="t-mark">$1</span>')
    .replace(/(^|[^*\w])(\*|_)(?=\S)([^*_\n]*?\S)\2(?![*\w])/g, '$1<span class="t-mark">$2</span><span class="t-it">$3</span><span class="t-mark">$2</span>')
    .replace(/(`)([^`\n]+)(`)/g, '<span class="t-code">$1$2$3</span>')}\n`;
}

export function Editor({ value, onChange, placeholder = 'write.', short, boxed }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(short ? 96 : 200, el.scrollHeight)}px`;
  }, [value, short]);
  return (
    <div className={cx('d-editor', short && 'short', boxed && 'boxed')}>
      <div className="tint" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tint(value) }} />
      <textarea ref={ref} value={value} placeholder={placeholder} aria-label="Message" onChange={(e) => onChange && onChange(e.target.value)} />
    </div>
  );
}

// Writing: To / Cc / Bcc rows, a bold subject line, the tinted writing box, and a footer of words.
export function Composer({ to = '', cc, subject = '', text = '', mode = 'new', inline, files = [], suggestions, onChange, onSend, onLater, onDiscard }) {
  const set = (k) => (e) => onChange && onChange({ [k]: e.target.value });
  return (
    <div className={cx('d-composer', inline && 'inline')}>
      <div className="d-crow">
        <b>To</b>
        <input value={to} onChange={set('to')} autoComplete="off" aria-label="To" />
        {cc === undefined ? (
          <>
            <button type="button" className="d-ccbtn" title="Cc (Ctrl+Shift+C)" onClick={() => onChange && onChange({ cc: '' })}>
              Cc
            </button>
            <button type="button" className="d-ccbtn" title="Bcc (Ctrl+Shift+B)">
              Bcc
            </button>
          </>
        ) : null}
        {suggestions}
      </div>
      {cc !== undefined ? (
        <div className="d-crow">
          <b>Cc</b>
          <input value={cc} onChange={set('cc')} autoComplete="off" aria-label="Cc" />
        </div>
      ) : null}
      <input className="d-csubj" value={subject} onChange={set('subject')} placeholder="subject" aria-label="Subject" />
      <Editor value={text} onChange={(v) => onChange && onChange({ text: v })} placeholder={mode === 'new' ? 'write.' : 'reply.'} />
      {files.length ? (
        <div className="d-cfiles">
          {files.map((f) => (
            <FileChip key={f.name} name={f.name} size={f.size} />
          ))}
        </div>
      ) : null}
      <div className="d-cfoot">
        <button type="button" className="d-btn-quiet primary" title="Send (Ctrl+Enter)" onClick={onSend}>
          send
        </button>
        <button type="button" className="d-btn-quiet" title="Send later (Ctrl+Shift+L)" onClick={onLater}>
          later
        </button>
        <span className="grow" />
        <button type="button" className="d-ibtn" title="Attach (Ctrl+Shift+A)">
          <Icon name="clip" />
        </button>
        <button type="button" className="d-ibtn" title="Create event (B)">
          <Icon name="cal" />
        </button>
        <button type="button" className="d-ibtn" title="Discard (Ctrl+Shift+,)" onClick={onDiscard}>
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}

export function FileChip({ name, size, onRemove }) {
  return (
    <span className="d-cfile">
      {`${name} `}
      <small>{fileBits(name, size).size}</small>
      <button type="button" title="remove" aria-label={`remove ${name}`} onClick={onRemove}>
        ✕
      </button>
    </span>
  );
}

// An invitation inside a mail: rsvp / when / where / who rows. Bold question, plain answer.
export function Invite({ answer, when, where, who, cancelled, onAnswer }) {
  const row = (q, a) => (
    <div className="d-inv-row">
      <span className="d-inv-q">{q}</span>
      <span className="d-inv-a">{a}</span>
    </div>
  );
  return (
    <div className={cx('d-invite', cancelled && 'off')}>
      {cancelled
        ? row('rsvp', 'event cancelled.')
        : row(
            'rsvp',
            ['yes', 'maybe', 'no'].map((x) => (
              <button type="button" key={x} className={cx('d-choice', answer === x && 'on')} aria-pressed={answer === x ? 'true' : 'false'} onClick={() => onAnswer && onAnswer(x)}>
                {x}
              </button>
            )),
          )}
      {when ? row('when', when) : null}
      {where ? row('where', where) : null}
      {who ? row('who', who) : null}
    </div>
  );
}

// People under a To / Cc field. `inline` drops the absolute positioning (for specimens).
export function Suggestions({ people = [], active = 0, inline }) {
  return (
    <div className={cx('d-sugg', inline && 'inline')} role="listbox">
      {people.map((p, i) => (
        <div key={p.address} className={cx('d-sg', i === active && 'on')} role="option" aria-selected={i === active ? 'true' : 'false'}>
          <b>{p.name || p.address}</b>
          <span>{p.address}</span>
        </div>
      ))}
    </div>
  );
}

// The pane beside a conversation: name, address, their recent mail, their domain.
export function ContactCard({ name, address, mail = [] }) {
  const domain = (address || '').split('@')[1];
  return (
    <div className="d-contact">
      <div className="d-pane-title">{name}</div>
      <div className="em">{address}</div>
      <div className="sec">
        <div className="sec-h">
          <Icon name="mail" /> Mail
        </div>
        {mail.slice(0, 4).map((s) => (
          <div className="it" key={s}>
            {s}
          </div>
        ))}
      </div>
      {domain ? (
        <div className="sec">
          <div className="sec-h">
            <Icon name="search" /> {domain}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SearchTips({ tips = [] }) {
  return (
    <div className="d-tips">
      {tips.map(([q, meaning]) => (
        <React.Fragment key={q}>
          <b>{q}</b>
          <span>{meaning}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function RecentSearch({ children, onClick }) {
  return (
    <div className="d-recent" onClick={onClick}>
      {children}
    </div>
  );
}
