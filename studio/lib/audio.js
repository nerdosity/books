export const AUDIO_SETTINGS_KEY = 'studio-elevenlabs-v1';
export const AUDIO_DB = 'studio-audio-v1';
export const AUDIO_MODELS = ['eleven_flash_v2_5', 'eleven_multilingual_v2'];
const defaults = { apiKey:'', voiceId:'JBFqnCBsd6RMkjVDRZzb', voiceName:'George (verifica disponibilità nel tuo account)', modelId:'eleven_flash_v2_5', remember:false };
let temporaryKey = '';
let database;
const pending = new Map();
export function audioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || '{}');
    return {...defaults, voiceId:validVoice(saved.voiceId) ? saved.voiceId : defaults.voiceId,
      voiceName:typeof saved.voiceName === 'string' ? saved.voiceName.slice(0,160) : defaults.voiceName,
      modelId:AUDIO_MODELS.includes(saved.modelId) ? saved.modelId : defaults.modelId,
      remember:saved.remember === true, apiKey:temporaryKey || (saved.remember && typeof saved.apiKey === 'string' ? saved.apiKey : '')};
  } catch { return {...defaults, apiKey:temporaryKey}; }
}
function validVoice(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{10,100}$/.test(value); }
export function saveAudioSettings(value) {
  if (!validVoice(value.voiceId)) throw new Error('Inserisci un identificativo voce valido oppure carica le voci dell’account.');
  if (!AUDIO_MODELS.includes(value.modelId)) throw new Error('Modello non supportato.');
  const apiKey = String(value.apiKey || '').trim();
  if (/[\r\n]/.test(apiKey) || apiKey.length > 500) throw new Error('Il token non ha un formato valido.');
  const saved = {voiceId:value.voiceId,voiceName:String(value.voiceName || value.voiceId).slice(0,160),modelId:value.modelId,
    remember:Boolean(value.remember),apiKey:value.remember ? apiKey : ''};
  localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify(saved));
  temporaryKey = value.remember ? '' : apiKey;
  return audioSettings();
}
export function forgetAudioKey() {
  const value=audioSettings();
  temporaryKey='';
  localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify({...value,apiKey:'',remember:false}));
}
export function speechIdentity(text, config) {
  if (!text?.trim() || text.length > 2500) throw new Error('Il brano deve contenere da 1 a 2500 caratteri.');
  if (!validVoice(config.voiceId) || !AUDIO_MODELS.includes(config.modelId)) throw new Error('Configura voce e modello nelle preferenze.');
  // The key contains every synthesis parameter, never the API credential.
  return JSON.stringify({version:1,text:text.trim(),voice:config.voiceId,model:config.modelId,
    format:'mp3_44100_128',settings:{stability:0.65,similarity_boost:0.75}});
}
function openAudioDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('La cache audio non è disponibile in questo browser.'));
  if (!database) database=new Promise((resolve,reject)=>{
    const request=indexedDB.open(AUDIO_DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('clips',{keyPath:'key'});
    request.onsuccess=()=>{const db=request.result; db.onversionchange=()=>{db.close();database=null;};resolve(db);};
    request.onerror=()=>{database=null;reject(new Error('Impossibile aprire la cache audio del dispositivo.'));};
    request.onblocked=()=>{database=null;reject(new Error('Chiudi le altre schede dello studio per aprire la cache audio.'));};
  });
  return database;
}
async function cacheOperation(mode, run) {
  const db=await openAudioDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('clips',mode), request=run(tx.objectStore('clips'));
    tx.oncomplete=()=>resolve(request.result);
    tx.onerror=tx.onabort=()=>reject(new Error('La cache audio non è accessibile o lo spazio del browser è esaurito.'));
  });
}
export async function cachedSpeech(text, config=audioSettings()) {
  return cacheOperation('readonly',store=>store.get(speechIdentity(text,config)));
}
export async function clearAudioCache() { await cacheOperation('readwrite',store=>store.clear()); }
export async function audioCacheStats() {
  const clips=await cacheOperation('readonly',store=>store.getAll());
  return {count:clips.length,bytes:clips.reduce((n,c)=>n+c.blob.size,0)};
}
async function requestApi(path, key, options={}, fetcher=globalThis.fetch) {
  if (!key) throw new Error('Salva il tuo token ElevenLabs nelle preferenze prima di generare o caricare le voci.');
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),45000);
  try {
    const response=await fetcher(`https://api.elevenlabs.io${path}`,{
      ...options,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal,
      headers:{...(options.headers || {}),'xi-api-key':key}
    });
    if (!response.ok) {
      const errors={401:'Token non valido o scaduto.',403:'Questa chiave non ha i permessi richiesti o la voce non è disponibile per l’account.',
        402:'Crediti o piano insufficienti.',404:'Voce non disponibile. Carica le voci dell’account e scegline un’altra.',
        422:'Voce o impostazioni non compatibili con il modello.',429:'Limite di richieste o crediti raggiunto. Controlla l’account prima di riprovare.'};
      throw new Error(errors[response.status] || `ElevenLabs ha risposto con errore ${response.status}. Nessun nuovo audio salvato.`);
    }
    return response;
  } catch(error) {
    if (error.name === 'AbortError') throw new Error('Richiesta scaduta. Controlla cache e account prima di riprovare: la generazione potrebbe essere stata addebitata.');
    if (error instanceof TypeError) throw new Error('Connessione non riuscita. Verifica Internet e che il browser consenta richieste da questo file locale. Non è stato effettuato un nuovo tentativo automatico.');
    throw error;
  } finally {clearTimeout(timer);}
}
export async function fetchVoices(key, nextPage='', fetcher=globalThis.fetch) {
  const params=new URLSearchParams({language:'en',page_size:'100'});
  if (nextPage) params.set('next_page_token',nextPage);
  const response=await requestApi(`/v2/voices?${params}`,key,{},fetcher);
  const body=await response.json();
  if (!Array.isArray(body.voices)) throw new Error('Elenco voci non riconosciuto.');
  return {voices:body.voices.filter(v=>validVoice(v.voice_id)).map(v=>({
    id:v.voice_id,name:String(v.name || v.voice_id),accent:String(v.labels?.accent || ''),
    category:String(v.category || '')
  })),next:body.has_more && typeof body.next_page_token === 'string' ? body.next_page_token : ''};
}
export async function generateSpeech(text,config,fetcher=globalThis.fetch) {
  const identity=JSON.parse(speechIdentity(text,config));
  const response=await requestApi(`/v1/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=${identity.format}`,
    config.apiKey,{method:'POST',headers:{'Content-Type':'application/json','Accept':'audio/mpeg'},
      body:JSON.stringify({text:identity.text,model_id:config.modelId,voice_settings:identity.settings})},fetcher);
  if (!(response.headers.get('content-type') || '').toLowerCase().startsWith('audio/')) throw new Error('La risposta non contiene un file audio.');
  const blob=await response.blob();
  if (!blob.size) throw new Error('ElevenLabs ha restituito un audio vuoto.');
  return blob;
}
export async function speech(text,{allowGenerate=false,config=audioSettings()}={}) {
  const key=speechIdentity(text,config);
  // Check storage first, before any billable request. A missing credential must not prevent offline playback.
  const cached=await cachedSpeech(text,config);
  if (cached) return {...cached,fromCache:true};
  if (!allowGenerate) throw new Error('Audio non ancora salvato per questa voce e questo modello. Usa “Genera e salva” quando sei online.');
  if (pending.has(key)) return pending.get(key);
  const work=(async()=>{
    const blob=await generateSpeech(text,config);
    const record={key,blob,createdAt:new Date().toISOString(),voiceName:config.voiceName};
    try { await cacheOperation('readwrite',store=>store.put(record)); }
    catch {return {...record,fromCache:false,warning:'Audio generato ma non salvato: spazio esaurito o cache non disponibile. Scarica l’MP3 ora per conservarlo.'};}
    return {...record,fromCache:false};
  })();
  pending.set(key,work);
  try {return await work;} finally {pending.delete(key);}
}
