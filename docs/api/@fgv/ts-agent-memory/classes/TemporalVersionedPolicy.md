[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / TemporalVersionedPolicy

# Class: TemporalVersionedPolicy

Write policy for a versioned (temporal) kind family, implementing
invalidate-don't-delete. Admission always accepts — history is retained, never
culled — and updates apply the same RFC-7386 merge patch as
[KnowledgeLwwPolicy](KnowledgeLwwPolicy.md), restricted to the temporal mutable surface.

## Remarks

The policy does NOT perform the version file writes or set `invalid_at` — that
is the store's versioned write branch, driven by the kind's
[ITemporalIdentityCodec](../interfaces/ITemporalIdentityCodec.md). The policy's role is limited to admission and
the merge that forms the **new version's** content from the **current**
version plus the incoming patch (the merge-patch-under-versioning contract).

- **Dedup scope.** `'entity'` — an identical re-put of the current content is a
  no-op (the store compares the incoming content hash against the current
  version), so identical writes do not spawn redundant versions.
- **Mutable surface.** `body` + the envelope metadata a consumer may revise
  (`tags` / `links` / `provenance` / `embeddingRef`). `temporal` is NOT mutable
  here — `valid_at` / `invalid_at` are set by the store's versioned branch.

## Implements

- [`IWritePolicy`](../interfaces/IWritePolicy.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dedupscope"></a> `dedupScope` | `public readonly` | [`DedupScope`](../type-aliases/DedupScope.md) | `'entity'` | Versioned kinds dedup per-entity against the current version (see the class remarks). |
| <a id="property-mutablefields"></a> `mutableFields` | `public readonly` | readonly `string`[] | `...` | The temporal mutable surface (mirrors [KnowledgeLwwPolicy](KnowledgeLwwPolicy.md)). |

## Methods

### admit()

> **admit**(`__incoming`, `__existing`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AdmissionDecision`](../type-aliases/AdmissionDecision.md)\>

Determine whether the incoming record is admitted.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__incoming` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> | The record about to be written. |
| `__existing` | readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[] | The admission cohort the kind's cap applies to: the records in the same scope of the same kind, EXCLUDING the record at `incoming`'s target id. Empty on a first write into an empty cohort. Excluding the target id makes the post-write count uniform (`existing.length + 1`) across first-writes and same-id updates. A last-write-wins policy that has no cap ignores this argument. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AdmissionDecision`](../type-aliases/AdmissionDecision.md)\>

A [AdmissionDecision](../type-aliases/AdmissionDecision.md).

#### Implementation of

[`IWritePolicy`](../interfaces/IWritePolicy.md).[`admit`](../interfaces/IWritePolicy.md#admit)

***

### applyUpdate()

> **applyUpdate**(`existing`, `patch`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>\>

Apply a JSON Merge Patch (RFC-7386) to the mutable fields of an existing
record. Called when admission is `accept` AND a record with the same
`entityId` already exists (an update, not a first write).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `existing` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> | The current persisted record. |
| `patch` | `Record`\<`string`, `unknown`\> | A partial JSON object in Merge Patch format. `null` deletes the corresponding key; arrays replace wholesale; nested objects deep-merge. Only keys in [IWritePolicy.mutableFields](../interfaces/IWritePolicy.md#property-mutablefields) are applied. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>\>

The updated record (envelope + body).

#### Remarks

**RFC-7386 semantics are the contract here, not an artifact of the shipped
policies' merge configuration.** Implementations are expected to honor them,
and consumers may rely on them:

- **Objects merge per key.** A supplied key overwrites; an omitted key is
  PRESERVED, not dropped. Patching one key of a nested object (e.g. one
  field of `provenance`) leaves its siblings intact.
- **An explicit `null` on a sub-key clears exactly that sub-key.** This is
  the sanctioned way to remove a single key from a nested object.
- **Arrays replace wholesale** — `tags` / `links` are never element-merged.
- **A whole-block `null` that would delete a REQUIRED field is rejected
  loudly** (`Result.fail`), never silently accepted. `body` / `tags` /
  `links` / `provenance` are required; `embeddingRef` is optional and a
  `null` restores it to absent (NOT to `null`), so it stays hash-stable.

Which fields these guarantees cover is **policy-dependent**: they apply to
the fields the policy declares in [IWritePolicy.mutableFields](../interfaces/IWritePolicy.md#property-mutablefields), and a
field outside that list is inert — its patch key is dropped before the merge,
so a `null` on it neither clears the value nor raises an error.

#### Implementation of

[`IWritePolicy`](../interfaces/IWritePolicy.md).[`applyUpdate`](../interfaces/IWritePolicy.md#applyupdate)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TemporalVersionedPolicy`\>

Family-convention factory. Constructs the shared `JsonEditor` instances (one
for cloning, one for the RFC-7386 merge), rules disabled — the same merge
config as the shipped policies.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TemporalVersionedPolicy`\>
