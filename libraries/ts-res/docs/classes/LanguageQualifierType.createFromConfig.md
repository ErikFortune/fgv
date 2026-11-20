[Home](../README.md) > [LanguageQualifierType](./LanguageQualifierType.md) > createFromConfig

## LanguageQualifierType.createFromConfig() method

Creates a new QualifierTypes.LanguageQualifierType | LanguageQualifierType from a configuration object.

**Signature:**

```typescript
static createFromConfig(config: IQualifierTypeConfig<ILanguageQualifierTypeConfig>): Result<LanguageQualifierType>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>IQualifierTypeConfig&lt;ILanguageQualifierTypeConfig&gt;</td><td>The QualifierTypes.Config.IQualifierTypeConfig | configuration object containing
the name, systemType, and optional language-specific configuration.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LanguageQualifierType](LanguageQualifierType.md)&gt;

`Success` with the new QualifierTypes.LanguageQualifierType | LanguageQualifierType
if successful, `Failure` with an error message otherwise.
