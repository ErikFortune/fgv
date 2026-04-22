[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeChildResource

# Function: mergeChildResource()

> **mergeChildResource**(`resource`, `name`, `parentName?`, `parentConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../Normalized/interfaces/ILooseResourceDecl.md)\>

Helper method to merge a child resource with a parent name and conditions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | [`IChildResourceDecl`](../../Normalized/interfaces/IChildResourceDecl.md) | The resource to merge. |
| `name` | `string` | The name of the resource. |
| `parentName?` | `string` | The name of the parent resource. |
| `parentConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The conditions of the parent resource. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceDecl`](../../Normalized/interfaces/ILooseResourceDecl.md)\>

`Success` with the merged resource if successful, otherwise `Failure`.
