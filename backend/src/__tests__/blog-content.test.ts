import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('September blog additions', () => {
  const migration = readFileSync(path.resolve(__dirname, '../../database/migrations/20260915-000001-publish-three-naki-blog-posts.sql'), 'utf8');
  it('adds exactly three unique published posts without overwriting existing content', () => {
    const up = migration.split('-- UP')[1].split('-- DOWN')[0];
    const slugs = [...up.matchAll(/\(\s*'([a-z0-9-]+)'\s*,/g)].map((match) => match[1]);
    expect(slugs).toHaveLength(3);
    expect(new Set(slugs).size).toBe(3);
    expect(up.match(/'published', NOW\(\)/g)).toHaveLength(3);
    expect(up).toContain('ON DUPLICATE KEY UPDATE slug = blog_posts.slug');
  });
  it('ships every referenced cover as a local production asset', () => {
    const covers = [...migration.matchAll(/'\/images\/blog\/([^']+)'/g)].map((match) => match[1]);
    expect(covers).toHaveLength(3);
    for (const cover of covers) {
      expect(existsSync(path.resolve(__dirname, '../../../frontend/public/images/blog', cover))).toBe(true);
    }
  });
});
