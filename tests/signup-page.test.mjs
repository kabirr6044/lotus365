import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { signupPageMarkup } from '../lib/signup-page.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const pages = read('../data/pages.json');
const copy = read('../data/signup-page-copy.json');
const styles = new Proxy({}, { get: (_,key) => key });
const original = pages['/lotus365-signup/'].html;
const result = signupPageMarkup(original,styles,copy);
const form = result.match(/<form\b[\s\S]*?<\/form>/)?.[0];

test('Signup redesign retains redirect-only validation and working local destinations',()=>{
 assert.equal((result.match(/<form\b/g)||[]).length,1);
 assert.ok(form.includes('data-redirect-form="signup"'));
 assert.ok(form.includes('action="#" method="dialog"'));
 const phone = form.match(/<input\b[^>]*id="mobile_number"[^>]*>/)[0];
 assert.ok(phone.includes('required'));
 assert.equal(phone.match(/pattern="([^"]+)"/)[1],original.match(/<input\b[^>]*id="mobile_number"[^>]*pattern="([^"]+)"/)[1]);
 assert.ok(/type="password"[^>]*required/.test(form));
 assert.ok(!/<input[^>]*id="referral_code"[^>]*required/.test(form));
 assert.ok(form.includes('class="form-status" role="status" aria-live="polite"'));
 assert.ok(!form.includes('GET OTP'));
 assert.ok(!form.includes('one-time verification code'));
 for (const link of result.matchAll(/href="(\/[^"#]*)"/g)) assert.ok(pages[link[1]] || link[1] === '/sitemap.xml',link[1]);
 assert.ok(result.includes('data-external-reference="ext-d591d7677b88"'));
 assert.ok(result.includes('id="colophon"'));
});

test('Signup copy preserves topics, offers and old section links while replacing screenshots',()=>{
 assert.equal((result.match(/<h1\b/g)||[]).length,1);
 for (const match of original.matchAll(/<h[123]\b[^>]*id="([^"]+)"/g)) assert.ok(result.includes(`id="${match[1]}"`),match[1]);
 for (const text of ['Lotus365 signup','Lotus365 registration','Lotus365 ID','Lotus365 referral code','Lotus365 login','Lotus365 Blue','₹365','₹20,000','365%','₹1,000','₹21,365','WhatsApp','SMS','UPI','bank transfer','cryptocurrency']) assert.ok(result.toLowerCase().includes(text.toLowerCase()),text);
 for (const asset of ['a8ae4fbebf698bf7.webp','7670a39d8502d96d.webp','5ac9d28e28c6845d.webp','df02ae1f4b1c1d10.svg']) assert.ok(!result.includes(asset),asset);
 assert.ok(result.includes('/assets/lotus365-signup-welcome.webp'));
 assert.ok(fs.existsSync(new URL('../public/assets/lotus365-signup-welcome.webp',import.meta.url)));
 for (const faq of copy.faq.items) assert.ok(faq.question.endsWith('?'));
});
