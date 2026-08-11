# warsaw-trip

A one-page trip planner for 13 to 15 August 2026. It reads the clock in
Europe/Warsaw and shows where you are supposed to be now, what comes next, and
when to leave. Every place links to Google Maps.

## Layout

| Path | Purpose |
| --- | --- |
| `data/trip.json` | The itinerary. The only place that holds names, times, and addresses. |
| `src/schedule.mjs` | Time logic. Answers "what is now" for a given instant. |
| `src/app.html` | Page template. Holds no trip data. |
| `build.mjs` | Inlines the data and the logic into `docs/index.html`. |
| `check.mjs` | Gates the guarantees in `GUARANTEES.md`. |
| `test/` | Tests for G2 and G3. |

## Commands

1. Run `npm run check` to test, build, and gate.
2. Run `npm run build` to write `docs/index.html`.
3. Open `docs/index.html` in a browser to preview.

The page is one self-contained file. It makes no network requests after it
loads, so it works on a phone with no signal.

## Add a place from your phone

Open Claude Code and say what you want to add. The agent must:

1. Look up the address, the opening hours for that date, and a Google Maps URL.
2. Add an item to the correct day in `data/trip.json`.
3. Set `travelMin` from the previous place, and pick a slot that keeps the gap.
4. Run `npm run check`.
5. Commit and push to `main` if the check passes.

GitHub Actions rebuilds and republishes the page. If the new slot breaks a
guarantee, the check fails and the live site keeps the last good data.

`check.mjs` does not judge whether a slot is a *good* slot. It only rejects
slots that overlap, miss the opening hours, or leave too little travel time.

## Publish

Set Pages to build from GitHub Actions:
**Settings > Pages > Build and deployment > Source: GitHub Actions**.

Do not point Pages at a branch folder. A branch folder publishes on push,
before the check runs, which breaks G9.
