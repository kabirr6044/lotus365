import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { footerMarkup, footerGroups } from '../lib/footer.mjs';

const pages = JSON.parse(fs.readFileSync(new URL('../data/pages.json', import.meta.url), 'utf8'));
const styles = new Proxy({}, { get: (_, key) => key });

test('shared footer keeps valid local navigation and external reference routing', () => {
 for (const group of footerGroups) for (const [, href] of group.links) {
  if (!href.startsWith('ext-')) assert.ok(pages[href], href);
 }
 for (const [path, page] of Object.entries(pages)) {
  const result = footerMarkup(page.html, styles);
  assert.ok(result.includes('aria-label="Footer policies"'), path);
  assert.equal((result.match(/<footer\b/g) || []).length, 1, path);
  assert.ok(result.includes('lotus365-wa-float'), path);
  assert.ok(!/<a\b[^>]*class="[^"]*\blotus365-app-float\b/.test(result), path);
  assert.ok(result.includes('href="/lotus365-app/"'), path);
  assert.ok(result.includes('data-external-reference="ext-ddc432be01ef"'), path);
  assert.ok(result.includes('href="/sitemap.xml"'), path);
  assert.ok(!/cric[k]?bet99/i.test(result), path);
  assert.ok(!result.includes('ext-820ee485b55b'), path);
  assert.ok(!result.includes('ext-0b6484d3796d'), path);
 }
});
