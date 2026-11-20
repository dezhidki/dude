// ---------- events ----------

import { DemoBackend } from '../demo.js';
import { act, closeSearch, openSearch, pick, runSearch, switchSplit, toggle, undo } from './actions.js';
import {
  answerEvent,
  answerInvite,
  calToday,
  closeEvent,
  connectCalendar,
  dayMove,
  deleteEvent,
  eventDialog,
  goCal,
  goMail,
  openEvent,
  saveEvent,
  weekMove,
} from './calendar.js';
import {
  attachFiles,
  COMMANDS,
  expandAll,
  goto,
  isGmail,
  openFolderPick,
  openPalette,
  paletteItems,
  selectAll,
  snippetPick,
} from './commands.js';
import {
  focusComposer,
  leaveCompose,
  meAddr,
  openWhen,
  resumeDraft,
  scheduleDraftSave,
  sendComposer,
  startCompose,
} from './compose.js';
import { B, dayStart, errText, esc, LS, openFile, root, S, setBackend, setTheme, show, toast } from './core.js';
import { current, load, removeSplit, visible } from './data.js';
import { closeSugg, drawSugg, suggest, takeSugg } from './people.js';
import { closeMenu, fitEditor, menuItems, openMenu, refreshCal, render, renderLayer, renderSignin } from './render.jsx';
import { openSettings, setSetting } from './settings.jsx';
import { schedulePoll, showNewMessages } from './start.js';
import { closeThread, moveFocus, openThread, step, toggleMsg } from './thread.js';

async function signIn(provider) {
  const email = (S.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    toast('type email first.');
    root.querySelector('[data-a="email"]')?.focus();
    return;
  }
  toast('login window…');
  try {
    S.account = await B.signIn(provider, email);
    S.screen = 'list';
    load('inbox');
  } catch (e) {
    toast(`login fail: ${esc(e.message || e)}`, 7000);
  }
}

