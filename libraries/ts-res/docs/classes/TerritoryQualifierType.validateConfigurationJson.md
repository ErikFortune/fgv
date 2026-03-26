[Home](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > validateConfigurationJson

## TerritoryQualifierType.validateConfigurationJson() method

QualifierTypes.IQualifierType.validateConfigurationJson

**Signature:**

```typescript
validateConfigurationJson(from: unknown): Result<{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray<string>; hierarchy?: { [key: string]: string } } }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray&lt;string&gt;; hierarchy?: { [key: string]: string } } }&gt;
