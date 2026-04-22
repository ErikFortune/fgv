[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [QualifierTypes](../../../README.md) / [Convert](../README.md) / literalValueHierarchyCreateParams

# Function: literalValueHierarchyCreateParams()

> **literalValueHierarchyCreateParams**\<`T`\>(`valueConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ILiteralValueHierarchyCreateParams`](../../../interfaces/ILiteralValueHierarchyCreateParams.md)\<`T`\>\>

Gets a converter for [ILiteralValueHierarchyCreateParams](../../../interfaces/ILiteralValueHierarchyCreateParams.md)
objects with values validated by a supplied value converter.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `valueConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> | Converter for the literal value type. |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ILiteralValueHierarchyCreateParams`](../../../interfaces/ILiteralValueHierarchyCreateParams.md)\<`T`\>\>
