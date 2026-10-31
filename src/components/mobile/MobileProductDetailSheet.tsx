'use client';

import React, { useState } from 'react';
import {
  X,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileProductDetailSheetProps {
  product: any | null;
  onClose: () => void;
  onAddToCart: (options: {
    productId: string;
    quantity: number;
    selectedColour?: string;
    selectedDesign?: string;
    customNotes?: string;
  }) => void;
  onBuyNow: (options: {
    productId: string;
    quantity: number;
    selectedColour?: string;
    selectedDesign?: string;
    customNotes?: string;
  }) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const MobileProductDetailSheet: React.FC<MobileProductDetailSheetProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
}) => {
  if (!product) return null;

  let imageList: string[] = [];
  try {
    imageList = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  } catch {
    imageList = [];
  }
  if (product.featuredImage && typeof product.featuredImage === 'string' && product.featuredImage.trim()) {
    if (!imageList.includes(product.featuredImage)) {
      imageList.unshift(product.featuredImage);
    }
  }
  if (imageList.length === 0) {
    const defaultByCat: Record<string, string> = {
      'Sofas': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
      'Double Beds': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'Single Beds': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
      'Wardrobes': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
      'Center Tables': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80',
      'Mattresses': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
      'Room Chairs': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      'Custom Furniture': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    };
    imageList = [defaultByCat[product.category] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'];
  }

  let colours: string[] = [];
  try {
    colours = Array.isArray(product.availableColours)
      ? product.availableColours
      : JSON.parse(product.availableColours || '[]');
  } catch {
    colours = ['Imperial Walnut', 'Midnight Blue', 'Champagne Gold', 'Velvet Emerald'];
  }
  if (colours.length === 0) colours = ['Imperial Walnut', 'Midnight Blue', 'Champagne Gold', 'Velvet Emerald'];

  let designs: string[] = [];
  try {
    designs = Array.isArray(product.availableDesigns)
      ? product.availableDesigns
      : JSON.parse(product.availableDesigns || '[]');
  } catch {
    designs = ['Classic Baroque', 'Contemporary Minimalist', 'Art Deco Sculpted'];
  }
  if (designs.length === 0) designs = ['Classic Baroque', 'Contemporary Minimalist', 'Art Deco Sculpted'];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColour, setSelectedColour] = useState(colours[0]);
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const effectivePrice = product.discountPrice || product.price;

  const handleAdd = () => {
    onAddToCart({
      productId: product.id,
      quantity,
      selectedColour,
      selectedDesign,
      customNotes,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuy = () => {
    onBuyNow({
      productId: product.id,
      quantity,
      selectedColour,
      selectedDesign,
      customNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F5F0] overflow-y-auto flex flex-col md:hidden">
      {/* Top Floating App Bar */}
      <div className="sticky top-0 z-30 bg-[#F7F5F0]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[#EAE2D6]">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-[#FFFFFF] border border-[#EAE2D6] text-[#262421] shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-serif text-xs font-bold text-[#262421] truncate max-w-[200px]">
          {product.title}
        </span>

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          className={`p-2 rounded-full border shadow-sm transition-colors ${
            isWishlisted
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-[#FFFFFF] border-[#EAE2D6] text-[#262421]'
          }`}
        >
          <Heart className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-28 space-y-4">
        {/* Full-bleed Swipeable Gallery */}
        <div className="relative aspect-square bg-[#FFFFFF] overflow-hidden">
          <img
            src={imageList[activeImageIdx]}
            alt={product.title}
            className="w-full h-full object-cover transition-all"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          {/* Dots Indicator */}
          {imageList.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {imageList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeImageIdx === idx ? 'w-5 bg-[#262421]' : 'w-1.5 bg-[#89847C]/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div className="px-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#89847C]">
              <span>{product.category} • SKU: {product.sku}</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                In Stock ({product.stockQuantity || 5})
              </span>
            </div>

            <h1 className="font-serif font-black text-xl text-[#262421] mt-1 leading-snug">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-2 pt-1.5">
              <span className="text-2xl font-serif font-black text-[#262421]">
                ${effectivePrice?.toLocaleString()}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-[#89847C] line-through">
                  ${product.price?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-[#292722]/80 leading-relaxed">{product.description}</p>

          {/* Specs Box */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] text-xs mobile-card-shadow">
            <div>
              <span className="text-[10px] text-[#89847C] block font-semibold">Material</span>
              <span className="font-bold text-[#262421]">{product.material || 'Solid Mahogany'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#89847C] block font-semibold">Dimensions</span>
              <span className="font-bold text-[#262421]">{product.dimensions || 'Bespoke Fit'}</span>
            </div>
          </div>

          {/* Colour Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#262421] block">
              Finish / Colour: <strong className="text-[#B99A68]">{selectedColour}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {colours.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColour(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedColour === c
                      ? 'bg-[#262421] text-[#F7F5F0] border-[#262421] shadow-sm'
                      : 'bg-[#FFFFFF] text-[#292722] border-[#EAE2D6]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Design Style Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#262421] block">
              Carving Style: <strong className="text-[#B99A68]">{selectedDesign}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {designs.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDesign(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedDesign === d
                      ? 'bg-[#262421] text-[#F7F5F0] border-[#262421] shadow-sm'
                      : 'bg-[#FFFFFF] text-[#292722] border-[#EAE2D6]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notes Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#262421] block">
              Special Artisan Notes (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Extra brass studding, velvet bolster pillows..."
              className="w-full px-3 py-2 text-xs bg-[#FFFFFF] border border-[#EAE2D6] rounded-xl text-[#262421] focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] flex items-center gap-2 text-xs">
              <Truck className="w-4 h-4 text-[#B99A68] shrink-0" />
              <span className="text-[11px] font-semibold text-[#262421]">White-Glove Delivery</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#B99A68] shrink-0" />
              <span className="text-[11px] font-semibold text-[#262421]">10-Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Purchase Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#EAE2D6] p-4 flex items-center gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.06)]">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-[#EAE2D6] rounded-2xl bg-[#F7F5F0] overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2.5 text-[#262421] hover:bg-[#EAE2D6]/40"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-bold text-[#262421]">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="p-2.5 text-[#262421] hover:bg-[#EAE2D6]/40"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 py-3 px-3 rounded-2xl border border-[#262421] text-[#262421] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          {addedNotice ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        {/* Buy Now */}
        <button
          type="button"
          onClick={handleBuy}
          className="flex-1 py-3 px-3 rounded-2xl bg-[#262421] text-[#F7F5F0] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
        >
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
};

