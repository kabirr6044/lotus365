import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const [origin, mode = 'production'] = process.argv.slice(2);
assert.ok(origin && ['production', 'preview'].includes(mode), 'Usage: node scripts/check-seo-build.mjs https://expected-origin production|preview');
const pages = JSON.parse(await fs.readFile(new URL('../data/pages.json', import.meta.url)));
const base = new URL('../.next/server/app/', import.meta.url);
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const attr = (tag, name) => decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || '');
let checked = 0, indexable = 0;

async function visit(dir) {
 for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
  const file = new URL(encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : ''), dir);
  if (entry.isDirectory()) { await visit(file); continue; }
  if (!entry.name.endsWith('.html')) continue;
  const relative = decodeURIComponent(file.href.slice(base.href.length)).replace(/\.html$/, '');
  const route = relative === 'index' ? '/' : `/${relative}/`;
  if (!pages[route]) continue;
  const html = await fs.readFile(file, 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
  assert.ok(head, `Missing head: ${route}`);
  const canonical = [...head.matchAll(/<link\b[^>]*>/g)].map(m => m[0]).filter(tag => attr(tag, 'rel') === 'canonical');
  assert.equal(canonical.length, 1, `Canonical count: ${route}`);
  assert.equal(attr(canonical[0], 'href'), new URL(encodeURI(route), origin).href, `Canonical URL: ${route}`);
  const robots = [...head.matchAll(/<meta\b[^>]*>/g)].map(m => m[0]).filter(tag => attr(tag, 'name') === 'robots').map(tag => attr(tag, 'content'));
  const expectedIndex = mode === 'production' && !/^\/(tag|category|author)\//.test(route);
  assert.equal(robots.length, 1, `Robots count: ${route}`);
  assert.ok(robots[0].split(/,\s*/).includes(expectedIndex ? 'index' : 'noindex'), `Index policy: ${route}`);
  assert.ok(!robots[0].split(/,\s*/).includes('nofollow'), `Unexpected nofollow: ${route}`);
  const pageNumber = route.match(/\/page\/(\d+)\/$/)?.[1];
  if (pageNumber) assert.ok(decode(head.match(/<title>(.*?)<\/title>/s)?.[1] || '').endsWith(` - Page ${pageNumber}`), `Pagination title: ${route}`);
  if (route === '/लोटस-365/') assert.ok(html.includes('lang="hi-IN"'), 'Hindi content language is absent from initial HTML');
  checked++; if (expectedIndex) indexable++;
 }
}
await visit(base);
assert.equal(checked, Object.keys(pages).length, 'Generated route coverage');
const xml = await fs.readFile(new URL('sitemap.xml.body', base), 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
const expected = mode === 'preview' ? [] : Object.keys(pages).filter(p => !/^\/(tag|category|author)\//.test(p)).map(p => new URL(encodeURI(p), origin).href);
assert.deepEqual(urls.sort(), expected.sort(), 'Sitemap URL selection');
const robots = await fs.readFile(new URL('robots.txt.body', base), 'utf8');
if (mode === 'preview') { assert.match(robots, /Disallow: \/\s/); assert.ok(!robots.includes('Sitemap:')); }
else { assert.match(robots, /Allow: \/\s/); assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`)); assert.ok(!robots.includes('Disallow: /')); }
console.log(`Verified ${checked} generated pages, ${indexable} indexable URLs, matching canonicals, robots.txt and sitemap (${mode}).`);
