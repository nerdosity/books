// Optional UI check using an already installed Playwright. The app itself has no dependencies.
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {makeQuestion} from '../lib/engine.js';
import {STORAGE_KEY} from '../lib/state.js';
import {unitsForExam} from '../lib/curriculum.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
await build();
const url=pathToFileURL(outputFile).href;
const ex=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const course=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const defs=[...ex.questions,...ex.templates];
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
let browser;
try {
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
  const context=await browser.newContext({viewport:{width:1440,height:1000},offline:true});
  const page=await context.newPage(), errors=[],networkRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  context.on('request',request=>{if(/^https?:/.test(request.url()))networkRequests.push(request.url());});
  const getState=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  await page.goto(url);await page.getByRole('heading',{name:'Un piccolo passo, ogni giorno.'}).waitFor();
  assert.equal(await page.locator('.exam-card').count(),10);
  assert.equal(await page.locator('.exam-card progress').count(),10);
  await page.screenshot({path:`${artifacts}/scrivania.png`,fullPage:true});
  await page.getByRole('link',{name:'Scienze biologiche',exact:true}).click();
  await page.getByRole('heading',{name:'Scienze biologiche',exact:true,level:1}).waitFor();
  assert.equal(await page.locator('.unit-card').count(),49);
  assert.equal(await page.locator('.exam-module').count(),2);
  await page.locator('#lesson-search').fill('Krebs');
  assert.equal(await page.locator('.unit-card:visible').count(),1);
  await page.locator('#lesson-search').fill('inesistente-abc');
  assert.ok(await page.locator('#search-empty').isVisible());
  await page.locator('#lesson-search').fill('');
  assert.equal(await page.locator('.unit-card:visible').count(),49);
  await page.screenshot({path:`${artifacts}/esame-biologiche.png`,fullPage:true});
  await page.goto(`${url}#lesson/mitocondri`);
  await page.getByRole('heading',{name:'Krebs e fosforilazione ossidativa',exact:true}).waitFor();
  assert.ok(await page.locator('.concept-flow').isVisible());
  assert.equal(await page.locator('.oral details').getAttribute('open'),null);
  await page.locator('.oral summary').click();
  assert.ok(await page.locator('.oral details p').isVisible());
  await page.screenshot({path:`${artifacts}/lezione-ampliata.png`,fullPage:true});
  await page.goto(`${url}#exam/informatica`);
  await page.getByRole('heading',{name:'Informatica',exact:true,level:1}).waitFor();
  assert.equal(await page.locator('.unit-card').count(),5);
  assert.equal(await page.getByRole('button',{name:'Esercitati su questo esame'}).count(),1);
  await page.locator('.programme-map summary').click();
  assert.equal(await page.locator('.programme-topic').count(),10);
  assert.ok(await page.getByText('Archivio 2022/23',{exact:false}).first().isVisible());
  // A separate profile verifies exam practice without altering the existing persistence scenario.
  const examContext=await browser.newContext({offline:true}),examPage=await examContext.newPage();
  await examPage.goto(`${url}#practice/scienze-biologiche`);
  await examPage.locator('#practice-exam').waitFor();
  assert.equal(await examPage.locator('#practice-unit option').count(),50);
  await examPage.locator('#practice-exam').selectOption('scienze-base');
  assert.deepEqual(await examPage.locator('#practice-unit option').evaluateAll(options=>options.map(o=>o.value).filter(Boolean).sort()),
    unitsForExam(course,'scienze-base').map(u=>u.id).sort());
  await examPage.locator('select[name=level]').selectOption('applicazione');
  await examPage.getByRole('button',{name:'Inizia la sessione'}).click();
  await examPage.locator('#answer-form').waitFor();
  const examSession=await examPage.evaluate(key=>JSON.parse(localStorage.getItem(key)).active,STORAGE_KEY);
  assert.equal(examSession.title,'Scienze di base');
  assert.ok(examSession.items.every(i=>defs.find(d=>d.id===i.qid).level==='applicazione'));
  await examContext.close();
  // Each new exam is usable offline; the guided test covers its mapped topics.
  const guidedContext=await browser.newContext({offline:true}),guided=await guidedContext.newPage();
  guided.on('pageerror',error=>errors.push(error.message));
  guidedContext.on('request',r=>{if(/^https?:/.test(r.url()))networkRequests.push(r.url());});
  for(const e of course.exams) {
    await guided.goto(`${url}#exam/${e.id}`);
    await guided.getByRole('heading',{name:e.title,exact:true,level:1}).waitFor();
    assert.equal(await guided.locator('.unit-card').count(),unitsForExam(course,e.id).length);
  }
  await guided.goto(`${url}#exam/scienze-giuridiche`);
  await guided.locator('.programme-map summary').click();
  await guided.screenshot({path:`${artifacts}/mappa-giuridiche.png`,fullPage:true});
  await guided.locator('[data-action=start-programme]').click();
  await guided.locator('#answer-form').waitFor();
  const testState=await guided.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  const programme=course.exams.find(e=>e.id==='scienze-giuridiche').programme;
  for(const t of programme.topics.filter(t=>t.status!=='missing'))assert.ok(testState.active.items.some(i=>t.questionIds.includes(i.qid)));
  const first=testState.active.items[0],question=makeQuestion(defs.find(q=>q.id===first.qid),first.seed);
  await guided.locator(`input[name=answer][value="${question.options.find(o=>o.id!==question.answer).id}"]`).check();
  await guided.getByRole('button',{name:'Verifica la risposta'}).click();
  await guided.locator('.inline-lesson').waitFor();
  assert.ok(await guided.locator('.inline-lesson .example').isVisible());
  await guided.reload();await guided.locator('.feedback').first().waitFor();
  assert.equal((await guided.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY)).attempts.length,1);
  await guidedContext.close();
  await page.goto(`${url}#library`);
  await page.getByRole('heading',{name:'Confronto con i programmi',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Apri mappa, lezioni e test'}).count(),10);
  await page.getByRole('link',{name:'Preferenze e backup'}).click();
  await page.getByRole('textbox',{name:'Come ti chiami?'}).fill('Giulia');
  await page.getByRole('button',{name:'Salva preferenze'}).click();
  await page.goto(`${url}#lesson/leve`);
  await page.getByRole('heading',{name:'Momenti e leve',exact:true}).waitFor();
  await page.locator('#note').fill('Ricorda: il braccio è perpendicolare.');
  await page.getByRole('button',{name:'Segna come letta'}).click();
  await page.reload();await page.locator('#note').waitFor();
  assert.equal(await page.locator('#note').inputValue(),'Ricorda: il braccio è perpendicolare.');
  assert.ok((await getState()).read.leve);
  await page.getByRole('button',{name:'Metti in pratica questa lezione'}).click();
  await page.locator('#answer-form').waitFor();
  for(let i=0;i<8;i++){
    let state=await getState(),item=state.active.items[state.active.index],q=makeQuestion(defs.find(x=>x.id===item.qid),item.seed);
    if(i===1){
      await page.getByRole('button',{name:'Mi serve un aiuto'}).click();
      await page.locator('.inline-lesson').waitFor();
      assert.equal((await getState()).active.items[1].assisted,true);
    }
    if(q.type==='choice'){
      const answer=i===0?q.options.find(o=>o.id!==q.answer).id:q.answer;
      await page.locator(`input[name=answer][value="${answer}"]`).check();
    }else{
      await page.locator('input[name=answer]').fill(i===0?'999999':String(q.answer).replace('.',','));
      await page.locator('select[name=answerUnit]').selectOption(q.answerUnit);
    }
    if(i===2){
      // Check unfinished drafts and in-progress backup.
      const draft=(await getState()).active.items[2].draft;
      await page.reload();await page.locator('#answer-form').waitFor();
      assert.deepEqual((await getState()).active.items[2].draft,draft);
      await page.goto(`${url}#settings`);await page.getByRole('button',{name:'Esporta backup JSON'}).waitFor();
      const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta backup JSON'}).click();
      const download=await pending;await download.saveAs(`${artifacts}/progressi-test.json`);
      const fresh=await browser.newContext({offline:true}),importPage=await fresh.newPage();
      await importPage.goto(`${url}#settings`);await importPage.locator('#import').waitFor();
      await importPage.locator('#import').setInputFiles(`${artifacts}/progressi-test.json`);
      await importPage.getByText('Backup importato.',{exact:false}).waitFor();
      const restored=await importPage.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
      assert.equal(restored.settings.name,'Giulia');assert.equal(restored.active.index,2);
      assert.equal(restored.attempts.length,2);assert.equal(restored.notes.leve,'Ricorda: il braccio è perpendicolare.');
      await importPage.goto(`${url}#session`);await importPage.locator('#answer-form').waitFor();
      await fresh.close();
      await page.goto(`${url}#session`);await page.locator('#answer-form').waitFor();
    }
    await page.getByRole('button',{name:'Verifica la risposta'}).click();
    await page.locator('.feedback').first().waitFor();
    assert.equal((await getState()).attempts.length,i+1);
    if(i===0){
      assert.equal((await getState()).attempts[0].correct,false);
      assert.ok(await page.getByText('Hai sbagliato questo? Riparti da qui.',{exact:true}).isVisible());
      assert.ok(await page.locator('.inline-lesson').isVisible());
      await page.screenshot({path:`${artifacts}/aiuto-esercizio.png`,fullPage:true});
    }
    await page.getByRole('button',{name:i===7?'Guarda il risultato':'Prossimo esercizio'}).click();
    if(i<7)await page.locator('#answer-form').waitFor();
  }
  await page.getByRole('heading',{name:'Rileggi il tuo ragionamento'}).waitFor();
  assert.equal((await getState()).sessions.length,1);
  assert.equal((await getState()).attempts.filter(a=>a.correct).length,7);
  assert.match(await page.locator('.score').innerText(),/26,3/);
  // Invalid import must leave existing records intact.
  await page.goto(`${url}#settings`);await page.locator('#import').waitFor();
  const before=await getState();
  await page.locator('#import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":9}')});
  await page.getByText('Importazione non eseguita:',{exact:false}).waitFor();
  assert.deepEqual(await getState(),before);
  // Rebuilding at the same path must leave the browser's existing progress intact.
  await build();await page.reload();await page.locator('#import').waitFor();
  assert.deepEqual(await getState(),before);
  await page.close();
  const reopened=await context.newPage();
  await reopened.goto(`${url}#results`);await reopened.getByRole('heading',{name:'I progressi, senza fretta.'}).waitFor();
  assert.deepEqual(await reopened.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY),before);
  await reopened.goto(`${url}#print/leve`);await reopened.getByRole('heading',{name:'Soluzioni ragionate'}).waitFor();
  assert.equal(await reopened.locator('.print-solutions .question').count(),5);
  await reopened.emulateMedia({media:'print'});
  await reopened.pdf({path:`${artifacts}/quaderno-leve.pdf`,format:'A4',printBackground:true});
  await reopened.emulateMedia({media:'screen'});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,offline:true});
  const small=await mobile.newPage();
  await small.goto(url);await small.getByRole('heading',{name:'Un piccolo passo, ogni giorno.'}).waitFor();
  assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await small.screenshot({path:`${artifacts}/mobile.png`,fullPage:true});
  await small.goto(`${url}#lesson/energia`);await small.getByRole('heading',{name:'ATP e vie energetiche',exact:true}).waitFor();
  assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await small.goto(`${url}#lesson/arto-superiore`);
  await small.getByRole('heading',{name:'Arto superiore: spalla, gomito e mano',exact:true}).waitFor();
  assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await small.locator('.lesson table tbody tr').count(),4);
  await small.goto(`${url}#print/scienze-biologiche`);
  await small.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
  assert.equal(await small.locator('.print-solutions .question').count(),defs.filter(q=>unitsForExam(course,'scienze-biologiche').some(u=>u.id===q.unit)).length);
  await small.goto(`${url}#exam/inglese`);await small.locator('.programme-map summary').click();
  assert.ok(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await small.getByText('Ascolto, dettato e pronuncia',{exact:true}).isVisible());
  await mobile.close();await context.close();
  assert.deepEqual(errors,[]);
  assert.deepEqual(networkRequests,[]);
  console.log('Browser file:// offline OK: lettura, esercizi, aiuti, salvataggi, riapertura, aggiornamento HTML, backup, stampa e mobile. Zero richieste di rete.');
}finally{
  await browser?.close();
}
