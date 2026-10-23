import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Initiates Google OAuth flow through Supabase
 * For now, redirects to login page with OAuth support coming soon
 */
export async function GET(request) {
  try {
    // For Supabase OAuth, you would typically:
    // 1. Create an auth session
    // 2. Redirect to Supabase hosted auth UI or Google OAuth URL
    
    // For now, redirect to login page
    // In production, implement full Supabase OAuth flow
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('oauth', 'google');
    
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('OAuth start error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
