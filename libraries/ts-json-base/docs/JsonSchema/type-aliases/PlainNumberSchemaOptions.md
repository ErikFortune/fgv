[Home](../../README.md) > [JsonSchema](../README.md) > PlainNumberSchemaOptions

# Type Alias: PlainNumberSchemaOptions

The `number` / `integer` options accepted as a plain object literal: the
`plain annotations` and `strict`. Every range keyword is
declared `never`, so a raw `{ minimum: 0 }` is a compile error — range keywords arrive through
`numberOptions` or `integerOptions`.

## Type

```typescript
type PlainNumberSchemaOptions = PlainSchemaOptions & Pick<INumberSchemaOptions, "strict"> & { readonly [K in StringOneOf<typeof schemaNumberConstraintKeywords>]?: never }
```
