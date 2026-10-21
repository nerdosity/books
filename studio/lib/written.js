export const WRITTEN_PARTS = {istologia:'Istologia · risposte brevissime',locomotore:'Apparato osteoartromuscolare · elaborato',organi:'Organi e apparati · elaborato'};
export const WRITTEN_RATINGS = {ripassare:'Da ripassare',parziale:'In parte',solida:'Risposta solida'};
export function newWrittenRecord(){return {answers:{},revealed:[],ratings:{}};}
export function writtenSummary(paper,record=newWrittenRecord()){
  return Object.keys(WRITTEN_PARTS).map(part=>{
    const qs=paper.questions.filter(q=>q.part===part);
    return {part,total:qs.length,answered:qs.filter(q=>record.answers[q.id]?.trim()).length,
      reviewed:qs.filter(q=>record.answers[q.id]?.trim()&&record.ratings[q.id]).length,
      solid:qs.filter(q=>record.answers[q.id]?.trim()&&record.ratings[q.id]==='solida').length};
  });
}
export function writeDraft(record,id,text){record.answers[id]=text.slice(0,12000);delete record.ratings[id];}
export function revealWritten(record,id){if(!record.revealed.includes(id))record.revealed.push(id);}
export function rateWritten(record,id,rating){
  if(!record.revealed.includes(id)||!record.answers[id]?.trim())return false;
  if(rating==='')delete record.ratings[id];
  else if(Object.hasOwn(WRITTEN_RATINGS,rating))record.ratings[id]=rating;
  else return false;
  return true;
}
