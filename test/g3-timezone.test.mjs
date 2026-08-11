// G3: the answer depends on the trip timezone, never on the device timezone.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const PROBE = `
import { readFileSync } from "node:fs";
import { resolve } from "./src/schedule.mjs";
const trip = JSON.parse(readFileSync("data/trip.json", "utf8"));
const out = [];
for (let i = 0; i < 72; i++) {
  const t = Date.UTC(2026, 7, 13) + i * 3600e3;
  const r = resolve(trip, t);
  out.push(r.state + ":" + (r.current ? r.current.id : "-") + ":" + (r.next ? r.next.id : "-"));
}
process.stdout.write(out.join("|"));
`;

const under = (tz) =>
  execFileSync(process.execPath, ["--input-type=module", "-e", PROBE], {
    env: { ...process.env, TZ: tz },
    encoding: "utf8",
  });

test("same instants give the same answer in any device timezone", () => {
  const warsaw = under("Europe/Warsaw");
  assert.ok(warsaw.length > 0);
  for (const tz of ["UTC", "America/Los_Angeles", "Pacific/Kiritimati", "Asia/Kolkata"]) {
    assert.equal(under(tz), warsaw, `device timezone ${tz} changed the answer`);
  }
});
