[Home](../README.md) > optionalMapToPossiblyEmptyRecord

# Function: optionalMapToPossiblyEmptyRecord

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>`

## Signature

```typescript
function optionalMapToPossiblyEmptyRecord(src: ReadonlyMap<TK, TS> | undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD>>
```
