[Home](../README.md) > [RetainingLogger](./RetainingLogger.md) > clear

## RetainingLogger.clear() method

Clears all retained records. Does NOT reset the sequence counter, so a client
holding a `sinceSeq` cursor never re-sees a sequence number.

**Signature:**

```typescript
clear(): void;
```

**Returns:**

void
