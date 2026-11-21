// Run: node tests/desktop/files.test.ts
import assert from 'node:assert';
import { filesIn } from '../../desktop/files.ts';

type Part = NonNullable<Parameters<typeof filesIn>[0]>;

const bs = {
  childNodes: [
    { type: 'multipart/alternative', childNodes: [{ type: 'text/plain' }, { type: 'text/html' }] },
    { type: 'image/png', disposition: 'inline', id: '<logo>', dispositionParameters: { filename: 'image001.png' } },
    {
      type: 'application/pdf',
      disposition: 'attachment',
      dispositionParameters: { filename: 'Invoice.pdf' },
      size: 1200,
    },
    { type: 'image/jpeg', disposition: 'attachment', dispositionParameters: { filename: 'photo.jpg' } },
    { type: 'text/calendar', parameters: { name: 'invite.ics' } },
  ],
} as Part;

assert.deepStrictEqual(
  filesIn(bs, 7).map((a) => a.name),
  ['Invoice.pdf', 'photo.jpg', 'invite.ics'],
);

assert.strictEqual(filesIn(bs, 7)[0].uid, 7);
assert.deepStrictEqual(filesIn({ type: 'text/plain' } as Part, 1), []);
console.log('files ok');
