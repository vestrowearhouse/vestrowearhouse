/**
 * Next.js App Router robots.txt generator
 * Automatically served at /robots.txt
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/checkout',
          '/cart',
          '/profile',
          '/orders',
          '/settings',
          '/wishlist',
        ],
      },
    ],
    sitemap: 'https://www.vestrowearhouse.com/sitemap.xml',
    host: 'https://www.vestrowearhouse.com',
  };
}
