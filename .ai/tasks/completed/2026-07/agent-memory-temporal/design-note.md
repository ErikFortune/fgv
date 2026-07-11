# Design note — temporal versioned write path + temporal retrievers

Stream: `agent-memory-temporal`. Library: `@fgv/ts-agent-memory` (active surface — additive/breaking OK).

## OQ-11 — versioned identity / layout model: **subtree-per-entity** (LOCKED, consumer-backed)

Every version of a temporal entity is a distinct file in a per-entity subtree:

```
<baseScope>/entities/<entityId>/<entityId>-v<seq>.md
```

- `<seq>` is the store's monotonic write counter (`envelope.seq`) — monotonic per store, so every version filename is unique and version ordering is total.
- **Current version** = the latest version whose `temporal.invalid_at` is `null`/absent (highest `seq` among such, defensively, in case a prior invalidation did not complete).
- Rejected alternative: flat + sidecar version-index file. Consumer (PersonAIlity, 2026-07-07) counselled against it — "two sources of truth, exactly what bites during crash recovery." Not adopted.
- **No `id == filename == single current value` global assumption is baked.** For a temporal record, `envelope.id` is the *version* file stem (`<entityId>-v<seq>`) — the `MemoryId` — while `envelope.entityId` is the stable domain key. `id === filename stem` still holds (the store mints `id` = version stem), so `_verifyLoaded`'s `id === baseName` check and the codec round-trip both succeed **without relaxation** — the relaxation the brief anticipated is unnecessary because `id` is minted to the version stem rather than to `entityId`.

## Identity codec

`TemporalIdentityCodec` (new, `identityCodec.ts`) implements `IIdentityCodec` and the additive `ITemporalIdentityCodec` extension (`encodeVersion(entityId, seq)` / `decodeVersion(scope, stem)`; guarded by `isTemporalIdentityCodec`). `encode(entityId)` reports `isVersioned: true`, `scope = <baseScope>/entities/<entityId>`, `idStem = <entityId>`. The `entities/<entityId>` subtree scope is authoritative for disambiguating a version stem that itself contains `-v<digits>`.

## Write policy — invalidate-don't-delete

`TemporalVersionedPolicy` (new sibling, `writePolicy.ts`): `admit` always accepts (history is retained; never culls), `dedupScope: 'entity'` (an identical re-put of the current content is a no-op, not a redundant version). `applyUpdate` runs the same RFC-7386 merge (`nullAsDelete: true`, `arrayMergeBehavior: 'replace'`) restricted to `mutableFields` as the shipped policies.

**Merge-patch-under-versioning (consumer-pinned).** A `put()` on an existing temporal entity projects the incoming record's mutable fields into a patch, merges it over the **current** version's content to form the **new** version's content, writes that as a **new** version file, and sets `invalid_at` on the prior current version. It is never an in-place mutation of the current version.

## Store branches (`fileTreeMemoryStore.ts`)

The three `if (addr.isVersioned) return fail(...)` fail-stops (get/put/delete) are replaced by dedicated `_readVersionedCurrent` / `_putVersioned` / `_deleteVersioned` methods, branched at the top of each op. The flat (non-versioned) path is **structurally unchanged** beyond the branch — no persisted record changes shape, no shipped store migrates.

- **get** → current version (resolved from the derived index, filtered to the entity subtree scope).
- **put** → new version file (durability order: persist the new version **first** — it carries the highest `seq`, so a crash before the prior-version invalidation completes still resolves the new version as current — then invalidate the prior current version).
- **delete** → **soft delete (invalidate-don't-delete)**: set `invalid_at` on the current version, leaving history intact and the entity with no current version. Returns the invalidated version's `MemoryId`. Fails with "no record found" when there is no current version. Rationale: temporal kinds exist to retain history; a hard delete would defeat the audit purpose and the L3 `contradicts` interlock that will build on this path. (Documented decision for the brief's open "delete semantics" question.)
- **`list({ asOf })`** → for temporal records, collapse each entity to the version valid at `asOf`; non-temporal records are timeless and pass through unchanged. When `asOf` is absent, `list` is byte-identical to before (flat-path guarantee). Transaction-time / full bi-temporal filtering is deferred (OQ-9).
- `_mutableFieldAccessors` is **not** extended: `invalid_at` is set by the store directly, not carried on the consumer merge-patch path.

## Retrievers (`retrieve/temporalRetrievers.ts`)

All three declare `supportsTemporalQuery: true` and operate over temporal records (`envelope.temporal !== undefined`), grouped by entity:

- `CurrentValidRetriever` — the current version per entity (invalid_at null/absent).
- `AsOfRetriever` — the version valid at `query.asOf` per entity (empty when `asOf` is absent — that is its axis).
- `HistoryRetriever` — every version per entity, ascending by `valid_at` then `seq`.

The existing `guardRetrieverCapabilities` loud-degrade (a non-temporal retriever fails an `asOf` query) and the `HybridRetriever` `asOf` projection (strips `asOf` for non-temporal children, passes it to temporal children) light up unchanged when a temporal child is composed in.

## Shared temporal selection (`types/temporal.ts`)

`isTemporalRecord` / `isVersionCurrent` / `isVersionValidAt` / `selectCurrentVersion` / `selectVersionAsOf` — pure helpers shared by the store and the retrievers (types packlet has no upward deps).
</content>
</invoke>
