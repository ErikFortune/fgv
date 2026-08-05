# Result — `safer-fetch-s3`

**Branch:** `safer-fetch-s3` (from `release` @ `b392e1534`; rebased onto `63ed98d0` after the
parallel-stream brief note landed). Code commits: `f8b0de5b`, `05f424b8`.

## Summary

Closed out the safer-fetch series. Retry ships per design §11 — off by default, with the
retryable and never-retryable sets, `GET`/`HEAD`-only unless `retryNonIdempotent`, `Retry-After`
honored on 429/503 and clamped to `maxDelayMs`, exponential backoff with full jitter, the overall
deadline as ceiling, and every attempt a full re-walk from hop 0 with no cached verdict and no
resumed chain. Redirect loop detection moved to after the address guard clears the hop, so both
sides of the comparison are guard-cleared URLs and the `KNOWN LIMIT` inherited from #599 is gone.
The Result-chaining pass introduced a `_raced` boundary helper that folds the
stopped/refused/cleared ladder into one chainable `DetailedResult`, and split `_clearAddress` out
of `_connect` — the same restructure deliverable 2 needed, done once. `@fgv/ts-web-extras` gained
a `safer-fetch` packlet that states its three structurally-absent guarantees rather than
degrading around them. The §5.4 guarantee table is in both READMEs, reconciled against what
actually shipped; the `LIBRARY_CAPABILITIES.md` entry is in, deliberately not in the
Result-integration-boundary list; a `safer-fetch-guard` testbed scenario drives the Node path
against a real socket. The design doc's status line now reads **fully implemented**, with an
Appendix D recording every divergence, and the ledger entry has moved to completed.

Two changes were not on the deliverable list and are called out because they change behaviour:
`blockPrivateNetworks` now requires `https:` unless `allowInsecureHttp` is set (OQ-4; the design
listed this default from the start but no shipped guard implemented it), and `DeadlineWatch` now
distinguishes an attempt-scoped stop from a terminal one (without which a `timeout` — the failure
retry exists for — could never be retried).

## Files changed

**`libraries/ts-extras`** — `packlets/safer-fetch/`: new `retry.ts`; `saferFetch.ts`
(`_raced`, `_clearAddress`, `_detectLoop`, `_walk`, `_runAttempt`, `_retryDelayMs`, `_execute`);
`deadline.ts` (`remainingMs`, `delay`, `attemptEnded`, the terminal/attempt-scoped split);
`defaults.ts` (five retry constants); `model.ts` (`ISaferFetchOptions.retry`);
`nodeAddressGuard.ts` (`allowHosts` / `allowPorts` / `allowInsecureHttp` + `_checkUrl`);
`index.ts` / `index.browser.ts`. Tests: new `retry.test.ts`, new `saferFetchRetry.test.ts`,
plus additions to `deadline.test.ts`, `nodeAddressGuard.test.ts`, `saferFetchRedirect.test.ts`.
`etc/ts-extras.api.md` regenerated. `README.md` §safer-fetch.

**`libraries/ts-web-extras`** — new `packlets/safer-fetch/` (`browserSaferFetch.ts`, `index.ts`);
`src/index.ts`; new `test/unit/browserSaferFetch.test.ts`; `etc/ts-web-extras.api.md`
regenerated; new `README.md`.

**`samples/testbed`** — new `scenarios/saferFetchGuard/` (`index.ts` + testable
`saferFetchDemo.ts`), registered in `scenarios/index.ts`; new
`test/unit/scenarios/saferFetchGuard.test.ts`; `config/jest.config.json` (the CLI wrapper joins
the existing ignore list, matching the `sqliteVec*` precedent); scenario-registry snapshot.

**Docs** — `.claude/project/fetch-primitive-threat-model.md` (status line + new Appendix D),
`.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/WORKSTREAMS.md`, change files for both
libraries.

## Gates

| Command | `@fgv/ts-extras` | `@fgv/ts-web-extras` | `testbed` |
|---|---|---|---|
| `rushx build` | ✅ | ✅ | ✅ |
| `rushx lint` | ✅ | ✅ | ✅ |
| `rushx fixlint` (before final commit) | ✅ | ✅ | ✅ |
| `rushx test` | ✅ 2,673 passing | ✅ 532 passing | ✅ 489 passing |
| Coverage | ✅ 100% stmts/branches/funcs/lines | ✅ 100% (branch threshold 95) | ✅ 100% |

