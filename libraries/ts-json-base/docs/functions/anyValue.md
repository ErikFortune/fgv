[Home](../README.md) > anyValue

# Function: anyValue

Creates a schema node that accepts any JSON value — JSON Schema's `{}`, pydantic's `Any`.

## Signature

```typescript
function anyValue(opts: PlainAnySchemaOptions | ValidatedSchemaOptions<IAnySchemaOptions>): ISchemaValidator<JsonValue>
```
