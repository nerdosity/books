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
const id='anatomia-scheletro-visivo',fig=c.figures.find(f=>f.id==='skeleton-unlabelled');
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(`${url}#lesson/${id}`);
 await page.locator('.marked-anatomy').first().waitFor();
 assert.equal(await page.locator('.marker-legend').count(),3);
 assert.equal(await page.locator('.marked-anatomy').first().locator('.marker-letter').count(),10);
 await page.locator('.marked-anatomy').first().scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const i=document.querySelector('.marked-anatomy img');return i.complete&&i.naturalWidth===960;});
 await page.locator('.marked-anatomy').first().screenshot({path:`${artifacts}/scheletro-mobile.png`});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 for(const q of e.questions.filter(q=>q.unit===id)){
  const state=freshState();
  state.active={id:`bones-${q.id}`,startedAt:new Date().toISOString(),title:'Ossa e articolazioni',kind:'practice',index:0,
   items:[{qid:q.id,seed:1,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();
  await page.locator('#answer-form').waitFor();
  assert.equal(await page.locator('.question .marker-legend').count(),0);
  if(q.figureId===fig.id){
   assert.equal(await page.locator('.question .marker-letter').count(),10);
   const html=await page.locator('.question .anatomy-figure').innerHTML();
   for(const m of fig.markers)assert.ok(!html.includes(m.label),'Test figure must not contain hidden legend labels.');
   await page.locator('a[href$="/test"]').click();
   assert.equal(await page.locator('.marker-legend').count(),0);
   assert.equal(await page.locator('.marker-letter').count(),10);
   await page.getByRole('link',{name:'Torna all’esercizio'}).click();
  }
  const wrong=q.options.find(o=>o.id!==q.answer);
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  if(q.concept!=='sinoviale')assert.equal(await page.locator('.inline-lesson .marker-legend dd').count(),10);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload();await page.locator('.feedback').first().waitFor();
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),STORAGE_KEY);
  assert.equal(saved.attempts.length,1);assert.equal(saved.attempts[0].help,q.help);
 }
 await page.goto(`${url}#print/${id}`);
 await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
 assert.equal(await page.locator('.question .marker-legend').count(),0);
 assert.equal(await page.locator('.marker-legend').count(),3);
 await page.emulateMedia({media:'print'});
 await page.pdf({path:`${artifacts}/scheletro.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Ossa OK: 12 quiz, legenda assente nei test e ingrandimenti, recupero con legenda, persistenza, mobile e stampa offline.');
}finally{await browser.close();}
