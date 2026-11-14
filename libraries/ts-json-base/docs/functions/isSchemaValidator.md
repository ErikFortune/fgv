[Home](../README.md) > isSchemaValidator

# Function: isSchemaValidator

Whether `value` is an `ISchemaValidator` — i.e. a schema authored with the
`JsonSchema` factories, as opposed to a plain `Converter` or `Validator`.

## Signature

```typescript
function isSchemaValidator(value: unknown): value is ISchemaValidator<unknown>
```
