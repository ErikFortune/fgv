[Home](../README.md) > [Qualifier](./Qualifier.md) > validateContextValue

## Qualifier.validateContextValue() method

Validates that a value is valid for use in a runtime context for qualifiers
of this type.

**Signature:**

```typescript
validateContextValue(value: string): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The string value to validate.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../type-aliases/QualifierContextValue.md)&gt;

`Success` with the QualifierContextValue | validated value
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.
