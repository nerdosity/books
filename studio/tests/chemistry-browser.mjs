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
const ids=['chimica-struttura-equilibrio','soluzioni-quantitative','organica-anelli-reazioni','mitocondri-navette'];
const illustrated={'organica-anelli-reazioni':['conformazioni','chair-flip'],'mitocondri-navette':['glicerofosfato','redox-shuttles']};
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
  if(illustrated[id]){
   const figure=page.locator(`[data-chemistry-diagram="${illustrated[id][1]}"]`);
   await figure.scrollIntoViewIfNeeded();
   assert.ok(await figure.isVisible());
   await figure.screenshot({path:`${artifacts}/${illustrated[id][1]}-mobile.png`});
  }
 }
 // Each unit is exercised through correction, its actual inline lesson, and persistence.
 for(const id of ids){
  const q=e.questions.find(q=>q.unit===id&&q.level==='applicazione'&&(!illustrated[id]||q.concept===illustrated[id][0]));
  const state=freshState();
  state.active={id:`chemistry-${id}`,startedAt:new Date().toISOString(),title:'Chimica e trasporti',kind:'practice',index:0,
   items:[{qid:q.id,seed:10,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();
  await page.locator('#answer-form').waitFor();
  const wrong=q.options.find(o=>o.id!==q.answer);
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  assert.ok(await page.locator('.inline-lesson .example').isVisible());
  if(illustrated[id])assert.equal(await page.locator(`.inline-lesson [data-chemistry-diagram="${illustrated[id][1]}"]`).count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.attempts[0].correct,false);assert.equal(stored.attempts[0].help,q.help);
  await page.reload();await page.locator('.feedback').first().waitFor();
  assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY)).attempts.length,1);
 }
 for(const [id,[,diagram]] of Object.entries(illustrated)){
  await page.goto(`${url}#print/${id}`);
  await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  await page.emulateMedia({media:'print'});
  assert.ok(await page.locator(`[data-chemistry-diagram="${diagram}"]`).isVisible());
  await page.pdf({path:`${artifacts}/${diagram}.pdf`,format:'A4',printBackground:true});
 }
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Chimica OK: quattro lezioni offline/mobile, due schemi in lezioni/aiuti/stampa, errori specifici e persistenza. Zero richieste HTTP.');
} finally {await browser.close();}
