[Home](../README.md) > [LiteralQualifierType](./LiteralQualifierType.md) > getConfigurationJson

## LiteralQualifierType.getConfigurationJson() method

Gets the configuration for this qualifier type.

**Signature:**

```typescript
getConfigurationJson(): Result<{ systemType: "literal"; name: string; configuration?: { allowContextList?: boolean; caseSensitive?: boolean; enumeratedValues?: JsonCompatibleArray<string>; hierarchy?: { [key: string]: string } } }>;
```

**Returns:**

Result&lt;{ systemType: "literal"; name: string; configuration?: { allowContextList?: boolean; caseSensitive?: boolean; enumeratedValues?: JsonCompatibleArray&lt;string&gt;; hierarchy?: { [key: string]: string } } }&gt;

`Success` with the configuration if successful, `Failure` with an error message otherwise.
