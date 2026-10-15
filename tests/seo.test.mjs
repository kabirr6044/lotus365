import test from 'node:test';
import assert from 'node:assert/strict';
import { getSiteConfig, canonicalUrl, pageSeo, sitemapUrls } from '../lib/seo.mjs';

const production = { NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'lotus365.vercel.app' };

test('canonical origin uses the publisher domain rather than a Vercel deployment hostname', () => {
 assert.deepEqual(getSiteConfig(production), { origin: 'https://llotuss365.com', canIndex: true });
 assert.deepEqual(getSiteConfig({ ...production, SITE_URL: ' https://www.example.com/ ', VERCEL_URL: 'unique-preview.vercel.app' }), { origin: 'https://www.example.com', canIndex: true });
});

test('preview and development deployments never become indexable from a production SITE_URL', () => {
 for (const VERCEL_ENV of ['preview', 'development', 'staging']) {
  assert.equal(getSiteConfig({ ...production, VERCEL_ENV, SITE_URL: 'https://example.com' }).canIndex, false);
 }
 assert.equal(getSiteConfig({ ...production, NODE_ENV: 'development' }).canIndex, false);
 assert.equal(getSiteConfig({ NODE_ENV: 'production', RENDER_EXTERNAL_URL: 'https://example.onrender.com', IS_PULL_REQUEST: 'true' }).canIndex, false);
});

test('Render remains supported and localhost or unconfigured builds remain noindex', () => {
 assert.deepEqual(getSiteConfig({ RENDER_EXTERNAL_URL: 'https://example.onrender.com/' }), { origin: 'https://llotuss365.com', canIndex: true });
 for (const SITE_URL of ['', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000']) {
  assert.equal(getSiteConfig({ SITE_URL }).canIndex, false);
 }
});

test('invalid origin settings fail rather than publishing incorrect canonical URLs', () => {
 for (const SITE_URL of ['example.com', 'ftp://example.com', 'https://name:secret@example.com', 'https://example.com/subpath/', 'https://example.com/?query=1', 'https://example.com/#fragment']) {
  assert.throws(() => getSiteConfig({ SITE_URL }));
 }
});

test('canonical URLs use the configured origin and preserve slash and Unicode routes', () => {
 const site = getSiteConfig(production);
 assert.equal(canonicalUrl('/', site), 'https://llotuss365.com/');
 assert.equal(canonicalUrl('/lotus365-login/', site), 'https://llotuss365.com/lotus365-login/');
 assert.equal(decodeURI(canonicalUrl('/लोटस-365/', site)), 'https://llotuss365.com/लोटस-365/');
 for (const path of ['//other.example/', '/?tracking=1', 'relative']) assert.throws(() => canonicalUrl(path, site));
});

test('sitemap includes content and pagination but omits noindex archives and preview URLs', () => {
 const paths = ['/', '/lotus365-login/', '/blog/page/2/', '/tag/lotus365/', '/category/cricket/', '/author/copied-name/'];
 const urls = sitemapUrls(paths, getSiteConfig(production));
 assert.deepEqual(urls, ['https://llotuss365.com/', 'https://llotuss365.com/lotus365-login/', 'https://llotuss365.com/blog/page/2/']);
 assert.deepEqual(sitemapUrls(paths, getSiteConfig({ ...production, VERCEL_ENV: 'preview' })), []);
});

test('page metadata sets self-canonicals, archive noindex and page-specific pagination metadata', () => {
 const page = { path: '/blog/page/2/', title: 'Lotus365 Blog', description: 'Browse the guides.', lang: 'en-US' };
 const meta = pageSeo(page, getSiteConfig(production));
 assert.equal(meta.title, 'Lotus365 Blog - Page 2');
 assert.equal(meta.description, 'Page 2: Browse the guides.');
 assert.equal(meta.alternates.canonical, 'https://llotuss365.com/blog/page/2/');
 assert.deepEqual(meta.robots, { index: true, follow: true });
 assert.equal(pageSeo({ ...page, path: '/tag/lotus365/' }, getSiteConfig(production)).robots.index, false);
 assert.equal(pageSeo(page, getSiteConfig({ ...production, VERCEL_ENV: 'preview' })).robots.index, false);
 assert.equal(pageSeo({ ...page, path: '/लोटस-365/' }, getSiteConfig(production)).openGraph.locale, 'hi_IN');
});
