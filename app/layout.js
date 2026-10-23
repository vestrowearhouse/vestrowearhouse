import './globals.css';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import UserLayoutWrapper from './components/UserLayoutWrapper';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import CustomAnalytics from './components/CustomAnalytics';

// Load Inter font with display:swap to prevent render blocking
// adjustFontFallback: true reduces CLS caused by font-swap by auto-adjusting
// the fallback font's metrics to match Inter as closely as possible
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true,
});

// Lazily load chatbot and login modal – they are never visible on first paint
const AIChatbot = dynamic(() => import('./components/AIChatbot'), { ssr: false });
const ServiceWorkerRegister = dynamic(() => import('./components/ServiceWorkerRegister'), { ssr: false });
const LoginModal = dynamic(() => import('./components/LoginModal'), { ssr: false });

// Cache the layout for 60 seconds - revalidate on-demand via API
export const revalidate = 60;

const SITE_URL = 'https://www.stellarmartbd.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'StellarMartBD - Your Trusted Online Shopping Destination',
    template: '%s | StellarMartBD',
  },
  description: 'Best e-commerce platform in Bangladesh. Shop electronics, fashion, home & living, and more with fast delivery and secure payment.',
  keywords: 'e-commerce, online shopping, Bangladesh, electronics, fashion, home living, bKash, Nagad, fast delivery',
  authors: [{ name: 'StellarMartBD' }],
  creator: 'StellarMartBD',
  publisher: 'StellarMartBD',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: SITE_URL,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icons/icon-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StellarMartBD',
  },
  openGraph: {
    title: 'StellarMartBD - Your Trusted Online Shopping Destination',
    description: 'Best e-commerce platform in Bangladesh. Shop electronics, fashion & more.',
    url: SITE_URL,
    siteName: 'StellarMartBD',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StellarMartBD',
    description: 'Your Trusted Online Shopping Destination in Bangladesh',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#083b66',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://i.postimg.cc" />
        {/*
          NOTE: Do NOT manually preload the hero image here.
          Next.js automatically adds the correct /_next/image preload
          when priority={true} is set on the <Image> component in HeroBanner.jsx.
        */}
      </head>
      <body>
        <AuthProvider>
          <UserLayoutWrapper>
            <main className="min-h-screen pb-16 md:pb-0">
              {children}
            </main>
          </UserLayoutWrapper>
          <LoginModal />
          <AIChatbot />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
        <Suspense fallback={null}>
          <CustomAnalytics />
        </Suspense>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
