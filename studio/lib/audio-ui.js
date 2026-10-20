import {audioSettings, saveAudioSettings, forgetAudioKey, fetchVoices, speech, audioCacheStats, clearAudioCache, AUDIO_MODELS} from './audio.js';
const escape=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let urls=[];
let nextVoices='';
let loadingVoices=false;
export function disposeAudioPlayers() {
  document.querySelectorAll('.audio-panel audio').forEach(a=>a.pause());
  urls.forEach(url=>URL.revokeObjectURL(url));urls=[];
}
export function audioSettingsHTML() {
  const s=audioSettings();
  return `<div class="card audio-settings"><h2>Ascolto inglese · ElevenLabs</h2>
    <p>Facoltativo: usa il tuo account per creare l’audio dei brani. La prima generazione richiede Internet e usa i crediti ElevenLabs. Gli audio salvati si riascoltano offline.</p>
    <form id="audio-settings-form">
    <label>Token API personale<input name="apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="${s.apiKey?'Token già configurato · lascia vuoto per mantenerlo':'Incolla qui la chiave ElevenLabs'}"></label>
    <label class="row"><input name="remember" type="checkbox" ${s.remember?'checked':''}> Ricorda il token su questo dispositivo</label>
    <p class="reading-note">Il token salvato è leggibile da chi accede ai dati di questo browser. Non viene incluso nel file del sito, nei backup dei progressi o negli MP3. Senza questa spunta rimane solo nella scheda aperta.</p>
    <div class="row"><button type="button" data-action="audio-voices">Carica le voci inglesi dell’account</button><button type="button" data-action="audio-more-voices" hidden>Altre voci</button></div>
    <label>Voce disponibile<select name="voiceSelect"><option value="${escape(s.voiceId)}">${escape(s.voiceName)}</option></select></label>
    <label>Identificativo voce<input name="voiceId" value="${escape(s.voiceId)}" maxlength="100" required></label>
    <label>Modello<select name="modelId">${AUDIO_MODELS.map(id=>`<option value="${id}" ${s.modelId===id?'selected':''}>${id==='eleven_flash_v2_5'?'Flash v2.5 · rapido':'Multilingual v2 · lettura stabile'}</option>`).join('')}</select></label>
    <button class="primary">Salva impostazioni audio</button>
    <button type="button" data-action="audio-forget">Rimuovi il token</button></form>
    <p data-audio-settings-status role="status"></p>
    <p class="reading-note">Sono voci sintetiche, non insegnanti certificati. Scegli l’accento inglese che preferisci fra quelli realmente disponibili nel tuo account.</p>
    <p><a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer">Gestisci le chiavi ElevenLabs ↗</a></p>
    <p data-audio-cache-status>Cache audio sul dispositivo.</p><button type="button" data-action="audio-cache-info">Controlla spazio audio</button>
    <details><summary>Gestisci gli audio salvati</summary><p>La cancellazione elimina solo la cache degli MP3. Per risentirli servirà generarli di nuovo o usare i file già scaricati. Progressi e token rimangono.</p><button type="button" data-action="audio-clear">Elimina tutti gli audio dalla cache</button></details>
    </div>`;
}
export function audioPanelHTML(clip,{transcript=true}={}) {
  if (!clip) return '';
  return `<div class="audio-panel no-print" data-clip="${escape(clip.id)}"><h3>Ascolto · ${escape(clip.title)}</h3>
    <p class="reading-note">Voce: ${escape(audioSettings().voiceName)}. ${clip.text.length} caratteri da inviare a ElevenLabs solo se generi un nuovo audio. La velocità di ascolto non richiede nuove generazioni.</p>
    <div class="row"><button type="button" data-action="audio-play">Riproduci audio salvato</button><button type="button" data-action="audio-generate">Genera e salva audio · usa crediti</button><a href="#settings">Configura voce e token</a></div>
    <p class="audio-status" role="status">Puoi usare il testo anche senza attivare l’audio.</p>
    <div class="audio-player"></div>
    ${transcript?`<details class="audio-transcript"><summary>Testo del brano e traduzione</summary><p lang="en">${escape(clip.text)}</p><p>${escape(clip.translation)}</p></details>`:''}
  </div>`;
}
export function bindAudioSettingsForm() {
  const form=document.getElementById('audio-settings-form');
  if (!form) return;
  form.elements.voiceSelect.addEventListener('change',()=>{form.elements.voiceId.value=form.elements.voiceSelect.value;});
}
export async function handleAudioSubmit(form) {
  if (form.id!=='audio-settings-form') return false;
  const status=form.parentElement.querySelector('[data-audio-settings-status]');
  try {
    const data=new FormData(form),previous=audioSettings(),id=data.get('voiceId').trim(),selected=form.elements.voiceSelect;
    saveAudioSettings({apiKey:data.get('apiKey').trim() || previous.apiKey,remember:data.has('remember'),voiceId:id,
      voiceName:selected.value===id?selected.selectedOptions[0].textContent:id,modelId:data.get('modelId')});
    form.elements.apiKey.value='';form.elements.apiKey.placeholder='Token configurato · lascia vuoto per mantenerlo';
    status.textContent='Impostazioni audio salvate. Nessuna generazione è stata richiesta.';
  } catch(error) {status.textContent=error.message;}
  return true;
}
export async function handleAudioClick(button,clips) {
  const action=button.dataset.action;
  if (!action?.startsWith('audio-')) return false;
  const form=document.getElementById('audio-settings-form');
  const status=form?.parentElement.querySelector('[data-audio-settings-status]');
  try {
    if (action==='audio-forget') {
      forgetAudioKey();form.elements.apiKey.value='';form.elements.apiKey.placeholder='Incolla qui la chiave ElevenLabs';form.elements.remember.checked=false;
      status.textContent='Token rimosso. Gli audio già salvati rimangono ascoltabili.';return true;
    }
    if (action==='audio-voices'||action==='audio-more-voices') {
      if (loadingVoices) return true;
      loadingVoices=true;button.disabled=true;status.textContent='Caricamento delle voci…';
      try {
        const result=await fetchVoices(form.elements.apiKey.value.trim() || audioSettings().apiKey,action==='audio-more-voices'?nextVoices:'');
        const select=form.elements.voiceSelect;
        for(const voice of result.voices) {
          const label=`${voice.name}${voice.accent?' · '+voice.accent:''}${voice.category==='premade'?' · predefinita':''}`;
          const existing=[...select.options].find(o=>o.value===voice.id);
          if (existing) existing.textContent=label;else select.add(new Option(label,voice.id));
        }
        nextVoices=result.next;form.querySelector('[data-action=audio-more-voices]').hidden=!nextVoices;
        status.textContent=`${result.voices.length} voci caricate. Scegline una e salva le impostazioni. Nessun audio generato.`;
      } finally {loadingVoices=false;button.disabled=false;}
      return true;
    }
    if (action==='audio-clear'||action==='audio-cache-info') {
      if(action==='audio-clear')await clearAudioCache();
      const info=await audioCacheStats();
      form.parentElement.querySelector('[data-audio-cache-status]').textContent=`${info.count} audio salvati · ${(info.bytes/1024/1024).toFixed(2)} MB. La cache non è inclusa nel backup dei progressi.`;
      return true;
    }
    const panel=button.closest('.audio-panel'),clip=clips.find(c=>c.id===panel?.dataset.clip);
    if (!clip || !['audio-play','audio-generate'].includes(action)) return true;
    const message=panel.querySelector('.audio-status');
    panel.querySelectorAll('button').forEach(b=>b.disabled=true);
    message.textContent=action==='audio-generate'?'Controllo la cache; genero soltanto se l’audio manca…':'Apertura dell’audio salvato…';
    try {
      const result=await speech(clip.text,{allowGenerate:action==='audio-generate'});
      if (!panel.isConnected) return true;
      const url=URL.createObjectURL(result.blob);urls.push(url);
      panel.querySelector('.audio-player').innerHTML=`<audio controls preload="metadata" src="${url}" aria-label="${escape(clip.title)}"></audio>
        <label>Velocità di ascolto<select class="audio-speed"><option value="0.75">0,75× · lenta</option><option value="1" selected>1× · normale</option><option value="1.15">1,15×</option></select></label>
        <a class="button" href="${url}" download="${escape(clip.id)}.mp3">Scarica MP3</a>`;
      const player=panel.querySelector('audio');
      panel.querySelector('.audio-speed').onchange=e=>{player.playbackRate=Number(e.target.value);};
      message.textContent=result.warning || (result.fromCache?'Audio dalla cache: nessuna richiesta a ElevenLabs.':'Audio generato e salvato sul dispositivo. Puoi riascoltarlo offline.');
      try {await player.play();} catch { /* Browser may require pressing the native play control. */ }
    } catch(error) {if(panel.isConnected)message.textContent=error.message;}
    finally {panel.querySelectorAll('button').forEach(b=>b.disabled=false);}
  } catch(error) {if(status)status.textContent=error.message;}
  return true;
}
