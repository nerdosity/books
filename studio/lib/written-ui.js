import {WRITTEN_PARTS,WRITTEN_RATINGS,newWrittenRecord,writtenSummary} from './written.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function writtenLinks(course,exam){
 const papers=(course.writtenPapers||[]).filter(p=>p.exam===exam);
 const current=course.exams.find(e=>e.id===exam)?.assessmentNote;
 return papers.length?`<section class="callout no-print"><h2>${current?'Preparati all’esame':'Preparati allo scritto'}</h2>${current?`<p>${esc(current)}</p><p><a href="#lesson/anat-esposizione">Allenati all’orale: tracce e criteri →</a></p>`:''}<details><summary>Esercitazioni scritte · formato storico</summary><p>Dieci risposte brevissime e due elaborati per traccia. Scrivi, confronta e individua cosa ripassare.</p><ul>${papers.map(p=>`<li><a href="#written/${p.id}">${esc(p.title)}</a></li>`).join('')}</ul></details></section>`:'';
}
export function writtenSummaryHTML(paper,record){
 return `<h2>Il tuo confronto</h2><p>Valutazioni assegnate da te, senza voto automatico. Considera separatamente tutte le parti.</p><ul>${writtenSummary(paper,record).map(s=>`<li><strong>${WRITTEN_PARTS[s.part]}</strong>: ${s.answered}/${s.total} risposte scritte; ${s.reviewed} confrontate, ${s.solid} indicate solide.</li>`).join('')}</ul>`;
}
export function writtenPage(course,paper,record,helpHTML){
 if(!paper)return '<h1>Traccia non trovata</h1><a href="#learn">Torna agli esami</a>';
 const r=record||newWrittenRecord(),source=course.sources.find(s=>s.id===paper.sourceId);
 return `<div id="written-paper" data-paper="${paper.id}"><a class="no-print" href="#exam/${paper.exam}">← Torna all’esame</a>
 <header class="page-heading"><span class="eyebrow">SIMULAZIONE SCRITTA · ${paper.minutes} MINUTI CONSIGLIATI</span><h1>${esc(paper.title)}</h1><p>${esc(paper.instructions)}</p></header>
 <p class="reading-note">Formato ispirato al <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">syllabus ${esc(paper.referenceYear)}</a>. Le domande sono esercitazioni originali, non prove ufficiali. ${esc(course.exams.find(e=>e.id===paper.exam)?.assessmentNote||'Le modalità dell’anno corrente non sono confermate.')}</p>
 <div class="callout"><strong>Come usarla</strong><p>Dedica circa 20 minuti alle risposte brevi, 30 a ciascun elaborato e 10 alla revisione. Il tempo è una guida: puoi interrompere e riprendere. Risposte e autovalutazioni si salvano mentre lavori e sono incluse nel backup.</p><p>Scrivi prima senza consultare gli aiuti. “Confronta” apre modello, criteri e spiegazioni interne: resta annotato che li hai consultati. Modificando una risposta, la sua autovalutazione viene azzerata per invitarti a un nuovo confronto.</p></div>
 <div class="row no-print"><button data-action="print">Stampa questa traccia</button></div>
 <section id="written-summary" class="callout">${writtenSummaryHTML(paper,r)}</section>
 ${Object.entries(WRITTEN_PARTS).map(([part,title])=>`<section class="written-part"><h2>${title}</h2>${paper.questions.filter(q=>q.part===part).map(q=>{
  const n=paper.questions.indexOf(q)+1,shown=r.revealed.includes(q.id);
  return `<article class="question written-question ${part==='istologia'?'written-short':'written-long'}" id="written-${q.id}"><h3>${n}. ${esc(q.prompt)}</h3>
   <label class="no-print" for="draft-${q.id}">${part==='istologia'?'La tua risposta breve':'Il tuo elaborato'}</label>
   <textarea class="no-print" id="draft-${q.id}" data-written-answer="${q.id}" maxlength="12000" rows="${part==='istologia'?3:10}">${esc(r.answers[q.id]||'')}</textarea>
   <p class="written-print-answer">${esc(r.answers[q.id]||'Risposta: ______________________________________________________________')}</p>
   <p class="reading-note">${part==='istologia'?'Bastano termini precisi e una o due frasi.':'Costruisci una descrizione ordinata: sede, struttura, rapporti e funzione.'}</p>
   ${shown?`<details class="written-solution no-print" open><summary>Modello e ripasso · consultati</summary><h4>Una risposta possibile</h4><p>${esc(q.answer)}</p><h4>Criteri di confronto</h4><ul>${q.criteria.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>Non serve ripetere le stesse parole: verifica correttezza, collegamenti e terminologia. Scegli “Risposta solida” se soddisfi tutti i criteri senza errori di concetto; “In parte” se manca un passaggio; “Da ripassare” se il collegamento essenziale è errato o non sai spiegarlo.</p><label>Come valuti la tua risposta?<select data-written-rating="${q.id}"><option value="">Da confrontare</option>${Object.entries(WRITTEN_RATINGS).map(([v,t])=>`<option value="${v}" ${r.ratings[q.id]===v?'selected':''}>${t}</option>`).join('')}</select></label><p data-written-status="${q.id}" role="status"></p>
   ${q.refs.map(ref=>`<details><summary>Ripassa: ${esc(course.units.find(u=>u.id===ref.split('/')[0]).sections.find(s=>s.id===ref.split('/')[1]).title)}</summary>${helpHTML(ref)}<a href="#lesson/${ref}">Apri la lezione completa →</a></details>`).join('')}</details>`:`<button class="no-print" data-action="written-reveal" data-question="${q.id}">Confronta la risposta ${n}</button>`}
   </article>`;
 }).join('')}</section>`).join('')}
 <details class="no-print"><summary>Soluzioni per la stampa</summary><p>Questa stampa include tutti i modelli e annota gli aiuti come consultati. Per stampare soltanto domande e risposte usa il pulsante in alto.</p><button data-action="written-print-solutions">Mostra e stampa tutte le soluzioni</button></details>
 </div>`;
}
export function writtenPrintSolutions(paper){
 return `<section class="written-print-solutions"><h1>Soluzioni e criteri · ${esc(paper.title)}</h1>${paper.questions.map((q,i)=>`<article><h2>${i+1}. ${esc(q.prompt)}</h2><p>${esc(q.answer)}</p><ul>${q.criteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></article>`).join('')}</section>`;
}