export const ACTIONS = {
  start: () => {
    S.more = true;
    renderSignin();
    root.querySelector('[data-a="email"]')?.focus();
  },
  'signin-ms': () => signIn('microsoft'),
  'signin-g': () => signIn('google'),
  demo: async () => {
    const D = DemoBackend;
    setBackend(D);
    S.account = (await D.accounts())[0];
    S.screen = 'list';
    load('inbox');
  },
  'go-inbox': () => {
    if (S.pane === 'calendar' && window.innerWidth <= 768) {
      S.pane = 'contact';
      LS.set('pane', S.pane);
    }
    goto('inbox', S.split)();
  },
  cal: () => COMMANDS.find((c) => c.k[0] === '0').run(),
  menu: () => (S.menu ? closeMenu() : openMenu()),
  'close-menu': () => closeMenu(),
  'close-settings': () => {
    S.screen = 'list';
    render();
  },
  'new-split': () => {
    S.screen = 'list';
    S.overlay = { kind: 'cmd', mode: 'split', q: '', i: 0 };
    render();
    renderLayer(true);
  },
  signout: () => COMMANDS.find((c) => c.t === 'Sign Out').run(),
  relogin: async () => {
    const a = S.authNeeded;
    if (!a) return;
    toast('login window…');
    try {
      S.account = await B.signIn(a.provider, a.email);
      S.authNeeded = null;
      toast('login ok.');
      load(S.view === 'search' ? 'inbox' : S.view, true);
    } catch (e) {
      toast(`login fail: ${esc(errText(e))}`, 7000);
    }
  },
  cmd: () => openPalette(),
  search: () => openSearch(),
  compose: () => startCompose('new'),
  'row-done': () => act('done'),
  'row-remind': () => openWhen('remind'),
  done: () => act('done'),
  remind: () => openWhen('remind'),
  later: () => openWhen('later'),
  showcc: () => {
    S.composer.showCc = true;
    render();
    focusComposer('cc');
  },
  showbcc: () => {
    S.composer.showBcc = true;
    render();
    focusComposer('bcc');
  },
  attach: () => attachFiles(),
  'cal-connect': () => connectCalendar(),
  'file-close': () => {
    S.overlay = null;
    renderLayer();
  },
  'file-save': () => {
    const o = S.overlay;
    if (o && o.kind === 'file') openFile(o.folder, o.uid, o.name, o.index, 'save');
  },
  'leave-compose': () => leaveCompose(),
  'show-new': () => showNewMessages(),
  'close-search': () => closeSearch(),
  'cancel-event': () => closeEvent(),
  back: () => closeThread(),
  prev: () => step(-1),
  next: () => step(1),
  reply: () => startCompose('reply'),
  replyall: () => startCompose('replyall'),
  forward: () => startCompose('forward'),
  event: () => eventDialog(),
  send: () => sendComposer(),
  discard: () => {
    if (S.screen === 'compose') leaveCompose(true);
    else {
      S.composer = null;
      render();
    }
  },
  'day-prev': () => dayMove(-1),
  'day-next': () => dayMove(1),
  'day-today': () => {
    S.calDay = dayStart(Date.now());
    S.calScroll = undefined;
    render();
  },
  'go-cal': () => goCal(),
  'go-mail': () => goMail(),
  'cal-today': () => calToday(),
  'wk-prev': () => weekMove(-1),
  'wk-next': () => weekMove(1),
  'mm-prev': () => {
    const d = new Date(S.mmMonth ?? S.calDay);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    S.mmMonth = d.getTime();
    render();
  },
  'mm-next': () => {
    const d = new Date(S.mmMonth ?? S.calDay);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    S.mmMonth = d.getTime();
    render();
  },
  'delete-event': () => deleteEvent(),
  keys: () => {
    S.overlay = { kind: 'keys' };
    renderLayer();
  },
  'save-event': () => saveEvent(),
};

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-a]');
  if (a && a.dataset.a === 'close' && e.target === a) {
    S.overlay = null;
    renderLayer();
    return;
  } // not a click inside the dialog
  const ci = e.target.closest('[data-ci]');
  if (ci) {
    const c = paletteItems(S.overlay.q)[+ci.dataset.ci];
    S.overlay = null;
    renderLayer();
    c?.run();
    return;
  }
  if (a && ACTIONS[a.dataset.a] && a.tagName !== 'INPUT') {
    const row = a.closest('[data-i]');
    if (row) S.sel = +row.dataset.i;
    e.stopPropagation();
    ACTIONS[a.dataset.a]();
    return;
  }
  const mi = e.target.closest('[data-menu]');
  if (mi) {
    const it = menuItems()[+mi.dataset.menu];
    closeMenu();
    it.run();
    if (S.screen === 'list') render();
    return;
  }
  const pl = e.target.closest('[data-poll]');
  if (pl) {
    setSetting('pollSeconds', +pl.dataset.poll);
    schedulePoll();
    render();
    return;
  }
  const nt = e.target.closest('[data-notify]');
  if (nt) {
    setSetting('notify', nt.dataset.notify);
    render();
    return;
  }
  const un = e.target.closest('[data-undo]');
  if (un) {
    setSetting('undoSeconds', +un.dataset.undo);
    render();
    return;
  }
  const th = e.target.closest('[data-theme]');
  if (th) {
    setTheme(th.dataset.theme === 'carbon');
    return;
  }
  const rs = e.target.closest('[data-rmsplit]');
  if (rs) {
    removeSplit(rs.dataset.rmsplit);
    S.screen = 'settings';
    render();
    return;
  }
  const sp = e.target.closest('[data-split]');
  if (sp) {
    S.split = sp.dataset.split;
    S.sel = 0;
    render();
    return;
  }
  const rc = e.target.closest('[data-recent]');
  if (rc) {
    runSearch(rc.dataset.recent);
    return;
  }
  const rf = e.target.closest('[data-rmfile]');
  if (rf && S.composer) {
    S.composer.files.splice(+rf.dataset.rmfile, 1);
    render();
    scheduleDraftSave();
    return;
  }
  const evb = e.target.closest('[data-ev]');
  if (evb) {
    openEvent(evb.dataset.ev);
    return;
  }
  const er = e.target.closest('[data-evrsvp]');
  if (er) {
    answerEvent(er.dataset.evrsvp);
    return;
  }
  const jd = e.target.closest('[data-jump]');
  if (jd) {
    S.calDay = +jd.dataset.jump;
    S.calScroll = undefined;
    render();
    return;
  }
  const rv = e.target.closest('[data-rsvp]');
  if (rv) {
    const [i, x] = rv.dataset.rsvp.split(':');
    answerInvite(+i, x);
    return;
  }
  const iv = e.target.closest('[data-invday]');
  if (iv) {
    const v = S.msgs[+iv.dataset.invday] && S.msgs[+iv.dataset.invday].invite;
    if (v) {
      S.calDay = dayStart(v.start);
      S.calScroll = Math.max(0, (new Date(v.start).getHours() - 1) * 44);
      render();
    }
    return;
  }
  const as = e.target.closest('[data-attsave]');
  if (as) {
    const [i, j] = as.dataset.attsave.split(':').map(Number),
      m = S.msgs[i],
      a = m.attachments[j];
    openFile(m.folder, m.uid, a.filename, j, 'save');
    return;
  }
  const ao = e.target.closest('[data-att]');
  if (ao) {
    const [i, j] = ao.dataset.att.split(':').map(Number),
      m = S.msgs[i],
      a = m.attachments[j];
    openFile(m.folder, m.uid, a.filename, j, 'open');
    return;
  }
  const rc2 = e.target.closest('[data-ratt]');
  if (rc2) {
    const [i, k] = rc2.dataset.ratt.split(':').map(Number),
      t = visible()[i],
      a = t?.atts[k];
    if (a) openFile(t.folder, a.uid, a.name, 0, 'open');
    return;
  }
  const tip = e.target.closest('[data-tip]');
  if (tip) {
    const i = root.querySelector('.sq');
    if (i) {
      i.value = (i.value ? `${i.value} ` : '') + tip.dataset.tip;
      S.search.q = i.value;
      i.focus();
    }
    return;
  }
  const op = e.target.closest('[data-open]');
  if (op) {
    const t = S.threads.find((x) => x.id === op.dataset.open);
    if (t) openThread(t);
    return;
  }
  const q = e.target.closest('[data-q]');
  if (q) {
    const i = +q.dataset.q;
    S.quotes.has(i) ? S.quotes.delete(i) : S.quotes.add(i);
    render();
    return;
  }
  const m = e.target.closest('.msg');
  if (m) {
    const i = +m.dataset.m;
    if (S.msgs[i]?.draft) return resumeDraft(i);
    if (!S.expanded.has(i)) toggleMsg(i);
    else if (S.focus !== i) {
      S.focus = i;
      render();
    }
    return;
  }
  const row = e.target.closest('.row');
  if (row) {
    S.sel = +row.dataset.i;
    openThread(current());
  }
});

