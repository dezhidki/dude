// UI smoke test: the screens in a real (hidden) window, built with Solid's development checks, driven
// through a short demo session. It fails on a screen that doesn't show up, an uncaught error, or any
// console warning or error (Solid reports ignored store writes and other slips as warnings).
// Run: npm run smoke (CI runs it under xvfb on Linux).
import fs from 'node:fs';
import path from 'node:path';
import { app, BrowserWindow } from 'electron';

const dist = path.resolve(process.argv.at(-1) ?? 'dist-dev');

// [what, js run in the page, a selector that must then be there, ms to wait first]
const STEPS: [string, string, string?, number?][] = [
  ['sign-in screen', '0', '[data-a="start"]'],
  ['go', `__click('[data-a="start"]')`, '[data-a="demo"]'],
  ['demo mailbox', `__click('[data-a="demo"]')`, '.row', 700],
  ['next', `__key('j')`, '.row.sel'],
  ['open', `__key('Enter')`, '.msg', 500],
  ['reply', `__key('r')`, '[data-c="text"]', 300],
  ['write', `__type('[data-c="text"]', 'Thursday works.')`],
  ['send', `__key('Enter', { ctrlKey: true })`, undefined, 3800],
  ['back to list', `__key('Escape')`, '.row', 300],
  ['palette', `__key('k', { ctrlKey: true })`, '.cmd input'],
  ['palette search', `__type('.cmd input', 'star')`, '.cmd li'],
  ['palette close', `__key('Escape')`],
  ['search', `__key('/')`, '.sq', 300],
  ['search words', `__type('.sq', 'from:maya')`],
  ['search run', `__key('Enter')`, '.row', 500],
  ['search close', `__key('Escape')`, undefined, 400],
  ['compose', `__key('c')`, '[data-c="to"]', 300],
  ['compose leave', `document.activeElement.blur(); __key('Escape')`, undefined, 300],
  ['day beside mail', `__key('0')`, '.cal-pane', 400],
  ['week', `__key('2')`, '.wk', 400],
  ['new event', `__key('b')`, '[data-e="title"]', 300],
  ['event close', `__key('Escape')`],
  ['mail again', `__key('1')`, '.row', 300],
  ['board', `__key('3')`, '.tb-col.today', 400],
  ['board todos', '0', '.tb-card'],
  ['board events', '0', '.tb-ev'],
  ['board leaves', `__key('1')`, '.row', 300],
  ['board again', `__key('3')`, '.tb-card.sel', 400],
  ['board filter', `__click('.tb-filter')`, '.tb-filter.on'],
  ['board filter off', `__click('.tb-filter.on')`, '.tb-card.sel'],
  // the selected card is the thesis one: under the poster filter it is hidden, and E must not touch it
  [
    'filter hides sel',
    `window.__n = localStorage.getItem('dude:todos'); __click('.tb-filter:nth-child(2)')`,
    '.tb-filter.on',
  ],
  [
    'filter sel visible',
    `if (document.querySelector('.tb-card.sel') && !document.querySelector('.tb-col .tb-card.sel[data-todo-id]')) throw new Error('hidden sel'); __key('e')`,
    undefined,
    200,
  ],
  [
    'filter e untouched',
    `if (localStorage.getItem('dude:todos') !== window.__n) throw new Error('E acted on a hidden card')`,
  ],
  ['filter quick add', `__click('.tb-col.focus .tb-add')`, '[data-todo="quick"]'],
  ['filter quick type', `__type('[data-todo="quick"]', 'Filtered one')`],
  ['filter quick enter', `__key('Enter')`, '.tb-card.fresh'],
  ['filter quick close', `__key('Escape'); __click('.tb-filter.on')`, '.tb-filter:not(.on)'],
  ['filter back', `__key('3')`, '.tb-card'],
  ['todo done', `__key('e')`, '.tb-card.done.sel'],
  ['todo undo', `__key('z')`, undefined, 300],
  ['todo move', `__key('ArrowRight', { shiftKey: true })`, '.tb-col.focus:not(.today) .tb-card.sel'],
  ['quick add', `__click('.tb-col.focus .tb-add')`, '[data-todo="quick"]'],
  ['quick type', `__type('[data-todo="quick"]', 'Buy paper')`],
  ['quick enter', `__key('Enter')`, '.tb-card.fresh'],
  ['quick close', `__key('Escape')`],
  ['new todo', `__key('d')`, '[data-todo="title"]', 300],
  ['todo title', `__type('[data-todo="title"]', 'Print poster')`],
  // someday, not a weekday: on Fridays and Saturdays "fri" is next week, off the board
  ['todo when', `__type('[data-todo="when"]', 'someday')`, '.tb-col.someday .tb-card.draft'],
  ['todo label', `__type('[data-todo="labelq"]', 'Poster')`],
  ['todo label add', `__key('Enter')`, '.tb-chip'],
  ['todo task', `__type('[data-todo="taskq"]', 'check margins')`],
  ['todo task add', `__key('Enter')`, '.tb-task'],
  // the new card, not the quick add's: someday's fresh card with its task
  ['todo save', `__key('Enter', { ctrlKey: true })`, '.tb-col.someday .tb-card.fresh .pg', 300],
  ['todo open', `__key('Enter')`, '[data-todo="title"]', 300],
  ['todo close', `document.activeElement.blur(); __key('Escape')`],
  ['mail for todo', `__key('1')`, '.row', 300],
  ['open mail', `__key('Enter')`, '.msg', 500],
  ['todo from mail', `__key('d')`, '.tb-mail', 300],
  ['todo from mail save', `__key('Enter', { ctrlKey: true })`, '.todo-of', 300],
  ['attach on board', `__key('3')`, '.tb-card.sel', 400],
  ['attach open', `__key('Enter')`, '[data-todo="title"]', 300],
  ['attach picker', `document.activeElement.blur(); __key('M', { ctrlKey: true, shiftKey: true })`, '.cmd input'],
  ['attach pick', `__key('Enter')`, undefined, 300],
  ['attach close', `__key('Escape')`],
  // a todo on a mail that has since gone (done, trashed, deleted elsewhere): opening it must not throw.
  // 1 goes back to the mail the board was opened from (the one above), so .msg, not .row
  [
    'stale todo',
    `const l = JSON.parse(localStorage.getItem('dude:todos')); l.push({ id: 'stale', title: 'stale', day: null, mails: [{ id: 'nope', folder: 'inbox', subject: 'gone', from: { name: 'Gone', address: 'g@x.example' }, to: [], date: 0, unread: false, starred: false, list: false, count: 1, snippet: '', size: 0 }] }); localStorage.setItem('dude:todos', JSON.stringify(l)); __key('1')`,
    '.msg',
    300,
  ],
  ['stale board', `__key('3')`, '[data-todo-id="stale"]', 400],
  ['stale open', `__click('[data-todo-id="stale"] .ml')`, undefined, 500],
  ['stale back', `__key('Escape')`, '.tb', 300],
  ['settings', `__key(',', { ctrlKey: true })`, '.thread', 300],
  ['settings close', `__key('Escape')`, '.row', 300],
  ['keys', `__key('?')`, '.keys'],
  ['keys close', `__key('Escape')`],
  ['keys board', `__key('?')`, '.keys h5'],
  [
    'keys has board',
    `if (![...document.querySelectorAll('.keys h5')].some((h) => h.textContent === 'Board')) throw new Error('no Board keys')`,
  ],
  ['keys board close', `__key('Escape')`],
  // a todo's mail is read as a conversation whatever the list shows: on Drafts too, not opened as a draft
  ['drafts list', `__key('g'); __key('d')`, undefined, 500],
  ['drafts board', `__key('3')`, '.tb-card', 400],
  ['todo mail from drafts', `__click('.tb-card:not([data-todo-id="stale"]) .ml')`, '.msg', 600],
  ['todo mail back', `__key('Escape')`, '.tb', 300],
];

