// Supabase client configuration
// This file provides a simple client-side Supabase client
// Updated to provide more detailed error messages
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are valid
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) {
    console.warn('Supabase URL is not defined');
    return false;
  }
  if (url.includes('your-supabase-project-url')) {
    console.warn('Supabase URL is still using the placeholder value');
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    console.error('Invalid Supabase URL format:', e);
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  if (!key) {
    console.warn('Supabase anon key is not defined');
    return false;
  }
  if (key.includes('your-supabase-anon-key')) {
    console.warn('Supabase anon key is still using the placeholder value');
    return false;
  }
  return true;
};

// Create a Supabase client if environment variables are valid
let supabaseClient = null;
try {
  if (isValidUrl(supabaseUrl) && isValidKey(supabaseKey)) {
    supabaseClient = createClient(supabaseUrl!, supabaseKey!);
    console.log('Supabase client initialized successfully');
  } else {
    console.warn('Supabase client not initialized due to invalid configuration');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

export const supabase = supabaseClient;

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
}; 