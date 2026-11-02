import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLockProvider } from '@/components/auth/AppLockProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';

export const metadata: Metadata = {
  title: 'Saad Furniture – Premium Customer Order Tracking & Showroom Management',
  description:
    'Handcrafted Luxury Furniture, Live Workshop Milestones, Private Client Showroom, and White-Glove Dispatch.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/assets/branding/app-dp.svg', type: 'image/svg+xml' },
      { url: '/assets/branding/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/branding/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/branding/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Saad Furniture',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d11',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/assets/branding/app-dp.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/branding/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/assets/branding/icon-512x512.png" />
        <link rel="apple-touch-icon" href="/assets/branding/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/assets/branding/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Synchronous Frame-0 Theme Restoration
                var t = localStorage.getItem('saad_theme_mode');
                var isDark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
                // Synchronous Frame-0 Language / RTL Restoration
                var lang = localStorage.getItem('saad_language');
                if (lang === 'ur') {
                  document.documentElement.setAttribute('dir', 'rtl');
                  document.documentElement.setAttribute('lang', 'ur');
                } else {
                  document.documentElement.setAttribute('dir', 'ltr');
                  document.documentElement.setAttribute('lang', 'en');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AppLockProvider>{children}</AppLockProvider>
          </LanguageProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(console.error);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
