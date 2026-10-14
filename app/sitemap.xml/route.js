import { pages } from '../../lib/content';
export function GET() {
 const origin = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
 const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + Object.keys(pages).map(path => '<url><loc>' + escape(origin + encodeURI(path)) + '</loc></url>').join('') + '</urlset>', {headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
