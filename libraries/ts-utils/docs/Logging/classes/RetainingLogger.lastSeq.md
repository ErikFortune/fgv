[Home](../../README.md) > [Logging](../README.md) > [RetainingLogger](./RetainingLogger.md) > lastSeq

## RetainingLogger.lastSeq property

The most recently assigned sequence number. A client can hold this value and
pass it as `sinceSeq` to page only records logged afterward.

**Signature:**

```typescript
readonly lastSeq: number;
```
