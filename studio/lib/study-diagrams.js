// Original teaching diagrams. No uploaded page or attachment is embedded.
export const STUDY_DIAGRAMS=['neuro-chiasma','neuro-on-off','neuro-riflesso','neuro-nmda','neuro-dopamina','ricerca-confronti','bio-frazioni','bio-torsione','bio-stereoisomeri','sviluppo-credenza'];
const box=(x,y,w,lines)=>`<rect x="${x}" y="${y}" width="${w}" height="${lines.length*23+20}" rx="9" fill="var(--soft)" stroke="currentColor"/>${lines.map((s,i)=>`<text x="${x+w/2}" y="${y+25+i*23}" text-anchor="middle">${s}</text>`).join('')}`;
const arrow=(x,y,x2,y2,label='')=>`<path d="M${x} ${y} L${x2} ${y2}" stroke="currentColor" stroke-width="2" fill="none"/><text x="${x2}" y="${y2-5}" text-anchor="middle">↓</text>${label?`<text x="${x+12}" y="${(y+y2)/2}">${label}</text>`:''}`;
const wrap=(kind,title,h,body,alt,note)=>{
 const svg=`<svg viewBox="0 0 460 ${h}" role="img" aria-label="${alt}">${body}</svg>`;
 return `<figure class="study-diagram" data-study-diagram="${kind}"><figcaption><strong>${title}</strong></figcaption>${svg}<details class="study-zoom"><summary>Ingrandisci schema</summary><div tabindex="0" role="region" aria-label="Schema ingrandito, scorribile orizzontalmente">${svg}</div></details><p>${note}</p></figure>`;
};
export function studyDiagramHTML(kind){
 if(kind==='sviluppo-credenza')return wrap(kind,'Stessa realtà, informazioni diverse',465,
 box(50,8,360,['Prima: Nora lascia la fascia in A'])+arrow(230,51,230,80)+
 box(50,85,360,['Poi: Elia la sposta in B'])+
 arrow(230,128,115,170)+arrow(230,128,345,170)+
 box(10,175,210,['Caso 1: Nora assente','Non viene informata'])+box(240,175,210,['Caso 2: Nora presente','Vede lo spostamento'])+
 arrow(115,241,115,280)+arrow(345,241,345,280)+
 box(10,285,210,['Crede: fascia in A','Cerca prima in A'])+box(240,285,210,['Sa: fascia in B','Cerca prima in B'])+
 '<text x="230" y="405" text-anchor="middle">In entrambi i casi: fascia realmente in B</text>',
 'Nora lascia la fascia in A ed Elia la sposta in B. In una versione Nora è assente e non viene informata: cerca in A. Nella variante vede lo spostamento: cerca in B. In entrambe la posizione reale è B.',
 'Due varianti della stessa storia originale: cambia l’accesso di Nora all’informazione. La previsione della ricerca è distinta dalla domanda sulla posizione reale.');
 if(kind==='neuro-chiasma')return wrap(kind,'Un emicampo, due occhi, un emisfero',390,
 box(55,10,350,['Emicampo visivo sinistro'])+arrow(230,55,230,95)+
 box(12,100,210,['Retina nasale','occhio sinistro'])+box(238,100,210,['Retina temporale','occhio destro'])+
 arrow(115,166,115,220)+arrow(343,166,343,220)+
 box(12,225,210,['Incrocia nel chiasma'])+box(238,225,210,['Non incrocia'])+
 arrow(115,268,230,310)+arrow(343,268,230,310)+box(55,315,350,['Tratto ottico destro → NGL → V1']),
 'L’emicampo sinistro raggiunge la retina nasale dell’occhio sinistro e quella temporale del destro. Solo le fibre nasali incrociano: entrambe le vie raggiungono l’emisfero destro.',
 'Schema funzionale del solo emicampo sinistro. NGL: nucleo genicolato laterale; V1: corteccia visiva primaria. L’altro emicampo segue l’organizzazione speculare.');
 if(kind==='neuro-on-off')return wrap(kind,'Centro ON: conta dove cade la luce',315,
 [85,230,375].map((x,i)=>`<circle cx="${x}" cy="105" r="59" fill="${i!==0?'var(--primary)':'var(--soft)'}" stroke="currentColor"/><circle cx="${x}" cy="105" r="25" fill="${i!==1?'var(--primary)':'var(--soft)'}" stroke="currentColor"/><text x="${x}" y="111" text-anchor="middle">+</text><text x="${x}" y="67" text-anchor="middle">−</text><text x="${x}" y="196" text-anchor="middle">${['Centro','Periferia','Uniforme'][i]}</text><text x="${x}" y="225" text-anchor="middle">${['Luce → ↑','Luce → ↓','Compensazione'][i]}</text>`).join('')+
 '<text x="230" y="277" text-anchor="middle">Centro OFF: segni invertiti</text>',
 'Campo recettivo centro ON e periferia antagonista. Luce al centro aumenta la scarica, luce periferica la riduce, luce uniforme produce antagonismo.',
 'I segni indicano l’effetto funzionale della luce sulla scarica gangliare, non cariche elettriche. La risposta uniforme non deve essere esattamente zero.');
 if(kind==='neuro-riflesso')return wrap(kind,'Stiramento e inibizione reciproca',405,
 box(80,8,300,['Stiramento del muscolo'])+arrow(230,51,230,87)+box(80,92,300,['Fuso → afferenza Ia'])+
 arrow(230,135,115,186)+arrow(230,135,345,186)+
 box(10,191,210,['Motoneurone α','del muscolo stirato'])+box(240,191,210,['Interneurone','inibitorio'])+
 arrow(115,257,115,310,'+')+arrow(345,257,345,310,'−')+
 box(10,315,210,['Contrazione'])+box(240,315,210,['Minore attivazione','dell’antagonista']),
 'Il fuso attiva tramite Ia il motoneurone del muscolo stirato e un interneurone che inibisce il motoneurone antagonista.',
 'La branca eccitatoria sul motoneurone è monosinatica; quella di inibizione reciproca comprende un interneurone. Il fuso rileva lunghezza e variazioni, non è l’organo tendineo del Golgi.');
 if(kind==='neuro-nmda')return wrap(kind,'Due condizioni per aprire la via NMDA',370,
 box(15,10,205,['Glutammato','presinaptico'])+box(240,10,205,['Depolarizzazione','postsinaptica'])+
 arrow(115,76,230,125)+arrow(345,76,230,125)+box(65,130,330,['Legame del trasmettitore','e rimozione del blocco Mg²⁺'])+
 arrow(230,196,230,240)+box(65,245,330,['Ingresso Ca²⁺ → segnali','che modificano la sinapsi']),
 'Il glutammato e la depolarizzazione postsinaptica convergono: il blocco da magnesio viene rimosso e il recettore NMDA permette ingresso di calcio.',
 'Schema di un meccanismo di induzione del potenziamento a lungo termine. La depolarizzazione può essere favorita da recettori AMPA. Non tutte le forme di apprendimento usano soltanto questo meccanismo.');
 if(kind==='neuro-dopamina')return wrap(kind,'Via diretta e indiretta: seguire i segni',490,
 box(15,5,205,['Dopamina → D1','facilita la via diretta'])+box(240,5,205,['Dopamina → D2','riduce la via indiretta'])+
 arrow(115,71,115,112)+arrow(345,71,345,112)+
 box(15,117,205,['Striato inibisce','di più GPi/SNr'])+box(240,117,205,['Meno inibizione','su GPe'])+
 arrow(345,183,345,222)+box(240,227,205,['GPe frena STN','STN eccita meno GPi'])+
 arrow(115,183,115,335)+arrow(345,293,345,335)+box(45,340,370,['GPi/SNr inibiscono meno il talamo'])+
 arrow(230,383,230,420)+box(45,425,370,['Più facilitazione talamocorticale']),
 'La dopamina facilita la via diretta tramite D1 e riduce la via indiretta tramite D2. Entrambi gli effetti possono ridurre il freno pallidale sul talamo.',
 'Modello didattico semplificato: GPe/GPi = pallido esterno/interno; STN = nucleo subtalamico; SNr = sostanza nera reticolata. D2 postsinaptico nello striato è distinto dall’autorecettore D2 sul neurone dopaminergico.');
 if(kind==='ricerca-confronti')return wrap(kind,'Confrontare i cambiamenti, non due asterischi',335,
 '<path d="M65 35 V245 H415" fill="none" stroke="currentColor"/><text x="70" y="280">Prima</text><text x="355" y="280">Dopo</text><path d="M95 110 L370 110" stroke="currentColor" stroke-width="3" stroke-dasharray="8 5"/><path d="M95 110 L370 205" stroke="var(--green)" stroke-width="4"/><text x="275" y="88">Gruppo B</text><text x="275" y="235">Gruppo A</text><text x="230" y="320" text-anchor="middle">Confronto: ΔA − ΔB</text>',
 'Esempio inventato: A diminuisce fra prima e dopo, B rimane stabile. Il contrasto è la differenza fra i due cambiamenti.',
 'Dati inventati, senza scala quantitativa: non è il grafico originale di un articolo. Per concludere che i cambiamenti differiscono serve il confronto fra gruppi, con incertezza; significativo in A e non in B non basta.');
 if(kind==='bio-frazioni')return wrap(kind,'Il surnatante passa alla centrifugazione successiva',440,
 [0,1,2,3].map((i)=>box(12,12+i*102,210,[["1.000 × g · 10 min","20.000 × g · 20 min","80.000 × g · 1 h","150.000 × g · 3 h"][i],'Centrifugazione'])+box(248,12+i*102,200,[["Nuclei e detriti","Mitocondri e altri","Vescicole","Ribosomi e complessi"][i],'Pellet'])+`<path d="M222 ${45+i*102} H248" stroke="currentColor"/>`+(i<3?arrow(115,78+i*102,115,110+i*102):'')).join(''),
 'Quattro centrifugazioni successive: si conserva il pellet e si centrifuga il surnatante con condizioni più intense. Le frazioni sono arricchite, non necessariamente pure.',
 'Condizioni illustrative del protocollo studiato. Dopo l’ultimo passaggio molte proteine solubili restano nel surnatante. Il gradiente di densità può raffinare la separazione.');
 if(kind==='bio-torsione'){
  const points=Array.from({length:121},(_,i)=>{let deg=i*3;return `${60+deg*.95},${230-150*(1+Math.cos(deg*Math.PI/60))/2}`;}).join(' ');
  return wrap(kind,'Etano: profilo torsionale ideale',330,
  '<path d="M60 50 V230 H415" fill="none" stroke="currentColor"/><text x="14" y="40">kJ/mol</text><text x="14" y="85">12,1</text><text x="38" y="235">0</text>'+`<polyline points="${points}" fill="none" stroke="var(--green)" stroke-width="3"/>`+
  [0,60,120,180,240,300,360].map(d=>`<text x="${60+d*.95}" y="257" text-anchor="middle">${d}°</text>`).join('')+'<text x="230" y="294" text-anchor="middle">Minimi: sfalsata · Massimi: eclissata</text>',
  'Profilo ideale periodico con massimi a 0, 120, 240 e 360 gradi, minimi a 60, 180 e 300 gradi e barriera circa 12,1 kilojoule per mole.',
  'Curva ideale ricostruita per leggere angoli e barriera, non nuovi dati sperimentali. Ruotare C–C cambia conformazione senza cambiare connettività.');
 }
 if(kind==='bio-stereoisomeri')return wrap(kind,'Due centri stereogenici non equivalenti',300,
 box(15,15,170,['(R,R)'])+box(275,15,170,['(S,S)'])+box(15,180,170,['(R,S)'])+box(275,180,170,['(S,R)'])+
 '<path d="M185 36 H275 M185 201 H275" stroke="var(--green)" stroke-width="3"/><path d="M100 58 V180 M360 58 V180" stroke="currentColor" stroke-dasharray="6 5"/><text x="230" y="91" text-anchor="middle">Orizzontale: enantiomeri</text><text x="230" y="126" text-anchor="middle">Verticale: diastereoisomeri</text><text x="230" y="273" text-anchor="middle">Controllare sempre eventuali simmetrie</text>',
 'Per due centri non equivalenti senza forme meso, RR e SS sono enantiomeri, RS e SR sono enantiomeri. Cambiare un solo centro dà diastereoisomeri.',
 'Tabella di relazioni, non formula strutturale. 2ⁿ è un massimo: una simmetria interna può ridurre il numero di stereoisomeri distinti.');
 return '';
}
