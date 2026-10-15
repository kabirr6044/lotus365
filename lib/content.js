import pages from '../data/pages.json';
import stylesheets from '../data/stylesheets.json';
import redesigned from '../data/redesigned-pages.json';
export { pages, stylesheets };
export function normalizePath(parts = []) { return parts.length ? '/' + parts.map(decodeURIComponent).join('/') + '/' : '/'; }
export function getPage(parts) {
 const path = normalizePath(parts);
 const page = pages[path], replacement = redesigned[path];
 if (!page) return undefined;
 return replacement ? { ...page, html: replacement.html, redesign: { layout: replacement.layout, topic: replacement.topic } } : page;
}
