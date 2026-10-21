import { generators, makeQuestion, checkAnswer } from './engine.js';
import { gradeSheet } from './sheet.js';
import { validateDataLab } from './data-lab.js';
import { PHYSICS_DEMOS } from './physics-demos.js';
import { CHEMISTRY_DIAGRAMS } from './chemistry-diagrams.js';
import { BIOLOGY_DIAGRAMS } from './biology-diagrams.js';
import { VASCULAR_DIAGRAMS } from './vascular-diagrams.js';
export function validateContent(course, exercises, library) {
  const errors = [];
  const check = (value, message) => { if (!value) errors.push(message); };
  const unique = (items, label) => {
    const ids = items.map(x => x.id);
    check(new Set(ids).size === ids.length, `ID duplicati: ${label}`);
    check(ids.every(x => /^[a-z0-9-]+$/.test(x)), `ID non validi: ${label}`);
    return new Set(ids);
  };
  const subjects = unique(course.subjects, 'materie');
  const units = unique(course.units, 'lezioni');
  const books = unique(library.books, 'libri');
  const sources = unique(course.sources || [], 'fonti aperte');
  const clips = unique(course.listening || [], 'brani audio');
  for (const c of course.listening || []) {
    check(c.title && c.translation && c.text?.trim() && c.text.length <= 2500 && units.has(c.unit), `${c.id}: brano audio incompleto`);
  }
  const safeUrl = url => { try { return new URL(url).protocol === 'https:'; } catch { return false; } };
  const figures=unique(course.figures || [],'tavole');
  for (const f of course.figures || []) {
    check(f.title && f.alt && f.guide && f.author && f.license && f.changes
      && safeUrl(f.sourceUrl) && safeUrl(f.licenseUrl) && /^assets\/anatomy\/[a-z0-9-]+\.(jpg|png)$/.test(f.file),`${f.id}: tavola o attribuzione incompleta`);
    if (f.markers !== undefined) {
      check(Array.isArray(f.markers) && f.markers.length > 0 && f.markers.length <= 26,`${f.id}: riferimenti visuali non validi`);
      if (Array.isArray(f.markers)) {
        check(new Set(f.markers.map(m=>m?.letter)).size===f.markers.length,`${f.id}: lettere visuali duplicate`);
        for (const m of f.markers) check(m && /^[A-Z]$/.test(m.letter) && typeof m.label==='string' && m.label.trim()
          && ['x','y','lx','ly'].every(k=>Number.isFinite(m[k]) && m[k]>=0 && m[k]<=100),`${f.id}: marcatore visuale non valido`);
      }
    }
  }
  for (const s of course.sources || []) check(s.title && s.scope && safeUrl(s.url), `${s.id}: fonte incompleta o URL non valido`);
  const references = new Set(course.units.flatMap(u => u.sections.map(s => `${u.id}/${s.id}`)));
  const workbooks=unique(course.workbooks||[],'laboratori');
  for(const lab of course.workbooks||[]){
    if(lab.kind==='data'){
      check(units.has(lab.unit),`${lab.id}: lezione del laboratorio assente`);
      errors.push(...validateDataLab(lab,references));continue;
    }
    check(units.has(lab.unit)&&lab.title&&lab.description&&Number.isInteger(lab.rows)&&lab.rows>0&&lab.rows<=99
      &&Number.isInteger(lab.columns)&&lab.columns>0&&lab.columns<=26,`${lab.id}: struttura laboratorio non valida`);
    const inGrid=address=>/^[A-Z][1-9][0-9]?$/.test(address)&&address.charCodeAt(0)-65<lab.columns&&Number(address.slice(1))<=lab.rows;
    const cells=lab.cells||{},tasks=lab.tasks||[];
    check(tasks.length>0&&new Set(tasks.map(t=>t.cell)).size===tasks.length,`${lab.id}: consegne assenti o duplicate`);
    check(Object.entries(cells).every(([c,v])=>inGrid(c)&&typeof v==='string'&&v.length<=500&&!v.startsWith('=')),`${lab.id}: dati iniziali non validi`);
    for(const t of tasks)check(inGrid(t.cell)&&!(t.cell in cells)&&t.prompt&&t.explanation&&t.formula?.startsWith('=')
      &&references.has(t.help)&&t.help.split('/')[0]===lab.unit,`${lab.id}: consegna o aiuto non valido`);
    check(lab.variants?.length>0&&lab.variants.every(v=>Object.entries(v).every(([c,x])=>c in cells&&typeof x==='string'&&!x.startsWith('='))),`${lab.id}: variazioni non valide`);
    check(lab.report?.prompt&&lab.report.model&&lab.report.criteria?.length>=2,`${lab.id}: report incompleto`);
    check(inGrid(lab.copy?.from||'')&&inGrid(lab.copy?.to||''),`${lab.id}: intervallo copia non valido`);
    try{
      const grade=gradeSheet(lab,Object.fromEntries(tasks.map(t=>[t.cell,t.formula])));
      check(grade.correct===grade.total,`${lab.id}: soluzione non verificabile`);
    }catch(error){check(false,`${lab.id}: ${error.message}`);}
  }
  for (const u of course.units) {
    check(subjects.has(u.subject), `${u.id}: materia assente`);
    unique(u.sections, `sezioni di ${u.id}`);
    check(u.sections.length >= 2 && u.sections.every(s => s.text?.length && s.example && s.takeaway), `${u.id}: lezione incompleta`);
    check(u.bookIds.every(id => books.has(id)), `${u.id}: riferimento bibliografico assente`);
    check((u.prerequisites || []).every(id => units.has(id) && id !== u.id), `${u.id}: prerequisito assente o autoreferenziale`);
    check((u.sources || []).every(id => sources.has(id)), `${u.id}: fonte aperta assente`);
    check((u.labIds||[]).every(id=>workbooks.has(id)&&course.workbooks.find(l=>l.id===id).unit===u.id),`${u.id}: laboratorio assente o fuori lezione`);
    if (u.oral) check(u.oral.prompt && u.oral.answer && u.oral.criteria?.length >= 2, `${u.id}: attività orale incompleta`);
    for (const s of u.sections) {
      if(s.demo)check(PHYSICS_DEMOS.includes(s.demo),`${u.id}/${s.id}: schema interattivo inesistente`);
      if(s.diagram)check([...CHEMISTRY_DIAGRAMS,...BIOLOGY_DIAGRAMS,...VASCULAR_DIAGRAMS].includes(s.diagram),`${u.id}/${s.id}: schema didattico inesistente`);
      if(s.figureIds) check(Array.isArray(s.figureIds) && s.figureIds.every(id=>figures.has(id)),`${u.id}/${s.id}: tavola inesistente`);
      if (s.audioIds) check(Array.isArray(s.audioIds) && s.audioIds.every(id=>clips.has(id) && course.listening.find(c=>c.id===id).unit===u.id),`${u.id}/${s.id}: brano audio assente o fuori lezione`);
      if (s.flow) check(Array.isArray(s.flow) && s.flow.length >= 2 && s.flow.every(x => typeof x === 'string' && x.trim()), `${u.id}/${s.id}: sequenza incompleta`);
      if (s.table) check(s.table.headers?.length >= 2 && s.table.rows?.length && s.table.rows.every(r => r.length === s.table.headers.length), `${u.id}/${s.id}: tabella incoerente`);
    }
  }
  const visited = new Set(), visiting = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`Ciclo di prerequisiti: ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const p of course.units.find(u => u.id === id)?.prerequisites || []) if (units.has(p)) visit(p);
    visiting.delete(id); visited.add(id);
  }
  for (const u of course.units) visit(u.id);
  const exams = unique(course.exams || [], 'esami');
  check(exams.size > 0 && course.curriculum?.year === 1 && safeUrl(course.curriculum?.sourceUrl), 'Piano del primo anno assente o non valido');
  const assigned = new Set();
  for (const e of course.exams || []) {
    check(e.title && e.code && Number.isInteger(e.cfu) && e.cfu > 0 && [1,2].includes(e.semester) && safeUrl(e.sourceUrl), `${e.id}: metadati esame non validi`);
    check(e.modules?.length, `${e.id}: moduli assenti`);
    unique(e.modules || [], `moduli di ${e.id}`);
    for (const m of e.modules || []) {
      check(m.title && m.coverage && Array.isArray(m.unitIds), `${e.id}/${m.id}: modulo incompleto`);
      check(new Set(m.unitIds).size === m.unitIds.length, `${e.id}/${m.id}: lezioni duplicate`);
      for (const id of m.unitIds) { check(units.has(id), `${e.id}/${m.id}: lezione inesistente ${id}`); assigned.add(id); }
    }
  }
  for (const u of course.units) check(assigned.has(u.id), `${u.id}: lezione non associata a un esame`);
  unique(course.writtenPapers||[],'prove scritte');
  for(const p of course.writtenPapers||[]){
    const exam=course.exams.find(e=>e.id===p.exam),examUnits=new Set(exam?.modules.flatMap(m=>m.unitIds)||[]);
    check(exam&&sources.has(p.sourceId)&&p.title&&p.instructions&&p.referenceYear&&Number.isInteger(p.minutes)&&p.minutes>0,`${p.id}: prova scritta incompleta`);
    check(Array.isArray(p.questions)&&p.questions.length>0&&p.questions.length<=100,`${p.id}: domande scritte assenti`);
    unique(p.questions||[],`${p.id}: domande scritte`);
    for(const q of p.questions||[])check(q.prompt&&q.answer&&['istologia','locomotore','organi'].includes(q.part)
      &&Array.isArray(q.criteria)&&q.criteria.length>=2&&q.criteria.every(x=>typeof x==='string'&&x.trim())
      &&Array.isArray(q.refs)&&q.refs.length>0&&q.refs.every(ref=>references.has(ref)&&examUnits.has(ref.split('/')[0])),`${p.id}/${q.id}: risposta scritta o aiuto incompleto`);
  }
  const all = [...exercises.questions, ...exercises.templates];
  unique(all, 'esercizi');
  for (const e of course.exams || []) {
    const p = e.programme;
    check(p && p.referenceYear && p.checked && typeof p.currentSyllabusConfirmed === 'boolean', `${e.id}: confronto programma assente`);
    if (!p) continue;
    check(p.sourceIds?.length && p.sourceIds.every(id => sources.has(id)), `${e.id}: fonti programma assenti`);
    check(Array.isArray(p.limitations) && p.topics?.length, `${e.id}: mappa programma incompleta`);
    unique(p.topics || [], `argomenti di ${e.id}`);
    const examUnits = new Set(e.modules.flatMap(m => m.unitIds));
    for (const t of p.topics || []) {
      check(t.title && ['introduced','partial','missing'].includes(t.status), `${e.id}/${t.id}: stato argomento non valido`);
      check(Array.isArray(t.refs) && t.refs.every(ref => references.has(ref) && examUnits.has(ref.split('/')[0])), `${e.id}/${t.id}: riferimento programma fuori esame o inesistente`);
      check(Array.isArray(t.questionIds) && new Set(t.questionIds).size === t.questionIds.length, `${e.id}/${t.id}: domande programma non valide`);
      for (const id of t.questionIds || []) {
        const q = all.find(q => q.id === id);
        check(q && t.refs.includes(q.help) && examUnits.has(q.unit), `${e.id}/${t.id}: domanda non coerente con argomento ${id}`);
      }
      if (t.status === 'missing') check(t.note && !t.refs.length && !t.questionIds.length, `${e.id}/${t.id}: lacuna non esplicita`);
      else check(t.refs.length && t.questionIds.length, `${e.id}/${t.id}: argomento senza lezione o verifica`);
      if (t.status === 'partial') check(t.note, `${e.id}/${t.id}: limite della copertura parziale assente`);
    }
  }
  for (const q of all) {
    if(q.figureId) {
      const [uid,sid]=q.help.split('/'), section=course.units.find(u=>u.id===uid)?.sections.find(s=>s.id===sid);
      check(figures.has(q.figureId) && section?.figureIds?.includes(q.figureId),`${q.id}: tavola senza spiegazione nell’aiuto`);
    }
    if (q.audioId) {
      const clip=(course.listening || []).find(c=>c.id===q.audioId);
      const [uid,sid]=q.help.split('/'), section=course.units.find(u=>u.id===uid)?.sections.find(s=>s.id===sid);
      check(clip && clip.unit===q.unit && section?.audioIds?.includes(q.audioId),`${q.id}: audio senza trascrizione nell’aiuto`);
    }
    check(units.has(q.unit), `${q.id}: lezione assente`);
    check(references.has(q.help), `${q.id}: aiuto inesistente ${q.help}`);
    check(['fondamenti','applicazione'].includes(q.level), `${q.id}: livello assente o non valido`);
    if (q.generator) {
      check(Boolean(generators[q.generator]), `${q.id}: generatore assente`);
      if (generators[q.generator]) {
        for (let seed = 0; seed < 100; seed++) {
          const instance = makeQuestion(q, seed);
          check(Number.isFinite(instance.answer), `${q.id}: soluzione non finita`);
          check(checkAnswer(instance, String(instance.answer), instance.answerUnit).correct, `${q.id}: autocorrezione fallita`);
          for (const diag of instance.diagnoses) check(references.has(diag.help), `${q.id}: aiuto diagnostico assente`);
        }
      }
    } else {
      unique(q.options, `opzioni ${q.id}`);
      check(q.type === 'choice' && q.options.length >= 3 && q.options.some(o => o.id === q.answer), `${q.id}: risposta corretta assente`);
      check(Boolean(q.explanation && q.hint), `${q.id}: spiegazione o indizio assenti`);
      for (const o of q.options.filter(o => o.id !== q.answer)) {
        check(Boolean(o.feedback), `${q.id}/${o.id}: feedback assente`);
        check(references.has(o.help), `${q.id}/${o.id}: aiuto assente`);
      }
    }
  }
  for (const u of course.units) check(all.some(q => q.unit === u.id), `${u.id}: nessun esercizio`);
  if (errors.length) throw new Error(errors.join('\n'));
  return { units: units.size, sections: references.size, questions: exercises.questions.length, templates: exercises.templates.length, books: books.size, exams: exams.size, oral: course.units.filter(u => u.oral).length };
}
