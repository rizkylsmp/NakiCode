import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteUrl = process.env.SITE_URL ?? 'http://localhost:5173';
const categories = [
  'Top up games',
  'E-commerce',
  'Portfolio',
  'Company Profile',
  'CRUD',
  'Web Bucin',
];
const slugifyCategory = (category) =>
  category
    .trim()
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const categoryRoutes = categories.map(
  (category) => `/template/kategori/${slugifyCategory(category)}`,
);
const routes = [
  '/',
  '/template',
  ...categoryRoutes,
  '/blog',
  '/login',
  '/forgot-password',
];
const now = new Date().toISOString();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${new URL(route, siteUrl).toString()}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const publicDir = path.resolve('public');
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'sitemap.xml'), xml);

console.log('sitemap.xml generated');
