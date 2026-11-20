[Home](../README.md) > [ValidationHelpers](./ValidationHelpers.md) > toCanonical

## ValidationHelpers.toCanonical() method

Converts a supplied `unknown` to the canonical form of the tag
validated by these helpers.

**Signature:**

```typescript
toCanonical(from: unknown, context?: TC): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` to be converted.</td></tr>
<tr><td>context</td><td>TC</td><td>Optional context used in the conversion.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

`Success` with the corresponding canonical value,
or `Failure` with details if an error occurs.
