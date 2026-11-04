import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeQuestion,checkAnswer} from '../lib/engine.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url)));
const c=read('course'),e=read('exercises'),a=read('current-programme-audit'),pack=read('biology-current-expansion-audit');
const section=ref=>{const[u,s]=ref.split('/');return c.units.find(x=>x.id===u)?.sections.find(x=>x.id===s);};
test('current biology map distinguishes retrieved syllabus, teaching and unresolved exam-format evidence',()=>{
 for(const[block,size]of[['biologia',17],['biochimica',10]])assert.deepEqual(a.biology.rows.filter(r=>r.block===block).map(r=>r.number),Array.from({length:size},(_,i)=>i+1));
 const ids=c.exams.find(x=>x.id==='scienze-biologiche').modules.flatMap(m=>m.unitIds);
 for(const r of a.biology.rows){
  assert.ok(r.refs.every(ref=>section(ref)&&ids.includes(ref.split('/')[0])));
  assert.ok(r.questionIds.length>0);
  for(const id of r.questionIds)assert.ok(r.refs.includes(e.questions.find(q=>q.id===id)?.help));
 }
 assert.equal(a.biology.assessment.generalField,'Orale');
 assert.match(a.biology.assessment.detailedField,/Scritto/);
 assert.equal(a.anatomy.assessment.structuresToRecognize,15);
 assert.equal(a.anatomy.coverageCompared,false);
 assert.equal(a.completionProven,false);
 assert.ok(c.exams.find(x=>x.id==='anatomia-umana').assessmentNote.includes('15 strutture'));
});
test('new diagnostic choices are supported internally and close the two unassessed energy sections',()=>{
 for(const id of pack.questionIds){
  const q=e.questions.find(q=>q.id===id);assert.ok(q);
  for(const seed of [0,1,99])assert.equal(checkAnswer(makeQuestion(q,seed),q.answer).correct,true);
  for(const o of q.options.filter(o=>o.id!==q.answer)){assert.ok(section(o.help));assert.ok(o.feedback.length>20);assert.equal(checkAnswer(makeQuestion(q,1),o.id).correct,false);}
 }
 for(const ref of ['energia/atp','energia/ossidativa'])assert.ok(e.questions.filter(q=>q.help===ref).length>=2);
 assert.match(section('esosi-metabolismo/galattosio').text.join(' '),/GALT.*UDP-glucosio/s);
 assert.match(section('esosi-metabolismo/fruttosio').text.join(' '),/a valle della PFK-1/);
 assert.deepEqual(section('cellula-adesione/adesioni').table.rows.find(r=>r[0]==='Emidesmosoma'),['Emidesmosoma','Cellula-lamina basale','Filamenti intermedi']);
 assert.match(section('ossidazione-controllo/accoppiamento').text.join(' '),/UCP1/);
});
