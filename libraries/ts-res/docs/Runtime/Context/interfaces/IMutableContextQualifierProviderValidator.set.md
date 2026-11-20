[Home](../../../README.md) > [Runtime](../../README.md) > [Context](../README.md) > [IMutableContextQualifierProviderValidator](./IMutableContextQualifierProviderValidator.md) > set

## IMutableContextQualifierProviderValidator.set() method

Sets a qualifier value using string inputs, converting to strongly-typed values.

**Signature:**

```typescript
set(name: string, value: string): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string name to convert.</td></tr>
<tr><td>value</td><td>string</td><td>The string value to convert.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the set QualifierContextValue | qualifier context value if successful,
or `Failure` with an error message if an error occurs.
