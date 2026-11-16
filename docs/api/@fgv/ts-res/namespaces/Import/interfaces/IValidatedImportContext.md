[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Import](../README.md) / IValidatedImportContext

# Interface: IValidatedImportContext

Accumulated context of a resource import operation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-baseid"></a> `baseId?` | `readonly` | [`ResourceId`](../../../type-aliases/ResourceId.md) | Base ID for the import context for resources imported in this context. |
| <a id="property-conditions"></a> `conditions` | `readonly` | readonly [`IConditionDecl`](../../Conditions/type-aliases/IConditionDecl.md)[] | Conditions to be applied to resources imported in this context. |
