import React from 'react';
import { Icon } from '../controls/Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');
const caps = (keys = []) =>
  keys.map((k, i) => (
    <span key={i} className="d-key">
      {k}
    </span>
  ));

// The command palette. Mono throughout: a small head with an icon, a 21px input on the brand bar, 60px lines.
// Plain mode: every line starts with an empty ring and ends in keycaps. Ask modes ("remind when") show typed times.
export function CommandPalette({ icon = 'cmd', title = 'dude command', placeholder = '', query = '', items = [], active = 0, ask, inline, onQuery, onPick, onClose }) {
  const box = (
    <div className="d-cmd" role="dialog" aria-label={title}>
      <div className="d-cmd-h">
        <Icon name={icon} /> {title}
      </div>
      <div className="d-cmd-in">
        <input value={query} placeholder={placeholder} aria-label={title} onChange={(e) => onQuery && onQuery(e.target.value)} autoFocus={!inline} />
      </div>
      <ul>
        {items.map((c, i) => (
          <li key={c.t} className={i === active ? 'on' : undefined} onClick={() => onPick && onPick(c, i)}>
            {ask ? null : <span className="ic" />}
            <span className="t">{c.t}</span>
            {c.when ? <span className="when">{c.when}</span> : <span className="ks">{caps(c.keys)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
  if (inline) return box;
  return (
    <div className="d-scrim" onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      {box}
    </div>
  );
}

// A dialog: dims the app (the only overlay that does), 17px title in lowercase.
export function Dialog({ title, width, inline, onClose, children }) {
  const box = (
    <div className="d-dlg" role="dialog" style={width ? { width } : undefined}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </div>
  );
  if (inline) return box;
  return (
    <div className="d-scrim dim" onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      {box}
    </div>
  );
}

// The shortcut sheet inside a Dialog: two columns of groups, caps group heads, keycaps on the right.
export function KeysList({ groups = [] }) {
  return (
    <div className="d-keys">
      {groups.map(([g, rows]) => (
        <section key={g}>
          <h5>{g}</h5>
          {rows.map(([name, keys]) => (
            <div key={name}>
              <span>{name}</span>
              <span>{caps(keys.split(' '))}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

// A toast. Pass ["sending… ", "Z", " undo"] to put a keycap in the middle.
export function Toast({ msg }) {
  return <div className="d-toast">{Array.isArray(msg) ? [msg[0], <span key="k" className="d-key">{msg[1]}</span>, msg[2]] : msg}</div>;
}

export function ToastStack({ toasts = [], inline }) {
  return (
    <div className={cx('d-toasts', inline && 'inline')} role="status" aria-live="polite">
      {toasts.map((t, i) => (
        <Toast key={i} msg={t} />
      ))}
    </div>
  );
}

// Folders: your address, the fixed views with G-then-key chords, your folders, Settings last.
export function SideMenu({ account, items = [], folders = [], active = 0, inline, onPick, onClose }) {
  let n = -1;
  const line = (it) => {
    n += 1;
    const i = n;
    return (
      <button type="button" key={`${it.label}${i}`} className={cx('d-sm-item', i === active && 'on')} onClick={() => onPick && onPick(it, i)}>
        <span>
          {it.label}
          {it.n ? <span className="n">{it.n > 150 ? '150+' : it.n}</span> : null}
        </span>
        <span className="d-sm-keys">
          {it.keys && it.keys[0] === 'G' && it.keys.length === 2 ? (
            <>
              <span className="d-key">G</span>
              <small>then</small>
              <span className="d-key">{it.keys[1]}</span>
            </>
          ) : (
            caps(it.keys)
          )}
        </span>
      </button>
    );
  };
  const nav = (
    <nav className={cx('d-sidemenu', inline && 'inline')} aria-label="Folders">
      <div className="d-sm-head">{account}</div>
      {items.map(line)}
      {folders.length ? <div className="d-sm-sep">Folders</div> : null}
      {folders.map((f) => line({ label: f, keys: [] }))}
      <div className="d-sm-gap" />
      {line({ label: 'Settings', keys: ['Ctrl', ','] })}
    </nav>
  );
  if (inline) return nav;
  return (
    <>
      <div className="d-sidemenu-scrim" onClick={onClose} />
      {nav}
    </>
  );
}

export function AuthBar({ email, inline, onLogin }) {
  return (
    <div className={cx('d-authbar', inline && 'inline')} role="alert">
      <span>
        login for <b>{email}</b> dead. mail stuck.
      </span>
      <button type="button" className="d-btn-alert" onClick={onLogin}>
        login again
      </button>
    </div>
  );
}

// PDFs and pictures open inside the app: a page-coloured bar over a near-black backdrop.
export function FileViewer({ name, src, pdf, inline, onSave, onClose, children }) {
  return (
    <div className={cx('d-viewer', inline && 'inline')} role="dialog" aria-label={name}>
      <div className="d-vbar">
        <span className="d-vname">{name}</span>
        <button type="button" className="d-btn-toolbar" title="save to Downloads (S)" onClick={onSave}>
          <Icon name="download" /> save
        </button>
        <button type="button" className="d-btn-toolbar" title="close (Esc)" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="d-vbody">{children || (src ? pdf ? <iframe src={src} title={name} /> : <img src={src} alt={name} /> : null)}</div>
    </div>
  );
}
