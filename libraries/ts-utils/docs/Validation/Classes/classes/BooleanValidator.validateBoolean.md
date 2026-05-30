[Home](../../../README.md) > [Validation](../../README.md) > [Classes](../README.md) > [BooleanValidator](./BooleanValidator.md) > validateBoolean

## BooleanValidator.validateBoolean() method

Static method which validates that a supplied `unknown` value is a `boolean`.

**Signature:**

```typescript
static validateBoolean(from: unknown): boolean | Failure<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` value to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean | [Failure](../../../classes/Failure.md)&lt;boolean&gt;

Returns `true` if `from` is a `boolean`, or Failure with an error
message if not.
