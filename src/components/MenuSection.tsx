import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Check, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { MenuCategory, MenuItem, CartItem } from '../types';

interface MenuSectionProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateCartQuantity: (itemId: string, delta: number) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  menuItems,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);

  // Filter items based on active category, search query, and featured toggle
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      // Featured filter
      if (onlyFeatured && !item.is_featured) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category_name?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, onlyFeatured]);

  // Helper to get cart quantity for an item
  const getCartQuantity = (itemId: string): number => {
    const item = cart.find((c) => c.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <section id="menu" className="py-16 bg-[#F3F2EE] text-[#1A1A1A] border-b-2 border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider mb-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Farm-Fresh & Authentic Kitchen</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Our Delicious Culinary Menu
          </h2>
          <p className="mt-3 text-stone-700 text-sm sm:text-base">
            Prepared to perfection by our Naivasha culinary chefs. Choose your favorites for instant pickup, dine-in or doorstep delivery.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="menu-search-input"
              type="text"
              placeholder="Search nyama choma, tilapia, burger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none transition shadow-[2px_2px_0px_0px_#1A1A1A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 hover:text-[#1A1A1A]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Featured Toggle */}
          <button
            id="menu-filter-featured-btn"
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-[#1A1A1A] transition shadow-[2px_2px_0px_0px_#1A1A1A] cursor-pointer ${
              onlyFeatured
                ? 'bg-amber-400 text-[#1A1A1A]'
                : 'bg-white text-[#1A1A1A] hover:bg-stone-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>Chef's Featured Only</span>
          </button>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            id="category-tab-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-2 border-[#1A1A1A] ${
              selectedCategory === 'all'
                ? 'bg-[#1A1A1A] text-[#F3F2EE] shadow-[3px_3px_0px_0px_#D97706]'
                : 'bg-white text-[#1A1A1A] hover:bg-[#F3F2EE] shadow-[2px_2px_0px_0px_#1A1A1A]'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>

          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                id={`category-tab-${cat.slug}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-2 border-[#1A1A1A] ${
                  selectedCategory === cat.id
                    ? 'bg-[#1A1A1A] text-[#F3F2EE] shadow-[3px_3px_0px_0px_#D97706]'
                    : 'bg-white text-[#1A1A1A] hover:bg-[#F3F2EE] shadow-[2px_2px_0px_0px_#1A1A1A]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-12 text-center max-w-md mx-auto shadow-[4px_4px_0px_0px_#1A1A1A]">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#1A1A1A]">No dishes match your search</h3>
            <p className="text-xs text-stone-600 mt-1">Try resetting the search or selecting another category.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyFeatured(false);
              }}
              className="mt-4 text-xs font-bold text-amber-700 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const qty = getCartQuantity(item.id);

              return (
                <div
                  key={item.id}
                  id={`menu-card-${item.id}`}
                  className="bg-white rounded-2xl border-2 border-[#1A1A1A] overflow-hidden hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col group shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
                >
                  {/* Image Container */}
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-stone-100 border-b-2 border-[#1A1A1A]">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Featured Star Badge */}
                    {item.is_featured && (
                      <span className="absolute top-3 left-3 bg-amber-400 text-[#1A1A1A] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded border border-[#1A1A1A] shadow-[1px_1px_0px_0px_#1A1A1A]">
                        Popular
                      </span>
                    )}

                    {/* Availability Tag */}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full border border-white">
                          Sold Out Today
                        </span>
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-lg border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold font-mono text-sm shadow-[2px_2px_0px_0px_#1A1A1A]">
                      KES {item.price_kes.toLocaleString()}
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] text-amber-800 uppercase font-bold tracking-wide">
                          {item.category_name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1A1A1A] group-hover:text-amber-800 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Row */}
                    <div className="pt-3 border-t-2 border-[#1A1A1A]/10 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                        KES {item.price_kes.toLocaleString()}
                      </span>

                      {item.is_available ? (
                        qty > 0 ? (
                          <div className="flex items-center gap-2 bg-[#F3F2EE] border-2 border-[#1A1A1A] rounded-xl p-1 shadow-[2px_2px_0px_0px_#1A1A1A]">
                            <button
                              id={`cart-decrease-${item.id}`}
                              onClick={() => onUpdateCartQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 text-[#1A1A1A] border border-[#1A1A1A] flex items-center justify-center transition font-bold cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-mono font-bold text-[#1A1A1A] px-1">
                              {qty}
                            </span>
                            <button
                              id={`cart-increase-${item.id}`}
                              onClick={() => onUpdateCartQuantity(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] flex items-center justify-center transition font-bold cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`add-to-cart-${item.id}`}
                            onClick={() => onAddToCart(item)}
                            className="flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#D97706] hover:shadow-[1px_1px_0px_0px_#D97706] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            <span>Add to Cart</span>
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-stone-500 italic font-semibold">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
