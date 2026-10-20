import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY,validateState} from '../lib/state.js';
import {makeQuestion} from '../lib/engine.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const c=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const e=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const ids=['metabolismo-controllo','genoma-rna-segnali'];
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 for(const id of ids){
  await page.goto(`${url}#lesson/${id}`);
  await page.getByRole('heading',{name:c.units.find(u=>u.id===id).title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.oral summary').click();assert.ok(await page.locator('.oral details p').isVisible());
 }
 await page.locator('.table-wrap').screenshot({path:`${artifacts}/dna-forms-mobile.png`});
 await page.locator('.table-wrap').evaluate(el=>{el.scrollLeft=el.scrollWidth;});
 assert.ok(await page.locator('.table-wrap').evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
 await page.locator('.table-wrap').screenshot({path:`${artifacts}/dna-forms-mobile-right.png`});
 async function start(qid){
  const state=freshState();state.notes.cellula='Appunto precedente da conservare';state.read.cellula='2026-10-19T12:00:00.000Z';
  state.active={id:`bio-${qid}`,startedAt:new Date().toISOString(),title:'Biochimica e genoma',kind:'practice',index:0,
   items:[{qid,seed:10,assisted:false,attemptId:null}]};
  validateState(state);
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
 }
 async function persisted(qid,correct){
  await page.reload();await page.locator('.feedback').first().waitFor();
  const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(state.attempts.length,1);assert.equal(state.attempts[0].qid,qid);assert.equal(state.attempts[0].correct,correct);
  assert.equal(state.notes.cellula,'Appunto precedente da conservare');assert.equal(state.read.cellula,'2026-10-19T12:00:00.000Z');
 }
 const qs=e.questions.filter(q=>q.id.startsWith('bio-integration-'));assert.equal(qs.length,24);
 let checked=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  await start(q.id);
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const s=c.units.find(u=>u.id===q.unit).sections.find(s=>s.id===q.concept);
  assert.ok((await page.locator('.inline-lesson').textContent()).includes(s.example));
  if(s.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),s.table.rows.length);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await persisted(q.id,false);
  if(++checked%16===0)console.log(`Verificati ${checked}/48 feedback e aiuti.`);
 }
 const def=e.templates.find(t=>t.generator==='adenylateCharge'),numeric=makeQuestion(def,10);
 const cases=[...numeric.diagnoses.map(d=>({answer:String(d.value),unit:numeric.answerUnit,correct:false,message:d.message})),
  {answer:numeric.answer.toFixed(3).replace('.',','),unit:numeric.answerUnit,correct:true,message:'Risultato e unità corretti.'},
  {answer:String(numeric.answer),unit:'ATP',correct:false,message:'L\'unità richiesta è adimensionale'}];
 for(const item of cases){
  await start(def.id);assert.match(await page.locator('#main').innerText(),/Tolleranza assoluta: ±0,001/);
  await page.locator('[name=answer]').fill(item.answer);await page.locator('[name=answerUnit]').selectOption(item.unit);
  await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.feedback').first().waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(item.message));
  if(!item.correct)assert.ok((await page.locator('.inline-lesson').textContent()).includes('2 ADP'));
  await persisted(def.id,item.correct);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  const count=[...e.questions,...e.templates].filter(q=>q.unit===id).length;
  assert.equal(await page.locator('#main > .question').count(),count+1);
  assert.equal(await page.locator('.print-solutions .question').count(),count);
 }
 await page.emulateMedia({media:'print'});await page.pdf({path:`${artifacts}/genome-rna.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Biologia/energia OK: 24 quiz, 48 feedback, cinque casi numerici, persistenza e appunti precedenti, aiuti, tabella, mobile e stampa offline.');
}finally{await browser.close();}
