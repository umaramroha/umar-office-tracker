window.SUPABASE_URL = 'https://bcwzsiiqxwophfhkqwdz.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_fTYLn2QfXdUxQCfj5lvtBg_2chN_UEo';

window.sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY,
 { auth: { persistSession: true, autoRefreshToken: true } }
);
