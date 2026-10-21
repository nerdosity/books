import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {outputFile} from '../scripts/build.mjs';
import {STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const e=JSON.parse(await readFile(new URL('../data/exercises.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(`${pathToFileURL(outputFile).href}#exam/inglese`);
 await page.getByRole('button',{name:'Simulazione scritta · 15 domande'}).click();
 for(let i=0;i<15;i++){
  await page.locator('#answer-form').waitFor();
  const state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),STORAGE_KEY);
  assert.equal(state.active.items.length,15);assert.equal(state.active.index,i);
  const q=e.questions.find(q=>q.id===state.active.items[i].qid);assert.ok(q&&!q.audioId);
  await page.locator(`input[name=answer][value="${q.answer}"]`).check();
  if(i===5){await page.reload();await page.locator('#answer-form').waitFor();assert.ok(await page.locator(`input[name=answer][value="${q.answer}"]`).isChecked());}
  await page.getByRole('button',{name:'Verifica la risposta'}).click();
  await page.locator('.feedback').first().waitFor();
  assert.ok((await page.locator('.feedback').first().textContent()).includes('Corretto.'));
  if(i===8){await page.reload();await page.locator('.feedback').first().waitFor();}
  await page.locator('[data-action=next]').click();
 }
 await page.locator('.score').waitFor();assert.ok((await page.locator('.score').textContent()).includes('30'));
 await page.reload();await page.locator('.score').waitFor();
 const state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),STORAGE_KEY);
 assert.equal(state.sessions.length,1);assert.equal(state.sessions[0].total,15);assert.equal(state.attempts.length,15);assert.equal(state.active,null);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log('Simulazione inglese: 15 domande, risposte, bozza e avanzamento persistenti, risultato 30/30, offline.');
}finally{await browser.close();}
