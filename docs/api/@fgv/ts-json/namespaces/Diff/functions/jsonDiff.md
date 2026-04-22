[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [Diff](../README.md) / jsonDiff

# Function: jsonDiff()

> **jsonDiff**(`obj1`, `obj2`, `options`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IDiffResult`](../interfaces/IDiffResult.md)\>

Performs a deep diff comparison between two JSON values.

This function provides detailed change tracking by analyzing every difference
between two JSON structures. It returns a list of specific changes with paths,
making it ideal for debugging, logging, change analysis, and understanding
exactly what has changed between two data states.

**Key Features:**
- Deep recursive comparison of nested objects and arrays
- Precise path tracking using dot notation (e.g., "user.profile.name")
- Support for all JSON value types: objects, arrays, primitives, null
- Configurable array comparison (ordered vs unordered)
- Optional inclusion of unchanged values for complete comparisons

**Use Cases:**
- Debugging data changes in applications
- Generating change logs or audit trails
- Validating API responses against expected data
- Creating detailed diff reports for data synchronization

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `obj1` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The first JSON value to compare (often the "before" state) |
| `obj2` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The second JSON value to compare (often the "after" state) |
| `options` | [`IJsonDiffOptions`](../interfaces/IJsonDiffOptions.md) | Optional configuration for customizing diff behavior |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IDiffResult`](../interfaces/IDiffResult.md)\>

A Result containing the diff result with all detected changes

## Examples

```typescript
const before = { name: "John", age: 30, city: "NYC" };
const after = { name: "Jane", age: 30, country: "USA" };

const result = jsonDiff(before, after);
if (result.success) {
  result.value.changes.forEach(change => {
    console.log(`${change.path}: ${change.type}`);
    // Output:
    // name: modified
    // city: removed
    // country: added
  });
}
```

```typescript
const user1 = {
  profile: { name: "John", hobbies: ["reading"] },
  settings: { theme: "dark" }
};
const user2 = {
  profile: { name: "John", hobbies: ["reading", "gaming"] },
  settings: { theme: "light", notifications: true }
};

const result = jsonDiff(user1, user2);
if (result.success) {
  console.log(result.value.changes);
  // [
  //   { path: "profile.hobbies.1", type: "added", newValue: "gaming" },
  //   { path: "settings.theme", type: "modified", oldValue: "dark", newValue: "light" },
  //   { path: "settings.notifications", type: "added", newValue: true }
  // ]
}
```

```typescript
const options: IJsonDiffOptions = {
  includeUnchanged: true,        // Include unchanged properties
  pathSeparator: '/',            // Use '/' instead of '.' in paths
  arrayOrderMatters: false       // Treat arrays as unordered sets
};

const result = jsonDiff(obj1, obj2, options);
```

## See

 - [IDiffResult](../interfaces/IDiffResult.md) for the structure of returned results
 - [IDiffChange](../interfaces/IDiffChange.md) for details about individual changes
 - [IJsonDiffOptions](../interfaces/IJsonDiffOptions.md) for available configuration options
 - [jsonThreeWayDiff](jsonThreeWayDiff.md) for an alternative API focused on actionable results
 - [jsonEquals](jsonEquals.md) for simple equality checking without change details
