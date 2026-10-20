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
const ids=['anatomia-cuore','anatomia-ciclo-vasi'];
const figure=c.figures.find(f=>f.id==='heart-internal');
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 for(const id of ids){
  await page.goto(`${url}#lesson/${id}`);
  await page.getByRole('heading',{name:c.units.find(u=>u.id===id).title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.oral summary').click();
  assert.ok(await page.locator('.oral details p').isVisible());
 }
 await page.locator('.table-wrap').screenshot({path:`${artifacts}/ciclo-cardiaco-mobile.png`});
 await page.locator('.table-wrap').evaluate(el=>{el.scrollLeft=el.scrollWidth;});
 assert.ok(await page.locator('.table-wrap').evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
 await page.goto(`${url}#figure/heart-internal`);
 await page.waitForFunction(()=>document.querySelector('.anatomy-figure img')?.naturalWidth===1656);
 assert.ok((await page.locator('figcaption').textContent()).includes(figure.guide));
 assert.ok((await page.locator('.figure-credit').textContent()).includes('CC BY 3.0'));
 await page.screenshot({path:`${artifacts}/cuore-mobile.png`,fullPage:true});
 await page.setViewportSize({width:1280,height:900});
 await page.screenshot({path:`${artifacts}/cuore-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});
 const qs=e.questions.filter(q=>ids.includes(q.unit));assert.equal(qs.length,24);
 assert.equal(qs.filter(q=>q.figureId).length,5);
 for(const q of qs){
  const state=freshState();
  state.active={id:`heart-${q.id}`,startedAt:new Date().toISOString(),title:'Cuore e vasi',kind:'practice',index:0,
   items:[{qid:q.id,seed:10,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  if(q.figureId){
   await page.waitForFunction(()=>document.querySelector('.question .anatomy-figure img')?.naturalWidth===1656);
   assert.ok(!(await page.locator('.question figcaption').textContent()).includes(figure.guide));
   await page.locator('a[href$="heart-internal/test"]').click();
   assert.ok(!(await page.locator('figcaption').textContent()).includes(figure.guide));
   await page.getByRole('link',{name:'Torna all’esercizio'}).click();
  }
  const wrong=q.options.find(o=>o.id!==q.answer);
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const section=c.units.find(u=>u.id===q.unit).sections.find(s=>s.id===q.concept);
  assert.ok((await page.locator('.inline-lesson').textContent()).includes(section.example));
  if(section.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),4);
  if(section.figureIds)assert.ok((await page.locator('.inline-lesson figcaption').textContent()).includes(figure.guide));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,q.help);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  assert.equal(await page.locator('#main > .question').count(),13);
  assert.equal(await page.locator('.print-solutions .question').count(),12);
  if(id==='anatomia-cuore')assert.equal(await page.locator('#main > .question .anatomy-figure').count(),5);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${artifacts}/${id}.pdf`,format:'A4',printBackground:true});
 }
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Cuore OK: 24 quiz e aiuti persistenti, 5 prove su tavola, ingrandimento, attribuzione, mobile, tabella e stampa offline.');
}finally{await browser.close();}
