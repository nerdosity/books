import { dataControls, dataOptions, dataView, gradeDataLab } from './data-lab.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:2}).format(v);
const label=(lab,id)=>lab.fields.find(f=>f.id===id)?.label||id;
function table(lab,rows){
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Dati del laboratorio, tabella scorrevole"><table><caption>${esc(lab.title)} · ${rows.length} righe</caption><thead><tr>${lab.fields.map(f=>`<th scope="col">${esc(f.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr data-record="${esc(r.id)}">${lab.fields.map((f,i)=>`<${i?'td':'th scope="row"'}>${esc(f.type==='number'?num(r[f.id]):r[f.id])}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function dataChart(lab,c,rows){
  if(!rows.length)return '<p>Nessuna riga soddisfa i filtri: il grafico è vuoto. Rivedi le condizioni.</p>';
  if(c.chart==='scatter'&&lab.fields.find(f=>f.id===c.x)?.type!=='number')return '<p>Per i punti XY scegli una variabile numerica anche sull’asse X. Le categorie si confrontano con le colonne.</p>';
  const maxY=Math.max(1,...rows.map(r=>r[c.y]))*1.15,maxX=Math.max(1,...rows.map(r=>r[c.x]).filter(Number.isFinite))*1.1;
  const x=(r,i)=>c.chart==='scatter'?90+r[c.x]/maxX*630:90+(i+.5)*630/rows.length;
  const y=r=>310-r[c.y]/maxY*250;
  const points=rows.map((r,i)=>`${x(r,i)},${y(r)}`).join(' ');
  const marks=rows.map((r,i)=>c.chart==='columns'
    ?`<rect x="${x(r,i)-Math.min(50,400/rows.length)/2}" y="${y(r)}" width="${Math.min(50,400/rows.length)}" height="${310-y(r)}"><title>${esc(r[c.x])}: ${num(r[c.y])}</title></rect>`
    :`<circle cx="${x(r,i)}" cy="${y(r)}" r="5"><title>${esc(r.id)}: ${esc(r[c.x])}; ${num(r[c.y])}</title></circle>`).join('');
  const xticks=c.chart==='scatter'?Array.from({length:5},(_,i)=>`<text x="${90+i*630/4}" y="335" text-anchor="middle">${num(i*maxX/4)}</text>`).join('')
    :rows.map((r,i)=>`<text x="${x(r,i)}" y="335" text-anchor="middle">${esc(r[c.x])}</text>`).join('');
  return `<p class="table-scroll-hint no-print">Se il grafico non entra nello schermo, scorri verso destra; da tastiera selezionalo e usa le frecce. I valori sono anche nella tabella.</p><div class="data-chart-scroll" tabindex="0" role="region" aria-label="Grafico scorrevole"><svg class="data-chart" viewBox="0 0 800 390" role="img" aria-label="${esc(label(lab,c.y))} rispetto a ${esc(label(lab,c.x))}; ${rows.length} osservazioni; assi con origine zero"><title>${esc(lab.title)}</title>
    <text x="90" y="25">${esc(label(lab,c.y))}</text>
    ${Array.from({length:5},(_,i)=>`<line class="data-grid" x1="90" y1="${310-i*250/4}" x2="720" y2="${310-i*250/4}"/><text x="78" y="${316-i*250/4}" text-anchor="end">${num(i*maxY/4)}</text>`).join('')}
    <path class="data-axis" d="M90 60 V310 H720"/>
    ${c.chart==='line'?`<polyline class="data-line" points="${points}"/>`:''}<g class="data-marks">${marks}</g>${xticks}
    <text x="405" y="375" text-anchor="middle">${esc(label(lab,c.x))}${c.chart==='line'?' · categorie equidistanti':''}</text></svg></div>
    <p class="reading-note">${c.scope==='all'?'Grafico su tutte le righe originali, nell’ordine iniziale.':'Grafico sulle righe visibili, nell’ordine della tabella.'} ${c.chart==='scatter'?'Le distanze orizzontali rappresentano differenze numeriche.':'Ogni riga occupa una posizione equidistante; non vengono calcolati raggruppamenti o medie.'} Dati inventati; valori disponibili anche nella tabella.</p>`;
}
function preview(lab,c){
  const {visible,chartRows}=dataView(lab,c),total=visible.reduce((s,r)=>s+r[lab.filterField],0);
  return `<p role="status">${visible.length} righe visibili su ${lab.records.length}. Somma visibile di ${esc(label(lab,lab.filterField))}: ${num(total)}. Media visibile: ${visible.length?num(total/visible.length):'non definita'}.</p>${table(lab,visible)}${dataChart(lab,c,chartRows)}${c.scope==='all'&&visible.length!==lab.records.length?`<details><summary>Dati originali usati dal grafico</summary>${table(lab,lab.records)}</details>`:''}`;
}
const select=(lab,c,key,title)=>`<label>${title}<select data-table-control="${key}">${dataOptions(lab,key).map(([v,t])=>`<option value="${esc(v)}" ${c[key]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
export function dataLabPage(lab,r){
  const c=dataControls(lab,r),last=r.checks.at(-1);
  const threshold=r.controls?.threshold??c.threshold;
  const invalidThreshold=threshold!==''&&!/^-?\d+(?:[.,]\d+)?$/.test(threshold);
  return `<div id="sheet-lab" data-lab="${lab.id}" class="data-lab"><a href="#lesson/${lab.unit}">← Lezione e spiegazioni</a><header class="page-heading"><span class="eyebrow">INFORMATICA · LABORATORIO DATI</span><h1>${esc(lab.title)}</h1><p>${esc(lab.description)}</p></header>
    <p>Imposta i controlli: tabella e grafico cambiano subito. Le scelte, il report e le verifiche si salvano sul dispositivo e nel backup. I dati di partenza sono inventati e restano integri.</p>
    <h2>Consegne</h2><ol>${lab.tasks.map(t=>`<li>${esc(t.prompt)} <button data-action="sheet-help" data-ref="${t.help}">Aiuto: ${esc(t.id)}</button></li>`).join('')}</ol>
    <fieldset class="data-controls"><legend>1 · Ordina le righe complete</legend>${select(lab,c,'sort','Primo criterio')}${select(lab,c,'direction','Verso del primo criterio')}${select(lab,c,'then','A parità, secondo criterio')}${select(lab,c,'thenDirection','Verso del secondo criterio')}</fieldset>
    <fieldset class="data-controls"><legend>2 · Filtra le righe</legend>${select(lab,c,'group',label(lab,lab.groupField))}${select(lab,c,'operator',`Confronto su ${esc(label(lab,lab.filterField))}`)}<label>Soglia numerica (vuota: nessuna)<input data-table-control="threshold" value="${esc(threshold)}" maxlength="30" inputmode="decimal"></label>${select(lab,c,'logic','Combina le condizioni attive')}</fieldset>
    <fieldset class="data-controls"><legend>3 · Costruisci il grafico</legend>${select(lab,c,'chart','Tipo di grafico')}${select(lab,c,'x','Asse X')}${select(lab,c,'y','Asse Y')}${select(lab,c,'scope','Righe da rappresentare')}</fieldset>
    <p class="reading-note">La soglia vuota disattiva il filtro numerico. AND/OR combina solo condizioni attive. A parità di entrambi i criteri resta l’ordine iniziale. Il simulatore usa numeri non negativi e una serie; non importa file né sostituisce tutte le funzioni di Calc.</p><p id="data-input-status" role="status">${invalidThreshold?'Soglia non valida: correggi il numero. Il filtro numerico è disattivato.':''}</p>
    <section id="data-preview" aria-label="Risultato delle operazioni">${preview(lab,c)}</section>
    <div class="row"><button class="primary" data-action="sheet-check">Verifica le operazioni</button><button data-action="sheet-solution">Mostra soluzione ragionata</button></div>
    <p class="reading-note">Si verificano i criteri richiesti nelle consegne, non solo un risultato casualmente uguale. La scelta degli assi è riferita alla domanda posta. Aiuti e soluzioni rendono assistite le verifiche successive.</p>
    <div id="sheet-feedback" aria-live="polite">${last?`Ultima verifica salvata: ${last.correct}/${last.total} operazioni · ${last.assisted?'assistita':'senza aiuto'}. Dopo una modifica verifica di nuovo.`:''}</div><div id="sheet-help"></div>
    <section><h2>Comunica il risultato</h2><p>${esc(lab.report.prompt)}</p><label>Il tuo report<textarea id="sheet-report" maxlength="10000">${esc(r.report)}</textarea></label><p class="reading-note">Autoconfronto con criteri, senza voto automatico al testo.</p><button data-action="sheet-report-model">Confronta il report</button><div id="sheet-report-model"></div></section>
    <h2>Verifiche salvate</h2><ul>${r.checks.slice(-10).reverse().map(t=>`<li>${esc(new Date(t.at).toLocaleString('it-IT'))}: ${t.correct}/${t.total} operazioni · ${t.assisted?'assistita':'senza aiuto'}</li>`).join('')||'<li>Nessuna verifica.</li>'}</ul><p class="reading-note">Si conservano fino a 100 verifiche, separate dai voti dei quiz.</p></div>`;
}
export function updateDataLab(lab,r,control){
  r.controls??={};r.controls[control.dataset.tableControl]=control.value;
  const invalid=control.dataset.tableControl==='threshold'&&control.value!==''&&!/^-?\d+(?:[.,]\d+)?$/.test(control.value);
  document.getElementById('data-input-status').textContent=invalid?'Soglia non valida: scrivi un numero, per esempio 30 o 30,5. Il filtro numerico resta disattivato finché la soglia non è valida.':'';
  document.getElementById('data-preview').innerHTML=preview(lab,dataControls(lab,r));
  document.getElementById('sheet-feedback').textContent='Operazioni modificate: verifica di nuovo per registrare il risultato.';
}
export function dataLabAction(action,lab,r){
  if(action==='sheet-check'){
    if(r.controls?.threshold&&!/^-?\d+(?:[.,]\d+)?$/.test(r.controls.threshold)){
      document.getElementById('sheet-feedback').textContent='Correggi la soglia numerica prima della verifica.';return;
    }
    const result=gradeDataLab(lab,r);
    r.checks.push({at:new Date().toISOString(),correct:result.correct,total:result.total,assisted:r.assisted});r.checks=r.checks.slice(-100);
    document.getElementById('sheet-feedback').innerHTML=`<h2>${result.correct}/${result.total} operazioni corrette ${r.assisted?'· con aiuto':''}</h2><ul>${result.results.map(t=>`<li><strong>${esc(t.id)}: ${t.correct?'corretta':'da rivedere'}.</strong> ${esc(t.message)} ${t.correct?'':`<button data-action="sheet-help" data-ref="${t.help}">Ripassa questo passaggio</button>`}</li>`).join('')}</ul>`;
  }
  if(action==='sheet-solution'){
    r.assisted=true;document.getElementById('sheet-help').innerHTML=`<h2>Soluzione ragionata</h2>${dataLabSolution(lab)}`;
  }
}
function dataLabSolution(lab){
  const c=Object.assign({},lab.defaults,...lab.tasks.map(t=>t.expected));
  return `<ol>${lab.tasks.map(t=>`<li>${esc(t.explanation)}</li>`).join('')}</ol>${preview(lab,c)}`;
}
export function dataLabPrint(lab,solutions){
  return `<article class="lesson data-print"><h2>Laboratorio: ${esc(lab.title)}</h2>${solutions?`${dataLabSolution(lab)}<h3>Report: esempio ragionato</h3><p>${esc(lab.report.model)}</p><ul>${lab.report.criteria.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:`<p>${esc(lab.description)}</p>${table(lab,lab.records)}<ol>${lab.tasks.map(t=>`<li>${esc(t.prompt)}</li>`).join('')}</ol><p>${esc(lab.report.prompt)}</p><p>Scelte, ordine delle righe e report: __________________________________</p>`}</article>`;
}
