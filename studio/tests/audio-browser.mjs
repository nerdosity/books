import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build,outputFile} from '../scripts/build.mjs';
import {AUDIO_SETTINGS_KEY} from '../lib/audio.js';
import {STORAGE_KEY} from '../lib/state.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
await build();
const course=JSON.parse(await readFile(new URL('../data/course.json',import.meta.url),'utf8'));
const url=pathToFileURL(outputFile).href;
const artifacts=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(artifacts,{recursive:true});
// A short silent WAV is a transport fixture, not generated teaching audio.
const wav=Buffer.alloc(44+1600);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);
wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(1600,40);
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try {
 const context=await browser.newContext(),page=await context.newPage();
 const calls=[],errors=[];let generateCalls=0,voiceCalls=0;
 page.on('pageerror',e=>errors.push(e.message));
 context.on('request',r=>{if(/^https?:/.test(r.url()))calls.push(r.url());});
 await context.route('https://api.elevenlabs.io/**',async route=>{
  const request=route.request();
  assert.equal(request.headers()['xi-api-key'],'test-placeholder-only');
  if(request.url().includes('/v2/voices')){
   voiceCalls++;
   await route.fulfill({json:{voices:[{voice_id:'JBFqnCBsd6RMkjVDRZzb',name:'Example voice',labels:{accent:'British'},category:'premade'}],has_more:false}});
  }else{
   generateCalls++;
   assert.equal(request.method(),'POST');
   assert.ok(course.listening.some(c=>c.text===request.postDataJSON().text));
   await new Promise(resolve=>setTimeout(resolve,100));
   await route.fulfill({contentType:'audio/wav',body:wav});
  }
 });
 await page.goto(`${url}#lesson/english-listening`);
 await page.locator('.audio-panel').first().waitFor();
 assert.equal(await page.locator('.audio-panel').count(),8);
 assert.equal(calls.length,0,'Opening listening lessons must never call the API.');
 await page.locator('[data-action=audio-play]').first().click();
 await page.locator('.audio-status').first().filter({hasText:'non ancora salvato'}).waitFor();
 assert.equal(calls.length,0,'Cache-only play must not generate or request voices.');
 await page.goto(`${url}#settings`);
 await page.locator('[name=apiKey]').fill('test-placeholder-only');
 await page.locator('[name=remember]').check();
 await page.locator('[data-action=audio-voices]').click();
 await page.locator('[data-audio-settings-status]').filter({hasText:'voci caricate'}).waitFor();
 assert.equal(voiceCalls,1);assert.equal(generateCalls,0);
 await page.getByRole('button',{name:'Salva impostazioni audio'}).click();
 assert.equal(await page.locator('[name=apiKey]').inputValue(),'');
 assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).apiKey,AUDIO_SETTINGS_KEY),'test-placeholder-only');
 await page.goto(`${url}#lesson/english-listening`);
 await page.locator('[data-action=audio-generate]').first().click();
 await page.locator('.audio-status').first().filter({hasText:'generato e salvato'}).waitFor();
 assert.equal(generateCalls,1);assert.ok(await page.locator('audio').first().isVisible());
 await page.locator('.audio-speed').first().selectOption('0.75');
 assert.equal(await page.locator('audio').first().evaluate(a=>a.playbackRate),0.75);
 await page.locator('[data-action=audio-generate]').first().click();
 await page.locator('.audio-status').first().filter({hasText:'dalla cache'}).waitFor();
 assert.equal(generateCalls,1,'Generate reuses matching cached audio.');
 // Persistent cache survives reload, a build replacement and key removal.
 await build();
 await page.goto(`${url}#settings`);
 await page.locator('[data-action=audio-forget]').click();
 await context.setOffline(true);
 const beforeOffline=calls.length;
 await page.reload();await page.goto(`${url}#lesson/english-listening`);
 await page.locator('[data-action=audio-play]').first().click();
 await page.locator('.audio-status').first().filter({hasText:'dalla cache'}).waitFor();
 assert.equal(calls.length,beforeOffline);
 await page.screenshot({path:`${artifacts}/ascolto-inglese.png`,fullPage:true});
 // Listening without audio remains usable through explicitly assisted transcript reading.
 await page.getByRole('button',{name:'Metti in pratica questa lezione'}).click();
 await page.locator('#answer-form').waitFor();
 assert.equal(await page.locator('.question .audio-transcript').count(),0);
 await page.getByRole('button',{name:'Mi serve un aiuto'}).click();
 assert.ok(await page.locator('.inline-lesson .audio-transcript').count()>0);
 const state=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),STORAGE_KEY);
 assert.equal(state.active.items[0].assisted,true);
 assert.ok(!JSON.stringify(state).includes('test-placeholder-only'));
 // Cache identity changes with the voice: another voice must not reuse the first recording.
 await page.goto(`${url}#settings`);
 await page.locator('[name=voiceId]').fill('1234567890abcdefghij');
 await page.getByRole('button',{name:'Salva impostazioni audio'}).click();
 await page.goto(`${url}#lesson/english-listening`);
 await page.locator('[data-action=audio-play]').first().click();
 await page.locator('.audio-status').first().filter({hasText:'non ancora salvato'}).waitFor();
 assert.equal(calls.length,beforeOffline);
 await page.goto(`${url}#settings`);
 await page.locator('[data-action=audio-cache-info]').click();
 await page.locator('[data-audio-cache-status]').filter({hasText:'1 audio salvati'}).waitFor();
 await page.getByText('Gestisci gli audio salvati',{exact:true}).click();
 await page.locator('[data-action=audio-clear]').click();
 await page.locator('[data-audio-cache-status]').filter({hasText:'0 audio salvati'}).waitFor();
 assert.deepEqual(errors,[]);
 await context.close();
 console.log('Audio browser OK: explicit requests, voice discovery, cache persistence/offline/key removal, model identity, assisted transcript, no credential in progress.');
} finally {await browser.close();}
