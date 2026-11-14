[Home](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > setResourceType

## ResourceBuilder.setResourceType() method

Sets the resource type for the resource being built.  Fails if a resource type has already been set
and it does not match the new resource type.

**Signature:**

```typescript
setResourceType(resourceTypeName: string): Result<ResourceBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resourceTypeName</td><td>string</td><td>The name of the resource type to set.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceBuilder](ResourceBuilder.md)&gt;

`Success` with the updated Resources.ResourceBuilder | ResourceBuilder object if successful,
or `Failure` with an error message if not.
