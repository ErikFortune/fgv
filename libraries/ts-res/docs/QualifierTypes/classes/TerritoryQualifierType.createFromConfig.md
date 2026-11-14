[Home](../../README.md) > [QualifierTypes](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > createFromConfig

## TerritoryQualifierType.createFromConfig() method

Creates a new QualifierTypes.TerritoryQualifierType | TerritoryQualifierType from a configuration object.

**Signature:**

```typescript
static createFromConfig(config: IQualifierTypeConfig<ITerritoryQualifierTypeConfig>): Result<TerritoryQualifierType>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>IQualifierTypeConfig&lt;ITerritoryQualifierTypeConfig&gt;</td><td>The QualifierTypes.Config.IQualifierTypeConfig | configuration object containing
the name, systemType, and optional territory-specific configuration including allowed territories and hierarchy.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[TerritoryQualifierType](../../classes/TerritoryQualifierType.md)&gt;

`Success` with the new QualifierTypes.TerritoryQualifierType | TerritoryQualifierType
if successful, `Failure` with an error message otherwise.
