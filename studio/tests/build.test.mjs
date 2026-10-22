import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { renderBuild, inlineJson } from '../scripts/build.mjs';

test('delivery is one deterministic HTML with content, CSS and classic JavaScript embedded', async () => {
  const {html,counts} = await renderBuild();
  assert.equal(counts.units,211);
  assert.equal(counts.exams,10);
  assert.equal(html,(await renderBuild()).html);
  assert.doesNotMatch(html,/<script[^>]+\bsrc=|<link[^>]+\brel="stylesheet"|type="module"/i);
  assert.doesNotMatch(html,/XMLHttpRequest|localhost|127\.0\.0\.1/);
  assert.match(html,/https:\/\/api\.elevenlabs\.io/);
  const data = JSON.parse(html.match(/<script type="application\/json" id="studio-data">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.exercises.questions.length,1823);
  assert.equal(data.course.figures.length,19);
  for(const figure of data.course.figures) assert.match(figure.dataUrl,figure.file.endsWith('.png')?/^data:image\/png;base64,iVBORw0KGgo/:/^data:image\/jpeg;base64,\/9j\//);
  const code=html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(code,/^\s*(?:import|export)\s/m);
  assert.doesNotThrow(()=>new Script(code));
  assert.match(html,/<style>[\s\S]+<\/style>/);
  assert.match(html,/font-family:"Google Sans";font-style:normal;font-weight:400 700/);
  assert.match(html,/data:font\/woff2;base64,/);
  assert.match(html,/SIL OPEN FONT LICENSE Version 1.1/);
});
test('embedded JSON cannot end the script element through lesson or quiz text', () => {
  const text='</script><script>alert(1)</script><b>&\u2028\u2029';
  const encoded=inlineJson({text});
  assert.ok(!encoded.includes('<'));
  assert.deepEqual(JSON.parse(encoded),{text});
});
