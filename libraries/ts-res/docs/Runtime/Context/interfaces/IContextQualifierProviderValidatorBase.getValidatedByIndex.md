[Home](../../../README.md) > [Runtime](../../README.md) > [Context](../README.md) > [IContextQualifierProviderValidatorBase](./IContextQualifierProviderValidatorBase.md) > getValidatedByIndex

## IContextQualifierProviderValidatorBase.getValidatedByIndex() method

Gets a validated qualifier context value by its number index.

**Signature:**

```typescript
getValidatedByIndex(index: number): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>number</td><td>The number index to convert and look up.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the validated QualifierContextValue | qualifier context value if found,
or `Failure` with an error message if not found, invalid, or an error occurs.
