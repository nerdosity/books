import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const read=async n=>JSON.parse(await readFile(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const [c,e,a]=await Promise.all(['course','exercises','materials-20261026-audit'].map(read));
const units=[...new Set(a.additions.refs.map(r=>r.split('/')[0]))].map(id=>c.units.find(u=>u.id===id));
const qs=e.questions.filter(q=>a.additions.questionIds.includes(q.id));
const url=pathToFileURL(outputFile).href,artifacts=fileURLToPath(new URL('../.local/incoming-oct26/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
try{
 const ctx=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(url);
 const state=freshState();state.notes.cellula='Appunto precedente conservato';state.read.piani='2026-10-20T10:00:00Z';state.settings.theme='dark';
 const old=e.questions.find(q=>q.id==='an-piani-1');
 state.active={id:'old-progress',startedAt:new Date().toISOString(),title:'Prima dell’integrazione',kind:'practice',index:0,items:[{qid:old.id,seed:17,assisted:false,attemptId:null}]};
 await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
 await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
 await page.locator('input[name=answer][value="'+old.answer+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.feedback').first().waitFor();
 const base=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
 for(const u of units){
  await page.goto(url+'#lesson/'+u.id);await page.getByRole('heading',{name:u.title,level:1,exact:true}).waitFor();
  assert.equal(await page.locator('.example').count(),u.sections.length);
  assert.equal(await page.locator('.lesson-sources').getAttribute('open'),null);
  assert.equal(await page.locator('.openstax-reading').getAttribute('open'),null);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),u.id);
  if(a.additions.unitIds.includes(u.id)){await page.locator('.oral summary').click();assert.ok((await page.locator('.oral').textContent()).includes(u.oral.answer));}
 }
 for(const [uid,diagram]of [['cellule-confronto','cellula-scale'],['anatomia-cute','cute-strati'],['anatomia-segnali-neurali','circuiti-neurali']]){
  await page.goto(url+'#lesson/'+uid);await page.locator('[data-biology-diagram="'+diagram+'"]').waitFor();
  for(const mode of ['light','dark']){
   await page.selectOption('#appearance',mode);
   await page.locator('[data-biology-diagram="'+diagram+'"]').screenshot({path:artifacts+diagram+'-'+mode+'.png'});
  }
 }
 let count=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=structuredClone(base);state.active={id:'mat-'+q.id+'-'+wrong.id,startedAt:new Date().toISOString(),title:'Materiali integrati',kind:'practice',index:0,items:[{qid:q.id,seed:17,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator('input[name=answer][value="'+wrong.id+'"]').check();
  await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback),q.id);
  const [uid,sid]=q.help.split('/'),s=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid);
  const help=await page.locator('.inline-lesson').textContent();
  for(const p of [...s.text,s.example,s.takeaway])assert.ok(help.includes(p),q.id+' incomplete help');
  if(s.diagram)assert.equal(await page.locator('.inline-lesson [data-biology-diagram="'+s.diagram+'"]').count(),1);
  if(s.table)for(const row of s.table.rows)for(const cell of row)assert.ok(help.includes(cell),q.id+' missing table');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),q.id+' overflow');
  if(++count%24===0)console.log('Feedback verificati: '+count+'/96');
 }
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
 assert.deepEqual(saved.attempts[0],base.attempts[0]);assert.equal(saved.notes.cellula,base.notes.cellula);assert.equal(saved.read.piani,base.read.piani);
 for(const u of units){
  await page.goto(url+'#print/'+u.id);await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
  const text=await page.locator('#main').textContent();
  for(const s of u.sections)if(a.additions.refs.includes(u.id+'/'+s.id))for(const p of [...s.text,s.example,s.takeaway])assert.ok(text.includes(p),u.id+' print');
  assert.equal(await page.locator('.print-solutions .question').count(),e.questions.filter(q=>q.unit===u.id).length);
 }
 await page.goto(url+'#print/anatomia-cute');await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
 await page.emulateMedia({media:'print'});await page.pdf({path:artifacts+'cute-print.pdf',format:'A4',printBackground:true});
 const html=await readFile(outputFile,'utf8');assert.ok(!/data:application\/(?:pdf|vnd\.openxmlformats)/.test(html));
 for(const doc of a.documents)assert.ok(!html.includes(doc.file),doc.file+' leaked into delivery');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('OK: 9 lezioni interessate, 96 feedback/aiuti completi, 3 schemi chiaro/scuro, stampa, progressi precedenti; zero allegati e zero rete.');
}finally{await browser.close();}

