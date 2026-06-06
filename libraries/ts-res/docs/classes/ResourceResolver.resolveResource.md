[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > resolveResource

## ResourceResolver.resolveResource() method

Resolves a resource by finding the best matching candidate.
Uses the resource's associated decision to determine the best match based on the current context.

**Signature:**

```typescript
resolveResource(resource: IResource): Result<IResourceCandidate>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resource</td><td>IResource</td><td>The Resources.Resource | resource to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IResourceCandidate](../interfaces/IResourceCandidate.md)&gt;

`Success` with the best matching candidate if successful,
or `Failure` with an error message if no candidates match or resolution fails.
