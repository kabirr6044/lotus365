import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { homeHeroMarkup } from '../lib/home-hero.mjs';

const read = file => JSON.parse(fs.readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
const pages = read('pages.json');
const copy = read('homepage-copy.json');
const styles = new Proxy({}, { get: (_, key) => key });
const rendered = homeHeroMarkup(pages['/'].html, styles, copy);
const text = rendered.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();

test('homepage redesign retains target topics, one H1 and existing account destinations', () => {
 assert.equal((rendered.match(/<h1\b/g) || []).length, 1);
 for (const keyword of ['Lotus365 login', 'Lotus365 signup', 'Lotus365 Blue', 'Lotus365 VIP',
  'Lotus365 VIP login', 'Lotus365 app', 'Lotus365 APK', 'Lotus365 ID', 'Lotus365 win']) {
  assert.ok(text.includes(keyword.toLowerCase()), keyword);
 }
 for (const match of rendered.matchAll(/href="(\/[^"#]*)"/g)) {
  assert.ok(pages[match[1]] || match[1] === '/sitemap.xml', match[1]);
 }
 for (const claim of ['24/7', 'higher betting limits', 'exclusive bonuses', 'faster withdrawals',
  'cash out instantly', 'bank transfer', 'upi', 'e-wallet']) assert.ok(text.includes(claim), claim);
});

test('homepage presents a separate introduction and concise login instructions', () => {
 assert.ok(rendered.includes('id="home-overview"'));
 assert.ok(rendered.includes('aria-labelledby="home-overview"'));
 assert.ok(rendered.includes('<ol class="steps">'));
 assert.equal(copy.login.steps.length, 3);
 assert.ok(!text.includes('my experience'));
 assert.ok(!text.includes('i’ve logged'));
 assert.equal((rendered.match(/<details>/g) || []).length, copy.faq.items.length);
 assert.ok(!rendered.includes('wp-block-latest-posts__list'));
 assert.ok(!rendered.includes('Platform Comparisons'));
 assert.equal((rendered.match(/src="\/assets\/heading-dice.svg"/g) || []).length, 5);
 for (const question of copy.faq.items) assert.ok(question.question.endsWith('?'));
 assert.ok(copy.benefits.heading.endsWith('?'));
 assert.ok(copy.login.heading.endsWith('?'));
});
