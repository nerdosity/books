import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeQuestion,checkAnswer} from '../lib/engine.js';
import {studyDiagramHTML} from '../lib/study-diagrams.js';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url)));
const c=read('course'),e=read('exercises'),a=read('materials-20261104-audit');
const section=ref=>{const[u,s]=ref.split('/');return c.units.find(x=>x.id===u)?.sections.find(x=>x.id===s);};
test('November source map accounts for every new page, with teaching, assessment and explicit non-teaching pages',()=>{
 assert.equal(a.documents.length,19);assert.equal(a.documents.reduce((n,d)=>n+d.pageCount,0),665);
 for(const d of a.documents){
  assert.match(d.sha256,/^[0-9a-f]{64}$/);
  assert.deepEqual(d.pages.map(p=>p.page),Array.from({length:d.pageCount},(_,i)=>i+1));
  const grouped=d.groups.flatMap(g=>Array.from({length:g.to-g.from+1},(_,i)=>g.from+i));
  assert.deepEqual(grouped,Array.from({length:d.pageCount},(_,i)=>i+1),d.file);
  for(const g of d.groups){
   if(g.status==='non-instructional'){assert.equal(g.refs.length,0);assert.ok(g.topic);continue;}
   assert.ok(g.refs.length&&g.questionIds.length,d.file+' '+g.topic);
   for(const ref of g.refs)assert.ok(section(ref),ref);
   for(const id of g.questionIds){const q=e.questions.find(q=>q.id===id);assert.ok(q&&g.refs.includes(q.help),id);}
  }
 }
 assert.equal(a.programme.status,'reviewed-not-a-dated-syllabus');
 assert.equal(a.currentSyllabusConfirmed,false);
 assert.equal(a.unchangedDocuments[0].status,'unchanged-previous-integration');
 assert.ok(a.programme.notCertified.length>=3);
 // Printed page 955 still contains sections 4.3 and 4.4 before its references.
 const imagery=a.documents.find(d=>d.file==='Gaining_strength.pdf');
 assert.equal(imagery.pages[11].status,'integrated');
 assert.deepEqual(imagery.pages[11].refs,['psico-ricerca-imagery/inferenze']);
 assert.equal(imagery.pages[12].status,'non-instructional');
});
test('new teaching supports every diagnostic answer and belongs to a real exam and programme topic',()=>{
 assert.equal(a.additions.unitIds.length,25);assert.equal(a.additions.refs.length,113);assert.equal(a.additions.questionIds.length,228);
 for(const ref of a.additions.refs){
  const s=section(ref);assert.ok(s.text.join(' ').split(/\s+/).length>=100,ref);
  assert.ok(c.exams.some(ex=>ex.programme.topics.some(t=>t.refs.includes(ref))),ref+' unmapped');
  const qs=e.questions.filter(q=>a.additions.questionIds.includes(q.id)&&q.help===ref);assert.ok(qs.length>=2,ref);
  for(const q of qs){
   for(let seed=0;seed<3;seed++)assert.ok(checkAnswer(makeQuestion(q,seed),q.answer).correct);
   for(const o of q.options.filter(o=>o.id!==q.answer)){assert.ok(o.feedback.length>20);assert.equal(o.help,ref);assert.equal(checkAnswer(makeQuestion(q,3),o.id).correct,false);}
  }
 }
 for(const id of a.additions.diagramIds){assert.ok(studyDiagramHTML(id).includes('data-study-diagram="'+id+'"'));assert.ok(c.units.some(u=>u.sections.some(s=>s.diagram===id)));}
 assert.equal(studyDiagramHTML('unknown'),'');
});
test('scientific distinctions and original attachment exclusion survive editorial updates',()=>{
 const text=r=>section(r).text.join(' ');
 assert.match(text('psico-ricerca-imagery/dati'),/significativ/i);
 assert.match(text('psico-ricerca-imagery/strumenti'),/deviazione standard/);
 assert.match(text('psico-ricerca-imagery/inferenze'),/constraint-induced movement therapy/);
 assert.match(text('neuro-esercizio-dopamina/fatica'),/205/);
 assert.match(text('biochimica-leggere-molecole/riconoscimento'),/diastereoisomeri/);
 assert.match(text('biochimica-cellule-laboratorio/frazionamento'),/non.*pura/);
 assert.match(text('psico-apprendimento-concetti/regole'),/XOR/);
 assert.match(text('neuro-movimento/riflessi'),/Ia.*II.*Ib/);
 const payload=JSON.stringify({c,e});
 for(const d of a.documents)assert.ok(!payload.includes(d.file),d.file+' must stay in private audit, not delivery');
 assert.doesNotMatch(payload,/data:application\/(pdf|vnd\.openxmlformats)/);
});
