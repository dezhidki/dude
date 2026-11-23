// ---------- events ----------

import { onSettled } from 'solid-js';
import type { Answer, Provider } from '../api.ts';
import { DemoBackend } from '../demo.ts';
import { act, closeSearch, openSearch, pick, runSearch, switchSplit, toggle, undo } from './actions.ts';
import {
  answerEvent,
  calToday,
  closeEvent,
  connectCalendar,
  dayMove,
  deleteEvent,
  eventDialog,
  goCal,
  goMail,
  saveEvent,
  weekMove,
} from './calendar.ts';
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
} from './commands.ts';
import {
  focusComposer,
  leaveCompose,
  meAddr,
  openWhen,
  resumeDraft,
  scheduleDraftSave,
  sendComposer,
  startCompose,
} from './compose.ts';
import { B, change, dayStart, errText, LS, M, openFile, root, S, setBackend, toast } from './core.ts';
import { current, load } from './data.ts';
import { closeSugg, suggest, takeSugg } from './people.ts';
import {
  closeLayer,
  closeMenu,
  menuItems,
  openCmd,
  openMenu,
  refreshCal,
  render,
  renderLayer,
  renderSignin,
  runCmd,
  runMenu,
} from './render.tsx';
import { openSettings, type Prefs, setSetting } from './settings.tsx';
import { showNewMessages } from './start.ts';
import { closeThread, moveFocus, openThread, step, toggleMsg } from './thread.ts';
import { goBoard, leaveBoard } from './todo.ts';

async function signIn(provider: Exclude<Provider, 'demo'>) {
  const email = (S.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    toast('type email first.');
    root.querySelector<HTMLInputElement>('[data-a="email"]')?.focus();
    return;
  }
  toast('login window…');
  try {
    const acc = await B.signIn(provider, email);
    change(() => {
      S.account = acc;
      S.screen = 'list';
      void load('inbox');
    });
  } catch (e) {
    toast(`login fail: ${(e as Error).message || e}`, 7000);
  }
}

// the month beside the week: one back or on
function monthMove(n: number) {
  const d = new Date(S.mmMonth ?? S.calDay);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  S.mmMonth = d.getTime();
  render();
}

// A button's action (onClick={press('send')}): the click is that button's alone; a button in a
// row of the list acts on that row.
export const press = (name: keyof typeof ACTIONS, row?: () => number) => (e: Event) => {
  e.stopPropagation();
  change(() => {
    if (row) {
      S.sel = row(); // the row's place now (rows move when others leave)
    }
    ACTIONS[name]();
  });
};

