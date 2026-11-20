[Home](../../README.md) > [Context](../README.md) > [IMutableContextQualifierProvider](./IMutableContextQualifierProvider.md) > remove

## IMutableContextQualifierProvider.remove() method

Removes a qualifier value from this provider.

**Signature:**

```typescript
remove(name: QualifierName): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>QualifierName</td><td>The QualifierName | qualifier name to remove.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the removed QualifierContextValue | qualifier context value if successful,
or `Failure` with an error message if not found or an error occurs.
