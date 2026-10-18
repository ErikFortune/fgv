# Result: `memory-search-scope`

**Shipped:** every result item from `memory_search`, `memory_context` and `memory_read` now carries
`scope`, the scope its record lives in, and so does the `memory_write` result. Two records that share
an id in different scopes are therefore distinguishable to the model, and the tool descriptions tell
it to copy both a result's `handle` (as `id`) and its `scope` into a link target or context seed.

Package: `@fgv/ts-agent-memory`. PR: #TBD into `integration/asks`.

## What changed

- `IMemoryToolResultItem` now extends a new `IMemoryToolItemProjection` (the fields without
  `scope`), adding `scope: MemoryScopeKey`.
- `IMemoryWriteResult` gains `scope: MemoryScopeKey`, resolved from the **persisted** record, since
  content-scope dedup can return a different entity than the one requested.
- `ICreateMemoryToolsParams.projectItem` now returns `IMemoryToolItemProjection`.
- The scope comes from `scopedAddressOf(record, store)`, the canonical "address of a loaded record".
  A record whose scope cannot be resolved fails the call with
  `<tool>: cannot resolve the scope of record '<id>' (kind '<kind>'): …`, rather than reaching the
  model unqualified.
- Descriptions: `memory_search`, `memory_context`, `memory_read` and `memory_write` tool descriptions,
  the link target's `id` / `scope`, and the context seed's `id` / `scope`.
- The default handle is still the raw id. `handleFor` is unchanged. An omitted link-target scope
  still defaults to the writer's scope.

## `projectItem` choice

**The tool layer always adds `scope`.** The hook's return type omits it, and the tool spreads the
hook's output first and `scope` last. A hook that omits `scope` still gets it, and a hook that
returns one is overwritten. Both cases are tested. Hosts are no longer asked to supply a value they
could get wrong.

This breaks hook implementers in one narrow way: a projector annotated as returning
`IMemoryToolResultItem` stops compiling. It must return `IMemoryToolItemProjection` instead. An
unannotated projector, or one returning the old shape structurally, still compiles. The change file
is therefore `minor` with `BREAKING (implementers only):`.

## Tests (`src/test/unit/tools/memoryTools.test.ts`, § "result items carry their scope")

- Two MTM `turn-3` records in `conversations/conv-a` and `conversations/conv-b`, written through a
  real store, come back with colliding handles and distinct, correct scopes.
- A `memory_write` that links with a `{ id, scope }` copied from conv-b's search result persists an
  edge to `conversations/conv-b`, and that edge resolves to conv-b's turn.
- An omitted link scope still defaults to the writer's scope (`conversations/conv-a`), and the write
  result reports it.
- `memory_read` and `memory_context` items carry the scope.
- A projector that forges `scope: 'forged'` and one that omits it both yield the real scope.
- The descriptions carry the copy-both instruction.
- An unresolvable scope fails `memory_search`, `memory_context`, `memory_read` and `memory_write`,
  covering each call site of the projection.
- The existing write tests now assert `scope` on the write result.

Coverage is 100% for the package.

## Consumer sweep

Searched `libraries/`, `samples/`, `tools/` and `apps/` for `IMemoryToolResultItem`,
`IMemoryWriteResult`, `projectItem`, `createMemoryTools` and `memory_search`.

| consumer | category | action |
|---|---|---|
| `libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts` | producer | changed |
| `libraries/ts-agent-memory/src/test/unit/tools/memoryTools.test.ts` | test-helper projectors (`boundingProjector`, `readToolWith`) | retyped to `IMemoryToolItemProjection`; tests added |
| `samples/testbed/src/scenarios/memoryToolsGate/index.ts` | real caller, `handleFor` only, no item construction or field pin | none needed; compiles and passes in the repo-wide gates |
| `libraries/ts-agent-memory/etc/ts-agent-memory.api.md` | API report | regenerated |
| `libraries/ts-agent-memory/CAPABILITIES.md` | doc | updated |

There are no consumers in `tools/` or `apps/`, and no test double constructs an item.

## Gates

Logs are in `../gate-logs-memory-search-scope/` beside the worktree. Each log was graded by grep,
not by exit code.

