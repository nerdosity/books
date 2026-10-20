import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY,validateState} from '../lib/state.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const c=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const e=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const audit=JSON.parse(await readFile(new URL('../data/development-audit.json',import.meta.url),'utf8'));
const ids=['composizione-corporea','cellula-strutture','genetica-microbica'];
const mapping=audit.syllabusAudits.find(x=>x.id==='bio-body-microbes-2016');
assert.equal(mapping.requirements.length,11);
for(const row of mapping.requirements){
 assert.ok(row.questionIds.length,`${row.topic}: nessuna verifica`);
 for(const ref of row.refs){const [uid,sid]=ref.split('/');assert.ok(c.units.find(u=>u.id===uid)?.sections.some(s=>s.id===sid));}
 for(const id of row.questionIds)assert.ok(row.refs.includes([...e.questions,...e.templates].find(q=>q.id===id)?.help));
}
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 for(const id of ids){
  await page.goto(`${url}#lesson/${id}`);
  await page.getByRole('heading',{name:c.units.find(u=>u.id===id).title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.oral summary').click();assert.ok(await page.locator('.oral details p').isVisible());
  const table=page.locator('.table-wrap');
  await table.screenshot({path:`${artifacts}/${id}-table.png`});
  await table.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  assert.ok(await table.evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
  await table.screenshot({path:`${artifacts}/${id}-table-right.png`});
 }
 const qs=e.questions.filter(q=>q.id.startsWith('bio-body-microbes-'));assert.equal(qs.length,36);
 let checked=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=freshState();state.notes.cellula='Appunto precedente';state.read.cellula='2026-10-19T12:00:00.000Z';
  state.active={id:`bio-${q.id}-${wrong.id}`,startedAt:new Date().toISOString(),title:'Scienze biologiche',kind:'practice',index:0,
   items:[{qid:q.id,seed:10,assisted:false,attemptId:null}]};
  validateState(state);
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const s=c.units.find(u=>u.id===q.unit).sections.find(s=>s.id===q.concept);
  assert.ok((await page.locator('.inline-lesson').textContent()).includes(s.example));
  if(s.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),s.table.rows.length);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,q.help);
  assert.equal(stored.notes.cellula,'Appunto precedente');assert.equal(stored.read.cellula,'2026-10-19T12:00:00.000Z');
  if(++checked%24===0)console.log(`Verificati ${checked}/72 feedback con aiuti e persistenza.`);
 }
 await page.goto(`${url}#exam/scienze-biologiche`);
 await page.locator('.programme-map summary').click();assert.equal(await page.locator('.programme-topic').count(),17);
 for(const id of ['scienze-biologiche-15','scienze-biologiche-16','scienze-biologiche-17']){
  const topic=c.exams.find(x=>x.id==='scienze-biologiche').programme.topics.find(t=>t.id===id);
  assert.ok((await page.locator('.programme-map').textContent()).includes(topic.title));
  assert.ok(topic.questionIds.every(id=>e.questions.some(q=>q.id===id)));
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  const questionCount=e.questions.filter(q=>q.unit===id).length;
  assert.equal(await page.locator('#main > .question').count(),questionCount+1);
  assert.equal(await page.locator('.print-solutions .question').count(),questionCount);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`${artifacts}/${id}.pdf`,format:'A4',printBackground:true});
 }
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log('Biologia OK: 3 lezioni, 36 quiz/72 feedback, 11 voci storiche e 3 nuclei di programma, appunti e letture preservati, tabelle, mobile e quaderni offline.');
}finally{await browser.close();}
