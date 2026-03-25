[Home](../README.md) > compositeIdString

# Function: compositeIdString

Converts a strongly-typed Converters.ICompositeId | CompositeId into a string.

## Signature

```typescript
function compositeIdString(compositeIdConverter: Validator<T, TC> | Converter<T, TC>, collectionIdConverter: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>, separator: string, itemIdConverter: Converter<TITEMID, TC> | Validator<TITEMID, TC>): Converter<T, TC>
```
