import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateCell,copyFormula,gradeSheet} from '../lib/sheet.js';
import {freshState,validateState,mergeState} from '../lib/state.js';
const course=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const value=(formula,cells={})=>evaluateCell({...cells,Z99:formula},'Z99');
test('sheet grammar calculates references, precedence, localized decimals and ranges without executing code',()=>{
  assert.equal(value('=(B2+B3)*C2',{B2:'10',B3:'2',C2:'3'}).value,36);
  assert.equal(value('=10+2*3').value,16);
  assert.equal(value('=1,5+2.5+10%').value,4.1);
  assert.equal(value('=SOMMA(A1:B2)',{A1:'1',A2:'2',B1:'3',B2:'4'}).value,10);
  for(const formula of ['=globalThis.alert(1)','=fetch("https://example.com")','=B2;alert(1)','=1+','=SUM(A1:A99999)']){
    assert.ok(value(formula).error,formula);
  }
});
test('blank, numeric zero and text remain distinct in aggregation',()=>{
  const cells={B2:'12',B3:'',B4:'0',B5:"'18",B6:'20'};
  assert.equal(value('=CONTA.NUMERI(B2:B6)',cells).value,3);
  assert.equal(value('=SUM(B2:B6)',cells).value,32);
  assert.equal(value('=AVERAGE(B2:B6)',cells).value,32/3);
  assert.equal(value('=MIN(B2:B6)',cells).value,0);
  assert.equal(value('=MAX(B2:B6)',cells).value,20);
  assert.equal(value('=B5+1',cells).error,'#VALORE!');
  assert.equal(value('=MEDIA(A1:A3)').error,'#DIV/0!');
});
test('conditions are lazy and boundary-inclusive comparisons work; errors identify cycles and zero denominators',()=>{
  assert.equal(value('=SE(B2=0;"Mancante";1/B2)',{B2:'0'}).value,'Mancante');
  assert.equal(value('=SE(B2>=15;"Sopra";"Sotto")',{B2:'15'}).value,'Sopra');
  assert.equal(value('=IF(B2>15;"Sopra";"Sotto")',{B2:'15'}).value,'Sotto');
  assert.equal(value('=1/B2',{B2:''}).error,'#DIV/0!');
  assert.equal(evaluateCell({A1:'=B1+1',B1:'=A1-1'},'A1').error,'#CICLO!');
  assert.equal(evaluateCell({B6:'=SOMMA(B2:B6)'},'B6').error,'#CICLO!');
});
test('copy changes relative coordinates only, including ranges, and never changes quoted text',()=>{
  assert.equal(copyFormula('=(B3-$B$2)/$B$2','C3','C5'),'=(B5-$B$2)/$B$2');
  assert.equal(copyFormula('=A1+$B1+C$2+$D$3','E4','G6'),'=C3+$B3+E$2+$D$3');
  assert.equal(copyFormula('=SE(A1>0;"A1";SOMMA(B1:B3))','C1','C2'),'=SE(A2>0;"A1";SOMMA(B2:B4))');
  assert.throws(()=>copyFormula('=A1','B2','B1'),/fuori/);
});
test('lab grading accepts equivalent formulas and detects constants, wrong baselines and missing equality',()=>{
  for(const lab of course.workbooks.filter(l=>l.kind!=='data')){
    const solved=Object.fromEntries(lab.tasks.map(t=>[t.cell,t.formula]));
    assert.equal(gradeSheet(lab,solved).correct,lab.tasks.length);
    const hardcoded=Object.fromEntries(lab.tasks.map(t=>{
      const result=evaluateCell({...lab.cells,...solved},t.cell).value;
      return [t.cell,typeof result==='number'?`=${result}`:`="${result}"`];
    }));
    const checked=gradeSheet(lab,hardcoded);
    assert.ok(checked.correct<checked.total,'constant results must fail changing inputs');
  }
  const lab=course.workbooks.find(l=>l.id==='foglio-sedute');
  const cells=Object.fromEntries(lab.tasks.map(t=>[t.cell,t.formula]));
  cells.D6='=D2+D3+D4';cells.D8='=(C2+C3+C4)/3';
  assert.equal(gradeSheet(lab,cells).correct,7);
  cells.D6='=380';
  assert.match(gradeSheet(lab,cells).results.find(r=>r.cell==='D6').message,/cambiano/);
  const quality=course.workbooks.find(l=>l.id==='foglio-qualita');
  const answer=Object.fromEntries(quality.tasks.map(t=>[t.cell,t.formula]));
  answer.C2='=SE(B2>15;"Sopra";"Sotto")';
  assert.equal(gradeSheet(quality,answer).results.find(r=>r.cell==='C2').correct,false);
});
test('old progress remains valid and lab backups preserve formulas, reports and independent checks on merge',()=>{
  const old=freshState();delete old.labs;
  assert.deepEqual(validateState(old),old);
  const a=freshState(),b=freshState();
  const record={cells:{D2:'=B2*C2'},report:'Le tre sedute…',assisted:false,checks:[{at:'2026-10-20T10:00:00Z',correct:1,total:7,assisted:false}]};
  a.labs['foglio-sedute']=structuredClone(record);
  b.labs['foglio-sedute']={...structuredClone(record),cells:{D2:'=60'},checks:[{at:'2026-10-20T11:00:00Z',correct:0,total:7,assisted:true}],assisted:true};
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(a))),a);
  const merged=mergeState(a,b);
  assert.equal(merged.labs['foglio-sedute'].cells.D2,'=B2*C2');
  assert.equal(merged.labs['foglio-sedute'].checks.length,2);
  assert.equal(merged.labs['foglio-sedute'].assisted,true);
  assert.deepEqual(mergeState(merged,b),merged);
  const bad=structuredClone(a);bad.labs['foglio-sedute'].checks[0].correct=8;
  assert.throws(()=>validateState(bad),/laboratorio/);
});
