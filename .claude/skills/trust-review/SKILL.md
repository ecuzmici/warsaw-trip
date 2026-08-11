---
name: trust-review
description: Diff the Given section of GUARANTEES.md over time and report "what you now take on trust", with risk notes. Use when the user asks what they're trusting, whether assumptions have grown, or before signing off on a release.
---

# Trust review

The Given section is the project's trust surface: everything the
guarantees rest on that no checker can establish. This skill shows how
that surface has moved.

## Procedure

1. Pick the comparison window. Default: last tag (or 30 days if no
   tags) → HEAD. The user can name any two refs.
2. `git log -p <from>..<to> -- GUARANTEES.md` and extract changes to
   the `## Given` section and to `given T#` refs on guarantee lines.
3. Classify each change:
   - **New trust** — a Given added, or an existing Given newly
     referenced by more guarantees.
   - **Widened trust** — a Given's wording weakened, or a guarantee
     that was HOLDS/ENFORCED/SAMPLED now TRUSTED.
   - **Retired trust** — a Given removed or no longer referenced.
4. For every current Given, note **blast radius**: which guarantees
   reference it, and what the user loses if the assumption fails.

## Report format

Plain prose, warm, no tables of hashes. Lead with the one-sentence
verdict: "Your trust surface grew / shrank / held steady." Then:

- **What you now take on trust** — each current Given, one line, with
  its blast radius ("T1 carries G2 and G5").
- **What changed** — the classified diff, newest first, each with a
  risk note: how this assumption could fail in the real world, and how
  they'd notice. If a Given is unfalsifiable-in-practice (nobody would
  ever notice it failing), flag it — those are the dangerous ones.
- **Suggestions** — at most three: Givens that could be upgraded into
  checked guarantees, or guarantees leaning on stale assumptions.

Never edit GUARANTEES.md from this skill. It's a mirror, not a hand.
