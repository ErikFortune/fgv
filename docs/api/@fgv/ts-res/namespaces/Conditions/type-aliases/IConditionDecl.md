[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / IConditionDecl

# Type Alias: IConditionDecl\<TQualifierNames\>

> **IConditionDecl**\<`TQualifierNames`\> = [`ILooseConditionDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)\<`TQualifierNames`\>

Non-validated declaration of a [condition](../../../classes/Condition.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Remarks

Parameterized on `TQualifierNames` (defaulting to `string`) so consumers
authoring conditions in code can opt into compile-time axis-name discipline.
