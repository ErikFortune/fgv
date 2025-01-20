<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [ValidationErrorFormatter](./ts-utils.validation.validationerrorformatter.md)

## Validation.ValidationErrorFormatter type

Formats an incoming error message and value that failed validation.

**Signature:**

```typescript
export type ValidationErrorFormatter<TC = unknown> = (val: unknown, message?: string, context?: TC) => string;
```