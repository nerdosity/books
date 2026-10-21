import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY,validateState} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const c=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const dir=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await context.newPage();
 const url=pathToFileURL(outputFile).href,errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(url);const old=freshState();old.notes.cellula='Appunto precedente';old.settings.theme='dark';
 await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state:old});
 await page.reload();await page.goto(`${url}#exam/anatomia-umana`);
 assert.equal(await page.locator('a[href^="#written/"]').count(),3);
 for(const [i,p]of c.writtenPapers.entries()){
  await page.goto(`${url}#written/${p.id}`);await page.getByRole('heading',{name:p.title,exact:true}).waitFor();
  assert.equal(await page.locator('[data-written-answer]').count(),12);
  assert.equal(await page.locator('.written-solution').count(),0);
  for(const [j,q]of p.questions.entries()){
   const draft=`Risposta ${i}-${j}: testo <b>personale</b>`;
   await page.locator(`[data-written-answer="${q.id}"]`).fill(draft);
   await page.locator(`[data-action="written-reveal"][data-question="${q.id}"]`).click();
   const article=page.locator(`#written-${q.id}`);
   assert.ok((await article.textContent()).includes(q.answer));
   await article.locator('[data-written-rating]').selectOption('parziale');
   // Open every internal help: it must contain the full teaching, not a detached link.
   for(const d of await article.locator('.written-solution > details').all())await d.locator('summary').click();
   const help=await article.locator('.inline-lesson').allTextContents();
   for(const [k,ref]of q.refs.entries()){
    const [uid,sid]=ref.split('/'),s=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid);
    for(const text of [...s.text,s.example,s.takeaway])assert.ok(help[k].includes(text),ref);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.reload();assert.equal(await page.locator('.written-solution').count(),12);
  assert.equal(await page.locator('[data-written-rating]').first().inputValue(),'parziale');
  await page.locator('[data-written-answer]').first().fill('Risposta modificata');
  assert.equal(await page.locator('[data-written-rating]').first().inputValue(),'');
  await page.locator('[data-written-answer]').first().fill('');
  await page.locator('[data-written-rating]').first().selectOption('solida');
  assert.equal(await page.locator('[data-written-rating]').first().inputValue(),'');
  assert.ok((await page.locator('[data-written-status]').first().textContent()).includes('Scrivi prima'));
  await page.locator('[data-written-answer]').first().fill('Risposta finale');
  const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  validateState(state);assert.equal(state.notes.cellula,'Appunto precedente');assert.equal(state.settings.theme,'dark');
  assert.equal(state.attempts.length,0); // Self-ratings never create quiz grades.
 }
 await page.screenshot({path:`${dir}/written-mobile.png`,fullPage:true});
 // The solutions-print action includes all models, and removes its temporary print DOM.
 await page.evaluate(()=>{window.print=()=>{window.printedSolutions=document.querySelectorAll('.written-print-solutions article').length;};});
 await page.getByText('Soluzioni per la stampa',{exact:true}).click();
 await page.getByRole('button',{name:'Mostra e stampa tutte le soluzioni'}).click();
 assert.equal(await page.evaluate(()=>window.printedSolutions),12);
 assert.equal(await page.locator('.written-print-solutions').count(),0);
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.written-print-answer').first().isVisible(),true);
 assert.equal(await page.locator('.written-solution').first().isVisible(),false);
 await page.pdf({path:`${dir}/written-questions.pdf`,format:'A4',printBackground:true});
 await page.emulateMedia({media:'screen'});
 // Exercise the real backup export, then restore into an empty browser state.
 await page.goto(`${url}#settings`);
 const download=page.waitForEvent('download');await page.locator('[data-action="export"]').click();
 const file=await download,backup=JSON.parse(await readFile(await file.path(),'utf8'));validateState(backup);
 await page.evaluate(key=>localStorage.removeItem(key),STORAGE_KEY);await page.reload();
 await page.locator('#import').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 await page.getByText('Backup importato. I risultati e gli appunti sono disponibili.',{exact:true}).waitFor();
 await page.goto(`${url}#written/${c.writtenPapers[2].id}`);
 assert.equal(await page.locator('[data-written-answer]').first().inputValue(),'Risposta finale');
 assert.equal(await page.locator('.written-solution').count(),12);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log('Scritti OK: tre tracce, 36 risposte e modelli, aiuti completi, autovalutazioni distinte dai voti, modifica/riapertura, backup reale, stampa e mobile offline.');
}finally{await browser.close();}
