[Home](../README.md) > [IRetainedRecord](./IRetainedRecord.md) > seq

## IRetainedRecord.seq property

Monotonic sequence number, assigned by the caller. The buffer requires
**strictly increasing** `seq` across successive RetainingRingBuffer.push | push
calls — `sinceSeq` cursor paging uses a strict `seq > sinceSeq` filter, so
duplicate `seq` values held by a consumer cursor would never be re-yielded
if pushed afterward. RetainingRingBuffer.lastSeq | lastSeq likewise
advances only past values strictly greater than its current value.

**Signature:**

```typescript
readonly seq: number;
```
