// supabase-config.js - SIMPLIFIED VERSION
if (!window.supabase) {
    console.error('Supabase library not loaded!');
} else {
    const SUPABASE_URL = 'https://kahsbllunfmoilgihfgo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHNibGx1bmZtb2lsZ2loZmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDMxNzQsImV4cCI6MjA3NzkxOTE3NH0.iZN9BgyI6CnwE_HRtJqinm29009c6tkDLlJs7se5E0k';

    // Simpler initialization without auth options
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test immediately
    window.supabaseClient
        .from('movies')
        .select('id, title')
        .limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.error('❌ Supabase connection failed:', error.message);
            } else {
                console.log('✅ Supabase connected! Test movie:', data);
            }
        });
}