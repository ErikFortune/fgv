[Home](../../README.md) > [Runtime](../README.md) > [IContextQualifierProviderValidatorBase](./IContextQualifierProviderValidatorBase.md) > getByIndex

## IContextQualifierProviderValidatorBase.getByIndex() method

Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.

**Signature:**

```typescript
getByIndex(index: number): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>number</td><td>The number index to convert and look up.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the QualifierContextValue | qualifier context value if found,
or `Failure` with an error message if not found or an error occurs.
