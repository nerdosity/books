import { STUDY_DIAGRAMS, studyDiagramHTML } from './study-diagrams.js';
export const BIOLOGY_DIAGRAMS=['dna-gel','pedigree-recessivo','cellula-scale','cute-strati','circuiti-neurali',...STUDY_DIAGRAMS];
export function biologyDiagramHTML(kind) {
  if(STUDY_DIAGRAMS.includes(kind))return studyDiagramHTML(kind);
  if(kind==='cellula-scale')return `<figure class="biology-diagram" data-biology-diagram="cellula-scale">
    <figcaption><strong>Lo zoom cambia l’immagine, non la misura</strong></figcaption>
    <svg viewBox="0 0 380 240" role="img" aria-label="Due ingrandimenti dello stesso oggetto. In entrambi la lunghezza è due volte la barra da 2 micrometri: l’oggetto misura 4 micrometri.">
      <g fill="#173b33" font-size="16"><text x="20" y="26">Vista A</text><text x="20" y="132">Vista B · zoom maggiore</text></g>
      <g fill="#d7e9e4" stroke="#174b42" stroke-width="2"><rect x="20" y="42" width="160" height="28" rx="14"/><rect x="20" y="148" width="240" height="42" rx="21"/></g>
      <g stroke="#174b42" stroke-width="3"><path d="M20 82 H100 M20 77 V87 M100 77 V87"/><path d="M20 205 H140 M20 200 V210 M140 200 V210"/></g>
      <g fill="#173b33" font-size="16"><text x="112" y="88">2 µm</text><text x="152" y="211">2 µm</text></g>
    </svg><p>In entrambe le viste: 2 barre × 2 µm = 4 µm. Disegno originale dimostrativo, non micrografia di una specie.</p></figure>`;
  if(kind==='cute-strati')return `<figure class="biology-diagram" data-biology-diagram="cute-strati">
    <figcaption><strong>Dalla superficie alla profondità</strong></figcaption>
    <svg viewBox="0 0 380 290" role="img" aria-label="Schema della cute: epidermide priva di vasi, derma papillare con capillari, derma reticolare con connettivo denso, ipoderma adiposo. Il sottocute è distinto dalla cute propriamente detta.">
      <rect x="16" y="24" width="348" height="58" rx="6" fill="#ebe1d8"/>
      <rect x="16" y="85" width="348" height="58" rx="6" fill="#f2d6cc"/>
      <rect x="16" y="146" width="348" height="58" rx="6" fill="#e8c1b8"/>
      <rect x="16" y="207" width="348" height="62" rx="6" fill="#f1e1ac"/>
      <g fill="#293b3a" font-size="16"><text x="30" y="47">Epidermide</text><text x="30" y="69">Epitelio · senza vasi</text>
      <text x="30" y="108">Derma papillare</text><text x="30" y="130">Connettivo lasso · capillari</text>
      <text x="30" y="169">Derma reticolare</text><text x="30" y="191">Connettivo denso · vasi e annessi</text>
      <text x="30" y="232">Ipoderma / sottocute</text><text x="30" y="254">Connettivo lasso e adiposo</text></g>
    </svg><p>Schema originale dei livelli, senza proporzioni istologiche. L’ipoderma è associato alla cute ma distinto da epidermide e derma. Non rappresenta tutti gli annessi.</p></figure>`;
  if(kind==='circuiti-neurali')return `<figure class="biology-diagram" data-biology-diagram="circuiti-neurali">
    <figcaption><strong>Contare sorgenti e bersagli</strong></figcaption>
    <svg viewBox="0 0 380 300" role="img" aria-label="Convergenza: neuroni A e B inviano segnali a C. Divergenza: D invia segnali a E e F. Le frecce indicano direzione, non eccitazione o inibizione.">
      <g fill="#173b33" font-size="17"><text x="20" y="26">Convergenza · molti → uno</text><text x="20" y="176">Divergenza · uno → molti</text></g>
      <g stroke="#174b42" stroke-width="2.5" fill="none"><path d="M105 65 L260 95 M105 125 L260 95 M105 240 L260 210 M105 240 L260 270"/></g>
      <g fill="#174b42"><path d="M260 95 l-12 -9 1 13z M260 95 l-13 -4 1 13z M260 210 l-13 -4 1 13z M260 270 l-12 -9 -1 13z"/></g>
      <g stroke="#174b42" stroke-width="2" fill="#e2eeea"><circle cx="85" cy="65" r="20"/><circle cx="85" cy="125" r="20"/><circle cx="285" cy="95" r="20"/><circle cx="85" cy="240" r="20"/><circle cx="285" cy="210" r="20"/><circle cx="285" cy="270" r="20"/></g>
      <g fill="#173b33" font-size="18" text-anchor="middle"><text x="85" y="71">A</text><text x="85" y="131">B</text><text x="285" y="101">C</text><text x="85" y="246">D</text><text x="285" y="216">E</text><text x="285" y="276">F</text></g>
    </svg><p>Schema originale di connessioni, non anatomia di un circuito specifico. Le frecce indicano la direzione: per prevedere la risposta servono anche segno, intensità e tempi dei segnali.</p></figure>`;
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
