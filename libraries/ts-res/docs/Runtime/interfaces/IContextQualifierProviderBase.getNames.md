[Home](../../README.md) > [Runtime](../README.md) > [IContextQualifierProviderBase](./IContextQualifierProviderBase.md) > getNames

## IContextQualifierProviderBase.getNames() method

Gets all available qualifier names in this context.

**Signature:**

```typescript
getNames(): Result<readonly QualifierName[]>;
```

**Returns:**

Result&lt;readonly [QualifierName](../../type-aliases/QualifierName.md)[]&gt;

`Success` with an array of all QualifierName | qualifier names,
or `Failure` with an error message if an error occurs.
