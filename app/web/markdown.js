// Light markdown for writing mail: **bold**, *italic* / _italic_, ~~strike~~, `code`, ```code blocks```
// (with simple colouring), > quotes, - / * / 1. lists, # headings, [text](url) and bare links.
// toHtml() gives email-safe HTML (inline styles only, as mail apps drop <style>); tint() gives the
// writing box's live colouring. Also loaded by markdown.test.js.
(function (root) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KW = new Set('if else for while do return function const let var class new import from export default async await try catch finally throw switch case break continue def lambda elif in is not and or None True False null undefined true false this self public private static void int string bool fn pub struct impl use mod match enum type interface select where insert update delete create table join on as with yield'.split(' '));
  const C = { kw: '#c678dd', str: '#98c379', num: '#d19a66', com: '#7f848e', fn: '#61afef' };

  // Colours code with inline styles: comments, strings, numbers, keywords, function calls.
  function highlight(code) {
    const re = /(\/\/[^\n]*|#[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)(?=\s*\()|\b([A-Za-z_]\w*)\b/g;
    let out = '', last = 0;
    for (const m of code.matchAll(re)) {
      out += esc(code.slice(last, m.index));
      const [t] = m;
      const color = m[1] ? C.com : m[2] ? C.str : m[3] ? C.num : m[4] ? (KW.has(m[4]) ? C.kw : C.fn) : KW.has(m[5]) ? C.kw : null;
      out += color ? `<span style="color:${color}">${esc(t)}</span>` : esc(t);
      last = m.index + t.length;
    }
    return out + esc(code.slice(last));
  }

  function inline(s) {
    const codes = [];
    // code spans are set aside behind NUL markers so the rules below leave them alone
    s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = esc(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '$1<a href="$2">$2</a>')
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<b>$1</b>')
      .replace(/__(?=\S)([\s\S]*?\S)__/g, '<b>$1</b>')
      .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?!\*)/g, '$1<i>$2</i>')
      .replace(/(^|[^_\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<i>$2</i>')
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<s>$1</s>');
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the NUL markers set above
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code style="font-family:Menlo,Consolas,monospace;font-size:90%;background:#f2f0eb;border-radius:3px;padding:1px 4px">${esc(codes[+i])}</code>`);
  }

  function toHtml(text) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      const fence = /^```\s*([\w+-]*)\s*$/.exec(l);
      if (fence) {
        const body = []; i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
        i++;
        out.push(`<pre style="font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.5;background:#282c34;color:#abb2bf;border-radius:6px;padding:12px 14px;overflow-x:auto;white-space:pre"><code>${highlight(body.join('\n'))}</code></pre>`);
        continue;
      }
      if (/^>/.test(l)) {
        const q = [];
        while (i < lines.length && /^>/.test(lines[i])) q.push(lines[i++].replace(/^> ?/, ''));
        out.push(`<blockquote style="margin:0 0 0 .8ex;border-left:2px solid #ccc;padding-left:1ex;color:#555">${toHtml(q.join('\n'))}</blockquote>`);
        continue;
      }
      const ul = /^\s*[-*+] +/, ol = /^\s*\d+[.)] +/;
      if (ul.test(l) || ol.test(l)) {
        const tag = ul.test(l) ? 'ul' : 'ol', re = tag === 'ul' ? ul : ol, items = [];
        while (i < lines.length && re.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(re, ''))}</li>`);
        out.push(`<${tag} style="margin:0 0 0 1.4em;padding:0">${items.join('')}</${tag}>`);
        continue;
      }
      const h = /^(#{1,3}) +(.*)$/.exec(l);
      if (h) { out.push(`<div style="font-weight:700;font-size:${[0, 20, 17, 15][h[1].length]}px;margin:6px 0 2px">${inline(h[2])}</div>`); i++; continue; }
      if (/^-- ?$/.test(l)) { out.push('<div>--&nbsp;</div>'); i++; continue; }
      out.push(l.trim() ? `<div>${inline(l)}</div>` : '<div><br></div>');
      i++;
    }
    return out.join('\n');
  }

  // Live colouring for the writing box: same text, same letter widths (colour only, no bold),
  // so the coloured layer under the transparent textarea lines up exactly.
  function tint(text) {
    let s = esc(String(text || ''));
    s = s.replace(/(^|\n)(```[\s\S]*?(?:\n```|(?![\s\S])))/g, '$1<span class="t-code">$2</span>')
      .replace(/^(&gt;.*)$/gm, '<span class="t-quote">$1</span>')
      .replace(/^(#{1,3} .*)$/gm, '<span class="t-head">$1</span>')
      .replace(/^(\s*(?:[-*+]|\d+[.)]) )/gm, '<span class="t-mark">$1</span>')
      .replace(/(\*\*|__)(?=\S)([^\n]*?\S)\1/g, '<span class="t-mark">$1</span><span class="t-bold">$2</span><span class="t-mark">$1</span>')
      .replace(/(^|[^*\w])(\*|_)(?=\S)([^*_\n]*?\S)\2(?![*\w])/g, '$1<span class="t-mark">$2</span><span class="t-it">$3</span><span class="t-mark">$2</span>')
      .replace(/(`)([^`\n]+)(`)/g, '<span class="t-code">$1$2$3</span>');
    return s + '\n';
  }

  root.Markdown = { toHtml, tint, highlight };
  if (typeof module !== 'undefined') module.exports = root.Markdown;
})(typeof window !== 'undefined' ? window : globalThis);
