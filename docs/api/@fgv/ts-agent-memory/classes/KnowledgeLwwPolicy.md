[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / KnowledgeLwwPolicy

# Class: KnowledgeLwwPolicy

Last-write-wins write policy for the knowledge kind family. Admission
always accepts (no cap, no cull); updates apply an RFC-7386 merge patch
restricted to the knowledge mutable surface.

## Remarks

**Merge-surface pin (resolves design-lock §5.3's body-vs-envelope muddle).**
The declared `mutableFields` span both axes of a record: `body` is the
per-kind body, while `tags` / `links` / `provenance` / `embeddingRef` live
on the [IMemoryEnvelope](../interfaces/IMemoryEnvelope.md). `applyUpdate` projects exactly those fields
— each read from its canonical location — into a single record-level JSON
view, runs the merge over that view, then rebuilds a coherent record. The
identity and transaction-time envelope fields (`id`, `entityId`, `kind`,
`created`, `updated`, `seq`, `contentHash`) are NOT mutable and are
preserved verbatim; the store stamps `updated` / `seq` / `contentHash` on write.

Because the surface is pinned rather than caller-supplied, the RFC-7386
guarantees documented on [IWritePolicy.applyUpdate](../interfaces/IWritePolicy.md#applyupdate) apply to every field
listed above — in particular to `provenance`, whose keys merge individually, a
`null` on any one of which clears that key alone, and a `null` on the whole
block of which is rejected loudly (it is a required field). Consumers may
depend on this; it is covered by tests.

## Implements

- [`IWritePolicy`](../interfaces/IWritePolicy.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dedupscope"></a> `dedupScope` | `public readonly` | [`DedupScope`](../type-aliases/DedupScope.md) | `'content'` | Knowledge dedups scope-wide: an identical `{ kind, body, links }` triple anywhere in the `knowledge` scope — even under a different `docId` — is a no-op. Declared explicitly so the B1 content-dedup behavior (and its tests) are unchanged by the [DedupScope](../type-aliases/DedupScope.md) amendment. |
| <a id="property-mutablefields"></a> `mutableFields` | `public readonly` | readonly `string`[] | `...` | The knowledge mutable surface: the body plus the envelope metadata a consumer may revise without minting a new entity. Pinned, not caller-supplied — see the class remarks for what that guarantees. |

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

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`KnowledgeLwwPolicy`\>

Family-convention factory. Constructs the shared `JsonEditor` instances
(one for cloning, one for the RFC-7386 merge), both with the template /
conditional / multivalue / reference rules disabled (empty rules array).

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`KnowledgeLwwPolicy`\>
