[Home](../../README.md) > [LibraryRuntime](../README.md) > [LibraryRuntimeContext](./LibraryRuntimeContext.md) > fromChocolateEntityLibrary

## LibraryRuntimeContext.fromChocolateEntityLibrary() method

Creates a LibraryRuntimeContext wrapping an existing ChocolateEntityLibrary.
Use this when you already have a configured library instance.

**Signature:**

```typescript
static fromChocolateEntityLibrary(library: ChocolateEntityLibrary, preWarm?: boolean): Result<LibraryRuntimeContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>library</td><td>ChocolateEntityLibrary</td><td>The ChocolateEntityLibrary to wrap</td></tr>
<tr><td>preWarm</td><td>boolean</td><td>Whether to pre-warm the reverse index</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LibraryRuntimeContext](../../classes/LibraryRuntimeContext.md)&gt;

Success with LibraryRuntimeContext
