UOT.getOpenSession = async (userId) => {
  const { data, error } = await sb.from('attendance_sessions')
    .select('*').eq('user_id', userId).is('check_out', null)
    .order('check_in', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
};

UOT.getDaySessions = async (userId, day) => {
  const { data, error } = await sb.from('attendance_sessions')
    .select('*').eq('user_id', userId).eq('day', day)
    .order('check_in', { ascending: true });
  if (error) throw error;
  return data || [];
};

UOT.getDay = async (userId, day) => {
  const { data, error } = await sb.from('attendance_days')
    .select('*').eq('user_id', userId).eq('day', day).maybeSingle();
  if (error) throw error;
  return data;
};

UOT.checkIn = async (userId, orgId, coords, source = 'gps') => {
  const now = new Date();
  const day = UOT.todayISO();
  const { data, error } = await sb.from('attendance_sessions').insert({
    user_id: userId, day,
    check_in: now.toISOString(),
    source
  }).select().single();
  if (error) throw error;

  await sb.from('attendance_events').insert({
    user_id: userId, session_id: data.id, event_type: 'in',
    latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null,
    inside_geofence: coords?.inside ?? null
  });

  await UOT.recomputeDay(userId, orgId, day);
  return data;
};

UOT.checkOut = async (userId, orgId) => {
  const open = await UOT.getOpenSession(userId);
  if (!open) throw new Error('No open session');
  const now = new Date();
  const dur = Math.round((now - new Date(open.check_in)) / 60000);

  const { error } = await sb.from('attendance_sessions')
    .update({ check_out: now.toISOString(), duration_minutes: dur })
    .eq('id', open.id);
  if (error) throw error;

  await sb.from('attendance_events').insert({
    user_id: userId, session_id: open.id, event_type: 'out'
  });

  await UOT.recomputeDay(userId, orgId, open.day);
};

UOT.recomputeDay = async (userId, orgId, day) => {
  const sessions = await UOT.getDaySessions(userId, day);
  const dayStart = new Date(day + 'T00:00:00').toISOString();
  const dayEnd   = new Date(day + 'T23:59:59').toISOString();

  const calc = Calc.computeDay(sessions, dayStart, dayEnd);

  const existing = await UOT.getDay(userId, day);
  const row = {
    user_id: userId, organization_id: orgId, day,
    status: existing?.status || 'present',
    total_office_minutes: calc.total_office_minutes,
    outside_minutes: calc.outside_minutes,
    balance_minutes: calc.balance_minutes,
    updated_at: new Date().toISOString()
  };

  const { error } = await sb.from('attendance_days')
    .upsert(row, { onConflict: 'user_id,day' });
  if (error) throw error;
};

UOT.markAbsent = async (adminId, targetUserId, orgId, day) => {
  const existing = await UOT.getDay(targetUserId, day);
  const payload = {
    user_id: targetUserId, organization_id: orgId, day,
    status: 'absent', total_office_minutes: 0, outside_minutes: 0,
    balance_minutes: -Calc.DAILY_TARGET_MIN,
    updated_at: new Date().toISOString()
  };
  const { error } = await sb.from('attendance_days').upsert(payload, { onConflict: 'user_id,day' });
  if (error) throw error;

  await sb.from('audit_logs').insert({
    user_id: targetUserId, actor_id: adminId,
    table_name: 'attendance_days', record_id: existing?.id ?? null,
    field: 'status', old_value: existing?.status ?? null, new_value: 'absent'
  });
};

// ============ MANUAL ENTRY / EDIT ============

UOT.addManualSession = async (userId, orgId, day, checkInISO, checkOutISO) => {
  const durationMin = Math.round((new Date(checkOutISO) - new Date(checkInISO)) / 60000);

  const { data, error } = await sb.from('attendance_sessions').insert({
    user_id: userId,
    day: day,
    check_in: checkInISO,
    check_out: checkOutISO,
    duration_minutes: durationMin,
    source: 'manual'
  }).select().single();
  if (error) throw error;

  await sb.from('attendance_events').insert({
    user_id: userId,
    session_id: data.id,
    event_type: 'in',
    event_time: checkInISO
  });

  await sb.from('audit_logs').insert({
    user_id: userId,
    actor_id: userId,
    table_name: 'attendance_sessions',
    record_id: data.id,
    field: 'manual_add',
    old_value: null,
    new_value: checkInISO + ' to ' + checkOutISO
  });

  await UOT.recomputeDay(userId, orgId, day);
  return data;
};

UOT.deleteSession = async (userId, orgId, sessionId) => {
  const { data: old } = await sb.from('attendance_sessions')
    .select('*').eq('id', sessionId).single();
  if (!old) throw new Error('Session not found');

  await sb.from('audit_logs').insert({
    user_id: userId,
    actor_id: userId,
    table_name: 'attendance_sessions',
    record_id: sessionId,
    field: 'manual_delete',
    old_value: old.check_in + ' to ' + (old.check_out || 'open'),
    new_value: null
  });

  const { error } = await sb.from('attendance_sessions')
    .delete().eq('id', sessionId);
  if (error) throw error;

  await UOT.recomputeDay(userId, orgId, old.day);
};
