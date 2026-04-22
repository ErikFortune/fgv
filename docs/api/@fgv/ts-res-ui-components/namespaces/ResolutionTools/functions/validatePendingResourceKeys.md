[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / validatePendingResourceKeys

# Function: validatePendingResourceKeys()

> **validatePendingResourceKeys**(`pendingResources`): [`Result`](../../../type-aliases/Result.md)\<`void`\>

Validates that all keys in a pending resources map are properly formatted as full resource IDs.
This is a diagnostic function to ensure the pending resource key invariant is maintained.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pendingResources` | `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> | Map of pending resources to validate |

## Returns

[`Result`](../../../type-aliases/Result.md)\<`void`\>

Result indicating whether all keys are valid full resource IDs, or details about any issues found

## Example

```typescript
const validation = validatePendingResourceKeys(pendingResources);
if (validation.isFailure()) {
  console.error('Pending resource key validation failed:', validation.message);
}
```
