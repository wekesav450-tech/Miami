import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from '../../server/menu-data.ts';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const categoryNames = new Map(INITIAL_CATEGORIES.map((category) => [category.slug, category.name]));
  const items = INITIAL_MENU_ITEMS.map((item) => ({
    ...item,
    category_name: categoryNames.get(item.category_slug) || 'Uncategorized',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }));
  return res.status(200).json({ items });
}
