# State: `memory-search-scope`

Worker-owned. The brief is frozen; questions and deviations live here.

## Status

Implementation, tests and docs complete on `memory-search-scope`. Gates: see `result.md`.

## Decisions taken within the brief

- **`projectItem` choice: the tool layer always adds `scope`.** The hook's return type is now
  `IMemoryToolItemProjection` (the item without `scope`), and `IMemoryToolResultItem` extends it with
  `scope: MemoryScopeKey`. The tool spreads the hook's result first and `scope` last, so a hook that
  omits `scope` still gets it and a hook that returns one (structurally, past the type) is overwritten.
  Tested both ways.
- **Where the scope comes from.** `IMemoryRecord` carries no scope, so the item's scope is
  `scopedAddressOf(record, ctx.store)` — the same canonical "address of a loaded record" the merge
  strategy and the ingest orchestrator use. For every record the store returned, that is the scope it
  was read from.
- **A scope that cannot be resolved fails the call** (search, context, read, write), naming the
  record and kind. Degrading to an unqualified item would hand the model exactly the ambiguity this
  stream removes, and `ScoreUnionMergeStrategy` already fails in the same case.
- **`IMemoryWriteResult` also gets `scope`.** It is the brief's "every memory tool that returns
  records" read literally: a write returns a record's address, and a model that copies the written
  `id` into a later write of a *different* kind (different scope) hits the same wrong-record default.
  The scope is resolved from the persisted record, not the request, because content-scope dedup can
  return a different entity.
- **`memory_delete` is unchanged.** Its result names a record that no longer exists, so it is not a
  link target.
- **Default "omitted scope means the writer's scope" is kept**, as the brief directs. No reason found
  that it is unsafe beyond the existing one: it is a description-level mitigation, so a model that
  ignores the description still mislinks. That is the behaviour the user approved.

## Where the brief was imprecise

- **Result items have no `id` field.** The brief says the descriptions should tell the model to copy
  "both `id` and `scope` from a result". Items carry `handle`, which equals the id only when no
  `handleFor` is wired. The descriptions therefore say "copy its `handle` (as `id`) and its `scope`".
- **With a `handleFor` mnemonic, a model cannot author a correct link or context seed from a result
  at all**, because the handle is not a `MemoryId` and nothing resolves a handle back. This predates
  the stream and the brief keeps `handleFor` unchanged, so it is not addressed. It is recorded in
  `CAPABILITIES.md`. If links from mnemonic handles matter, the options are an always-present `id`
  on the item (tool-layer-owned like `scope`) or a handle-resolving lookup; that is an orchestrator
  decision.

## Open questions

None blocking.
