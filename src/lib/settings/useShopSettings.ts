'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ShopSettingsData {
  id: string;
  shopName: string;
  displayName: string;
  logoUrl: string;
  appIconUrl: string;
  splashLogoUrl: string;
  description: string;
  tagline: string;
  primaryPhone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  officialEmail: string;
  supportEmail: string;
  completeAddress: string;
  city: string;
  socialLinks: {
    facebook?: { url: string; enabled: boolean };
    instagram?: { url: string; enabled: boolean };
    tiktok?: { url: string; enabled: boolean };
    youtube?: { url: string; enabled: boolean };
    whatsapp?: { url: string; enabled: boolean };
    website?: { url: string; enabled: boolean };
    [key: string]: any;
  };
  openingHours: string;
  currency: string;
  warrantyInformation: string;
  deliveryInformation: string;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_SETTINGS: ShopSettingsData = {
  id: 'default',
  shopName: 'SAAD FURNITURE',
  displayName: 'Saad Furniture & Interior Studio',
  logoUrl: '/assets/branding/logo.svg',
  appIconUrl: '/assets/branding/app-dp.svg',
  splashLogoUrl: '/assets/branding/splash-logo.svg',
  description:
    'Premium handcrafted furniture atelier creating bespoke architectural woodcraft, royal bedroom suites, executive sofas, and master living room furniture built for generations.',
  tagline: 'Handcrafted Luxury Built For Generations',
  primaryPhone: '+92 300 0000000',
  secondaryPhone: '+92 321 0000000',
  whatsappNumber: '+92 300 0000000',
  officialEmail: 'info@saadfurniture.com',
  supportEmail: 'concierge@saadfurniture.com',
  completeAddress: 'Main Boulevard, Gulberg III / Defense Phase 6, Lahore, Pakistan',
  city: 'Lahore',
  socialLinks: {
    facebook: { url: 'https://facebook.com/saadfurniture', enabled: true },
    instagram: { url: 'https://instagram.com/saadfurniture', enabled: true },
    tiktok: { url: 'https://tiktok.com/@saadfurniture', enabled: true },
    youtube: { url: 'https://youtube.com/@saadfurniture', enabled: true },
    whatsapp: { url: 'https://wa.me/923000000000', enabled: true },
    website: { url: 'https://saadfurniture-iota.vercel.app', enabled: true },
  },
  openingHours: 'Mon - Sat: 10:00 AM - 10:00 PM | Sunday: 02:00 PM - 10:00 PM',
  currency: 'PKR',
  warrantyInformation:
    '10-Year Lifetime Structural Warranty on Seasoned Teak & Sheesham Timber with 5-Year High-Density Foam Assurance.',
  deliveryInformation:
    'White-Glove Nationwide Secure Transport with Protective Double-Corrugated Foam Packing and Complimentary In-Room Assembly in Lahore, Islamabad, & Karachi.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'super_admin',
};

// Global shared state for real-time reactivity without page reload
let globalShopSettings: ShopSettingsData = DEFAULT_SETTINGS;
let listeners: Array<(s: ShopSettingsData) => void> = [];

export function useShopSettings() {
  const [settings, setSettings] = useState<ShopSettingsData>(globalShopSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/shop', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const parsed: ShopSettingsData = {
            ...DEFAULT_SETTINGS,
            ...data.settings,
            socialLinks:
              typeof data.settings.socialLinks === 'string'
                ? JSON.parse(data.settings.socialLinks || '{}')
                : data.settings.socialLinks || DEFAULT_SETTINGS.socialLinks,
          };
          globalShopSettings = parsed;
          setSettings(parsed);
          listeners.forEach((fn) => fn(parsed));
        }
      }
    } catch (e) {
      console.warn('Using default shop settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const listener = (newSettings: ShopSettingsData) => setSettings(newSettings);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    refreshSettings: fetchSettings,
  };
}
