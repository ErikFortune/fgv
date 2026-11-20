[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptObservationStore

# Class: PromptObservationStore

The default in-memory observation store: an [IPromptObserver](../interfaces/IPromptObserver.md) that
retains the records it observes in a bounded ring and answers schema-aware
[queries](#query) over them.

## Remarks

**Privacy posture — this store is most-permissive by design.** It retains
every field of every record verbatim, including the rendered `body`, the raw
LLM `rawOutput`, the `qualifierContext`, and the caller `substitutions`
(which may carry PII). The library bakes in **no** redaction, retention, or
field-stripping policy — that is deployment policy, not library policy. A
deployment that must redact either wraps this store with its own
[IPromptObserver](../interfaces/IPromptObserver.md) that transforms records before forwarding, or
substitutes a different observer entirely (write-to-SIEM, hashing store,
etc.). Size is the only bounded dimension, via `maxRecords`.

The store implements [IPromptObserver](../interfaces/IPromptObserver.md) directly — `observe` (the hook)
and `query` (the read surface) live on the same class. Wire it via
`IPromptLibraryCreateParams.observers`. `seq` and `timestamp` are assigned by
`PromptLibrary` before `observe`, so this store never mints them.

## Implements

- [`IPromptObserver`](../interfaces/IPromptObserver.md)

## Accessors

### lastSeq

#### Get Signature

> **get** **lastSeq**(): `number`

The highest `seq` observed so far. Hold this value and pass it as
`sinceSeq` to [query](#query) to page only
records observed afterward. Stable across ring eviction and
[clear](#clear).

##### Returns

`number`

***

### size

#### Get Signature

> **get** **size**(): `number`

The number of records currently retained.

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Clears all retained records. Does NOT reset [lastSeq](#lastseq),
so a held `sinceSeq` cursor never re-sees a sequence number.

#### Returns

`void`

***

### observe()

> **observe**(`record`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\>

Receives a fully-formed observation record.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | [`IPromptObservationRecord`](../type-aliases/IPromptObservationRecord.md) | The observation record. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>\>

A `Result` whose failure is swallowed (logged to the library's
diagnostic logger). A rejected promise is likewise swallowed.

#### Implementation of

[`IPromptObserver`](../interfaces/IPromptObserver.md).[`observe`](../interfaces/IPromptObserver.md#observe)

***

### query()

> **query**(`criteria?`): readonly [`IPromptObservationRecord`](../type-aliases/IPromptObservationRecord.md)[]

Returns retained records, oldest-first, narrowed by the supplied criteria.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `criteria?` | [`IPromptObservationQuery`](../interfaces/IPromptObservationQuery.md) | [AND-combined filter criteria](../interfaces/IPromptObservationQuery.md). |

#### Returns

readonly [`IPromptObservationRecord`](../type-aliases/IPromptObservationRecord.md)[]

The matching records, oldest-first.

***

### create()

> `static` **create**(`params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PromptObservationStore`\>

Family-convention factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IPromptObservationStoreCreateParams`](../interfaces/IPromptObservationStoreCreateParams.md) | [Construction options](../interfaces/IPromptObservationStoreCreateParams.md). |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PromptObservationStore`\>

On success, a new store. Fails if `maxRecords` is supplied and is
not a positive integer.
