import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const read=async n=>JSON.parse(await readFile(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const[c,e,a]=await Promise.all(['course','exercises','materials-20261104-audit'].map(read));
const units=a.additions.unitIds.map(id=>c.units.find(u=>u.id===id));
const revisedRefs=['neuro-movimento/piano','neuro-movimento/riflessi','neuro-esercizio-dopamina/fatica','neuro-lateralizzazione/split','neuro-lateralizzazione/linguaggio','neuro-memoria/hebb','neuro-organizzazione/corteccia','psico-sonno-stati/sogni','psico-ricerca-imagery/inferenze'];
const qs=e.questions.filter(q=>a.additions.questionIds.includes(q.id)&&(!process.env.NOV04_REVIEW_ONLY||revisedRefs.includes(q.help)));
const url=pathToFileURL(outputFile).href,artifacts=fileURLToPath(new URL('../.local/incoming-nov04/browser/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
try{
 const ctx=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(url);const state=freshState();state.notes.cellula='Appunto precedente conservato';state.read.piani='2026-10-20T10:00:00Z';state.settings.theme='dark';
 const old=e.questions.find(q=>q.id==='an-piani-1');
 state.active={id:'old-progress',startedAt:new Date().toISOString(),title:'Prima dell’integrazione',kind:'practice',index:0,items:[{qid:old.id,seed:17,assisted:false,attemptId:null}]};
 await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
 await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
 await page.locator('input[name=answer][value="'+old.answer+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.feedback').first().waitFor();
 const base=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
 for(const u of units){
  await page.goto(url+'#lesson/'+u.id);await page.getByRole('heading',{name:u.title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),u.sections.length);
  const text=await page.locator('.lesson').textContent();for(const s of u.sections)for(const p of s.text)assert.ok(text.includes(p),u.id+' text missing');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),u.id+' overflow');
  await page.locator('.oral summary').click();assert.ok((await page.locator('.oral').textContent()).includes(u.oral.answer));
  for(const s of u.sections.filter(s=>a.additions.diagramIds.includes(s.diagram))){
   const diagram=page.locator('[data-study-diagram="'+s.diagram+'"]');
   for(const mode of ['light','dark']){await page.selectOption('#appearance',mode);await diagram.screenshot({path:artifacts+s.diagram+'-'+mode+'.png'});}
   await diagram.locator('.study-zoom summary').click();
   const region=diagram.locator('.study-zoom>div');assert.ok(await region.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert.ok(await region.locator('svg').evaluate(el=>el.getBoundingClientRect().width>=660));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'zoom must scroll inside the figure');
   await diagram.locator('.study-zoom summary').click();
  }
 }
 console.log('25 lezioni e 9 schemi verificati su mobile, chiaro/scuro.');
 let count=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=structuredClone(base);state.active={id:'nov-'+q.id+'-'+wrong.id,startedAt:new Date().toISOString(),title:'Materiali integrati',kind:'practice',index:0,items:[{qid:q.id,seed:17,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator('input[name=answer][value="'+wrong.id+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback),q.id);
  const[uid,sid]=q.help.split('/'),s=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid),help=await page.locator('.inline-lesson').textContent();
  for(const p of [...s.text,s.example,s.takeaway])assert.ok(help.includes(p),q.id+' incomplete help');
  if(a.additions.diagramIds.includes(s.diagram))assert.equal(await page.locator('.inline-lesson [data-study-diagram="'+s.diagram+'"]').count(),1);
  if(s.table)for(const row of s.table.rows)for(const cell of row)assert.ok(help.includes(cell),q.id+' missing table');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),q.id+' overflow');
  if(++count%50===0)console.log('Feedback verificati: '+count+'/'+(qs.length*2));
 }
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
 assert.deepEqual(saved.attempts[0],base.attempts[0]);assert.equal(saved.notes.cellula,base.notes.cellula);assert.equal(saved.read.piani,base.read.piani);
 for(const u of units){
  await page.goto(url+'#print/'+u.id);await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
  const text=await page.locator('#main').textContent();for(const s of u.sections)for(const p of [...s.text,s.example,s.takeaway])assert.ok(text.includes(p),u.id+' print');
  assert.equal(await page.locator('.print-solutions .question').count(),e.questions.filter(q=>q.unit===u.id).length);
 }
 await page.goto(url+'#print/biochimica-leggere-molecole');await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
 await page.emulateMedia({media:'print'});await page.pdf({path:artifacts+'molecole-print.pdf',format:'A4',printBackground:true});
 const html=await readFile(outputFile,'utf8');assert.ok(!/data:application\/(?:pdf|vnd\.openxmlformats)/.test(html));
 for(const doc of a.documents)assert.ok(!html.includes(doc.file),doc.file+' leaked into delivery');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('OK: 25 lezioni, '+count+' feedback e aiuti completi, 9 schemi, stampa e vecchi progressi; zero allegati e zero richieste di rete.');
}finally{await browser.close();}
