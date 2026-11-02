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
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const categories = [
    'All',
    'Saved (💖)',
    'Sofas',
    'Double Beds',
    'Single Beds',
    'Dining Tables',
    'Wardrobes',
    'Center Tables',
    'Mattresses',
    'Room Chairs',
    'Custom Furniture',
  ];

  const filtered = products.filter((p) => {
    let matchCat = true;
    if (selectedCategory === 'Saved (💖)' || selectedCategory === 'Saved') {
      matchCat = wishlistIds.has(p.id);
    } else if (selectedCategory !== 'All') {
      matchCat = p.category?.toLowerCase() === selectedCategory.toLowerCase();
    }
    const matchSearch =
      !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.material?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStock = !inStockOnly || p.status === 'available';
    const matchPrice = ((p.discountPrice || p.price || 0) <= maxPrice);
    return matchCat && matchSearch && matchStock && matchPrice;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
    if (sortBy === 'price_desc') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return (b.featured || 0) - (a.featured || 0);
  });

  const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
    'Sofas': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=70',
    'Double Beds': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=70',
    'Single Beds': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=70',
    'Dining Tables': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=70',
    'Wardrobes': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=70',
    'Center Tables': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=70',
    'Mattresses': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=70',
    'Room Chairs': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=70',
    'Custom Furniture': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=70',
  };

  const getPrimaryImage = (p: any) => {
    if (p.featuredImage && typeof p.featuredImage === 'string' && p.featuredImage.trim()) {
      return p.featuredImage;
    }
    try {
      const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
      if (imgs && imgs.length > 0 && imgs[0]) {
        return imgs[0];
      }
    } catch { }
    return (
      CATEGORY_DEFAULT_IMAGES[p.category] ||
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
    );
  };

  return (
    <div className="space-y-4 pb-8 bg-[#0B0B0D] text-white">
      {/* Search Bar & Filter trigger */}
      <div className="px-4 pt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A5A5A5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search master furniture..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#171719] border border-[#2D2D30] rounded-2xl text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A] shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-[#A5A5A5] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilterSheet(true)}
          className="p-2 rounded-2xl bg-[#171719] border border-[#2D2D30] text-white hover:border-[#D6B36A] shadow-sm flex items-center gap-1.5 text-xs font-bold px-3 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#D6B36A]" />
          <span>Filter</span>
        </button>
      </div>

      {/* Category Pills (Horizontal scrolling) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#D6B36A] text-[#0B0B0D] shadow-md font-bold'
                : 'bg-[#171719] text-[#C5C5C5] border border-[#2D2D30] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Filter Indicators */}
      <div className="px-4 flex items-center justify-between text-[11px] text-[#A5A5A5]">
        <span>Showing {sorted.length} pieces</span>
        <button
          onClick={() => setShowFilterSheet(true)}
          className="text-white font-bold flex items-center gap-1 hover:underline capitalize cursor-pointer"
        >
          <span>Sort: {sortBy.replace('_', ' ')}</span>
          <ChevronDown className="w-3 h-3 text-[#D6B36A]" />
        </button>
      </div>

      {/* Two-Column Product Grid */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#A5A5A5] space-y-3 px-6">
          <ShoppingBag className="w-10 h-10 opacity-40 mx-auto text-[#D6B36A]" />
          <p className="font-medium text-white">No furniture suites found {selectedCategory !== 'All' ? `in "${selectedCategory}"` : ''} {search ? `matching "${search}"` : ''}.</p>
          {(selectedCategory !== 'All' || search) && (
            <button
              type="button"
              onClick={() => {
                onSelectCategory('All');
                setSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-[#D6B36A] text-[#0B0B0D] text-xs font-bold inline-block shadow-md hover:brightness-105 cursor-pointer"
            >
              View All Catalogue Pieces
            </button>
          )}
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
                className="rounded-2xl bg-[#222222] border border-[#2D2D30] hover:border-[#D6B36A]/40 overflow-hidden mobile-card-shadow flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Image with high performance lazy loading */}
                <div className="relative aspect-square bg-[#171719] overflow-hidden">
                  <img
                    src={getPrimaryImage(prod)}
                    alt={prod.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES[prod.category] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <button
                    type="button"
                    aria-label={isWish ? 'Remove from favorites' : 'Save to favorites'}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleWishlist(prod.id);
                    }}
                    className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
                      isWish
                        ? 'bg-rose-500 text-white shadow-rose-500/30'
                        : 'bg-[#171719]/90 text-white border border-[#2D2D30] hover:border-[#D6B36A]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 transition-transform ${isWish ? 'fill-current scale-110' : ''}`} />
                  </button>

                  {prod.discountPrice && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-[#D6B36A] text-[#0B0B0D] text-[9px] font-black">
                      SALE
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#A5A5A5] font-semibold block truncate">
                    {prod.category}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                    {prod.title}
                  </h4>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-xs font-serif font-black text-[#D6B36A]">
                      ₨ {price?.toLocaleString()}
                    </span>
                    {prod.discountPrice && (
                      <span className="text-[10px] text-[#A5A5A5] line-through">
                        ₨ {prod.price?.toLocaleString()}
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
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setShowFilterSheet(false)}
        >
          <div
            className="w-full bg-[#171719] rounded-t-3xl p-5 space-y-4 border-t border-[#2D2D30] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#2D2D30]">
              <h3 className="font-serif font-bold text-base text-white">Filter & Sort</h3>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="p-1 rounded-full text-[#A5A5A5] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5A5] block">
                Sort By
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'featured', label: 'Featured Atelier' },
                  { id: 'price_asc', label: 'Price: Low to High' },
                  { id: 'price_desc', label: 'Price: High to Low' },
                  { id: 'newest', label: 'Newest Arrivals' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      sortBy === s.id
                        ? 'bg-[#D6B36A] text-[#0B0B0D] border-[#D6B36A] font-bold shadow-sm'
                        : 'bg-[#222222] text-[#C5C5C5] border-[#2D2D30] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Price Filter */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A5A5] block">
                Price Range (Max: ₨ {maxPrice.toLocaleString()})
              </span>
              <input
                type="range"
                min={20000}
                max={500000}
                step={10000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#D6B36A]"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="w-full py-3 rounded-2xl bg-[#D6B36A] text-[#0B0B0D] text-xs font-bold shadow-md hover:brightness-105 cursor-pointer"
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

