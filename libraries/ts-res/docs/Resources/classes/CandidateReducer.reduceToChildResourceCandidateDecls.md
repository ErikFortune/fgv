[Home](../../README.md) > [Resources](../README.md) > [CandidateReducer](./CandidateReducer.md) > reduceToChildResourceCandidateDecls

## CandidateReducer.reduceToChildResourceCandidateDecls() method

Static convenience method to construct an array of properly reduced
ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declarations
from a set of Resources.ResourceCandidate | resource candidates.

**Signature:**

```typescript
static reduceToChildResourceCandidateDecls(candidates: readonly ResourceCandidate[], filterForContext?: IValidatedContextDecl): Result<IChildResourceCandidateDecl<string>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>candidates</td><td>readonly ResourceCandidate[]</td><td>The candidates to reduce</td></tr>
<tr><td>filterForContext</td><td>IValidatedContextDecl</td><td>Optional context to filter against</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IChildResourceCandidateDecl](../../interfaces/IChildResourceCandidateDecl.md)&lt;string&gt;[]&gt;

Result with array of reduced candidate declarations, or Failure if reduction fails
