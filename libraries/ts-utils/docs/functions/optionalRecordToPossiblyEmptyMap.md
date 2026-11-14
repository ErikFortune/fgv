[Home](../README.md) > optionalRecordToPossiblyEmptyMap

# Function: optionalRecordToPossiblyEmptyMap

Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`

## Signature

```typescript
function optionalRecordToPossiblyEmptyMap(src: Record<TK, TS> | undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Map<TK, TD>>
```
