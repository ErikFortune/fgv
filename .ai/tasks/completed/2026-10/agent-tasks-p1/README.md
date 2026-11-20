# agent-tasks-p1 — the credential-free public-API proving ground

**Shipped**: 2026-10-01 via [PR #709](https://github.com/ErikFortune/fgv/pull/709) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

P1 closes the cluster's implementation slices. It adds a `samples/testbed` scenario, `agent-tasks`
(CLI-only), that drives `@fgv/ts-agent-tasks` through the plan's nine-step journey, plus `7-cancel`
and `7-uncertain` branches, using only the package's exports. The journey covers:

- tracked and external work under overlapping scopes
- broker and snapshot-only rendering
- typed command tools with source-key dedup and a held non-idempotent command
- exact acknowledgement while work moves
- reassignment and reopen
- due cutoffs
- cascade stop with a host-resolved blocker
- recovery after reopen
- a checked final prompt captured off the wire

Every claim is a structured check recording the value it observed. The scenario's tests assert
those values against literals, so a printed line is never the evidence. In the library, six new
contract tests pin the compositions no existing suite covered. The proving ground's main output is
**three surface findings**. Every other step was driven through exports alone.

## Files changed

- `samples/testbed/src/scenarios/agentTasks/`:
  - `world.ts`: every simulation and host seam.
  - `journey.ts`: the core, `runAgentTasksJourney` → `Result<IJourneyReport>`.
  - `report.ts`, `support.ts`.
  - `outbound.ts`: request capture.
  - `index.ts`: a fourteen-line bootstrap.
- Testbed registration and tests:
  - The scenario is registered in `scenarios/index.ts`. The registry snapshot gains one line.
  - Tests are in `src/test/unit/scenarios/agentTasks.test.ts`, 31 in total.
- `samples/testbed/config/jest.setup.js`: a `structuredClone` polyfill for jsdom.
- `libraries/ts-agent-tasks/src/test/unit/journey/publicJourney.test.ts`: six tests through the
  public barrel. Nothing in `src/packlets` or `perf/` changed.
- `samples/testbed/package.json` now depends on `@fgv/ts-agent-tasks` (`workspace:*`). This is the
  package's first consumer outside its own directory.
- Change files for both packages, both `none`. Also updated: `docs/TECH_DEBT.md`, the plan's P1
  line and the ledger. The `docs/TECH_DEBT.md` diff also carries the user's 2026-10-01 decision
  closing M1's 1,000-task profile question ("keep the default profile as shipped"). result.md does
  not mention that change.

## Decisions made during execution

- **Assertion split.**
  - Existing library suites own each behaviour in isolation.
  - `journey/` owns only the six compositions an independent sweep found unpinned:
    - step 1's view-level dedup
    - step 4's terminal update owed after the task leaves open work
    - step 5's reassignment with reopen, `lookupSource` and B's baseline
    - step 7's host-resolved blocker, then release and resume
    - step 8's four recovery outcomes after a reopen
    - step 9's foreign receipt beside an outstanding handoff
  - The scenario's tests own "composes from outside the package".
  - The CLI smoke owns registration and output.
  - The whole journey is not duplicated across these homes.
- **The core and the bootstrap.** `index.ts` only renders. `IWorldOptions.executor` is a factory,
  so tests can substitute a broken executor and show the checks bite.
- **Crash claims are not made here.** The journey's reopen is a clean close-and-open. Crash
  survival rests on the package's fault-injection suites, listed in result.md.
- **Revert rows remove every layer.** P1-4, P1-5 and P1-6 first mutated one check each and stayed
  `0 red`. The package guards each of those properties twice, so the rows now remove both layers.
- **Pass logic is tightened.** Validity comes from the conversion `Result`, never a sentinel.
  Non-finite numbers, functions and symbols are refused at any depth. A guard pins all 105 checks
  by value. These changes came from Copilot rounds 1 and 2.

## Followups

All five are recorded in `docs/TECH_DEBT.md` (P3):

1. **`structuredClone` is an undocumented runtime requirement** (finding 1).
2. **Query work is observable only through `packlets/storage/internals`** (finding 2). The missing
   piece is an exported read-only work counter.
3. **ai-assist has no per-call transport, so capture replaces `globalThis.fetch`** (finding 3).
4. **Fold rows `P1-1…P1-10` into `perf/mutationMatrix.js`.** Its trigger ("M1 lands, or cluster
   close") has fired.
5. **A flaky `ts-extras` KeyStore Argon2id test** seen in the repo-wide run.

result.md's "What the cluster still owes" listed M1's stop-state cohort as in flight. It has since
shipped (`agent-tasks-m1-stop`, #708).

## Lessons codified during the run

None were written into `.ai/instructions/`. Observations recorded in result.md:

- **A `0 red` row can protect nothing.** Two layers guard the property, so removing one changes no
  behaviour. This is the sibling of the brief's "green row protecting the bug" trap.
- **The recorder's pass logic is where both Copilot highs and both layer-1 coverage defects
  landed.** One defect was `Result.orDefault`, which treats a successful `null` as absent.
- **The brief's Copilot guidance did not hold.** The bare `@copilot review` comment did nothing in
  50 minutes, and the API request worked.
- **Run testbed tests through `heft test` / `rushx test`.** A plain `npx jest` defaults to the node
  environment and hides the jsdom `structuredClone` gap (`state.md`).

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Revert matrix: `p1Matrix.js` (rows `P1-1…P1-10`; `--pkg` and `--testbed` copies, never the
  workspace)
- PR: [#709](https://github.com/ErikFortune/fgv/pull/709)
- Related streams: `agent-tasks-i2`, `agent-tasks-i1c`, `agent-tasks-i1d`, `agent-tasks-t5`,
  `agent-tasks-t6`, `agent-tasks-t7`, `agent-tasks-t9`, `agent-tasks-m1-stop`
