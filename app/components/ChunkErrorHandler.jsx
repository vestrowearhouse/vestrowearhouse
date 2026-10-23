'use client';

import { useEffect } from 'react';

/**
 * ChunkErrorHandler
 *
 * Detects webpack ChunkLoadError (happens after a new Vercel deployment
 * when the browser still has old chunk hashes cached).
 * Auto-reloads the page once — which pulls the fresh HTML and correct chunks.
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || event.reason;
      if (!error) return;

      const isChunkError =
        error.name === 'ChunkLoadError' ||
        (error.message && error.message.includes('Loading chunk')) ||
        (error.message && error.message.includes('Failed to fetch dynamically imported module')) ||
        (error.stack && error.stack.includes('webpack'));

      if (isChunkError) {
        // Only reload once to avoid infinite reload loops
        const reloadKey = 'chunkErrorReload';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload) > 30000) {
          sessionStorage.setItem(reloadKey, String(now));
          console.warn('[ChunkErrorHandler] Stale chunk detected — reloading for fresh build.');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
