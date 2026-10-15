import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const source = read('../data/pages.json');
const redesigned = read('../data/redesigned-pages.json');
const assets = read('../data/redesign-assets.json');
const copy = read('../data/redesign-copy.json');
const skip = new Set(['/','/lotus365-app/','/lotus365-login/','/lotus365-signup/']);

test('Every remaining route has a complete redesign with one H1 and local artwork',()=>{
 assert.equal(Object.keys(redesigned).length,Object.keys(source).length-skip.size);
 const layouts = new Set();
 for (const [path,page] of Object.entries(source)) {
  if (skip.has(path)) {assert.ok(!redesigned[path]);continue;}
  const replacement = redesigned[path];assert.ok(replacement,path);
  layouts.add(replacement.layout);
  assert.equal((replacement.html.match(/<h1\b/g)||[]).length,1,path);
  assert.ok(replacement.html.includes('id="primary"'),path);
  assert.ok(replacement.html.includes('id="colophon"'),path);
  assert.equal((replacement.html.match(/data-redirect-form=/g)||[]).length,(page.html.match(/data-redirect-form=/g)||[]).length,path);
  assert.ok(!/<script\b|<iframe\b|\son[a-z]+\s*=/i.test(replacement.html),path);
  const primary = replacement.html.slice(replacement.html.indexOf('id="primary"'),replacement.html.indexOf('<footer'));
  for (const img of primary.matchAll(/<img\b[^>]*src="([^"]+)"/g)) assert.ok(img[1].startsWith('/assets/redesign-'),`${path}: ${img[1]}`);
  for (const link of replacement.html.matchAll(/href="(\/[^"#]*)"/g)) {
   const href=link[1].replace(/&amp;/g,'&');
   const route=decodeURIComponent(href.split(/[?#]/)[0]);
   assert.ok(source[route]||route==='/sitemap.xml'||route.startsWith('/assets/'),`${path}: ${href}`);
  }
  assert.ok(!/<a\b[^>]*href="https?:/i.test(replacement.html),path);
 }
 assert.ok(layouts.size>=10);
 for(const asset of Object.values(assets))assert.ok(fs.existsSync(new URL('../public'+asset.src,import.meta.url)),asset.src);
});

test('Main pages receive individually authored introductions and archives retain pagination',()=>{
 assert.equal(Object.keys(copy.intros).length,141);
 for(const [path,intro] of Object.entries(copy.intros)){
  assert.ok(redesigned[path].html.includes(intro.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')),path);
 }
 for(const path of ['/blog/','/blog/page/2/','/tag/lotus365/','/category/lotus365/']){
  const old=source[path].html;
  const current=redesigned[path].html;
  for(const link of old.matchAll(/href="([^"#]*\/page\/\d+\/)"/g))assert.ok(current.includes(`href="${link[1]}"`),path);
 }
});

test('Comment links retain real targets and FAQ answers use a complete heading hierarchy',()=>{
 for (const [path,page] of Object.entries(redesigned)) {
  for (const link of page.html.matchAll(/href="([^"?#]*)(?:#respond)"/g)) {
   const target = redesigned[decodeURIComponent(link[1]) || path];
   assert.ok(target?.html.includes('id="respond"'),`${path}: ${link[0]}`);
  }
  assert.ok(!page.html.includes('href="/?s=blog"'),path);
  assert.ok(!page.html.includes('href="/?utm_source=chatgpt.com"'),path);
 }
 assert.ok(/<summary[^>]*><h2>/.test(redesigned['/faq/'].html));
});
