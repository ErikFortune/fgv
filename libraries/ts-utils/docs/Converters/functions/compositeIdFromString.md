[Home](../../README.md) > [Converters](../README.md) > compositeIdFromString

# Function: compositeIdFromString

Converts a composite ID string into a strongly-typed Converters.ICompositeId | CompositeId.

## Signature

```typescript
function compositeIdFromString(collectionIdConverter: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>, separator: string, itemIdConverter: Converter<TITEMID, TC> | Validator<TITEMID, TC>): Converter<ICompositeId<TCOLLECTIONID, TITEMID>, TC>
```
