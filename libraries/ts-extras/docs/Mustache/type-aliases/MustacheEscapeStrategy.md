[Home](../../README.md) > [Mustache](../README.md) > MustacheEscapeStrategy

# Type Alias: MustacheEscapeStrategy

Strategy applied to double-brace `{{name}}` tokens at render time.

- `'html'`: the standard mustache.js HTML escape (back-compat default).
- `'none'`: verbatim passthrough — values are interpolated as-is
  (coerced to `String`). Suitable for LLM-prompt rendering and other
  non-HTML targets where `& → &amp;` corrupts the output.
- `(value) => string`: caller-supplied escape function.

Note: triple-brace `{{{name}}}` (and `{{&name}}`) tokens are always
rendered unescaped regardless of this strategy — that is the standard
mustache.js semantics and is not affected by this option.

## Type

```typescript
type MustacheEscapeStrategy = "html" | "none" | ((value: string) => string)
```
