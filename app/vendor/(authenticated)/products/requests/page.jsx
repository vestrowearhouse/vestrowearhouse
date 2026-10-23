'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Product requests system has been removed.
// Redirect vendors to their products list.
export default function RemovedPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/vendor/products');
  }, [router]);
  return null;
}
