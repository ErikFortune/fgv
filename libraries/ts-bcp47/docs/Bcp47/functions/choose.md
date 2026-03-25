[Home](../../README.md) > [Bcp47](../README.md) > choose

# Function: choose

Matches a list of desired Bcp47.LanguageSpec | languages to a list of available Bcp47.LanguageSpec | languages,
return a list of matching languages ordered from best to worst.

## Signature

```typescript
function choose(desired: LanguageSpec[], available: LanguageSpec[], options: ILanguageTagInitOptions & ILanguageChooserOptions): Result<LanguageTag[]>
```
