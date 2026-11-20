[Home](../README.md) > [IJsonConverterOptions](./IJsonConverterOptions.md) > useNameTemplates

## IJsonConverterOptions.useNameTemplates property

If `true` and if template variables are available,
then property names will be rendered using
mustache and those variable values. Otherwise
property names are copied without modification.

Defaults to `true` if vars are supplied with options,
`false` otherwise.

**Signature:**

```typescript
useNameTemplates: boolean;
```
