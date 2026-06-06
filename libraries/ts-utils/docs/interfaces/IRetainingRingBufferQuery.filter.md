[Home](../README.md) > [IRetainingRingBufferQuery](./IRetainingRingBufferQuery.md) > filter

## IRetainingRingBufferQuery.filter property

If supplied, only records for which the predicate returns `true` are
returned. Applied before `limit`, so `limit` bounds the filtered tail.

**Signature:**

```typescript
readonly filter: (record: T) => boolean;
```
