# `capture-async-result-upgrade` — shipped

**Shipped:** 2026-05-30 via PR #433 (implementation) on integration branch `capture-async-result-upgrade`; squashed to `release` via the cluster-close PR.

**Package surface:** `@fgv/ts-utils` (`base/result.ts` — `captureAsyncResult`, `AsyncSuccessContinuation`, `AsyncFailureContinuation`, `AsyncResult` constructor) + api-extractor report + tests + opportunistic call-site cleanups in `@fgv/ts-extras` and `@fgv/ts-prompt-assist`.

---

## What shipped

Three coordinated additive surface changes that make `AsyncResult<T>` — already `@public` and `PromiseLike<Result<T>>` — the canonical chainable shape across the async-Result API. Before this stream, the factory and the chaining slots disagreed on shape: callers got `Promise<Result<T>>` from `captureAsyncResult` and had to seed synthetic chains (`succeed(x).thenOnSuccess(() => captureAsyncResult(...))`) or `async (x) =>` coercion wrappers to bridge into `.thenOnSuccess` / `.thenOnFailure`. After this stream, every piece of the contract speaks `PromiseLike` and the chains compose.

### Delta 1 — `captureAsyncResult` return type

```ts
// Before
export async function captureAsyncResult<T>(func: () => Promise<T>): Promise<Result<T>>

// After
export function captureAsyncResult<T>(func: () => Promise<T>): AsyncResult<T>
```

Strictly additive at every call site: `AsyncResult<T>` is `PromiseLike<Result<T>>`, so every existing `await captureAsyncResult(...)` continues to compile and yields the same `Result<T>`. Verified across 86 monorepo call sites by full-repo `rush build` + `rush test`.

