[Home](../README.md) > [ResourceCandidate](./ResourceCandidate.md) > compare

## ResourceCandidate.compare() method

Compares two Resources.ResourceCandidate | ResourceCandidates for sorting purposes.

**Signature:**

```typescript
static compare(rc1: ResourceCandidate, rc2: ResourceCandidate): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>rc1</td><td>ResourceCandidate</td><td>The first candidate to compare.</td></tr>
<tr><td>rc2</td><td>ResourceCandidate</td><td>The second candidate to compare.</td></tr>
</tbody></table>

**Returns:**

number

A negative number if `rc1` should come before `rc2`, a positive number if `rc2` should come before `rc1`,
or zero if they are equivalent.
