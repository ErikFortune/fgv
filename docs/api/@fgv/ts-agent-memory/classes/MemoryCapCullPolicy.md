[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryCapCullPolicy

# Class: MemoryCapCullPolicy

Bounded-ring write policy for the experience (memory) kind families.
Admission accepts until `maxRecords` is reached, then evicts the oldest
record(s) by `created` ascending (design-lock §5.3); updates apply the same
RFC-7386 merge patch as [KnowledgeLwwPolicy](KnowledgeLwwPolicy.md), restricted to the declared
[mutableFields](../interfaces/IMemoryCapCullPolicyParams.md#property-mutablefields).

## Remarks

- **Dedup scope.** Declares `dedupScope: 'entity'` — two distinct memory
  entities (e.g. `turn-5` / `turn-9`) with identical `{ kind, body, links }`
  never collapse; only an identical re-put of the SAME entity is a no-op.
- **Eviction boundary.** `admit` only DECIDES (returns the `MemoryId`s to
  evict); the store executes the file deletions and index patches. The
  `existing` cohort the cap counts against is whatever the store supplies to
  `admit`.

## Implements

- [`IWritePolicy`](../interfaces/IWritePolicy.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dedupscope"></a> `dedupScope` | `public readonly` | [`DedupScope`](../type-aliases/DedupScope.md) | `'entity'` | Experience kinds dedup per-entity (see the class remarks). |
| <a id="property-mutablefields"></a> `mutableFields` | `public readonly` | readonly `string`[] | `undefined` | Names of the fields a merge-patch update may touch. Fields outside this list are immutable; a change to one constitutes a new entity (its `contentHash` differs). Used by [IWritePolicy.applyUpdate](../interfaces/IWritePolicy.md#applyupdate) to restrict which fields the patch applies. |

## Methods

### admit()

> **admit**(`__incoming`, `existing`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AdmissionDecision`](../type-aliases/AdmissionDecision.md)\>

Determine whether the incoming record is admitted.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__incoming` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> | The record about to be written. |
| `existing` | readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[] | The admission cohort the kind's cap applies to: the records in the same scope of the same kind, EXCLUDING the record at `incoming`'s target id. Empty on a first write into an empty cohort. Excluding the target id makes the post-write count uniform (`existing.length + 1`) across first-writes and same-id updates. A last-write-wins policy that has no cap ignores this argument. |

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MemoryCapCullPolicy`\>

Family-convention factory. Constructs the shared `JsonEditor` instances
(one for cloning, one for the RFC-7386 merge) with the same merge config as
[KnowledgeLwwPolicy](KnowledgeLwwPolicy.md) (`nullAsDelete` true, `arrayMergeBehavior`
`'replace'`, rules disabled).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IMemoryCapCullPolicyParams`](../interfaces/IMemoryCapCullPolicyParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MemoryCapCullPolicy`\>
