[Home](../README.md) > [IJsonConverterOptions](./IJsonConverterOptions.md) > onInvalidPropertyName

## IJsonConverterOptions.onInvalidPropertyName property

If IJsonConverterOptions.onInvalidPropertyName | onInvalidPropertyName is `'error'`
(default) then any property name that is invalid after template rendering causes an error
and stops conversion.  If IJsonConverterOptions.onInvalidPropertyName | onInvalidPropertyName
is `'ignore'`, then names which are invalid after template rendering are passed through unchanged.

**Signature:**

```typescript
onInvalidPropertyName: "error" | "ignore";
```
