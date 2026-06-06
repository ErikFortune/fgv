[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeContextDecl

# Function: mergeContextDecl()

> **mergeContextDecl**(`decl?`, `parentName?`, `parentConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IContainerContextDecl`](../../Normalized/interfaces/IContainerContextDecl.md)\>

Helper method to merge a resource context declaration with a parent name and conditions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl?` | [`IContainerContextDecl`](../../Normalized/interfaces/IContainerContextDecl.md) | The resource context declaration to merge. |
| `parentName?` | `string` | The name of the parent resource. |
| `parentConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The conditions of the parent resource. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IContainerContextDecl`](../../Normalized/interfaces/IContainerContextDecl.md)\>

`Success` with the merged resource context declaration if successful, otherwise `Failure`.
