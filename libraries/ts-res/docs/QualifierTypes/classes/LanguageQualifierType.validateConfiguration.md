[Home](../../README.md) > [QualifierTypes](../README.md) > [LanguageQualifierType](./LanguageQualifierType.md) > validateConfiguration

## LanguageQualifierType.validateConfiguration() method

Validates a QualifierTypes.Config.ISystemLanguageQualifierTypeConfig | strongly typed configuration object
for this qualifier type.

**Signature:**

```typescript
validateConfiguration(from: unknown): Result<ISystemLanguageQualifierTypeConfig>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The unknown data to validate as a configuration object.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISystemLanguageQualifierTypeConfig](../../interfaces/ISystemLanguageQualifierTypeConfig.md)&gt;

`Success` with the validated configuration if successful, `Failure` with an error message otherwise.
