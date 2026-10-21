export const DATA_CONTROL_KEYS = ['sort','direction','then','thenDirection','group','operator','threshold','logic','chart','x','y','scope'];
export function dataControls(lab,record={}) {
  const c={...lab.defaults,...record.controls};
  for(const key of DATA_CONTROL_KEYS){
    if(key==='threshold'){
      if(c[key]!==''&&!/^-?\d+(?:[.,]\d+)?$/.test(c[key]))c[key]='';
    }else if(!dataOptions(lab,key).some(o=>o[0]===c[key]))c[key]=lab.defaults[key];
  }
  return c;
}
export function dataOptions(lab,key){
  const columns=lab.fields.map(f=>[f.id,f.label]);
  const choices={sort:[['','Ordine iniziale'],...columns],then:[['','Nessuno'],...columns],
    direction:[['asc','Crescente'],['desc','Decrescente']],thenDirection:[['asc','Crescente'],['desc','Decrescente']],
    group:[['','Tutti'],...[...new Set(lab.records.map(r=>r[lab.groupField]))].map(v=>[v,v])],
    operator:[['gte','≥ maggiore o uguale'],['gt','> maggiore'],['lte','≤ minore o uguale'],['lt','< minore'],['eq','= uguale']],
    logic:[['and','ENTRAMBE (AND)'],['or','ALMENO UNA (OR)']],
    chart:[['columns','Colonne'],['line','Linea con categorie equidistanti'],['scatter','Punti XY']],
    x:columns,y:lab.fields.filter(f=>f.type==='number').map(f=>[f.id,f.label]),
    scope:[['visible','Solo righe visibili'],['all','Tutte le righe originali']]};
  return choices[key]||[];
}
export function dataView(lab,controls){
  const c=dataControls(lab,{controls}),n=Number(c.threshold.replace(',','.'));
  const compare=(a,b,key,dir)=>{
    const field=lab.fields.find(f=>f.id===key);if(!field)return 0;
    return (field.type==='number'?a[key]-b[key]:String(a[key]).localeCompare(String(b[key]),'it'))*(dir==='desc'?-1:1);
  };
  const visible=lab.records.filter(r=>{
    const predicates=[];
    if(c.group)predicates.push(r[lab.groupField]===c.group);
    if(c.threshold!==''){
      const v=r[lab.filterField];
      predicates.push(({gte:v>=n,gt:v>n,lte:v<=n,lt:v<n,eq:v===n})[c.operator]);
    }
    return !predicates.length||(c.logic==='or'?predicates.some(Boolean):predicates.every(Boolean));
  }).sort((a,b)=>compare(a,b,c.sort,c.direction)||compare(a,b,c.then,c.thenDirection));
  return {visible,chartRows:c.scope==='all'?lab.records:visible};
}
export function gradeDataLab(lab,record){
  const c=dataControls(lab,record);
  const results=lab.tasks.map(t=>{
    const correct=t.keys.every(k=>k==='threshold'&&t.expected[k]!==''
      ?c[k]!==''&&Number(c[k].replace(',','.'))===Number(t.expected[k]) : c[k]===t.expected[k]);
    return {...t,correct,message:correct?'La configurazione rispetta la consegna.':t.explanation};
  });
  return {results,total:results.length,correct:results.filter(r=>r.correct).length};
}
export function validateDataLab(lab,references){
  const errors=[],check=(v,m)=>{if(!v)errors.push(`${lab.id}: ${m}`);};
  check(lab.title&&lab.description&&Array.isArray(lab.fields)&&lab.fields.length>=3,'campi mancanti');
  if(!Array.isArray(lab.fields)||!Array.isArray(lab.records)||!Array.isArray(lab.tasks))return [...errors,'Laboratorio dati incompleto'];
  const ids=lab.fields.map(f=>f.id);
  check(new Set(ids).size===ids.length&&lab.fields.every(f=>/^[a-z]+$/.test(f.id)&&f.label&&['text','number'].includes(f.type)),'campi non validi');
  check(lab.records.length>=3&&lab.records.length<=30&&new Set(lab.records.map(r=>r.id)).size===lab.records.length,'righe non valide');
  check(lab.records.every(r=>lab.fields.every(f=>f.type==='number'?Number.isFinite(r[f.id])&&r[f.id]>=0:typeof r[f.id]==='string')),'valori non validi');
  check(lab.fields.some(f=>f.id===lab.groupField&&f.type==='text')&&lab.fields.some(f=>f.id===lab.filterField&&f.type==='number'),'filtri non validi');
  check(lab.defaults&&DATA_CONTROL_KEYS.every(k=>typeof lab.defaults[k]==='string'),'controlli incompleti');
  if(!lab.defaults)return errors;
  check(JSON.stringify(dataControls(lab))===JSON.stringify(lab.defaults),'valori iniziali non validi');
  check(lab.tasks.length>0&&new Set(lab.tasks.map(t=>t.id)).size===lab.tasks.length,'consegne mancanti o duplicate');
  for(const t of lab.tasks)check(t.prompt&&t.explanation&&references.has(t.help)&&t.help.startsWith(lab.unit+'/')
    &&t.keys?.length&&t.keys.every(k=>DATA_CONTROL_KEYS.includes(k)&&typeof t.expected?.[k]==='string'),'consegna o aiuto non valido');
  check(lab.report?.prompt&&lab.report.model&&lab.report.criteria?.length>=2,'report incompleto');
  try{
    const controls=Object.assign({},lab.defaults,...lab.tasks.map(t=>t.expected));
    check(gradeDataLab(lab,{controls}).correct===lab.tasks.length,'soluzioni incoerenti');
    check(dataView(lab,controls).visible.length>0,'soluzione priva di righe');
  }catch{check(false,'soluzione non verificabile');}
  return errors;
}
