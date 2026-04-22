[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeLooseResource

# Function: mergeLooseResource()

> **mergeLooseResource**(`resource`, `baseName?`, `baseConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../Normalized/interfaces/ILooseResourceDecl.md)\>

Helper method to merge a loose resource with a base name and conditions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | [`IImporterResourceDecl`](../../Normalized/type-aliases/IImporterResourceDecl.md) | The resource to merge. |
| `baseName?` | `string` | The base name to merge with the resource. |
| `baseConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The base conditions to merge with the resource. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../Normalized/interfaces/ILooseResourceDecl.md)\>

`Success` with the merged resource if successful, otherwise `Failure`.
