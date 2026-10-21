import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const [c,e,a]=await Promise.all(['course','exercises','development-audit'].map(async n=>JSON.parse(await readFile(new URL(`../data/${n}.json`,import.meta.url),'utf8'))));
const ids=['english-frase','english-tempi','english-communication','english-movement','english-evidence','english-revision','chimica-materia-soluzioni','cellula-comparti-verifica'];
const exam=c.exams.find(e=>e.id==='inglese');
assert.equal(exam.programme.currentSyllabusConfirmed,false);
const qs=e.questions.filter(q=>ids.includes(q.unit));assert.equal(qs.length,128);
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await context.newPage();
 const network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto(`${url}#exam/inglese`);assert.equal(await page.locator('.unit-card').count(),12);
 for(const id of ids){
  const unit=c.units.find(u=>u.id===id);
  for(const s of unit.sections)assert.ok(c.exams.some(e=>e.programme.topics.some(t=>t.refs.includes(`${id}/${s.id}`))));
  await page.goto(`${url}#lesson/${id}`);await page.getByRole('heading',{name:unit.title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);await noOverflow();
  await page.locator('.oral summary').click();assert.ok((await page.locator('.oral details').textContent()).includes(unit.oral.answer));
  for(const table of await page.locator('.table-wrap').all()){
   await table.scrollIntoViewIfNeeded();await table.evaluate(el=>el.scrollLeft=el.scrollWidth);
   assert.ok(await table.evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
  }
  if(id==='english-frase')await page.locator('.table-wrap').last().screenshot({path:`${artifacts}/english-pdf-trace-mobile.png`});
 }
 let checked=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=freshState();state.notes.cellula='Appunto preesistente';state.settings.theme='dark';
  state.labs['foglio-sedute']={cells:{D2:'=B2*C2'},report:'Report precedente',assisted:false,checks:[]};
  state.active={id:`info-${q.id}-${wrong.id}`,startedAt:new Date().toISOString(),title:'Inglese e PDF',kind:'practice',index:0,items:[{qid:q.id,seed:11,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const [uid,sid]=wrong.help.split('/'),section=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid),help=await page.locator('.inline-lesson').textContent();
  for(const paragraph of [...section.text,section.example,section.takeaway])assert.ok(help.includes(paragraph));
  if(section.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),section.table.rows.length);
  await noOverflow();
  if(q.id==='en-english-revision-paragrafo-0'&&wrong.id==='errore-1')await page.screenshot({path:`${artifacts}/english-pdf-help-dark-mobile.png`,fullPage:true});
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.notes.cellula,'Appunto preesistente');assert.equal(stored.settings.theme,'dark');
  assert.equal(stored.labs['foglio-sedute'].cells.D2,'=B2*C2');assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,wrong.help);
  if(++checked%32===0)console.log(`Inglese e PDF: ${checked}/256 feedback verificati.`);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  assert.equal(await page.locator('#main > .question').count(),17);assert.equal(await page.locator('.print-solutions .question').count(),16);
 }
 await page.emulateMedia({media:'print'});await page.pdf({path:`${artifacts}/english-pdf-quaderno.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log(`Inglese e PDF OK: 8 capitoli, ${checked} feedback con aiuto integrale, progressi/tema/laboratori, mobile e stampa offline.`);
}finally{await browser.close();}
