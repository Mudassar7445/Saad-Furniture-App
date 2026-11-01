'use client';

import React, { useState, useEffect } from 'react';
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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const handleOpenAuth = (destination: MobileTab = 'profile') => {
    setIntendedDestination(destination);
    setAuthModalOpen(true);
  };

  const handleOpenShop = (category: string = 'All') => {
    setSelectedCategory(category);
    setActiveTab('shop');
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

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col font-sans select-none antialiased">
      {/* 1. Mobile Luxury Sticky Header */}
      <MobileTopBar
        currentUser={currentUser}
        cartCount={cart.totalCount}
        wishlistCount={wishlistProductIds.size}
        unreadInboxCount={unreadNotificationsCount}
        onOpenCart={() => setCartSheetOpen(true)}
        onSearchClick={() => handleOpenShop('All')}
        onOpenWishlist={() => handleOpenShop('All')}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenWorkshop={() => setActiveTab('workshop')}
        onOpenInbox={() => setActiveTab('notifications')}
      />

      {/* 2. Main Screen View Area */}
      <main className="flex-1 px-4 pt-3 pb-24 max-w-md mx-auto w-full">
        {activeTab === 'home' && (
          <MobileHomeScreen
            products={products}
            currentUser={currentUser}
            onSelectCategory={(cat: string) => handleOpenShop(cat)}
            onOpenProductDetail={(p: any) => setSelectedProduct(p)}
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
                      return;
                    }
                  }
                } catch {}
              }
              setActiveTab('orders');
            }}
            onOpenShop={() => handleOpenShop('All')}
            onOpenDocuments={() => setActiveTab('documents')}
            onOpenWorkshop={() => setActiveTab('workshop')}
          />
        )}

        {activeTab === 'workshop' && (
          <MobileWorkshopScreen
            onBackToHome={() => setActiveTab('home')}
            onExploreShop={() => handleOpenShop('All')}
          />
        )}

        {activeTab === 'shop' && (
          <MobileShopScreen
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat: string) => setSelectedCategory(cat)}
            onOpenProductDetail={(p: any) => setSelectedProduct(p)}
            onAddToCart={(p: any) => onAddToCart(p)}
            wishlistIds={wishlistProductIds}
            onToggleWishlist={onToggleWishlist}
          />
        )}

        {activeTab === 'orders' && (
          <MobileOrdersScreen
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('orders')}
            onExploreShop={() => handleOpenShop('All')}
          />
        )}

        {activeTab === 'notifications' && (
          <MobileNotificationsScreen
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('notifications')}
            onNavigateToOrders={() => setActiveTab('orders')}
            onUpdateUnreadCount={(count: number) => setUnreadNotificationsCount(count)}
          />
        )}

        {activeTab === 'documents' && (
          <MobileDocumentsScreen />
        )}

        {activeTab === 'profile' && (
          <MobileProfileScreen
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('profile')}
            onLogout={handleLogout}
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToWishlist={() => handleOpenShop('All')}
            onNavigateToDocuments={() => setActiveTab('documents')}
          />
        )}
      </main>

      {/* 3. Mobile Fixed Bottom 5-Tab Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={(tab: MobileTab) => {
          if (tab === 'shop') {
            setSelectedCategory('All');
          }
          setActiveTab(tab);
        }}
        cartCount={cart.totalCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* 4. Bottom Sheets & Overlays */}
      {/* Product Detail Sheet */}
      <MobileProductDetailSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
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
          setCartSheetOpen(true);
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
          setCheckoutSheetOpen(true);
        }}
      />

      {/* Cart Sheet */}
      <MobileCartSheet
        isOpen={cartSheetOpen}
        onClose={() => setCartSheetOpen(false)}
        cart={cart}
        onUpdateQuantity={onUpdateCartQty}
        onRemoveItem={onRemoveCartItem}
        onApplyCoupon={onApplyCoupon}
        appliedCoupon={appliedCoupon}
        onProceedToCheckout={() => {
          setCartSheetOpen(false);
          setCheckoutSheetOpen(true);
        }}
      />

      {/* Checkout Sheet */}
      <MobileCheckoutSheet
        isOpen={checkoutSheetOpen}
        onClose={() => setCheckoutSheetOpen(false)}
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
          onClose={() => setQuickTrackOrder(null)}
        />
      )}

      {/* Auth Modal (Sign in / Sign up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          onRefreshUser();
          setAuthModalOpen(false);
          if (intendedDestination) {
            setActiveTab(intendedDestination);
          }
        }}
      />
      {/* Live Background Push Notification Controller */}
      <PushNotificationManager currentUser={currentUser} />
    </div>
  );
};
