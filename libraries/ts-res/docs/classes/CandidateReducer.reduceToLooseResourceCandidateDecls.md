[Home](../README.md) > [CandidateReducer](./CandidateReducer.md) > reduceToLooseResourceCandidateDecls

## CandidateReducer.reduceToLooseResourceCandidateDecls() method

Static convenience method to construct an array of properly reduced
ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declarations
from a set of Resources.ResourceCandidate | resource candidates.

**Signature:**

```typescript
static reduceToLooseResourceCandidateDecls(id: ResourceId, candidates: readonly ResourceCandidate[], filterForContext?: IValidatedContextDecl): Result<ILooseResourceCandidateDecl[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>ResourceId</td><td>The id of the resource</td></tr>
<tr><td>candidates</td><td>readonly ResourceCandidate[]</td><td>The candidates to reduce</td></tr>
<tr><td>filterForContext</td><td>IValidatedContextDecl</td><td>Optional context to filter against</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ILooseResourceCandidateDecl](../interfaces/ILooseResourceCandidateDecl.md)[]&gt;

Result with array of reduced candidate declarations, or Failure if reduction fails
