[Home](../README.md) > optionalMapToRecord

# Function: optionalMapToRecord

Applies a factory method to convert an optional `ReadonlyMap<string, TS>` into a `Record<string, TD>` or `undefined`.

## Signature

```typescript
function optionalMapToRecord(src: ReadonlyMap<TK, TS> | undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD> | undefined>
```
