[Home](../README.md) > JsonReferenceMapFailureReason

# Type Alias: JsonReferenceMapFailureReason

Failure reason for IJsonReferenceMap | IJsonReferenceMap lookup, where `'unknown'`
means that the object is not present in the map and `'error'` means
that an error occurred while retrieving or converting it.

## Type

```typescript
type JsonReferenceMapFailureReason = "unknown" | "error"
```
