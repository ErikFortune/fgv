# Brief — async Result family (`@fgv/ts-utils`)

**Spec:** `.claude/project/async-result-family-design.md` (merged, #595). It is authoritative
and **all five open questions are resolved** — implement the resolutions, do not relitigate
them. This brief adds scope boundaries and gates only.

**Branch:** `async-result-family` from `origin/release`. PR into `release`. **Do not merge.**

**Estimate:** ~1 session. The scheduler is the only novel logic; the folds are near-copies of
their sync siblings against a different input shape.

---

## Scope

`@fgv/ts-utils`, `base` packlet, alongside the existing `mapResults.ts` family.

**Five bounded-parallel collectors**, each mirroring its sync sibling's name, parameter order
and fold, each with both a thunk form and an `(items, fn)` overload (§ 3, OQ-3):
`mapResultsAsync`, `mapDetailedResultsAsync`, `mapSuccessAsync`, `mapFailuresAsync`,
`allSucceedAsync`.

**Two transitively-async members**, serial by contract, **taking no `IAsyncResultOptions`**
(§ 2c): `populateObjectAsync`, `firstSuccessAsync`.

**One scheduler** behind the five collectors. Plus `AsyncDeferredResult<T>`,
`AsyncFieldInitializers<T>`, `IAsyncResultOptions`, and the exported default-concurrency
constant.

## The things most likely to ship subtly wrong

- **Results stay in input order** regardless of completion order, for all five collectors.
  Out-of-order results are a silent correctness trap for anyone zipping them against inputs.
- **The bound must actually bind.** A test must prove that with `concurrency: n` over `m > n`
  operations, observed peak in-flight never exceeds `n`. Instrument the work functions and
  assert the peak — do not infer it from timing, which is flaky.
- **The default must be finite.** An unbounded default reproduces the exact bug the primitive
  exists to prevent.
- **`map*` keeps scheduling after a failure and aggregates every error**, matching the sync
  contract. `allSucceedAsync` deliberately does *not* short-circuit — consistency with
  `allSucceed` beats a faster failure path. Both need a test that says so, since both look like
  missed optimizations.
- **A rejected promise from a work function is a `Failure`, not a throw.** Use
  `captureAsyncResult`. A thunk that throws synchronously must also be captured. This is the
  exact class of defect an independent review just caught in the safer-fetch core (#594), where
  one un-captured promise in a loop escaped as an exception from an API documented to always
  return a `Result`.
- **An empty input** yields success with an empty array — match the sync siblings exactly.
- **`aggregatedErrors` threading** matches the sync family's behaviour.

## Explicitly NOT in scope

- **Cancellation / `AbortSignal`.** Resolved as deferred (OQ-4); retrofitting is safe. Do not
  add a `signal` field, and do **not** pre-widen `AsyncDeferredResult` defensively.
- **Retry, timeout, backoff** inside the scheduler. A scheduler that also retries is two
  primitives wearing one coat.
- **A first-to-settle variant.** That is `Promise.any` with `Result` folding — a distinct
  primitive nobody has asked for.
- **Migrating the in-repo hand-rolled call sites** (`HybridRetriever`, the prompt-assist
  observer fan-out, the bcp47 registry loader). Separable follow-up; leave them alone.

## Release tags

Everything `@public` (OQ-5), **not `@beta`**. The whole release line is pre-release, so `@beta`
adds no information — and PR #588 established the cost: a `@public` signature referencing a
`@beta` type bakes `ae-incompatible-release-tags` warnings into the checked-in `api.md`.
Promoting `DetailedResult` removed 168 of them. Do not manufacture new ones.

## Documentation — required, not optional

Update **`.ai/instructions/LIBRARY_CAPABILITIES.md`** in this PR: the `@fgv/ts-utils` `base`
packlet row, plus a "Decision shortcuts" entry along the lines of *"N independent async
`Result`-returning operations with a concurrency bound?"*. Make the thunk-vs-`(items, fn)`
choice and the transitively-async distinction findable, and state that materialized promises
cannot be bounded — that misunderstanding is what produced this design.

A capability that ships without a `LIBRARY_CAPABILITIES` entry gets reimplemented by the next
consumer. Four of five features in the last tranche shipped without one and needed a catch-up
pass; do not add a fifth.

## Gates

- `rushx build`, `rushx lint`, `rushx test` at 100% coverage in `ts-utils`
- `rushx fixlint` before the final commit
- `etc/ts-utils.api.md` regenerated, **no new `ae-incompatible-release-tags` and no new
  "does not have an export" `ae-unresolved-link` warnings**
- Rush change file (`minor` — new public API surface)
- `code-reviewer` agent on the final diff **before** any coverage-closure pass, per
  `TESTING_GUIDELINES.md` § "Coverage Gap Resolution"
- Copilot loop driven to diminishing returns; stop reason recorded on the PR

**If no agent-spawn tool is available, do not block on it** — both safer-fetch streams hit this.
Do a manual pass against `CODE_REVIEW_CHECKLIST.md`, say so explicitly in the PR, and note that
an independent pass may be wanted. If you spawn a sub-agent and it goes quiet, proceed rather
than waiting.

**Commit and push early and often.** A stream is not done when you go quiet — verify by branch
push and PR existence before reporting.
