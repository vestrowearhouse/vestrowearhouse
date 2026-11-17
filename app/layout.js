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
const WhatsAppFloatingButton = dynamic(() => import('./components/WhatsAppFloatingButton'), { ssr: false });
const ServiceWorkerRegister = dynamic(() => import('./components/ServiceWorkerRegister'), { ssr: false });
const LoginModal = dynamic(() => import('./components/LoginModal'), { ssr: false });

// Cache the layout for 60 seconds - revalidate on-demand via API
export const revalidate = 60;

const SITE_URL = 'https://www.vestrowearhouse.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vestro Wear House - Premium Fashion & Lifestyle Destination',
    template: '%s | Vestro Wear House',
  },
  description: 'Explore premium clothing, fashion, streetwear, and lifestyle apparel at Vestro Wear House. Fast nationwide delivery and secure checkout.',
  keywords: 'vestro wear house, fashion, apparel, clothing, streetwear, lifestyle, online shopping, Bangladesh',
  authors: [{ name: 'Vestro Wear House' }],
  creator: 'Vestro Wear House',
  publisher: 'Vestro Wear House',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: SITE_URL,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/tab-icon.png?v=circle-v1', sizes: '32x32', type: 'image/png' },
      { url: '/tab-icon.png?v=circle-v1', sizes: '16x16', type: 'image/png' },
      { url: '/tab-icon.png?v=circle-v1', sizes: '192x192', type: 'image/png' },
      { url: '/tab-icon.png?v=circle-v1', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/tab-icon.png?v=circle-v1',
    apple: [
      { url: '/tab-icon.png?v=circle-v1', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vestro Wear House',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'Vestro Wear House - Premium Fashion & Lifestyle Destination',
    description: 'Explore premium clothing, fashion, streetwear, and lifestyle apparel at Vestro Wear House.',
    url: SITE_URL,
    siteName: 'Vestro Wear House',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vestro Wear House',
    description: 'Premium Fashion & Lifestyle Destination in Bangladesh',
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
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        {/* Resource hints — tell browser to connect early to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://accounts.google.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://i.postimg.cc" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        {/* Force browser to fetch the new pure white circle bg + black V logo favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/tab-icon.png?v=circle-v1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/tab-icon.png?v=circle-v1" />
        <link rel="shortcut icon" href="/tab-icon.png?v=circle-v1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/tab-icon.png?v=circle-v1" />
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
          <WhatsAppFloatingButton />
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
