// Run: node tests/desktop/calendar.test.ts (needs no network: only the reply reader is checked)
import assert from 'node:assert';
import type { Invite } from '../../web/api.ts';
import { fakeModules } from './fake-modules.ts';

fakeModules({ './oauth.ts': "export const freshToken = async () => 't';" }); // no Electron here
const { parseEws, parseMeeting, soap } = await import('../../desktop/calendar.ts');

const reply = `<m:FindItemResponseMessage ResponseClass="Success"><m:RootFolder><t:Items>
<t:CalendarItem><t:ItemId Id="AAA=" ChangeKey="x"/><t:Subject>Thesis &amp; sync</t:Subject><t:Start>2026-11-18T12:00:00Z</t:Start><t:End>2026-11-18T12:45:00Z</t:End><t:Location>T2</t:Location><t:IsAllDayEvent>false</t:IsAllDayEvent><t:Organizer><t:Mailbox><t:Name>Maya L</t:Name></t:Mailbox></t:Organizer></t:CalendarItem>
<t:CalendarItem><t:ItemId Id="BBB="/><t:Subject>Holiday</t:Subject><t:Start>2026-11-18T00:00:00Z</t:Start><t:End>2026-11-19T00:00:00Z</t:End><t:IsAllDayEvent>true</t:IsAllDayEvent></t:CalendarItem>
</t:Items></m:RootFolder></m:FindItemResponseMessage>`;

const ev = parseEws(reply);
assert.strictEqual(ev.length, 2);
assert.strictEqual(ev[0].title, 'Holiday');
assert.ok(ev[0].allDay);
assert.strictEqual(ev[1].title, 'Thesis & sync');
assert.strictEqual(ev[1].where, 'T2');
assert.strictEqual(ev[1].organizer, 'Maya L');
assert.strictEqual(ev[1].end - ev[1].start, 45 * 60e3);
assert.match(soap('<x/>'), /RequestServerVersion/);

// an Outlook meeting (as GetItem returns it) becomes an invitation
const mt = parseMeeting(
  `<m:Items><t:CalendarItem><t:ItemId Id="AAMk1" ChangeKey="x"/><t:Subject>CS Faculty meeting</t:Subject><t:Start>2026-11-24T09:00:00Z</t:Start><t:End>2026-11-24T10:30:00Z</t:End><t:Location>Lecture hall T2</t:Location><t:IsAllDayEvent>false</t:IsAllDayEvent><t:IsCancelled>false</t:IsCancelled><t:MyResponseType>Tentative</t:MyResponseType><t:Organizer><t:Mailbox><t:Name>CS Invitations</t:Name><t:EmailAddress>cs-inv@example.edu</t:EmailAddress></t:Mailbox></t:Organizer><t:RequiredAttendees><t:Attendee><t:Mailbox><t:Name>Nieminen Oskari</t:Name><t:EmailAddress>oskari@example.edu</t:EmailAddress></t:Mailbox><t:ResponseType>Accept</t:ResponseType></t:Attendee></t:RequiredAttendees><t:UID>0400ABC</t:UID></t:CalendarItem></m:Items>`,
  'AAMk1',
) as Invite;

assert.strictEqual(mt.title, 'CS Faculty meeting');
assert.strictEqual(mt.ews, 'AAMk1');
assert.strictEqual(mt.uid, '0400ABC');
assert.strictEqual(mt.my, 'TENTATIVE');
assert.strictEqual(mt.organizer?.email, 'cs-inv@example.edu');
assert.deepStrictEqual(mt.attendees, [{ name: 'Nieminen Oskari', email: 'oskari@example.edu', status: 'ACCEPTED' }]);
assert.strictEqual((mt.end as number) - (mt.start as number), 90 * 60e3);
assert.ok(!mt.cancelled);
console.log('calendar ok');
