// supabase-config.js
// Initialize Supabase after clean loading

function initializeSupabase() {
    if (!window.supabase) {
        console.error('Supabase not loaded');
        return;
    }
    
    const SUPABASE_URL = 'https://kahsbllunfmoilgihfgo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHNibGx1bmZtb2lsZ2loZmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDMxNzQsImV4cCI6MjA3NzkxOTE3NH0.iZN9BgyI6CnwE_HRtJqinm29009c6tkDLlJs7se5E0k';

    // Initialize Supabase client
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

// Wait for Supabase to load
if (window.supabase) {
    initializeSupabase();
} else {
    // If Supabase isn't loaded yet, wait for it
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        checkCount++;
        if (window.supabase) {
            clearInterval(checkInterval);
            initializeSupabase();
        } else if (checkCount > 50) { // Stop after 5 seconds
            clearInterval(checkInterval);
            console.error('Supabase failed to load');
        }
    }, 100);
}