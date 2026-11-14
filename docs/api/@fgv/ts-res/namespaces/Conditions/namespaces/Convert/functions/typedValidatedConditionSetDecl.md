[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Conditions](../../../README.md) / [Convert](../README.md) / typedValidatedConditionSetDecl

# Function: typedValidatedConditionSetDecl()

> **typedValidatedConditionSetDecl**\<`TQualifierNames`\>(`qualifierNameConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidatedConditionSetDecl`](../../../interfaces/IValidatedConditionSetDecl.md), [`IConditionSetDeclConvertContext`](../interfaces/IConditionSetDeclConvertContext.md)\>

Returns a `Converter` for an `IValidatedConditionSetDecl` narrowed on a supplied
`qualifierName` converter.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `qualifierNameConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TQualifierNames`\> |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidatedConditionSetDecl`](../../../interfaces/IValidatedConditionSetDecl.md), [`IConditionSetDeclConvertContext`](../interfaces/IConditionSetDeclConvertContext.md)\>
