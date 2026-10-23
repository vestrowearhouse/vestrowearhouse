export default function manifest() {
  return {
    id: '/?source=pwa',
    name: 'Stellar Mart BD',
    short_name: 'StellarMart',
    description: 'Best e-commerce platform in Bangladesh. Shop electronics, fashion, home & living, and more with fast delivery and secure payment.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#083b66',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/icons/playstore-feature-graphic.png',
        sizes: '1024x500',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Stellar Mart BD - Best Online Shopping in Bangladesh',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Stellar Mart BD Mobile Shopping',
      },
    ],
    categories: ['shopping', 'lifestyle', 'business'],
    shortcuts: [
      {
        name: 'Shop',
        short_name: 'Shop',
        description: 'Browse all products',
        url: '/shop',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Cart',
        short_name: 'Cart',
        description: 'View shopping cart',
        url: '/cart',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Categories',
        short_name: 'Categories',
        description: 'Explore product categories',
        url: '/categories',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
