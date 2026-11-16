[Home](../../README.md) > [JsonSchema](../README.md) > SchemaKeywordRule

# Type Alias: SchemaKeywordRule

What one wire format does with one keyword.

- `'pass'` — the provider documents the keyword; it is sent as emitted.
- `'fold'` — removed, and stated in the node's description instead (see `adaptSchemaKeywords`).
- `{ passValues }` — sent only when its value is one of these (a `format` vocabulary); folded
  otherwise.
- `{ translate }` — rewritten into an exact equivalent the provider documents; folded where the
  translator finds none.

An annotation may also be `'drop'` — see `SchemaAnnotationRule`.

## Type

```typescript
type SchemaKeywordRule = "pass" | "fold" | { passValues: ReadonlyArray<string> } | { translate: SchemaKeywordTranslator }
```
