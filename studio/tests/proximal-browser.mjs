import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const c=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const e=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const ids=['anatomia-spalla-braccio','anatomia-anca-coscia'];
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 for(const [i,id]of ids.entries()){
  await page.goto(`${url}#lesson/${id}`);
  await page.getByRole('heading',{name:c.units.find(u=>u.id===id).title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);
  assert.equal(await page.locator('.table-wrap').count(),i===0?4:3);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.oral summary').click();
  assert.ok(await page.locator('.oral details p').isVisible());
  await page.locator('.table-wrap').first().screenshot({path:`${artifacts}/${id}-table.png`});
  await page.locator('.table-wrap').first().evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  assert.ok(await page.locator('.table-wrap').first().evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
  await page.locator('.table-wrap').first().screenshot({path:`${artifacts}/${id}-table-right.png`});
 }
 const qs=e.questions.filter(q=>ids.includes(q.unit));
 assert.equal(qs.length,24);
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=freshState();
  state.active={id:`proximal-${q.id}-${wrong.id}`,startedAt:new Date().toISOString(),title:'Anatomia regionale',kind:'practice',index:0,
   items:[{qid:q.id,seed:10,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const section=c.units.find(u=>u.id===q.unit).sections.find(s=>s.id===q.concept);
  assert.ok((await page.locator('.inline-lesson').textContent()).includes(section.example));
  if(section.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),section.table.rows.length);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,q.help);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  assert.equal(await page.locator('#main > .question').count(),13);
  assert.equal(await page.locator('.print-solutions .question').count(),12);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${artifacts}/${id}.pdf`,format:'A4',printBackground:true});
 }
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Anatomia prossimale OK: 2 lezioni, 7 tabelle, 48 risposte errate con aiuto e persistenza, prove aperte, mobile e stampa offline.');
}finally{await browser.close();}
