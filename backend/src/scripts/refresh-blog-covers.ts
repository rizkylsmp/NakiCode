import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { config } from '../config';
import { storePreviewImage } from '../storage/image-storage';
import { deleteCacheKeys, getRedisClient } from '../redis-cache';

// This revision changes only covers for the three September additions.
const covers = [
  ['cara-menyusun-brief-project-website', 'website-project-brief-naki-v2.webp'],
  ['membuat-cta-website-yang-jelas', 'clear-website-call-to-action-naki-v2.webp'],
  ['checklist-perawatan-website-setelah-launch', 'website-post-launch-maintenance-naki-v2.webp'],
] as const;

async function refreshBlogCovers() {
  if (!config.storage.cloudinaryUrl) throw new Error('Cloudinary is required for hosted covers.');
  const [posts] = await pool.query<RowDataPacket[]>(
    'SELECT slug, cover_image FROM blog_posts WHERE slug IN (?) AND deleted_at IS NULL',
    [covers.map(([slug]) => slug)],
  );
  if (posts.length !== covers.length) throw new Error('All three target posts must exist before updating covers.');
  const files = await Promise.all(covers.map(async ([slug, filename]) => ({
    slug, filename,
    buffer: await readFile(path.resolve(__dirname, '../../../frontend/public/images/blog', filename)),
    previous: posts.find((post) => post.slug === slug)?.cover_image as string | null,
  })));
  const uploaded: Array<{ slug: string; url: string; previous: string | null }> = [];
  for (const file of files) {
    const stored = await storePreviewImage({ buffer: file.buffer, originalname: file.filename, mimetype: 'image/webp' } as Express.Multer.File);
    const response = await fetch(stored.url, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error(`Hosted cover validation failed for ${file.slug}. Database was not changed.`);
    }
    uploaded.push({ slug: file.slug, url: stored.url, previous: file.previous });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const cover of uploaded) {
      const [result] = await connection.query<ResultSetHeader>(
        'UPDATE blog_posts SET cover_image = ? WHERE slug = ? AND deleted_at IS NULL AND cover_image <=> ?',
        [cover.url, cover.slug, cover.previous],
      );
      if (result.affectedRows !== 1) throw new Error('A target cover changed concurrently; revision rolled back.');
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await deleteCacheKeys(['blog:published', ...covers.map(([slug]) => `blog:detail:${slug}`)]);
  for (const cover of uploaded) console.log(`${cover.slug}: ${cover.url}`);
  console.log('Updated three covers. Article content and publication dates were preserved.');
}

refreshBlogCovers().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Cover revision failed.');
  process.exitCode = 1;
}).finally(async () => { getRedisClient()?.disconnect(); await pool.end(); });
