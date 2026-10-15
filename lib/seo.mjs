const localHostname = hostname => hostname === 'localhost' || hostname.endsWith('.localhost') || ['127.0.0.1', '0.0.0.0', '[::1]'].includes(hostname);
export const DEFAULT_SITE_ORIGIN = 'https://llotuss365.com';

export function getSiteConfig(env = process.env) {
 const explicit = env.SITE_URL?.trim();
 const deployed = explicit || env.VERCEL || env.VERCEL_ENV || env.VERCEL_PROJECT_PRODUCTION_URL || env.RENDER || env.RENDER_EXTERNAL_URL;
 const url = new URL(explicit || DEFAULT_SITE_ORIGIN);
 if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
  throw new Error('SITE_URL must be an absolute HTTP(S) origin, without credentials, a path, query, or fragment.');
 }
 const production = !env.VERCEL_ENV || env.VERCEL_ENV === 'production';
 return {
  origin: url.origin,
  canIndex: Boolean(deployed) && !localHostname(url.hostname) && production && env.NODE_ENV !== 'development' && env.IS_PULL_REQUEST !== 'true',
 };
}

export function isIndexablePath(path) {
 return !/^\/(tag|category|author)(?:\/|$)/.test(path);
}

export function canonicalUrl(path, site = getSiteConfig()) {
 if (!path.startsWith('/') || path.startsWith('//') || /[?#]/.test(path)) throw new Error('Canonical paths must be local paths without a query or fragment.');
 return new URL(encodeURI(path), `${site.origin}/`).href;
}

export function pageLanguage(page) {
 return page.path === '/लोटस-365/' ? 'hi-IN' : (page.lang || 'en-US');
}

export function pageSeo(page, site = getSiteConfig()) {
 const number = page.path.match(/\/page\/(\d+)\/$/)?.[1];
 const title = number ? `${page.title} - Page ${number}` : page.title;
 const description = number && page.description ? `Page ${number}: ${page.description}` : page.description;
 return {
  title,
  description,
  alternates: { canonical: canonicalUrl(page.path, site) },
  robots: { index: site.canIndex && isIndexablePath(page.path), follow: true },
  openGraph: { title, description, url: canonicalUrl(page.path, site), type: 'website', locale: pageLanguage(page).replace('-', '_') },
  twitter: { card: 'summary', title, description },
 };
}

export function sitemapUrls(paths, site = getSiteConfig()) {
 return site.canIndex ? paths.filter(isIndexablePath).map(path => canonicalUrl(path, site)) : [];
}
