// supabase-config.js
// This script must be loaded AFTER the Supabase CDN script in your HTML.

// Check if the main Supabase library has loaded
if (!window.supabase) {
    console.error('Supabase library (supabase.min.js) failed to load! This config file must be loaded AFTER the CDN script.');
} else {
    // Your Supabase details
    const SUPABASE_URL = 'https://kahsbllunfmoilgihfgo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHNibGx1bmZtb2lsZ2loZmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDMxNzQsImV4cCI6MjA3NzkxOTE3NH0.iZN9BgyI6CnwE_HRtJqinm29009c6tkDLlJs7se5E0k';

    // Initialize the Supabase client and make it globally available
    // Your other files will use "supabaseClient", NOT "supabase"
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'roy-entertainment-auth',
            flowType: 'pkce'
        }
    });

    console.log('%c✅ Supabase Initialized', 'color: #3ECF8E; font-weight: bold');
}