const {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  shell,
  Tray,
  Menu,
  Notification,
  nativeImage,
  powerMonitor,
} = require('electron');

const path = require('node:path');
const fs = require('node:fs');
const oauth = require('./oauth');
const mail = require('./mail');
const { isAuthError, isConnError } = require('./auth-errors');
const calendar = require('./calendar');

// The screens are local files: never serve an older cached copy after an update.
app.commandLine.appendSwitch('disable-http-cache');
// Where dude keeps your sign-in and settings. Before the rename the app was "Kestrel Mail":
// its folder is kept, so you stay signed in. DUDE_PROFILE=/some/folder gives a separate test profile.
const legacy = path.join(app.getPath('appData'), 'Kestrel Mail');
const profile = process.env.DUDE_PROFILE;

if (profile) app.setPath('userData', profile);
else if (fs.existsSync(legacy)) app.setPath('userData', legacy);

app.setAppUserModelId('sh.deni.dude');

// One dude at a time: starting it again brings the running one forward.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => showWindow());

let win,
  tray,
  quitting = false;

const img = (name) => nativeImage.createFromPath(path.join(__dirname, name));

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

// Tray icon: shows unread mail, opens the window, quits. Closing the window keeps dude here so
// new-mail notifications keep coming.
function createTray() {
  tray = new Tray(img('tray.png').resize({ width: 22, height: 22 }));
  tray.setToolTip('dude');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'open dude', click: showWindow },
      {
        label: 'new mail',
        click: () => {
          showWindow();
          win.webContents.send('dude:do', 'compose');
        },
      },
      { type: 'separator' },
      {
        label: 'quit',
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on('click', () => (win.isVisible() && win.isFocused() ? win.hide() : showWindow()));
}

function setUnread(n) {
  if (!tray) return;
  tray.setImage(img(n ? 'tray-unread.png' : 'tray.png').resize({ width: 22, height: 22 }));
  tray.setToolTip(n ? `dude — ${n} unread` : 'dude');
  app.setBadgeCount(n);
}

function notify({ title, body, id }) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, icon: path.join(__dirname, 'icon.png'), silent: false });
  n.on('click', () => {
    showWindow();
    if (id) win.webContents.send('dude:open', id);
  });
  n.show();
}

const store = () => path.join(app.getPath('userData'), 'accounts.json');
mail.setCacheDir(path.join(app.getPath('userData'), 'mailcache'));

