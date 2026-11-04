import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeQuestion,checkAnswer} from '../lib/engine.js';
import {studyDiagramHTML} from '../lib/study-diagrams.js';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url)));
const c=read('course'),e=read('exercises'),a=read('development-cognition-audit');
test('development expansion distinguishes editorial depth from confirmed current syllabus and maps each section to assessment',()=>{
 assert.equal(a.basis.currentSyllabusConfirmed,false);
 assert.equal(a.rows.length,8);assert.equal(a.questionIds.length,32);
 const ex=c.exams.find(x=>x.id===a.exam),module=ex.modules.find(m=>m.id===a.module);
 assert.equal(module.unitIds.length,6);
 for(const row of a.rows){
  const[uid,sid]=row.ref.split('/');assert.ok(module.unitIds.includes(uid));
  const u=c.units.find(u=>u.id===uid),s=u.sections.find(s=>s.id===sid);
  assert.ok(s&&s.text.length>=4&&s.example&&s.takeaway);
  const topic=ex.programme.topics.find(t=>t.id===row.programmeTopic);
  assert.ok(topic.refs.includes(row.ref));assert.equal(row.questionIds.length,4);
  for(const id of row.questionIds){const q=e.questions.find(q=>q.id===id);assert.equal(q.help,row.ref);assert.ok(topic.questionIds.includes(id));
   for(const option of q.options){assert.equal(checkAnswer(makeQuestion(q,9),option.id).correct,option.id===q.answer);if(option.id!==q.answer){assert.equal(option.help,row.ref);assert.ok(option.feedback.length>40);}}
  }
  for(const sourceId of u.openstax){const source=c.sources.find(s=>s.id===sourceId);assert.ok(source.reading&&source.url.startsWith('https://openstax.org/'));}
 }
});
test('belief cases distinguish visible and unseen relocation, and the diagram preserves the common real location',()=>{
 const qs=a.questionIds.map(id=>e.questions.find(q=>q.id===id)).filter(q=>q.concept==='credenze');
 const answer=q=>q.options.find(o=>o.id===q.answer).text;
 assert.match(answer(qs[0]),/^In A/);assert.match(answer(qs[1]),/in B/);
 assert.match(answer(qs[2]),/realtà attuale.*credenza/);
 const diagram=studyDiagramHTML('sviluppo-credenza');assert.match(diagram,/Nora assente/);assert.match(diagram,/Nora presente/);assert.match(diagram,/In entrambi i casi: fascia realmente in B/);
});
