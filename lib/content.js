import pages from '../data/pages.json';
import stylesheets from '../data/stylesheets.json';
export { pages, stylesheets };
export function normalizePath(parts = []) { return parts.length ? '/' + parts.map(decodeURIComponent).join('/') + '/' : '/'; }
export function getPage(parts) { return pages[normalizePath(parts)]; }
