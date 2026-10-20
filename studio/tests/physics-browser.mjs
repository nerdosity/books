import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
import {makeQuestion} from '../lib/engine.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const exercises=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const url=pathToFileURL(outputFile).href,artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:1200,height:900}});
 const page=await context.newPage(),errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 for(const [unit,demo,value,pattern] of [
   ['fisica-idrostatica','manometer',-12,/98\.824/],
   ['fisica-campi','flux',90,/= 0 N/],
   ['fisica-immagini','attenuation',0,/Trasmissione: 100%/]
 ]){
  await page.goto(`${url}#lesson/${unit}`);
  const panel=page.locator(`[data-physics-demo="${demo}"]`);await panel.waitFor();
  await panel.locator('input').evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  assert.match(await panel.locator('.physics-demo-view').innerText(),pattern);
  assert.equal(await panel.locator('svg[role=img]').count(),1);
 }
 await page.goto(`${url}#lesson/fisica-idrostatica/manometro`);
 await page.locator('[data-physics-demo]').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${artifacts}/fisica-manometro.png`});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('[data-physics-demo]').screenshot({path:`${artifacts}/fisica-manometro-mobile.png`});
 const templates=exercises.templates.filter(t=>t.id.endsWith('-v1')&&t.unit.startsWith('fisica-'));
 for(const t of templates){
  const q=makeQuestion(t,42),state=freshState();
  state.active={id:`test-${t.id}`,startedAt:new Date().toISOString(),title:'Fisica: applicazioni',kind:'practice',index:0,
    items:[{qid:t.id,seed:42,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator('input[name=answer]').fill(String(q.diagnoses[0].value));
  await page.locator('select[name=answerUnit]').selectOption(q.answerUnit);
  await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.inline-lesson').waitFor();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(saved.attempts[0].correct,false);assert.equal(saved.attempts[0].help,q.diagnoses[0].help);
  assert.ok(await page.locator('.inline-lesson .example').isVisible());
  await page.reload();await page.locator('.feedback').first().waitFor();
  assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY)).attempts.length,1);
 }
 await page.goto(`${url}#print/scienze-base`);
 assert.ok(await page.locator('.physics-demo svg').count()>=3);
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.physics-demo input:visible').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log('Fisica browser OK: schemi interattivi offline, segni e angoli, mobile, sei generatori con aiuto, persistenza e stampa.');
}finally{await browser.close();}
