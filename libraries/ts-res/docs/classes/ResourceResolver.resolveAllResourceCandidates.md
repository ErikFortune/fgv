[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > resolveAllResourceCandidates

## ResourceResolver.resolveAllResourceCandidates() method

Resolves all matching resource candidates in priority order.
Uses the resource's associated decision to determine all matching candidates based on the current context.

**Signature:**

```typescript
resolveAllResourceCandidates(resource: IResource): Result<readonly IResourceCandidate[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resource</td><td>IResource</td><td>The Resources.Resource | resource to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IResourceCandidate](../interfaces/IResourceCandidate.md)[]&gt;

`Success` with an array of all matching candidates in priority order if successful,
or `Failure` with an error message if no candidates match or resolution fails.
