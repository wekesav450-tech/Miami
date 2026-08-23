import type { VercelRequest, VercelResponse } from '@vercel/node';

const categories = [
  { id: 'cat_grills', name: 'Flame Grills & Nyama Choma', slug: 'flame-grills', description: 'Expertly flame-grilled Kenyan meats, seasoned with local herbs and served with kachumbari.', display_order: 1, is_active: true },
  { id: 'cat_kenyan_classics', name: 'Authentic Kenyan Classics', slug: 'kenyan-classics', description: 'Traditional slow-cooked stews, Lake Naivasha fresh fish, and hearty local staples.', display_order: 2, is_active: true },
  { id: 'cat_continental', name: 'Continental & International', slug: 'continental-mains', description: 'Savory gourmet burgers, steaks, pastas, and continental chef specials.', display_order: 3, is_active: true },
  { id: 'cat_sides_bites', name: 'Bites, Starters & Sides', slug: 'sides-bites', description: 'Crispy samosas, masala chips, golden chapatis, mukimo, and fresh salads.', display_order: 4, is_active: true },
  { id: 'cat_drinks', name: 'Hot & Cold Beverages', slug: 'beverages', description: 'Famous Kenyan Chai Masala, therapeutic Dawa, fresh tropical smoothies and juices.', display_order: 5, is_active: true },
].map((category) => ({ ...category, created_at: new Date(0).toISOString() }));

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ categories });
}
