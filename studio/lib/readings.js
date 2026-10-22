const readingEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function isOpenStaxReading(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'openstax.org'
      && !parsed.username && !parsed.password && !parsed.port && !parsed.search
      && /^\/books\/[a-z0-9-]+\/pages\/[a-z0-9-]+$/.test(parsed.pathname);
  } catch { return false; }
}

export function openstaxReadingHTML(course, unit, print = false) {
  const sources = (unit.openstax || []).map(id => course.sources.find(s => s.id === id))
    .filter(s => s && isOpenStaxReading(s.url));
  if (!sources.length) return '';
  const content = `<p>Letture facoltative in inglese, gratuite online. Serve Internet; puoi usare la traduzione del browser. Le spiegazioni e gli esercizi di questa pagina restano disponibili offline.</p>
    ${unit.openstaxNote ? `<p>${readingEscape(unit.openstaxNote)}</p>` : ''}
    <ul>${sources.map(s => `<li><a href="${readingEscape(s.url)}" target="_blank" rel="noopener noreferrer">${readingEscape(s.title.replace(/^OpenStax\s*·\s*/, ''))} ↗</a><span class="reading-book">${readingEscape(s.reading?.section)} · ${readingEscape(s.reading?.book)}</span></li>`).join('')}</ul>`;
  return print ? `<section class="openstax-reading editorial"><h2>Approfondimenti OpenStax</h2>${content}</section>`
    : `<details class="openstax-reading editorial"><summary>Approfondisci su OpenStax · ${sources.length} ${sources.length === 1 ? 'lettura' : 'letture'}</summary>${content}</details>`;
}
