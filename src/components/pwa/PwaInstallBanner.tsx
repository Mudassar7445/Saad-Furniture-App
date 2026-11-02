'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles, CheckCircle2, Smartphone } from 'lucide-react';

declare global {
  interface Window {
    deferredPwaPrompt?: any;
    triggerPwaInstall?: () => void;
  }
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already in standalone display mode (PWA installed and running)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      isIosDevice &&
      userAgent.includes('safari') &&
      !userAgent.includes('crios') &&
      !userAgent.includes('fxios');

    if (isIosDevice) {
      setIsIos(true);
    }

    // Global install trigger accessible from Profile and Settings
    window.triggerPwaInstall = () => {
      if (window.deferredPwaPrompt) {
        window.deferredPwaPrompt.prompt();
        window.deferredPwaPrompt.userChoice.then((choice: any) => {
          if (choice.outcome === 'accepted') {
            setIsInstalled(true);
            setIsDismissed(true);
          }
          window.deferredPwaPrompt = null;
          setDeferredPrompt(null);
        });
      } else if (isIosDevice) {
        setShowIosInstructions(true);
      } else {
        alert('To install, open your browser menu (⋮) and tap "Add to Home screen" or "Install App".');
      }
    };

    // 3. Check if user dismissed recently (within 48 hours)
    const dismissedTime = localStorage.getItem('saad_pwa_banner_dismissed');
    let recentlyDismissed = false;
    if (dismissedTime) {
      const hoursSince = (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSince < 48) {
        recentlyDismissed = true;
      }
    }

    if (!recentlyDismissed) {
      setIsDismissed(false);
    }

    // 4. Capture native beforeinstallprompt (Android Chrome / Edge / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPwaPrompt = e;
      setDeferredPrompt(e);
      if (!recentlyDismissed) {
        setIsDismissed(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If an existing prompt was captured before this component mounted
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
      if (!recentlyDismissed) setIsDismissed(false);
    }

    // 5. Track when installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsDismissed(true);
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    const promptObj = deferredPrompt || window.deferredPwaPrompt;
    if (!promptObj) {
      // Manual browser guide if beforeinstallprompt is not provided by browser
      alert('To install Saad Furniture, tap the menu (⋮) in your browser and select "Add to Home Screen" or "Install App".');
      return;
    }

    promptObj.prompt();
    const { outcome } = await promptObj.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsDismissed(true);
    }
    setDeferredPrompt(null);
    window.deferredPwaPrompt = null;
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('saad_pwa_banner_dismissed', Date.now().toString());
    } catch {}
  };

  return (
    <>
      {/* Floating Install App Banner */}
      {!isInstalled && !isDismissed && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 animate-slide-up">
          <div className="bg-[#171719]/95 backdrop-blur-xl border border-[#D6B36A]/40 rounded-2xl p-4 shadow-2xl text-white">
            <div className="flex items-start gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#D6B36A]/40 bg-[#0B0B0D] p-1 flex items-center justify-center shadow-md">
                <img
                  src="/assets/branding/app-dp.png"
                  alt="Saad Furniture"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Install Saad Furniture App
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#D6B36A] text-[#0B0B0D] font-black uppercase">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-[#C5C5C5] mt-0.5 leading-snug">
                  Add to home screen for real-time order tracking alerts, offline catalog & white-glove service.
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="px-3.5 py-1.5 rounded-xl bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install App</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2D2D30] text-[#C5C5C5] hover:text-white border border-[#2D2D30] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Not Now
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-[#A5A5A5] hover:text-white p-1 transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Step-by-Step Instructions Modal */}
      {showIosInstructions && (
        <div
          className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIosInstructions(false)}
        >
          <div
            className="w-full max-w-sm bg-[#1C1A18] dark:bg-[#141822] border border-[#B99A68]/50 rounded-3xl p-6 text-white space-y-4 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIosInstructions(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#B99A68]/20 border border-[#B99A68]/40 flex items-center justify-center text-[#B99A68]">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Install on iPhone Safari</h3>
                <p className="text-xs text-[#B99A68]">2-step instant home screen setup:</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-black/40 p-4 rounded-2xl border border-white/10">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#B99A68] text-[#0B0D11] font-black flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p className="text-stone-200 leading-relaxed">
                  Tap the <strong className="text-white">Share</strong> icon at the bottom of your Safari browser bar.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#B99A68] text-[#0B0D11] font-black flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p className="text-stone-200 leading-relaxed">
                  Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-[#B99A68]" />, then confirm <strong className="text-white">&quot;Add&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosInstructions(false);
                handleDismiss();
              }}
              className="w-full py-3 rounded-xl bg-[#B99A68] hover:bg-[#a68856] text-[#0B0D11] font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
}
