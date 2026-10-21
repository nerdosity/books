import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState,validateState,mergeState} from '../lib/state.js';
import {newWrittenRecord,writeDraft,revealWritten,rateWritten,writtenSummary} from '../lib/written.js';
import {writtenPage} from '../lib/written-ui.js';
import {validateContent} from '../lib/validate.js';
const read=n=>JSON.parse(readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'));
const course=read('course'),exercises=read('exercises'),library=read('library');
test('written practice keeps three parts separate and invalidates self-rating after editing',()=>{
 const paper=course.writtenPapers[0],r=newWrittenRecord();
 assert.equal(rateWritten(r,'breve-1','solida'),false);
 writeDraft(r,'breve-1','Cellule superficiali');assert.equal(rateWritten(r,'breve-1','solida'),false);
 revealWritten(r,'breve-1');assert.equal(rateWritten(r,'breve-1','solida'),true);
 assert.deepEqual(writtenSummary(paper,r).map(s=>[s.total,s.answered,s.solid]),[[10,1,1],[1,0,0],[1,0,0]]);
 writeDraft(r,'breve-1','Una nuova risposta');assert.equal(r.ratings['breve-1'],undefined);
 assert.deepEqual(r.revealed,['breve-1']);
 assert.equal(rateWritten(r,'breve-1','inventato'),false);
});
test('old backups work; written drafts round-trip and merge without replacing local drafts',()=>{
 const old=freshState();assert.doesNotThrow(()=>validateState(old));
 const incoming=freshState(),local=freshState();
 incoming.written={paper:newWrittenRecord()};local.written={paper:newWrittenRecord()};
 writeDraft(incoming.written.paper,'q1','Risposta remota');revealWritten(incoming.written.paper,'q2');
 writeDraft(local.written.paper,'q1','Risposta locale');revealWritten(local.written.paper,'q1');rateWritten(local.written.paper,'q1','parziale');
 const copy=validateState(JSON.parse(JSON.stringify(local)));assert.deepEqual(copy.written,local.written);
 const merged=mergeState(local,incoming);assert.equal(merged.written.paper.answers.q1,'Risposta locale');
 assert.deepEqual(new Set(merged.written.paper.revealed),new Set(['q1','q2']));
 incoming.written.paper.ratings.q1='solida';assert.throws(()=>validateState(incoming),/Autovalutazione/);
 local.written.paper.answers.q1='';assert.throws(()=>validateState(local),/Autovalutazione/);
});
test('three original papers preserve historical format and all remediation belongs to Anatomy',()=>{
 assert.equal(course.writtenPapers.length,3);
 for(const p of course.writtenPapers){
  assert.equal(p.minutes,90);assert.equal(p.referenceYear,'2024/25');
  assert.deepEqual(['istologia','locomotore','organi'].map(k=>p.questions.filter(q=>q.part===k).length),[10,1,1]);
 }
 const bad=structuredClone(course);bad.writtenPapers[0].questions[0].refs=['cellula/membrana'];
 assert.throws(()=>validateContent(bad,exercises,library),/risposta scritta o aiuto/);
});
test('solutions are absent before reveal and written answers cannot inject markup',()=>{
 const p=course.writtenPapers[0],r=newWrittenRecord();writeDraft(r,'breve-1','</textarea><script>alert(1)</script>');
 let html=writtenPage(course,p,r,()=>'<p>Aiuto</p>');
 assert.ok(!html.includes(p.questions[0].answer));assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('&lt;/textarea&gt;'));
 revealWritten(r,'breve-1');html=writtenPage(course,p,r,()=>'<p>Aiuto</p>');
 assert.ok(html.includes(p.questions[0].answer));assert.ok(html.includes('Aiuto'));
});
