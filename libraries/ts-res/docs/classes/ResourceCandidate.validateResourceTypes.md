[Home](../README.md) > [ResourceCandidate](./ResourceCandidate.md) > validateResourceTypes

## ResourceCandidate.validateResourceTypes() method

Extracts the ResourceTypes.ResourceType | resource type from a list of Resources.ResourceCandidate | resource candidates,
if present.

**Signature:**

```typescript
static validateResourceTypes(candidates: readonly ResourceCandidate[], expectedType?: ResourceType<unknown>): Result<ResourceType<unknown> | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>candidates</td><td>readonly ResourceCandidate[]</td><td>The list of candidates from which to extract the resource type.</td></tr>
<tr><td>expectedType</td><td>ResourceType&lt;unknown&gt;</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceType](ResourceType.md)&lt;unknown&gt; | undefined&gt;

`Success` with the resource type if successful, `Success` with `undefined` if none of the candidates
specify a resource tap, and `Failure` with an error message if clients specify conflicting resource types.
