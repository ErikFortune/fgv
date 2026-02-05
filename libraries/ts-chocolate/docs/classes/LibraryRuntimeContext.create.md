[Home](../README.md) > [LibraryRuntimeContext](./LibraryRuntimeContext.md) > create

## LibraryRuntimeContext.create() method

Creates a LibraryRuntimeContext with a new or default ChocolateLibrary.
This is the primary factory method for most use cases.

**Signature:**

```typescript
static create(params?: ILibraryRuntimeContextCreateParams): Result<LibraryRuntimeContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ILibraryRuntimeContextCreateParams</td><td>Optional parameters for library and caching</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LibraryRuntimeContext](LibraryRuntimeContext.md)&gt;

Success with LibraryRuntimeContext, or Failure if library creation fails
