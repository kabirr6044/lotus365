import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const assets = new URL('public/assets/', root);
const output = new URL('optimized/', assets);
await fs.mkdir(output, { recursive: true });
const files = (await fs.readdir(assets)).filter(name =>
 /^(?:redesign-.+|lotus365-(?:female-mascot-hero|app-phone|app-installation|login-access|signup-welcome))\.webp$/.test(name));
const manifest = {};
for (const name of files) {
 const source = await fs.readFile(new URL(name, assets));
 const metadata = await sharp(source).metadata();
 const widths = [...new Set([360, 640, 960, metadata.width].filter(width => width <= metadata.width))].sort((a,b) => a-b);
 const variants = [];
 for (const width of widths) {
  const image = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }).toBuffer();
  const hash = crypto.createHash('sha256').update(image).digest('hex').slice(0, 12);
  const filename = `${path.parse(name).name}-${width}-${hash}.webp`;
  await fs.writeFile(new URL(filename, output), image);
  variants.push({ width, src: `/assets/optimized/${filename}`, bytes: image.length });
 }
 manifest[`/assets/${name}`] = { width: metadata.width, height: metadata.height, originalBytes: source.length, variants };
}
await fs.writeFile(new URL('data/optimized-images.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated responsive variants for ${files.length} illustrations.`);
