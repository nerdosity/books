import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isOpenStaxReading,openstaxReadingHTML} from '../lib/readings.js';
import {validateContent} from '../lib/validate.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'));
const course=read('course'),exercises=read('exercises'),library=read('library');

test('optional readings reject broken references, external origins and duplicate aliases',()=>{
 for(const url of ['javascript:alert(1)','https://openstax.org.evil.test/books/a/pages/b','https://openstax.org@evil.test/books/a/pages/b','https://user:pass@openstax.org/books/a/pages/b','http://openstax.org/books/a/pages/b','https://openstax.org/books/a/pages/b?redirect=evil'])assert.equal(isOpenStaxReading(url),false);
 for(const mutate of [
  (c,u)=>u.openstax.push('missing'),
  (c,u)=>u.openstax.push(u.openstax[0]),
  (c,u)=>c.sources.find(s=>s.id===u.openstax[0]).url='https://example.com/books/a/pages/b',
  (c,u)=>delete c.sources.find(s=>s.id===u.openstax[0]).reading,
  (c,u)=>u.openstax='not-an-array'
 ]){const c=structuredClone(course),u=c.units.find(u=>u.openstax);mutate(c,u);assert.throws(()=>validateContent(c,exercises,library),/OpenStax/);}
});

test('reading links escape labels, stay collapsed, use separate tabs and have printable links',()=>{
 const c=structuredClone(course),u=c.units.find(u=>u.openstax),s=c.sources.find(s=>s.id===u.openstax[0]);
 s.title='<img src=x onerror=alert(1)>';u.openstaxNote='<script>bad()</script>';
 const html=openstaxReadingHTML(c,u);
 assert.ok(!html.includes('<img')&&!html.includes('<script>'));
 assert.match(html,/&lt;img/);assert.match(html,/target="_blank" rel="noopener noreferrer"/);
 assert.match(html,/<details class="openstax-reading editorial">/);assert.ok(!html.includes('<iframe'));
 const print=openstaxReadingHTML(c,u,true);assert.ok(!print.includes('<details'));assert.ok(print.includes(s.url));
 assert.equal(openstaxReadingHTML(c,{id:'none'}),'');
});
