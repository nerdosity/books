import { readFile } from 'node:fs/promises';
import { validateContent } from '../lib/validate.js';
const data = await Promise.all(['course','exercises','library'].map(async name =>
  JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'))));
const counts = validateContent(...data);
console.log('Contenuti e collegamenti validi:',counts);
