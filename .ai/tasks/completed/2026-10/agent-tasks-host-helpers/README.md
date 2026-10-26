# agent-tasks-host-helpers — the plumbing every broker host rewrites

**Shipped**: 2026-10-26 into `integration/asks` via #TBD.
Package: `@fgv/ts-agent-tasks` (new `host` packlet; `broker`, `storage`, `types`). Origin:
personaility#698 (fgv-ask), slices B-3, B-7, B-4, B-5 + F8. Change file typed `minor`
(`BREAKING (implementers only):`).

## Summary

PersonAIlity had written the same host code twice or more: a kind-scoped trusted authority, a
catalog open that probes the root's atomic capability and falls back to memory, a writer-idle wait
that polled by taking the writer every 10 ms, and a write guard threaded through every write. This
stream moves those into the library, plus two broker gaps the ask surfaced.

- **`openOrInitializeTaskRepository`** opens or initializes in the strongest mode the root
  qualifies for, deciding open-vs-initialize under the repository's own ownership, with a labelled
  in-memory fallback. **`probeTaskRepositoryRoot`** is the single definition of "qualifies"
  (`atomicReplace` required) and `RecordStore` uses it.
- **The manifest records `initializedMode`**; a durable repository is not opened as a session
  without `allowSessionOverDurable`.
- **`trustedKindAuthority`** — trusted host principals only. Named task: kind + *some* scope.
  Requested scopes: `scopeMatch` (`'every'` default, `'some'`).
- **`TaskBroker.whenIdle`** (never takes the writer, injected `schedule`), **`writeGuard`** around
  every broker write, **`IBoundTaskDelivery.issued()`**, and **`resumePendingRegistration`** on the
  bound writer (native) and on `TaskBroker` (external), re-authorizing `create` at the resume.

## What a reader should know

- **No `releaseStale`**: the repository has no open generation to tell this open's receipts from an
  earlier one's. `issued()` + `abandon` is the supported path.
- **A resumed native task takes the resuming view's creation scopes** — they were never part of the
  stored request.
- **`whenIdle` counts a section the guard holds as busy.** Pausing writes and then waiting for idle
  waits for the pause itself.
- **Three interfaces widened** (`ITaskRepository`, `IBoundTaskWriter`, `IBoundTaskDelivery`); there is
  no other implementation in the monorepo.
- **B-1, B-2 and B-6 were not built**, per the brief.

## Artifacts

- `brief.md` — the frozen contract
- `result.md` — per-slice changes, the two PersonAIlity scope rules, the check-then-act table, the
  revert matrix, gates and brief deltas
- `state.md` — the worker's checkpoint and interpretations
- `meta.yaml` — the index record
