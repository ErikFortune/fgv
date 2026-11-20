[Home](../README.md) > [IJsonConverterOptions](./IJsonConverterOptions.md) > useValueTemplates

## IJsonConverterOptions.useValueTemplates property

If `true` and if template variables are available,
then string property values will be rendered using
mustache and those variable values. Otherwise string
properties are copied without modification.

Defaults to `true` if vars are supplied with options,
`false` otherwise.

**Signature:**

```typescript
useValueTemplates: boolean;
```
