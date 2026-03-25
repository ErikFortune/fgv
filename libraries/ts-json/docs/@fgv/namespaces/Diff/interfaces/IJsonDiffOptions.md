[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [Diff](../README.md) / IJsonDiffOptions

# Interface: IJsonDiffOptions

Options for customizing JSON diff behavior.

These options allow you to control how the diff algorithm processes
different types of JSON structures and what information is included
in the results.

## Example

```typescript
// Include unchanged values and use custom path separator
const options: IJsonDiffOptions = {
  includeUnchanged: true,
  pathSeparator: '/',
  arrayOrderMatters: false
};

const result = jsonDiff(obj1, obj2, options);
```

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="arrayordermatters"></a> `arrayOrderMatters?` | `boolean` | `true` | If true, treats arrays as ordered lists where position matters. If false, treats arrays as unordered sets. When `true` (default), array changes are reported by index position: `[1,2,3]` vs `[1,3,2]` shows modifications at indices 1 and 2. When `false`, arrays are compared as sets: `[1,2,3]` vs `[1,3,2]` may be considered equivalent (simplified unordered comparison). |
| <a id="includeunchanged"></a> `includeUnchanged?` | `boolean` | `false` | If true, includes unchanged values in the result. When enabled, the diff result will include entries with `type: 'unchanged'` for properties that exist in both objects with identical values. This can be useful for displaying complete side-by-side comparisons. |
| <a id="pathseparator"></a> `pathSeparator?` | `string` | `"."` | Custom path separator for nested property paths. Controls the character used to separate levels in nested object paths. For example, with separator `'/'`, a nested property would be reported as `"user/profile/name"` instead of `"user.profile.name"`. **Example** `"/", "-\>", "::"` |
