[Home](../../README.md) > [Generator](../README.md) > [PseudoRandomGenerator](./PseudoRandomGenerator.md) > ensureRng

## PseudoRandomGenerator.ensureRng() method

Ensures a random number generator is available, using the global generator if available
or creating a new one if not.

**Signature:**

```typescript
static ensureRng(rng?: PseudoRandomGenerator): Result<PseudoRandomGenerator>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>rng</td><td>PseudoRandomGenerator</td><td>The random number generator to use, or undefined to use the global one.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PseudoRandomGenerator](../../classes/PseudoRandomGenerator.md)&gt;

A random number generator.
