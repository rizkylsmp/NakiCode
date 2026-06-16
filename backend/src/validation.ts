import type { Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function parseBody<Output>(
  schema: ZodSchema<Output>,
  request: Request,
  response: Response,
) {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      message: 'Input tidak valid',
      errors: result.error.flatten(),
    });
    return null;
  }

  return result.data;
}

export function parseParams<Output>(
  schema: ZodSchema<Output>,
  request: Request,
  response: Response,
) {
  const result = schema.safeParse(request.params);

  if (!result.success) {
    response.status(400).json({
      message: 'Parameter tidak valid',
      errors: result.error.flatten(),
    });
    return null;
  }

  return result.data;
}
