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
| Change `captureAsyncResult` to return `AsyncResult<T>`, not `Promise<Result<T>>` | `AsyncResult` is already `@public` and `PromiseLike<Result<T>>`. The factory should return the canonical chainable shape so callers don't have to seed synthetic chains. |
| Type-compatible at all 86 call sites — no required call-site changes | Verified: zero non-test call sites chain `.then` / `.catch` / `.finally` directly on `captureAsyncResult`'s return. All use `await`, which still works because `AsyncResult` implements `PromiseLike<Result<T>>`. |
| Opportunistic call-site cleanups in-scope but bounded (~5-15 sites max) | Several call sites currently `await captureAsyncResult` then seed a synthetic chain — those are the targets. Don't refactor every `await` site; `await` remains valid. Keep the PR focused. |
| Out of scope: other `@fgv/ts-utils/base` chain-seam changes | If `captureResult`/other helpers have the same pattern, surface as follow-ups. Don't bundle. |
| Single PR onto integration branch + squash to release | Standard posture for `@fgv/ts-utils` changes (established surface; clean release history). Same as `private-key-storage`, `logging-observability`, `messages-log-levels`. |
| Mandatory `code-reviewer` run on final diff | Per L32 (lessons-pending, surfaced from PR #427's six-round Copilot loop). This stream is exactly the focused-diff shape where pre-PR `code-reviewer` shines. |
| **Brief amendment 2026-05-30 — widen `AsyncSuccessContinuation` / `AsyncFailureContinuation` to `PromiseLike<Result<...>>`** | Surfaced by the implementing agent during the verify sweep. Concrete site: `encryptedFilePrivateKeyStorage._importPrivateKey` needed an `async (jwk) =>` coercion wrapper to pass a `captureAsyncResult` return through the old `Promise<Result<...>>` continuation slot. The continuation aliases are the consumer half of the contract this stream is changing on the producer side; updating only the producer leaves the API self-hostile. Cascade-completeness reasoning. Strictly additive — every existing `Promise<Result<TN>>`-returning callback still satisfies `PromiseLike<Result<TN>>`; zero call-site type-error risk. Implementation-neutral — `thenOnSuccess` / `thenOnFailure` bodies already `await` the callback. PR scope expanded from one function + tests + api-extractor to one function + two type aliases + tests + api-extractor + revert of any `async (x) =>` coercion wrappers introduced or surfaced. |

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
| 2026-05-30 | Brief amended — widen async continuation type aliases | Implementing agent surfaced the producer/consumer asymmetry; widened scope to include `AsyncSuccessContinuation` / `AsyncFailureContinuation` parameter-type widening to `PromiseLike<Result<...>>`. See decisions-log row for full reasoning. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
