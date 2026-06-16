import type { NextFunction, Request, Response } from 'express';

const publicCacheRoutes = [
  /^\/api(?:\/v1)?\/templates(?:\/[^/]+)?$/,
  /^\/api(?:\/v1)?\/categories$/,
  /^\/api(?:\/v1)?\/projects$/,
  /^\/api(?:\/v1)?\/blog(?:\/[^/]+)?$/,
  /^\/api(?:\/v1)?\/business\/bundles$/,
];

export function cacheHeaders(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (request.path.startsWith('/uploads/')) {
    next();
    return;
  }

  if (
    request.method === 'GET' &&
    publicCacheRoutes.some((route) => route.test(request.path))
  ) {
    response.setHeader(
      'Cache-Control',
      'public, max-age=60, stale-while-revalidate=300',
    );
  } else {
    response.setHeader('Cache-Control', 'no-store');
  }

  next();
}
