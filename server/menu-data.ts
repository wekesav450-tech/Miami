export interface InitialCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface InitialMenuItem {
  id: string;
  category_slug: string;
  name: string;
  description: string;
  price_kes: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
}

export const INITIAL_CATEGORIES: InitialCategory[] = [
  {
    id: 'cat_grills',
    name: 'Flame Grills & Nyama Choma',
    slug: 'flame-grills',
    description: 'Expertly flame-grilled Kenyan meats, seasoned with local herbs and served with kachumbari.',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cat_kenyan_classics',
    name: 'Authentic Kenyan Classics',
    slug: 'kenyan-classics',
    description: 'Traditional slow-cooked stews, Lake Naivasha fresh fish, and hearty local staples.',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cat_continental',
    name: 'Continental & International',
    slug: 'continental-mains',
    description: 'Savory gourmet burgers, steaks, pastas, and continental chef specials.',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'cat_sides_bites',
    name: 'Bites, Starters & Sides',
    slug: 'sides-bites',
    description: 'Crispy samosas, masala chips, golden chapatis, mukimo, and fresh salads.',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'cat_drinks',
    name: 'Hot & Cold Beverages',
    slug: 'beverages',
    description: 'Famous Kenyan Chai Masala, therapeutic Dawa, fresh tropical smoothies and juices.',
    display_order: 5,
    is_active: true,
  },
];

