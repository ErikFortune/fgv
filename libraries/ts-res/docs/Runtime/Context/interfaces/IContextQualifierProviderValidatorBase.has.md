[Home](../../../README.md) > [Runtime](../../README.md) > [Context](../README.md) > [IContextQualifierProviderValidatorBase](./IContextQualifierProviderValidatorBase.md) > has

## IContextQualifierProviderValidatorBase.has() method

Checks if a qualifier value exists with the given string name.

**Signature:**

```typescript
has(name: string): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The string name to convert and check.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the qualifier value exists, `false` if it doesn't,
or `Failure` with an error message if an error occurs during the check.
