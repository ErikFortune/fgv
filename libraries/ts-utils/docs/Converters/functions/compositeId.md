[Home](../../README.md) > [Converters](../README.md) > compositeId

# Function: compositeId

Creates a Converter | Converter for a strongly-typed Converters.ICompositeId | CompositeId from
either a string or an object representation.

## Signature

```typescript
function compositeId(collectionIdConverter: Converter<TCOLLECTIONID, TC> | Validator<TCOLLECTIONID, TC>, separator: string, itemIdConverter: Converter<TITEMID, TC> | Validator<TITEMID, TC>): Converter<ICompositeId<TCOLLECTIONID, TITEMID>, TC>
```
