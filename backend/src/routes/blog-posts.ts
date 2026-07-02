import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireAdmin, type UserTokenPayload } from '../auth';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  createBlogPost,
  deleteBlogPost,
  findBlogPostBySlugOrId,
  findBlogPostsForAdmin,
  findPublishedBlogPosts,
  normalizeBlogPostPayload,
  updateBlogPost,
} from '../models/blog-post.model';
import { deleteCacheKeys, getJsonCache, setJsonCache } from '../redis-cache';
import { parseBody, parseParams } from '../validation';

export const blogPostsRouter = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const blogBodySchema = z.object({
  slug: z.string().trim().max(180).optional(),
  title: z.string().trim().min(1).max(180),
  excerpt: z.string().trim().min(1).max(2000),
  content: z.string().trim().min(1),
  author: z.string().trim().max(120).optional(),
  coverImage: z.string().trim().max(500).nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
});

blogPostsRouter.get('/', async (_request, response) => {
  const cacheKey = 'blog:published';
  const cached = await getJsonCache<unknown>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  try {
    const payload = {
      source: 'mysql',
      posts: await findPublishedBlogPosts(),
    };

    await setJsonCache(cacheKey, payload);
    response.json(payload);
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database blog belum tersedia',
      posts: [],
    });
  }
});

blogPostsRouter.get('/admin', requireAdmin, async (_request, response) => {
  try {
    response.json({
      source: 'mysql',
      posts: await findBlogPostsForAdmin(),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database blog belum tersedia',
      posts: [],
    });
  }
});

blogPostsRouter.get('/:slug', async (request, response) => {
  const cacheKey = `blog:detail:${request.params.slug}`;
  const cached = await getJsonCache<unknown>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  try {
    const post = await findBlogPostBySlugOrId(request.params.slug);

    if (!post) {
      response.status(404).json({ message: 'Artikel tidak ditemukan' });
      return;
    }

    const payload = {
      source: 'mysql',
      post,
    };

    await setJsonCache(cacheKey, payload);
    response.json(payload);
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({ message: 'Database blog belum tersedia' });
  }
});

blogPostsRouter.post('/', requireAdmin, async (request, response) => {
  const body = parseBody(blogBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!body) {
    return;
  }

  try {
    const post = await createBlogPost(normalizeBlogPostPayload(body));

    await deleteCacheKeys(['blog:published']);
    await createAdminAuditLog({
      admin,
      action: 'blog.create',
      entityType: 'blog_post',
      entityId: post?.id ?? null,
      metadata: { title: post?.title ?? body.title },
    });

    response.status(201).json({ source: 'mysql', post });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menyimpan artikel' });
  }
});

blogPostsRouter.put('/:id', requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(blogBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  try {
    const post = await updateBlogPost(params.id, normalizeBlogPostPayload(body));

    if (!post) {
      response.status(404).json({ message: 'Artikel tidak ditemukan' });
      return;
    }

    await deleteCacheKeys(['blog:published', `blog:detail:${post.slug}`]);
    await createAdminAuditLog({
      admin,
      action: 'blog.update',
      entityType: 'blog_post',
      entityId: post.id,
      metadata: { title: post.title },
    });

    response.json({ source: 'mysql', post });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal mengubah artikel' });
  }
});

blogPostsRouter.delete('/:id', requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const wasDeleted = await deleteBlogPost(params.id);

    if (!wasDeleted) {
      response.status(404).json({ message: 'Artikel tidak ditemukan' });
      return;
    }

    await deleteCacheKeys(['blog:published']);
    await createAdminAuditLog({
      admin,
      action: 'blog.soft_delete',
      entityType: 'blog_post',
      entityId: params.id,
    });

    response.status(204).send();
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menghapus artikel' });
  }
});
