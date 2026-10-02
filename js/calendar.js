UOT.renderCalendar = async (userId, year, month, container) => {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const daysInMonth = last.getDate();

  const startISO = new Date(year, month, 1).toISOString().slice(0,10);
  const endISO   = new Date(year, month + 1, 0).toISOString().slice(0,10);

  const { data } = await sb.from('attendance_days')
    .select('*').eq('user_id', userId)
    .gte('day', startISO).lte('day', endISO);
  const byDay = Object.fromEntries((data || []).map(r => [r.day, r]));

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let html = `<div class="row between" style="margin-bottom:10px">
    <button class="btn secondary" style="width:auto;padding:6px 12px" data-nav="-1">‹</button>
    <h3 style="margin:0">${monthNames[month]} ${year}</h3>
    <button class="btn secondary" style="width:auto;padding:6px 12px" data-nav="1">›</button>
  </div>`;

  html += `<div class="cal-header">
    ${['S','M','T','W','T','F','S'].map(d=>`<span>${d}</span>`).join('')}
  </div><div class="cal-grid">`;

  for (let i = 0; i < startDow; i++) html += `<div class="cal-cell empty"></div>`;

  const today = UOT.todayISO();
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const rec = byDay[iso];
    const cls = rec ? rec.status : '';
    const clsToday = iso === today ? 'today' : '';
    const balText = rec ? (rec.balance_minutes >= 0 ? '+' : '') + Math.round(rec.balance_minutes/60*10)/10 + 'h' : '';
    html += `<div class="cal-cell ${cls} ${clsToday}" data-day="${iso}">
      <span class="d">${d}</span><span class="b">${balText}</span>
    </div>`;
  }
  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll('[data-nav]').forEach(btn => {
    btn.onclick = () => {
      const delta = parseInt(btn.dataset.nav, 10);
      const nd = new Date(year, month + delta, 1);
      UOT.renderCalendar(userId, nd.getFullYear(), nd.getMonth(), container);
    };
  });

  container.querySelectorAll('.cal-cell[data-day]').forEach(cell => {
    cell.onclick = () => UOT.showDayDetail(userId, cell.dataset.day);
  });
};

UOT.showDayDetail = async (userId, day) => {
  const sessions = await UOT.getDaySessions(userId, day);
  const rec = await UOT.getDay(userId, day);
  const lines = sessions.length
    ? sessions.map(s => `IN ${UOT.fmtTime(s.check_in)} → OUT ${s.check_out ? UOT.fmtTime(s.check_out) : 'active'}`).join('\n')
    : 'No sessions.';
  alert(
    `Day: ${UOT.fmtDate(day)}\nStatus: ${rec?.status ?? 'unknown'}` +
    `\nOffice: ${UOT.hm(rec?.total_office_minutes ?? 0)}` +
    `\nOutside: ${UOT.hm(rec?.outside_minutes ?? 0)}` +
    `\nBalance: ${UOT.hm(rec?.balance_minutes ?? 0)}\n\n${lines}`
  );
};
