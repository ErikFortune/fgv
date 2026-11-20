[Home](../../../README.md) > [Validation](../../README.md) > [Classes](../README.md) > [NumberValidator](./NumberValidator.md) > validateNumber

## NumberValidator.validateNumber() method

Static method which validates that a supplied `unknown` value is a `number`.

**Signature:**

```typescript
static validateNumber(from: unknown): boolean | Failure<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` value to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean | [Failure](../../../classes/Failure.md)&lt;T&gt;

Returns `true` if `from` is a `number`, or Failure with an error
message if not.
