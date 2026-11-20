[Home](../../README.md) > [Utils](../README.md) > [ValidationHelpers](./ValidationHelpers.md) > verifyIsWellFormed

## ValidationHelpers.verifyIsWellFormed() method

Determines if a supplied `unknown` is a well-formed representation
of the tag validated by these helpers.

**Signature:**

```typescript
verifyIsWellFormed(from: unknown, context?: TC): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` to be validated.</td></tr>
<tr><td>context</td><td>TC</td><td>Optional context used in the validation.</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

`Success` with the validated value, or `Failure` with details
if an error occurs.
