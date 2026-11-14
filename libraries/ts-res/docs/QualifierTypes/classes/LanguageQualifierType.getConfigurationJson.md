[Home](../../README.md) > [QualifierTypes](../README.md) > [LanguageQualifierType](./LanguageQualifierType.md) > getConfigurationJson

## LanguageQualifierType.getConfigurationJson() method

Gets the configuration for this qualifier type.

**Signature:**

```typescript
getConfigurationJson(): Result<{ systemType: "language"; name: string; configuration?: { allowContextList?: boolean } }>;
```

**Returns:**

Result&lt;{ systemType: "language"; name: string; configuration?: { allowContextList?: boolean } }&gt;

`Success` with the configuration if successful, `Failure` with an error message otherwise.
