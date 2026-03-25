[Home](../../README.md) > [Decisions](../README.md) > [Candidate](./Candidate.md) > createCandidate

## Candidate.createCandidate() method

Create a new Decisions.Candidate | candidate.

**Signature:**

```typescript
static createCandidate(params: ICandidate<TVALUE>): Result<Candidate<TVALUE>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ICandidate&lt;TVALUE&gt;</td><td>The Decisions.ICandidate | parameters to use to create the
new candidate.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Candidate](../../classes/Candidate.md)&lt;TVALUE&gt;&gt;

`Success` with the new candidate if successful, or `Failure` if the
candidate could not be created.
