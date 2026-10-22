import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
await build();
const read=async n=>JSON.parse(await readFile(new URL('../data/'+n+'.json',import.meta.url),'utf8'));
const [c,e,a]=await Promise.all(['course','exercises','anatomy-audit'].map(read));
const units=a.additions.unitIds.map(id=>c.units.find(u=>u.id===id)),qs=e.questions.filter(q=>q.id.startsWith('anat-final-'));
const url=pathToFileURL(outputFile).href,artifacts=fileURLToPath(new URL('../.local/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
try{
 const ctx=await browser.newContext({offline:true,viewport:{width:390,height:844}}),page=await ctx.newPage();
 const errors=[],requests=[];page.on('pageerror',x=>errors.push(x.message));ctx.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(url);
 const state=freshState();state.notes.piani='Appunto già presente';state.read.cellula='2026-10-20T10:00:00Z';state.settings.theme='dark';
 const old=e.questions.find(q=>q.id==='an-piani-1');
 state.active={id:'old-anatomy',startedAt:new Date().toISOString(),title:'Progresso precedente',kind:'practice',index:0,items:[{qid:old.id,seed:19,assisted:false,attemptId:null}]};
 await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
 await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
 await page.locator('input[name=answer][value="'+old.answer+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.feedback').first().waitFor();
 const base=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
 for(const u of units){
  await page.goto(url+'#lesson/'+u.id);await page.getByRole('heading',{name:u.title,exact:true,level:1}).waitFor();
  assert.equal(await page.locator('.example').count(),u.sections.length);
  assert.equal(await page.locator('.lesson-sources').getAttribute('open'),null);
  await page.locator('.oral summary').click();assert.ok((await page.locator('.oral').textContent()).includes(u.oral.answer));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),u.id);
  for(const f of await page.locator('.anatomy-figure img').all()){await f.scrollIntoViewIfNeeded();await f.evaluate(img=>img.decode());assert.ok(await f.evaluate(img=>img.naturalWidth>0));}
 }
 await page.goto(url+'#lesson/anat-spazio');await page.locator('[data-anatomy-diagram]').first().waitFor();
 await page.locator('[data-anatomy-diagram]').first().screenshot({path:artifacts+'/anatomy-projections-dark.png'});
 await page.selectOption('#appearance','light');
 await page.locator('[data-anatomy-diagram]').first().screenshot({path:artifacts+'/anatomy-projections-light.png'});
 await page.selectOption('#appearance','dark');
 let count=0;
 for(const q of qs)for(const wrong of q.options.filter(o=>o.id!==q.answer)){
  const state=structuredClone(base);state.active={id:'check-'+q.id+'-'+wrong.id,startedAt:new Date().toISOString(),title:'Anatomia',kind:'practice',index:0,items:[{qid:q.id,seed:17,assisted:false,attemptId:null}]};
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:STORAGE_KEY,state});
  await page.goto(url+'#session');await page.reload();await page.locator('#answer-form').waitFor();
  if(q.figureId){
   const f=c.figures.find(f=>f.id===q.figureId);
   assert.equal(await page.locator('.marker-legend').count(),0);
   assert.ok(!(await page.locator('#main').textContent()).includes(f.guide),q.id+' guide leaked');
   await page.locator('.anatomy-figure img').evaluate(img=>img.decode());
   if(wrong.id==='b'){
    await page.locator('a[href="#figure/'+q.figureId+'/test"]').click();
    assert.equal(await page.locator('.marker-legend').count(),0);
    assert.ok(!(await page.locator('#main').textContent()).includes(f.guide));
    await page.locator('a[href="#session"]').click();await page.locator('#answer-form').waitFor();
   }
  }
  await page.locator('input[name=answer][value="'+wrong.id+'"]').check();await page.getByRole('button',{name:'Verifica la risposta'}).click();await page.locator('.inline-lesson').waitFor();
  assert.ok((await page.locator('.feedback').allTextContents()).join(' ').includes(wrong.feedback),q.id);
  const [uid,sid]=q.help.split('/'),s=c.units.find(u=>u.id===uid).sections.find(s=>s.id===sid),help=await page.locator('.inline-lesson').textContent();
  for(const p of [...s.text,s.example,s.takeaway])assert.ok(help.includes(p),q.id+' incomplete help');
  if(s.diagram)assert.equal(await page.locator('.inline-lesson [data-anatomy-diagram="'+s.diagram+'"]').count(),1);
  if(q.figureId)assert.ok(help.includes(c.figures.find(f=>f.id===q.figureId).guide));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),q.id+' overflow');
  if(++count%36===0)console.log('Feedback e aiuti: '+count+'/'+qs.length*3);
 }
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
 assert.deepEqual(saved.attempts[0],base.attempts[0]);assert.equal(saved.notes.piani,base.notes.piani);assert.equal(saved.read.cellula,base.read.cellula);
 await page.goto(url+'#exam/anatomia-umana');await page.locator('.programme-map').waitFor();
 assert.ok((await page.locator('#main').textContent()).includes('prova orale'));
 assert.equal(await page.locator('.programme-map').getAttribute('open'),null);
 assert.equal(await page.locator('a[href^="#written/"]').count(),3);
 for(const p of c.writtenPapers){await page.goto(url+'#written/'+p.id);await page.locator('#written-paper').waitFor();assert.ok((await page.locator('#main').textContent()).includes('2026/27 indica una prova orale'));}
 await page.goto(url+'#print/anatomia-umana');await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
 assert.equal(await page.locator('.print-solutions .question').count(),471);
 assert.equal(await page.locator('.print-solutions .oral').count(),51);
 assert.equal(await page.locator('[data-anatomy-diagram]').count(),3);
 await page.goto(url+'#print/anat-spazio');await page.getByRole('heading',{name:'Soluzioni ragionate',exact:true}).waitFor();
 await page.emulateMedia({media:'print'});await page.pdf({path:artifacts+'/anatomy-spatial-print.pdf',format:'A4',printBackground:true});
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('Anatomia OK: 8 lezioni nuove, '+count+' feedback, immagini/legende, 3 schemi, mobile, stampa, orale e progressi precedenti; zero rete.');
}finally{await browser.close();}

