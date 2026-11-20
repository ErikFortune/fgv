[Home](../README.md) > [IResourceResolver](./IResourceResolver.md) > withContext

## IResourceResolver.withContext() method

Creates a new IResourceResolver | resource resolver with the given context.

**Signature:**

```typescript
withContext(context: Record<string, string>): Result<IResourceResolver>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>Record&lt;string, string&gt;</td><td>The context to use for the new resource resolver.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IResourceResolver](IResourceResolver.md)&gt;

`Success` with the new resource resolver if successful,
or `Failure` with an error message if the context is invalid.
