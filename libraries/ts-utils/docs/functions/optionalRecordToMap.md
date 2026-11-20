[Home](../README.md) > optionalRecordToMap

# Function: optionalRecordToMap

Applies a factory method to convert an optional `Record<TK, TS>` into a `Map<TK, TD>`, or `undefined`.

## Signature

```typescript
function optionalRecordToMap(src: Record<TK, TS> | undefined, factory: KeyedThingFactory<TS, TD, TK>): Result<Map<TK, TD> | undefined>
```
