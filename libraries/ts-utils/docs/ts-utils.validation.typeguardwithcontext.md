<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [TypeGuardWithContext](./ts-utils.validation.typeguardwithcontext.md)

## Validation.TypeGuardWithContext type

A type guard function which validates a specific type, with an optional context that can be used to shape the validation.

**Signature:**

```typescript
export type TypeGuardWithContext<T, TC = unknown> = (from: unknown, context?: TC) => from is T;
```