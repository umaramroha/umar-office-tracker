UOT.monthlyReport = async (userId, year, month) => {
  const startISO = new Date(year, month, 1).toISOString().slice(0,10);
  const endISO   = new Date(year, month + 1, 0).toISOString().slice(0,10);

  const { data, error } = await sb.from('attendance_days')
    .select('*').eq('user_id', userId).gte('day', startISO).lte('day', endISO)
    .order('day', { ascending: true });
  if (error) throw error;

  const rows = data || [];
  const totals = rows.reduce((acc, r) => {
    acc.office += r.total_office_minutes || 0;
    acc.outside += r.outside_minutes || 0;
    acc.balance += r.balance_minutes || 0;
    if (r.status === 'absent') acc.absentDays++;
    if (r.status === 'leave')  acc.leaveDays++;
    if (r.status === 'present') acc.presentDays++;
    return acc;
  }, { office:0, outside:0, balance:0, absentDays:0, leaveDays:0, presentDays:0 });

  const target = Calc.monthlyTargetMinutes(year, month);
  return { rows, totals, target, delta: totals.balance };
};

UOT.renderMonthlyReport = async (userId, year, month, container) => {
  const { rows, totals, target, delta } = await UOT.monthlyReport(userId, year, month);
  const sign = delta >= 0 ? 'good' : 'bad';
  container.innerHTML = `
    <div class="card stack">
      <h3>${new Date(year, month, 1).toLocaleDateString([], { month:'long', year:'numeric' })}</h3>
      <div class="stat"><span class="k">Monthly target</span><span class="v">${UOT.hm(target)}</span></div>
      <div class="stat"><span class="k">Office total</span><span class="v">${UOT.hm(totals.office)}</span></div>
      <div class="stat"><span class="k">Outside total</span><span class="v">${UOT.hm(totals.outside)}</span></div>
      <div class="stat"><span class="k">Balance</span><span class="v"><span class="pill ${sign}">${UOT.hm(delta)}</span></span></div>
      <div class="stat"><span class="k">Present / Absent / Leave</span>
        <span class="v">${totals.presentDays} / ${totals.absentDays} / ${totals.leaveDays}</span></div>
    </div>
    <div class="card stack" style="margin-top:12px">
      <h3>Days</h3>
      ${rows.length ? rows.map(r => `
        <div class="stat">
          <span class="k">${UOT.fmtDate(r.day)} <span class="pill ${r.status==='absent'?'bad':r.status==='leave'?'warn':'good'}">${r.status}</span></span>
          <span class="v">${UOT.hm(r.balance_minutes||0)}</span>
        </div>`).join('') : '<div class="muted">No records.</div>'}
    </div>`;
};