**No `c8 ignore` directives** anywhere in either packlet — the property #599 established is
preserved. The last two gaps were closed by fixing the code rather than the measurement: the
`try`/`finally` in `_execute` became `captureAsyncResult` (which is also the right primitive, and
makes a throwing caller-supplied `logger` a `Result` rather than an escaped exception), and the
infinite retry loop became a recursive `_runAttempt` whose every path returns.

## Observability self-audit

`grep -rn "console\." ` across `libraries/ts-extras/src/packlets/safer-fetch/`,
`libraries/ts-web-extras/src/packlets/safer-fetch/` and
`samples/testbed/src/scenarios/saferFetchGuard/` — **zero hits**. Diagnostics go through the
injected `Logging.ILogger` (defaulting to `NoOpLogger`); the testbed scenario uses
`context.logger`. `grep -rn ": any\|as any"` over the same paths — **zero hits**.

## Convention-compliance sweep (`CODE_REVIEW_CHECKLIST.md`)

- **P1 type safety** — no `any`; no manual type checking with unsafe casts; no double casts. Test
  data uses the sanctioned `as unknown as T` form for intentionally-invalid values (a `null`
  retry policy, a detail-less failure, a non-`Error` throw).
- **P1 Result pattern** — every fallible operation returns `Result<T>` / `DetailedResult<T,
  FetchFailureReason>`. No `orThrow()` outside test setup. `captureAsyncResult` at the one place
  a collaborator could throw.
- **P1 security** — no secrets. Input validated at the boundary (`_resolveCallOptions`,
  `resolveRetryPolicy`, `_checkUrl`). The failure taxonomy's scanning-oracle warning is repeated
  in both READMEs and on both packages' entry points.
- **P2 chaining** — the per-hop helpers now chain; `_walk`'s hop loop and the option-resolution
  functions stay imperative, which is the sibling pattern and the brief's own exception.
- **P2 error context** — every failure names the URL, hop, guard, or limit involved.
- **P3 `??` over `||`**, naming consistency, TSDoc: `{@link}` used only for symbols the package
  itself exports; the browser packlet refers to `classifyAddress` and friends with plain code
  spans, per the cross-package rule.

## Sibling sweep

**Browser packlet vs `crypto-utils` / `file-tree`.** Matches the established cross-runtime shape:
a namespace export (`SaferFetch`, like `CryptoUtils`) rather than a star export, so a call site's
runtime is legible at the import; the Node half stays in `@fgv/ts-extras` and this package
implements/wraps only the browser side; the packlet barrel carries the non-guarantees in its
`@packageDocumentation`, as `crypto-utils/index.browser.ts` does. One deliberate divergence:
`crypto-utils` re-exports `HpkeProvider` unchanged, while this packlet wraps rather than
re-exports — because the wrapper's whole reason to exist is refusing an option the runtime cannot
honor, which a re-export could not do.

**`retry.ts` vs its packlet siblings.** Pure functions plus a `resolve*` boundary, matching
`addressPolicy.ts` and `redirect.ts`; validation is imperative early-return like
`_resolveCallOptions`; internals are `@internal` and unit-tested by direct module import with the
packlet-mechanics eslint escape the sibling `deadline.test.ts` already uses.

**Testbed scenario vs `sqliteVec*` / `localEmbeddingSearch`.** Same split: a testable core with
injected dependencies (`import type` only, so nothing Node-only enters the browser graph) and a
thin CLI wrapper behind `webpackIgnore` dynamic imports, with the wrapper on the jest ignore list.

## Open questions resolved

- **OQ-1 — declined the recommendation.** The browser path keeps `redirect: 'manual'` rather than
  switching to `'error'`. The guarantee is identical either way — a manual redirect in a browser
  is opaque and is then rejected — but `'error'` rejects the promise with a generic `TypeError`
  indistinguishable from a DNS failure, so the taxonomy would report `'network'` and lose the
  fact that a redirect was the cause. For a primitive whose structured taxonomy is itself a
  deliverable, that is the wrong trade. §5.4's row is restated in both READMEs as
  "✅ (enforced; surfaces as `'redirect-opaque'`)", so the table and the code agree. Design
  Appendix D-a.
