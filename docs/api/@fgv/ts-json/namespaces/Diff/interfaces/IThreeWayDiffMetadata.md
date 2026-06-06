[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [Diff](../README.md) / IThreeWayDiffMetadata

# Interface: IThreeWayDiffMetadata

Metadata about the differences found in a three-way diff.

Provides summary statistics about the types and quantities of changes
detected between two JSON values, making it easy to understand the
overall scope of differences at a glance.

## Example

```typescript
const metadata: IThreeWayDiffMetadata = {
  removed: 2,    // 2 properties only in first object
  added: 1,      // 1 property only in second object
  modified: 3,   // 3 properties changed between objects
  unchanged: 5   // 5 properties identical in both objects
};

console.log(`Total changes: ${metadata.added + metadata.removed + metadata.modified}`);
console.log(`Stability: ${metadata.unchanged / (metadata.unchanged + metadata.modified) * 100}%`);
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="added"></a> `added` | `number` | Number of properties that exist only in the second object. These represent new data that was added when transitioning from the first object to the second object. |
| <a id="modified"></a> `modified` | `number` | Number of properties that exist in both objects but have different values. These represent data that was modified during the transition between objects. For arrays, this counts entire array replacements as single modifications. |
| <a id="removed"></a> `removed` | `number` | Number of properties that exist only in the first object. These represent data that was removed when transitioning from the first object to the second object. |
| <a id="unchanged"></a> `unchanged` | `number` | Number of properties that exist in both objects with identical values. These represent stable data that remained consistent between the two objects. |
