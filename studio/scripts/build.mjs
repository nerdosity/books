import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { validateContent } from '../lib/validate.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export const outputFile = path.join(root, 'pronto', 'index.html');

// Minimal static linker for this project's named ESM imports/exports.
// Modules keep their own scope. Unsupported syntax fails the build.
export async function bundleScript(entry = path.join(root, 'app.js')) {
  const modules = new Map(), visiting = new Set(), chunks = [];
  async function visit(filename) {
    if (visiting.has(filename)) throw new Error(`Dipendenza circolare: ${filename}`);
    if (modules.has(filename)) return modules.get(filename);
    const relative = path.relative(root, filename);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !filename.endsWith('.js'))
      throw new Error('Sono supportati solo moduli JavaScript locali al progetto.');
    const name = `module${modules.size}`;
    modules.set(filename, name); visiting.add(filename);
    let source = await readFile(filename, 'utf8');
    const imports = [...source.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm)];
    for (const match of imports) {
      if (!match[2].startsWith('.')) throw new Error('Dipendenze esterne non supportate.');
      const symbols = match[1].split(',').map(x => x.trim()).filter(Boolean);
      if (!symbols.every(s => /^[A-Za-z_$][\w$]*$/.test(s))) throw new Error('Import non supportato.');
      const dependency = await visit(path.resolve(path.dirname(filename), match[2]));
      source = source.replace(match[0], `const { ${symbols.join(', ')} } = ${dependency};`);
    }
    const exports = [];
    source = source.replace(/^export\s+(const|let|function|async function)\s+([A-Za-z_$][\w$]*)/gm,
      (_, kind, symbol) => { exports.push(symbol); return `${kind} ${symbol}`; });
    if (/^\s*(?:import|export)\s/m.test(source)) throw new Error(`Sintassi modulo non supportata: ${relative}`);
    chunks.push(`const ${name} = (() => {\n${source}\nreturn { ${exports.join(', ')} };\n})();`);
    visiting.delete(filename);
    return name;
  }
  await visit(entry);
  const code = `(() => {\n'use strict';\n${chunks.join('\n')}\n})();`;
  new Script(code); // Syntax check before writing a deliverable.
  return code;
}

export function inlineJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
export async function renderBuild() {
  const [course, exercises, library] = await Promise.all(['course', 'exercises', 'library'].map(async name =>
    JSON.parse(await readFile(path.join(root, 'data', `${name}.json`), 'utf8'))));
  const counts = validateContent(course, exercises, library);
  // Images remain editable assets in the sources and become data URLs in the single-file delivery.
  for (const figure of course.figures || []) {
    const imagePath=path.resolve(root,figure.file);
    if (!imagePath.startsWith(path.join(root,'assets')+path.sep)) throw new Error('Immagine fuori dalla cartella assets.');
    const bytes=await readFile(imagePath);
    const png=figure.file.endsWith('.png');
    const valid=png ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes[0]===0xff && bytes[1]===0xd8;
    if (!valid) throw new Error(`Immagine ${png?'PNG':'JPEG'} non valida: ${figure.id}`);
    figure.dataUrl=`data:image/${png?'png':'jpeg'};base64,${bytes.toString('base64')}`;
  }
  const [template, baseCss, script] = await Promise.all([
    readFile(path.join(root, 'index.template.html'), 'utf8'),
    readFile(path.join(root, 'styles.css'), 'utf8'),
    bundleScript()
  ]);
  const fontManifest = JSON.parse(await readFile(path.join(root,'assets','fonts','manifest.json'),'utf8'));
  const fonts = await Promise.all(fontManifest.map(async font => {
    if (!/^google-sans-[a-z-]+\.woff2$/.test(font.file) || !['normal','italic'].includes(font.style)
      || font.weight !== '400 700' || !/^[U+0-9A-F?, -]+$/.test(font.unicodeRange)) throw new Error('Manifest font non valido.');
    const bytes = await readFile(path.join(root,'assets','fonts',font.file));
    if (bytes.subarray(0,4).toString() !== 'wOF2') throw new Error('Font WOFF2 non valido.');
    return `@font-face{font-family:"Google Sans";font-style:${font.style};font-weight:${font.weight};font-display:swap;src:url(data:font/woff2;base64,${bytes.toString('base64')}) format("woff2");unicode-range:${font.unicodeRange}}`;
  }));
  const fontLicense = await readFile(path.join(root,'assets','fonts','OFL.txt'),'utf8');
  const css = `/* Google Sans — SIL Open Font License 1.1\n${fontLicense.replace(/\*\//g,'* /')}\n*/\n${fonts.join('\n')}\n${baseCss}`;
  if (/<\/style/i.test(css) || /<\/script/i.test(script))
    throw new Error('Sequenza HTML di chiusura non consentita nel codice incorporato.');
  let html = template;
  for (const [marker, replacement] of [
    ['<link rel="stylesheet" href="./styles.css">', `<style>\n${css}\n</style>`],
    ['<!-- STUDIO_DATA -->', `<script type="application/json" id="studio-data">${inlineJson({course,exercises,library})}</script>`],
    ['<!-- STUDIO_SCRIPT -->', `<script>\n${script}\n</script>`]
  ]) {
    if (html.split(marker).length !== 2) throw new Error(`Marcatore assente o duplicato: ${marker}`);
    html = html.replace(marker, () => replacement);
  }
  return { html, counts };
}
export async function build() {
  const { html, counts } = await renderBuild();
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, html, 'utf8');
  return { outputFile, bytes: Buffer.byteLength(html), counts };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Pronto: ${result.outputFile}\n${Math.ceil(result.bytes / 1024)} KB · apribile con doppio clic · nessun server.`);
}