export const ACTIONS = {
  start: () => {
    S.more = true;
    renderSignin();
    onSettled(() => {
      root.querySelector<HTMLInputElement>('[data-a="email"]')?.focus();
    });
  },
  'signin-ms': () => signIn('microsoft'),
  'signin-g': () => signIn('google'),
  demo: async () => {
    const D = DemoBackend;
    setBackend(D);
    const acc = (await D.accounts())[0];
    change(() => {
      S.account = acc;
      S.screen = 'list';
      void load('inbox');
    });
  },
  'go-inbox': () => {
    if (S.pane === 'calendar' && window.innerWidth <= 768) {
      S.pane = 'contact';
      LS.set('pane', S.pane);
    }
    goto('inbox', S.split)();
  },
  cal: (): unknown => COMMANDS.find((c) => c.k?.[0] === '0')?.run(),
  menu: () => (S.menu ? closeMenu() : openMenu()),
  'close-menu': () => closeMenu(),
  'close-settings': () => {
    S.screen = 'list';
    render();
  },
  'new-split': () => {
    S.screen = 'list';
    render();
    openCmd('split');
  },
  signout: (): unknown => COMMANDS.find((c) => c.t === 'Sign Out')?.run(),
  relogin: async () => {
    const a = S.authNeeded;
    if (!a) {
      return;
    }
    toast('login window…');
    try {
      const acc = await B.signIn(a.provider as 'microsoft' | 'google', a.email); // only a real mailbox asks again
      change(() => {
        S.account = acc;
        S.authNeeded = null;
        toast('login ok.');
        void load(S.view === 'search' ? 'inbox' : S.view, true);
      });
    } catch (e) {
      toast(`login fail: ${errText(e)}`, 7000);
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
    if (!S.composer) {
      return;
    }
    S.composer.showCc = true;
    render();
    focusComposer('cc');
  },
  showbcc: () => {
    if (!S.composer) {
      return;
    }
    S.composer.showBcc = true;
    render();
    focusComposer('bcc');
  },
  attach: () => attachFiles(),
  'cal-connect': () => connectCalendar(),
  'file-close': () => closeLayer(),
  'file-save': () => {
    const o = S.overlay;
    if (o && o.kind === 'file') {
      void openFile(o.folder, o.uid, o.name, o.index, 'save');
    }
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
    if (S.screen === 'compose') {
      leaveCompose(true);
    } else {
      S.composer = null;
      render();
    }
  },
  'day-prev': () => dayMove(-1),
  'day-next': () => dayMove(1),
  'day-today': () => {
    S.calDay = dayStart(Date.now());
    M.calScroll = undefined;
    render();
  },
  'go-cal': () => goCal(),
  'go-mail': () => goMail(),
  'go-board': () => goBoard(),
  'cal-today': () => calToday(),
  'wk-prev': () => weekMove(-1),
  'wk-next': () => weekMove(1),
  'mm-prev': () => monthMove(-1),
  'mm-next': () => monthMove(1),
  'delete-event': () => deleteEvent(),
  keys: () => {
    S.overlay = { kind: 'keys' };
    renderLayer();
  },
  'save-event': () => saveEvent(),
} satisfies Record<string, () => unknown>;

function onInput(e: Event) {
  const el = e.target as HTMLInputElement;
  if (el.dataset.set) {
    if (el.dataset.set === 'name') {
      if (S.account) {
        S.account.name = el.value.trim();
      }
      LS.set(`myname:${meAddr()}`, el.value.trim());
    } else {
      setSetting(el.dataset.set as keyof Prefs, el.value as never); // ponytail: a typed field's text, as before
    }
  }
  if (el.dataset.c && S.composer) {
    scheduleDraftSave();
    S.composer[el.dataset.c as 'to' | 'cc' | 'bcc' | 'subject' | 'text'] = el.value;
  } else if (el.dataset.e && S.eventForm) {
    S.eventForm[el.dataset.e as 'title' | 'when' | 'where' | 'notes' | 'guests'] = el.value;
    S.eventForm.dirty = true;
    if (el.dataset.e === 'guests') {
      S.eventForm.guestsTouched = true;
    }
    if (el.dataset.e === 'when' || el.dataset.e === 'title') {
      refreshCal();
    }
  } else if (el.dataset.a === 'cq' && S.overlay?.kind === 'cmd') {
    S.overlay.q = el.value;
    S.overlay.i = 0;
    renderLayer();
  } else if (el.dataset.a === 'sq' && S.search) {
    S.search.q = el.value;
  } else if (el.dataset.a === 'email') {
    S.email = el.value;
  }
  // only now: the list redraws, and a redraw puts the kept value back in the field
  if (/^(to|cc|bcc)$/.test(el.dataset.c || '') || el.dataset.e === 'guests') {
    suggest(el);
  }
}
document.addEventListener('input', (e) => change(() => onInput(e)));

const typing = (el: HTMLElement | null) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

function onKey(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey,
    k = e.key,
    o = S.overlay,
    tgt = e.target as HTMLElement;
  if (S.sugg && tgt === S.sugg.el) {
    const sg = S.sugg;
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      sg.i = (sg.i + (k === 'ArrowDown' ? 1 : -1) + sg.items.length) % sg.items.length;
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
      void signIn(S.email && /gmail|googlemail/i.test(S.email) ? 'google' : 'microsoft');
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
    const menu = S.menu;
    const moveMenu = (d: number) => {
      menu.sel = (menu.sel + d + items.length) % items.length;
      onSettled(() => {
        root.querySelector('.sm-item.on')?.scrollIntoView({ block: 'nearest' });
      });
    };
    if (k === 'ArrowDown' || k === 'j') {
      moveMenu(1);
    } else if (k === 'ArrowUp' || k === 'k') {
      moveMenu(-1);
    } else if (k === 'Enter') {
      runMenu(menu.sel);
    } else if (k === 'Escape' || k === 'ArrowRight' || k === 'ArrowLeft') {
      closeMenu();
    } else {
      return;
    }
    e.preventDefault();
    return;
  }
  if (S.screen === 'settings' && !o) {
    if (k === 'Escape') {
      e.preventDefault();
      if (typing(tgt)) {
        tgt.blur();
      } else {
        S.screen = 'list';
        render();
      }
    }
    return;
  }
  if (mod && k.toLowerCase() === 'k') {
    e.preventDefault();
    if (o && o.kind === 'cmd') {
      closeLayer();
    } else {
      openPalette();
    }
    return;
  }
  if (o) {
    if (k === 'Escape') {
      e.preventDefault();
      closeLayer();
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
        openCmd();
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
        runCmd(items[o.i]);
      }
      return;
    }
    return;
  }
  if (S.eventForm) {
    if (mod && k === 'Enter') {
      e.preventDefault();
      if (!S.eventForm.readOnly) {
        void saveEvent();
      }
    } else if (k === 'Escape') {
      e.preventDefault();
      closeEvent();
    } else if (S.eventForm.readOnly && !typing(tgt) && ['y', 'm', 'n'].includes(k)) {
      e.preventDefault();
      void answerEvent(({ y: 'yes', m: 'maybe', n: 'no' } as Record<string, Answer>)[k] as Answer);
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
      ACTIONS.showcc();
    } else if (mod && e.shiftKey && kl === 'b') {
      e.preventDefault();
      ACTIONS.showbcc();
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
      if (S.screen === 'compose') {
        leaveCompose();
      } else if (!S.composer.text.trim()) {
        S.composer = null;
        render();
      } else {
        tgt.blur?.();
      }
    }
    return;
  }
  if (S.screen === 'search') {
    if (k === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (k === 'Enter') {
      e.preventDefault();
      runSearch(root.querySelector<HTMLInputElement>('.sq')?.value || '');
    }
    return;
  }
  if (typing(tgt)) {
    return;
  }
  if (mod && k.toLowerCase() === 'a' && S.screen === 'list') {
    e.preventDefault();
    selectAll(e.shiftKey);
    return;
  }
  if (e.altKey || (mod && k !== 'Enter')) {
    return;
  }

  if (M.g) {
    M.g = false;
    const map: Record<string, [string, string?]> = {
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
  if (S.screen === 'board') {
    const fn = ({ 1: () => leaveBoard('list'), 2: () => leaveBoard('calendar') } as Record<string, () => unknown>)[k];
    if (fn) {
      e.preventDefault();
      fn();
    }
    return;
  }
  if (S.screen === 'calendar') {
    const fn = (
      {
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
        3: goBoard,
        c: () => startCompose('new'),
        '?': () => ACTIONS.keys(),
      } as Record<string, () => unknown>
    )[k];
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
        if (!thread) {
          openMenu();
        }
        return true; // ← opens the folder menu
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
        if (!thread) {
          void openThread(current());
        } else if (S.msgs[S.focus]?.draft) {
          resumeDraft(S.focus);
        } else if (S.msgs.length && !S.expanded.has(S.focus)) {
          toggleMsg();
        } else {
          startCompose('replyall');
        }
        return true;
      case 'Escape':
        if (thread) {
          closeThread();
        } else if (S.picked.size) {
          S.picked = new Set();
          render();
        } else if (S.view === 'search') {
          closeSearch();
        }
        return true;
      case 'e':
        void act('done');
        return true;
      case 'E':
        void act('undone');
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
        void act('trash');
        return true;
      case '!':
        void act('spam');
        return true;
      case 'x':
        if (!thread) {
          pick();
        }
        return true;
      case 'z':
        void undo();
        return true;
      case 'r':
        if (thread) {
          startCompose('reply');
        }
        return true;
      case 'f':
        if (thread) {
          startCompose('forward');
        }
        return true;
      case 'c':
        startCompose('new');
        return true;
      case '/':
        openSearch();
        return true;
      case 'g':
        M.g = true;
        setTimeout(() => (M.g = false), 1500);
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
      case '3':
        goBoard();
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
        if (thread) {
          toggleMsg();
        }
        return true;
      case 'O':
        if (thread) {
          expandAll();
        }
        return true;
      case 'v':
        void openFolderPick('move');
        return true;
      case 'l':
        void openFolderPick(isGmail() ? 'copy' : 'move');
        return true;
      case ';':
        snippetPick();
        return true;
      case 'N':
        if (thread) {
          showNewMessages();
        }
        return true;
    }
    return false;
  })();
  if (handled) {
    e.preventDefault();
  }
}
document.addEventListener('keydown', (e) => change(() => onKey(e)));
