// fills .sw[data-t] with a swatch, the token name and its live value
for (const el of document.querySelectorAll('.sw[data-t]')) {
  const t = el.dataset.t;
  const v = getComputedStyle(el).getPropertyValue(t).trim();
  el.innerHTML = `<i style="background:var(${t})"></i><b>${t}</b><small>${el.dataset.note || v}</small>`;
}
