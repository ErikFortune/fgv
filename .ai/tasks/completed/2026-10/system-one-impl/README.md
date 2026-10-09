# system-one-impl — Phase C: `@fgv/ts-extras-system-one`

**Shipped**: 2026-10-08 via [PR #721](https://github.com/ErikFortune/fgv/pull/721) into `integration/system-one-decisions` (finalized at the system-one-decisions cluster close, 2026-10-08).

## Summary

Phase C built slice S1 of `docs/design/system-one-decisions/implementation-plan.md`: a new
Result-integration-boundary package over the TypeSafe System-1 SDK (`@typesafe-ai/sdk` `~0.6.0`).
`createSystemOneClient` picks the backend by `baseUrl` plus `model`; `askSystemOne` sends typed
`noul` / `choice` / `score` questions, refuses at a mandatory `inputLimit` before any request,
validates the answers and returns them without `confidence`, plus `meta` (model, usage, `elapsedMs`,
request id, timing headers). `listSystemOneModels` and `measureSystemOneInput` complete the surface.
97 unit tests run the real SDK through its `fetch` seam, with no module mocks and 100% coverage with
no `c8 ignore`. The revert matrix has 97 rows, all VERIFIED. All four orchestrator beliefs held.

## Files changed

- `libraries/ts-extras-system-one/` (new): `src/` (`types`, `measure`, `logging`, `classify`,
  `shapes`, `validate`, `client`, `index`), tests, `perf/mutationMatrix.js`,
  `perf/systemOneLive.js`, `perf/systemOneLive.selftest.js`, `perf/parityQuestions.json`,
  `README.md`, `CAPABILITIES.md`, `etc/ts-extras-system-one.api.md`.
- `rush.json`; lockfile through `rush add` only; a `minor` change file.
- `LIBRARY_CAPABILITIES.md` (row and shortcut), `ACTIVE_DEVELOPMENT.md` (row),
  `.ai/conventions/result-integration-boundary.md` (reference instance, direct-dependency list).
- Status lines in `design.md`, `implementation-plan.md` and `docs/WORKSTREAMS.md`.
- **At the cluster close:** `result.md` gained the L1 record (§ "L1, recorded 2026-10-08"), and the
  relative link depth in all four streams' `result.md` was fixed after the move to `completed/`.

## Decisions made during execution

All 32 are numbered in `result.md` § Deviations. The load-bearing ones:

- **`measureSystemOneInput` returns a `Result`.** The plan said "pure; cannot fail", but malformed
  JavaScript input threw (deviation 15). `askSystemOne` never rejects.
- **A `score` legend is projected from the request's rubric**, not taken from the server, so the
  SDK's literal legend type is true by construction (deviation 1, code-reviewer P1-1).
- **No failure message quotes the server's body or a received value.** The SDK's `APIError.message`
  carries up to 200 raw body characters, so non-2xx failures name the error class, status and request
  id, at the cost of the server's own explanation (deviations 16, 20, 21).
- **Every input is converted and read once** (deviations 22, 28). Every `EntryType` is checked as
  JSON with `@fgv/ts-json-base`'s `jsonValue`, now a direct dependency (25). An own `__proto__` key is
  refused at any depth (27, 32).
- **The factories stay the SDK's own constructors**, decided by the orchestrator on 2026-10-08
  (deviation 24). The SDK's `score` does throw on non-list criteria, which corrects a premise.
- **Plan rows that could not hold as written:** R22 was retargeted to `usage` (6), and R15–R17's
  validator order was chosen so that each row has one guard (7).

## Live evidence

**L1 passed on 2026-10-08** against hosted Jev (`https://api.typesafe.ai`, `jev-latest` answering
as `jev-1.13.0`), via `perf/systemOneLive.js probe` in `'unchecked'` mode.

- The request was accepted, the body passed every § 3.6 check, and `/v1/models` unwrapped.
- An unknown model got `400`, classified `invalid-request` (CLM uses `422`; both classify the same).
- The remote was hosted Jev only. This is not evidence about CLM's weights or any other server.
- Jev sent neither `server-timing` nor `x-clm-latency-ms`, so `meta` has no timing headers.
- Jev's `score` is fractional: `1.73` = Σ level·p over the returned distribution. This confirms live what the SDK already documents ("Expected score, which may fall between integer rubric levels"); recorded as E36.

**L2–L5 were not run live** (Olares `clm-serve`, `/tokenize` windows, Ollama probes, parity).
Decision U2 made one recorded L1 the only cluster-close gate.

## Followups

| item | where it went |
|---|---|
| `Converters.recordOf` / `jsonObject` / `jsonValue` mishandle an own `__proto__` key | `docs/TECH_DEBT.md` (cluster close), new P2 entry |
| `jsonValue` admits `Infinity` (a nested non-finite state is sent as `null`) | `docs/TECH_DEBT.md` (cluster close): the existing P3 from `agent-tasks-i2`, extended with this second consumer |
| L2–L5, OQ-8, OQ-10's Olares items, OQ-12 | `implementation-plan.md` live-check table and design §12; not in `TECH_DEBT.md` or `FUTURE.md` |
| OQ-5 (Jev semantics) | Still open in design §12 (L1's Jev findings are recorded under OQ-6 and E36) |
| Harness reads the unknown-model status from the package's own message segment, not a field | Recorded only in `result.md` (Copilot round 2) |
| Stale counts in the PR body left to the orchestrator | Recorded only in `result.md` (Copilot round 4) |
| Re-check `--check` patterns after the pre-commit prettier hook | Recorded only in `result.md` § "What the brief or the plan got wrong" |

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md` (deviations, revert-matrix output, review rounds, gates, L1 record)
- Plan: `docs/design/system-one-decisions/implementation-plan.md`
- PR: [#721](https://github.com/ErikFortune/fgv/pull/721)
