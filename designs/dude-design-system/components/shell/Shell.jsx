import React from 'react';
import { Icon } from '../controls/Icon.jsx';

// Rail | main | pane. `enter` replays the screen-change animation: "enter-fade" for lists, "enter-in" for a thread.
export function AppShell({ rail, pane, enter, children }) {
  return (
    <div className="d-shell">
      {rail}
      <div className={['d-main', enter].filter(Boolean).join(' ')}>{children}</div>
      {pane}
    </div>
  );
}

export function Logo() {
  return (
    <div className="d-logo">
      <span className="d-logo-mark">d</span>
      <span className="d-logo-word">dude</span>
    </div>
  );
}

export function Rail({ active = 'mail', onChange }) {
  return (
    <nav className="d-rail" aria-label="Apps">
      <button type="button" className={active === 'mail' ? 'on' : undefined} title="Mail (1)" aria-label="Mail" onClick={() => onChange && onChange('mail')}>
        <Icon name="mail" />
      </button>
      <button type="button" className={active === 'cal' ? 'on' : undefined} title="Calendar (2)" aria-label="Calendar" onClick={() => onChange && onChange('cal')}>
        <Icon name="cal" />
      </button>
    </nav>
  );
}

// The list's header: hamburger at 18px, the splits (or the folder name), then the three icons on the right.
export function ListHeader({ onMenu, actions, children }) {
  return (
    <header className="d-head">
      <button type="button" className="d-menu-btn" title="Folders" aria-label="Folders" onClick={onMenu}>
        <Icon name="menu" />
      </button>
      {children}
      {actions ? <div className="d-head-icons">{actions}</div> : null}
    </header>
  );
}

// A reading page: back arrow pinned top-left, a 712px column, the subject as a 22px light title.
export function ThreadView({ title, onBack, actions, children }) {
  return (
    <div className="d-thread">
      <div className="d-thread-top">
        <button type="button" className="d-back" title="Back (Esc)" aria-label="Back" onClick={onBack}>
          <Icon name="back" />
        </button>
      </div>
      <div className="d-tcol">
        <div className="d-thead">
          <h1>{title}</h1>
          {actions ? <div className="d-tacts">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

// The right pane. `contact` panes hide under 1200px; calendar panes stay.
export function Pane({ title, contact, foot, footAction, children }) {
  return (
    <aside className={['d-pane', contact && 'contact'].filter(Boolean).join(' ')}>
      <div className="d-pane-body">
        {title ? <div className="d-pane-title">{title}</div> : null}
        {children}
      </div>
      {foot ? (
        <div className="d-pane-foot">
          <b>{foot}</b>
          {footAction}
        </div>
      ) : null}
    </aside>
  );
}

// A settings block: 15px bold lowercase title, one plain hint line, the control. Hairline under each.
export function SettingsSection({ title, hint, children }) {
  return (
    <section className="d-set">
      <h3>{title}</h3>
      {hint ? <p className="hint">{hint}</p> : null}
      {children}
    </section>
  );
}

export function TabBar({ items = ['Inbox', 'Search', 'Compose', 'Calendar', 'More'], onPick }) {
  return (
    <div className="d-tabbar">
      {items.map((t) => (
        <button type="button" key={t} onClick={() => onPick && onPick(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}
