[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / selectVersionAsOf

# Function: selectVersionAsOf()

> **selectVersionAsOf**\<`T`\>(`versions`, `asOf`): `T` \| `undefined`

Select the version of an entity valid at `asOf` (epoch ms): the newest
(highest `seq`) version whose validity interval contains `asOf`. `undefined`
when no version was valid at that instant.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `versions` | readonly `T`[] |
| `asOf` | `number` |

## Returns

`T` \| `undefined`
