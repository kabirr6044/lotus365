import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pageSeo } from '../lib/seo.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const pages = read('pages.json');
const editorial = read('editorial-overrides.json');
const site = { origin: 'https://llotuss365.com', canIndex: true };
const visible = markup => markup.replace(/<[^>]*>/g, '')
 .replace(/&(amp|lt|gt|quot|nbsp);/g, (_, entity) => ({amp:'&',lt:'<',gt:'>',quot:'"',nbsp:' '})[entity])
 .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
 .replace(/\s+/g, ' ').trim();

test('main landing pages publish distinct, concise metadata across search and sharing', () => {
 assert.equal(Object.keys(editorial).length, 18);
 const titles = new Set(), descriptions = new Set();
 for (const [path, copy] of Object.entries(editorial)) {
  const page = pages[path], metadata = pageSeo(page, site);
  assert.equal(page.title, copy.title, path);
  assert.equal(page.description, copy.description, path);
  assert.ok(copy.title.length <= 65 && copy.title.length >= 30, path);
  assert.ok(copy.description.length >= 120 && copy.description.length <= 160, path);
  assert.ok(!titles.has(copy.title), path);
  assert.ok(!descriptions.has(copy.description), path);
  titles.add(copy.title); descriptions.add(copy.description);
  assert.equal(metadata.openGraph.title, copy.title);
  assert.equal(metadata.twitter.description, copy.description);
  assert.equal(metadata.alternates.canonical, site.origin + path);
  assert.equal(metadata.robots.index, true);
 }
});

test('reviewed headings and prose are present in page content with one H1 per main page', () => {
 for (const [path, copy] of Object.entries(editorial)) {
  const page = pages[path], text = visible(page.html);
  assert.equal((page.html.match(/<h1\b/g) || []).length, 1, path);
  for (const rule of [...copy.headings, ...copy.paragraphs]) {
   assert.ok(text.includes(rule.after), `${path}: ${rule.after}`);
   assert.ok(!/\b(?:dummy|clones?|gateway)\b/i.test(rule.after), path);
  }
 }
});
