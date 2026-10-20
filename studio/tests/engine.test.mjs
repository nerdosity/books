import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { makeQuestion, checkAnswer, generators, parseNumber, reviewQueue, sessionScore } from '../lib/engine.js';
import { validateContent } from '../lib/validate.js';
const read = async n => JSON.parse(await readFile(new URL(`../data/${n}.json`,import.meta.url),'utf8'));
const [course, exercises, library] = await Promise.all(['course','exercises','library'].map(read));
test('all lessons, distractors and generated diagnoses link to existing sections', () => {
  const result = validateContent(course,exercises,library);
  assert.equal(result.units,144); assert.equal(result.questions,926); assert.equal(result.templates,27);
  assert.equal(result.exams,10); assert.equal(result.oral,124);
  const broken = structuredClone(exercises);
  broken.questions[0].options.find(o=>o.id!==broken.questions[0].answer).help = 'missing/section';
  assert.throws(()=>validateContent(course,broken,library),/aiuto/);
});
test('all generators are reproducible and obey independent physical or biological identities', () => {
  for (const template of exercises.templates) for (let seed=0;seed<1000;seed++) {
    const q = makeQuestion(template,seed), p = q.params;
    assert.deepEqual(q,makeQuestion(template,seed));
    assert.ok(checkAnswer(q,String(q.answer).replace('.',','),q.answerUnit).correct);
    switch(template.generator) {
      case 'adenylateCharge': assert.ok(Math.abs(2*q.answer*(p.atp+p.adp+p.amp)-(2*p.atp+p.adp))<1e-10);assert.ok(q.answer>0&&q.answer<1);break;
      case 'manometerOpen': assert.ok(Math.abs((q.answer-p.atmosphere)/(p.density*p.g)-p.sign*p.heightCm/100)<1e-10); break;
      case 'floatingFraction': assert.ok(Math.abs(q.answer*p.fluidDensity/100-p.bodyDensity)<1e-9);assert.ok(q.answer>0&&q.answer<100);break;
      case 'apparentWeight': assert.ok(Math.abs(q.answer+p.density*p.g*p.liters/1000-p.mass*p.g)<1e-9);break;
      case 'gaussFlux': assert.ok(Math.abs(q.answer*p.epsilon-p.insideNanoC*1e-9)<1e-20);break;
      case 'faradayEmf': assert.ok(Math.abs(q.answer/1000*p.timeMs/1000-p.turns*p.areaCm2*1e-4*p.deltaMilliT*1e-3)<1e-12);break;
      case 'attenuation': assert.ok(Math.abs(Math.log(q.answer/100)+p.mu*p.thickness)<1e-10);assert.ok(q.answer>0&&q.answer<100);break;
      case 'bufferPH': assert.ok(Math.abs(10**(q.answer-p.pka)-p.base/p.acid)<1e-10); break;
      case 'fattyAcidYield':
        assert.equal(p.acetyl*2,p.carbons); assert.equal(p.cycles+1,p.acetyl);
        assert.equal(q.answer,7*p.carbons-6); break;
      case 'conversion': assert.ok(Math.abs(q.answer*3600-p.kmh*1000)<1e-8); break;
      case 'speed': assert.equal(q.answer*p.time,p.distance); break;
      case 'acceleration': assert.equal(p.initial+q.answer*p.time,p.final); break;
      case 'force': assert.equal(q.answer/p.mass,p.acceleration); break;
      case 'kinetic': assert.equal(2*q.answer/p.mass,p.speed**2); break;
      case 'torque': assert.ok(Math.abs(q.answer/p.force-p.cm/100)<1e-10); break;
      case 'lever': assert.equal(q.answer*p.muscle,p.load*p.external); break;
      case 'atp': assert.equal(q.answer+p.glucose*2,p.glucose*4); break;
      case 'enzyme': assert.equal(q.answer*2,p.vmax); break;
      case 'molarity': assert.ok(Math.abs(q.answer*p.volume*p.molarMass-p.mass)<1e-8); break;
      case 'dilution': assert.ok(Math.abs(q.answer*p.initial-p.target*p.finalVolume)<1e-8); break;
      case 'michaelis': assert.ok(Math.abs(q.answer*(p.km+p.substrate)-p.vmax*p.substrate)<1e-8); break;
      case 'krebsYield': assert.equal(q.answer,p.acetyl*(3*2.5+1.5+1)); break;
      case 'vectorMagnitude': assert.equal(q.answer**2,p.x**2+p.y**2); break;
      case 'impulseForce': assert.ok(Math.abs(q.answer*p.time-p.mass*p.speed)<1e-8); break;
      case 'flowSpeed': assert.equal(q.answer*p.area,p.flow); break;
      case 'ohmCurrent': assert.equal(q.answer*p.resistance,p.voltage); break;
      case 'genetics': {
        const gametes1=p.p1.split(''),gametes2=p.p2.split('');
        const matches=gametes1.flatMap(a=>gametes2.map(b=>[a,b].sort().join(''))).filter(x=>x===p.target.split(' ')[0]);
        assert.equal(q.answer,matches.length*25);break;
      }
      default: assert.fail(`Missing independent identity for ${template.generator}`);
    }
  }
  assert.equal(Object.keys(generators).length,27);
});

