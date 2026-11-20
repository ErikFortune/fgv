[Home](../README.md) > [ISchemaOptions](./ISchemaOptions.md) > nullable

## ISchemaOptions.nullable property

When `true`, the value may also be `null`: the derived static type widens to
`T | null`, the validator accepts `null`, and the wire schema declares a union
`type` (`['string', 'null']`).

**Signature:**

```typescript
nullable: boolean;
```
