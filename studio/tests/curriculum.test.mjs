import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent} from '../lib/validate.js';
import {examUnitIds, unitsForExam, examsForUnit, selectDefinitions, programmeQuestions} from '../lib/curriculum.js';
const [course,exercises,library]=await Promise.all(['course','exercises','library'].map(async n=>JSON.parse(await readFile(new URL(`../data/${n}.json`,import.meta.url),'utf8'))));
const definitions=[...exercises.questions,...exercises.templates];
test('all official first-year exams have teaching and preserve the biology/biochemistry grouping',()=>{
  assert.equal(course.exams.length,10);
  assert.equal(course.exams.reduce((n,e)=>n+e.cfu,0),61);
  assert.equal(course.curriculum.academicYear,'2026/2027');
  const e=course.exams.find(e=>e.id==='scienze-biologiche');
  assert.equal(e.modules.length,2);
  assert.equal(examUnitIds(e).length,51);
  assert.equal(unitsForExam(course,e.id).length,51);
  assert.equal(examsForUnit(course,'ph')[0].id,e.id);
  assert.equal(unitsForExam(course,'informatica').length,10);
  assert.ok(course.exams.every(e=>e.modules.every(m=>m.unitIds.length)));
  assert.deepEqual(unitsForExam(course,'unknown'),[]);
});
test('practice selection never leaks exercises outside the selected exam and intersects unit and level',()=>{
  const biology=selectDefinitions(course,definitions,{exam:'scienze-biologiche'});
  assert.ok(biology.some(q=>q.unit==='cellula')&&biology.some(q=>q.unit==='mitocondri'));
  assert.ok(biology.every(q=>['biologia','biochimica'].includes(course.units.find(u=>u.id===q.unit).subject)));
  assert.deepEqual(selectDefinitions(course,definitions,{exam:'scienze-biologiche',unit:'leve'}),[]);
  const applied=selectDefinitions(course,definitions,{exam:'scienze-base',level:'applicazione'});
  assert.ok(applied.length>0&&applied.every(q=>q.level==='applicazione'));
  assert.equal(selectDefinitions(course,definitions,{exam:'informatica'}).length,104);
  const motor=selectDefinitions(course,definitions,{exam:'attivita-motorie'});
  assert.ok(motor.some(q=>q.id==='train-insegnare-stili-0'));
  assert.ok(motor.some(q=>q.id==='motor-progetto-rubrica-0'));
  assert.ok(!motor.some(q=>q.unit==='allenamento-progettare'));
  assert.deepEqual(selectDefinitions(course,definitions,{exam:'unknown'}),[]);
});
test('validator rejects broken programme mappings, missing sources, unsafe links and prerequisite cycles',()=>{
  for(const [change,message] of [
    [c=>c.exams[0].modules[0].unitIds.push('missing'),'inesistente'],
    [c=>c.units[0].sources.push('missing'),'fonte aperta'],
    [c=>c.sources[0].url='javascript:alert(1)','URL'],
    [c=>c.units[0].sections[0].diagram='missing-diagram','schema didattico inesistente'],
    [c=>{c.units[0].prerequisites=[c.units[1].id];c.units[1].prerequisites=[c.units[0].id];},'Ciclo'],
    [c=>c.exams[0].modules[0].unitIds.push('cellula'),'duplicate'],
    [c=>c.exams[0].programme.topics[0].refs=['leve/momento'],'fuori esame'],
    [c=>c.exams[0].programme.topics[0].questionIds=['missing-question'],'non coerente'],
    [c=>c.exams[0].programme.topics[0].questionIds=[],'senza lezione o verifica']
  ]) {
    const bad=structuredClone(course);change(bad);
    assert.throws(()=>validateContent(bad,exercises,library),new RegExp(message));
  }
});
test('visual and listening questions require matching media in their internal help',()=>{
  const bad=structuredClone(exercises);
  bad.questions.find(q=>q.figureId).figureId='missing-figure';
  assert.throws(()=>validateContent(course,bad,library),/tavola senza/);
  const badAudio=structuredClone(exercises);
  badAudio.questions.find(q=>q.audioId).audioId='missing-audio';
  assert.throws(()=>validateContent(course,badAudio,library),/audio senza/);
  const badPath=structuredClone(course);
  badPath.figures[0].file='../private.jpg';
  assert.throws(()=>validateContent(badPath,exercises,library),/tavola o attribuzione/);
});
test('visual markers reject invalid coordinates, duplicate letters and missing legends',()=>{
  for(const mutate of [
    f=>f.markers[0].x='20;display:none',
    f=>f.markers[0].ly=101,
    f=>f.markers[1].letter=f.markers[0].letter,
    f=>f.markers[0].label='',
    f=>f.markers=null
  ]){
    const bad=structuredClone(course);
    mutate(bad.figures.find(f=>f.id==='skeleton-unlabelled'));
    assert.throws(()=>validateContent(bad,exercises,library),/visual/);
  }
});
test('new chapters provide internal teaching, worked examples and self-assessed oral answers',()=>{
  const expanded=course.units.filter(u=>u.oral);
  assert.equal(expanded.length,199);
  for(const u of expanded) {
    assert.ok(u.sections.length>=4);
    assert.ok(u.sections.every(s=>s.text.length>=2&&s.example&&s.takeaway));
    assert.ok(exercises.questions.filter(q=>q.unit===u.id).length>=4);
    for(const section of u.sections) assert.ok(exercises.questions.some(q=>q.help===`${u.id}/${section.id}`));
    assert.ok(u.sources.length&&u.oral.criteria.length>=2);
  }
});
test('guided tests cover each available mapped topic, omit gaps, stay within the exam and do not duplicate questions',()=>{
  for(const exam of course.exams)for(const random of [()=>0,()=>0.5,()=>0.999999]) {
    const qs=programmeQuestions(course,definitions,exam.id,random);
    assert.ok(qs.length>0&&qs.length<=100);
    assert.equal(new Set(qs.map(q=>q.id)).size,qs.length);
    assert.ok(qs.every(q=>examUnitIds(exam).includes(q.unit)));
    for(const t of exam.programme.topics) {
      if(t.status==='missing') assert.equal(t.questionIds.length,0);
      else assert.ok(qs.some(q=>t.questionIds.includes(q.id)),`${exam.id}: ${t.title} absent from test`);
    }
    assert.equal(exam.programme.currentSyllabusConfirmed,false);
  }
  assert.deepEqual(programmeQuestions(course,definitions,'missing'),[]);
});
