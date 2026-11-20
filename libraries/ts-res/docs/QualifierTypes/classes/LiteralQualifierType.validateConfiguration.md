[Home](../../README.md) > [QualifierTypes](../README.md) > [LiteralQualifierType](./LiteralQualifierType.md) > validateConfiguration

## LiteralQualifierType.validateConfiguration() method

Validates a QualifierTypes.Config.ISystemLiteralQualifierTypeConfig | strongly typed configuration object
for this qualifier type.

**Signature:**

```typescript
validateConfiguration(from: unknown): Result<ISystemLiteralQualifierTypeConfig>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The unknown data to validate as a configuration object.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISystemLiteralQualifierTypeConfig](../../interfaces/ISystemLiteralQualifierTypeConfig.md)&gt;

`Success` with the validated configuration if successful, `Failure` with an error message otherwise.
