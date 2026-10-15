import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loginPageMarkup } from '../lib/login-page.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const pages = read('../data/pages.json');
const copy = read('../data/login-page-copy.json');
const styles = new Proxy({}, { get: (_,key) => key });
const original = pages['/lotus365-login/'].html;
const result = loginPageMarkup(original,styles,copy);
const form = markup => markup.match(/<form\b[^>]*data-redirect-form="login"[^>]*>[\s\S]*?<\/form>/)?.[0];

test('Login redesign retains the exact redirect-only form and valid navigation',()=>{
 assert.equal(form(result),form(original));
 assert.equal((result.match(/<h1\b/g)||[]).length,1);
 assert.equal((result.match(/<form\b/g)||[]).length,1);
 assert.ok(result.includes('id="colophon"'));
 for (const link of result.matchAll(/href="(\/[^"#]*)"/g)) assert.ok(pages[link[1]] || link[1] === '/sitemap.xml',link[1]);
 for (const ref of ['ext-6b7e00a12d51','ext-1edec07c39d7']) assert.ok(result.includes(`data-external-reference="${ref}"`));
 assert.ok(!/<(?:script|iframe)\b/.test(result));
});

test('Login copy retains search topics and replaces captured screenshots with a local illustration',()=>{
 const text = result.replace(/<[^>]+>/g,' ').toLowerCase();
 for (const keyword of ['Lotus365 login','Lotus 365','Lotus365 app login','Lotus365 website login','Lotus365 betting login','Lotus365 Blue','Lotus365 India','Lotus365 VIP','Lotus365 IPL','Aviator','Ghandi Munda','The Voice','LRace Track']) assert.ok(text.includes(keyword.toLowerCase()),keyword);
 for (const asset of ['4da5e6ab29d1e363.webp','a375b60487be0519.webp','a8ae4fbebf698bf7.webp','source-4ade69486289e4ab9f54.webp','7670a39d8502d96d.webp','5ac9d28e28c6845d.webp']) assert.ok(!result.includes(asset),asset);
 assert.ok(result.includes('/assets/lotus365-login-access.webp'));
 assert.ok(fs.existsSync(new URL('../public/assets/lotus365-login-access.webp',import.meta.url)));
 assert.equal((result.match(/<details>/g)||[]).length,copy.faq.items.length);
 for(const faq of copy.faq.items) assert.ok(faq.question.endsWith('?'));
});
