// Acceptance check of the complete applied training batch in the offline delivery.
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
const motor=process.argv.includes('--motor');
const management=process.argv.includes('--management');
const psychology=process.argv.includes('--psychology');
const development=process.argv.includes('--development');
const pedagogy=process.argv.includes('--pedagogy');
const label=pedagogy?'Pedagogia':development?'Motivazione e sviluppo':psychology?'Psicologia':management?'Gestione':motor?'Attività motorie':'Allenamento';
const prefix=pedagogy?'pedagogy':development?'development':psychology?'psychology':management?'management':motor?'motor':'training';
const ids=pedagogy?['pedagogia-persona','pedagogia-autori','pedagogia-comunita']:development?['psico-motivare','psico-regolare','sviluppo-pensare','sviluppo-sociale']:psychology?['psico-percepire','psico-memoria','psico-apprendere','psico-psicobiologia']:management?['societa-decisioni','societa-casi','marketing-percorso','marketing-budget']:motor?['motricita-controllo','motricita-pratica','motricita-progetto']:['allenamento-progettare','allenamento-metodi','allenamento-sviluppo','allenamento-insegnare'];
const exam=c.exams.find(x=>x.id===((psychology||development||pedagogy)?'scienze-psicopedagogiche':management?'gestione-sport':motor?'attivita-motorie':'allenamento'));
const mapping=audit.syllabusAudits.find(x=>x.id===(pedagogy?'pedagogia-analitico-2017':development?'psicologia-sviluppo-2024':psychology?'psicologia-processi-2024':management?'gestione-analitico-2024':motor?'motorie-analitico-2025':'allenamento-analitico-2024'));
assert.equal(mapping.requirements.length,(development||pedagogy)?16:psychology?12:management?14:motor?19:42);
assert.equal(exam.programme.currentSyllabusConfirmed,false);
for(const row of mapping.requirements){
 assert.ok(row.questionIds.length);
 for(const ref of row.refs){const [uid,sid]=ref.split('/');assert.ok(c.units.find(u=>u.id===uid)?.sections.some(s=>s.id===sid));assert.ok(exam.programme.topics.some(t=>t.refs.includes(ref)));}
 for(const qid of row.questionIds){const q=e.questions.find(q=>q.id===qid);assert.ok(q&&row.refs.includes(q.help));}
}
const allQuestions=e.questions.filter(q=>ids.includes(q.unit));assert.equal(allQuestions.length,(motor||pedagogy)?48:64);
const questionPrefix=process.argv.find(a=>a.startsWith('--questions='))?.slice('--questions='.length);
const qs=questionPrefix?allQuestions.filter(q=>q.id.startsWith(questionPrefix)):allQuestions;
assert.ok(qs.length,'The requested question prefix must select at least one question.');
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}});
 const page=await context.newPage(),network=[],errors=[],url=pathToFileURL(outputFile).href;
 page.on('pageerror',err=>errors.push(err.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto(`${url}#exam/${exam.id}`);
 assert.equal(await page.locator('.unit-card').count(),(psychology||development||pedagogy)?24:management?8:motor?10:9);
 if(motor)for(const id of ['allenamento-sviluppo','allenamento-metodi','allenamento-insegnare'])assert.equal(await page.locator(`.unit-card a[href="#lesson/${id}"]`).count(),1);
 for(const id of ids){
  const unit=c.units.find(u=>u.id===id);
  for(const s of unit.sections)assert.ok(exam.programme.topics.some(t=>t.refs.includes(`${id}/${s.id}`)));
  await page.goto(`${url}#lesson/${id}`);await page.getByRole('heading',{name:unit.title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),4);await noOverflow();
  await page.locator('.oral summary').click();assert.ok((await page.locator('.oral details').textContent()).includes(unit.oral.answer));
  for(const table of await page.locator('.table-wrap').all()){
   await table.scrollIntoViewIfNeeded();await table.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
   assert.ok(await table.evaluate(el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-1));
  }
  if(motor&&id==='motricita-pratica')await page.locator('.table-wrap').screenshot({path:`${artifacts}/motor-data-table-mobile.png`});
  if(motor&&id==='motricita-progetto')await page.locator('.table-wrap').last().screenshot({path:`${artifacts}/motor-rubric-mobile-right.png`});
  if(management&&id==='marketing-budget')await page.locator('.table-wrap').first().screenshot({path:`${artifacts}/management-scenarios-mobile-right.png`});
  if(psychology&&id==='psico-percepire')await page.locator('.table-wrap').screenshot({path:`${artifacts}/psychology-signal-mobile-right.png`});
  if(development&&id==='psico-motivare')await page.locator('.table-wrap').first().screenshot({path:`${artifacts}/development-motivation-mobile-right.png`});
  if(pedagogy&&id==='pedagogia-comunita')await page.locator('.table-wrap').screenshot({path:`${artifacts}/pedagogy-turns-mobile-right.png`});
 }
 let checked=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=freshState();state.notes.cellula='Appunto preesistente';state.settings.theme='dark';
  state.active={id:`training-${q.id}-${wrong.id}`,startedAt:new Date().toISOString(),title:'Allenamento',kind:'practice',index:0,items:[{qid:q.id,seed:11,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(`${url}#session`);await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator(`input[name=answer][value="${wrong.id}"]`).check();await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback));
  const [uid,sid]=wrong.help.split('/'),s=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid),help=await page.locator('.inline-lesson').textContent();
  for(const paragraph of [...s.text,s.example,s.takeaway])assert.ok(help.includes(paragraph));
  if(s.table)assert.equal(await page.locator('.inline-lesson tbody tr').count(),s.table.rows.length);
  await noOverflow();
  if(q.id===(pedagogy?'ped-pedagogia-comunita-sport-0':development?'dev-sviluppo-pensare-mediazione-2':psychology?'psych-psico-percepire-segnale-0':management?'manage-marketing-budget-capacita-0':motor?'motor-progetto-rubrica-0':'train-progettare-caso-0')&&wrong.id==='errore-1')await page.screenshot({path:`${artifacts}/${prefix}-help-dark-mobile.png`,fullPage:true});
  await page.reload();await page.locator('.feedback').first().waitFor();
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  assert.equal(stored.notes.cellula,'Appunto preesistente');assert.equal(stored.settings.theme,'dark');
  assert.equal(stored.attempts.length,1);assert.equal(stored.attempts[0].help,wrong.help);
  if(++checked%32===0)console.log(`${label}: ${checked}/${qs.length*2} feedback verificati.`);
 }
 for(const id of ids){
  await page.goto(`${url}#print/${id}`);await page.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  assert.equal(await page.locator('#main > .question').count(),17);assert.equal(await page.locator('.print-solutions .question').count(),16);
 }
 await page.emulateMedia({media:'print'});await page.pdf({path:`${artifacts}/${prefix}-quaderno.pdf`,format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log(`${label} OK: ${mapping.requirements.length} righe di audit, ${ids.length} capitoli, ${checked} feedback con aiuto integrale, progressi/tema, mobile e stampa offline.`);
}finally{await browser.close();}
