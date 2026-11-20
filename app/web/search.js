// Search words: from: to: subject: domain: is:unread is:starred is:list,
// "exact phrase", -word to exclude, plain words anywhere. matchQuery(conversation, words) says
// whether one conversation matches: for splits and the demo's search. Also loaded by search.test.js.
function matchQuery(t, q) {
  const toks = String(q || '').match(/-?\w+:"[^"]*"|-?\w+:\S+|-?"[^"]*"|\S+/g) || [];
  const lc = (x) => String(x || '').toLowerCase();
  const who = (p) => lc(`${p?.name} ${p?.address}`);
  return toks.every((tok) => {
    const neg = tok.startsWith('-');
    if (neg) tok = tok.slice(1);
    let [k, v] = /^\w+:/.test(tok)
      ? [tok.slice(0, tok.indexOf(':')).toLowerCase(), tok.slice(tok.indexOf(':') + 1)]
      : ['', tok];
    v = lc(v.replace(/^"|"$/g, ''));
    let ok;
    if (k === 'from') ok = who(t.from).includes(v);
    else if (k === 'domain') {
      const d = lc(t.from?.address).split('@')[1] || '',
        w = v.replace(/^@/, '');
      ok = !w || d === w || d.endsWith(`.${w}`); // example.com, or mail.example.com, not badexample.com
    } else if (k === 'to' || k === 'cc' || k === 'bcc') ok = (t.to || []).some((p) => who(p).includes(v));
    else if (k === 'subject') ok = lc(t.subject).includes(v);
    else if (k === 'is')
      ok =
        v === 'unread'
          ? !!t.unread
          : v === 'read'
            ? !t.unread
            : v === 'starred'
              ? !!t.starred
              : v === 'list'
                ? !!t.list
                : false;
    else if (k === 'has') ok = /^attachments?$/.test(v) ? !!t.atts?.length : v === 'list' ? !!t.list : false;
    else if (k === 'filename') ok = (t.atts || []).some((a) => lc(a.name).includes(v));
    else if (k === 'larger' || k === 'smaller') {
      const m = /^(\d+(?:\.\d+)?)([kmg]?)b?$/.exec(v),
        n = m ? +m[1] * { '': 1, k: 1024, m: 1048576, g: 1073741824 }[m[2]] : 0;
      ok = !!m && (k === 'larger' ? (t.size || 0) > n : (t.size || 0) < n);
    } else ok = `${lc(t.subject)} ${lc(t.snippet)} ${who(t.from)}`.includes(v);
    return neg ? !ok : ok;
  });
}

export { matchQuery };
