import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const read = name => fs.readFile(new URL(`../data/${name}`, import.meta.url), 'utf8').then(JSON.parse);
const [pages, aliases] = await Promise.all([read('pages.json'), read('aliases.json')]);
const origin = 'https://navigation-check.invalid';
const decode = value => value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) =>
 String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
 .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, key) => ({ amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:' ' })[key]);
const attribute = (tag, name) => decode(tag.match(new RegExp(`\\s${name}=(['"])(.*?)\\1`, 'is'))?.[2] || '');
const ids = new Map(Object.entries(pages).map(([path, page]) => [path,
 new Set([...page.html.matchAll(/\sid=(['"])(.*?)\1/gs)].map(match => decode(match[2])))]));
const assets = new Set();
let links = 0, fragments = 0;

for (const [path, page] of Object.entries(pages)) {
 for (const [tag] of page.html.matchAll(/<a\b[^>]*>/gi)) {
  links++;
  const href = attribute(tag, 'href');
  if (!href || href === '#' || /\sdata-external-reference=/.test(tag)) continue;
  const url = new URL(href, origin + path);
  assert.equal(url.origin, origin, `Unexpected outbound link: ${path} -> ${href}`);
  let target = decodeURIComponent(url.pathname);
  if (target.startsWith('/assets/')) { assets.add(target); continue; }
  if (['/sitemap.xml', '/robots.txt'].includes(target)) continue;
  if (!target.endsWith('/')) target += '/';
  const visited = new Set();
  while (aliases[target]) {
   assert.ok(!visited.has(target), `Redirect cycle: ${target}`);
   visited.add(target); target = aliases[target];
  }
  assert.ok(pages[target], `Broken route: ${path} -> ${href}`);
  if (url.hash) {
   fragments++;
   assert.ok(ids.get(target).has(decodeURIComponent(url.hash.slice(1))), `Missing section: ${path} -> ${href}`);
  }
 }
 for (const [tag] of page.html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
  const src = attribute(tag, 'src');
  if (src.startsWith('/assets/')) assets.add(decodeURIComponent(new URL(src, origin).pathname));
 }
}
await Promise.all([...assets].map(path => fs.access(new URL('../public' + encodeURI(path), import.meta.url))));
console.log(`Validated ${Object.keys(pages).length} pages, ${links} links, ${fragments} section targets and ${assets.size} local media files.`);

// Optional running-production-server check. Only local routes are requested.
if (process.argv[2]) {
 const base = new URL(process.argv[2]);
 assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Use a local server for the HTTP audit');
 const queue = [...Object.keys(pages), '/robots.txt', '/sitemap.xml'];
 let checked = 0;
 await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
   const path = queue.shift();
   const response = await fetch(new URL(path, base), { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
   assert.equal(response.status, 200, `HTTP status: ${path}`);
   checked++;
  }
 }));
 for (const [source, destination] of Object.entries(aliases)) {
  const response = await fetch(new URL(source, base), { redirect: 'manual' });
  assert.ok([301, 308].includes(response.status), `Permanent alias redirect: ${source}`);
  assert.equal(new URL(response.headers.get('location'), base).pathname, destination);
  await response.body?.cancel();
 }
 const slash = await fetch(new URL('/lotus365-login', base), { redirect: 'manual' });
 assert.equal(slash.status, 308);
 assert.equal(new URL(slash.headers.get('location'), base).pathname, '/lotus365-login/');
 await slash.body?.cancel();
 const missing = await fetch(new URL('/__seo-audit-missing-page__/', base));
 assert.equal(missing.status, 404, 'Unknown URLs must remain genuine 404s');
 assert.match(await missing.text(), /name="robots" content="noindex/);
 console.log(`HTTP audit passed for ${checked} URLs, aliases, trailing slash redirects and the noindex 404 page.`);
}
