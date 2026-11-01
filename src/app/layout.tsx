import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLockProvider } from '@/components/auth/AppLockProvider';

export const metadata: Metadata = {
  title: 'Saad Furniture – Premium Customer Order Tracking & Showroom Management',
  description:
    'Handcrafted Luxury Furniture, Live Workshop Milestones, Private Client Showroom, and White-Glove Dispatch.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/assets/branding/app-dp.svg', type: 'image/svg+xml' },
      { url: '/assets/branding/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/branding/app-dp.png', sizes: '180x180', type: 'image/png' },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#0b0d11] text-slate-100">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/assets/branding/app-dp.svg" />
        <link rel="icon" type="image/png" sizes="192x192" href="/assets/branding/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/assets/branding/app-dp.png" />
        <link rel="shortcut icon" href="/assets/branding/app-dp.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#0b0d11]">
        <AppLockProvider>{children}</AppLockProvider>
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
