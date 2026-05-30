[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / isPendingAddition

# Function: isPendingAddition()

> **isPendingAddition**(`resourceId`, `pendingResources`): `boolean`

Checks if a resource ID corresponds to a pending addition.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resourceId` | `string` | Resource ID to check (should be full resource ID) |
| `pendingResources` | `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> | Map of pending resources |

## Returns

`boolean`

True if the resource ID exists in pending resources

## Example

```typescript
if (isPendingAddition('platform.languages.az-AZ', pendingResources)) {
  console.log('This is a pending resource');
}
```
