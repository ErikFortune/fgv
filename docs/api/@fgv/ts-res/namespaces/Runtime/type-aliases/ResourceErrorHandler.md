[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ResourceErrorHandler

# Type Alias: ResourceErrorHandler()

> **ResourceErrorHandler** = (`resource`, `message`, `resolver`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`\>

Type for handling resource resolution errors during tree traversal.
The handler receives the resource that failed to resolve, the error message, and the resolver for recovery attempts.
It can return:
- Success(undefined) to omit the property from the result
- Success(value) to use an alternate value
- Failure to propagate the error

## Parameters

| Parameter | Type |
| ------ | ------ |
| `resource` | [`IResource`](../interfaces/IResource.md) |
| `message` | `string` |
| `resolver` | [`ResourceResolver`](../../../classes/ResourceResolver.md) |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) \| `undefined`\>
