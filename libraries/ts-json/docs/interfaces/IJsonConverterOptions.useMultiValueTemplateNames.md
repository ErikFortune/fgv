[Home](../README.md) > [IJsonConverterOptions](./IJsonConverterOptions.md) > useMultiValueTemplateNames

## IJsonConverterOptions.useMultiValueTemplateNames property

If `true` and if both template variables and a
context derivation function is available, then properties
which match the multi-value name pattern will be expanded.
Default matches IJsonConverterOptions.useNameTemplates | useNameTemplates.

Default is `true` unless IJsonConverterOptions.extendVars | extendVars is
explicitly set to `undefined`.

**Signature:**

```typescript
useMultiValueTemplateNames: boolean;
```
