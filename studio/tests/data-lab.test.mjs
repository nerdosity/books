import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dataControls,dataView,gradeDataLab,validateDataLab} from '../lib/data-lab.js';
import {dataChart,dataLabPrint} from '../lib/data-lab-ui.js';
import {freshState,validateState,mergeState} from '../lib/state.js';
const c=JSON.parse(fs.readFileSync(new URL('../data/course.json',import.meta.url)));
const labs=c.workbooks.filter(l=>l.kind==='data');
const solved=l=>Object.assign({},l.defaults,...l.tasks.map(t=>t.expected));
const ids=rows=>rows.map(r=>r.id);
test('data operations preserve records, prioritize keys, include boundaries and combine AND/OR',()=>{
 const [a,b,t]=labs,original=JSON.stringify(a.records);
 const av=dataView(a,solved(a)).visible,bv=dataView(b,solved(b)).visible;
 assert.deepEqual(ids(av),['S5','S3','S6']);assert.equal(av.reduce((s,r)=>s+r.minutes,0),100);
 assert.deepEqual(ids(bv),['S5','S4','S7','S2','S8']);assert.equal(bv.reduce((s,r)=>s+r.minutes,0),210);
 assert.deepEqual(ids(dataView(a,{...solved(a),operator:'gt'}).visible),['S5']);
 assert.deepEqual(ids(dataView(b,{...solved(b),logic:'and'}).visible),['S4','S7','S2']);
 assert.equal(dataView(a,{...solved(a),threshold:'999'}).visible.length,0);
 assert.equal(dataView(a,{...a.defaults,logic:'or'}).visible.length,8);
 assert.equal(dataView(a,{...a.defaults,threshold:'0'}).visible.length,8);
 assert.equal(dataView(t,{...t.defaults,threshold:'0',operator:'lt'}).visible.length,0);
 assert.deepEqual(ids(dataView(t,solved(t)).visible),['M1','M2','M3','M4']);
 assert.equal(JSON.stringify(a.records),original);
 for(const row of av)assert.deepEqual(row,a.records.find(r=>r.id===row.id));
});
test('grading checks explicit operations, not just coincidentally identical outputs',()=>{
 for(const l of labs){
  assert.equal(gradeDataLab(l,{controls:solved(l)}).correct,4);
  const refs=new Set(c.units.flatMap(u=>u.sections.map(s=>`${u.id}/${s.id}`)));
  assert.deepEqual(validateDataLab(l,refs),[]);
  const broken=structuredClone(l);broken.tasks[0].help='unknown/no';assert.ok(validateDataLab(broken,refs).length);
 }
 const l=labs[2],controls={...solved(l),threshold:'0'};
 assert.equal(dataView(l,controls).visible.length,4);
 assert.equal(gradeDataLab(l,{controls}).results[1].correct,false);
 assert.equal(gradeDataLab(labs[0],{controls:{...solved(labs[0]),threshold:'30,0'}}).correct,4);
});
test('chart scope is independent and numerical X distances are proportional, not categorical',()=>{
 const a=labs[0],t=labs[2];
 const v=dataView(a,{...solved(a),scope:'all'});assert.equal(v.visible.length,3);assert.equal(v.chartRows.length,8);
 const chart=dataChart(t,solved(t),dataView(t,solved(t)).chartRows);
 const xs=[...chart.matchAll(/<circle cx="([\d.]+)"/g)].map(m=>Number(m[1]));
 // Original order: days 5, 0, 10, 2. Compare unequal intervals numerically.
 assert.ok(Math.abs((xs[2]-xs[0])/(xs[3]-xs[1])-2.5)<1e-10);
 assert.match(dataChart(a,{...solved(a),chart:'scatter'},v.visible),/variabile numerica/);
 assert.match(dataChart(a,solved(a),[]),/grafico è vuoto/);
 assert.ok(!chart.includes('NaN'));
 const malicious=structuredClone(a);malicious.records[0].id='<img onerror="alert(1)">';
 assert.ok(!dataLabPrint(malicious,false).includes('<img'));
});
test('data lab backup is optional, round-trips and merges controls without erasing older progress',()=>{
 const old=freshState();delete old.labs;assert.deepEqual(validateState(old),old);
 const a=freshState();a.notes.cellula='Preserve';a.labs[labs[0].id]={cells:{},controls:solved(labs[0]),report:'Report',assisted:false,checks:[]};
 assert.deepEqual(validateState(JSON.parse(JSON.stringify(a))),a);
 const b=structuredClone(a);b.labs[labs[0].id].controls.group='B';b.labs[labs[0].id].assisted=true;
 const merged=mergeState(a,b);assert.equal(merged.labs[labs[0].id].controls.group,'A');assert.equal(merged.labs[labs[0].id].assisted,true);assert.equal(merged.notes.cellula,'Preserve');
 b.labs[labs[0].id].controls.unknown='x';assert.throws(()=>validateState(b),/Controlli/);
 assert.equal(dataControls(labs[0],{controls:{chart:'unknown',x:'invalid'}}).chart,labs[0].defaults.chart);
});
