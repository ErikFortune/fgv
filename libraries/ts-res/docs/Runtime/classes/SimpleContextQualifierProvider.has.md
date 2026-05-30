[Home](../../README.md) > [Runtime](../README.md) > [SimpleContextQualifierProvider](./SimpleContextQualifierProvider.md) > has

## SimpleContextQualifierProvider.has() method

Checks if a qualifier value exists with the given name.

**Signature:**

```typescript
has(name: QualifierName): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>QualifierName</td><td>The QualifierName | qualifier name to check.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the qualifier value exists, `false` if it doesn't,
or `Failure` with an error message if an error occurs during the check.
