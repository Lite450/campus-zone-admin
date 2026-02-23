// supabaseClient.js — Campus Zone Supabase Integration
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug — check what's being loaded from .env
console.log('[Supabase] URL:', SUPABASE_URL || 'MISSING ⚠️');
console.log('[Supabase] Key loaded:', SUPABASE_ANON_KEY ? 'YES ✅' : 'MISSING ⚠️');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase] ❌ Missing env vars! Check .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder'
);
