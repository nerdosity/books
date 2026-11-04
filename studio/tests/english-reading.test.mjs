import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeQuestion,checkAnswer} from '../lib/engine.js';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url)));
const c=read('course'),e=read('exercises'),a=read('english-reading-audit'),exam=c.exams.find(x=>x.id==='inglese');
test('English expansion maps internal teaching and every diagnostic answer to written practice and the proper mock pool',()=>{
 assert.equal(a.rows.length,8);assert.equal(a.questionIds.length,40);assert.equal(a.listeningAdded,false);
 assert.equal(a.basis.currentSyllabusConfirmed,false);assert.equal(exam.modules[0].unitIds.length,14);
 assert.equal(e.questions.filter(q=>exam.modules[0].unitIds.includes(q.unit)&&!q.audioId).length,156);
 const pools=exam.mockTest.groups.flatMap(g=>g.questionIds);assert.equal(new Set(pools).size,pools.length);
 for(const row of a.rows){
  const[uid,sid]=row.ref.split('/'),unit=c.units.find(u=>u.id===uid),section=unit.sections.find(s=>s.id===sid);
  assert.ok(section.text.length>=4&&section.example&&section.takeaway);
  assert.equal(row.questionIds.length,5);
  for(const topicId of row.programmeIds){const t=exam.programme.topics.find(t=>t.id===topicId);assert.ok(t.refs.includes(row.ref));for(const id of row.questionIds)assert.ok(t.questionIds.includes(id));}
  const pool=exam.mockTest.groups.find(g=>g.title===row.mockGroup);
  for(const id of row.questionIds){const q=e.questions.find(q=>q.id===id);assert.equal(q.help,row.ref);assert.equal(q.audioId,undefined);assert.ok(pool.questionIds.includes(id));
   for(const option of q.options){assert.equal(checkAnswer(makeQuestion(q,78),option.id).correct,option.id===q.answer);if(option.id!==q.answer)assert.equal(option.help,row.ref);}
  }
 }
});
test('written cases preserve denominators, scales and uncertainty instead of rewarding invented information',()=>{
 const answer=id=>{const q=e.questions.find(q=>q.id===id);return q.options.find(o=>o.id===q.answer).text;};
 assert.equal(answer('en-depth-english-letture-integrate-risultati-1'),'80%.');
 assert.equal(answer('en-depth-english-letture-integrate-risultati-2'),'3 punti.');
 assert.equal(answer('en-depth-english-letture-integrate-risultati-3'),'15 punti percentuali.');
 assert.match(answer('en-depth-english-letture-integrate-risultati-5'),/Non è stato misurato/);
 assert.equal(answer('en-depth-english-letture-integrate-avviso-4'),'Non è indicata.');
 assert.match(answer('en-depth-english-relazioni-quantita-5'),/non decide fra una e nessuna/);
});
