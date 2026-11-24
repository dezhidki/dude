import type * as React from 'react';

/**
 * The command palette (Mod K): 680px, flat, floats at 34vh with no dimming. Head in 15px mono with an icon,
 * 21px mono input on the 3px brand bar, 60px mono lines; the active line on --pal-on.
 * Plain mode: an empty ring, the command in Title Case, its keycaps. Ask mode (`ask`): typed times on the right.
 * @startingPoint section="Overlays" subtitle="Palette, keys dialog, toasts, side menu, alert" viewport="900x760"
 */
export interface CommandPaletteProps {
  icon?: 'cmd' | 'check' | 'cal' | 'pen' | 'clock';
  /** lowercase: "dude command", "remind when", "move to", "get me to zero" */
  title?: string;
  /** a question with examples: "when? 8 am, 3 days, aug 7" */
  placeholder?: string;
  query?: string;
  items: { t: string; keys?: string[]; when?: string }[];
  active?: number;
  ask?: boolean;
  /** render without the fixed scrim (specimens, mockups) */
  inline?: boolean;
  onQuery?: (q: string) => void;
  onPick?: (item: { t: string }, i: number) => void;
  onClose?: () => void;
}

/** A 560px dialog on a 25% black scrim at 20vh. Title is lowercase 17px ("keys"). */
export interface DialogProps {
  title?: string;
  width?: number;
  inline?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

/** The shortcut sheet: groups in two columns, 11px caps heads, name on the left, keycaps on the right. */
export interface KeysListProps {
  /** [group, [[name, "Mod Shift L"], …]][] — keys split on spaces */
  groups: [string, [string, string][]][];
}

/** One toast: terse lowercase ("sent.", "split gone."). An array puts a keycap in the middle. */
export interface ToastProps {
  msg: string | [string, string, string];
}

/** Toasts stack bottom-left (56px in, 24px up), newest last, each pops up 10px. */
export interface ToastStackProps {
  toasts: (string | [string, string, string])[];
  inline?: boolean;
}

/**
 * The folder menu: 300px on --pane, slides 24px from the rail. Your address in mono, then views with
 * "G then I" chords, a caps "Folders" section, and Settings.
 */
export interface SideMenuProps {
  account: string;
  items: { label: string; n?: number; keys: string[] }[];
  folders?: string[];
  active?: number;
  inline?: boolean;
  onPick?: (item: { label: string }, i: number) => void;
  onClose?: () => void;
}

/** "login for x dead. mail stuck." — the one red element, centred 12px from the top, 6px radius, white button. */
export interface AuthBarProps {
  email: string;
  inline?: boolean;
  onLogin?: () => void;
}

/** Full-window file viewer: 48px page-coloured bar (mono name, save, ✕) over a 92% black backdrop. */
export interface FileViewerProps {
  name: string;
  src?: string;
  pdf?: boolean;
  inline?: boolean;
  onSave?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
}
