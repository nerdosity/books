import { makeQuestion, checkAnswer, expectedText, shuffled, sessionScore, reviewQueue, ENGINE_VERSION, fmt } from './lib/engine.js';
import { STORAGE_KEY, freshState, validateState, mergeState } from './lib/state.js';
import { validateContent } from './lib/validate.js';
import { unitsForExam, examsForUnit, selectDefinitions, programmeQuestions, mockQuestions } from './lib/curriculum.js';
import { audioSettingsHTML, audioPanelHTML, handleAudioClick, handleAudioSubmit, disposeAudioPlayers, bindAudioSettingsForm } from './lib/audio-ui.js';
import { newSheetRecord, sheetLinks, sheetPage, sheetAction, refreshSheet, fillSheetDown, sheetPrint, sheetProgress } from './lib/sheet-ui.js';
import { updateDataLab } from './lib/data-lab-ui.js';
import { physicsDemoHTML, updatePhysicsDemo } from './lib/physics-demos.js';
import { chemistryDiagramHTML } from './lib/chemistry-diagrams.js';
import { biologyDiagramHTML } from './lib/biology-diagrams.js';
import { vascularDiagramHTML } from './lib/vascular-diagrams.js';
import { newWrittenRecord, writeDraft, revealWritten, rateWritten } from './lib/written.js';
import { writtenLinks, writtenPage, writtenSummaryHTML, writtenPrintSolutions } from './lib/written-ui.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => crypto.randomUUID();
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const now = () => new Date().toISOString();
const displayDate = iso => new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
let course, exercises, library, definitions, state = freshState(), storageBlocked = false, corruptRaw = null;
const main = $('#main');
const systemAppearance = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const preference = state.settings.theme || 'system';
  const dark = preference === 'dark' || (preference === 'system' && systemAppearance.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#appearance').value = preference;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#000000' : '#f0f2f6';
}
systemAppearance.addEventListener('change', applyTheme);
function notice(message) {
  $('#notice').className = message ? 'status-message' : '';
  $('#notice').textContent = message;
}
function save() {
  if (storageBlocked) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { storageBlocked = true; notice('Il browser non riesce a salvare. Puoi continuare in questa scheda: esporta un backup prima di chiuderla.'); }
}
function unitById(id) { return course.units.find(u => u.id === id); }
function currentWritten(){
  const id=$('#written-paper')?.dataset.paper,paper=course.writtenPapers?.find(p=>p.id===id);
  if(!paper)return null;
  state.written??={};state.written[id]??=newWrittenRecord();
  return {paper,record:state.written[id]};
}
function subjectById(id) { return course.subjects.find(s => s.id === id); }
function currentSheet(){
  const lab=course.workbooks?.find(l=>l.id===document.getElementById('sheet-lab')?.dataset.lab);
  if(!lab)return null;
  state.labs ||= {};
  state.labs[lab.id] ||= newSheetRecord();
  return {lab,record:state.labs[lab.id]};
}
function subjectForUnit(id) { return subjectById(unitById(id)?.subject); }
const action = (name, text, attrs = '', style = '') => `<button type="button" class="${style}" data-action="${name}" ${attrs}>${text}</button>`;
const head = (eyebrow, title, description = '') => `<div class="page-head"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1>${description ? `<p class="intro">${esc(description)}</p>` : ''}</div>`;
function stat(number, text) { return `<div class="stat"><strong>${esc(number)}</strong><span>${esc(text)}</span></div>`; }
function linkHelp(ref, label = 'Apri il paragrafo completo') { return `<a href="#lesson/${esc(ref)}">${esc(label)} →</a>`; }
function figureHTML(id,study=true) {
  const f=(course.figures || []).find(f=>f.id===id);
  if(!f) return '';
  const picture=`<img src="${esc(f.dataUrl)}" alt="${esc(f.alt)}" loading="lazy">`;
  const marked=f.markers?`<div class="marked-anatomy">${picture}<svg class="marker-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${f.markers.map(m=>`<line x1="${m.x}" y1="${m.y}" x2="${m.lx}" y2="${m.ly}"/>`).join('')}</svg>${f.markers.map(m=>`<span class="marker-dot" style="left:${m.x}%;top:${m.y}%" aria-hidden="true"></span><span class="marker-letter" style="left:${m.lx}%;top:${m.ly}%" aria-label="Punto ${m.letter}">${m.letter}</span>`).join('')}</div>`:picture;
  return `<figure class="anatomy-figure">${marked}
    <figcaption><strong>${esc(f.title)}</strong>${study?`<p>${esc(f.guide)}</p>`:''}
    ${study&&f.markers?`<dl class="marker-legend">${f.markers.map(m=>`<div><dt>${m.letter}</dt><dd>${esc(m.label)}</dd></div>`).join('')}</dl>`:''}
    <p class="figure-credit">${esc(f.author)} · <a href="${esc(f.sourceUrl)}" target="_blank" rel="noopener noreferrer">Fonte della tavola</a> · <a href="${esc(f.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(f.license)}</a>. ${esc(f.changes)}</p>
    <a class="no-print" href="#figure/${esc(f.id)}${study?'':'/test'}">Apri la tavola ingrandita →</a></figcaption></figure>`;
}
function figurePage(id,testing=false) {
  const f=(course.figures || []).find(f=>f.id===id);
  return f?`${head('ATLANTE DI STUDIO',f.title,'Usa lo zoom del browser per esplorare i dettagli.')}<a href="${testing?'#session':'#exam/anatomia-umana'}">← ${testing?'Torna all’esercizio':'Torna ad Anatomia'}</a><div class="atlas-full">${figureHTML(id,!testing)}</div>`:empty('Tavola non trovata','Apri una lezione di anatomia.');
}
function sectionHTML(s) {
  return `<h2>${esc(s.title)}</h2>${s.text.map(p => `<p>${esc(p)}</p>`).join('')}
    ${s.formula ? `<div class="formula">${esc(s.formula)}</div>` : ''}
    ${s.flow ? `<ol class="concept-flow" aria-label="Sequenza dei passaggi">${s.flow.map(step => `<li>${esc(step)}</li>`).join('')}</ol>` : ''}
    ${s.table ? `<p class="table-scroll-hint no-print">Se non vedi tutte le colonne, scorri la tabella verso destra. Da tastiera usa le frecce dopo aver selezionato la tabella.</p><div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.title)} · tabella scorrevole"><table><caption>${esc(s.title)} · schema di ripasso</caption><thead><tr>${s.table.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(row => `<tr>${row.map((v,i) => i ? `<td>${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${(s.figureIds || []).map(id=>figureHTML(id)).join('')}
    ${(s.audioIds || []).map(id=>audioPanelHTML(course.listening.find(c=>c.id===id))).join('')}
    ${s.demo?physicsDemoHTML(s.demo):''}
    ${s.diagram?(chemistryDiagramHTML(s.diagram)||biologyDiagramHTML(s.diagram)||vascularDiagramHTML(s.diagram)):''}
    <div class="example"><span class="eyebrow">Un esempio concreto</span><p>${esc(s.example)}</p></div>
    <div class="callout"><strong>Da ricordare.</strong> ${esc(s.takeaway)}</div>`;
}
function oralHTML(unit, solution = false) {
  if (!unit.oral) return '';
  const o = unit.oral;
  return `<section class="oral"><h2>${unit.subject === 'inglese' ? 'Prova di scrittura e produzione orale' : 'Allenati a rispondere a voce'}</h2><p>${esc(o.prompt)}</p><p class="reading-note">Prova prima con parole tue, anche nell’appunto in fondo alla pagina, poi confronta. Questa attività non riceve un voto automatico.</p>
    ${solution ? '<div>' : '<details><summary>Confronta con una risposta ragionata</summary>'}<p>${esc(o.answer)}</p><strong>Controlla di aver spiegato:</strong><ul>${o.criteria.map(c => `<li>${esc(c)}</li>`).join('')}</ul>${solution ? '</div>' : '</details>'}</section>`;
}
function sourceLink(s) {
  return s.file ? `<span>${esc(s.title)} · ${esc(s.file)}</span>` : `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`;
}
function sourceHTML(unit) {
  const sources = (unit.sources || []).map(id => course.sources.find(s => s.id === id));
  return sources.length ? `<details class="lesson-sources editorial"><summary>Fonti e approfondimenti</summary><p class="reading-note">Riferimenti facoltativi; le spiegazioni da studiare sono in questa pagina.</p><ul>${sources.map(s => `<li>${sourceLink(s)}<p class="reading-note">${esc(s.scope)}</p></li>`).join('')}</ul></details>` : '';
}
function examPendingHTML(exam) {
  const note=course.checkpoint?.examNotes?.find(n=>n.id===exam.id);
  return note ? `<details class="exam-pending editorial"><summary>Materiale da completare</summary><p><strong>${esc(note.label)}</strong></p><p>${esc(note.remaining)}</p></details>` : '';
}
function checkpointHTML() {
  const cp=course.checkpoint;
  if(!cp) return '';
  return `<details class="work-checkpoint editorial"><summary>Segnalibro di sviluppo · materiale ancora da completare</summary><p>${esc(cp.summary)}</p><p><strong>Punto di ripresa:</strong> ${esc(cp.next)}</p><p>Lo sviluppo è in pausa. Puoi studiare con tutte le lezioni presenti; la copertura integrale degli esami resta da verificare.</p><details><summary>Che cosa manca nei ${cp.examNotes.length} esami</summary><ul>${cp.examNotes.map(n=>`<li><a href="#exam/${esc(n.id)}">${esc(course.exams.find(e=>e.id===n.id)?.title || n.id)}</a> · <strong>${esc(n.label)}</strong><p>${esc(n.remaining)}</p></li>`).join('')}</ul></details></details>`;
}
function examCard(exam) {
  const units = unitsForExam(course,exam.id), read = units.filter(u => state.read[u.id]).length;
  const attempts = state.attempts.filter(a => units.some(u => u.id === a.unit));
  const questions = definitions.filter(q => units.some(u => u.id === q.unit)).length;
  return `<article class="card exam-card"><div class="row between"><span class="tag">${exam.cfu} CFU · ${exam.semester}° semestre</span><span class="reading-note">${esc(exam.code)}</span></div>
    <h3><a href="#exam/${exam.id}">${esc(exam.title)}</a></h3><p>${exam.modules.map(m => esc(m.title)).join(' · ')}</p>
    <span class="tag ${units.length ? '' : 'orange'}">${units.length ? 'Lezioni e test disponibili' : 'Materiale da sviluppare'}</span>
    ${examPendingHTML(exam)}
    ${units.length ? `<label class="sr-only" for="p-${exam.id}">Lezioni disponibili lette di ${esc(exam.title)}</label><progress id="p-${exam.id}" max="${units.length}" value="${read}"></progress><p class="reading-note">${read}/${units.length} lezioni disponibili lette · ${questions} esercizi e modelli · ${attempts.length} risposte registrate</p>` : '<p class="reading-note">Esame presente nel piano. Lezioni ed esercizi non ancora disponibili.</p>'}
    <div class="card-footer"><a href="#exam/${exam.id}">${units.length ? 'Prepara questo esame' : 'Vedi moduli e programma'} →</a></div></article>`;
}
function programmeHTML(exam) {
  const p=exam.programme;
  if (!p) return '';
  const available=p.topics.filter(t=>t.status!=='missing').length;
  const partial=p.topics.filter(t=>t.status==='partial').length;
  return `<details class="programme-map section-heading editorial"><summary>Programma e fonti · ${available}/${p.topics.length} nuclei con lezioni e quiz</summary>
    <p>${esc(exam.syllabusStatus)}. <a href="${esc(exam.sourceUrl)}" target="_blank" rel="noopener noreferrer">Scheda ufficiale UniBa ↗</a></p>
    <p><strong>Fonte analitica: ${esc(p.referenceYear)}.</strong> Piano attuale verificato, programma analitico 2026/27 non confermato. ${partial} nuclei hanno approfondimenti esplicitamente da completare.</p>
    <p class="reading-note">La mappa raggruppa gli argomenti delle schede consultate. “Lezione + quiz” significa che esiste una trattazione introduttiva verificabile, non che siano esauriti tutti i dettagli o dimostrata la preparazione d’esame.</p>
    <ul>${p.sourceIds.map(id=>{const s=course.sources.find(s=>s.id===id);return `<li>${sourceLink(s)}<p class="reading-note">${esc(s.scope)}</p></li>`;}).join('')}</ul>
    <div class="programme-topics">${p.topics.map(t=>`<article class="programme-topic"><h3>${esc(t.title)}</h3><span class="tag ${t.status==='introduced'?'':'orange'}">${({introduced:'Lezione + quiz',partial:'Da approfondire',missing:'Non ancora disponibile'})[t.status]}</span>
      ${t.note?`<p>${esc(t.note)}</p>`:''}
      ${t.refs.length?`<ul>${t.refs.map(ref=>{const [id,sid]=ref.split('/'),u=unitById(id),s=u.sections.find(s=>s.id===sid);return `<li><a href="#lesson/${esc(ref)}">${esc(u.title)} · ${esc(s.title)}</a></li>`;}).join('')}</ul><p class="reading-note">${t.questionIds.length} domande con correzione e aiuto interno.</p>`:''}
    </article>`).join('')}</div>
    <h3>Limiti del confronto</h3><ul>${p.limitations.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
    <p class="reading-note">Consultazione e revisione: ${esc(p.checked)}. Il test guidato estrae una domanda per ogni nucleo mappato disponibile; le parti mancanti e i dettagli non sviluppati non vengono verificati.</p>
    </details>`;
}
function examPage(id) {
  const exam = course.exams.find(e => e.id === id);
  if (!exam) return empty('Esame non trovato', 'Scegli un esame del primo anno.', '#learn', 'I miei esami');
  const units = unitsForExam(course,id), read = units.filter(u => state.read[u.id]).length;
  return `<a href="#learn">← Esami del primo anno</a>${head(`${exam.code} · ${exam.cfu} CFU · ${exam.semester}° SEMESTRE`,exam.title,'Università di Bari · Primo anno · 2026/27')}
    <p class="reading-note">${units.length ? `${read} di ${units.length} lezioni segnate come lette · materiale in ampliamento.` : 'Materiale di studio da sviluppare.'}</p>
    ${examPendingHTML(exam)}
    ${units.length ? `<div class="row">${action('start-exam','Esercitati su questo esame',`data-exam="${exam.id}"`,'primary')}${action('start-programme',`Test guidato · ${programmeQuestions(course,definitions,exam.id,()=>0).length} domande`,`data-exam="${exam.id}"`)}<a class="button" href="#print/${exam.id}">Quaderno di questo esame</a></div>` : ''}
    ${exam.mockTest ? `<div class="row">${action('start-mock',`Simulazione scritta · ${exam.mockTest.size} domande`,`data-exam="${exam.id}"`)}</div><p class="reading-note">Allenamento con correzione immediata. Formato dalla scheda ${esc(exam.mockTest.referenceYear)}; distribuzione degli argomenti scelta per il ripasso.</p>` : ''}
    ${writtenLinks(course,exam.id)}
    ${units.length ? '<label class="search-label">Cerca tra le lezioni di questo esame<input id="lesson-search" type="search" placeholder="Es. metabolismo, contratti, apprendimento"></label>' : ''}
    ${exam.modules.map(m => `<section class="exam-module"><div class="section-heading"><h2>${esc(m.title)}</h2><details class="editorial"><summary>Note sul modulo</summary><p>${esc(m.coverage)}</p></details></div>
      ${m.unitIds.length ? `<div class="grid">${m.unitIds.map(uid => unitCard(unitById(uid),course.units.findIndex(u => u.id === uid))).join('')}</div>` : '<div class="callout">Qui compariranno spiegazioni, esempi svolti e verifiche collegate. Il modulo non viene conteggiato fra quelli studiabili.</div>'}</section>`).join('')}
    <p id="search-empty" class="reading-note" hidden>Nessuna lezione corrisponde alla ricerca.</p>${programmeHTML(exam)}`;
}
function inlineHelp(ref) {
  const [uid, sid] = ref.split('/');
  const unit = unitById(uid), section = unit?.sections.find(s => s.id === sid);
  if (!section) return '<p>Questo paragrafo non è presente nella versione attuale dei contenuti.</p>';
  return `<div class="lesson inline-lesson"><span class="eyebrow">${esc(unit.title)}</span>${sectionHTML(section)}</div>`;
}
function currentQuestion() {
  const item = state.active?.items[state.active.index];
  const def = item && definitions.find(q => q.id === item.qid);
  return def ? makeQuestion(def, item.seed) : null;
}
function itemsFor(unitId) { return definitions.filter(q => q.unit === unitId); }
function empty(title, description, href = '#learn', label = 'Scegli una lezione') {
  return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(description)}</p><a class="button primary" href="${href}">${esc(label)}</a></div>`;
}
function unitCard(unit, index) {
  const done = Boolean(state.read[unit.id]);
  return `<article class="card unit-card" data-search="${esc([unit.title,unit.description,...unit.sections.map(s => s.title)].join(' ').toLocaleLowerCase('it'))}"><div class="row between"><span class="tag">${esc(subjectForUnit(unit.id).title)}</span><span class="number">${String(index + 1).padStart(2, '0')}</span></div>
    <h3>${esc(unit.title)}</h3><p>${esc(unit.description)}</p><div class="row"><span class="reading-note">≈ ${unit.minutes} min · ${unit.sections.length} passaggi</span>${done ? '<span class="tag">Letta ✓</span>' : ''}</div>
    <div class="row between card-footer"><a href="#lesson/${unit.id}">${done ? 'Riapri la lezione' : 'Inizia a studiare'} →</a><span>${itemsFor(unit.id).length} tipi di esercizio</span></div></article>`;
}
function home() {
  const read = course.units.filter(u => state.read[u.id]).length, queue = reviewQueue(state.attempts);
  const next = unitById(state.lastUnit) || course.units.find(u => !state.read[u.id]) || course.units[0];
  const correct = state.attempts.filter(a => a.correct).length;
  return `${head('LA TUA SCRIVANIA', state.settings.name ? `Bentornata, ${state.settings.name}.` : 'Un piccolo passo, ogni giorno.', 'Leggi, prova, capisci gli errori. Il tuo posto per studiare Scienze motorie, anche quando il tempo è poco.')}
    ${checkpointHTML()}
    <div class="stats">${stat(`${read}/${course.units.length}`, 'lezioni segnate come lette')}${stat(state.attempts.length, 'esercizi verificati')}${stat(state.attempts.length ? `${Math.round(correct / state.attempts.length * 100)}%` : '—', 'risposte corrette al primo invio')}${stat(queue.length, 'tipi di esercizio da ripassare')}</div>
    <section class="hero"><div><span class="eyebrow">${state.active ? 'LA TUA SESSIONE TI ASPETTA' : state.lastUnit ? 'RIPRENDI DA QUI' : 'COMINCIAMO DALLE BASI'}</span><h2>${esc(state.active ? state.active.title : next.title)}</h2><p>${state.active ? 'Le risposte già verificate sono salvate. Puoi riprendere senza ricominciare.' : esc(next.description) + ' Trovi tutto qui: spiegazione, esempio e verifica.'}</p><a class="button primary" href="${state.active ? '#session' : `#lesson/${next.id}`}">${state.active ? 'Riprendi gli esercizi' : 'Apri la lezione'} <span aria-hidden="true">→</span></a></div>
    <div class="orbit" aria-hidden="true"><div class="orbit-ring"><span class="orbit-center">s.</span></div><span class="orbit-note">capire · provare · ricordare</span></div></section>
    <div class="section-heading row between"><h2>I tuoi esami · primo anno</h2><a href="#learn">Piano completo →</a></div>
    <p class="reading-note">UniBa 2026/27 · ${course.exams.length} insegnamenti · ${course.exams.reduce((n,e) => n+e.cfu,0)} CFU. I progressi contano le lezioni disponibili, non la copertura dell’intero esame.</p>
    <div class="grid exams">${course.exams.map(examCard).join('')}</div>
    <div class="section-heading"><h2>Studia con il tempo che hai</h2></div><div class="grid"><div class="card"><span class="eyebrow">Hai 10–15 minuti?</span><h3>Una lezione, un esempio, una prova.</h3><p>Segui i passaggi nell’ordine. Se qualcosa non torna, il paragrafo di aiuto si apre accanto alla correzione, nella stessa pagina.</p><a href="#learn">Scegli il tuo prossimo argomento →</a></div><div class="card"><span class="eyebrow">Un errore è un’indicazione</span><h3>Riparti dal punto giusto.</h3><p>Qui ritrovi gli esercizi sbagliati o risolti con un aiuto. Una risposta corretta senza aiuti li toglie dalla lista.</p><a href="#review">Apri il ripasso →</a></div></div>
    <p class="reading-note section-heading">Tutti gli esami hanno lezioni e verifiche. Apri la mappa di ogni esame per vedere fonti, anno del programma consultato, argomenti introdotti e parti ancora da approfondire.</p>`;
}
function learn(subjectId = '') {
  if (!subjectId) return `${head('IL TUO PRIMO ANNO','Gli esami da preparare.','Ogni esame raccoglie i suoi moduli, le lezioni e le verifiche. Si studia qui, senza dover acquistare i manuali.')}
    ${checkpointHTML()}
    <details class="editorial"><summary>Note sul piano di studi</summary><p>${esc(course.curriculum.note)}</p></details>
    ${[1,2].map(semester => `<div class="section-heading"><h2>${semester}° semestre</h2></div><div class="grid exams">${course.exams.filter(e => e.semester === semester).map(examCard).join('')}</div>`).join('')}`;
  const units = course.units.filter(u => !subjectId || u.subject === subjectId);
  return `${head('LEGGI E CAPISCI', subjectById(subjectId)?.title || 'Il tuo percorso di studio', 'Ogni lezione contiene spiegazioni, esempi svolti e un collegamento diretto agli esercizi. Non occorre aprire i libri per svolgere questi moduli.')}
    <div class="filters"><label>Materia<select id="learn-filter"><option value="">Tutte le materie</option>${course.subjects.map(s => `<option value="${s.id}" ${s.id === subjectId ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></label>
    <a class="button quiet" href="#print/all">Quaderno stampabile / PDF</a></div>
    <div class="grid">${units.map(unitCard).join('')}</div>`;
}
function lesson(id, sectionId) {
  const unit = unitById(id);
  if (!unit) return empty('Lezione non trovata', 'Scegli un argomento dal percorso.');
  state.lastUnit = unit.id; save();
  const exam = examsForUnit(course,id)[0], peers = exam ? unitsForExam(course,exam.id) : course.units;
  const index = course.units.findIndex(u => u.id === id), peerIndex = peers.findIndex(u => u.id === id), previous = peers[peerIndex - 1], next = peers[peerIndex + 1];
  return `<div class="no-print"><a href="${exam ? `#exam/${exam.id}` : '#learn'}">← ${esc(exam?.title || 'I miei esami')}</a></div>
    ${head(`LEZIONE ${index + 1} · CIRCA ${unit.minutes} MINUTI`, unit.title, unit.description)}
    <div class="lesson-layout"><article class="lesson">
    <div class="callout"><strong>Alla fine saprai:</strong><ul>${unit.objectives.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${unit.prerequisites?.length ? `<p class="reading-note">Prima di iniziare: ${unit.prerequisites.map(id => `<a href="#lesson/${id}">${esc(unitById(id).title)}</a>`).join(' · ')}</p>` : ''}
    ${unit.sections.map(s => `<section id="section-${s.id}" class="${sectionId === s.id ? 'highlight' : ''}">${sectionHTML(s)}</section>`).join('')}
    ${sheetLinks((course.workbooks||[]).filter(l=>l.unit===unit.id))}
    ${oralHTML(unit)}
    <section class="no-print"><h2>Ora prova a spiegarlo tu</h2><p>Chiudi per un momento la spiegazione. Ripeti i punti “Da ricordare” con parole tue e usa l’esempio per controllare il ragionamento.</p>
    <div class="row">${action('start-unit', 'Metti in pratica questa lezione →', `data-unit="${id}"`, 'primary')}${action('read', state.read[id] ? 'Letta ✓' : 'Segna come letta', `data-unit="${id}"`)}</div>
    <p class="reading-note">Segnare una lezione come letta serve a ritrovarla. Non equivale a dimostrarne la padronanza.</p></section>
    <section class="no-print"><label for="note">Il tuo appunto</label><p class="reading-note">Una formula da ricordare, un dubbio o una spiegazione con parole tue. Salvataggio automatico mentre scrivi.</p><textarea id="note" maxlength="50000" data-unit="${id}" placeholder="Scrivi qui…">${esc(state.notes[id] || '')}</textarea></section>
    <div class="row between no-print">${previous ? `<a href="#lesson/${previous.id}">← Lezione precedente</a>` : '<span></span>'}${next ? `<a href="#lesson/${next.id}">Lezione successiva →</a>` : '<a href="#practice">Vai agli esercizi →</a>'}</div>
    ${sourceHTML(unit)}</article><aside class="lesson-aside"><div class="card"><h3>In questa lezione</h3>${unit.sections.map(s => `<a href="#lesson/${id}/${s.id}">${esc(s.title)}</a>`).join('')}
    ${action('start-unit', 'Prova gli esercizi', `data-unit="${id}"`, 'primary')}<a href="#print/${id}">Stampa lezione e esercizi</a></div></aside></div>`;
}
function practice(examId = '') {
  if (state.active) return `${head('ESERCITATI', 'Hai una sessione in corso.', 'Puoi riprenderla oppure concluderla: le domande rimaste senza risposta conteranno zero nel voto orientativo.')}
    <div class="card"><h2>${esc(state.active.title)}</h2><p>${state.active.items.filter(i => i.attemptId).length} di ${state.active.items.length} esercizi verificati.</p><div class="row"><a class="button primary" href="#session">Riprendi</a>${action('finish', 'Concludi questa sessione')}</div></div>`;
  return `${head('METTI IN PRATICA', 'Un esercizio alla volta.', 'Quiz ragionati e problemi con dati variabili. Ogni risposta ha una spiegazione e un aiuto collegato alla lezione.')}
    <div class="card settings"><form id="practice-form">
    <label>Quale esame prepari?<select name="exam" id="practice-exam"><option value="">Tutti gli esami con esercizi</option>${course.exams.map(e => `<option value="${e.id}" ${e.id === examId ? 'selected' : ''} ${unitsForExam(course,e.id).length ? '' : 'disabled'}>${esc(e.title)}${unitsForExam(course,e.id).length ? '' : ' · da sviluppare'}</option>`).join('')}</select></label>
    <label>Lezione<select name="unit" id="practice-unit"><option value="">Tutte le lezioni disponibili</option>${(examId ? unitsForExam(course,examId) : course.units).map(u => `<option value="${u.id}">${esc(u.title)}</option>`).join('')}</select></label>
    <label>Tipo di allenamento<select name="level"><option value="">Fondamenti e applicazione</option><option value="fondamenti">Fondamenti</option><option value="applicazione">Applicazione e ragionamento</option></select></label>
    <label>Quanto vuoi esercitarti?<select name="size">${[5,8,12].map(n => `<option value="${n}" ${n === state.settings.sessionSize ? 'selected' : ''}>${n} esercizi</option>`).join('')}</select></label>
    <button class="primary">Inizia la sessione →</button></form></div>
    <div class="callout section-heading"><strong>Come funziona la verifica.</strong> Conta il primo invio valido. Un aiuto resta sempre disponibile e viene annotato nel risultato. Per riprovare con altri dati, inizia una nuova sessione. Il voto in trentesimi è un indicatore di esercitazione, non una previsione dell’esame.</div>`;
}
function startSession({ unit = '', exam = '', level = '', size = state.settings.sessionSize, review = false, programme = false, mock = false } = {}) {
  if (state.active) { location.hash = '#practice'; return; }
  let pool = selectDefinitions(course,definitions,{exam,unit,level});
  let items;
  if (mock) {
    items = mockQuestions(course,definitions,exam).map(q=>({qid:q.id,seed:seed(),assisted:false,attemptId:null}));
  } else if (programme) {
    items = programmeQuestions(course,definitions,exam).map(q=>({qid:q.id,seed:seed(),assisted:false,attemptId:null}));
  } else if (review) {
    items = reviewQueue(state.attempts).filter(a => definitions.some(d => d.id === a.qid)).slice(0,size)
      .map(a => ({ qid:a.qid, seed:a.seed, assisted:false, attemptId:null }));
  } else {
    // Cycle different definitions first; repeat only parameterized definitions when filling a session.
    pool = shuffled(pool);
    const selected = pool.slice(0, size);
    const numeric = pool.filter(q => q.generator);
    let numericIndex = 0;
    while (selected.length < size && numeric.length) selected.push(numeric[numericIndex++ % numeric.length]);
    items = selected.map(q => ({ qid:q.id, seed:seed(), assisted:false, attemptId:null }));
  }
  if (!items.length) { notice('Non ci sono esercizi disponibili per questa selezione.'); return; }
  state.active = { id:uid(), startedAt:now(), title:mock ? `Simulazione scritta · ${course.exams.find(e=>e.id===exam).title}` : programme ? `Test guidato · ${course.exams.find(e=>e.id===exam).title}` : review ? 'Ripasso degli errori' : unit ? unitById(unit).title : exam ? course.exams.find(e => e.id === exam).title : 'Allenamento misto',
    kind:review ? 'review' : 'practice', items, index:0 };
  save(); location.hash = '#session';
}
function session() {
  if (!state.active) return empty('Nessuna sessione in corso', 'Scegli un argomento e inizia una breve esercitazione.', '#practice', 'Prepara gli esercizi');
  const q = currentQuestion();
  if (!q) return `<div class="callout error">I contenuti sono cambiati e questo esercizio non è più disponibile. ${action('finish', 'Concludi e conserva i risultati')}</div>`;
  const active = state.active, item = active.items[active.index], attempt = state.attempts.find(a => a.id === item.attemptId);
  const units = [...new Set([q.answerUnit, 'm/s', 'm/s²', 'N', 'kg', 'J', 'N·m', 'km/h', '%', 'ATP', 'unità/min'].filter(Boolean))];
  const answerForm = q.type === 'choice'
    ? `<fieldset class="options" ${attempt ? 'disabled' : ''}><legend class="sr-only">Scegli una risposta</legend>${q.options.map(o => `<label class="option"><input type="radio" name="answer" value="${o.id}" ${item.draft?.answer === o.id ? 'checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`
    : `<div class="row"><label>Il tuo risultato<input name="answer" type="text" inputmode="decimal" autocomplete="off" value="${esc(item.draft?.answer || '')}" ${attempt ? 'disabled' : ''} placeholder="Es. 12,5" required></label><label>Unità<select name="answerUnit" ${attempt ? 'disabled' : ''} required><option value="">Scegli…</option>${units.map(u => `<option value="${esc(u)}" ${item.draft?.answerUnit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></label></div><p class="reading-note">Tolleranza assoluta: ±${fmt(q.tolerance)} nell’unità richiesta. Usa almeno ${q.tolerance < 0.01 ? 'tre' : 'due'} decimali quando servono.</p>`;
  return `<div class="row between"><div><span class="eyebrow">${esc(active.title)}</span><h1>Esercizio ${active.index + 1}<span class="muted"> / ${active.items.length}</span></h1></div>${action('finish', 'Concludi sessione', '', 'quiet')}</div>
    <label class="sr-only" for="session-progress">Esercizi completati</label><progress id="session-progress" value="${active.items.filter(i => i.attemptId).length}" max="${active.items.length}"></progress>
    <article class="card question"><div class="row between"><span class="tag">${esc(unitById(q.unit).title)}</span><span class="reading-note">${q.level === 'fondamenti' ? 'Fondamenti' : 'Applicazione'} · ${q.type === 'numeric' ? 'Dati variabili · soluzione calcolata' : 'Scelta singola'}</span></div>
    <h2>${esc(q.prompt)}</h2>${q.figureId?figureHTML(q.figureId,false):''}${q.audioId?`${audioPanelHTML(course.listening.find(c=>c.id===q.audioId),{transcript:false})}<p class="reading-note">Ascolta prima di rispondere. Senza audio puoi aprire “Mi serve un aiuto” per leggere il brano: la risposta sarà segnata come assistita e non dimostrerà comprensione all’ascolto.</p>`:''}<form id="answer-form">${answerForm}<p class="inline-error" id="answer-error" role="alert"></p>
    ${!attempt ? '<div class="actions"><button class="primary">Verifica la risposta →</button></div>' : ''}</form>
    ${!attempt ? `<div class="row">${action('hint', item.assisted ? 'Riapri l’aiuto' : 'Mi serve un aiuto', '', 'quiet')}<span class="reading-note">Puoi capire il passaggio senza lasciare l’esercizio.</span></div>` : ''}
    ${!attempt && item.assisted ? `<div class="feedback"><div class="callout"><strong>Un indizio.</strong> ${esc(q.hint)}</div><details open><summary>La spiegazione che serve qui</summary>${inlineHelp(q.help)}</details><p class="reading-note">Questa risposta sarà segnata come svolta con aiuto.</p></div>` : ''}
    ${attempt ? feedback(attempt) : ''}
    ${attempt ? `<div class="row actions">${action('next', active.index + 1 === active.items.length ? 'Guarda il risultato →' : 'Prossimo esercizio →', '', 'primary')}</div>` : ''}
    </article><p class="reading-note">Puoi uscire dalla pagina e riprendere questa sessione. Il salvataggio usa questo browser e questo indirizzo locale.</p>`;
}
function feedback(a) {
  return `<section class="feedback" aria-live="polite"><div class="callout ${a.correct ? '' : 'warning'}"><h3>${a.correct ? 'Corretto.' : 'Rivediamo questo passaggio.'} ${a.assisted ? '<span class="tag orange">Con aiuto</span>' : ''}</h3><p>${esc(a.message)}</p><p><strong>La tua risposta:</strong> ${esc(a.answerText)}<br><strong>Risposta corretta:</strong> ${esc(a.expected)}</p></div>
    <h3 class="section-heading">Il ragionamento</h3><ol>${a.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <details ${a.correct ? '' : 'open'}><summary>${a.correct ? 'Consolida il concetto' : 'Hai sbagliato questo? Riparti da qui.'}</summary>${inlineHelp(a.help)}<p>${linkHelp(a.help)}</p></details></section>`;
}
function finish() {
  const active = state.active;
  if (!active) return;
  const record = { id:active.id, title:active.title, kind:active.kind, startedAt:active.startedAt, endedAt:now(),
    total:active.items.length, attemptIds:active.items.map(i => i.attemptId).filter(Boolean) };
  state.sessions.push(record); state.active = null; save(); location.hash = `#result/${record.id}`;
}
function result(id) {
  const record = state.sessions.find(x => x.id === id);
  if (!record) return empty('Sessione non trovata', 'Trovi le sessioni salvate nei tuoi risultati.', '#results', 'Apri i risultati');
  const attempts = record.attemptIds.map(id => state.attempts.find(a => a.id === id)).filter(Boolean);
  const score = sessionScore(attempts, record.total);
  return `${head('SESSIONE COMPLETATA', record.title, `Conclusa il ${displayDate(record.endedAt)}. Il voto descrive questa esercitazione.`)}
    <div class="card"><div class="row between"><div><span class="score">${score.grade.toLocaleString('it-IT')}<small> / 30</small></span><p class="muted">Voto orientativo · tutte le domande hanno lo stesso peso</p></div><div><strong>${score.correct} corrette su ${score.total}</strong><p class="reading-note">${score.assisted} risposte con aiuto · ${score.total - score.answered} senza risposta</p></div></div>
    <div class="row"><a class="button primary" href="#review">Ripassa i punti da rinforzare</a><a class="button" href="#practice">Nuova sessione</a></div></div>
    <div class="section-heading"><h2>Rileggi il tuo ragionamento</h2></div>${attempts.map(a => `<details class="card"><summary>${a.correct ? '✓' : '↺'} ${esc(a.prompt)}</summary>${feedback(a)}</details>`).join('')}`;
}
function review() {
  const queue = reviewQueue(state.attempts);
  return `${head('IL TUO RIPASSO', 'Gli errori indicano la strada.', 'Ritrova i problemi sbagliati o svolti con un aiuto. La lista usa l’ultimo tentativo di ciascun tipo di esercizio. Una soluzione corretta senza aiuti lo rimuove.')}
    ${queue.length ? `<div class="row section-heading">${action('start-review', 'Riprova gli esercizi →', '', 'primary')}<span class="reading-note">Fino a ${state.settings.sessionSize} esercizi, con gli stessi dati del tentativo da ripassare.</span></div>
    ${queue.map(a => `<article class="card book"><span class="tag">${esc(unitById(a.unit)?.title || a.unit)}</span><h3>${esc(a.prompt)}</h3><p>${esc(a.message)}</p><details><summary>Studia il passaggio collegato</summary>${inlineHelp(a.help)}</details>${linkHelp(a.help)}</article>`).join('')}` :
      empty('Nessun punto in sospeso.', 'Gli errori e le risposte svolte con aiuto compariranno qui dopo la verifica.', '#practice', 'Fai una sessione')}`;
}
function results() {
  return `${head('IL TUO REGISTRO', 'I progressi, senza fretta.', 'I risultati restano su questo browser. Esporta periodicamente un backup dalle preferenze.')}
    ${sheetProgress(course.workbooks||[],state.labs)}
    ${state.sessions.length ? `<div class="card table-wrap"><table><thead><tr><th>Data</th><th>Sessione</th><th>Risultato</th><th>Con aiuto</th><th>Dettaglio</th></tr></thead><tbody>${[...state.sessions].reverse().map(s => {
      const score = sessionScore(s.attemptIds.map(id => state.attempts.find(a => a.id === id)), s.total);
      return `<tr><td>${displayDate(s.endedAt)}</td><td>${esc(s.title)}</td><td><strong>${score.grade.toLocaleString('it-IT')}/30</strong><br>${score.correct}/${score.total} corrette</td><td>${score.assisted}</td><td><a href="#result/${s.id}">Rivedi →</a></td></tr>`;
    }).join('')}</tbody></table></div>` : empty('Il registro è ancora vuoto.', 'Concludi una sessione per vedere il voto e rileggere tutte le correzioni.', '#practice', 'Inizia a esercitarti')}
    <p class="reading-note section-heading">Il voto è 30 × risposte corrette / domande assegnate. Le risposte non date valgono zero. Gli aiuti sono segnalati e non sottraggono punti; il risultato non misura da solo la preparazione all’esame.</p>`;
}
function books() {
  return `${head('LE FONTI E IL PERCORSO', 'Programma, copertura e fonti.', 'Il piano UniBa organizza gli esami; i manuali delle fotografie aiutano a ricostruire gli argomenti. Il materiale da studiare è scritto direttamente nelle lezioni.')}
    <div class="card"><h2>Primo anno · Università di Bari</h2><p>${esc(course.curriculum.note)}</p><p><a href="#learn">Esami e materiale disponibile →</a> · <a href="${esc(course.curriculum.sourceUrl)}" target="_blank" rel="noopener noreferrer">Piano ufficiale 2026/27 ↗</a></p></div>
    <div class="callout warning">${esc(library.scope)} Ricerca aggiornata al 20 ottobre 2026.</div>
    <div class="section-heading"><h2>Confronto con i programmi</h2></div><div class="grid">${course.exams.map(e => `<article class="card"><h3>${esc(e.title)}</h3><p>Fonte analitica: ${esc(e.programme.referenceYear)}. ${unitsForExam(course,e.id).length} lezioni disponibili.</p><ul>${e.programme.topics.filter(t=>t.status!=='introduced').map(t=>`<li>${esc(t.title)}: ${esc(t.note)}</li>`).join('') || '<li>Nuclei della scheda consultata introdotti; profondità e corrispondenza con il programma attuale da confermare.</li>'}</ul><a href="#exam/${e.id}">Apri mappa, lezioni e test →</a></article>`).join('')}</div>
    <details class="card"><summary>Fonti aperte: consultazione, confronto e approfondimento</summary><p>Testi, schemi e quesiti nell’app sono originali. I riferimenti indicano il loro ambito: un indice non equivale alla lettura integrale di un manuale. Non serve acquistare né aprire questi testi per svolgere gli esercizi disponibili.</p><ul>${course.sources.map(s => `<li>${sourceLink(s)}<p class="reading-note">${esc(s.scope)}</p></li>`).join('')}</ul></details>
    <div class="section-heading"><h2>I riferimenti delle fotografie</h2></div>
    ${library.books.map(b => `<article class="card book"><span class="tag">${esc(subjectById(b.subject).title)}</span><h3>${esc(b.title)}</h3><p>${esc(b.authors)}<br>${esc(b.edition)}</p><ul>${b.topics.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p><strong>Che cosa è stato verificato:</strong> ${esc(b.evidence)}</p><div class="callout">${esc(b.note)}</div><p class="section-heading"><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">Scheda dell’editore ↗</a></p></article>`).join('')}
    <details class="card"><summary>Altre fonti della ricerca</summary><ul>${library.additionalSources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul></details>`;
}
function settings() {
  return `${head('COME TI TROVI MEGLIO', 'Preferenze e backup.', 'Studio e progressi locali. L’audio ElevenLabs è facoltativo e richiede un tuo account.')}
    <div class="settings"><div class="card"><form id="settings-form"><label>Come ti chiami?<input name="name" maxlength="80" value="${esc(state.settings.name)}" placeholder="Il tuo nome"></label>
    <p>Il menu “Aspetto” in cima alla pagina sceglie il tema chiaro, scuro OLED o quello del dispositivo. La scelta si salva subito ed è inclusa nel backup.</p>
    <label class="row"><input type="checkbox" name="largeText" ${state.settings.largeText ? 'checked' : ''}> Testo delle lezioni più grande</label>
    <label class="section-heading">Durata abituale delle sessioni<select name="sessionSize">${[5,8,12].map(n => `<option value="${n}" ${n === state.settings.sessionSize ? 'selected' : ''}>${n} esercizi</option>`).join('')}</select></label><button class="primary">Salva preferenze</button></form></div>
    <div class="card"><h2>Porta con te i progressi</h2><p>Il backup contiene preferenze, appunti, lezioni lette, esercizi, voti, sessione in corso e laboratori: formule, report e verifiche. Copiare soltanto la cartella del sito non trasferisce i dati del browser.</p>
    <div class="row">${action('export', 'Esporta backup JSON', '', 'primary')}<label class="button">Importa backup<input class="sr-only" type="file" id="import" accept=".json,application/json"></label>${corruptRaw ? action('export-raw', 'Scarica i dati originali da recuperare') : ''}</div>
    <p>Importazione: sullo stesso browser i risultati si uniscono senza duplicati; preferenze e appunti locali prevalgono. In un browser vuoto il backup viene ripristinato integralmente. Formati incompatibili vengono rifiutati senza modificare i dati.</p></div>
    ${audioSettingsHTML()}
    <div class="card"><h2>Dove vengono salvati?</h2><p>I progressi restano in questo browser. Per ritrovarli, apri sempre lo stesso <strong>index.html</strong> dalla stessa cartella. Prima di spostarlo, cambiare browser o cancellare i dati di navigazione, esporta un backup.</p><p>Per aggiornare il materiale, sostituisci index.html nella stessa posizione. I contenuti nuovi non includono né sovrascrivono i tuoi progressi. Se il browser non li ritrova, puoi importare il backup.</p><p>Lezioni ed esercizi scritti funzionano senza Internet. L’audio richiede Internet solo per la prima generazione con ElevenLabs; poi usa la cache. Il backup dei progressi non contiene il token né gli audio: per trasferire gli audio usa “Scarica MP3”.</p></div></div>`;
}
function printBook(id) {
  const units = id === 'all' ? course.units : course.exams.some(e => e.id === id) ? unitsForExam(course,id) : course.units.filter(u => u.id === id);
  if (!units.length) return empty('Quaderno non trovato', 'Scegli una lezione.');
  const questions = units.flatMap(u => itemsFor(u.id).map(def => makeQuestion(def, 17)));
  const labs=(course.workbooks||[]).filter(l=>units.some(u=>u.id===l.unit));
  return `<div class="no-print">${head('IL TUO QUADERNO', 'Leggi, scrivi, verifica.', 'Le soluzioni sono raccolte in fondo, separate dagli esercizi. Nella finestra di stampa puoi scegliere “Salva come PDF”.')}<div class="row">${action('print', 'Stampa / Salva come PDF', '', 'primary')}<a class="button" href="#learn">Torna al percorso</a></div></div>
    <h1 class="print-only">Studio · Scienze motorie</h1>${units.map(u => `<article class="lesson section-heading"><h1>${esc(u.title)}</h1>${u.sections.map(s => `<section>${sectionHTML(s)}</section>`).join('')}</article>`).join('')}
    <h1 class="section-heading">Esercizi</h1>${questions.map((q,i) => `<article class="question"><h3>${i+1}. ${esc(q.prompt)}</h3>${q.figureId?figureHTML(q.figureId,false):''}${q.audioId?`<p lang="en">Versione scritta del brano: ${esc(course.listening.find(c=>c.id===q.audioId).text)}</p>`:''}${q.type === 'choice' ? `<ul>${q.options.map(o => `<li>☐ ${esc(o.text)}</li>`).join('')}</ul>` : '<p>Risultato: ____________________ Unità: ____________</p>'}<p>Ragionamento: ____________________________________________________</p></article>`).join('')}
    ${sheetPrint(labs)}
    ${units.some(u => u.oral) ? `<h1 class="section-heading">Domande per l’orale</h1>${units.filter(u => u.oral).map(u => `<article class="question"><h3>${esc(u.title)}</h3><p>${esc(u.oral.prompt)}</p><p>La tua spiegazione: ____________________________________________________</p></article>`).join('')}` : ''}
    <div class="print-solutions"><h1 class="section-heading">Soluzioni ragionate</h1>${questions.map((q,i) => `<article class="question"><h3>${i+1}. ${esc(expectedText(q))}</h3><p>${esc(q.explanation || q.steps.join(' '))}</p><p>Da ripassare: ${esc(unitById(q.help.split('/')[0]).title)} — ${esc(unitById(q.help.split('/')[0]).sections.find(s => s.id === q.help.split('/')[1]).title)}</p></article>`).join('')}
    ${sheetPrint(labs,true)}
    ${units.filter(u => u.oral).map(u => `<article class="lesson"><h2>${esc(u.title)}</h2>${oralHTML(u,true)}</article>`).join('')}</div>`;
}
function render() {
  applyTheme();
  disposeAudioPlayers();
  const [requestedRoute, arg, section] = location.hash.slice(1).split('/');
  const route = requestedRoute || 'home';
  const views = { home, learn:() => learn(arg), exam:() => examPage(arg), lesson:() => lesson(arg,section), practice:() => practice(arg), session, review, results,
    result:() => result(arg), library:books, settings, print:() => printBook(arg), figure:()=>figurePage(arg,section==='test'),
    lab:()=>sheetPage(course.workbooks?.find(l=>l.id===arg),state.labs?.[arg],inlineHelp),
    written:()=>writtenPage(course,course.writtenPapers?.find(p=>p.id===arg),state.written?.[arg],inlineHelp) };
  document.body.classList.toggle('large', state.settings.largeText);
  main.innerHTML = (views[route] || home)();
  bindAudioSettingsForm();
  document.querySelectorAll('[data-nav]').forEach(a => {
    const current = a.dataset.nav === ({exam:'learn',lesson:'learn',lab:'learn',written:'learn',session:'practice',result:'results',print:'learn'}[route] || route);
    a.classList.toggle('active',current);
    if(current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  $('#review-count').textContent = reviewQueue(state.attempts).length;
  if (section && route === 'lesson') requestAnimationFrame(() => document.getElementById(`section-${section}`)?.scrollIntoView({block:'start'}));
}
function download(value, filename) {
  const blob = new Blob([typeof value === 'string' ? value : JSON.stringify(value,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || !course) return;
  const name = button.dataset.action;
  if(name.startsWith('written-')){
    const w=currentWritten();if(!w)return;
    if(name==='written-reveal'&&w.paper.questions.some(q=>q.id===button.dataset.question)){
      revealWritten(w.record,button.dataset.question);save();render();
      document.getElementById(`written-${button.dataset.question}`)?.scrollIntoView({block:'start'});
    }
    if(name==='written-print-solutions'){
      w.paper.questions.forEach(q=>revealWritten(w.record,q.id));save();render();
      main.insertAdjacentHTML('beforeend',writtenPrintSolutions(w.paper));window.print();
      main.querySelector('.written-print-solutions')?.remove();
    }
    return;
  }
  if(name.startsWith('sheet-')){
    const sheet=currentSheet();
    if(sheet){sheetAction(name,sheet.lab,sheet.record,inlineHelp,button.dataset.ref);save();}
    return;
  }
  if (name.startsWith('audio-')) { void handleAudioClick(button,course.listening || []); return; }
  if (name === 'start-unit') startSession({unit:button.dataset.unit});
  if (name === 'start-exam') startSession({exam:button.dataset.exam});
  if (name === 'start-mock') startSession({exam:button.dataset.exam,mock:true});
  if (name === 'start-programme') startSession({exam:button.dataset.exam,programme:true});
  if (name === 'start-review') startSession({review:true});
  if (name === 'read') { state.read[button.dataset.unit] = now(); save(); button.textContent = 'Letta ✓'; }
  if (name === 'hint' && state.active) { state.active.items[state.active.index].assisted = true; save(); render(); }
  if (name === 'next' && state.active) {
    if (!state.active.items[state.active.index].attemptId) return;
    if (state.active.index === state.active.items.length - 1) finish();
    else { state.active.index++; save(); render(); main.focus(); window.scrollTo(0,0); }
  }
  if (name === 'finish') finish();
  if (name === 'export') download(state,`studio-progressi-${new Date().toISOString().slice(0,10)}.json`);
  if (name === 'export-raw' && corruptRaw) download(corruptRaw,'studio-dati-da-recuperare.json');
  if (name === 'print') window.print();
});
document.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target, data = new FormData(form);
  if(form.id==='sheet-copy'){
    const sheet=currentSheet();
    try{fillSheetDown(sheet.lab,sheet.record,data.get('from').trim().toUpperCase(),data.get('to').trim().toUpperCase());save();$('#sheet-status').textContent='Formule copiate e ricalcolate.';}
    catch(error){$('#sheet-status').textContent=error.message;}
    return;
  }
  if (form.id === 'audio-settings-form') { void handleAudioSubmit(form); return; }
  if (form.id === 'practice-form') startSession({exam:data.get('exam'),unit:data.get('unit'),level:data.get('level'),size:Number(data.get('size'))});
  if (form.id === 'settings-form') {
    state.settings = {...state.settings,name:data.get('name').trim(),largeText:data.has('largeText'),sessionSize:Number(data.get('sessionSize'))};
    save(); document.body.classList.toggle('large',state.settings.largeText); if (!storageBlocked) notice('Preferenze salvate.');
  }
  if (form.id === 'answer-form' && state.active) {
    const item = state.active.items[state.active.index];
    if (item.attemptId) return;
    const q = currentQuestion(), result = checkAnswer(q,data.get('answer'),data.get('answerUnit'));
    if (!result.valid) { $('#answer-error').textContent = result.message; return; }
    const attempt = {id:uid(),qid:q.id,unit:q.unit,concept:q.concept,sessionId:state.active.id,
      seed:item.seed,engineVersion:ENGINE_VERSION,at:now(),correct:result.correct,assisted:item.assisted,prompt:q.prompt,
      answerText:result.answerText,expected:expectedText(q),message:result.message,help:result.help,steps:result.steps};
    state.attempts.push(attempt); item.attemptId = attempt.id;
    item.draft = {answer:data.get('answer'),answerUnit:data.get('answerUnit') || ''};
    save(); render(); $('.feedback')?.scrollIntoView({block:'nearest'});
  }
});
document.addEventListener('input', event => {
  if(event.target.dataset.writtenAnswer){
    const w=currentWritten(),id=event.target.dataset.writtenAnswer;
    if(w&&w.paper.questions.some(q=>q.id===id)){
      writeDraft(w.record,id,event.target.value);save();
      const article=event.target.closest('.written-question'),select=article.querySelector('[data-written-rating]');
      if(select)select.value='';
      article.querySelector('.written-print-answer').textContent=event.target.value||'Risposta: ______________________________________________________________';
      $('#written-summary').innerHTML=writtenSummaryHTML(w.paper,w.record);
    }
    return;
  }
  if(event.target.hasAttribute('data-demo-control')){updatePhysicsDemo(event.target);return;}
  if(event.target.dataset.tableControl){
    const sheet=currentSheet();
    if(sheet?.lab.kind==='data'){updateDataLab(sheet.lab,sheet.record,event.target);save();}
    return;
  }
  if(event.target.dataset.sheetCell||event.target.id==='sheet-report'){
    const sheet=currentSheet();
    if(sheet){
      if(event.target.id==='sheet-report')sheet.record.report=event.target.value;
      else sheet.record.cells[event.target.dataset.sheetCell]=event.target.value;
      save();
    }
    return;
  }
  if (event.target.id === 'lesson-search') {
    const query = event.target.value.trim().toLocaleLowerCase('it');
    const cards = [...document.querySelectorAll('.unit-card')];
    cards.forEach(card => { card.hidden = !card.dataset.search.includes(query); });
    document.querySelectorAll('.exam-module').forEach(module => { module.hidden = ![...module.querySelectorAll('.unit-card')].some(c => !c.hidden); });
    $('#search-empty').hidden = cards.some(card => !card.hidden);
  }
  if (event.target.id === 'note') { state.notes[event.target.dataset.unit] = event.target.value; save(); }
  if (event.target.closest('#answer-form') && state.active) {
    const item = state.active.items[state.active.index];
    if (!item.attemptId) {
      const data = new FormData($('#answer-form'));
      item.draft = {answer:data.get('answer') || '',answerUnit:data.get('answerUnit') || ''}; save();
    }
  }
});
document.addEventListener('change', async event => {
  if(event.target.dataset.writtenRating){
    const w=currentWritten(),id=event.target.dataset.writtenRating;
    if(w&&w.paper.questions.some(q=>q.id===id)){
      const accepted=rateWritten(w.record,id,event.target.value);
      if(!accepted)event.target.value='';
      event.target.closest('.written-question').querySelector('[data-written-status]').textContent=accepted?'Autovalutazione registrata.':'Scrivi prima una risposta da confrontare.';
      save();$('#written-summary').innerHTML=writtenSummaryHTML(w.paper,w.record);
    }
    return;
  }
  if (event.target.id === 'appearance') {
    state.settings.theme = event.target.value;
    applyTheme(); save();
    return;
  }
  if(event.target.dataset.sheetCell){const sheet=currentSheet();if(sheet)refreshSheet(sheet.lab,sheet.record);}
  if (event.target.id === 'learn-filter') location.hash = `#learn/${event.target.value}`;
  if (event.target.id === 'practice-exam') {
    $('#practice-unit').innerHTML = '<option value="">Tutte le lezioni disponibili</option>' + (event.target.value ? unitsForExam(course,event.target.value) : course.units)
      .map(u => `<option value="${u.id}">${esc(u.title)}</option>`).join('');
  }
  if (event.target.id === 'import') {
    try {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 10 * 1024 * 1024) throw new Error('Il file supera 10 MB.');
      const incoming = validateState(JSON.parse(await file.text()));
      const emptyLocal = !state.attempts.length && !state.sessions.length && !Object.keys(state.read).length && !Object.keys(state.notes).length
        && !state.settings.name && !state.settings.largeText && state.settings.sessionSize === 8 && !state.active && !state.lastUnit
        && (!state.settings.theme || state.settings.theme === 'system')
        && !Object.keys(state.labs||{}).length && !Object.keys(state.written||{}).length;
      const merged = emptyLocal ? incoming : mergeState(state,incoming);
      // Persist before replacing the live state: a failed import never silently destroys local progress.
      localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
      state = merged; storageBlocked = false; corruptRaw = null;
      render(); notice('Backup importato. I risultati e gli appunti sono disponibili.');
    } catch(error) { notice(`Importazione non eseguita: ${error.message}`); }
  }
});
window.addEventListener('hashchange', () => { if (course) { render(); main.focus({preventScroll:true}); if (!location.hash.startsWith('#lesson/')) window.scrollTo(0,0); } });
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) {
    storageBlocked = true;
    notice('I progressi sono stati modificati in un’altra scheda. Per evitare sovrascritture, questa scheda non salva più: esporta eventuali risposte nuove e ricarica prima di continuare.');
  }
});
async function init() {
  try {
    const embedded = document.getElementById('studio-data');
    if (!embedded) throw new Error('Mancano i contenuti incorporati nella pagina.');
    ({ course, exercises, library } = JSON.parse(embedded.textContent));
    validateContent(course,exercises,library);
    definitions = [...exercises.questions,...exercises.templates];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { corruptRaw = raw; state = validateState(JSON.parse(raw)); corruptRaw = null; }
    } catch {
      storageBlocked = true; notice('Il salvataggio non è accessibile o non è compatibile. I dati esistenti non sono stati sovrascritti. Puoi scaricarli dalle preferenze, se leggibili, e continuare in memoria.');
    }
    render();
  } catch(error) {
    main.innerHTML = `<div class="error-page">${head('APERTURA NON RIUSCITA','Questa copia è incompleta.')}<p>Apri il file index.html della cartella pronta. Se il problema rimane, chiedi una nuova copia del file: i progressi già salvati nel browser non sono stati modificati.</p><pre>${esc(error.message)}</pre></div>`;
  }
}
init();
