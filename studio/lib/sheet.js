// Small, explicit teaching grammar. Never execute a formula as JavaScript.
const fault=(code,message)=>Object.assign(new Error(message),{code});
const addressPattern=/^(\$?)([A-Z])(\$?)([1-9][0-9]?)$/;
export function sheetAddress(value) {
  const m=String(value).toUpperCase().match(addressPattern);
  if(!m)throw fault('#RIF!','Usa indirizzi da A1 a Z99.');
  return {column:m[2].charCodeAt(0)-65,row:Number(m[4]),fixedColumn:!!m[1],fixedRow:!!m[3],
    key:m[2]+m[4]};
}
export function sheetRange(first,last) {
  const a=sheetAddress(first),b=sheetAddress(last),out=[];
  if(a.column>b.column||a.row>b.row)throw fault('#RIF!','L’intervallo deve andare dall’alto a sinistra verso il basso a destra.');
  if((b.column-a.column+1)*(b.row-a.row+1)>500)throw fault('#LIMITE!','Intervallo troppo grande per questo laboratorio.');
  for(let row=a.row;row<=b.row;row++)for(let c=a.column;c<=b.column;c++)out.push(String.fromCharCode(65+c)+row);
  return out;
}
function tokenize(formula) {
  if(formula.length>500)throw fault('#LIMITE!','La formula supera 500 caratteri.');
  const parts=[],pattern=/\s+|"(?:[^"]|"")*"|(?:\d+(?:[.,]\d+)?|[.,]\d+)|\$?[A-Za-z][A-Za-z0-9_.$]*|<=|>=|<>|[+\-*/^%=<>():;]/gy;
  let position=0;
  while(position<formula.length){
    pattern.lastIndex=position;const m=pattern.exec(formula);
    if(!m)throw fault('#SINTASSI!','Simbolo non riconosciuto. Usa ; tra argomenti e virgolette doppie per il testo.');
    position=pattern.lastIndex;
    if(!/^\s+$/.test(m[0]))parts.push(m[0]);
  }
  return parts;
}
function parse(formula) {
  const tokens=tokenize(formula.slice(1));let i=0;
  const take=x=>tokens[i]===x?(i++,true):false;
  const need=x=>{if(!take(x))throw fault('#SINTASSI!',`Manca ${x} nella formula.`);};
  function atom(){
    let node;
    const t=tokens[i++];
    if(t===undefined)throw fault('#SINTASSI!','Formula incompleta.');
    if(t==='('){node=comparison();need(')');}
    else if(/^"/.test(t))node={type:'value',value:t.slice(1,-1).replace(/""/g,'"')};
    else if(/^[\d.,]/.test(t))node={type:'value',value:Number(t.replace(',','.'))};
    else if(addressPattern.test(t.toUpperCase())){
      node={type:'ref',ref:sheetAddress(t).key};
      if(take(':'))node={type:'range',refs:sheetRange(t,tokens[i++])};
    }else{
      const name=t.toUpperCase();
      need('(');const args=[];
      if(!take(')')){do{args.push(comparison());}while(take(';'));need(')');}
      node={type:'call',name,args};
    }
    while(take('%'))node={type:'op',op:'/',left:node,right:{type:'value',value:100}};
    return node;
  }
  function unary(){if(take('+'))return unary();if(take('-'))return {type:'op',op:'*',left:{type:'value',value:-1},right:unary()};return atom();}
  function power(){let left=unary();if(take('^'))left={type:'op',op:'^',left,right:power()};return left;}
  function product(){let left=power();while(['*','/'].includes(tokens[i])){const op=tokens[i++];left={type:'op',op,left,right:power()};}return left;}
  function sum(){let left=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++];left={type:'op',op,left,right:product()};}return left;}
  function comparison(){let left=sum();while(['=','<>','<','>','<=','>='].includes(tokens[i])){const op=tokens[i++];left={type:'op',op,left,right:sum()};}return left;}
  const tree=comparison();if(i!==tokens.length)throw fault('#SINTASSI!','Controlla parentesi e separatori della formula.');
  return tree;
}
const aliases={SUM:'SOMMA',AVERAGE:'MEDIA',COUNT:'CONTA.NUMERI',IF:'SE'};
const numeric=value=>{
  if(value===null)return 0;
  if(typeof value==='number')return value;
  throw fault('#VALORE!','Il calcolo richiede un numero: un testo non è una misura.');
};
export function evaluateCell(cells,address) {
  const active=new Set(),memo=new Map();let steps=0;
  function cell(ref){
    if(memo.has(ref))return memo.get(ref);
    if(active.has(ref))throw fault('#CICLO!','La formula torna alla propria cella, direttamente o tramite altre formule.');
    if(active.size>64)throw fault('#LIMITE!','Troppi collegamenti consecutivi.');
    active.add(ref);
    const raw=String(cells[ref]??'').trim();let value;
    if(!raw)value=null;
    else if(raw.startsWith('='))value=visit(parse(raw));
    else if(raw.startsWith("'"))value=raw.slice(1);
    else if(/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)%?$/.test(raw))value=Number(raw.replace('%','').replace(',','.'))/(raw.endsWith('%')?100:1);
    else value=raw;
    if(Array.isArray(value))throw fault('#VALORE!','Usa l’intervallo dentro una funzione, per esempio SOMMA.');
    if(typeof value==='number'&&!Number.isFinite(value))throw fault('#NUM!','Il risultato non è un numero finito.');
    active.delete(ref);memo.set(ref,value);return value;
  }
  function visit(n){
    if(++steps>5000)throw fault('#LIMITE!','Formula troppo complessa per il laboratorio.');
    if(n.type==='value')return n.value;
    if(n.type==='ref')return cell(n.ref);
    if(n.type==='range')return n.refs.map(cell);
    if(n.type==='op'){
      const a=visit(n.left),b=visit(n.right);
      if(['=','<>','<','>','<=','>='].includes(n.op)){
        // Numeric comparisons remain numeric; text comparisons are case-insensitive.
        const x=typeof a==='string'?a.toLowerCase():a??0,y=typeof b==='string'?b.toLowerCase():b??0;
        if(typeof x!==typeof y)throw fault('#VALORE!','Confronta due numeri o due testi, senza mescolare i tipi.');
        return ({'=':x===y,'<>':x!==y,'<':x<y,'>':x>y,'<=':x<=y,'>=':x>=y})[n.op];
      }
      const x=numeric(a),y=numeric(b);
      if(n.op==='/'&&y===0)throw fault('#DIV/0!','Il denominatore è zero o vuoto. Controlla il riferimento e il dato mancante.');
      return ({'+':()=>x+y,'-':()=>x-y,'*':()=>x*y,'/':()=>x/y,'^':()=>x**y})[n.op]();
    }
    const name=aliases[n.name]||n.name;
    if(name==='SE'){
      if(n.args.length!==3)throw fault('#SINTASSI!','SE richiede condizione; valore se vera; valore se falsa.');
      const condition=visit(n.args[0]);
      if(!['boolean','number'].includes(typeof condition))throw fault('#VALORE!','La condizione di SE deve dare vero/falso o un numero.');
      return visit(n.args[condition?1:2]); // Do not evaluate the unselected branch.
    }
    if(!['SOMMA','MEDIA','MIN','MAX','CONTA.NUMERI'].includes(name))throw fault('#NOME?','Funzione non supportata. Sono disponibili SOMMA, MEDIA, MIN, MAX, CONTA.NUMERI e SE.');
    if(!n.args.length)throw fault('#SINTASSI!','Inserisci almeno un argomento.');
    const values=n.args.flatMap(a=>{const v=visit(a);return Array.isArray(v)?v:[v];}).filter(v=>typeof v==='number');
    if(name==='CONTA.NUMERI')return values.length;
    if(name==='SOMMA')return values.reduce((a,b)=>a+b,0);
    if(name==='MEDIA'&&!values.length)throw fault('#DIV/0!','MEDIA non ha valori numerici da contare.');
    if(name==='MEDIA')return values.reduce((a,b)=>a+b,0)/values.length;
    return values.length?(name==='MIN'?Math.min(...values):Math.max(...values)):0;
  }
  try{return {value:cell(sheetAddress(address).key),error:null};}
  catch(error){return {value:null,error:error.code||'#SINTASSI!',message:error.message};}
}
export function copyFormula(formula,from,to) {
  if(!formula.trim().startsWith('='))return formula;
  const a=sheetAddress(from),b=sheetAddress(to),dr=b.row-a.row,dc=b.column-a.column;
  return formula.replace(/"(?:[^"]|"")*"|\$?[A-Za-z]+\$?[1-9][0-9]*/g,(token,offset,whole)=>{
    if(token.startsWith('"'))return token;
    if(/[A-Za-z0-9_.]/.test(whole[offset-1]||'')||/[A-Za-z0-9_.(]/.test(whole[offset+token.length]||''))return token;
    const r=sheetAddress(token),row=r.row+(r.fixedRow?0:dr),column=r.column+(r.fixedColumn?0:dc);
    if(row<1||row>99||column<0||column>25)throw fault('#RIF!','La copia porterebbe un riferimento fuori dal foglio didattico.');
    return `${r.fixedColumn?'$':''}${String.fromCharCode(65+column)}${r.fixedRow?'$':''}${row}`;
  });
}
export function gradeSheet(lab,answers) {
  const base={...lab.cells,...Object.fromEntries(lab.tasks.map(t=>[t.cell,answers[t.cell]||'']))};
  const solved={...lab.cells,...Object.fromEntries(lab.tasks.map(t=>[t.cell,t.formula]))};
  const variants=[{},...lab.variants];
  const results=lab.tasks.map(task=>{
    if(!String(answers[task.cell]||'').trim().startsWith('='))return {cell:task.cell,correct:false,help:task.help,message:'Inserisci una formula che inizi con =, non soltanto il risultato.'};
    for(const [index,variant] of variants.entries()){
      const actual=evaluateCell({...base,...variant},task.cell),expected=evaluateCell({...solved,...variant},task.cell);
      if(expected.error)throw new Error(`Soluzione del laboratorio non valida: ${task.cell}`);
      if(actual.error)return {cell:task.cell,correct:false,help:task.help,message:`${actual.error} ${actual.message}${index?' Il problema emerge cambiando i dati di partenza.':''}`};
      const equal=typeof expected.value==='number'?typeof actual.value==='number'&&Math.abs(actual.value-expected.value)<=1e-7*Math.max(1,Math.abs(expected.value))
        :typeof actual.value==='string'&&actual.value.toLowerCase()===String(expected.value).toLowerCase();
      if(!equal)return {cell:task.cell,correct:false,help:task.help,message:index?
        'Il risultato coincide sui dati iniziali, ma non quando cambiano gli ingressi. Controlla riferimenti, intervalli e valori scritti come costanti.':
        'Il risultato non corrisponde alla consegna. Controlla anche le formule delle celle da cui dipende.'};
    }
    return {cell:task.cell,correct:true,help:task.help,message:'Formula corretta sui dati iniziali e sulle variazioni controllate.'};
  });
  return {results,correct:results.filter(r=>r.correct).length,total:results.length};
}
