// Run: node web/markdown.test.js  (not shipped)
const assert = require('node:assert');
const { toHtml, tint } = require('./markdown.js');
const h = toHtml('Hi **Venla**, see *this* and `x<y`.\n> quoted\n- one\n- two\n```js\nconst a = "s"; // c\n```\n[site](https://example.org) https://a.fi/x.');
assert.match(h, /<b>Venla<\/b>/);
assert.match(h, /<i>this<\/i>/);
assert.match(h, /<code[^>]*>x&lt;y<\/code>/);
assert.match(h, /<blockquote[^>]*><div>quoted<\/div><\/blockquote>/);
assert.match(h, /<ul[^>]*><li>one<\/li><li>two<\/li><\/ul>/);
assert.match(h, /<pre[^>]*><code><span style="color:#c678dd">const<\/span>/);
assert.match(h, /<span style="color:#98c379">&quot;s&quot;<\/span>/);
assert.match(h, /<a href="https:\/\/example.org">site<\/a>/);
assert.match(h, /<a href="https:\/\/a.fi\/x">https:\/\/a.fi\/x<\/a>\./);
assert.doesNotMatch(toHtml('<script>alert(1)</script>'), /<script/);
assert.doesNotMatch(toHtml('2 * 3 * 4'), /<i>/);
assert.ok(tint('a **b** c').replace(/<[^>]+>/g, '') === 'a **b** c\n', 'tint keeps the text');
console.log('markdown ok');