// Tokens are kept encrypted with the system keychain when one is available.
function loadAccounts() {
  try {
    const raw = fs.readFileSync(store());
    const json = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString();
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function saveAccounts(list) {
  const json = JSON.stringify(list);
  fs.mkdirSync(path.dirname(store()), { recursive: true });
  fs.writeFileSync(store(), safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(json) : json, {
    mode: 0o600,
  });
}

let accounts = [];

const active = () => {
  if (!accounts[0]) throw new Error('not signed in');
  return accounts[0];
};

const persistAfter = async (p) => {
  const r = await p;
  saveAccounts(accounts);
  return r;
}; // refreshed tokens

// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters aren't allowed in file names
const NOT_IN_FILE_NAMES = /[\\/:*?"<>|\x00-\x1f]/g;

const handlers = {
  accounts: () => accounts.map((a) => ({ email: a.email, provider: a.provider })),
  signIn: async (provider, email) => {
    const a = await oauth.signIn(provider, email, win);
    mail.forget(a.email); // reconnect with the new sign-in
    accounts = [a, ...accounts.filter((x) => x.email !== a.email)];
    saveAccounts(accounts);
    return { email: a.email, provider: a.provider };
  },
  listCached: (view) => mail.listCached(active(), view),
  signOut: (email) => {
    mail.unwatch(email);
    mail.forget(email);
    mail.dropCache(email);
    accounts = accounts.filter((a) => a.email !== email);
    saveAccounts(accounts);
  },
  list: async (view) => {
    const r = await persistAfter(mail.list(active(), view));
    mail.warm(active());
    startPush();
    return r;
  },
  pushStatus: () => ({ live: !!accounts[0] && mail.pushLive(accounts[0].email) }),
  search: (q) => persistAfter(mail.search(active(), q)),
  thread: (t, opts) => persistAfter(mail.thread(active(), t, opts)),
  related: (t, have) => persistAfter(mail.related(active(), t, have)),
  act: (t, action, folder) => persistAfter(mail.act(active(), t, action, folder)),
  contacts: () => persistAfter(mail.contacts(active())),
  people: async (q) => {
    try {
      return await calendarCall((a) => calendar.people(a, q));
    } catch {
      return [];
    }
  },
  send: (msg) => persistAfter(mail.send(active(), msg)),
  invite: (ev) => persistAfter(mail.invite(active(), ev)),
  saveDraft: (msg) => persistAfter(mail.saveDraft(active(), msg)),
  deleteDraft: (uid) => persistAfter(mail.deleteDraft(active(), uid)),
  folders: () => persistAfter(mail.folders(active())),
  attachment: async (folder, uid, name, index, mode) => {
    const f = await mail.attachment(active(), folder, uid, name, index);
    const safe = String(f.name).replace(NOT_IN_FILE_NAMES, '_').slice(0, 180) || 'attachment';
    const dir = app.getPath('downloads'); // apps installed as snaps can't read temporary or hidden folders
    fs.mkdirSync(dir, { recursive: true });
    let target = path.join(dir, safe);
    const same = (p) => {
      try {
        return fs.statSync(p).size === f.content.length;
      } catch {
        return false;
      }
    };
    if (!(mode === 'open' && same(target))) {
      const ext = path.extname(safe),
        base = safe.slice(0, safe.length - ext.length);
      for (let i = 1; fs.existsSync(target) && !(mode === 'open' && same(target)); i++)
        target = path.join(dir, `${base} (${i})${ext}`);
    }
    if (!fs.existsSync(target)) fs.writeFileSync(target, f.content, { mode: 0o600 });
    if (mode === 'save') shell.showItemInFolder(target);
    else {
      const err = await shell.openPath(target);
      if (err) throw new Error(err);
    }
    return { path: target, name: path.basename(target) };
  },
  // ---- calendar ----
  calStatus: () => {
    const a = accounts[0];
    return { connected: !!a && (a.provider === 'google' || !!a.cal), canConnect: !!a && a.provider === 'microsoft' };
  },
  calConnect: async () => {
    const a = active();
    const tok = await oauth.signIn('microsoft-calendar', a.email, win);
    a.cal = {
      email: a.email,
      provider: 'microsoft-calendar',
      access: tok.access,
      refresh: tok.refresh,
      expires: tok.expires,
    };
    saveAccounts(accounts);
    return { connected: true };
  },
  calEvents: async (from, to) => calendarCall((a) => calendar.events(a, from, to)),
  calCreate: async (ev) => calendarCall((a) => calendar.create(a, ev)),
  calDetail: async (id) => calendarCall((a) => calendar.detail(a, id)),
  calUpdate: async (id, ev) => calendarCall((a) => calendar.update(a, id, ev)),
  calDelete: async (id) => calendarCall((a) => calendar.remove(a, id)),
  meeting: async (id) => calendarCall((a) => calendar.meeting(a, id)),
  // Answering an invitation: in your calendar when it's connected (so it's marked there too), else by mail.
  rsvp: async (inv, answer, fromName) => {
    const a = active();
    let calErr = null;
    if (a.provider === 'google' || a.cal) {
      try {
        if (await calendarCall((x) => calendar.respond(x, inv, answer))) return { via: 'calendar' };
      } catch (e) {
        calErr = e;
        logError('rsvp via calendar', e);
      }
    }
    // by mail to the organiser instead; if that isn't possible either, say why the calendar refused
    if (!inv?.organizer?.email) throw calErr || new Error('no organiser to answer');
    try {
      await persistAfter(mail.rsvp(a, inv, answer, fromName));
    } catch (e) {
      throw new Error(calErr ? `calendar: ${calErr.message}; mail: ${e.message}` : e.message);
    }
    return { via: 'mail' };
  },
  // ---- a file's bytes, for dude's own viewer (PDFs, pictures) ----
  attachmentData: async (folder, uid, name, index) => {
    const f = await mail.attachment(active(), folder, uid, name, index);
    if (f.content.length > 40 * 1048576) throw new Error('too big to preview');
    return { name: f.name, type: f.type, data: f.content.toString('base64') };
  },
  notify: (n) => notify(n),
  unread: (n) => setUnread(Math.max(0, +n || 0)),
};

// Staying signed in: a dropped connection is reopened and the call tried once more; a refused
// token is renewed and tried once more; if the mail service still says no, the window is told to
// ask you to sign in again (calls fail with SIGNIN_NEEDED until then).
const LOCAL = new Set([
  'pushStatus',
  'listCached',
  'accounts',
  'signIn',
  'signOut',
  'notify',
  'unread',
  'calStatus',
  'calConnect',
  'calEvents',
  'calCreate',
  'calDetail',
  'calUpdate',
  'calDelete',
  'meeting',
  'people',
]);

const NO_RESEND = new Set(['send', 'invite', 'saveDraft', 'rsvp']); // never risk sending twice after a dropped line

function askToSignIn(a, e) {
  win?.webContents.send('dude:auth', {
    email: a.email,
    provider: a.provider,
    reason: String(e?.message || e || '').slice(0, 200),
  });
}

// Errors are kept in dude.log in the app's data folder (newest last, about 200 KB at most).
function logError(where, e) {
  try {
    const f = path.join(app.getPath('userData'), 'dude.log');
    if (fs.existsSync(f) && fs.statSync(f).size > 200e3)
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').slice(-100e3), { mode: 0o600 });
    fs.appendFileSync(
      f,
      `${new Date().toISOString()} ${where}: ${String(e?.stack || e)
        .split('\n')
        .slice(0, 3)
        .join(' | ')}\n`,
      { mode: 0o600 },
    );
  } catch {}
}

async function run(name, args) {
  const h = handlers[name];
  try {
    return await h(...args);
  } catch (e) {
    if (!['calEvents', 'meeting', 'people', 'contacts'].includes(name)) logError(name, e);
    const a = accounts[0];
    if (LOCAL.has(name) || !a) throw e;
    const auth = isAuthError(e);
    if (!auth && !(isConnError(e) && !NO_RESEND.has(name))) throw e;
    mail.forget(a.email);
    if (auth) a.expires = 0; // renew the access token before trying again
    try {
      return await h(...args);
    } catch (e2) {
      if (isAuthError(e2)) {
        askToSignIn(a, e2);
        throw new Error(`SIGNIN_NEEDED ${e2.message || e2}`);
      }
      throw e2;
    }
  }
}

// Calendar calls: a refused calendar sign-in only disconnects the calendar (mail stays signed in).
async function calendarCall(fn) {
  const a = active();
  try {
    const r = await fn(a);
    if (a.cal) saveAccounts(accounts);
    return r;
  } catch (e) {
    if (String(e.message) === 'CAL_NOT_CONNECTED') throw e;
    if (isAuthError(e) && a.provider === 'microsoft') {
      a.cal = null;
      saveAccounts(accounts);
      throw new Error(`CAL_SIGNIN_NEEDED ${e.message}`);
    }
    throw e;
  }
}

// New mail is pushed by the server: tell the window to look now.
const mailChanged = () => win?.webContents.send('dude:mail');

function startPush() {
  const a = accounts[0];
  if (a) mail.watch(a, mailChanged);
}

app.whenReady().then(() =>
  powerMonitor.on('resume', () => {
    const a = accounts[0];
    if (a) {
      mail.forget(a.email);
      mail.rewatch(a, mailChanged);
      setTimeout(mailChanged, 3000);
    }
  }),
);

// Keep the usual folders fresh in the background (every 5 minutes), so opening them is instant.
let syncing = false;

async function syncFolders() {
  const a = accounts[0];
  if (!a || syncing) return;
  syncing = true;
  try {
    for (const v of ['inbox', 'done', 'sent', 'drafts', 'trash', 'spam']) {
      try {
        await persistAfter(mail.list(a, v));
      } catch {}
    }
  } finally {
    syncing = false;
  }
}

setTimeout(syncFolders, 20e3);
setInterval(syncFolders, 5 * 60e3);

ipcMain.handle('mail', async (e, name, ...args) => {
  if (e.sender !== win?.webContents) throw new Error('refused');
  if (!handlers[name]) throw new Error(`unknown call ${name}`);
  return run(name, args);
});

// Renew the access token before it runs out (every 5 minutes, when under 15 minutes are left),
// so mail keeps working while the app sits in the tray; the renewed refresh token is saved.
setInterval(async () => {
  const a = accounts[0];
  if (!a || a.expires - Date.now() > 15 * 60e3) return;
  const old = a.expires;
  try {
    a.expires = 0;
    await oauth.freshToken(a);
    saveAccounts(accounts);
  } catch (e) {
    a.expires = old;
    if (isAuthError(e)) askToSignIn(a, e);
  }
}, 5 * 60e3);

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 360,
    title: 'dude',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  const ui = path.join(__dirname, 'ui', 'index.html');
  win.loadFile(fs.existsSync(ui) ? ui : path.join(__dirname, '..', 'dist', 'index.html'));
  // Links open in the normal browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto):/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  // Closing hides to the tray (if there is one); Quit in the tray menu really quits.
  win.on('close', (e) => {
    if (!quitting && tray) {
      e.preventDefault();
      win.hide();
    }
  });
}

app.on('before-quit', () => {
  quitting = true;
});

app.whenReady().then(() => {
  accounts = loadAccounts();
  createWindow();
  try {
    createTray();
  } catch {
    tray = null;
  } // desktops without a tray still work, closing then quits
});

app.on('window-all-closed', () => app.quit());
