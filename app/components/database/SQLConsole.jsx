/**
 * SQL Console - Disabled for security reasons
 */

'use client';

import { ShieldAlert } from 'lucide-react';

export default function SQLConsole() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-white rounded-lg border border-gray-200 text-center">
      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">SQL Console Disabled</h3>
      <p className="text-xs text-gray-500 max-w-md">
        Raw SQL execution from the web admin panel has been permanently disabled for security reasons.
        To execute database queries or migrations, please use the official Supabase Dashboard SQL Editor directly.
      </p>
    </div>
  );
}
