// G2: at every minute of the trip the page names exactly one current item,
// or names the next item and says there is a gap.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, wallClock, toMinutes } from "../src/schedule.mjs";

const trip = JSON.parse(readFileSync("data/trip.json", "utf8"));
const DAY = 1440;

// Walk real instants across the whole trip, one minute at a time.
function instants() {
  const first = trip.days.map((d) => d.date).sort()[0];
  const [y, m, d] = first.split("-").map(Number);
  const startUtc = Date.UTC(y, m - 1, d) - 2 * 3600e3; // CEST is UTC+2 in August
  const total = trip.days.length * DAY;
  return Array.from({ length: total }, (_, i) => startUtc + i * 60e3);
}

test("every minute resolves to exactly one state", () => {
  const states = new Set();
  for (const t of instants()) {
    const r = resolve(trip, t);
    states.add(r.state);
    const wall = wallClock(t, trip.timezone);
    const day = trip.days.find((x) => x.date === wall.date);
    const containing = day
      ? day.items.filter(
          (it) => toMinutes(it.start) <= wall.minutes && wall.minutes < toMinutes(it.end)
        )
      : [];

    assert.ok(containing.length <= 1, `${wall.date} ${wall.minutes}: ${containing.length} overlapping items`);

    if (containing.length === 1) {
      assert.equal(r.state, "during");
      assert.equal(r.current.id, containing[0].id);
    } else {
      assert.equal(r.current, null, `${wall.date} ${wall.minutes}: current set with no containing item`);
      assert.ok(["gap", "done", "before", "after"].includes(r.state));
      if (r.state === "gap") assert.ok(r.next, "gap must name the next item");
    }
  }
  assert.ok(states.has("during"), "some minute must be inside an item");
  assert.ok(states.has("gap"), "some minute must be a gap");
});

test("next is always later than now, and never the current item", () => {
  for (const t of instants()) {
    const r = resolve(trip, t);
    if (!r.next) continue;
    const wall = wallClock(t, trip.timezone);
    if (r.day) assert.ok(toMinutes(r.next.start) > wall.minutes);
    if (r.current) assert.notEqual(r.next.id, r.current.id);
  }
});
