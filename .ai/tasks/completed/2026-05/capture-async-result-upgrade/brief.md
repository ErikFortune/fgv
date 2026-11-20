# Stream brief: `capture-async-result-upgrade`

**Status:** 🟢 ready to commission
**Integration branch:** `capture-async-result-upgrade` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Package surface:** `@fgv/ts-utils` (`base/result.ts` + tests + api-extractor report) + monorepo-wide verify sweep (no behavioral changes expected at call sites)

---

## Mission

Upgrade `captureAsyncResult<T>` to return `AsyncResult<T>` instead of `Promise<Result<T>>`. Surfaced concretely during `private-key-storage` (`encryptedFilePrivateKeyStorage._encryptAndWrite`) where the bare-Promise return forced an awkward `succeed(key).thenOnSuccess(() => captureAsyncResult(...))` chain seed.

`AsyncResult<T>` is already `@public`, in the api surface, implements `PromiseLike<Result<T>>`, and is the canonical chainable async-Result type. Today the factory hands back a bare `Promise<Result<T>>` so callers can't fluently chain (`.onSuccess` / `.thenOnSuccess` / `.withErrorFormat`) off a `captureAsyncResult(...)` result — they must `await` and re-wrap, or seed a synthetic chain. After this change, callers can chain directly.

Reference (entered as `docs/TECH_DEBT.md` P3 in PR #430):
> change return type to `AsyncResult<T>` (wrap the existing internal promise in `new AsyncResult(...)`). Type-compatible with all existing `await captureAsyncResult(...)` call sites (`AsyncResult` is `PromiseLike<Result<T>>`, so `await` still yields `Result<T>`). Additive/cleanup for the chained call sites.

---

## Locked design

### The change (one function in `libraries/ts-utils/src/packlets/base/result.ts`)

Current (lines 1520–1526):

```ts
export async function captureAsyncResult<T>(func: () => Promise<T>): Promise<Result<T>> {
  try {
    return succeed(await func());
  } catch (err: unknown) {
    return fail(_errorMessage(err));
  }
}
```

After — leveraging the existing `AsyncResult` constructor, which already catches promise rejection and converts to `Failure` (see `result.ts:1365-1367`):

```ts
export function captureAsyncResult<T>(func: () => Promise<T>): AsyncResult<T> {
  return new AsyncResult(func().then((value) => succeed(value)));
}
```

The `AsyncResult` constructor's catch path subsumes the prior `try/catch` — synchronous throws inside `func()` itself still need to be caught, so the implementation may need to wrap the `func()` invocation in a `try`:

```ts
export function captureAsyncResult<T>(func: () => Promise<T>): AsyncResult<T> {
  try {
    return new AsyncResult(func().then((value) => succeed(value)));
  } catch (err: unknown) {
    return AsyncResult.from(fail<T>(_errorMessage(err)));
  }
}
```

The agent decides the exact shape — both forms are correct; pick the simpler one that preserves the existing semantics. **Required behavioral guarantees:**
- Synchronous throw from `func()` → `AsyncResult` resolving to `Failure` (do **not** propagate as a synchronous throw).
- Promise rejection from `func()` → `AsyncResult` resolving to `Failure`.
- Promise resolution from `func()` → `AsyncResult` resolving to `Success` wrapping the value.
- Existing tests in `libraries/ts-utils/src/test/unit/base/result.test.ts` for `captureAsyncResult` must still pass (or be updated minimally if they assert on the return-type shape rather than the resolved value — `await result` should still yield the same `Result<T>`).

### Call-site compatibility (verified pre-commission)

Monorepo grep: 86 non-test, non-`lib/` references to `captureAsyncResult` across `libraries/`, `tools/`, `samples/`, `apps/`. **Zero** of them chain `.then` / `.catch` / `.finally` directly on the return value — all use `await`. Because `AsyncResult<T>` implements `PromiseLike<Result<T>>`, every existing `await captureAsyncResult(...)` site continues to compile and yields the same `Result<T>`. No call-site code change is **required** for compatibility.

### Opportunistic call-site cleanup (in-scope for this PR, but bounded)

A handful of call sites currently exhibit the chain-seam-awkwardness pattern this change is intended to relieve — they `await captureAsyncResult` and then either chain off the awaited `Result<T>` or seed a synthetic `AsyncResult` to keep chaining. The agent may opportunistically refactor those sites to chain directly off the new `AsyncResult<T>` return when the rewrite is mechanical and obvious.

**Scope guardrails:**
- Touch **only** sites where the new chainable return materially simplifies existing code (typically 5–15 sites at most across the monorepo).
- Do **not** rewrite every `await captureAsyncResult` site — `await` remains a perfectly valid usage pattern.
- Do **not** restructure surrounding logic; only swap the chain-seam shape.
- Refactor sites that the agent finds during the verify sweep; do not run an exhaustive search-and-rewrite pass.
- If a site needs more than ~10 lines of change to refactor, leave it alone and flag it in the PR description for follow-up.

### api-extractor

`libraries/ts-utils/etc/ts-utils.api.md` will regenerate to reflect the new return type **and** the widened continuation parameter types (see "Brief amendment" below). Commit the regenerated report.

### Brief amendment 2026-05-30 — widen `AsyncSuccessContinuation` / `AsyncFailureContinuation`

**Surfaced by the implementing agent during the verify sweep.** With `captureAsyncResult` now returning `AsyncResult<T>` (which is `PromiseLike<Result<T>>`, not `Promise<Result<T>>`), the existing continuation type aliases refuse direct passing of a `captureAsyncResult` return value to `.thenOnSuccess` / `.thenOnFailure`:

```ts
// Today
export type AsyncSuccessContinuation<T, TN> = (value: T) => Promise<Result<TN>>;
export type AsyncFailureContinuation<T>     = (message: string) => Promise<Result<T>>;
```

Concrete breakage observed at `encryptedFilePrivateKeyStorage._importPrivateKey`: `.thenOnSuccess((jwk) => captureAsyncResult(...))` no longer satisfies the slot, forcing an `async (jwk) =>` coercion wrapper to round-trip through `Awaited<>`. That wrapper is a smell — it's exactly the chain-seam awkwardness this stream exists to eliminate.

**In scope (added to this stream):** widen both continuation aliases to `PromiseLike<Result<...>>`:

```ts
export type AsyncSuccessContinuation<T, TN> = (value: T) => PromiseLike<Result<TN>>;
export type AsyncFailureContinuation<T>     = (message: string) => PromiseLike<Result<T>>;
```

This is:
- **Strictly additive at every call site.** Every existing `(value) => Promise<Result<TN>>` callback continues to satisfy `(value) => PromiseLike<Result<TN>>`. Zero call-site type-error risk.
- **Implementation-neutral.** The `thenOnSuccess` / `thenOnFailure` bodies already `await` the callback, and `await` works on `PromiseLike` unchanged. No body changes.
- **Cascade-completeness (lessons-pending L29-shaped reasoning).** The continuation aliases are the *consumer* half of the same contract this stream is changing on the *producer* side. Updating one without the other leaves the API self-hostile — "here's the canonical chainable async-Result, but you can't pass it to the chaining method." The "no other helpers" guardrail was about not bundling unrelated cleanups; these aren't unrelated.

**Required follow-through:** after the type widening lands, sweep call sites for now-removable `async (x) =>` coercion wrappers that existed to round-trip a `captureAsyncResult` return through the old `Promise<Result<...>>` slot. The `_importPrivateKey` site is the known one. Any others surface during the monorepo verify sweep. Count those reverts against the opportunistic-cleanup tally — they're in the "I caused this, I'm cleaning it up" sense, not the "found unrelated chain-seam awkwardness" sense.

**Rush change file expanded** to describe both deltas as the additive surface change.

### Rush change file

Add a `minor` rush change file for `@fgv/ts-utils` describing the additive surface deltas:

> `captureAsyncResult` now returns `AsyncResult<T>` instead of `Promise<Result<T>>`; `AsyncSuccessContinuation` / `AsyncFailureContinuation` widened from `Promise<Result<...>>` to `PromiseLike<Result<...>>`. Existing `await captureAsyncResult(...)` call sites unaffected (`AsyncResult` implements `PromiseLike<Result<T>>`); existing continuation callbacks unaffected (every `Promise<Result<TN>>` is a `PromiseLike<Result<TN>>`). New chainable surface for callers that want to keep the chain unbroken.

---

## Acceptance criteria

- [ ] `captureAsyncResult` signature changed to return `AsyncResult<T>`; behavioral guarantees above preserved.
- [ ] `AsyncSuccessContinuation<T, TN>` and `AsyncFailureContinuation<T>` widened to return `PromiseLike<Result<...>>` (per the 2026-05-30 brief amendment). Body of `thenOnSuccess` / `thenOnFailure` unchanged.
- [ ] Any `async (x) =>` coercion wrappers added during the stream (or discovered during the sweep) to round-trip a `captureAsyncResult` return through the old `Promise<Result<...>>` slot have been reverted now that the slot accepts `PromiseLike`.
- [ ] **`rush build` passes across the entire monorepo** — load-bearing sweep; the whole point is verifying the additive return-type change doesn't break any of the 86 call sites.
- [ ] **`rushx test` passes in every package that consumes `captureAsyncResult`** — this is the real compatibility evidence. Coverage stays at 100% in `ts-utils`.
- [ ] **`rushx lint` passes** in `libraries/ts-utils` (load-bearing — not transitively run by build).
- [ ] **`rushx fixlint` was run before the final commit.**
- [ ] api-extractor report (`libraries/ts-utils/etc/ts-utils.api.md`) regenerated and committed.
- [ ] `minor` rush change file added for `@fgv/ts-utils`.
- [ ] Existing `captureAsyncResult` tests in `result.test.ts` pass (update minimally if they assert on the return-type shape; `await result` semantics must be unchanged).
- [ ] Opportunistic call-site refactors (if any) are mechanical, minimal, and clearly motivated; flagged in the PR description.
- [ ] No `any` types; no `Result<void>`; Result-pattern conformance preserved.
- [ ] **`code-reviewer` agent run on the final diff** with findings resolved or dispositioned (per the lessons-pending L32 candidate gate — running early on a focused diff like this is exactly the case the gate is for).

## Out of scope

- **Exhaustive call-site refactor.** Only opportunistic, mechanical cleanups during the verify sweep.
- **Other `@fgv/ts-utils/base` surface changes** — this stream is narrowly scoped to `captureAsyncResult`. If other `Promise<Result<T>>`-returning helpers exist with the same chain-seam awkwardness, surface as separate follow-ups; don't bundle.
- **`AsyncResult` API additions or `captureResult` changes** — the sync sibling stays as-is.
- **Behavioral changes** — the resolved `Result<T>` after `await` must be byte-identical to today.
- **Documentation rewrites** beyond updating the TSDoc on the function itself to reflect the new return type.

---

## Reading list (start here)

1. `libraries/ts-utils/src/packlets/base/result.ts:1354-1510` — `AsyncResult<T>` class (already exists; constructor catches rejections; many chainable methods).
2. `libraries/ts-utils/src/packlets/base/result.ts:1520-1526` — current `captureAsyncResult` implementation.
3. `libraries/ts-utils/src/test/unit/base/result.test.ts` — existing test coverage for `captureAsyncResult` (preserve semantics).
4. `libraries/ts-utils/etc/ts-utils.api.md` — api-extractor report to regenerate.
5. `docs/TECH_DEBT.md` (P3 entry on `captureAsyncResult`) — the entry this stream retires.
6. `.ai/instructions/CODING_STANDARDS.md` — Result-pattern, lint, and Pre-PR Validation Checklist.

## Reference for design context

- `.ai/tasks/completed/2026-05/private-key-storage/result.md` Follow-ups § — the original surfacing, with the specific call-site (`_encryptAndWrite`) that motivated this.
- Lockstep version policy: a change in `@fgv/ts-utils` ships in the same alpha as every other package's changes; the monorepo-wide verify sweep is the cost of that policy.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
