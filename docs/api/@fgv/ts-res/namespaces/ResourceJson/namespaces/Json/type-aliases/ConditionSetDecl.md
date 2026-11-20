[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ConditionSetDecl

# Type Alias: ConditionSetDecl\<TQualifierNames\>

> **ConditionSetDecl**\<`TQualifierNames`\> = [`ConditionSetDeclAsArray`](ConditionSetDeclAsArray.md)\<`TQualifierNames`\> \| [`ConditionSetDeclAsRecord`](ConditionSetDeclAsRecord.md)\<`TQualifierNames`\>

Non-validated declaration of a [condition set](../../../../Conditions/classes/ConditionSet.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Remarks

Parameterized on `TQualifierNames`; defaults to `string`. Both the
array form (`ConditionSetDeclAsArray`) and the record form
(`ConditionSetDeclAsRecord`) inherit the parameter, so a
consumer threading a narrow `TQualifierNames` gets compile-time
rejection of typo'd axis names in either form.
