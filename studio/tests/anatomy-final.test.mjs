import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {programmeQuestions} from '../lib/curriculum.js';
import {ANATOMY_DIAGRAMS,anatomyDiagramHTML} from '../lib/anatomy-diagrams.js';
import {writtenLinks,writtenPage} from '../lib/written-ui.js';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const c=read('course'),e=read('exercises'),a=read('anatomy-audit'),exam=c.exams.find(e=>e.id==='anatomia-umana');
const ids=exam.modules[0].unitIds,questions=e.questions.filter(q=>ids.includes(q.unit));
test('anatomy crosswalk resolves every public syllabus row to teaching and assessment while distinguishing current oral format',()=>{
 assert.equal(a.crosswalk.length,75);assert.equal(ids.length,57);assert.equal(questions.length,471);
 for(const row of a.crosswalk){
  assert.ok(row.questionIds.length,row.topic);
  for(const ref of row.refs){const [u,s]=ref.split('/');assert.ok(ids.includes(u));assert.ok(c.units.find(x=>x.id===u).sections.some(x=>x.id===s));}
  for(const id of row.questionIds){const q=questions.find(q=>q.id===id);assert.ok(q&&row.refs.includes(q.help),id);}
 }
 for(const id of a.additions.unitIds){
  const u=c.units.find(u=>u.id===id);assert.ok(u.oral?.criteria.length>=3);assert.ok(u.openstax.length>=3);
  for(const s of u.sections){
   const ref=u.id+'/'+s.id;
   assert.ok(a.crosswalk.some(r=>r.refs.includes(ref)),ref);
   assert.ok(questions.filter(q=>q.help===ref).length>=2,ref);
   assert.ok([...s.text,s.example,s.takeaway].join(' ').split(/\s+/).length>=150,ref);
  }
 }
 assert.equal(e.questions.filter(q=>q.id.startsWith('anat-final-')).length,72);
 assert.equal(exam.programme.currentSyllabusConfirmed,false);
 assert.equal(exam.programme.topics.at(-1).status,'introduced');
 const guided=programmeQuestions(c,[...e.questions,...e.templates],exam.id,()=>0.3);
 for(const topic of exam.programme.topics)assert.ok(guided.some(q=>topic.questionIds.includes(q.id)),topic.title);
 assert.match(exam.assessmentNote,/2026\/27.*orale/);
 const links=writtenLinks(c,exam.id);assert.match(links,/Allenati all’orale/);assert.match(links,/formato storico/);
 assert.match(writtenPage(c,c.writtenPapers[0],null,()=>''),/catalogo UniBa 2026\/27 indica una prova orale/);
 assert.equal(c.checkpoint.status,'paused');
});
test('anatomy images are locally attributable, tested with hidden study legends, and all diagrams resolve',()=>{
 assert.equal(a.figures.length,9);
 for(const f of a.figures){
  const actual=c.figures.find(x=>x.id===f.id);assert.equal(f.license,actual.license);
  assert.ok(readFileSync(new URL('../'+actual.file,import.meta.url)).length>20000);
  assert.ok(questions.some(q=>q.figureId===f.id),f.id+' lacks interpretation question');
  assert.ok(actual.guide&&actual.changes&&actual.sourceUrl.startsWith('https://commons.wikimedia.org/'));
 }
 assert.equal(ANATOMY_DIAGRAMS.length,3);
 for(const kind of ANATOMY_DIAGRAMS)assert.ok(anatomyDiagramHTML(kind).includes('data-anatomy-diagram="'+kind+'"'));
 assert.equal(anatomyDiagramHTML('missing'),'');
 assert.match(anatomyDiagramHTML('anatomy-projections'),/A e B si sovrappongono/);
 assert.match(anatomyDiagramHTML('anatomy-compartments'),/cuore non è nella cavità pleurica/);
});

