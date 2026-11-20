[Home](../../../README.md) > [Runtime](../../README.md) > [Context](../README.md) > [IContextQualifierProviderValidatorBase](./IContextQualifierProviderValidatorBase.md) > get

## IContextQualifierProviderValidatorBase.get() method

Gets a qualifier value by its string name, converting to strongly-typed QualifierName.

**Signature:**

```typescript
get(name: string): Result<QualifierContextValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string name to convert and look up.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierContextValue](../../../type-aliases/QualifierContextValue.md)&gt;

`Success` with the QualifierContextValue | qualifier context value if found,
or `Failure` with an error message if not found or an error occurs.
