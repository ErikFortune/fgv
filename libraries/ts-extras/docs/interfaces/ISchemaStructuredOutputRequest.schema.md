[Home](../README.md) > [ISchemaStructuredOutputRequest](./ISchemaStructuredOutputRequest.md) > schema

## ISchemaStructuredOutputRequest.schema property

The schema to constrain generation to — **the same object you validate the
reply with**, so the wire schema and the check cannot drift.

**Signature:**

```typescript
readonly schema: ISchemaValidator<unknown>;
```
