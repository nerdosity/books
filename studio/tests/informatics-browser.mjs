import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const [c,e,a]=await Promise.all(['course','exercises','development-audit'].map(async n=>JSON.parse(await readFile(new URL(`../data/${n}.json`,import.meta.url),'utf8'))));
const ids=['informatica-calcolo','informatica-archivi','informatica-servizi','informatica-progetto'];
const exam=c.exams.find(e=>e.id==='informatica'),mapping=a.syllabusAudits.find(x=>x.id==='informatica-analitico-2022');
assert.equal(mapping.requirements.length,28);assert.equal(exam.programme.currentSyllabusConfirmed,false);
assert.equal(mapping.requirements.filter(r=>r.status==='missing').length,1);
assert.equal(mapping.requirements.filter(r=>r.status==='partial').length,2);
for(const row of mapping.requirements){
 if(row.status!=='missing')assert.ok(row.refs.length&&row.questionIds.length);
 for(const ref of row.refs){const [uid,sid]=ref.split('/');assert.ok(c.units.find(u=>u.id===uid)?.sections.some(s=>s.id===sid));assert.ok(exam.programme.topics.some(t=>t.refs.includes(ref)));}
 for(const id of row.questionIds){const q=e.questions.find(q=>q.id===id);assert.ok(q&&row.refs.includes(q.help));}
}
const qs=e.questions.filter(q=>ids.includes(q.unit));assert.equal(qs.length,64);
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await context.newPage();
 const network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto(`${url}#exam/informatica`);assert.equal(await page.locator('.unit-card').count(),10);
 for(const id of ids){
  const unit=c.units.find(u=>u.id===id);
  for(const s of unit.sections)assert.ok(exam.programme.topics.some(t=>t.refs.includes(`${id}/${s.id}`)));
  await page.goto(`${url}#lesson/${id}`);await page.getByRole('heading',{name:unit.title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);await noOverflow();
  await page.locator('.oral summary').click();assert.ok((await page.locator('.oral details').textContent()).includes(unit.oral.answer));
  for(const table of await page.locator('.table-wrap').all()){
   await table.scrollIntoViewIfNeeded();await table.evaluate(el=>el.scrollLeft=el.scrollWidth);
   assert.ok(await table.evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
  }
  if(id==='informatica-calcolo')await page.locator('.table-wrap').last().screenshot({path:`${artifacts}/informatics-trace-mobile.png`});
 }
 let checked=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=freshState();state.notes.cellula='Appunto preesistente';state.settings.theme='dark';
  state.labs['foglio-sedute']={cells:{D2:'=B2*C2'},report:'Report precedente',assisted:false,checks:[]};
  state.active={id:`info-${q.id}-${wrong.id}`,startedAt:new Date().toISOString(),title:'Informatica',kind:'practice',index:0,items:[{qid:q.id,seed:11,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const [uid,sid]=wrong.help.split('/'),section=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid),help=await page.locator('.inline-lesson').textContent();
  for(const paragraph of [...section.text,section.example,section.takeaway])assert.ok(help.includes(paragraph));
  if(section.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),section.table.rows.length);
  await noOverflow();
  if(q.id==='it-informatica-progetto-report-0'&&wrong.id==='errore-1')await page.screenshot({path:`${artifacts}/informatics-help-dark-mobile.png`,fullPage:true});
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.notes.cellula,'Appunto preesistente');assert.equal(stored.settings.theme,'dark');
  assert.equal(stored.labs['foglio-sedute'].cells.D2,'=B2*C2');assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,wrong.help);
  if(++checked%32===0)console.log(`Informatica: ${checked}/128 feedback verificati.`);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  assert.equal(await page.locator('#main > .question').count(),17);assert.equal(await page.locator('.print-solutions .question').count(),16);
 }
 await page.emulateMedia({media:'print'});await page.pdf({path:`${artifacts}/informatics-quaderno.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log(`Informatica OK: 28 righe di audit, 4 capitoli, ${checked} feedback con aiuto integrale, progressi/tema/laboratori, mobile e stampa offline.`);
}finally{await browser.close();}
