[Home](../README.md) > [IJsonConverterOptions](./IJsonConverterOptions.md) > onUndefinedPropertyValue

## IJsonConverterOptions.onUndefinedPropertyValue property

If IJsonConverterOptions.onUndefinedPropertyValue | onUndefinedPropertyValue is `'error'`,
then any property with value `undefined` will cause an error and stop conversion.  If
IJsonConverterOptions.onUndefinedPropertyValue | onUndefinedPropertyValue is `'ignore'` (default)
then any property with value `undefined` is silently ignored.

**Signature:**

```typescript
onUndefinedPropertyValue: "error" | "ignore";
```
