[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > resolveComposedResourceValue

## ResourceResolver.resolveComposedResourceValue() method

Resolves a resource to a composed value by merging matching candidates according to their merge methods.
Starting from the highest priority candidates, finds the first "full" candidate and merges all higher
priority "partial" candidates into it in ascending order of priority.

**Signature:**

```typescript
resolveComposedResourceValue(resource: IResource): Result<JsonValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resource</td><td>IResource</td><td>The Resources.Resource | resource to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;JsonValue&gt;

`Success` with the composed JsonValue if successful,
or `Failure` with an error message if no candidates match or resolution fails.
