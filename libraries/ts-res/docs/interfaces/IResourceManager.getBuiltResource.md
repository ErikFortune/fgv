[Home](../README.md) > [IResourceManager](./IResourceManager.md) > getBuiltResource

## IResourceManager.getBuiltResource() method

Gets a built resource by ID for runtime resolution.

**Signature:**

```typescript
getBuiltResource(id: string): Result<TR>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>The resource identifier</td></tr>
</tbody></table>

**Returns:**

Result&lt;TR&gt;

Success with the runtime resource if found, Failure otherwise
