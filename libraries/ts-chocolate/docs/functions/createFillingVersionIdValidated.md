[Home](../README.md) > createFillingVersionIdValidated

# Function: createFillingVersionIdValidated

Creates and validates a filling version ID from component parts.
Uses converter to ensure the formatted ID is valid.

## Signature

```typescript
function createFillingVersionIdValidated(parts: { collectionId: FillingId; itemId: FillingVersionSpec }): Result<FillingVersionId>
```
