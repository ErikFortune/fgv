[Home](../README.md) > PlainStringSchemaOptions

# Type Alias: PlainStringSchemaOptions

The `string` options accepted as a plain object literal: the
`plain annotations` and `format`, which is an annotation
and cannot be incoherent. The length keywords and `pattern` are declared `never` and arrive
through `stringOptions`.

## Type

```typescript
type PlainStringSchemaOptions = PlainSchemaOptions & Pick<IStringSchemaOptions, "format"> & { readonly [K in StringOneOf<typeof schemaLengthConstraintKeywords> | StringOneOf<typeof schemaPatternConstraintKeywords>]?: never }
```
