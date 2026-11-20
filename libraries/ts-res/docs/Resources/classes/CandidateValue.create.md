[Home](../../README.md) > [Resources](../README.md) > [CandidateValue](./CandidateValue.md) > create

## CandidateValue.create() method

Creates a new Resources.CandidateValue object.

**Signature:**

```typescript
static create(params: ICandidateValueCreateParams): Result<CandidateValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ICandidateValueCreateParams</td><td>Parameters to create the candidate value.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[CandidateValue](../../classes/CandidateValue.md)&gt;

`Success` with the new candidate value if successful,
or `Failure` with an error message if not.
