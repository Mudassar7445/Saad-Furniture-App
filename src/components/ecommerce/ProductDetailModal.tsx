'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Heart,
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  Ruler,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Clock,
  Layers,
} from 'lucide-react';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
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

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
}) => {
  if (!isOpen || !product) return null;

  let imageList: string[] = [];
  try {
    imageList = Array.isArray(product.images)
      ? product.images
      : JSON.parse(product.images || '[]');
  } catch {
    imageList = [];
  }
  if (imageList.length === 0) {
    imageList = [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop',
    ];
  }

  let colours: string[] = [];
  try {
    colours = Array.isArray(product.availableColours)
      ? product.availableColours
      : JSON.parse(product.availableColours || '[]');
  } catch {
    colours = ['Imperial Walnut', 'Midnight Blue', 'Champagne Gold', 'Velvet Emerald'];
  }
  if (colours.length === 0) {
    colours = ['Imperial Walnut', 'Midnight Blue', 'Champagne Gold', 'Velvet Emerald'];
  }

  let designs: string[] = [];
  try {
    designs = Array.isArray(product.availableDesigns)
      ? product.availableDesigns
      : JSON.parse(product.availableDesigns || '[]');
  } catch {
    designs = ['Classic Baroque', 'Contemporary Minimalist', 'Art Deco Sculpted'];
  }
  if (designs.length === 0) {
    designs = ['Classic Baroque', 'Contemporary Minimalist', 'Art Deco Sculpted'];
  }

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColour, setSelectedColour] = useState(colours[0]);
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Touch & Drag Gesture state for smooth sliding
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalGesture = useRef<boolean | null>(null);

  useEffect(() => {
    setActiveImageIdx(0);
    setDragOffset(0);
    setIsDragging(false);
  }, [product?.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalGesture.current = null;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - (touchStartY.current ?? currentY);

    if (isHorizontalGesture.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalGesture.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalGesture.current) {
      const isAtStart = activeImageIdx === 0 && diffX > 0;
      const isAtEnd = activeImageIdx === imageList.length - 1 && diffX < 0;
      setDragOffset(isAtStart || isAtEnd ? diffX * 0.3 : diffX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && isHorizontalGesture.current) {
      const threshold = 40;
      if (dragOffset < -threshold && activeImageIdx < imageList.length - 1) {
        setActiveImageIdx((prev) => prev + 1);
      } else if (dragOffset > threshold && activeImageIdx > 0) {
        setActiveImageIdx((prev) => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalGesture.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  const effectivePrice =
    product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      quantity,
      selectedColour,
      selectedDesign,
      customNotes,
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    onBuyNow({
      productId: product.id,
      quantity,
      selectedColour,
      selectedDesign,
      customNotes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.title}
      subtitle={`${product.category} • SKU: ${product.sku}`}
      maxWidth="4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-100">
        {/* Left: Product Images Gallery */}
        <div className="space-y-3">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-white/10 group select-none"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Animated 1:1 Hardware-Accelerated Sliding Track */}
            <div
              className="w-full h-full flex"
              style={{
                transform: `translateX(calc(-${activeImageIdx * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                willChange: 'transform',
              }}
            >
              {imageList.map((imgUrl, idx) => (
                <div key={idx} className="min-w-full w-full h-full flex-shrink-0 relative">
                  <img
                    src={imgUrl}
                    alt={`${product.title} - ${idx + 1}`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
            {product.discountPrice && (
              <span className="absolute top-3 left-3 bg-[#c5a880] text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full shadow-lg">
                Save ${(product.price - product.discountPrice).toLocaleString()}
              </span>
            )}
            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                isWishlisted
                  ? 'bg-rose-500 text-white'
                  : 'bg-black/50 text-slate-300 hover:text-white hover:bg-black/80'
              }`}
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>

            {/* Left/Right Navigation Chevrons */}
            {imageList.length > 1 && (
              <>
                {activeImageIdx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => prev - 1);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all z-10 shadow-lg active:scale-95"
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
                      setActiveImageIdx((prev) => prev + 1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all z-10 shadow-lg active:scale-95"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {/* Counter Badge */}
            {imageList.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm pointer-events-none">
                {activeImageIdx + 1} / {imageList.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {imageList.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIdx === idx
                      ? 'border-[#c5a880] scale-95'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Luxury Atelier Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2 text-xs">
              <Truck className="w-4 h-4 text-[#c5a880] shrink-0" />
              <span className="text-slate-300">White-Glove Placement</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#c5a880] shrink-0" />
              <span className="text-slate-300">10-Year Frame Warranty</span>
            </div>
          </div>
        </div>

        {/* Right: Details & Customizations */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Price section */}
            <div className="flex items-baseline gap-3 pb-3 border-b border-white/10">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#e5caa2]">
                ${effectivePrice.toLocaleString()}
              </span>
              {product.discountPrice && (
                <span className="text-base text-slate-500 line-through">
                  ${product.price.toLocaleString()}
                </span>
              )}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium ml-auto">
                In Stock ({product.stockQuantity || 5} Available)
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Material & Carving</span>
                <span className="text-white font-medium">{product.material || 'Solid Mahogany & Teak'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Dimensions</span>
                <span className="text-white font-medium">{product.dimensions || 'Custom Fit Available'}</span>
              </div>
            </div>

            {/* Available Colours Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Atelier Finish / Fabric Colour: <span className="text-[#e5caa2] font-normal">{selectedColour}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colours.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColour(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedColour === c
                        ? 'bg-[#c5a880] text-slate-950 border-[#c5a880] font-bold shadow-md'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:border-[#c5a880]/50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Designs Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Carving & Architecture Style: <span className="text-[#e5caa2] font-normal">{selectedDesign}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {designs.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDesign(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedDesign === d
                        ? 'bg-[#c5a880] text-slate-950 border-[#c5a880] font-bold shadow-md'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:border-[#c5a880]/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Special Customization Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Extra high-density foam padding, specific brass stud spacing, custom living room layout."
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <Button
                variant="secondary"
                size="md"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold"
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </Button>

              {/* Buy Now */}
              <Button
                variant="gold"
                size="md"
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-[#c5a880]/15"
              >
                <span>Buy Now</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Live Order Tracking Included</span>
              <span className="text-[#e5caa2]">Direct Artisan Atelier Support</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

