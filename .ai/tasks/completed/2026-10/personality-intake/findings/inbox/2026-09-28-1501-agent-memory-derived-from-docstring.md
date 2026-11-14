# ts-agent-memory: state on `IProvenance.derivedFrom` that it is provenance, queryable, and may resolve to withdrawn

## Source

- **Repo / item:** `ErikFortune/personaility` issue [#670](https://github.com/ErikFortune/personaility/issues/670) — an issue, label `fgv-ask`, open.
- **Author / date:** ErikFortune, 2026-09-28T15:01:09Z. No comments.
- **Long form:** [`.ai/notes/fgv-share/ASK-2026-09-27-derived-from-docstring.md`](https://github.com/ErikFortune/personaility/blob/working/.ai/notes/fgv-share/ASK-2026-09-27-derived-from-docstring.md) on `working` (issue says "landed at `9d7c0478`").

## The request, in their terms

> "amend the docstring on `IProvenance.derivedFrom` in `@fgv/ts-agent-memory` to say what the field is: a record of which write last produced the record (provenance), queryable but not dereferenceable, and one that may resolve to a withdrawn source. Doc only; no shape change."

Suggested wording from the note ("Roughly this, in your words"):

> "Provenance, not a live pointer: records which source the write that produced this record came from, and keeps naming it after that source is withdrawn. Queryable, not dereferenceable — a consumer resolving it must handle a source that no longer exists (and, for a versioned kind, an address naming a superseded version)."

## Stated motivation

> "the field is written on every claim and repointed on a document rename, but a retraction deliberately leaves it naming the withdrawn document (nulling it would erase a true fact; repointing would assert a false one). Readers that treat it as a live pointer are surprised."

> "We resolve it on our side through one seam that answers record-or-withdrawn (`Persistence.Memory.Store.resolveDerivedFrom` in `@fgv/personaility`), so the only thing left contradicting the rule is the field's own doc, which we cannot edit."

Note: "\"Back-link\" reads as a pointer a caller can follow. Nothing on the field says what a caller gets when the record it names is gone, and in practice it is often gone."

## Stated constraints or acceptance

- > "Needed back: the docstring; nothing else."
- Note: "**Not asking for:** any change to the field's type, to `IEdgeTarget`, or to what the store stamps. The behavior is right."
- Verified against the installed `@fgv/ts-agent-memory` 5.1.0-57 (`lib/packlets/types/envelope.d.ts`).
- No priority stated.

## Package(s) it appears to touch

`@fgv/ts-agent-memory` (`IProvenance` in the `types` packlet).

## Stated dependencies

None on other requests.

## Observations (intake agent's, not the requester's)

- On `integration/agent-tasks-v1` @ `2a95fbb2`, `libraries/ts-agent-memory/src/packlets/types/envelope.ts:33-39` still reads "Scope-qualified back-link to the source record. Enables the cross-kind provenance spine…".
- The note says its own `resolveDerivedFrom` citation was on branch `chore/decided-knowledge-items` pending a `working` commit; the issue body cites `9d7c0478` for the note itself. Not re-verified by intake.
