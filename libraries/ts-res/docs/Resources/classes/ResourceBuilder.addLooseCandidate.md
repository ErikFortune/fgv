[Home](../../README.md) > [Resources](../README.md) > [ResourceBuilder](./ResourceBuilder.md) > addLooseCandidate

## ResourceBuilder.addLooseCandidate() method

Given a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration, creates and adds a
Resources.ResourceCandidate | candidate to the resource being built.

**Signature:**

```typescript
addLooseCandidate(decl: ILooseResourceCandidateDecl): DetailedResult<ResourceCandidate, ResourceBuilderResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>ILooseResourceCandidateDecl</td><td>The ResourceJson.Json.ILooseResourceCandidateDecl | IResourceCandidateDecl to add to the
resource being built.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[ResourceCandidate](../../classes/ResourceCandidate.md), [ResourceBuilderResultDetail](../../type-aliases/ResourceBuilderResultDetail.md)&gt;

`Success` with the added Resources.ResourceCandidate | candidate if successful,
or `Failure` with an error message if not. Fails with error detail 'type-mismatch' if the candidate
specifies a different resource type than previously added candidates, or with 'exists' if a candidate
already exists with the same conditions but different values.  Succeeds with 'exists' and returns the
existing candidate if the candidate to be added is identical to an existing candidate.
