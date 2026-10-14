import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const pages=JSON.parse(await fs.readFile(new URL('../data/pages.json',import.meta.url)));
const manifest=JSON.parse(await fs.readFile(new URL('../data/route-manifest.json',import.meta.url)));
const audit=JSON.parse(await fs.readFile(new URL('../data/content-audit.json',import.meta.url)));
for(const path of manifest) assert.ok(pages[path], 'Missing route: '+path);
assert.equal(audit.incomplete.length,0,'Truncated source content remains');
assert.equal(audit.remoteAssets.length,0,'Remote image references remain');
let forms=0;for(const [path,page] of Object.entries(pages)){
 assert.ok(!/<script\b|\son[a-z]+\s*=|<iframe\b/i.test(page.html),'Executable source content: '+path);
 assert.ok(!/<a\b[^>]*\bhref=["']https?:/i.test(page.html),'Active outbound navigation: '+path);
 assert.ok(!/name=["'](?:password|otp)["']/i.test(page.html),'Sensitive field serialization: '+path);
 assert.ok(!/<(?:img|source)\b[^>]*\bsrc=["']https?:/i.test(page.html),'Remote image source: '+path);
 assert.ok(!/data-media-image=["']https?:/i.test(page.html),'Remote image viewer source: '+path);
 assert.ok(page.stylesheet?.startsWith('/assets/page-'),'Missing ordered stylesheet: '+path);
 await fs.access(new URL('../public'+page.stylesheet,import.meta.url));
 assert.ok(!/data-collection-form|\/api\/submissions\//.test(page.html),'Old collection handler: '+path);
 forms+=(page.html.match(/data-redirect-form=/g)||[]).length;
}
const assetFiles=await fs.readdir(new URL('../public/assets/',import.meta.url));
for(const name of assetFiles){
 if(!name.endsWith('.css')) continue;
 const css=await fs.readFile(new URL('../public/assets/'+name,import.meta.url),'utf8');
 assert.ok(!/url\(\s*['"]?https?:\/\//i.test(css),'Remote CSS resource: '+name);
}
assert.equal(audit.unresolvedInternalLinks.length,0,'Unresolved internal routes: '+audit.unresolvedInternalLinks.join(', '));
console.log('Validated '+Object.keys(pages).length+' routes, '+forms+' redirect forms, and '+audit.externalDestinationCount+' shared-destination external references.');
