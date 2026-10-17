# Result: `agent-memory-merge-scope`

**Shipped:** `ScoreUnionMergeStrategy` now deduplicates and scores records by their scope-qualified `(scope, id)` address instead of the bare `id`, so two MTM `turn-3` records in different conversations stay two records; its `create({ identityResolver })` requires the resolver (pass the store), and a record whose identity cannot be resolved fails the merge.

Issue: [fgv#725](https://github.com/ErikFortune/fgv/issues/725). Base: `release` at `575ba2ad`.

## What shipped

- **`scopedAddressOf(record, resolver): Result<IEdgeTarget>`** (`types/identityResolver.ts:75`), a
  new public helper. It resolves `(kind, entityId)` through an `IIdentityResolver` and pairs the
  scope with `envelope.id`. A resolver failure passes through unformatted, so each caller adds its
  own context.
- **`ScoreUnionMergeStrategy.create(params: IScoreUnionMergeStrategyCreateParams)`**
  (`retrieve/hybridRetriever.ts:89`). `identityResolver` is required by type and refused at runtime
  when absent (`:93`). BREAKING, with no shim.
- **The merge key** is `edgeTargetKey(scopedAddressOf(record, resolver))` (`:147-155`), used for both
  the per-set seen-set and the cross-set score map. The resolver call is wrapped in `captureResult`,
  because it is a consumer seam. An unresolvable record fails the whole merge with
  `ScoreUnionMergeStrategy: cannot resolve the scope of record '<id>' (kind '<kind>', entityId '<entityId>'): <cause>`.
  There is no bare-id fallback.
- **The lift condition** is in the `_keyed` TSDoc at the key site (`:139-143`). It says: if a
  retriever result ever carries an authoritative scope the codec cannot derive, key on that.
- **TSDoc.** The class doc now describes the scoped identity rule and the loud failure. The old
  "unambiguous for the flat kinds / Phase-C future work" remark is gone. `IMergeStrategy` never
  stated the id-only rule, so it is unchanged.
- **Ingest.** `_scopeRecords` (`ingest/orchestrator.ts:957`) now calls `scopedAddressOf` over an
  `IIdentityResolver` view of the orchestrator's own `_resolveAddress`. Codecs, messages and
  behaviour are unchanged.
- `CAPABILITIES.md` (Retrieval paragraph), `etc/ts-agent-memory.api.md`, and a change file typed
  `minor` with a `BREAKING:` prefix.
- Tests:
  - new `test/unit/retrieve/scoreUnionMergeStrategy.test.ts` (13 tests);
  - new test helper `test/helpers/storeIdentityResolver.ts`, a real empty `FileTreeMemoryStore`
    used as the resolver for synthetic-fixture suites;
  - `retrievers.test.ts`, `temporalRetrievers.test.ts` and `memoryTools.test.ts` updated.

## Belief verdicts

1. **Location, `create()`, keys, TSDoc: confirmed.** `hybridRetriever.ts:46-82` at `575ba2ad`.
   - `create()` took no parameters (`:50`).
   - The keys were `Map<MemoryId,…>` and `Set<MemoryId>` on `record.envelope.id` (`:58-64`).
   - The TSDoc at `:41-43` claimed id-only dedup is unambiguous for flat kinds. That is false today,
     because MTM is flat (`isVersioned: false`) and reuses `turn-<n>` across scopes.
2. **The store invariant holds for the shipped store and codecs: confirmed.**
   - Every `FileTreeMemoryStore` read goes through `_verifyLoaded` → `verifyLoadedIdentity`
     (`store/storeIdentity.ts:103-125`). The call sites are `_readRecord` (`fileTreeMemoryStore.ts:1792`,
     behind `get` / `getById` / `resolveRecord` / `list` / `_materialize`), the open walk
     `_loadRecordFile` (`:1886`), and the reconcile rewrite (`:1693`).
   - That function checks `id === stem`, then `verifyRoundTrip(scope, stem)`, then
     `decode(scope, stem) === envelope.entityId`.
   - Each of the four shipped codecs rejects a foreign scope:
     - Knowledge and LTM: `decode` refuses any scope other than their fixed one.
     - MTM: `verifyRoundTrip` compares `encoded.scope !== scope` explicitly.
     - Temporal: `verifyRoundTrip` compares `encoded.scope !== scope`.
   - So for a store-loaded record, `resolveIdentity(kind, entityId).scope` is the read scope.
   - **Stop-condition check:** every shipped retriever (Recency, Tag, StructuredFilter, Semantic,
     LinkTraversal, AsOf / CurrentValid / History) materializes through its injected
     `IMemoryRecordResolver` (`materializePage` / `resolveQuery`, `retriever.ts:369-396`). When that
     resolver is the store, belief 2 holds. A consumer-supplied non-store resolver is the same class
     as exception (b), not a shipped path, so the stop condition did not fire.
3. **`IIdentityResolver` is a pure codec function, and `IMemoryStore` extends it: confirmed.**
   - The interface is at `types/identityResolver.ts:35-46`, and `store/memoryStore.ts:33` extends it.
   - The store implements it at `fileTreeMemoryStore.ts:632` via `storeIdentity.resolveIdentity`,
     which is `codecFor` + `encode` with no I/O.
4. **Versioned address: confirmed.** `TemporalIdentityCodec.encode` gives scope
   `<base>/entities/<entityId>`, and the version file is `<that scope>/<entityId>-v<seq>.md`
   (`identityCodec.ts`, `encode` / `encodeVersion`). The test "distinct versions … stay distinct" puts
   `fact-1` twice through `TemporalVersionedPolicy` and merges the two loaded versions.
5. **Ingest precedent: confirmed and equivalent.**
   - `_scopeRecords` is at `orchestrator.ts:944-953` and keys on `edgeTargetKey(s.address)` at `:308`.
   - Its resolution is `_resolveAddress` = `(this._codecs.get(kind) ?? this._defaultCodec)` +
     `encode`, with the same "no identity codec registered for kind" failure as `storeIdentity.codecFor`.
   - The address is `{ scope: addr.scope, id: record.envelope.id }`, the same as the merge needs.
   - One difference is not a difference of construction: ingest resolves with **its own** codec map,
     not the store's. The helper takes the resolver as a parameter, so ingest keeps its map. The
     extraction therefore changes no ingest behaviour, and the full ingest suite passes unmodified.
6. **Consumers: confirmed, and the list is complete.**
   - Non-test: `samples/testbed/src/scenarios/memoryToolsGate/index.ts:141-150`.
   - Tests: `retrievers.test.ts` (16 sites), `temporalRetrievers.test.ts:~300` and
     `memoryTools.test.ts:~154`.
   - There is no other `IMergeStrategy` implementation. See the sweep below.

## Neutralize and confirm

I temporarily changed the key in `_keyed` from `edgeTargetKey(address)` to the bare
`${address.id}`, then ran `heft test --test-path-pattern scoreUnionMergeStrategy`.

The suite went **red: 8 passed, 5 failed**. The five failures were:

- both cross-scope "turn-3 survives" tests (within one set and across sets);
- "repeated copies … contribute one score";
- "same scoped record found by two retrievers scores 2";
- the `HybridRetriever` end-to-end test over a real store.

These stayed green under the neutralized key, as expected, because none of them depends on scope:

- the three `create` tests;
- distinct versions, which have different ids anyway, so the test guards against keying on `entityId`;
- flat dedup;
- the three failure-path tests.

I then restored the key, and the suite returned to 13/13 green.

## Consumer sweep

I ran `grep -rn "ScoreUnionMergeStrategy|IMergeStrategy|HybridRetriever"` over `libraries/`,
`tools/`, `samples/`, `apps/` and `docs/`, excluding `lib/`, `dist/`, `node_modules` and `temp/`.

- **Updated:** `samples/testbed/.../memoryToolsGate/index.ts`, which now passes
  `{ identityResolver: store }`. The store was already in scope as the record resolver.
  - `retrievers.test.ts` uses `storeIdentityResolver()` with the knowledge codec. Every fixture there
    is `kind: knowledge`, `entityId === id` and scope `knowledge`.
  - `temporalRetrievers.test.ts` uses a store with the `facts` temporal codec and the knowledge codec.
  - `memoryTools.test.ts` uses its existing `makeStore()`, which has the knowledge and MTM codecs.
- **Negative results:**
  - No other `IMergeStrategy` implementation exists anywhere.
  - `ts-agent-memory-sqlite-vec`, `tools/` and `apps/` do not reference the strategy or
    `HybridRetriever`.
  - `docs/ACTIVE-STREAM-TRIAGE.md` and the completed-task docs mention them only historically. No
    code sample constructs the strategy.
- `scopedAddressOf` is new, so it has no prior consumers.

## Out-of-scope report 1: tightening `IIdentityCodec.verifyRoundTrip`

Suppose the contract required `verifyRoundTrip(scope, stem)` to fail when `encode(decode(scope, stem)).scope !== scope`.

- **All four shipped codecs already pass.**
  - Knowledge and LTM pass because `decode` refuses a foreign scope.
  - MTM and Temporal pass because each compares the re-encoded scope.
- **In-repo test codecs:** five would fail a conformance check of that contract. They stub
  `verifyRoundTrip` to `succeed(true)`, or validate only `decode`.
  - `store/fileTreeMemoryStore.test.ts:~570-581` (`turnCodec`) and `store/lenientOpen.test.ts:43`
    (`PathIdentityCodec`). Both derive the entity id from the scope, so a misplaced file still gets
    caught by `verifyLoadedIdentity`'s entityId cross-check. In practice the store invariant holds
    for them.
  - `store/kindCollision.test.ts:65` (`PrefixedCodec`), `store/fileTreeMemoryStore.test.ts:~625`
    (`versionedCodec`) and `tools/memoryTools.test.ts:~600` (`versionedCodec`). These have a `decode`
    that ignores scope. With them, a file in a foreign scope would load, and the merge would resolve
    a different scope than the one it was read from. That is exception (a).
  - All five are test fixtures, and none is used by a merge test.
- So tightening would cost nothing in shipped code and five fixture updates in tests.

## Out-of-scope report 2: `defaultProjectItem`'s bare-id handle

The handle fallback is at `tools/memoryTools.ts:347-348`.

**No tool resolves a handle back to a record, so today this is cosmetic, not a wrong-record bug.**

- `memory_read`, `memory_write` and `memory_delete` address records by `(kind, entityId)`, and
  `store.get` / `put` / `delete` resolve that through the codec.
- `memory_context` takes a seed with a **required** explicit `scope` (`resolveContextSeed`, `:681`).
- The handle is never parsed anywhere.

Two adjacent hazards are worth the orchestrator's attention. Both are agent-facing, and neither is a library bug:

- A `memory_search` result item carries `handle`, `kind`, `entityId`, `tags` and `body`, but **no
  scope**. An agent that wants to seed `memory_context` from a search hit must supply a scope it
  was never shown. It could derive the scope only by knowing the codec.
- On `memory_write`, a link target's `scope` defaults to the writer's own scope
  (`linkTargetSchema`, `:191-198`). An agent that copies a cross-conversation search hit's raw-id
  handle into a link target with `scope` omitted would point the edge at the same-named record in its
  **own** conversation. The edge would be silently wrong if that record exists, and dangling if not.
  This is the only path where the ambiguous handle can become a wrong-record reference, and it needs
  the agent to misuse the handle as an id.

## Gate counts

Logs are under `<worktree>/.gate-logs/`. Each count is `grep -cE 'not met|FAILURE|Operations failed|error TS'` /
`grep -ci warning`.

| gate | result | errors | warnings |
|---|---|---|---|
| `rushx build` (ts-agent-memory) | exit 0 | 0 | 0 |
| `rushx lint` (ts-agent-memory) | exit 0 | 0 | 0 |
| `rushx test` (ts-agent-memory) | exit 0, 100 / 100 / 100 / 100 | 0 | 0 |
| `install-run-rush.js rebuild` | GATE_REBUILD | | |
| `install-run-rush.js test` | GATE_TEST | | |
| `change --verify --target-branch origin/integration/asks` | GATE_CHANGE | | |

## What the brief got wrong

- **Nothing material.** All six beliefs held. Line numbers matched within a few lines.
- **Belief 5 is a precedent with its own resolver.** The ingest orchestrator resolves with the codec
  map it was given, not with the store's. The brief's "`codec.encode(entityId).scope`" is accurate,
  but a helper that hard-wired the store as resolver would have changed ingest. That is why the
  helper takes the resolver as a parameter.
- **"Fix the TSDoc on `IMergeStrategy` if it states the id-only rule":** it does not, so there was
  nothing to fix.
