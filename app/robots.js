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
          '/vendor/',
          '/checkout',
          '/cart',
          '/profile',
          '/orders',
          '/settings',
          '/wishlist',
        ],
      },
    ],
    sitemap: 'https://www.stellarmartbd.com/sitemap.xml',
    host: 'https://www.stellarmartbd.com',
  };
}
