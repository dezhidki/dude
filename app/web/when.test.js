// Run: node web/when.test.js  (not shipped: build.mjs skips *.test.js)
const assert = require('node:assert');
const { parseWhen } = require('./when.js');
const now = new Date(2026, 10, 17, 9, 15); // Tue 17 Nov 2026 09:15
const at = (r) => {
  const d = new Date(r.start);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};
assert.strictEqual(at(parseWhen('tomorrow', now)), '11/18 8:00');
assert.strictEqual(at(parseWhen('8 am', now)), '11/18 8:00'); // already past today
assert.strictEqual(at(parseWhen('3 pm', now)), '11/17 15:00');
assert.strictEqual(at(parseWhen('3 days', now)), '11/20 9:15');
assert.strictEqual(at(parseWhen('2h', now)), '11/17 11:15');
assert.strictEqual(at(parseWhen('next week', now)), '11/23 8:00'); // Monday
assert.strictEqual(at(parseWhen('this weekend', now)), '11/21 8:00'); // Saturday
assert.strictEqual(at(parseWhen('fri 9:30', now)), '11/20 9:30');
assert.strictEqual(at(parseWhen('aug 7', now)), '8/7 8:00');
assert.strictEqual(new Date(parseWhen('aug 7', now).start).getFullYear(), 2027);
const ev = parseWhen('tomorrow 2 pm 30 min', now);
assert.strictEqual(at(ev), '11/18 14:00');
assert.strictEqual(ev.minutes, 30);
assert.strictEqual(parseWhen('mon 10am for 1 hour', now).minutes, 60);
assert.strictEqual(parseWhen('blah', now), null);
assert.strictEqual(parseWhen('', now), null);
console.log('when ok');
