// Supabase config — safe to ship (anon key only).
// Replace values with your project's URL and anon key.
window.SUPABASE_URL = window.SUPABASE_URL || 'https://bcwzsiiqxwophfhkqwdz.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_abc123xyz...tumhari-key...';

window.sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);sb_publishable_fTYLn2QfXdUxQCfj>phttps://bcwzsiiqxwophfhkqwdz.supabase>
