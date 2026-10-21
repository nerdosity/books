import {evaluateCell,gradeSheet,copyFormula,sheetRange} from './sheet.js';
import {dataLabPage,dataLabAction,dataLabPrint} from './data-lab-ui.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=result=>result.error || (result.value===null?'vuota':typeof result.value==='number'
  ?new Intl.NumberFormat('it-IT',{maximumFractionDigits:4}).format(result.value):String(result.value));
export function newSheetRecord() {return {cells:{},report:'',assisted:false,checks:[]};}
export function sheetLinks(labs) {
  return labs.length?`<section class="callout no-print"><h2>Laboratori pratici</h2><p>Applica i passaggi studiati e verifica i risultati nella pagina. Il lavoro entra nel backup dei progressi.</p><ul>${labs.map(l=>`<li><a href="#lab/${l.id}">${escape(l.title)}</a></li>`).join('')}</ul></section>`:'';
}
export function sheetPage(lab,record,helpHTML) {
  if(!lab)return '<h1>Laboratorio non trovato</h1><a href="#exam/informatica">Torna a Informatica</a>';
  if(lab.kind==='data')return dataLabPage(lab,record||newSheetRecord());
  const r=record||newSheetRecord(),grid={...lab.cells,...Object.fromEntries(lab.tasks.map(t=>[t.cell,r.cells[t.cell]||'']))},last=r.checks.at(-1);
  return `<div id="sheet-lab" data-lab="${lab.id}"><a href="#lesson/${lab.unit}">← Lezione e spiegazioni</a>
    <header class="page-heading"><span class="eyebrow">INFORMATICA · LABORATORIO LOCALE</span><h1>${escape(lab.title)}</h1><p>${escape(lab.description)}</p></header>
    <p>Le celle da completare sono modificabili. Scrivi la formula e premi Tab per vedere il risultato. I dati forniti sono fissi; “Verifica” prova anche variazioni dei dati senza cambiare il tuo foglio.</p>
    <p class="reading-note">Usa ; fra gli argomenti e virgola o punto per i decimali. Funzioni: SOMMA, MEDIA, MIN, MAX, CONTA.NUMERI, SE (anche SUM, AVERAGE, COUNT, IF). Sono disponibili + − * / ^, parentesi, confronti e %. Questo è un foglio didattico ridotto: non apre file Excel e non riproduce tutte le funzioni di Calc.</p>
    <div class="sheet-scroll" tabindex="0" role="region" aria-label="Foglio scorrevole"><table class="sheet-grid"><caption>${escape(lab.title)} · ${lab.rows} righe</caption><thead><tr><th scope="col">Riga</th>${Array.from({length:lab.columns},(_,c)=>`<th scope="col">${String.fromCharCode(65+c)}</th>`).join('')}</tr></thead><tbody>
    ${Array.from({length:lab.rows},(_,i)=>`<tr><th scope="row">${i+1}</th>${Array.from({length:lab.columns},(_,c)=>{
      const key=String.fromCharCode(65+c)+(i+1),task=lab.tasks.find(t=>t.cell===key),raw=grid[key]||'';
      return `<td class="${task?'sheet-editable':''}">${task?`<input aria-label="Cella ${key}" data-sheet-cell="${key}" value="${escape(raw)}" maxlength="500" autocomplete="off" spellcheck="false"><output data-sheet-result="${key}">${escape(format(evaluateCell(grid,key)))}</output>`:
      `<span>${escape(raw.startsWith("'")?raw.slice(1):raw)}</span>${raw.startsWith("'")?'<small>testo, non numero</small>':''}`}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>
    ${lab.copy.from!==lab.copy.to?`<form id="sheet-copy" class="row"><label>Copia dalla cella<input name="from" value="${lab.copy.from}" maxlength="4" required></label><label>Fino alla cella (stessa colonna)<input name="to" value="${lab.copy.to}" maxlength="4" required></label><button>Copia verso il basso</button></form>`:''}
    <p id="sheet-status" role="status"></p>
    <h2>Consegne</h2><ol>${lab.tasks.map(t=>`<li><strong>${t.cell}</strong>: ${escape(t.prompt)} <button data-action="sheet-help" data-ref="${t.help}">Aiuto per ${t.cell}</button></li>`).join('')}</ol>
    <div class="row"><button class="primary" data-action="sheet-check">Verifica il foglio</button><button data-action="sheet-solution">Mostra soluzione ragionata</button></div>
    <p class="reading-note">La verifica controlla valori e comportamento su variazioni predefinite, non l’equivalenza matematica di qualunque formula. Sono ammesse formule diverse se superano questi controlli. Un aiuto o la soluzione rendono le verifiche successive assistite.</p>
    <div id="sheet-feedback" aria-live="polite">${last?`<p>Ultima verifica salvata: ${last.correct}/${last.total} celle · ${last.assisted?'con aiuto':'senza aiuto'} · ${escape(new Date(last.at).toLocaleString('it-IT'))}. Modificando il foglio, verifica di nuovo.</p>`:''}</div>
    <div id="sheet-help"></div>
    <section><h2>Comunica il risultato</h2><p>${escape(lab.report.prompt)}</p><label>Il tuo breve report<textarea id="sheet-report" maxlength="10000">${escape(r.report)}</textarea></label>
    <p class="reading-note">Il report si salva automaticamente e si valuta con i criteri qui sotto; non riceve un voto automatico.</p>
    <button data-action="sheet-report-model">Confronta il report</button><div id="sheet-report-model"></div></section>
    <section><h2>Verifiche di questo laboratorio</h2><ul>${r.checks.slice(-10).reverse().map(x=>`<li>${escape(new Date(x.at).toLocaleString('it-IT'))}: ${x.correct}/${x.total} · ${x.assisted?'assistita':'senza aiuto'}</li>`).join('')||'<li>Nessuna verifica registrata.</li>'}</ul><p class="reading-note">Il backup conserva fino a 100 verifiche per laboratorio. Questo registro è distinto dai quiz e non certifica un voto d’esame.</p></section></div>`;
}
export function refreshSheet(lab,record) {
  const grid={...lab.cells,...Object.fromEntries(lab.tasks.map(t=>[t.cell,record.cells[t.cell]||'']))};
  for(const output of document.querySelectorAll('[data-sheet-result]')){
    const result=evaluateCell(grid,output.dataset.sheetResult);
    output.textContent=format(result);output.classList.toggle('sheet-error',!!result.error);output.title=result.message||'Valore calcolato';
  }
}
export function sheetPrint(labs,solutions=false) {
  return labs.map(l=>l.kind==='data'?dataLabPrint(l,solutions):`<article class="lesson sheet-print"><h2>Laboratorio: ${escape(l.title)}</h2>${solutions?
    `<ol>${l.tasks.map(t=>`<li>${t.cell}: <code>${escape(t.formula)}</code> — ${escape(t.explanation)}</li>`).join('')}</ol><h3>Report: esempio ragionato</h3><p>${escape(l.report.model)}</p>`:
    `<p>${escape(l.description)}</p><div class="table-wrap"><table><thead><tr><th>Riga</th>${Array.from({length:l.columns},(_,c)=>`<th>${String.fromCharCode(65+c)}</th>`).join('')}</tr></thead><tbody>${Array.from({length:l.rows},(_,i)=>`<tr><th>${i+1}</th>${Array.from({length:l.columns},(_,c)=>`<td>${escape(l.cells[String.fromCharCode(65+c)+(i+1)]||'________')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><ol>${l.tasks.map(t=>`<li>${t.cell}: ${escape(t.prompt)}</li>`).join('')}</ol><p>${escape(l.report.prompt)}</p><p>Il tuo report: __________________________________________________</p>`}</article>`).join('');
}
export function sheetProgress(labs,records={}) {
  const started=labs.filter(l=>records[l.id]);
  return started.length?`<section><h2>Laboratori di Informatica</h2><ul>${started.map(l=>{
    const r=records[l.id],last=r.checks.at(-1);
    return `<li><a href="#lab/${l.id}">${escape(l.title)}</a>: ${last?`${last.correct}/${last.total} ${l.kind==='data'?'operazioni':'celle'} nell’ultima verifica · ${last.assisted?'assistita':'senza aiuto'}`:'lavoro iniziato, ancora da verificare'}</li>`;
  }).join('')}</ul></section>`:'';
}
export function fillSheetDown(lab,record,from,to) {
  const cells=sheetRange(from,to);
  if(cells.some(c=>c[0]!==cells[0][0])||cells.length<2)throw new Error('Scegli due celle nella stessa colonna, dall’alto verso il basso.');
  if(cells.some(c=>!lab.tasks.some(t=>t.cell===c)))throw new Error('Puoi copiare soltanto nelle celle da completare, senza sovrascrivere i dati forniti.');
  const raw=record.cells[cells[0]]||'';
  if(!raw.trim().startsWith('='))throw new Error('Scrivi prima una formula nella cella iniziale.');
  // Prepare every destination before changing the record.
  const copies=Object.fromEntries(cells.slice(1).map(c=>[c,copyFormula(raw,cells[0],c)]));
  Object.assign(record.cells,copies);
  for(const [cell,value] of Object.entries(copies))document.querySelector(`[data-sheet-cell="${cell}"]`).value=value;
  refreshSheet(lab,record);
}
export function sheetAction(action,lab,record,helpHTML,ref) {
  if(lab.kind==='data'&&['sheet-check','sheet-solution'].includes(action)){dataLabAction(action,lab,record);return;}
  if(action==='sheet-help'){
    if(!lab.tasks.some(t=>t.help===ref))return;
    record.assisted=true;document.getElementById('sheet-help').innerHTML=helpHTML(ref);
    document.getElementById('sheet-help').scrollIntoView({block:'nearest'});
  }
  if(action==='sheet-check'){
    const result=gradeSheet(lab,record.cells);
    record.checks.push({at:new Date().toISOString(),correct:result.correct,total:result.total,assisted:record.assisted});
    record.checks=record.checks.slice(-100);
    document.getElementById('sheet-feedback').innerHTML=`<h2>${result.correct}/${result.total} celle corrette ${record.assisted?'· con aiuto':''}</h2><ul>${result.results.map(x=>`<li><strong>${x.cell}: ${x.correct?'corretta':'da rivedere'}</strong>. ${escape(x.message)} ${x.correct?'':`<button data-action="sheet-help" data-ref="${x.help}">Ripassa il passaggio</button>`}</li>`).join('')}</ul>`;
  }
  if(action==='sheet-solution'){
    record.assisted=true;
    document.getElementById('sheet-help').innerHTML=`<h2>Soluzione commentata</h2><p>Confronta i riferimenti e il ragionamento, poi correggi tu le celle.</p><ol>${lab.tasks.map(t=>`<li><strong>${t.cell}</strong>: <code>${escape(t.formula)}</code><p>${escape(t.explanation)}</p></li>`).join('')}</ol>`;
  }
  if(action==='sheet-report-model'){
    record.assisted=true;
    document.getElementById('sheet-report-model').innerHTML=`<p>${escape(lab.report.model)}</p><ul>${lab.report.criteria.map(c=>`<li>${escape(c)}</li>`).join('')}</ul>`;
  }
}
