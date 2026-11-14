[Home](../../README.md) > [Resources](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > addChildCandidate

## ResourceBuilder.addChildCandidate() method

Given a ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declaration, creates and adds a
Resources.ResourceCandidate | candidate to the resource being built.

**Signature:**

```typescript
addChildCandidate(childDecl: IChildResourceCandidateDecl): DetailedResult<ResourceCandidate, ResourceBuilderResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>childDecl</td><td>IChildResourceCandidateDecl</td><td>The ResourceJson.Json.IChildResourceCandidateDecl | IChildResourceCandidateDecl to add to the
resource being built.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[ResourceCandidate](../../classes/ResourceCandidate.md), [ResourceBuilderResultDetail](../../type-aliases/ResourceBuilderResultDetail.md)&gt;

`Success` with the added Resources.ResourceCandidate | candidate if successful,
or `Failure` with an error message if not.
