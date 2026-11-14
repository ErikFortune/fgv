[Home](../../README.md) > [AiAssist](../README.md) > [IAiClientToolConfig](./IAiClientToolConfig.md) > parametersSchema

## IAiClientToolConfig.parametersSchema property

JSON Schema validator for the tool's parameters. Emits wire format via
`.toJson()` and validates model-returned args via `.validate(rawArgs)`.

**Signature:**

```typescript
readonly parametersSchema: ISchemaValidator<TParams>;
```
