'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight,
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

  // Dedicated Hardware-Accelerated Pointer & Touch Swipe Engine
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const capturedPointerId = useRef<number | null>(null);

  // Reset to first image when viewing a new product
  useEffect(() => {
    setActiveImageIdx(0);
    setDragOffset(0);
    setIsDragging(false);
  }, [product?.id]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    isHorizontalSwipe.current = null;
    capturedPointerId.current = e.pointerId;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const deltaX = e.clientX - pointerStartX.current;
    const deltaY = e.clientY - (pointerStartY.current ?? e.clientY);

    // Lock onto horizontal gesture once 6px motion occurs
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          isHorizontalSwipe.current = true;
          setIsDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch (_) {}
        } else {
          // Vertical movement takes over page scroll
          isHorizontalSwipe.current = false;
          pointerStartX.current = null;
          return;
        }
      }
    }

    if (isHorizontalSwipe.current) {
      // Elastic boundaries
      const isAtStart = activeImageIdx === 0 && deltaX > 0;
      const isAtEnd = activeImageIdx === imageList.length - 1 && deltaX < 0;
      const effectiveDelta = isAtStart || isAtEnd ? deltaX * 0.35 : deltaX;
      setDragOffset(effectiveDelta);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current !== null && isHorizontalSwipe.current) {
      const threshold = 35; // 35px threshold for intuitive snap
      if (dragOffset < -threshold && activeImageIdx < imageList.length - 1) {
        setActiveImageIdx((prev) => prev + 1);
      } else if (dragOffset > threshold && activeImageIdx > 0) {
        setActiveImageIdx((prev) => prev - 1);
      }
    }

    if (capturedPointerId.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(capturedPointerId.current)) {
          e.currentTarget.releasePointerCapture(capturedPointerId.current);
        }
      } catch (_) {}
    }

    pointerStartX.current = null;
    pointerStartY.current = null;
    isHorizontalSwipe.current = null;
    capturedPointerId.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const scrollToImage = (idx: number) => {
    const targetIdx = Math.max(0, Math.min(idx, imageList.length - 1));
    setActiveImageIdx(targetIdx);
    setDragOffset(0);
    setIsDragging(false);
  };

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
        <div
          className="relative aspect-square bg-[#FFFFFF] overflow-hidden select-none"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {/* Animated 1:1 Hardware-Accelerated Sliding Track */}
          <div
            className="w-full h-full flex"
            style={{
              transform: `translateX(calc(-${activeImageIdx * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.2, 0.9, 0.3, 1)',
              willChange: 'transform',
            }}
          >
            {imageList.map((imgUrl, idx) => (
              <div
                key={idx}
                className="min-w-full w-full h-full flex-shrink-0 relative bg-[#F7F5F0]"
              >
                <img
                  src={imgUrl}
                  alt={`${product.title} - ${idx + 1}`}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
              </div>
            ))}
          </div>

          {/* Floating Left/Right Navigation Chevrons */}
          {imageList.length > 1 && (
            <>
              {activeImageIdx > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToImage(activeImageIdx - 1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center transition-all z-20 shadow-xl active:scale-90"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {activeImageIdx < imageList.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToImage(activeImageIdx + 1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center transition-all z-20 shadow-xl active:scale-90"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          {/* Counter Badge */}
          {imageList.length > 1 && (
            <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-20 shadow-md pointer-events-none tracking-wider">
              {activeImageIdx + 1} / {imageList.length}
            </div>
          )}

          {/* Dots Indicator */}
          {imageList.length > 1 && (
            <div className="absolute bottom-3.5 left-0 right-0 flex justify-center items-center gap-1.5 z-20 pointer-events-auto">
              {imageList.map((_, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToImage(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeImageIdx === idx
                      ? 'w-6 bg-[#262421] shadow-sm'
                      : 'w-2 bg-stone-400/60 hover:bg-stone-600'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
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

