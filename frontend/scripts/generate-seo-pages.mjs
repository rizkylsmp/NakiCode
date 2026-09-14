import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteOrigin = normalizeOrigin(process.env.SITE_URL ?? 'https://nakicode.com');
const apiOrigin = process.env.SITEMAP_API_URL?.trim();
const googleSiteVerification = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
const distDirectory = path.resolve('dist');
const baseHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
const categoryItems = JSON.parse(
  await readFile(path.resolve('src/domain/category-seo.json'), 'utf8'),
);
const publicContent = await loadPublicContent();

const pages = [
  createPage('/', 'Naki Code - Jasa Pembuatan Website Berbasis Design', 'Jasa pembuatan website dari design referensi yang dapat disesuaikan dengan brand, konten, dan kebutuhan bisnis Anda.', 'Wujudkan website sesuai brand dari design pilihanmu', [
    'Pilih design sebagai inspirasi, lalu sesuaikan tampilan, konten, dan fiturnya bersama Naki Code.',
    'Jelajahi katalog design, portofolio, dan artikel untuk menemukan arah website yang sesuai kebutuhanmu.',
  ], [
    ['/design', 'Jelajahi design website'],
    ['/portofolio', 'Lihat portofolio Naki Code'],
    ['/blog', 'Baca artikel website'],
  ]),
  createPage('/design', 'Koleksi Design Website - Naki Code', 'Pilih design website sebagai inspirasi, lalu sesuaikan tampilan, konten, dan fiturnya bersama Naki Code.', 'Pilih design untuk website-mu', [
    'Katalog ini berisi design referensi untuk jasa pembuatan website. Setiap design dapat disesuaikan dengan identitas brand, konten, dan kebutuhan bisnis.',
  ], publicContent.designs.map((item) => [`/design/${item.slug}`, item.title])),
  ...categoryItems.map((item) => createPage(
    `/design/kategori/${item.slug}`,
    item.title,
    item.description,
    item.heading,
    item.intro,
    publicContent.designs
      .filter((design) => slugify(design.category) === item.slug)
      .map((design) => [`/design/${design.slug}`, design.title]),
    createFaqSchema(item.question, item.answer),
  )),
  createPage('/portofolio', 'Portofolio Website - Naki Code', 'Lihat portofolio website yang telah dikerjakan Naki Code dari design referensi dan brief custom pelanggan.', 'Website yang sudah kami kerjakan', [
    'Jelajahi hasil pengerjaan website dari design referensi maupun brief custom yang disesuaikan dengan kebutuhan setiap pelanggan.',
  ], publicContent.projects.map((item) => [item.websiteUrl || '/portofolio', item.title])),
  createPage('/blog', 'Blog Website dan Bisnis Digital - Naki Code', 'Tutorial dan artikel Naki Code tentang design website, development, dan workflow pembuatan website.', 'Tips website, development, dan bisnis digital', [
    'Pelajari cara merencanakan, membuat, dan mengembangkan website yang sesuai dengan kebutuhan bisnis dan penggunanya.',
  ], publicContent.posts.map((item) => [`/blog/${item.slug}`, item.title])),
  createPage('/kebijakan-privasi', 'Kebijakan Privasi - Naki Code', 'Pelajari cara Naki Code mengelola data, akun, order, dan aset yang digunakan di website.', 'Kebijakan Privasi Naki Code', ['Informasi mengenai pengumpulan, penggunaan, penyimpanan, dan perlindungan data saat menggunakan layanan Naki Code.']),
  createPage('/syarat-ketentuan', 'Syarat & Ketentuan - Naki Code', 'Ketentuan penggunaan website, konsultasi, order, pembayaran, coupon, dan layanan Naki Code.', 'Syarat dan Ketentuan Naki Code', ['Ketentuan yang berlaku ketika mengakses website, memilih design, berkonsultasi, dan menggunakan layanan Naki Code.']),
  ...publicContent.designs.map(createDesignPage),
  ...publicContent.posts.map(createBlogPage),
];

for (const page of pages) {
  const outputPath = getOutputPath(page.path);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderDocument(page));
}

console.log(`SEO prerender generated ${pages.length} crawlable HTML pages`);

function createPage(pagePath, title, description, heading, paragraphs = [], links = [], structuredData) {
  return { path: pagePath, title, description, heading, paragraphs, links, structuredData };
}

function createDesignPage(item) {
  const image = item.preview?.find((preview) => preview?.image)?.image;
  const canonicalUrl = absoluteUrl(`/design/${item.slug}`);
  return {
    ...createPage(
      `/design/${item.slug}`,
      `${item.title} - Naki Code`,
      item.description,
      item.title,
      [item.description, `Design kategori ${item.category} ini dapat digunakan sebagai referensi awal dan disesuaikan dengan kebutuhan brand.`],
      [
        [`/design/kategori/${slugify(item.category)}`, `Lihat design ${item.category} lainnya`],
        ['/design', 'Kembali ke katalog design'],
      ],
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: item.title,
        description: item.description,
        serviceType: 'Pembuatan website berbasis design referensi',
        url: canonicalUrl,
        provider: { '@type': 'ProfessionalService', name: 'Naki Code', url: absoluteUrl('/') },
        ...(image ? { image: absoluteUrl(image) } : {}),
      },
    ),
    image,
  };
}

