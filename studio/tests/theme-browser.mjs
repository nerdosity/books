// Offline appearance checks with an existing Playwright installation.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {freshState,STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
await build();
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
  const context=await browser.newContext({offline:true,colorScheme:'light',viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[],network=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  const url=pathToFileURL(outputFile).href;
  const theme=()=>page.locator('html').getAttribute('data-theme');
  const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
  const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.goto(url);await page.locator('.exam-card').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await theme(),'light');
  assert.equal(await page.evaluate(()=>[...document.fonts].filter(f=>f.family==='Google Sans'&&f.status==='loaded').length>0),true);
  await page.screenshot({path:`${artifacts}/notebook-light.png`});
  const old=freshState();delete old.settings.theme;old.notes.mitocondri='Appunti da conservare';old.read.cellula='2026-10-20T10:00:00.000Z';
  await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:STORAGE_KEY,value:old});
  await page.reload();await page.locator('#appearance').selectOption('dark');
  assert.equal(await theme(),'dark');assert.equal((await state()).notes.mitocondri,old.notes.mitocondri);
  await page.reload();assert.equal(await theme(),'dark');
  await page.goto(`${url}#lesson/mitocondri`);await page.locator('.lesson p').first().waitFor();
  assert.equal(await page.locator('.lesson p').first().evaluate(e=>getComputedStyle(e).fontSize),'20px');
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
  await page.locator('#note').fill('Appunti nuovi');await page.locator('#appearance').selectOption('light');
  assert.equal(await page.locator('#note').inputValue(),'Appunti nuovi');
  await page.locator('#appearance').selectOption('dark');
  // Compute actual foreground/background contrast after CSS inheritance, not palette guesses.
  const checkContrast=async()=>{
    const failures=await page.evaluate(()=>{
      const lum=rgb=>{const c=rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
      const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
      return [...document.querySelectorAll('p,h1,h2,h3,a,button,label,summary,th,td,.tag,.reading-note,.stat span')].filter(e=>e.getClientRects().length&&!e.closest('svg')).flatMap(e=>{
        const style=getComputedStyle(e),fg=rgb(style.color);let ancestor=e,bg;
        while(ancestor){const c=rgb(getComputedStyle(ancestor).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}ancestor=ancestor.parentElement;}
        if(!bg||!fg.length)return [];
        const ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
        const size=parseFloat(style.fontSize),large=size>=24||(size>=18.66&&parseInt(style.fontWeight)>=700);
        return ratio<(large?3:4.5)-.01?[{tag:e.tagName,class:e.className,text:e.textContent.trim().slice(0,50),ratio}]:[];
      });
    });
    assert.deepEqual(failures,[]);
  };
  await checkContrast();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${artifacts}/notebook-lesson-dark.png`});
  for(const mode of ['dark','light']){
    await page.locator('#appearance').selectOption(mode);
    for(const route of ['home','exam/anatomia-umana','settings','lesson/anatomia-pelvi-perineo','practice']){
      await page.goto(`${url}#${route}`);await page.locator('h1').first().waitFor();await checkContrast();
      for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.equal(await overflow(),false,`${route} ${mode} ${width}`);}
    }
  }
  await page.goto(`${url}#practice`);await page.locator('#practice-unit').selectOption('cellula');
  await page.getByRole('button',{name:'Inizia la sessione →',exact:true}).click();
  await page.locator('#answer-form').waitFor();await page.locator('input[name=answer]').first().check();
  const draft=await page.locator('input[name=answer]:checked').inputValue();
  await page.locator('#appearance').selectOption('dark');
  assert.equal(await page.locator('input[name=answer]:checked').inputValue(),draft);
  await checkContrast();await page.locator('#answer-form button[type=submit], #answer-form button:not([type])').click();
  await page.locator('.feedback').waitFor();await checkContrast();
  await page.locator('#appearance').selectOption('light');await checkContrast();
  await page.goto(`${url}#settings`);await page.locator('input[name=largeText]').check();
  await page.getByRole('button',{name:'Salva preferenze',exact:true}).click();
  await page.goto(`${url}#lesson/mitocondri`);await page.locator('.lesson p').first().waitFor();
  assert.equal(await page.locator('.lesson p').first().evaluate(e=>getComputedStyle(e).fontSize),'23px');
  await page.locator('#appearance').selectOption('dark');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${artifacts}/notebook-mobile-dark.png`});
  await page.locator('#appearance').selectOption('system');await page.emulateMedia({colorScheme:'light'});assert.equal(await theme(),'light');
  await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.locator('#appearance').selectOption('light');await page.emulateMedia({colorScheme:'dark'});assert.equal(await theme(),'light');
  await page.locator('#appearance').selectOption('dark');await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await page.locator('.lesson p').first().evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 0)');
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  console.log('PASS: offline font, light/dark/system, saved theme, old progress, larger reading, contrast, mobile 320/390, white print.');
}finally{await browser.close();}
