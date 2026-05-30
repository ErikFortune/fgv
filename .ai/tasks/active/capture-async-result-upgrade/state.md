# Stream state: `capture-async-result-upgrade`

**Status:** 🟢 ready to commission — substrate prep in flight
**Integration branch:** `capture-async-result-upgrade` (off `release`)
**Last updated:** 2026-05-30 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Single-PR change; signature flip + verify sweep + opportunistic call-site cleanups. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Implementation shape: wrap `func()` invocation in `try/catch`, return `new AsyncResult(func().then((v) => succeed(v)))` on success path, `AsyncResult.from(fail(...))` on synchronous-throw path | Both forms in the brief are correct; this one keeps the success path minimal (the constructor already catches promise rejection — no inner `.catch` needed) and routes the sync-throw case through the existing `AsyncResult.from` factory rather than constructing a `Promise.resolve(fail(...))` inline. |
| Refactor `_encryptAndWrite` chain seam to drop the `succeed(key).thenOnSuccess(...)` seed (the originally surfacing site) | The new chainable factory return is exactly what made this seed unnecessary — captureAsyncResult is now the chain head. |
| **(Out-of-brief widening, approved by orchestrator mid-stream)** Widen `AsyncSuccessContinuation<T, TN>` to `(value: T) => PromiseLike<Result<TN>>`, widen `AsyncFailureContinuation<T>` analogously, and widen `AsyncResult`'s constructor parameter from `Promise<Result<T>>` to `PromiseLike<Result<T>>` | Strictly additive at every call site (every existing `Promise<Result<TN>>`-returning callback satisfies `PromiseLike<Result<TN>>`; every existing `new AsyncResult(somePromise)` call still satisfies `PromiseLike`). The factory now returns `AsyncResult` — the continuation slots that consume async-Result-producing callbacks should accept that shape natively, not require an `async (x) =>` wrapper to coerce. Without this widening the API was internally inconsistent: factory hands you `AsyncResult`, `thenOnSuccess` refuses it. **Input-only widening**: only the callback's *accepted* return type widens; `thenOnSuccess`/`thenOnFailure` still *return* `AsyncResult<TN>`, so chaining is unaffected. |
| Continuation types use `PromiseLike<Result<TN>>`, not the enumerated union `Promise<Result<TN>> \| AsyncResult<TN>` (revised after first shipping the union) | The union was redundant: `AsyncResult<TN>` already `implements PromiseLike<Result<TN>>`, so `Promise<...> \| AsyncResult<...>` is a *narrower* enumeration of two specific `PromiseLike` implementers that arbitrarily excludes every other thenable-resolving-to-Result, for no implementation reason (the bodies funnel through `Promise.resolve(...)` / `await`, which accept any `PromiseLike`). `PromiseLike<Result<TN>>` is simpler, strictly more general, and matches the `PromiseLike` constructor widening — one consistent shape across the async-Result callback surface. Still strictly additive over the union (every member of the union is a `PromiseLike`). |
| Simplify the `(await captureAsyncResult(...)).onSuccess(...)` parenthesized seam in `safeguardEngine.ts` to `await captureAsyncResult(...).onSuccess(...)` | The chainable return lets the `.onSuccess` move before the await, dropping a pair of parentheses. Purely mechanical. |
| `_importPrivateKey` callback: kept as sync arrow (no `async` wrapper) | Initially needed an `async (jwk) =>` wrapper to coerce `AsyncResult<CryptoKey>` through the old `Promise<Result<TN>>` slot. With the continuation-type widening above the wrapper is unnecessary and was reverted. Counts as a self-caused cleanup in the opportunistic tally, not a discovered-pre-existing-awkwardness. |
| Change `captureAsyncResult` to return `AsyncResult<T>`, not `Promise<Result<T>>` | `AsyncResult` is already `@public` and `PromiseLike<Result<T>>`. The factory should return the canonical chainable shape so callers don't have to seed synthetic chains. |
| Type-compatible at all 86 call sites — no required call-site changes | Verified: zero non-test call sites chain `.then` / `.catch` / `.finally` directly on `captureAsyncResult`'s return. All use `await`, which still works because `AsyncResult` implements `PromiseLike<Result<T>>`. |
| Opportunistic call-site cleanups in-scope but bounded (~5-15 sites max) | Several call sites currently `await captureAsyncResult` then seed a synthetic chain — those are the targets. Don't refactor every `await` site; `await` remains valid. Keep the PR focused. |
| Out of scope: other `@fgv/ts-utils/base` chain-seam changes | If `captureResult`/other helpers have the same pattern, surface as follow-ups. Don't bundle. |
| Single PR onto integration branch + squash to release | Standard posture for `@fgv/ts-utils` changes (established surface; clean release history). Same as `private-key-storage`, `logging-observability`, `messages-log-levels`. |
| Mandatory `code-reviewer` run on final diff | Per L32 (lessons-pending, surfaced from PR #427's six-round Copilot loop). This stream is exactly the focused-diff shape where pre-PR `code-reviewer` shines. |

---

## Origin

Surfaced in `.ai/tasks/completed/2026-05/private-key-storage/result.md` Follow-ups: the implementation agent for `private-key-storage` hit the awkward chain seam in `encryptedFilePrivateKeyStorage._encryptAndWrite` (a `succeed(key).thenOnSuccess(() => captureAsyncResult(...))` seed). Routed to `docs/TECH_DEBT.md` as P3 in PR #430, then commissioned here at Erik's direction ahead of the -33 publish so the cleanup lands in the same alpha as `ts-app-shell-styling-hardening`.

`@fgv/ts-utils` is established surface — per `ACTIVE_DEVELOPMENT.md` this is "handle with care." The change is additive in practice (all 86 call sites continue to compile and execute identically), but the lockstep policy means the monorepo-wide rebuild+test sweep is the gating cost. That's what this stream is for: not "ship the one-line change" but "ship the one-line change plus the verify sweep that proves it's safe."

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-29 | Surfaced in `private-key-storage` result.md | Concrete chain-seam in `_encryptAndWrite`. |
| 2026-05-30 | Routed to `docs/TECH_DEBT.md` P3 | Cluster-close PR #430. |
| 2026-05-30 | Stream commissioned + substrate prep | brief + state + WORKSTREAMS + integration branch + substrate PR. |
| 2026-05-30 | Implementation complete | Signature flip + opportunistic refactor of `_encryptAndWrite` chain seam + `safeguardEngine` `.onSuccess` parenthesization + `async`-wrap of `_importPrivateKey` callback. Full `rush build` + `rush test` green monorepo-wide (one unrelated pre-existing `mutableFsTree` permission-denied test fails on `release` too — root-uid container bypasses `chmod` read-only enforcement). ts-utils + ts-extras + ts-prompt-assist lint clean; ts-utils coverage 100%. api-extractor report regenerated; minor rush change file added. TECH_DEBT P3 entry retired. |
| 2026-05-30 | API-shape widening layered on (orchestrator-approved mid-stream) | Widened `AsyncSuccessContinuation`/`AsyncFailureContinuation` to accept `Promise<Result<...>> \| AsyncResult<...>` and `AsyncResult`'s constructor to accept `PromiseLike<Result<T>>`. Lets `.thenOnSuccess((x) => captureAsyncResult(...))` typecheck directly — reverted the temporary `async (jwk) =>` wrapper in `_importPrivateKey`. Strictly additive at every call site; api-extractor report regenerated to include all three widenings. Full `rush build` + `rush test` re-run green (same unrelated `mutableFsTree` permission-denied failure). |
| 2026-05-30 | Continuation types simplified to `PromiseLike<Result<TN>>` | Dropped the redundant enumerated union (`AsyncResult` already implements `PromiseLike`); the continuation surface now speaks one shape consistent with the `PromiseLike` constructor widening. Input-only change — `thenOnSuccess`/`thenOnFailure` still return `AsyncResult<TN>`, chaining preserved. api-extractor report regenerated; ts-utils lint clean + 100% coverage; full `rush build` green, `rush test` re-run (same unrelated `mutableFsTree` failure). |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
