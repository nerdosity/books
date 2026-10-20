export const BIOLOGY_DIAGRAMS=['dna-gel','pedigree-recessivo'];
export function biologyDiagramHTML(kind) {
  if(kind==='pedigree-recessivo')return `<figure class="biology-diagram" data-biology-diagram="pedigree-recessivo">
    <figcaption><strong>Due generazioni: distinguere fenotipo osservato e genotipo</strong></figcaption>
    <svg viewBox="0 0 380 285" role="img" aria-label="Pedigree inventato. I-1, padre senza fenotipo, e I-2, madre senza fenotipo, hanno tre figli: II-1 maschio con fenotipo, II-2 femmina senza fenotipo, II-3 maschio senza fenotipo. I genotipi non sono indicati nei simboli.">
      <g fill="none" stroke="#174b42" stroke-width="2.5">
        <path d="M143 62 H237 M190 62 V126 M80 126 H300 M80 126 V160 M190 126 V160 M300 126 V160"/>
        <rect x="107" y="44" width="36" height="36" fill="#fff"/><circle cx="255" cy="62" r="18" fill="#fff"/>
        <rect x="62" y="160" width="36" height="36" fill="#174b42"/><circle cx="190" cy="178" r="18" fill="#fff"/>
        <rect x="282" y="160" width="36" height="36" fill="#fff"/>
      </g>
      <g fill="#173b33" text-anchor="middle">
        <text x="125" y="30">I-1</text><text x="255" y="30">I-2</text>
        <text x="80" y="220">II-1</text><text x="190" y="220">II-2</text><text x="300" y="220">II-3</text>
        <text x="190" y="253">Pieno: fenotipo presente</text><text x="190" y="276">Vuoto: fenotipo assente</text>
      </g>
    </svg>
    <p>I-1 e I-2 non manifestano il carattere. Fra i loro figli, soltanto II-1 lo manifesta. Un simbolo vuoto non esclude lo stato di portatore.</p>
    <p class="reading-note">Albero originale inventato. Quadrato: maschio; cerchio: femmina, secondo le convenzioni del caso. Le conclusioni sui genotipi richiedono il modello esplicito spiegato nella lezione.</p>
  </figure>`;
  if(kind!=='dna-gel')return '';
  const lanes=[{name:'M',x:90,bands:[800,400,200]},{name:'A',x:160,bands:[400]},
    {name:'B',x:230,bands:[800,400]},{name:'NTC',x:300,bands:[]}];
  const y=bp=>80+70*Math.log2(800/bp);
  return `<figure class="biology-diagram" data-biology-diagram="dna-gel">
    <figcaption><strong>Leggere le bande senza attribuire loro una sequenza</strong></figcaption>
    <svg viewBox="0 0 380 290" role="img" aria-label="Gel schematico: marcatore con bande di 800, 400 e 200 paia di basi; A ha una banda a 400; B a 800 e 400; controllo senza stampo privo di bande. Migrazione dall’alto verso il polo positivo in basso.">
      <rect x="60" y="35" width="270" height="215" rx="8" fill="#e4eee9"/>
      ${lanes.map(l=>`<text x="${l.x}" y="23" text-anchor="middle">${l.name}</text>
        <rect x="${l.x-16}" y="43" width="32" height="7" rx="2" fill="#70847b"/>
        ${l.bands.map(bp=>`<rect x="${l.x-18}" y="${y(bp)-3}" width="36" height="6" rx="2" fill="#174b42"/>`).join('')}`).join('')}
      ${[800,400,200].map(bp=>`<text x="50" y="${y(bp)+5}" text-anchor="end">${bp}</text>`).join('')}
      <text x="45" y="23" text-anchor="end">bp</text>
      <path d="M350 55 V235 M343 225 L350 235 L357 225" fill="none" stroke="#405e55" stroke-width="2"/>
      <text x="350" y="40" text-anchor="middle">−</text><text x="350" y="260" text-anchor="middle">+</text>
      <text x="195" y="278" text-anchor="middle">M = marcatore · NTC = senza stampo</text>
    </svg>
    <p>A: circa 400 bp. B: circa 400 e 800 bp. NTC: nessuna banda rilevabile.</p>
    <p class="reading-note">Schema originale con dati inventati, non una fotografia sperimentale. Distanze illustrative; intensità uguali per leggibilità, non per indicare quantità uguali. Frammenti lineari a doppio filamento nelle condizioni del modello.</p>
  </figure>`;
}
