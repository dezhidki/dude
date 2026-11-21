// What the screens ask the mail engine, and the shapes that come back. desktop/main.ts answers
// these over IPC (desktop/preload.js passes them on as window.mail); web/demo.ts answers the subset
// a browser demo needs. Types only: nothing here exists at runtime.

export type Provider = 'microsoft' | 'google' | 'demo';
export type Answer = 'yes' | 'maybe' | 'no';
/** star / read flags, moves between folders, and copies (Gmail labels) */
export type Action =
  | 'done'
  | 'undone'
  | 'trash'
  | 'spam'
  | 'restore'
  | 'move'
  | 'copy'
  | 'star'
  | 'unstar'
  | 'read'
  | 'unread';

export interface Person {
  name: string;
  address: string;
}

/** someone on an invitation or event, with their answer (ACCEPTED, TENTATIVE, DECLINED, NEEDS-ACTION or '') */
export interface Guest {
  name: string;
  email: string;
  status: string;
}

export interface Account {
  email: string;
  provider: Provider;
  name?: string;
}

/** an attached file as a list shows it */
export interface FileInfo {
  name: string;
  type: string;
  size: number;
  uid?: number;
}

/** a conversation in a folder list */
export interface Thread {
  id: string;
  folder: string;
  subject: string;
  from: Person;
  to: Person[];
  date: number;
  unread: boolean;
  starred: boolean;
  list: boolean;
  count: number;
  snippet: string;
  atts?: FileInfo[];
  size: number;
  uid?: number;
  uids?: number[];
  key?: string;
  threadId?: string;
  messageId?: string;
  /** the demo's act(): where it was before */
  prevFolder?: string;
}

/** a calendar invitation inside an email (parsed .ics, or an Outlook meeting request by its id) */
export interface Invite {
  method?: string;
  uid?: string;
  sequence?: number;
  title?: string;
  where?: string;
  start?: number | null;
  end?: number | null;
  allDay?: boolean;
  organizer?: { name: string; email: string } | null;
  attendees?: Guest[];
  cancelled?: boolean;
  /** Outlook: the meeting request's item id (details come from meeting()) */
  ews?: string;
  /** Google: the event's id */
  gid?: string;
  /** Outlook: details not read yet */
  pending?: boolean;
  /** Outlook: your answer so far */
  my?: string;
}

export interface Attachment {
  filename: string;
  type: string;
  size: number;
}

/** one email in an open conversation */
export interface Msg {
  id: string;
  uid?: number;
  folder?: string;
  subject: string;
  date: number;
  from: Person;
  to: Person[];
  /** the demo leaves out cc, html and invite when there are none */
  cc?: Person[];
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  text: string;
  html?: string | null;
  invite?: Invite | null;
  unsub?: { url: string | null; mail: string | null } | null;
  attachments: Attachment[];
  /** from the Drafts folder */
  draft?: boolean;
}

/** a file you attach, read in the window */
export interface OutFile {
  name: string;
  type: string;
  size?: number;
  data: string; // base64
}

/** an email to send or keep as a draft */
export interface OutMsg {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  inReplyTo?: string;
  references?: string;
  messageId?: string;
  files?: OutFile[];
  /** a calendar part (iMIP) and its METHOD */
  ics?: string;
  method?: string;
  /** a saved draft this one replaces */
  replaceUid?: number | null;
}

/** an event you create or change */
export interface EventInput {
  id?: string;
  title: string;
  start: number;
  end: number;
  where?: string;
  notes?: string;
  guests: string[];
  /** update(): who was invited before, with their answers */
  attendees?: Guest[];
}

/** an event in the week view */
export interface CalEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  allDay?: boolean;
  where?: string;
  organizer?: string;
  response?: string;
  server?: boolean;
  isMeeting?: boolean;
  isOrganizer?: boolean;
  cancelled?: boolean;
  notes?: string;
}

export interface CalDetail {
  notes: string;
  organizer: { name: string; email: string } | null;
  attendees: Guest[];
}

export interface Folder {
  path: string;
  name: string;
}

export interface Contact extends Person {
  score: number;
  last: number;
}

export interface Ok {
  ok: boolean;
  id?: string;
}

/** a notification for new mail */
export interface Note {
  title: string;
  body: string;
  id?: string;
}

/** the app asks you to sign in again (desktop/main.ts askToSignIn) */
export interface AuthInfo {
  email: string;
  provider: 'microsoft' | 'google';
  reason: string;
}

/** everything window.mail offers (desktop/preload.js) */
export interface Mail {
  accounts(): Promise<Account[]>;
  signIn(provider: 'microsoft' | 'google', email: string): Promise<Account>;
  signOut(email: string): Promise<void>;
  list(view: string): Promise<Thread[]>;
  listCached(view: string): Promise<Thread[]>;
  search(q: string): Promise<Thread[]>;
  thread(t: Thread, opts?: { peek?: boolean; unread?: boolean }): Promise<Msg[]>;
  related(t: Thread, have: Msg[]): Promise<Msg[]>;
  act(t: Thread, action: Action, folder?: string): Promise<Thread>;
  contacts(): Promise<Contact[]>;
  people(q: string): Promise<Person[]>;
  send(msg: OutMsg): Promise<Ok>;
  invite(ev: EventInput): Promise<Ok>;
  saveDraft(msg: OutMsg): Promise<{ uid: number | null }>;
  deleteDraft(uid: number): Promise<void>;
  folders(): Promise<Folder[]>;
  calStatus(): Promise<{ connected: boolean; canConnect: boolean }>;
  calConnect(): Promise<{ connected: boolean }>;
  calEvents(from: number, to: number): Promise<CalEvent[]>;
  calCreate(ev: EventInput): Promise<{ id: string }>;
  calDetail(id: string): Promise<CalDetail | null>;
  /** guests left out: the guest list stays as it is */
  calUpdate(id: string, ev: Omit<EventInput, 'guests'> & { guests?: string[] }): Promise<Ok>;
  calDelete(id: string): Promise<Ok>;
  rsvp(inv: Invite, answer: Answer, fromName?: string): Promise<{ via: 'calendar' | 'mail' }>;
  meeting(id: string): Promise<Invite | null>;
  attachmentData(
    folder: string,
    uid: number,
    name: string,
    index: number,
  ): Promise<{ name: string; type: string; data: string }>;
  attachment(
    folder: string,
    uid: number,
    name: string,
    index: number,
    mode: 'open' | 'save',
  ): Promise<{ path: string; name: string }>;
  notify(n: Note): Promise<void>;
  setUnread(n: number): Promise<void>;
  pushStatus(): Promise<{ live: boolean }>;
  onOpen(cb: (id: string) => void): void;
  onDo(cb: (what: string) => void): void;
  onAuth(cb: (info: AuthInfo) => void): void;
  onMail(cb: () => void): void;
}

/** the calls a browser demo can answer too; the rest only exist on the desktop */
type Always =
  | 'accounts'
  | 'signIn'
  | 'signOut'
  | 'list'
  | 'search'
  | 'thread'
  | 'act'
  | 'send'
  | 'invite'
  | 'folders'
  | 'rsvp'
  | 'calStatus'
  | 'calEvents'
  | 'calCreate'
  | 'calDetail'
  | 'calUpdate'
  | 'calDelete';

/** what the screens talk to: the desktop engine or the demo */
export type Backend = Pick<Mail, Always> & Partial<Omit<Mail, Always>> & { demo?: boolean };

declare global {
  interface Window {
    mail?: Mail;
  }
}
