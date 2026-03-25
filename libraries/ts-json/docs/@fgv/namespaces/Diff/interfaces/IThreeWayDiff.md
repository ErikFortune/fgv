[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [Diff](../README.md) / IThreeWayDiff

# Interface: IThreeWayDiff

Result of a three-way JSON diff operation.

This interface provides an actionable representation of differences between
two JSON values by separating them into three distinct objects. This approach
makes it easy to apply changes, display side-by-side comparisons, perform
merges, or programmatically work with the differences.

**Key Benefits:**
- **Actionable Results**: Objects can be directly used for merging or applying changes
- **UI-Friendly**: Perfect for side-by-side diff displays with clear visual separation
- **Merge-Ready**: Simplified three-way merge operations
- **Structured Data**: Maintains original JSON structure rather than flattened paths

## Example

```typescript
const result: IThreeWayDiff = {
  onlyInA: { name: "John", city: "NYC" },      // Original or removed data
  unchanged: { age: 30 },                      // Stable data
  onlyInB: { name: "Jane", country: "USA" },  // New or modified data
  metadata: { added: 1, removed: 1, modified: 1, unchanged: 1 },
  identical: false
};

// Apply changes: merge unchanged + onlyInB
const updated = { ...result.unchanged, ...result.onlyInB };
// Result: { age: 30, name: "Jane", country: "USA" }

// Revert changes: merge unchanged + onlyInA
const reverted = { ...result.unchanged, ...result.onlyInA };
// Result: { age: 30, name: "John", city: "NYC" }
```

## See

 - [IThreeWayDiffMetadata](IThreeWayDiffMetadata.md) for metadata structure details
 - [jsonThreeWayDiff](../functions/jsonThreeWayDiff.md) for the function that produces this result
 - [Diff.jsonDiff](../functions/jsonDiff.md) for an alternative detailed change-list approach

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="identical"></a> `identical` | `boolean` | True if the objects are identical, false otherwise. When `true`, both `onlyInA` and `onlyInB` will be `null`, and `unchanged` will contain the complete shared structure. The metadata will show zero added, removed, and modified properties. |
| <a id="metadata"></a> `metadata` | [`IThreeWayDiffMetadata`](IThreeWayDiffMetadata.md) | Summary metadata about the differences found. Provides counts of added, removed, modified, and unchanged properties for quick assessment of the scope and nature of changes. |
| <a id="onlyina"></a> `onlyInA` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Contains properties that exist only in the first object, plus the first object's version of any properties that exist in both but have different values. This object represents the "old" or "source" state and can be used for: - Reverting changes by merging with `unchanged` - Displaying what was removed or changed from the original - Understanding the baseline state before modifications Will be `null` if no properties are unique to the first object. |
| <a id="onlyinb"></a> `onlyInB` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Contains properties that exist only in the second object, plus the second object's version of any properties that exist in both but have different values. This object represents the "new" or "target" state and can be used for: - Applying changes by merging with `unchanged` - Displaying what was added or changed in the update - Understanding the desired end state after modifications Will be `null` if no properties are unique to the second object. |
| <a id="unchanged"></a> `unchanged` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Contains properties that exist in both objects with identical values. This object represents the stable, consistent data between both inputs and can be used for: - The foundation for merging operations - Identifying what remained constant during changes - Building complete objects by combining with other parts Will be `null` if no properties are shared between the objects. |
