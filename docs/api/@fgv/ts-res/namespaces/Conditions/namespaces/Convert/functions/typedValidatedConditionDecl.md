[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Conditions](../../../README.md) / [Convert](../README.md) / typedValidatedConditionDecl

# Function: typedValidatedConditionDecl()

> **typedValidatedConditionDecl**\<`TQualifierNames`\>(`qualifierNameConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidatedConditionDecl`](../../../interfaces/IValidatedConditionDecl.md), [`IConditionDeclConvertContext`](../interfaces/IConditionDeclConvertContext.md)\>

Returns a `Converter` for an `IValidatedConditionDecl` narrowed on a supplied
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

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidatedConditionDecl`](../../../interfaces/IValidatedConditionDecl.md), [`IConditionDeclConvertContext`](../interfaces/IConditionDeclConvertContext.md)\>

## Remarks

The typed sibling layers literal-string narrowing on top of the existing
collector-membership check performed by `validatedConditionDecl`.