function createBlogPage(item) {
  const publishedAt = item.publishedAt || item.createdAt;
  return {
    ...createPage(
      `/blog/${item.slug}`,
      `${item.title} - Naki Code`,
      item.excerpt,
      item.title,
      [item.excerpt, plainText(item.content).slice(0, 1200)],
      [
        ['/blog', 'Baca artikel Naki Code lainnya'],
        ['/design', 'Jelajahi design website'],
      ],
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: item.title,
        description: item.excerpt,
        datePublished: publishedAt,
        dateModified: item.publishedAt || item.createdAt,
        author: { '@type': 'Person', name: item.author },
        publisher: { '@type': 'Organization', name: 'Naki Code', logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') } },
        ...(item.coverImage ? { image: absoluteUrl(item.coverImage) } : {}),
      },
    ),
    image: item.coverImage,
    type: 'article',
  };
}

function renderDocument(page) {
  const canonicalUrl = absoluteUrl(page.path);
  const socialImage = page.image ? absoluteUrl(page.image) : absoluteUrl('/logo.png');
  const structuredData = [
    createBreadcrumbSchema(page),
    ...(page.structuredData ? [page.structuredData] : []),
  ];
  const metadata = `
    <title data-rh="true">${escapeHtml(page.title)}</title>
    <meta data-rh="true" name="description" content="${escapeHtml(page.description)}" />
    <meta data-rh="true" name="robots" content="index, follow, max-image-preview:large" />
    <link data-rh="true" rel="canonical" href="${canonicalUrl}" />
    <meta data-rh="true" property="og:locale" content="id_ID" />
    <meta data-rh="true" property="og:site_name" content="Naki Code" />
    <meta data-rh="true" property="og:type" content="${page.type || 'website'}" />
    <meta data-rh="true" property="og:title" content="${escapeHtml(page.title)}" />
    <meta data-rh="true" property="og:description" content="${escapeHtml(page.description)}" />
    <meta data-rh="true" property="og:url" content="${canonicalUrl}" />
    <meta data-rh="true" property="og:image" content="${socialImage}" />
    <meta data-rh="true" name="twitter:card" content="${page.image ? 'summary_large_image' : 'summary'}" />
    <meta data-rh="true" name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta data-rh="true" name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta data-rh="true" name="twitter:image" content="${socialImage}" />
    ${googleSiteVerification ? `<meta data-rh="true" name="google-site-verification" content="${escapeHtml(googleSiteVerification)}" />` : ''}
    ${structuredData.map((item) => `<script type="application/ld+json">${safeJson(item)}</script>`).join('\n    ')}`;

  return baseHtml
    .replace(/\s*<title data-rh="true">[\s\S]*?<\/title>/, '')
    .replace(/\s*<(?:meta|link) data-rh="true"[^>]*>/g, '')
    .replace('</head>', `${metadata}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${renderStaticContent(page)}</div>`);
}

function renderStaticContent(page) {
  const paragraphs = page.paragraphs.filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const links = page.links.length
    ? `<ul>${page.links.map(([href, label]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('')}</ul>`
    : '';

  return `<main style="max-width:72rem;margin:0 auto;padding:2rem 1.25rem;font-family:Inter,system-ui,sans-serif;line-height:1.7;color:#0f172a"><nav aria-label="Navigasi utama"><a href="/">Naki Code</a> · <a href="/design">Design</a> · <a href="/portofolio">Portofolio</a> · <a href="/blog">Blog</a></nav><article><h1>${escapeHtml(page.heading)}</h1>${paragraphs}${links}</article></main>`;
}

function createBreadcrumbSchema(page) {
  const segments = page.path.split('/').filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      ...segments.map((segment, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: index === segments.length - 1 ? page.heading : titleCase(segment),
        item: absoluteUrl(`/${segments.slice(0, index + 1).join('/')}`),
      })),
    ],
  };
}

function createFaqSchema(question, answer) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }],
  };
}

async function loadPublicContent() {
  const empty = { designs: [], posts: [], projects: [] };
  if (!apiOrigin) return empty;

  const [designs, posts, projects] = await Promise.all([
    fetchJson('/api/designs', 'templates'),
    fetchJson('/api/blog', 'posts'),
    fetchJson('/api/projects?page=1&pageSize=9', 'projects'),
  ]);
  return { designs, posts, projects };
}

async function fetchJson(urlPath, property) {
  try {
    const response = await fetch(new URL(urlPath, apiOrigin));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    return Array.isArray(body?.[property]) ? body[property] : [];
  } catch (error) {
    console.warn(`SEO prerender skipped ${urlPath}: ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  }
}

function getOutputPath(routePath) {
  if (routePath === '/') return path.join(distDirectory, 'index.html');
  return path.join(distDirectory, `${routePath.replace(/^\//, '')}.html`);
}

function absoluteUrl(value) {
  return new URL(value, `${siteOrigin}/`).toString();
}

function normalizeOrigin(value) {
  return new URL(value).origin;
}

function slugify(value = '') {
  return value.trim().toLowerCase().replace(/&/g, 'dan').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function plainText(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
