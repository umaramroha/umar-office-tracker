// Attendance calculation engine
const DAILY_TARGET_MIN = 540; // 9 hours

function computeDay(sessions, dayStartISO, dayEndISO) {
  const now = Date.now();

  // No sessions = full absent
  if (!sessions || sessions.length === 0) {
    return {
      total_office_minutes: 0,
      outside_minutes: 0,
      balance_minutes: -DAILY_TARGET_MIN
    };
  }

  // Sort sessions by check-in time
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.check_in) - new Date(b.check_in)
  );

  // Office time = sum of each session's duration
  const officeMs = sorted.reduce((sum, s) => {
    const start = new Date(s.check_in).getTime();
    const end = s.check_out ? new Date(s.check_out).getTime() : now;
    return sum + Math.max(0, end - start);
  }, 0);

  // Work window = first check-in to last check-out (or now if last is open)
  const windowStart = new Date(sorted[0].check_in).getTime();
  const lastSession = sorted[sorted.length - 1];
  const windowEnd = lastSession.check_out
    ? new Date(lastSession.check_out).getTime()
    : now;
  const windowMs = Math.max(0, windowEnd - windowStart);

  // Outside = window time MINUS office time (gaps between sessions only)
  const outsideMs = Math.max(0, windowMs - officeMs);

  const totalOfficeMinutes = Math.round(officeMs / 60000);
  const outsideMinutes = Math.round(outsideMs / 60000);
  const balanceMinutes = totalOfficeMinutes - outsideMinutes - DAILY_TARGET_MIN;

  return {
    total_office_minutes: totalOfficeMinutes,
    outside_minutes: outsideMinutes,
    balance_minutes: balanceMinutes
  };
}

function monthlyTargetMinutes(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  return days * DAILY_TARGET_MIN;
}

window.Calc = {
  computeDay,
  monthlyTargetMinutes,
  DAILY_TARGET_MIN
};
