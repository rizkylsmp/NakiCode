import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const requiredPages = [
  'index.html',
  'design.html',
  'design/kategori/e-commerce.html',
  'portofolio.html',
  'blog.html',
];

for (const relativePath of requiredPages) {
  const filePath = path.resolve('dist', relativePath);
  await access(filePath);
  const html = await readFile(filePath, 'utf8');

  for (const requiredPattern of [
    /<title data-rh="true">[^<]+<\/title>/,
    /<meta data-rh="true" name="description"/,
    /<link data-rh="true" rel="canonical" href="https:\/\/nakicode\.com\//,
    /<h1>[^<]+<\/h1>/,
    /application\/ld\+json/,
  ]) {
    if (!requiredPattern.test(html)) {
      throw new Error(`SEO validation failed for ${relativePath}: ${requiredPattern}`);
    }
  }
}

console.log(`SEO output validated for ${requiredPages.length} representative pages`);
