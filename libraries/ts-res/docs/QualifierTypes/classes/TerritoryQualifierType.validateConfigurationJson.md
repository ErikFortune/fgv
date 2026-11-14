[Home](../../README.md) > [QualifierTypes](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > validateConfigurationJson

## TerritoryQualifierType.validateConfigurationJson() method

Validates configuration JSON data for this qualifier type.

**Signature:**

```typescript
validateConfigurationJson(from: unknown): Result<{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray<string>; hierarchy?: { [key: string]: string } } }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The unknown data to validate as configuration JSON.</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray&lt;string&gt;; hierarchy?: { [key: string]: string } } }&gt;

`Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.