test('adenylate charge uses weighted ADP, stays scale invariant and distinguishes known errors',()=>{
  // Independently counted: two ATP, two ADP and one AMP give six of ten weighted units.
  assert.equal(generators.adenylateCharge(()=>0).answer,0.6);
  const def=exercises.templates.find(t=>t.generator==='adenylateCharge');
  for(let seed=0;seed<200;seed++){
    const q=makeQuestion(def,seed),p=q.params;
    const doubled=(2*p.atp+p.adp)/(2*(p.atp+p.adp+p.amp));
    assert.equal(q.answer,doubled);
    assert.ok(checkAnswer(q,q.answer.toFixed(3).replace('.',','),'adimensionale').correct);
    assert.ok(!checkAnswer(q,String(q.answer+0.0011),'adimensionale').correct);
    assert.ok(checkAnswer(q,String(q.answer+0.0009),'adimensionale').correct);
    assert.ok(!checkAnswer(q,String(q.answer),'mmol/L').correct);
    for(const d of q.diagnoses){
      const result=checkAnswer(q,String(d.value),'adimensionale');
      assert.equal(result.correct,false);assert.equal(result.message,d.message);assert.equal(result.help,def.help);
      for(const other of q.diagnoses.filter(x=>x!==d))assert.ok(Math.abs(d.value-other.value)>2*q.tolerance);
    }
    assert.match(checkAnswer(q,'-17','adimensionale').message,/non posso stabilire la causa/);
  }
});
test('new physical problem families have distinct error diagnoses and independently checked reference cases',()=>{
  assert.ok(Math.abs(generators.manometerOpen(()=>0).answer-99843.2)<1e-9);
  assert.equal(generators.floatingFraction(()=>0).answer,20);
  assert.ok(Math.abs(generators.apparentWeight(()=>0).answer-9.8)<1e-9);
  assert.equal(generators.faradayEmf(()=>0).answer,20);
  assert.ok(Math.abs(generators.attenuation(()=>0).answer-95.12294245)<1e-7);
  const physics=exercises.templates.filter(t=>t.id.endsWith('-v1')&&t.unit.startsWith('fisica-'));
  assert.equal(physics.length,6);
  for(const template of physics)for(let seed=0;seed<100;seed++){
    const q=makeQuestion(template,seed);
    for(const diagnosis of q.diagnoses){
      assert.ok(Math.abs(diagnosis.value-q.answer)>q.tolerance);
      const result=checkAnswer(q,String(diagnosis.value),q.answerUnit);
      assert.equal(result.correct,false);assert.equal(result.help,diagnosis.help);
    }
    assert.ok(checkAnswer(q,q.answer.toFixed(2),q.answerUnit).correct);
  }
});
test('biochemical calculations reproduce reference balances and diagnose only matching errors',()=>{
  const buffer=exercises.templates.find(t=>t.generator==='bufferPH');
  const fat=exercises.templates.find(t=>t.generator==='fattyAcidYield');
  const knownYield={14:92,16:106,18:120,20:134};
  const seen=new Set();
  for(let seed=0;seed<100;seed++){
    const b=makeQuestion(buffer,seed),f=makeQuestion(fat,seed);
    seen.add(f.params.carbons);
    assert.equal(f.answer,knownYield[f.params.carbons]);
    const activation=checkAnswer(f,String(f.answer+2),'ATP');
    assert.equal(activation.correct,false);assert.equal(activation.help,'lipidi-ossidazione/ingresso');
    const reversed=b.params.pka+Math.log10(b.params.acid/b.params.base);
    const ratioError=checkAnswer(b,String(reversed),'pH');
    assert.equal(ratioError.correct,false);assert.match(ratioError.message,/invertito/);
    assert.equal(ratioError.help,'chimica-equilibri/henderson');
    assert.ok(checkAnswer(b,b.answer.toFixed(2),'pH').correct);
    for(const q of [b,f])for(const diagnosis of q.diagnoses){
      assert.ok(Math.abs(diagnosis.value-q.answer)>q.tolerance);
    }
  }
  assert.deepEqual([...seen].sort((a,b)=>a-b),[14,16,18,20]);
});
test('numeric validation rejects blanks, partial numbers, units in number field and nonfinite inputs', () => {
  for (const raw of ['', ' ', 'NaN','Infinity','0x10','12 m/s','1,2,3','1e309']) assert.equal(parseNumber(raw),null);
  assert.equal(parseNumber('1,25'),1.25); assert.equal(parseNumber('1e3'),1000);
  const q=makeQuestion(exercises.templates[0],7);
  assert.equal(checkAnswer(q,'','m/s').valid,false);
  assert.equal(checkAnswer(q,String(q.answer),'').valid,false);
  assert.equal(checkAnswer(q,String(q.answer),'km/h').correct,false);
  assert.equal(checkAnswer(q,String(q.answer+.009),'m/s').correct,true);
  assert.equal(checkAnswer(q,String(q.answer+.011),'m/s').correct,false);
});
test('specific common mistakes get their own remediation; unknown mistakes do not get invented diagnoses', () => {
  const q = makeQuestion(exercises.templates.find(x=>x.generator==='torque'),23);
  const error = checkAnswer(q,String(q.params.force*q.params.cm),'N·m');
  assert.equal(error.correct,false); assert.equal(error.help,'cinematica/unita');
  assert.match(error.message,/centimetri/);
  assert.match(checkAnswer(q,'-6789','N·m').message,/non posso stabilire la causa/);
});
test('choice answers are matched by stable ID after shuffle, not by position', () => {
  const def=exercises.questions[0];
  for(let seed=0;seed<20;seed++){
    const q=makeQuestion(def,seed);
    assert.equal(checkAnswer(q,def.answer).correct,true);
    for(const o of q.options.filter(o=>o.id!==def.answer)) assert.equal(checkAnswer(q,o.id).correct,false);
    assert.equal(checkAnswer(q,'not-an-option').valid,false);
  }
});
test('unfinished questions count zero and only unaided success clears a review item', () => {
  const attempts=[
    {qid:'a',at:'2026-10-20T08:00:00.000Z',correct:false,assisted:false},
    {qid:'a',at:'2026-10-20T08:01:00.000Z',correct:true,assisted:true},
    {qid:'b',at:'2026-10-20T08:02:00.000Z',correct:true,assisted:false}
  ];
  assert.equal(reviewQueue(attempts).length,1);
  assert.equal(sessionScore(attempts,5).grade,12);
  attempts.push({qid:'a',at:'2026-10-20T08:03:00.000Z',correct:true,assisted:false});
  assert.equal(reviewQueue(attempts).length,0);
});
