'use client';

import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  Check,
  ChevronDown,
  X,
  ShoppingBag,
} from 'lucide-react';

interface MobileShopScreenProps {
  products: any[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenProductDetail: (product: any) => void;
  onAddToCart: (product: any) => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (productId: string) => void;
}

export const MobileShopScreen: React.FC<MobileShopScreenProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onOpenProductDetail,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const categories = [
    'All',
    'Sofas',
    'Double Beds',
    'Single Beds',
    'Wardrobes',
    'Center Tables',
    'Mattresses',
    'Room Chairs',
    'Custom Furniture',
  ];

  const filtered = products.filter((p) => {
    const matchCat =
      selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.material?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStock = !inStockOnly || p.status === 'available';
    return matchCat && matchSearch && matchStock;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
    if (sortBy === 'price_desc') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return (b.featured || 0) - (a.featured || 0);
  });

  const getPrimaryImage = (p: any) => {
    try {
      const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
      return imgs[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
    } catch {
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Search Bar & Filter trigger */}
      <div className="px-4 pt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#89847C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search master furniture..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFFFF] border border-[#EAE2D6] rounded-2xl text-[#262421] placeholder-[#89847C] focus:outline-none focus:border-[#B99A68] shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-[#89847C] hover:text-[#262421]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilterSheet(true)}
          className="p-2 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] text-[#262421] shadow-sm flex items-center gap-1 text-xs font-bold px-3"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B99A68]" />
          <span>Filter</span>
        </button>
      </div>

      {/* Category Pills (Horizontal scrolling) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#262421] text-[#F7F5F0] shadow-sm font-bold'
                : 'bg-[#FFFFFF] text-[#89847C] border border-[#EAE2D6]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Filter Indicators */}
      <div className="px-4 flex items-center justify-between text-[11px] text-[#89847C]">
        <span>Showing {sorted.length} pieces</span>
        <button
          onClick={() => setShowFilterSheet(true)}
          className="text-[#262421] font-bold flex items-center gap-1 hover:underline capitalize"
        >
          <span>Sort: {sortBy.replace('_', ' ')}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Two-Column Product Grid */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#89847C] space-y-2">
          <ShoppingBag className="w-8 h-8 opacity-40 mx-auto text-[#B99A68]" />
          <p>No products found matching &ldquo;{search}&rdquo; in this category.</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3.5">
          {sorted.map((prod) => {
            const price = prod.discountPrice || prod.price;
            const isWish = wishlistIds.has(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onOpenProductDetail(prod)}
                className="rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] overflow-hidden mobile-card-shadow flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Image */}
                <div className="relative aspect-square bg-[#F7F5F0] overflow-hidden">
                  <img
                    src={getPrimaryImage(prod)}
                    alt={prod.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(prod.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-[#262421]"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {prod.discountPrice && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-[#B99A68] text-[#262421] text-[9px] font-black">
                      SALE
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#89847C] font-semibold block truncate">
                    {prod.category}
                  </span>
                  <h4 className="text-xs font-bold text-[#262421] line-clamp-1 leading-snug">
                    {prod.title}
                  </h4>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-xs font-serif font-black text-[#262421]">
                      ${price?.toLocaleString()}
                    </span>
                    {prod.discountPrice && (
                      <span className="text-[10px] text-[#89847C] line-through">
                        ${prod.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTER & SORT BOTTOM SHEET */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilterSheet(false)}
          />

          <div className="relative bg-[#FFFFFF] rounded-t-3xl p-5 space-y-4 bottom-sheet-shadow z-10 text-[#292722] max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#EAE2D6] rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-[#EAE2D6]">
              <h3 className="font-serif font-bold text-base text-[#262421]">Filter & Sort</h3>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="p-1 rounded-full text-[#89847C] hover:text-[#262421]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#262421] block">Sort by</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'featured', label: 'Featured Suites' },
                  { id: 'price_asc', label: 'Price: Low to High' },
                  { id: 'price_desc', label: 'Price: High to Low' },
                  { id: 'newest', label: 'Newest Arrivals' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                      sortBy === s.id
                        ? 'bg-[#262421] text-[#F7F5F0] border-[#262421]'
                        : 'bg-[#F7F5F0] text-[#89847C] border-[#EAE2D6]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle */}
            <div className="pt-2 border-t border-[#EAE2D6] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#262421] block">In Stock Only</span>
                <span className="text-[10px] text-[#89847C]">Show pieces available for immediate dispatch</span>
              </div>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-5 h-5 accent-[#B99A68] rounded cursor-pointer"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="w-full py-3 rounded-2xl bg-[#262421] text-[#F7F5F0] text-xs font-bold shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
