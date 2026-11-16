[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ConditionSetDeclAsArray

# Type Alias: ConditionSetDeclAsArray\<TQualifierNames\>

> **ConditionSetDeclAsArray**\<`TQualifierNames`\> = `ReadonlyArray`\<[`ILooseConditionDecl`](../interfaces/ILooseConditionDecl.md)\<`TQualifierNames`\>\>

Non-validated array-form declaration of a [condition set](../../../../Conditions/classes/ConditionSet.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Remarks

Parameterized on `TQualifierNames` via `ILooseConditionDecl`;
defaults to `string` for back-compat with existing untyped callers.
