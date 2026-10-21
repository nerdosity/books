import { shuffled } from './engine.js';
export function mockQuestions(course, definitions, examId, random = Math.random) {
  const test = course.exams.find(e => e.id === examId)?.mockTest;
  if (!test) return [];
  const selected = test.groups.flatMap(g => shuffled(definitions.filter(q => g.questionIds.includes(q.id)),random).slice(0,g.count));
  return shuffled(selected,random);
}
export function examUnitIds(exam) {
  return [...new Set(exam.modules.flatMap(m => m.unitIds))];
}
export function unitsForExam(course, examId) {
  const exam = course.exams.find(e => e.id === examId);
  if (!exam) return [];
  const ids = examUnitIds(exam);
  return ids.map(id => course.units.find(u => u.id === id)).filter(Boolean);
}
export function examsForUnit(course, unitId) {
  return course.exams.filter(e => examUnitIds(e).includes(unitId));
}
export function selectDefinitions(course, definitions, {exam = '', unit = '', level = ''} = {}) {
  const allowed = exam ? new Set(unitsForExam(course, exam).map(u => u.id)) : null;
  return definitions.filter(q => (!allowed || allowed.has(q.unit)) && (!unit || q.unit === unit) && (!level || q.level === level));
}
export function programmeQuestions(course, definitions, examId, random = Math.random) {
  const exam = course.exams.find(e => e.id === examId);
  if (!exam?.programme) return [];
  const allowed = new Set(examUnitIds(exam));
  const selected = [];
  for (const topic of exam.programme.topics) {
    if (topic.status === 'missing') continue;
    const candidates = definitions.filter(q => allowed.has(q.unit) && topic.questionIds.includes(q.id));
    if (selected.some(q => topic.questionIds.includes(q.id))) continue;
    const unused = candidates.filter(q => !selected.some(s => s.id === q.id));
    if (unused.length) selected.push(unused[Math.floor(random() * unused.length)]);
  }
  return selected;
}
