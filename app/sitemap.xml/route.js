import { pages } from '../../lib/content';
import { sitemapUrls } from '../../lib/seo.mjs';
export function GET() {
 const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + sitemapUrls(Object.keys(pages)).map(url => '<url><loc>' + escape(url) + '</loc></url>').join('') + '</urlset>', {headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
