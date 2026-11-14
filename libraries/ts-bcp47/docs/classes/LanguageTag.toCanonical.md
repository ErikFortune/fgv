[Home](../README.md) > [LanguageTag](./LanguageTag.md) > toCanonical

## LanguageTag.toCanonical() method

Gets a confirmed canonical representation of this language tag.

**Signature:**

```typescript
toCanonical(): Result<LanguageTag>;
```

**Returns:**

Result&lt;[LanguageTag](LanguageTag.md)&gt;

`Success` with a canonical representation of this Bcp47.LanguageTag | language tag,
or `Failure` with details if the tag cannot be normalized to canonical form.
