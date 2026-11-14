[Home](../../README.md) > [Runtime](../README.md) > [IContextQualifierProviderValidatorBase](./IContextQualifierProviderValidatorBase.md) > getValidated

## IContextQualifierProviderValidatorBase.getValidated() method

Gets a validated qualifier context value by its string name.

**Signature:**

```typescript
getValidated(name: string): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string name to convert and look up.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the validated QualifierContextValue | qualifier context value if found,
or `Failure` with an error message if not found, invalid, or an error occurs.
