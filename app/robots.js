import { getSiteConfig } from '../lib/seo.mjs';

export default function robots() {
 const site = getSiteConfig();
 return site.canIndex
  ? { rules: { userAgent: '*', allow: '/' }, sitemap: `${site.origin}/sitemap.xml` }
  : { rules: { userAgent: '*', disallow: '/' } };
}
