[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getBuiltResource

## ResourceManagerBuilder.getBuiltResource() method

Gets an individual Resources.Resource | built resource from the manager.

**Signature:**

```typescript
getBuiltResource(id: string): Result<Resource>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>The ResourceId | id of the resource to get.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Resource](Resource.md)&gt;

`Success` with the resource if successful, or `Failure` with an error message if not.
