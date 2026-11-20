[Home](../../README.md) > [Context](../README.md) > [MutableContextQualifierProviderValidator](./MutableContextQualifierProviderValidator.md) > remove

## MutableContextQualifierProviderValidator.remove() method

Removes a qualifier value using string input, converting to strongly-typed QualifierName.

**Signature:**

```typescript
remove(name: string): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string name to convert.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the removed QualifierContextValue | qualifier context value if successful,
or `Failure` with an error message if an error occurs.
