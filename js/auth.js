UOT.login = async (email, password) => {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

UOT.signup = async (email, password, fullName) => {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
};

UOT.getProfile = async (userId) => {
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
};

UOT.getMembership = async (userId) => {
  const { data, error } = await sb.from('organization_members')
    .select('*, organizations(name)').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
};

UOT.requireAdmin = async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = '/pages/login'; return null; }
  const m = await UOT.getMembership(session.user.id);
  if (!m || m.role !== 'admin') { location.href = '/pages/dashboard.html'; return null; }
  return { session, membership: m };
};
