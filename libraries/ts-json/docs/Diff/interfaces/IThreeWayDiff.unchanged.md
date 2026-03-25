[Home](../../README.md) > [Diff](../README.md) > [IThreeWayDiff](./IThreeWayDiff.md) > unchanged

## IThreeWayDiff.unchanged property

Contains properties that exist in both objects with identical values.

This object represents the stable, consistent data between both inputs
and can be used for:
- The foundation for merging operations
- Identifying what remained constant during changes
- Building complete objects by combining with other parts

Will be `null` if no properties are shared between the objects.

**Signature:**

```typescript
unchanged: JsonValue;
```
