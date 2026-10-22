export const LAW_DIAGRAMS=['law-remedies','law-procedure','law-europe'];
const LAW_PLATES={
 'law-remedies':{
  title:'Contratto: dove nasce il problema?',
  intro:'Parti dai fatti e dal momento del problema. Le categorie non sono rimedi automaticamente applicabili.',
  paths:[
   ['Alla formazione','Manca un requisito o l’accordo è illecito?','Esamina la nullità','Non è il nome da dare a ogni contratto eseguito male.'],
   ['Alla formazione','Incapacità o consenso viziato?','Esamina l’annullabilità','Verifica requisiti e parte protetta; non basta il pentimento.'],
   ['Alla formazione','Pericolo o bisogno con squilibrio qualificato?','Esamina la rescissione','Il cattivo affare, da solo, non basta.'],
   ['Durante il rapporto','Inadempimento o sopravvenienza rilevante?','Esamina la risoluzione','Controlla gravità, imputabilità e presupposti del singolo rimedio.']
  ],
  note:'Controllo separato: un contratto valido può essere inefficace o avere effetti sospesi. Recesso, mutuo consenso e risarcimento sono istituti ulteriori, non sinonimi di invalidità.'
 },
 'law-procedure':{
  title:'Dalla domanda alla decisione',
  intro:'Una sequenza per orientarsi; i procedimenti speciali possono prevedere passaggi diversi.',
  paths:[
   ['1 · Avvio','Domanda o iniziativa d’ufficio','Chi è competente?','Individua responsabile, destinatari e termini applicabili.'],
   ['2 · Istruttoria','Fatti, requisiti e interessi','Che cosa deve essere accertato?','Raccogli documenti e apporti; applica partecipazione e accesso.'],
   ['3 · Decisione','Regole applicate ai fatti','Perché questa conclusione?','Motiva; considera il preavviso di rigetto quando previsto.'],
   ['4 · Efficacia e controllo','Comunicazioni e altri passaggi pertinenti','Quali effetti e quali tutele?','Non confondere firma, efficacia, esecuzione e scadenza dei ricorsi.']
  ],
  note:'Responsabile del procedimento e organo che adotta l’atto possono essere diversi. Il silenzio non ha sempre lo stesso significato e partecipare non garantisce l’accoglimento.'
 },
 'law-europe':{
  title:'Tre “Consigli”, due sistemi europei',
  intro:'Il nome simile non indica la stessa istituzione. Segui la riga, non una gerarchia fra tutti i riquadri.',
  paths:[
   ['Unione europea','Consiglio europeo','Capi di Stato o di governo','Definisce orientamenti e priorità politiche; non esercita funzione legislativa.'],
   ['Unione europea','Consiglio dell’Unione europea','Ministri degli Stati membri','Partecipa alla legislazione, generalmente con il Parlamento europeo.'],
   ['Organizzazione distinta dall’UE','Consiglio d’Europa','Cooperazione fra Stati','Sistema CEDU e convenzioni sullo sport. Non adotta direttive UE.']
  ],
  note:'Corte di giustizia UE → Lussemburgo, diritto UE. Corte europea dei diritti dell’uomo → Strasburgo, CEDU. TAS/CAS → arbitrato sportivo, sistema distinto da entrambi.'
 }
};
export function lawDiagramHTML(kind){
 const plate=LAW_PLATES[kind];if(!plate)return '';
 return '<figure class="law-diagram" data-law-diagram="'+kind+'"><figcaption><strong>'+plate.title+'</strong></figcaption><p class="law-intro">'+plate.intro+'</p><div class="law-paths">'+plate.paths.map(p=>'<div class="law-path"><span class="law-stage">'+p[0]+'</span><h3>'+p[1]+'</h3><p class="law-result">'+p[2]+'</p><p>'+p[3]+'</p></div>').join('')+'</div><p class="law-note">'+plate.note+'</p></figure>';
}

