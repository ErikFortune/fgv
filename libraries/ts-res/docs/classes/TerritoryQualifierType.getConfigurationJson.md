[Home](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > getConfigurationJson

## TerritoryQualifierType.getConfigurationJson() method

Gets the configuration for this qualifier type.

**Signature:**

```typescript
getConfigurationJson(): Result<{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray<string>; hierarchy?: { [key: string]: string } } }>;
```

**Returns:**

Result&lt;{ systemType: "territory"; name: string; configuration?: { allowContextList?: boolean; acceptLowercase?: boolean; allowedTerritories?: JsonCompatibleArray&lt;string&gt;; hierarchy?: { [key: string]: string } } }&gt;

`Success` with the configuration if successful, `Failure` with an error message otherwise.
