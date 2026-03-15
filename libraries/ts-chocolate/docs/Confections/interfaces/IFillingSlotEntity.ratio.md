[Home](../../README.md) > [Confections](../README.md) > [IFillingSlotEntity](./IFillingSlotEntity.md) > ratio

## IFillingSlotEntity.ratio property

Relative volume ratio for this slot. Default is 1 (equal distribution).
For a 2:1 ratio between two slots, set 2 and 1 respectively.
The scaling code computes each slot's share as (ratio / sumOfAllRatios).

**Signature:**

```typescript
readonly ratio: number;
```