document.addEventListener('dblclick', (e) => {
  const m = e.target.closest('.msg.open .msg-h');
  if (m) toggleMsg(+m.parentElement.dataset.m);
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.closest?.('.editor')) fitEditor(el);
  if (el.dataset.set) {
    if (el.dataset.set === 'name') {
      if (S.account) S.account.name = el.value.trim();
      LS.set(`myname:${meAddr()}`, el.value.trim());
    } else setSetting(el.dataset.set, el.value);
    show(); // the signature's colouring and preview follow
  }
  if (el.dataset.c && S.composer) {
    scheduleDraftSave();
    S.composer[el.dataset.c] = el.value;
    show(); // the subject heading and the colouring follow
  } else if (el.dataset.e && S.eventForm) {
    S.eventForm[el.dataset.e] = el.value;
    S.eventForm.dirty = true;
    if (el.dataset.e === 'guests') S.eventForm.guestsTouched = true;
    if (el.dataset.e === 'when' || el.dataset.e === 'title') refreshCal();
  } else if (el.dataset.a === 'cq') {
    S.overlay.q = el.value;
    S.overlay.i = 0;
    renderLayer();
  } else if (el.dataset.a === 'sq') S.search.q = el.value;
  else if (el.dataset.a === 'email') S.email = el.value;
  // only now: the list redraws, and a redraw puts the kept value back in the field
  if (/^(to|cc|bcc)$/.test(el.dataset.c || '') || el.dataset.e === 'guests') suggest(el);
});

const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

