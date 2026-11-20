[Home](../../README.md) > [Runtime](../README.md) > [IContextQualifierProviderBase](./IContextQualifierProviderBase.md) > getValidated

## IContextQualifierProviderBase.getValidated() method

Gets a validated qualifier context value by its name, index, or qualifier object.

**Signature:**

```typescript
getValidated(nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>nameOrIndexOrQualifier</td><td>QualifierName | QualifierIndex | Qualifier</td><td>The QualifierName | qualifier name, QualifierIndex | index, or Qualifiers.Qualifier | qualifier object to look up.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the validated QualifierContextValue | qualifier context value if found,
or `Failure` with an error message if not found, invalid, or an error occurs.
