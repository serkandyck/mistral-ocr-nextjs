// Authentication utility functions
// This file provides client-side functions for authentication with Supabase
// Updated to handle the case when Supabase is not configured

import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

/**
 * Sign in with Google
 * @returns A promise that resolves when the sign-in process is complete
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please check your environment variables.');
    throw new Error('Supabase is not configured');
  }

  try {
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw new Error('Failed to sign in with Google');
  }
}

/**
 * Sign out the current user
 * @returns A promise that resolves when the sign-out process is complete
 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please check your environment variables.');
    throw new Error('Supabase is not configured');
  }

  try {
    const { error } = await supabase!.auth.signOut();

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out');
  }
}

/**
 * Get the current user
 * @returns The current user, or null if not signed in
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Please check your environment variables.');
    return null;
  }

  try {
    const { data: { user } } = await supabase!.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
} 