- **OQ-2 — taken as recommended.** The browser entry points refuse `'validate-each-hop'` at
  option resolution with a message naming the runtime. Appendix D-f.
- **OQ-3 — taken as recommended.** `classifyAddress` and the pure policies now ship from the
  browser barrel, with an explicit note that they cannot substitute for the resolved-address
  guard. Appendix D-g.
- **OQ-4 — taken, with one part declined.** `allowHosts` / `allowPorts` / `allowInsecureHttp`
  added, so §13 L6's Ollama example is literally runnable and has a test asserting exactly that.
  §12's `{443}` port **default** was not adopted: it would reject `https://api.example.com:8443/`
  — a common public endpoint — with a `'blocked-by-guard'` failure that reads as an SSRF block.
  `allowPorts` restricts when supplied and does not restrict when absent. Appendix D-c.

## Review loop

**Layer 1 — `code-reviewer` on the final diff, before the coverage-closure pass.** No P1. One
P2: `DeadlineWatch._inBodyPhase` was stale across the inter-attempt backoff, so an
overall-deadline expiry during a retry sleep reported `timeout.phase: 'body'` while no bytes were
in flight — diagnostics-only, but `phase` is part of the taxonomy's contract. Fixed in `05f424b8`
with a regression test. Three P3s: a log line that can fire in a narrow race where the retry then
does not happen (dispositioned — the line describes intent, and the returned failure is correct);
`_walk`'s hop loop still reads imperatively (dispositioned — the brief's own exception for loop
control flow, and the per-hop helpers it calls do chain); and a note that OQ-1 departed from the
brief's recommendation (already recorded, above and in Appendix D). The reviewer independently
re-derived the retry/guard/deadline interactions and found no cross-attempt leak of a guard
verdict, redirect chain, stripped header, or `Retry-After`.

**Ordering was load-bearing here, exactly as the brief predicted.** The coverage pass that
followed found two gaps, and in both cases the right answer was to change the code rather than
the measurement — a `c8 ignore` on either would have preserved a `try`/`finally` that should have
been `captureAsyncResult` and an infinite loop that should have been a recursive call.

**Layer 2 — Copilot.** Requested on the PR; see the PR thread for the per-round record.

## Deviations from the brief

- **OQ-1's recommendation declined**, with reasoning above and in Appendix D-a. The brief
  explicitly allowed this ("update §5.4 if you conclude otherwise").
- **§12's `{443}` port default not adopted** while the rest of OQ-4 was. Appendix D-c.
- **`docs/WORKSTREAMS.md` edit is larger than "section-local"** — this stream's entry moved from
  the in-flight section to Completed, which the brief's acceptance criteria require. Nothing
  outside that entry was reflowed or reordered, so the parallel `agent-memory-ingest-dedup-scope`
  stream's edits should still merge cleanly.
- **`libraries/ts-web-extras/README.md` created** rather than edited: the package had none, and
  the guarantee table needed somewhere to live.
- **`DeadlineWatch` gained an attempt-scoped/terminal distinction** not anticipated by design §10.
  It is an implementation consequence of §11 making `timeout` retryable, recorded as Appendix D-h;
  the caller-visible contract is unchanged.

## Open questions for downstream

1. **The browser suite cannot construct a `Response`.** jsdom ships no Fetch API globals and no
   `undici` is available, so `browserSaferFetch.test.ts` drives a *failing* scripted transport and
   asserts the wrapper's own two jobs; response-handling semantics are covered in `@fgv/ts-extras`
   where the globals exist. If a future stream wants true end-to-end browser assertions, the
   options are a `undici` devDependency or a jest project with a node environment for that file —
   both are a dependency/config decision rather than a code one, so this stream did not take it.
2. **DNS rebinding remains open**, as designed. The seams (`IGuardVerdict.pinnedAddress`,
   `IFetchTransport`) are in place and `platformFetchTransport` still fails rather than ignoring
   a pin. Retry makes the mitigation advice sharper, not weaker: a strict `allowHosts` list is
   now expressible on the shipped guard.
3. **The four `ai-assist` `fetch(` sites are still unmigrated** (D-4, deferred, explicitly
   out of scope here).
