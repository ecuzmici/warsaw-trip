# GUARANTEES — warsaw-trip

G1  Every location in data/trip.json has a non-empty Google Maps URL.  OPEN given T3
G2  At every minute of 13 to 15 August 2026 Warsaw time, the page shows exactly one current item, or shows a gap and the next item.  OPEN
G3  The page reads Europe/Warsaw time, whatever timezone the device is set to.  OPEN
G4  No two items on the same day overlap, and every item ends after it starts.  OPEN
G5  Every item starts after its venue opens and ends before its venue closes, on that item's own date.  OPEN given T1, T2, T6
G6  The gap between two consecutive items is at least the recorded travel time.  OPEN given T7
G7  The page loads and works with no network after the first visit.  OPEN
G8  No location name, time, or address appears outside data/trip.json.  OPEN
G9  A push to main either publishes the new data to GitHub Pages, or fails the deploy. The site never serves data that failed a check.  OPEN given T4, T5
G10  The page renders with no JavaScript error in every schedule state.  OPEN given T8
G11  A clock tick never closes an open day, moves the scroll position, or takes keyboard focus.  OPEN given T8
G12  Every text the page renders meets WCAG AA contrast against its actual background.  OPEN given T8
G13  Every control you can tap is at least 44 by 44 CSS pixels.  OPEN given T8
G14  Every item's note and opening hours are reachable without leaving the page.  OPEN
G15  When the time to leave for the next item has passed, no text on screen is larger than the instruction to leave.  OPEN

## Given
T1  Opening hours were checked on 11 August 2026. Venues can change them.
T2  15 August 2026 is a Polish public holiday with a trading ban. Shops can close without notice. Nostalgia Praga is unconfirmed for that date.
T3  Google Maps URLs keep pointing at the same place.
T4  GitHub Pages stays available during the trip.
T5  The phone flow needs Claude Code on the phone and GitHub push access.
T6  "Refitted" and "MindUp" are unverified. No source confirms either venue.
T7  The recorded travel times are achievable on the day.
T8  Chromium's computed styles stand in for every browser. Other engines can lay the page out differently.

## Out of scope
- Live public transport times. Travel times are static estimates.
- Booking tickets or tables. The page links out; it does not reserve.
- Weather, and any re-plan based on it.
- Tracking which stops you actually made. The page reads the clock only.
- Editing the plan from the browser. Changes go through git.
- Whether the slot an agent picks for a new place is a good slot.
- Alarms and notifications. The page never interrupts you; you open it.
- Re-planning when you run late. The clock is the only input.
- Pronunciation help for Polish names.