document.addEventListener('keydown', async (e) => {
  const mod = e.metaKey || e.ctrlKey,
    k = e.key,
    o = S.overlay,
    tgt = e.target;
  if (S.sugg && tgt === S.sugg.el) {
    const sg = S.sugg;
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      sg.i = (sg.i + (k === 'ArrowDown' ? 1 : -1) + sg.items.length) % sg.items.length;
      drawSugg();
      return;
    }
    if ((k === 'Enter' && !mod) || (k === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      takeSugg();
      return;
    }
    if (k === 'Escape') {
      e.preventDefault();
      closeSugg();
      return;
    }
  }
  if (S.screen === 'signin') {
    if (k === 'Enter' && tgt.dataset?.a === 'email') {
      e.preventDefault();
      signIn(S.email && /gmail|googlemail/i.test(S.email) ? 'google' : 'microsoft');
    }
    return;
  }
  if (mod && k === ',') {
    e.preventDefault();
    openSettings();
    return;
  }
  if (S.menu && !o) {
    const items = menuItems();
    const moveMenu = (d) => {
      S.menu.sel = (S.menu.sel + d + items.length) % items.length;
      show();
      root.querySelector('.sm-item.on')?.scrollIntoView({ block: 'nearest' });
    };
    if (k === 'ArrowDown' || k === 'j') moveMenu(1);
    else if (k === 'ArrowUp' || k === 'k') moveMenu(-1);
    else if (k === 'Enter') {
      const it = items[S.menu.sel];
      closeMenu();
      it.run();
      if (S.screen === 'list') render();
    } else if (k === 'Escape' || k === 'ArrowRight' || k === 'ArrowLeft') closeMenu();
    else return;
    e.preventDefault();
    return;
  }
  if (S.screen === 'settings' && !o) {
    if (k === 'Escape') {
      e.preventDefault();
      if (typing(tgt)) tgt.blur();
      else {
        S.screen = 'list';
        render();
      }
    }
    return;
  }
  if (mod && k.toLowerCase() === 'k') {
    e.preventDefault();
    if (o && o.kind === 'cmd') {
      S.overlay = null;
      renderLayer();
    } else openPalette();
    return;
  }
  if (o) {
    if (k === 'Escape') {
      e.preventDefault();
      S.overlay = null;
      renderLayer();
      return;
    }
    if (o.kind === 'file') {
      if (k === 's' || k === 'S') {
        e.preventDefault();
        ACTIONS['file-save']();
      }
      return;
    }
    if (o.kind === 'cmd') {
      if (k === 'Backspace' && !o.q && o.mode === 'split') {
        S.overlay = { kind: 'cmd', q: '', i: 0 };
        renderLayer(true);
        e.preventDefault();
        return;
      }
      const items = paletteItems(o.q);
      if (k === 'ArrowDown' || (k === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        o.i = (o.i + 1) % Math.max(1, items.length);
        renderLayer();
      } else if (k === 'ArrowUp' || (k === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        o.i = (o.i - 1 + items.length) % Math.max(1, items.length);
        renderLayer();
      } else if (k === 'Enter') {
        e.preventDefault();
        const c = items[o.i];
        S.overlay = null;
        renderLayer();
        c?.run();
      }
      return;
    }
    return;
  }
  if (S.eventForm) {
    if (mod && k === 'Enter') {
      e.preventDefault();
      if (!S.eventForm.readOnly) saveEvent();
    } else if (k === 'Escape') {
      e.preventDefault();
      closeEvent();
    } else if (S.eventForm.readOnly && !typing(tgt) && ['y', 'm', 'n'].includes(k)) {
      e.preventDefault();
      answerEvent({ y: 'yes', m: 'maybe', n: 'no' }[k]);
    }
    return;
  }
  if (S.composer && (typing(tgt) || S.screen === 'compose')) {
    const kl = k.toLowerCase();
    if (mod && k === 'Enter') {
      e.preventDefault();
      sendComposer();
    } else if (mod && e.shiftKey && kl === 'c') {
      e.preventDefault();
      S.composer.showCc = true;
      render();
      focusComposer('cc');
    } else if (mod && e.shiftKey && kl === 'b') {
      e.preventDefault();
      S.composer.showBcc = true;
      render();
      focusComposer('bcc');
    } else if (mod && e.shiftKey && kl === 'a') {
      e.preventDefault();
      attachFiles();
    } else if (mod && e.shiftKey && kl === 'l') {
      e.preventDefault();
      openWhen('later');
    } else if (mod && e.shiftKey && (k === ',' || k === '<')) {
      e.preventDefault();
      ACTIONS.discard();
    } else if (k === 'Escape') {
      e.preventDefault();
      if (S.screen === 'compose') leaveCompose();
      else if (!S.composer.text.trim()) {
        S.composer = null;
        render();
      } else tgt.blur?.();
    }
    return;
  }
  if (S.screen === 'search') {
    if (k === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (k === 'Enter') {
      e.preventDefault();
      runSearch(root.querySelector('.sq')?.value || '');
    }
    return;
  }
  if (typing(tgt)) return;
  if (mod && k.toLowerCase() === 'a' && S.screen === 'list') {
    e.preventDefault();
    selectAll(e.shiftKey);
    return;
  }
  if (e.altKey || (mod && k !== 'Enter')) return;

  if (S.g) {
    S.g = false;
    const map = {
      i: ['inbox', 'important'],
      o: ['inbox', 'other'],
      s: ['starred'],
      d: ['drafts'],
      t: ['sent'],
      e: ['done'],
      h: ['reminders'],
      '!': ['spam'],
      '#': ['trash'],
      a: ['all'],
    };
    const m = map[k.toLowerCase()] || map[k];
    if (m) {
      e.preventDefault();
      goto(m[0], m[1])();
    }
    return;
  }
  if (S.screen === 'calendar') {
    const fn = {
      '-': () => weekMove(-1),
      '=': () => weekMove(1),
      ArrowLeft: () => weekMove(-1),
      ArrowRight: () => weekMove(1),
      t: calToday,
      T: calToday,
      b: () => eventDialog(),
      B: () => eventDialog(),
      Escape: goMail,
      1: goMail,
      c: () => startCompose('new'),
      '?': () => ACTIONS.keys(),
    }[k];
    if (fn) {
      e.preventDefault();
      fn();
    }
    return;
  }
  const thread = S.screen === 'thread';
  const handled = (() => {
    switch (k) {
      case 'ArrowLeft':
        if (!thread) openMenu();
        return true; // Superhuman: ← opens the folder menu
      case 'j':
        step(1);
        return true;
      case 'k':
        step(-1);
        return true;
      case 'ArrowDown':
      case 'n':
        thread ? moveFocus(1) : step(1);
        return true;
      case 'ArrowUp':
      case 'p':
        thread ? moveFocus(-1) : step(-1);
        return true;
      case 'Enter':
        if (!thread) openThread(current());
        else if (S.msgs[S.focus] && S.msgs[S.focus].draft) resumeDraft(S.focus);
        else if (S.msgs.length && !S.expanded.has(S.focus)) toggleMsg();
        else startCompose('replyall');
        return true;
      case 'Escape':
        if (thread) closeThread();
        else if (S.picked.size) {
          S.picked.clear();
          render();
        } else if (S.view === 'search') closeSearch();
        return true;
      case 'e':
        act('done');
        return true;
      case 'E':
        act('undone');
        return true;
      case 'h':
        openWhen('remind');
        return true;
      case 's':
        toggle('star');
        return true;
      case 'u':
        toggle('read');
        return true;
      case '#':
        act('trash');
        return true;
      case '!':
        act('spam');
        return true;
      case 'x':
        if (!thread) pick();
        return true;
      case 'z':
        undo();
        return true;
      case 'r':
        if (thread) startCompose('reply');
        return true;
      case 'f':
        if (thread) startCompose('forward');
        return true;
      case 'c':
        startCompose('new');
        return true;
      case '/':
        openSearch();
        return true;
      case 'g':
        S.g = true;
        setTimeout(() => (S.g = false), 1500);
        return true;
      case 'Tab':
        switchSplit(e.shiftKey ? -1 : 1);
        return true;
      case '0':
        ACTIONS.cal();
        return true;
      case '2':
        goCal();
        return true;
      case 'b':
      case 'B':
        eventDialog();
        return true;
      case '-':
        dayMove(-1);
        return true;
      case '=':
        dayMove(1);
        return true;
      case '?':
        ACTIONS.keys();
        return true;
      case 'o':
        if (thread) toggleMsg();
        return true;
      case 'O':
        if (thread) expandAll();
        return true;
      case 'v':
        openFolderPick('move');
        return true;
      case 'l':
        openFolderPick(isGmail() ? 'copy' : 'move');
        return true;
      case ';':
        snippetPick();
        return true;
      case 'N':
        if (thread) showNewMessages();
        return true;
    }
    return false;
  })();
  if (handled) e.preventDefault();
});
