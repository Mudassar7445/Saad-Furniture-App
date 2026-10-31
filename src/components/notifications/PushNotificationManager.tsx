'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check, X, Shield } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushNotificationManager: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    setPermission(Notification.permission);

    // If permission is already granted, verify or refresh subscription
    if (Notification.permission === 'granted') {
      setSubscribed(true);
      registerPushSubscription(false);
    } else if (Notification.permission === 'default') {
      // Check if user dismissed earlier today
      const dismissed = localStorage.getItem('saad_push_prompt_dismissed');
      if (!dismissed) {
        // Show friendly prompt after 2 seconds on app
        const timer = setTimeout(() => {
          setPromptVisible(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const registerPushSubscription = async (sendTest = true) => {
    try {
      setLoading(true);
      const reg = await navigator.serviceWorker.ready;

      // 1. Fetch public VAPID key
      const keyRes = await fetch('/api/notifications/subscribe');
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error('VAPID public key not found');

      // 2. Subscribe to PushManager
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // 3. Post subscription to backend
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId: currentUser?.id || 'patron_guest',
          deviceType: /Android/i.test(navigator.userAgent) ? 'android' : 'mobile_web',
          test: sendTest,
        }),
      });

      if (res.ok) {
        setSubscribed(true);
        setPromptVisible(false);
      }
    } catch (err) {
      console.error('Push notification registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableClick = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Your device or browser does not support Web Push notifications.');
      return;
    }

    try {
      setLoading(true);
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        await registerPushSubscription(true);
      } else {
        setPromptVisible(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setPromptVisible(false);
    localStorage.setItem('saad_push_prompt_dismissed', 'true');
  };

  if (!promptVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-fadeIn">
      <div className="bg-[#262421] text-[#F7F5F0] border border-[#B99A68]/60 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#B99A68]/20 border border-[#B99A68]/40 flex items-center justify-center text-[#B99A68] shrink-0">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-serif font-bold text-white flex items-center gap-1.5">
              <span>Mobile Workshop Alerts</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#B99A68] text-black font-sans font-black uppercase">
                Live
              </span>
            </h4>
            <p className="text-[10px] text-[#EAE2D6]/80 leading-tight truncate mt-0.5">
              Get notified even when using other apps when your furniture is carved or updated.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleEnableClick}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-[#B99A68] text-[#262421] text-xs font-bold hover:bg-[#a68856] active:scale-95 transition-all shadow-md flex items-center gap-1"
          >
            {loading ? 'Activating...' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
