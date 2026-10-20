import {execFileSync} from 'node:child_process';
import {readFile, mkdir, copyFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean);
if (!tracked.length) throw new Error('No tracked files to inspect.');
const privatePath = /(^|\/)(?:\.local|node_modules|\.env(?:\..*)?|AGENTS\.md|MANUTENZIONE\.md)(\/|$)|\.(?:pem|key)$|(?:backup|progressi)[^/]*\.json$/i;
const signatures = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk_[A-Za-z0-9]{32,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\b[A-Z]:[\\/](?:Users|Utente)[\\/]/i
];
function inspect(text, file) {
  if (signatures.some(pattern => pattern.test(text))) throw new Error(`Potential private content in ${file}; publication stopped.`);
}
for (const file of tracked) {
  if (privatePath.test(file)) throw new Error(`Private file tracked: ${file}`);
  if (/\.(?:json|js|mjs|html|md|ya?ml|css|txt)$/.test(file)) inspect(await readFile(path.join(root, file), 'utf8'), file);
}
const source = path.join(root, 'studio/pronto/index.html');
const html = await readFile(source, 'utf8');
// Embedded figure bytes are reviewed assets; scan text without base64 noise.
inspect(html.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, ''), 'generated index.html');
const data = JSON.parse(html.match(/<script type="application\/json" id="studio-data">([\s\S]*?)<\/script>/)?.[1] || 'null');
if (!data || Object.keys(data).sort().join(',') !== 'course,exercises,library') throw new Error('Unexpected embedded data.');
const destination = path.join(root, '.local/pages-artifact');
await mkdir(destination, {recursive: true});
const unexpected = (await readdir(destination)).filter(name => name !== 'index.html');
if (unexpected.length) throw new Error('Unexpected files in Pages artifact; publication stopped.');
await copyFile(source, path.join(destination, 'index.html'));
console.log(`Inspected ${tracked.length} repository files. Pages artifact contains only index.html; no browser data is read.`);
