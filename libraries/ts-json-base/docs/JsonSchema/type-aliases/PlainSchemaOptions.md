[Home](../../README.md) > [JsonSchema](../README.md) > PlainSchemaOptions

# Type Alias: PlainSchemaOptions

The options a factory accepts as a plain object literal: the ones that cannot be wrong —
`description`, `title` and `nullable`.

## Type

```typescript
type PlainSchemaOptions = Pick<ISchemaOptions, "description" | "title" | "nullable"> & { default?: never; examples?: never; kind?: never }
```