| gate | result |
|---|---|
| `rushx build` (ts-agent-memory) | exit 0; the API-signature notice is the report update |
| `rushx lint` | exit 0, 0 warnings / errors |
| `rushx test` | exit 0, 100% on all metrics |
| `rushx fixlint` | run, exit 0 |
| prettier 2.8.8 (`rush prettier`, the repo autoinstaller) | reformatted 2 files, then committed |
| `rush change --verify --target-branch origin/integration/asks` | exit 0 |
| `verify-capability-docs.mjs` | exit 0 |
| `generate-capability-feed.mjs --check` | exit 0 |
| repo-wide `rush rebuild` | 0 error lines, 1 `warning` (the benign symlink notice), no NUL padding, `SUCCESS: 38 operations` |
| repo-wide `rush test` | 37 of 38 operations green, 0 `not met`, 1 `warning` (symlink notice), no NUL padding. **One failure: `@fgv/ts-res-cli`**, a 5 s per-test timeout in `cli-configuration.test.ts` › "test consistent output by building same input twice". `ts-res-cli` does not depend on `ts-agent-memory`, and the run shared the machine with a concurrent worker. Re-run alone with `rushx test`, it passed: 0 failures, 0 warnings, all suites green. I judge it a load-induced flake, not this diff, but it is a red line in the full-suite log. |

## Where the brief was imprecise

- **Result items have no `id` field.** The brief says to copy "both `id` and `scope` from a result".
  The item's key is `handle`, which equals the id only without `handleFor`. The descriptions
  therefore say to copy the `handle` as `id`.
- **With a `handleFor` mnemonic, no correct link or seed can be authored from a result**, because
  nothing resolves a handle back to a `MemoryId`. This predates the stream, and the brief keeps
  `handleFor` unchanged, so it is reported rather than fixed. Options: an always-present
  tool-layer `id` on items, or a handle-resolving lookup.
- **The write result.** The brief names "result items". I also added `scope` to the write result,
  because copying a written id into a later different-kind write hits the same wrong-scope default.
  `memory_delete` is unchanged.

## Defaulting safety

The default is kept. The only residual risk is the existing one: the fix is description-level, so a
model that ignores the description still mislinks. No new unsafe case was found.

## Review round 1

The deep review found no P1s. Applied:

1. **Uncaught store throw.** Both call sites (projection and `memory_write`) now go through a new
   `scopeOf(ctx, record)`, which wraps `scopedAddressOf` in `captureResult`. A throwing
   consumer-injected `resolveIdentity` therefore yields a `Failure`. New test: a throwing resolver
   fails `memory_read` and `memory_write` with the thrown message.
2. **`memory_write` reports failure after a committed put.** Not restructured. A comment at the call
   site says the failure follows a committed put and is unreachable with `FileTreeMemoryStore`
   (`put` encodes through the same codecs). The `IMemoryWriteResult.scope` TSDoc states that a custom
   store whose resolver disagrees with its own `put` would see a failure reported for a persisted
   write.
3. **Tests added.**
   - (a) A versioned (`TemporalIdentityCodec`) kind's `memory_read` item carries
     `scope: 'facts/entities/fact-1'` beside a `fact-1-v<n>` handle.
   - (b) `scope` is present alongside a `handleFor` mnemonic. The test pins `{ handle, scope }`
     through one `expected` object, so adding an `id` later is a one-line change.
4. **P2 held.** The descriptions are unchanged. D7 in `followups.md` is reworded: the D3 descriptions
   now *instruct* the model to put a handle in `id`, so the `handleFor` hazard is worse, not just
   pre-existing. A non-portable mnemonic (`@doc-1`) is rejected by the `MemoryId` converter. A
   portable one is persisted as a dangling edge, because link targets are not checked for existence.

Gates for this round. Logs are `r1-*.log` in `../gate-logs-memory-search-scope/`:

- **Package:** build exit 0; lint 0 warnings/errors; test 100% on all metrics; fixlint run; prettier
  2.8.8 clean.
- **Repo-wide `rush rebuild`:** `SUCCESS: 38 operations`. 0 error greps, 1 `warning` (the symlink
  notice), no NUL padding.
- **Repo-wide `rush test`:** `SUCCESS: 37 operations` plus 1 `NO OP`. 0 error / `not met` greps, 1
  `warning` (the symlink notice), no NUL padding. The `ts-res-cli` timeout from the first run did not
  recur.
- **Other checks:** `change --verify --target-branch origin/integration/asks`,
  `verify-capability-docs` and the feed `--check` all exit 0.
