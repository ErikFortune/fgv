[Home](../README.md) > [StringValidator](./StringValidator.md) > validateString

## StringValidator.validateString() method

Static method which validates that a supplied `unknown` value is a `string`.

**Signature:**

```typescript
static validateString(from: unknown): boolean | Failure<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` value to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean | [Failure](Failure.md)&lt;T&gt;

Returns `true` if `from` is a `string`, or Failure with an error
message if not.
