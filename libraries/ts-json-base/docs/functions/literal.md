[Home](../README.md) > literal

# Function: literal

Helper to create a validator for a literal value.
Accepts `IJsonValidatorContext` but ignores it.
Mirrors the behavior of `@fgv/ts-utils`.

## Signature

```typescript
function literal(value: T): Validator<T, IJsonValidatorContext>
```
