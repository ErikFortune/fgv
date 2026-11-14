[Home](../README.md) > [IQualifierType](./IQualifierType.md) > getConfigurationJson

## IQualifierType.getConfigurationJson() method

Gets the configuration for this qualifier type.

**Signature:**

```typescript
getConfigurationJson(): Result<{ name: string; systemType: string; configuration?: JsonCompatibleType<TCFGJSON | undefined> }>;
```

**Returns:**

Result&lt;{ name: string; systemType: string; configuration?: JsonCompatibleType&lt;TCFGJSON | undefined&gt; }&gt;

`Success` with the configuration if successful, `Failure` with an error message otherwise.
