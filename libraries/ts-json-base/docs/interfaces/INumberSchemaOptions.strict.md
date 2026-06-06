[Home](../README.md) > [INumberSchemaOptions](./INumberSchemaOptions.md) > strict

## INumberSchemaOptions.strict property

When `true` (default), the derived validator rejects numeric strings such as `'42'` and
accepts only genuine JSON numbers. Set `false` to opt into permissive coercion (numeric
strings are accepted and converted to their numeric value).

**Signature:**

```typescript
strict: boolean;
```
