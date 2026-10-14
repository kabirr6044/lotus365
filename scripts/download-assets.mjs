import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const assetDir = path.join(root, 'public/assets');
const audit = JSON.parse(await fs.readFile(path.join(root, 'data/content-audit.json'), 'utf8'));
const ledger = JSON.parse(await fs.readFile(path.join(root, 'data/asset-ledger.json'), 'utf8'));
const entries = new Map(ledger.map(asset => [asset.url, asset]));
const urls = new Set(audit.remoteAssets);
for (const name of await fs.readdir(assetDir)) {
  if (!name.endsWith('.css')) continue;
  const css = await fs.readFile(path.join(assetDir, name), 'utf8');
  for (const match of css.matchAll(/url\(\s*['"]?(https?:\/\/[^'"\s)]+)['"]?\s*\)/g)) urls.add(match[1]);
}
const types = new Map([
  ['image/webp', '.webp'], ['image/png', '.png'], ['image/jpeg', '.jpg'],
  ['image/svg+xml', '.svg'], ['image/gif', '.gif'], ['image/avif', '.avif'],
  ['font/woff2', '.woff2'], ['font/woff', '.woff'], ['application/font-woff', '.woff'],
  ['application/octet-stream', null],
]);
const failures = [];
let downloaded = 0;
let next = 0;
const queue = [...urls];
async function download(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'WebsiteAssignmentAssetCollector/1.0' }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const type = response.headers.get('content-type')?.split(';')[0].trim();
      if (!types.has(type)) throw new Error('Unexpected content type: ' + type);
      const extension = types.get(type) || path.extname(new URL(url).pathname);
      if (!/^\.(webp|png|jpe?g|svg|gif|avif|woff2?|ttf|otf)$/i.test(extension)) throw new Error('Unsupported asset format');
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.subarray(0, 100).toString().toLowerCase().includes('<!doctype html')) throw new Error('Empty or invalid asset');
      const id = 'source-' + crypto.createHash('sha256').update(url).digest('hex').slice(0, 20);
      const target = path.join(assetDir, id + extension);
      await fs.writeFile(target, buffer);
      entries.set(url, { id, url, path: target, kind: /\.(woff2?|ttf|otf)$/i.test(extension) ? 'font' : 'image', contentType: type, name: path.basename(new URL(url).pathname), bytes: buffer.length });
      downloaded++;
      if (downloaded % 20 === 0) console.log('Downloaded ' + downloaded + '/' + queue.length + ' remaining assets');
      return;
    } catch (error) { lastError = error.message; }
  }
  failures.push({ url, error: lastError });
}
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < queue.length) { const index = next++; await download(queue[index]); }
}));
await fs.writeFile(path.join(root, 'data/asset-ledger.json'), JSON.stringify([...entries.values()]));
await fs.writeFile(path.join(root, 'data/asset-download-report.json'), JSON.stringify({ requested: queue.length, downloaded, failures }, null, 2));
console.log(JSON.stringify({ requested: queue.length, downloaded, failures }, null, 2));
if (failures.length) process.exitCode = 1;