export const INITIAL_MENU_ITEMS: InitialMenuItem[] = [
  // Grills & Nyama Choma
  {
    id: 'item_choma_goat_1kg',
    category_slug: 'flame-grills',
    name: 'Nyama Choma - Mbuzi (1 Kg)',
    description: 'Tender prime goat meat flame-roasted over charcoal, seasoned with sea salt and served with fresh spicy kachumbari and ugali.',
    price_kes: 1600,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_choma_goat_half',
    category_slug: 'flame-grills',
    name: 'Nyama Choma - Mbuzi (1/2 Kg)',
    description: 'Half kilo of succulent charbroiled goat ribs & loin, served with kachumbari and roast potatoes or ugali.',
    price_kes: 850,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_choma_kuku_full',
    category_slug: 'flame-grills',
    name: 'Kuku Choma - Full Chicken',
    description: 'Whole chicken marinated in ginger, garlic, lemon, and Kenyan herbs, grilled over slow coals.',
    price_kes: 1800,
    image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_choma_kuku_half',
    category_slug: 'flame-grills',
    name: 'Kuku Choma - Half Chicken',
    description: 'Half grilled chicken served with a side of chips or ugali and chili-lemon kachumbari.',
    price_kes: 950,
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_pork_ribs',
    category_slug: 'flame-grills',
    name: 'Miami BBQ Pork Chops & Ribs',
    description: 'Glazed pork ribs caramelized with Miami honey-garlic BBQ reduction, served with seasoned wedges.',
    price_kes: 1100,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },

  // Kenyan Classics
  {
    id: 'item_tilapia_naivasha',
    category_slug: 'kenyan-classics',
    name: 'Lake Naivasha Deep Fried Tilapia',
    description: 'Fresh whole Lake Naivasha tilapia deep-fried crisp, smothered in rich tomato-onion-coriander gravy, served with white ugali & sukuma wiki.',
    price_kes: 1100,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_beef_wet_fry',
    category_slug: 'kenyan-classics',
    name: 'Beef Wet Fry (Karanga)',
    description: 'Tender diced beef sauteed with red onions, ripe tomatoes, sweet capsicum, and fresh coriander. Choice of chapati or ugali.',
    price_kes: 650,
    image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_kienyeji_chicken_stew',
    category_slug: 'kenyan-classics',
    name: 'Special Kuku Kienyeji Stew',
    description: 'Free-range indigenous chicken slow-simmered in aromatic broth with fresh rosemary and garden vegetables.',
    price_kes: 900,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_pilau_beef',
    category_slug: 'kenyan-classics',
    name: 'Swahili Pilau ya Nyama',
    description: 'Fragrant basmati rice infused with whole cloves, cumin, cardamom, and cinnamon, cooked with soft beef chunks and served with chilled kachumbari.',
    price_kes: 550,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_matoke_beef',
    category_slug: 'kenyan-classics',
    name: 'Matoke with Beef Stew',
    description: 'Highland green cooking bananas stewed to perfection with tender beef, carrots, and sweet bell peppers.',
    price_kes: 500,
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },

  // Continental & International
  {
    id: 'item_miami_burger',
    category_slug: 'continental-mains',
    name: 'New Miami Special Beef Burger',
    description: 'Double grilled beef patty, melted cheddar cheese, caramelized onions, crisp lettuce, gherkins, and house special sauce in a brioche bun. Served with crispy fries.',
    price_kes: 850,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_chicken_parmesan_pasta',
    category_slug: 'continental-mains',
    name: 'Creamy Tuscan Penne Chicken Pasta',
    description: 'Al dente penne pasta tossed in rich garlic parmesan cream sauce with grilled chicken breast, sun-dried tomatoes, and basil.',
    price_kes: 950,
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_fish_and_chips',
    category_slug: 'continental-mains',
    name: 'Crispy Naivasha Fish & Chips',
    description: 'Golden beer-battered fresh lake fish fillets served with homemade tartar sauce, lemon wedges, and hand-cut chips.',
    price_kes: 800,
    image_url: 'https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },

  // Bites, Starters & Sides
  {
    id: 'item_samosa_platter',
    category_slug: 'sides-bites',
    name: 'Crispy Beef Samosas (3 pcs)',
    description: 'Golden pastry pockets stuffed with minced spiced beef, spring onions, and coriander. Served with sweet tamarind dip.',
    price_kes: 250,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_masala_chips',
    category_slug: 'sides-bites',
    name: 'Kenyan Masala Chips',
    description: 'Crispy potato fries tossed in a spicy, tangy tomato-garlic masala sauce with fresh chopped coriander and lemon zest.',
    price_kes: 350,
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_mukimo_portion',
    category_slug: 'sides-bites',
    name: 'Mukimo Special Side',
    description: 'Traditional mashed potatoes with soft sweet corn, green pumpkin leaves (kahurura), and yellow beans.',
    price_kes: 200,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_chapati_pair',
    category_slug: 'sides-bites',
    name: 'Flaky Layered Chapati (Pair)',
    description: 'Two soft, pan-fried Kenyan chapatis with golden flaky layers.',
    price_kes: 120,
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_kachumbari_salad',
    category_slug: 'sides-bites',
    name: 'Fresh Garden Kachumbari',
    description: 'Diced ripe tomatoes, red onions, fresh coriander, green chili, and lemon dressing.',
    price_kes: 100,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },

  // Beverages
  {
    id: 'item_chai_masala',
    category_slug: 'beverages',
    name: 'Kenyan Chai Masala (Pot)',
    description: 'Rich whole-milk tea brewed with freshly crushed ginger, cardamom, cinnamon, and cloves.',
    price_kes: 180,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_dawa_tea',
    category_slug: 'beverages',
    name: 'Special Naivasha Dawa',
    description: 'Hot revitalizing blend of fresh crushed ginger, local organic honey, freshly squeezed lemon juice, and hot water.',
    price_kes: 220,
    image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: true,
  },
  {
    id: 'item_fresh_passion_juice',
    category_slug: 'beverages',
    name: 'Fresh Naivasha Passion Juice (500ml)',
    description: 'Chilled freshly blended sweet-tangy passion fruit juice without artificial preservatives.',
    price_kes: 200,
    image_url: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
  {
    id: 'item_tropical_mango_smoothie',
    category_slug: 'beverages',
    name: 'Tropical Mango Smoothie',
    description: 'Thick mango puree blended with yogurt, crushed ice, and a dash of honey.',
    price_kes: 280,
    image_url: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    is_featured: false,
  },
];
