'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomNav, MobileTab } from './MobileBottomNav';
import { MobileHomeScreen } from './MobileHomeScreen';
import { MobileShopScreen } from './MobileShopScreen';
import { MobileOrdersScreen } from './MobileOrdersScreen';
import { MobileNotificationsScreen } from './MobileNotificationsScreen';
import { MobileProfileScreen } from './MobileProfileScreen';
import { MobileDocumentsScreen } from './MobileDocumentsScreen';
import { MobileWorkshopScreen } from './MobileWorkshopScreen';
import { MobileProductDetailSheet } from './MobileProductDetailSheet';
import { MobileCartSheet } from './MobileCartSheet';
import { MobileCheckoutSheet } from './MobileCheckoutSheet';
import { MobileOrderTrackingSheet } from './MobileOrderTrackingSheet';
import { AuthModal } from '@/components/auth/AuthModal';
import { PushNotificationManager } from '@/components/notifications/PushNotificationManager';
import { LogOut, Sparkles, CheckCircle2 } from 'lucide-react';

interface MobileAppShellProps {
  currentUser: any | null;
  onRefreshUser: () => void;
  products: any[];
  loadingProducts: boolean;
  cart: {
    items: any[];
    subtotal: number;
    deliveryFee: number;
    grandTotal: number;
    totalCount: number;
  };
  wishlistProductIds: Set<string>;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: any, options?: any) => void;
  onUpdateCartQty: (cartItemId: string, qty: number) => void;
  onRemoveCartItem: (cartItemId: string) => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: (code: string) => Promise<boolean>;
  onOrderSuccess: (order: any) => void;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  currentUser,
  onRefreshUser,
  products,
  loadingProducts,
  cart,
  wishlistProductIds,
  onToggleWishlist,
  onAddToCart,
  onUpdateCartQty,
  onRemoveCartItem,
  appliedCoupon,
  onApplyCoupon,
  onOrderSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<MobileTab>('home');
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quickTrackOrder, setQuickTrackOrder] = useState<any | null>(null);
  const [quickTrackTab, setQuickTrackTab] = useState<string | undefined>(undefined);
  const [quickTrackFilter, setQuickTrackFilter] = useState<string | undefined>(undefined);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Android Navigation, Back Stack, Transition & Exit State
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isAppExited, setIsAppExited] = useState<boolean>(false);
  const tabHistory = useRef<MobileTab[]>(['home']);
  const scrollPositions = useRef<Record<string, number>>({});
  const isHandlingPopState = useRef<boolean>(false);

  // Synchronized state reference for the native popstate handler
  const stateRef = useRef({
    activeTab,
    selectedCategory,
    selectedProduct,
    cartSheetOpen,
    checkoutSheetOpen,
    quickTrackOrder,
    authModalOpen,
    showExitModal,
    isAppExited,
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      selectedCategory,
      selectedProduct,
      cartSheetOpen,
      checkoutSheetOpen,
      quickTrackOrder,
      authModalOpen,
      showExitModal,
      isAppExited,
    };
  });

  // Browser History Navigation Engine & Android Hardware Back Interceptor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Establish root history anchor
    window.history.replaceState({ app: 'saad-app', level: 0, screen: 'home' }, '');

    const handlePopState = () => {
      const cur = stateRef.current;
      isHandlingPopState.current = true;

      // If already on the safe exit screen, allow native exit without trapping
      if (cur.isAppExited) {
        isHandlingPopState.current = false;
        return;
      }

      // 1. If Exit Modal is open, dismiss it
      if (cur.showExitModal) {
        setShowExitModal(false);
        isHandlingPopState.current = false;
        return;
      }

      // 2. If Product Detail Sheet is open, dismiss it
      if (cur.selectedProduct) {
        setNavDirection('backward');
        setSelectedProduct(null);
        isHandlingPopState.current = false;
        return;
      }

      // 3. If Checkout Sheet is open, dismiss it
      if (cur.checkoutSheetOpen) {
        setNavDirection('backward');
        setCheckoutSheetOpen(false);
        isHandlingPopState.current = false;
        return;
      }

      // 4. If Cart Sheet is open, dismiss it
      if (cur.cartSheetOpen) {
        setNavDirection('backward');
        setCartSheetOpen(false);
        isHandlingPopState.current = false;
        return;
      }

      // 5. If Quick Track Sheet is open, dismiss it
      if (cur.quickTrackOrder) {
        setNavDirection('backward');
        setQuickTrackOrder(null);
        isHandlingPopState.current = false;
        return;
      }

      // 6. If Auth Modal is open, dismiss it
      if (cur.authModalOpen) {
        setNavDirection('backward');
        setAuthModalOpen(false);
        isHandlingPopState.current = false;
        return;
      }

      // 7. If in Shop tab and filtered by a category, return to 'All'
      if (cur.activeTab === 'shop' && cur.selectedCategory !== 'All') {
        setNavDirection('backward');
        setSelectedCategory('All');
        isHandlingPopState.current = false;
        return;
      }

      // 8. If in any secondary tab, navigate back to previous tab
      if (cur.activeTab !== 'home') {
        setNavDirection('backward');
        if (tabHistory.current.length > 1) {
          tabHistory.current.pop();
          const prevTab = tabHistory.current[tabHistory.current.length - 1] || 'home';
          setActiveTab(prevTab);
        } else {
          setActiveTab('home');
        }
        isHandlingPopState.current = false;
        return;
      }

      // 9. If on root Home screen with no modals open:
      // Prevent immediate silent browser/app exit -> Trigger Luxury Exit Confirmation Dialog!
      window.history.pushState({ app: 'saad-app', level: 0, screen: 'home' }, '');
      setShowExitModal(true);
      isHandlingPopState.current = false;
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openOrderWithDeepLink = useCallback(async (orderId: string, tab?: string, filter?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.order) {
          setNavDirection('forward');
          setQuickTrackTab(tab);
          setQuickTrackFilter(filter);
          setQuickTrackOrder(data.order);
        }
      }
    } catch (e) {
      console.error('Failed to open deep-linked order', e);
    }
  }, []);

  // Listen to Service Worker messages and URL query parameters for targeted deep links
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Process URL search params upon initial mount
    const urlParams = new URLSearchParams(window.location.search);
    const targetOrder = urlParams.get('order') || urlParams.get('orderId');
    const targetTab = urlParams.get('tab');
    const targetFilter = urlParams.get('filter');
    const targetProduct = urlParams.get('product');

    if (targetOrder) {
      openOrderWithDeepLink(targetOrder, targetTab || undefined, targetFilter || undefined);
    } else if (targetTab) {
      const validTabs: MobileTab[] = ['home', 'shop', 'workshop', 'orders', 'notifications', 'profile', 'documents'];
      if (validTabs.includes(targetTab as MobileTab)) {
        setActiveTab(targetTab as MobileTab);
      }
    }

    if (targetProduct && products && products.length > 0) {
      const matched = products.find((p) => p.id === targetProduct);
      if (matched) {
        setSelectedProduct(matched);
      }
    }

    // 2. Process real-time Web Push click events delivered via postMessage
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'DEEP_LINK_NAVIGATE') {
          const { url, orderId, tab, filter } = event.data;
          if (orderId) {
            openOrderWithDeepLink(orderId, tab, filter);
          } else if (url) {
            try {
              const u = new URL(url, window.location.origin);
              const oId = u.searchParams.get('order') || u.searchParams.get('orderId');
              const t = u.searchParams.get('tab') || tab;
              const f = u.searchParams.get('filter') || filter;
              if (oId) {
                openOrderWithDeepLink(oId, t || undefined, f || undefined);
              } else if (u.pathname.includes('/orders/')) {
                const parts = u.pathname.split('/');
                const id = parts[parts.indexOf('orders') + 1];
                if (id) openOrderWithDeepLink(id, t || undefined, f || undefined);
              } else if (u.pathname.includes('/shop')) {
                setActiveTab('shop');
                const pId = u.searchParams.get('product');
                if (pId && products) {
                  const m = products.find((p) => p.id === pId);
                  if (m) setSelectedProduct(m);
                }
              } else if (u.pathname.includes('/workshop')) {
                setActiveTab('workshop');
              }
            } catch {}
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [openOrderWithDeepLink, products]);

  const pushNavEntry = (screenKey: string) => {
    if (!isHandlingPopState.current && typeof window !== 'undefined') {
      window.history.pushState({ app: 'saad-app', screen: screenKey, timestamp: Date.now() }, '');
    }
  };

  const handleOpenProductDetail = (p: any) => {
    setNavDirection('forward');
    setSelectedProduct(p);
    pushNavEntry(`product-${p.id}`);
  };

  const handleCloseProductDetail = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      setSelectedProduct(null);
    }
  };

  const handleOpenCart = () => {
    setNavDirection('forward');
    setCartSheetOpen(true);
    pushNavEntry('cart');
  };

  const handleCloseCart = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      setCartSheetOpen(false);
    }
  };

  const handleOpenCheckout = () => {
    setNavDirection('forward');
    setCheckoutSheetOpen(true);
    pushNavEntry('checkout');
  };

  const handleCloseCheckout = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      setCheckoutSheetOpen(false);
    }
  };

  const handleChangeTab = useCallback((nextTab: MobileTab) => {
    setActiveTab((prevTab) => {
      if (nextTab === prevTab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return prevTab;
      }

      // Save scroll position of previous tab
      if (typeof window !== 'undefined') {
        scrollPositions.current[prevTab] = window.scrollY;
      }

      setNavDirection('forward');
      tabHistory.current.push(nextTab);
      pushNavEntry(`tab-${nextTab}`);

      // Restore scroll position after view switch
      requestAnimationFrame(() => {
        const savedY = scrollPositions.current[nextTab] || 0;
        window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior });
      });

      return nextTab;
    });
  }, []);

  const handleOpenShop = (category: string = 'All') => {
    setNavDirection('forward');
    setSelectedCategory(category);
    if (activeTab !== 'shop') {
      handleChangeTab('shop');
    } else {
      pushNavEntry(`shop-${category}`);
    }
  };

  const handleOpenAuth = (destination: MobileTab = 'profile') => {
    setIntendedDestination(destination);
    setAuthModalOpen(true);
    pushNavEntry('auth');
  };

  const handleCloseAuth = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      setAuthModalOpen(false);
    }
  };

  // Real Android Exit Handler
  const handleConfirmExit = () => {
    setShowExitModal(false);

    if (typeof window !== 'undefined') {
      // 1. Android Webview / Cordova / Capacitor wrapper check
      const nav = window.navigator as any;
      if (nav?.app?.exitApp) {
        nav.app.exitApp();
        return;
      }

      // 2. Attempt standard window.close()
      try {
        window.close();
      } catch {}

      // 3. Due to browser security policies on standalone web tabs, show honest and secure exit screen
      setIsAppExited(true);
    }
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (currentUser) {
      fetch('/api/notifications')
        .then((res) => (res.ok ? res.json() : { notifications: [] }))
        .then((data) => {
          const unread = (data.notifications || []).filter((n: any) => !n.isRead).length;
          setUnreadNotificationsCount(unread);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      try {
        localStorage.removeItem('saad_patron_profile');
      } catch {}
      await fetch('/api/auth/logout', { method: 'POST' });
      onRefreshUser();
      setActiveTab('home');
    } catch (e) {
      console.error(e);
    }
  };

  // Dedicated App Exited Screen (Safe, Honest & Secure)
  if (isAppExited) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#0B0D11] text-white flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
        <div className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_8px_24px_rgba(212,175,55,0.35)]">
          <img
            src="/assets/branding/app-dp.svg?v=3"
            alt="Saad Furniture"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-2xl font-serif font-black text-white tracking-tight">
          Session Safely Closed
        </h1>

        <p className="text-xs text-[#B99A68] tracking-widest uppercase font-semibold mt-1 mb-5">
          Saad Furniture Private Atelier
        </p>

        <div className="max-w-xs bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-stone-300 leading-relaxed mb-6 space-y-2">
          <p className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Cart & Wishlist Preserved
          </p>
          <p className="text-[11px] text-stone-400">
            You can safely close this browser window or swipe up to return to your device home screen.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAppExited(false)}
          className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#B99A68] to-[#D4AF37] text-[#0B0D11] font-bold text-sm shadow-xl active:scale-95 transition-transform"
        >
          Re-enter Showroom
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#0b0d11] flex flex-col font-sans select-none antialiased transition-colors duration-200">
      {/* 1. Mobile Luxury Sticky Header */}
      <MobileTopBar
        currentUser={currentUser}
        cartCount={cart.totalCount}
        wishlistCount={wishlistProductIds.size}
        unreadInboxCount={unreadNotificationsCount}
        onOpenCart={handleOpenCart}
        onSearchClick={() => handleOpenShop('All')}
        onOpenWishlist={() => handleOpenShop('Saved (💖)')}
        onOpenProfile={() => handleChangeTab('profile')}
        onOpenWorkshop={() => handleChangeTab('workshop')}
        onOpenInbox={() => handleChangeTab('notifications')}
      />

      {/* 2. Main Screen View Area with Persistent Offstage Stack (Zero Redrawing / Reloading) */}
      <main className="flex-1 px-4 pt-3 pb-28 max-w-md mx-auto w-full">
        {/* Tab 1: Home Screen */}
        <div className={activeTab === 'home' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'home'}>
          <div className={activeTab === 'home' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileHomeScreen
              products={products}
              currentUser={currentUser}
              onSelectCategory={(cat: string) => handleOpenShop(cat)}
              onOpenProductDetail={handleOpenProductDetail}
              onAddToCart={(p: any) => onAddToCart(p)}
              wishlistIds={wishlistProductIds}
              onToggleWishlist={onToggleWishlist}
              onOpenTracking={async (orderNum?: string) => {
                if (orderNum) {
                  try {
                    const res = await fetch('/api/orders');
                    if (res.ok) {
                      const data = await res.json();
                      const allOrders: any[] = data.orders || [];
                      const found = allOrders.find(
                        (o: any) =>
                          o.orderNumber?.toLowerCase() === orderNum.toLowerCase() ||
                          o.id?.toLowerCase() === orderNum.toLowerCase()
                      );
                      if (found) {
                        setQuickTrackOrder(found);
                        pushNavEntry(`track-${found.id}`);
                        return;
                      }
                    }
                  } catch {}
                }
                handleChangeTab('orders');
              }}
              onOpenShop={() => handleOpenShop('All')}
              onOpenDocuments={() => handleChangeTab('documents')}
              onOpenWorkshop={() => handleChangeTab('workshop')}
            />
          </div>
        </div>

        {/* Tab 2: Workshop Screen */}
        <div className={activeTab === 'workshop' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'workshop'}>
          <div className={activeTab === 'workshop' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileWorkshopScreen
              onBackToHome={() => handleChangeTab('home')}
              onExploreShop={() => handleOpenShop('All')}
            />
          </div>
        </div>

        {/* Tab 3: Shop Screen */}
        <div className={activeTab === 'shop' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'shop'}>
          <div className={activeTab === 'shop' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileShopScreen
              products={products}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat: string) => {
                setSelectedCategory(cat);
                pushNavEntry(`category-${cat}`);
              }}
              onOpenProductDetail={handleOpenProductDetail}
              onAddToCart={(p: any) => onAddToCart(p)}
              wishlistIds={wishlistProductIds}
              onToggleWishlist={onToggleWishlist}
            />
          </div>
        </div>

        {/* Tab 4: Orders Screen */}
        <div className={activeTab === 'orders' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'orders'}>
          <div className={activeTab === 'orders' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileOrdersScreen
              currentUser={currentUser}
              onOpenAuth={() => handleOpenAuth('orders')}
              onExploreShop={() => handleOpenShop('All')}
            />
          </div>
        </div>

        {/* Tab 5: Notifications Screen */}
        <div className={activeTab === 'notifications' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'notifications'}>
          <div className={activeTab === 'notifications' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileNotificationsScreen
              currentUser={currentUser}
              onOpenAuth={() => handleOpenAuth('notifications')}
              onNavigateToOrders={() => handleChangeTab('orders')}
              onUpdateUnreadCount={(count: number) => setUnreadNotificationsCount(count)}
            />
          </div>
        </div>

        {/* Tab 6: Documents Screen */}
        <div className={activeTab === 'documents' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'documents'}>
          <div className={activeTab === 'documents' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileDocumentsScreen />
          </div>
        </div>

        {/* Tab 7: Profile Screen */}
        <div className={activeTab === 'profile' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'profile'}>
          <div className={activeTab === 'profile' ? (navDirection === 'forward' ? 'page-transition-forward' : 'page-transition-backward') : ''}>
            <MobileProfileScreen
              currentUser={currentUser}
              onOpenAuth={() => handleOpenAuth('profile')}
              onLogout={handleLogout}
              onNavigateToOrders={() => handleChangeTab('orders')}
              onNavigateToWishlist={() => handleOpenShop('Saved (💖)')}
              onNavigateToDocuments={() => handleChangeTab('documents')}
            />
          </div>
        </div>
      </main>

      {/* 3. Persistent Mobile Fixed Bottom 5-Tab Bar (Completely Stable Across Navigation) */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={handleChangeTab}
        cartCount={cart.totalCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* 4. Bottom Sheets & Overlays */}
      {/* Product Detail Sheet */}
      <MobileProductDetailSheet
        product={selectedProduct}
        onClose={handleCloseProductDetail}
        isWishlisted={selectedProduct ? wishlistProductIds.has(selectedProduct.id) : false}
        onToggleWishlist={(id: string) => onToggleWishlist(id)}
        onAddToCart={(options: {
          productId: string;
          quantity: number;
          selectedColour?: string;
          selectedDesign?: string;
          customNotes?: string;
        }) => {
          onAddToCart(selectedProduct, options);
          setSelectedProduct(null);
          handleOpenCart();
        }}
        onBuyNow={(options: {
          productId: string;
          quantity: number;
          selectedColour?: string;
          selectedDesign?: string;
          customNotes?: string;
        }) => {
          onAddToCart(selectedProduct, options);
          setSelectedProduct(null);
          handleOpenCheckout();
        }}
      />

      {/* Cart Sheet */}
      <MobileCartSheet
        isOpen={cartSheetOpen}
        onClose={handleCloseCart}
        cart={cart}
        onUpdateQuantity={onUpdateCartQty}
        onRemoveItem={onRemoveCartItem}
        onApplyCoupon={onApplyCoupon}
        appliedCoupon={appliedCoupon}
        onProceedToCheckout={() => {
          setCartSheetOpen(false);
          handleOpenCheckout();
        }}
      />

      {/* Checkout Sheet */}
      <MobileCheckoutSheet
        isOpen={checkoutSheetOpen}
        onClose={handleCloseCheckout}
        cart={cart}
        appliedCoupon={appliedCoupon}
        currentUser={currentUser}
        onOrderSuccess={(order: any) => {
          onOrderSuccess(order);
          setQuickTrackOrder(order);
        }}
      />

      {/* Quick Tracking Sheet */}
      {quickTrackOrder && (
        <MobileOrderTrackingSheet
          order={quickTrackOrder}
          isOpen={!!quickTrackOrder}
          initialTab={quickTrackTab}
          initialFilter={quickTrackFilter}
          onClose={() => {
            setQuickTrackTab(undefined);
            setQuickTrackFilter(undefined);
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              setQuickTrackOrder(null);
            }
          }}
        />
      )}

      {/* Auth Modal (Sign in / Sign up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        onSuccess={(user) => {
          onRefreshUser();
          handleCloseAuth();
          if (intendedDestination) {
            handleChangeTab(intendedDestination);
          }
        }}
      />

      {/* 5. Luxury Exit Confirmation Dialog (Android Back Prevention on Home) */}
      {showExitModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowExitModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#131722] rounded-3xl p-6 text-center shadow-2xl border border-[#EAE2D6] dark:border-white/10 relative transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Saad Crest / Exit Icon */}
            <div className="w-16 h-16 mx-auto rounded-full bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center mb-4 ring-8 ring-[#B99A68]/5">
              <Sparkles className="w-8 h-8 stroke-[1.8]" />
            </div>

            <h2 className="font-serif text-xl font-black text-[#262421] dark:text-[#F1F5F9] tracking-tight">
              Exit Saad Furniture?
            </h2>

            <p className="text-xs text-[#89847C] dark:text-[#94A3B8] mt-2 mb-6 leading-relaxed">
              Are you sure you want to leave? Your luxury cart, custom selections and wishlist will be securely preserved.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#262421] dark:bg-[#B99A68] text-[#F7F5F0] dark:text-[#131722] font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Stay in App
              </button>

              <button
                type="button"
                onClick={handleConfirmExit}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-[#89847C] dark:text-[#94A3B8] hover:text-rose-500 dark:hover:text-rose-400 active:scale-95 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Background Push Notification Controller */}
      <PushNotificationManager currentUser={currentUser} />
    </div>
  );
};
