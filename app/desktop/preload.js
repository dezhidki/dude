// @ts-check
// The page talks to the mail engine only through these calls. Plain JavaScript: the sandboxed preload
// can't strip types, so tsc checks it against the Mail contract (web/api.ts) instead.
const { contextBridge, ipcRenderer } = require('electron');
/** @param {string} name @param {...unknown} args */
const call = (name, ...args) => ipcRenderer.invoke('mail', name, ...args);

contextBridge.exposeInMainWorld(
  'mail',
  /** @type {import('../web/api.ts').Mail} */ ({
    accounts: () => call('accounts'),
    signIn: (provider, email) => call('signIn', provider, email),
    signOut: (email) => call('signOut', email),
    list: (view) => call('list', view),
    search: (q) => call('search', q),
    thread: (t, opts) => call('thread', t, opts || {}),
    related: (t, have) =>
      call(
        'related',
        t,
        have.map((m) => ({ messageId: m.messageId, inReplyTo: m.inReplyTo, references: m.references })),
      ),
    act: (t, action, folder) => call('act', t, action, folder),
    contacts: () => call('contacts'),
    listCached: (view) => call('listCached', view),
    people: (q) => call('people', q),
    send: (msg) => call('send', msg),
    invite: (ev) => call('invite', ev),
    saveDraft: (msg) => call('saveDraft', msg),
    deleteDraft: (uid) => call('deleteDraft', uid),
    folders: () => call('folders'),
    calStatus: () => call('calStatus'),
    calConnect: () => call('calConnect'),
    calEvents: (from, to) => call('calEvents', from, to),
    calCreate: (ev) => call('calCreate', ev),
    calDetail: (id) => call('calDetail', id),
    calUpdate: (id, ev) => call('calUpdate', id, ev),
    calDelete: (id) => call('calDelete', id),
    rsvp: (inv, answer, fromName) => call('rsvp', inv, answer, fromName),
    meeting: (id) => call('meeting', id),
    attachmentData: (folder, uid, name, index) => call('attachmentData', folder, uid, name, index),
    attachment: (folder, uid, name, index, mode) => call('attachment', folder, uid, name, index, mode),
    notify: (n) => call('notify', n),
    setUnread: (n) => call('unread', n),
    onOpen: (cb) => ipcRenderer.on('dude:open', (_, id) => cb(id)),
    onDo: (cb) => ipcRenderer.on('dude:do', (_, what) => cb(what)),
    onAuth: (cb) => ipcRenderer.on('dude:auth', (_, info) => cb(info)),
    onMail: (cb) => ipcRenderer.on('dude:mail', () => cb()),
    pushStatus: () => call('pushStatus'),
  }),
);
