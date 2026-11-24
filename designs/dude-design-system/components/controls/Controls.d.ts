import type * as React from 'react';

/** A keycap: Enter, Z, ⌘. Mono 700 11px on --key, 2px radius. */
export interface KeyProps {
  children: React.ReactNode;
}

/** A shortcut as a row of keycaps. Use "then" between a chord's steps: ["G", "then", "I"]. */
export interface KeysProps {
  keys: string[];
}

/** 26px square icon button (22px "sm" inside an open message, 20px "xs" in the day pane head). */
export interface IconButtonProps {
  icon?: 'clip' | 'mail' | 'cal' | 'menu' | 'pen' | 'search' | 'check' | 'clock' | 'cmd' | 'trash' | 'person' | 'pin' | 'lines' | 'download' | 'back' | 'up' | 'down' | 'left' | 'right';
  /** accessible name; also the tooltip unless title is set */
  label?: string;
  /** tooltip, "Mark Done (E)" style: action in Title Case, key in brackets */
  title?: string;
  /** brand-coloured when the thing it toggles is showing */
  on?: boolean;
  size?: 'sm' | 'xs';
  onClick?: () => void;
  /** a glyph instead of an icon: "✕", "+", "?", "↩" */
  children?: React.ReactNode;
}

/**
 * dude's buttons. Each variant is one class in the app; don't mix them.
 * main: sign-in "go" (brand fill, mono, 42px). secondary: outline under it. soft: reply bar.
 * outline: tiny mono "today"/"week". toolbar: file viewer bar. quiet: composer footer words (primary = send).
 * caps: event form words (danger = delete). save: filled caps. link: brand word in settings.
 * banner: "new mail. show". alert: white button on the red sign-in-again bar.
 * @startingPoint section="Controls" subtitle="Every button variant dude ships" viewport="700x520"
 */
export interface ButtonProps {
  variant?: 'main' | 'secondary' | 'soft' | 'outline' | 'toolbar' | 'quiet' | 'caps' | 'save' | 'link' | 'banner' | 'alert';
  primary?: boolean;
  danger?: boolean;
  icon?: IconButtonProps['icon'];
  /** keycap after the word, e.g. reply all + Enter */
  keyHint?: string;
  title?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

/** One of a few answers in a row (rsvp yes / maybe / no). The chosen one fills with brand. */
export interface ChoiceButtonProps {
  on?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

/** Settings' segmented control: "off · 3 s · 5 s · 10 s · 20 s". */
export interface SegmentedProps {
  options: { value: string | number | boolean; label: string }[];
  value: string | number | boolean;
  onChange?: (v: string | number | boolean) => void;
}

/** The boxed input (settings name). tall = the 42px mono field on sign-in. Focus turns the border brand. */
export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tall?: boolean;
}

/** Native checkbox tinted with the brand colour, label after it. */
export interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

/** A boxless input marked only by the 3px brand bar on its left (search box). */
export interface BarInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
