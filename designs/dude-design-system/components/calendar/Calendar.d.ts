import type * as React from 'react';

type Kind = 'local' | 'pending' | 'inv' | 'draft' | 'declined';
interface Ev {
  title: string;
  /** hours of the day: 9.5 = 9:30 */
  start: number;
  end: number;
  where?: string;
  kind?: Kind;
  lane?: number;
  lanes?: number;
}

/**
 * An event block in its hours. Filled --ev with a 3px --ev-bar edge in light, flat lime-on-olive in carbon.
 * local/pending = outlined, inv = dashed outline, draft = dashed (being written), declined = 55% + struck.
 * Events at the same time split the width (lane of lanes). Under 30px tall the text stays on one line.
 */
export interface EventBlockProps extends Ev {
  onClick?: () => void;
}

/** An all-day event: 12px text on --ev, 2px radius, one line. */
export interface EventChipProps {
  title: string;
  onClick?: () => void;
}

/** A mono note boxed in --line-2 above the hours: "calendar not linked. connect". */
export interface CalNoteProps {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}

/**
 * The day beside the mail (key 0): "Tue, Nov 25" in 17px, ‹ ›, "today"/"week" outline buttons, then 24 × 44px hours
 * in a hairline box with mono labels, events, and the red now-line with its 8px dot.
 * @startingPoint section="Calendar" subtitle="Day pane, week, month, event form" viewport="900x760"
 */
export interface DayCalendarProps {
  label: string;
  events?: Ev[];
  allDay?: string[];
  /** hour of the now-line, e.g. 10.4 */
  now?: number;
  tz?: string;
  isToday?: boolean;
  /** first hour in view */
  scrollTo?: number;
  note?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  onWeek?: () => void;
}

/**
 * The week (key 2): month title at 22px, day heads at 14px with today as a brand pill, 56px mono hour gutter,
 * hairline columns, today's column washed with 4% brand.
 */
export interface WeekViewProps {
  title: string;
  days: { label: string; today?: boolean; events?: Ev[]; allDay?: string[] }[];
  tz?: string;
  now?: number;
  scrollTo?: number;
  onToday?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onAdd?: () => void;
}

/** A month grid in mono: today a brand circle, the shown week a --hi band, other months --text-3. */
export interface MiniMonthProps {
  year: number;
  /** 0-based */
  month: number;
  today?: number;
  /** a day of the week being shown, to band it */
  weekOf?: number;
  mondayFirst?: boolean;
  onPick?: (d: Date) => void;
}

/** Calendar account line (mono) and option checkboxes: weekends, declined events, week starts monday. */
export interface CalendarOptionsProps {
  account: string;
  /** "linked", "events made here only" */
  status?: string;
  options?: { label: string; on?: boolean }[];
  onToggle?: (label: string, on: boolean) => void;
}

/** Writing an event: "what" on a 2px brand underline, icon rows of bare inputs (who, when, where, notes), parsed time in mono. */
export interface EventFormProps {
  title?: string;
  guests?: string;
  /** typed time: "tomorrow 2 pm 30 min" */
  when?: string;
  /** how it reads back: "Wed 26 Nov, 2:00 PM – 2:30 PM" */
  parsed?: string;
  where?: string;
  notes?: string;
  fresh?: boolean;
  onChange?: (patch: Record<string, string>) => void;
}

/** Someone else's meeting, read-only: 18px 600 title, clock / pin / person lines, rsvp ChoiceButtons, notes. */
export interface EventViewProps {
  title: string;
  when: string;
  where?: string;
  who?: string;
  answer?: 'yes' | 'maybe' | 'no';
  notes?: string;
  onAnswer?: (a: 'yes' | 'maybe' | 'no') => void;
}

/** "SAVE" (filled) · "NOPE" · "DELETE" (red) · keys hint; or "CLOSE" · Esc when viewing. */
export interface EventButtonsProps {
  view?: boolean;
  canDelete?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}
