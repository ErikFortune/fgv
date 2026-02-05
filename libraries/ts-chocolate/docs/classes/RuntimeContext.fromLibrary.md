[Home](../README.md) > [RuntimeContext](./RuntimeContext.md) > fromLibrary

## RuntimeContext.fromLibrary() method

Creates a RuntimeContext wrapping an existing ChocolateLibrary.
Use this when you already have a configured library instance.

**Signature:**

```typescript
static fromLibrary(library: ChocolateLibrary, preWarm?: boolean): Result<RuntimeContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>library</td><td>ChocolateLibrary</td><td>The ChocolateLibrary to wrap</td></tr>
<tr><td>preWarm</td><td>boolean</td><td>Whether to pre-warm the reverse index</td></tr>
</tbody></table>

**Returns:**

Result&lt;[RuntimeContext](RuntimeContext.md)&gt;

Success with RuntimeContext
