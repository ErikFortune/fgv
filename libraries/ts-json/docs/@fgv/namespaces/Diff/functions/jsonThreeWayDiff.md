[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [Diff](../README.md) / jsonThreeWayDiff

# Function: jsonThreeWayDiff()

> **jsonThreeWayDiff**(`obj1`, `obj2`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IThreeWayDiff`](../interfaces/IThreeWayDiff.md)\>

Performs a three-way diff comparison between two JSON values, returning separate
objects containing the differences and similarities.

This function provides an alternative to [Diff.jsonDiff](jsonDiff.md) that focuses on actionable
results rather than detailed change analysis. Instead of a list of individual changes,
it returns three objects that can be directly used for merging, UI display, or
programmatic manipulation.

**Key Features:**
- **Actionable Results**: Returns objects ready for immediate use in merging operations
- **Simplified Array Handling**: Arrays are treated as atomic values for cleaner results
- **Structural Preservation**: Maintains original JSON structure rather than flattened paths
- **UI-Optimized**: Perfect for side-by-side diff displays and change visualization
- **Merge-Friendly**: Designed specifically for three-way merge scenarios

**Array Handling:**
Unlike [Diff.jsonDiff](jsonDiff.md), this function treats arrays as complete units. If arrays differ,
the entire array appears in the appropriate result object rather than computing
element-by-element deltas. This approach is simpler and more predictable for most
use cases involving data updates and synchronization.

**Use Cases:**
- Applying configuration updates while preserving unchanged settings
- Creating side-by-side diff displays in user interfaces
- Building three-way merge tools for data synchronization
- Implementing undo/redo functionality with granular control
- Generating patch objects for API updates

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `obj1` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The first JSON value to compare (often the "before" or "source" state) |
| `obj2` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The second JSON value to compare (often the "after" or "target" state) |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IThreeWayDiff`](../interfaces/IThreeWayDiff.md)\>

A Result containing the three-way diff with separate objects and metadata

## Examples

```typescript
const original = { name: "John", age: 30, city: "NYC", active: true };
const updated = { name: "Jane", age: 30, country: "USA", active: true };

const result = jsonThreeWayDiff(original, updated);
if (result.success) {
  const { onlyInA, unchanged, onlyInB } = result.value;

  // Apply changes: merge unchanged + onlyInB
  const applied = { ...unchanged, ...onlyInB };
  console.log(applied); // { age: 30, active: true, name: "Jane", country: "USA" }

  // Revert changes: merge unchanged + onlyInA
  const reverted = { ...unchanged, ...onlyInA };
  console.log(reverted); // { age: 30, active: true, name: "John", city: "NYC" }
}
```

```typescript
const result = jsonThreeWayDiff(userBefore, userAfter);
if (result.success) {
  const { onlyInA, unchanged, onlyInB, metadata } = result.value;

  // Display summary
  console.log(`Changes: ${metadata.added} added, ${metadata.removed} removed, ${metadata.modified} modified`);

  // Show removed/old values in red
  if (onlyInA) displayInColor(onlyInA, 'red');

  // Show unchanged values in gray
  if (unchanged) displayInColor(unchanged, 'gray');

  // Show added/new values in green
  if (onlyInB) displayInColor(onlyInB, 'green');
}
```

```typescript
const config1 = {
  database: { host: "localhost", port: 5432 },
  features: ["auth", "logging"],
  version: "1.0"
};
const config2 = {
  database: { host: "production.db", port: 5432 },
  features: ["auth", "logging", "metrics"],  // Array treated as complete unit
  version: "1.1"
};

const result = jsonThreeWayDiff(config1, config2);
if (result.success) {
  // result.value.onlyInA = { database: { host: "localhost" }, features: ["auth", "logging"], version: "1.0" }
  // result.value.unchanged = { database: { port: 5432 } }
  // result.value.onlyInB = { database: { host: "production.db" }, features: ["auth", "logging", "metrics"], version: "1.1" }
}
```

```typescript
const result = jsonThreeWayDiff(currentState, newState);
if (result.success && !result.value.identical) {
  const { metadata } = result.value;

  if (metadata.modified > 0) {
    console.log("Critical settings changed - requires restart");
  } else if (metadata.added > 0) {
    console.log("New features enabled");
  } else if (metadata.removed > 0) {
    console.log("Features disabled");
  }
}
```

## See

 - [IThreeWayDiff](../interfaces/IThreeWayDiff.md) for the structure of returned results
 - [IThreeWayDiffMetadata](../interfaces/IThreeWayDiffMetadata.md) for metadata details
 - [Diff.jsonDiff](jsonDiff.md) for detailed change-by-change analysis
 - [jsonEquals](jsonEquals.md) for simple equality checking
