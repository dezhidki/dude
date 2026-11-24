Mail surfaces: split tabs, list rows and date separators, collapsed and open messages, the reply bar, the composer with its tinted markdown editor, attachments, invitations, people suggestions, the contact pane, search tips, inbox zero.

```jsx
<ListRow unread selected from="Maya Lindqvist" subject="Draft of the thesis chapter 3" snippet="Hi! I went through…" date="2:22 PM" />
<Message focus from="Omar Haddad" to="You" date="12:08 PM" attachments={[{name:'poster-final.pdf', size:248000}]}>Looks great.</Message>
<ReplyBar />
<Composer inline mode="reply" to="omar" subject="Re: Poster layout" text="" />
```

- One accent, used as a 3px bar: selected row, focused message, inline composer, search box.
- Dates are mono lowercase ("2:22 pm", "22 nov"); counts are mono --text-3, capped at 150+.
- Empty states are mono and terse: "inbox zero." / "nothing left. go outside.", "nothing.", "loading…".
