[Home](../../README.md) > [Decisions](../README.md) > [Candidate](./Candidate.md) > compare

## Candidate.compare() method

Compare two Decisions.ICandidate | candidates for sorting purposes.

**Signature:**

```typescript
static compare(c1: ICandidate, c2: ICandidate): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>c1</td><td>ICandidate</td><td>The first candidate to compare.</td></tr>
<tr><td>c2</td><td>ICandidate</td><td>The second candidate to compare.</td></tr>
</tbody></table>

**Returns:**

number

A negative number if c1 should come before c2, a positive number if c1 should
come after c2, or zero if they are equivalent.
