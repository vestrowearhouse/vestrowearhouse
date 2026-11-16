export default function manifest() {
  return {
    id: '/?source=pwa',
    name: 'Vestro Wear House',
    short_name: 'Vestro',
    description: 'Vestro Wear House - Premium streetwear, apparel, and lifestyle fashion in Bangladesh.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
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
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Vestro Wear House - Streetwear & Fashion',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Vestro Wear House Mobile Shopping',
      },
    ],
    categories: ['shopping', 'lifestyle', 'clothing', 'fashion'],
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
