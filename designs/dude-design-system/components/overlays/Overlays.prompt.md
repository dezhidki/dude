Things that float: the command palette (also the remind / move / send-later picker), dialogs (keys sheet), toasts, the folder side menu, the sign-in-again alert, the file viewer.

```jsx
<CommandPalette items={[{t:'Mark Done', keys:['E']}]} active={0} />
<CommandPalette ask icon="clock" title="remind when" placeholder="when? 8 am, 3 days, aug 7" items={[{t:'tomorrow', when:'Tue 8:00 AM'}]} />
<ToastStack toasts={['sent.', ['sending… ', 'Z', ' undo']]} />
```

- Flat in both themes: 1px --line-2, 3px radius, no shadow. Only dialogs dim the app.
- Palette and dialogs pop in 0.14s with a 10% overshoot; toasts rise 10px; the side menu slides 24px.
- `inline` renders any overlay in flow, for specimens and mockups.
