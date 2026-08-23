import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS } from '../../server/menu-data';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const categoryNames = new Map(INITIAL_CATEGORIES.map((category) => [category.slug, category.name]));
    const items = INITIAL_MENU_ITEMS.map((item) => ({
      ...item,
      category_name: categoryNames.get(item.category_slug) || 'Uncategorized',
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    }));
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Menu items API failed:', error);
    return res.status(500).json({ error: 'Failed to retrieve menu items' });
  }
}
