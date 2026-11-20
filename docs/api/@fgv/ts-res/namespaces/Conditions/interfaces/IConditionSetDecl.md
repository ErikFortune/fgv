[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / IConditionSetDecl

# Interface: IConditionSetDecl\<TQualifierNames\>

Non-validated declaration of a [set of conditions](../classes/ConditionSet.md).

## Remarks

Parameterized on `TQualifierNames` (defaulting to `string`) so consumers can
opt into compile-time axis-name discipline by supplying a literal-string union.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-conditions"></a> `conditions` | [`IConditionDecl`](../type-aliases/IConditionDecl.md)\<`TQualifierNames`\>[] |
