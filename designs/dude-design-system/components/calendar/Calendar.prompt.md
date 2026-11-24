Calendar surfaces: the day pane beside mail, the week, event blocks and all-day chips, the mini month, calendar options, the event form, someone else's event, and the event buttons.

```jsx
<DayCalendar label="Mon, Nov 23" now={14.4} events={[{title:'Standup', start:9.5, end:9.75, where:'Room B204'}]} />
<WeekView title="November 2026" days={[{label:'Mon 23', today:true, events:[…]}]} />
<EventForm title="" when="tomorrow 2 pm 30 min" parsed="Tue, Nov 24, 2:00 PM – 2:30 PM" />
<EventButtons canDelete />
```

- An hour is always 44px. Hour labels are mono ("2 pm"), grid lines are --line hairlines.
- Event kinds: server (filled), local / pending (outlined), inv (dashed outline), draft (dashed), declined (55%, struck).
- Light gives events a 3px --ev-bar edge; carbon is flat lime-on-olive.
