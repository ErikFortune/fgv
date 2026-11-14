[Home](../../README.md) > [QualifierTypes](../README.md) > [LanguageQualifierType](./LanguageQualifierType.md) > validateConfigurationJson

## LanguageQualifierType.validateConfigurationJson() method

Validates configuration JSON data for this qualifier type.

**Signature:**

```typescript
validateConfigurationJson(from: unknown): Result<{ systemType: "language"; name: string; configuration?: { allowContextList?: boolean } }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The unknown data to validate as configuration JSON.</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ systemType: "language"; name: string; configuration?: { allowContextList?: boolean } }&gt;

`Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.
