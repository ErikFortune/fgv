[Home](../../README.md) > [QualifierTypes](../README.md) > [LiteralQualifierType](./LiteralQualifierType.md) > createFromConfig

## LiteralQualifierType.createFromConfig() method

Creates a new QualifierTypes.LiteralQualifierType | LiteralQualifierType from a configuration object.

**Signature:**

```typescript
static createFromConfig(config: IQualifierTypeConfig<ILiteralQualifierTypeConfig>): Result<LiteralQualifierType>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>IQualifierTypeConfig&lt;ILiteralQualifierTypeConfig&gt;</td><td>The QualifierTypes.Config.IQualifierTypeConfig | configuration object containing
the name, systemType, and optional literal-specific configuration including case sensitivity,
enumerated values, and hierarchy information.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LiteralQualifierType](../../classes/LiteralQualifierType.md)&gt;

`Success` with the new QualifierTypes.LiteralQualifierType | LiteralQualifierType
if successful, `Failure` with an error message otherwise.
