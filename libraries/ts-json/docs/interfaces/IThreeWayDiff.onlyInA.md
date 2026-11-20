[Home](../README.md) > [IThreeWayDiff](./IThreeWayDiff.md) > onlyInA

## IThreeWayDiff.onlyInA property

Contains properties that exist only in the first object, plus the first object's
version of any properties that exist in both but have different values.

This object represents the "old" or "source" state and can be used for:
- Reverting changes by merging with `unchanged`
- Displaying what was removed or changed from the original
- Understanding the baseline state before modifications

Will be `null` if no properties are unique to the first object.

**Signature:**

```typescript
onlyInA: JsonValue;
```
