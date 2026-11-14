[Home](../../README.md) > [Collections](../README.md) > [RetainingRingBuffer](./RetainingRingBuffer.md) > clear

## RetainingRingBuffer.clear() method

Clears all retained records. Does NOT reset RetainingRingBuffer.lastSeq | lastSeq,
so a client holding a `sinceSeq` cursor never re-sees a sequence number.

**Signature:**

```typescript
clear(): void;
```

**Returns:**

void
