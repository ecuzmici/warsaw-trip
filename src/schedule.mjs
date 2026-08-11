// Pure schedule logic. No location data lives here (G8).
// All wall-clock reasoning happens in the trip's own timezone (G3).

const PARTS = new Map();

function formatter(tz) {
  let f = PARTS.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    PARTS.set(tz, f);
  }
  return f;
}

// Read an instant as wall-clock parts in the given timezone.
export function wallClock(nowMs, tz) {
  const p = Object.fromEntries(
    formatter(tz).formatToParts(new Date(nowMs)).map((x) => [x.type, x.value])
  );
  const hour = p.hour === "24" ? "00" : p.hour;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(hour) * 60 + Number(p.minute),
  };
}

export function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`bad time: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

// Returns exactly one of:
//   {state:"during", day, current, next}
//   {state:"gap",    day, current:null, next}
//   {state:"done",   day, current:null, next:null}
//   {state:"before", day:null, current:null, next}   before the trip
//   {state:"after",  day:null, current:null, next:null}  after the trip
export function resolve(trip, nowMs) {
  const { date, minutes } = wallClock(nowMs, trip.timezone);
  const days = [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
  const day = days.find((d) => d.date === date) || null;

  if (!day) {
    const upcoming = days.find((d) => d.date > date);
    if (!upcoming) return { state: "after", day: null, current: null, next: null };
    return { state: "before", day: null, current: null, next: upcoming.items[0] };
  }

  const items = [...day.items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const current = items.find(
    (it) => toMinutes(it.start) <= minutes && minutes < toMinutes(it.end)
  ) || null;
  const next = items.find((it) => toMinutes(it.start) > minutes) || null;

  if (current) return { state: "during", day, current, next };
  if (next) return { state: "gap", day, current: null, next };
  return { state: "done", day, current: null, next: null };
}
