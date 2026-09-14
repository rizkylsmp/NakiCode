import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteUrl = process.env.SITE_URL ?? 'https://nakicode.com';
const categoryItems = JSON.parse(
  await readFile(path.resolve('src/domain/category-seo.json'), 'utf8'),
);
const categoryRoutes = categoryItems.map(
  (category) => `/design/kategori/${category.slug}`,
);
const staticRoutes = [
  '/',
  '/design',
  ...categoryRoutes,
  '/portofolio',
  '/blog',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
];

const dynamicRoutes = await loadDynamicRoutes();
const routeEntries = deduplicateRoutes([
  ...staticRoutes.map((route) => ({ route })),
  ...dynamicRoutes,
]);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routeEntries
  .map(
    ({ route, lastModified }) => `  <url>
    <loc>${escapeXml(new URL(route, siteUrl).toString())}</loc>
${lastModified ? `    <lastmod>${escapeXml(lastModified)}</lastmod>\n` : ''}    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : route === '/design' ? '0.9' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const publicDir = path.resolve('public');
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'sitemap.xml'), xml);

console.log(`sitemap.xml generated with ${routeEntries.length} public URLs`);

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
      ...templates.filter((item) => item?.slug).map((item) => ({
        route: `/design/${encodeURIComponent(item.slug)}`,
        lastModified: toIsoDate(item.updatedAt || item.createdAt),
      })),
      ...posts.filter((item) => item?.slug).map((item) => ({
        route: `/blog/${encodeURIComponent(item.slug)}`,
        lastModified: toIsoDate(item.publishedAt || item.updatedAt || item.createdAt),
      })),
    ];
  } catch (error) {
    console.warn(`Dynamic sitemap routes were skipped: ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  }
}

function deduplicateRoutes(entries) {
  const byRoute = new Map();
  for (const entry of entries) byRoute.set(entry.route, entry);
  return [...byRoute.values()];
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function escapeXml(value) {
  return String(value).replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]);
}
