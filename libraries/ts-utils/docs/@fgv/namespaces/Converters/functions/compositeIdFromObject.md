[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / compositeIdFromObject

# Function: compositeIdFromObject()

> **compositeIdFromObject**\<`TCOLLECTIONID`, `TITEMID`, `TC`\>(`collectionIdValidator`, `separator`, `itemIdValidator`): [`Converter`](../../Conversion/interfaces/Converter.md)\<[`ICompositeId`](../interfaces/ICompositeId.md)\<`TCOLLECTIONID`, `TITEMID`\>, `TC`\>

Creates an [ObjectConverter](../../Conversion/classes/ObjectConverter.md) for a strongly-typed [CompositeId](../interfaces/ICompositeId.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionIdValidator` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TCOLLECTIONID`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TCOLLECTIONID`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the collection ID portion. |
| `separator` | `string` | The separator string. |
| `itemIdValidator` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TITEMID`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TITEMID`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the item ID portion. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<[`ICompositeId`](../interfaces/ICompositeId.md)\<`TCOLLECTIONID`, `TITEMID`\>, `TC`\>

An [ObjectConverter](../../Conversion/classes/ObjectConverter.md) for the strongly-typed composite ICompositeId.
