import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mockQuestions} from '../lib/curriculum.js';
import {validateContent} from '../lib/validate.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'));
const c=read('course'),e=read('exercises'),l=read('library');
test('written mock samples fifteen distinct questions with the declared balance and no listening',()=>{
 const exam=c.exams.find(x=>x.id==='inglese');
 for(const rng of [()=>0,()=>.5,()=>.999999]){
  const qs=mockQuestions(c,e.questions,'inglese',rng);
  assert.equal(qs.length,15);assert.equal(new Set(qs.map(q=>q.id)).size,15);
  assert.ok(qs.every(q=>q.type==='choice'&&!q.audioId));
  for(const g of exam.mockTest.groups)assert.equal(qs.filter(q=>g.questionIds.includes(q.id)).length,g.count);
 }
 assert.deepEqual(mockQuestions(c,e.questions,'anatomia-umana'),[]);
});
test('validator rejects malformed mock pools and local source paths',()=>{
 for(const change of [
  x=>x.exams.find(t=>t.id==='inglese').mockTest.groups[0].questionIds.push(e.questions.find(q=>q.audioId).id),
  x=>x.exams.find(t=>t.id==='inglese').mockTest.groups[0].count=99,
  x=>x.exams.find(t=>t.id==='inglese').mockTest.groups[0].questionIds.push('missing'),
  x=>x.sources.find(s=>s.file).file='../private.pdf',
  x=>x.sources.find(s=>s.file).url='https://example.com'
 ]){const bad=structuredClone(c);change(bad);assert.throws(()=>validateContent(bad,e,l),/simulazione|URL\/file/);}
});
test('supplied PDF page maps cover each input page and resolve to exercises and internal explanations',()=>{
 const a=read('development-audit');
 for(const d of a.userDocumentAudits){
  const pages=d.groups.flatMap(g=>Array.from({length:g.to-g.from+1},(_,i)=>g.from+i));
  assert.deepEqual(pages,Array.from({length:d.pageCount},(_,i)=>i+1));
  for(const g of d.groups)for(const id of g.questionIds){const q=e.questions.find(q=>q.id===id);assert.ok(q&&g.refs.includes(q.help));}
 }
 assert.ok(!JSON.stringify(c).includes('Studocu.mhtml'));
});
