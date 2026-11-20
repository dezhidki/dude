// The app's entry. These modules register document listeners and timers when they load (in this
// order); the rest load through their imports. Solid draws #root and #layer, then start().
import './app/compose.js';
import './app/calendar.js';
import './app/people.js';
import './app/events.js';
import { render } from '@solidjs/web';
import { App, Layer } from './app/render.jsx';
import { start } from './app/start.js';

render(App, document.getElementById('root'));
render(Layer, document.getElementById('layer'));
start();
