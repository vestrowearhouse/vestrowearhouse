'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// In-memory deduplication cache for client session: path -> timestamp
const lastTrackedMap = new Map();

export default function CustomAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Only track in production
    if (process.env.NODE_ENV !== 'production') return;

    // 2. Skip automated tests and headless browsers (navigator.webdriver)
    if (typeof navigator !== 'undefined' && (navigator.webdriver || window.__nightmare || window._phantom)) {
      return;
    }

    // 3. Skip admin panel and internal API routes
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    // Build the full path
    const query = searchParams ? searchParams.toString() : '';
    const url = pathname + (query ? `?${query}` : '');

    // 4. Client-side deduplication: ignore identical path hits within 30 seconds
    const now = Date.now();
    const lastHit = lastTrackedMap.get(url) || 0;
    if (now - lastHit < 30000) {
      return;
    }
    lastTrackedMap.set(url, now);

    // Clean up cache to prevent memory build-up over long single-page app sessions
    if (lastTrackedMap.size > 50) {
      for (const [k, ts] of lastTrackedMap.entries()) {
        if (now - ts > 60000) lastTrackedMap.delete(k);
      }
    }

    // Send the tracking request in the background
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: url,
        referer: document.referrer || '',
        is_webdriver: typeof navigator !== 'undefined' ? !!navigator.webdriver : false,
      }),
      keepalive: true,
    }).catch(() => {
      // Ignore network errors for analytics so it doesn't pollute client console
    });

  }, [pathname, searchParams]);

  return null;
}
