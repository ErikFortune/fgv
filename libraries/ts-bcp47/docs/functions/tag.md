[Home](../README.md) > tag

# Function: tag

Creates a new Bcp47.LanguageTag | language tag from a Bcp47.LanguageSpec | language specifier

The supplied initializer must be at least
https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | well-formed according to RFC 5646.
Higher degrees of validation along with any normalizations may be optionally specified.

## Signature

```typescript
function tag(from: LanguageSpec, options: ILanguageTagInitOptions): Result<LanguageTag>
```
