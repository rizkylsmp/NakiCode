import { describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock('../db', () => ({
  pool: {
    query: dbMock.query,
  },
}));

describe('project model', () => {
  it('uses coverIndex to select the canonical cover image', async () => {
    const { normalizeProjectPayload } = await import('../models/project.model');

    const payload = normalizeProjectPayload({
      title: 'Client Site',
      imageUrls: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
      imageUrl: 'https://example.com/legacy.jpg',
      coverIndex: 1,
    });

    expect(payload.coverIndex).toBe(1);
    expect(payload.imageUrl).toBe('https://example.com/two.jpg');
    expect(payload.imageUrls).toEqual([
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
    ]);
  });

  it('falls back to the first image when coverIndex is out of range', async () => {
    const { normalizeProjectPayload } = await import('../models/project.model');

    const payload = normalizeProjectPayload({
      imageUrls: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
      coverIndex: 9,
    });

    expect(payload.coverIndex).toBe(0);
    expect(payload.imageUrl).toBe('https://example.com/one.jpg');
  });

  it('accepts snake_case cover_index and JSON image_urls from database-shaped input', async () => {
    const { normalizeProjectPayload } = await import('../models/project.model');

    const payload = normalizeProjectPayload({
      image_urls: JSON.stringify([
        'https://example.com/first.jpg',
        'https://example.com/second.jpg',
      ]),
      cover_index: 1,
    });

    expect(payload.coverIndex).toBe(1);
    expect(payload.imageUrl).toBe('https://example.com/second.jpg');
  });
});
