[Home](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > getConfigurationJson

## TerritoryQualifierType.getConfigurationJson() method

QualifierTypes.IQualifierType.getConfigurationJson

**Signature:**

```typescript
getConfigurationJson(): Result<{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray<string>; hierarchy?: { [key: string]: string } } }>;
```

**Returns:**

Result&lt;{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray&lt;string&gt;; hierarchy?: { [key: string]: string } } }&gt;
