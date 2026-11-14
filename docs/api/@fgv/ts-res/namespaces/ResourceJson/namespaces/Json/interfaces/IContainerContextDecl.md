[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IContainerContextDecl

# Interface: IContainerContextDecl\<TQualifierNames\>

Declared context for a resource container.

## Remarks

Parameterized on `TQualifierNames` so the `conditions` field threads the
narrowed axis-name set to the container context. Defaults to `string` for
back-compat.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-baseid"></a> `baseId?` | `readonly` | `string` |
| <a id="property-conditions"></a> `conditions?` | `readonly` | [`ConditionSetDecl`](../type-aliases/ConditionSetDecl.md)\<`TQualifierNames`\> |
| <a id="property-mergemethod"></a> `mergeMethod?` | `readonly` | [`ResourceValueMergeMethod`](../../../../../type-aliases/ResourceValueMergeMethod.md) |
