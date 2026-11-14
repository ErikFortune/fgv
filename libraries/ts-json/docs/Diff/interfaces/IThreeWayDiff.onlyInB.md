[Home](../../README.md) > [Diff](../README.md) > [IThreeWayDiff](./IThreeWayDiff.md) > onlyInB

## IThreeWayDiff.onlyInB property

Contains properties that exist only in the second object, plus the second object's
version of any properties that exist in both but have different values.

This object represents the "new" or "target" state and can be used for:
- Applying changes by merging with `unchanged`
- Displaying what was added or changed in the update
- Understanding the desired end state after modifications

Will be `null` if no properties are unique to the second object.

**Signature:**

```typescript
onlyInB: JsonValue;
```
