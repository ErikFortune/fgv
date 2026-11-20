[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > addLooseCandidate

## ResourceManagerBuilder.addLooseCandidate() method

Given a ResourceJson.Json.ILooseResourceCandidateDecl | resource candidate declaration, builds and adds
a Resources.ResourceCandidate | candidate to the manager.

**Signature:**

```typescript
addLooseCandidate(decl: ILooseResourceCandidateDecl): DetailedResult<ResourceCandidate, ResourceBuilderResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>ILooseResourceCandidateDecl</td><td>The ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declaration to add.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[ResourceCandidate](ResourceCandidate.md), [ResourceBuilderResultDetail](../type-aliases/ResourceBuilderResultDetail.md)&gt;

`Success` with the candidate if successful, or `Failure` with an error message if not.
