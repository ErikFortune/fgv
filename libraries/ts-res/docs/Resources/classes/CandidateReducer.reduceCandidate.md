[Home](../../README.md) > [Resources](../README.md) > [CandidateReducer](./CandidateReducer.md) > reduceCandidate

## CandidateReducer.reduceCandidate() method

Reduces a single candidate according to the configured reduction rules.

**Signature:**

```typescript
reduceCandidate(candidate: ResourceCandidate): Result<IReducedCandidate | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>candidate</td><td>ResourceCandidate</td><td>The candidate to reduce</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IReducedCandidate](../../interfaces/IReducedCandidate.md) | undefined&gt;

Either a reduced candidate declaration or an error if the candidate is not found
