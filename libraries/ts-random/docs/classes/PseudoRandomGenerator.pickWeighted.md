[Home](../README.md) > [PseudoRandomGenerator](./PseudoRandomGenerator.md) > pickWeighted

## PseudoRandomGenerator.pickWeighted() method

Chooses one candidate with probability proportional to its weight, drawing
the selecting unit float from this generator.

**Signature:**

```typescript
pickWeighted(candidates: readonly IWeightedCandidate<T>[]): T | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>candidates</td><td>readonly IWeightedCandidate&lt;T&gt;[]</td><td>The weighted candidates, in the order to walk them.</td></tr>
</tbody></table>

**Returns:**

T | undefined

The chosen item, or `undefined` if no candidate is eligible.
