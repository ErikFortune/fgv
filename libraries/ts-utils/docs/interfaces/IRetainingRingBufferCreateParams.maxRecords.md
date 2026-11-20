[Home](../README.md) > [IRetainingRingBufferCreateParams](./IRetainingRingBufferCreateParams.md) > maxRecords

## IRetainingRingBufferCreateParams.maxRecords property

The maximum number of records retained before the oldest is overwritten.
Defaults to `1000`. Normalized to a positive integer: a fractional value is
floored toward the integer below (`2.9` → `2`), and a non-finite or sub-1
value is floored to `1` (the ring requires a positive integer capacity to
be well-defined).

**Signature:**

```typescript
readonly maxRecords: number;
```
