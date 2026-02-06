[Home](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > fromChocolateEntityLibrary

## ChocolateLibrary.fromChocolateEntityLibrary() method

Creates a ChocolateLibrary wrapping an existing ChocolateEntityLibrary.
Use this when you already have a configured library instance.

**Signature:**

```typescript
static fromChocolateEntityLibrary(library: ChocolateEntityLibrary, preWarm?: boolean): Result<ChocolateLibrary>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>library</td><td>ChocolateEntityLibrary</td><td>The ChocolateEntityLibrary to wrap</td></tr>
<tr><td>preWarm</td><td>boolean</td><td>Whether to pre-warm the reverse index</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ChocolateLibrary](ChocolateLibrary.md)&gt;

Success with ChocolateLibrary
