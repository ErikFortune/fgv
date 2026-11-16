[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Conditions](../../../README.md) / [Convert](../README.md) / typedConditionDecl

# Function: typedConditionDecl()

> **typedConditionDecl**\<`TQualifierNames`\>(`qualifierNameConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConditionDecl`](../../../type-aliases/IConditionDecl.md)\<`TQualifierNames`\>\>

Returns a `Converter` for an `IConditionDecl<TQualifierNames>` narrowed on a supplied
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

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConditionDecl`](../../../type-aliases/IConditionDecl.md)\<`TQualifierNames`\>\>

## Remarks

Pass e.g. `Converters.enumeratedValue(['tone', 'language'] as const)` to reject
typo'd qualifier names at convert time and to narrow the resulting
`IConditionDecl<T>` type to the same literal-string union. The default
`conditionDecl` is the `Converters.string` instantiation of this shape.
