'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default to true until checked

  useEffect(() => {
    // 1. Check if already in standalone display mode (PWA installed and launched)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem('saad_pwa_banner_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      isIosDevice &&
      userAgent.includes('safari') &&
      !userAgent.includes('crios') &&
      !userAgent.includes('fxios');

    if (isIosDevice) {
      setIsIos(true);
      setIsDismissed(false);
    }

    // 4. Capture native beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Track if installed event fired
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsDismissed(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('saad_pwa_banner_dismissed', Date.now().toString());
    } catch {}
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Install Floating Banner */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-slide-up">
        <div className="bg-[#1C1A18]/95 backdrop-blur-xl border border-[#B99A68]/40 rounded-2xl p-4 shadow-2xl text-white">
          <div className="flex items-start gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#B99A68]/30 bg-[#262421] p-1 flex items-center justify-center">
              <img
                src="/assets/branding/app-dp.png"
                alt="Saad Furniture"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  Install Saad Furniture App
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#B99A68]/20 text-[#B99A68] font-bold">
                  Fast
                </span>
              </div>
              <p className="text-[11px] text-[#A8A29E] mt-0.5 leading-snug">
                Add to your home screen for instant offline catalog, zero-wait access, and order updates.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-xl bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Instructions Modal */}
      {showIosInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIosInstructions(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1C1A18] border border-[#B99A68]/40 rounded-3xl p-6 text-white space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIosInstructions(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B99A68]/10 flex items-center justify-center text-[#B99A68]">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-400">Follow 2 easy steps in Safari:</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#262421]/60 p-3.5 rounded-2xl border border-white/5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#B99A68] text-[#262421] font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p className="text-slate-200">
                  Tap the <strong className="text-white">Share</strong> button at the bottom of your Safari browser bar.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#B99A68] text-[#262421] font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p className="text-slate-200">
                  Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-[#B99A68]" />.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosInstructions(false);
                handleDismiss();
              }}
              className="w-full py-2.5 rounded-xl bg-[#B99A68] text-[#262421] font-bold text-xs hover:bg-[#a68856] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

