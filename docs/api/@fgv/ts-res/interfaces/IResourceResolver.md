[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / IResourceResolver

# Interface: IResourceResolver

Minimal resource resolver

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="resourceids"></a> `resourceIds` | `readonly` | readonly [`ResourceId`](../type-aliases/ResourceId.md)[] | The resource IDs that this resolver can resolve. |

## Methods

### resolveComposedResourceValue()

> **resolveComposedResourceValue**(`resource`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Resolves a resource to a composed value by merging matching candidates according to their merge methods.
Starting from the highest priority candidates, finds the first "full" candidate and merges all higher
priority "partial" candidates into it in ascending order of priority.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | `string` | The string id of the resource to resolve. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

`Success` with the composed JsonValue if successful,
or `Failure` with an error message if no candidates match or resolution fails.

***

### withContext()

> **withContext**(`context`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IResourceResolver`\>

Creates a new resource resolver with the given context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `Record`\<`string`, `string`\> | The context to use for the new resource resolver. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IResourceResolver`\>

`Success` with the new resource resolver if successful,
or `Failure` with an error message if the context is invalid.
