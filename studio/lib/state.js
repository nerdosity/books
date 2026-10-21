import { DATA_CONTROL_KEYS } from './data-lab.js';
export const STORAGE_KEY = 'studio-motorie-v1';
export function freshState() {
  return { version: 1, settings: { name: '', largeText: false, sessionSize: 8, theme: 'system' },
    read: {}, notes: {}, lastUnit: null, attempts: [], sessions: [], active: null, labs: {} };
}
const string = (v, max = 50000) => typeof v === 'string' && v.length <= max;
const record = v => v && typeof v === 'object' && !Array.isArray(v);
const date = v => string(v, 40) && Number.isFinite(Date.parse(v));
const id = v => string(v, 100) && /^[a-zA-Z0-9_-]+$/.test(v);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
export function validateState(s) {
  assert(record(s) && s.version === 1, 'Formato di backup non supportato.');
  assert(record(s.settings) && string(s.settings.name, 80) && typeof s.settings.largeText === 'boolean'
    && [5,8,12].includes(s.settings.sessionSize), 'Preferenze non valide.');
  assert(s.settings.theme === undefined || ['system','light','dark'].includes(s.settings.theme), 'Aspetto non valido.');
  assert(record(s.read) && Object.entries(s.read).every(([k,v]) => id(k) && date(v)), 'Registro letture non valido.');
  assert(record(s.notes) && Object.entries(s.notes).every(([k,v]) => id(k) && string(v)), 'Appunti non validi.');
  assert(s.lastUnit === null || id(s.lastUnit), 'Ultima lezione non valida.');
  if(s.written!==undefined){
    assert(record(s.written)&&Object.keys(s.written).length<=100,'Prove scritte non valide.');
    for(const [key,p]of Object.entries(s.written)){
      assert(id(key)&&record(p)&&record(p.answers)&&Object.keys(p.answers).length<=100
        &&Object.entries(p.answers).every(([qid,text])=>id(qid)&&string(text,12000))
        &&Array.isArray(p.revealed)&&p.revealed.length<=100&&p.revealed.every(id)
        &&new Set(p.revealed).size===p.revealed.length&&record(p.ratings)&&Object.keys(p.ratings).length<=100,
      'Una prova scritta contiene dati non validi.');
      for(const [qid,rating]of Object.entries(p.ratings))assert(id(qid)&&['ripassare','parziale','solida'].includes(rating)
        &&p.revealed.includes(qid)&&p.answers[qid]?.trim(),'Autovalutazione scritta non valida.');
    }
  }
  if(s.labs!==undefined){
    assert(record(s.labs)&&Object.keys(s.labs).length<=100,'Laboratori non validi.');
    for(const [key,lab] of Object.entries(s.labs)){
      if(lab.controls!==undefined)assert(record(lab.controls)&&Object.entries(lab.controls).every(([k,v])=>DATA_CONTROL_KEYS.includes(k)&&string(v,100)), 'Controlli del laboratorio non validi.');
      assert(id(key)&&record(lab)&&record(lab.cells)&&Object.keys(lab.cells).length<=500
        &&Object.entries(lab.cells).every(([cell,value])=>/^[A-Z][1-9][0-9]?$/.test(cell)&&string(value,500))
        &&string(lab.report,10000)&&typeof lab.assisted==='boolean'&&Array.isArray(lab.checks)&&lab.checks.length<=100,
      'Un laboratorio contiene dati non validi.');
      for(const c of lab.checks)assert(record(c)&&date(c.at)&&typeof c.assisted==='boolean'
        &&Number.isInteger(c.total)&&c.total>0&&c.total<=500&&Number.isInteger(c.correct)&&c.correct>=0&&c.correct<=c.total,
      'Verifica del laboratorio non valida.');
    }
  }
  assert(Array.isArray(s.attempts) && s.attempts.length <= 20000, 'Registro esercizi non valido o troppo grande.');
  const attemptIds = new Set();
  for (const a of s.attempts) {
    assert(record(a) && id(a.id) && id(a.qid) && id(a.sessionId) && id(a.unit)
      && id(a.concept) && Number.isInteger(a.seed) && a.seed >= 0 && a.seed <= 4294967295
      && a.engineVersion === 1 && date(a.at) && typeof a.correct === 'boolean' && typeof a.assisted === 'boolean'
      && string(a.prompt) && string(a.answerText) && string(a.expected)
      && string(a.message) && string(a.help, 150) && /^[\w-]+\/[\w-]+$/.test(a.help)
      && Array.isArray(a.steps) && a.steps.length <= 20 && a.steps.every(x => string(x)), 'Un tentativo contiene dati non validi.');
    assert(!attemptIds.has(a.id), 'Tentativi duplicati nello stesso backup.');
    attemptIds.add(a.id);
  }
  assert(Array.isArray(s.sessions) && s.sessions.length <= 10000, 'Registro sessioni non valido.');
  const sessionIds = new Set();
  for (const x of s.sessions) {
    assert(record(x) && id(x.id) && date(x.startedAt) && date(x.endedAt)
      && string(x.title, 200) && ['practice','review'].includes(x.kind)
      && Number.isInteger(x.total) && x.total >= 1 && x.total <= 100
      && Array.isArray(x.attemptIds) && new Set(x.attemptIds).size === x.attemptIds.length
      && x.attemptIds.length <= x.total && x.attemptIds.every(aid => attemptIds.has(aid)), 'Una sessione contiene dati non validi.');
    assert(!sessionIds.has(x.id), 'Sessioni duplicate nello stesso backup.');
    for (const aid of x.attemptIds) assert(s.attempts.find(a => a.id === aid).sessionId === x.id, 'Tentativo associato a una sessione diversa.');
    sessionIds.add(x.id);
  }
  if (s.active !== null) {
    const x = s.active;
    assert(record(x) && id(x.id) && !sessionIds.has(x.id) && date(x.startedAt)
      && string(x.title, 200) && ['practice','review'].includes(x.kind)
      && Array.isArray(x.items) && x.items.length > 0 && x.items.length <= 100
      && Number.isInteger(x.index) && x.index >= 0 && x.index < x.items.length, 'Sessione in corso non valida.');
    for (const item of x.items) {
      assert(record(item) && id(item.qid) && Number.isInteger(item.seed) && item.seed >= 0 && item.seed <= 4294967295
        && typeof item.assisted === 'boolean' && (item.attemptId === null || attemptIds.has(item.attemptId)), 'Esercizio in corso non valido.');
      if (item.draft !== undefined) assert(record(item.draft) && string(item.draft.answer,1000)
        && string(item.draft.answerUnit,50), 'Risposta in corso non valida.');
      if (item.attemptId) assert(s.attempts.find(a => a.id === item.attemptId).sessionId === x.id, 'Tentativo in corso non coerente.');
    }
  }
  // JSON round-trip removes prototypes supplied by callers; UI renders all strings as text.
  return JSON.parse(JSON.stringify(s));
}
export function mergeState(current, incoming) {
  validateState(current); validateState(incoming);
  const merge = (left, right) => {
    const byId = new Map(left.map(x => [x.id, x]));
    for (const entry of right) {
      if (byId.has(entry.id) && JSON.stringify(byId.get(entry.id)) !== JSON.stringify(entry))
        throw new Error('Il backup contiene un identificativo con dati differenti. Nessun dato è stato importato.');
      byId.set(entry.id, entry);
    }
    return [...byId.values()];
  };
  // Local preferences and the local active session win; old records are preserved.
  const merged = { ...current, read: { ...incoming.read, ...current.read },
    notes: { ...incoming.notes, ...current.notes }, attempts: merge(current.attempts, incoming.attempts),
    sessions: merge(current.sessions, incoming.sessions), active: current.active || incoming.active };
  merged.labs={...(incoming.labs||{}),...(current.labs||{})};
  merged.written={...(incoming.written||{}),...(current.written||{})};
  for(const [key,local]of Object.entries(current.written||{})){
    const remote=incoming.written?.[key];
    if(remote)merged.written[key]={...local,revealed:[...new Set([...local.revealed,...remote.revealed])]};
  }
  for(const [key,local] of Object.entries(current.labs||{})){
    const remote=incoming.labs?.[key];
    if(remote)merged.labs[key]={...local,assisted:local.assisted||remote.assisted,report:local.report||remote.report,
      checks:[...new Map([...local.checks,...remote.checks].map(c=>[JSON.stringify(c),c])).values()]
        .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-100)};
  }
  if (merged.active && merged.sessions.some(s => s.id === merged.active.id)) merged.active = null;
  return validateState(merged);
}
