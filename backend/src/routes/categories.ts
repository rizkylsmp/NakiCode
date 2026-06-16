import { Router } from 'express';
import { findTemplateCategories } from '../models/category.model';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_request, response) => {
  try {
    response.json({
      source: 'mysql',
      categories: await findTemplateCategories(),
    });
  } catch {
    response.status(503).json({
      message: 'Database categories belum tersedia',
      categories: ['Semua'],
    });
  }
});
