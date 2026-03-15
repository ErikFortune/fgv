[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > create

## ChocolateLibrary.create() method

Creates a ChocolateLibrary with a new or default ChocolateEntityLibrary.
This is the primary factory method for most use cases.

**Signature:**

```typescript
static create(params?: IChocolateLibraryCreateParams): Result<ChocolateLibrary>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IChocolateLibraryCreateParams</td><td>Optional parameters for library and caching</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ChocolateLibrary](../../classes/ChocolateLibrary.md)&gt;

Success with ChocolateLibrary, or Failure if library creation fails
