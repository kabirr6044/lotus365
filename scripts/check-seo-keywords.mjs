import fs from 'node:fs';
import assert from 'node:assert/strict';

// Search intent belongs to a primary page. Natural wording is preferable to
// repeating every exact query in headings, titles or prose.
const targets = [
 ['Lotus365', '/', /lotus365/],
 ['Lotus365 App', '/lotus365-app/', /lotus365 app/],
 ['Lotus365 Login', '/lotus365-login/', /lotus365 login/],
 ['Lotus365 APK', '/lotus-365-online-id-apk-download/', /lotus365 apk/],
 ['Lotus365 download', '/lotus365-app/', /lotus365 download/],
 ['Lotus365 download APK', '/lotus-365-online-id-apk-download/', /(?:download.{0,60}lotus365 apk|lotus365 apk.{0,60}download)/],
 ['Lotus365 game download', '/lotus365-app/', /lotus365[\s\S]*games[\s\S]*download/],
 ['Lotus365 world', '/', /lotus365 world/],
 ['Lotus365 betting app', '/lotus365-app/', /lotus365 betting app/],
 ['Lotus365 cricket ID', '/cricket-id/', /lotus365 cricket id/],
 ['Lotus365 IPL', '/lotus365-ipl/', /lotus365 ipl/],
 ['Lotus365 signup', '/lotus365-signup/', /lotus365 signup/],
 ['Lotus365 account registration', '/lotus365-signup/', /lotus365 account registration/],
 ['Lotus365 register', '/lotus365-signup/', /lotus365[\s\S]*(?:register|registration)/],
 ['Lotus365 account login', '/lotus365-login/', /lotus365 account login/],
 ['Lotus365 Blue app', '/lotus365-blue/', /lotus365 blue app/],
 ['Lotus365 Blue login', '/lotus365-blue-login/', /lotus365 blue login/],
 ['Lotus365 cricket account', '/cricket-id/', /lotus365 cricket account/],
];
const report = targets.map(([keyword, route, pattern]) => {
 const file = new URL(`../.next/server/app/${route === '/' ? 'index' : route.slice(1, -1)}.html`, import.meta.url);
 const html = fs.readFileSync(file, 'utf8');
 const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
 const text = main.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ')
  .replace(/\s+/g, ' ').replace(/lotus\s+365/gi, 'Lotus365').toLowerCase();
 assert.ok(pattern.test(text), `Missing keyword intent in initial main HTML: ${keyword} → ${route}`);
 return { keyword, route, coverage: text.includes(keyword.toLowerCase()) ? 'exact phrase' : 'natural variant' };
});
console.table(report);
console.log(`Verified ${report.length} keyword intents in server-rendered main content.`);
