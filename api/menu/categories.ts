import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_CATEGORIES } from '../../server/menu-data';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const categories = INITIAL_CATEGORIES
      .filter((category) => category.is_active)
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((category) => ({
        ...category,
        created_at: new Date(0).toISOString(),
      }));
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Menu categories API failed:', error);
    return res.status(500).json({ error: 'Failed to retrieve menu categories' });
  }
}
