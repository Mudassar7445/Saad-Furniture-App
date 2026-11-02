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
      'Dining Tables': 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
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

  // Dedicated Hardware-Accelerated Touch & Gesture Swipe Engine
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwipingHorizontal = useRef<boolean | null>(null);

  // Mouse drag support for desktop/testing
  const isMouseDown = useRef(false);
  const mouseStartX = useRef(0);
  const mouseStartTime = useRef(0);

  // Reset to first image when viewing a new product
  useEffect(() => {
    setActiveImageIdx(0);
    setDragOffset(0);
    setIsDragging(false);
    isSwipingHorizontal.current = null;
  }, [product?.id]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwipingHorizontal.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging && isSwipingHorizontal.current === false) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Detect gesture direction after 6px
    if (isSwipingHorizontal.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          isSwipingHorizontal.current = true;
        } else {
          isSwipingHorizontal.current = false;
          setIsDragging(false);
          setDragOffset(0);
          return;
        }
      }
    }

    if (isSwipingHorizontal.current === true) {
      // Elastic boundaries
      const isAtStart = activeImageIdx === 0 && deltaX > 0;
      const isAtEnd = activeImageIdx === imageList.length - 1 && deltaX < 0;
      const effectiveDelta = isAtStart || isAtEnd ? deltaX * 0.25 : deltaX;
      setDragOffset(effectiveDelta);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isSwipingHorizontal.current === true) {
      const deltaX = (e.changedTouches[0]?.clientX || touchStartX.current) - touchStartX.current;
      const elapsed = Date.now() - touchStartTime.current;
      const isFastFlick = elapsed < 300 && Math.abs(deltaX) > 25;
      const isSignificantSwipe = Math.abs(deltaX) > 40;

      if ((isFastFlick || isSignificantSwipe) && deltaX < 0 && activeImageIdx < imageList.length - 1) {
        setActiveImageIdx((prev) => prev + 1);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(8); } catch {}
        }
      } else if ((isFastFlick || isSignificantSwipe) && deltaX > 0 && activeImageIdx > 0) {
        setActiveImageIdx((prev) => prev - 1);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(8); } catch {}
        }
      }
    }

    isSwipingHorizontal.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
    mouseStartTime.current = Date.now();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current) return;
    const deltaX = e.clientX - mouseStartX.current;
    const isAtStart = activeImageIdx === 0 && deltaX > 0;
    const isAtEnd = activeImageIdx === imageList.length - 1 && deltaX < 0;
    const effectiveDelta = isAtStart || isAtEnd ? deltaX * 0.25 : deltaX;
    setDragOffset(effectiveDelta);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    const deltaX = e.clientX - mouseStartX.current;
    const elapsed = Date.now() - mouseStartTime.current;
    const isFastFlick = elapsed < 300 && Math.abs(deltaX) > 25;
    const isSignificant = Math.abs(deltaX) > 40;

    if ((isFastFlick || isSignificant) && deltaX < 0 && activeImageIdx < imageList.length - 1) {
      setActiveImageIdx((prev) => prev + 1);
    } else if ((isFastFlick || isSignificant) && deltaX > 0 && activeImageIdx > 0) {
      setActiveImageIdx((prev) => prev - 1);
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const scrollToImage = (idx: number) => {
    const targetIdx = Math.max(0, Math.min(idx, imageList.length - 1));
    setActiveImageIdx(targetIdx);
    setDragOffset(0);
    setIsDragging(false);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(5); } catch {}
    }
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
    <div className="fixed inset-0 z-50 bg-[#0B0B0D] text-white overflow-y-auto flex flex-col md:hidden">
      {/* Top Floating App Bar */}
      <div className="sticky top-0 z-30 bg-[#0B0B0D]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-[#2D2D30]">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-[#171719] border border-[#2D2D30] text-white shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-serif text-xs font-bold text-white truncate max-w-[200px]">
          {product.title}
        </span>

        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from favorites' : 'Save to favorites'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`p-2 rounded-full border shadow-sm transition-all active:scale-90 cursor-pointer ${
            isWishlisted
              ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/30'
              : 'bg-[#171719] border-[#2D2D30] text-white'
          }`}
        >
          <Heart className={`w-5 h-5 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-28 space-y-4">
        {/* Full-bleed Swipeable Gallery */}
        <div
          className="relative aspect-square bg-[#FFFFFF] overflow-hidden select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Animated 1:1 Hardware-Accelerated Sliding Track */}
          <div
            className="w-full h-full flex"
            style={{
              transform: `translateX(calc(-${activeImageIdx * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
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

          {/* Touch-Friendly Dots Indicator */}
          {imageList.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center z-20 pointer-events-auto">
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
                {imageList.map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToImage(idx);
                    }}
                    className="p-1.5 flex items-center justify-center touch-manipulation cursor-pointer"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <span
                      className={`block h-2 rounded-full transition-all duration-300 ${
                        activeImageIdx === idx
                          ? 'w-6 bg-white shadow-sm'
                          : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  </button>
                ))}
              </div>
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

            <h1 className="font-serif font-black text-xl text-white mt-1 leading-snug">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-2 pt-1.5">
              <span className="text-2xl font-serif font-black text-[#D6B36A]">
                PKR {effectivePrice?.toLocaleString()}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-[#A5A5A5] line-through">
                  PKR {product.price?.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-[#C5C5C5] leading-relaxed">{product.description}</p>

          {/* Specs Box */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-[#222222] border border-[#2D2D30] text-xs mobile-card-shadow">
            <div>
              <span className="text-[10px] text-[#A5A5A5] block font-semibold">Material</span>
              <span className="font-bold text-white">{product.material || 'Solid Hardwood'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#A5A5A5] block font-semibold">Dimensions</span>
              <span className="font-bold text-white">{product.dimensions || 'Bespoke Fit'}</span>
            </div>
          </div>

          {/* Colour Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white block">
              Finish / Colour: <strong className="text-[#D6B36A]">{selectedColour}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {colours.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColour(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedColour === c
                      ? 'bg-[#D6B36A] text-[#0B0B0D] border-[#D6B36A] shadow-md'
                      : 'bg-[#171719] text-[#C5C5C5] border-[#2D2D30] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Design Style Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white block">
              Carving Style: <strong className="text-[#D6B36A]">{selectedDesign}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {designs.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDesign(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedDesign === d
                      ? 'bg-[#D6B36A] text-[#0B0B0D] border-[#D6B36A] shadow-md'
                      : 'bg-[#171719] text-[#C5C5C5] border-[#2D2D30] hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notes Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-white block">
              Special Artisan Notes (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Extra brass studding, velvet bolster pillows..."
              className="w-full px-3 py-2 text-xs bg-[#171719] border border-[#2D2D30] rounded-xl text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
            />
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 rounded-2xl bg-[#222222] border border-[#2D2D30] flex items-center gap-2 text-xs">
              <Truck className="w-4 h-4 text-[#D6B36A] shrink-0" />
              <span className="text-[11px] font-semibold text-white">White-Glove Delivery</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#222222] border border-[#2D2D30] flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#D6B36A] shrink-0" />
              <span className="text-[11px] font-semibold text-white">10-Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Purchase Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B0D] border-t border-[#2D2D30] p-4 flex items-center gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-[#2D2D30] rounded-2xl bg-[#171719] overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-2.5 text-white hover:bg-white/10 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center font-mono">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="p-2.5 text-white hover:bg-white/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 py-3 px-3 rounded-2xl border border-[#D6B36A] bg-[#171719] text-[#D6B36A] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-[#D6B36A]/10 cursor-pointer"
        >
          {addedNotice ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-[#D6B36A]" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        {/* Buy Now */}
        <button
          type="button"
          onClick={handleBuy}
          className="flex-1 py-3 px-3 rounded-2xl bg-[#D6B36A] text-[#0B0B0D] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all hover:brightness-105 cursor-pointer"
        >
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
};

