[Home](../../README.md) > [Qualifiers](../README.md) > [QualifierCollector](./QualifierCollector.md) > _qualifierFactory

## QualifierCollector._qualifierFactory() method

Factory method for creating a Qualifiers.Qualifier | Qualifier from a Qualifiers.IQualifierDecl | declaration.

**Signature:**

```typescript
_qualifierFactory(__key: QualifierName, index: number, decl: IQualifierDecl): Result<Qualifier>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__key</td><td>QualifierName</td><td>The key for the qualifier.</td></tr>
<tr><td>index</td><td>number</td><td>The index of the qualifier.</td></tr>
<tr><td>decl</td><td>IQualifierDecl</td><td>The Qualifiers.IQualifierDecl | declaration for the qualifier.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Qualifier](../../classes/Qualifier.md)&gt;

`Success` with the new Qualifiers.Qualifier | Qualifier if successful, or `Failure` if not.
