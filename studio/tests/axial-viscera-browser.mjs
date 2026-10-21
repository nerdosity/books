// Offline acceptance check: teaching, exact error-specific help, persistence and print.
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
const audit=JSON.parse(await readFile(new URL('../data/development-audit.json',import.meta.url),'utf8'));
const histology=process.argv.includes('--histology');
const neuro=process.argv.includes('--neuro');
const micro=process.argv.includes('--micrographs');
const label=micro?'Micrografie':neuro?'Neuroanatomia':histology?'Istologia e linfa':'Assile e visceri';
const ids=micro?['anatomia-micrografie']:neuro?['anatomia-sensibilita-midollo','anatomia-encefalo-protezioni','anatomia-nervi-autonomo']:histology?['anatomia-epiteli-ghiandole','anatomia-connettivi-osso','anatomia-sangue-difese','anatomia-organi-linfoidi']:
 ['anatomia-cranio','anatomia-colonna-torace','anatomia-tubo-digerente','anatomia-annessi-peritoneo','anatomia-rene-vie','anatomia-genitale','anatomia-endocrino'];
const figures=micro?['histology-epithelium','histology-cartilage','histology-muscle','histology-sarcomeres']:neuro?['spinal-cord']:histology?[]:['skull-anterior','vertebra-views','kidney-section'];
const expectedQuestions=micro?16:neuro?28:histology?32:61;
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const imageLoaded=async()=>{
  // Figures load lazily: visit each one as a reader scrolling through the lesson would.
  for(const img of await page.locator('.anatomy-figure img').all()){
   await img.scrollIntoViewIfNeeded();
   await img.evaluate(el=>el.decode());
   assert.ok(await img.evaluate(el=>el.complete&&el.naturalWidth>0));
  }
 };
 const exam=c.exams.find(e=>e.id==='anatomia-umana');
 assert.equal(exam.programme.currentSyllabusConfirmed,false);
 const targeted=audit.syllabusAudits.find(a=>a.id===(neuro?'anatomia-neuro-2024':histology?'anatomia-istologia-linfa-2024':'anatomia-assile-visceri-2024'));
 if(micro)assert.deepEqual(audit.micrographAudit.figures.map(f=>f.id),figures);
 else assert.equal(targeted.requirements.length,neuro?26:histology?19:28);
 for(const id of ids){
  const unit=c.units.find(u=>u.id===id);
  assert.ok(exam.modules.some(m=>m.unitIds.includes(id)));
  for(const section of unit.sections){
   const ref=`${id}/${section.id}`;
   if(!micro)assert.ok(targeted.requirements.some(r=>r.refs.includes(ref)));
   assert.ok(exam.programme.topics.some(t=>t.refs.includes(ref)));
  }
  await page.goto(`${url}#lesson/${id}`);
  await page.getByRole('heading',{name:unit.title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);
  assert.equal(await page.locator('.table-wrap').count(),unit.sections.filter(s=>s.table).length);
  await imageLoaded();await noOverflow();
  await page.locator('.oral summary').click();
  assert.ok((await page.locator('.oral details').textContent()).includes(unit.oral.answer));
 }
 for(const id of figures){
  const figure=c.figures.find(f=>f.id===id);
  await page.goto(`${url}#figure/${id}`);await page.locator('.anatomy-figure img').waitFor();await imageLoaded();
  assert.ok((await page.locator('.figure-credit').textContent()).includes(figure.license));
  assert.ok((await page.locator('figcaption').textContent()).includes(figure.guide));
  await noOverflow();await page.screenshot({path:`${artifacts}/${id}-mobile.png`,fullPage:true});
  await page.goto(`${url}#figure/${id}/test`);
  assert.ok(!(await page.locator('figcaption').textContent()).includes(figure.guide));
  for(const marker of figure.markers||[])assert.ok(!(await page.locator('figcaption').textContent()).includes(marker.label));
 }
 const qs=e.questions.filter(q=>neuro?q.id.startsWith('ns-'):ids.includes(q.unit));
 assert.equal(qs.length,expectedQuestions);assert.equal(qs.filter(q=>q.figureId).length,micro?16:neuro?2:histology?0:5);
 let tested=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=freshState();
  state.notes.cellula='Appunto preesistente da conservare';state.settings.theme='dark';
  state.active={id:`viscera-${q.id}-${wrong.id}`,startedAt:new Date().toISOString(),title:'Anatomia assile e viscerale',kind:'practice',index:0,
   items:[{qid:q.id,seed:10,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  if(q.figureId){
   await page.locator('.question .anatomy-figure img').waitFor();await imageLoaded();
   assert.ok(!(await page.locator('.question').textContent()).includes(c.figures.find(f=>f.id===q.figureId).guide));
  }
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const [unitId,sectionId]=wrong.help.split('/');
  const section=c.units.find(u=>u.id===unitId).sections.find(s=>s.id===sectionId);
  const help=await page.locator('.inline-lesson').textContent();
  for(const paragraph of [...section.text,section.example,section.takeaway])assert.ok(help.includes(paragraph));
  if(section.figureIds){await imageLoaded();for(const id of section.figureIds)assert.ok(help.includes(c.figures.find(f=>f.id===id).guide));}
  if(section.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),section.table.rows.length);
  await noOverflow();
  if(tested===0)await page.screenshot({path:`${artifacts}/${micro?'micrographs':neuro?'neuro':histology?'histology':'viscera'}-help-dark-mobile.png`,fullPage:true});
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.notes.cellula,'Appunto preesistente da conservare');assert.equal(stored.settings.theme,'dark');
  assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,wrong.help);
  tested++;
 }
 assert.equal(tested,expectedQuestions*2);
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  const count=qs.filter(q=>q.unit===id).length;
  assert.equal(await page.locator('#main > .question').count(),count+1);
  assert.equal(await page.locator('.print-solutions .question').count(),count);
  await imageLoaded();
 }
 await page.emulateMedia({media:'print'});
 await page.pdf({path:`${artifacts}/${micro?'micrographs':neuro?'neuro':histology?'linfa':'endocrino'}-quaderno.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 console.log(`${label} OK: ${ids.length} lezioni, ${ids.length*4} sezioni mappate, ${figures.length} tavole controllate, ${tested} feedback con testo integrale, progressi/tema conservati, mobile e stampa offline.`);
}finally{await browser.close();}
