import images from '../data/optimized-images.json' with { type: 'json' };

// Keep the existing markup, dimensions and CSS; let the browser select bytes
// appropriate to its viewport and pixel density before hydration.
export function responsiveImages(markup) {
 return markup.replace(/<img\b[^>]*>/g, tag => {
  const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
  const image = images[src];
  if (!image) return tag;
  const fallback = image.variants.find(variant => variant.width >= 640) || image.variants.at(-1);
  const sizes = src.includes('female-mascot') ? '(max-width: 700px) calc(100vw - 40px), (max-width: 1279px) 48vw, 640px'
   : '(max-width: 700px) calc(100vw - 40px), (max-width: 1279px) 45vw, 600px';
  return tag.replace(/\s(?:src|srcset|sizes|decoding)="[^"]*"/g, '')
   .replace(/\s*\/?>(?=$)/, ` src="${fallback.src}" srcset="${image.variants.map(variant => `${variant.src} ${variant.width}w`).join(', ')}" sizes="${sizes}" decoding="async">`);
 });
}
