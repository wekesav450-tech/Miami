import type { VercelRequest, VercelResponse } from '@vercel/node';

const categories: Record<string, string> = {
  'flame-grills': 'Flame Grills & Nyama Choma',
  'kenyan-classics': 'Authentic Kenyan Classics',
  'continental-mains': 'Continental & International',
  'sides-bites': 'Bites, Starters & Sides',
  beverages: 'Hot & Cold Beverages',
};

const sourceItems = [
  ['item_choma_goat_1kg','flame-grills','Nyama Choma - Mbuzi (1 Kg)','Tender prime goat meat flame-roasted over charcoal, seasoned with sea salt and served with fresh spicy kachumbari and ugali.',1600,'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_choma_goat_half','flame-grills','Nyama Choma - Mbuzi (1/2 Kg)','Half kilo of succulent charbroiled goat ribs & loin, served with kachumbari and roast potatoes or ugali.',850,'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_choma_kuku_full','flame-grills','Kuku Choma - Full Chicken','Whole chicken marinated in ginger, garlic, lemon, and Kenyan herbs, grilled over slow coals.',1800,'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_choma_kuku_half','flame-grills','Kuku Choma - Half Chicken','Half grilled chicken served with a side of chips or ugali and chili-lemon kachumbari.',950,'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_pork_ribs','flame-grills','Miami BBQ Pork Chops & Ribs','Glazed pork ribs caramelized with Miami honey-garlic BBQ reduction, served with seasoned wedges.',1100,'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_tilapia_naivasha','kenyan-classics','Lake Naivasha Deep Fried Tilapia','Fresh whole Lake Naivasha tilapia deep-fried crisp, smothered in rich tomato-onion-coriander gravy, served with white ugali & sukuma wiki.',1100,'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_beef_wet_fry','kenyan-classics','Beef Wet Fry (Karanga)','Tender diced beef sauteed with red onions, ripe tomatoes, sweet capsicum, and fresh coriander. Choice of chapati or ugali.',650,'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_kienyeji_chicken_stew','kenyan-classics','Special Kuku Kienyeji Stew','Free-range indigenous chicken slow-simmered in aromatic broth with fresh rosemary and garden vegetables.',900,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_pilau_beef','kenyan-classics','Swahili Pilau ya Nyama','Fragrant basmati rice infused with whole cloves, cumin, cardamom, and cinnamon, cooked with soft beef chunks and served with chilled kachumbari.',550,'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_matoke_beef','kenyan-classics','Matoke with Beef Stew','Highland green cooking bananas stewed to perfection with tender beef, carrots, and sweet bell peppers.',500,'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_miami_burger','continental-mains','New Miami Special Beef Burger','Double grilled beef patty, melted cheddar cheese, caramelized onions, crisp lettuce, gherkins, and house special sauce in a brioche bun. Served with crispy fries.',850,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_chicken_parmesan_pasta','continental-mains','Creamy Tuscan Penne Chicken Pasta','Al dente penne pasta tossed in rich garlic parmesan cream sauce with grilled chicken breast, sun-dried tomatoes, and basil.',950,'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_fish_and_chips','continental-mains','Crispy Naivasha Fish & Chips','Golden beer-battered fresh lake fish fillets served with homemade tartar sauce, lemon wedges, and hand-cut chips.',800,'https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_samosa_platter','sides-bites','Crispy Beef Samosas (3 pcs)','Golden pastry pockets stuffed with minced spiced beef, spring onions, and coriander. Served with sweet tamarind dip.',250,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_masala_chips','sides-bites','Kenyan Masala Chips','Crispy potato fries tossed in a spicy, tangy tomato-garlic masala sauce with fresh chopped coriander and lemon zest.',350,'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_mukimo_portion','sides-bites','Mukimo Special Side','Traditional mashed potatoes with soft sweet corn, green pumpkin leaves (kahurura), and yellow beans.',200,'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_chapati_pair','sides-bites','Flaky Layered Chapati (Pair)','Two soft, pan-fried Kenyan chapatis with golden flaky layers.',120,'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_kachumbari_salad','sides-bites','Fresh Garden Kachumbari','Diced ripe tomatoes, red onions, fresh coriander, green chili, and lemon dressing.',100,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_chai_masala','beverages','Kenyan Chai Masala (Pot)','Rich whole-milk tea brewed with freshly crushed ginger, cardamom, cinnamon, and cloves.',180,'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_dawa_tea','beverages','Special Naivasha Dawa','Hot revitalizing blend of fresh crushed ginger, local organic honey, freshly squeezed lemon juice, and hot water.',220,'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',true,true],
  ['item_fresh_passion_juice','beverages','Fresh Naivasha Passion Juice (500ml)','Chilled freshly blended sweet-tangy passion fruit juice without artificial preservatives.',200,'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80',true,false],
  ['item_tropical_mango_smoothie','beverages','Tropical Mango Smoothie','Thick mango puree blended with yogurt, crushed ice, and a dash of honey.',280,'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80',true,false],
] as const;

const items = sourceItems.map(([id, category_slug, name, description, price_kes, image_url, is_available, is_featured]) => ({ id, category_slug, category_name: categories[category_slug], name, description, price_kes, image_url, is_available, is_featured, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() }));

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ items });
}
