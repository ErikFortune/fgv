[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / EmptyBranchHandler

# Type Alias: EmptyBranchHandler()

> **EmptyBranchHandler** = (`branchNode`, `failedChildNames`, `resolver`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`\>

Type for handling empty branch nodes during tree composition.
The handler receives the branch node, names of failed children, and the resolver for recovery attempts.
It can return:
- Success(undefined) to omit the branch from the result
- Success(value) to use an alternate value for the branch
- Failure to propagate the error

## Parameters

| Parameter | Type |
| ------ | ------ |
| `branchNode` | [`IReadOnlyResourceTreeNode`](../namespaces/ResourceTree/type-aliases/IReadOnlyResourceTreeNode.md)\<[`IResource`](../interfaces/IResource.md)\> |
| `failedChildNames` | `string`[] |
| `resolver` | [`ResourceResolver`](../../../classes/ResourceResolver.md) |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`\>
