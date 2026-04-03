[Home](../README.md) > [PseudoRandomGenerator](./PseudoRandomGenerator.md) > pickNext

## PseudoRandomGenerator.pickNext() method

Generates a random item from the given array.

**Signature:**

```typescript
pickNext(items?: readonly T[]): T | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>items</td><td>readonly T[]</td><td>The array to select from.</td></tr>
</tbody></table>

**Returns:**

T | undefined

A random item from the array or undefined if the array is empty.
