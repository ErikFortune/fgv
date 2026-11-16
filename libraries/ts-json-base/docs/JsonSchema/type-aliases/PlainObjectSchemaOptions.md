[Home](../../README.md) > [JsonSchema](../README.md) > PlainObjectSchemaOptions

# Type Alias: PlainObjectSchemaOptions

The `object` options accepted as a plain object literal: the
`plain annotations` and `additionalProperties`.

## Type

```typescript
type PlainObjectSchemaOptions = PlainSchemaOptions & Pick<IObjectSchemaOptions, "additionalProperties">
```
