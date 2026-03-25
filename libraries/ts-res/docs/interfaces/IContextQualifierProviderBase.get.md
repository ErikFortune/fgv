[Home](../README.md) > [IContextQualifierProviderBase](./IContextQualifierProviderBase.md) > get

## IContextQualifierProviderBase.get() method

Gets a qualifier value by its name, index, or qualifier object.

**Signature:**

```typescript
get(nameOrIndexOrQualifier: QualifierName | QualifierIndex | Qualifier): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>nameOrIndexOrQualifier</td><td>QualifierName | QualifierIndex | Qualifier</td><td>The QualifierName | qualifier name, QualifierIndex | index, or Qualifiers.Qualifier | qualifier object to look up.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../type-aliases/QualifierContextValue.md)&gt;

`Success` with the QualifierContextValue | qualifier context value if found,
or `Failure` with an error message if not found or an error occurs.
