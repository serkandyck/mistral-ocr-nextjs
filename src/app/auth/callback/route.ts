// Authentication callback route
// This file handles the OAuth callback from Supabase
// Updated to handle the case when Supabase is not configured
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.auth.exchangeCodeForSession(code);
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}?error=auth`);
  }
} 