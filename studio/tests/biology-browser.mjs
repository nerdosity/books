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
const ids=['proteine-destino','dna-tecnologie'];
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
 const diagram=page.locator('[data-biology-diagram="dna-gel"]');
 await diagram.scrollIntoViewIfNeeded();
 await diagram.screenshot({path:`${artifacts}/dna-gel-mobile.png`});
 // The SVG and textual alternative must agree with the worked example.
 assert.match(await diagram.locator('svg').getAttribute('aria-label'),/800, 400 e 200/);
 assert.equal(await diagram.locator('svg rect[fill="#174b42"]').count(),6);
 // Exercise every new section through the real feedback/help/persistence flow.
 for(const id of ids)for(const section of c.units.find(u=>u.id===id).sections){
  const q=e.questions.find(q=>q.unit===id&&q.concept===section.id&&q.level==='applicazione');
  const state=freshState();
  state.active={id:`biology-${id}-${section.id}`,startedAt:new Date().toISOString(),title:'Esperimenti molecolari',kind:'practice',index:0,
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
  if(section.diagram)assert.ok(await page.locator('.inline-lesson [data-biology-diagram="dna-gel"]').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,q.help);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);
  await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  await page.emulateMedia({media:'print'});
  if(id==='dna-tecnologie')assert.ok(await page.locator('[data-biology-diagram="dna-gel"]').isVisible());
  await page.pdf({path:`${artifacts}/${id}.pdf`,format:'A4',printBackground:true});
 }
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Biologia OK: due lezioni, otto sezioni con recupero specifico, gel in lezione/aiuto/stampa, persistenza, mobile e PDF offline.');
} finally {await browser.close();}
