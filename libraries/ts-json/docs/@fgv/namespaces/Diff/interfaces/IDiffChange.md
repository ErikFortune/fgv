[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [Diff](../README.md) / IDiffChange

# Interface: IDiffChange

Represents a single change in a JSON diff operation.

Each change describes a specific difference between two JSON values, including
the location of the change and the old/new values involved.

## Example

```typescript
// Example changes from diffing { name: "John", age: 30 } vs { name: "Jane", city: "NYC" }
const changes: IDiffChange[] = [
  { path: "name", type: "modified", oldValue: "John", newValue: "Jane" },
  { path: "age", type: "removed", oldValue: 30 },
  { path: "city", type: "added", newValue: "NYC" }
];
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="newvalue"></a> `newValue?` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The value in the second object. - Present for `'added'` and `'modified'` changes - Present for `'unchanged'` changes when `includeUnchanged` is true - Undefined for `'removed'` changes |
| <a id="oldvalue"></a> `oldValue?` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The value in the first object. - Present for `'removed'` and `'modified'` changes - Present for `'unchanged'` changes when `includeUnchanged` is true - Undefined for `'added'` changes |
| <a id="path"></a> `path` | `string` | The path to the changed value using dot notation. For nested objects, uses dots to separate levels (e.g., "user.profile.name"). For arrays, uses numeric indices (e.g., "items.0.id", "tags.2"). Empty string indicates the root value itself changed. **Example** `"user.name", "items.0.id", "settings.theme", ""` |
| <a id="type"></a> `type` | [`DiffChangeType`](../type-aliases/DiffChangeType.md) | The type of change that occurred. **See** [DiffChangeType](../type-aliases/DiffChangeType.md) for detailed descriptions of each change type. |
