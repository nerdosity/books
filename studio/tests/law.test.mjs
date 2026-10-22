import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {programmeQuestions} from '../lib/curriculum.js';
import {lawDiagramHTML,LAW_DIAGRAMS} from '../lib/law-diagrams.js';
const read=async n=>JSON.parse(await readFile(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const [c,e,a]=await Promise.all(['course','exercises','law-audit'].map(read));
const exam=c.exams.find(e=>e.id==='scienze-giuridiche'),ids=exam.modules.flatMap(m=>m.unitIds);
test('law public syllabus crosswalk covers all teaching, with internal verification and explicit unavailable materials',()=>{
 assert.equal(a.crosswalk.length,38);assert.equal(ids.length,20);
 const mapped=new Set(a.crosswalk.flatMap(r=>r.refs));
 for(const u of c.units.filter(u=>ids.includes(u.id))){
  assert.ok(u.oral?.answer&&u.oral.criteria.length>=2);
  for(const s of u.sections){
   const ref=u.id+'/'+s.id;assert.ok(mapped.has(ref),ref+' absent from syllabus crosswalk');
   assert.ok([...s.text,s.example,s.takeaway].join(' ').split(/\s+/).length>=150,ref+' too short');
   assert.ok(e.questions.filter(q=>q.help===ref).length>=2,ref+' lacks two checks');
  }
 }
 for(const row of a.crosswalk){assert.ok(row.questionIds.length);for(const id of row.questionIds){const q=e.questions.find(q=>q.id===id);assert.ok(q&&row.refs.includes(q.help),id)}}
 assert.equal(e.questions.filter(q=>ids.includes(q.unit)).length,160);
 assert.equal(e.questions.filter(q=>ids.includes(q.unit)&&q.id.startsWith('y1-')).length,32);
 assert.equal(exam.programme.currentSyllabusConfirmed,false);
 assert.equal(exam.programme.topics.at(-1).status,'missing');
 assert.match(exam.programme.topics.at(-1).note,/dispense/);
 assert.equal(exam.programme.topics[14].status,'introduced');
 assert.equal(programmeQuestions(c,[...e.questions,...e.templates],exam.id,()=>0.37).length,15);
 assert.equal(c.checkpoint.status,'paused');
});
test('law diagrams preserve essential distinctions and assigned readings are linked, never embedded',()=>{
 assert.equal(LAW_DIAGRAMS.length,3);
 assert.match(lawDiagramHTML('law-remedies'),/rescissione/);assert.match(lawDiagramHTML('law-remedies'),/inefficace/);
 assert.match(lawDiagramHTML('law-procedure'),/silenzio non ha sempre/);
 assert.match(lawDiagramHTML('law-europe'),/Organizzazione distinta/);
 assert.equal(lawDiagramHTML('missing'),'');
 for(const id of ['law-celentano-agenda','law-celentano-europa']){
  const s=c.sources.find(s=>s.id===id);assert.ok(s.url.startsWith('https:'));assert.equal(s.file,undefined);
  assert.ok(c.units.filter(u=>ids.includes(u.id)).some(u=>u.sources.includes(id)));
 }
 const section=c.units.find(u=>u.id==='pubblico-provvedimenti').sections.find(s=>s.id==='autotutela');
 assert.match(section.text.join(' '),/sei mesi/);
 assert.match(c.sources.find(s=>s.id==='law-autotutela').scope,/18 dicembre 2025/);
});

