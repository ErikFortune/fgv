[Home](../README.md) > [IMutableContextQualifierProvider](./IMutableContextQualifierProvider.md) > set

## IMutableContextQualifierProvider.set() method

Sets a qualifier value in this provider.

**Signature:**

```typescript
set(name: QualifierName, value: QualifierContextValue): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>QualifierName</td><td>The QualifierName | qualifier name to set.</td></tr>
<tr><td>value</td><td>QualifierContextValue</td><td>The QualifierContextValue | qualifier context value to set.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../type-aliases/QualifierContextValue.md)&gt;

`Success` with the set QualifierContextValue | qualifier context value if successful,
or `Failure` with an error message if not.
