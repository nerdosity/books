import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const c=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const e=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const exam=c.exams.find(x=>x.id==='scienze-giuridiche'),ids=exam.modules.flatMap(m=>m.unitIds),units=ids.map(id=>c.units.find(u=>u.id===id));
const qs=e.questions.filter(q=>ids.includes(q.unit)),url=pathToFileURL(outputFile).href;
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await context.newPage();
 const errors=[],requests=[];page.on('pageerror',x=>errors.push(x.message));context.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.goto(url);
 const state=freshState();state.notes['diritto-soggetti']='Appunto precedente da conservare';state.read.cellula='2026-10-20T10:00:00Z';state.settings.theme='dark';
 const old=qs.find(q=>q.id==='y1-diritto-soggetti-norme');
 state.active={id:'legacy-law',startedAt:new Date().toISOString(),title:'Progresso precedente',kind:'practice',index:0,items:[{qid:old.id,seed:19,assisted:false,attemptId:null}]};
 await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
 await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
 await page.locator('input[name=answer][value="'+old.answer+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.feedback').first().waitFor();
 const base=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);assert.equal(base.attempts.length,1);
 for(const u of units){
  await page.goto(url+'#lesson/'+u.id);await page.getByRole('heading',{name:u.title,exact:true,level:1}).waitFor();
  assert.equal(await page.locator('.lesson-sources').getAttribute('open'),null);
  assert.equal(await page.locator('.example').count(),4);
  await page.locator('.oral summary').click();assert.ok((await page.locator('.oral').textContent()).includes(u.oral.answer));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),u.id);
  const plate=page.locator('.law-diagram');
  if(await plate.count()){
   await plate.screenshot({path:artifacts+'/'+u.id+'-dark.png'});
   await page.selectOption('#appearance','light');await plate.screenshot({path:artifacts+'/'+u.id+'-light.png'});
   await page.selectOption('#appearance','dark');
  }
  await page.locator('.lesson-sources summary').click();
  assert.deepEqual(await page.locator('.lesson-sources a').evaluateAll(as=>as.map(a=>a.href)),u.sources.map(id=>c.sources.find(s=>s.id===id).url));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),u.id+' sources');
 }
 let checked=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=structuredClone(base);state.active={id:'law-check-'+q.id+'-'+wrong.id,startedAt:new Date().toISOString(),title:'Giuridiche',kind:'practice',index:0,items:[{qid:q.id,seed:17,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator('input[name=answer][value="'+wrong.id+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback),q.id);
  const s=c.units.find(u=>u.id===q.unit).sections.find(s=>s.id===q.help.split('/')[1]),help=await page.locator('.inline-lesson').textContent();
  for(const p of [...s.text,s.example,s.takeaway])assert.ok(help.includes(p),q.id+' help incomplete');
  if(s.diagram)assert.equal(await page.locator('.inline-lesson [data-law-diagram="'+s.diagram+'"]').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),q.id);
  if(++checked%40===0){
   await page.reload();await page.locator('.feedback').first().waitFor();
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
   assert.deepEqual(saved.attempts[0],base.attempts[0]);assert.equal(saved.notes['diritto-soggetti'],base.notes['diritto-soggetti']);assert.equal(saved.read.cellula,base.read.cellula);
   console.log('Verificati '+checked+'/320 feedback e aiuti.');
  }
 }
 await page.goto(url+'#exam/scienze-giuridiche');await page.locator('.programme-map').waitFor();
 assert.equal(await page.locator('.programme-map').getAttribute('open'),null);
 await page.locator('.programme-map summary').click();assert.ok((await page.locator('.programme-map').textContent()).includes('Ulteriori dispense'));
 await page.goto(url+'#print/scienze-giuridiche');await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
 assert.equal(await page.locator('.law-diagram').count(),3);
 assert.equal(await page.locator('.print-solutions .question').count(),160);
 assert.equal(await page.locator('.print-solutions .oral').count(),20);
 assert.equal(await page.locator('.table-wrap').count(),7);
 await page.emulateMedia({media:'print'});await page.pdf({path:artifacts+'/giuridiche-verifica-stampa.pdf',format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('Giuridiche OK: 20 lezioni, 320 feedback, aiuti completi, tre tavole, mobile chiaro/scuro, fonti chiuse, quaderno, progressi conservati, zero rete.');
}finally{await browser.close()}

