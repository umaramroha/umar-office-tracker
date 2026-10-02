// Supabase config — safe to ship (anon key only).
// Replace values with your project's URL and anon key.
window.SUPABASE_URL = window.SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR-ANON-PUBLIC-KEY';

window.sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
