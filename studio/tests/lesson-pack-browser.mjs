import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const auditName=process.argv[2]||'development-cognition-audit';
await build();
const read=async n=>JSON.parse(await readFile(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const[c,e,a]=await Promise.all(['course','exercises',auditName].map(read));
const units=a.unitIds.map(id=>c.units.find(u=>u.id===id)),qs=e.questions.filter(q=>a.questionIds.includes(q.id));
const artifacts=fileURLToPath(new URL('../.local/'+auditName+'/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
try{
 const ctx=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));ctx.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 const url=pathToFileURL(outputFile).href;await page.goto(url);
 assert.ok((await page.locator('.work-checkpoint').textContent()).includes(c.checkpoint.status==='paused'?'Lo sviluppo è in pausa':'Lo sviluppo è in corso'));
 const state=freshState();state.notes.cellula='Appunto conservato';state.read.piani='2026-10-20T10:00:00Z';
 for(const u of units){
  await page.goto(url+'#lesson/'+u.id);await page.getByRole('heading',{name:u.title,level:1,exact:true}).waitFor();
  const text=await page.locator('.lesson').textContent();for(const s of u.sections)for(const p of s.text)assert.ok(text.includes(p));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 }
 for(const id of a.diagramIds||[]){
  const unit=units.find(u=>u.sections.some(s=>s.diagram===id));await page.goto(url+'#lesson/'+unit.id);await page.getByRole('heading',{name:unit.title,level:1,exact:true}).waitFor();
  const fig=page.locator('[data-study-diagram="'+id+'"]');
  for(const mode of ['light','dark']){await page.selectOption('#appearance',mode);await fig.screenshot({path:artifacts+id+'-'+mode+'.png'});}
  await fig.locator('.study-zoom summary').click();assert.ok(await fig.locator('.study-zoom>div').evaluate(el=>el.scrollWidth>el.clientWidth));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 }
 let count=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const next=structuredClone(state);next.active={id:'dev-'+q.id+'-'+wrong.id,startedAt:new Date().toISOString(),title:'Esercizi del capitolo',kind:'practice',index:0,items:[{qid:q.id,seed:17,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state:next});
  await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
  await page.locator('input[name=answer][value="'+wrong.id+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback),q.id);
  const[u,s]=q.help.split('/'),section=c.units.find(x=>x.id===u).sections.find(x=>x.id===s),help=await page.locator('.inline-lesson').textContent();
  for(const p of [...section.text,section.example,section.takeaway])assert.ok(help.includes(p),q.id+' help');
  if(section.diagram)assert.equal(await page.locator('.inline-lesson [data-study-diagram="'+section.diagram+'"]').count(),1);
  if(section.table)for(const row of section.table.rows)for(const cell of row)assert.ok(help.includes(cell));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  if(++count%16===0)console.log('Feedback e aiuti: '+count+'/'+qs.reduce((n,q)=>n+q.options.length-1,0));
 }
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);assert.equal(saved.notes.cellula,state.notes.cellula);assert.equal(saved.read.piani,state.read.piani);
 for(const u of units){await page.goto(url+'#print/'+u.id);await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();const text=await page.locator('#main').textContent();for(const s of u.sections)for(const p of [...s.text,s.example,s.takeaway])assert.ok(text.includes(p));assert.equal(await page.locator('.print-solutions .question').count(),[...e.questions,...e.templates].filter(q=>q.unit===u.id).length);}
 await page.emulateMedia({media:'print'});await page.pdf({path:artifacts+'quaderno.pdf',format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log('OK: '+units.length+' lezioni, '+count+' feedback con aiuti, '+(a.diagramIds?.length||0)+' schemi, stampa, appunti e letture conservati. Zero richieste di rete.');
}finally{await browser.close();}
