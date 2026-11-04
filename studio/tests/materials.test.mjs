import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {biologyDiagramHTML} from '../lib/biology-diagrams.js';
import {makeQuestion,checkAnswer} from '../lib/engine.js';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const c=read('course'),e=read('exercises'),a=read('materials-20261026-audit');
const section=ref=>{const [uid,sid]=ref.split('/');return c.units.find(u=>u.id===uid)?.sections.find(s=>s.id===sid);};

test('uploaded materials map every slide/page once, with real internal teaching and diagnostic questions',()=>{
 assert.deepEqual(a.documents.map(d=>d.slideCount||d.pageCount),[15,46,87]);
 for(const d of a.documents){
  assert.match(d.sha256,/^[0-9a-f]{64}$/);
  const numbers=d.groups.flatMap(g=>Array.from({length:g.to-g.from+1},(_,i)=>g.from+i));
  assert.deepEqual(numbers,Array.from({length:d.slideCount||d.pageCount},(_,i)=>i+1));
  for(const g of d.groups){
   if(!g.refs.length){assert.equal(d.kind,'pdf');assert.equal(g.from,1);continue;}
   for(const ref of g.refs)assert.ok(section(ref),ref);
   assert.ok(g.questionIds.length,g.topic);
   for(const id of g.questionIds){const q=e.questions.find(q=>q.id===id);assert.ok(q&&g.refs.includes(q.help),id);}
  }
 }
 assert.ok(a.unchangedDocuments.every(d=>d.verifiedUnchanged));
 assert.equal(a.currentSyllabusConfirmed,false);
 for(const correction of a.corrections)for(const ref of correction.refs)assert.ok(section(ref),ref);
});

test('new questions are connected to sufficient lessons, preserve conceptual corrections and render all schemes',()=>{
 assert.equal(a.additions.unitIds.length,5);assert.equal(a.additions.refs.length,24);assert.equal(a.additions.questionIds.length,48);
 for(const ref of a.additions.refs){
  const s=section(ref);assert.ok(s.text.join(' ').split(/\s+/).length>=100,ref);
  const qs=e.questions.filter(q=>a.additions.questionIds.includes(q.id)&&q.help===ref);assert.equal(qs.length,2,ref);
  for(const q of qs){
   for(const o of q.options.filter(o=>o.id!==q.answer)){assert.equal(o.help,ref);assert.ok(o.feedback.length>15);}
   const actual=makeQuestion(q,42);assert.ok(checkAnswer(actual,q.answer).correct);
  }
  if(s.diagram)assert.ok(biologyDiagramHTML(s.diagram).includes('data-biology-diagram="'+s.diagram+'"'));
 }
 const find=suffix=>e.questions.find(q=>q.id.endsWith(suffix)&&q.id.startsWith('mat26-'));
 assert.equal(find('batteri-1').options.find(o=>o.id===find('batteri-1').answer).text,String(4*2**(90/30)));
 assert.equal(find('direzioni-1').options[0].text,'5′-GCAT-3′');
 assert.equal(find('direzioni-2').options[0].text,'5′-AUGCCU-3′');
 assert.match(section('nucleici-lettura/nucleotidi').text.join(' '),/Adenina e guanina sono purine/);
 assert.match(section('anatomia-genitale/cicli').text.join(' '),/endometrio, non nell’endotelio/);
 assert.ok(['active','paused'].includes(c.checkpoint.status));
});
