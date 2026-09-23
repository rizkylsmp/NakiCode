import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { config } from '../config';
import { storePreviewImage } from '../storage/image-storage';

const migrationName = process.argv[2] || '20260909-000001-publish-naki-blog-starter-content.sql';
if (!/^[a-z0-9-]+\.sql$/.test(migrationName)) {
  throw new Error('Provide a SQL migration filename, not a path.');
}

const contentMigration = path.join(
  __dirname,
  `../../database/migrations/${migrationName}`,
);

async function publishBlogContent() {
  const migration = await readFile(contentMigration, 'utf8');
  let upSql = migration.match(/-- UP\s+([\s\S]*?)(?=-- DOWN|$)/i)?.[1].trim();

  if (!upSql) {
    throw new Error('Blog content migration does not contain an UP section.');
  }

  const slugs = [...upSql.matchAll(/\(\s*'([a-z0-9-]+)'\s*,/g)].map((match) => match[1]);
  if (!slugs.length) throw new Error('Blog content migration contains no post slugs.');

  if (process.argv.includes('--upload-covers')) {
    if (!config.storage.cloudinaryUrl) {
      throw new Error('Cloudinary must be configured before publishing hosted covers.');
    }
    const covers = [...upSql.matchAll(/'((\/images\/blog\/)[a-z0-9-]+\.webp)'/g)].map((match) => match[1]);
    const files = await Promise.all(covers.map(async (cover) => ({
      cover,
      buffer: await readFile(path.resolve(__dirname, '../../../frontend/public', cover.slice(1))),
    })));
    for (const { cover, buffer } of files) {
      const stored = await storePreviewImage({
        buffer,
        originalname: path.basename(cover),
        mimetype: 'image/webp',
      } as Express.Multer.File);
      // Escape the public storage URL before incorporating it into the trusted SQL file.
      upSql = upSql.replaceAll(`'${cover}'`, pool.escape(stored.url));
    }
  }

  await pool.query(upSql);

  const [posts] = await pool.query<RowDataPacket[]>(
    `SELECT slug, status, cover_image
    FROM blog_posts
    WHERE slug IN (?)
    ORDER BY id ASC`,
    [slugs],
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
