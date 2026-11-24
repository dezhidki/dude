import type * as React from 'react';

/** The inbox's splits in the list header: 17px names, "•" between, unread count in 13px mono (150+ cap). */
export interface SplitTabsProps {
  splits: { id: string; name: string; n?: number }[];
  active: string;
  onChange?: (id: string) => void;
}

/** A 48px date group label in the list: "Yesterday", "December 3rd", "Last 7 days", "Last 30 days". Bold, --text-3. */
export interface ListSeparatorProps {
  children: React.ReactNode;
}

/** A quiet one-liner where a list would be: "loading…", "nothing.", "folder no load." */
export interface ListNoteProps {
  children: React.ReactNode;
}

/** The coloured file extension (PDF red, DOC blue, sheet green, slides orange, images violet). Mono 700 11px caps. */
export interface FileTypeProps {
  name: string;
}

/** 24px file chip on a list row: extension + base name. Hover borders it brand. */
export interface AttachmentChipProps {
  name: string;
  onClick?: () => void;
}

/**
 * One conversation, 36px tall (68px with file chips). 260px sender column, bold subject then grey snippet,
 * mono lowercase date. Unread = 5px brand dot at 43px + sender at 500. Selected = --hi + 3px brand bar,
 * and the date gives way to done / remind / command icons.
 * @startingPoint section="Mail" subtitle="List rows, messages, composer, attachments, invite" viewport="900x900"
 */
export interface ListRowProps {
  from: string;
  subject: string;
  snippet?: string;
  /** "14:05" today, "3 dec" before, "3 dec 2024" another year */
  date: string;
  unread?: boolean;
  selected?: boolean;
  /** picked with X: a brand ✓ replaces the dot */
  picked?: boolean;
  starred?: boolean;
  /** messages in the conversation, shown after the sender in --text-3 */
  count?: number;
  /** a reply draft is waiting: red "draft" before the sender */
  draft?: boolean;
  files?: string[];
  /** after Done: slides 24px right and collapses in 0.16s */
  leaving?: boolean;
  onClick?: () => void;
  onDone?: () => void;
  onRemind?: () => void;
  onCmd?: () => void;
}

/** The empty folder: mono 800 28px title, one mono line under it. Inbox: "inbox zero." / "nothing left. go outside." */
export interface ZeroStateProps {
  title?: string;
  line?: string;
}

/** A collapsed message in a thread, 40px: bold first name ("Me" for you), one line of text, mono date. */
export interface MessageRowProps {
  name: string;
  snippet: string;
  date: string;
  focus?: boolean;
  draft?: boolean;
  onClick?: () => void;
}

/**
 * An open message on --card, 4px radius. Name in 700 15px with "to …", reply ↩ ⤺ ↪ at 60% opacity, mono date.
 * Body 16/24. Quoted history folds behind "…". Focus = 3px brand inset bar.
 */
export interface MessageProps {
  from: string;
  to?: string;
  date: string;
  focus?: boolean;
  /** designed HTML mail: keeps its own white sheet (dimmed 8% in carbon) */
  paper?: boolean;
  /** plain HTML mail: theme colours, but the mail frame's font (--sans-mail), not the UI sans */
  html?: boolean;
  quoted?: string;
  /** an <Invite/> shown between head and body */
  invite?: React.ReactNode;
  attachments?: { name: string; size?: number }[];
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  children?: React.ReactNode;
}

/** A 154×92 attachment tile on --hi: name (3 lines max), then type · size · download. */
export interface AttachmentProps {
  name: string;
  size?: number;
  onOpen?: () => void;
  onSave?: () => void;
}

/** Under a thread: "reply all Enter", "reply R", "forward F", "event B" as soft buttons. */
export interface ReplyBarProps {
  onReplyAll?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onEvent?: () => void;
}

/** "2 new mail. show" — caps banner in brand, shown when replies land while you read. */
export interface NewMailProps {
  count?: number;
  onClick?: () => void;
}

/** The writing box: transparent textarea over a tinted copy (bold darker, italic brand, `code` green, marks dimmed). Grows with text. */
export interface EditorProps {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  /** settings' signature box: 96px min instead of 200px */
  short?: boolean;
  /** on a --card box with 10px 14px padding (settings) */
  boxed?: boolean;
}

/**
 * Writing a mail: To (with Cc / Bcc words), bold subject, the Editor, then "send · later" and attach / event / discard icons.
 * `inline` = under a thread, marked by the 3px brand bar.
 */
export interface ComposerProps {
  to?: string;
  /** undefined hides the Cc row and shows the Cc / Bcc words */
  cc?: string;
  subject?: string;
  text?: string;
  mode?: 'new' | 'reply';
  inline?: boolean;
  files?: { name: string; size?: number }[];
  /** a <Suggestions/> dropped under the To row */
  suggestions?: React.ReactNode;
  onChange?: (patch: Record<string, string>) => void;
  onSend?: () => void;
  onLater?: () => void;
  onDiscard?: () => void;
}

/** A file on a draft: name, size, ✕. 1px --line-2 outline, 2px radius. */
export interface FileChipProps {
  name: string;
  size?: number;
  onRemove?: () => void;
}

/** An invitation inside a mail: rsvp (yes / maybe / no ChoiceButtons), when, where, who. Hairlines above and below. */
export interface InviteProps {
  answer?: 'yes' | 'maybe' | 'no';
  when?: React.ReactNode;
  where?: React.ReactNode;
  who?: React.ReactNode;
  cancelled?: boolean;
  onAnswer?: (a: 'yes' | 'maybe' | 'no') => void;
}

/** People under To / Cc: bold name, grey address, active line on --pal-on. The one popover with a shadow. */
export interface SuggestionsProps {
  people: { name?: string; address: string }[];
  active?: number;
  inline?: boolean;
}

/** The pane beside a conversation: sender's name (17px), bold address, their last four subjects, their domain. */
export interface ContactCardProps {
  name: string;
  address: string;
  mail?: string[];
}

/** Search "tricks": a two-column grid of bold query and plain meaning, 32px lines. */
export interface SearchTipsProps {
  tips: [string, string][];
}

/** A recent search on the empty search page: bold, list gutter. */
export interface RecentSearchProps {
  children: React.ReactNode;
  onClick?: () => void;
}
