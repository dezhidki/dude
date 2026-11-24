dude's controls: keycaps, the 26px icon button, the word-buttons (one variant per place in the app), rsvp choices, segmented, the boxed field, checkbox, and the bar-marked input.

```jsx
<Button variant="soft" keyHint="Enter">reply all</Button>
<Button variant="quiet" primary>send</Button> <Button variant="quiet">later</Button>
<IconButton icon="cal" on title="Calendar (0)" />
<Segmented value={3} options={[{value:0,label:'off'},{value:3,label:'3 s'}]} />
<Keys keys={['G','then','I']} />
```

- Button copy is lowercase and short ("go", "reply all", "nope"); caps only via `caps`/`save`/`banner`.
- `main` is the only filled-brand button in the product (sign-in). Don't add more.
- Tooltips read "Action (Key)": `Mark Done (E)`, `Send later (Ctrl+Shift+L)`.
