// Attendance calculation engine — no double deduction.
const DAILY_TARGET_MIN = 540; // 9h

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]);
    else out.push(sorted[i]);
  }
  return out;
}

function computeDay(sessions, dayStartISO, dayEndISO) {
  const dayStart = new Date(dayStartISO).getTime();
  const dayEnd   = new Date(dayEndISO).getTime();
  const now = Date.now();

  const officeIntervals = sessions.map(s => {
    const sIn  = Math.max(new Date(s.check_in).getTime(), dayStart);
    const sOut = Math.min(s.check_out ? new Date(s.check_out).getTime() : now, dayEnd);
    return [sIn, sOut];
  }).filter(([a, b]) => b > a);

  const merged = mergeIntervals(officeIntervals);
  const officeMs = merged.reduce((sum, [a, b]) => sum + (b - a), 0);

  const dayMs = dayEnd - now > 0 ? (now - dayStart) : (dayEnd - dayStart);
  const outsideMs = Math.max(0, dayMs - officeMs);

  const totalOfficeMinutes = Math.round(officeMs / 60000);
  const outsideMinutes     = Math.round(outsideMs / 60000);
  const balanceMinutes     = totalOfficeMinutes - outsideMinutes - DAILY_TARGET_MIN;

  return { total_office_minutes: totalOfficeMinutes, outside_minutes: outsideMinutes, balance_minutes: balanceMinutes };
}

function monthlyTargetMinutes(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  return days * DAILY_TARGET_MIN;
}

window.Calc = { computeDay, monthlyTargetMinutes, DAILY_TARGET_MIN, mergeIntervals };
