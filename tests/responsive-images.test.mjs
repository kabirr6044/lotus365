import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { responsiveImages } from '../lib/responsive-images.mjs';
import images from '../data/optimized-images.json' with { type: 'json' };

test('Responsive artwork preserves accessible text, dimensions and load priority', () => {
 const html = responsiveImages('<img src="/assets/lotus365-female-mascot-hero.webp" width="1254" height="1254" alt="Gaming host" fetchpriority="high"/><img src="/assets/lotus365-app-installation.webp" alt="Installation" loading="lazy"/>');
 assert.match(html, /width="1254" height="1254" alt="Gaming host" fetchpriority="high"/);
 assert.match(html, /loading="lazy"/);
 assert.equal((html.match(/srcset=/g) || []).length, 2);
 assert.equal((html.match(/sizes=/g) || []).length, 2);
 const icon = '<img src="/assets/heading-dice.svg" alt=""/>';
 assert.equal(responsiveImages(icon), icon);
});

test('Responsive assets exist and keep the phone hero under its byte budget', () => {
 for (const image of Object.values(images)) for (const variant of image.variants) {
  const bytes = fs.statSync(new URL('../public' + variant.src, import.meta.url)).size;
  assert.equal(bytes, variant.bytes);
  assert.ok(bytes < image.originalBytes);
  assert.ok(variant.width <= image.width);
 }
 const hero = images['/assets/lotus365-female-mascot-hero.webp'];
 assert.ok(hero.variants.find(item => item.width === 360).bytes < 60000);
 assert.ok(hero.variants.find(item => item.width === 640).bytes < 120000);
});
