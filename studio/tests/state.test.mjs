import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,validateState,mergeState} from '../lib/state.js';
function sample() {
  const state=freshState();
  state.attempts.push({id:'a1',qid:'q1',sessionId:'s1',unit:'cellula',concept:'organelli',seed:1,
    engineVersion:1,at:'2026-10-20T10:00:00.000Z',correct:false,assisted:false,prompt:'Domanda',
    answerText:'Risposta',expected:'Soluzione',message:'Spiegazione',help:'cellula/organelli',steps:['Un passaggio']});
  state.sessions.push({id:'s1',title:'Sessione',kind:'practice',startedAt:'2026-10-20T09:00:00.000Z',
    endedAt:'2026-10-20T10:00:00.000Z',total:5,attemptIds:['a1']});
  return state;
}
test('backup round-trip preserves attempts, notes and preferences',()=>{
  const state=sample();state.notes.cellula='È una prova <script>test</script>';state.settings.name='Giulia';
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))),state);
});
test('import rejects incompatible, malformed or contradictory records',()=>{
  for(const bad of [null,{}, {...freshState(),version:2},{...freshState(),attempts:'oops'}]) assert.throws(()=>validateState(bad));
  const bad=sample();bad.sessions[0].attemptIds=['missing'];assert.throws(()=>validateState(bad));
  const duplicate=sample();duplicate.attempts.push(duplicate.attempts[0]);assert.throws(()=>validateState(duplicate));
  const badNum=sample();badNum.attempts[0].seed=-1;assert.throws(()=>validateState(badNum));
});
test('merge is idempotent, retains local notes, and rejects conflicting record IDs',()=>{
  const local=sample(),remote=sample();local.notes.cellula='locale';remote.notes.cellula='remoto';remote.notes.dna='nuovo';
  const merged=mergeState(local,remote);
  assert.equal(merged.attempts.length,1);assert.equal(merged.sessions.length,1);
  assert.equal(merged.notes.cellula,'locale');assert.equal(merged.notes.dna,'nuovo');
  remote.attempts[0].correct=true;assert.throws(()=>mergeState(local,remote),/differenti/);
  assert.equal(local.attempts[0].correct,false);
});
