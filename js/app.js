// Shared bootstrap for all pages
window.UOT = window.UOT || {};

UOT.toast = (msg, ms = 2200) => {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
};

UOT.fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
UOT.fmtDate = (d)  => new Date(d).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

UOT.todayISO = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
};

UOT.hm = (minutes) => {
  const sign = minutes < 0 ? '-' : '';
  const m = Math.abs(minutes);
  const h = Math.floor(m / 60), mm = m % 60;
  return `${sign}${h}h ${String(mm).padStart(2, '0')}m`;
};

UOT.requireSession = async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = '/pages/login.html'; return null; }
  return session;
};

UOT.logout = async () => {
  await sb.auth.signOut();
  location.href = '/pages/login.html';
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