Implementation chosen (from the two brief-approved shapes): wrap `func()` in `try/catch`, route the success path through `new AsyncResult(func().then((v) => succeed(v)))` (the constructor's existing catch covers promise rejection), and route the synchronous-throw path through `AsyncResult.from(fail(...))`. Behavioral guarantees preserved:

- Synchronous throw from `func()` → `AsyncResult` resolving to `Failure` (not a synchronous re-throw).
- Promise rejection from `func()` → `AsyncResult` resolving to `Failure`.
- Promise resolution from `func()` → `AsyncResult` resolving to `Success` wrapping the value.
- `await captureAsyncResult(...)` yields a `Result<T>` with identical content to before.

### Delta 2 — `AsyncSuccessContinuation` / `AsyncFailureContinuation` widened (mid-stream brief amendment)

```ts
// Before
export type AsyncSuccessContinuation<T, TN> = (value: T) => Promise<Result<TN>>;
export type AsyncFailureContinuation<T>     = (message: string) => Promise<Result<T>>;

// After
export type AsyncSuccessContinuation<T, TN> = (value: T) => PromiseLike<Result<TN>>;
export type AsyncFailureContinuation<T>     = (message: string) => PromiseLike<Result<T>>;
```

Surfaced by the implementing agent during the verify sweep: `encryptedFilePrivateKeyStorage._importPrivateKey` needed an `async (jwk) =>` coercion wrapper to bridge a `captureAsyncResult` return through the old `Promise<Result<TN>>` slot. The continuation aliases are the *consumer* half of the contract Delta 1 changes on the *producer* side; updating only the producer left the API self-hostile.

Brief amendment was approved mid-stream and merged into the integration branch's substrate. Strictly additive: every existing `Promise<Result<TN>>`-returning callback satisfies `PromiseLike<Result<TN>>`. Implementation-neutral: `thenOnSuccess` / `thenOnFailure` bodies already `await` the callback.

**Input-only widening.** Only the callback's *accepted* return type widens; `thenOnSuccess` / `thenOnFailure` still **return** `AsyncResult<TN>`, so chaining off the result is unaffected.

**One-shape simplification.** First-shipped commit used the enumerated union `Promise<Result<TN>> | AsyncResult<TN>`. Review pointed out the union is just two enumerated `PromiseLike` implementers, arbitrarily excluding every other thenable-resolving-to-`Result` for no implementation reason — both forms funnel through `Promise.resolve(...)` / `await`, which accept any `PromiseLike`. Simplified to `PromiseLike<Result<TN>>` — strictly more general, still additive over the union, and consistent with Delta 3.

### Delta 3 — `AsyncResult` constructor parameter widened

```ts
// Before
public constructor(promise: Promise<Result<T>>);

// After
public constructor(promise: PromiseLike<Result<T>>);
```

The minimal change that lets `thenOnSuccess` / `thenOnFailure` pass the widened callback return straight into `new AsyncResult(...)` without re-wrapping. Internally `Promise.resolve(promise).catch(...)` preserves all prior semantics for plain `Promise` inputs. Not in the original brief amendment, but a natural cascade-completeness consequence of Delta 2 — the consumer slots accept `PromiseLike`, so the wrapping constructor should too.

---

## Opportunistic call-site cleanups (3 sites, under the 15-site budget)

| File | Change | Type |
|---|---|---|
| `libraries/ts-extras/.../encryptedFilePrivateKeyStorage.ts` (`_encryptAndWrite`) | Dropped the `succeed(key).thenOnSuccess((k) => captureAsyncResult(...))` synthetic seed — `captureAsyncResult` is now the chain head. | Discovered (the originally-surfacing site from `private-key-storage`). |
| `libraries/ts-extras/.../encryptedFilePrivateKeyStorage.ts` (`_importPrivateKey`) | First commit introduced an `async (jwk) =>` coercion wrapper; second commit reverted it once Delta 2 landed. | Self-caused (introduced + removed in this PR). |
| `libraries/ts-prompt-assist/.../safeguardEngine.ts` | `(await captureAsyncResult(...)).onSuccess(...)` → `await captureAsyncResult(...).onSuccess(...)` — drops a pair of parentheses. | Discovered. |

---

## Gates

All passed before merge:

- **`rush build` green monorepo-wide** — all 86 prior call sites compile unchanged.
- **`rush test` green monorepo-wide** — one pre-existing unrelated failure (`@fgv/ts-json-base` `mutableFsTree` `permission-denied for read-only file`); reproduces on `release` baseline too because the test container runs as root and `chmod` is advisory under root. Routed to `docs/TECH_DEBT.md` P4 (see Follow-ups).
- **`@fgv/ts-utils` coverage**: 100% statements / branches / functions / lines.
- **`rushx lint` clean** in `@fgv/ts-utils`, `@fgv/ts-extras`, `@fgv/ts-prompt-assist`.
- **`rushx fixlint`** run before final commits.
- **api-extractor report regenerated** (`libraries/ts-utils/etc/ts-utils.api.md`) covering all three deltas.
- **`minor` rush change file** added for `@fgv/ts-utils` describing all three deltas.
- **`code-reviewer` agent run on final diff** (per L32): P1 none; P2 one finding (added direct unit tests covering `thenOnSuccess` / `thenOnFailure` accepting an `AsyncResult`-returning callback); P3 observations on the cleanups and constructor-widening semantics, all dispositioned as correct-as-implemented.

New unit tests in `asyncResult.test.ts` cover the sync-throw branch, the chainable `.onSuccess`-off-the-factory pattern, and `thenOnSuccess` / `thenOnFailure` accepting an `AsyncResult`-returning callback without an `async` wrapper.

---

## Process notes worth carrying forward

### Mid-stream brief amendment worked cleanly

The agent paused on the chain-seam asymmetry, surfaced a concrete site (`_importPrivateKey`), proposed the widening with strict-additivity reasoning, and asked for orchestrator approval before proceeding. Orchestrator agreed (cascade-completeness — same logical surface), amended the brief on the integration branch's substrate, and the agent layered the widening on without re-doing the original work. The mid-stream amendment did **not** require a fresh agent or a re-baseline.

### Cascade-completeness chased one consumer past the brief amendment

The amendment scoped two surface changes (the two continuation type aliases). Implementation surfaced a third (`AsyncResult` constructor parameter) as the natural next step in the cascade — without it, `thenOnSuccess` / `thenOnFailure` would have had to re-wrap the widened callback return before passing it to the constructor. Agent added it as part of Delta 2's natural completion, documented in the decisions log. **Pattern (L29-shaped):** when amending a brief mid-stream for a producer/consumer-pair change, walk the consumer chain end-to-end rather than stopping at the first consumer slot. Worth carrying into future amendments.

### The "one shape across the surface" iteration

First-shipped continuation widening used the enumerated union `Promise<Result<TN>> | AsyncResult<TN>` (mirroring the brief amendment language). Reviewer noted the union arbitrarily excludes every other `PromiseLike`-resolving-to-`Result` for no implementation reason. Simplified to `PromiseLike<Result<TN>>` — strictly more general, consistent with Delta 3. Small example of "ship, review, simplify" being the right cadence when the brief's amendment language was approximate.

---

## Follow-ups (routed)

### `docs/TECH_DEBT.md` P4 — `mutableFsTree` root-uid test failure

Surfaced during the full-repo `rush test` sweep, reproduces on `release` baseline, **not a regression**. Cloud-agent harness runs as root; `chmod`-based read-only enforcement is advisory under root, so a `mutableFsTree` test expecting `permission-denied` for a writeable read-only file passes the write through. Routed as P4 with a single-test gate fix sketch (`process.getuid?.() !== 0` skip, or rewrite the assertion to use a `FileTree` adapter capability check).

No new lessons-pending entries: the mid-stream-amendment pattern is the same shape as past streams, and the cascade-completeness observation falls under L29 ("Cascade-completeness framing for type-cascade briefs needs to be inclusive, not enumerative") rather than warranting its own entry.

---

## Origin

Surfaced in `.ai/tasks/completed/2026-05/private-key-storage/result.md` Follow-ups: the implementation agent for `private-key-storage` hit a chain seam in `encryptedFilePrivateKeyStorage._encryptAndWrite` (a `succeed(key).thenOnSuccess(() => captureAsyncResult(...))` seed). Routed to `docs/TECH_DEBT.md` P3 in PR #430, then commissioned here at Erik's direction ahead of the -33 publish so the cleanup lands in the same alpha as `ts-app-shell-styling-hardening`. `@fgv/ts-utils` is established surface — additive in practice, but the lockstep policy makes the monorepo-wide rebuild+test sweep the gating cost. That gate was the stream's main deliverable, not the one-line signature change.

The previous P3 entry in `docs/TECH_DEBT.md` is retired by this stream.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | #431 | merged → integration branch |
| Implementation | #433 | merged → integration branch |
| Cluster close (integration → release) | TBD | open at time of this README |
