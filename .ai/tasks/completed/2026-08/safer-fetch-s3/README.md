# safer-fetch-s3 — retry, the loop-detection restructure, and the browser packlet

**Status:** ✅ shipped — PR #601 against `release`, branch `safer-fetch-s3`.
**Closes:** the `fetch-primitive-threat-model` series (S1 #594, S2a #592 → #597, S2b #599, S3 #601).
**Package surface:** `@fgv/ts-extras` (`safer-fetch` packlet), `@fgv/ts-web-extras` (new `safer-fetch` packlet), `samples/testbed` (`safer-fetch-guard` scenario), plus `.ai/instructions/LIBRARY_CAPABILITIES.md`, both READMEs, and the design doc's status line + Appendix D.

## Mission

Finish the primitive: implement design § 11 (retry) in full, remove the `KNOWN LIMIT` on redirect
loop detection inherited from S2b, ship the browser half honestly rather than degraded, and make
the guarantee tables and capability docs describe what actually exists.

## What shipped

- **Retry (`retry.ts` + `_runAttempt`)** — off by default; retryable and never-retryable sets;
  `GET`/`HEAD` only unless `retryNonIdempotent`; `Retry-After` honored on 429/503 and **clamped to
  `maxDelayMs`** because it is attacker-controlled; exponential backoff with full jitter; retries
  consume the overall deadline rather than resetting it; and **every attempt re-walks from hop 0** —
  no cached guard verdict, no resumed chain, since a cached verdict would make retry its own
  DNS-rebinding amplifier.
- **Loop detection moved after the guard** (`_detectLoop`, `_clearAddress`) so both sides of the
  comparison are guard-cleared URLs. The inherited `KNOWN LIMIT` comment is gone, with a regression
  test driving a normalizing (trailing-dot-stripping) guard.
- **Result-chaining pass** — `_raced` folds the stopped/refused/cleared ladder into one chainable
  `DetailedResult`. Paired with the loop-detection work on purpose: both restructure `_connect`.
- **`@fgv/ts-web-extras/safer-fetch`** — `browserSaferFetchBytes` / `Text` / `Json`. `addressGuard`
  stays **required** so the absence is spelled at every call site; `redirectPolicy:
  'validate-each-hop'` is **refused at option resolution** naming the runtime, rather than accepted
  and failing at the first redirect.
- **Guarantee tables** in both READMEs (ts-web-extras had no README; created), the
  `LIBRARY_CAPABILITIES.md` entry — deliberately *not* in the Result-integration-boundary list —
  and a `safer-fetch-guard` testbed scenario driving the Node path against a real socket, including
  a `302` to `169.254.169.254` refused *at the hop*.

Two behaviour changes outside the deliverable list, called out because they are behaviour changes:
`blockPrivateNetworks` now requires `https:` unless `allowInsecureHttp` is set (OQ-4), and
`DeadlineWatch` distinguishes an attempt-scoped stop from a terminal one — without which a
`timeout`, the failure retry exists for, could never be retried.

## Outcome

- `rushx build` / `lint` / `test` green in all three packages; **100% coverage** with **zero
  `c8 ignore` directives**. Both remaining gaps were closed by changing the code rather than the
  measurement: a `try`/`finally` became `captureAsyncResult`, and an infinite retry loop became a
  recursive `_runAttempt` whose every path returns.
- **Layer 1** — `code-reviewer` on the final diff *before* the coverage-closure pass, per the
  brief's required ordering. No P1; one P2 (a stale `_inBodyPhase` across the backoff, mislabelling
  a `timeout`'s `phase`) fixed with a regression test; three P3s dispositioned. The ordering paid
  for itself exactly as predicted — see above.
- **Layer 2** — Copilot loop closed at **2 rounds** on the finding profile, not the round count.
  Round 1 found a real defect (`_checkUrl` admitted any scheme once `allowInsecureHttp` was set —
  unreachable through the shipped entry points, reachable on the public guard export), a demo step
  that proved the wrong thing, and four cross-namespace `{@link}`s baking `ae-unresolved-link`
  warnings into the checked-in api.md. Round 2 produced no new comments and only test-accuracy
  tightening.
- **Open questions:** OQ-2, OQ-3 and OQ-4 taken as recommended; **OQ-1 declined** — the browser
  path keeps `redirect: 'manual'` because `'error'` would degrade the failure reason from
  `'redirect-opaque'` to an undifferentiated `'network'`, and the structured taxonomy is itself a
  deliverable. §12's `{443}` port *default* was also not adopted (it would reject a public `:8443`
  endpoint with a failure reading as an SSRF block). Every divergence is recorded in the design's
  Appendix D.

## Left open, deliberately

1. **DNS rebinding**, as designed — the seams (`IGuardVerdict.pinnedAddress`, `IFetchTransport`)
   are in place and `platformFetchTransport` fails rather than ignoring a pin it cannot honor. A
   strict `allowHosts` list is the mitigation, and is now expressible on the shipped guard.
2. **The browser suite cannot construct a `Response`** — jsdom ships no Fetch API globals, so it
   drives a *failing* scripted transport and asserts the wrapper's own two jobs; response-handling
   semantics are covered in `@fgv/ts-extras` where the globals exist. Closing this is a
   dependency/config decision (`undici`, or a node-environment jest project), not a code one.
3. **The four `ai-assist` `fetch(` sites are unmigrated** (design D-4, explicitly out of scope).

## Artifacts

- [`brief.md`](./brief.md) — commissioning brief (scope, deliverables, four open questions).
- [`state.md`](./state.md) — live checkpoints during the run.
- [`result.md`](./result.md) — exit artifact: files changed, gates, sibling sweep, review loop,
  deviations, and the downstream open questions.
