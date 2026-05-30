[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / deriveLeafId

# Function: deriveLeafId()

> **deriveLeafId**(`fullResourceId`): [`Result`](../../../type-aliases/Result.md)\<`string`\>

Derives a leaf ID from a full resource ID.
Extracts the last segment after the final dot.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fullResourceId` | `string` | Full resource ID (e.g., 'platform.languages.az-AZ') |

## Returns

[`Result`](../../../type-aliases/Result.md)\<`string`\>

Result containing the leaf ID (e.g., 'az-AZ') or error if invalid format

## Example

```typescript
const leafResult = deriveLeafId('platform.languages.az-AZ');
if (leafResult.isSuccess()) {
  console.log(leafResult.value); // 'az-AZ'
}

const invalidResult = deriveLeafId('invalid');
if (invalidResult.isFailure()) {
  console.log(invalidResult.message); // 'Resource ID must contain at least one dot'
}
```
