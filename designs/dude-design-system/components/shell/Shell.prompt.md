The window frame: Logo, AppShell (rail | main | pane), Rail, ListHeader, ThreadView (reading page), Pane, SettingsSection and the phone TabBar.

```jsx
<AppShell rail={<Rail active="mail" />} pane={<Pane contact foot="you@example.edu"><ContactCard … /></Pane>}>
  <ListHeader actions={…}><SplitTabs … /></ListHeader>
  <div className="d-list">…rows…</div>
</AppShell>
```

- No sidebar: folders live in the SideMenu overlay. The rail only switches mail / calendar.
- Reading pages (thread, compose, settings) all use ThreadView: back arrow top-left, 712px column, 22px light title.
- Narrow rules follow the shell's width (container queries): pane hides < 1200px, rail hides + TabBar shows < 768px.
