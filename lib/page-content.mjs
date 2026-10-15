// Preserve the captured document shell while replacing one nested content area.
export function replaceEntryContent(markup, body) {
 const opening = /<div\b[^>]*class="[^"]*\bentry-content\b[^"]*"[^>]*>/g.exec(markup);
 if (!opening) throw new Error('Page entry content was not found');
 const start = opening.index + opening[0].length;
 const tags = /<\/?div\b[^>]*>/g;
 tags.lastIndex = start;
 let depth = 1;
 for (let tag; (tag = tags.exec(markup));) {
  depth += tag[0].startsWith('</') ? -1 : 1;
  if (depth === 0) return markup.slice(0,start) + body + markup.slice(tag.index);
 }
 throw new Error('Page entry content is not balanced');
}
