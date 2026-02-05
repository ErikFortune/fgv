[Home](../../README.md) > [Helpers](../README.md) > createConfectionVersionId

# Function: createConfectionVersionId

Creates and validates a confection version ID from component parts.
Uses converter to ensure the formatted ID is valid.

## Signature

```typescript
function createConfectionVersionId(parts: { collectionId: ConfectionId; itemId: ConfectionVersionSpec }): Result<ConfectionVersionId>
```
