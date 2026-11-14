[Home](../README.md) > [ISchemaStructuredOutputRequest](./ISchemaStructuredOutputRequest.md) > adaptOptionalToNullable

## ISchemaStructuredOutputRequest.adaptOptionalToNullable property

On a format that requires every property to be `required`, send an optional
property as required when its node **already admits `null`**, instead of
refusing the whole schema.

**Signature:**

```typescript
readonly adaptOptionalToNullable: boolean;
```
