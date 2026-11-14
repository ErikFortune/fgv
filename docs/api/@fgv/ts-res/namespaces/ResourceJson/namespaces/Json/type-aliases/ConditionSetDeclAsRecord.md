[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ConditionSetDeclAsRecord

# Type Alias: ConditionSetDeclAsRecord\<TQualifierNames\>

> **ConditionSetDeclAsRecord**\<`TQualifierNames`\> = `Readonly`\<`Partial`\<`Record`\<`TQualifierNames`, `string` \| [`IChildConditionDecl`](../interfaces/IChildConditionDecl.md)\>\>\>

Non-validated record-form declaration of a [condition set](../../../../Conditions/classes/ConditionSet.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Remarks

Parameterized on `TQualifierNames`; defaults to `string` for back-compat with
existing untyped callers. Uses `Readonly<Partial<Record<...>>>` to align with
runtime reality (missing keys produce `undefined`; the `Partial` makes TypeScript
aware of this, which is a strict type-system tightening).
