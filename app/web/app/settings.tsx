// ---------- settings ----------

import { For } from 'solid-js';
import { tint, toHtml } from '../markdown.ts';
import { leaveCompose } from './compose.ts';
import { B, carbon, LS, M, on, S, setTheme } from './core.ts';
import { customSplits, removeSplit } from './data.ts';
import { press } from './events.ts';
import { ic } from './icons.tsx';
import { fit, render } from './render.tsx';
import { schedulePoll } from './start.ts';
import { closeThread } from './thread.ts';

/** what the settings page sets (kept in localStorage) */
export interface Prefs {
  signature: string;
  undoSeconds: number;
  pollSeconds?: number;
  notify?: 'important' | 'all' | 'off';
  sendAndDone?: boolean;
  rsvpAndDone?: boolean;
}

export const SET = (): Prefs => ({ signature: '', undoSeconds: 3, ...LS.get<Partial<Prefs>>('settings', {}) });

export function setSetting<K extends keyof Prefs>(k: K, v: Prefs[K]) {
  LS.set('settings', { ...SET(), [k]: v });
}

export const sigBlock = () => {
  const sg = SET().signature.trim();
  return sg ? `\n\n${sg}` : '';
};

export function openSettings() {
  if (S.screen === 'compose') {
    leaveCompose();
  }
  if (S.screen === 'thread') {
    closeThread();
  }
  if (S.screen !== 'settings') {
    M.back = { screen: 'list' };
  }
  S.screen = 'settings';
  S.menu = null;
  render();
}

// One choice of a few: the button for what's set is on. data-<attr>=<value> is what events.js reads.
const Seg = <T extends string | number | boolean>(props: {
  attr: string;
  opts: [T, string][];
  cur: T;
  pick: (v: T) => void;
}) => (
  <div class="seg">
    <For each={props.opts}>
      {([v, l]) => (
        <button
          {...{ [`data-${props.attr}`]: v }}
          class={{ on: String(v) === String(props.cur) }}
          onClick={on(() => props.pick(v))}
        >
          {l}
        </button>
      )}
    </For>
  </div>
);

export const Settings = () => (
  <div class="thread">
    <div class="thread-top">
      <button class="back" data-a="close-settings" onClick={press('close-settings')} title="Back (Esc)">
        <ic.back />
      </button>
    </div>
    <div class="tcol settings">
      <div class="thead">
        <h1>settings</h1>
      </div>
      <section>
        <h3>signature</h3>
        <p class="hint">goes under mail. **bold** *italic* `code` links ok.</p>
        <div class="editor">
          <div class="tint" aria-hidden="true" innerHTML={tint(SET().signature)} />
          <textarea
            ref={fit(() => SET().signature)}
            data-set="signature"
            placeholder={'Best,\nYour name'}
            aria-label="Signature"
            value={SET().signature}
          />
        </div>
      </section>
      <section>
        <h3>name</h3>
        <p class="hint">name on your mail.</p>
        {/* the name is kept trimmed: what's typed stays as typed (defaultValue) */}
        <input class="field" data-set="name" defaultValue={S.account?.name || ''} placeholder="name" />
      </section>
      <section>
        <h3>undo send</h3>
        <p class="hint">time to hit Z.</p>
        <Seg
          attr="undo"
          pick={(v) => {
            setSetting('undoSeconds', +v);
            render();
          }}
          opts={[
            [0, 'off'],
            [3, '3 s'],
            [5, '5 s'],
            [10, '10 s'],
            [20, '20 s'],
          ]}
          cur={SET().undoSeconds}
        />
      </section>
      <section>
        <h3>check mail</h3>
        <p class="hint">
          {S.pushLive === true || S.pushLive === false
            ? 'outlook tells dude when mail lands: '
            : 'outlook tells dude when mail lands. timer is backup.'}
          {S.pushLive === true ? <b>live</b> : S.pushLive === false ? <b>not live now</b> : null}
          {S.pushLive === true
            ? '. timer is backup.'
            : S.pushLive === false
              ? ', checks on timer. timer is backup.'
              : null}
        </p>
        <Seg
          attr="poll"
          pick={(v) => {
            setSetting('pollSeconds', +v);
            schedulePoll();
            render();
          }}
          opts={[
            [15, '15 s'],
            [30, '30 s'],
            [60, '1 min'],
            [120, '2 min'],
            [300, '5 min'],
          ]}
          cur={SET().pollSeconds || 60}
        />
      </section>
      <section>
        <h3>ping</h3>
        <p class="hint">new mail ping. dude live in tray.</p>
        <Seg
          attr="notify"
          pick={(v) => {
            setSetting('notify', v);
            render();
          }}
          opts={[
            ['important', 'important'],
            ['all', 'all'],
            ['off', 'off'],
          ]}
          cur={SET().notify || 'important'}
        />
      </section>
      <section>
        <h3>look</h3>
        <Seg
          attr="theme"
          pick={(v) => setTheme(v === 'carbon')}
          opts={[
            ['carbon', 'dark'],
            ['light', 'light'],
          ]}
          cur={carbon() ? 'carbon' : 'light'}
        />
      </section>
      <section>
        <h3>splits</h3>
        {customSplits().length ? (
          <For each={customSplits()}>
            {(sp) => (
              <div class="setrow">
                <span>
                  {`${sp.name} `}
                  <small>{sp.q}</small>
                </span>
                <button
                  data-rmsplit={sp.id}
                  onClick={on(() => {
                    removeSplit(sp.id);
                    S.screen = 'settings';
                    render();
                  })}
                >
                  remove
                </button>
              </div>
            )}
          </For>
        ) : (
          <p class="hint">only important + other.</p>
        )}
        <button class="link" data-a="new-split" onClick={press('new-split')}>
          new split
        </button>
      </section>
      <section>
        <h3>account</h3>
        <div class="setrow">
          <span>{S.account?.email || ''}</span>
          {B.demo ? null : (
            <button data-a="signout" onClick={press('signout')}>
              logout
            </button>
          )}
        </div>
      </section>
      <section>
        <h3>keys</h3>
        <button class="link" data-a="keys" onClick={press('keys')}>
          all keys
        </button>
      </section>
    </div>
  </div>
);

// beside it: the signature as it will look
export const SettingsPane = () => (
  <aside class="pane contact-pane">
    <div class="contact">
      <div class="nm">looks like</div>
      <div class="sigprev" innerHTML={toHtml(SET().signature)} />
    </div>
  </aside>
);
