[Home](../README.md) > [LanguageTag](./LanguageTag.md) > getSuppressedScript

## LanguageTag.getSuppressedScript() method

Returns the `Suppress-Script` value defined for the primary language of this tag,
regardless of whether a different script is defined in this subtag.

**Signature:**

```typescript
getSuppressedScript(): ScriptSubtag | undefined;
```

**Returns:**

[ScriptSubtag](../type-aliases/ScriptSubtag.md) | undefined

The suppress-script defined for the primary language, or undefined if
the primary language is invalid or has no defined suppressed script.
