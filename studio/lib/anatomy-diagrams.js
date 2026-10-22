export const ANATOMY_DIAGRAMS=['anatomy-projections','anatomy-compartments','anatomy-reflex'];
export function anatomyDiagramHTML(kind){
 if(!ANATOMY_DIAGRAMS.includes(kind))return '';
 let title='',intro='',body='';
 if(kind==='anatomy-projections'){
  title='Gli stessi due punti, tre viste';
  intro='A è anteriore a B; hanno uguale quota e posizione laterale. Modello geometrico per allenare la profondità, non un preparato anatomico.';
  const panel=(name,svg,note)=>'<div class="anatomy-view"><h3>'+name+'</h3><svg viewBox="0 0 300 230" role="img" aria-label="'+note+'">'+svg+'</svg><p>'+note+'</p></div>';
  body='<div class="anatomy-views">'+
   panel('Vista anteriore','<path d="M45 185H260M150 195V30"/><text x="20" y="218">Destra</text><text x="210" y="218">Sinistra</text><text x="155" y="22">Superiore</text><circle cx="150" cy="115" r="22"/><text x="150" y="121" text-anchor="middle">A/B</text>','A e B si sovrappongono. La profondità non è leggibile da questa sola vista.')+
   panel('Vista laterale','<path d="M35 185H270M45 195V30"/><text x="10" y="218">Anteriore</text><text x="195" y="218">Posteriore</text><text x="50" y="22">Superiore</text><circle cx="95" cy="115" r="22"/><text x="95" y="121" text-anchor="middle">A</text><circle cx="220" cy="115" r="22"/><text x="220" y="121" text-anchor="middle">B</text>','La vista laterale separa A da B, conservando la stessa altezza.')+
   panel('Vista dai piedi','<path d="M35 115H270M150 205V25"/><text x="10" y="218">Destra</text><text x="210" y="218">Sinistra</text><text x="155" y="22">Anteriore</text><text x="155" y="197">Posteriore</text><circle cx="150" cy="65" r="22"/><text x="150" y="71" text-anchor="middle">A</text><circle cx="150" cy="160" r="22"/><text x="150" y="166" text-anchor="middle">B</text>','La profondità compare in verticale sul foglio; non è diventata altezza del corpo.')+'</div>';
 } else if(kind==='anatomy-compartments'){
  title='Torace: tenere distinti gli involucri';
  intro='Schema dei compartimenti, senza scala né profili d’organo: non rappresenta un singolo livello di sezione.';
  body='<div class="anatomy-compartments"><div><h3>Regione pleuropolmonare destra</h3><p>Parete → pleura parietale → spazio pleurico → pleura viscerale → polmone</p></div><div><h3>Mediastino</h3><p>Cuore nel pericardio; rapporti con grandi vasi, trachea ed esofago secondo il livello.</p></div><div><h3>Regione pleuropolmonare sinistra</h3><p>Polmone e suo rivestimento: il cuore non è nella cavità pleurica.</p></div></div><p class="anatomy-base">Inferiormente: diaframma · La destra anatomica è a sinistra per chi osserva anteriormente.</p>';
 } else {
  title='Riflesso: un circuito e le sue connessioni';
  intro='Modello del riflesso da stiramento. L’inibizione dell’antagonista aggiunge un interneurone; il controllo superiore modula il circuito.';
  body='<ol class="concept-flow"><li>Fuso: variazione della lunghezza muscolare</li><li>Afferenza: ganglio spinale e radice posteriore</li><li>Midollo: collegamento al motoneurone e circuiti interneuronali</li><li>Efferenza: radice anteriore e nervo periferico</li><li>Muscolo: risposta meccanica</li></ol><p class="anatomy-base">Non confondere radici, nervo misto e rami. Una via sensitiva cosciente prosegue verso centri superiori.</p>';
 }
 return '<figure class="anatomy-diagram" data-anatomy-diagram="'+kind+'"><figcaption><strong>'+title+'</strong></figcaption><p>'+intro+'</p>'+body+'</figure>';
}

