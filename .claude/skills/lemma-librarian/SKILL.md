---
name: lemma-librarian
description: Maintain machine/lemmas/ — extract reusable proved facts from proofs and specs, deduplicate them, and index them so future proof work starts from the library instead of from scratch. Use after any successful HOLDS/CHECKED formalization, or when a proof attempt is struggling.
---

# lemma-librarian

Proof effort is the scarcest resource in the machine layer. The lemma
library amortizes it.

## When invoked after a successful proof

1. Scan the new proof for facts that are (a) proved, (b) stated
   independently of the enclosing module's specifics, (c) plausibly
   reusable — arithmetic bounds, container invariants, monotonicity
   facts, encoding round-trips.
2. Extract each into `machine/lemmas/L-###-<slug>.<ext>` in the
   verifier's language, self-contained: the lemma file must verify on
   its own (its own includes, no project source dependencies beyond
   other lemmas).
3. Rewrite the source proof to import the lemma rather than inline it,
   and re-verify. If re-verification fails, revert — the library must
   never make a green proof red.

## When invoked to assist a struggling proof

Search the library before inventing: match on the failing obligation's
shape (quantifier structure, operators, types), not its variable names.
Report candidate lemmas with one line each on why they might discharge
the obligation. Do not modify the target proof yourself — that is
implement-to-guarantee's job.

## Library hygiene

- `machine/lemmas/INDEX.md`: one line per lemma — id, statement in
  plain English, verifier, used-by list. Regenerable; rebuild freely.
- Deduplicate on statement equivalence, not name. Two lemmas proving
  the same fact: keep the more general, redirect users, delete the
  other (the library is regenerable, not archival).
- A lemma used by zero proofs for two consecutive curation passes is
  deleted. The library is a working set, not a museum.
- Lemmas carry no `assume`/`{:axiom}` — an axiom in the library
  poisons every proof downstream. CI's cheat-guard grep applies here
  with zero exceptions.
