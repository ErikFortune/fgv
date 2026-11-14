[Home](../README.md) > recordToMap

# Function: recordToMap

Applies a factory method to convert a `Record<TK, TS>` into a `Map<TK, TD>`.

## Signature

```typescript
function recordToMap(src: Record<TK, TS>, factory: KeyedThingFactory<TS, TD, TK>): Result<Map<TK, TD>>
```
