[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / compositeId

# Function: compositeId()

> **compositeId**\<`TCOLLECTIONID`, `TITEMID`, `TC`\>(`collectionIdConverter`, `separator`, `itemIdConverter`): [`Converter`](../../Conversion/interfaces/Converter.md)\<[`ICompositeId`](../interfaces/ICompositeId.md)\<`TCOLLECTIONID`, `TITEMID`\>, `TC`\>

Creates a [Converter](../../Conversion/interfaces/Converter.md) for a strongly-typed [CompositeId](../interfaces/ICompositeId.md) from
either a string or an object representation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionIdConverter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TCOLLECTIONID`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TCOLLECTIONID`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the collection ID portion. |
| `separator` | `string` | The separator string. |
| `itemIdConverter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TITEMID`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TITEMID`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the item ID portion. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<[`ICompositeId`](../interfaces/ICompositeId.md)\<`TCOLLECTIONID`, `TITEMID`\>, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) for the strongly-typed [CompositeId](../interfaces/ICompositeId.md).
