# agent-tasks-t2 — pure context renderer, receipts and projection seam

**Shipped**: 2026-09-22 via [PR #685](https://github.com/ErikFortune/fgv/pull/685) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

T2 is the snapshot-only entry point of `@fgv/ts-agent-tasks`. A host hands `TaskContextRenderer`
already-authorized task values and gets bounded framed text, a structured view, an omission report
and a pure inclusion receipt — with no storage, no broker, and nothing the renderer could write to.
The pipeline validates the budget (including `maxChars ≥ framingReserve`) and the input, normalizes
duplicates and conflicts, projects each distinct `(task, revision)` once and re-validates it, refuses
parent cycles, ranks, selects greedily (items → depth → full line → abbreviated line → omit),
renders by section, and builds the receipt from what rendered. Purity is established by spies
(> 50, watched failing), not by comparing state. No T1 union member was revised. 500 tests in the
package (91 new), 100% on all four metrics, no coverage directives.

## Files changed

- `src/packlets/context/` (new) — `normalize.ts`, `escaping.ts`, `framing.ts`, `renderer.ts`.
- `src/packlets/types/` — `context.ts`, `summary.ts` (new); `ITaskUpdate` in `updates.ts`.
- `src/packlets/converters/` — `contextConverters.ts` (new, on `TaskConverters.context`);
  `primitives.ts` (`boundedArrayOf` checks length before converting, and passes `context` through).
- Tests: `context/renderer.test.ts`, `context/purity.test.ts`, `converters/contextConverters.test.ts`,
  `primitives.test.ts` additions, `helpers/contextFixtures.ts`.
- `CAPABILITIES.md`, `README.md`, API report, change file, `docs/WORKSTREAMS.md`, status lines in
  `docs/design/agent-tasks/implementation-plan.md`.

## Decisions made during execution

Recorded in `result.md` § *Decisions that revisit the design sketch*:

- **A class, not `renderTaskContext(input, budget)`** — validation is bounds-dependent and bounds
  live on a `TaskConverters` instance.
- **`TaskResult`, not `Result`** — `invalid` and `conflict` call for different host actions.
- **One render item per `(task, revision)`**; tie-break is task ID then revision, not §9's "task ID
  and update ID" (update ID is not a total key once an item carries zero or several).
- **At most one update per `(task, revision, category)`**, enforced as `conflict`; bounds a receipt
  entry at seven update IDs.
- **Abbreviation keeps the revision, drops every update ID** — an update ID in a receipt claims
  complete delivery. Abbreviation also makes `omissions.exhaustive` false (Copilot round 4).
- **The receipt is canonical** (ordering is part of the converter) so two receipts for one inclusion
  are byte-identical.
- **Unresolved references consume the item budget** and render in `[diagnostics]` with no revision
  and no binding; `ITaskContextDiagnostic` and `TaskContextUnresolvedProjection` close the two
  disclosure paths review found around the projection.
- **`allTaskResults` kept package-local** (a detail-preserving `mapResults`); dispositioned as a
  `ts-utils` candidate.

## Followups

> **Routed at the cluster close (2026-10-01).** Every item below described as recorded nowhere durable
> (or not in `TECH_DEBT.md`) is now in `docs/TECH_DEBT.md` under *[P3] `ts-agent-tasks` — deferrals the
> agent-tasks slices recorded only in their own `result.md`*.

| item (from `result.md` § *Things a later slice must decide*) | where it went |
|---|---|
| T7: baseline obligations vs one-update-per-category | T7 persists a subscription baseline as its own structure (`agent-tasks-t7/result.md`), which sidesteps the collision; T7's result does not cite this item explicitly |
| T7: abbreviated entry ≠ delivery | T7 acknowledges exact update IDs from issued receipts only, "never a revision watermark" (`agent-tasks-t7/result.md` opener) |
| I2: the text is one block | `agent-tasks-i2` places it as the one trailing per-request slot |
| Input size bounds are sanity bounds, not measured | Not measured by this slice; recorded nowhere else found |
| Design §9 tie-break wording | **Not applied** — `development-design.md` § *Pure rendering* still reads "task ID and update ID"; recorded only in `result.md` and the ledger narrative |
| `allTaskResults` as a `ts-utils` candidate | `result.md` says to record it in `docs/TECH_DEBT.md` at stream close; **it is not there** (now used by two files in the `context` packlet) |

## Lessons codified during the run

- **Copilot's headline is a pointer even when it posts nothing.** Rounds 2–4 each posted
  `Findings: None` while the headline named areas with real defects; hunting those areas found five
  real defects, each watched failing first.
- **A review fix can regress** — round 2's `boundedArrayOf` fix dropped the converter `context`
  argument; round 3 caught it.
- **A test named for a property must check the property** — the receipt-honesty sweep stepped by 7
  until round 1; it now steps by 1.
- **Disclosure through the structured view, not the text** — the text never rendered the binding,
  but `diagnostics` handed it over; the same hole recurred on the input side (CodeRabbit).
- **A spy suite can silently spy on nothing** — namespace-import getters are not configurable; the
  "> 50 spies" sanity assertion caught it (`state.md`, phase 1).

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md` (its § *Gate results* defers to `state.md` phase 3, which records review
  rounds but no final gate table; phase 2 records all nine `ci.yml` steps green before the Copilot loop)
- PR: [#685](https://github.com/ErikFortune/fgv/pull/685)
