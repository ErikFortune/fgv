[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Convert](../README.md) / typedChildResourceDecl

# Function: typedChildResourceDecl()

> **typedChildResourceDecl**\<`TQualifierNames`\>(`qualifierNameConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IChildResourceDecl`](../../Json/interfaces/IChildResourceDecl.md)\<`TQualifierNames`\>\>

Returns a `Converter` for a `Json.IChildResourceDecl<TQualifierNames>`
narrowed on a supplied `qualifierName` converter.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `qualifierNameConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TQualifierNames`\> |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IChildResourceDecl`](../../Json/interfaces/IChildResourceDecl.md)\<`TQualifierNames`\>\>
