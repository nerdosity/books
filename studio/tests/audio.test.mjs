import test from 'node:test';
import assert from 'node:assert/strict';
import {speechIdentity,generateSpeech,fetchVoices,saveAudioSettings,audioSettings,forgetAudioKey,AUDIO_SETTINGS_KEY} from '../lib/audio.js';
import {freshState} from '../lib/state.js';
const config={apiKey:'test-placeholder-only',voiceId:'JBFqnCBsd6RMkjVDRZzb',voiceName:'Test voice',modelId:'eleven_flash_v2_5'};
test('cache identity follows synthesis inputs and never credentials or playback speed',()=>{
  const first=speechIdentity('Hello.',config);
  assert.equal(first,speechIdentity('Hello.',{...config,apiKey:'another-test-key',playbackRate:0.75}));
  assert.notEqual(first,speechIdentity('Hello!',config));
  assert.notEqual(first,speechIdentity('Hello.',{...config,voiceId:'1234567890abcdef'}));
  assert.notEqual(first,speechIdentity('Hello.',{...config,modelId:'eleven_multilingual_v2'}));
  assert.ok(!first.includes(config.apiKey));
  assert.throws(()=>speechIdentity('',config),/caratteri/);
  assert.throws(()=>speechIdentity('Hello',{...config,voiceId:'../../invalid'}),/Configura/);
});
test('TTS sends only the requested text to the fixed origin, rejects non-audio and never retries billing errors',async()=>{
  let calls=0;
  const fetcher=async(url,options)=>{
    calls++;
    assert.ok(url.startsWith('https://api.elevenlabs.io/v1/text-to-speech/'));
    assert.equal(options.headers['xi-api-key'],config.apiKey);
    assert.equal(options.redirect,'error');
    assert.equal(options.credentials,'omit');
    assert.equal(JSON.parse(options.body).text,'Hello.');
    assert.ok(!options.body.includes(config.apiKey));
    return new Response('audio-bytes',{headers:{'content-type':'audio/mpeg'}});
  };
  assert.ok((await generateSpeech('Hello.',config,fetcher)).size>0);
  assert.equal(calls,1);
  await assert.rejects(()=>generateSpeech('Hello.',config,async()=>new Response('{}',{headers:{'content-type':'application/json'}})),/non contiene/);
  calls=0;
  await assert.rejects(()=>generateSpeech('Hello.',config,async()=>{calls++;return new Response('',{status:429});}),/Limite/);
  assert.equal(calls,1);
});
test('voice discovery preserves identifiers and pagination without trusting labels as markup',async()=>{
  const result=await fetchVoices(config.apiKey,'next',async(url,options)=>{
    assert.ok(url.startsWith('https://api.elevenlabs.io/v2/voices?'));
    assert.ok(url.includes('next_page_token=next'));
    assert.equal(options.headers['xi-api-key'],config.apiKey);
    return Response.json({voices:[{voice_id:config.voiceId,name:'<Example>',labels:{accent:'British'},category:'premade'},
      {voice_id:'bad/id',name:'Invalid'}],has_more:true,next_page_token:'page2'});
  });
  assert.equal(result.voices.length,1);assert.equal(result.voices[0].name,'<Example>');assert.equal(result.next,'page2');
});
test('remembered and session-only keys stay separate from progress and can be removed without erasing audio settings',()=>{
  const data=new Map();
  globalThis.localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  saveAudioSettings({...config,remember:true});
  assert.equal(audioSettings().apiKey,config.apiKey);
  assert.equal(JSON.parse(data.get(AUDIO_SETTINGS_KEY)).apiKey,config.apiKey);
  assert.ok(!JSON.stringify(freshState()).includes(config.apiKey));
  saveAudioSettings({...config,remember:false});
  assert.equal(JSON.parse(data.get(AUDIO_SETTINGS_KEY)).apiKey,'');
  assert.equal(audioSettings().apiKey,config.apiKey);
  forgetAudioKey();
  assert.equal(audioSettings().apiKey,'');
  assert.equal(audioSettings().voiceId,config.voiceId);
  delete globalThis.localStorage;
});
