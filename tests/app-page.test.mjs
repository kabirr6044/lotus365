import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { appPageMarkup } from '../lib/app-page.mjs';

const pages = JSON.parse(fs.readFileSync(new URL('../data/pages.json',import.meta.url)));
const copy = JSON.parse(fs.readFileSync(new URL('../data/app-page-copy.json',import.meta.url)));
const styles = new Proxy({}, { get: (_,key) => key });
const original = pages['/lotus365-app/'].html;
const result = appPageMarkup(original,styles,styles,copy);
const entry = result.slice(result.indexOf('<div class="content">'),result.indexOf('<footer'));

test('App redesign preserves account destinations, download routing and section anchors',()=>{
 assert.equal((result.match(/<h1\b/g)||[]).length,1);
 for (const link of result.matchAll(/href="(\/[^"#]*)"/g)) assert.ok(pages[link[1]] || link[1] === '/sitemap.xml',link[1]);
 for (const link of original.matchAll(/href="#([^"]+)"/g)) assert.ok(result.includes(`id="${link[1]}"`),link[1]);
 for (const ref of ['ext-92297a4ac3f7','ext-5bdd1b75d525','ext-f257a97ac4e0']) assert.ok(entry.includes(`data-external-reference="${ref}"`),ref);
 assert.ok(result.includes('id="colophon"'));
 assert.ok(!entry.includes('/assets/d327e8c19b04ad86.webp'));
 assert.ok(!entry.includes('/assets/source-b12269ff3859978b5d32.webp'));
 assert.ok(!entry.includes('aria-label="On this page"'));
 assert.ok(!entry.toLowerCase().includes('image placeholder'));
 for (const asset of ['lotus365-app-phone.webp','lotus365-app-installation.webp']) {
  assert.ok(entry.includes('/assets/'+asset));
  assert.ok(fs.existsSync(new URL('../public/assets/'+asset,import.meta.url)));
 }
 for (const keyword of ['Lotus365 App','Lotus365 APK','Lotus365 app login','Lotus365 Blue','Android','iOS','Lotus365 ID']) assert.ok(entry.toLowerCase().includes(keyword.toLowerCase()),keyword);
 for (const faq of copy.faq.items) assert.ok(faq.question.endsWith('?'));
});
