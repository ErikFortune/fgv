[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / selectCurrentVersion

# Function: selectCurrentVersion()

> **selectCurrentVersion**\<`T`\>(`versions`): `T` \| `undefined`

Select the current version from a set of an entity's versions: the newest
(highest `seq`) version whose `invalid_at` is null/absent. `undefined` when the
entity has no current version (fully invalidated / soft-deleted, or empty).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `versions` | readonly `T`[] |

## Returns

`T` \| `undefined`
