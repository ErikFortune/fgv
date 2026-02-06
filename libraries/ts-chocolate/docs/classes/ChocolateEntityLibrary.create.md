[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > create

## ChocolateEntityLibrary.create() method

Creates a new LibraryRuntime.ChocolateLibrary | ChocolateLibrary instance.

**Signature:**

```typescript
static create(params?: IEntityLibraryCreateParams): Result<ChocolateEntityLibrary>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IEntityLibraryCreateParams</td><td>Optional LibraryRuntime.IChocolateLibraryCreateParams | creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ChocolateEntityLibrary](ChocolateEntityLibrary.md)&gt;

`Success` with new instance, or `Failure` with error message
