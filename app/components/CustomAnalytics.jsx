'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function CustomAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if we are in production or if you want to track locally too (remove this check if so)
    if (process.env.NODE_ENV !== 'production') return;

    // Build the full path
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // Send the tracking request in the background
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: url,
        referer: document.referrer || '',
      }),
      // Use keepalive to ensure the request is sent even if the user navigates away quickly
      keepalive: true 
    }).catch(err => {
      // Ignore network errors for analytics so it doesn't pollute client console
    });

  }, [pathname, searchParams]);

  // This component doesn't render anything visible
  return null;
}
