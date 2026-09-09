import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';

const contentMigration = path.join(
  __dirname,
  '../../database/migrations/20260909-000001-publish-naki-blog-starter-content.sql',
);

async function publishBlogContent() {
  const migration = await readFile(contentMigration, 'utf8');
  const upSql = migration.match(/-- UP\s+([\s\S]*?)(?=-- DOWN|$)/i)?.[1].trim();

  if (!upSql) {
    throw new Error('Blog content migration does not contain an UP section.');
  }

  await pool.query(upSql);

  const [posts] = await pool.query<RowDataPacket[]>(
    `SELECT slug, status, cover_image
    FROM blog_posts
    WHERE slug IN (
      'halaman-penting-website-bisnis',
      'cara-memilih-design-website-sesuai-brand',
      'checklist-responsive-performa-sebelum-launch',
      'kapan-bisnis-perlu-redesign-website',
      'memahami-biaya-pembuatan-website-profesional',
      'menyiapkan-konten-sebelum-development-website'
    )
    ORDER BY id ASC`,
  );

  console.log(`Published or refreshed ${posts.length} Naki Code blog posts.`);
  for (const post of posts) {
    console.log(`- ${post.slug} (${post.status}) -> ${post.cover_image}`);
  }
}

publishBlogContent()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
