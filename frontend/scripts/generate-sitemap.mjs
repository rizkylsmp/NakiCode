import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteUrl = process.env.SITE_URL ?? 'https://nakicode.com';
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
  (category) => `/design/kategori/${slugifyCategory(category)}`,
);
const routes = [
  '/',
  '/design',
  ...categoryRoutes,
  '/portofolio',
  '/blog',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
];

const dynamicRoutes = await loadDynamicRoutes();
const uniqueRoutes = [...new Set([...routes, ...dynamicRoutes])];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes
  .map(
    (route) => `  <url>
    <loc>${new URL(route, siteUrl).toString()}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : route === '/design' ? '0.9' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const publicDir = path.resolve('public');
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'sitemap.xml'), xml);

console.log('sitemap.xml generated');

async function loadDynamicRoutes() {
  const apiOrigin = process.env.SITEMAP_API_URL?.trim();
  if (!apiOrigin) return [];

  try {
    const [designResponse, blogResponse] = await Promise.all([
      fetch(new URL('/api/designs', apiOrigin)),
      fetch(new URL('/api/blog', apiOrigin)),
    ]);

    if (!designResponse.ok || !blogResponse.ok) {
      throw new Error(`API returned ${designResponse.status}/${blogResponse.status}`);
    }

    const [{ templates = [] }, { posts = [] }] = await Promise.all([
      designResponse.json(),
      blogResponse.json(),
    ]);

    return [
      ...templates.filter((item) => item?.slug).map((item) => `/design/${encodeURIComponent(item.slug)}`),
      ...posts.filter((item) => item?.slug).map((item) => `/blog/${encodeURIComponent(item.slug)}`),
    ];
  } catch (error) {
    console.warn(`Dynamic sitemap routes were skipped: ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  }
}
