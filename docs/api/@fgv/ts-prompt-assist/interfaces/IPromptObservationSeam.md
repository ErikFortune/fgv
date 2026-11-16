[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptObservationSeam

# Interface: IPromptObservationSeam

The narrow observation seam a [PromptLibrary](../classes/PromptLibrary.md) hands out (via
[PromptLibrary.observationSeam](../classes/PromptLibrary.md#observationseam)) so a [HorizontalComposer](../classes/HorizontalComposer.md) can emit
a `'compose'` observation that shares the library's `seq` authority, clock,
and observer fan-out — without the composer taking a dependency on the whole
library or minting its own sequence numbers (which would collide with the
store cursor's `lastSeq`).

## Remarks

The library owns all three because they must be shared: `seq` is a single
per-instance authority so a compose record orders consistently against the
contributor `'resolve'` records; `now` is the library's injected clock so
every record timestamps against the same source; `observe` is the library's
swallow-and-log fan-out so a composer-emitted record reaches every wired
observer under the same "observer errors never affect the caller" contract.

## Methods

### nextSeq()

> **nextSeq**(): `number`

Mints the next monotonic 1-based `seq` from the library's single
per-instance authority.

#### Returns

`number`

***

### now()

> **now**(): `number`

Reads the library's injected clock (milliseconds since epoch).

#### Returns

`number`

***

### observe()

> **observe**(`record`): `Promise`\<`void`\>

Fans a record out to every wired observer under the library's
swallow-and-log contract (observer errors never propagate). Resolves once
awaited observers have completed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | [`IPromptObservationRecord`](../type-aliases/IPromptObservationRecord.md) | The observation record to dispatch. |

#### Returns

`Promise`\<`void`\>
