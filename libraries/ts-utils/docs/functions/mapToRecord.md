[Home](../README.md) > mapToRecord

# Function: mapToRecord

Applies a factory method to convert a `ReadonlyMap<TK, TS>` into a `Record<TK, TD>`.

## Signature

```typescript
function mapToRecord(src: ReadonlyMap<TK, TS>, factory: KeyedThingFactory<TS, TD, TK>): Result<Record<TK, TD>>
```
