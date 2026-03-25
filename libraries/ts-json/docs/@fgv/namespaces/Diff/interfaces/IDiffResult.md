[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [Diff](../README.md) / IDiffResult

# Interface: IDiffResult

Result of a JSON diff operation containing all detected changes.

This interface provides detailed information about every difference found
between two JSON values, making it ideal for analysis, debugging, and
understanding exactly what changed.

## Example

```typescript
const result: IDiffResult = {
  changes: [
    { path: "name", type: "modified", oldValue: "John", newValue: "Jane" },
    { path: "hobbies.1", type: "added", newValue: "gaming" }
  ],
  identical: false
};
```

## See

 - [IDiffChange](IDiffChange.md) for details about individual change objects
 - [Diff.jsonDiff](../functions/jsonDiff.md) for the function that produces this result

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="changes"></a> `changes` | [`IDiffChange`](IDiffChange.md)[] | Array of all changes detected between the two JSON objects. Changes are ordered by the path where they occur. For nested structures, parent changes appear before child changes. |
| <a id="identical"></a> `identical` | `boolean` | True if the objects are identical, false otherwise. When true, the `changes` array will be empty (unless `includeUnchanged` option was used, in which case it may contain 'unchanged' entries). |
