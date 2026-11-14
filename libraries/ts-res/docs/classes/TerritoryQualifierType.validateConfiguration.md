[Home](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > validateConfiguration

## TerritoryQualifierType.validateConfiguration() method

Validates a QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | strongly typed configuration object
for this qualifier type.

**Signature:**

```typescript
validateConfiguration(from: unknown): Result<ISystemTerritoryQualifierTypeConfig>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The unknown data to validate as a configuration object.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISystemTerritoryQualifierTypeConfig](../interfaces/ISystemTerritoryQualifierTypeConfig.md)&gt;

`Success` with the validated configuration if successful, `Failure` with an error message otherwise.
