[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / deriveFullId

# Function: deriveFullId()

> **deriveFullId**(`rootPath`, `leafId`): [`Result`](../../../type-aliases/Result.md)\<`string`\>

Constructs a full resource ID from a root path and leaf ID.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rootPath` | `string` | Root path (e.g., 'platform.languages') |
| `leafId` | `string` | Leaf identifier (e.g., 'az-AZ') |

## Returns

[`Result`](../../../type-aliases/Result.md)\<`string`\>

Result containing the full resource ID or error if invalid inputs

## Example

```typescript
const fullIdResult = deriveFullId('platform.languages', 'az-AZ');
if (fullIdResult.isSuccess()) {
  console.log(fullIdResult.value); // 'platform.languages.az-AZ'
}

const invalidResult = deriveFullId('', 'az-AZ');
if (invalidResult.isFailure()) {
  console.log(invalidResult.message); // 'Root path cannot be empty'
}
```
