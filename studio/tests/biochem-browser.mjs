import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
import {makeQuestion} from '../lib/engine.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
await build();
const exercises=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const course=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const url=pathToFileURL(outputFile).href;
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 const ids=['chimica-organica','stereochimica-glucidi','chimica-equilibri','glicogeno-pentosi','lipidi-sintesi','lipidi-ossidazione','amminoacidi-urea'];
 for(const id of ids){
  await page.goto(`${url}#lesson/${id}`);
  await page.getByRole('heading',{name:course.units.find(u=>u.id===id).title,exact:true,level:1}).waitFor();
  assert.ok(await page.locator('.example').count()>=4);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id);
 }
 await page.screenshot({path:`${artifacts}/biochimica-urea-mobile.png`,fullPage:true});
 for(const [id,diagnosis] of [['num-buffer-ph',0],['num-beta-yield-v1',0]]){
  const q=makeQuestion(exercises.templates.find(t=>t.id===id),17);
  const state=freshState();
  state.active={id:`test-${id}`,startedAt:new Date().toISOString(),title:'Calcoli di biochimica',kind:'practice',index:0,
   items:[{qid:id,seed:17,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();
  await page.locator('#answer-form').waitFor();
  await page.locator('input[name=answer]').fill(String(q.diagnoses[diagnosis].value).replace('.',','));
  await page.locator('select[name=answerUnit]').selectOption(q.answerUnit);
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(saved.attempts[0].correct,false);
  assert.equal(saved.attempts[0].help,q.diagnoses[diagnosis].help);
  assert.ok(await page.locator('.inline-lesson .example').isVisible());
  await page.reload();await page.locator('.feedback').first().waitFor();
  assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY)).attempts.length,1);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log('Biochimica browser OK: sette lezioni offline e mobile, calcoli, diagnosi specifiche, aiuto interno e persistenza.');
}finally{await browser.close();}
