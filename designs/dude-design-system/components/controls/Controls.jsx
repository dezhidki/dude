import React from 'react';
import { Icon } from './Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

// dude's buttons are words. Copy is lowercase ("go", "reply all", "send"); keycaps ride along.
export function Button({ variant = 'soft', primary, danger, icon, keyHint, title, onClick, children }) {
  return (
    <button
      type="button"
      className={cx(VARIANT[variant], primary && 'primary', danger && 'danger')}
      title={title}
      onClick={onClick}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
      {keyHint ? <span className="d-key">{keyHint}</span> : null}
    </button>
  );
}

export function Key({ children }) {
  return <span className="d-key">{children}</span>;
}

// A shortcut: ["G", "then", "I"] or ["Mod", "Shift", "L"]. "then" renders as a small word, not a cap.
export function Keys({ keys = [] }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {keys.map((k, i) =>
        k === 'then' ? (
          <small key={i} style={{ font: '700 13px var(--mono)', color: 'var(--text-3)' }}>
            then
          </small>
        ) : (
          <span key={i} className="d-key">
            {k}
          </span>
        ),
      )}
    </span>
  );
}

export function IconButton({ icon, label, title, on, size, onClick, children }) {
  return (
    <button
      type="button"
      className={cx('d-ibtn', on && 'on', size)}
      title={title || label}
      aria-label={label || title}
      onClick={onClick}
    >
      {icon ? <Icon name={icon} /> : children}
    </button>
  );
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
  alert: 'd-btn-alert',
};

export function ChoiceButton({ on, onClick, children }) {
  return (
    <button type="button" className={cx('d-choice', on && 'on')} aria-pressed={on ? 'true' : 'false'} onClick={onClick}>
      {children}
    </button>
  );
}

export function Segmented({ options = [], value, onChange }) {
  return (
    <div className="d-seg" role="group">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          className={String(o.value) === String(value) ? 'on' : undefined}
          onClick={() => onChange && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ tall, ...rest }) {
  return <input className={cx('d-field', tall && 'tall')} {...rest} />;
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label className="d-check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange && onChange(e.target.checked)} /> {label}
    </label>
  );
}

export function BarInput(props) {
  return <input className="d-barinput" {...props} />;
}
