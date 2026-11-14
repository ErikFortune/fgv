# safer-fetch-walk-chain — Result-chain the safer-fetch hop walk

**Shipped**: 2026-10-19 into `integration/asks` via #748.
Package: `@fgv/ts-extras` (safer-fetch). This is an internal refactor with no API change; the
change file is typed `none`.

## Summary

Followups D1 from the #729 deep review. The hop walk (`_walk`) and the buffered entry point's setup
(`_execute`) used to be stacked `isFailure` / `_propagate` ladders. Both are now Result chains.

- **The walk recurses over hops**, in three stages:
  - `_walkHop` runs the request guard and the scheme re-check.
  - `_clearAndConnect` runs the address guard, loop detection and the connect.
  - `_settleHop` returns the final value, or derives the next hop and walks it.

  Each hop gets a fresh copy of the chain so far, and nothing mutates it.
- **`_execute` validates synchronously and builds the watch in the same synchronous prefix.** It
  then hands off once, to `_runCall`.

## Why it is safe

Correctness here is ordering. `state.md` maps every check-then-act window from before to after,
line by line, and the mapping holds. The fact it rests on: `DetailedSuccess.thenOnSuccess` calls its
callback synchronously, so the hand-offs add no `await`. The only new interval is a few microtasks
between the connect settling and the next hop's derivation. Nothing is checked or read from mutable
state there.

The `mcp-round-2b` revert matrix was re-run row by row. R7 stays green: that stream had already
recorded it as not isolable. Every other row is red. Seven new rows (S1–S7) target the walk's own
ordering. Table in `result.md`.

## What a reader should know

- **S1 found a test gap that predates this stream.** No test pinned the scheme re-check of a
  request guard's replacement. The address-guard path's own re-check still refused the request, but
  only after showing the guard a `file:` URL. The test now asserts the address guard is never asked.
- **One disclosed divergence, reachable only with garbage input.** If `watch.dispose()` throws (a
  non-`AbortSignal` passed as `signal`), the buffered call now resolves `'unknown'` instead of
  rejecting.

## Artifacts

`brief.md` (frozen contract) · `state.md` (the check-then-act enumeration) · `result.md` (revert
matrix and gates) · `meta.yaml`.
