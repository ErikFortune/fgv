# State: `agent-memory-merge-scope`

Worker-owned working surface. The brief is frozen; nothing here amends it.

## Progress

- [x] Read the brief, the merge, the ingest `_scopeRecords`, `storeIdentity.ts`, the four shipped
      codecs, every consumer of `ScoreUnionMergeStrategy`.
- [x] Verified the six beliefs against `575ba2ad` (verdicts in `result.md`).
- [x] `scopedAddressOf(record, resolver): Result<IEdgeTarget>` added to `types/identityResolver.ts`;
      ingest `_scopeRecords` routed through it over an `IIdentityResolver` view of its own codecs.
- [x] `ScoreUnionMergeStrategy.create({ identityResolver })`, keyed on `edgeTargetKey(scopedAddressOf(…))`.
- [x] Consumers updated: three test suites (via a store-backed `storeIdentityResolver` test helper)
      and `samples/testbed` (the store is the resolver).
- [x] Regression suite `test/unit/retrieve/scoreUnionMergeStrategy.test.ts`, store-loaded records.
- [x] Neutralize-and-confirm: 5 of 13 red against the bare-id key, restored.
- [x] `CAPABILITIES.md`, change file, `etc/ts-agent-memory.api.md`.
- [x] Package gates; repo-wide `rebuild` and `test`; `change --verify`.
- [x] Finalize: migrate to `completed/2026-10/`, `meta.yaml`, `README.md`, ledger entry, feed.

## Decisions made while building

- **Helper shape: `(record, resolver) → Result<IEdgeTarget>`, unformatted.** The resolver's failure
  passes through without added text, so ingest keeps its exact
  `cannot resolve scope for stored record '<id>': <msg>` wording and the merge adds its own
  kind/entityId context. Wording the failure inside the helper would have changed ingest's messages,
  which is the brief's third stop condition.
- **Ingest's resolver is its own codec map, not the store.** `MemoryIngestOrchestrator` takes
  `codecs` / `defaultCodec` separately from its store, so `_scopeRecords` was given an
  `IIdentityResolver` that wraps its existing `_resolveAddress`. Passing `this._store` instead would
  have been a behaviour change whenever the two maps differ.
- **Public export.** `scopedAddressOf` is exported from the `types` barrel (so `@public`), because
  `retrieve` and `ingest` can only share it through that barrel, and because it is the answer a
  consumer needs for the same question.
- **`captureResult` around the resolver in the merge.** The resolver is consumer-injectable; this
  mirrors `FragmentSemanticRetriever._resolveOptions`. Not added to the shared helper, since ingest
  has never captured a throwing codec and adding it there would change ingest behaviour.
- **Runtime refusal of a missing resolver.** Typed as required; `create` still fails on
  `params?.identityResolver === undefined`, per decision 1's "refuse a missing resolver loudly".

## Open questions

None blocking.
