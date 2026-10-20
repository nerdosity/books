export const VASCULAR_DIAGRAMS=['fetal-shunts'];
export function vascularDiagramHTML(kind) {
  if(kind!=='fetal-shunts')return '';
  const paths=[
    {name:'Dotto venoso',start:'Sangue dalla vena ombelicale',end:'Vena cava inferiore',
      note:'Evita una parte del letto sinusoidale epatico. Il fegato riceve comunque sangue.'},
    {name:'Forame ovale',start:'Atrio destro',end:'Atrio sinistro',
      note:'Il percorso prosegue nel ventricolo sinistro e nell’aorta ascendente.'},
    {name:'Dotto arterioso',start:'Via arteriosa polmonare',end:'Aorta discendente',
      note:'Devia una grande parte del flusso del ventricolo destro; una quota arriva ai polmoni.'}
  ];
  return `<figure class="vascular-diagram" data-vascular-diagram="fetal-shunts">
    <figcaption><strong>Prima della nascita: che cosa collega ogni shunt?</strong></figcaption>
    <div class="vascular-paths">${paths.map(p=>`<div class="vascular-path">
      <h3>${p.name}</h3>
      <ol aria-label="Direzione del passaggio attraverso ${p.name.toLowerCase()}">
        <li>${p.start}</li>
        <li class="vascular-crossing"><span aria-hidden="true">↓</span> ${p.name} <span aria-hidden="true">↓</span></li>
        <li>${p.end}</li>
      </ol><p>${p.note}</p>
    </div>`).join('')}</div>
    <p class="vascular-birth"><strong>Alla nascita:</strong> polmoni ventilati → resistenza polmonare ridotta → più ritorno all’atrio sinistro → pressione sinistra maggiore della destra → chiusura funzionale del forame ovale.</p>
    <p class="reading-note">Schema originale dei collegamenti e delle direzioni fetali, non una sezione anatomica né tre percorsi successivi. Non rappresenta le proporzioni di flusso. Il dotto arterioso si collega prossimalmente all’arteria polmonare sinistra; il dotto venoso è una via intraepatica. Le modifiche alla nascita non avvengono tutte nello stesso istante.</p>
  </figure>`;
}
