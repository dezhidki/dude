import type * as React from 'react';

/** The dude wordmark: a 34px brand square with a mono "d", then "dude" in mono 800 30px. */
export interface LogoProps {}

/**
 * The window: Rail | main | Pane, full height. Narrow-window rules follow the shell's own width
 * (container queries): pane hides under 1200px, rail hides and a tab bar shows under 768px.
 * @startingPoint section="Shell" subtitle="Empty dude window: rail, list header, pane" viewport="1100x520"
 */
export interface AppShellProps {
  rail?: React.ReactNode;
  pane?: React.ReactNode;
  /** screen-change animation: lists fade (0.14s), threads rise 8px (0.18s) */
  enter?: 'enter-fade' | 'enter-in';
  children?: React.ReactNode;
}

/** 40px rail with two icon buttons: mail and calendar. The active one is brand on --hi. */
export interface RailProps {
  active?: 'mail' | 'cal';
  onChange?: (v: 'mail' | 'cal') => void;
}

/** 76px list header: hamburger, then SplitTabs (or a folder title), then up to three IconButtons. */
export interface ListHeaderProps {
  onMenu?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/** A reading page (thread, compose, settings): sticky back arrow, 712px centred column, 22px subject. */
export interface ThreadViewProps {
  title: React.ReactNode;
  onBack?: () => void;
  /** IconButtons on the right of the title: done, remind, command, up, down */
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/** The 398px right pane on --pane. Title row is 80px; the foot (62px) holds your address and one icon button. */
export interface PaneProps {
  title?: React.ReactNode;
  /** a contact / tips pane: hidden when the window is under 1200px */
  contact?: boolean;
  foot?: React.ReactNode;
  footAction?: React.ReactNode;
  children?: React.ReactNode;
}

/** A settings block: bold lowercase title ("undo send"), a terse hint ("time to hit Z."), then the control. 18px 36px, hairline below. */
export interface SettingsSectionProps {
  title: string;
  hint?: string;
  children?: React.ReactNode;
}

/** Bottom tab bar, phones only (shell under 768px). Plain words, no icons. */
export interface TabBarProps {
  items?: string[];
  onPick?: (item: string) => void;
}
