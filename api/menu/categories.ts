import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_CATEGORIES } from '../../server/menu-data.ts';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const categories = INITIAL_CATEGORIES
    .filter((category) => category.is_active)
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((category) => ({
      ...category,
      created_at: new Date(0).toISOString(),
    }));
  return res.status(200).json({ categories });
}
