[Home](../README.md) > compositeIdFromObject

# Function: compositeIdFromObject

Creates an ObjectConverter | ObjectConverter for a strongly-typed Converters.ICompositeId | CompositeId.

## Signature

```typescript
function compositeIdFromObject(collectionIdValidator: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>, separator: string, itemIdValidator: Converter<TITEMID, TC> | Validator<TITEMID, TC>): Converter<ICompositeId<TCOLLECTIONID, TITEMID>, TC>
```
