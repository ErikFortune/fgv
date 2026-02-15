[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / compositeIdString

# Function: compositeIdString()

> **compositeIdString**\<`T`, `TCOLLECTIONID`, `TITEMID`, `TC`\>(`compositeIdConverter`, `collectionIdConverter`, `separator`, `itemIdConverter`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Converts a strongly-typed [CompositeId](../interfaces/ICompositeId.md) into a string.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | - |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `compositeIdConverter` | [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) that validates/converts the composite ID string. |
| `collectionIdConverter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TCOLLECTIONID`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TCOLLECTIONID`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the collection ID portion. |
| `separator` | `string` | The separator string. |
| `itemIdConverter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TITEMID`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TITEMID`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the item ID portion. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which produces a composite ID string.
