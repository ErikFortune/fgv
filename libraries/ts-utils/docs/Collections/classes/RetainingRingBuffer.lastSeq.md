[Home](../../README.md) > [Collections](../README.md) > [RetainingRingBuffer](./RetainingRingBuffer.md) > lastSeq

## RetainingRingBuffer.lastSeq property

The highest `seq` pushed so far. A client can hold this value and pass it as
`sinceSeq` to page only records pushed afterward. Stable across eviction and
RetainingRingBuffer.clear | clear().

**Signature:**

```typescript
readonly lastSeq: number;
```
