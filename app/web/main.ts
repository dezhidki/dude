// The app's entry. These modules register document listeners and timers when they load (in this
// order); the rest load through their imports. Solid draws #root, #layer and #toast, then start().
import './app/compose.ts';
import './app/calendar.ts';
import './app/people.ts';
import './app/events.ts';
import { render } from '@solidjs/web';
import { App, Layer, Toasts } from './app/render.tsx';
import { start } from './app/start.ts';

render(App, document.getElementById('root') as HTMLElement);
render(Layer, document.getElementById('layer') as HTMLElement);
render(Toasts, document.getElementById('toast') as HTMLElement);
start();
