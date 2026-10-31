'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Heart,
  ChevronRight,
  ShieldCheck,
  Truck,
  Award,
  Layers,
  Clock,
  ArrowRight,
  Star,
  Check,
  Eye,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/layout/Header';
import { AuthModal } from '@/components/auth/AuthModal';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { ProductDetailModal } from '@/components/ecommerce/ProductDetailModal';
import { CheckoutModal } from '@/components/ecommerce/CheckoutModal';
import { MobileAppShell } from '@/components/mobile/MobileAppShell';
import { useShopSettings } from '@/lib/settings/useShopSettings';

export default function ShowroomHomePage() {
  const router = useRouter();
  const { settings } = useShopSettings();

  // Screen Responsive State
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State: Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State: Products & E-Commerce
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // State: Modals & Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any | null>(null);

  // State: Cart & Wishlist
  const [cart, setCart] = useState<{
    items: any[];
    subtotal: number;
    deliveryFee: number;
    grandTotal: number;
    totalCount: number;
  }>({
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    grandTotal: 0,
    totalCount: 0,
  });

  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State: Quick Tracking
  const [quickTrackNumber, setQuickTrackNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // 1. Fetch current session user
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || null);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  // 2. Fetch products (Always fresh, no browser caching)
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`/api/products?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 3. Fetch Cart
  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart({
          items: data.items || [],
          subtotal: data.subtotal || 0,
          deliveryFee: data.deliveryFee || 0,
          grandTotal: data.grandTotal || 0,
          totalCount: data.totalCount || 0,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Fetch Wishlist
  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>((data.items || []).map((i: any) => i.productId));
        setWishlistProductIds(ids);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchProducts();
    fetchCart();
    fetchWishlist();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart Operations
  const handleAddToCart = async (opts: {
    productId: string;
    quantity: number;
    selectedColour?: string;
    selectedDesign?: string;
    customNotes?: string;
  }) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (res.ok) {
        await fetchCart();
        triggerToast('Item added to your shopping cart!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyNow = async (opts: {
    productId: string;
    quantity: number;
    selectedColour?: string;
    selectedDesign?: string;
    customNotes?: string;
  }) => {
    await handleAddToCart(opts);
    setDetailProduct(null);
    setCheckoutModalOpen(true);
  };

  const handleUpdateCartQty = async (itemId: string, newQty: number) => {
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      await fetchCart();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCartItem = async (itemId: string) => {
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      await fetchCart();
      triggerToast('Item removed from cart.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyCoupon = async (code: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal: cart.subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return data.error || 'Invalid promotional code.';
      }
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
      });
      triggerToast(`Promotional code "${data.code}" applied!`);
      return null;
    } catch {
      return 'Failed to validate coupon.';
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    triggerToast('Coupon removed.');
  };

  // Wishlist Toggle
  const handleToggleWishlist = async (productId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        setWishlistProductIds((prev) => {
          const next = new Set(prev);
          if (data.wishlisted) {
            next.add(productId);
            triggerToast('Added to your wishlist!');
          } else {
            next.delete(productId);
            triggerToast('Removed from your wishlist.');
          }
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Tracking
  const handleQuickTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackNumber.trim()) return;
    setTrackingLoading(true);
    setTrackError(null);
    setTrackedOrder(null);

    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const found = data.orders?.find(
          (o: any) =>
            o.orderNumber.toLowerCase() === quickTrackNumber.trim().toLowerCase() ||
            o.customerPhone?.includes(quickTrackNumber.trim())
        );
        if (found) {
          setTrackedOrder(found);
        } else {
          setTrackError(
            `No order found matching "${quickTrackNumber}". Please verify your order number or sign in to your patron account.`
          );
        }
      } else {
        setShowAuthModal(true);
      }
    } catch {
      setTrackError('Tracking lookup temporarily unavailable. Please sign in to your patron account.');
    } finally {
      setTrackingLoading(false);
    }
  };

  // 8 Specified Furniture Categories
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

  // Filtering and Sorting
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock = !inStockOnly || p.status === 'available';

    return matchesCategory && matchesSearch && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;
      return priceA - priceB;
    }
    if (sortBy === 'price_desc') {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;
      return priceB - priceA;
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    // Default: featured
    return (b.featured || 0) - (a.featured || 0);
  });

  // Render Genuine Luxury Native Mobile App Experience on Mobile Devices
  if (mounted && isMobile) {
    return (
      <MobileAppShell
        currentUser={currentUser}
        onRefreshUser={fetchUser}
        products={products}
        loadingProducts={loadingProducts}
        cart={cart}
        wishlistProductIds={wishlistProductIds}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(p, opts) =>
          handleAddToCart({
            productId: p.id,
            quantity: opts?.quantity || 1,
            selectedColour: opts?.fabricColor,
            selectedDesign: opts?.woodType,
          })
        }
        onUpdateCartQty={handleUpdateCartQty}
        onRemoveCartItem={handleRemoveCartItem}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={async (code) => {
          const err = await handleApplyCoupon(code);
          return !err;
        }}
        onOrderSuccess={(order) => {
          fetchCart();
          fetchUser();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-[#c5a880] selection:text-slate-950">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141824] border border-[#c5a880]/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-[#c5a880]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Luxury Announcement Banner */}
      <div className="bg-gradient-to-r from-[#181c26] via-[#241f17] to-[#181c26] border-b border-[#c5a880]/20 py-2 px-4 text-center text-xs text-[#e5caa2] font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
        <span>
          Bespoke Royal Collection: Complimentary White-Glove Placement on Orders Over $3,000 | Use Code{' '}
          <strong className="text-white underline tracking-wider font-bold">SAAD10</strong> for 10% Off
        </span>
      </div>

      {/* Unified Luxury Header */}
      <Header
        cartCount={cart.totalCount}
        wishlistCount={wishlistProductIds.size}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        currentUser={currentUser}
      />

      {/* HERO & SHOWROOM HIGHLIGHT */}
      <section className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#10131a] via-[#0b0d11] to-[#0b0d11]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#c5a880]/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          <Badge variant="gold" className="px-4 py-1.5 text-xs uppercase tracking-widest font-semibold">
            Bespoke Furniture Atelier & Direct Online Orders
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-none max-w-4xl mx-auto">
            Handcrafted Luxury Built For <span className="text-[#e5caa2] italic">Generations</span>.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Acquire master woodcraft suites directly online or track your custom showroom order with live
            photographic inspection, white-glove logistics, and artisan provenance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="gold"
              size="lg"
              onClick={() => {
                const el = document.getElementById('shop-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-bold shadow-xl shadow-[#c5a880]/20 flex items-center gap-2"
            >
              <span>Explore Master Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById('tracking-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm"
            >
              <Clock className="w-4 h-4 mr-2 text-[#c5a880]" />
              Track Existing Order
            </Button>
          </div>

          {/* Guarantees Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#c5a880] shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">10-Year Guarantee</span>
                <span className="text-[10px] text-slate-400">Kiln-dried European hardwoods</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <Truck className="w-5 h-5 text-[#c5a880] shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">White-Glove Delivery</span>
                <span className="text-[10px] text-slate-400">Direct inside room installation</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#c5a880] shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">Live Milestone Tracking</span>
                <span className="text-[10px] text-slate-400">11-stage progress footage</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <Award className="w-5 h-5 text-[#c5a880] shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">Certified Provenance</span>
                <span className="text-[10px] text-slate-400">Hand-signed artisan audit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ONLINE STORE CATALOGUE SECTION */}
      <section id="shop-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <Badge variant="gold" className="mb-2">
              Online Furniture Store
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Curated Masterpieces for Discerning Interiors
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any piece to customize fabrics, dimensions, and finishes with direct doorstep delivery.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, materials, SKU..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-[#c5a880]"
            >
              <option value="featured">Featured Suites</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>

        {/* 8 Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#c5a880] text-slate-950 font-bold shadow-lg shadow-[#c5a880]/20'
                  : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading Saad Furniture master collection...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl">
            <p className="text-sm text-slate-300">No products match your search or category filter.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sortedProducts.map((prod) => {
              let imgs: string[] = [];
              try {
                imgs = Array.isArray(prod.images) ? prod.images : JSON.parse(prod.images || '[]');
              } catch {
                imgs = [];
              }
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
              const primaryImg =
                (prod.featuredImage && typeof prod.featuredImage === 'string' && prod.featuredImage.trim()) ||
                imgs[0] ||
                defaultByCat[prod.category] ||
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80';
              const effectivePrice =
                prod.discountPrice && prod.discountPrice > 0 ? prod.discountPrice : prod.price;
              const isWish = wishlistProductIds.has(prod.id);

              return (
                <div
                  key={prod.id}
                  className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-[#c5a880]/50 transition-all duration-300 group flex flex-col justify-between"
                >
                  {/* Image Card */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    <img
                      src={primaryImg}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 text-[#e5caa2] border border-white/10 backdrop-blur-md">
                        {prod.category}
                      </span>
                      {prod.discountPrice && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c5a880] text-slate-950 shadow-md">
                          SAVE ${(prod.price - prod.discountPrice).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleWishlist(prod.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                        isWish
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/50 text-slate-300 hover:text-white hover:bg-black/80'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {/* Quick View Button overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setDetailProduct(prod)}
                        className="font-bold flex items-center gap-1.5 shadow-2xl"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick View & Customize</span>
                      </Button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>SKU: {prod.sku}</span>
                        <div className="flex items-center text-amber-400 gap-0.5 font-semibold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>5.0</span>
                        </div>
                      </div>

                      <h3
                        onClick={() => setDetailProduct(prod)}
                        className="font-serif font-bold text-white text-base group-hover:text-[#c5a880] transition-colors cursor-pointer"
                      >
                        {prod.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Specs pill */}
                    <div className="text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Material:</span>
                        <span className="text-white font-medium truncate max-w-[180px]">
                          {prod.material}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dimensions:</span>
                        <span className="text-white font-medium">{prod.dimensions}</span>
                      </div>
                    </div>

                    {/* Price and Cart Buttons */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          Price
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-serif font-bold text-[#e5caa2]">
                            ${effectivePrice.toLocaleString()}
                          </span>
                          {prod.discountPrice && (
                            <span className="text-[11px] text-slate-500 line-through">
                              ${prod.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleAddToCart({
                              productId: prod.id,
                              quantity: 1,
                            })
                          }
                          className="text-xs px-2.5"
                          title="Add to Shopping Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => {
                            setDetailProduct(prod);
                          }}
                          className="text-xs font-bold"
                        >
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QUICK ORDER TRACKING SECTION */}
      <section
        id="tracking-section"
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <Badge variant="gold">Patron Order Tracking</Badge>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Track Your Furniture Order Progress
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter your unique Order Number (e.g. SF-2026-101 or SF-ONL-XXXX) or registered phone number to
            view live atelier manufacturing stages.
          </p>
        </div>

        <form onSubmit={handleQuickTrack} className="max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={quickTrackNumber}
              onChange={(e) => setQuickTrackNumber(e.target.value)}
              placeholder="Order Number (e.g. SF-2026-101) or Phone..."
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
            />
          </div>
          <Button type="submit" variant="gold" size="md" loading={trackingLoading} className="font-bold">
            Track Now
          </Button>
        </form>

        {trackError && (
          <div className="max-w-xl mx-auto p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-center">
            {trackError}
          </div>
        )}

        {/* Tracked Order Result Card */}
        {trackedOrder && (
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-[#141822] border border-[#c5a880]/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  Order #{trackedOrder.orderNumber}
                </span>
                <h3 className="text-base font-serif font-bold text-white">{trackedOrder.productName}</h3>
              </div>
              <Badge variant="gold">{trackedOrder.productionStage?.replace('_', ' ')}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Patron</span>
                <span className="text-white font-medium">{trackedOrder.customerName}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Progress</span>
                <span className="text-[#e5caa2] font-bold">{trackedOrder.productionProgress || 25}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Total Investment</span>
                <span className="text-white font-medium">${trackedOrder.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Estimated Delivery</span>
                <span className="text-slate-200">{trackedOrder.expectedCompletionDate || 'Scheduled'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link href={`/orders/${trackedOrder.id}`}>
                <Button variant="gold" size="sm" className="font-bold flex items-center gap-1.5 text-xs">
                  <span>Open Full Visual Tracking Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#0a0c10] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c5a880] to-[#9e7f53] flex items-center justify-center text-slate-950 font-serif font-bold text-sm">
              S
            </div>
            <div>
              <span className="font-serif tracking-widest text-sm font-bold text-white uppercase block">
                SAAD FURNITURE
              </span>
              <span className="text-[10px]">Private Client Showroom & Online Atelier Store</span>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-slate-300 font-medium">
              {settings.completeAddress || 'Sheikh-U-Pura Road Near Imtiaz Mega Mall, Faisalabad'}
            </p>
            <p>
              Direct Showroom: {settings.primaryPhone || '+92 300 7207445'} | WhatsApp: {settings.whatsappNumber || '+92 313-0207445'} | Email: {settings.officialEmail || 'saadfurniture360@gmail.com'}
            </p>
            <p className="text-[10px] text-slate-500">
              © {new Date().getFullYear()} {settings.shopName || 'Saad Furniture'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onProceedToCheckout={() => setCheckoutModalOpen(true)}
        items={cart.items}
        subtotal={cart.subtotal}
        deliveryFee={cart.deliveryFee}
        grandTotal={cart.grandTotal}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />

      {/* Product Detail & Customization Modal */}
      <ProductDetailModal
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isWishlisted={detailProduct ? wishlistProductIds.has(detailProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Multi-Step Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        items={cart.items}
        subtotal={cart.subtotal}
        deliveryFee={cart.deliveryFee}
        appliedCoupon={appliedCoupon}
        currentUser={currentUser}
        onOrderSuccess={(orderData) => {
          fetchCart();
          fetchUser();
        }}
      />

      {/* Customer Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          fetchUser();
          fetchCart();
          fetchWishlist();
        }}
      />
    </div>
  );
}