const HELPERS = `
window.__key = (key, o = {}) =>
  (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...o }));
window.__type = (sel, value) => {
  const el = document.querySelector(sel);
  if (!el) throw new Error('no ' + sel);
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
window.__click = (sel) => {
  const el = document.querySelector(sel);
  if (!el) throw new Error('no ' + sel);
  el.click();
};`;

const problems: string[] = [];

// Without Solid's development build nothing would warn and this test would pass whatever happens.
const bundle = fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.js'));
if (!bundle.some((f) => fs.readFileSync(path.join(dist, 'assets', f), 'utf8').includes('STORE_WRITE_OUTSIDE_SETTER'))) {
  console.error(`smoke: ${dist} is not a development build (node build.mjs <dir> --dev)`);
  process.exit(1);
}
let step = 'load';
setTimeout(() => {
  console.error(`smoke: stuck at "${step}"`);
  app.exit(1);
}, 120e3);

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'; // about running unpackaged, not about the app

// not awaited at the top: Electron holds back "ready" until the main script's top-level awaits are done
async function run() {
  // a partition without "persist:" lives in memory: nothing is kept from the last run
  const w = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    webPreferences: { offscreen: true, partition: `smoke-${Date.now()}` },
  });
  w.webContents.on('console-message', (e) => {
    if (e.level === 'warning' || e.level === 'error') {
      problems.push(`${step}: console ${e.level}: ${e.message.slice(0, 400)}`);
    }
  });
  w.webContents.on('render-process-gone', (_, d) => problems.push(`${step}: page gone (${d.reason})`));
  await w.loadFile(path.join(dist, 'index.html'));
  await w.webContents.executeJavaScript(`${HELPERS}; 0`); // 0: a value that can come back
  for (const [name, js, expect, wait = 250] of STEPS) {
    step = name;
    try {
      await w.webContents.executeJavaScript(`(() => { ${js}; })()`);
    } catch (e) {
      problems.push(`${name}: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, wait));
    if (expect && !(await w.webContents.executeJavaScript(`!!document.querySelector(${JSON.stringify(expect)})`))) {
      problems.push(`${name}: no ${expect} on screen`);
    }
  }
  console.log(
    problems.length
      ? `smoke: ${problems.length} problem(s)\n${problems.join('\n')}`
      : `smoke ok (${STEPS.length} steps)`,
  );
  app.exit(problems.length ? 1 : 0);
}

app
  .whenReady()
  .then(run)
  .catch((e) => {
    console.error('smoke:', e);
    app.exit(1);
  });
