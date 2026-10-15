import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const [origin, mode = 'production'] = process.argv.slice(2);
assert.ok(origin && ['production', 'preview'].includes(mode), 'Usage: node scripts/check-seo-build.mjs https://expected-origin production|preview');
const pages = JSON.parse(await fs.readFile(new URL('../data/pages.json', import.meta.url)));
const base = new URL('../.next/server/app/', import.meta.url);
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const attr = (tag, name) => decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || '');
let checked = 0, indexable = 0;
const indexableTitles = new Set(), indexableDescriptions = new Set();
const renderedRoutes = new Map();

async function visit(dir) {
 for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
  const file = new URL(encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : ''), dir);
  if (entry.isDirectory()) { await visit(file); continue; }
  if (!entry.name.endsWith('.html')) continue;
  const relative = decodeURIComponent(file.href.slice(base.href.length)).replace(/\.html$/, '');
  const route = relative === 'index' ? '/' : `/${relative}/`;
  if (!pages[route]) continue;
  const html = await fs.readFile(file, 'utf8');
  renderedRoutes.set(route, {
   ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => decode(match[1]))),
   links: [...html.matchAll(/<a\b[^>]*>/g)].map(match => attr(match[0], 'href')),
  });
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `H1 count: ${route}`);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
  let previousLevel = 0;
  for (const heading of main.matchAll(/<h([1-6])\b/g)) {
   const level = Number(heading[1]);
   assert.ok(level <= previousLevel + 1, `Skipped heading level H${previousLevel} to H${level}: ${route}`);
   previousLevel = level;
  }
  for (const image of main.matchAll(/<img\b[^>]*>/g)) {
   assert.match(image[0], /\balt="[^"]*"/, `Image without alt attribute: ${route}`);
  }
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
  const title = decode(head.match(/<title>(.*?)<\/title>/s)?.[1] || '');
  const expectedTitle = pages[route].title + (pageNumber ? ` - Page ${pageNumber}` : '');
  assert.equal(title, expectedTitle, `Rendered title: ${route}`);
  const metaTags = [...head.matchAll(/<meta\b[^>]*>/g)].map(m => m[0]);
  const meta = (key, value) => metaTags.filter(tag => attr(tag, key) === value);
  const description = pages[route].description ? (pageNumber ? `Page ${pageNumber}: ` : '') + pages[route].description : '';
  const descriptions = meta('name', 'description');
  assert.equal(descriptions.length, description ? 1 : 0, `Description count: ${route}`);
  if (description) assert.equal(attr(descriptions[0], 'content'), description, `Description text: ${route}`);
  for (const [key, name, value] of [
   ['property', 'og:title', title], ['property', 'og:url', attr(canonical[0], 'href')],
   ['name', 'twitter:title', title],
   ...(description ? [['property', 'og:description', description], ['name', 'twitter:description', description]] : []),
  ]) {
   const tags = meta(key, name);
   assert.equal(tags.length, 1, `Social tag count ${name}: ${route}`);
   assert.equal(attr(tags[0], 'content'), value, `Social tag ${name}: ${route}`);
  }
  const viewport = meta('name', 'viewport');
  assert.equal(viewport.length, 1, `Viewport count: ${route}`);
  assert.match(attr(viewport[0], 'content'), /width=device-width/, `Responsive viewport: ${route}`);
  const links = [...head.matchAll(/<link\b[^>]*>/g)].map(m => m[0]);
  assert.ok(links.some(tag => attr(tag, 'rel') === 'icon' && attr(tag, 'href') === '/assets/cropped-lotus365-official-logo-1-32x32.webp'), `Local favicon: ${route}`);
  if (expectedIndex) {
   assert.ok(description.trim(), `Indexable page without description: ${route}`);
   assert.equal((html.match(/<h1\b/g) || []).length, 1, `Indexable H1 count: ${route}`);
   assert.ok(!indexableTitles.has(title), `Duplicate indexable title: ${route}`);
   assert.ok(!indexableDescriptions.has(description), `Duplicate indexable description: ${route}`);
   indexableTitles.add(title); indexableDescriptions.add(description);
  }
  if (route === '/लोटस-365/') assert.ok(html.includes('lang="hi-IN"'), 'Hindi content language is absent from initial HTML');
  checked++; if (expectedIndex) indexable++;
 }
}
await visit(base);
assert.equal(checked, Object.keys(pages).length, 'Generated route coverage');
let sectionLinks = 0;
for (const [route, page] of renderedRoutes) {
 for (const href of page.links) {
  if (!href.startsWith('/') && !href.startsWith('#')) continue;
  const url = new URL(href, new URL(encodeURI(route), origin));
  if (url.origin !== origin) continue;
  const target = renderedRoutes.get(decodeURIComponent(url.pathname));
  if (!target) {
   assert.ok(url.pathname.startsWith('/assets/') || url.pathname === '/sitemap.xml', `Missing internal route: ${route} → ${href}`);
   continue;
  }
  if (!url.hash) continue;
  assert.ok(target.ids.has(decodeURIComponent(url.hash.slice(1))), `Missing section target: ${route} → ${href}`);
  sectionLinks++;
 }
}
const xml = await fs.readFile(new URL('sitemap.xml.body', base), 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
const expected = mode === 'preview' ? [] : Object.keys(pages).filter(p => !/^\/(tag|category|author)\//.test(p)).map(p => new URL(encodeURI(p), origin).href);
assert.deepEqual(urls.sort(), expected.sort(), 'Sitemap URL selection');
const robots = await fs.readFile(new URL('robots.txt.body', base), 'utf8');
if (mode === 'preview') { assert.match(robots, /Disallow: \/\s/); assert.ok(!robots.includes('Sitemap:')); }
else { assert.match(robots, /Allow: \/\s/); assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`)); assert.ok(!robots.includes('Disallow: /')); }
console.log(`Verified ${checked} generated pages: metadata, social tags, viewport, favicons, canonicals, heading hierarchy, image alt attributes and ${sectionLinks} section links; ${indexable} indexable URLs with unique titles/descriptions; robots.txt and sitemap (${mode}).`);
