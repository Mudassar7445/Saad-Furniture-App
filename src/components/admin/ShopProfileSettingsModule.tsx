'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Phone,
  MapPin,
  Share2,
  Clock,
  Sparkles,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Globe,
  Mail,
  Smartphone,
  Eye,
  RefreshCw,
  Award,
  Truck,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useShopSettings, ShopSettingsData } from '@/lib/settings/useShopSettings';

export const ShopProfileSettingsModule: React.FC = () => {
  const { settings, loading, refreshSettings } = useShopSettings();
  const [formData, setFormData] = useState<ShopSettingsData>(settings);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'info' | 'contact' | 'address' | 'social' | 'business' | 'branding'
  >('info');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof ShopSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, field: 'url' | 'enabled', val: any) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: {
          ...(prev.socialLinks?.[platform] || { url: '', enabled: true }),
          [field]: val,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update shop settings');
      }

      setSaveSuccess(true);
      await refreshSettings();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#c5a880]" />
        <p className="text-sm">Loading Shop Profile Settings from Turso Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-[#1c1a18] via-[#262421] to-[#1c1a18] p-6 rounded-3xl border border-[#B99A68]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#B99A68]/20 border border-[#B99A68]/40 flex items-center justify-center text-[#B99A68] shrink-0 shadow-inner">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-white tracking-wide">
                Showroom Profile & Global App Branding
              </h1>
              <Badge variant="gold" className="text-[10px] uppercase font-bold tracking-widest">
                Super Admin Only
              </Badge>
            </div>
            <p className="text-xs text-[#89847C] mt-1 leading-relaxed">
              Centralized identity control for Saad Furniture across mobile applications, web portals, invoices, and customer notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full md:w-auto bg-[#B99A68] hover:bg-[#d4af37] text-[#1c1a18] font-bold text-xs h-10 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Applying...' : 'Save All Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Shop Profile & App Branding updated successfully! Changes have been propagated globally to all users and devices.
          </span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Responsive Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-[#262421]">
        {[
          { id: 'info', label: 'Shop Information', icon: Store },
          { id: 'contact', label: 'Contact Details', icon: Phone },
          { id: 'address', label: 'Location & Address', icon: MapPin },
          { id: 'social', label: 'Social Channels', icon: Share2 },
          { id: 'business', label: 'Business & Warranty', icon: Clock },
          { id: 'branding', label: 'App Branding & DP', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#262421] text-[#B99A68] border border-[#B99A68]/40 shadow-sm'
                  : 'text-[#89847C] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Forms Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: SHOP INFORMATION */}
        {activeTab === 'info' && (
          <div className="bg-[#181614] p-6 rounded-3xl border border-[#2e2a26] space-y-5 shadow-sm">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-[#B99A68]" />
                Showroom Identity & Taglines
              </h3>
              <p className="text-xs text-[#89847C]">Official brand presentation on all digital platforms</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Official Brand Name</label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="SAAD FURNITURE"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Business Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="Saad Furniture & Interior Studio"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Brand Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="Handcrafted Luxury Built For Generations"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Showroom & Atelier Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="Describe your woodcraft heritage, timber seasoning, and bespoke craftsmanship..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTACT DETAILS */}
        {activeTab === 'contact' && (
          <div className="bg-[#181614] p-6 rounded-3xl border border-[#2e2a26] space-y-5 shadow-sm">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B99A68]" />
                Showroom Direct Contact Numbers & Inboxes
              </h3>
              <p className="text-xs text-[#89847C]">Patrons and clients will reach your artisans through these channels</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Primary Mobile Number</label>
                <input
                  type="text"
                  value={formData.primaryPhone}
                  onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="+92 300 0000000"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Secondary / Landline Number</label>
                <input
                  type="text"
                  value={formData.secondaryPhone}
                  onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="+92 321 0000000"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Official WhatsApp Number</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="+92 300 0000000"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Official Invoicing Email</label>
                <input
                  type="email"
                  value={formData.officialEmail}
                  onChange={(e) => handleInputChange('officialEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="info@saadfurniture.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Customer Support / Concierge Email</label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="concierge@saadfurniture.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOCATION & ADDRESS */}
        {activeTab === 'address' && (
          <div className="bg-[#181614] p-6 rounded-3xl border border-[#2e2a26] space-y-5 shadow-sm">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B99A68]" />
                Showroom Location & Workshop Address
              </h3>
              <p className="text-xs text-[#89847C]">Appears on customer orders, white-glove dispatch receipts, and maps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Complete Showroom Street Address</label>
                <input
                  type="text"
                  value={formData.completeAddress}
                  onChange={(e) => handleInputChange('completeAddress', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="Main Boulevard, Gulberg III / Defense Phase 6, Lahore, Pakistan"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="Lahore"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Currency Code</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="PKR"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOCIAL MEDIA LINKS */}
        {activeTab === 'social' && (
          <div className="bg-[#181614] p-6 rounded-3xl border border-[#2e2a26] space-y-5 shadow-sm">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#B99A68]" />
                Official Social Media Channels
              </h3>
              <p className="text-xs text-[#89847C]">Allow patrons to follow and connect with Saad Furniture</p>
            </div>

            <div className="space-y-3.5">
              {[
                { key: 'facebook', label: 'Facebook Page' },
                { key: 'instagram', label: 'Instagram Profile' },
                { key: 'tiktok', label: 'TikTok Video Channel' },
                { key: 'youtube', label: 'YouTube Workshop Tours' },
                { key: 'whatsapp', label: 'Direct WhatsApp Concierge Link' },
                { key: 'website', label: 'Official Domain URL' },
              ].map(({ key, label }) => {
                const item = formData.socialLinks?.[key] || { url: '', enabled: true };
                return (
                  <div
                    key={key}
                    className="p-3.5 bg-[#22201d] rounded-2xl border border-[#3a3530] flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                  >
                    <div className="w-48 shrink-0">
                      <span className="text-xs font-bold text-white block">{label}</span>
                      <span className="text-[10px] text-[#89847C] uppercase">{key}</span>
                    </div>

                    <input
                      type="url"
                      value={item.url || ''}
                      onChange={(e) => handleSocialChange(key, 'url', e.target.value)}
                      placeholder={`https://${key}.com/saadfurniture`}
                      className="flex-1 px-3 py-2 bg-[#181614] rounded-xl border border-[#3a3530] text-xs text-white focus:outline-none focus:border-[#B99A68] w-full"
                    />

                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) => handleSocialChange(key, 'enabled', e.target.checked)}
                        className="w-4 h-4 accent-[#B99A68] rounded"
                      />
                      <span className="text-xs text-[#89847C]">Visible in App</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: BUSINESS HOURS & WARRANTY */}
        {activeTab === 'business' && (
          <div className="bg-[#181614] p-6 rounded-3xl border border-[#2e2a26] space-y-5 shadow-sm">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B99A68]" />
                Showroom Operating Hours & Warranty Guarantees
              </h3>
              <p className="text-xs text-[#89847C]">Artisanal guarantees and white-glove transport terms</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Opening & Closing Hours</label>
                <input
                  type="text"
                  value={formData.openingHours}
                  onChange={(e) => handleInputChange('openingHours', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="Mon - Sat: 10:00 AM - 10:00 PM | Sunday: 02:00 PM - 10:00 PM"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Artisanal Warranty Pledge</label>
                <textarea
                  rows={3}
                  value={formData.warrantyInformation}
                  onChange={(e) => handleInputChange('warrantyInformation', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="10-Year Lifetime Structural Warranty on Seasoned Teak & Sheesham Timber with 5-Year High-Density Foam Assurance."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Nationwide White-Glove Delivery Information</label>
                <textarea
                  rows={3}
                  value={formData.deliveryInformation}
                  onChange={(e) => handleInputChange('deliveryInformation', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#22201d] rounded-xl border border-[#3a3530] text-sm text-white focus:outline-none focus:border-[#B99A68]"
                  placeholder="White-Glove Nationwide Secure Transport with Protective Double-Corrugated Foam Packing and Complimentary In-Room Assembly in Lahore, Islamabad, & Karachi."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: APP BRANDING & DP PREVIEW */}
        {activeTab === 'branding' && (
          <div className="bg-[#181614] p-6 rounded-3xl border border-[#2e2a26] space-y-6 shadow-sm">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B99A68]" />
                Official Application Assets & Live Device Preview
              </h3>
              <p className="text-xs text-[#89847C]">App logo, launcher DP, and Android home-screen icon assets</p>
            </div>

            {/* Asset Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Main Brand Logo URL</label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#22201d] rounded-xl border border-[#3a3530] text-xs text-white focus:outline-none focus:border-[#B99A68]"
                />
                <div className="mt-2 h-20 bg-[#22201d] rounded-xl border border-[#3a3530] p-2 flex items-center justify-center">
                  <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Application DP & Launcher Icon</label>
                <input
                  type="text"
                  value={formData.appIconUrl}
                  onChange={(e) => handleInputChange('appIconUrl', e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#22201d] rounded-xl border border-[#3a3530] text-xs text-white focus:outline-none focus:border-[#B99A68]"
                />
                <div className="mt-2 h-20 bg-[#22201d] rounded-xl border border-[#3a3530] p-2 flex items-center justify-center">
                  <img src={formData.appIconUrl} alt="DP" className="w-16 h-16 rounded-xl object-contain shadow-md" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#89847C] block mb-1.5">Splash Screen Logo URL</label>
                <input
                  type="text"
                  value={formData.splashLogoUrl}
                  onChange={(e) => handleInputChange('splashLogoUrl', e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#22201d] rounded-xl border border-[#3a3530] text-xs text-white focus:outline-none focus:border-[#B99A68]"
                />
                <div className="mt-2 h-20 bg-[#22201d] rounded-xl border border-[#3a3530] p-2 flex items-center justify-center">
                  <img src={formData.splashLogoUrl} alt="Splash" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            </div>

            {/* Android Device Mockup Preview */}
            <div className="bg-[#22201d] p-6 rounded-2xl border border-[#3a3530] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B99A68]">
                Android & Mobile Device Home Screen Preview
              </h4>
              <div className="flex flex-wrap items-center gap-6">
                {/* Android App Icon on phone screen */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-[#B99A68]/40 ring-4 ring-black/40">
                    <img src={formData.appIconUrl} alt="Launcher" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 mt-2 truncate max-w-[80px] text-center">
                    Saad Furniture
                  </span>
                </div>

                {/* Mobile Notification Preview */}
                <div className="flex-1 min-w-[240px] bg-[#181614] p-3 rounded-2xl border border-[#3a3530] shadow-sm flex items-center gap-3">
                  <img src={formData.appIconUrl} alt="Icon" className="w-10 h-10 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#B99A68] uppercase">{formData.shopName}</span>
                      <span className="text-[9px] text-[#89847C]">Just now</span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">Artisanal Milestone Completed</p>
                    <p className="text-[10px] text-[#89847C] truncate">
                      Your master dining table has passed hand-rubbed Italian polish inspection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#B99A68] hover:bg-[#d4af37] text-[#1c1a18] font-bold text-sm h-11 px-8 rounded-xl shadow-xl flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save & Propagate Settings'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

